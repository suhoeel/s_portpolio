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
  Layers,
  RotateCcw,
  Search,
  Sparkles,
  TrendingUp,
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
  similarity: number; // 0 ~ 1 (Cosine)
  distance: number; // >= 0 (Euclidean L2)
  rank: number;
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; dot: string; border: string }> = {
  "Search & RAG": { bg: "#eff6ff", text: "#1d4ed8", dot: "#3b82f6", border: "#93c5fd" },
  "Information Retrieval": { bg: "#ecfdf5", text: "#047857", dot: "#10b981", border: "#a7f3d0" },
  "Ranking Algorithm": { bg: "#fef3c7", text: "#b45309", dot: "#f59e0b", border: "#fde68a" },
  "Data Visualization": { bg: "#f3e8ff", text: "#6b21a8", dot: "#a855f7", border: "#d8b4fe" },
  default: { bg: "#f3f4f6", text: "#374151", dot: "#9ca3af", border: "#e5e7eb" },
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
}

const SUGGESTED_TOPICS = [
  "하이브리드 검색",
  "BM25 알고리즘",
  "pgvector 임베딩",
  "RRF 순위 결합",
  "지식 그래프 시각화",
];

export function KnowledgeGraph({ posts }: KnowledgeGraphProps) {
  const [searchTopic, setSearchTopic] = useState("");
  const [metricMode, setMetricMode] = useState<"cosine" | "euclidean">("cosine");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // 1. 384차원 시맨틱 임베딩 벡터 로드 또는 생성
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

  // 2. 검색어 기준 실시간 유사도 Top 랭킹 (Nearest Neighbors from Query)
  const queryRankings = useMemo<RankedSimilarityItem[]>(() => {
    const q = searchTopic.trim();
    if (!q) return [];

    const queryVec = generateSemanticEmbedding(q);

    return postVectors
      .map((pv) => {
        const sim = cosineSimilarity(queryVec, pv.vector);
        const dist = euclideanDistance(queryVec, pv.vector);
        return { post: pv.post, similarity: sim, distance: dist, rank: 0 };
      })
      .sort((a, b) => (metricMode === "cosine" ? b.similarity - a.similarity : a.distance - b.distance))
      .slice(0, 10)
      .map((item, index) => ({ ...item, rank: index + 1 }));
  }, [searchTopic, postVectors, metricMode]);

  // Selected post object and vector distance calculations with other posts
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

  // Map of post ID to its search similarity for quick canvas lookup
  const searchSimilarityMap = useMemo(() => {
    const map = new Map<number, { rank: number; similarity: number; distance: number }>();
    queryRankings.forEach((res) => {
      map.set(res.post.id, { rank: res.rank, similarity: res.similarity, distance: res.distance });
    });
    return map;
  }, [queryRankings]);

  // 3. 384차원 고차원 벡터를 PCA 2D 좌표로 사영 (평면 투영)
  const pcaPositions = useMemo(() => {
    const rawVectors = postVectors.map((pv) => pv.vector);
    return projectPCA2D(rawVectors, { width: 900, height: 560, padding: 90 });
  }, [postVectors]);

  // 4. 노드 & 엣지 빌드
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Create Minimal Nodes: Category dot + Title
    postVectors.forEach((pv, idx) => {
      const pos = pcaPositions[idx] || { x: 300 + idx * 100, y: 300 };
      const color = getCategoryColor(pv.post.category);
      const isSelected = pv.post.id === selectedPostId;
      const searchMatch = searchSimilarityMap.get(pv.post.id);
      const isTopRanked = searchMatch && searchMatch.rank <= 3;

      nodes.push({
        id: `post-${pv.post.id}`,
        position: pos,
        data: {
          post: pv.post,
          vector: pv.vector,
          label: (
            <div className="flex flex-col text-left">
              {/* Category Dot & Search Rank Badge */}
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5 truncate">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: color.dot }}
                  />
                  <span className="text-[10px] font-semibold text-[#8b95a1] truncate">
                    {pv.post.category}
                  </span>
                </div>

                {/* Show Search Similarity Badge if a topic is searched */}
                {searchMatch && (
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] font-bold tracking-tight shrink-0 ${
                      searchMatch.rank === 1
                        ? "bg-amber-100 text-amber-800 border border-amber-300"
                        : searchMatch.rank <= 3
                        ? "bg-blue-100 text-blue-800 border border-blue-300"
                        : "bg-slate-100 text-slate-600"
                    }`}
                  >
                    #{searchMatch.rank} · {(searchMatch.similarity * 100).toFixed(0)}%
                  </span>
                )}
              </div>

              {/* Title (Always prominent) */}
              <h3 className="text-xs font-bold text-[#191f28] line-clamp-2 leading-snug">
                {pv.post.title}
              </h3>

              {/* Summary shown ONLY when selected */}
              {isSelected && (
                <p className="text-[11px] text-[#4e5968] line-clamp-2 mt-1.5 pt-1.5 border-t border-blue-100 animate-in fade-in">
                  {pv.post.summary}
                </p>
              )}
            </div>
          ),
        },
        style: {
          background: isSelected ? "#f0f7ff" : isTopRanked ? "#fefce8" : "#ffffff",
          border: isSelected
            ? "2.5px solid #3182f6"
            : isTopRanked
            ? "2px solid #eab308"
            : `1.5px solid ${color.border}`,
          borderRadius: "14px",
          padding: "10px 12px",
          width: isSelected ? 230 : 190,
          boxShadow: isSelected
            ? "0 10px 28px rgba(49, 130, 246, 0.25)"
            : isTopRanked
            ? "0 6px 20px rgba(234, 179, 8, 0.2)"
            : "0 2px 10px rgba(0, 0, 0, 0.04)",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
        },
      });
    });

    // Create Edges for strongly related posts (similarity >= 0.68)
    for (let i = 0; i < postVectors.length; i++) {
      for (let j = i + 1; j < postVectors.length; j++) {
        const p1 = postVectors[i];
        const p2 = postVectors[j];
        const sim = cosineSimilarity(p1.vector, p2.vector);

        if (sim >= 0.68) {
          const isRelatedToSelected =
            selectedPostId !== null &&
            (p1.post.id === selectedPostId || p2.post.id === selectedPostId);

          const strokeWidth = Math.max(1.5, Math.min(3.5, (sim - 0.5) * 6));
          const strokeColor = isRelatedToSelected ? "#3182f6" : "#cbd5e1";

          edges.push({
            id: `edge-${p1.post.id}-${p2.post.id}`,
            source: `post-${p1.post.id}`,
            target: `post-${p2.post.id}`,
            label: `${(sim * 100).toFixed(0)}%`,
            labelStyle: {
              fontSize: 10,
              fontWeight: 600,
              fill: isRelatedToSelected ? "#1d4ed8" : "#64748b",
            },
            labelBgPadding: [4, 2],
            labelBgBorderRadius: 4,
            labelBgStyle: {
              fill: isRelatedToSelected ? "#eff6ff" : "#f8fafc",
              stroke: isRelatedToSelected ? "#93c5fd" : "#e2e8f0",
              strokeWidth: 1,
            },
            style: {
              stroke: strokeColor,
              strokeWidth,
              strokeDasharray: isRelatedToSelected ? undefined : sim < 0.75 ? "4,4" : undefined,
            },
            animated: isRelatedToSelected,
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

  // Determine what to display in the main Nearest Neighbors list
  const activeRankingList = searchTopic.trim()
    ? queryRankings
    : selectedPostData
    ? selectedPostData.ranking
    : [];

  const activeTitle = searchTopic.trim()
    ? `‘${searchTopic}’ 검색 결과 Top ${queryRankings.length}`
    : selectedPostData
    ? `‘${selectedPostData.post.title}’의 최근접 이웃`
    : "최근접 유사 글 (Nearest Neighbors)";

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f8fafc]">
      {/* Main Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        fitView
        fitViewOptions={{ padding: 0.25 }}
        minZoom={0.3}
        maxZoom={1.8}
        className="h-full w-full"
      >
        <Background color="#cbd5e1" gap={24} size={1.2} variant={BackgroundVariant.Dots} />
        <Controls showInteractive={false} className="!rounded-xl !border-slate-200 !shadow-sm !left-4 !bottom-4" />
        <MiniMap
          nodeColor={(node) => {
            const data = node.data as any;
            return data?.post ? getCategoryColor(data.post.category).border : "#e2e8f0";
          }}
          className={`!rounded-xl !border-slate-200 !bg-white/90 !bottom-4 transition-all duration-300 ${
            isSidebarOpen ? "!right-[400px]" : "!right-4"
          }`}
        />
      </ReactFlow>

      {/* Floating Toggle Pill when Sidebar is Closed */}
      {!isSidebarOpen && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="absolute right-4 top-4 z-20 flex items-center gap-2 rounded-full border border-[#e5e8eb] bg-white/95 px-4 py-2.5 text-xs font-semibold text-[#191f28] shadow-md backdrop-blur-md hover:bg-white hover:shadow-lg transition-all"
        >
          <Compass className="h-4 w-4 text-[#3182f6]" />
          <span>벡터 인스펙터 열기</span>
          <ChevronLeft className="h-3.5 w-3.5 text-[#8b95a1]" />
        </button>
      )}

      {/* Google Projector Style Right Sidebar Panel (Full Height) */}
      <aside
        className={`absolute right-0 top-0 bottom-0 z-30 flex w-96 max-w-[calc(100vw-20px)] flex-col border-l border-[#e5e8eb] bg-white/95 shadow-2xl backdrop-blur-md transition-transform duration-300 ${
          isSidebarOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Sidebar Header */}
        <div className="flex items-center justify-between border-b border-[#f2f4f6] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-blue-50 text-[#3182f6]">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#191f28]">벡터 스페이스 인스펙터</h2>
              <p className="text-[10px] text-[#8b95a1]">Google Projector · PCA 2D</p>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="rounded-lg p-1.5 text-[#8b95a1] hover:bg-[#f2f4f6] hover:text-[#191f28]"
            title="사이드바 접기"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        {/* Section 1: Search & Topic Input */}
        <div className="border-b border-[#f2f4f6] px-5 py-3.5 bg-[#fafbfc]/70">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8b95a1]" />
            <input
              type="text"
              value={searchTopic}
              onChange={(e) => setSearchTopic(e.target.value)}
              placeholder="관심 주제 또는 키워드 입력..."
              className="w-full rounded-xl border border-[#e5e8eb] bg-white pl-8 pr-8 py-2 text-xs text-[#191f28] placeholder:text-[#8b95a1] focus:border-[#3182f6] focus:outline-none transition-all shadow-xs"
            />
            {searchTopic && (
              <button
                onClick={() => setSearchTopic("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b95a1] hover:text-[#191f28]"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Quick Suggestion Chips */}
          <div className="mt-2 flex flex-wrap items-center gap-1">
            <span className="text-[10px] text-[#8b95a1] mr-0.5">추천:</span>
            {SUGGESTED_TOPICS.map((topic) => (
              <button
                key={topic}
                onClick={() => setSearchTopic(topic)}
                className="rounded-md bg-white border border-[#eef0f3] px-1.5 py-0.5 text-[10px] text-[#4e5968] hover:border-[#3182f6] hover:text-[#3182f6] transition-colors"
              >
                #{topic}
              </button>
            ))}
          </div>

          {/* Metric Selector Toggle */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] pt-2 border-t border-[#f0f2f5]">
            <span className="text-[#6b7684]">거리 기준:</span>
            <div className="flex rounded-lg border border-[#e5e8eb] bg-white p-0.5">
              <button
                onClick={() => setMetricMode("cosine")}
                className={`rounded-md px-2 py-0.5 transition-colors ${
                  metricMode === "cosine"
                    ? "bg-[#3182f6] text-white font-semibold"
                    : "text-[#6b7684] hover:text-[#191f28]"
                }`}
              >
                코사인 유사도 (%)
              </button>
              <button
                onClick={() => setMetricMode("euclidean")}
                className={`rounded-md px-2 py-0.5 transition-colors ${
                  metricMode === "euclidean"
                    ? "bg-[#3182f6] text-white font-semibold"
                    : "text-[#6b7684] hover:text-[#191f28]"
                }`}
              >
                유클리드 거리 (L2)
              </button>
            </div>
          </div>
        </div>

        {/* Section 2: Selected Post Header (If a node is selected) */}
        {selectedPostData && (
          <div className="border-b border-[#f2f4f6] bg-blue-50/40 px-5 py-3">
            <div className="flex items-center justify-between">
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: getCategoryColor(selectedPostData.post.category).bg,
                  color: getCategoryColor(selectedPostData.post.category).text,
                }}
              >
                {selectedPostData.post.category}
              </span>
              <button
                onClick={() => setSelectedPostId(null)}
                className="text-[10px] text-[#8b95a1] hover:text-[#191f28] underline"
              >
                선택 해제
              </button>
            </div>
            <h3 className="mt-1 text-xs font-bold text-[#191f28] line-clamp-1">
              {selectedPostData.post.title}
            </h3>
            <p className="mt-1 text-[11px] text-[#6b7684] line-clamp-2 leading-relaxed">
              {selectedPostData.post.summary}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <Link
                href={`/blog/${selectedPostData.post.slug}`}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#3182f6] hover:underline"
              >
                <BookOpen className="h-3 w-3" />
                <span>본문 읽으러 가기</span>
                <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}

        {/* Section 3: Nearest Neighbors List (Top 10 유사도 랭킹) */}
        <div className="flex-1 overflow-y-auto px-5 py-3">
          <div className="flex items-center justify-between mb-2.5">
            <span className="text-xs font-bold text-[#191f28] flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-[#3182f6]" />
              <span className="truncate">{activeTitle}</span>
            </span>
            <span className="text-[10px] text-[#8b95a1] shrink-0">
              {metricMode === "cosine" ? "높을수록 일치" : "낮을수록 근접"}
            </span>
          </div>

          {activeRankingList.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[#e5e8eb] p-6 text-center text-xs text-[#8b95a1] mt-4">
              <Compass className="h-8 w-8 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold text-[#4e5968]">최근접 이웃을 탐색해보세요</p>
              <p className="mt-1 text-[11px] leading-relaxed">
                상단 검색창에 키워드를 입력하거나 캔버스에서 글 노드를 클릭하면 벡터 거리가 가까운 순으로 표시됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeRankingList.map((item) => {
                const pct = Math.max(0, Math.min(100, Math.round(item.similarity * 100)));
                const isSelected = selectedPostId === item.post.id;

                return (
                  <div
                    key={item.post.id}
                    onClick={() => setSelectedPostId(item.post.id)}
                    className={`group cursor-pointer rounded-xl border p-2.5 transition-all ${
                      isSelected
                        ? "border-[#3182f6] bg-blue-50/70 shadow-xs"
                        : item.rank === 1
                        ? "border-amber-200 bg-amber-50/40 hover:bg-amber-50/70"
                        : "border-[#f0f2f5] bg-white hover:border-[#d1d6db] hover:bg-[#fafbfc]"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                            item.rank === 1
                              ? "bg-amber-500 text-white"
                              : item.rank === 2
                              ? "bg-slate-400 text-white"
                              : item.rank === 3
                              ? "bg-amber-700/60 text-white"
                              : "bg-[#e5e8eb] text-[#6b7684]"
                          }`}
                        >
                          {item.rank}
                        </span>
                        <span className="truncate text-xs font-semibold text-[#191f28] group-hover:text-[#3182f6]">
                          {item.post.title}
                        </span>
                      </div>

                      {/* Similarity / Distance Metrics */}
                      <div className="text-right shrink-0">
                        <span
                          className={`font-mono text-xs font-bold ${
                            item.similarity >= 0.8
                              ? "text-[#1d4ed8]"
                              : item.similarity >= 0.7
                              ? "text-[#3182f6]"
                              : "text-[#6b7684]"
                          }`}
                        >
                          {metricMode === "cosine"
                            ? `${pct}%`
                            : `L2 ${item.distance.toFixed(3)}`}
                        </span>
                        <span className="block text-[9px] text-[#8b95a1] font-mono">
                          ({item.similarity.toFixed(3)})
                        </span>
                      </div>
                    </div>

                    {/* Progress Gauge */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#f2f4f6]">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          pct >= 80
                            ? "bg-gradient-to-r from-blue-500 to-indigo-600"
                            : pct >= 65
                            ? "bg-blue-400"
                            : "bg-slate-300"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
