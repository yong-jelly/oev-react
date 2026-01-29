-- =====================================================
-- 001_v1_create_run.sql
-- 운행(Run) 생성 및 관련 테이블 업데이트 API
-- 
-- 인자:
--   @p_user_id: 사용자 ID (UUID)
--   @p_order_id: 주문 ID (UUID)
--   @p_slot_id: 슬롯 ID (UUID)
--   @p_selected_items: 선택된 아이템 정보 (JSONB)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/001_v1_create_run.sql
-- =====================================================

-- 실제 함수: trucker 스키마에 정의
-- NOTE: p_user_id는 public_profile_id를 직접 받습니다 (auth_user_id 아님)
CREATE OR REPLACE FUNCTION trucker.v1_create_run(
    p_user_id uuid,
    p_order_id uuid,
    p_slot_id uuid,
    p_selected_items jsonb
)
RETURNS trucker.tbl_runs
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_order RECORD;
    v_run trucker.tbl_runs;
    v_eta_seconds integer;
    v_deadline_at timestamp with time zone;
BEGIN
    -- p_user_id는 public_profile_id를 직접 받음
    -- 프로필 존재 확인
    IF NOT EXISTS (SELECT 1 FROM trucker.tbl_user_profile WHERE public_profile_id = p_user_id) THEN
        RAISE EXCEPTION 'User profile not found for public_profile_id: %', p_user_id;
    END IF;

    -- 1. 주문 정보 조회
    SELECT * INTO v_order FROM trucker.tbl_orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- 2. ETA 및 마감 시간 계산
    -- 1km당 1분(60초)으로 단순화 계산
    v_eta_seconds := ROUND(v_order.distance * 60);
    v_deadline_at := now() + (v_order.limit_time_minutes * interval '1 minute');

    -- 3. Run 생성 (user_id는 public_profile_id)
    INSERT INTO trucker.tbl_runs (
        user_id,
        order_id,
        slot_id,
        status,
        eta_seconds,
        deadline_at,
        selected_equipment_id,
        selected_document_id,
        selected_insurance_id,
        current_reward,
        current_risk,
        current_durability,
        current_fuel
    ) VALUES (
        p_user_id,
        p_order_id,
        p_slot_id,
        'IN_TRANSIT',
        v_eta_seconds,
        v_deadline_at,
        COALESCE(p_selected_items->>'equipmentId', 'BICYCLE'),
        p_selected_items->>'documentId',
        p_selected_items->>'insuranceId',
        v_order.base_reward,
        0.05, -- 기본 위험도
        100,
        100
    )
    RETURNING * INTO v_run;

    -- 4. 슬롯 상태 업데이트
    UPDATE trucker.tbl_slots 
    SET active_run_id = v_run.id 
    WHERE id = p_slot_id;

    -- 5. 이벤트 로그 추가 (운행 시작)
    INSERT INTO trucker.tbl_event_logs (
        run_id,
        type,
        title,
        description,
        amount,
        eta_change_seconds,
        is_estimated
    ) VALUES (
        v_run.id,
        'SYSTEM',
        '운행 시작',
        '[' || v_order.title || '] 운행이 시작되었습니다. 안전 운전하세요!',
        0,
        0,
        false
    );

    RETURN v_run;
END;
$$;

COMMENT ON FUNCTION trucker.v1_create_run IS '운행(Run)을 생성합니다. p_user_id는 public_profile_id입니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_create_run TO authenticated;
