-- =====================================================
-- 017_add_enforcement_bypass_penalty.sql
-- 단속 우회 패널티 설정 추가
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f doc/sql/017_add_enforcement_bypass_penalty.sql
-- =====================================================

-- 1. 단속 우회 패널티 설정 추가
INSERT INTO trucker.tbl_admin_config (key, value, description)
VALUES ('enforcement_bypass_penalty', '15'::jsonb, '단속 우회 시 추가되는 시간 패널티 (분)')
ON CONFLICT (key) DO UPDATE SET 
    description = EXCLUDED.description,
    updated_at = now();

-- 2. 기존 설정들 확인 및 누락된 것 보충 (015에서 누락되었을 가능성 대비)
INSERT INTO trucker.tbl_admin_config (key, value, description) VALUES
    ('enforcement_speeding_multiplier', '3.5'::jsonb, '과속 시 단속 확률 배율'),
    ('enforcement_base_fine', '500'::jsonb, '기본 단속 벌금 ($)'),
    ('enforcement_fine_per_km', '50'::jsonb, 'km당 추가 벌금 ($)'),
    ('enforcement_evasion_rate', '40'::jsonb, '단속 돌파 성공 확률 (%)')
ON CONFLICT (key) DO NOTHING;
