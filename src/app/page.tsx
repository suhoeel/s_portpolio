import Link from "next/link";
import {
  Briefcase,
  Layers,
  Mail,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { careers, profile } from "@/data/profile";
import { GithubIcon, LinkedinIcon } from "@/components/SocialIcons";
import { getPosts } from "@/lib/supabase";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata = {
  title: `${profile.name} | ${profile.role}`,
  description: `${profile.name}의 소프트웨어 엔지니어링 소개, 기술 스택 및 경력 이력`,
};

export default async function HomePage() {
  const posts = await getPosts().catch(() => []);
  const recentPosts = posts.slice(0, 3);

  return (
    <div className="mx-auto max-w-4xl px-5 py-10 sm:py-16">
      {/* 1. Profile Intro Section (메인 소개글) */}
      <section className="mb-14 border-b border-[#f2f4f6] pb-12">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[#191f28] tracking-tight">
              안녕하세요, {profile.name}입니다.
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <a
              href={profile.github}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e8eb] text-[#4e5968] hover:border-[#191f28] hover:text-[#191f28] transition-colors"
              title="GitHub"
            >
              <GithubIcon className="h-4 w-4" />
            </a>
            <a
              href={profile.linkedin}
              target="_blank"
              rel="noreferrer"
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e8eb] text-[#4e5968] hover:border-[#0a66c2] hover:text-[#0a66c2] transition-colors"
              title="LinkedIn"
            >
              <LinkedinIcon className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${profile.email}`}
              className="flex h-10 w-10 items-center justify-center rounded-full border border-[#e5e8eb] text-[#4e5968] hover:border-[#3182f6] hover:text-[#3182f6] transition-colors"
              title="Email"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>

        <p className="mt-6 text-[15px] sm:text-[16px] leading-relaxed text-[#333d4b]">
          {profile.bio}
        </p>
      </section>

      {/* 2. Core Competencies (핵심 기술 역량) */}
      <section className="mb-16">
        <h2 className="text-xl font-bold text-[#191f28] mb-5 flex items-center gap-2">
          <Layers className="h-5 w-5 text-[#3182f6]" />
          <span>핵심 기술 역량</span>
        </h2>
        <div className="rounded-2xl border border-[#eef0f3] bg-[#fafbfc] p-6 divide-y divide-[#eef0f3]">
          {profile.skills.map((s) => (
            <div
              key={s.category}
              className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-6"
            >
              <span className="text-sm font-bold text-[#191f28] sm:w-44 shrink-0">
                {s.category}
              </span>
              <div className="flex flex-wrap gap-1.5 flex-1">
                {s.items.map((item) => (
                  <span
                    key={item}
                    className="rounded-lg bg-white border border-[#e5e8eb] px-2.5 py-1 text-xs font-medium text-[#4e5968]"
                  >
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 3. Career Timeline (경력 이력) */}
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl font-bold text-[#191f28] flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-[#3182f6]" />
            <span>경력 이력 (Work Experience)</span>
          </h2>
          <span className="text-xs font-semibold text-[#6b7684]">
            총 {careers.length}개 실무 및 프로젝트
          </span>
        </div>

        <div className="relative pl-6 sm:pl-44 before:absolute before:left-2 sm:before:left-36 before:top-3 before:bottom-3 before:w-[2px] before:bg-[#d1d6db] space-y-10">
          {careers.map((career, idx) => (
            <div key={idx} className="relative group">
              {/* 타임라인 원형 포인트 */}
              <span className="absolute -left-[21px] sm:-left-[37px] top-1.5 h-3.5 w-3.5 rounded-full border-[3px] border-[#3182f6] bg-white ring-4 ring-white" />

              {/* 좌측 세로줄 옆에 표시되는 기간 날짜 */}
              <div className="mb-2 sm:mb-0 sm:absolute sm:-left-44 sm:top-0 sm:w-32 sm:text-right">
                <span className="inline-block text-xs sm:text-sm font-bold text-[#191f28] tracking-tight bg-[#f2f4f6] sm:bg-transparent px-2 sm:px-0 py-0.5 rounded">
                  {career.period}
                </span>
              </div>

              {/* 경력 내용 카드 */}
              <div className="rounded-2xl border border-[#e5e8eb] bg-[#fafbfc] p-6 hover:border-[#191f28] transition-colors shadow-xs">
                <div>
                  <h3 className="text-lg sm:text-xl font-extrabold text-[#191f28] tracking-tight">
                    {career.role}
                  </h3>
                  <p className="mt-0.5 text-base font-bold text-[#3182f6]">
                    {career.company}
                  </p>
                </div>

                <ul className="mt-4 space-y-2.5">
                  {career.description.map((desc, dIdx) => (
                    <li
                      key={dIdx}
                      className="relative pl-3.5 text-[15px] sm:text-[15.5px] font-semibold text-[#191f28] leading-relaxed before:absolute before:left-0 before:top-[10px] before:h-1.5 before:w-1.5 before:rounded-full before:bg-[#191f28]"
                    >
                      <span>{desc}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-5 flex flex-wrap gap-1.5 pt-4 border-t border-[#e5e8eb]">
                  {career.skills.map((sk) => (
                    <span
                      key={sk}
                      className="rounded-md bg-white border border-[#d1d6db] px-2.5 py-1 text-xs font-bold text-[#191f28]"
                    >
                      {sk}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 4. Recent Blog Posts (최근 블로그 글 미리보기) */}
      {recentPosts.length > 0 && (
        <section className="pt-6 border-t border-[#f2f4f6]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-[#191f28] flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#3182f6]" />
              <span>최신 기술 블로그 글</span>
            </h2>
            <Link
              href="/blog"
              className="inline-flex items-center gap-1 text-sm font-semibold text-[#3182f6] hover:underline"
            >
              <span>전체 글 보기</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="space-y-4">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group block rounded-2xl border border-[#eef0f3] bg-[#fafbfc] p-5 hover:border-[#3182f6] transition-colors"
              >
                <div className="flex items-center gap-2 text-xs">
                  <span className="rounded-md bg-white border border-[#e5e8eb] px-2 py-0.5 font-semibold text-[#3182f6]">
                    {post.category}
                  </span>
                  <span className="text-[#8b95a1]">{formatDate(post.created_at)}</span>
                </div>
                <h3 className="mt-2 text-base sm:text-lg font-bold text-[#191f28] group-hover:text-[#3182f6] transition-colors">
                  {post.title}
                </h3>
                <p className="mt-1 text-sm text-[#4e5968] line-clamp-2">
                  {post.summary}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
