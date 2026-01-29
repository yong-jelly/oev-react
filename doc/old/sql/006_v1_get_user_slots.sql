-- =====================================================
-- 006_v1_get_user_slots.sql
-- 유저 슬롯 조회 API
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/006_v1_get_user_slots.sql
-- =====================================================

-- 유저의 슬롯 목록 조회
-- NOTE: p_user_id는 public_profile_id를 직접 받습니다 (auth_user_id 아님)
CREATE OR REPLACE FUNCTION trucker.v1_get_user_slots(p_user_id uuid)
RETURNS SETOF trucker.tbl_slots
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    -- p_user_id는 public_profile_id를 직접 받음
    -- 프로필이 없으면 빈 결과 반환
    IF NOT EXISTS (SELECT 1 FROM trucker.tbl_user_profile WHERE public_profile_id = p_user_id) THEN
        RETURN;
    END IF;

    -- 슬롯이 없으면 자동 생성 (public_profile_id 기준)
    IF NOT EXISTS (SELECT 1 FROM trucker.tbl_slots WHERE user_id = p_user_id) THEN
        INSERT INTO trucker.tbl_slots (user_id, index, is_locked) VALUES
            (p_user_id, 0, false),
            (p_user_id, 1, true),
            (p_user_id, 2, true);
    END IF;

    RETURN QUERY
    SELECT * FROM trucker.tbl_slots
    WHERE user_id = p_user_id
    ORDER BY index ASC;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_user_slots IS '유저의 슬롯 목록을 조회합니다. p_user_id는 public_profile_id입니다. 슬롯이 없으면 자동 생성합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_get_user_slots TO authenticated;
