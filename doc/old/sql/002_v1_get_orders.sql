-- =====================================================
-- 002_v1_get_orders.sql
-- 주문(Order) 관련 조회 API
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/002_v1_get_orders.sql
-- =====================================================

-- 1. 모든 주문 목록 조회 (실제 함수: trucker 스키마)
CREATE OR REPLACE FUNCTION trucker.v1_get_orders()
RETURNS SETOF trucker.tbl_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM trucker.tbl_orders
    ORDER BY created_at DESC;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_orders IS '모든 사용 가능한 주문 목록을 최신순으로 조회합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_get_orders TO authenticated;

-- 2. 특정 주문 상세 조회
CREATE OR REPLACE FUNCTION trucker.v1_get_order_by_id(p_order_id uuid)
RETURNS trucker.tbl_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_order trucker.tbl_orders;
BEGIN
    SELECT * INTO v_order FROM trucker.tbl_orders WHERE id = p_order_id;
    RETURN v_order;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_order_by_id IS '특정 주문의 상세 정보를 조회합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_get_order_by_id TO authenticated;
