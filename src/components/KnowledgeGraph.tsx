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
  ChevronDown,
  ChevronUp,
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
import { openChat } from "@/components/ChatWidget";

interface KnowledgeGraphProps {
  posts: Post[];
}

interface ParsedPostVector {
  post: Post;
  vector: number[];
}

interface SearchSimilarityResult {
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
  const [isSearchPanelOpen, setIsSearchPanelOpen] = useState(true);

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

  // 2. 사용자가 입력한 검색어/주제의 실시간 384D 임베딩 계산 및 유사도 Top 랭킹 산출
  const topicSearchResults = useMemo<SearchSimilarityResult[]>(() => {
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

  // Map of post ID to its search similarity for quick lookup
  const searchSimilarityMap = useMemo(() => {
    const map = new Map<number, { rank: number; similarity: number; distance: number }>();
    topicSearchResults.forEach((res) => {
      map.set(res.post.id, { rank: res.rank, similarity: res.similarity, distance: res.distance });
    });
    return map;
  }, [topicSearchResults]);

  // 3. 384차원 고차원 벡터를 PCA 2D 좌표로 사영 (평면 투영)
  const pcaPositions = useMemo(() => {
    const rawVectors = postVectors.map((pv) => pv.vector);
    return projectPCA2D(rawVectors, { width: 920, height: 580, padding: 90 });
  }, [postVectors]);

  // 4. 노드 & 엣지 빌드
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Create Minimal Nodes: Only title & category dot by default, expands on selection
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

  // Selected post object and vector distance calculations with other posts
  const selectedPostData = useMemo(() => {
    if (selectedPostId === null) return null;
    const current = postVectors.find((pv) => pv.post.id === selectedPostId);
    if (!current) return null;

    const ranking = postVectors
      .filter((pv) => pv.post.id !== selectedPostId)
      .map((pv) => ({
        targetPost: pv.post,
        similarity: cosineSimilarity(current.vector, pv.vector),
        distance: euclideanDistance(current.vector, pv.vector),
      }))
      .sort((a, b) =>
        metricMode === "cosine" ? b.similarity - a.similarity : a.distance - b.distance
      );

    return { post: current.post, vector: current.vector, ranking };
  }, [selectedPostId, postVectors, metricMode]);

  const onNodeClick = useCallback((_: any, node: Node) => {
    const data = node.data as any;
    if (data?.post) {
      setSelectedPostId(data.post.id);
    }
  }, []);

  return (
    <div className="relative h-full w-full overflow-hidden bg-[#f8fafc]">
      {/* Left Overlay Floating Panel: Semantic Topic Similarity Search */}
      <div className="absolute left-4 top-4 z-20 w-84 sm:w-96 max-w-[calc(100vw-32px)]">
        {!isSearchPanelOpen ? (
          // Collapsed Pill Button
          <button
            onClick={() => setIsSearchPanelOpen(true)}
            className="flex items-center gap-2 rounded-full border border-[#e5e8eb] bg-white/95 px-4 py-2 text-xs font-semibold text-[#191f28] shadow-md backdrop-blur-md hover:bg-white hover:shadow-lg transition-all"
          >
            <Compass className="h-4 w-4 text-[#3182f6]" />
            <span>주제 유사도 검색</span>
            {searchTopic && (
              <span className="rounded-full bg-blue-100 px-2 py-0.2 text-[10px] text-[#1d4ed8] font-bold">
                &lsquo;{searchTopic}&rsquo;
              </span>
            )}
            <ChevronDown className="h-3.5 w-3.5 text-[#8b95a1]" />
          </button>
        ) : (
          // Expanded Semantic Topic Search Panel
          <div className="flex flex-col max-h-[calc(100vh-140px)] rounded-2xl border border-[#e5e8eb] bg-white/95 p-4 shadow-xl backdrop-blur-md transition-all animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#f2f4f6]">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[#3182f6]">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-[#191f28]">주제별 시맨틱 유사도 검색</h2>
                  <p className="text-[10px] text-[#8b95a1]">384D 임베딩 벡터 코사인/유클리드 거리</p>
                </div>
              </div>
              <button
                onClick={() => setIsSearchPanelOpen(false)}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-[#8b95a1] hover:bg-[#f2f4f6] hover:text-[#191f28]"
                title="패널 접기"
              >
                <span>접기</span>
                <ChevronUp className="h-3 w-3" />
              </button>
            </div>

            {/* Topic Input Bar */}
            <div className="mt-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8b95a1]" />
                <input
                  type="text"
                  value={searchTopic}
                  onChange={(e) => setSearchTopic(e.target.value)}
                  placeholder="관심 주제나 키워드 입력 (예: 하이브리드 검색)..."
                  className="w-full rounded-xl border border-[#e5e8eb] bg-[#fafbfc] pl-8 pr-8 py-2 text-xs text-[#191f28] placeholder:text-[#8b95a1] focus:border-[#3182f6] focus:bg-white focus:outline-none transition-all shadow-xs"
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

              {/* Topic Suggestion Chips */}
              <div className="mt-2 flex flex-wrap items-center gap-1">
                <span className="text-[10px] text-[#8b95a1] mr-0.5">추천:</span>
                {SUGGESTED_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => setSearchTopic(topic)}
                    className="rounded-md bg-[#f2f4f6] px-1.5 py-0.5 text-[10px] text-[#4e5968] hover:bg-blue-50 hover:text-[#3182f6] transition-colors"
                  >
                    #{topic}
                  </button>
                ))}
              </div>
            </div>

            {/* Metric Mode Toggle */}
            <div className="mt-3 flex items-center justify-between text-[11px] border-t border-[#f2f4f6] pt-2.5">
              <span className="text-[#6b7684]">거리 측정 단위:</span>
              <div className="flex rounded-lg border border-[#e5e8eb] bg-[#fafbfc] p-0.5">
                <button
                  onClick={() => setMetricMode("cosine")}
                  className={`rounded-md px-2 py-0.5 transition-colors ${
                    metricMode === "cosine"
                      ? "bg-white text-[#3182f6] shadow-xs font-semibold"
                      : "text-[#6b7684]"
                  }`}
                >
                  코사인 유사도 (%)
                </button>
                <button
                  onClick={() => setMetricMode("euclidean")}
                  className={`rounded-md px-2 py-0.5 transition-colors ${
                    metricMode === "euclidean"
                      ? "bg-white text-[#3182f6] shadow-xs font-semibold"
                      : "text-[#6b7684]"
                  }`}
                >
                  유클리드 거리 (L2)
                </button>
              </div>
            </div>

            {/* Top 10 Similar Posts List */}
            {searchTopic.trim() && (
              <div className="mt-3 flex-1 overflow-y-auto pr-1 border-t border-[#f2f4f6] pt-2.5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#191f28] flex items-center gap-1">
                    <TrendingUp className="h-3.5 w-3.5 text-[#3182f6]" />
                    <span>&lsquo;{searchTopic}&rsquo;와 유사한 글 Top {topicSearchResults.length}</span>
                  </span>
                  <span className="text-[10px] text-[#8b95a1]">
                    {metricMode === "cosine" ? "높을수록 일치" : "낮을수록 근접"}
                  </span>
                </div>

                <div className="space-y-1.5">
                  {topicSearchResults.map((res) => {
                    const pct = Math.max(0, Math.min(100, Math.round(res.similarity * 100)));
                    const isSelected = selectedPostId === res.post.id;

                    return (
                      <div
                        key={res.post.id}
                        onClick={() => setSelectedPostId(res.post.id)}
                        className={`group cursor-pointer rounded-xl border p-2.5 transition-all ${
                          isSelected
                            ? "border-[#3182f6] bg-blue-50/70 shadow-xs"
                            : res.rank === 1
                            ? "border-amber-200 bg-amber-50/40 hover:bg-amber-50/70"
                            : "border-[#f0f2f5] bg-[#fafbfc] hover:border-[#d1d6db] hover:bg-white"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span
                              className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-extrabold ${
                                res.rank === 1
                                  ? "bg-amber-500 text-white"
                                  : res.rank === 2
                                  ? "bg-slate-400 text-white"
                                  : res.rank === 3
                                  ? "bg-amber-700/60 text-white"
                                  : "bg-[#e5e8eb] text-[#6b7684]"
                              }`}
                            >
                              {res.rank}
                            </span>
                            <span className="truncate text-xs font-semibold text-[#191f28] group-hover:text-[#3182f6]">
                              {res.post.title}
                            </span>
                          </div>

                          {/* Metric Value */}
                          <div className="text-right shrink-0">
                            <span
                              className={`font-mono text-xs font-bold ${
                                res.similarity >= 0.8
                                  ? "text-[#1d4ed8]"
                                  : res.similarity >= 0.7
                                  ? "text-[#3182f6]"
                                  : "text-[#6b7684]"
                              }`}
                            >
                              {metricMode === "cosine"
                                ? `${pct}%`
                                : `L2 ${res.distance.toFixed(3)}`}
                            </span>
                            <span className="block text-[9px] text-[#8b95a1] font-mono">
                              ({res.similarity.toFixed(3)})
                            </span>
                          </div>
                        </div>

                        {/* Gauge Bar */}
                        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#e5e8eb]">
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
              </div>
            )}
          </div>
        )}
      </div>

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
          className="!rounded-xl !border-slate-200 !bg-white/90 !right-4 !bottom-4"
        />
      </ReactFlow>

      {/* Right Slide-over Inspector Panel (When a post is clicked) */}
      {selectedPostData && (
        <div className="absolute right-4 top-4 bottom-4 w-96 max-w-[calc(100vw-32px)] z-30 flex flex-col rounded-2xl border border-[#e5e8eb] bg-white/95 p-5 shadow-2xl backdrop-blur-md animate-in slide-in-from-right-4 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between gap-3 border-b border-[#f2f4f6] pb-3">
            <div>
              <span
                className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                style={{
                  backgroundColor: getCategoryColor(selectedPostData.post.category).bg,
                  color: getCategoryColor(selectedPostData.post.category).text,
                }}
              >
                {selectedPostData.post.category}
              </span>
              <h2 className="mt-1.5 text-base font-bold text-[#191f28] leading-snug">
                {selectedPostData.post.title}
              </h2>
            </div>
            <button
              onClick={() => setSelectedPostId(null)}
              className="rounded-lg p-1 text-[#8b95a1] hover:bg-[#f2f4f6] hover:text-[#191f28]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Post Summary */}
          <p className="mt-3 text-xs leading-relaxed text-[#4e5968] line-clamp-3 bg-[#fafbfc] p-2.5 rounded-xl border border-[#f0f2f5]">
            {selectedPostData.post.summary}
          </p>

          {/* Vector Distance Ranking Section with other posts */}
          <div className="mt-4 flex-1 overflow-y-auto pr-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-[#191f28] flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-[#3182f6]" />
                <span>이 글과 다른 글의 유사도 거리</span>
              </span>
              <span className="text-[10px] text-[#8b95a1]">
                기준: {metricMode === "cosine" ? "코사인 유사도" : "유클리드 거리"}
              </span>
            </div>

            <div className="space-y-2">
              {selectedPostData.ranking.map((item) => {
                const pct = Math.max(0, Math.min(100, Math.round(item.similarity * 100)));

                return (
                  <div
                    key={item.targetPost.id}
                    onClick={() => setSelectedPostId(item.targetPost.id)}
                    className="group cursor-pointer rounded-xl border border-[#f0f2f5] bg-white p-2.5 hover:border-[#d1d6db] transition-all"
                  >
                    <div className="flex items-center justify-between text-xs font-semibold text-[#191f28]">
                      <span className="truncate max-w-[200px] group-hover:text-[#3182f6] transition-colors">
                        {item.targetPost.title}
                      </span>
                      <div className="text-right">
                        <span
                          className={`font-mono text-xs ${
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

                    {/* Similarity Bar */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-[#e5e8eb]">
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

                    <div className="mt-2 flex items-center justify-between text-[10px] text-[#8b95a1]">
                      <span>카테고리: {item.targetPost.category}</span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openChat(
                            `'${selectedPostData.post.title}' 글과 '${item.targetPost.title}' 글의 핵심 개념적 연관성과 차이점을 비교 설명해줘.`
                          );
                        }}
                        className="inline-flex items-center gap-0.5 text-[#3182f6] hover:underline"
                      >
                        <Sparkles className="h-2.5 w-2.5" />
                        <span>AI 비교</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Bottom Actions */}
          <div className="mt-4 pt-3 border-t border-[#f2f4f6] flex flex-col gap-2">
            <Link
              href={`/blog/${selectedPostData.post.slug}`}
              className="flex items-center justify-center gap-2 rounded-xl bg-[#191f28] py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#333d4b] transition-colors"
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>선택한 글 본문 읽기</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <button
              onClick={() =>
                openChat(`'${selectedPostData.post.title}' 포스트의 핵심 내용을 요약해줘.`)
              }
              className="flex items-center justify-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/70 py-2 text-xs font-semibold text-[#3182f6] hover:bg-blue-100/70 transition-colors"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>이 글의 핵심 AI 질의하기</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
