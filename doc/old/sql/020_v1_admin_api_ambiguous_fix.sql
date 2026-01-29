-- =====================================================
-- 020_v1_admin_api_ambiguous_fix.sql
-- v1_get_admin_configs 함수의 "key" 컬럼 모호성 해결
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/020_v1_admin_api_ambiguous_fix.sql
-- =====================================================

-- 1. 기존 함수 삭제 (반환 타입 변경을 위해 필수)
DROP FUNCTION IF EXISTS public.v1_get_admin_configs();

-- 2. 전체 설정 조회 함수 수정 (컬럼명 모호성 해결)
CREATE OR REPLACE FUNCTION public.v1_get_admin_configs()
RETURNS TABLE (
    config_key text,
    config_value jsonb,
    config_description text,
    config_updated_at timestamptz
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

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.v1_get_admin_configs() TO anon, authenticated, service_role;

-- PostgREST 스키마 캐시 새로고침
NOTIFY pgrst, 'reload schema';
