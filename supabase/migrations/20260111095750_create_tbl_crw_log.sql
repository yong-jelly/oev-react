-- 크롤링 로그 기록을 위한 테이블 생성
CREATE TABLE IF NOT EXISTS public.tbl_crw_log (
    id BIGSERIAL PRIMARY KEY,
    place_id TEXT NOT NULL,
    status TEXT NOT NULL, -- 'SUCCESS', 'FAILED'
    error_message TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_ms INT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_tbl_crw_log_place_id ON public.tbl_crw_log(place_id);
CREATE INDEX IF NOT EXISTS idx_tbl_crw_log_status ON public.tbl_crw_log(status);

-- 코멘트 추가
COMMENT ON TABLE public.tbl_crw_log IS '장소 크롤링 작업 로그 테이블';
COMMENT ON COLUMN public.tbl_crw_log.id IS '로그 식별자';
COMMENT ON COLUMN public.tbl_crw_log.place_id IS '크롤링 대상 장소 ID';
COMMENT ON COLUMN public.tbl_crw_log.status IS '크롤링 결과 상태 (SUCCESS, FAILED)';
COMMENT ON COLUMN public.tbl_crw_log.error_message IS '오류 발생 시 메시지';
COMMENT ON COLUMN public.tbl_crw_log.start_time IS '크롤링 시작 시간';
COMMENT ON COLUMN public.tbl_crw_log.end_time IS '크롤링 종료 시간';
COMMENT ON COLUMN public.tbl_crw_log.duration_ms IS '소요 시간 (밀리초)';
COMMENT ON COLUMN public.tbl_crw_log.created_at IS '기록 생성 일시';
COMMENT ON COLUMN public.tbl_crw_log.updated_at IS '기록 수정 일시';

-- updated_at 자동 갱신 트리거
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tbl_crw_log_updated_at') THEN
        CREATE TRIGGER update_tbl_crw_log_updated_at
            BEFORE UPDATE ON public.tbl_crw_log
            FOR EACH ROW
            EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;
