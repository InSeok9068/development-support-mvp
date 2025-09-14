# 사이드 프로젝트

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

---

## 프로젝트 컨벤션

### Vue SFC 선언 구분자

```js
// 순서
/* ======================= 변수 ======================= */
/* ======================= 감시자 ======================= */
/* ======================= 생명주기 훅 ======================= */
/* ======================= 메서드 ======================= */
```

---

## 라이브러리 옵션

### 1. 프론트엔드

#### UI

| 제목         | 기능                      |
| :----------- | :------------------------ |
| picocss      | Minimal CSS Framework ⭐  |
| primevue     | UI Component Framework ⭐ |
| shacdn/vue   | UI Component Framework    |
| element-plus | UI Component Framework    |
| bootstrap    | CSS Framework             |
| bulma        | CSS Framework             |
| daisyui      | CSS Framework             |
| open-props   | CSS Variables             |

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
| ag-grid-vue            | 테이블           |
| chart.js + vue-chartjs | 차트             |
| dayjs                  | 날짜 유틸        |
| dhtmlx-gantt           | Gantt 차트       |
| fullcalendar           | 달력             |
| tiptap                 | 텍스트 에디터    |
| tippy.js               | 툴팁             |
| turndown               | HTML To Markdown |
| validator              | 문자열 검증      |

### 2. 백엔드

#### CLI

| 제목        | 기능              |
| :---------- | :---------------- |
| cobra       | CLI Framework     |
| survey      | 대화형 인터페이스 |
| clipboard   | 클립보드          |
| spinner     | 스피너            |
| bubbletea   | TUI Framework     |
| bubbles     | TUI Framework (+) |
| glamour     | 마크다운 렌더링   |
| lipgloss    | 문자열 렌더링     |
| color       | 문자열 색상       |
| termui      | TUI 렌더링        |
| tablewriter | 테이블            |
| progressbar | 프로그레스바      |

#### Util

| 제목          | 기능            |
| :------------ | :-------------- |
| viper         | 설정 관리       |
| chromedp      | Chrome Testing  |
| playwright-go | Browser Testing |
| colly         | Scraping        |

### 3. 추가 검토 라이브러리

#### Util (프론트엔드)

| 제목               | 기능                   |
| :----------------- | :--------------------- |
| tanstack/vue-query | 서버 상태관리 (+ 캐싱) |
| zod                | 스키마 검증 (옵션1)    |
| typebox            | 스키마 검증 (옵션2)    |
| typia              | 스키마 검증 (옵션3)    |
| vee-validate       | 폼 입력 검증 컴포지션  |
| formkit            | 폼 입력 검증 + UI      |

---

### 4. 다운로드

[백엔드] Pocketbase : https://pocketbase.io/docs/
[웹서버] https://nginx.org/en/download.html
[윈도우 포켓베이스 훅 김사자] https://github.com/l3est/pocketbase-watcher
[윈도우 서비스 실행도구] Servy : https://github.com/aelassas/servy
[윈도우 서비스 실행도구(대체)] NSSM : https://nssm.cc/
