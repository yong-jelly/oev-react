-- =====================================================
-- 012_bicycle_delivery_patterns.sql
-- 전국 15개 권역 좌표 및 30개 자전거 배송 패턴 데이터
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/012_bicycle_delivery_patterns.sql
-- =====================================================

-- 1. 전국 권역 좌표 설정
INSERT INTO trucker.tbl_system_config (id, value, description) VALUES
('region_coordinates', '{
  "서울_강남": {"lat": 37.4979, "lng": 127.0276, "radius": 0.03},
  "서울_강북": {"lat": 37.5665, "lng": 126.9780, "radius": 0.03},
  "서울_여의도": {"lat": 37.5219, "lng": 126.9245, "radius": 0.02},
  "부산_해운대": {"lat": 35.1631, "lng": 129.1639, "radius": 0.03},
  "부산_서면": {"lat": 35.1576, "lng": 129.0596, "radius": 0.02},
  "대구_동성로": {"lat": 35.8690, "lng": 128.5940, "radius": 0.02},
  "인천_송도": {"lat": 37.3915, "lng": 126.6436, "radius": 0.03},
  "광주_충장로": {"lat": 35.1468, "lng": 126.9163, "radius": 0.02},
  "대전_둔산": {"lat": 36.3511, "lng": 127.3775, "radius": 0.02},
  "세종_정부청사": {"lat": 36.4800, "lng": 127.2890, "radius": 0.02},
  "울산_삼산": {"lat": 35.5395, "lng": 129.3377, "radius": 0.02},
  "수원_인계동": {"lat": 37.2636, "lng": 127.0286, "radius": 0.02},
  "성남_분당": {"lat": 37.3595, "lng": 127.1086, "radius": 0.02},
  "고양_일산": {"lat": 37.6551, "lng": 126.7727, "radius": 0.02},
  "제주_연동": {"lat": 33.4890, "lng": 126.4983, "radius": 0.02}
}', '전국 15개 권역 중심 좌표 및 반경')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- 2. 자전거 배송 패턴 30종 설정
INSERT INTO trucker.tbl_system_config (id, value, description) VALUES
('bicycle_delivery_patterns', '{
  "patterns": [
    {
      "id": "food_lunchbox",
      "category": "음식/식품류",
      "cargo_name": "도시락",
      "title_template": "{region} 도시락 배송",
      "weight_range": [0.5, 2.0],
      "volume_range": [2, 8],
      "distance_range": [1, 5],
      "base_rate": 1.8,
      "time_sensitivity": "high",
      "description": "점심시간 직전 사무실 배송"
    },
    {
      "id": "food_coffee",
      "category": "음식/식품류",
      "cargo_name": "커피/음료",
      "title_template": "{region} 음료 배달",
      "weight_range": [0.5, 3.0],
      "volume_range": [2, 10],
      "distance_range": [0.5, 3],
      "base_rate": 1.5,
      "time_sensitivity": "high",
      "description": "카페 음료 긴급 배달"
    },
    {
      "id": "food_bakery",
      "category": "음식/식품류",
      "cargo_name": "베이커리",
      "title_template": "{region} 빵 배달",
      "weight_range": [0.3, 1.5],
      "volume_range": [3, 12],
      "distance_range": [1, 4],
      "base_rate": 1.6,
      "time_sensitivity": "medium",
      "description": "신선한 베이커리 아침 배송"
    },
    {
      "id": "food_salad",
      "category": "음식/식품류",
      "cargo_name": "샐러드",
      "title_template": "{region} 샐러드 배송",
      "weight_range": [0.3, 1.0],
      "volume_range": [2, 6],
      "distance_range": [1, 4],
      "base_rate": 1.7,
      "time_sensitivity": "high",
      "description": "건강식 샐러드 정기 배송"
    },
    {
      "id": "food_snack",
      "category": "음식/식품류",
      "cargo_name": "분식",
      "title_template": "{region} 분식 배달",
      "weight_range": [0.5, 2.0],
      "volume_range": [3, 10],
      "distance_range": [1, 5],
      "base_rate": 1.4,
      "time_sensitivity": "medium",
      "description": "떡볶이/김밥 등 분식 배달"
    },
    {
      "id": "food_dessert",
      "category": "음식/식품류",
      "cargo_name": "디저트",
      "title_template": "{region} 디저트 배송",
      "weight_range": [0.2, 1.5],
      "volume_range": [2, 8],
      "distance_range": [1, 4],
      "base_rate": 1.9,
      "time_sensitivity": "high",
      "description": "케이크/마카롱 등 취급주의"
    },
    {
      "id": "food_health",
      "category": "음식/식품류",
      "cargo_name": "건강식품",
      "title_template": "{region} 건강식품 배송",
      "weight_range": [0.5, 3.0],
      "volume_range": [2, 10],
      "distance_range": [2, 8],
      "base_rate": 1.5,
      "time_sensitivity": "low",
      "description": "영양제/건강보조식품 배송"
    },
    {
      "id": "food_fruit",
      "category": "음식/식품류",
      "cargo_name": "과일",
      "title_template": "{region} 과일 배송",
      "weight_range": [1.0, 4.0],
      "volume_range": [5, 15],
      "distance_range": [2, 6],
      "base_rate": 1.6,
      "time_sensitivity": "medium",
      "description": "신선 과일 선물 세트"
    },
    {
      "id": "food_mealkit",
      "category": "음식/식품류",
      "cargo_name": "밀키트",
      "title_template": "{region} 밀키트 배송",
      "weight_range": [1.0, 3.0],
      "volume_range": [5, 12],
      "distance_range": [2, 7],
      "base_rate": 1.7,
      "time_sensitivity": "medium",
      "description": "요리 재료 세트 냉장 배송"
    },
    {
      "id": "food_nightsnack",
      "category": "음식/식품류",
      "cargo_name": "야식",
      "title_template": "{region} 야식 배달",
      "weight_range": [0.5, 2.5],
      "volume_range": [3, 12],
      "distance_range": [1, 5],
      "base_rate": 2.0,
      "time_sensitivity": "high",
      "description": "치킨/피자 등 야간 배달"
    },
    {
      "id": "doc_contract",
      "category": "서류/문서류",
      "cargo_name": "계약서",
      "title_template": "{region} 계약서 전달",
      "weight_range": [0.1, 0.5],
      "volume_range": [0.5, 2],
      "distance_range": [2, 10],
      "base_rate": 2.5,
      "time_sensitivity": "high",
      "description": "중요 계약서 직접 전달"
    },
    {
      "id": "doc_medical",
      "category": "서류/문서류",
      "cargo_name": "의료기록",
      "title_template": "{region} 의료기록 전달",
      "weight_range": [0.1, 0.3],
      "volume_range": [0.5, 1.5],
      "distance_range": [2, 8],
      "base_rate": 2.8,
      "time_sensitivity": "high",
      "description": "병원간 의료기록 전달"
    },
    {
      "id": "doc_legal",
      "category": "서류/문서류",
      "cargo_name": "법원서류",
      "title_template": "{region} 법원서류 제출",
      "weight_range": [0.2, 0.8],
      "volume_range": [1, 3],
      "distance_range": [3, 12],
      "base_rate": 3.0,
      "time_sensitivity": "high",
      "description": "마감시한 법원 서류"
    },
    {
      "id": "doc_finance",
      "category": "서류/문서류",
      "cargo_name": "금융문서",
      "title_template": "{region} 금융서류 배송",
      "weight_range": [0.1, 0.4],
      "volume_range": [0.5, 2],
      "distance_range": [2, 8],
      "base_rate": 2.6,
      "time_sensitivity": "medium",
      "description": "은행/증권 서류 전달"
    },
    {
      "id": "doc_certificate",
      "category": "서류/문서류",
      "cargo_name": "증명서",
      "title_template": "{region} 증명서 배송",
      "weight_range": [0.05, 0.2],
      "volume_range": [0.2, 0.8],
      "distance_range": [2, 10],
      "base_rate": 2.2,
      "time_sensitivity": "medium",
      "description": "각종 증명서류 배송"
    },
    {
      "id": "doc_exam",
      "category": "서류/문서류",
      "cargo_name": "시험지",
      "title_template": "{region} 시험지 전달",
      "weight_range": [0.5, 2.0],
      "volume_range": [2, 8],
      "distance_range": [3, 15],
      "base_rate": 3.5,
      "time_sensitivity": "critical",
      "description": "보안 필요 시험 자료"
    },
    {
      "id": "parcel_cosmetic",
      "category": "소형 택배류",
      "cargo_name": "화장품",
      "title_template": "{region} 화장품 배송",
      "weight_range": [0.2, 1.0],
      "volume_range": [1, 5],
      "distance_range": [2, 8],
      "base_rate": 1.8,
      "time_sensitivity": "low",
      "description": "화장품 택배 배송"
    },
    {
      "id": "parcel_medicine",
      "category": "소형 택배류",
      "cargo_name": "의약품",
      "title_template": "{region} 의약품 배송",
      "weight_range": [0.1, 0.8],
      "volume_range": [0.5, 3],
      "distance_range": [1, 6],
      "base_rate": 2.5,
      "time_sensitivity": "high",
      "description": "약국 조제약 배송"
    },
    {
      "id": "parcel_electronics",
      "category": "소형 택배류",
      "cargo_name": "전자기기 소품",
      "title_template": "{region} 전자기기 배송",
      "weight_range": [0.2, 1.5],
      "volume_range": [1, 5],
      "distance_range": [2, 10],
      "base_rate": 2.0,
      "time_sensitivity": "medium",
      "description": "이어폰/충전기 등 소형 전자기기"
    },
    {
      "id": "parcel_clothing",
      "category": "소형 택배류",
      "cargo_name": "의류 소포",
      "title_template": "{region} 의류 배송",
      "weight_range": [0.3, 2.0],
      "volume_range": [3, 12],
      "distance_range": [2, 8],
      "base_rate": 1.5,
      "time_sensitivity": "low",
      "description": "온라인 의류 주문 배송"
    },
    {
      "id": "parcel_flower",
      "category": "소형 택배류",
      "cargo_name": "꽃다발",
      "title_template": "{region} 꽃 배달",
      "weight_range": [0.5, 2.0],
      "volume_range": [5, 15],
      "distance_range": [2, 8],
      "base_rate": 2.2,
      "time_sensitivity": "high",
      "description": "생화 꽃다발 취급주의"
    },
    {
      "id": "parcel_pet",
      "category": "소형 택배류",
      "cargo_name": "반려동물 용품",
      "title_template": "{region} 펫용품 배송",
      "weight_range": [1.0, 4.0],
      "volume_range": [5, 20],
      "distance_range": [2, 8],
      "base_rate": 1.6,
      "time_sensitivity": "low",
      "description": "사료/간식/용품 배송"
    },
    {
      "id": "parcel_stationery",
      "category": "소형 택배류",
      "cargo_name": "문구류",
      "title_template": "{region} 문구 배송",
      "weight_range": [0.3, 2.0],
      "volume_range": [2, 10],
      "distance_range": [2, 7],
      "base_rate": 1.4,
      "time_sensitivity": "low",
      "description": "사무용품/문구류 배송"
    },
    {
      "id": "parcel_gift",
      "category": "소형 택배류",
      "cargo_name": "선물세트",
      "title_template": "{region} 선물 배송",
      "weight_range": [0.5, 3.0],
      "volume_range": [3, 15],
      "distance_range": [2, 10],
      "base_rate": 2.0,
      "time_sensitivity": "medium",
      "description": "각종 선물세트 배송"
    },
    {
      "id": "urgent_emergency_med",
      "category": "긴급 배송류",
      "cargo_name": "응급약품",
      "title_template": "{region} 응급약품 긴급",
      "weight_range": [0.1, 0.5],
      "volume_range": [0.5, 2],
      "distance_range": [1, 5],
      "base_rate": 4.0,
      "time_sensitivity": "critical",
      "description": "응급 처치용 약품 긴급 배송"
    },
    {
      "id": "urgent_blood_sample",
      "category": "긴급 배송류",
      "cargo_name": "혈액샘플",
      "title_template": "{region} 검체 운송",
      "weight_range": [0.1, 0.3],
      "volume_range": [0.2, 1],
      "distance_range": [2, 8],
      "base_rate": 5.0,
      "time_sensitivity": "critical",
      "description": "의료 검체 냉장 운송"
    },
    {
      "id": "urgent_parts",
      "category": "긴급 배송류",
      "cargo_name": "부품교체",
      "title_template": "{region} 긴급 부품",
      "weight_range": [0.2, 1.5],
      "volume_range": [1, 5],
      "distance_range": [2, 10],
      "base_rate": 3.5,
      "time_sensitivity": "critical",
      "description": "장비 수리용 긴급 부품"
    },
    {
      "id": "urgent_key",
      "category": "긴급 배송류",
      "cargo_name": "열쇠/카드키",
      "title_template": "{region} 열쇠 전달",
      "weight_range": [0.05, 0.2],
      "volume_range": [0.1, 0.5],
      "distance_range": [1, 8],
      "base_rate": 3.0,
      "time_sensitivity": "critical",
      "description": "분실 열쇠/출입카드 긴급 전달"
    },
    {
      "id": "urgent_document",
      "category": "긴급 배송류",
      "cargo_name": "긴급서류",
      "title_template": "{region} 긴급 서류",
      "weight_range": [0.1, 0.5],
      "volume_range": [0.5, 2],
      "distance_range": [2, 12],
      "base_rate": 3.8,
      "time_sensitivity": "critical",
      "description": "마감임박 중요 서류"
    },
    {
      "id": "urgent_food",
      "category": "긴급 배송류",
      "cargo_name": "시간제한 식품",
      "title_template": "{region} 급속냉동 배송",
      "weight_range": [1.0, 3.0],
      "volume_range": [5, 12],
      "distance_range": [1, 5],
      "base_rate": 3.2,
      "time_sensitivity": "critical",
      "description": "아이스크림/냉동식품 긴급"
    }
  ]
}', '자전거 배송 패턴 30종 정의')
ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

-- 3. 랜덤 주문 생성 함수 수정 (전국 패턴 지원)
CREATE OR REPLACE FUNCTION trucker.v1_generate_bicycle_orders(p_count integer DEFAULT 5)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = trucker, public
AS $$
DECLARE
    v_regions jsonb;
    v_patterns jsonb;
    v_region_keys text[];
    v_pattern_array jsonb;
    v_region_key text;
    v_region jsonb;
    v_pattern jsonb;
    v_start_lat float;
    v_start_lng float;
    v_end_lat float;
    v_end_lng float;
    v_distance float;
    v_base_rate float;
    v_base_reward bigint;
    v_weight float;
    v_volume float;
    v_limit_time integer;
    v_cargo_name text;
    v_title text;
    v_i integer;
BEGIN
    -- 설정 로드
    SELECT value INTO v_regions FROM trucker.tbl_system_config WHERE id = 'region_coordinates';
    SELECT value->'patterns' INTO v_pattern_array FROM trucker.tbl_system_config WHERE id = 'bicycle_delivery_patterns';
    
    IF v_regions IS NULL OR v_pattern_array IS NULL THEN
        RAISE EXCEPTION '설정이 없습니다. region_coordinates 또는 bicycle_delivery_patterns를 확인하세요.';
    END IF;
    
    -- 지역 키 배열 생성
    SELECT array_agg(key) INTO v_region_keys FROM jsonb_object_keys(v_regions) AS key;
    
    FOR v_i IN 1..p_count LOOP
        -- 랜덤 지역 선택
        v_region_key := v_region_keys[floor(random() * array_length(v_region_keys, 1) + 1)];
        v_region := v_regions->v_region_key;
        
        -- 랜덤 패턴 선택
        v_pattern := v_pattern_array->(floor(random() * jsonb_array_length(v_pattern_array))::integer);
        
        -- 지역 내 랜덤 시작점
        v_start_lat := (v_region->>'lat')::float + (random() * 2 - 1) * (v_region->>'radius')::float;
        v_start_lng := (v_region->>'lng')::float + (random() * 2 - 1) * (v_region->>'radius')::float;
        
        -- 패턴 기반 거리 계산
        v_distance := round((
            random() * ((v_pattern->'distance_range'->>1)::float - (v_pattern->'distance_range'->>0)::float) 
            + (v_pattern->'distance_range'->>0)::float
        )::numeric, 1);
        
        -- 거리에 따른 목적지 계산 (대략적 좌표 변환: 1도 ≈ 111km)
        v_end_lat := v_start_lat + (random() * 2 - 1) * (v_distance / 111);
        v_end_lng := v_start_lng + (random() * 2 - 1) * (v_distance / 88);  -- 위도에 따른 경도 보정
        
        -- 패턴 기반 무게/부피 계산
        v_weight := round((
            random() * ((v_pattern->'weight_range'->>1)::float - (v_pattern->'weight_range'->>0)::float) 
            + (v_pattern->'weight_range'->>0)::float
        )::numeric, 2);
        
        v_volume := round((
            random() * ((v_pattern->'volume_range'->>1)::float - (v_pattern->'volume_range'->>0)::float) 
            + (v_pattern->'volume_range'->>0)::float
        )::numeric, 1);
        
        -- 보상 계산
        v_base_rate := (v_pattern->>'base_rate')::float;
        v_base_reward := round(v_base_rate * v_distance * (1 + random() * 0.3))::bigint;
        
        -- 시간 민감도에 따른 제한시간 계산 (자전거 15km/h 기준)
        v_limit_time := round((v_distance / 15 * 60) * 
            CASE v_pattern->>'time_sensitivity'
                WHEN 'critical' THEN 1.1
                WHEN 'high' THEN 1.2
                WHEN 'medium' THEN 1.4
                ELSE 1.6
            END
        )::integer;
        
        IF v_limit_time < 5 THEN
            v_limit_time := 5;
        END IF;
        
        -- 화물 이름 및 제목
        v_cargo_name := v_pattern->>'cargo_name';
        v_title := replace(v_pattern->>'title_template', '{region}', split_part(v_region_key, '_', 1));
        
        -- 주문 삽입
        INSERT INTO trucker.tbl_orders (
            title, category, cargo_name, weight, volume, distance, 
            base_reward, limit_time_minutes, required_equipment_type,
            start_lat, start_lng, end_lat, end_lng
        ) VALUES (
            v_title,
            'CONVENIENCE',  -- 자전거는 항상 CONVENIENCE
            v_cargo_name,
            v_weight,
            v_volume,
            v_distance,
            v_base_reward,
            v_limit_time,
            'BICYCLE',
            v_start_lat,
            v_start_lng,
            v_end_lat,
            v_end_lng
        );
    END LOOP;
    
    -- 오래된 주문 삭제 (최신 50개만 유지)
    DELETE FROM trucker.tbl_orders
    WHERE id NOT IN (
        SELECT id FROM trucker.tbl_orders
        ORDER BY created_at DESC
        LIMIT 50
    );
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION trucker.v1_generate_bicycle_orders TO anon, authenticated, service_role;

COMMENT ON FUNCTION trucker.v1_generate_bicycle_orders IS '전국 15개 권역, 30개 패턴 기반 자전거 배송 주문 생성';
