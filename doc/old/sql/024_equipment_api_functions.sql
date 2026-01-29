-- =====================================================
-- 024_equipment_api_functions.sql
-- 장비 시스템 API RPC 함수
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/024_equipment_api_functions.sql
-- =====================================================

-- =====================================================
-- 1. v1_get_equipments() - 전체 장비 목록 조회
-- =====================================================
CREATE OR REPLACE FUNCTION trucker.v1_get_equipments()
RETURNS TABLE (
    id text,
    name text,
    description text,
    image_filename text,
    equipment_type text,
    price bigint,
    base_speed float,
    max_speed float,
    max_weight float,
    max_volume float,
    allowed_categories text[],
    is_default boolean,
    is_active boolean,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.description,
        e.image_filename,
        e.equipment_type,
        e.price,
        e.base_speed,
        e.max_speed,
        e.max_weight,
        e.max_volume,
        e.allowed_categories,
        e.is_default,
        e.is_active,
        e.created_at,
        e.updated_at
    FROM trucker.tbl_equipments e
    WHERE e.is_active = true
    ORDER BY e.price ASC, e.created_at ASC;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_equipments IS '활성화된 전체 장비 목록 조회';
GRANT EXECUTE ON FUNCTION trucker.v1_get_equipments TO anon, authenticated;

-- =====================================================
-- 2. v1_get_all_equipments_admin() - 관리자용 전체 장비 목록 (비활성 포함)
-- =====================================================
CREATE OR REPLACE FUNCTION trucker.v1_get_all_equipments_admin()
RETURNS TABLE (
    id text,
    name text,
    description text,
    image_filename text,
    equipment_type text,
    price bigint,
    base_speed float,
    max_speed float,
    max_weight float,
    max_volume float,
    allowed_categories text[],
    is_default boolean,
    is_active boolean,
    created_at timestamptz,
    updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.name,
        e.description,
        e.image_filename,
        e.equipment_type,
        e.price,
        e.base_speed,
        e.max_speed,
        e.max_weight,
        e.max_volume,
        e.allowed_categories,
        e.is_default,
        e.is_active,
        e.created_at,
        e.updated_at
    FROM trucker.tbl_equipments e
    ORDER BY e.is_active DESC, e.price ASC, e.created_at ASC;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_all_equipments_admin IS '관리자용 전체 장비 목록 조회 (비활성 포함)';
GRANT EXECUTE ON FUNCTION trucker.v1_get_all_equipments_admin TO authenticated;

-- =====================================================
-- 3. v1_get_user_equipments(p_user_id) - 유저 보유 장비 조회
-- =====================================================
CREATE OR REPLACE FUNCTION trucker.v1_get_user_equipments(p_user_id uuid)
RETURNS TABLE (
    user_equipment_id uuid,
    equipment_id text,
    purchased_at timestamptz,
    is_equipped boolean,
    -- 장비 상세 정보 조인
    name text,
    description text,
    image_filename text,
    equipment_type text,
    price bigint,
    base_speed float,
    max_speed float,
    max_weight float,
    max_volume float,
    allowed_categories text[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ue.id as user_equipment_id,
        ue.equipment_id,
        ue.purchased_at,
        ue.is_equipped,
        e.name,
        e.description,
        e.image_filename,
        e.equipment_type,
        e.price,
        e.base_speed,
        e.max_speed,
        e.max_weight,
        e.max_volume,
        e.allowed_categories
    FROM trucker.tbl_user_equipments ue
    JOIN trucker.tbl_equipments e ON e.id = ue.equipment_id
    WHERE ue.user_id = p_user_id AND e.is_active = true
    ORDER BY ue.is_equipped DESC, e.price ASC, ue.purchased_at ASC;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_user_equipments IS '유저가 보유한 장비 목록 조회 (장비 상세 정보 포함)';
GRANT EXECUTE ON FUNCTION trucker.v1_get_user_equipments TO authenticated;

-- =====================================================
-- 4. v1_update_equipment() - 장비 정보 수정 (관리자용)
-- =====================================================
CREATE OR REPLACE FUNCTION trucker.v1_update_equipment(
    p_id text,
    p_name text DEFAULT NULL,
    p_description text DEFAULT NULL,
    p_price bigint DEFAULT NULL,
    p_base_speed float DEFAULT NULL,
    p_max_speed float DEFAULT NULL,
    p_max_weight float DEFAULT NULL,
    p_max_volume float DEFAULT NULL,
    p_allowed_categories text[] DEFAULT NULL,
    p_is_default boolean DEFAULT NULL,
    p_is_active boolean DEFAULT NULL
)
RETURNS trucker.tbl_equipments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_result trucker.tbl_equipments;
BEGIN
    UPDATE trucker.tbl_equipments
    SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        price = COALESCE(p_price, price),
        base_speed = COALESCE(p_base_speed, base_speed),
        max_speed = COALESCE(p_max_speed, max_speed),
        max_weight = COALESCE(p_max_weight, max_weight),
        max_volume = COALESCE(p_max_volume, max_volume),
        allowed_categories = COALESCE(p_allowed_categories, allowed_categories),
        is_default = COALESCE(p_is_default, is_default),
        is_active = COALESCE(p_is_active, is_active),
        updated_at = now()
    WHERE id = p_id
    RETURNING * INTO v_result;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Equipment not found: %', p_id;
    END IF;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION trucker.v1_update_equipment IS '장비 정보 수정 (관리자용). ID는 변경 불가';
GRANT EXECUTE ON FUNCTION trucker.v1_update_equipment TO authenticated;

-- =====================================================
-- 5. v1_get_equipment_by_id() - 단일 장비 조회
-- =====================================================
CREATE OR REPLACE FUNCTION trucker.v1_get_equipment_by_id(p_id text)
RETURNS trucker.tbl_equipments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_result trucker.tbl_equipments;
BEGIN
    SELECT * INTO v_result
    FROM trucker.tbl_equipments
    WHERE id = p_id;

    RETURN v_result;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_equipment_by_id IS '단일 장비 조회';
GRANT EXECUTE ON FUNCTION trucker.v1_get_equipment_by_id TO anon, authenticated;

-- =====================================================
-- 6. v1_create_run() 수정 - 장비 스냅샷 저장 로직 추가
-- =====================================================
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
    v_equipment RECORD;
    v_run trucker.tbl_runs;
    v_eta_seconds integer;
    v_deadline_at timestamp with time zone;
    v_equipment_id text;
    v_equipment_snapshot jsonb;
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

    -- 2. 장비 정보 조회 및 스냅샷 생성
    v_equipment_id := COALESCE(p_selected_items->>'equipmentId', 'basic-bicycle');
    
    SELECT * INTO v_equipment FROM trucker.tbl_equipments WHERE id = v_equipment_id;
    IF NOT FOUND THEN
        -- 장비를 찾을 수 없으면 기본 자전거로 폴백
        SELECT * INTO v_equipment FROM trucker.tbl_equipments WHERE id = 'basic-bicycle';
    END IF;

    -- 장비 스냅샷 생성 (계약 시점의 설정값 저장)
    v_equipment_snapshot := jsonb_build_object(
        'id', v_equipment.id,
        'name', v_equipment.name,
        'equipment_type', v_equipment.equipment_type,
        'base_speed', v_equipment.base_speed,
        'max_speed', v_equipment.max_speed,
        'max_weight', v_equipment.max_weight,
        'max_volume', v_equipment.max_volume
    );

    -- 3. ETA 계산 (장비의 base_speed 기반)
    -- 거리(km) / 속도(km/h) * 3600 = 초
    v_eta_seconds := ROUND((v_order.distance / v_equipment.base_speed) * 3600);
    v_deadline_at := now() + (v_order.limit_time_minutes * interval '1 minute');

    -- 4. Run 생성 (user_id는 public_profile_id)
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
        equipment_snapshot,
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
        v_equipment.id,
        p_selected_items->>'documentId',
        p_selected_items->>'insuranceId',
        v_equipment_snapshot,
        v_order.base_reward,
        0.05, -- 기본 위험도
        100,
        100
    )
    RETURNING * INTO v_run;

    -- 5. 슬롯 상태 업데이트
    UPDATE trucker.tbl_slots 
    SET active_run_id = v_run.id 
    WHERE id = p_slot_id;

    -- 6. 이벤트 로그 추가 (운행 시작)
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
        '[' || v_order.title || '] ' || v_equipment.name || '(으)로 운행을 시작합니다. 안전 운전하세요!',
        0,
        0,
        false
    );

    RETURN v_run;
END;
$$;

COMMENT ON FUNCTION trucker.v1_create_run IS '운행(Run)을 생성합니다. 장비 스냅샷을 저장하여 진행 중 설정 변경 영향 없음';
GRANT EXECUTE ON FUNCTION trucker.v1_create_run TO authenticated;
