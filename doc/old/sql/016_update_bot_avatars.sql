-- =====================================================
-- 016_update_bot_avatars.sql
-- 봇들의 프로필 이미지를 DiceBear Avataaars로 업데이트
-- =====================================================

UPDATE trucker.tbl_user_profile
SET avatar_url = 'https://api.dicebear.com/7.x/avataaars/svg?seed=' || nickname
WHERE is_bot = true;

-- 업데이트 결과 확인
SELECT nickname, avatar_url 
FROM trucker.tbl_user_profile 
WHERE is_bot = true;
