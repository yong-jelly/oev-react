-- =====================================================
-- 013_bot_cron_activities.sql
-- 봇 활동 Cron 함수 (매 분 실행)
-- 
-- 봇 동작 로직:
--   1. 대기 중인 봇 확인 (활성 운행 없는 봇)
--   2. 가용 주문 중 랜덤 선택
--   3. 운행 생성
--   4. 진행 중인 운행 상태 업데이트
--   5. 완료 시간 도달 시 자동 완료 처리
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/013_bot_cron_activities.sql
-- =====================================================

-- 1. 봇 운행 생성 함수 (public_profile_id 기반)
CREATE OR REPLACE FUNCTION trucker.bot_create_run(
    p_bot_id uuid,  -- public_profile_id
    p_order_id uuid,
    p_slot_id uuid
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
    -- 1. 주문 정보 조회
    SELECT * INTO v_order FROM trucker.tbl_orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order not found';
    END IF;

    -- 2. ETA 및 마감 시간 계산 (자전거 15km/h 기준)
    v_eta_seconds := ROUND(v_order.distance / 15 * 3600);  -- km / (km/h) * 3600 = seconds
    v_deadline_at := now() + (v_order.limit_time_minutes * interval '1 minute');

    -- 3. Run 생성 (봇용 - public_profile_id 사용)
    -- 관리자 설정 로드 (결정론적 단속 설정)
    DECLARE
        v_max_enforcement_limit integer;
        v_actual_max_enforcement integer;
        v_prob float;
        v_fine_rate float;
    BEGIN
        SELECT (value->>0)::integer INTO v_max_enforcement_limit FROM trucker.tbl_admin_config WHERE key = 'enforcement_max_count';
        SELECT (value->>0)::float INTO v_prob FROM trucker.tbl_admin_config WHERE key = 'enforcement_check_probability';
        SELECT (value->>0)::float INTO v_fine_rate FROM trucker.tbl_admin_config WHERE key = 'enforcement_fine_rate';

        v_max_enforcement_limit := COALESCE(v_max_enforcement_limit, 1);
        v_prob := COALESCE(v_prob, 0.25);
        v_fine_rate := COALESCE(v_fine_rate, 0.1);
        v_actual_max_enforcement := floor(random() * (v_max_enforcement_limit + 1));

        INSERT INTO trucker.tbl_runs (
            user_id,
            order_id,
            slot_id,
            status,
            eta_seconds,
            deadline_at,
            selected_equipment_id,
            current_reward,
            current_risk,
            current_durability,
            current_fuel,
            max_enforcement_count,
            enforcement_probability,
            fine_rate
        ) VALUES (
            p_bot_id,  -- public_profile_id
            p_order_id,
            p_slot_id,
            'IN_TRANSIT',
            v_eta_seconds,
            v_deadline_at,
            'BICYCLE',
            v_order.base_reward,
            0.05,
            100,
            100,
            v_actual_max_enforcement,
            v_prob,
            v_fine_rate
        )
        RETURNING * INTO v_run;
    END;

    -- 4. 슬롯 상태 업데이트
    UPDATE trucker.tbl_slots 
    SET active_run_id = v_run.id 
    WHERE id = p_slot_id;

    -- 5. 봇 상태 업데이트 (DELIVERING)
    UPDATE trucker.tbl_bot_status
    SET 
        status = 'DELIVERING',
        current_run_id = v_run.id,
        updated_at = now()
    WHERE bot_id = p_bot_id;

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
        '🤖 봇 운행 시작',
        '[' || v_order.title || '] 봇이 배송을 시작했습니다.',
        0,
        0,
        false
    );

    RETURN v_run;
END;
$$;

-- 2. 봇 운행 완료 함수 (public_profile_id 기반)
CREATE OR REPLACE FUNCTION trucker.bot_complete_run(p_run_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_run RECORD;
    v_order RECORD;
    v_bot_id uuid;
    v_final_reward bigint;
    v_penalty bigint := 0;
    v_new_balance bigint;
    v_reputation_gain integer;
    v_new_reputation integer;
    v_elapsed_seconds integer;
    v_success_rate float;
    v_rest_min integer;
    v_rest_max integer;
    v_rest_minutes integer;
    v_next_available_at timestamp with time zone;
BEGIN
    -- 1. 운행 정보 조회
    SELECT * INTO v_run FROM trucker.tbl_runs WHERE id = p_run_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Run not found');
    END IF;
    
    IF v_run.status != 'IN_TRANSIT' THEN
        RETURN jsonb_build_object('status', 'error', 'message', 'Run already completed');
    END IF;

    v_bot_id := v_run.user_id;
    
    -- 2. 주문 정보 조회
    SELECT * INTO v_order FROM trucker.tbl_orders WHERE id = v_run.order_id;
    
    -- 3. 경과 시간 계산
    v_elapsed_seconds := EXTRACT(EPOCH FROM (now() - v_run.start_at))::integer;
    
    -- 4. 성공/실패 및 보상 계산 (봇은 90% 확률로 성공, 랜덤 보너스)
    v_success_rate := 0.9 + (random() * 0.1);  -- 90-100%
    
    IF random() < v_success_rate THEN
        -- 성공: 보상 + 랜덤 보너스 (0-15%)
        v_final_reward := v_run.current_reward + ROUND(v_run.current_reward * random() * 0.15);
        v_reputation_gain := 10 + ROUND(random() * 5)::integer;  -- 10-15
    ELSE
        -- 실패: 50% 보상, 페널티 발생
        v_penalty := ROUND(v_run.current_reward * 0.2);
        v_final_reward := ROUND(v_run.current_reward * 0.5);
        v_reputation_gain := 2;
    END IF;

    -- 5. 운행 상태 업데이트
    UPDATE trucker.tbl_runs
    SET 
        status = 'COMPLETED',
        completed_at = now(),
        current_reward = v_final_reward,
        accumulated_penalty = v_penalty
    WHERE id = p_run_id;

    -- 6. 슬롯 해제
    UPDATE trucker.tbl_slots
    SET active_run_id = NULL
    WHERE id = v_run.slot_id;

    -- 7. 봇 잔액 및 평판 업데이트 (public_profile_id 기반)
    UPDATE trucker.tbl_user_profile
    SET 
        balance = balance + v_final_reward,
        reputation = reputation + v_reputation_gain,
        updated_at = now()
    WHERE public_profile_id = v_bot_id
    RETURNING balance, reputation INTO v_new_balance, v_new_reputation;

    -- 8. 휴식 시간 계산 및 봇 상태 업데이트
    -- 관리자 설정 조회 (없으면 기본값 사용)
    SELECT (value::text)::integer INTO v_rest_min FROM trucker.tbl_admin_config WHERE key = 'bot_rest_min_minutes';
    SELECT (value::text)::integer INTO v_rest_max FROM trucker.tbl_admin_config WHERE key = 'bot_rest_max_minutes';
    
    IF v_rest_min IS NULL THEN v_rest_min := 10; END IF;
    IF v_rest_max IS NULL THEN v_rest_max := 60; END IF;
    
    -- 랜덤 휴식 시간 (분)
    v_rest_minutes := floor(random() * (v_rest_max - v_rest_min + 1) + v_rest_min)::integer;
    v_next_available_at := now() + (v_rest_minutes * interval '1 minute');

    UPDATE trucker.tbl_bot_status
    SET 
        status = 'RESTING',
        current_run_id = NULL,
        last_completed_at = now(),
        next_available_at = v_next_available_at,
        total_deliveries = total_deliveries + 1,
        updated_at = now()
    WHERE bot_id = v_bot_id;

    -- 9. 거래 내역 기록
    INSERT INTO trucker.tbl_transactions (
        user_id,
        run_id,
        type,
        amount,
        balance_after,
        description
    ) VALUES (
        v_bot_id,
        p_run_id,
        'REWARD',
        v_final_reward,
        v_new_balance,
        CASE 
            WHEN v_penalty > 0 THEN format('🤖 봇 운행 완료: %s (패널티: $%s)', v_order.title, v_penalty)
            ELSE format('🤖 봇 운행 완료: %s', v_order.title)
        END
    );

    -- 10. 완료 이벤트 로그
    INSERT INTO trucker.tbl_event_logs (
        run_id,
        type,
        title,
        description,
        amount
    ) VALUES (
        p_run_id,
        'SYSTEM',
        '🤖 봇 운행 완료',
        format('배송이 완료되었습니다. 보상: $%s (휴식: %s분)', v_final_reward, v_rest_minutes),
        v_final_reward
    );

    RETURN jsonb_build_object(
        'status', 'success',
        'bot_id', v_bot_id,
        'final_reward', v_final_reward,
        'penalty', v_penalty,
        'new_balance', v_new_balance,
        'new_reputation', v_new_reputation,
        'elapsed_seconds', v_elapsed_seconds,
        'rest_minutes', v_rest_minutes
    );
END;
$$;

-- 3. 메인 봇 활동 처리 함수 (매 분 실행)
CREATE OR REPLACE FUNCTION trucker.process_bot_activities()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_bot RECORD;
    v_slot_id uuid;
    v_order RECORD;
    v_run RECORD;
    v_result jsonb;
    v_runs_started integer := 0;
    v_runs_completed integer := 0;
    v_orders_generated integer := 0;
    v_accept_prob float;
BEGIN
    -- 1. 완료 시간이 된 봇 운행 처리
    FOR v_run IN 
        SELECT r.* 
        FROM trucker.tbl_runs r
        JOIN trucker.tbl_user_profile u ON r.user_id = u.public_profile_id
        WHERE u.is_bot = true 
          AND r.status = 'IN_TRANSIT'
          AND now() >= r.start_at + (r.eta_seconds * interval '1 second')
    LOOP
        PERFORM trucker.bot_complete_run(v_run.id);
        v_runs_completed := v_runs_completed + 1;
    END LOOP;

    -- 2. 봇 상태 업데이트 (휴식 종료 처리)
    UPDATE trucker.tbl_bot_status
    SET status = 'IDLE', next_available_at = NULL
    WHERE status = 'RESTING' AND next_available_at <= now();

    -- 3. 주문이 부족하면 생성 (10개 미만이면 8개 추가)
    IF (SELECT count(*) FROM trucker.tbl_orders) < 10 THEN
        PERFORM trucker.v1_generate_bicycle_orders(8);
        v_orders_generated := 8;
    END IF;

    -- 4. 대기 중인 봇이 새 주문을 수락
    -- 관리자 설정: 주문 수락 확률
    SELECT (value::text)::float INTO v_accept_prob FROM trucker.tbl_admin_config WHERE key = 'bot_accept_probability';
    IF v_accept_prob IS NULL THEN v_accept_prob := 0.5; END IF;

    FOR v_bot IN 
        SELECT p.* 
        FROM trucker.tbl_user_profile p
        JOIN trucker.tbl_bot_status s ON p.public_profile_id = s.bot_id
        WHERE p.is_bot = true 
          AND s.status = 'IDLE'  -- IDLE 상태인 봇만
        ORDER BY random()  -- 랜덤 순서로 처리
    LOOP
        -- 봇이 주문을 수락할 수 있는지 확인 (슬롯 체크 포함)
        IF trucker.can_bot_accept_order(v_bot.public_profile_id) THEN
            -- 설정된 확률로 주문 수락
            IF random() < v_accept_prob THEN
                -- 가용 슬롯 조회 (1개 슬롯만 사용하도록 get_available_bot_slot 로직이 이미 1개 제한되어 있음)
                v_slot_id := trucker.get_available_bot_slot(v_bot.public_profile_id);
                
                IF v_slot_id IS NOT NULL THEN
                    -- 랜덤 주문 선택 (아직 수락되지 않은 주문)
                    SELECT * INTO v_order 
                    FROM trucker.tbl_orders o
                    WHERE NOT EXISTS (
                        SELECT 1 FROM trucker.tbl_runs r 
                        WHERE r.order_id = o.id AND r.status = 'IN_TRANSIT'
                    )
                    ORDER BY random()
                    LIMIT 1;
                    
                    IF FOUND THEN
                        -- 운행 생성
                        PERFORM trucker.bot_create_run(
                            v_bot.public_profile_id,
                            v_order.id,
                            v_slot_id
                        );
                        v_runs_started := v_runs_started + 1;
                    END IF;
                END IF;
            END IF;
        END IF;
    END LOOP;

    -- 5. 결과 반환
    RETURN jsonb_build_object(
        'timestamp', now(),
        'runs_started', v_runs_started,
        'runs_completed', v_runs_completed,
        'orders_generated', v_orders_generated
    );
END;
$$;

-- 4. pg_cron 스케줄 설정 (매 분 실행)
-- 주의: pg_cron 확장이 설치되어 있어야 합니다
-- Supabase에서는 Dashboard > Database > Extensions에서 pg_cron 활성화

-- 기존 스케줄 삭제 (있으면)
SELECT cron.unschedule('process-bot-activities') 
WHERE EXISTS (
    SELECT 1 FROM cron.job WHERE jobname = 'process-bot-activities'
);

-- 새 스케줄 등록 (매 분)
SELECT cron.schedule(
    'process-bot-activities',
    '* * * * *',  -- 매 분
    $$SELECT trucker.process_bot_activities()$$
);

-- 5. 수동 실행용 래퍼 함수
CREATE OR REPLACE FUNCTION trucker.v1_trigger_bot_activities()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN trucker.process_bot_activities();
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION trucker.bot_create_run TO service_role;
GRANT EXECUTE ON FUNCTION trucker.bot_complete_run TO service_role;
GRANT EXECUTE ON FUNCTION trucker.process_bot_activities TO service_role;
GRANT EXECUTE ON FUNCTION trucker.v1_trigger_bot_activities TO authenticated, service_role;

COMMENT ON FUNCTION trucker.process_bot_activities IS '봇 활동 처리 - 운행 생성/완료, 주문 생성 (매 분 cron 실행)';
COMMENT ON FUNCTION trucker.v1_trigger_bot_activities IS '봇 활동 수동 트리거 (디버깅/테스트용)';
