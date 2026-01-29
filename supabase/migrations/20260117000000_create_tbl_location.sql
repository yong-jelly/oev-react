-- tbl_location 테이블 생성
CREATE TABLE IF NOT EXISTS public.tbl_location (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS 설정
ALTER TABLE public.tbl_location ENABLE ROW LEVEL SECURITY;

-- 자신의 위치 기록만 조회/추가 가능하도록 정책 설정
CREATE POLICY "Users can insert their own locations" ON public.tbl_location
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own locations" ON public.tbl_location
    FOR SELECT USING (auth.uid() = user_id);

-- index 생성
CREATE INDEX idx_tbl_location_user_id ON public.tbl_location(user_id);
CREATE INDEX idx_tbl_location_created_at ON public.tbl_location(created_at);
