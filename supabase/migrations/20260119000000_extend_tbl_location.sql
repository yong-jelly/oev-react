-- tbl_location 테이블 확장
-- 가장 가까운 음식점 정보를 저장하기 위한 컬럼 추가

ALTER TABLE public.tbl_location 
ADD COLUMN IF NOT EXISTS nearest_place_id VARCHAR,
ADD COLUMN IF NOT EXISTS nearest_place_name VARCHAR,
ADD COLUMN IF NOT EXISTS nearest_place_address VARCHAR,
ADD COLUMN IF NOT EXISTS distance_meters DOUBLE PRECISION;

-- 인덱스 추가 (조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_tbl_location_nearest_place_id ON public.tbl_location(nearest_place_id);
