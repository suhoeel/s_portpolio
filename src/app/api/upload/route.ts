import { adminClient, isAuthorized } from "@/lib/supabase";

export async function POST(req: Request) {
  if (!isAuthorized(req)) {
    return Response.json({ error: "관리자 인증이 필요합니다." }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return Response.json({ error: "업로드할 파일이 없습니다." }, { status: 400 });
    }

    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await adminClient()
      .storage
      .from("blog-images")
      .upload(fileName, buffer, {
        contentType: file.type || "image/jpeg",
        upsert: false,
      });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    // Public URL 획득
    const { data } = adminClient().storage.from("blog-images").getPublicUrl(fileName);
    return Response.json({ url: data.publicUrl, fileName });
  } catch (err: any) {
    return Response.json({ error: err.message || "업로드 중 오류 발생" }, { status: 500 });
  }
}
