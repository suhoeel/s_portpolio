"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  Quote,
  Code,
  FileCode,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Eye,
  Columns,
  PenLine,
  Save,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { Markdown } from "@/components/Markdown";

const DEFAULT_CONTENT = `## 1. 시작하며

여기에 공부한 내용이나 개발 경험을 작성하세요.

상단의 **스타일 버튼**을 누르면 마크다운 문법이 자동으로 입력되며, 오른쪽 화면에서 실시간으로 렌더링된 결과를 바로 확인할 수 있습니다.

### 핵심 개념 정리

- 첫 번째 핵심 포인트
- 두 번째 핵심 포인트

> "배운 것을 글로 정리하고 시스템으로 구조화할 때 비로소 내 지식이 된다."

\`\`\`typescript
function calculateRRF(rankFts: number, rankVec: number, k = 50): number {
  return (1.0 / (k + rankFts)) + (1.0 / (k + rankVec));
}
\`\`\`
`;

export default function WritePage() {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("Database");
  const [tagsInput, setTagsInput] = useState("Supabase, pgvector");
  const [coverImage, setCoverImage] = useState<string>("/images/covers/hybrid-search.jpg");
  const [content, setContent] = useState(DEFAULT_CONTENT);

  const [viewMode, setViewMode] = useState<"split" | "edit" | "preview">("split");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 텍스트 선택 영역에 서식 래핑 또는 삽입
  const insertFormatting = (prefix: string, suffix: string = "", defaultText: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = textarea.value.substring(start, end) || defaultText;

    const replacement = `${prefix}${selected}${suffix}`;
    const newContent =
      textarea.value.substring(0, start) + replacement + textarea.value.substring(end);

    setContent(newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(
        start + prefix.length,
        start + prefix.length + selected.length
      );
    }, 10);
  };

  // 이미지 파일 업로드 핸들러
  const handleImageUpload = async (file: File) => {
    setIsUploading(true);
    setErrorMsg(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "이미지 업로드에 실패했습니다.");

      // 본문 커서 위치에 마크다운 이미지 삽입
      insertFormatting(`\n![${file.name.replace(/\.[^/.]+$/, "")}](${data.url})\n`);
      // 커버 이미지가 기본값이면 방금 올린 이미지로 자동 지정
      if (!coverImage || coverImage.startsWith("/images/covers/")) {
        setCoverImage(data.url);
      }
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  // 글 게시 핸들러
  const handleSubmit = async () => {
    if (!title.trim()) {
      alert("글 제목을 입력해 주세요.");
      return;
    }
    if (!content.trim()) {
      alert("글 본문 내용을 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const tags = tagsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      const res = await fetch("/api/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          summary,
          content,
          category,
          tags,
          cover_image: coverImage || null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "글 저장에 실패했습니다.");

      // 발행 성공 시 상세 페이지로 이동
      router.push(`/blog/${data.post.slug}`);
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
      setIsSubmitting(false);
    }
  };

  const sampleCovers = [
    { label: "하이브리드 검색", url: "/images/covers/hybrid-search.jpg" },
    { label: "지식 그래프", url: "/images/covers/knowledge-graph.jpg" },
    { label: "웹 블로그", url: "/images/covers/nextjs-blog.jpg" },
    { label: "로컬 도커", url: "/images/covers/local-supabase.jpg" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-8">
      {/* Top Header & Actions */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-[#f2f4f6] pb-5">
        <div>
          <span className="text-xs font-bold text-[#3182f6] flex items-center gap-1">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Markdown & Visual Studio</span>
          </span>
          <h1 className="text-2xl font-extrabold text-[#191f28] mt-0.5">새 블로그 글 작성</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="inline-flex rounded-lg border border-[#e5e8eb] bg-[#f9fafb] p-0.5 text-xs font-semibold">
            <button
              onClick={() => setViewMode("edit")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 transition-colors ${
                viewMode === "edit" ? "bg-white text-[#191f28] shadow-sm" : "text-[#8b95a1]"
              }`}
              title="편집창만 보기"
            >
              <PenLine className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">편집기</span>
            </button>
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 transition-colors ${
                viewMode === "split" ? "bg-white text-[#191f28] shadow-sm" : "text-[#8b95a1]"
              }`}
              title="분할 보기"
            >
              <Columns className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">분할</span>
            </button>
            <button
              onClick={() => setViewMode("preview")}
              className={`flex items-center gap-1 rounded-md px-2.5 py-1.5 transition-colors ${
                viewMode === "preview" ? "bg-white text-[#191f28] shadow-sm" : "text-[#8b95a1]"
              }`}
              title="미리보기만 보기"
            >
              <Eye className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">미리보기</span>
            </button>
          </div>

          <button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex items-center gap-1.5 rounded-full bg-[#3182f6] px-5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-[#1b64da] transition-colors disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? "게시 중..." : "게시하기"}</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 p-3.5 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Metadata Form Section */}
      <div className="mb-6 rounded-2xl border border-[#eef0f3] bg-[#fafbfc] p-5 space-y-4">
        {/* Title */}
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="제목을 입력하세요 (예: Next.js로 마크다운 블로그 만들기)"
          className="w-full rounded-xl border border-[#e5e8eb] bg-white px-4 py-3 text-lg font-bold text-[#191f28] placeholder:text-[#b0b8c1] focus:border-[#3182f6] focus:outline-none"
        />

        {/* Summary */}
        <input
          type="text"
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          placeholder="글 요약 (글 목록 카드 및 RAG 지식 검색 스니펫으로 활용됩니다)"
          className="w-full rounded-xl border border-[#e5e8eb] bg-white px-4 py-2 text-sm text-[#333d4b] placeholder:text-[#b0b8c1] focus:border-[#3182f6] focus:outline-none"
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Category */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6b7684] shrink-0">카테고리:</span>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex-1 rounded-xl border border-[#e5e8eb] bg-white px-3 py-2 text-xs font-medium text-[#191f28] focus:border-[#3182f6] focus:outline-none"
            >
              <option value="Database">Database</option>
              <option value="Frontend">Frontend</option>
              <option value="DevOps">DevOps</option>
              <option value="AI & Architecture">AI & Architecture</option>
              <option value="General">General</option>
            </select>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-[#6b7684] shrink-0">태그:</span>
            <input
              type="text"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
              placeholder="쉼표로 구분 (예: Supabase, RAG, React)"
              className="flex-1 rounded-xl border border-[#e5e8eb] bg-white px-3 py-2 text-xs text-[#191f28] placeholder:text-[#b0b8c1] focus:border-[#3182f6] focus:outline-none"
            />
          </div>
        </div>

        {/* Cover Image Picker */}
        <div className="pt-2 border-t border-[#f0f2f5]">
          <span className="text-xs font-semibold text-[#6b7684] block mb-2">커버 이미지 선택:</span>
          <div className="flex flex-wrap items-center gap-2">
            {sampleCovers.map((sc) => (
              <button
                key={sc.url}
                onClick={() => setCoverImage(sc.url)}
                className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                  coverImage === sc.url
                    ? "border-[#3182f6] bg-[#f4f8ff] text-[#3182f6] font-bold"
                    : "border-[#e5e8eb] bg-white text-[#6b7684] hover:bg-[#f2f4f6]"
                }`}
              >
                <span>{sc.label}</span>
                {coverImage === sc.url && <CheckCircle2 className="h-3 w-3 text-[#3182f6]" />}
              </button>
            ))}

            {/* Custom image upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1 rounded-lg border border-dashed border-[#3182f6] bg-white px-3 py-1.5 text-xs font-medium text-[#3182f6] hover:bg-[#f4f8ff] transition-colors"
            >
              <UploadCloud className="h-3.5 w-3.5" />
              <span>{isUploading ? "업로드 중..." : "새 이미지 파일 올리기"}</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleImageUpload(file);
              }}
            />
          </div>
        </div>
      </div>

      {/* Editor & Toolbar Container */}
      <div className="rounded-2xl border border-[#e5e8eb] bg-white shadow-sm overflow-hidden">
        
        {/* Style Formatting Button Toolbar */}
        <div className="flex flex-wrap items-center gap-1 border-b border-[#f2f4f6] bg-[#fafbfc] p-2 text-[#4e5968]">
          <button
            onClick={() => insertFormatting("**", "**", "굵은 텍스트")}
            className="rounded-lg p-2 hover:bg-[#eef0f3] hover:text-[#191f28] transition-colors"
            title="굵게 (Bold)"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => insertFormatting("*", "*", "기울임 텍스트")}
            className="rounded-lg p-2 hover:bg-[#eef0f3] hover:text-[#191f28] transition-colors"
            title="기울임 (Italic)"
          >
            <Italic className="h-4 w-4" />
          </button>
          <button
            onClick={() => insertFormatting("~~", "~~", "취소선")}
            className="rounded-lg p-2 hover:bg-[#eef0f3] hover:text-[#191f28] transition-colors"
            title="취소선"
          >
            <Strikethrough className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-[1px] bg-[#e5e8eb]" />

          <button
            onClick={() => insertFormatting("\n## ", "\n", "중제목")}
            className="rounded-lg p-2 hover:bg-[#eef0f3] hover:text-[#191f28] transition-colors"
            title="중제목 (H2)"
          >
            <Heading2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => insertFormatting("\n### ", "\n", "소제목")}
            className="rounded-lg p-2 hover:bg-[#eef0f3] hover:text-[#191f28] transition-colors"
            title="소제목 (H3)"
          >
            <Heading3 className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-[1px] bg-[#e5e8eb]" />

          <button
            onClick={() => insertFormatting("\n> ", "\n", "인용구 내용")}
            className="rounded-lg p-2 hover:bg-[#eef0f3] hover:text-[#191f28] transition-colors"
            title="인용구"
          >
            <Quote className="h-4 w-4" />
          </button>
          <button
            onClick={() => insertFormatting("`", "`", "코드")}
            className="rounded-lg p-2 hover:bg-[#eef0f3] hover:text-[#191f28] transition-colors"
            title="인라인 코드"
          >
            <Code className="h-4 w-4" />
          </button>
          <button
            onClick={() => insertFormatting("\n```typescript\n", "\n```\n", "// 코드 작성")}
            className="rounded-lg p-2 hover:bg-[#eef0f3] hover:text-[#191f28] transition-colors"
            title="코드 블록"
          >
            <FileCode className="h-4 w-4" />
          </button>

          <div className="mx-1 h-4 w-[1px] bg-[#e5e8eb]" />

          <button
            onClick={() => insertFormatting("\n- ", "\n", "목록 항목")}
            className="rounded-lg p-2 hover:bg-[#eef0f3] hover:text-[#191f28] transition-colors"
            title="글머리 기호 목록"
          >
            <List className="h-4 w-4" />
          </button>
          <button
            onClick={() => insertFormatting("\n1. ", "\n", "번호 항목")}
            className="rounded-lg p-2 hover:bg-[#eef0f3] hover:text-[#191f28] transition-colors"
            title="번호 매기기 목록"
          >
            <ListOrdered className="h-4 w-4" />
          </button>
          <button
            onClick={() => insertFormatting("[", "](https://example.com)", "링크 텍스트")}
            className="rounded-lg p-2 hover:bg-[#eef0f3] hover:text-[#191f28] transition-colors"
            title="링크 삽입"
          >
            <LinkIcon className="h-4 w-4" />
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg p-2 hover:bg-[#eef0f3] hover:text-[#3182f6] transition-colors text-[#3182f6]"
            title="본문에 이미지 파일 업로드 삽입"
          >
            <ImageIcon className="h-4 w-4" />
          </button>
          <button
            onClick={() => insertFormatting("\n---\n")}
            className="rounded-lg p-2 hover:bg-[#eef0f3] hover:text-[#191f28] transition-colors"
            title="가로선"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>

        {/* Content Body: Split or Single View */}
        <div
          className={`grid min-h-[500px] ${
            viewMode === "split"
              ? "grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-[#eef0f3]"
              : "grid-cols-1"
          }`}
        >
          {/* Markdown Textarea */}
          {(viewMode === "split" || viewMode === "edit") && (
            <div className="p-4">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="마크다운 형식으로 글을 자유롭게 작성하세요..."
                className="w-full h-full min-h-[480px] bg-transparent text-[15px] font-mono leading-relaxed text-[#191f28] placeholder:text-[#b0b8c1] focus:outline-none resize-none"
              />
            </div>
          )}

          {/* Live Rendered Markdown Preview */}
          {(viewMode === "split" || viewMode === "preview") && (
            <div className="p-6 bg-[#fafbfc] overflow-y-auto max-h-[700px]">
              <div className="text-xs font-bold text-[#8b95a1] uppercase mb-4 tracking-wider">
                실시간 렌더링 미리보기
              </div>
              <Markdown content={content} />
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
