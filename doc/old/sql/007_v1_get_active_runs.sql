-- =====================================================
-- 007_v1_get_active_runs.sql
-- 유저의 진행 중인 운행 조회 API
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/007_v1_get_active_runs.sql
-- =====================================================

-- 유저의 진행 중인 운행 목록 조회 (주문 정보 포함)
CREATE OR REPLACE FUNCTION trucker.v1_get_active_runs(p_user_id uuid)
RETURNS TABLE (
    run_id uuid,
    order_id uuid,
    slot_id uuid,
    status text,
    start_at timestamp with time zone,
    eta_seconds integer,
    deadline_at timestamp with time zone,
    selected_equipment_id text,
    selected_document_id text,
    selected_insurance_id text,
    current_reward bigint,
    accumulated_penalty bigint,
    accumulated_bonus bigint,
    current_risk float,
    current_durability integer,
    current_fuel float,
    -- 주문 정보
    order_title text,
    order_category text,
    order_cargo_name text,
    order_distance float,
    order_base_reward bigint,
    -- 슬롯 정보
    slot_index integer
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
        r.slot_id,
        r.status,
        r.start_at,
        r.eta_seconds,
        r.deadline_at,
        r.selected_equipment_id,
        r.selected_document_id,
        r.selected_insurance_id,
        r.current_reward,
        r.accumulated_penalty,
        r.accumulated_bonus,
        r.current_risk,
        r.current_durability,
        r.current_fuel,
        -- 주문 정보
        o.title as order_title,
        o.category as order_category,
        o.cargo_name as order_cargo_name,
        o.distance as order_distance,
        o.base_reward as order_base_reward,
        -- 슬롯 정보
        s.index as slot_index
    FROM trucker.tbl_runs r
    JOIN trucker.tbl_orders o ON r.order_id = o.id
    JOIN trucker.tbl_slots s ON r.slot_id = s.id
    WHERE r.user_id = p_user_id
      AND r.status = 'IN_TRANSIT'
    ORDER BY r.start_at DESC;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_active_runs IS '유저의 진행 중인 운행 목록을 주문/슬롯 정보와 함께 조회합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_get_active_runs TO authenticated;
