-- =====================================================
-- 023_create_equipment_tables.sql
-- 장비 시스템 테이블 생성 및 초기 데이터
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/023_create_equipment_tables.sql
-- =====================================================

-- =====================================================
-- 1. tbl_equipments (장비 마스터 테이블)
-- =====================================================
CREATE TABLE IF NOT EXISTS trucker.tbl_equipments (
    id text PRIMARY KEY,
    name text NOT NULL,
    description text,
    image_filename text NOT NULL,
    equipment_type text NOT NULL, -- BICYCLE, VAN, TRUCK, HEAVY_TRUCK, PLANE, SHIP
    price bigint DEFAULT 0 NOT NULL,
    base_speed float DEFAULT 15 NOT NULL, -- km/h (기본 속도)
    max_speed float DEFAULT 25 NOT NULL, -- km/h (부스트 시 최대 속도)
    max_weight float DEFAULT 10 NOT NULL, -- kg
    max_volume float DEFAULT 20 NOT NULL, -- L
    allowed_categories text[] DEFAULT ARRAY['CONVENIENCE']::text[] NOT NULL,
    is_default boolean DEFAULT false NOT NULL, -- 신규 유저 자동 지급 여부
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

COMMENT ON TABLE trucker.tbl_equipments IS '장비 마스터 테이블 - 모든 장비 정의';
COMMENT ON COLUMN trucker.tbl_equipments.id IS '장비 고유 ID (변경 불가, 유저 맵핑에 사용)';
COMMENT ON COLUMN trucker.tbl_equipments.image_filename IS '이미지 파일명 (확장자 제외, 예: basic-bicycle)';
COMMENT ON COLUMN trucker.tbl_equipments.base_speed IS '기본 속도 (km/h) - 일반 운행 시';
COMMENT ON COLUMN trucker.tbl_equipments.max_speed IS '최대 속도 (km/h) - 부스트 사용 시';
COMMENT ON COLUMN trucker.tbl_equipments.is_default IS 'true면 신규 유저에게 자동 지급';

-- =====================================================
-- 2. tbl_user_equipments (유저-장비 맵핑 테이블)
-- =====================================================
CREATE TABLE IF NOT EXISTS trucker.tbl_user_equipments (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    user_id uuid NOT NULL REFERENCES trucker.tbl_user_profile(public_profile_id) ON DELETE CASCADE,
    equipment_id text NOT NULL REFERENCES trucker.tbl_equipments(id) ON DELETE RESTRICT,
    purchased_at timestamp with time zone DEFAULT now() NOT NULL,
    is_equipped boolean DEFAULT false NOT NULL,
    UNIQUE(user_id, equipment_id)
);

COMMENT ON TABLE trucker.tbl_user_equipments IS '유저가 보유한 장비 목록';
COMMENT ON COLUMN trucker.tbl_user_equipments.user_id IS 'public_profile_id 참조';
COMMENT ON COLUMN trucker.tbl_user_equipments.is_equipped IS '현재 기본 장착 여부';

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_user_equipments_user_id ON trucker.tbl_user_equipments(user_id);

-- =====================================================
-- 3. tbl_runs에 equipment_snapshot 컬럼 추가
-- =====================================================
-- 계약 실행 시 장비 메타 정보를 스냅샷으로 저장
-- 관리자가 설정을 변경해도 진행 중인 계약에는 영향 없음
ALTER TABLE trucker.tbl_runs 
ADD COLUMN IF NOT EXISTS equipment_snapshot jsonb;

COMMENT ON COLUMN trucker.tbl_runs.equipment_snapshot IS '계약 시점의 장비 메타 정보 스냅샷 (불변)';

-- =====================================================
-- 4. 기본 장비 데이터 INSERT
-- =====================================================
INSERT INTO trucker.tbl_equipments (
    id, 
    name, 
    description, 
    image_filename, 
    equipment_type, 
    price, 
    base_speed, 
    max_speed, 
    max_weight, 
    max_volume, 
    allowed_categories, 
    is_default
) VALUES (
    'basic-bicycle',
    '기본 배달 자전거',
    '누구나 시작할 수 있는 기본 배달 수단입니다. 근거리 편의점 배송에 최적화되어 있습니다.',
    'basic-bicycle',
    'BICYCLE',
    0,
    15,
    25,
    10,
    20,
    ARRAY['CONVENIENCE']::text[],
    true
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    base_speed = EXCLUDED.base_speed,
    max_speed = EXCLUDED.max_speed,
    max_weight = EXCLUDED.max_weight,
    max_volume = EXCLUDED.max_volume,
    is_default = EXCLUDED.is_default,
    updated_at = now();

-- =====================================================
-- 5. handle_new_user() 트리거 수정
-- 신규 유저에게 기본 장비 자동 지급
-- =====================================================
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
    new_public_profile_id uuid;
    default_equipment RECORD;
BEGIN
    -- 1. 닉네임 생성
    base_nickname := split_part(NEW.email, '@', 1);
    IF base_nickname = '' OR base_nickname IS NULL THEN
        base_nickname := 'trucker';
    END IF;
    base_nickname := left(base_nickname, 20);
    random_suffix := floor(random() * 9000 + 1000)::text;
    final_nickname := base_nickname || '_' || random_suffix;

    -- 2. 프로필 생성 및 public_profile_id 획득
    INSERT INTO trucker.tbl_user_profile (auth_user_id, nickname)
    VALUES (NEW.id, final_nickname)
    RETURNING public_profile_id INTO new_public_profile_id;

    -- 3. 기본 슬롯 3개 생성 (첫 번째만 해금)
    INSERT INTO trucker.tbl_slots (user_id, index, is_locked) VALUES
        (NEW.id, 0, false),
        (NEW.id, 1, true),
        (NEW.id, 2, true);

    -- 4. 기본 장비 자동 지급 (is_default = true인 장비들)
    FOR default_equipment IN 
        SELECT id FROM trucker.tbl_equipments WHERE is_default = true AND is_active = true
    LOOP
        INSERT INTO trucker.tbl_user_equipments (user_id, equipment_id, is_equipped)
        VALUES (new_public_profile_id, default_equipment.id, true)
        ON CONFLICT (user_id, equipment_id) DO NOTHING;
    END LOOP;

    RETURN NEW;
END;
$function$;

-- =====================================================
-- 6. 기존 유저들에게 기본 장비 마이그레이션
-- =====================================================
-- 기존 유저 중 basic-bicycle을 보유하지 않은 유저에게 자동 지급
INSERT INTO trucker.tbl_user_equipments (user_id, equipment_id, is_equipped)
SELECT 
    p.public_profile_id,
    'basic-bicycle',
    true
FROM trucker.tbl_user_profile p
WHERE NOT EXISTS (
    SELECT 1 FROM trucker.tbl_user_equipments ue 
    WHERE ue.user_id = p.public_profile_id AND ue.equipment_id = 'basic-bicycle'
)
ON CONFLICT (user_id, equipment_id) DO NOTHING;

-- =====================================================
-- 7. RLS 정책
-- =====================================================
ALTER TABLE trucker.tbl_equipments ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucker.tbl_user_equipments ENABLE ROW LEVEL SECURITY;

-- 장비 마스터: 모든 사용자 조회 가능
CREATE POLICY "Anyone can view equipments" ON trucker.tbl_equipments 
    FOR SELECT USING (true);

-- 유저 장비: 본인 것만 조회 가능
CREATE POLICY "Users can view their own equipments" ON trucker.tbl_user_equipments 
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM trucker.tbl_user_profile p 
            WHERE p.public_profile_id = user_id AND p.auth_user_id = auth.uid()
        )
    );

-- =====================================================
-- 8. 권한 부여
-- =====================================================
GRANT SELECT ON trucker.tbl_equipments TO anon, authenticated;
GRANT SELECT ON trucker.tbl_user_equipments TO authenticated;
