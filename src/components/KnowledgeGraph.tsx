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
  Panel,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  ArrowRight,
  BookOpen,
  Compass,
  Layers,
  Network,
  RotateCcw,
  Search,
  Sliders,
  Sparkles,
  Tag,
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

interface PostDistanceResult {
  targetPost: Post;
  similarity: number; // 0 ~ 1 (Cosine)
  distance: number; // >= 0 (Euclidean L2)
}

const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "Search & RAG": { bg: "#eff6ff", text: "#1d4ed8", border: "#93c5fd" },
  "Information Retrieval": { bg: "#ecfdf5", text: "#047857", border: "#a7f3d0" },
  "Ranking Algorithm": { bg: "#fef3c7", text: "#b45309", border: "#fde68a" },
  "Data Visualization": { bg: "#f3e8ff", text: "#6b21a8", border: "#d8b4fe" },
  default: { bg: "#f3f4f6", text: "#374151", border: "#e5e7eb" },
};

function getCategoryColor(category: string) {
  return CATEGORY_COLORS[category] || CATEGORY_COLORS.default;
}

export function KnowledgeGraph({ posts }: KnowledgeGraphProps) {
  const [similarityThreshold, setSimilarityThreshold] = useState(0.65);
  const [metricMode, setMetricMode] = useState<"cosine" | "euclidean">("cosine");
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // 1. Parse or generate 384-dim semantic embeddings for each post
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

  // 2. Project 384-dimensional vectors down to 2D coordinates using PCA
  const pcaPositions = useMemo(() => {
    const rawVectors = postVectors.map((pv) => pv.vector);
    return projectPCA2D(rawVectors, { width: 900, height: 560, padding: 100 });
  }, [postVectors]);

  // 3. Build graph Nodes & Edges dynamically based on similarityThreshold
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Create Nodes
    postVectors.forEach((pv, idx) => {
      const pos = pcaPositions[idx] || { x: 300 + idx * 100, y: 300 };
      const color = getCategoryColor(pv.post.category);
      const isSelected = pv.post.id === selectedPostId;
      const isMatchSearch =
        !searchQuery ||
        pv.post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        pv.post.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

      nodes.push({
        id: `post-${pv.post.id}`,
        position: pos,
        data: {
          post: pv.post,
          vector: pv.vector,
          label: (
            <div className="flex flex-col gap-1 text-left p-1">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-bold tracking-wide"
                  style={{ backgroundColor: color.bg, color: color.text }}
                >
                  {pv.post.category}
                </span>
                <span className="text-[10px] font-medium text-[#8b95a1]">384D PCA</span>
              </div>
              <h3 className="text-xs font-bold text-[#191f28] line-clamp-2 leading-snug">
                {pv.post.title}
              </h3>
              <p className="text-[11px] text-[#6b7684] line-clamp-1 mt-0.5">
                {pv.post.summary}
              </p>
              <div className="mt-1 flex flex-wrap gap-1">
                {pv.post.tags.slice(0, 3).map((t) => (
                  <span
                    key={t}
                    className="rounded bg-[#f2f4f6] px-1.5 py-0.2 text-[9px] font-medium text-[#6b7684]"
                  >
                    #{t}
                  </span>
                ))}
              </div>
            </div>
          ),
        },
        style: {
          background: isSelected ? "#f0f7ff" : "#ffffff",
          border: isSelected
            ? "2.5px solid #3182f6"
            : isMatchSearch
            ? `1.5px solid ${color.border}`
            : "1.5px solid #e5e8eb",
          opacity: isMatchSearch ? 1 : 0.4,
          borderRadius: "16px",
          padding: "10px",
          width: 240,
          boxShadow: isSelected
            ? "0 8px 24px rgba(49, 130, 246, 0.22)"
            : "0 4px 16px rgba(0, 0, 0, 0.05)",
          cursor: "pointer",
          transition: "all 0.2s ease-in-out",
        },
      });
    });

    // Create Edges based on Cosine Similarity
    for (let i = 0; i < postVectors.length; i++) {
      for (let j = i + 1; j < postVectors.length; j++) {
        const p1 = postVectors[i];
        const p2 = postVectors[j];
        const sim = cosineSimilarity(p1.vector, p2.vector);
        const dist = euclideanDistance(p1.vector, p2.vector);

        if (sim >= similarityThreshold) {
          const isRelatedToSelected =
            selectedPostId !== null &&
            (p1.post.id === selectedPostId || p2.post.id === selectedPostId);

          const strokeWidth = Math.max(1.5, Math.min(4.5, (sim - 0.5) * 8));
          const strokeColor =
            isRelatedToSelected
              ? "#3182f6"
              : sim >= 0.82
              ? "#60a5fa"
              : "#cbd5e1";

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
  }, [postVectors, pcaPositions, similarityThreshold, selectedPostId, searchQuery]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Sync state when dependencies change
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  // Selected post object and vector distance calculations
  const selectedPostData = useMemo(() => {
    if (selectedPostId === null) return null;
    const current = postVectors.find((pv) => pv.post.id === selectedPostId);
    if (!current) return null;

    const ranking: PostDistanceResult[] = postVectors
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
    <div className="relative flex h-[calc(100vh-125px)] min-h-[660px] w-full flex-col overflow-hidden rounded-3xl border border-[#e5e8eb] bg-[#f8fafc] shadow-lg">
      {/* Top Interactive Control Bar */}
      <div className="z-10 flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e8eb] bg-white/95 px-5 py-3 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-[#3182f6]">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-[#191f28]">시맨틱 벡터 스페이스 지식 그래프</h1>
              <span className="rounded-full bg-blue-100/70 px-2 py-0.5 text-[10px] font-semibold text-[#1d4ed8]">
                384-Dim pgvector & PCA 2D
              </span>
            </div>
            <p className="text-[11px] text-[#6b7684] hidden sm:block">
              고차원 시맨틱 임베딩 벡터의 실제 기하학적 거리(코사인 유사도·유클리드)를 기반으로 자동 배치된 토폴로지입니다.
            </p>
          </div>
        </div>

        {/* Interactive Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Threshold Slider */}
          <div className="flex items-center gap-2 rounded-xl border border-[#e5e8eb] bg-[#fafbfc] px-3 py-1.5 text-xs text-[#4e5968]">
            <Sliders className="h-3.5 w-3.5 text-[#3182f6]" />
            <span className="font-medium">연결 유사도:</span>
            <input
              type="range"
              min="0.50"
              max="0.90"
              step="0.05"
              value={similarityThreshold}
              onChange={(e) => setSimilarityThreshold(parseFloat(e.target.value))}
              className="h-1.5 w-20 cursor-pointer accent-[#3182f6]"
            />
            <span className="w-9 font-bold text-[#191f28]">
              {(similarityThreshold * 100).toFixed(0)}%
            </span>
          </div>

          {/* Metric Toggle */}
          <div className="flex rounded-xl border border-[#e5e8eb] bg-[#fafbfc] p-0.5 text-xs font-semibold">
            <button
              onClick={() => setMetricMode("cosine")}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                metricMode === "cosine"
                  ? "bg-white text-[#3182f6] shadow-xs"
                  : "text-[#6b7684] hover:text-[#191f28]"
              }`}
            >
              코사인 유사도
            </button>
            <button
              onClick={() => setMetricMode("euclidean")}
              className={`rounded-lg px-2.5 py-1 transition-colors ${
                metricMode === "euclidean"
                  ? "bg-white text-[#3182f6] shadow-xs"
                  : "text-[#6b7684] hover:text-[#191f28]"
              }`}
            >
              유클리드 거리
            </button>
          </div>

          {/* Quick Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#8b95a1]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="포스트 검색..."
              className="w-36 rounded-xl border border-[#e5e8eb] bg-[#fafbfc] pl-7 pr-3 py-1.5 text-xs text-[#191f28] placeholder:text-[#8b95a1] focus:border-[#3182f6] focus:bg-white focus:outline-none"
            />
          </div>

          {selectedPostId && (
            <button
              onClick={() => setSelectedPostId(null)}
              className="flex items-center gap-1 rounded-xl bg-[#f2f4f6] px-2.5 py-1.5 text-xs font-medium text-[#4e5968] hover:bg-[#e5e8eb]"
            >
              <RotateCcw className="h-3 w-3" />
              선택 해제
            </button>
          )}
        </div>
      </div>

      {/* Main Canvas Area */}
      <div className="relative flex-1">
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
        >
          <Background color="#cbd5e1" gap={24} size={1.2} variant={BackgroundVariant.Dots} />
          <Controls showInteractive={false} className="!rounded-xl !border-slate-200 !shadow-sm" />
          <MiniMap
            nodeColor={(node) => {
              const data = node.data as any;
              return data?.post ? getCategoryColor(data.post.category).border : "#e2e8f0";
            }}
            className="!rounded-xl !border-slate-200 !bg-white/80"
          />

          {/* Floating Canvas Guide */}
          <Panel position="bottom-left" className="m-4">
            <div className="rounded-xl border border-[#e5e8eb]/80 bg-white/90 p-3 text-[11px] text-[#4e5968] shadow-sm backdrop-blur-sm max-w-xs">
              <div className="flex items-center gap-1.5 font-bold text-[#191f28] mb-1">
                <Network className="h-3.5 w-3.5 text-[#3182f6]" />
                <span>시맨틱 거리 가이드</span>
              </div>
              <p className="leading-relaxed">
                노드를 클릭하면 해당 글과 다른 글들 사이의 실제 <strong>코사인 유사도(%)</strong> 및 <strong>유클리드 거리</strong> 분석 결과를 조회할 수 있습니다.
              </p>
            </div>
          </Panel>
        </ReactFlow>

        {/* Right Slide-over Inspector Panel */}
        {selectedPostData && (
          <div className="absolute right-4 top-4 bottom-4 w-96 max-w-[calc(100vw-32px)] z-20 flex flex-col rounded-2xl border border-[#e5e8eb] bg-white/95 p-5 shadow-2xl backdrop-blur-md animate-in slide-in-from-right-4 duration-200">
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

            {/* Vector Distance Ranking Section */}
            <div className="mt-4 flex-1 overflow-y-auto pr-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[#191f28] flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-[#3182f6]" />
                  <span>타 포스트와의 벡터 거리 순위</span>
                </span>
                <span className="text-[10px] text-[#8b95a1]">
                  기준: {metricMode === "cosine" ? "코사인 유사도" : "유클리드 거리"}
                </span>
              </div>

              <div className="space-y-2">
                {selectedPostData.ranking.map((item) => {
                  const pct = Math.max(0, Math.min(100, Math.round(item.similarity * 100)));
                  const isHighSim = item.similarity >= similarityThreshold;

                  return (
                    <div
                      key={item.targetPost.id}
                      onClick={() => setSelectedPostId(item.targetPost.id)}
                      className={`group cursor-pointer rounded-xl border p-2.5 transition-all ${
                        isHighSim
                          ? "border-blue-100 bg-blue-50/40 hover:bg-blue-50/80"
                          : "border-[#f0f2f5] bg-white hover:border-[#d1d6db]"
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-semibold text-[#191f28]">
                        <span className="truncate max-w-[200px] group-hover:text-[#3182f6] transition-colors">
                          {item.targetPost.title}
                        </span>
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
                            : `L2 ${item.distance.toFixed(2)}`}
                        </span>
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
    </div>
  );
}
