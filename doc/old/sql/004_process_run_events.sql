-- =====================================================
-- 004_process_run_events.sql
-- 서버사이드 이벤트 처리 및 자동 정산 로직 (pg_cron 연동)
-- 
-- 주요 로직:
--   1. 자동 정산: 도착 예정 시간(ETA)이 지난 운행을 자동으로 완료 처리
--   2. 단속 이벤트: 관리자 설정 및 계약서에 명시된 결정론적 수치에 따라 단속 집행
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/004_process_run_events.sql
-- =====================================================

-- 1. 이벤트 처리 및 자동 정산 메인 함수
CREATE OR REPLACE FUNCTION trucker.process_run_events()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    run_record RECORD;
    config_penalties jsonb;
    random_val float;
    event_type text;
    event_title text;
    event_desc text;
    penalty_amount bigint;
    delay_seconds integer;
    v_final_reward bigint;
    v_current_enforcement_count integer;
BEGIN
    -- [설정 로드] 단속 대응별 기본 페널티 시간 설정
    SELECT value INTO config_penalties FROM trucker.tbl_system_config WHERE id = 'enforcement_penalties';
    IF config_penalties IS NULL THEN 
        config_penalties := '{"document": 300, "bypass": 720, "evasion_success": 0, "evasion_fail": 1200}'; 
    END IF;

    -- [운행 순회] 현재 진행 중인(IN_TRANSIT) 모든 운행을 대상으로 처리
    FOR run_record IN 
        SELECT * FROM trucker.tbl_runs WHERE status = 'IN_TRANSIT'
    LOOP
        -- ---------------------------------------------------------
        -- A. 자동 정산 체크 (도착 완료 여부)
        -- ---------------------------------------------------------
        -- 현재 시간이 (출발시간 + 예상소요시간)을 경과했는지 확인
        IF now() >= (run_record.start_at + (run_record.eta_seconds || ' seconds')::interval) THEN
            -- 지연 페널티 계산
            penalty_amount := 0;
            IF now() > (run_record.start_at + (run_record.eta_seconds || ' seconds')::interval) THEN
                -- 지연 시간(초) 계산
                delay_seconds := extract(epoch from (now() - (run_record.start_at + (run_record.eta_seconds || ' seconds')::interval)))::integer;
                -- 1분당 0.2% 페널티, 최대 보상의 50%까지 차감
                penalty_amount := LEAST(
                    (run_record.current_reward * 0.5)::bigint,
                    (floor(delay_seconds / 60) * (run_record.current_reward * 0.002))::bigint
                );
            END IF;

            v_final_reward := run_record.current_reward - penalty_amount;

            -- 운행 완료 처리 (트랜잭션 및 평판 업데이트 포함)
            PERFORM trucker.v1_complete_run(
                run_record.id,
                v_final_reward,
                penalty_amount + run_record.accumulated_penalty,
                extract(epoch from (now() - run_record.start_at))::integer
            );
            
            CONTINUE; -- 정산 완료된 건은 다음 단계(단속 체크) 건너뜀
        END IF;

        -- ---------------------------------------------------------
        -- B. 랜덤 단속 이벤트 체크 (결정론적 로직)
        -- ---------------------------------------------------------
        -- 1) 이미 발생한 단속 횟수 조회
        SELECT count(*) INTO v_current_enforcement_count 
        FROM trucker.tbl_event_logs 
        WHERE run_id = run_record.id AND type IN ('POLICE', 'PENALTY');

        -- 2) 계약서에 명시된 최대 단속 횟수(max_enforcement_count)를 초과하지 않았을 때만 실행
        IF v_current_enforcement_count < run_record.max_enforcement_count THEN
            -- 3) 계약서에 명시된 단속 발생 확률(enforcement_probability) 체크
            random_val := random();
            IF random_val < run_record.enforcement_probability THEN
                penalty_amount := 0;
                delay_seconds := 0;
                
                -- [단속 대응 로직]
                -- 유저가 서류를 장착하고 있는 경우 (무사 통과, 시간만 약간 지연)
                IF run_record.selected_document_id IS NOT NULL THEN
                    event_type := 'POLICE';
                    event_title := '단속 검문 (서류 제시)';
                    event_desc := '필수 배송 서류를 제시하여 무사히 통과했습니다.';
                    delay_seconds := (config_penalties->>'document')::integer;
                ELSE
                    -- 서류가 없는 경우: 우회(50%) 또는 돌파 시도(50%) 시뮬레이션
                    IF random() < 0.5 THEN
                        -- 우회 선택 시: 시간 패널티 발생
                        event_type := 'POLICE';
                        event_title := '단속 우회 성공';
                        event_desc := '검문소를 발견하고 우회로로 진입하여 단속을 피했습니다.';
                        delay_seconds := (config_penalties->>'bypass')::integer;
                    ELSE
                        -- 돌파 선택 시: 성공(40%) 또는 실패(60%)
                        -- TODO: 향후 유저의 실제 선택을 반영할 수 있도록 확장 가능
                        IF random() < 0.4 THEN
                            event_type := 'BONUS';
                            event_title := '단속 돌파 성공';
                            event_desc := '경찰의 추격을 따돌리고 단속 구역을 벗어났습니다!';
                            delay_seconds := (config_penalties->>'evasion_success')::integer;
                        ELSE
                            -- 돌파 실패 시: 비율 기반 벌금 부과
                            event_type := 'PENALTY';
                            event_title := '단속 적발 (돌파 실패)';
                            event_desc := '도주에 실패하여 현장에서 벌금이 부과되었습니다.';
                            -- 계약서에 명시된 벌금 비율(fine_rate) 적용 (기본값 0.1 = 10%)
                            penalty_amount := (run_record.current_reward * COALESCE(run_record.fine_rate, 0.1))::bigint;
                        END IF;
                    END IF;
                END IF;

                -- [결과 기록] 이벤트 로그 추가
                INSERT INTO trucker.tbl_event_logs (
                    run_id, type, title, description, amount, eta_change_seconds, is_estimated
                ) VALUES (
                    run_record.id, event_type, event_title, event_desc, -penalty_amount, delay_seconds, false
                );

                -- [상태 업데이트] 누적 페널티 및 ETA(도착예정시간) 수정
                UPDATE trucker.tbl_runs
                SET 
                    accumulated_penalty = accumulated_penalty + penalty_amount,
                    eta_seconds = eta_seconds + delay_seconds,
                    current_risk = LEAST(current_risk + 0.05, 1.0)
                WHERE id = run_record.id;
            END IF;
        END IF;
    END LOOP;
END;
$$;

COMMENT ON FUNCTION trucker.process_run_events IS '진행 중인 모든 운행의 자동 정산 및 단속 이벤트를 처리합니다. (매 분 Cron 실행)';
