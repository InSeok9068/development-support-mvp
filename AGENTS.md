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
  │     │  ├─ api/pocketbase-types.ts # PocketBase Types
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
- Tailwind CSS는 개발자 직접 사용할 것이므로, Agent는 Tailwind CSS를 사용하지 않는다.

### PocketBase 가이드

- 클라이언트의 모든 서버 통신은 PocketBase SDK로만 수행한다.
  - fetch, axios, 임의 REST 호출 금지 (특수한 이유가 있으면 별도 합의 필요)
- 요청/응답 타입은 임의로 새로 정의하지 않는다.
  - src/api/pocketbase-types.ts를 최우선으로 사용한다.
  - pocketbase-types.ts는 절대 수정하지 않는다.
- 스키마 변경이 필요하면 리뷰를 거쳐야한다.

### TanStack Query 가이드

- 데이터 CRUD는 반드시 TanStack Query로 수행한다.
- Query Key는 일관된 규칙을 따른다.
  - 예: `['todos']`, `['todos', 'list', params]`, `['todos', 'detail', id]`
- Mutation 후에는 표준 invalidation 규칙으로 캐시를 갱신한다.
  - 기본: 관련 Query Key invalidate
  - 필요 시: setQueryData 로 optimistic update (단, 복잡하면 invalidate 우선)

#### 기본 CRUD 패턴 (가이드)

- List 조회: useQuery
- Detail 조회: useQuery (id 기반)
- Create/Update/Delete: useMutation
- Query 함수 내부에서만 pb.collection(...).xxx() 호출
- 에러 처리/로딩 상태는 Query에서 제공하는 상태를 사용하고, 화면은 이를 소비한다.

### Pinia 가이드

- Pinia는 "전역으로 유지되어야 하는 상태" 에만 사용한다.
  - 예: 인증 세션/유저 정보, 전역 UI 상태(테마/토스트 큐 등), 앱 전역 설정

### Components 가이드

- 과도한 컴포넌트 분리는 지양한다.
- 기본 원칙은 페이지 단위(pages/)에서 UI와 로직을 최대한 소화하는 것이다.

---
