-- =====================================================
-- 008_create_folder_tables.sql
-- 사용자 정의 폴더 및 네이버 공유 폴더 관련 테이블 정의
-- 
-- 실행 방법:
--   psql "postgresql://postgres.xyqpggpilgcdsawuvpzn:ZNDqDunnaydr0aFQ@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres" -f docs/sql/008_create_folder_tables.sql
-- =====================================================

-- 1. 사용자 정의 폴더 테이블 (tbl_folder)
CREATE TABLE IF NOT EXISTS public.tbl_folder (
    id character varying NOT NULL,
    owner_id character varying,
    title character varying NOT NULL,
    memo character varying,
    tag character varying[],
    claim_vote_max_count integer DEFAULT 10,
    is_lock boolean DEFAULT false,
    icon_image character varying,
    passwd character varying,
    permission character varying DEFAULT 'private'::character varying,
    permission_write_type integer,
    locked_updated_at timestamp without time zone,
    updated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT tbl_folder_pkey PRIMARY KEY (id)
);

-- 2. 폴더 내 장소 목록 (tbl_folder_place)
CREATE TABLE IF NOT EXISTS public.tbl_folder_place (
    folder_id character varying NOT NULL,
    user_id character varying NOT NULL,
    place_id character varying NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT tbl_folder_place_pkey PRIMARY KEY (folder_id, user_id, place_id)
);

-- 3. 폴더 구독 정보 (tbl_folder_subscribed)
CREATE TABLE IF NOT EXISTS public.tbl_folder_subscribed (
    folder_id character varying NOT NULL,
    user_id character varying NOT NULL,
    activation boolean,
    updated_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT tbl_folder_subscribed_pkey PRIMARY KEY (folder_id, user_id)
);

-- 4. 네이버 공유 폴더 (tbl_naver_folder)
CREATE TABLE IF NOT EXISTS public.tbl_naver_folder (
    folder_id bigint NOT NULL,
    share_id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    memo text,
    last_use_time timestamp with time zone,
    creation_time timestamp with time zone NOT NULL,
    follow_count integer DEFAULT 0,
    view_count integer DEFAULT 0,
    url character varying(2048),
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT tbl_naver_folder_pkey PRIMARY KEY (folder_id)
);

CREATE INDEX IF NOT EXISTS idx_folder_name ON public.tbl_naver_folder USING btree (name);

-- 5. 네이버 폴더 내 장소 목록 (tbl_naver_folder_place)
CREATE TABLE IF NOT EXISTS public.tbl_naver_folder_place (
    folder_id bigint NOT NULL,
    place_id character varying(255) NOT NULL,
    CONSTRAINT tbl_naver_folder_place_pkey PRIMARY KEY (folder_id, place_id)
);

CREATE INDEX IF NOT EXISTS idx_folder_place_folder_id ON public.tbl_naver_folder_place USING btree (folder_id);
CREATE INDEX IF NOT EXISTS idx_folder_place_place_id ON public.tbl_naver_folder_place USING btree (place_id);

ALTER TABLE ONLY public.tbl_naver_folder_place
    ADD CONSTRAINT tbl_naver_folder_place_folder_id_fkey FOREIGN KEY (folder_id) REFERENCES public.tbl_naver_folder(folder_id) ON DELETE CASCADE;

ALTER TABLE ONLY public.tbl_naver_folder_place
    ADD CONSTRAINT tbl_naver_folder_place_place_id_fkey FOREIGN KEY (place_id) REFERENCES public.tbl_place(id) ON DELETE CASCADE;

-- 권한 부여
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;

-- 코멘트 추가
COMMENT ON TABLE public.tbl_folder IS '사용자 정의 장소 폴더 목록';
COMMENT ON TABLE public.tbl_naver_folder IS '네이버 지도 공유 폴더 정보';
