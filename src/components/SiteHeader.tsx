"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PenLine, Search } from "lucide-react";
import { profile } from "@/data/profile";
import { cn } from "@/lib/utils";
import { openChat } from "@/components/ChatWidget";

const links = [
  { href: "/", label: "글" },
  { href: "/graph", label: "지식 그래프" },
  { href: "/about", label: "소개" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" || pathname.startsWith("/blog") : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-white/85 backdrop-blur-md transition-shadow duration-300",
        scrolled ? "shadow-[0_1px_0_#eef0f3]" : ""
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-[19px] font-extrabold tracking-tight text-[#191f28]">
            {profile.blogName}
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-[15px] font-medium transition-colors",
                  isActive(l.href) ? "text-[#191f28]" : "text-[#8b95a1] hover:text-[#4e5968]"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => openChat()}
            className="flex items-center gap-2 rounded-full border border-[#e5e8eb] px-3.5 py-1.5 text-sm text-[#6b7684] transition-colors hover:border-[#d1d6db] hover:text-[#333d4b]"
          >
            <Search className="h-4 w-4" />
            <span className="hidden md:inline">지식 검색 · AI에게 묻기</span>
          </button>
          <Link
            href="/write"
            className="flex items-center gap-1.5 rounded-full bg-[#191f28] px-3.5 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#333d4b]"
          >
            <PenLine className="h-4 w-4" />
            <span className="hidden sm:inline">글쓰기</span>
          </Link>
        </div>
      </div>

      {/* mobile nav */}
      <nav className="no-scrollbar flex gap-1 overflow-x-auto px-3 pb-2 sm:hidden">
        {links.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "shrink-0 rounded-lg px-3 py-1 text-sm font-medium",
              isActive(l.href) ? "bg-[#f2f4f6] text-[#191f28]" : "text-[#8b95a1]"
            )}
          >
            {l.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
