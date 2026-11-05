# 🚀 AI 지식 그래프 & 하이브리드 RAG 포트폴리오 웹

소프트웨어 개발자를 위한 **인터랙티브 커리어 쇼케이스**, **마크다운 & 툴바 블로그 작성기**, **React Flow 기반 지식 그래프(Knowledge Graph)**, 그리고 **Supabase pgvector 하이브리드 검색 기반 AI 어시스턴트**를 탑재한 모던 웹 애플리케이션입니다.

---

## 🌟 주요 기능

1. **커리어 & 프로젝트 쇼케이스 (`/`)**
   - 최신 Bento Grid 레이아웃 & Framer Motion 마이크로 트랜지션
   - 경력 타임라인 (상세 성과 및 기술 스택 뱃지)
   - 프로젝트 쇼케이스 (GitHub 저장소 연동 및 라이브 데모)

2. **지식 아카이브 블로그 (`/blog`, `/blog/[slug]`)**
   - 카테고리 필터링 (AI & Database, Frontend, UI & Design 등) 및 실시간 검색
   - 정밀한 마크다운 및 코드 블록 구문 강조 렌더링
   - 글 본문에서 원클릭으로 해당 글 내용을 AI에게 질의할 수 있는 인용 버튼 연동

3. **스마트 블로그 에디터 (`/editor`)**
   - **Tiptap 기반 WYSIWYG & 마크다운 하이브리드 에디터**
   - 마크다운 문법(`#`, `**`, `-`) 자동 변환 + 상단 서식 툴바 버튼(볼드, 이탤릭, 헤딩 1/2/3, 불릿, 인용구 등) 원클릭 스타일 입력
   - 실시간 미리보기 모드 지원
   - 작성 완료 시 로컬 상태 및 Supabase DB 저장/임베딩 즉시 반영

4. **인터랙티브 지식 그래프 시각화 (`/knowledge-graph`)**
   - `@xyflow/react` 기반 캔버스 네트워크 뷰어
   - 개념 및 포스트 간의 연관 관계 시각화 (AI, DB, 프론트엔드, 아키텍처 테마 컬러)
   - 노드 클릭 시 상세 드로어 및 "AI에게 이 개념 질문하기" 연동

5. **AI 지식 어시스턴트 챗봇 (플로팅 위젯)**
   - Supabase pgvector 임베딩 유사도 검색 + 키워드 전문 검색(Hybrid Search)
   - 질의 시 관련된 블로그 글 및 지식 그래프 노드를 인용 카드 형태로 함께 표시
   - 추천 퀵 프롬프트 칩 제공

---

## 🛠️ 기술 스택

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling & Animation**: Tailwind CSS v4, Framer Motion, Lucide Icons
- **Editor**: Tiptap (`@tiptap/react`, `@tiptap/starter-kit`)
- **Knowledge Graph**: `@xyflow/react` (React Flow)
- **Database & RAG**: Supabase (`@supabase/supabase-js`, `pgvector`, Full-Text Search)

---

## ⚙️ 실행 및 Supabase 설정 방법

### 1. 개발 서버 실행
```bash
npm run dev
```
브라우저에서 `http://localhost:3000` 접속

### 2. Supabase 연동 (선택 사항)
본 프로젝트는 Supabase 연동 전에도 **로컬 시드 데이터 및 하이브리드 검색 엔진**을 통해 모든 기능(챗봇, 지식 그래프, 에디터 로컬 저장)이 즉시 작동합니다.

실제 Supabase DB와 연동하려면 `.env.local` 파일을 생성하고 키를 입력하세요:

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```
기존 `supabase_rag_lab/setup_pgvector_rag.sql`의 테이블 및 `match_hybrid_documents` 함수를 Supabase SQL Editor에서 실행하시면 pgvector 실시간 임베딩 파이프라인과 완벽히 동기화됩니다.
