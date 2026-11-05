import { createClient } from "@supabase/supabase-js";
import { generateSemanticEmbedding } from "../src/lib/vector";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:55321";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

const supabase = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  console.log("🚀 Starting semantic embedding synchronization...");

  // 1. Fetch all posts
  const { data: posts, error: postErr } = await supabase
    .from("posts")
    .select("id, slug, title, summary, content, category, tags");

  if (postErr || !posts) {
    console.error("Failed to load posts:", postErr);
    return;
  }

  console.log(`Loaded ${posts.length} posts. Generating embeddings...`);

  // 2. Generate and update post embedding
  for (const post of posts) {
    const embedding = generateSemanticEmbedding(
      `${post.summary} ${post.content}`,
      { title: post.title, category: post.category, tags: post.tags }
    );

    const { error: updErr } = await supabase
      .from("posts")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", post.id);

    if (updErr) {
      console.error(`Failed to update embedding for post ${post.slug}:`, updErr.message);
    } else {
      console.log(`✓ Updated embedding for post: [${post.slug}] (${embedding.length} dims)`);
    }
  }

  // 3. Fetch all post_chunks
  const { data: chunks, error: chunkErr } = await supabase
    .from("post_chunks")
    .select("id, post_id, heading, content");

  if (chunkErr || !chunks) {
    console.error("Failed to load chunks:", chunkErr);
    return;
  }

  console.log(`Loaded ${chunks.length} chunks. Generating embeddings...`);

  for (const chunk of chunks) {
    const parent = posts.find((p) => p.id === chunk.post_id);
    const embedding = generateSemanticEmbedding(
      chunk.content,
      parent ? { title: parent.title, category: parent.category, tags: parent.tags } : undefined
    );

    const { error: updErr } = await supabase
      .from("post_chunks")
      .update({ embedding: JSON.stringify(embedding) })
      .eq("id", chunk.id);

    if (updErr) {
      console.error(`Failed to update chunk ${chunk.id}:`, updErr.message);
    }
  }

  console.log("🎉 All embeddings successfully synchronized with Supabase pgvector!");
}

main().catch(console.error);
