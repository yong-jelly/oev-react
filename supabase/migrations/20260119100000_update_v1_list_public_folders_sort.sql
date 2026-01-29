-- =====================================================
-- 20260119100000_update_v1_list_public_folders_sort.sql
-- v1_list_public_folders 함수의 정렬 기준을 최근 음식점 추가 순으로 변경
-- =====================================================

DROP FUNCTION IF EXISTS public.v1_list_public_folders(integer, integer);

CREATE OR REPLACE FUNCTION public.v1_list_public_folders(
    p_limit INT DEFAULT 20,
    p_offset INT DEFAULT 0
)
RETURNS TABLE (
    id VARCHAR,
    owner_id UUID,
    owner_nickname TEXT,
    owner_avatar_url TEXT,
    title VARCHAR,
    description VARCHAR,
    permission VARCHAR,
    subscriber_count INT,
    place_count INT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    preview_places JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, public
AS $$
#variable_conflict use_column
BEGIN
    RETURN QUERY
    SELECT
        f.id,
        f.owner_id,
        p.nickname AS owner_nickname,
        p.profile_image_url AS owner_avatar_url,
        f.title,
        f.description,
        f.permission,
        f.subscriber_count,
        f.place_count,
        f.created_at::TIMESTAMPTZ,
        f.updated_at::TIMESTAMPTZ,
        (
            SELECT jsonb_agg(sub.place_info)
            FROM (
                SELECT jsonb_build_object(
                    'id', pl.id,
                    'name', pl.name,
                    'category', pl.category,
                    'image_urls', pl.images,
                    'place_liked_count', (SELECT count(*) FROM public.tbl_like l WHERE l.liked_id = pl.id AND l.liked_type = 'place' AND l.liked = true),
                    'place_reviews_count', (SELECT count(*) FROM public.tbl_place_user_review r WHERE r.place_id = pl.id AND r.is_active = true),
                    'features', public.v1_common_place_features(pl.id)
                ) AS place_info
                FROM public.tbl_folder_place fp
                JOIN public.tbl_place pl ON fp.place_id = pl.id
                WHERE fp.folder_id = f.id AND fp.deleted_at IS NULL
                ORDER BY fp.created_at DESC
                LIMIT 5
            ) sub
        ) AS preview_places
    FROM public.tbl_folder f
    LEFT JOIN public.tbl_user_profile p ON f.owner_id = p.auth_user_id
    LEFT JOIN LATERAL (
        SELECT MAX(created_at) as last_added_at
        FROM public.tbl_folder_place
        WHERE folder_id = f.id AND deleted_at IS NULL
    ) lp ON TRUE
    WHERE f.permission = 'public'
      AND f.is_hidden = FALSE
    ORDER BY COALESCE(lp.last_added_at, f.created_at) DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.v1_list_public_folders(integer, integer) TO authenticated, anon;
