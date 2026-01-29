-- =====================================================
-- 005_v1_generate_random_orders.sql
-- 평판 기반 랜덤 주문 생성 시스템
-- 
-- 보상 공식: Reward = Base_Rate × Distance × Difficulty_Weight
-- 해금 조건: tbl_system_config의 category_config 참조
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/005_v1_generate_random_orders.sql
-- =====================================================

-- 1. 유저의 평판에 맞는 카테고리 목록 조회
CREATE OR REPLACE FUNCTION trucker.get_unlocked_categories(p_reputation integer)
RETURNS text[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_config jsonb;
    v_category text;
    v_unlocked text[] := '{}';
BEGIN
    -- 카테고리 설정 조회
    SELECT value INTO v_config FROM trucker.tbl_system_config WHERE id = 'category_config';
    
    IF v_config IS NULL THEN
        -- 설정이 없으면 기본 카테고리만 반환
        RETURN ARRAY['CONVENIENCE'];
    END IF;
    
    -- 평판에 맞는 카테고리 필터링
    FOR v_category IN SELECT jsonb_object_keys(v_config) LOOP
        IF (v_config->v_category->>'min_reputation')::integer <= p_reputation THEN
            v_unlocked := array_append(v_unlocked, v_category);
        END IF;
    END LOOP;
    
    RETURN v_unlocked;
END;
$$;

-- 2. 랜덤 주문 생성 함수 (평판 기반)
CREATE OR REPLACE FUNCTION trucker.v1_generate_random_orders(p_user_id uuid, p_count integer DEFAULT 5)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_config jsonb;
    v_category_config jsonb;
    v_reputation integer;
    v_unlocked_categories text[];
    v_category text;
    v_cargo_names text[];
    v_cargo_name text;
    v_distance float;
    v_base_rate float;
    v_difficulty float;
    v_base_reward bigint;
    v_limit_time integer;
    v_equipment text;
    v_weight float;
    v_volume float;
    v_dist_min float;
    v_dist_max float;
    v_weight_min float;
    v_weight_max float;
    v_volume_min float;
    v_volume_max float;
    v_diff_min float;
    v_diff_max float;
    v_i integer;
BEGIN
    -- 유저 평판 조회
    SELECT reputation INTO v_reputation 
    FROM trucker.tbl_user_profile 
    WHERE auth_user_id = p_user_id;
    
    IF v_reputation IS NULL THEN
        v_reputation := 0;
    END IF;

    -- 카테고리 설정 조회
    SELECT value INTO v_config 
    FROM trucker.tbl_system_config 
    WHERE id = 'category_config';
    
    -- 해금된 카테고리 목록
    v_unlocked_categories := trucker.get_unlocked_categories(v_reputation);
    
    IF array_length(v_unlocked_categories, 1) IS NULL OR array_length(v_unlocked_categories, 1) = 0 THEN
        v_unlocked_categories := ARRAY['CONVENIENCE'];
    END IF;

    FOR v_i IN 1..p_count LOOP
        -- 랜덤 카테고리 선택 (해금된 것 중에서)
        v_category := v_unlocked_categories[floor(random() * array_length(v_unlocked_categories, 1) + 1)];
        v_category_config := v_config->v_category;
        
        -- 카테고리별 설정 추출
        v_base_rate := (v_category_config->>'base_rate')::float;
        v_equipment := v_category_config->>'equipment';
        v_dist_min := (v_category_config->'distance_range'->>0)::float;
        v_dist_max := (v_category_config->'distance_range'->>1)::float;
        v_weight_min := (v_category_config->'weight_range'->>0)::float;
        v_weight_max := (v_category_config->'weight_range'->>1)::float;
        v_volume_min := (v_category_config->'volume_range'->>0)::float;
        v_volume_max := (v_category_config->'volume_range'->>1)::float;
        v_diff_min := (v_category_config->'difficulty_range'->>0)::float;
        v_diff_max := (v_category_config->'difficulty_range'->>1)::float;
        
        -- 카테고리별 화물 이름 설정
        CASE v_category
            WHEN 'CONVENIENCE' THEN 
                v_cargo_names := ARRAY['신선우유', '빵 묶음', '과자 박스', '음료수 세트', '도시락', '편의점 물품'];
            WHEN 'CONSTRUCTION' THEN 
                v_cargo_names := ARRAY['시멘트 포대', '철근 다발', '벽돌', '목재', '타일', '배관 자재'];
            WHEN 'EQUIPMENT' THEN 
                v_cargo_names := ARRAY['서버 랙', '의료 장비', '정밀 기기', '노트북 박스', '모니터 세트', '네트워크 장비'];
            WHEN 'HEAVY_DUTY' THEN 
                v_cargo_names := ARRAY['굴삭기 부품', '발전기', '산업용 보일러', '크레인 부품', '컨베이어 벨트'];
            WHEN 'INTERNATIONAL' THEN 
                v_cargo_names := ARRAY['수입 와인', '명품 가방', '커피 원두', '전자 부품', '반도체 웨이퍼', '의약품'];
            ELSE 
                v_cargo_names := ARRAY['일반 화물'];
        END CASE;
        
        v_cargo_name := v_cargo_names[floor(random() * array_length(v_cargo_names, 1) + 1)];
        
        -- 랜덤 값 계산
        v_distance := round((random() * (v_dist_max - v_dist_min) + v_dist_min)::numeric, 1);
        v_difficulty := random() * (v_diff_max - v_diff_min) + v_diff_min;
        v_weight := round((random() * (v_weight_max - v_weight_min) + v_weight_min)::numeric, 1);
        v_volume := round((random() * (v_volume_max - v_volume_min) + v_volume_min)::numeric, 1);
        
        -- 보상 계산: base_rate × distance × difficulty
        v_base_reward := round(v_base_rate * v_distance * v_difficulty)::bigint;
        
        -- 제한시간 계산: 거리 기반 ETA × 1.25 (버퍼)
        -- 자전거: 15km/h, 밴: 40km/h, 트럭: 60km/h, 대형: 50km/h, 비행기: 500km/h
        CASE v_category
            WHEN 'CONVENIENCE' THEN v_limit_time := round((v_distance / 15 * 60) * 1.25)::integer; -- 15km/h
            WHEN 'CONSTRUCTION' THEN v_limit_time := round((v_distance / 40 * 60) * 1.25)::integer; -- 40km/h
            WHEN 'EQUIPMENT' THEN v_limit_time := round((v_distance / 60 * 60) * 1.25)::integer; -- 60km/h
            WHEN 'HEAVY_DUTY' THEN v_limit_time := round((v_distance / 50 * 60) * 1.25)::integer; -- 50km/h
            WHEN 'INTERNATIONAL' THEN v_limit_time := round((v_distance / 500 * 60) * 1.25)::integer; -- 500km/h
            ELSE v_limit_time := round((v_distance / 30 * 60) * 1.25)::integer;
        END CASE;
        
        -- 최소 제한시간 보장 (5분 이상)
        IF v_limit_time < 5 THEN
            v_limit_time := 5;
        END IF;

        -- 주문 삽입
        INSERT INTO trucker.tbl_orders (
            title, category, cargo_name, weight, volume, distance, 
            base_reward, limit_time_minutes, required_equipment_type,
            start_lat, start_lng, end_lat, end_lng
        ) VALUES (
            v_cargo_name || ' 배송',
            v_category,
            v_cargo_name,
            v_weight,
            v_volume,
            v_distance,
            v_base_reward,
            v_limit_time,
            v_equipment,
            -- 서울 인근 랜덤 좌표 (출발지)
            37.5665 + (random() * 0.1 - 0.05),
            126.9780 + (random() * 0.1 - 0.05),
            -- 목적지 (거리에 따라 범위 조절)
            37.5665 + (random() * 0.2 - 0.1) * (v_distance / 50),
            126.9780 + (random() * 0.2 - 0.1) * (v_distance / 50)
        );
    END LOOP;

    -- 오래된 주문 삭제 (최신 30개만 유지)
    DELETE FROM trucker.tbl_orders
    WHERE id NOT IN (
        SELECT id FROM trucker.tbl_orders
        ORDER BY created_at DESC
        LIMIT 30
    );
END;
$$;

-- 3. 주문 목록 조회 (주문이 부족하면 자동 생성)
DROP FUNCTION IF EXISTS trucker.v1_get_orders();
DROP FUNCTION IF EXISTS trucker.v1_get_orders(uuid);

CREATE OR REPLACE FUNCTION trucker.v1_get_orders(p_user_id uuid DEFAULT NULL)
RETURNS SETOF trucker.tbl_orders
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_count integer;
    v_reputation integer;
    v_unlocked_categories text[];
BEGIN
    -- 현재 주문 개수 확인
    SELECT count(*) INTO v_count FROM trucker.tbl_orders;
    
    -- 주문이 5개 미만이면 랜덤 생성
    IF v_count < 5 AND p_user_id IS NOT NULL THEN
        PERFORM trucker.v1_generate_random_orders(p_user_id, 8);
    END IF;

    -- 유저의 평판에 맞는 주문만 반환
    IF p_user_id IS NOT NULL THEN
        SELECT reputation INTO v_reputation 
        FROM trucker.tbl_user_profile 
        WHERE auth_user_id = p_user_id;
        
        IF v_reputation IS NULL THEN
            v_reputation := 0;
        END IF;
        
        v_unlocked_categories := trucker.get_unlocked_categories(v_reputation);
        
        RETURN QUERY
        SELECT * FROM trucker.tbl_orders
        WHERE category = ANY(v_unlocked_categories)
        ORDER BY created_at DESC;
    ELSE
        -- 유저 ID가 없으면 모든 주문 반환 (관리용)
        RETURN QUERY
        SELECT * FROM trucker.tbl_orders
        ORDER BY created_at DESC;
    END IF;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION trucker.get_unlocked_categories TO authenticated;
GRANT EXECUTE ON FUNCTION trucker.v1_generate_random_orders TO authenticated;
GRANT EXECUTE ON FUNCTION trucker.v1_get_orders TO authenticated;
