import { adminClient, isAuthorized, publicClient } from "@/lib/supabase";
import { slugify } from "@/lib/utils";

export async function GET() {
  const { data, error } = await publicClient()
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
  return Response.json({ posts: data });
}

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, content, summary, category, tags, cover_image, slug } = body;

    if (!title || !content) {
      return Response.json({ error: "제목과 본문은 필수 입력 사항입니다." }, { status: 400 });
    }

    const generatedSlug = slug ? slugify(slug) : slugify(title);
    const postSummary = summary?.trim() || content.replace(/[#*`>|\-]/g, "").slice(0, 140).trim();

    const newPost = {
      title: title.trim(),
      slug: generatedSlug,
      content,
      summary: postSummary,
      category: category || "General",
      tags: Array.isArray(tags) ? tags : [],
      cover_image: cover_image || null,
      published: true,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await adminClient()
      .from("posts")
      .upsert(newPost, { onConflict: "slug" })
      .select()
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ post: data, success: true });
  } catch (err: any) {
    return Response.json({ error: err.message || "글 저장 중 오류 발생" }, { status: 500 });
  }
}
