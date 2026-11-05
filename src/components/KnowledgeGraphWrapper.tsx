"use client";

import dynamic from "next/dynamic";
import type { Post } from "@/types";

const KnowledgeGraph = dynamic(
  () => import("@/components/KnowledgeGraph").then((mod) => mod.KnowledgeGraph),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[720px] w-full items-center justify-center rounded-2xl border border-[#e5e8eb] bg-[#fafbfc] text-sm text-[#8b95a1]">
        지식 그래프 캔버스를 불러오는 중입니다...
      </div>
    ),
  }
);

export function KnowledgeGraphWrapper({ posts }: { posts: Post[] }) {
  return <KnowledgeGraph posts={posts} />;
}
