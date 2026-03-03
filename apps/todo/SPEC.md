# TODO 서비스 기능 정의서 (재작성)

문서 버전: 1.0  
기준 코드: `apps/todo`  
작성일: 2026-03-03

## 1. 문서 목적

본 문서는 `apps/todo` 코드베이스의 현재 동작을 기준으로, TODO 서비스의 기능/데이터/연동 규칙을 제품 기능 정의서 형태로 정리한다.  
아키텍처 이상론보다 현재 구현 기준의 운영 가능한 명세를 우선한다.

## 2. 서비스 개요

- 서비스 목표: 개인/팀 업무를 등록하고 상태, 담당자, 마감일, 알림, 상세 기록을 통합 관리한다.
- 핵심 특성:
  - 업무 보드(목록/칸반/캘린더/대시보드) 중심 운영
  - PocketBase 기반 CRUD + Realtime 반영
  - 예약 알림 + 브라우저 알림 + 내부 알림함
  - Redmine/Joplin 외부 링크 연동

## 3. 사용자 및 권한

- 사용자 타입: PocketBase `users` 인증 사용자
- 권한 원칙:
  - `users`, `developers`, `works`, `notifications`, `scheduledNotifications`, `settings`는 모두 `@request.auth.id` 기반 소유자 접근
  - 인증되지 않은 사용자는 `/sign`으로 유도

## 4. 화면/기능 정의

| 경로 | 화면명 | 핵심 기능 |
|---|---|---|
| `/` | 오늘의 업무 | 업무 생성, 담당자 필터(ALL/미배정/개발자), 완료 처리, 삭제, 드래그 정렬, 마감일 임박 강조 |
| `/detail/:id` | 업무 상세 | 제목/상태/완료/내용 편집, Redmine 동기화, Joplin 링크, 담당자/마감일 편집, 예약 알림 추가/삭제, 파일 첨부/삭제 |
| `/kanban` | 칸반 | 상태별 컬럼, 드래그 상태 이동, 카드 클릭 상세 이동 |
| `/list` | 검색 리스트 | 기간/완료/담당/키워드/주간보고서 필터, AG Grid 표 조회 |
| `/calendar` | 캘린더 | 등록/수정/마감 이벤트 표시, 이벤트 클릭 상세 이동 |
| `/dashboard` | 대시보드 | 개발자별 업무량, 상태 분포, 14일 마감 추이 차트 |
| `/notification` | 알림함 | 알림 목록 조회, 읽음 처리 |
| `/setting` | 설정 | 개발자 등록/수정, 앱 설정(`daysBefore`) 저장 |
| `/sign` | 로그인/회원가입 | 사용자 로그인, 계정 생성 |
| `/project-gantt` | 프로젝트 간트 | 정적 샘플 데이터 기반 Gantt 렌더링(업무 데이터 미연동) |

### 4.1 공통 네비게이션

- 상단 메뉴: Todo/Kanban/List/Calendar/Dashboard/Project Gantt 이동
- 단축키: `Alt+1~6` 각 메뉴 이동
- 기능 메뉴:
  - 로그인/설정/로컬스토리지 클리어/로그아웃
  - 알림 아이콘(권한 상태에 따라 bell/bell-slash)
  - 테마 토글(white/dark)

## 5. 핵심 비즈니스 규칙

### 5.1 업무 생성/완료/상태

- 신규 업무 기본값:
  - `state = 'wait'`, `done = false`, 기본 에디터 콘텐츠 초기값 포함
- 완료 체크 시:
  - `done = true`, `state = 'done'`, `doneDate` 기록
- 상세에서 완료 해제 시:
  - `done = false`, `state = 'wait'`

### 5.2 정렬/리스트 규칙

- 메인 기본 조회: `done = false`, 정렬 `sort,-created`
- 메인 드래그 종료 시 `sort` 배치 업데이트
- “마감일자 순 재정렬” 버튼은 `dueDate` 오름차순으로 재정렬 후 배치 저장

### 5.3 마감 임박 표시

- 설정값 `settings.data.daysBefore`를 기준으로
- `dueDate < now + daysBefore`이면 임박 업무로 강조 표시

### 5.4 검색/주간보고서

- 리스트 기본 기간: 최근 3개월 (`search.store`)
- 주간보고서 토글 활성화 시 `updatedFrom/updatedTo`를 해당 주 월~금으로 자동 세팅

### 5.5 알림 처리

- 미읽음 수 기반 상단 Dot 표시
- 브라우저 권한이 `granted`일 때:
  - `notifications` Realtime 구독
  - 1분 주기로 `scheduledNotifications.time <= now` 항목을 `notifications`로 승격 생성 후 원본 삭제
- 알림함에서 읽음 처리 시 캐시 invalidate

### 5.6 상세 편집 규칙

- Redmine:
  - URL에서 issue id 추출
  - 조회(`GET /api/redmine-data/{id}`), 업데이트(`POST /api/redmine-data`)
  - watcher 그룹(`cx/server/client/biz/manager`) 선택 가능
- 예약 알림:
  - 생성 시 `works.scheduledNotifications+`로 연결
  - 삭제 시 `works.scheduledNotifications-`로 해제
- 파일:
  - 파일 업로드/교체 가능
  - 삭제 시 `file = null`, `originalFileName = ''`

## 6. 데이터 모델 (PocketBase)

### 6.1 주요 컬렉션

- `users` (auth): 사용자 계정
- `codes`: 코드 마스터 (`workState` 등)
- `developers`: 담당자 정보
- `works`: 핵심 업무 엔티티
- `scheduledNotifications`: 예약 알림
- `notifications`: 실제 알림함 데이터
- `settings`: 사용자별 JSON 설정

### 6.2 핵심 필드 요약

- `works`:
  - 필수: `user`, `title`
  - 주요: `content`, `done`, `doneDate`, `dueDate`, `state`, `developer`, `sort`, `file`, `redmine`, `joplin`
  - `redmine`은 `pms.kpcard.co.kr` 도메인 제한
- `settings.data`: 현재 구현상 `daysBefore` 사용
- `developers`: `name`, `sort`, `leader`, `del`

### 6.3 접근 규칙

- 대부분 컬렉션에서 `user = @request.auth.id` 조건으로 소유자 접근 제한

## 7. 서버 훅 및 커스텀 API

### 7.1 Redmine 연동 API (`pb_hooks/redmine.pb.ts`)

- `GET /api/redmine-data/{id}` (auth)
  - Redmine 이슈 조회
- `POST /api/redmine-data` (auth)
  - 시작/종료일, 진척도, 메모 업데이트
  - watcher 그룹 기반 사용자 추가 요청 수행

### 7.2 스케줄 훅 (`pb_hooks/schedule.pb.ts`)

- 정기 업무/알림 자동 생성:
  - 주간보고서 작성
  - 주간보고서 리뷰
  - 월간보고서 작성
  - K-Tree 작성
  - PG 결제 불일치 건 조회

## 8. 비기능/운영 규칙

- 테마:
  - 초기 진입 시 로컬 저장값 없으면 시스템 다크모드 감지
- 코드 캐시:
  - `codes` 조회 결과를 localStorage 캐시(24h staleTime)
- 전역 에러 처리:
  - `pb.afterSend`에서 비정상 응답 시 모달 노출

## 9. 현재 제약 및 리스크

- `project-gantt`는 `works` 연동이 아닌 샘플 데이터 고정
- `pb_hooks/redmine.pb.ts`에 Redmine API Key 하드코딩
- `pb_hooks/schedule.pb.ts`에 사용자/개발자 ID 하드코딩
- 브라우저 Notification 권한 거부 시 실시간 시스템 알림 기능 제한

## 10. 변경 시 우선 검토 항목

- `works` 상태 체계 변경 시:
  - 메인/칸반/대시보드/상세/코드테이블 동시 영향
- 알림 구조 변경 시:
  - Realtime, 주기 polling, unread count, Dot 처리 동시 영향
- Redmine 연동 변경 시:
  - 상세 페이지 + hook API 계약 동시 수정 필요
