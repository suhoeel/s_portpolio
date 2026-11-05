import { publicClient } from "@/lib/supabase";
import type { SearchHit } from "@/types";

export async function POST(req: Request) {
  const { question } = (await req.json().catch(() => ({}))) as { question?: string };
  const q = question?.trim();
  if (!q) return Response.json({ error: "질문을 입력해 주세요." }, { status: 400 });

  // Hybrid search in Postgres (FTS + substring/trigram, + vector once embeddings exist), fused with RRF.
  const { data, error } = await publicClient().rpc("search_knowledge", { query_text: q, match_count: 6 });
  if (error) return Response.json({ error: error.message }, { status: 500 });
  const hits = (data ?? []) as SearchHit[];

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || hits.length === 0) {
    return Response.json({ mode: "search", answer: null, hits });
  }

  // Optional: generate an answer grounded only in the retrieved chunks.
  const context = hits
    .map((h, i) => `[${i + 1}] 글: ${h.title} / 섹션: ${h.heading ?? ""}\n${h.content}`)
    .join("\n\n---\n\n");
  const prompt = `너는 개발자 블로그의 지식 도우미다. 아래 블로그 글 발췌만 근거로 한국어로 간결하게 답해라. 발췌에 없는 내용은 모른다고 말해라. 근거로 쓴 발췌 번호를 [1]처럼 표시해라.\n\n# 발췌\n${context}\n\n# 질문\n${q}`;

  try {
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] }),
      }
    );
    if (!res.ok) throw new Error(`Gemini ${res.status}`);
    const json = await res.json();
    const answer: string | undefined = json?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("");
    return Response.json({ mode: "llm", answer: answer ?? null, hits });
  } catch (e) {
    // Fall back to search results if the LLM call fails.
    return Response.json({ mode: "search", answer: null, hits, warning: (e as Error).message });
  }
}
