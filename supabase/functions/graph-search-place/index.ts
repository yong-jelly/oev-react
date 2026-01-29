/**
 * =====================================================
 * ID: FN-GRAPH-SEARCH-PLACE
 * 기능: 통합 장소 검색 및 크롤링 큐 등록
 * 작성일: 2026-01-16
 * 설명: 사용자의 검색 쿼리를 바탕으로 외부 API(네이버)에서 장소를 검색하여 결과를 반환합니다.
 *       검색된 장소 중 DB에 없는 신규 장소는 tbl_place_queue에 등록하여 
 *       추후 상세 정보가 크롤링되도록 합니다.
 * 
 * 관련 테이블:
 *   - tbl_place_queue: 신규 장소 큐 등록
 *   - tbl_search_history: 검색 이력 및 통계 저장
 * 
 * 외부 의존성:
 *   - 네이버 플레이스 검색 API
 * 
 * 요청(Request Body):
 *   - query: string (검색 키워드)
 *   - start?: number (결과 시작 번호, 기본 1)
 *   - display?: number (한 번에 가져올 개수, 기본 100)
 * 
 * 응답(Response):
 *   - 성공: { code: 200, count: number, rows: array, ... }
 *   - 실패: { code: 400 | 500, message: string }
 * =====================================================
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { SearchRequest } from "./types.ts";
import { fetchFromNaver } from "./naver.ts";
import { handleQueueAndHistory, saveSearchHistoryOnly } from "./queue.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }

  try {
    const searchParams: SearchRequest = await req.json();
    const { query, start = 1, display = 100 } = searchParams;

    if (!query) {
      return new Response(JSON.stringify({
        code: 400,
        count: 0,
        rows: null,
        param: { query, start, display }
      }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: authHeader ?? "" }
        }
      }
    );

    let userId = null;
    if (authHeader) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id ?? null;
      } catch (error) {
        console.log("사용자 인증 실패:", error);
      }
    }

    const response = await fetchFromNaver(searchParams);

    if (!response.ok) {
      console.error("Naver API Error:", { status: response.status });
      await saveSearchHistoryOnly(supabase, query, userId, 0);
      
      return new Response(JSON.stringify({
        code: response.status,
        count: 0,
        rows: null,
        param: { query, start, display }
      }), {
        status: response.status,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }

    const data = await response.json();
    
    if (data && data.length > 0 && data[0].data && data[0].data.restaurants) {
      const items = data[0].data.restaurants.items || [];
      
      const { queuedCount, crawlResult } = await handleQueueAndHistory(
        supabase,
        query,
        userId,
        items
      );
      
      return new Response(JSON.stringify({
        code: 200,
        count: items.length,
        queued_count: queuedCount,
        crawl_result: crawlResult,
        rows: items,
        param: { query, start, display }
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    } else {
      await saveSearchHistoryOnly(supabase, query, userId, 0);
      return new Response(JSON.stringify({
        code: 200,
        count: 0,
        rows: [],
        param: { query, start, display }
      }), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json"
        }
      });
    }
  } catch (error) {
    console.error("Server Error:", error);
    return new Response(JSON.stringify({
      code: 500,
      count: 0,
      rows: null,
      param: null
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json"
      }
    });
  }
});
