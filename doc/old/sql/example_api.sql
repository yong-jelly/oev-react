-- =====================================================
-- 064_unify_place_data_response_format.sql
-- 6개 장소 목록 조회 함수의 응답 형태를 place_data JSONB로 통일
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/064_unify_place_data_response_format.sql
-- =====================================================

-- 1. 네이버 폴더 상세 장소 목록 조회 수정
DROP FUNCTION IF EXISTS public.v2_get_places_by_naver_folder(bigint, integer, integer);
CREATE OR REPLACE FUNCTION public.v2_get_places_by_naver_folder(
    p_folder_id bigint,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    place_id character varying,
    place_data jsonb
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as place_id,
        (to_jsonb(p.*) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object(
            'image_urls', p.images, 
            'avg_price', calculate_menu_avg_price(p.menus),
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', public.v1_get_place_experience(p.id)
        )) as place_data
    FROM tbl_naver_folder_place fp 
    JOIN tbl_place p ON fp.place_id = p.id
    WHERE fp.folder_id = p_folder_id
    ORDER BY p.visitor_reviews_score DESC NULLS LAST, p.visitor_reviews_total DESC NULLS LAST
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 2. 유튜브 채널 상세 장소 목록 조회 수정
DROP FUNCTION IF EXISTS public.v2_get_places_by_youtube_channel(text, integer, integer);
CREATE OR REPLACE FUNCTION public.v2_get_places_by_youtube_channel(
    p_channel_id text,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    place_id character varying,
    place_data jsonb,
    published_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    WITH unique_places AS (
        SELECT DISTINCT ON (f.place_id)
            f.place_id,
            f.published_at
        FROM tbl_place_features f
        WHERE f.platform_type = 'youtube'
          AND f.status = 'active'
          AND f.metadata->>'channelId' = p_channel_id
        ORDER BY f.place_id, f.published_at DESC
    )
    SELECT 
        p.id as place_id,
        (to_jsonb(p.*) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object(
            'image_urls', p.images, 
            'avg_price', calculate_menu_avg_price(p.menus),
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', public.v1_get_place_experience(p.id)
        )) as place_data,
        up.published_at
    FROM unique_places up
    JOIN tbl_place p ON up.place_id = p.id
    ORDER BY up.published_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 3. 커뮤니티 지역 상세 장소 목록 조회 수정
DROP FUNCTION IF EXISTS public.v2_get_places_by_community_region(text, text, integer, integer);
CREATE OR REPLACE FUNCTION public.v2_get_places_by_community_region(
    p_region_name text,
    p_domain text DEFAULT NULL,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    place_id character varying,
    place_data jsonb,
    published_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    WITH unique_places AS (
        SELECT DISTINCT ON (pf.place_id)
            pf.place_id,
            pf.published_at
        FROM tbl_place_features pf
        JOIN tbl_place p ON pf.place_id = p.id
        WHERE pf.platform_type = 'community'
          AND pf.status = 'active'
          AND p.group1 = p_region_name
          AND (p_domain IS NULL OR pf.metadata->>'domain' = p_domain)
        ORDER BY pf.place_id, pf.published_at DESC
    )
    SELECT 
        p.id as place_id,
        (to_jsonb(p.*) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object(
            'image_urls', p.images, 
            'avg_price', calculate_menu_avg_price(p.menus),
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', public.v1_get_place_experience(p.id)
        )) as place_data,
        up.published_at
    FROM unique_places up
    JOIN tbl_place p ON up.place_id = p.id
    ORDER BY up.published_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 4. 내가 좋아요 누른 장소 목록 조회 수정
DROP FUNCTION IF EXISTS public.v1_get_my_liked_places(integer, integer);
CREATE OR REPLACE FUNCTION public.v1_get_my_liked_places(
    p_limit integer DEFAULT 20, 
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    place_id character varying,
    place_data jsonb,
    added_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as place_id,
        (to_jsonb(p.*) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object(
            'image_urls', p.images, 
            'avg_price', calculate_menu_avg_price(p.menus),
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', public.v1_get_place_experience(p.id)
        )) as place_data,
        l.created_at as added_at
    FROM public.tbl_like l
    JOIN public.tbl_place p ON l.liked_id = p.id
    WHERE l.user_id = auth.uid() 
      AND l.liked_type = 'place' 
      AND l.liked = true
    ORDER BY l.created_at DESC 
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 5. 내가 방문한 장소 목록 조회 수정 (v1_list_visited_place)
DROP FUNCTION IF EXISTS public.v1_list_visited_place(integer, integer);
CREATE OR REPLACE FUNCTION public.v1_list_visited_place(
    p_limit integer DEFAULT 20, 
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    place_id character varying,
    place_data jsonb,
    added_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as place_id,
        (to_jsonb(p.*) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object(
            'image_urls', p.images, 
            'avg_price', calculate_menu_avg_price(p.menus),
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', public.v1_get_place_experience(p.id)
        )) as place_data,
        v.visited_at as added_at
    FROM public.tbl_visited v
    JOIN public.tbl_place p ON v.place_id = p.id
    WHERE v.user_id = auth.uid()
    ORDER BY v.visited_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 6. 내가 최근 본 장소 목록 조회 수정
DROP FUNCTION IF EXISTS public.v1_get_my_recent_view_places(integer, integer);
CREATE OR REPLACE FUNCTION public.v1_get_my_recent_view_places(
    p_limit integer DEFAULT 20, 
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    place_id character varying,
    place_data jsonb,
    added_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as place_id,
        (to_jsonb(p.*) - '{menus,keyword_list,static_map_url,themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object(
            'image_urls', p.images, 
            'avg_price', calculate_menu_avg_price(p.menus),
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', public.v1_get_place_experience(p.id)
        )) as place_data,
        rv.updated_at as added_at
    FROM public.tbl_recent_view rv
    JOIN public.tbl_place p ON rv.content_id = p.id
    WHERE rv.user_id = auth.uid() 
      AND rv.content_type = 'place'
    ORDER BY rv.updated_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 7. 내가 북마크(저장)한 장소 목록 조회 수정
DROP FUNCTION IF EXISTS public.v1_get_my_bookmarked_places(integer, integer);
CREATE OR REPLACE FUNCTION public.v1_get_my_bookmarked_places(
    p_limit integer DEFAULT 20, 
    p_offset integer DEFAULT 0
)
RETURNS TABLE (
    place_id character varying,
    place_data jsonb,
    added_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as place_id,
        (to_jsonb(p.*) - '{themes, street_panorama, category_code_list, visitor_review_stats, algo_avg_len, algo_stdev_len, algo_revisit_rate, algo_media_ratio, algo_avg_views, algo_recency_score, algo_engagement_score, algo_length_variation_index, algo_loyalty_index, algo_growth_rate_1m, algo_growth_rate_2m, algo_growth_rate_3m}'::text[] || jsonb_build_object(
            'image_urls', p.images, 
            'avg_price', calculate_menu_avg_price(p.menus),
            'interaction', public.v1_common_place_interaction(p.id),
            'features', public.v1_common_place_features(p.id),
            'experience', public.v1_get_place_experience(p.id)
        )) as place_data,
        s.created_at as added_at
    FROM public.tbl_save s
    JOIN public.tbl_place p ON s.saved_id = p.id
    WHERE s.user_id = auth.uid() 
      AND s.saved_type = 'place' 
      AND s.saved = true
    ORDER BY s.created_at DESC 
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION public.v2_get_places_by_naver_folder(bigint, integer, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.v2_get_places_by_youtube_channel(text, integer, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.v2_get_places_by_community_region(text, text, integer, integer) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.v1_get_my_liked_places(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.v1_list_visited_place(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.v1_get_my_recent_view_places(integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.v1_get_my_bookmarked_places(integer, integer) TO authenticated;
