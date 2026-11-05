import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, Calendar, MessageSquare, Share2, Sparkles, Tag } from "lucide-react";
import { getPost, getPosts } from "@/lib/supabase";
import { formatDate, extractToc } from "@/lib/utils";
import { Markdown } from "@/components/Markdown";
import { TableOfContents } from "@/components/TableOfContents";
import { AskAiButton } from "@/components/AskAiButton";
import { profile } from "@/data/profile";

export const dynamic = "force-dynamic";

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "포스트를 찾을 수 없습니다" };
  return {
    title: post.title,
    description: post.summary,
    openGraph: {
      title: post.title,
      description: post.summary,
      images: post.cover_image ? [post.cover_image] : [],
    },
  };
}

export default async function BlogPostPage({ params }: PostPageProps) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) {
    notFound();
  }

  const toc = extractToc(post.content);

  return (
    <div className="mx-auto max-w-4xl px-5 py-8 sm:py-12">
      {/* Top Nav Back */}
      <div className="mb-8">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8b95a1] hover:text-[#191f28] transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>전체 글 목록으로</span>
        </Link>
      </div>

      {/* Article Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-semibold text-[#3182f6]">{post.category}</span>
          <span className="text-[#d1d6db]">·</span>
          <span className="text-[#8b95a1]">{formatDate(post.created_at)}</span>
        </div>

        <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-[#191f28] sm:text-4xl lg:text-5xl leading-tight">
          {post.title}
        </h1>

        <p className="mt-4 text-lg leading-relaxed text-[#4e5968] border-l-2 border-[#3182f6] pl-4 bg-[#f8f9fa] py-2.5 rounded-r-lg">
          {post.summary}
        </p>

        {/* Tags */}
        <div className="mt-5 flex flex-wrap gap-1.5">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-[#f2f4f6] px-2.5 py-1 text-xs font-medium text-[#4e5968]"
            >
              #{tag}
            </span>
          ))}
        </div>
      </header>

      {/* Cover Image */}
      {post.cover_image && (
        <div className="relative mb-12 h-64 w-full sm:h-96 overflow-hidden rounded-2xl border border-[#eef0f3] bg-[#f8f9fa]">
          <Image
            src={post.cover_image}
            alt={post.title}
            fill
            priority
            className="object-cover"
          />
        </div>
      )}

      {/* Main Content Layout with TOC */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* Article Body */}
        <div className="lg:col-span-3">
          <Markdown content={post.content} />

          {/* Author Profile Card */}
          <div className="mt-10 flex items-center gap-4 border-t border-[#f2f4f6] pt-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#191f28] font-bold text-white text-base">
              {profile.name[0]}
            </div>
            <div>
              <p className="font-bold text-[#191f28]">{profile.name}</p>
              <p className="text-xs text-[#8b95a1] mt-0.5">{profile.role}</p>
            </div>
          </div>
        </div>

        {/* Desktop Sticky Table of Contents */}
        {toc.length > 0 && (
          <aside className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24 space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8b95a1]">
                목차 (Table of Contents)
              </span>
              <TableOfContents items={toc} />
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}
