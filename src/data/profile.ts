import type { CareerExperience, Project } from "@/types";

export const profile = {
  blogName: "suho.dev",
  name: "이수호",
  role: "Software Engineer",
  bio: "OS, 메모리 관리, 네트워크 프로토콜 등 컴퓨터 공학(CS)의 본질적 원리에 단단한 뿌리를 두고 있습니다. 모바일 네이티브 코어 엔진부터 대규모 분산 백엔드, 실시간 미디어 스트리밍 및 보안 통신까지 기술의 기저 원리를 깊이 파고들어 시스템의 병목을 진단하고 최적화해 온 다양한 실무 경험을 가지고 있습니다.",
  email: "developer@example.com",
  github: "https://github.com/",
  linkedin: "https://www.linkedin.com/",
  skills: [
    {
      category: "Android & Mobile",
      items: [
        "Android Native (Kotlin, Java)",
        "Coroutine",
        "Flutter",
        "CMake / NDK / JNI",
      ],
    },
    {
      category: "Backend & Server",
      items: ["Spring Boot", "AWS", "Supabase"],
    },
    {
      category: "Database & Storage",
      items: ["SQL", "NoSQL", "Neo4j", "Redis"],
    },
  ],
};

export const careers: CareerExperience[] = [
  {
    company: "지아이티 (GIT) — 현대자동차그룹 자회사",
    role: "전장 진단기 안드로이드 소프트웨어 엔지니어 (상주)",
    period: "2026.01 — 2026.06",
    description: [
      "현대/기아 및 글로벌 완성차 전용 차세대 자동차 진단기(태블릿) 애플리케이션 개발 및 고도화",
      "차종 및 연식별 냉각수, 엔진 상태 등 차량 제어기(ECU/CAN) 센서 데이터 실시간 고속 수신 및 파싱 파이프라인 개발",
      "고빈도 센서 데이터를 지연 없이 실시간 차트 및 상태 그래프로 렌더링하는 시각화 모니터링 엔진 구축",
    ],
    skills: ["Android Native", "Kotlin", "CAN/ECU Sensor Data", "Realtime Chart", "Logging Pipeline"],
  },
  {
    company: "먹깨비 (공공 배달 플랫폼)",
    role: "안드로이드 리드 엔지니어 (상주)",
    period: "2025.03 — 2025.10",
    description: [
      "100만 실사용자 기반 공공 배달앱(유저용 및 사장님용) 핵심 기능 개발 및 전면 안정화",
      "대규모 레거시 Java 코드베이스 분석 및 Kotlin + 최신 모던 아키텍처로의 전환 주도",
      "앱 버벅임 및 렌더링 병목 현상 프로파일링 해결 및 보안 취약점 패치",
      "간편결제 시스템(토스페이, 지역사랑상품권) 및 모바일 상품권 선물하기 신규 기능 출시",
      "Unity 기반 인앱 플레이 게임 및 Google AdMob 광고/리워드 서드파티 SDK 연동",
      "가맹점주(사장님) 앱을 Native 구조에서 Native + WebView 하이브리드 아키텍처로 성공적 피벗",
    ],
    skills: ["Kotlin", "Android Native", "Hybrid WebView", "Payment (Toss)", "Unity SDK", "AdMob"],
  },
  {
    company: "NH농협 IT센터",
    role: "백엔드 & IAM 엔지니어 (상주)",
    period: "2024.09 — 2025.01",
    description: [
      "농협 엔터프라이즈 빅데이터 관리 플랫폼 통합 IAM(Identity & Access Management) 시스템 구축",
      "전사 임직원 권한 체계 등록 및 웹 페이지/데이터셋 단위 세분화된 접근 제어(RBAC) 모듈 개발",
      "금융권 엄격한 보안 규정을 준수하는 권한 감사 로깅 및 고신뢰성 트랜잭션 로직 설계",
    ],
    skills: ["Spring", "JSP", "OracleDB", "Enterprise IAM", "RBAC", "Financial Security"],
  },
  {
    company: "(주) 당장줘",
    role: "풀스택 엔지니어 (외주)",
    period: "2023.12 — 2024.05",
    description: [
      "의류 구매 중개 플랫폼 스타트업 MVP 서비스 초기 아키텍처 설계 및 풀스택 개발",
      "판매자-구매자 간 직관적인 중개 거래 프로세스 및 반응형 웹 인터페이스 구축",
    ],
    skills: ["Spring Boot", "React", "PostgreSQL", "REST API Architecture"],
  },
  {
    company: "올웨이즈 (Alwayz)",
    role: "모바일 코어 모듈 엔지니어 (외주)",
    period: "2023.10 — 2023.12",
    description: [
      "1,000만 실사용자 모바일 커머스 플랫폼 내 핵심 리워드인 '만보기' 독립 라이브러리 모듈 개발",
      "React Native ↔ Android Native 간 비동기 양방향 통신 인터페이스 브릿지 설계",
      "OS 배터리 절전(Doze 모드 등) 대응 및 걸음 수 유실 방지를 위한 백그라운드 서비스 데몬화",
      "WorkManager 기반 오프라인 로깅 캐시 및 서버 무손실 동기화 엔진 개발",
    ],
    skills: ["Android Native", "React Native Bridge", "WorkManager", "Daemon Optimization", "Sensor Engine"],
  },
  {
    company: "화하다 (Flower Curation)",
    role: "백엔드 리드 엔지니어 (외주)",
    period: "2023.06 — 2023.09",
    description: [
      "꽃 큐레이션 스타트업 MVP 백엔드 아키텍처 전담 설계 및 구축 (Spring Boot)",
      "Spring Security 기반 JWT 인증 및 소셜 로그인(Apple, Google, Naver, Kakao OAuth2) 통합 구현",
      "AWS API Gateway (WebSocket) + DynamoDB를 결합한 서버리스 실시간 1:1 채팅 엔진 구축",
      "AWS MediaConvert + S3 + CloudFront CDN을 연계한 비디오 자동 HLS 트랜스코딩 및 스트리밍 최적화 (목록 재생 버벅임 해소)",
    ],
    skills: ["Spring Boot", "AWS WebSocket", "DynamoDB", "AWS MediaConvert", "HLS Streaming", "CloudFront"],
  },
  {
    company: "텐핑거스 (데이트팝)",
    role: "시니어 안드로이드 앱 엔지니어",
    period: "2022.08 — 2023.05",
    description: [
      "500만+ 다운로드 데이트 & 놀거리 추천 큐레이션 서비스 메인 홈 및 지역별 추천 인터페이스 전면 개편",
      "신규 BM인 월간 정기 구독 서비스(추천 장소 무료 이용권 3회 제공) 개발",
      "레거시 MVP 패턴을 Kotlin + Clean Architecture (MVVM)로 전면 리팩토링하여 모듈 결합도 분리",
      "Glide 메모리/디스크 2-Tier 캐시 전략(LRU/LFU 및 Version Signature)과 서버 이미지 동적 리사이징으로 서버 트래픽 30% 이상 절감 달성",
      "Google Analytics 커스텀 이벤트 및 Dimensions/Metrics를 설계하여 전환 퍼널, 리텐션, 사용자 세션 이동 분석 체계 구축",
    ],
    skills: ["Kotlin", "Clean Architecture", "MVVM", "Glide LRU/LFU Cache", "Google Analytics", "Traffic Optimization"],
  },
  {
    company: "올리브유니온 (Olive Union)",
    role: "안드로이드 코어 & IoT 소프트웨어 엔지니어 (초기 멤버)",
    period: "2019.07 — 2022.08",
    description: [
      "스마트 보청기 앱 서비스 초기 멤버 (1세대 ~ 3세대 개발 및 시리즈 D 400억 투자 유치 기여)",
      "보청기 ↔ 스마트폰 간 BLE (GATT) 및 SPP 통신 프로토콜 설계, C/C++ NDK, CMake, JNI 기반 고속 연산 네이티브 브릿지 개발",
      "WorkManager 기반 실시간 백그라운드 소음 레벨 측정 및 맞춤형 적응형 오디오(Adaptive Audio) 엔진 개발",
      "온디바이스 TensorFlow Lite 모델 탑재 및 실시간 청력 자가진단(Hearing Test) 알고리즘 적용",
      "Vonage WebRTC 실시간 영상 통화 기반 원격 보청기 진단 시스템 및 알고리즘 그래프 시각화 웹 어드민 개발",
      "웹 기반 3분 자가 청력 진단 플랫폼 개발 및 대량 메일 발송 인프라 보안 강화 (SPF, DKIM, DMARC 완전 해결)",
    ],
    skills: ["Android Native", "C/C++ NDK/JNI", "BLE/GATT", "WebRTC (Vonage)", "WorkManager", "TensorFlow Lite", "SPF/DKIM"],
  },
  {
    company: "트랜스박스 (TransBox)",
    role: "안드로이드 보안 솔루션 엔지니어",
    period: "2018.11 — 2019.06",
    description: [
      "멀티 플랫폼(Windows/Mac/Android/iOS) 연동 엔터프라이즈 B2B 보안 클라이언트 개발",
      "기업 문서(PDF, Excel, HWP, Word) 실시간 암호화 및 원격 영구 파기(복구 불가) 엔진 구현",
      "국가 표준 블록 암호화(ARIA), 비대칭키, 해시 무결성 검증 체계를 적용한 실시간 양방향 보안 채팅 앱 개발",
      "Pdfium 및 VLC 라이브러리 코어 버퍼 단에서 미디어 데이터를 실시간 복호화 렌더링하여 디스크 저장 없이 화면 캡처 방지",
    ],
    skills: ["Android Native", "Cryptography (ARIA)", "Buffer Decryption", "Pdfium", "VLC", "E2E Encryption"],
  },
  {
    company: "시큐브 (Secuve)",
    role: "QA 자동화 & 웹 엔지니어",
    period: "2017.09 — 2018.04",
    description: [
      "사내 서버 보안 솔루션 웹 콘솔(방화벽 인바운드/아웃바운드 제어 및 계정 IAM 관리) E2E 테스트 자동화 파이프라인 구축",
      "JSP + Selenium WebDriver 기반 전 기능 버튼/입력폼 UI 자동화 테스트 프레임워크 자체 구축",
      "테스트 실패 시 화면 자동 캡처 및 단계별 로깅 시스템을 개발하여 결함 분석 비용 대폭 절감",
      "다양한 Linux 배포판 및 Windows Server 환경에서 Tomcat 패키징 배포 및 동작 무결성 검증 리드",
    ],
    skills: ["Selenium WebDriver", "JSP", "Tomcat", "Linux/Windows Server", "E2E Test Automation", "IAM Web Console"],
  },
];

export const projects: Project[] = [
  {
    title: "1,000만 사용자 이커머스 백그라운드 만보기 모듈 (올웨이즈)",
    description: "Doze 모드 등 안드로이드 OS 절전 정책을 우회하며 배터리 소모를 최소화한 정밀 센서 데몬 서비스. React Native ↔ Native 브릿지와 WorkManager 무손실 서버 동기화 구현.",
    technologies: ["Android Native", "React Native Bridge", "WorkManager", "Sensor Daemon"],
    year: "2023",
  },
  {
    title: "AWS WebSocket 실시간 채팅 & HLS 비디오 스트리밍 (화하다)",
    description: "Spring Boot + AWS API Gateway (WebSocket) + DynamoDB 기반 서버리스 실시간 채팅 및 AWS MediaConvert 자동 트랜스코딩 기반 HLS(m3u8) 모바일 최적화 스트리밍.",
    technologies: ["Spring Boot", "AWS WebSocket", "DynamoDB", "AWS MediaConvert", "HLS", "CloudFront"],
    year: "2023",
  },
  {
    title: "스마트 보청기 BLE IoT & WebRTC 원격 청각 솔루션 (올리브유니온)",
    description: "C/C++ NDK/JNI 기반 고속 연산 네이티브 브릿지, BLE/GATT 커스텀 프로토콜, Vonage WebRTC 기반 실시간 영상 통화 원격 청각 진단 플랫폼.",
    technologies: ["Android NDK/JNI", "BLE/GATT", "WebRTC", "WorkManager", "TensorFlow Lite"],
    demoUrl: "https://hearing.oliveunion.com/",
    year: "2022",
  },
  {
    title: "Supabase Hybrid RAG 지식 검색 & AI 챗봇 엔진",
    description: "pgvector 임베딩 유사도 검색과 Full-Text BM25 및 Trigram을 RRF(Reciprocal Rank Fusion) 알고리즘으로 결합한 블로그 지식 검색 시스템.",
    technologies: ["Next.js 16", "Supabase", "pgvector", "PostgreSQL", "TypeScript"],
    githubUrl: "https://github.com/",
    year: "2026",
  },
  {
    title: "Interactive Knowledge Graph Blog System",
    description: "마크다운 에디터, 태그 기반 실시간 인터랙티브 지식 그래프, AI 지식 도우미 챗봇이 통합된 엔지니어링 블로그 플랫폼.",
    technologies: ["Next.js 16", "React Flow", "Tailwind CSS", "Supabase"],
    githubUrl: "https://github.com/",
    year: "2026",
  },
];
