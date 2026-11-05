"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Search, Sparkles, Tag, X } from "lucide-react";
import type { Post } from "@/types";
import { formatDate } from "@/lib/utils";
import { openChat } from "@/components/ChatWidget";

interface BlogFeedProps {
  initialPosts: Post[];
  categories: string[];
  tagCounts: [string, number][];
}

export function BlogFeed({ initialPosts, categories, tagCounts }: BlogFeedProps) {
  const [selectedCategory, setSelectedCategory] = useState("전체");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredPosts = initialPosts.filter((post) => {
    const matchesCategory =
      selectedCategory === "전체" || post.category === selectedCategory;
    const matchesTag = !selectedTag || post.tags.includes(selectedTag);
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      post.title.toLowerCase().includes(q) ||
      post.summary.toLowerCase().includes(q) ||
      post.tags.some((t) => t.toLowerCase().includes(q));

    return matchesCategory && matchesTag && matchesSearch;
  });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      openChat(searchQuery.trim());
    }
  };

  return (
    <div>
      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-4">
        {/* Category Tabs */}
        <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedTag(null);
              }}
              className={`rounded-full px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                selectedCategory === cat && !selectedTag
                  ? "bg-[#191f28] text-white shadow-sm"
                  : "bg-[#f2f4f6] text-[#4e5968] hover:bg-[#e5e8eb] hover:text-[#191f28]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Integrated Search & AI Query Bar */}
        <div className="relative flex items-center sm:w-80">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b95a1]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="글 검색 또는 AI 질문..."
            className="w-full rounded-full border border-[#e5e8eb] bg-[#f9fafb] pl-9 pr-24 py-2 text-sm text-[#191f28] placeholder:text-[#8b95a1] focus:border-[#3182f6] focus:bg-white focus:outline-none transition-all shadow-sm"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 text-[#8b95a1] hover:text-[#191f28]"
                title="검색어 지우기"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={() => openChat(searchQuery || undefined)}
              className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700 transition-all"
              title="AI 지식 챗봇에게 질문하기 (Enter)"
            >
              <Sparkles className="h-3 w-3" />
              <span>AI</span>
            </button>
          </div>
        </div>
      </div>

      {/* Dynamic AI Quick Prompt Bar when typing search query */}
      {searchQuery.trim() && (
        <div className="mb-6 flex items-center justify-between rounded-xl bg-gradient-to-r from-blue-50/90 via-indigo-50/70 to-blue-50/90 border border-blue-100/80 px-4 py-2.5 text-xs transition-all shadow-xs animate-in fade-in">
          <div className="flex items-center gap-2 text-[#3182f6] font-medium truncate">
            <Sparkles className="h-4 w-4 shrink-0 text-[#3182f6]" />
            <span className="truncate text-[#191f28]">
              &lsquo;<strong className="font-semibold text-[#1b64da]">{searchQuery}</strong>&rsquo;에 대해 블로그 문맥 기반으로 AI에게 바로 물어볼까요?
            </span>
          </div>
          <button
            onClick={() => openChat(searchQuery.trim())}
            className="ml-3 shrink-0 inline-flex items-center gap-1 rounded-lg bg-[#3182f6] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#1b64da] shadow-xs transition-colors"
          >
            <span>AI 질의하기</span>
            <span className="text-[10px] opacity-75 hidden sm:inline">↵</span>
          </button>
        </div>
      )}

      {/* Tag Filter Pills */}
      {tagCounts.length > 0 && (
        <div className="mb-8 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-[#8b95a1] mr-1 flex items-center gap-1">
            <Tag className="h-3 w-3" /> 태그:
          </span>
          {tagCounts.slice(0, 10).map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`rounded-lg px-2.5 py-1 text-xs font-medium transition-colors ${
                selectedTag === tag
                  ? "bg-[#3182f6] text-white shadow-xs"
                  : "bg-[#f9fafb] text-[#6b7684] border border-[#eef0f3] hover:border-[#d1d6db]"
              }`}
            >
              #{tag} <span className="opacity-70 text-[10px] ml-0.5">{count}</span>
            </button>
          ))}
          {selectedTag && (
            <div className="inline-flex items-center gap-2 ml-1">
              <button
                onClick={() => setSelectedTag(null)}
                className="text-xs text-[#8b95a1] hover:text-[#4e5968] underline"
              >
                태그 초기화
              </button>
              <button
                onClick={() => openChat(`${selectedTag}에 대해 쉽게 설명해줘`)}
                className="inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[11px] font-medium text-[#3182f6] hover:bg-blue-100/60 transition-colors"
              >
                <Sparkles className="h-2.5 w-2.5" />
                <span>#{selectedTag} AI 설명</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Post List Feed */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e5e8eb] bg-[#fafbfc] py-16 px-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-[#3182f6]">
            <Sparkles className="h-6 w-6" />
          </div>
          <p className="text-[15px] font-semibold text-[#191f28]">
            {searchQuery
              ? `'${searchQuery}'에 대한 포스트를 찾을 수 없습니다.`
              : "조건에 맞는 포스트가 없습니다."}
          </p>
          <p className="mt-1.5 text-xs text-[#8b95a1] max-w-md mx-auto leading-relaxed">
            포스트 본문에 직접적인 키워드가 없더라도, AI 지식 검색이 블로그 전체의 의미론적 문맥을 파악해 답변을 드릴 수 있습니다.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {searchQuery && (
              <button
                onClick={() => openChat(searchQuery.trim())}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#3182f6] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#1b64da] transition-colors"
              >
                <Sparkles className="h-3.5 w-3.5" />
                AI에게 &lsquo;{searchQuery}&rsquo; 직접 질문하기
              </button>
            )}
            <button
              onClick={() => {
                setSelectedCategory("전체");
                setSelectedTag(null);
                setSearchQuery("");
              }}
              className="rounded-xl border border-[#e5e8eb] bg-white px-3.5 py-2 text-xs font-medium text-[#4e5968] hover:bg-[#f2f4f6] transition-colors"
            >
              모든 필터 초기화
            </button>
          </div>
        </div>
      ) : (
        <div className="divide-y divide-[#f2f4f6]">
          {filteredPosts.map((post, index) => (
            <article
              key={post.id}
              className="group py-9 transition-colors first:pt-0"
              style={{ "--i": index } as React.CSSProperties}
            >
              <div className="flex flex-col-reverse gap-6 sm:flex-row sm:items-start sm:justify-between">
                
                {/* Text Content */}
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="rounded-md bg-[#f2f4f6] px-2 py-0.5 font-semibold text-[#4e5968]">
                      {post.category}
                    </span>
                    <span className="text-[#b0b8c1]">·</span>
                    <span className="flex items-center gap-1 text-[#8b95a1]">
                      <Calendar className="h-3 w-3" />
                      {formatDate(post.created_at)}
                    </span>
                  </div>

                  <Link href={`/blog/${post.slug}`} className="block mt-2.5">
                    <h2 className="text-xl font-bold tracking-tight text-[#191f28] group-hover:text-[#3182f6] transition-colors sm:text-2xl leading-snug">
                      {post.title}
                    </h2>
                  </Link>

                  <p className="mt-2 text-[15px] leading-relaxed text-[#4e5968] line-clamp-2">
                    {post.summary}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-1.5">
                    {post.tags.map((tag) => (
                      <span
                        key={tag}
                        onClick={(e) => {
                          e.preventDefault();
                          setSelectedTag(tag);
                        }}
                        className="cursor-pointer rounded-md bg-[#f8f9fa] border border-[#f0f2f5] px-2 py-0.5 text-xs text-[#6b7684] hover:bg-[#eef1f4] transition-colors"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cover Image Thumbnail */}
                {post.cover_image && (
                  <Link
                    href={`/blog/${post.slug}`}
                    className="relative block h-44 w-full sm:h-36 sm:w-56 shrink-0 overflow-hidden rounded-xl border border-[#eef0f3] bg-[#f8f9fa] shadow-sm transition-transform duration-300 group-hover:scale-[1.02]"
                  >
                    <Image
                      src={post.cover_image}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, 224px"
                      className="object-cover"
                      priority={index < 2}
                    />
                  </Link>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
