# 사이드 프로젝트

> [!WARNING]
> Agent 작업 기준 문서는 `AGENTS.md`입니다.
> `README.md` 내용은 Agent의 구현/검토 기준으로 사용하지 않습니다.

## 프로젝트 구성

- 언어 : TypeScript
- 프론트엔드 프레임워크 : Vue 3 (Composition API + Script Setup)
- CSS 라이브러리 : Shoelace(Web Component) + Tailwind CSS (Layout Utility) + Shoelace icon (Bootstrap Icons)
- 백엔드 BaaS 서비스 : PocketBase
- 데이터 CRUD : Tanstack Query
- 상태관리 : Pinia
- 빌드도구 : Vite
- 패키지 매니저 : pnpm
- 프로젝트 구조 : Monorepo (pnpm)
  ```text
  ├─ apps/                            # 서비스별 애플리케이션 (실제 실행 단위)
  │  ├─ todo/                         # todo 서비스
  │  │   ├─ src/                       # 프론트엔드 소스 (Vue / Vite)
  │  │   │  ├─ __tests__/              # 프론트엔드 테스트
  │  │   │  ├─ api/                    # API / 네트워크 레이어
  │  │   │  │   ├─ pocketbase-types.ts # PocketBase Types
  │  │   │  ├─ assets/                 # 정적 리소스
  │  │   │  ├─ components/             # 화면 구성 컴포넌트 (UI 조립)
  │  │   │  │   ├─ app                 # 전역 컴포넌트
  │  │   │  ├─ composables/            # 도메인 단위 로직 (Vue Composables)
  │  │   │  ├─ layouts/                # 공통 레이아웃
  │  │   │  ├─ pages/                  # 라우트 단위 페이지
  │  │   │  ├─ stores/                 # 전역 상태 관리
  │  │   │  ├─ ui/                     # 비컴포넌트 UI 헬퍼
  │  │   │
  │  │   ├─ pb_hooks/                  # PocketBase hooks (Go / JS)
  │  └─ portfolio/                     # portfolio 서비스
  │      ├─ ....
  ├─ packages/                        # 재사용 패키지 영역
  │  ├─ src
  │  │  └─ ui/                        # 공용 UI
  │  │  └─ auth/                      # 공용 인증
  ```

### MVP 서비스 목록

- todo : 할일 관리 도구
- portfolio : 자산 포트 폴리오
- kjca : 국제 커리어
- stylemate : 스타일 메이트

## npm global packages

```shell
npm i -g @google/gemini-cli @openai/codex firebase-tools gemini-commit-assistant pnpm tsx
```

---

## 로컬 실행 (pb_hooks 리로드)

```powershell
$env:GEMINI_API_KEY="ENCRYPTION_KEY"
.\pbw.exe .\pocketbase.exe serve --dev
```

---

## 배포

### 1. 프론트엔드

- Firebase
- Pocketbase (pb_public)

#### Firebase Hosting

```shell
firebase deploy
```

### 2. 백엔드

- 클라우드 호스팅

#### PocketHost

**SMTP**

```json
[
  {
    "name": "my-portfolio / pb_public",
    "host": "ftp.pockethost.io",
    "protocol": "ftp",
    "port": 21,
    "username": "*****************",
    "password": "*****************",
    "context": "apps/portfolio/dist",
    "remotePath": "my-portfolio/pb_public",
    "connectTimeout": 100000
  },
  {
    "name": "my-portfolio / pb_hooks",
    "host": "ftp.pockethost.io",
    "protocol": "ftp",
    "port": 21,
    "username": "*****************",
    "password": "*****************",
    "context": "apps/portfolio/pb_hooks",
    "remotePath": "my-portfolio/pb_hooks",
    "connectTimeout": 100000
  }
]
```

---

## 라이브러리 옵션

### 1. 프론트엔드

#### UI

| 제목                            | 기능                   |
| :------------------------------ | :--------------------- |
| shoelace                        | UI Component (기본 UI) |
| tailwind css                    | Layout Utility         |
| shoelace icon (bootstrap icons) | 아이콘                 |

#### Util

| 제목                   | 기능             |
| :--------------------- | :--------------- |
| @formkit/auto-animate  | 자동 애니메이션  |
| vueuse                 | Vue 유틸         |
| es-toolkit             | JS 유틸          |
| ag-grid-vue3           | 테이블           |
| chart.js + vue-chartjs | 차트             |
| dayjs                  | 날짜 유틸        |
| dhtmlx-gantt           | Gantt 차트       |
| fullcalendar           | 달력             |
| tiptap                 | 텍스트 에디터    |
| tippy.js               | 툴팁             |
| turndown               | HTML To Markdown |
| vue-draggable-plus     | 드래그 앤 드롭   |
| validator              | 문자열 검증      |

### 2. 추가 검토 라이브러리

#### Util (프론트엔드)

| 제목         | 기능                  |
| :----------- | :-------------------- |
| vee-validate | 폼 입력 검증 컴포지션 |

---

## PWA 푸시 옵션

- PWA 푸시 알림은 `OneSignal` 또는 `Firebase Cloud Messaging(FCM)`을 활용한다.

---

## 앱/데스크톱 배포 선택지

- 웹앱을 모바일 앱으로 배포하고 싶다면 `Capacitor` 도입을 우선 검토한다.
- 웹앱을 데스크톱 도구로 배포하고 싶다면 `Electron` 도입을 우선 검토한다.
