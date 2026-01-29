-- =====================================================
-- 009_v1_complete_run.sql
-- 운행 완료 및 정산 처리 API
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/009_v1_complete_run.sql
-- =====================================================

CREATE OR REPLACE FUNCTION trucker.v1_complete_run(
    p_run_id uuid,
    p_final_reward bigint,
    p_penalty_amount bigint,
    p_elapsed_seconds integer
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_run RECORD;
    v_user_id uuid;
    v_new_balance bigint;
    v_reputation_gain integer;
    v_new_reputation integer;
BEGIN
    -- 1. 운행 정보 조회 및 상태 확인
    SELECT * INTO v_run FROM trucker.tbl_runs WHERE id = p_run_id FOR UPDATE;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Run not found';
    END IF;
    
    IF v_run.status != 'IN_TRANSIT' THEN
        RAISE EXCEPTION 'Run is already completed or cancelled';
    END IF;

    v_user_id := v_run.user_id;

    -- 2. 운행 상태 업데이트
    UPDATE trucker.tbl_runs
    SET 
        status = 'COMPLETED',
        completed_at = now(),
        current_reward = p_final_reward,
        accumulated_penalty = p_penalty_amount
    WHERE id = p_run_id;

    -- 3. 슬롯 해제 (active_run_id 초기화)
    UPDATE trucker.tbl_slots
    SET active_run_id = NULL
    WHERE id = v_run.slot_id;

    -- 4. 사용자 잔액 및 평판 업데이트
    -- 평판 계산: 패널티가 없으면 +10, 있으면 +5 (임시 로직)
    v_reputation_gain := CASE WHEN p_penalty_amount > 0 THEN 5 ELSE 10 END;

    -- NOTE: tbl_runs.user_id는 public_profile_id입니다 (auth_user_id 아님)
    UPDATE trucker.tbl_user_profile
    SET 
        balance = balance + p_final_reward,
        reputation = reputation + v_reputation_gain,
        updated_at = now()
    WHERE public_profile_id = v_user_id
    RETURNING balance, reputation INTO v_new_balance, v_new_reputation;

    -- 5. 거래 내역 기록
    INSERT INTO trucker.tbl_transactions (
        user_id,
        run_id,
        type,
        amount,
        balance_after,
        description
    ) VALUES (
        v_user_id,
        p_run_id,
        'REWARD',
        p_final_reward,
        v_new_balance,
        CASE 
            WHEN p_penalty_amount > 0 THEN format('운행 완료 정산 (패널티: $%s)', p_penalty_amount)
            ELSE '운행 완료 정산'
        END
    );

    -- 6. 결과 반환
    RETURN jsonb_build_object(
        'status', 'success',
        'new_balance', v_new_balance,
        'new_reputation', v_new_reputation,
        'reputation_gain', v_reputation_gain
    );
END;
$$;

COMMENT ON FUNCTION trucker.v1_complete_run IS '운행을 완료 처리하고 보상을 잔액에 추가하며 평판을 업데이트합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_complete_run TO authenticated;
