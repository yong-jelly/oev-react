-- =====================================================
-- 019_v1_admin_api_schema_fix.sql
-- 관리자 API RPC 함수 스키마 수정 및 봇 상태 API 추가
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/019_v1_admin_api_schema_fix.sql
-- =====================================================

-- 1. 기존 함수 삭제 (스키마 변경을 위해)
DROP FUNCTION IF EXISTS trucker.v1_get_admin_configs();
DROP FUNCTION IF EXISTS trucker.v1_update_admin_config(text, jsonb);

-- 2. 전체 설정 조회 함수 (public 스키마에 생성하여 PostgREST 노출)
CREATE OR REPLACE FUNCTION public.v1_get_admin_configs()
RETURNS TABLE (
    key text,
    value jsonb,
    description text,
    updated_at timestamptz
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    -- 기본값 보장
    INSERT INTO trucker.tbl_admin_config (key, value, description) VALUES
        ('bot_rest_min_minutes', '10'::jsonb, '봇 최소 휴식 시간 (분)'),
        ('bot_rest_max_minutes', '60'::jsonb, '봇 최대 휴식 시간 (분)'),
        ('bot_accept_probability', '0.5'::jsonb, '봇 주문 수락 확률 (0~1)'),
        ('enforcement_base_rate', '10'::jsonb, '기본 단속 확률 (%)'),
        ('enforcement_speeding_multiplier', '3.5'::jsonb, '과속 시 단속 확률 배율'),
        ('enforcement_base_fine', '500'::jsonb, '기본 단속 벌금 ($)'),
        ('enforcement_fine_per_km', '50'::jsonb, 'km당 추가 벌금 ($)'),
        ('enforcement_evasion_rate', '40'::jsonb, '단속 돌파 성공 확률 (%)'),
        ('enforcement_bypass_penalty', '15'::jsonb, '단속 우회 시 추가되는 시간 패널티 (분)')
    ON CONFLICT (key) DO NOTHING;

    RETURN QUERY
    SELECT t.key, t.value, t.description, t.updated_at
    FROM trucker.tbl_admin_config t
    ORDER BY t.key;
END;
$$;

-- 3. 설정 업데이트 함수 (public 스키마)
CREATE OR REPLACE FUNCTION public.v1_update_admin_config(
    p_key text,
    p_value jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    INSERT INTO trucker.tbl_admin_config (key, value, updated_at)
    VALUES (p_key, p_value, now())
    ON CONFLICT (key) DO UPDATE SET 
        value = EXCLUDED.value,
        updated_at = now();
END;
$$;

-- 4. 봇 상태 조회 함수 (public 스키마)
CREATE OR REPLACE FUNCTION public.v1_get_bot_statuses()
RETURNS TABLE (
    bot_id uuid,
    status text,
    current_run_id uuid,
    last_completed_at timestamptz,
    next_available_at timestamptz,
    total_deliveries integer,
    nickname text,
    avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        bs.bot_id,
        bs.status,
        bs.current_run_id,
        bs.last_completed_at,
        bs.next_available_at,
        bs.total_deliveries,
        up.nickname,
        up.avatar_url
    FROM trucker.tbl_bot_status bs
    JOIN trucker.tbl_user_profile up ON bs.bot_id = up.public_profile_id
    ORDER BY bs.bot_id;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.v1_get_admin_configs() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.v1_update_admin_config(text, jsonb) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.v1_get_bot_statuses() TO anon, authenticated, service_role;

-- PostgREST 스키마 캐시 새로고침 (필요한 경우)
NOTIFY pgrst, 'reload schema';
