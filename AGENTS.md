# AGENTS.md

## 프로젝트 구성

- 언어 : TypeScript
- 프론트엔드 프레임워크 : Vue 3 (Composition API + Script Setup)
- CSS 라이브러리 : Pico CSS + Tailwind CSS
- 백엔드 BaaS 서비스 : PocketBase
- 데이터 CRUD : Tanstack Query
- 상태관리 : Pinia
- 빌드도구 : Vite
- 패키지 매니저 : pnpm
- 프로젝트 구조 : Monorepo (pnpm)
  ```text
  ├─ apps/                            # 서비스별 애플리케이션 (실제 실행 단위)
  │  └─ todo/                         # todo 서비스
  │     ├─ src/                       # 프론트엔드 소스 (Vue / Vite)
  │     │  ├─ __tests__/              # 프론트엔드 테스트
  │     │  ├─ api/                    # API / 네트워크 레이어
  │     │  │   ├─ pocketbase-types.ts # PocketBase Types
  │     │  ├─ assets/                 # 정적 리소스
  │     │  ├─ components/             # 화면 구성 컴포넌트 (UI 조립)
  │     │  ├─ composables/            # 도메인 단위 로직 (Vue composables)
  │     │  ├─ layouts/                # 공통 레이아웃
  │     │  ├─ pages/                  # 라우트 단위 페이지
  │     │  ├─ stores/                 # 전역 상태 관리
  │     │  ├─ ui/                     # 비컴포넌트 UI 헬퍼
  │     │  └─ (shared)                # 설정·초기화·유틸 성 코드
  │     │
  │     ├─ pb_hooks/                 # PocketBase hooks (Go / JS)
  │
  ├─ packages/                         # 재사용 패키지 영역
  │  └─ ui/                            # UI 템플릿 / 컴포넌트 패키지
  ```

---

## 프로젝트 규칙

### CSS 라이브러리 사용 가이드

- Pico CSS의 Semantic HTML만 활용하여 화면을 구성한다.
- Tailwind CSS는 개발자 직접 사용 영역으로 두며, Agent는 사용하지 않는다.
- 추가적인 CSS 설계나 커스텀 스타일은 최소화한다.

---

### PocketBase 가이드

- 클라이언트의 모든 서버 통신은 PocketBase SDK로만 수행한다.
  - fetch, axios, 임의 REST 호출 금지
  - 특수한 경우에만 별도 합의
- 요청/응답 타입은 임의로 새로 정의하지 않는다.
  - src/api/pocketbase-types.ts를 최우선으로 사용한다.
  - pocketbase-types.ts는 절대 수정하지 않는다.
- 스키마 변경이 필요한 경우 사전 리뷰를 거친다.

---

### TanStack Query 가이드

- 데이터 CRUD는 반드시 TanStack Query로 수행한다.
- Query Key는 일관된 규칙을 따른다.
  - 예: `['todos']`, `['todos', 'list', params]`, `['todos', 'detail', id]`
- Mutation 이후에는 표준 invalidation 규칙으로 캐시를 갱신한다.
  - 기본: 관련 Query Key invalidate
  - 필요 시: setQueryData로 optimistic update (단, 복잡하면 invalidate 우선)

---

#### 기본 CRUD 패턴 (가이드)

- List 조회: useQuery
- Detail 조회: useQuery (id 기반)
- Create / Update / Delete: useMutation
- Query 함수 내부에서만 pb.collection(...).xxx() 호출
- 에러 및 로딩 상태는 Query에서 제공하는 상태를 사용하고, 화면은 이를 소비한다.

---

### Pinia (스토어) 가이드

- Pinia는 전역으로 유지되어야 하는 상태에만 사용한다.
  - 인증 세션 / 유저 정보
  - 전역 UI 상태 (테마, 토스트 큐 등)
  - 앱 전역 설정

---

### Composables 가이드

- composable은 기능 단위가 아닌 도메인 단위로 만든다.
  - ❌ useModal, useToggle
  - ✅ useTodos, useAuth, useUserSettings
- composable 안에서만 TanStack Query를 사용한다.
- composable은 UI에 직접 의존하지 않는다.

---

### Components 가이드

- 과도한 컴포넌트 분리는 지양한다.
- 기본 원칙은 페이지 단위(pages/)에서 UI와 로직을 최대한 소화하는 것이다.
- 컴포넌트 분리는 아래 조건을 만족할 때만 검토한다.
  - 3회 이상 재사용되는 경우
  - 페이지 가독성을 심각하게 해치는 경우

---

### Pages / Routing 가이드

- pages/ 디렉터리는 URL 구조와 1:1로 매핑된다.
- 라우팅은 `unplugin-vue-router`를 통해 자동 생성되며, 수동 라우터 설정을 추가하지 않는다.
- 페이지 구조를 URL 관점에서 먼저 설계하고, 그에 맞춰 pages/를 구성한다.

---

### UI 헬퍼 / UI 전용 타입 가이드 (src/ui)

- src/ui는 화면 표시를 위한 전용 헬퍼 / ViewModel을 둔다.
- 목적은 다음과 같다.
  - PocketBase 응답을 그대로 사용하기 어려운 경우
  - 조합 / 가공 / 표시 포맷을 거쳐 UI에서 쓰기 쉬운 형태로 변환하기 위함

---
