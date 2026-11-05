"use client";

import dynamic from "next/dynamic";
import type { Post } from "@/types";

const KnowledgeGraph = dynamic(
  () => import("@/components/KnowledgeGraph").then((mod) => mod.KnowledgeGraph),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center bg-[#f8fafc] text-sm text-[#8b95a1]">
        <div className="flex flex-col items-center gap-2">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-[#3182f6] border-t-transparent" />
          <span>임베딩 벡터 스페이스 및 지식 그래프를 렌더링하는 중...</span>
        </div>
      </div>
    ),
  }
);

export function KnowledgeGraphWrapper({ posts }: { posts: Post[] }) {
  return <KnowledgeGraph posts={posts} />;
}
