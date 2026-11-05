# 이수호 (Lee Su-ho) | Resume & Career Portfolio

> OS, 메모리 관리, 네트워크 프로토콜 등 컴퓨터 공학(CS)의 본질적 원리에 단단한 뿌리를 두고 있습니다. 모바일 네이티브 코어 엔진부터 대규모 분산 백엔드, 실시간 미디어 스트리밍 및 보안 통신까지 기술의 기저 원리를 깊이 파고들어 시스템의 병목을 진단하고 최적화해 온 다양한 실무 경험을 가지고 있습니다.

---

## 📌 Contact & Links
- **Email**: [developer@example.com](mailto:developer@example.com)
- **GitHub**: [github.com](https://github.com/)
- **LinkedIn**: [linkedin.com](https://www.linkedin.com/)
- **Blog / Portfolio**: [suho.dev](https://hearing.oliveunion.com/)

---

## 🛠 Core Competencies (주요 프레임워크 & 스택)

| 플랫폼 / 영역 | 핵심 기술 스택 |
| :--- | :--- |
| **Android & Mobile** | **Android Native (Kotlin, Java)**, **Coroutine**, **Flutter**, **CMake / NDK / JNI** |
| **Backend & Server** | **Spring Boot**, **AWS**, **Supabase** |
| **Database & Storage** | **SQL**, **NoSQL**, **Neo4j**, **Redis** |

---

## 🏢 Work Experience

### 1. 올리브유니온 (Olive Union)
> **스마트 보청기 플랫폼 (Series D 약 400억 원 유치)**  
> **Android & Systems Core Engineer** | 2019.07 ~ 2022.08 (3년 2개월, 산업기능요원)

- **스마트 보청기 통신 코어 엔진 구축 (1세대 ~ 3세대)**
  - BLE (GATT) 및 SPP 통신 프로토콜 설계 및 인터페이스 개발
  - C/C++ NDK, CMake, JNI 기반 고속 연산 네이티브 브릿지(Bridge)를 구축하여 모바일 단말의 실시간 연산 성능 극대화
  - SPP/BLE 통신으로 유입되는 대용량 실시간 패킷 데이터 가공, 분석, 무손실 로깅 파이프라인 개발
- **오디오 프로세싱 및 백그라운드 서비스 최적화**
  - WorkManager를 활용한 주기적 백그라운드 소음 레벨 측정 및 맞춤형 적응형 오디오(Adaptive Audio) 엔진 개발
  - 온디바이스 TensorFlow Lite 모델 탑재 및 청력 자가진단(Hearing Test) 알고리즘 적용
- **글로벌 원격 케어 & 어드민 시스템 구축**
  - Vonage WebRTC 기반 실시간 화상 진단 솔루션을 개발하여 [보청기 ↔ 앱 ↔ 서버] 원격 튜닝 시스템 구축
  - 보청기 청각 알고리즘 그래프 시각화 및 사용자 청력 프로파일 실시간 모니터링 웹 어드민 개발
- **웹 서비스 개발 및 메일 인프라 보안 취약점 해결**
  - 웹 기반 3분 청각 자가진단 서비스([hearing.oliveunion.com](https://hearing.oliveunion.com/)) 개발
  - SMTP Mail Relay 서버를 활용한 진단 결과 및 마케팅 메일 자동 발송 파이프라인 구축
  - 기업 도메인의 스팸 차단을 막기 위한 메일 보안 표준(SPF, DKIM, DMARC) 분석 및 취약점 완전 개선

---

### 2. 텐핑거스 (데이트팝)
> **500만+ 다운로드 데이트 & 놀거리 추천 큐레이션 서비스**  
> **Senior Android Engineer** | 2022.08 ~ 2023.05 (10개월)

- **대규모 레거시 개편 및 Clean Architecture 마이그레이션**
  - 기존 Java 및 MVP 패턴의 복잡한 코드베이스를 Kotlin + Clean Architecture (MVVM)로 전면 마이그레이션
  - 지역 탐색부터 맞춤형 추천까지 유저 동선을 단축한 메인 홈 UI/UX 전면 개편
  - 월 정기 구독 서비스 (추천 장소 무료 이용권 3회 제공 BM) 개발
- **이미지 렌더링 최적화 및 서버 트래픽 30% 절감**
  - 서버 사이드 이미지 동적 리사이징 및 Glide 2-Tier(Memory/Disk) 캐시 정책(LRU/LFU 및 Version Signature) 도입
  - 대규모 목록 스크롤 프레임 드랍(Jank) 현상 해결 및 **서버 트래픽 30% 이상 절감** 달성
- **데이터 드리븐 유저 경험 분석**
  - Google Analytics 커스텀 이벤트 및 Dimensions/Metrics를 설계하여 사용자별 전환 퍼널, 리텐션, 화면 이동 경로 시각화

---

### 3. 트랜스박스 (TransBox)
> **엔터프라이즈 B2B 보안 솔루션 & 데이터 보안(DLP)**  
> **Security Android App Engineer** | 2018.11 ~ 2019.06 (8개월)

- **E2E 암호화 기반 보안 메신저 및 문서 보안 솔루션 개발**
  - Windows/Mac/Android/iOS 연동 B2B 보안 클라이언트 구축
  - 기업 문서(PDF, Excel, HWP, Word) 실시간 암호화 및 원격 영구 파기(복구 불가) 엔진 구현
- **보안 알고리즘 및 키 교환 파이프라인 구축**
  - 국가 표준 블록 암호화(ARIA), 비대칭키, 해시 무결성 검증 체계를 적용한 실시간 양방향 채팅 앱 개발
- **미디어 버퍼 레벨 실시간 암·복호화 렌더링**
  - Pdfium 및 VLC 라이브러리를 연동하여 디스크에 원본을 저장하지 않고 메모리 버퍼 단에서 실시간 복호화 렌더링을 수행하여 화면 캡처 및 데이터 탈취 방지

---

### 4. 시큐브 (Secuve)
> **서버 보안 솔루션 전문 기업**  
> **QA & Test Automation Engineer** | 2017.09 ~ 2018.04 (8개월)

- **서버 보안 솔루션 웹 콘솔 E2E 자동화 테스트 프레임워크 구축**
  - 인바운드/아웃바운드 방화벽 제어 및 계정 관리(IAM) 웹 콘솔 테스트 자동화 파이프라인 구축
  - JSP + Selenium WebDriver 기반 UI 컴포넌트 및 사용자 시나리오 자동 검증 스크립트 구축
  - 오류 발생 시 자동 스크린샷 캡처 및 단계별 로그 수집 시스템 개발
- **크로스 플랫폼 배포 무결성 검증**
  - 다양한 Linux 배포판 및 Windows Server 환경에서 Tomcat 패키징 배포 및 동작 무결성 테스트 주도

---

## 🚀 Freelance & Enterprise Projects

### 1. 지아이티 (GIT) — 현대자동차그룹 자회사 (2026.01 ~ 2026.06 / 상주)
- **차량 전장 진단기(태블릿) 애플리케이션 개발 (현대/기아 및 글로벌 차종)**
  - 차량 제어기(ECU/CAN) 센서 데이터(냉각수, 엔진 상태, 오류 코드) 실시간 고속 수신 및 파싱
  - 고빈도 센서 데이터를 실시간 차트 및 상태 그래프로 지연 없이 시각화하는 모니터링 엔진 구축
  - *Tech: Android Native, Kotlin, CAN/ECU Sensor Data, Chart Visualization*

### 2. 먹깨비 (2025.03 ~ 2025.10 / 상주)
- **100만 사용자 공공 배달 플랫폼 (유저용 / 사장님용 앱) 고도화**
  - 전사 레거시 Java 코드의 Kotlin 마이그레이션 및 렌더링 병목 해결
  - 토스페이, 지역사랑상품권 간편결제 및 모바일 상품권 선물하기 기능 개발
  - 가맹점주(사장님) 앱을 Native 단일 구조에서 Native + WebView 하이브리드 아키텍처로 피벗 개발
  - Unity 미니게임 임베딩 및 Google AdMob 광고/리워드 서드파티 SDK 연동
  - *Tech: Kotlin, Android Native, Hybrid WebView, TossPay, Unity SDK, AdMob*

### 3. NH농협 IT센터 (2024.09 ~ 2025.01 / 상주)
- **농협 빅데이터 관리 플랫폼 통합 IAM(Identity and Access Management) 구축**
  - 임직원 계정 등록, 조직 체계 연동 및 URL/데이터셋 단위 세부 접근 제어(RBAC) 모듈 개발
  - 금융권 보안 규정에 맞춘 권한 감사 로깅 및 무결성 트랜잭션 설계
  - *Tech: Spring, JSP, OracleDB, Enterprise IAM, Security*

### 4. (주) 당장줘 (2023.12 ~ 2024.05 / 외주)
- **의류 구매 중개 플랫폼 스타트업 MVP 풀스택 개발**
  - 구매자-판매자 중개 거래 프로세스 및 반응형 웹 서비스 개발
  - *Tech: Spring Boot, React, PostgreSQL, REST API*

### 5. 올웨이즈 (Alwayz) (2023.10 ~ 2023.12 / 외주)
- **1,000만 실사용자 플랫폼 '만보기' 리워드 코어 모듈 개발**
  - React Native ↔ Android Native 간 양방향 통신 인터페이스 브릿지 설계
  - 배터리 소모 최소화 및 걸음 수 유실 방지를 위한 백그라운드 서비스 데몬화
  - WorkManager 기반 로컬 캐싱 및 서버 무손실 동기화 엔진 개발
  - *Tech: Android Native, React Native Bridge, WorkManager, Daemon Optimization*

### 6. 화하다 (2023.06 ~ 2023.09 / 외주)
- **꽃 큐레이션 스타트업 MVP 백엔드 아키텍처 전담 구축**
  - Spring Security 기반 JWT 인증 및 소셜 로그인(Apple, Google, Naver, Kakao OAuth2) 통합 구현
  - AWS API Gateway (WebSocket) + DynamoDB를 결합한 서버리스 실시간 1:1 채팅 엔진 구축
  - AWS MediaConvert + CloudFront CDN을 활용한 영상 자동 HLS 트랜스코딩 및 스트리밍 최적화
  - *Tech: Spring Boot, AWS WebSocket, DynamoDB, MediaConvert, HLS Streaming, S3*
