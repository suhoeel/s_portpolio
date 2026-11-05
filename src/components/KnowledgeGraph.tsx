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
import {
  ArrowRight,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Compass,
  FileText,
  Hash,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type { Post } from "@/types";
import {
  cosineSimilarity,
  euclideanDistance,
  generateSemanticEmbedding,
  projectPCA2D,
} from "@/lib/vector";

interface KnowledgeGraphProps {
  posts: Post[];
}

interface ParsedPostVector {
  post: Post;
  vector: number[];
}

interface RankedSimilarityItem {
  post: Post;
  similarity: number;
  distance: number;
  rank: number;
}

// Notion & Material Clean High-Contrast Vivid Palette
const NOTION_COLORS: Record<string, { bg: string; text: string; border: string; dot: string }> = {
  "Search & RAG": {
    bg: "#E0EFFF",
    text: "#0052CC",
    border: "#B3D4FF",
    dot: "#0052CC",
  },
  "Information Retrieval": {
    bg: "#E3FCEF",
    text: "#00875A",
    border: "#ABF5D1",
    dot: "#00875A",
  },
  "Ranking Algorithm": {
    bg: "#FFEBE6",
    text: "#DE350B",
    border: "#FFBDAD",
    dot: "#DE350B",
  },
  "Data Visualization": {
    bg: "#EAE6FF",
    text: "#5243AA",
    border: "#C0B6F2",
    dot: "#5243AA",
  },
  default: {
    bg: "#F4F5F7",
    text: "#42526E",
    border: "#DFE1E6",
    dot: "#42526E",
  },
};

function getNotionColor(category: string) {
  return NOTION_COLORS[category] || NOTION_COLORS.default;
}

const SUGGESTED_TOPICS = ["하이브리드 검색", "BM25", "pgvector", "RRF 랭킹", "지식 그래프"];

export function KnowledgeGraph({ posts }: KnowledgeGraphProps) {
  const [searchTopic, setSearchTopic] = useState("");
  const [metricMode, setMetricMode] = useState<"cosine" | "euclidean">("cosine");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(posts[0]?.id ?? null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 1. Vector load & generation
  const postVectors = useMemo<ParsedPostVector[]>(() => {
    return posts.map((p) => {
      let vec: number[];
      if (Array.isArray(p.embedding) && p.embedding.length > 0) {
        vec = p.embedding;
      } else if (typeof p.embedding === "string") {
        try {
          vec = JSON.parse(p.embedding);
        } catch {
          vec = generateSemanticEmbedding(`${p.summary} ${p.content}`, {
            title: p.title,
            category: p.category,
            tags: p.tags,
          });
        }
      } else {
        vec = generateSemanticEmbedding(`${p.summary} ${p.content}`, {
          title: p.title,
          category: p.category,
          tags: p.tags,
        });
      }
      return { post: p, vector: vec };
    });
  }, [posts]);

  // 2. Query Rankings
  const queryRankings = useMemo<RankedSimilarityItem[]>(() => {
    const q = searchTopic.trim();
    if (!q) return [];

    const queryVec = generateSemanticEmbedding(q);

    return postVectors
      .map((pv) => ({
        post: pv.post,
        similarity: cosineSimilarity(queryVec, pv.vector),
        distance: euclideanDistance(queryVec, pv.vector),
        rank: 0,
      }))
      .sort((a, b) =>
        metricMode === "cosine" ? b.similarity - a.similarity : a.distance - b.distance
      )
      .slice(0, 10)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [searchTopic, postVectors, metricMode]);

  // Selected post distance calculation
  const selectedPostData = useMemo(() => {
    if (selectedPostId === null) return null;
    const current = postVectors.find((pv) => pv.post.id === selectedPostId);
    if (!current) return null;

    const ranking: RankedSimilarityItem[] = postVectors
      .filter((pv) => pv.post.id !== selectedPostId)
      .map((pv) => ({
        post: pv.post,
        similarity: cosineSimilarity(current.vector, pv.vector),
        distance: euclideanDistance(current.vector, pv.vector),
        rank: 0,
      }))
      .sort((a, b) =>
        metricMode === "cosine" ? b.similarity - a.similarity : a.distance - b.distance
      )
      .slice(0, 10)
      .map((item, index) => ({ ...item, rank: index + 1 }));

    return { post: current.post, vector: current.vector, ranking };
  }, [selectedPostId, postVectors, metricMode]);

  const searchSimilarityMap = useMemo(() => {
    const map = new Map<number, { rank: number; similarity: number; distance: number }>();
    queryRankings.forEach((res) => {
      map.set(res.post.id, { rank: res.rank, similarity: res.similarity, distance: res.distance });
    });
    return map;
  }, [queryRankings]);

  // 3. PCA 2D Projection
  const pcaPositions = useMemo(() => {
    const rawVectors = postVectors.map((pv) => pv.vector);
    return projectPCA2D(rawVectors, { width: 880, height: 540, padding: 90 });
  }, [postVectors]);

  // 4. Build Notion Clean Nodes & Edges
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Notion Document Card Node
    postVectors.forEach((pv, idx) => {
      const pos = pcaPositions[idx] || { x: 300 + idx * 100, y: 300 };
      const color = getNotionColor(pv.post.category);
      const isSelected = pv.post.id === selectedPostId;
      const searchMatch = searchSimilarityMap.get(pv.post.id);

      nodes.push({
        id: `post-${pv.post.id}`,
        position: pos,
        data: {
          post: pv.post,
          vector: pv.vector,
          label: (
            <div className="flex flex-col text-left">
              {/* Top Meta: Notion Style Vivid Tag + Search Rank */}
              <div className="flex items-center justify-between gap-1 mb-1.5">
                <span
                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] font-bold"
                  style={{ backgroundColor: color.bg, color: color.text }}
                >
                  <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color.dot }} />
                  {pv.post.category}
                </span>

                {searchMatch && (
                  <span className="rounded bg-[#091E42]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#172B4D]">
                    #{searchMatch.rank} · {(searchMatch.similarity * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              {/* Document Title */}
              <h3 className="text-[13px] font-semibold text-[#172B4D] leading-snug line-clamp-2">
                {pv.post.title}
              </h3>
            </div>
          ),
        },
        style: {
          background: isSelected ? "#FFFFFF" : "#FAFBFC",
          border: isSelected
            ? "2px solid #0052CC"
            : searchMatch
            ? "1.5px solid #0052CC"
            : "1px solid #DFE1E6",
          borderRadius: "8px",
          padding: "10px 12px",
          width: 210,
          boxShadow: isSelected
            ? "0 4px 12px rgba(9, 30, 66, 0.15)"
            : "0 1px 3px rgba(9, 30, 66, 0.05)",
          cursor: "pointer",
          transition: "border-color 0.15s ease, box-shadow 0.15s ease",
        },
      });
    });

    // Clean 1px Lines
    for (let i = 0; i < postVectors.length; i++) {
      for (let j = i + 1; j < postVectors.length; j++) {
        const p1 = postVectors[i];
        const p2 = postVectors[j];
        const sim = cosineSimilarity(p1.vector, p2.vector);

        if (sim >= 0.68) {
          const isRelatedToSelected =
            selectedPostId !== null &&
            (p1.post.id === selectedPostId || p2.post.id === selectedPostId);

          edges.push({
            id: `edge-${p1.post.id}-${p2.post.id}`,
            source: `post-${p1.post.id}`,
            target: `post-${p2.post.id}`,
            label: `${(sim * 100).toFixed(0)}%`,
            labelStyle: {
              fontSize: 10,
              fontWeight: 700,
              fill: isRelatedToSelected ? "#0052CC" : "#6B778C",
            },
            labelBgPadding: [4, 2],
            labelBgBorderRadius: 4,
            labelBgStyle: {
              fill: "#FFFFFF",
              stroke: isRelatedToSelected ? "#B3D4FF" : "#DFE1E6",
              strokeWidth: 1,
            },
            style: {
              stroke: isRelatedToSelected ? "#0052CC" : "#C1C7D0",
              strokeWidth: isRelatedToSelected ? 2 : 1,
              strokeDasharray: isRelatedToSelected ? undefined : "3,3",
            },
          });
        }
      }
    }

    return { initialNodes: nodes, initialEdges: edges };
  }, [postVectors, pcaPositions, selectedPostId, searchSimilarityMap]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    const data = node.data as any;
    if (data?.post) {
      setSelectedPostId(data.post.id);
      setIsSidebarOpen(true);
    }
  }, []);

  const displayedList = searchTopic.trim()
    ? queryRankings
    : selectedPostData
    ? selectedPostData.ranking
    : [];

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#FFFFFF] text-[#172B4D]">
      {/* ReactFlow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.8}
        className="h-full w-full"
      >
        <Background color="#EBECF0" gap={20} size={1} variant={BackgroundVariant.Dots} />
        <Controls showInteractive={false} className="!rounded-lg !border !border-[#DFE1E6] !shadow-none !left-4 !bottom-4 !bg-white" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as any;
            return data?.post ? getNotionColor(data.post.category).border : "#EBECF0";
          }}
          className={`!rounded-lg !border !border-[#DFE1E6] !bg-white !bottom-4 transition-all duration-300 ${
            isSidebarOpen ? "!right-[420px]" : "!right-4"
          }`}
        />
      </ReactFlow>

      {/* Floating Toggle Button when Sidebar is closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-md border border-[#DFE1E6] bg-white px-3 py-1.5 text-xs font-semibold text-[#172B4D] shadow-sm hover:bg-[#F4F5F7] transition-all"
        >
          <FileText className="h-4 w-4 text-[#0052CC]" />
          <span>도큐먼트 인스펙터</span>
          <ChevronLeft className="h-3.5 w-3.5 text-[#6B778C]" />
        </button>
      )}

      {/* Notion Document Property Sidebar (Right Drawer) */}
      <aside
        className={`absolute right-0 top-0 bottom-0 z-30 flex w-[400px] max-w-[calc(100vw-20px)] flex-col border-l border-[#DFE1E6] bg-[#FFFFFF] shadow-lg transition-transform duration-200 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header: Notion Style */}
        <div className="flex items-center justify-between border-b border-[#EBECF0] px-4 py-3 bg-[#FAFBFC]">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded bg-[#E0EFFF] text-[#0052CC]">
              <Compass className="h-3.5 w-3.5" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-[#172B4D]">
              Knowledge Inspector
            </span>
            <span className="rounded bg-[#EBECF0] px-1.5 py-0.2 text-[10px] font-mono text-[#5E6C84]">
              PCA 2D
            </span>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded p-1 text-[#6B778C] hover:bg-[#EBECF0] hover:text-[#172B4D]"
            title="사이드바 접기"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Search Bar Section */}
        <div className="border-b border-[#EBECF0] p-4 bg-[#FFFFFF]">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#6B778C]" />
            <input
              type="text"
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              placeholder="주제 또는 키워드 입력 (예: 하이브리드 검색)..."
              className="w-full rounded-md border border-[#DFE1E6] bg-[#FAFBFC] pl-8 pr-7 py-1.5 text-xs text-[#172B4D] placeholder:text-[#8993A4] focus:border-[#0052CC] focus:bg-white focus:outline-none transition-all"
            />
            {searchTopic && (
              <button
                onClick={() => setSearchTopic("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8993A4] hover:text-[#172B4D]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Filter Tag Chips */}
          <div className="mt-2 flex flex-wrap items-center gap-1">
            {SUGGESTED_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => setSearchTopic(topic)}
                className="rounded border border-[#EBECF0] bg-[#FAFBFC] px-1.5 py-0.5 text-[10px] font-medium text-[#42526E] hover:border-[#0052CC] hover:text-[#0052CC] transition-colors"
              >
                #{topic}
              </button>
            ))}
          </div>

          {/* Metric Selector Tabs */}
          <div className="mt-3 flex items-center justify-between text-[11px] pt-2 border-t border-[#EBECF0]">
            <span className="text-[#6B778C] font-medium">유사도 산출 기준:</span>
            <div className="flex rounded border border-[#DFE1E6] bg-[#FAFBFC] p-0.5">
              <button
                onClick={() => setMetricMode("cosine")}
                className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                  metricMode === "cosine"
                    ? "bg-[#0052CC] text-white"
                    : "text-[#5E6C84] hover:text-[#172B4D]"
                }`}
              >
                코사인 (%)
              </button>
              <button
                onClick={() => setMetricMode("euclidean")}
                className={`rounded px-2 py-0.5 text-[11px] font-semibold transition-colors ${
                  metricMode === "euclidean"
                    ? "bg-[#0052CC] text-white"
                    : "text-[#5E6C84] hover:text-[#172B4D]"
                }`}
              >
                유클리드 (L2)
              </button>
            </div>
          </div>
        </div>

        {/* Selected Document Details Section */}
        {selectedPostData && (
          <div className="border-b border-[#EBECF0] p-4 bg-[#FAFBFC]">
            <div className="flex items-center justify-between">
              <span
                className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: getNotionColor(selectedPostData.post.category).bg,
                  color: getNotionColor(selectedPostData.post.category).text,
                }}
              >
                {selectedPostData.post.category}
              </span>
              <Link
                href={`/blog/${selectedPostData.post.slug}`}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0052CC] hover:underline"
              >
                <span>본문 읽기</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <h3 className="mt-2 text-sm font-bold text-[#172B4D] leading-snug">
              {selectedPostData.post.title}
            </h3>

            <p className="mt-1.5 text-xs text-[#5E6C84] leading-relaxed line-clamp-3">
              {selectedPostData.post.summary}
            </p>

            <div className="mt-2.5 flex flex-wrap gap-1">
              {selectedPostData.post.tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-[#EBECF0] px-1.5 py-0.5 text-[10px] text-[#42526E]"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Nearest Neighbors Document List: Notion Table View */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#EBECF0] text-[11px] font-bold uppercase text-[#5E6C84]">
            <span>
              {searchTopic.trim()
                ? `‘${searchTopic}’ 관련 글 순위`
                : selectedPostData
                ? "연관 글 유사도 순위"
                : "전체 글 유사도"}
            </span>
            <span>{metricMode === "cosine" ? "유사도" : "거리"}</span>
          </div>

          <div className="divide-y divide-[#EBECF0]">
            {displayedList.map((item) => {
              const isSelected = selectedPostId === item.post.id;
              const pct = Math.max(0, Math.min(100, Math.round(item.similarity * 100)));
              const color = getNotionColor(item.post.category);

              return (
                <div
                  key={item.post.id}
                  onClick={() => setSelectedPostId(item.post.id)}
                  className={`group flex items-center justify-between gap-3 py-2.5 px-2 rounded cursor-pointer transition-colors ${
                    isSelected ? "bg-[#E0EFFF]" : "hover:bg-[#FAFBFC]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`flex h-4 w-4 shrink-0 items-center justify-center rounded text-[10px] font-bold ${
                        item.rank === 1
                          ? "bg-[#FFAB00] text-[#172B4D]"
                          : item.rank <= 3
                          ? "bg-[#DFE1E6] text-[#172B4D]"
                          : "text-[#8993A4]"
                      }`}
                    >
                      {item.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-[#172B4D] group-hover:text-[#0052CC]">
                        {item.post.title}
                      </p>
                      <span className="text-[10px] font-medium text-[#6B778C]">
                        {item.post.category}
                      </span>
                    </div>
                  </div>

                  {/* Clean Vivid Badge */}
                  <div className="text-right shrink-0">
                    <span
                      className="inline-block rounded px-1.5 py-0.5 font-mono text-[11px] font-bold"
                      style={{
                        backgroundColor: isSelected ? "#0052CC" : color.bg,
                        color: isSelected ? "#FFFFFF" : color.text,
                      }}
                    >
                      {metricMode === "cosine" ? `${pct}%` : `L2 ${item.distance.toFixed(3)}`}
                    </span>
                    <span className="block text-[9px] font-mono text-[#8993A4]">
                      {item.similarity.toFixed(3)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </aside>
    </div>
  );
}
