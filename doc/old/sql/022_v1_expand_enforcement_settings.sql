-- =====================================================
-- 022_v1_expand_enforcement_settings.sql
-- 관리자 단속 설정 확장 및 운행(Run) 테이블 컬럼 추가
-- =====================================================

-- 1. tbl_runs 테이블 확장 (결정론적 단속 설정 저장)
ALTER TABLE trucker.tbl_runs 
ADD COLUMN IF NOT EXISTS max_enforcement_count integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS enforcement_probability float DEFAULT 0.25,
ADD COLUMN IF NOT EXISTS fine_rate float DEFAULT 0.1;

COMMENT ON COLUMN trucker.tbl_runs.max_enforcement_count IS '이 운행에서 발생 가능한 최대 단속 횟수 (관리자 설정에 의해 생성 시 고정)';
COMMENT ON COLUMN trucker.tbl_runs.enforcement_probability IS '단속 체크 시 실제 단속이 발생할 확률 (관리자 설정에 의해 생성 시 고정)';
COMMENT ON COLUMN trucker.tbl_runs.fine_rate IS '단속 시 벌금 비율 (운행 전체 금액 대비)';

-- 2. 관리자 설정 초기값 업데이트 및 추가
-- 기존 enforcement_base_fine 대신 fine_rate 사용 권장 (기존 값 유지하되 신규 값 추가)
INSERT INTO trucker.tbl_admin_config (key, value, description) VALUES
    ('enforcement_max_count', '1'::jsonb, '운행당 최대 단속 발생 가능 횟수 (기본값 1)'),
    ('enforcement_check_probability', '0.25'::jsonb, '단속 체크 시 실제 발생 확률 (0~1, 기본값 0.25)'),
    ('enforcement_fine_rate', '0.1'::jsonb, '단속 시 벌금 비율 (0~1, 운행 전체 금액의 비율, 기본값 0.1)')
ON CONFLICT (key) DO UPDATE SET 
    value = EXCLUDED.value,
    description = EXCLUDED.description;

-- 3. 운행 생성 함수 수정 (v1_create_run)
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
    v_max_enforcement_limit integer;
    v_actual_max_enforcement integer;
    v_prob float;
    v_fine_rate float;
BEGIN
    -- 1. 주문 정보 조회
    SELECT * INTO v_order FROM trucker.tbl_orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- 2. 관리자 설정 로드
    SELECT (value->>0)::integer INTO v_max_enforcement_limit FROM trucker.tbl_admin_config WHERE key = 'enforcement_max_count';
    SELECT (value->>0)::float INTO v_prob FROM trucker.tbl_admin_config WHERE key = 'enforcement_check_probability';
    SELECT (value->>0)::float INTO v_fine_rate FROM trucker.tbl_admin_config WHERE key = 'enforcement_fine_rate';

    -- 기본값 설정 (설정이 없을 경우)
    v_max_enforcement_limit := COALESCE(v_max_enforcement_limit, 1);
    v_prob := COALESCE(v_prob, 0.25);
    v_fine_rate := COALESCE(v_fine_rate, 0.1);

    -- 3. 결정론적 단속 횟수 설정 (0 ~ 관리자 설정값 사이의 랜덤 정수)
    v_actual_max_enforcement := floor(random() * (v_max_enforcement_limit + 1));

    -- 4. ETA 및 마감 시간 계산
    v_eta_seconds := ROUND(v_order.distance * 60);
    v_deadline_at := now() + (v_order.limit_time_minutes * interval '1 minute');

    -- 5. Run 생성
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
        current_fuel,
        max_enforcement_count,
        enforcement_probability,
        fine_rate
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
        0.05,
        100,
        100,
        v_actual_max_enforcement,
        v_prob,
        v_fine_rate
    )
    RETURNING * INTO v_run;

    -- 6. 슬롯 상태 업데이트
    UPDATE trucker.tbl_slots 
    SET active_run_id = v_run.id 
    WHERE id = p_slot_id;

    -- 7. 이벤트 로그 추가
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
        '[' || v_order.title || '] 운행이 시작되었습니다. (최대 단속 가능: ' || v_actual_max_enforcement || '회)',
        0,
        0,
        false
    );

    RETURN v_run;
END;
$$;
