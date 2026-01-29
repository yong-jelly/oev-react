/**
 * =====================================================
 * ID: FN-V1-IMPORT-FOLDER-PLACES
 * 기능: 네이버 공유 폴더의 장소 목록을 큐로 등록 후 순차 크롤링 (세션 단위)
 * 작성일: 2026-01-16
 * 설명: 사용자가 입력한 네이버 공유 폴더 정보를 바탕으로, 우리 시스템에 등록되지 않은
 *       신규 장소들만 선별하여 크롤링 큐(tbl_place_queue)에 등록하고, 이번 요청(세션)에서
 *       등록된 항목들에 대해서만 즉시 순차적으로 상세 정보를 크롤링하여 저장합니다.
 *
 * 주요 로직 요약:
 *   1. 권한 체크: 호출한 사용자가 유효한지, 대상 폴더의 소유자인지 확인합니다.
 *   2. 외부 데이터 조회: 네이버 공유 폴더 API를 호출하여 장소 목록(sid 등)을 가져옵니다.
 *   3. 중복 필터링: 이미 tbl_place에 저장된 장소는 제외하고 신규 장소만 추출합니다.
 *   4. 큐 등록: 신규 장소들을 tbl_place_queue에 'PENDING' 상태로 등록합니다.
 *   5. 세션 크롤링: 이번 세션에 큐에 넣은 ID들을 메모리에 유지하며, 하나씩 순차적으로
 *      네이버 상세 API를 호출하여 tbl_place에 UPSERT 합니다.
 *   6. 상태 업데이트: 작업 성공/실패 여부를 큐 테이블에 실시간 업데이트합니다.
 *
 * 유지보수 참고:
 *   - 네이버 API는 IP 기반 차단(429)이 엄격하므로, 장소 간 sleep 시간을 적절히 유지해야 합니다.
 *   - 브라우저 모사 헤더(User-Agent, Referer)를 필수로 포함해야 차단을 방지할 수 있습니다.
 * =====================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

/**
 * 요청 페이로드 타입 정의
 */
type ImportRequest = {
  folderId: string; // 우리 서비스 내 대상 폴더 UUID
  input: string;    // 네이버 공유 폴더 shareId 또는 전체 URL
};

/**
 * 네이버 북마크 데이터 타입
 */
type Bookmark = {
  sid: string;
  type?: string;
  name?: string;
  title?: string;
  category?: string;
  businessCategory?: string;
  address?: string;
  roadAddress?: string;
  [key: string]: unknown;
};

/**
 * 큐 테이블 행 데이터 타입
 */
type QueueRow = {
  id: string;
  name: string | null;
  category: string | null;
  business_category: string | null;
  common_address: string | null;
  address: string | null;
  status: string | null;
  retry_count: number | null;
  retry_limit: number | null;
};

// 상수 정의
const SHARE_ID_LENGTH = 32;          // 네이버 shareId 표준 길이
const NAVER_FOLDER_API_LIMIT = 5000; // 한 번에 가져올 수 있는 최대 장소 수
const PLACE_QUERY_TIMEOUT_MS = 6000; // 개별 장소 크롤링 타임아웃

/**
 * 메인 핸들러: Edge Function 진입점
 */
serve(async (req) => {
  // 1. CORS 프리플라이트 요청 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // 2. HTTP 메서드 검증 (POST만 허용)
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, message: "Method not allowed" }, 405);
  }

  // 3. 페이로드 파싱 및 유효성 검사
  let payload: ImportRequest | null = null;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ ok: false, message: "Invalid JSON body" }, 400);
  }

  const folderId = payload?.folderId?.trim();
  const input = payload?.input?.trim();

  if (!folderId || !input) {
    return jsonResponse({ ok: false, message: "folderId와 input이 필요합니다." }, 400);
  }

  // 4. 입력값에서 네이버 shareId 추출
  const shareId = await resolveShareId(input);
  if (!shareId) {
    return jsonResponse({ ok: false, message: "shareId 형식을 확인해주세요." }, 400);
  }

  // 5. 서버 IP 조회 (디버깅/차단 확인용)
  const serverIp = await fetchServerIp();

  // 6. Supabase 클라이언트 생성 (요청자의 Auth Context 유지)
  const authHeader = req.headers.get("Authorization") ?? "";
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    {
      global: {
        headers: { Authorization: authHeader }
      }
    }
  );

  // 단계 추적용 변수
  let currentStep = "INITIALIZING";
  let currentPlaceId: string | null = null;

  try {
    // [STEP 1] 사용자 인증 확인
    currentStep = "AUTH_USER";
    const { data: authData, error: authError } = await supabase.auth.getUser();
    if (authError || !authData?.user) {
      return jsonResponseWithIp({
        ok: false,
        step: currentStep,
        message: "로그인이 필요합니다."
      }, serverIp, 401);
    }

    const userId = authData.user.id;

    // [STEP 2] 폴더 소유권 및 사용자 프로필 검증
    currentStep = "VALIDATE_OWNERSHIP";
    const [profileResult, folderResult] = await Promise.all([
      supabase
        .from("tbl_user_profile")
        .select("auth_user_id")
        .eq("auth_user_id", userId)
        .maybeSingle(),
      supabase
        .from("tbl_folder")
        .select("id, title, owner_id")
        .eq("id", folderId)
        .eq("owner_id", userId)
        .maybeSingle()
    ]);

    if (profileResult.error) {
      return jsonResponseWithIp({ ok: false, step: currentStep, message: profileResult.error.message }, serverIp, 500);
    }
    if (!profileResult.data) {
      return jsonResponseWithIp({ ok: false, step: currentStep, message: "사용자 ID가 존재하지 않습니다." }, serverIp, 404);
    }
    if (folderResult.error) {
      return jsonResponseWithIp({ ok: false, step: currentStep, message: folderResult.error.message }, serverIp, 500);
    }
    if (!folderResult.data) {
      return jsonResponseWithIp({ ok: false, step: currentStep, message: "폴더가 존재하지 않거나 소유자가 아닙니다." }, serverIp, 403);
    }

    // [STEP 3] 네이버 공유 폴더 API 호출 (장소 목록 획득)
    currentStep = "FETCH_NAVER_FOLDER";
    const folderUrl = buildFolderUrl(shareId);
    const folderData = await fetchFolderData(shareId);
    if (!folderData?.folder) {
      return jsonResponseWithIp({
        ok: false,
        step: currentStep,
        message: "네이버 폴더 정보를 가져올 수 없습니다.",
        folder_url: folderUrl,
        raw_data: folderData
      }, serverIp, 400);
    }

    // 북마크 중 'place' 타입만 추출
    const bookmarks: Bookmark[] = (folderData.bookmarkList || [])
      .filter((b: Bookmark) => b?.type === "place");

    // 장소가 하나도 없는 경우 처리
    if (bookmarks.length === 0) {
      return jsonResponseWithIp({
        ok: true,
        step: "FOLDER_PARSED",
        share_id: shareId,
        folder_name: folderData.folder?.name ?? null,
        total_count: 0,
        folder_url: folderUrl
      }, serverIp);
    }

    // [STEP 4] 이미 시스템에 등록된 장소인지 확인 (중복 크롤링 방지)
    currentStep = "CHECK_EXISTING_PLACES";
    const sids = bookmarks.map((b) => b.sid).filter(Boolean);
    const existingIds = await fetchExistingPlaceIds(supabase, sids);
    const existingSet = new Set(existingIds);
    // 아직 tbl_place에 없는 ID만 선별
    const toQueueIds = sids.filter((sid) => !existingSet.has(sid));

    // 모든 장소가 이미 등록되어 있다면 종료
    if (toQueueIds.length === 0) {
      return jsonResponseWithIp({
        ok: true,
        step: "QUEUE_SKIPPED",
        share_id: shareId,
        folder_name: folderData.folder?.name ?? null,
        total_count: bookmarks.length,
        existing_count: existingIds.length,
        queued_count: 0
      }, serverIp);
    }

    // [STEP 5] 신규 장소들을 크롤링 큐(tbl_place_queue)에 등록
    currentStep = "QUEUE_INSERT";
    const queueRows = toQueueIds.map((sid) => mapQueueRowFromBookmark(bookmarks, sid));
    const { error: queueInsertError } = await supabase
      .from("tbl_place_queue")
      .upsert(queueRows, { onConflict: "id", ignoreDuplicates: true });

    if (queueInsertError) {
      return jsonResponseWithIp({
        ok: false,
        step: currentStep,
        message: queueInsertError.message,
        queued_count: toQueueIds.length
      }, serverIp, 500);
    }

    // [STEP 6] 이번 세션에 등록된 큐 항목들을 다시 조회 (상태 추적용)
    currentStep = "QUEUE_FETCH_SESSION";
    const sessionQueueRows = await fetchQueueRowsByIds(supabase, toQueueIds);
    const queueRowMap = new Map(sessionQueueRows.map((row) => [row.id, row]));

    // [STEP 7] 이번 세션 항목들에 대해 한 개씩 순차적으로 크롤링 수행
    currentStep = "CRAWL_SESSION_ITEMS";
    let crawledCount = 0;
    let failedCount = 0;

    for (const sid of toQueueIds) {
      currentPlaceId = sid;
      
      /**
       * [중복 처리 방지]
       * 유저가 새로고침을 하거나 재요청을 보낸 경우, 이미 다른 프로세스에서 
       * 해당 장소를 크롤링 중이거나 완료했을 수 있습니다. 
       * DB에서 최신 상태를 확인하여 중복 API 호출을 방지합니다.
       */
      const { data: checkRow } = await supabase
        .from("tbl_place_queue")
        .select("status, retry_count")
        .eq("id", sid)
        .maybeSingle();

      if (checkRow?.status === "SUCCESS" || checkRow?.status === "PROCESSING") {
        console.log(`[SKIP] Already handled or in-progress: ${sid}`);
        if (checkRow?.status === "SUCCESS") crawledCount += 1;
        continue;
      }

      const queueRow = checkRow || queueRowMap.get(sid);

      // 현재 프로세스가 해당 항목에 대한 처리 권한을 가졌음을 표시
      await supabase
        .from("tbl_place_queue")
        .update({ status: "PROCESSING" })
        .eq("id", sid);

      // 네이버 상세 정보 크롤링 수행
      const crawlResult = await crawlPlace(sid);
      
      if (crawlResult.error) {
        // [변경] 실패하더라도 프로세스를 중단하지 않고 다음 장소로 넘어갑니다.
        failedCount += 1;
        console.error(`[CRAWL_FAILED] ID: ${sid}, Reason: ${crawlResult.error}`);

        await supabase
          .from("tbl_place_queue")
          .update({
            status: "FAILED",
            retry_count: (queueRow?.retry_count ?? 0) + 1,
            error_message: crawlResult.error,
            // 상세 디버깅 정보 기록 (운영 관점)
            error_step: "CRAWL_PLACE",
            error_context: "supabase",
            error_fn: "fn_v1_import_place_to_folder",
            error_share_id: shareId,
            error_full_url: `https://pcmap-api.place.naver.com/place/graphql?id=${sid}`
          })
          .eq("id", sid);

        continue; // 다음 장소로 진행
      }

      // [STEP 8] 크롤링된 데이터를 tbl_place에 저장
      const { error: upsertError } = await supabase
        .from("tbl_place")
        .upsert(crawlResult.data, { onConflict: "id" });

      if (upsertError) {
        failedCount += 1;
        console.error(`[UPSERT_FAILED] ID: ${sid}, Reason: ${upsertError.message}`);

        await supabase
          .from("tbl_place_queue")
          .update({
            status: "FAILED",
            retry_count: (queueRow?.retry_count ?? 0) + 1,
            error_message: upsertError.message,
            error_step: "UPSERT_PLACE",
            error_context: "supabase",
            error_fn: "fn_v1_import_place_to_folder",
            error_share_id: shareId
          })
          .eq("id", sid);

        continue; // 다음 장소로 진행
      }

      // [STEP 9] 성공 시 큐 상태 업데이트
      await supabase
        .from("tbl_place_queue")
        .update({ 
          status: "SUCCESS", 
          error_message: null,
          error_step: null // 성공 시 에러 필드 초기화
        })
        .eq("id", sid);

      crawledCount += 1;
      
      // 네이버의 과도한 탐지를 피하기 위해 장소 간 짧은 대기 시간 추가
      await sleep(200);
    }

    // 최종 결과 반환 (일부 실패하더라도 완료로 간주하여 요약 정보 제공)
    return jsonResponseWithIp({
      ok: failedCount === 0,
      step: "CRAWL_COMPLETED",
      share_id: shareId,
      folder_name: folderData.folder?.name ?? null,
      total_count: bookmarks.length,
      existing_count: existingIds.length,
      queued_count: toQueueIds.length,
      crawled_count: crawledCount,
      failed_count: failedCount
    }, serverIp);

  } catch (error) {
    // 예기치 못한 에러 핸들링
    const errorMessage = error?.message ?? "Unknown error";
    return jsonResponseWithIp({
      ok: false,
      step: currentStep,
      place_id: currentPlaceId,
      message: errorMessage
    }, serverIp, 500);
  }
});

/**
 * 입력 문자열에서 네이버 shareId를 추출합니다.
 */
function extractShareId(input: string) {
  const trimmed = input.trim();
  // 32자리 문자열 자체가 들어온 경우
  if (trimmed.length === SHARE_ID_LENGTH && isAlphaNumeric(trimmed)) {
    return trimmed;
  }
  // URL에서 32자리 해시값 추출
  const match = trimmed.match(new RegExp(`[A-Za-z0-9]{${SHARE_ID_LENGTH}}`));
  return match?.[0] && isAlphaNumeric(match[0]) ? match[0] : null;
}

/**
 * 단축 URL(naver.me)인 경우 리다이렉션된 최종 URL에서 shareId를 추출합니다.
 */
async function resolveShareId(input: string): Promise<string | null> {
  if (!input) return null;
  const trimmed = input.trim();
  
  if (trimmed.includes("naver.me")) {
    try {
      const response = await fetch(trimmed, { redirect: "follow" });
      return extractShareId(response.url);
    } catch (error) {
      console.error("URL 해소 중 오류:", error);
      return extractShareId(trimmed);
    }
  }
  
  return extractShareId(trimmed);
}

/**
 * 영문 대소문자와 숫자로만 구성되었는지 확인합니다.
 */
function isAlphaNumeric(value: string) {
  return /^[A-Za-z0-9]+$/.test(value);
}

/**
 * 표준 JSON 응답을 생성합니다.
 */
function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

/**
 * 서버 IP 정보를 포함한 JSON 응답을 생성합니다.
 */
function jsonResponseWithIp(
  body: Record<string, unknown>,
  serverIp: string | null,
  status = 200
) {
  return jsonResponse({
    ...body,
    server_ip: serverIp
  }, status);
}

/**
 * 네이버 공유 폴더 데이터 조회 URL을 생성합니다.
 */
function buildFolderUrl(shareId: string) {
  return `https://pages.map.naver.com/save-pages/api/maps-bookmark/v3/shares/${shareId}/bookmarks?start=0&limit=${NAVER_FOLDER_API_LIMIT}&sort=lastUseTime&createIdNo=false`;
}

/**
 * 현재 서버의 외부 공인 IP를 조회합니다.
 */
async function fetchServerIp() {
  try {
    const response = await fetchJsonWithTimeout("https://api.ipify.org?format=json", 2000);
    return typeof response?.ip === "string" ? response.ip : null;
  } catch {
    return null;
  }
}

/**
 * 네이버 폴더 데이터를 조회하며, 차단 방지를 위해 재시도 로직을 포함합니다.
 */
async function fetchFolderData(shareId: string) {
  const url = buildFolderUrl(shareId);
  try {
    // 1차 시도: 일반 호출
    return await fetchJsonWithTimeout(url, 5000);
  } catch {
    // 2차 시도: 브라우저 모사 헤더 추가
    return await fetchJsonWithTimeout(url, 7000, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Origin": "https://map.naver.com",
        "Referer": "https://map.naver.com/"
      }
    });
  }
}

/**
 * 시스템에 이미 저장된 장소 ID 목록을 일괄 조회합니다.
 */
async function fetchExistingPlaceIds(supabase: ReturnType<typeof createClient>, placeIds: string[]) {
  if (placeIds.length === 0) return [];
  const chunks = chunkArray(placeIds, 1000);
  const results: string[] = [];

  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from("tbl_place")
      .select("id")
      .in("id", chunk);

    if (error) {
      throw new Error(error.message);
    }

    results.push(...(data || []).map((row: { id: string }) => String(row.id)));
  }

  return results;
}

/**
 * 큐 테이블에서 특정 ID들의 현재 상태 정보를 일괄 조회합니다.
 */
async function fetchQueueRowsByIds(supabase: ReturnType<typeof createClient>, placeIds: string[]) {
  if (placeIds.length === 0) return [];
  const chunks = chunkArray(placeIds, 1000);
  const results: QueueRow[] = [];

  for (const chunk of chunks) {
    const { data, error } = await supabase
      .from("tbl_place_queue")
      .select("id, name, category, business_category, common_address, address, status, retry_count, retry_limit")
      .in("id", chunk);

    if (error) {
      throw new Error(error.message);
    }

    results.push(...(data || []) as QueueRow[]);
  }

  return results;
}

/**
 * 네이버 북마크 데이터를 큐 테이블 형식으로 변환합니다.
 */
function mapQueueRowFromBookmark(bookmarks: Bookmark[], sid: string) {
  const match = bookmarks.find((b) => b.sid === sid);
  const name = match?.name ?? match?.title ?? null;
  const category = match?.category ?? null;
  const businessCategory = match?.businessCategory ?? null;
  const address = match?.address ?? match?.roadAddress ?? null;
  const commonAddress = address ? address.split(" ").slice(0, 2).join(" ") : null;

  return {
    id: sid,
    name,
    category,
    business_category: businessCategory,
    common_address: commonAddress,
    address,
    status: "PENDING"
  };
}

/**
 * 네이버 플레이스 상세 정보를 GraphQL API를 통해 크롤링합니다.
 */
async function crawlPlace(businessId: string) {
  // 상세 데이터 획득을 위한 GraphQL 쿼리
  const query = `
    query getPlaceDetail($input: PlaceDetailInput) {
      placeDetail(input: $input) {
        shopWindow {
          homepages {
            etc { url }
            repr { url }
          }
        }
        informationTab { keywordList }
        paiUpperImage { images }
        themes
        staticMapUrl
        visitorReviewMediasTotal
        visitorReviewStats {
          id
          review { avgRating totalCount }
          analysis {
            themes { code label count }
            menus { code label count }
            votedKeyword {
              totalCount reviewCount userCount
              details { code iconUrl iconCode displayName count }
            }
          }
        }
        base {
          id
          name
          road
          category
          categoryCode
          categoryCodeList
          roadAddress
          paymentInfo
          conveniences
          address
          phone
          visitorReviewsTotal
          visitorReviewsScore
          menus {
            name price recommend description images id index
          }
          streetPanorama { id pan tilt lon lat fov }
          coordinate { x y mapZoomLevel }
        }
        images { images { origin } totalImages }
      }
    }
  `;

  try {
    const response = await fetchJsonWithTimeout(
      "https://pcmap-api.place.naver.com/place/graphql",
      PLACE_QUERY_TIMEOUT_MS,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // 차단 방지를 위한 브라우저 모사 헤더
          "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          "Accept": "application/json, text/plain, */*",
          "Origin": "https://map.naver.com",
          "Referer": `https://map.naver.com/p/entry/place/${businessId}`
        },
        body: JSON.stringify([{
          operationName: "getPlaceDetail",
          variables: {
            input: { id: businessId, deviceType: "pcmap", isNx: false }
          },
          query
        }])
      }
    );

    const data = response?.[0]?.data?.placeDetail;
    if (!data) throw new Error("No data returned from API");

    const base = data.base;
    const coordinate = base.coordinate;
    const groups = base.address?.split(" ") || [];

    // 우리 시스템의 tbl_place 테이블 구조에 맞게 파싱
    const parsedData = {
      id: base.id,
      name: base.name,
      road: base.road || null,
      category: base.category || null,
      category_code: base.categoryCode || null,
      category_code_list: base.categoryCodeList || [],
      road_address: base.roadAddress || null,
      payment_info: base.paymentInfo || [],
      conveniences: base.conveniences || [],
      address: base.address || null,
      phone: base.phone || null,
      visitor_reviews_total: base.visitorReviewsTotal || 0,
      visitor_reviews_score: base.visitorReviewsScore || 0,
      x: coordinate.x || null,
      y: coordinate.y || null,
      homepage: (() => {
        const homepages = data.shopWindow?.homepages || {};
        const urls = (homepages.etc || [])
          .map((i: { url?: string }) => i.url)
          .filter(Boolean);
        if (homepages.repr?.url) urls.push(homepages.repr.url);
        return urls;
      })(),
      keyword_list: data.informationTab?.keywordList || [],
      images: data.paiUpperImage?.images || [],
      static_map_url: data.staticMapUrl || null,
      themes: data.themes || [],
      visitor_review_medias_total: data.visitorReviewMediasTotal || 0,
      visitor_review_stats: data.visitorReviewStats || null,
      menus: base.menus || [],
      street_panorama: base.streetPanorama || null,
      place_images: (data.images?.images || [])
        .map((img: { origin?: string } | string) => typeof img === "string" ? img : img.origin)
        .filter(Boolean),
      group1: groups[0] || null,
      group2: groups[1] || null,
      group3: groups[2] || null,
      updated_at: new Date().toISOString()
    };

    return { data: parsedData };
  } catch (error) {
    return { error: error.message };
  }
}

/**
 * 타임아웃 기능이 포함된 fetch 유틸리티
 */
async function fetchJsonWithTimeout(
  url: string,
  timeoutMs: number,
  options: RequestInit = {}
) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const response = await fetch(url, { ...options, signal: controller.signal });
  clearTimeout(timeout);
  if (!response.ok) {
    throw new Error(`API Request Failed: ${response.status}`);
  }
  return response.json();
}

/**
 * 배열을 지정된 크기로 나눕니다.
 */
function chunkArray<T>(items: T[], size: number) {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

/**
 * 지정된 시간(ms)만큼 대기합니다.
 */
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
