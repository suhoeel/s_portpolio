"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Calendar, Clock, Search, Tag, X } from "lucide-react";
import type { Post } from "@/types";
import { formatDate, readingTime } from "@/lib/utils";

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

  return (
    <div>
      {/* Category Tabs & Search Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-8">
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

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8b95a1]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="글 제목, 내용, 태그 검색..."
            className="w-full sm:w-64 rounded-full border border-[#e5e8eb] bg-[#f9fafb] pl-9 pr-4 py-2 text-sm text-[#191f28] placeholder:text-[#8b95a1] focus:border-[#3182f6] focus:bg-white focus:outline-none"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8b95a1] hover:text-[#191f28]"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

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
                  ? "bg-[#3182f6] text-white"
                  : "bg-[#f9fafb] text-[#6b7684] border border-[#eef0f3] hover:border-[#d1d6db]"
              }`}
            >
              #{tag} <span className="opacity-70 text-[10px] ml-0.5">{count}</span>
            </button>
          ))}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs text-[#3182f6] underline ml-2 hover:text-[#1b64da]"
            >
              태그 초기화
            </button>
          )}
        </div>
      )}

      {/* Post List Feed */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[#e5e8eb] bg-[#fafbfc] py-20 text-center">
          <p className="text-[15px] font-medium text-[#6b7684]">검색 조건에 맞는 포스트가 없습니다.</p>
          <button
            onClick={() => {
              setSelectedCategory("전체");
              setSelectedTag(null);
              setSearchQuery("");
            }}
            className="mt-3 text-xs font-semibold text-[#3182f6] underline"
          >
            모든 필터 초기화
          </button>
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
                    <span className="text-[#b0b8c1]">·</span>
                    <span className="flex items-center gap-1 text-[#8b95a1]">
                      <Clock className="h-3 w-3" />
                      {readingTime(post.content)}
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
