import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { NaverRestaurantItem } from "./types.ts";

export async function handleQueueAndHistory(
  supabase: any,
  query: string,
  userId: string | null,
  items: NaverRestaurantItem[]
) {
  let queuedCount = 0;
  let crawlResult: any = null;

  try {
    // 1. 검색 히스토리 저장
    await supabase.from("tbl_search_history").insert({
      keyword: query,
      result: items.length,
      user_id: userId
    });

    // 서비스 롤 클라이언트 생성 (DB 접근 권한 보장)
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // 2. 신규 장소 큐(tbl_place_queue)에 추가
    if (items.length > 0) {
      const itemIds = items.map((item) => item.id);
      
      // tbl_place에 이미 존재하는지 확인
      const { data: existingPlaces } = await supabaseAdmin
        .from("tbl_place")
        .select("id")
        .in("id", itemIds);
      
      const existingPlaceIds = new Set(existingPlaces?.map(p => p.id) || []);
      
      // 존재하지 않는 장소만 필터링
      const newItems = items.filter((item) => !existingPlaceIds.has(item.id));
      queuedCount = newItems.length;
      
      if (newItems.length > 0) {
        const queueData = newItems.map((item) => ({
          id: item.id,
          name: item.name,
          category: item.category,
          business_category: item.businessCategory,
          common_address: item.commonAddress,
          address: item.address,
          status: 'PENDING',
          retry_count: 0,
          retry_limit: 5
        }));

        // 큐 테이블에 삽입 (이미 큐에 있으면 무시)
        const { error: queueError } = await supabaseAdmin
          .from("tbl_place_queue")
          .upsert(queueData, { onConflict: 'id' });
        
        if (queueError) {
          console.error("큐 저장 실패:", queueError);
          queuedCount = 0;
        }
      }
    }

    // 3. 크롤러 트리거 (현재 실행 중인 크롤러가 없을 때만) - 현재 주석 처리
    /*
    const { count: processingCount } = await supabaseAdmin
      .from("tbl_place_queue")
      .select("*", { count: 'exact', head: true })
      .eq("status", "PROCESSING");

    if (processingCount === 0) {
      const functionUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/fn_v1_crw_for_place_queue`;
      const crawlResponse = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          'Content-Type': 'application/json',
        },
      });
      crawlResult = await crawlResponse.json();
    } else {
      crawlResult = { status: "PROCESSING_IN_PROGRESS" };
    }
    */
    crawlResult = { message: "Crawler trigger is disabled" };
  } catch (dbError) {
    console.error("DB 처리 중 오류 발생:", dbError);
    throw dbError;
  }

  return { queuedCount, crawlResult };
}

export async function saveSearchHistoryOnly(
  supabase: any,
  query: string,
  userId: string | null,
  resultCount: number
) {
  try {
    await supabase.from("tbl_search_history").insert({
      keyword: query,
      result: resultCount,
      user_id: userId
    });
  } catch (dbError) {
    console.error("검색 히스토리 저장 실패:", dbError);
  }
}
