import { createClient } from "@supabase/supabase-js";
import type { Post } from "@/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/** Read-only client (RLS: published posts only). */
export function publicClient() {
  return createClient(url, anonKey, { auth: { persistSession: false } });
}

/** Server-only client for writes/uploads. Never import from client components. */
export function adminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set");
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Optional write protection: if ADMIN_TOKEN is set, the request must carry it. */
export function isAuthorized(req: Request): boolean {
  const token = process.env.ADMIN_TOKEN;
  if (!token) return true;
  return req.headers.get("x-admin-token") === token;
}

export async function getPosts(): Promise<Post[]> {
  const { data, error } = await publicClient()
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw new Error(`Failed to load posts: ${error.message}`);
  return data as Post[];
}

export async function getPost(slug: string): Promise<Post | null> {
  const { data, error } = await publicClient()
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Failed to load post: ${error.message}`);
  return data as Post | null;
}

export function countBy(values: string[]): [string, number][] {
  const map = new Map<string, number>();
  for (const v of values) map.set(v, (map.get(v) ?? 0) + 1);
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}
