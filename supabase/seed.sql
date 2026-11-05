-- Seed posts (Markdown). Chunks are generated automatically by the posts trigger.

insert into public.posts (slug, title, summary, cover_image, category, tags, created_at, content) values
(
  'supabase-hybrid-search',
  'pgvector와 Full-Text Search를 섞어 하이브리드 검색 만들기',
  'Sparse Vector(BM25/tsvector)와 Dense Vector(pgvector)의 원리적 차이를 비교하고, 토크나이징·임베딩 유사도 계산부터 RRF(Reciprocal Rank Fusion) 알고리즘으로 상호보완적 하이브리드 검색 엔진을 구축하는 실무 아키텍처를 정리했습니다.',
  null,
  'Database',
  array['Supabase', 'pgvector', 'RAG', 'PostgreSQL', 'Search', 'Elasticsearch'],
  '2026-10-10 10:00:00+09',
$md$
## 1. 왜 벡터 검색(Dense Vector)만으로는 한계가 있을까?

LLM 기반 RAG(Retrieval-Augmented Generation) 파이프라인이나 추천 검색 엔진을 구현할 때 흔히 `text-embedding-3-small`, `bge-m3` 같은 Dense Embedding 모델을 사용하여 벡터 유사도 검색을 구축합니다.

그러나 실무 프로덕션 환경에 배포하는 순간 다음과 같은 치명적인 문제점들에 직면하게 됩니다.

1. **정확한 고유명사 및 코드 식별자 매칭 실패**:
   `CVE-2024-38077`, `PR-4921`, `com.example.service.UserServiceImpl`, `v1.24.0-rc1`과 같은 단어는 토크나이저를 거치면서 하위 토큰(Subwords)으로 잘게 쪼개져 고유한 의미가 희석됩니다. 결과적으로 코사인 유사도 연산 시 엉뚱한 버전이나 무관한 문서가 상위 랭킹(Top-k)을 차지합니다.
2. **도메인 특화 약어 및 전문 용어 누락**:
   일반 도메인 코퍼스로 사전 학습된 임베딩 모델은 사내 특화 축약어, 금융/법률 규제 조항 번호, 부품 일련번호를 문맥적으로만 모호하게 해석하여 정확한 검색 결과를 반환하지 못합니다.
3. **희귀 키워드(Out-of-Vocabulary)의 가중치 과소평가**:
   문서 집합 전체에서 단 한 번 등장하는 핵심 키워드라도 Dense Vector 공간상에서는 평균적인 벡터 방향으로 뭉개지는 현상이 발생합니다.

> **"Dense Vector(의미 검색)는 '문맥이 비슷한 것'을 찾고, Sparse Vector(키워드 검색)는 '정확히 그 단어'를 찾는다."**

두 방식은 대체 관계가 아니라 완벽한 **상호보완 관계**입니다. 이 두 검색 방식을 하나의 관계형 데이터베이스인 PostgreSQL 내부에서 결합하는 아키텍처를 다룹니다.

---

## 2. Sparse Vector vs Dense Vector: 표현 방식과 원리적 차이

검색 엔지니어링에서 정보를 벡터로 표현하는 방식은 크게 **Sparse(희소) 벡터**와 **Dense(밀집) 벡터**로 구분됩니다.

| 비교 항목 | Sparse Vector (키워드/어휘 기반) | Dense Vector (임베딩/의미 기반) |
| :--- | :--- | :--- |
| **대표 기술 및 알고리즘** | **BM25**, TF-IDF, PostgreSQL `tsvector`, SPLADE | **pgvector**, OpenAI Embeddings, BERT, BGE |
| **차원 수 (Dimensions)** | 수만 ~ 수십만 차원 (전체 어휘 사전 크기) | 384, 768, 1536 등 고정된 저차원 |
| **값의 밀도** | 대부분의 원소가 `0`이며 매칭 단어만 가중치를 가짐 | 모든 차원이 0이 아닌 연속적인 실수(Float)로 채워짐 |
| **토크나이징 기법** | 형태소 분석기, N-gram, 공백/구두점 토크나이저 | BPE(Byte-Pair Encoding), WordPiece 등 Subword |
| **유사도 측정 기준** | 단어 빈도(TF), 역문서 빈도(IDF), 문서 길이 정규화 | 코사인 유사도(Cosine), 내적(Dot Product), L2 거리 |
| **장점** | 정확한 키워드 매칭, 오탈자/식별자 강건성, 인덱싱 비용 저렴 | 동의어·유의어 이해, 다국어 교차 매칭, 문맥 추론 |
| **단점** | 어휘 불일치(Vocabulary Mismatch) 문제, 의미 이해 불가 | Out-of-Vocabulary 취약, 연산 및 인덱스 메모리 비용 높음 |

### (1) Sparse Vector: 토크나이징과 BM25 스코어링

PostgreSQL의 `tsvector`와 [Elasticsearch의 BM25(Best Matching 25)](https://www.elastic.co/guide/en/elasticsearch/reference/current/index-modules-similarity.html)는 어휘 통계에 기반합니다.

텍스트가 인입되면 **토크나이저(Tokenizer)**가 문장을 토큰으로 분해하고, 불용어(Stopwords) 제거 및 스테밍(Stemming)을 거쳐 정규화된 형태소 사전 공간에 사상합니다.

BM25의 점수 산출 공식은 다음과 같습니다:

$$\text{Score}(D, Q) = \sum_{i=1}^{N} \text{IDF}(q_i) \cdot \frac{f(q_i, D) \cdot (k_1 + 1)}{f(q_i, D) + k_1 \cdot \left(1 - b + b \cdot \frac{|D|}{\text{avgdl}}\right)}$$

- **$\text{IDF}(q_i)$**: 전체 코퍼스에서 흔한 단어는 가중치를 낮추고, 드물게 등장하는 희귀 키워드에 높은 점수를 부여합니다.
- **$f(q_i, D)$**: 단어의 문서 내 출현 빈도(TF)지만, 단순 선형 증가가 아닌 포화 함수(Saturation)를 적용하여 특정 단어 도배로 인한 점수 왜곡을 방지합니다.
- **$|D| / \text{avgdl}$**: 문서 길이에 따른 패널티를 부여하여 불필요하게 긴 문서가 유리해지는 문제를 정규화합니다.

### (2) Dense Vector: 딥러닝 임베딩과 유사도 공간

Dense Vector는 문장을 고정 차원의 연속된 벡터 공간으로 매핑합니다. 트랜스포머 기반 인코더 모델의 숨겨진 상태(Hidden States)를 풀링(Mean/CLS Pooling)하여 문맥적 의미를 압축합니다.

두 벡터 간의 의미적 유사도는 주로 **코사인 유사도(Cosine Similarity)**로 측정됩니다:

$$\cos(\theta) = \frac{\mathbf{A} \cdot \mathbf{B}}{\|\mathbf{A}\| \|\mathbf{B}\|} = \frac{\sum_{i=1}^{n} A_i B_i}{\sqrt{\sum_{i=1}^{n} A_i^2} \sqrt{\sum_{i=1}^{n} B_i^2}}$$

`pgvector`에서는 HNSW(Hierarchical Navigable Small World) 인덱스를 사용하여 초당 수만 건의 벡터에 대해 밀리초 단위로 근사 최근접 이웃(ANN, Approximate Nearest Neighbor)을 탐색합니다.

---

## 3. PostgreSQL 단일 인프라로 구성하는 3-Tier 하이브리드 엔진

일반적으로 하이브리드 검색을 구성하려면 [Elasticsearch 클러스터](https://www.elastic.co/what-is/elasticsearch)와 별도의 벡터 데이터베이스(Milvus, Pinecone 등)를 운영하며 데이터 동기화 파이프라인(CDC)을 관리해야 합니다. 이는 막대한 인프라 복잡도와 네트워크 레이턴시를 유발합니다.

하지만 **PostgreSQL + pgvector** 조합을 활용하면 단일 데이터베이스 트랜잭션 내에서 **Full-Text Search(FTS)**, **N-gram 부분 일치(pg_trgm)**, **벡터 유사도 검색(HNSW)**을 한 번에 실행할 수 있습니다.

### 테이블 스키마 및 인덱스 설계

```sql
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

-- 청크 단위 테이블 설계
create table public.post_chunks (
  id          bigserial primary key,
  post_id     bigint references public.posts(id) on delete cascade,
  content     text not null,
  -- 1. Full-Text Search를 위한 tsvector 컬럼 (단어 위치 보존)
  fts         tsvector generated always as (to_tsvector('simple', content)) stored,
  -- 2. 임베딩 벡터 컬럼 (예: 384차원 bge-small 또는 1536차원 text-embedding-3)
  embedding   extensions.vector(384)
);

-- 인덱스 구성
-- FTS 역색인 인덱스
create index idx_chunks_fts on public.post_chunks using gin (fts);

-- 한국어 조작 및 부분 문자열 검색을 위한 Trigram GIN 인덱스
create index idx_chunks_trgm on public.post_chunks using gin (content extensions.gin_trgm_ops);

-- 고속 ANN 탐색을 위한 HNSW 코사인 인덱스
create index idx_chunks_embedding on public.post_chunks using hnsw (embedding extensions.vector_cosine_ops)
with (m = 16, ef_construction = 64);
```

> **한국어 검색 시 주의점**: PostgreSQL 기본 내장 형태소 분석기에는 한국어 사전이 없습니다. 따라서 `to_tsvector('simple', ...)` 설정으로 토큰을 분리하고, 조사나 어미 변화로 인한 미스매치는 `pg_trgm`(Trigram N-gram) 인덱스로 커버하는 하이브리드 키워드 전략이 가장 효과적입니다.

---

## 4. RRF(Reciprocal Rank Fusion) 알고리즘으로 서로 다른 점수 통합하기

하이브리드 검색 구현 시 가장 흔히 저지르는 실수는 **BM25 점수(0 ~ 무한대)**와 **코사인 유사도(0 ~ 1)**를 가중합(`Score = α * BM25 + β * Cosine`)으로 직접 더하는 것입니다. 점수의 분포와 스케일이 전혀 다르기 때문에 한쪽 점수가 전체 랭킹을 왜곡하는 현상이 발생합니다.

이 문제를 우아하게 해결하는 알고리즘이 바로 **RRF(Reciprocal Rank Fusion)**입니다.

$$\text{RRF Score}(d) = \sum_{m \in M} \frac{1}{k + r_m(d)}$$

- $M$: 참여하는 검색 모델 집합 (예: FTS, Trigram, Vector)
- $r_m(d)$: 해당 검색 모델 $m$에서 문서 $d$가 차지한 **순위(Rank, 1부터 시작)**
- $k$: 스무딩 상수(Smoothing constant, 통상 **60** 또는 **50** 권장). 상위 순위 간 점수 격차가 지나치게 벌어지는 것을 완화합니다.

RRF는 절대적인 점수를 보지 않고 **'순위(Rank)'만 참조**하므로, 별도의 점수 정규화(Min-Max Scaling 등) 없이도 극도로 안정적인 순위 융합 결과를 도출합니다.

### PostgreSQL Stored Function 구현 예시

```sql
create or replace function public.search_knowledge(
  query_text      text,
  query_embedding extensions.vector(384) default null,
  match_count     int default 6,
  rrf_k           int default 50
)
returns table (
  chunk_id    bigint,
  content     text,
  score       double precision
)
language sql stable as $$
  with
  -- 1. FTS 키워드 검색 순위 (Top 30)
  fts_rank as (
    select id, row_number() over (order by ts_rank_cd(fts, plainto_tsquery('simple', query_text)) desc) as rnk
    from public.post_chunks
    where fts @@ plainto_tsquery('simple', query_text)
    limit 30
  ),
  -- 2. Trigram 부분 일치 검색 순위 (Top 30)
  trgm_rank as (
    select id, row_number() over (order by word_similarity(query_text, content) desc) as rnk
    from public.post_chunks
    where content % query_text
    limit 30
  ),
  -- 3. pgvector Dense Vector 유사도 순위 (Top 30)
  vec_rank as (
    select id, row_number() over (order by embedding <=> query_embedding) as rnk
    from public.post_chunks
    where query_embedding is not null and embedding is not null
    limit 30
  ),
  -- 4. RRF 순위 합산
  fused_ranks as (
    select id, sum(1.0 / (rrf_k + rnk)) as combined_score
    from (
      select id, rnk from fts_rank
      union all
      select id, rnk from trgm_rank
      union all
      select id, rnk from vec_rank
    ) all_ranks
    group by id
  )
  select c.id as chunk_id, c.content, f.combined_score as score
  from fused_ranks f
  join public.post_chunks c on c.id = f.id
  order by f.combined_score desc
  limit match_count;
$$;
```

---

## 5. 실무 도입 체크리스트 & 성능 최적화

1. **임베딩 생성 파이프라인의 비동기화**:
   글 저장 시 실시간으로 임베딩 API를 호출하면 쓰기 지연이 발생합니다. Supabase Edge Function이나 백그라운드 워커 큐를 통해 `content` 저장 후 비동기로 `embedding` 컬럼을 채우는 아키텍처를 권장합니다.
2. **HNSW 인덱스의 메모리 사이징**:
   HNSW 인덱스는 메모리(RAM)에 상주할 때 가장 빠른 검색 속도를 보여줍니다. `shared_buffers`와 `work_mem`이 벡터 인덱스 크기를 충분히 수용할 수 있는지 모니터링해야 합니다.
3. **Elasticsearch와의 아키텍처 선택 기준**:
   - 데이터가 **수백만 건 이하**이며 단일 트랜잭션 보장, 관리 비용 절감이 우선인 경우: **PostgreSQL + pgvector**로 충분하며 운영상 압도적으로 유리합니다.
   - 데이터가 **수천만 건 이상**이거나, 형태소 복합 토큰화 및 분산 샤딩이 필수적인 경우: 전용 검색 엔진인 [Elasticsearch](https://www.elastic.co/)나 [OpenSearch](https://opensearch.org/)로 분리 운영하는 것이 적합합니다.

하이브리드 검색은 복잡한 다중 시스템을 도입하지 않고도, 알고리즘과 자료구조의 특성을 정확히 이해하고 조합함으로써 프로덕션 수준의 검색 품질을 완성할 수 있는 강력한 엔지니어링 해법입니다.
$md$
),
(
  'knowledge-graph-from-tags',
  '태그만으로 블로그 지식 그래프 그리기',
  '별도 그래프 DB 없이 글과 태그의 관계만으로 지식 그래프를 만들고, React Flow로 시각화한 과정입니다.',
  '/images/covers/knowledge-graph.jpg',
  'Frontend',
  array['Knowledge Graph', 'React Flow', 'Visualization'],
  '2026-10-08 10:00:00+09',
$md$
## 그래프 DB가 꼭 필요할까

Neo4j로 지식 그래프를 실험해 보면서 느낀 점은, 개인 블로그 규모에서는 **글-태그 관계만으로도 충분히 의미 있는 그래프**가 나온다는 것이었습니다.

## 노드와 엣지 정의

- **노드**: 글(post), 태그(tag)
- **엣지**: 글 → 태그

두 글이 같은 태그를 공유하면 그래프상에서 자연스럽게 가까워집니다. 새 글을 쓰면 그래프도 자동으로 갱신됩니다.

## 레이아웃

간단한 force-directed 레이아웃을 직접 구현했습니다.

1. 모든 노드 쌍 사이에 반발력
2. 연결된 노드 사이에 스프링 인력
3. 중심으로 약한 인력

```ts
for (const e of edges) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1;
  const f = (d - 120) * 0.02;
  a.vx += (dx / d) * f; a.vy += (dy / d) * f;
}
```

## 다음 단계

태그 대신 LLM으로 본문에서 개념(entity)을 추출하면 더 촘촘한 그래프를 만들 수 있습니다.
$md$
),
(
  'building-markdown-blog',
  'Next.js로 마크다운 블로그와 에디터 만들기',
  '글은 마크다운으로 저장하고, 툴바 버튼으로 서식을 넣을 수 있는 에디터와 실시간 미리보기를 만든 과정입니다.',
  '/images/covers/nextjs-blog.jpg',
  'Frontend',
  array['Next.js', 'Markdown', 'Editor'],
  '2026-10-05 10:00:00+09',
$md$
## 왜 마크다운으로 저장하나

HTML로 저장하면 렌더링은 쉽지만 **검색과 RAG 청킹**이 어렵습니다. 마크다운은 제목(`##`) 단위로 자연스럽게 나눌 수 있어 지식 베이스로 쓰기 좋습니다.

## 에디터 구성

- 왼쪽: 마크다운 입력창
- 오른쪽: 실시간 미리보기
- 상단: **굵게**, *기울임*, 제목, 목록, 인용, 코드, 링크, 이미지 버튼

이미지는 Supabase Storage에 업로드하고, 본문에는 `![설명](URL)` 형태로 삽입됩니다.

## 렌더링

`react-markdown` + `remark-gfm`으로 표, 체크리스트까지 지원합니다.

| 기능 | 지원 |
| --- | --- |
| 코드 블록 | ✅ |
| 표 | ✅ |
| 이미지 | ✅ |

- [x] 마크다운 저장
- [x] 이미지 업로드
- [ ] 임베딩 자동 생성
$md$
),
(
  'local-supabase-with-docker',
  'Docker로 로컬 Supabase 띄우고 필요한 것만 남기기',
  'Supabase CLI로 로컬 스택을 띄우되, 블로그에 필요 없는 서비스는 꺼서 가볍게 운영하는 설정을 정리했습니다.',
  '/images/covers/local-supabase.jpg',
  'DevOps',
  array['Supabase', 'Docker', 'Local Dev'],
  '2026-10-02 10:00:00+09',
$md$
## 기본 스택은 무겁다

`supabase start`를 그대로 실행하면 Auth, Realtime, Storage, Edge Runtime, Analytics 등 10개가 넘는 컨테이너가 뜹니다. 개인 블로그에는 대부분 필요 없습니다.

## config.toml에서 끄기

```toml
[realtime]
enabled = false

[edge_runtime]
enabled = false

[analytics]
enabled = false
```

## 프로젝트마다 포트 분리

여러 로컬 프로젝트를 오가면 포트가 겹칩니다. 프로젝트별로 포트 대역을 나눠 두면 편합니다.

- 기존 실험 프로젝트: `5432x`
- 블로그: `5532x`

## 마이그레이션으로 관리

스키마는 `supabase/migrations`에, 초기 데이터는 `seed.sql`에 두면 `supabase db reset` 한 번으로 언제든 깨끗한 DB를 다시 만들 수 있습니다.
$md$
);
