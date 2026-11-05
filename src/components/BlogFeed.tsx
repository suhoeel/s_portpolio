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

const CATEGORY_STYLES: Record<string, { bg: string; text: string; dot: string }> = {
  "Search & RAG": { bg: "#E0EFFF", text: "#0052CC", dot: "#0052CC" },
  "Information Retrieval": { bg: "#E3FCEF", text: "#00875A", dot: "#00875A" },
  "Ranking Algorithm": { bg: "#FFEBE6", text: "#DE350B", dot: "#DE350B" },
  "Data Visualization": { bg: "#EAE6FF", text: "#5243AA", dot: "#5243AA" },
  default: { bg: "#F4F5F7", text: "#42526E", dot: "#42526E" },
};

function getCategoryStyle(category: string) {
  return CATEGORY_STYLES[category] || CATEGORY_STYLES.default;
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
      {/* Category Tabs & Search Bar (Notion Clean Layout) */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6 pb-4 border-b border-[#EBECF0]">
        {/* Category Tabs */}
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                setSelectedTag(null);
              }}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors ${
                selectedCategory === cat && !selectedTag
                  ? "bg-[#172B4D] text-white"
                  : "bg-[#FAFBFC] text-[#5E6C84] border border-[#EBECF0] hover:bg-[#F4F5F7] hover:text-[#172B4D]"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative flex items-center sm:w-72">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B778C]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="포스트 또는 태그 검색..."
            className="w-full rounded-md border border-[#DFE1E6] bg-[#FAFBFC] pl-8 pr-7 py-1.5 text-xs text-[#172B4D] placeholder:text-[#8993A4] focus:border-[#0052CC] focus:bg-white focus:outline-none transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8993A4] hover:text-[#172B4D]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Notion Callout Box when searching */}
      {searchQuery.trim() && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-[#B3D4FF] bg-[#F4F8FF] px-4 py-2.5 text-xs text-[#172B4D]">
          <div className="flex items-center gap-2 truncate">
            <Sparkles className="h-4 w-4 text-[#0052CC] shrink-0" />
            <span className="truncate">
              &lsquo;<strong className="font-bold text-[#0052CC]">{searchQuery}</strong>&rsquo; 관련 지식을 AI에게 질문할 수 있습니다.
            </span>
          </div>
          <button
            onClick={() => openChat(searchQuery.trim())}
            className="ml-3 shrink-0 rounded bg-[#0052CC] px-2.5 py-1 text-xs font-semibold text-white hover:bg-[#0747A6] transition-colors"
          >
            질문하기 ↵
          </button>
        </div>
      )}

      {/* Tag Filter Pills */}
      {tagCounts.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-bold text-[#6B778C] mr-1 flex items-center gap-1">
            <Tag className="h-3 w-3" /> 태그:
          </span>
          {tagCounts.slice(0, 10).map(([tag, count]) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`rounded px-2 py-0.5 text-xs font-medium transition-colors ${
                selectedTag === tag
                  ? "bg-[#0052CC] text-white"
                  : "bg-[#FAFBFC] text-[#5E6C84] border border-[#EBECF0] hover:border-[#DFE1E6]"
              }`}
            >
              #{tag} <span className="opacity-70 text-[10px] ml-0.5">{count}</span>
            </button>
          ))}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs text-[#0052CC] font-semibold hover:underline ml-1"
            >
              초기화
            </button>
          )}
        </div>
      )}

      {/* Post List Feed: Document & Material Clean Style */}
      {filteredPosts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#DFE1E6] bg-[#FAFBFC] py-16 px-6 text-center">
          <p className="text-sm font-semibold text-[#172B4D]">
            {searchQuery
              ? `'${searchQuery}'에 대한 포스트를 찾을 수 없습니다.`
              : "조건에 맞는 포스트가 없습니다."}
          </p>
          <button
            onClick={() => {
              setSelectedCategory("전체");
              setSelectedTag(null);
              setSearchQuery("");
            }}
            className="mt-3 rounded border border-[#DFE1E6] bg-white px-3 py-1.5 text-xs font-semibold text-[#172B4D] hover:bg-[#F4F5F7]"
          >
            필터 초기화
          </button>
        </div>
      ) : (
        <div className="divide-y divide-[#EBECF0]">
          {filteredPosts.map((post) => {
            const catStyle = getCategoryStyle(post.category);

            return (
              <article key={post.id} className="group py-7 transition-colors first:pt-0">
                <div className="flex flex-col-reverse gap-5 sm:flex-row sm:items-start sm:justify-between">
                  {/* Content Area */}
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold"
                        style={{ backgroundColor: catStyle.bg, color: catStyle.text }}
                      >
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: catStyle.dot }} />
                        {post.category}
                      </span>
                      <span className="text-[#C1C7D0]">·</span>
                      <span className="flex items-center gap-1 text-xs text-[#6B778C]">
                        <Calendar className="h-3 w-3" />
                        {formatDate(post.created_at)}
                      </span>
                    </div>

                    <Link href={`/blog/${post.slug}`} className="block mt-2">
                      <h2 className="text-lg font-bold tracking-tight text-[#172B4D] group-hover:text-[#0052CC] transition-colors sm:text-xl leading-snug">
                        {post.title}
                      </h2>
                    </Link>

                    <p className="mt-2 text-sm leading-relaxed text-[#5E6C84] line-clamp-2">
                      {post.summary}
                    </p>

                    <div className="mt-3 flex flex-wrap items-center gap-1.5">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          onClick={(e) => {
                            e.preventDefault();
                            setSelectedTag(tag);
                          }}
                          className="cursor-pointer rounded bg-[#FAFBFC] border border-[#EBECF0] px-2 py-0.5 text-[11px] font-medium text-[#5E6C84] hover:border-[#DFE1E6] hover:text-[#172B4D] transition-colors"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Thumbnail */}
                  {post.cover_image && (
                    <Link
                      href={`/blog/${post.slug}`}
                      className="relative block h-40 w-full sm:h-32 sm:w-48 shrink-0 overflow-hidden rounded-lg border border-[#EBECF0] bg-[#FAFBFC] transition-transform duration-200 group-hover:border-[#B3D4FF]"
                    >
                      <Image
                        src={post.cover_image}
                        alt={post.title}
                        fill
                        sizes="(max-width: 640px) 100vw, 192px"
                        className="object-cover"
                      />
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
