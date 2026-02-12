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

| 제목       | 기능                      |
| :--------- | :------------------------ |
| picocss    | Minimal CSS Framework ⭐  |
| primevue   | UI Component Framework ⭐ |
| shacdn/vue | UI Component Framework    |
| beercss    | CSS Framework ⭐          |
| bootstrap  | CSS Framework             |
| bulma      | CSS Framework             |
| daisyui    | CSS Framework             |
| open-props | CSS Variables             |

**※ 고려사항** </br>

- CSS Framework
  - 자바스크립트 프레임워크랑 강결합 되어있지 않아 지속성 항샹
  - 컴포넌트의 선택지가 `UI Component Framework`보다 적음
  - 자바스크립트 종속성이 없어 단순한 UI 영역만 디자인되어짐
  - UI에 대한 제어권을 가지고 있음
- UI Component Framework :
  - 자바스크립트 프레임워크랑 강결합 되어있어 생산성 향상
  - 컴포넌트에 대해서 더 많은 선택지 존재
  - 컴포넌트 자체로 뛰어난 기능이 결합되어있음

#### Util

| 제목                   | 기능             |
| :--------------------- | :--------------- |
| vueuse                 | Vue 유틸         |
| es-toolkit             | JS 유틸          |
| ag-grid-vue            | 테이블           |
| chart.js + vue-chartjs | 차트             |
| dayjs                  | 날짜 유틸        |
| dhtmlx-gantt           | Gantt 차트       |
| fullcalendar           | 달력             |
| tiptap                 | 텍스트 에디터    |
| tippy.js               | 툴팁             |
| turndown               | HTML To Markdown |
| validator              | 문자열 검증      |

### 2. 추가 검토 라이브러리

#### Util (프론트엔드)

| 제목         | 기능                  |
| :----------- | :-------------------- |
| zod          | 스키마 검증 (옵션1)   |
| typebox      | 스키마 검증 (옵션2)   |
| typia        | 스키마 검증 (옵션3)   |
| vee-validate | 폼 입력 검증 컴포지션 |
| formkit      | 폼 입력 검증 + UI     |
