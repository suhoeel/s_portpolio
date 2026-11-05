-- =============================================================================
-- Portfolio blog schema
--   posts        : blog posts (Markdown source of truth)
--   post_chunks  : RAG chunks per post (full-text + trigram + optional vector)
--   search_knowledge(): hybrid search (keyword FTS + trigram + vector) merged by RRF
-- =============================================================================

create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- -----------------------------------------------------------------------------
-- posts
-- -----------------------------------------------------------------------------
create table public.posts (
  id          bigint generated always as identity primary key,
  slug        text unique not null,
  title       text not null,
  summary     text not null default '',
  content     text not null default '',          -- Markdown
  cover_image text,
  category    text not null default 'General',
  tags        text[] not null default '{}',
  published   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index posts_created_at_idx on public.posts (created_at desc);
create index posts_tags_idx on public.posts using gin (tags);

-- -----------------------------------------------------------------------------
-- post_chunks (RAG)
--   embedding: 384 dims (intfloat/multilingual-e5-small, same as supabase_rag_lab)
--   'simple' FTS config is used because Postgres has no built-in Korean parser;
--   pg_trgm covers Korean partial matches.
-- -----------------------------------------------------------------------------
create table public.post_chunks (
  id          bigint generated always as identity primary key,
  post_id     bigint not null references public.posts (id) on delete cascade,
  chunk_index int not null,
  heading     text,
  content     text not null,
  fts         tsvector generated always as (to_tsvector('simple', coalesce(heading, '') || ' ' || content)) stored,
  embedding   extensions.vector(384),
  unique (post_id, chunk_index)
);

create index post_chunks_fts_idx on public.post_chunks using gin (fts);
create index post_chunks_trgm_idx on public.post_chunks using gin (content extensions.gin_trgm_ops);
create index post_chunks_embedding_idx on public.post_chunks using hnsw (embedding extensions.vector_cosine_ops);

-- -----------------------------------------------------------------------------
-- Chunking: split Markdown by headings (## / ###) whenever a post changes.
-- Embeddings are filled later by an embedding job (embedding stays NULL until then).
-- -----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function public.rebuild_post_chunks_after()
returns trigger
language plpgsql
as $$
declare
  section text;
  sections text[];
  idx int := 0;
  first_line text;
begin
  delete from public.post_chunks where post_id = new.id;
  sections := regexp_split_to_array(new.content, E'\\n(?=#{2,3} )');

  foreach section in array sections loop
    section := btrim(section);
    continue when section = '';
    first_line := split_part(section, E'\n', 1);

    insert into public.post_chunks (post_id, chunk_index, heading, content)
    values (
      new.id,
      idx,
      case when first_line ~ '^#{1,6} ' then regexp_replace(first_line, '^#{1,6} ', '') else new.title end,
      new.title || E'\n' || section
    );
    idx := idx + 1;
  end loop;
  return null;
end;
$$;

create trigger posts_touch_updated_at
before update on public.posts
for each row execute function public.touch_updated_at();

create trigger posts_rebuild_chunks
after insert or update of content, title on public.posts
for each row execute function public.rebuild_post_chunks_after();

-- -----------------------------------------------------------------------------
-- Hybrid search (Reciprocal Rank Fusion)
--   query_embedding is optional: when NULL, only keyword + trigram ranks are fused.
-- -----------------------------------------------------------------------------
create or replace function public.search_knowledge(
  query_text      text,
  query_embedding extensions.vector(384) default null,
  match_count     int default 6,
  rrf_k           int default 50
)
returns table (
  chunk_id    bigint,
  post_id     bigint,
  slug        text,
  title       text,
  heading     text,
  content     text,
  score       double precision
)
language sql
stable
set search_path = public, extensions
as $$
  with
  -- split the question into words, strip common Korean particles, drop filler words
  raw_words as (
    select regexp_split_to_table(lower(query_text), '[^0-9a-z가-힣_.-]+') as w
  ),
  words as (
    select distinct w
    from (
      select regexp_replace(w, '(으로|에서|에게|이란|이랑|하고|은|는|이|가|을|를|에|의|로|와|과|도|란)$', '') as w
      from raw_words
    ) s
    where length(w) >= 2
      and w not in ('뭐야', '알려줘', '설명해줘', '정리해줘', '어떻게', '무엇', '관련', '대해', '대한', '있어', '해줘')
  ),
  tsq as (
    select to_tsquery('simple', string_agg(quote_literal(w), ' | ')) as q from words
  ),
  fts as (
    select c.id, row_number() over (order by ts_rank_cd(c.fts, tsq.q) desc) as rnk
    from post_chunks c, tsq
    where tsq.q is not null and c.fts @@ tsq.q
    limit 30
  ),
  trgm as (
    select c.id,
           row_number() over (order by count(*) desc, max(word_similarity(w.w, c.content)) desc) as rnk
    from post_chunks c
    join words w on c.content ilike '%' || w.w || '%'
    group by c.id
    limit 30
  ),
  vec as (
    select c.id, row_number() over (order by c.embedding <=> query_embedding) as rnk
    from post_chunks c
    where query_embedding is not null and c.embedding is not null
    order by c.embedding <=> query_embedding
    limit 30
  ),
  fused as (
    select id, sum(1.0 / (rrf_k + rnk)) as score
    from (
      select id, rnk from fts
      union all select id, rnk from trgm
      union all select id, rnk from vec
    ) ranks
    group by id
  )
  select c.id, p.id, p.slug, p.title, c.heading, c.content, f.score
  from fused f
  join post_chunks c on c.id = f.id
  join posts p on p.id = c.post_id
  where p.published
  order by f.score desc
  limit match_count;
$$;

-- -----------------------------------------------------------------------------
-- RLS: public read; writes go through the Next.js server (service_role key).
-- -----------------------------------------------------------------------------
alter table public.posts enable row level security;
alter table public.post_chunks enable row level security;

create policy "Public can read published posts"
on public.posts for select
using (published);

create policy "Public can read chunks"
on public.post_chunks for select
using (true);

grant select on public.posts, public.post_chunks to anon, authenticated;
grant execute on function public.search_knowledge(text, extensions.vector, int, int) to anon, authenticated;
