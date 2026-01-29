import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";

interface ParseRequest {
  url: string;
  place_id: string;
  user_id?: string;
}

serve(async (req) => {
  // CORS 처리
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { url, place_id, user_id: body_user_id } = await req.json() as ParseRequest;

    // Authorization 헤더에서 유저 ID 추출 (JWT가 활성화되어 있으므로)
    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    const user_id = user?.id || body_user_id || "db2ee1b5-0315-49c6-a226-7b621e01da82";

    if (!url) {
      throw new Error("URL is required");
    }

    if (!place_id) {
      throw new Error("place_id is required");
    }

    // URL 파싱 및 메타데이터 추출
    const result = await parseSocialUrl(url);
    
    // DB 저장 데이터 준비
    const featureData = {
      user_id,
      place_id,
      platform_type: result.platform_type,
      content_url: url,
      title: result.title,
      metadata: result.metadata,
      status: 'active',
      published_at: new Date().toISOString()
    };

    // DB Insert/Upsert
    const { data, error: dbError } = await supabaseAdmin
      .from("tbl_place_features")
      .insert(featureData)
      .select()
      .single();

    if (dbError) throw dbError;

    return new Response(JSON.stringify({ status: "SUCCESS", data }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ status: "ERROR", error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

async function parseSocialUrl(url: string) {
  const urlObj = new URL(url);
  const hostname = urlObj.hostname.toLowerCase();

    // Threads 전용 파싱
    if (hostname.includes("threads.net") || hostname.includes("threads.com")) {
      return await parseThreadsUrl(url);
    }

    // Instagram 전용 파싱
    if (hostname.includes("instagram.com")) {
      return await parseInstagramUrl(url);
    }

  // 기본 메타 데이터 추출 (기타 서비스)
  return await fetchGeneralMeta(url);
}

async function parseInstagramUrl(url: string) {
  // 패턴: https://www.instagram.com/p/postId/ 또는 reels, reel
  const regex = /https?:\/\/(?:www\.)?instagram\.com\/(?:p|reels|reel)\/([^\/\?#]+)/;
  const match = url.match(regex);
  
  const postId = match ? match[1] : "";
  const type = "post";

  // Fetch meta data
  const meta = await fetchGeneralMeta(url);

  return {
    platform_type: "social",
    title: meta.title || `Instagram post`,
    metadata: {
      service: "instagram",
      post_id: postId,
      type: type,
      original_meta: meta.metadata
    }
  };
}

async function parseThreadsUrl(url: string) {
  // 패턴: https://www.threads.net/@username/post/postId
  const regex = /https?:\/\/(?:www\.)?threads\.(?:net|com)\/(@[^\/\?#]+)\/post\/([^\/\?#]+)/;
  const match = url.match(regex);
  
  const username = match ? match[1] : "";
  const postId = match ? match[2] : "";
  const type = "post";

  // Fetch meta data
  const meta = await fetchGeneralMeta(url);

  return {
    platform_type: "social",
    title: meta.title || `Threads post by ${username}`,
    metadata: {
      service: "threads",
      username: username,
      post_id: postId,
      type: type,
      original_meta: meta.metadata
    }
  };
}

async function fetchGeneralMeta(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      }
    });
    const html = await response.text();

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "";

    const metaTags: Record<string, string> = {};
    const metaRegex = /<meta\s+(?:property|name)="([^"]+)"\s+content="([^"]+)"/gi;
    let match;
    while ((match = metaRegex.exec(html)) !== null) {
      metaTags[match[1]] = match[2];
    }

    return {
      title: metaTags["og:title"] || title,
      metadata: {
        description: metaTags["og:description"] || metaTags["description"] || "",
        image: metaTags["og:image"] || "",
        site_name: metaTags["og:site_name"] || ""
      }
    };
  } catch (e) {
    console.error("Fetch meta error:", e);
    return {
      title: "",
      metadata: {}
    };
  }
}
