import { createClient } from "@supabase/supabase-js";

/**
 * Supabase 설정 정보
 * 환경 변수에서 URL과 Anon Key를 가져오며, 없을 경우 하드코딩된 기본값을 사용합니다.
 */
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://xyqpggpilgcdsawuvpzn.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_4rByGLkIJH0y9Qz7CKm1MA_ulfWQZtj";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

/**
 * Supabase 클라이언트 인스턴스
 * 
 * 애플리케이션 전체에서 공유되는 Supabase 클라이언트입니다.
 * 인증, 데이터베이스, 스토리지 등 모든 Supabase 기능의 진입점입니다.
 * 
 * 보안 및 안정성을 위한 설정:
 * - autoRefreshToken: Access Token 만료 전 자동 갱신
 * - persistSession: localStorage에 세션 저장 (다중 탭 동기화 필수)
 * - detectSessionInUrl: OAuth 콜백에서 URL의 세션 자동 감지
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true, // 자동 토큰 갱신 활성화
    persistSession: true, // localStorage에 세션 영속화 (다중 탭 동기화 필수)
    detectSessionInUrl: true, // OAuth 콜백에서 URL의 세션 자동 감지
    storage: window.localStorage, // 명시적 스토리지 지정
  },
  global: {
    headers: {
      "X-Client-Info": "usemap",
    },
  },
});

/**
 * trucker 스키마의 RPC 함수를 호출하는 헬퍼
 * Supabase에서 trucker 스키마를 expose한 경우 사용
 * 
 * PostgREST는 Content-Profile 헤더를 통해 어떤 스키마의 함수를 호출할지 지정합니다.
 * https://postgrest.org/en/stable/references/api/schemas.html
 */
export async function rpcTrucker<T = any>(
  functionName: string,
  params?: Record<string, any>
): Promise<{ data: T | null; error: any }> {
  try {
    const session = (await supabase.auth.getSession()).data.session;
    const token = session?.access_token || supabaseAnonKey;

    const response = await fetch(
      `${supabaseUrl}/rest/v1/rpc/${functionName}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Profile': 'trucker', // 스키마 지정 헤더
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(params || {}),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      return { data: null, error: errorData };
    }

    const data = await response.json();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
