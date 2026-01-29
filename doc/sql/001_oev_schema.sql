-- =====================================================
-- 001_oev_schema.sql
-- OEV(Omniscient Earth View) 서비스의 핵심 스키마 및 테이블 정의
-- 
-- 기능:
--   - oev 스키마 생성
--   - events(사건/이슈), event_sources(뉴스/출처), event_categories(카테고리) 테이블 생성
--   - 지리적 정보 처리를 위한 PostGIS 확장 확인 (필요 시)
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/001_oev_schema.sql
-- =====================================================

-- 1. 스키마 생성 및 설정
CREATE SCHEMA IF NOT EXISTS oev;
COMMENT ON SCHEMA oev IS 'Omniscient Earth View 핵심 데이터 스키마';

-- 데이터베이스 시간대 설정 (KST)
ALTER DATABASE postgres SET timezone TO 'Asia/Seoul';

-- 2. 카테고리 테이블
CREATE TABLE IF NOT EXISTS oev.event_categories (
    id TEXT PRIMARY KEY, -- 'disaster', 'accident', 'conflict', 'politics', 'industry', 'health', 'culture' 등
    name_ko TEXT NOT NULL,
    name_en TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    color_code TEXT, -- 지도 마커 색상
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE oev.event_categories IS '사건 카테고리 정의 테이블';

-- 초기 카테고리 데이터 삽입
INSERT INTO oev.event_categories (id, name_ko, name_en, color_code) VALUES
('disaster', '재난', 'Disaster', '#FF4D4F'),
('accident', '사건사고', 'Accident', '#FFA940'),
('conflict', '분쟁/테러', 'Conflict/Terror', '#722ED1'),
('politics', '정치/외교', 'Politics/Diplomacy', '#1890FF'),
('industry', '산업/기술', 'Industry/Tech', '#52C41A'),
('health', '보건', 'Health', '#FADB14'),
('culture', '문화/엔터', 'Culture/Ent', '#EB2F96')
ON CONFLICT (id) DO NOTHING;

-- 3. 이벤트(사건) 테이블
-- 여러 뉴스 소스가 하나의 이벤트로 묶일 수 있음
CREATE TABLE IF NOT EXISTS oev.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id TEXT REFERENCES oev.event_categories(id),
    title_ko TEXT NOT NULL,
    title_en TEXT,
    summary_ko TEXT,
    summary_en TEXT,
    
    -- 위치 정보
    location_name_ko TEXT,
    location_name_en TEXT,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    geom GEOMETRY(Point, 4326), -- PostGIS 공간 인덱싱용 (선택 사항)
    
    -- 시간 정보
    occurrence_at TIMESTAMPTZ NOT NULL DEFAULT now(), -- 실제 사건 발생 시각
    
    -- 메타데이터
    importance_score INT DEFAULT 0, -- 중요도/확산도 (0~100)
    status TEXT DEFAULT 'active', -- active, closed, archived
    tags TEXT[], -- 추가 태그
    
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_category ON oev.events(category_id);
CREATE INDEX IF NOT EXISTS idx_events_occurrence_at ON oev.events(occurrence_at);
CREATE INDEX IF NOT EXISTS idx_events_location ON oev.events USING GIST (geom);

COMMENT ON TABLE oev.events IS '지구본에 표시될 핵심 사건(Entity) 테이블';

-- 4. 이벤트 소스(뉴스/기사) 테이블
CREATE TABLE IF NOT EXISTS oev.event_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES oev.events(id) ON DELETE CASCADE,
    source_name TEXT NOT NULL, -- 언론사명, 기관명 등
    source_url TEXT NOT NULL,
    original_title TEXT,
    original_content TEXT,
    published_at TIMESTAMPTZ,
    
    language_code TEXT DEFAULT 'en',
    is_primary BOOLEAN DEFAULT false, -- 대표 소스 여부
    
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_sources_event_id ON oev.event_sources(event_id);

COMMENT ON TABLE oev.event_sources IS '사건과 연관된 개별 뉴스 및 출처 정보';

-- 5. 타임라인/업데이트 테이블 (사건의 진행 상황)
CREATE TABLE IF NOT EXISTS oev.event_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES oev.events(id) ON DELETE CASCADE,
    content_ko TEXT NOT NULL,
    content_en TEXT,
    update_type TEXT DEFAULT 'update', -- start, update, end
    occurrence_at TIMESTAMPTZ DEFAULT now(),
    
    created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE oev.event_updates IS '특정 사건의 시간순 진행 상황(타임라인)';

-- 6. 보안 설정 (RLS)
ALTER TABLE oev.event_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE oev.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE oev.event_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE oev.event_updates ENABLE ROW LEVEL SECURITY;

-- 모든 사용자(익명 포함) 조회 가능 정책
CREATE POLICY "Allow public read access on event_categories" ON oev.event_categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access on events" ON oev.events FOR SELECT USING (true);
CREATE POLICY "Allow public read access on event_sources" ON oev.event_sources FOR SELECT USING (true);
CREATE POLICY "Allow public read access on event_updates" ON oev.event_updates FOR SELECT USING (true);

-- 관리자(authenticated)만 수정 가능 (필요 시 확장)
-- GRANT ALL ON ALL TABLES IN SCHEMA oev TO authenticated;
-- GRANT SELECT ON ALL TABLES IN SCHEMA oev TO anon;
