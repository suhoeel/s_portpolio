import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Search, Tag } from "lucide-react";
import { getPosts, countBy } from "@/lib/supabase";
import { formatDate, readingTime } from "@/lib/utils";
import { profile } from "@/data/profile";
import { BlogFeed } from "@/components/BlogFeed";

// 매 요청마다 Supabase의 최신 글을 가져오도록 설정
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const posts = await getPosts().catch(() => []);
  const allTags = posts.flatMap((p) => p.tags);
  const tagCounts = countBy(allTags);
  const categories = ["전체", ...new Set(posts.map((p) => p.category))];

  return (
    <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
      {/* Blog Intro Header */}
      <section className="mb-12 border-b border-[#f2f4f6] pb-10">
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-extrabold tracking-tight text-[#191f28] sm:text-4xl">
            {profile.name}의 기술 블로그
          </h1>
          <p className="max-w-2xl text-[16px] leading-relaxed text-[#4e5968]">
            문제 해결 과정과 아키텍처 의사결정을 글과 그림으로 기록합니다.
          </p>
        </div>
      </section>

      {/* Interactive Blog Feed (검색, 카테고리 탭, 글 목록) */}
      <BlogFeed initialPosts={posts} categories={categories} tagCounts={tagCounts} />
    </div>
  );
}
