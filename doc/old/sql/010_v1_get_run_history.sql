-- =====================================================
-- 010_v1_get_run_history.sql
-- 사용자의 전체 운행 히스토리 조회 API
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/010_v1_get_run_by_id.sql
-- =====================================================

-- 사용자의 운행 히스토리 조회 (완료된 항목 위주)
CREATE OR REPLACE FUNCTION trucker.v1_get_run_history(
    p_user_id uuid,
    p_equipment_id text DEFAULT NULL,
    p_limit integer DEFAULT 20
)
RETURNS TABLE (
    run_id uuid,
    order_id uuid,
    status text,
    start_at timestamp with time zone,
    completed_at timestamp with time zone,
    selected_equipment_id text,
    current_reward bigint,
    accumulated_penalty bigint,
    order_title text,
    order_cargo_name text,
    order_distance float,
    order_category text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as run_id,
        r.order_id,
        r.status,
        r.start_at,
        r.completed_at,
        r.selected_equipment_id,
        r.current_reward,
        r.accumulated_penalty,
        o.title as order_title,
        o.cargo_name as order_cargo_name,
        o.distance as order_distance,
        o.category as order_category
    FROM trucker.tbl_runs r
    JOIN trucker.tbl_orders o ON r.order_id = o.id
    WHERE r.user_id = p_user_id
      AND (p_equipment_id IS NULL OR r.selected_equipment_id = p_equipment_id)
      AND r.status IN ('COMPLETED', 'FAILED')
    ORDER BY r.completed_at DESC
    LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_run_history IS '사용자의 완료된 운행 히스토리를 조회합니다. 특정 장비로 필터링 가능합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_get_run_history TO authenticated;
