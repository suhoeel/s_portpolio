import { getPosts } from "@/lib/supabase";
import { KnowledgeGraphWrapper } from "@/components/KnowledgeGraphWrapper";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "시맨틱 지식 그래프 & 벡터 스페이스",
  description: "고차원 임베딩 벡터와 차원 축소(PCA)를 통해 포스트 간의 시맨틱 유사도와 유클리드 거리를 탐색합니다.",
};

export default async function GraphPage() {
  const posts = await getPosts().catch(() => []);

  return (
    <div className="mx-auto w-full max-w-[1700px] px-3 sm:px-6 py-4">
      <KnowledgeGraphWrapper posts={posts} />
    </div>
  );
}
