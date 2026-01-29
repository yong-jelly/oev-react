-- tbl_place_queue 테이블에 디버깅용 컬럼 추가
ALTER TABLE tbl_place_queue 
ADD COLUMN IF NOT EXISTS error_step TEXT,
ADD COLUMN IF NOT EXISTS error_context TEXT,
ADD COLUMN IF NOT EXISTS error_fn TEXT,
ADD COLUMN IF NOT EXISTS error_share_id TEXT,
ADD COLUMN IF NOT EXISTS error_full_url TEXT;
