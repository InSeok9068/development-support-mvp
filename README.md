# 사이드 프로젝트

> [!WARNING]
> Agent 작업 기준 문서는 `AGENTS.md`입니다.
> `README.md` 내용은 Agent의 구현/검토 기준으로 사용하지 않습니다.

## 기술 스펙

### 1. 프론트엔드

- Typescript
- Vue
- Vite
- Tailwind CSS

#### Vue Ecosystem

- Pinia (+ pinia-plugin-persistedstate)
- Vue router (+ unplugin-vue-router)
- VueUse

### 2. 백엔드

- Pocketbase (BaaS)

---

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
