"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Node,
  Edge,
  BackgroundVariant,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { ArrowUpRight, BookOpen, ExternalLink, Network, Search, Sparkles, Tag, X } from "lucide-react";
import type { Post } from "@/types";
import { openChat } from "@/components/ChatWidget";

interface KnowledgeGraphProps {
  posts: Post[];
}

interface SelectedInfo {
  type: "post" | "tag";
  title: string;
  slug?: string;
  summary?: string;
  category?: string;
  relatedPosts?: { title: string; slug: string }[];
}

function buildGraphElements(posts: Post[]): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  const allTags = Array.from(new Set(posts.flatMap((p) => p.tags)));
  const centerX = 400;
  const centerY = 320;

  // 1. 태그 노드 (중심원 반경 170)
  const tagRadius = 170;
  allTags.forEach((tag, idx) => {
    const angle = (idx / (allTags.length || 1)) * 2 * Math.PI;
    const x = centerX + tagRadius * Math.cos(angle);
    const y = centerY + tagRadius * Math.sin(angle);

    nodes.push({
      id: `tag-${tag}`,
      position: { x, y },
      data: {
        label: (
          <div className="flex items-center gap-1 text-xs font-semibold text-[#3182f6]">
            <Tag className="h-3 w-3 shrink-0" />
            <span>#{tag}</span>
          </div>
        ),
        rawType: "tag",
        rawTag: tag,
      },
      style: {
        background: "#f4f8ff",
        border: "1.5px solid #b2d4ff",
        borderRadius: "9999px",
        padding: "6px 14px",
        boxShadow: "0 2px 8px rgba(49, 130, 246, 0.08)",
        cursor: "pointer",
      },
    });
  });

  // 2. 글(Post) 노드 (외곽원 반경 330)
  const postRadius = 330;
  posts.forEach((post, idx) => {
    const angle = (idx / (posts.length || 1)) * 2 * Math.PI;
    const x = centerX + postRadius * Math.cos(angle);
    const y = centerY + postRadius * Math.sin(angle);

    nodes.push({
      id: `post-${post.id}`,
      position: { x, y },
      data: {
        label: (
          <div className="flex flex-col gap-0.5 text-left">
            <span className="text-[10px] font-bold uppercase text-[#3182f6] tracking-wide">
              {post.category}
            </span>
            <span className="text-xs font-bold text-[#191f28] line-clamp-1">
              {post.title}
            </span>
          </div>
        ),
        rawType: "post",
        rawPost: post,
      },
      style: {
        background: "#ffffff",
        border: "1.5px solid #d1d6db",
        borderRadius: "12px",
        padding: "10px 14px",
        width: 190,
        boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)",
        cursor: "pointer",
      },
    });

    // 3. 포스트와 해당 태그를 연결하는 엣지 생성
    post.tags.forEach((tag) => {
      edges.push({
        id: `edge-${post.id}-${tag}`,
        source: `post-${post.id}`,
        target: `tag-${tag}`,
        style: { stroke: "#cbd5e1", strokeWidth: 1.5 },
        animated: false,
      });
    });
  });

  return { nodes, edges };
}

export function KnowledgeGraph({ posts }: KnowledgeGraphProps) {
  const [selectedInfo, setSelectedInfo] = useState<SelectedInfo | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraphElements(posts),
    [posts]
  );

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // 노드 클릭 시 상세 정보 서랍 열기
  const onNodeClick = useCallback(
    (_: any, node: Node) => {
      const data = node.data as any;
      if (data.rawType === "post") {
        const post = data.rawPost as Post;
        setSelectedInfo({
          type: "post",
          title: post.title,
          slug: post.slug,
          summary: post.summary,
          category: post.category,
        });
      } else if (data.rawType === "tag") {
        const tag = data.rawTag as string;
        const related = posts.filter((p) => p.tags.includes(tag));
        setSelectedInfo({
          type: "tag",
          title: `#${tag}`,
          relatedPosts: related.map((p) => ({ title: p.title, slug: p.slug })),
        });
      }
    },
    [posts]
  );

  // 검색 시 노드 하이라이팅
  const filteredNodes = useMemo(() => {
    if (!searchQuery.trim()) return nodes;
    const q = searchQuery.toLowerCase();
    return nodes.map((n) => {
      const d = n.data as any;
      let match = false;
      if (d.rawType === "post") {
        const p = d.rawPost as Post;
        match = p.title.toLowerCase().includes(q) || p.summary.toLowerCase().includes(q);
      } else if (d.rawType === "tag") {
        match = d.rawTag.toLowerCase().includes(q);
      }
      return {
        ...n,
        style: {
          ...n.style,
          opacity: match ? 1 : 0.2,
          borderColor: match ? "#3182f6" : n.style?.borderColor,
        },
      };
    });
  }, [nodes, searchQuery]);

  return (
    <div className="relative h-[720px] w-full overflow-hidden rounded-2xl border border-[#e5e8eb] bg-[#fafbfc] shadow-sm">
      {/* Top Floating Controls */}
      <div className="absolute left-5 top-5 z-10 flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-[#e5e8eb] bg-white/95 px-3.5 py-1.5 shadow-sm backdrop-blur-sm">
          <Search className="h-4 w-4 text-[#8b95a1]" />
          <input
            type="text"
            placeholder="글 또는 태그 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-48 sm:w-60 bg-transparent text-xs text-[#191f28] placeholder:text-[#8b95a1] focus:outline-none"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")} className="text-[#8b95a1] hover:text-[#191f28]">
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        <div className="hidden sm:flex items-center gap-3 rounded-full border border-[#e5e8eb] bg-white/95 px-3.5 py-1.5 text-xs text-[#6b7684] shadow-sm backdrop-blur-sm">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#3182f6]" /> 태그 (Tag)
          </span>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="h-2 w-2 rounded-full bg-[#191f28]" /> 블로그 글 (Post)
          </span>
        </div>
      </div>

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={filteredNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#e5e8eb" />
        <Controls className="!border-[#e5e8eb] !bg-white !shadow-sm !text-[#191f28]" />
        <MiniMap
          nodeColor={(n) => ((n.data as any).rawType === "tag" ? "#3182f6" : "#191f28")}
          className="!border-[#e5e8eb] !bg-white !shadow-sm"
          maskColor="rgba(240, 242, 245, 0.6)"
        />
      </ReactFlow>

      {/* Selected Node Drawer */}
      {selectedInfo && (
        <div className="absolute right-5 top-5 bottom-5 z-20 w-80 sm:w-96 rounded-2xl border border-[#e5e8eb] bg-white p-6 shadow-xl flex flex-col justify-between overflow-y-auto animate-fade-up">
          <div>
            <div className="flex items-start justify-between">
              <span className="rounded-md bg-[#f2f4f6] px-2 py-0.5 text-xs font-semibold text-[#3182f6]">
                {selectedInfo.type === "post" ? selectedInfo.category : "TAG"}
              </span>
              <button
                onClick={() => setSelectedInfo(null)}
                className="rounded-lg p-1 text-[#8b95a1] hover:bg-[#f2f4f6] hover:text-[#191f28]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <h3 className="mt-3 text-lg font-bold text-[#191f28] leading-snug">
              {selectedInfo.title}
            </h3>

            {selectedInfo.summary && (
              <p className="mt-2 text-sm leading-relaxed text-[#4e5968]">
                {selectedInfo.summary}
              </p>
            )}

            {selectedInfo.relatedPosts && (
              <div className="mt-4">
                <span className="text-xs font-bold text-[#8b95a1] uppercase">이 태그가 포함된 글:</span>
                <ul className="mt-2 space-y-2">
                  {selectedInfo.relatedPosts.map((rp) => (
                    <li key={rp.slug}>
                      <Link
                        href={`/blog/${rp.slug}`}
                        className="flex items-center gap-1.5 text-xs font-semibold text-[#191f28] hover:text-[#3182f6]"
                      >
                        <BookOpen className="h-3.5 w-3.5 text-[#3182f6] shrink-0" />
                        <span className="line-clamp-1">{rp.title}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="mt-6 space-y-2 pt-4 border-t border-[#f2f4f6]">
            {selectedInfo.type === "post" && selectedInfo.slug && (
              <Link
                href={`/blog/${selectedInfo.slug}`}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#191f28] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#333d4b] transition-colors"
              >
                <span>글 본문 읽기</span>
                <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}

            <button
              onClick={() => {
                openChat(`지식 그래프의 [${selectedInfo.title}]에 관련된 내용을 블로그에서 찾아 요약해줘.`);
              }}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#3182f6] bg-[#f4f8ff] px-4 py-2.5 text-xs font-semibold text-[#3182f6] hover:bg-[#e8f1ff] transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>AI에게 이 지식 질문하기</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
