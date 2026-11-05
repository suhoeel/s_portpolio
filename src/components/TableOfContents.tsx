"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/utils";
import { cn } from "@/lib/utils";

export function TableOfContents({ items }: { items: TocItem[] }) {
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        }
      },
      { rootMargin: "0px 0px -60% 0px" }
    );

    for (const item of items) {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    }

    return () => observer.disconnect();
  }, [items]);

  return (
    <nav className="space-y-1.5 text-xs">
      {items.map((item) => (
        <a
          key={item.id}
          href={`#${item.id}`}
          className={cn(
            "block py-1 transition-colors leading-relaxed",
            item.level === 3 ? "pl-3 text-[#8b95a1]" : "font-medium text-[#4e5968]",
            activeId === item.id
              ? "text-[#3182f6] font-bold border-l-2 border-[#3182f6] pl-2 -ml-2"
              : "hover:text-[#191f28]"
          )}
        >
          {item.text}
        </a>
      ))}
    </nav>
  );
}
