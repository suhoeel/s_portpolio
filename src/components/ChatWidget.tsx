"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Sparkles, X } from "lucide-react";
import type { SearchHit } from "@/types";
import { cn } from "@/lib/utils";

const OPEN_EVENT = "open-knowledge-chat";

/** Open the bot from anywhere, optionally with a question to ask right away. */
export function openChat(question?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: question }));
}

interface Message {
  role: "user" | "bot";
  text: string;
  hits?: SearchHit[];
  mode?: "search" | "llm";
}

const suggestions = ["하이브리드 검색이 뭐야?", "로컬 Supabase 설정 방법", "지식 그래프는 어떻게 만들었어?"];

/** Group chunk hits by post so each post shows once with its best sections. */
function groupHits(hits: SearchHit[]) {
  const map = new Map<string, { slug: string; title: string; sections: SearchHit[] }>();
  for (const h of hits) {
    if (!map.has(h.slug)) map.set(h.slug, { slug: h.slug, title: h.title, sections: [] });
    map.get(h.slug)!.sections.push(h);
  }
  return [...map.values()];
}

function snippet(content: string) {
  return content
    .split("\n")
    .slice(1)
    .join(" ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#>*`|]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const ask = useCallback(async (question: string) => {
    const q = question.trim();
    if (!q) return;
    setMessages((m) => [...m, { role: "user", text: q }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "검색에 실패했어요.");
      const hits: SearchHit[] = data.hits ?? [];
      const text =
        data.answer ??
        (hits.length
          ? `관련된 글 ${groupHits(hits).length}개를 찾았어요.`
          : "관련된 글을 찾지 못했어요. 다른 키워드로 물어봐 주세요.");
      setMessages((m) => [...m, { role: "bot", text, hits, mode: data.mode }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "bot", text: (e as Error).message }]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const handler = (e: Event) => {
      setOpen(true);
      const q = (e as CustomEvent<string | undefined>).detail;
      if (q) ask(q);
      setTimeout(() => inputRef.current?.focus(), 50);
    };
    window.addEventListener(OPEN_EVENT, handler);
    return () => window.removeEventListener(OPEN_EVENT, handler);
  }, [ask]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <>
      {/* Panel (opens only on explicit trigger) */}
      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-[min(600px,calc(100vh-6rem))] w-[calc(100vw-3rem)] max-w-[400px] origin-bottom-right flex-col overflow-hidden rounded-2xl border border-[#eef0f3] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.12)] transition-all duration-300",
          open ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0"
        )}
      >
        <div className="flex items-center justify-between border-b border-[#f2f4f6] px-5 py-4">
          <div>
            <div className="flex items-center gap-1.5 font-bold text-[#191f28]">
              <Sparkles className="h-4 w-4 text-[#3182f6]" />
              지식 도우미
            </div>
            <p className="mt-0.5 text-xs text-[#8b95a1]">블로그에 정리한 글에서 찾아 답해요</p>
          </div>
          <button onClick={() => setOpen(false)} className="rounded-lg p-1.5 text-[#8b95a1] hover:bg-[#f2f4f6]" aria-label="닫기">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
          {messages.length === 0 && (
            <div className="pt-6 text-center">
              <p className="text-[15px] font-semibold text-[#333d4b]">무엇이든 물어보세요</p>
              <p className="mt-1 text-sm text-[#8b95a1]">키워드 + 부분 일치 하이브리드 검색으로 글을 찾아요</p>
              <div className="mt-5 flex flex-col gap-2">
                {suggestions.map((s) => (
                  <button
                    key={s}
                    onClick={() => ask(s)}
                    className="rounded-xl bg-[#f9fafb] px-4 py-2.5 text-left text-sm text-[#4e5968] transition-colors hover:bg-[#f2f4f6]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) =>
            m.role === "user" ? (
              <div key={i} className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#3182f6] px-4 py-2.5 text-sm text-white">{m.text}</div>
              </div>
            ) : (
              <div key={i} className="space-y-2">
                <div className="max-w-[92%] whitespace-pre-line rounded-2xl rounded-bl-md bg-[#f2f4f6] px-4 py-2.5 text-sm leading-relaxed text-[#333d4b]">
                  {m.text}
                </div>
                {m.hits && m.hits.length > 0 && (
                  <div className="space-y-2">
                    {groupHits(m.hits).map((g) => (
                      <Link
                        key={g.slug}
                        href={`/blog/${g.slug}#${g.sections[0].heading ? "" : ""}`.replace(/#$/, "")}
                        onClick={() => setOpen(false)}
                        className="block rounded-xl border border-[#eef0f3] p-3 transition-colors hover:border-[#c9d4e2] hover:bg-[#fafbfc]"
                      >
                        <div className="flex items-center gap-1.5 text-[13px] font-semibold text-[#191f28]">
                          <FileText className="h-3.5 w-3.5 shrink-0 text-[#3182f6]" />
                          <span className="line-clamp-1">{g.title}</span>
                        </div>
                        <p className="mt-1 text-xs font-medium text-[#6b7684]">§ {g.sections[0].heading}</p>
                        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-[#8b95a1]">{snippet(g.sections[0].content)}</p>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )
          )}

          {loading && (
            <div className="flex w-16 items-center justify-center gap-1 rounded-2xl bg-[#f2f4f6] px-4 py-3">
              {[0, 1, 2].map((d) => (
                <span key={d} className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#8b95a1]" style={{ animationDelay: `${d * 120}ms` }} />
              ))}
            </div>
          )}
          <div ref={endRef} />
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            ask(input);
          }}
          className="flex items-center gap-2 border-t border-[#f2f4f6] p-3"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="예: pgvector 인덱스는 뭘 써?"
            className="flex-1 rounded-xl bg-[#f2f4f6] px-4 py-2.5 text-sm text-[#191f28] placeholder:text-[#b0b8c1] focus:outline-none focus:ring-2 focus:ring-[#3182f6]/30"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#3182f6] text-white transition-opacity disabled:opacity-30"
            aria-label="보내기"
          >
            <ArrowUp className="h-4 w-4" />
          </button>
        </form>
      </div>
    </>
  );
}
