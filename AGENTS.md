<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Blog Writing & Knowledge Graph Rules
- **친근하고 읽기 쉬운 톤앤매너**: 딱딱한 논문체나 수식($$...$$), 복잡한 이론 공식 나열을 피하고, 개발자가 직접 겪은 문제와 경험을 쉽게 풀어 설명하는 개인 기술 블로그 스타일을 유지합니다.
- **용어의 직관적 해설**: BM25, RRF, Dense Vector 등 전문 개념이 등장하면 수식이 아닌 "이 기술이 왜 필요한지", "기존 방식과 어떤 차이가 있는지"를 비유와 직관적인 언어로 먼저 풀어냅니다.
- **심화 이론 분리 및 지식 그래프 연계**: 한 글에 모든 이론적 배경을 빽빽하게 담지 않고, 내용이 길어지거나 독립적인 주제가 될 수 있는 개념(예: BM25, RRF, Dense vs Sparse)은 별도의 독립된 블로그 글로 분리 작성합니다.
- **유기적인 상호 링크**: 분리된 글들은 본문 내에서 자연스럽게 상호 링크(`[개념 설명 글](/blog/slug)`)로 연결하여, 블로그의 태그 기반 지식 그래프(Knowledge Graph)가 유기적인 네트워크로 확장되도록 구성합니다.
