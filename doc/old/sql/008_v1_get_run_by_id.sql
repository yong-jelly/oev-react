-- =====================================================
-- 008_v1_get_run_by_id.sql
-- 특정 운행 상세 조회 API
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/008_v1_get_run_by_id.sql
-- =====================================================

-- 기존 함수 삭제 (반환 타입 변경을 위해)
DROP FUNCTION IF EXISTS trucker.v1_get_run_by_id(uuid);

-- 특정 운행 상세 조회 (주문 정보 포함)
-- 조회 시점에 완료 시간이 지난 경우 자동으로 완료 처리합니다.
CREATE OR REPLACE FUNCTION trucker.v1_get_run_by_id(p_run_id uuid)
RETURNS TABLE (
    run_id uuid,
    user_id uuid,
    order_id uuid,
    slot_id uuid,
    status text,
    start_at timestamp with time zone,
    completed_at timestamp with time zone,
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
    order_limit_time_minutes integer,
    order_start_lat float,
    order_start_lng float,
    order_end_lat float,
    order_end_lng float,
    order_required_equipment_type text,
    -- 슬롯 정보
    slot_index integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_run RECORD;
    v_user RECORD;
    v_is_bot boolean;
    v_elapsed_seconds integer;
    v_delay_seconds integer;
    v_penalty_amount bigint;
    v_final_reward bigint;
BEGIN
    -- 1. 운행 정보 조회 (FOR UPDATE로 잠금)
    SELECT r.* INTO v_run
    FROM trucker.tbl_runs r
    WHERE r.id = p_run_id
    FOR UPDATE;
    
    -- 운행이 없으면 빈 결과 반환
    IF NOT FOUND THEN
        RETURN;
    END IF;
    
    -- 2. 완료 시간이 지났고 아직 IN_TRANSIT 상태인 경우 자동 완료 처리
    IF v_run.status = 'IN_TRANSIT' AND now() >= (v_run.start_at + (v_run.eta_seconds || ' seconds')::interval) THEN
        -- 사용자 정보 조회 (봇 여부 확인)
        SELECT u.is_bot INTO v_is_bot
        FROM trucker.tbl_user_profile u
        WHERE u.public_profile_id = v_run.user_id;
        
        IF v_is_bot THEN
            -- 봇인 경우: bot_complete_run 호출
            PERFORM trucker.bot_complete_run(p_run_id);
        ELSE
            -- 일반 사용자인 경우: 패널티 계산 후 v1_complete_run 호출
            v_elapsed_seconds := EXTRACT(EPOCH FROM (now() - v_run.start_at))::integer;
            v_penalty_amount := v_run.accumulated_penalty;
            
            -- 지연 페널티 계산
            IF now() > (v_run.start_at + (v_run.eta_seconds || ' seconds')::interval) THEN
                -- 지연 시간(초) 계산
                v_delay_seconds := EXTRACT(EPOCH FROM (now() - (v_run.start_at + (v_run.eta_seconds || ' seconds')::interval)))::integer;
                -- 1분당 0.2% 페널티, 최대 보상의 50%까지 차감
                v_penalty_amount := v_penalty_amount + LEAST(
                    (v_run.current_reward * 0.5)::bigint,
                    (FLOOR(v_delay_seconds / 60) * (v_run.current_reward * 0.002))::bigint
                );
            END IF;
            
            v_final_reward := v_run.current_reward - (v_penalty_amount - v_run.accumulated_penalty);
            
            -- 운행 완료 처리
            PERFORM trucker.v1_complete_run(
                p_run_id,
                v_final_reward,
                v_penalty_amount,
                v_elapsed_seconds
            );
        END IF;
        
        -- 완료 처리 후 최신 데이터 다시 조회
        SELECT r.* INTO v_run
        FROM trucker.tbl_runs r
        WHERE r.id = p_run_id;
    END IF;
    
    -- 3. 최종 결과 반환
    RETURN QUERY
    SELECT 
        r.id as run_id,
        r.user_id,
        r.order_id,
        r.slot_id,
        r.status,
        r.start_at,
        r.completed_at,
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
        o.limit_time_minutes as order_limit_time_minutes,
        o.start_lat as order_start_lat,
        o.start_lng as order_start_lng,
        o.end_lat as order_end_lat,
        o.end_lng as order_end_lng,
        o.required_equipment_type as order_required_equipment_type,
        -- 슬롯 정보
        s.index as slot_index
    FROM trucker.tbl_runs r
    JOIN trucker.tbl_orders o ON r.order_id = o.id
    JOIN trucker.tbl_slots s ON r.slot_id = s.id
    WHERE r.id = p_run_id;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_run_by_id IS '특정 운행의 상세 정보를 주문/슬롯 정보와 함께 조회합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_get_run_by_id TO authenticated;
