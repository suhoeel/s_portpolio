"use client";

import { Sparkles } from "lucide-react";
import { openChat } from "@/components/ChatWidget";

export function AskAiButton({ question }: { question: string }) {
  return (
    <button
      onClick={() => openChat(question)}
      className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#3182f6] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#1b64da] transition-colors"
    >
      <Sparkles className="h-3.5 w-3.5" />
      <span>AI에게 바로 질문</span>
    </button>
  );
}
