import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import GithubSlugger from "github-slugger";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/** Korean reading speed ~500 chars/min. */
export function readingTime(markdown: string): string {
  const text = markdown.replace(/```[\s\S]*?```/g, "").replace(/[#>*`\-\[\]()!|]/g, "");
  return `${Math.max(1, Math.round(text.length / 500))}분`;
}

export interface TocItem {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Same slug algorithm as rehype-slug, so ids match the rendered headings. */
export function extractToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (line.trim().startsWith("```")) inFence = !inFence;
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.+?)\s*#*$/.exec(line);
    if (!m) continue;
    const text = m[2].replace(/[*_`]/g, "");
    items.push({ id: slugger.slug(text), text, level: m[1].length as 2 | 3 });
  }
  return items;
}

export function slugify(title: string): string {
  return (
    title
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .slice(0, 80) || `post-${Date.now()}`
  );
}
