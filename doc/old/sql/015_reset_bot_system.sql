-- =====================================================
-- 015_reset_bot_system.sql
-- 봇 시스템 리셋 및 관리자 설정/상태 테이블 생성
-- 
-- 기능:
--   1. 관리자 설정 테이블 생성 (tbl_admin_config)
--   2. 봇 상태 테이블 생성 (tbl_bot_status)
--   3. 봇 데이터 초기화 (슬롯 1개 제한, 데이터 리셋)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/015_reset_bot_system.sql
-- =====================================================

-- 1. 관리자 설정 테이블 생성
CREATE TABLE IF NOT EXISTS trucker.tbl_admin_config (
    key text PRIMARY KEY,
    value jsonb NOT NULL,
    description text,
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE trucker.tbl_admin_config IS '시스템 전역 설정 (봇, 단속 등)';

-- 초기 설정값 삽입 (없을 경우에만)
INSERT INTO trucker.tbl_admin_config (key, value, description) VALUES
    ('bot_rest_min_minutes', '10'::jsonb, '봇 최소 휴식 시간 (분)'),
    ('bot_rest_max_minutes', '60'::jsonb, '봇 최대 휴식 시간 (분)'),
    ('bot_accept_probability', '0.5'::jsonb, '봇 주문 수락 확률 (0~1)'),
    ('enforcement_base_rate', '10'::jsonb, '기본 단속 확률 (%)')
ON CONFLICT (key) DO NOTHING;

-- 2. 봇 상태 테이블 생성
CREATE TABLE IF NOT EXISTS trucker.tbl_bot_status (
    bot_id uuid PRIMARY KEY REFERENCES trucker.tbl_user_profile(public_profile_id) ON DELETE CASCADE,
    status text DEFAULT 'IDLE',  -- IDLE, DELIVERING, RESTING
    current_run_id uuid,
    last_completed_at timestamptz,
    next_available_at timestamptz,  -- 휴식 종료 시간
    total_deliveries integer DEFAULT 0,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

COMMENT ON TABLE trucker.tbl_bot_status IS '봇 실시간 상태 및 휴식 관리';

-- 3. 봇 데이터 초기화 함수
CREATE OR REPLACE FUNCTION trucker.reset_bot_system()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_bot RECORD;
BEGIN
    -- 3.1 봇들의 진행 중인 운행 및 관련 데이터 삭제
    -- 봇 ID 목록 조회
    FOR v_bot IN SELECT public_profile_id FROM trucker.tbl_user_profile WHERE is_bot = true
    LOOP
        -- 봇의 모든 운행 삭제 (CASCADE로 event_logs 등도 삭제됨)
        DELETE FROM trucker.tbl_runs WHERE user_id = v_bot.public_profile_id;
        
        -- 봇의 모든 거래 내역 삭제
        DELETE FROM trucker.tbl_transactions WHERE user_id = v_bot.public_profile_id;
        
        -- 봇의 슬롯 초기화 (모두 삭제 후 1개만 생성)
        DELETE FROM trucker.tbl_slots WHERE user_id = v_bot.public_profile_id;
        
        INSERT INTO trucker.tbl_slots (user_id, index, is_locked) VALUES
            (v_bot.public_profile_id, 0, false);
            
        -- 봇 프로필 초기화 (잔액, 평판)
        UPDATE trucker.tbl_user_profile
        SET 
            balance = CASE 
                WHEN nickname = 'Bot_Alpha' THEN 5000
                WHEN nickname = 'Bot_Beta' THEN 4500
                WHEN nickname = 'Bot_Gamma' THEN 4000
                WHEN nickname = 'Bot_Delta' THEN 6000
                WHEN nickname = 'Bot_Epsilon' THEN 5500
                ELSE 5000 
            END,
            reputation = CASE 
                WHEN nickname = 'Bot_Alpha' THEN 150
                WHEN nickname = 'Bot_Beta' THEN 120
                WHEN nickname = 'Bot_Gamma' THEN 100
                WHEN nickname = 'Bot_Delta' THEN 200
                WHEN nickname = 'Bot_Epsilon' THEN 180
                ELSE 100
            END
        WHERE public_profile_id = v_bot.public_profile_id;
        
        -- 봇 상태 초기화
        INSERT INTO trucker.tbl_bot_status (bot_id, status, next_available_at)
        VALUES (v_bot.public_profile_id, 'IDLE', now())
        ON CONFLICT (bot_id) 
        DO UPDATE SET 
            status = 'IDLE',
            current_run_id = NULL,
            last_completed_at = NULL,
            next_available_at = now(),
            total_deliveries = 0;
    END LOOP;
END;
$$;

-- 4. 초기화 실행
SELECT trucker.reset_bot_system();

-- 5. RLS 정책 추가
ALTER TABLE trucker.tbl_admin_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucker.tbl_bot_status ENABLE ROW LEVEL SECURITY;

-- 관리자 설정: 누구나 읽기 가능 (설정값 확인용), 쓰기는 service_role만 (또는 관리자)
CREATE POLICY "Anyone can view admin config" ON trucker.tbl_admin_config
    FOR SELECT USING (true);

-- 봇 상태: 누구나 읽기 가능, 쓰기는 service_role만
CREATE POLICY "Anyone can view bot status" ON trucker.tbl_bot_status
    FOR SELECT USING (true);

-- 권한 부여
GRANT SELECT ON trucker.tbl_admin_config TO anon, authenticated, service_role;
GRANT SELECT ON trucker.tbl_bot_status TO anon, authenticated, service_role;
