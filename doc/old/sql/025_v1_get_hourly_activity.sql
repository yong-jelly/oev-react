-- =====================================================
-- 025_v1_get_hourly_activity.sql
-- 시간대별 활동 통계 조회 API
-- =====================================================

-- 시간대별 활동 반환 타입
DROP TYPE IF EXISTS trucker.hourly_activity CASCADE;
CREATE TYPE trucker.hourly_activity AS (
    hour integer,      -- 0-23
    runs_count integer,
    earnings bigint,
    level integer      -- 0-4 (상대적 강도)
);

-- 시간대별 활동 조회 함수
CREATE OR REPLACE FUNCTION trucker.v1_get_hourly_activity(p_user_id uuid DEFAULT NULL)
RETURNS SETOF trucker.hourly_activity
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_max_runs integer;
BEGIN
    -- 최대 운행 수 계산 (레벨 산정용)
    SELECT MAX(hourly_runs) INTO v_max_runs
    FROM (
        SELECT COUNT(*) as hourly_runs
        FROM trucker.tbl_runs r
        WHERE (p_user_id IS NULL OR r.user_id = p_user_id)
          AND r.status = 'COMPLETED'
          AND r.completed_at >= now() - interval '30 days' -- 최근 30일 데이터 기준
        GROUP BY EXTRACT(HOUR FROM r.completed_at AT TIME ZONE 'Asia/Seoul')
    ) hourly;
    
    IF v_max_runs IS NULL OR v_max_runs = 0 THEN
        v_max_runs := 1;
    END IF;

    RETURN QUERY
    WITH hour_series AS (
        SELECT generate_series(0, 23) as hour
    ),
    hourly_stats AS (
        SELECT 
            EXTRACT(HOUR FROM r.completed_at AT TIME ZONE 'Asia/Seoul')::integer as activity_hour,
            COUNT(*) as runs_count,
            COALESCE(SUM(r.current_reward), 0) as earnings
        FROM trucker.tbl_runs r
        WHERE (p_user_id IS NULL OR r.user_id = p_user_id)
          AND r.status = 'COMPLETED'
          AND r.completed_at >= now() - interval '30 days'
        GROUP BY EXTRACT(HOUR FROM r.completed_at AT TIME ZONE 'Asia/Seoul')
    )
    SELECT 
        hs.hour,
        COALESCE(ha.runs_count, 0)::integer,
        COALESCE(ha.earnings, 0)::bigint,
        CASE 
            WHEN COALESCE(ha.runs_count, 0) = 0 THEN 0
            WHEN ha.runs_count <= v_max_runs * 0.25 THEN 1
            WHEN ha.runs_count <= v_max_runs * 0.5 THEN 2
            WHEN ha.runs_count <= v_max_runs * 0.75 THEN 3
            ELSE 4
        END::integer as level
    FROM hour_series hs
    LEFT JOIN hourly_stats ha ON hs.hour = ha.activity_hour
    ORDER BY hs.hour;
END;
$$;

GRANT EXECUTE ON FUNCTION trucker.v1_get_hourly_activity TO anon, authenticated, service_role;
COMMENT ON FUNCTION trucker.v1_get_hourly_activity IS '시간대별 활동 통계 (24시간, 최근 30일 기준)';
