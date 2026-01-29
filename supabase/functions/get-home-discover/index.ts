/**
 * =====================================================
 * ID: FN-GET-HOME-DISCOVER
 * 기능: 홈 화면 Discover 데이터 통합 조회
 * 작성일: 2026-01-27
 * 설명: 홈 화면에서 사용할 Discover 데이터를 통합 조회합니다.
 *       공개 폴더, 인기 음식점, 커뮤니티 지역별 데이터를
 *       병렬로 조회하여 반환합니다.
 * 
 * 관련 테이블:
 *   - tbl_folder: 공개 폴더 목록
 *   - tbl_place: 인기 음식점
 *   - tbl_community_content: 커뮤니티 콘텐츠
 * 
 * 외부 의존성:
 *   - 없음 (내부 RPC 호출)
 * 
 * 요청(Request Body):
 *   - 없음 (POST 요청)
 * 
 * 응답(Response):
 *   - 성공: { users, popularPlaces, communityRegions, publicFolders }
 *   - 실패: { error: "..." }
 * =====================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization") ?? "" },
        },
      }
    );

    // 병렬로 데이터 조회
    const [
      popularPlacesResult,
      communityRegionsResult,
      publicFoldersResult
    ] = await Promise.all([
      supabase.rpc("v2_get_popular_places", { p_limit: 10, p_offset: 0 }),
      supabase.rpc("v2_list_community_by_region", { p_domain: null, p_limit: 6, p_offset: 0 }),
      supabase.rpc("v1_list_public_folders", { p_limit: 12, p_offset: 0 })
    ]);

    // 결과 처리
    const popularPlaces = popularPlacesResult.data || [];
    const communityRegions = communityRegionsResult.data || [];
    const publicFolders = publicFoldersResult.data || [];

    // 공개 폴더에서 유저 정보 추출 (중복 제거)
    const usersMap = new Map();
    publicFolders.forEach((folder: any) => {
      if (folder.owner_id && !usersMap.has(folder.owner_id)) {
        usersMap.set(folder.owner_id, {
          id: folder.owner_id,
          nickname: folder.owner_nickname || '익명',
          avatar_url: folder.owner_avatar_url,
          folder_count: 1,
        });
      } else if (folder.owner_id) {
        const user = usersMap.get(folder.owner_id);
        user.folder_count++;
      }
    });
    const users = Array.from(usersMap.values()).slice(0, 10);

    return new Response(
      JSON.stringify({
        users,
        popularPlaces,
        communityRegions,
        publicFolders,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
