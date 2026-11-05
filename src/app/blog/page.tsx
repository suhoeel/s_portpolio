import Link from "next/link";
import { getPosts, countBy } from "@/lib/supabase";
import { BlogFeed } from "@/components/BlogFeed";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "블로그 글 목록",
  description: "소프트웨어 엔지니어링 문제 해결 과정과 기술 지식을 기록한 블로그 글 목록입니다.",
};

export default async function BlogListPage() {
  const posts = await getPosts().catch(() => []);
  const allTags = posts.flatMap((p) => p.tags);
  const tagCounts = countBy(allTags);
  const categories = ["전체", ...new Set(posts.map((p) => p.category))];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      <section className="mb-10 border-b border-[#f2f4f6] pb-8">
        <h1 className="text-3xl font-extrabold tracking-tight text-[#191f28] sm:text-4xl">
          기술 블로그
        </h1>
        <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-[#4e5968]">
          개발하면서 직접 겪은 문제들과 아키텍처 고민, 학습한 지식을 쉽게 풀어 정리합니다.
        </p>
      </section>

      {/* Interactive Blog Feed */}
      <BlogFeed initialPosts={posts} categories={categories} tagCounts={tagCounts} />
    </div>
  );
}
