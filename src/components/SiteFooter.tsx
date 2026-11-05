"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mail } from "lucide-react";
import { profile } from "@/data/profile";
import { GithubIcon, LinkedinIcon } from "@/components/SocialIcons";

export function SiteFooter() {
  const pathname = usePathname();

  // Hide footer on graph page to ensure no window scrolling and true full-canvas experience
  if (pathname === "/graph") return null;

  return (
    <footer className="mt-24 border-t border-[#f2f4f6]">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-10 text-sm text-[#8b95a1] sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/" className="font-bold text-[#4e5968]">
            {profile.blogName}
          </Link>
          <span className="ml-2">© {profile.name}</span>
        </div>
        <div className="flex items-center gap-4">
          <a href={profile.github} target="_blank" rel="noreferrer" className="hover:text-[#333d4b]" aria-label="GitHub">
            <GithubIcon className="h-[18px] w-[18px]" />
          </a>
          <a href={profile.linkedin} target="_blank" rel="noreferrer" className="hover:text-[#333d4b]" aria-label="LinkedIn">
            <LinkedinIcon className="h-[18px] w-[18px]" />
          </a>
          <a href={`mailto:${profile.email}`} className="hover:text-[#333d4b]" aria-label="Email">
            <Mail className="h-[18px] w-[18px]" />
          </a>
        </div>
      </div>
    </footer>
  );
}
