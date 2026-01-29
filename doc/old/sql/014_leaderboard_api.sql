-- =====================================================
-- 014_leaderboard_api.sql
-- 랭킹, 활동 조회, 실시간 운행 API
-- 
-- 기능:
--   1. 전체 랭킹 조회 (봇 + 유저)
--   2. 실시간 활성 운행 조회 (전체 공개)
--   3. 데일리 활동 히트맵 데이터
--   4. 거래 내역 조회
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/014_leaderboard_api.sql
-- =====================================================

-- 1. 리더보드용 반환 타입 정의
DROP TYPE IF EXISTS trucker.leaderboard_entry CASCADE;
CREATE TYPE trucker.leaderboard_entry AS (
    rank integer,
    user_id uuid,
    nickname text,
    avatar_url text,
    is_bot boolean,
    balance bigint,
    reputation integer,
    total_runs integer,
    total_earnings bigint,
    period_earnings bigint,
    bot_status text,
    bot_next_available_at timestamp with time zone
);

-- 2. 전체 랭킹 조회 (period: 'all', 'weekly', 'daily')
CREATE OR REPLACE FUNCTION trucker.v1_get_leaderboard(p_period text DEFAULT 'weekly')
RETURNS SETOF trucker.leaderboard_entry
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_start_date timestamp with time zone;
BEGIN
    -- 기간 설정
    CASE p_period
        WHEN 'daily' THEN v_start_date := date_trunc('day', now());
        WHEN 'weekly' THEN v_start_date := date_trunc('week', now());
        WHEN 'monthly' THEN v_start_date := date_trunc('month', now());
        ELSE v_start_date := '1970-01-01'::timestamp with time zone;  -- all time
    END CASE;

    RETURN QUERY
    WITH user_stats AS (
        SELECT 
            u.public_profile_id,
            u.nickname,
            u.avatar_url,
            u.is_bot,
            u.balance,
            u.reputation,
            (SELECT COUNT(*)::integer FROM trucker.tbl_runs r WHERE r.user_id = u.public_profile_id AND r.status = 'COMPLETED') as total_runs,
            COALESCE((SELECT SUM(t.amount) FROM trucker.tbl_transactions t WHERE t.user_id = u.public_profile_id AND t.type = 'REWARD'), 0)::bigint as total_earnings,
            COALESCE((SELECT SUM(t.amount) FROM trucker.tbl_transactions t WHERE t.user_id = u.public_profile_id AND t.type = 'REWARD' AND t.created_at >= v_start_date), 0)::bigint as period_earnings,
            -- 봇 상태: 봇이지만 tbl_bot_status에 레코드가 없으면 기본값 'IDLE' 반환
            CASE 
                WHEN u.is_bot THEN COALESCE(bs.status, 'IDLE')
                ELSE NULL
            END as bot_status,
            bs.next_available_at as bot_next_available_at
        FROM trucker.tbl_user_profile u
        LEFT JOIN trucker.tbl_bot_status bs ON u.public_profile_id = bs.bot_id
    )
    SELECT 
        ROW_NUMBER() OVER (ORDER BY period_earnings DESC, reputation DESC, total_runs DESC)::integer as rank,
        public_profile_id as user_id,
        nickname,
        avatar_url,
        is_bot,
        balance,
        reputation,
        total_runs,
        total_earnings,
        period_earnings,
        bot_status,
        bot_next_available_at
    FROM user_stats
    ORDER BY period_earnings DESC, reputation DESC, total_runs DESC
    LIMIT 100;
END;
$$;

-- 3. 실시간 활성 운행 조회 (전체 공개)
DROP TYPE IF EXISTS trucker.active_run_entry CASCADE;
CREATE TYPE trucker.active_run_entry AS (
    run_id uuid,
    user_id uuid,
    nickname text,
    avatar_url text,
    is_bot boolean,
    order_title text,
    cargo_name text,
    start_lat float,
    start_lng float,
    end_lat float,
    end_lng float,
    distance float,
    current_reward bigint,
    status text,
    start_at timestamp with time zone,
    eta_seconds integer,
    deadline_at timestamp with time zone,
    progress_percent float
);

CREATE OR REPLACE FUNCTION trucker.v1_get_all_active_runs()
RETURNS SETOF trucker.active_run_entry
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as run_id,
        u.public_profile_id as user_id,
        u.nickname,
        u.avatar_url,
        u.is_bot,
        o.title as order_title,
        o.cargo_name,
        o.start_lat,
        o.start_lng,
        o.end_lat,
        o.end_lng,
        o.distance,
        r.current_reward,
        r.status,
        r.start_at,
        r.eta_seconds,
        r.deadline_at,
        -- 진행률 계산 (0-100%)
        LEAST(100, 
            EXTRACT(EPOCH FROM (now() - r.start_at)) / NULLIF(r.eta_seconds, 0) * 100
        )::float as progress_percent
    FROM trucker.tbl_runs r
    JOIN trucker.tbl_user_profile u ON r.user_id = u.public_profile_id
    JOIN trucker.tbl_orders o ON r.order_id = o.id
    WHERE r.status = 'IN_TRANSIT'
    ORDER BY r.start_at DESC;
END;
$$;

-- 4. 최근 완료된 운행 조회 (최근 24시간)
CREATE OR REPLACE FUNCTION trucker.v1_get_recent_completed_runs(p_limit integer DEFAULT 20)
RETURNS SETOF trucker.active_run_entry
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        r.id as run_id,
        u.public_profile_id as user_id,
        u.nickname,
        u.avatar_url,
        u.is_bot,
        o.title as order_title,
        o.cargo_name,
        o.start_lat,
        o.start_lng,
        o.end_lat,
        o.end_lng,
        o.distance,
        r.current_reward,
        r.status,
        r.start_at,
        r.eta_seconds,
        r.deadline_at,
        100.0::float as progress_percent
    FROM trucker.tbl_runs r
    JOIN trucker.tbl_user_profile u ON r.user_id = u.public_profile_id
    JOIN trucker.tbl_orders o ON r.order_id = o.id
    WHERE r.status = 'COMPLETED'
      AND r.completed_at >= now() - interval '24 hours'
    ORDER BY r.completed_at DESC
    LIMIT p_limit;
END;
$$;

-- 5. 데일리 활동 히트맵 (GitHub 스타일 - 최근 365일)
DROP TYPE IF EXISTS trucker.activity_day CASCADE;
CREATE TYPE trucker.activity_day AS (
    date date,
    runs_count integer,
    earnings bigint,
    level integer  -- 0: 없음, 1: 낮음, 2: 중간, 3: 높음, 4: 매우 높음
);

CREATE OR REPLACE FUNCTION trucker.v1_get_activity_heatmap(p_user_id uuid DEFAULT NULL)
RETURNS SETOF trucker.activity_day
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_max_runs integer;
BEGIN
    -- 최대 운행 수 계산 (레벨 산정용)
    SELECT MAX(daily_runs) INTO v_max_runs
    FROM (
        SELECT COUNT(*) as daily_runs
        FROM trucker.tbl_runs r
        WHERE (p_user_id IS NULL OR r.user_id = p_user_id)
          AND r.status = 'COMPLETED'
          AND r.completed_at >= now() - interval '365 days'
        GROUP BY date_trunc('day', r.completed_at)
    ) daily;
    
    IF v_max_runs IS NULL OR v_max_runs = 0 THEN
        v_max_runs := 1;
    END IF;

    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            date_trunc('day', now() - interval '364 days'),
            date_trunc('day', now()),
            interval '1 day'
        )::date as date
    ),
    daily_activity AS (
        SELECT 
            date_trunc('day', r.completed_at)::date as activity_date,
            COUNT(*) as runs_count,
            COALESCE(SUM(r.current_reward), 0) as earnings
        FROM trucker.tbl_runs r
        WHERE (p_user_id IS NULL OR r.user_id = p_user_id)
          AND r.status = 'COMPLETED'
          AND r.completed_at >= now() - interval '365 days'
        GROUP BY date_trunc('day', r.completed_at)
    )
    SELECT 
        ds.date,
        COALESCE(da.runs_count, 0)::integer,
        COALESCE(da.earnings, 0)::bigint,
        CASE 
            WHEN COALESCE(da.runs_count, 0) = 0 THEN 0
            WHEN da.runs_count <= v_max_runs * 0.25 THEN 1
            WHEN da.runs_count <= v_max_runs * 0.5 THEN 2
            WHEN da.runs_count <= v_max_runs * 0.75 THEN 3
            ELSE 4
        END::integer as level
    FROM date_series ds
    LEFT JOIN daily_activity da ON ds.date = da.activity_date
    ORDER BY ds.date;
END;
$$;

-- 6. 거래 내역 조회 (페이지네이션 지원)
DROP TYPE IF EXISTS trucker.transaction_entry CASCADE;
CREATE TYPE trucker.transaction_entry AS (
    id uuid,
    user_id uuid,
    nickname text,
    avatar_url text,
    is_bot boolean,
    run_id uuid,
    order_title text,
    type text,
    amount bigint,
    balance_after bigint,
    description text,
    created_at timestamp with time zone
);

CREATE OR REPLACE FUNCTION trucker.v1_get_transactions(
    p_user_id uuid DEFAULT NULL,
    p_limit integer DEFAULT 50,
    p_offset integer DEFAULT 0,
    p_include_bots boolean DEFAULT true
)
RETURNS SETOF trucker.transaction_entry
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        u.public_profile_id as user_id,
        u.nickname,
        u.avatar_url,
        u.is_bot,
        t.run_id,
        COALESCE(o.title, '') as order_title,
        t.type,
        t.amount,
        t.balance_after,
        t.description,
        t.created_at
    FROM trucker.tbl_transactions t
    JOIN trucker.tbl_user_profile u ON t.user_id = u.public_profile_id
    LEFT JOIN trucker.tbl_runs r ON t.run_id = r.id
    LEFT JOIN trucker.tbl_orders o ON r.order_id = o.id
    WHERE (p_user_id IS NULL OR t.user_id = p_user_id)
      AND (p_include_bots = true OR u.is_bot = false)
    ORDER BY t.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- 7. 통계 요약 조회 (대시보드용)
DROP TYPE IF EXISTS trucker.stats_summary CASCADE;
CREATE TYPE trucker.stats_summary AS (
    total_users integer,
    total_bots integer,
    active_runs integer,
    completed_runs_today integer,
    total_earnings_today bigint,
    top_earner_nickname text,
    top_earner_earnings bigint
);

CREATE OR REPLACE FUNCTION trucker.v1_get_stats_summary()
RETURNS trucker.stats_summary
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_result trucker.stats_summary;
BEGIN
    -- 총 사용자 수
    SELECT COUNT(*) INTO v_result.total_users 
    FROM trucker.tbl_user_profile WHERE is_bot = false;
    
    -- 총 봇 수
    SELECT COUNT(*) INTO v_result.total_bots 
    FROM trucker.tbl_user_profile WHERE is_bot = true;
    
    -- 현재 활성 운행 수
    SELECT COUNT(*) INTO v_result.active_runs 
    FROM trucker.tbl_runs WHERE status = 'IN_TRANSIT';
    
    -- 오늘 완료된 운행 수
    SELECT COUNT(*) INTO v_result.completed_runs_today 
    FROM trucker.tbl_runs 
    WHERE status = 'COMPLETED' 
      AND completed_at >= date_trunc('day', now());
    
    -- 오늘 총 수익
    SELECT COALESCE(SUM(amount), 0) INTO v_result.total_earnings_today
    FROM trucker.tbl_transactions
    WHERE type = 'REWARD'
      AND created_at >= date_trunc('day', now());
    
    -- 오늘의 최고 수익자
    SELECT u.nickname, COALESCE(SUM(t.amount), 0)
    INTO v_result.top_earner_nickname, v_result.top_earner_earnings
    FROM trucker.tbl_user_profile u
    LEFT JOIN trucker.tbl_transactions t ON t.user_id = u.public_profile_id
      AND t.type = 'REWARD'
      AND t.created_at >= date_trunc('day', now())
    GROUP BY u.public_profile_id, u.nickname
    ORDER BY COALESCE(SUM(t.amount), 0) DESC
    LIMIT 1;
    
    RETURN v_result;
END;
$$;

-- 8. RLS 정책 업데이트 (봇 데이터 공개 조회)
DROP POLICY IF EXISTS "Anyone can view runs" ON trucker.tbl_runs;
CREATE POLICY "Anyone can view runs" ON trucker.tbl_runs
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can view transactions" ON trucker.tbl_transactions;
CREATE POLICY "Anyone can view transactions" ON trucker.tbl_transactions
FOR SELECT USING (true);

-- 권한 부여
GRANT EXECUTE ON FUNCTION trucker.v1_get_leaderboard TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION trucker.v1_get_all_active_runs TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION trucker.v1_get_recent_completed_runs TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION trucker.v1_get_activity_heatmap TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION trucker.v1_get_transactions TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION trucker.v1_get_stats_summary TO anon, authenticated, service_role;

COMMENT ON FUNCTION trucker.v1_get_leaderboard IS '전체 랭킹 조회 (봇 + 유저), period: all/weekly/daily/monthly';
COMMENT ON FUNCTION trucker.v1_get_all_active_runs IS '실시간 활성 운행 목록 조회';
COMMENT ON FUNCTION trucker.v1_get_recent_completed_runs IS '최근 완료된 운행 목록 (24시간)';
COMMENT ON FUNCTION trucker.v1_get_activity_heatmap IS '활동 히트맵 데이터 (GitHub 스타일, 365일)';
COMMENT ON FUNCTION trucker.v1_get_transactions IS '거래 내역 조회 (페이지네이션)';
COMMENT ON FUNCTION trucker.v1_get_stats_summary IS '통계 요약 (대시보드용)';
