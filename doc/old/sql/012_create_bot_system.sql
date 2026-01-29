-- =====================================================
-- 012_create_bot_system.sql
-- 봇 시스템 스키마 및 5개 봇 계정 생성
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/012_create_bot_system.sql
-- =====================================================

-- 1. tbl_user_profile에 is_bot 컬럼 추가
ALTER TABLE trucker.tbl_user_profile 
ADD COLUMN IF NOT EXISTS is_bot boolean DEFAULT false NOT NULL;

-- 2. auth_user_id FK 제약 조건 수정을 위한 테이블 구조 변경
-- 봇은 auth.users와 연동되지 않으므로, FK를 nullable로 만들고 별도 제약 추가

-- 기존 FK 제약 삭제 (있으면)
ALTER TABLE trucker.tbl_user_profile 
DROP CONSTRAINT IF EXISTS tbl_user_profile_auth_user_id_fkey;

-- PK 변경: auth_user_id -> public_profile_id를 기준으로
-- 기존 PK 삭제
ALTER TABLE trucker.tbl_user_profile DROP CONSTRAINT IF EXISTS tbl_user_profile_pkey;

-- auth_user_id nullable로 변경
ALTER TABLE trucker.tbl_user_profile ALTER COLUMN auth_user_id DROP NOT NULL;

-- public_profile_id를 새 PK로 설정
ALTER TABLE trucker.tbl_user_profile ADD PRIMARY KEY (public_profile_id);

-- auth_user_id에 대한 FK 다시 추가 (nullable이므로 봇은 NULL)
ALTER TABLE trucker.tbl_user_profile 
ADD CONSTRAINT tbl_user_profile_auth_user_id_fkey 
FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- auth_user_id unique 제약 (NULL 제외)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profile_auth_user_id 
ON trucker.tbl_user_profile(auth_user_id) WHERE auth_user_id IS NOT NULL;

-- 3. 관련 테이블의 FK 수정 (auth_user_id -> public_profile_id)
-- tbl_slots
ALTER TABLE trucker.tbl_slots DROP CONSTRAINT IF EXISTS tbl_slots_user_id_fkey;
ALTER TABLE trucker.tbl_slots 
ADD CONSTRAINT tbl_slots_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES trucker.tbl_user_profile(public_profile_id) ON DELETE CASCADE;

-- tbl_runs
ALTER TABLE trucker.tbl_runs DROP CONSTRAINT IF EXISTS tbl_runs_user_id_fkey;
ALTER TABLE trucker.tbl_runs 
ADD CONSTRAINT tbl_runs_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES trucker.tbl_user_profile(public_profile_id) ON DELETE CASCADE;

-- tbl_transactions
ALTER TABLE trucker.tbl_transactions DROP CONSTRAINT IF EXISTS tbl_transactions_user_id_fkey;
ALTER TABLE trucker.tbl_transactions 
ADD CONSTRAINT tbl_transactions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES trucker.tbl_user_profile(public_profile_id) ON DELETE CASCADE;

-- tbl_hired_drivers
ALTER TABLE trucker.tbl_hired_drivers DROP CONSTRAINT IF EXISTS tbl_hired_drivers_owner_id_fkey;
ALTER TABLE trucker.tbl_hired_drivers 
ADD CONSTRAINT tbl_hired_drivers_owner_id_fkey 
FOREIGN KEY (owner_id) REFERENCES trucker.tbl_user_profile(public_profile_id) ON DELETE CASCADE;

ALTER TABLE trucker.tbl_hired_drivers DROP CONSTRAINT IF EXISTS tbl_hired_drivers_driver_user_id_fkey;
ALTER TABLE trucker.tbl_hired_drivers 
ADD CONSTRAINT tbl_hired_drivers_driver_user_id_fkey 
FOREIGN KEY (driver_user_id) REFERENCES trucker.tbl_user_profile(public_profile_id);

-- 4. RLS 정책 업데이트 (봇 데이터도 조회 가능하도록)
DROP POLICY IF EXISTS "Users can view their own profile" ON trucker.tbl_user_profile;
DROP POLICY IF EXISTS "Users can view all profiles" ON trucker.tbl_user_profile;
DROP POLICY IF EXISTS "Public can view bot profiles" ON trucker.tbl_user_profile;

-- 본인 프로필 또는 봇 프로필 조회 가능
CREATE POLICY "Users can view profiles" ON trucker.tbl_user_profile 
FOR SELECT USING (
    auth_user_id = auth.uid() OR is_bot = true
);

-- 본인 프로필 수정 가능 (봇 제외)
DROP POLICY IF EXISTS "Users can update their own profile" ON trucker.tbl_user_profile;
CREATE POLICY "Users can update their own profile" ON trucker.tbl_user_profile 
FOR UPDATE USING (auth_user_id = auth.uid() AND is_bot = false) 
WITH CHECK (auth_user_id = auth.uid() AND is_bot = false);

-- 5. 5개 봇 프로필 생성
-- 봇 UUID를 고정값으로 생성 (재실행 시 중복 방지)
INSERT INTO trucker.tbl_user_profile (
    public_profile_id,
    auth_user_id,
    nickname,
    avatar_url,
    balance,
    reputation,
    bio,
    is_bot,
    notification_enabled
) VALUES
-- Bot Alpha: 서울 기반, 빠른 배송 전문
(
    'b0000000-0000-0000-0000-000000000001'::uuid,
    NULL,
    'Bot_Alpha',
    '/images/bot/bot_alpha.png',
    5000,
    150,
    '서울 강남권 퀵서비스 전문. 정확한 시간 준수!',
    true,
    false
),
-- Bot Beta: 부산 기반, 해안 지역 전문
(
    'b0000000-0000-0000-0000-000000000002'::uuid,
    NULL,
    'Bot_Beta',
    '/images/bot/bot_beta.png',
    4500,
    120,
    '부산 해운대~서면 루트 마스터. 바다 바람과 함께!',
    true,
    false
),
-- Bot Gamma: 대전/세종 기반, 행정구역 전문
(
    'b0000000-0000-0000-0000-000000000003'::uuid,
    NULL,
    'Bot_Gamma',
    '/images/bot/bot_gamma.png',
    4000,
    100,
    '대전-세종 행정타운 서류배송 전문가',
    true,
    false
),
-- Bot Delta: 수도권 광역, 장거리 전문
(
    'b0000000-0000-0000-0000-000000000004'::uuid,
    NULL,
    'Bot_Delta',
    '/images/bot/bot_delta.png',
    6000,
    200,
    '서울-인천-수원 광역 네트워크. 거리는 문제없다!',
    true,
    false
),
-- Bot Epsilon: 전국 순회, 유연한 배송
(
    'b0000000-0000-0000-0000-000000000005'::uuid,
    NULL,
    'Bot_Epsilon',
    '/images/bot/bot_epsilon.png',
    5500,
    180,
    '전국 어디든! 유연한 스케줄의 프리랜서 라이더',
    true,
    false
)
ON CONFLICT (public_profile_id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    is_bot = EXCLUDED.is_bot;

-- 6. 봇용 기본 슬롯 생성
INSERT INTO trucker.tbl_slots (user_id, index, is_locked)
SELECT p.public_profile_id, s.idx, false
FROM trucker.tbl_user_profile p
CROSS JOIN (VALUES (0), (1), (2)) AS s(idx)
WHERE p.is_bot = true
ON CONFLICT (user_id, index) DO NOTHING;

-- 7. 봇 관련 유틸리티 함수들

-- 봇 목록 조회
CREATE OR REPLACE FUNCTION trucker.v1_get_bots()
RETURNS SETOF trucker.tbl_user_profile
LANGUAGE sql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
    SELECT * FROM trucker.tbl_user_profile WHERE is_bot = true ORDER BY nickname;
$$;

-- 특정 봇의 가용 슬롯 조회
CREATE OR REPLACE FUNCTION trucker.get_available_bot_slot(p_bot_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_slot_id uuid;
BEGIN
    -- 활성 운행이 없는 슬롯 찾기
    SELECT s.id INTO v_slot_id
    FROM trucker.tbl_slots s
    WHERE s.user_id = p_bot_id
      AND s.is_locked = false
      AND s.active_run_id IS NULL
    ORDER BY s.index
    LIMIT 1;
    
    RETURN v_slot_id;
END;
$$;

-- 봇이 주문을 수락할 수 있는지 확인
CREATE OR REPLACE FUNCTION trucker.can_bot_accept_order(p_bot_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM trucker.tbl_slots s
        WHERE s.user_id = p_bot_id
          AND s.is_locked = false
          AND s.active_run_id IS NULL
    );
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION trucker.v1_get_bots TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION trucker.get_available_bot_slot TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION trucker.can_bot_accept_order TO anon, authenticated, service_role;

-- 8. 기존 함수 수정: handle_new_user에서 public_profile_id 사용하도록
CREATE OR REPLACE FUNCTION trucker.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $function$
DECLARE
    base_nickname TEXT;
    final_nickname TEXT;
    random_suffix TEXT;
    new_profile_id uuid;
BEGIN
    -- 1. 닉네임 생성
    base_nickname := split_part(NEW.email, '@', 1);
    IF base_nickname = '' OR base_nickname IS NULL THEN
        base_nickname := 'trucker';
    END IF;
    base_nickname := left(base_nickname, 20);
    random_suffix := floor(random() * 9000 + 1000)::text;
    final_nickname := base_nickname || '_' || random_suffix;

    -- 2. 프로필 생성 (public_profile_id 자동 생성)
    INSERT INTO trucker.tbl_user_profile (auth_user_id, nickname, is_bot)
    VALUES (NEW.id, final_nickname, false)
    RETURNING public_profile_id INTO new_profile_id;

    -- 3. 기본 슬롯 3개 생성 (public_profile_id 사용)
    INSERT INTO trucker.tbl_slots (user_id, index, is_locked) VALUES
        (new_profile_id, 0, false),
        (new_profile_id, 1, true),
        (new_profile_id, 2, true);

    RETURN NEW;
END;
$function$;

COMMENT ON TABLE trucker.tbl_user_profile IS '사용자 프로필 (봇 포함). is_bot=true이면 봇 계정, auth_user_id는 NULL';
