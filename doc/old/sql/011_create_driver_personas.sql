-- =====================================================
-- 011_create_driver_personas.sql
-- 드라이버 페르소나 및 능력치 테이블 생성 및 초기 데이터 삽입
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/011_create_driver_personas.sql
-- =====================================================

-- 1. 드라이버 페르소나 테이블 생성
CREATE TABLE IF NOT EXISTS trucker.tbl_driver_personas (
    id text NOT NULL PRIMARY KEY,
    name text NOT NULL,
    avatar_filename text NOT NULL,
    appearance text NOT NULL,
    bio text NOT NULL,
    archetype text NOT NULL,
    age text NOT NULL,
    outfit text NOT NULL,
    palette text NOT NULL,
    prop text NOT NULL,
    mood text NOT NULL,
    shot text NOT NULL,
    base_commission_min integer NOT NULL,
    base_commission_max integer NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tbl_driver_personas_commission_check CHECK (base_commission_min >= 0 AND base_commission_max >= base_commission_min AND base_commission_max <= 100)
);

-- 2. 드라이버 능력치 테이블 생성
CREATE TABLE IF NOT EXISTS trucker.tbl_driver_stats (
    id uuid DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
    persona_id text NOT NULL REFERENCES trucker.tbl_driver_personas(id) ON DELETE CASCADE,
    label text NOT NULL,
    value text NOT NULL,
    description text,
    display_order integer NOT NULL DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 3. tbl_hired_drivers 테이블에 persona_id 컬럼 추가
ALTER TABLE trucker.tbl_hired_drivers 
ADD COLUMN IF NOT EXISTS persona_id text REFERENCES trucker.tbl_driver_personas(id) ON DELETE SET NULL;

-- 4. 초기 데이터 삽입: 드라이버 페르소나
INSERT INTO trucker.tbl_driver_personas (id, name, avatar_filename, appearance, bio, archetype, age, outfit, palette, prop, mood, shot, base_commission_min, base_commission_max) VALUES
('jack-harlow', 'Jack Harlow', '01_jack_harlow.png', '햇볕에 탄 피부, 짧게 친 금발, 턱선이 각진 얼굴, 거친 손등(오일 자국), 한쪽 눈썹에 작은 흉터.', '"화물차+개조밴" 전문 트럭커 출신. 야간 장거리 운행으로 도시 외곽 루트를 머릿속에 외운 타입, 말수는 적지만 약속은 지킨다.', '트럭커', '30대', '가죽 재킷', '올리브 그린+크림+브라운', '장갑', '무뚝뚝한 자신감', '전신 정면(모델시트 느낌)', 20, 35),
('victor-kane', 'Victor Kane', '02_victor_kane.png', '검은 포마드 헤어, 콧대가 높고 매서운 눈, 목에 오래된 이어피스 자국, 탄탄한 체격.', '전직 레이서(서킷) → 불법 ''야간 테스트 드라이버''로 전향. 코너 진입이 과감하지만, 차량을 "망가뜨리지 않는 선"을 끝까지 지키는 프로.', '전직 레이서', '20대 후반', '비행 재킷', '네이비+오프화이트+레드(포인트)', '헬멧', '여유있는 미소', '허리 위 샷', 25, 45),
('maya-reed', 'Maya Reed', '03_maya_reed.png', '짙은 갈색 단발, 도톰한 입술과 단단한 턱, 팔에 얇은 흉터 몇 개(정비 작업 흔적), 기름때가 스민 손목밴드.', '항공정비사 출신의 "정확도 집착형" 드라이버. 위험을 싫어하는 게 아니라, 위험을 수치로 환산해서 제거하는 타입.', '항공정비사', '30대', '정비 점프수트', '차콜+스틸 블루+오프화이트', '툴백', '피곤하지만 강한 눈빛', '전신 정면(모델시트 느낌)', 22, 38),
('serena-holt', 'Serena Holt', '04_serena_holt.png', '웨이브 긴 머리(묶어서 정리), 시원한 이마와 똑바른 눈매, 군더더기 없는 체형, 귀에 작은 금속 이어커프.', '해운 선장 집안에서 자라 "항로/기상/규정"에 강함. 도심 운전도 항해처럼 운영해서 팀에게 안정감을 준다.', '해운 선장', '20대 후반', '해군 코트', '딥 네이비+오프화이트+골드(소량)', '지도', '무뚝뚝한 자신감', '허리 위 샷', 18, 30),
('rowan-vale', 'Rowan Vale', '05_rowan_vale.png', '중성적인 실루엣, 긴 앞머리로 한쪽 눈을 살짝 가림, 창백한 피부에 다크서클, 얇은 장갑을 늘 착용.', '용병 파일럿(드론/경량 비행체) 출신. 말투는 조용하지만 상황 판단이 빠르고, "탈출 루트"를 먼저 그린 뒤 움직인다.', '용병 파일럿', '30대', '비행 재킷', '슬레이트 그레이+오프화이트+시안(포인트)', '고글', '피곤하지만 강한 눈빛', '전신 정면(모델시트 느낌)', 28, 50),
('eli-park', 'Eli Park', '06_eli_park.png', '마른 체형, 헝클어진 흑발, 큰 눈(하지만 결의가 있음), 무릎에 보호대 자국, 운동화 끈을 늘 꽉 묶음.', '배달/퀵 라이더로 시작해 "골목 지형"이 몸에 박힘. 어른들 앞에선 말이 짧고, 운전대 잡으면 성격이 바뀐다.', '전직 레이서', '10대 후반', '가죽 재킷', '블랙+오프화이트+레드(포인트)', '고글', '무뚝뚝한 자신감', '허리 위 샷', 12, 25),
('nina-cole', 'Nina Cole', '07_nina_cole.png', '단정한 포니테일, 작은 코와 빠른 눈동자, 팔꿈치에 밴드, 재킷 소매가 살짝 큼(빌려 입은 느낌).', '정비소에서 심부름하며 기술을 훔쳐 배운 ''샾 키드''. 큰길보다 "차가 사라지는 틈"을 찾아낸다.', '터프한 정비사', '10대 후반', '정비 점프수트', '인디고+그레이+오프화이트', '툴백', '여유있는 미소', '전신 정면(모델시트 느낌)', 10, 22),
('jules-quinn', 'Jules Quinn', '08_jules_quinn.png', '짧은 커트+앞머리, 가늘고 긴 팔다리, 귀에 작은 링 피어싱, 손가락에 테이프(그립 보강).', '폐공장/부두 근처에서 자란 로컬. ''룰''보다 ''리듬''으로 운전하며, 팀 내 분위기 메이커지만 결정적 순간엔 냉정해진다.', '전직 레이서', '10대 후반', '가죽 재킷', '버건디+차콜+오프화이트', '장갑', '무뚝뚝한 자신감', '허리 위 샷', 15, 28),
('unit-r-04', 'UNIT R-04 "Rook"', '09_unit_R_04.png', '사람 체형의 산업용 바디(각진 흉부 플레이트), 한쪽 눈은 카메라 렌즈, 노출된 케이블 일부, 페인트 마모/스크래치.', '원래는 항만 견인 작업용 유닛. 업그레이드 후 "운반/호위" 고용 드라이버로 전환됐고, 감정 표현은 적지만 임무 로그는 꼼꼼하다.', '해운 선장', 'N/A', '정비 점프수트', '건메탈+오프화이트+옐로(경고 스트라이프)', '툴백', '무뚝뚝한 자신감', '전신 정면(모델시트 느낌)', 5, 15)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    avatar_filename = EXCLUDED.avatar_filename,
    appearance = EXCLUDED.appearance,
    bio = EXCLUDED.bio,
    archetype = EXCLUDED.archetype,
    age = EXCLUDED.age,
    outfit = EXCLUDED.outfit,
    palette = EXCLUDED.palette,
    prop = EXCLUDED.prop,
    mood = EXCLUDED.mood,
    shot = EXCLUDED.shot,
    base_commission_min = EXCLUDED.base_commission_min,
    base_commission_max = EXCLUDED.base_commission_max,
    updated_at = now();

-- 5. 초기 데이터 삽입: 드라이버 능력치
INSERT INTO trucker.tbl_driver_stats (persona_id, label, value, description, display_order) VALUES
-- Jack Harlow
('jack-harlow', '장비 최대 속도', '+18%', '최대 50% 초과 불가', 1),
('jack-harlow', '보상금 추가', '+12%', '최대 50% 초과 불가', 2),
('jack-harlow', '추격 회피(DEX 체크) 성공률', '+8%', '최대 50% 초과 불가', 3),
-- Victor Kane
('victor-kane', '장비 최대 속도', '+14%', '최대 50% 초과 불가', 1),
('victor-kane', '코너링 안정성', '+20%', '최대 50% 초과 불가', 2),
('victor-kane', '수리/정비 비용', '-10%', '최대 50% 초과 불가', 3),
-- Maya Reed
('maya-reed', '엔진 과열/고장 확률', '-18%', '최대 50% 초과 불가', 1),
('maya-reed', '정찰/점검 시간', '-12%', '최대 50% 초과 불가', 2),
('maya-reed', '보상금 추가', '+10%', '최대 50% 초과 불가', 3),
-- Serena Holt
('serena-holt', '악천후/야간 시야 페널티', '-15%', '최대 50% 초과 불가', 1),
('serena-holt', '운송(화물 손상) 페널티', '-20%', '최대 50% 초과 불가', 2),
('serena-holt', '보상금 추가', '+8%', '최대 50% 초과 불가', 3),
-- Rowan Vale
('rowan-vale', '추격 회피(DEX 체크) 성공률', '+16%', '최대 50% 초과 불가', 1),
('rowan-vale', '장비 최대 속도', '+10%', '최대 50% 초과 불가', 2),
('rowan-vale', '은신/잠입 이동 페널티', '-12%', '최대 50% 초과 불가', 3),
-- Eli Park
('eli-park', '도심/골목길 이동 속도', '+22%', '최대 50% 초과 불가', 1),
('eli-park', '검문/봉쇄 우회 확률', '+10%', '최대 50% 초과 불가', 2),
('eli-park', '보상금 추가', '+6%', '최대 50% 초과 불가', 3),
-- Nina Cole
('nina-cole', '정비/튜닝 효율', '+18%', '최대 50% 초과 불가', 1),
('nina-cole', '소모품(타이어/패드 등) 효율', '+12%', '최대 50% 초과 불가', 2),
('nina-cole', '장비 최대 속도', '+8%', '최대 50% 초과 불가', 3),
-- Jules Quinn
('jules-quinn', '드리프트/급회전 컨트롤', '+20%', '최대 50% 초과 불가', 1),
('jules-quinn', '추격전 집중(실수/슬립 확률)', '-12%', '최대 50% 초과 불가', 2),
('jules-quinn', '보상금 추가', '+7%', '최대 50% 초과 불가', 3),
-- UNIT R-04
('unit-r-04', '화물 안정성', '+25%', '최대 50% 초과 불가', 1),
('unit-r-04', '충돌 피해 경감', '+15%', '최대 50% 초과 불가', 2),
('unit-r-04', '장비 최대 속도', '+6%', '최대 50% 초과 불가', 3)
ON CONFLICT DO NOTHING;

-- 6. RLS 정책 설정
ALTER TABLE trucker.tbl_driver_personas ENABLE ROW LEVEL SECURITY;
ALTER TABLE trucker.tbl_driver_stats ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 드라이버 페르소나 조회 가능
CREATE POLICY "Anyone can view driver personas" ON trucker.tbl_driver_personas FOR SELECT USING (true);
CREATE POLICY "Anyone can view driver stats" ON trucker.tbl_driver_stats FOR SELECT USING (true);

-- 7. 트리거: updated_at 자동 업데이트
CREATE TRIGGER update_tbl_driver_personas_updated_at 
BEFORE UPDATE ON trucker.tbl_driver_personas 
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_tbl_driver_stats_persona_id ON trucker.tbl_driver_stats(persona_id);
CREATE INDEX IF NOT EXISTS idx_tbl_driver_stats_display_order ON trucker.tbl_driver_stats(persona_id, display_order);

-- 9. 권한 부여
GRANT SELECT ON trucker.tbl_driver_personas TO anon, authenticated, service_role;
GRANT SELECT ON trucker.tbl_driver_stats TO anon, authenticated, service_role;

-- 10. RPC 함수: 모든 드라이버 페르소나 조회
CREATE OR REPLACE FUNCTION trucker.v1_get_driver_personas()
RETURNS TABLE (
    id text,
    name text,
    avatar_filename text,
    appearance text,
    bio text,
    archetype text,
    age text,
    outfit text,
    palette text,
    prop text,
    mood text,
    shot text,
    base_commission_min integer,
    base_commission_max integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    stats jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.avatar_filename,
        p.appearance,
        p.bio,
        p.archetype,
        p.age,
        p.outfit,
        p.palette,
        p.prop,
        p.mood,
        p.shot,
        p.base_commission_min,
        p.base_commission_max,
        p.created_at,
        p.updated_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'label', s.label,
                    'value', s.value,
                    'description', s.description
                ) ORDER BY s.display_order
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'::jsonb
        ) as stats
    FROM trucker.tbl_driver_personas p
    LEFT JOIN trucker.tbl_driver_stats s ON p.id = s.persona_id
    GROUP BY p.id, p.name, p.avatar_filename, p.appearance, p.bio, p.archetype, p.age, p.outfit, p.palette, p.prop, p.mood, p.shot, p.base_commission_min, p.base_commission_max, p.created_at, p.updated_at
    ORDER BY p.id;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_driver_personas IS '모든 드라이버 페르소나와 능력치를 조회합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_get_driver_personas TO anon, authenticated;

-- 11. RPC 함수: 특정 드라이버 페르소나 조회
CREATE OR REPLACE FUNCTION trucker.v1_get_driver_persona_by_id(p_persona_id text)
RETURNS TABLE (
    id text,
    name text,
    avatar_filename text,
    appearance text,
    bio text,
    archetype text,
    age text,
    outfit text,
    palette text,
    prop text,
    mood text,
    shot text,
    base_commission_min integer,
    base_commission_max integer,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    stats jsonb
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.avatar_filename,
        p.appearance,
        p.bio,
        p.archetype,
        p.age,
        p.outfit,
        p.palette,
        p.prop,
        p.mood,
        p.shot,
        p.base_commission_min,
        p.base_commission_max,
        p.created_at,
        p.updated_at,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'label', s.label,
                    'value', s.value,
                    'description', s.description
                ) ORDER BY s.display_order
            ) FILTER (WHERE s.id IS NOT NULL),
            '[]'::jsonb
        ) as stats
    FROM trucker.tbl_driver_personas p
    LEFT JOIN trucker.tbl_driver_stats s ON p.id = s.persona_id
    WHERE p.id = p_persona_id
    GROUP BY p.id, p.name, p.avatar_filename, p.appearance, p.bio, p.archetype, p.age, p.outfit, p.palette, p.prop, p.mood, p.shot, p.base_commission_min, p.base_commission_max, p.created_at, p.updated_at;
END;
$$;

COMMENT ON FUNCTION trucker.v1_get_driver_persona_by_id IS '특정 드라이버 페르소나와 능력치를 조회합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_get_driver_persona_by_id TO anon, authenticated;

-- 12. RPC 함수: 드라이버 고용
CREATE OR REPLACE FUNCTION trucker.v1_hire_driver(
    p_user_id uuid,
    p_persona_id text,
    p_commission_rate float,
    p_deposit_amount bigint
)
RETURNS trucker.tbl_hired_drivers
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_persona trucker.tbl_driver_personas;
    v_hired_driver trucker.tbl_hired_drivers;
    v_user_balance bigint;
BEGIN
    -- 페르소나 존재 확인
    SELECT * INTO v_persona FROM trucker.tbl_driver_personas WHERE id = p_persona_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Driver persona not found: %', p_persona_id;
    END IF;

    -- 사용자 잔액 확인
    SELECT balance INTO v_user_balance FROM trucker.tbl_user_profile WHERE auth_user_id = p_user_id;
    IF v_user_balance IS NULL THEN
        RAISE EXCEPTION 'User profile not found';
    END IF;
    IF v_user_balance < p_deposit_amount THEN
        RAISE EXCEPTION 'Insufficient balance. Required: %, Available: %', p_deposit_amount, v_user_balance;
    END IF;

    -- 수수료 범위 검증
    IF p_commission_rate < v_persona.base_commission_min OR p_commission_rate > v_persona.base_commission_max THEN
        RAISE EXCEPTION 'Commission rate out of range. Must be between % and %', v_persona.base_commission_min, v_persona.base_commission_max;
    END IF;

    -- 잔액 차감
    UPDATE trucker.tbl_user_profile 
    SET balance = balance - p_deposit_amount,
        updated_at = now()
    WHERE auth_user_id = p_user_id;

    -- 거래 내역 기록
    INSERT INTO trucker.tbl_transactions (user_id, type, amount, balance_after, description)
    VALUES (
        p_user_id,
        'HIRE_COST',
        -p_deposit_amount,
        v_user_balance - p_deposit_amount,
        format('드라이버 고용: %s (예치금)', v_persona.name)
    );

    -- 드라이버 고용 기록
    INSERT INTO trucker.tbl_hired_drivers (
        owner_id,
        driver_type,
        persona_id,
        name,
        commission_rate,
        deposit_amount,
        is_active,
        hired_at
    ) VALUES (
        p_user_id,
        'NPC',
        p_persona_id,
        v_persona.name,
        p_commission_rate / 100.0, -- %를 소수로 변환
        p_deposit_amount,
        true,
        now()
    ) RETURNING * INTO v_hired_driver;

    RETURN v_hired_driver;
END;
$$;

COMMENT ON FUNCTION trucker.v1_hire_driver IS '드라이버를 고용하고 예치금을 차감합니다.';
GRANT EXECUTE ON FUNCTION trucker.v1_hire_driver TO authenticated;
