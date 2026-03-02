# StyleMate 기능 정의서 (구현 기준)

## 1. 문서 목적

- 본 문서는 `apps/stylemate`의 **현재 코드 구현**을 기준으로 서비스 기능을 정의한다.
- 기획 의도보다 실제 동작을 우선한다.
- 대상 범위:
  - Vue 프론트엔드 (`src/pages`, `src/composables`)
  - PocketBase 컬렉션/권한 (`pb_schema.json`)
  - PocketBase hook API (`pb_hooks`)

## 2. 서비스 한 줄 정의

- 개인 옷장 이미지를 등록하고 AI로 메타데이터/임베딩을 생성한 뒤, 자연어 + 날씨 기반 코디 추천과 코디일지 기록을 제공하는 개인 코디 보조 서비스.

## 3. 사용자/접근 조건

- 사용자 유형: 로그인한 일반 사용자(1인 단위 데이터 소유).
- 인증 필수 화면:
  - `/` (홈)
  - `/diary` (코디일지)
  - `/snap` (스냅)
  - `/settings` (설정)
- 비인증 접근 가능 화면:
  - `/sign` (로그인/회원가입)

## 4. 화면 구조

- `/sign`: 로그인/회원가입 탭
- `/`: 홈(날씨, 추천 요청, 옷장 목록, 필터, 업로드, 상세 편집)
- `/diary`: 코디 확정 로그 조회
- `/snap`: 외부 스냅 링크 모음
- `/settings`: 회원 정보 요약 + 로그아웃
- 하단 고정 네비게이션: 홈/코디일지/스냅/설정

## 5. 핵심 기능 정의

### 5.1 인증

- 로그인:
  - `users.authWithPassword(email, password)` 호출
  - 성공 시 루트(`/`) 이동
- 회원가입:
  - `users.create({ email, name, password, passwordConfirm })`
  - 가입 후 자동 로그인하지 않음
- 로그아웃:
  - `pb.authStore.clear()`
  - `/sign` 이동
- 인증 상태는 Pinia(`isAuth`, `userId`)에 persisted 저장

### 5.2 홈 - 옷장 조회/필터

- 옷 목록 로드:
  - `clothes.getFullList({ sort: '-created' })` 조회 후 클라이언트 필터링
- 필터 조건:
  - 검색어(`imageHash`, `sourceUrl` 포함 검색)
  - 카테고리, 계절, 색상, 스타일, 핏, 소재, 상황
- 처리 중 상태(`uploaded`, `preprocessing`, `analyzing`, `embedding`)가 하나라도 있으면 2.5초 polling
- 상단 진행 요약:
  - 상태별 건수/평균 진행률 표시
- 실패 상태(`failed`)는 실패 코드 라벨 표시

### 5.3 홈 - 옷 업로드

- 업로드 방식:
  - 파일 업로드
  - URL 업로드(직접 이미지 URL 또는 페이지에서 후보 추출)
- 파일 업로드 세부:
  - `<input type="file">`로 이미지 선택
  - 클립보드 이미지 붙여넣기 지원(브라우저 권한 허용 시)
  - 업로드 전 SHA-256 해시 기반 중복 검사(실패 상태 제외)
- URL 업로드 세부:
  - 직접 업로드: 확장자 기반 이미지 URL일 때 즉시 등록
  - 후보 추출: `/api/clothes/url-image-candidates`로 `og:image` 후보 최대 3개 조회 후 선택 저장
  - URL 중복 검사(실패 상태 제외)
- 업로드 요청 성공 시 즉시 `uploaded` 상태 레코드가 생기고 파이프라인 비동기 처리 시작

### 5.4 홈 - 옷 상세/수정

- 상세 다이얼로그에서 수정 가능 항목:
  - 카테고리, 계절, 색상, 스타일, 핏, 소재, 상황
  - 선호도 점수(`0~100` 클라이언트 검증)
  - 원본 URL(`sourceType === 'url'`일 때만 수정 허용)
- 저장 동작:
  - `clothes.update(...)` 실행
  - 즉시 `/api/clothes/reembed/{id}` 호출로 재임베딩
  - 상세 데이터 재조회 후 화면 갱신

### 5.5 홈 - 옷 삭제

- 삭제 확인 모달 후 `/api/clothes/delete/{id}` 호출
- 서버에서 연쇄 정리:
  - 해당 옷 관련 `recommendation_items` 삭제
  - `wear_logs.items`에서 해당 옷 제거
  - 로그에 남는 아이템이 없으면 해당 `wear_logs` 삭제

### 5.6 홈 - 추천 요청/탐색/확정

- 추천 요청:
  - 입력: 자연어 `queryText`
  - 추가 입력: 안양 날씨 기반 기본 계절(`seasons`) 자동 전달
  - API: `/api/recommendations/request`
- 추천 결과 구조:
  - 서버는 카테고리별 1개 추천 아이템을 우선 생성(라운드 1)
  - 클라이언트는 추천 아이템 + 내 옷장 `done` 상태 아이템을 카테고리별로 합쳐 탐색 후보 구성
  - 후보 탐색: 이전/다음 버튼, 썸네일 선택, 스와이프(36px 임계값)
- 고정/재추천:
  - 카테고리별 1개 고정 가능
  - API: `/api/recommendations/reroll`
  - 고정된 카테고리는 유지, 미고정 카테고리는 가능한 다음 후보로 교체
  - 라운드 번호 증가
- 전신 미리보기:
  - 상의/하의/신발/악세사리 슬롯 이미지 조합 표시
- 추천 확정:
  - 입력: 착용일(`wornDate`), 메모(`note`)
  - API: `/api/recommendations/confirm`
  - 성공 시:
    - `wear_logs` 생성
    - 선택된 옷 `preferenceScore +1`
    - `lastWornAt` 갱신

### 5.7 코디일지(`/diary`)

- `wear_logs` + `clothes`를 결합해 로그 목록 렌더링
- 착용일(`wornDate`) 기준 그룹화
- 각 로그에서 착용 아이템 썸네일/카테고리/메모 표시
- 새로고침 버튼으로 재조회 가능

### 5.8 날씨 기능

- 프론트 호출 API: `/api/weather/major-cities-daily`
- 대상 도시: 안양, 성남
- 표시 값:
  - 최저/최고 기온
  - stale 여부(캐시 fallback 시)
- 추천 계절 기본값 산정(안양 평균기온 기준):
  - 23도 이상: 여름
  - 17도 이상: 가을
  - 9도 이상: 봄
  - 그 외: 겨울

### 5.9 스냅(`/snap`)

- 외부 사이트 링크 제공:
  - 무신사 스냅
  - 온더룩
- Android + standalone(PWA 유사 환경)에서는 intent URL 우선 시도

### 5.10 설정(`/settings`)

- 현재 로그인 사용자 ID/이름 표시
- 로그아웃 제공

## 6. 옷 처리 파이프라인(서버)

### 6.1 트리거

- `clothes` 레코드 생성 후 자동 실행
- `state`가 `uploaded`로 업데이트될 때 재실행

### 6.2 상태 전이

- `uploaded` -> `preprocessing` -> `analyzing` -> `embedding` -> `done`
- 실패 시 `failed` + `errorCode` + `errorMessage`

### 6.3 단계별 처리

- preprocessing:
  - 업로드 이미지/URL 유효성 검증
  - `imageHash` 생성
  - upload 타입: 파일 바이트 기반 SHA-256
  - url 타입: URL 문자열 기반 MD5
- analyzing:
  - Gemini(`gemini-2.5-flash-lite`)로 의류 속성 추출
  - API 키 없으면 fallback 규칙 기반 분석 사용
  - JSON 파싱 실패 시 `ai_invalid_json`
- embedding:
  - 속성 + hash 기반 텍스트를 임베딩(`gemini-embedding-001`)
  - 실패 시 `embedding_error`
  - API 키 없으면 deterministic fallback 임베딩 사용

### 6.4 재시도/재임베딩

- 재시도 API: `/api/clothes/retry/{id}`
  - `retryCount + 1`, `state=uploaded`
  - `retryCount >= maxRetry`면 실패 처리
- 재임베딩 API: `/api/clothes/reembed/{id}`
  - metadata 수정 후 `imageHash` 재계산 + embedding 재생성
  - 성공 시 `done`

## 7. 추천 엔진(서버)

### 7.1 요청 처리

- API: `/api/recommendations/request`
- 입력:
  - `queryText`
  - `topK`(기본 12, 1~50 제한)
  - `seasons`(날씨 기본값)
- 쿼리 필터 생성:
  - Gemini 기반 자연어 필터 변환
  - 실패/키 미설정 시 키워드 fallback
- 쿼리 임베딩 생성:
  - Gemini 임베딩
  - 실패/키 미설정 시 deterministic fallback

### 7.2 후보 계산

- 대상: 내 `clothes` 중 `state="done"`
- 필터 적용:
  - category, fit, seasons, colors, styles, materials, contexts
- 점수 계산:
  - `score = cosineSimilarity(queryEmbedding, clothesEmbedding) + preferenceScore * 0.02`
- 카테고리별 상위 후보 풀 생성 후 1개씩 초기 추천 아이템 생성

### 7.3 리롤

- API: `/api/recommendations/reroll`
- 기준:
  - 같은 세션의 최신 라운드 대상
  - 고정된 카테고리는 동일 clothes 유지
  - 미고정 카테고리는 이전 라운드 포함 사용 이력이 없는 후보 우선

### 7.4 확정

- API: `/api/recommendations/confirm`
- 확정 시:
  - 현재 라운드 선택 아이템 `isSelected=true`
  - `wear_logs` 생성
  - 선택 옷 선호도 증가/마지막 착용일 갱신

## 8. 데이터 모델 요약

- `users`(auth):
  - `email`, `password`, `name`, `avatar`
- `clothes`:
  - 원본 정보: `sourceType`, `sourceUrl`, `sourceImage`
  - 처리 정보: `state`, `errorCode`, `errorMessage`, `retryCount`, `maxRetry`
  - 분석 정보: `category`, `seasons`, `colors`, `styles`, `fit`, `materials`, `contexts`
  - 추천 정보: `embedding`, `embeddingModel`, `preferenceScore`, `lastWornAt`
- `recommendation_sessions`:
  - `queryText`, `queryFilter(json)`, `queryEmbedding(json)`, `topK`, `state`
- `recommendation_items`:
  - `session`, `clothes`, `category`, `rank`, `similarity`, `round`, `isPinned`, `isSelected`
- `wear_logs`:
  - `wornDate`, `items(clothes[])`, `session`, `note`

## 9. 권한/보안 규칙

- 컬렉션 접근은 모두 사용자 소유 데이터 기준(`user = @request.auth.id`)으로 제한
- hook 커스텀 API는 전부 `$apis.requireAuth()` 적용
- 서버 로직에서 소유권 재검증:
  - retry/reembed/delete/recommendation action 모두 `auth user`와 레코드 `user` 일치 확인

## 10. 에러 처리 정책

- 프론트 공통 처리:
  - `pb.afterSend`에서 비정상 응답(2xx 외) 메시지를 모달로 표시
- 서버 처리:
  - 파이프라인 실패 시 상태/코드/메시지 저장
  - 날씨 API 실패 시 기존 캐시가 있으면 `stale=true`로 fallback 제공

## 11. 운영/배치

- 날씨 캐시 초기화:
  - hook 로드 시 1회 즉시 갱신 시도
- 정기 갱신:
  - cron `5 0 * * *` (매일 00:05, Asia/Seoul 기준 API 호출)

## 12. 현재 구현 기준 제약사항

- 옷 목록 필터는 서버 쿼리 필터가 아니라 클라이언트 필터링 기반
- 추천 결과의 상세 후보는 서버가 topK 전량을 반환하지 않고, 클라이언트가 내 옷장 데이터로 후보 폭을 확장
- 날씨 도시는 현재 안양/성남 2개 고정
- 추천 설명(why this outfit), 스타일 이미지 합성 등은 미구현
