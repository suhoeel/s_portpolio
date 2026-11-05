"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PenLine, Search } from "lucide-react";
import { profile } from "@/data/profile";
import { cn } from "@/lib/utils";
import { openChat } from "@/components/ChatWidget";

const links = [
  { href: "/", label: "소개" },
  { href: "/blog", label: "블로그" },
  { href: "/graph", label: "지식 그래프" },
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
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 bg-white border-b border-[#EBECF0] transition-colors",
        scrolled ? "border-[#DFE1E6]" : ""
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-5">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-base font-bold tracking-tight text-[#172B4D] hover:text-[#0052CC] transition-colors">
            {profile.blogName}
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "rounded-md px-2.5 py-1 text-sm font-medium transition-colors",
                  isActive(l.href)
                    ? "bg-[#F4F5F7] text-[#172B4D] font-bold"
                    : "text-[#5E6C84] hover:bg-[#FAFBFC] hover:text-[#172B4D]"
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
            className="flex items-center gap-1.5 rounded-md border border-[#DFE1E6] bg-[#FAFBFC] px-2.5 py-1 text-xs text-[#5E6C84] transition-colors hover:border-[#B3D4FF] hover:text-[#0052CC] hover:bg-white"
          >
            <Search className="h-3.5 w-3.5" />
            <span className="hidden md:inline">검색</span>
          </button>
          <Link
            href="/write"
            className="flex items-center gap-1.5 rounded-md bg-[#172B4D] px-3 py-1 text-xs font-semibold text-white transition-colors hover:bg-[#091E42]"
          >
            <PenLine className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">글쓰기</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
