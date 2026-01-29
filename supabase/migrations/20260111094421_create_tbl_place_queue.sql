CREATE TABLE IF NOT EXISTS tbl_place_queue (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    business_category TEXT,
    common_address TEXT,
    address TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'STOPPED')),
    retry_count INT DEFAULT 0,
    retry_limit INT DEFAULT 5,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 테이블 및 컬럼 코멘트 추가
COMMENT ON TABLE tbl_place_queue IS '장소 데이터 수집 및 크롤링을 위한 대기열 테이블';
COMMENT ON COLUMN tbl_place_queue.id IS '장소 식별자 (네이버 플레이스 ID 등)';
COMMENT ON COLUMN tbl_place_queue.name IS '장소 명칭';
COMMENT ON COLUMN tbl_place_queue.category IS '장소 카테고리';
COMMENT ON COLUMN tbl_place_queue.business_category IS '업종 카테고리';
COMMENT ON COLUMN tbl_place_queue.common_address IS '일반 주소 (시/군/구)';
COMMENT ON COLUMN tbl_place_queue.address IS '상세 주소';
COMMENT ON COLUMN tbl_place_queue.status IS '처리 상태 (PENDING:등록, PROCESSING:처리중, SUCCESS:성공, FAILED:실패, STOPPED:중지)';
COMMENT ON COLUMN tbl_place_queue.retry_count IS '현재 재시도 횟수';
COMMENT ON COLUMN tbl_place_queue.retry_limit IS '최대 재시도 제한 횟수 (기본 5회)';
COMMENT ON COLUMN tbl_place_queue.error_message IS '실패 시 발생한 오류 메시지';
COMMENT ON COLUMN tbl_place_queue.created_at IS '생성 일시';
COMMENT ON COLUMN tbl_place_queue.updated_at IS '수정 일시';

-- updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_tbl_place_queue_updated_at') THEN
        CREATE TRIGGER update_tbl_place_queue_updated_at
            BEFORE UPDATE ON tbl_place_queue
            FOR EACH ROW
            EXECUTE PROCEDURE update_updated_at_column();
    END IF;
END $$;
