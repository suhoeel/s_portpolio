import { getPosts } from "@/lib/supabase";
import { KnowledgeGraphWrapper } from "@/components/KnowledgeGraphWrapper";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "지식 그래프",
  description: "작성한 블로그 글과 기술 태그 간의 유기적인 관계를 시각적으로 탐색합니다.",
};

export default async function GraphPage() {
  const posts = await getPosts().catch(() => []);

  return (
    <div className="mx-auto max-w-6xl px-5 py-6 sm:py-10">
      <KnowledgeGraphWrapper posts={posts} />
    </div>
  );
}
