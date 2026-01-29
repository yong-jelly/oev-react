-- =====================================================
-- 003_v1_get_user_profile.sql
-- 사용자 프로필(User Profile) 관련 API
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/003_v1_get_user_profile.sql
-- =====================================================

-- 1. 사용자 프로필 조회 (프로필이 없으면 자동 생성)
CREATE OR REPLACE FUNCTION trucker.v1_get_user_profile(p_auth_user_id uuid)
RETURNS trucker.tbl_user_profile
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_profile trucker.tbl_user_profile;
    v_email TEXT;
    v_nickname TEXT;
    v_random_suffix TEXT;
BEGIN
    -- 1. 기존 프로필 조회
    SELECT * INTO v_profile FROM trucker.tbl_user_profile WHERE auth_user_id = p_auth_user_id;
    
    -- 2. 프로필이 없으면 자동 생성
    IF v_profile IS NULL THEN
        -- auth.users에서 이메일 가져오기
        SELECT email INTO v_email FROM auth.users WHERE id = p_auth_user_id;
        
        -- 닉네임 생성
        v_nickname := split_part(COALESCE(v_email, 'trucker'), '@', 1);
        v_nickname := left(v_nickname, 20);
        v_random_suffix := floor(random() * 9000 + 1000)::text;
        v_nickname := v_nickname || '_' || v_random_suffix;
        
        -- 프로필 생성
        INSERT INTO trucker.tbl_user_profile (auth_user_id, nickname)
        VALUES (p_auth_user_id, v_nickname)
        RETURNING * INTO v_profile;
        
        -- 기본 슬롯 3개 생성 (첫 번째만 해금)
        INSERT INTO trucker.tbl_slots (user_id, index, is_locked) VALUES
            (p_auth_user_id, 0, false),
            (p_auth_user_id, 1, true),
            (p_auth_user_id, 2, true)
        ON CONFLICT (user_id, index) DO NOTHING;
    END IF;
    
    RETURN v_profile;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_user_profile IS '특정 사용자의 프로필 정보를 조회합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_get_user_profile TO authenticated;

-- 2. 사용자 프로필 생성 또는 수정 (Upsert)
CREATE OR REPLACE FUNCTION trucker.v1_upsert_user_profile(
    p_auth_user_id uuid,
    p_profile jsonb
)
RETURNS trucker.tbl_user_profile
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_profile trucker.tbl_user_profile;
BEGIN
    INSERT INTO trucker.tbl_user_profile (
        auth_user_id,
        nickname,
        bio,
        avatar_url,
        telegram_chat_id,
        slack_webhook_url,
        notification_enabled,
        updated_at
    ) VALUES (
        p_auth_user_id,
        p_profile->>'nickname',
        p_profile->>'bio',
        p_profile->>'avatar_url',
        p_profile->>'telegram_chat_id',
        p_profile->>'slack_webhook_url',
        COALESCE((p_profile->>'notification_enabled')::boolean, true),
        now()
    )
    ON CONFLICT (auth_user_id) WHERE auth_user_id IS NOT NULL DO UPDATE SET
        nickname = EXCLUDED.nickname,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        telegram_chat_id = EXCLUDED.telegram_chat_id,
        slack_webhook_url = EXCLUDED.slack_webhook_url,
        notification_enabled = EXCLUDED.notification_enabled,
        updated_at = now()
    RETURNING * INTO v_profile;

    RETURN v_profile;
END;
$$;

COMMENT ON FUNCTION trucker.v1_upsert_user_profile IS '사용자 프로필을 생성하거나 수정합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_upsert_user_profile TO authenticated;
