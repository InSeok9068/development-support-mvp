# AGENTS.md

> 본 프로젝트는 MVP(Minimum Viable Product) 개발을 목표로 한다.
> 완성도 높은 구조나 확장성을 우선하지 않으며, 빠른 구현·빠른 검증·명확한 구조를 최우선 가치로 둔다.

본 프로젝트에서의 기본 전제는 다음과 같다.

- MVP 단계에서는 과도한 추상화, 범용화, 재사용성 설계를 지양한다.
- '아름다운 구조'보다 이해하기 쉬운 구조와 즉시 수정 가능한 코드를 우선한다.
- 새로운 패턴 도입보다 이미 합의된 도구와 규칙을 일관되게 사용하는 것이 더 중요하다.
- 기술적 완성도는 실제 사용성과 검증 이후에 점진적으로 개선한다.

따라서 이 문서는 '최선의 아키텍처'를 정의하기보다는,
AI와 사람이 함께 작업하더라도 프로젝트가 흔들리지 않도록 하는 최소한의 안전장치를 제공하는 것을 목표로 한다.

Agent는 아래 규칙을 창의적으로 해석하거나 확장하지 않으며, 명시된 범위 안에서만 작업을 수행한다.

## 프로젝트 구성

- 언어 : TypeScript
- 프론트엔드 프레임워크 : Vue 3 (Composition API + Script Setup)
- CSS 라이브러리 : Pico CSS + Tailwind CSS + Bootstrap Icons
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
  |     |  │   ├─ app                 # 전역 컴포넌트
  │     │  ├─ composables/            # 도메인 단위 로직 (Vue composables)
  │     │  ├─ layouts/                # 공통 레이아웃
  │     │  ├─ pages/                  # 라우트 단위 페이지
  │     │  ├─ stores/                 # 전역 상태 관리
  │     │  ├─ ui/                     # 비컴포넌트 UI 헬퍼
  │     │
  │     ├─ pb_hooks/                 # PocketBase hooks (Go / JS)
  │
  ├─ packages/                         # 재사용 패키지 영역
  │  └─ ui/                            # UI 템플릿 / 컴포넌트 패키지
  ```

### MVP 서비스 목록

- todo : 할일 관리 도구
- portfolio : 자산 포트 폴리오

---

## 프로젝트 규칙

### 커뮤니케이션 / 문서 작성 규칙

- AI 요청에 대한 응답, 검토 문서, 리뷰 문서, 코드 주석은 한국어로 작성한다.

---

### CSS 라이브러리 사용 가이드

- Pico CSS의 Semantic HTML만 활용하여 Agent는 화면을 구성한다.
- Agent는 Pico CSS의 공식 문서에 명시된 소수의 보조 클래스만 제한적으로 사용할 수 있다.
- Bootstrap Icons는 아이콘 표현 목적에만 사용한다. (장식용 남발 금지)
- 추가적인 CSS 설계나 커스텀 스타일은 최소화한다.

---

### PocketBase 가이드

- 클라이언트의 모든 서버 통신은 PocketBase SDK로만 수행한다.
  - fetch, axios, 임의 REST 호출 금지
  - 특수한 경우에만 별도 합의
- 요청/응답 타입은 임의로 새로 정의하지 않는다.
  - src/api/pocketbase-types.ts를 최우선으로 사용한다.
  - pocketbase-types.ts는 절대 수정하지 않는다.
  - 커스텀 API (pb.send)를 사용할 경우에만 요청/응답 타입 정의를 예외적으로 허용한다.
- `pocketbase-types.ts`의 `Collections` Enum을 반드시 사용한다.
- 문자열 리터럴로 컬렉션 명을 지정하는 것을 금지한다.
  - ❌ `Create<'works'>`
  - ✅ `Create<Collections.Works>`
- Realtime subscribe는 PocketBase 규칙이며, 페이지 이탈/언마운트 시 반드시 unsubscribe 한다.
- 스키마 정보는 pocketbase-types.ts를 통해 타입으로 추론할 수 있다.
- 스키마 변경이 필요한 경우 사전 리뷰를 거친다.

---

### TanStack Query 가이드

- 데이터 CRUD는 반드시 TanStack Query로 수행한다.
- Query Key는 일관된 규칙을 따른다.
  - 예: `['todos']`, `['todos', 'list', params]`, `['todos', 'detail', id]`
- Mutation 이후에는 표준 invalidation 규칙으로 캐시를 갱신한다.
  - 기본: 관련 Query Key invalidate
  - 필요 시: setQueryData로 optimistic update (필요한 경우에만 사용하며, 기본값은 invalidate이다.)
- 비동기 로직(fetch, mutation, error handling)은 Query 레이어의 책임이다.
- pages, components에서는 비동기 흐름을 제어하지 않는다.
- 예외규칙
  - 인증/세션 관련 호출(authWithPassword, authStore)은 예외적으로 TanStack Query 없이 사용 가능하다.
  - ~~ 서버 캐싱이 오히려 손해가되는 경우, TanStack Query 없이 사용 가능하다. 검토요청 필요.~~
  - 단, 그 외 데이터 CRUD는 반드시 TanStack Query를 사용한다.

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

- composable은 기본적으로 도메인 단위로 만든다.
  - ✅ useTodos, useAuth, useUserSettings
  - ❌ 도메인 로직을 잘게 쪼갠 기능 단위 composable 남발하지 않는다. (useToggle, useFetch)
- 도메인에 속하지 않는 전역/횡단 관심사 composable은 예외로 허용한다.
  - ✅ useModal, useToast, useGlobal, useValidation
- TanStack Query는 도메인 composable 내부에서만 사용한다.
- Composable은 useMutation 결과를 그대로 반환하지 않고, 도메인 액션 함수로 감싸서 반환한다.
- composable은 UI에 직접 의존하지 않는다.
- Composable에서 발생한 모든 side effect(Interval/Listener/Timeout 등)는 tryOnScopeDispose로 정리한다.

---

### Components 가이드

- 과도한 컴포넌트 분리는 지양한다.
- 기본 원칙은 페이지 단위(pages/)에서 UI와 로직을 최대한 소화하는 것이다.
- 컴포넌트 분리는 아래 조건을 만족할 때만 검토한다.
  - 3회 이상 재사용되는 경우
  - 페이지 가독성을 심각하게 해치는 경우
- 컴포넌트 자동 등록은 src/components/app 디렉터리만 허용한다. 그 외 컴포넌트는 명시적으로 import 한다.
- 컴포넌트에서 발생한 모든 side effect(Interval/Listener/Timeout 등)는 onUnmounted로 정리한다.

---

### Pages / Routing 가이드

- pages/ 디렉터리는 URL 구조와 1:1로 매핑된다.
- 라우팅 변경은 pages/ 파일 구조 변경으로만 수행한다
- 라우팅은 `unplugin-vue-router`를 통해 자동 생성되며, 수동 라우터 설정을 추가하지 않는다.
- 페이지 구조를 URL 관점에서 먼저 설계하고, 그에 맞춰 pages/를 구성한다.
- 동적 라우팅은 파일명으로 표현한다.
  - 예: [id].vue → /detail/:id

---

### UI 헬퍼 / UI 전용 타입 가이드 (src/ui)

- src/ui는 화면 표시를 위한 전용 헬퍼 / ViewModel을 둔다.
- 목적은 다음과 같다.
  - PocketBase 응답을 그대로 사용하기 어려운 경우
  - 조합 / 가공 / 표시 포맷을 거쳐 UI에서 쓰기 쉬운 형태로 변환하기 위함
- 복잡한 데이터 변환(FormData 생성, DTO 매핑 등)은 UI 컴포넌트(SFC)가 아닌 Composable 내부로 분리한다.

---

### Vue SFC / Composable 구분자 및 명명 가이드

- 본 프로젝트의 Vue SFC 및 composable 파일은 가독성과 빠른 수정, AI 협업 안정성을 위해 선언 순서와 구분자 및 명명을 명확히 유지한다.

#### Vue SFC 구분자 및 명명

- Vue SFC 메서드 명명 규칙
  - SFC 메서드는 사용자/화면 액션 중심으로만 작성한다.
  - 템플릿 이벤트(@click, @change, @submit 등)와 메서드는 1:1 매칭한다.
  - 이벤트 핸들러는 `onXxx` 접두사를 사용한다.
    - 예: `onClickSearch`, `onChangeFilter`, `onSubmitForm`
  - 가능하면 `onXxx + 대상 + 액션` 패턴으로 명확히 작성한다.
    - 예: `onClickSearchButton`, `onSubmitSearchForm`
  - 단, 핸들러 내부에서 호출되는 순수 로직 함수나 API 호출 함수는 `on` 접두사를 사용하지 않는다 (동사+목적어).
  - 이벤트 핸들러(`onXxx`) 내부에는 복잡한 로직을 직접 작성하지 않는다. 복잡한 로직은 Composable의 액션 함수를 호출하는 형태로 위임한다.
  - '복잡한 로직'에는 비동기 흐름 제어(async/await 남발, try/catch, 요청 순서/재시도/캐시 갱신 설계)를 포함한다.
  - 사용자 액션과 직접 연결되지 않는 로직은 composable 또는 ui 헬퍼로 이동한다.

- 선언 순서 (예시)
  ```vue
  <template></template>
  <script setup lang="ts">
  /* ======================= 변수 ======================= */
  // const x = ref()
  // const { setting } = useSetting();
  // ...
  /* ======================= 변수 ======================= */
  /* ======================= 감시자 ======================= */
  // watch(() => {...})
  // ...
  /* ======================= 감시자 ======================= */
  /* ======================= 생명주기 훅 ======================= */
  // onMounted(() => {...})
  // ...
  /* ======================= 생명주기 훅 ======================= */
  /* ======================= 메서드 ======================= */
  // const onClickCreateSetting = () => {...}
  // ...
  /* ======================= 메서드 ======================= */
  </script>
  <style></style>
  ```

#### Composable 구분자 및 명명

- Composable 메서드 명명 규칙
  - Composable 메서드는 도메인 액션 중심으로만 작성한다.
  - UI 이벤트 느낌의 `onXxx` 네이밍은 composable에서 금지한다.
  - 접두사는 도메인 표준 동사만 사용한다.
    - `fetch / create / update / delete / subscribe / unsubscribe`
  - 명명 순서는 반드시 `동사 + 도메인`으로 고정한다.
    - 예: `fetchWorkList`, `fetchWorkDetail`, `updateWork`, `deleteWork`
  - 도메인 엔티티가 명확히 드러나도록 명명한다.
    - 예: `fetchWorkList`, `createWork`, `updateWork`, `deleteWork`, `subscribeWorks`
  - 도메인이 명확한 내부 유틸은 예외적으로 허용한다.
    - 예: `buildQueryKey`, `setWorksCache`

- 선언 순서 (예시)
  ```ts
  /* Composable 표준 패턴 (use[Domain].ts) */
  export const useXXX = () => {
    /* ======================= 변수 ======================= */
    // const queryClient = useQueryClient();
    // ...
    /* ======================= 변수 ======================= */
    /* ======================= 감시자 ======================= */
    // watch(() => {...})
    // ...
    /* ======================= 감시자 ======================= */
    /* ======================= 메서드 ======================= */
    // const fetchWorkList = () => {...}
    // const createWork = () => {...}
    // ...
    /* ======================= 메서드 ======================= */
    return {
      //   [items],       // 예: works, developers (복수형 데이터)
      //   [action],      // 예: fetchWorkList, createWork (메서드)
    };
  };
  ```

---

### 외부 UI / 유틸 라이브러리 사용 가이드

| 제목                   | 기능             |
| :--------------------- | :--------------- |
| vueuse                 | Vue 유틸         |
| ag-grid-vue            | 테이블           |
| chart.js + vue-chartjs | 차트             |
| dayjs                  | 날짜 유틸        |
| dhtmlx-gantt           | Gantt 차트       |
| fullcalendar           | 달력             |
| tiptap                 | 텍스트 에디터    |
| tippy.js               | 툴팁             |
| turndown               | HTML To Markdown |
| validator              | 문자열 검증      |

> 단, 기본 원칙은 다음과 같다.

- 기본 UI / 기능은 Pico CSS + 단순 구현을 우선한다.
- 위 라이브러리들은 기본값이 아니며, 필요성이 명확할 때만 사용한다.
- 사용 전 반드시 아래 사항을 명시하고 검토를 거친다.
  - 왜 이 라이브러리가 필요한지
  - 단순 구현으로 대체할 수 없는 이유
  - 해당 기능이 MVP 범위에 꼭 필요한지
- 검토 없이 임의로 추가하지 않는다.

---

### 모노리포 공통 패키지 기준 가이드

- 공통 패키지 : `packages/*`
- 공통 패키지 추가는 여러 앱에서 동일 구현이 반복될 때만 검토한다.
- 동일 구현 기준: 인증/권한/세션처럼 앱 간 동작이 완전히 동일한 경우
- 추가 전 반드시 아래를 명시하고 검토 요청한다.
  - 앱마다 달라질 가능성이 낮은 이유
  - 복수 앱에서 실제로 사용될 근거(현 시점 또는 예정)
  - 앱별로 분리했을 때 발생하는 중복/유지보수 비용
- MVP 단계에서는 공통 패키지 추가 자체가 기본값이 아니며, '필요성 명확 + 최소 기능'일 때만 제안한다.

---

## Agent 금지 사항 (절대 규칙)

- 라우팅 변경은 pages/ 파일 구조 변경으로만 수행하며, 그 외 어떤 라우터 설정도 금지한다.
- `pocketbase-types.ts`를 확인하여 데이터 구조를 파악한다. 타입 정의가 없는 필드는 절대 추측하여 사용하지 않는다.
- composable 없이 pages/components에서 직접 PocketBase SDK를 호출하지 않는다.
- Composable에서 Mutation 객체(`useMutation` 결과)를 그대로 반환하지 않는다. (반드시 함수로 래핑하여 반환)
- Pinia를 CRUD 캐시 용도로 사용하지 않는다.
- Tailwind CSS 클래스는 Agent가 추가/수정/삭제/이동/치환하지 않는다. (사용 여부 판단 포함)
- SFC `<style scoped>`는 Agent가 추가/수정/삭제하지 않는다.
- 기존 CSS 클래스명과 class 속성 구조는 변경하지 않는다.
- 단, class 속성이 없던 요소에 한해 Pico 공식 보조 클래스 추가는 허용한다.
- try/catch로 가로채지 않는다. 이미 `initPocketbase`에 구현된 전역 핸들러를 신뢰한다.
- try/catch 예외가 필요한 경우 사유/범위/대안/영향을 명시하고 사전 합의를 거친다.
- 명시적 요청 없이 구조 개선 또는 리팩터링을 제안하거나 수행하지 않는다.
- ※ 본 문서의 규칙 간 해석 충돌이 발생할 경우, MVP 속도와 단순성을 우선한다.

> 위 규칙을 우회하는 구조적 편법을 사용하지 않는다.

---

## 작업 완료 기준

- Agent는 코드 수정 또는 기능 구현 후 반드시 아래 절차를 수행해야 한다.
- 모든 검증은 작업한 apps/{서비스명} 디렉터리 단위로 수행한다.
  - 예: `apps/todo`, `apps/portfolio`

### 필수 검증 절차

1. 작업 대상 서비스의 디렉터리(apps/{서비스명})로 이동한다.
2. 해당 디렉터리에서 `pnpm lint`를 실행하고, 발생한 이슈를 모두 수정한다.
3. `pnpm lint` 실행 결과 에러 및 경고가 없는 상태를 확인한다.
4. 동일한 디렉터리에서 `pnpm build`를 실행하여 최종 빌드가 정상적으로 완료되는지 확인한다.
5. 위 절차가 모두 완료된 경우에만 작업을 "완료"로 간주한다.

- `pnpm lint` 또는 `pnpm build` 단계에서 오류가 발생한 경우, 작업은 완료된 것으로 간주하지 않는다.
- 검증 절차를 생략하거나 추정으로 판단하지 않는다.
- 루트 디렉터리에서의 실행 결과로 대체하지 않는다.
