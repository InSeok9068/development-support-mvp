# KJCA 서비스 기능 정의서 (재작성)

문서 버전: 1.0  
기준 코드: `apps/kjca`  
작성일: 2026-03-03

## 1. 문서 목적

본 문서는 `apps/kjca`의 현재 코드 동작을 기준으로, KJCA 업무일지 자동 취합 서비스의 기능/데이터/내부 API 체인을 명확히 정의한다.

## 2. 서비스 개요

- 서비스 목표:
  - KJCA 팀장 일지를 자동 수집/분석해 부서별 금주 모집 계획/실적을 한 화면에 제공
- 핵심 가치:
  - 수작업 복사/집계 최소화
  - 분석 결과 캐시 활용으로 재실행 비용 절감
  - 부서 단위 표준 출력(요일별 계획/결과)

## 3. 사용자 및 권한

- 사용자 타입: PocketBase `superusers`
- 로그인 모델:
  - 로그인 ID에 `@`가 없으면 `@kjca.local` 자동 보정
- 권한 원칙:
  - 주요 hook API는 모두 `requireSuperuserAuth()`
  - 미로그인 상태에서는 자동 취합 실행 불가

## 4. 화면/기능 정의

| 경로 | 화면명 | 핵심 기능 |
|---|---|---|
| `/sign-in` | 슈퍼유저 로그인 | 로그인/오류 표시/홈 이동 |
| `/` | 자동 취합 대시보드 | 조회일/테스트모드 설정, 자동 취합 실행, 팀장 목록/접근 상태, 부서별 주간표, AI 분석 상세, 부서 캐시 삭제 |

### 4.1 메인 화면(`/`) 기능

- 실행 파라미터
  - `조회일(scDay)` 입력
  - `테스트 모드(testOneOnly)` 토글(대상 1건만 처리)
- 자동 취합 실행
  - 버튼: “금일 자동 취합/비교 실행”
  - 실행 중 로딩/진행 안내 표시
  - 완료 후 성공/실패/경고 메시지 표시
- 결과 출력
  - 팀장 목록(부서/직책/성명)
  - 부서별 “금주 모집 계획/결과” 테이블
  - AI 분석 상세(모집/홍보 추출, 실적 요약, 원본 링크)
- 부서 캐시 삭제
  - 부서별 “해당 부서 캐시 지우기” 버튼 제공
  - 삭제 후 해당 부서 분석결과 즉시 제거
- 좌측 조회 패널 접기/펼치기 지원

## 5. 내부 API 체인 정의

### 5.1 `POST /api/staff-auth-probe`

- 목적:
  - KJCA 사이트 로그인 가능 여부 확인 + 조회일의 팀장 일지 목록 수집
- 입력:
  - `scDay`
- 인증:
  - superuser 필수
- 주요 처리:
  - 로그인한 superuser 이메일로 `users` 컬렉션 레코드 조회
  - `users.name`을 KJCA ID, `users.kjcaPw`를 KJCA PW로 사용
  - KJCA 로그인 후 일지 목록 페이지 파싱
- 출력:
  - `isDiaryAccessible`
  - `teamLeadRows[]` (`dept`, `position`, `staffName`, `printUrl`)

### 5.2 `POST /api/staff-diary/analyze`

- 목적:
  - 팀장별 일지 원문을 Gemini로 구조화 분석
- 입력:
  - `reportDate`
  - `targets[]` (`dept`, `position`, `staffName`, `printUrl`)
- 인증:
  - superuser 필수
- 주요 처리:
  - 원문 페이지에서 `doc_text` 추출
  - `staff_diary_analysis_cache` 성공 캐시 우선 조회
  - 캐시 미스 시 Gemini 요청(재시도/백오프)
  - 429 원인 분류 후 quota/billing 한도면 조기 중단
  - 성공 결과 캐시 upsert
- 출력:
  - `results[]` (promotion/vacation/special/recruiting 구조)
  - `stoppedReason`, `alertMessage`

### 5.3 `POST /api/staff-diary/collect-weekly`

- 목적:
  - 주간 취합 오케스트레이션(Probe + Analyze + DB 업서트 + 집계 응답)
- 입력:
  - `reportDate`
  - `testOneOnly`
- 인증:
  - superuser 필수
- 주요 처리:
  - 조회일 기준 주 시작일(월요일) 계산
  - 오늘 대상 수집, 필요 시 월요일 데이터로 주간계획 bootstrap
  - 분석 실패 항목 중 일시 오류(429/503/timeout 등) 재시도
  - 성공 항목을 아래 컬렉션에 업서트:
    - `recruiting_week_plans`
    - `recruiting_week_plan_items`
    - `recruiting_daily_results`
    - `recruiting_week_text_plans`
    - `recruiting_week_text_rows`
  - 응답용 `deptSnapshots`, `deptWeekTables` 생성
- 출력:
  - `teamLeadRows`, `analysisResults`, `deptSnapshots`, `deptWeekTables`, `warnings`, `alertMessage`

## 6. 데이터 모델 (PocketBase)

### 6.1 주요 컬렉션

- `users` (auth 확장)
  - `name`(KJCA 로그인 ID 용도), `kjcaPw`(KJCA 로그인 PW 용도)
- `staff_diary_analysis_cache`
  - 원문 해시 기반 분석 결과 캐시
- `recruiting_week_plans` / `recruiting_week_plan_items`
  - 숫자형 주간 계획
- `recruiting_daily_results`
  - 일자별 실적
- `recruiting_week_text_plans` / `recruiting_week_text_rows`
  - 텍스트 보존형 주간표

### 6.2 핵심 enum

- weekday: `mon/tue/wed/thu/fri`
- daily result sourceType: `manual/ai`
- week plan status: `draft/confirmed`
- cache status: `success/failed`

### 6.3 인덱스 요약

- `recruiting_week_plans`: `(weekStartDate, dept)` unique
- `recruiting_daily_results`: `(reportDate, dept)` unique, `(weekStartDate, dept)` index
- `recruiting_week_text_plans`: `(weekStartDate, dept)` unique
- `recruiting_week_plan_items`, `recruiting_week_text_rows`:
  - `planId` index
  - `(planId, weekday, sortOrder)` index

## 7. 비즈니스 규칙

- 요일 정규화:
  - 영문/한글 표기 입력을 `mon~fri`로 통일
- 부서 집계:
  - 동일 부서 다건은 부서 단위로 병합/집계
- 주간 텍스트 표:
  - 요일별 데이터가 없어도 빈 행을 생성해 월~금 행 구조 유지
- 캐시 삭제:
  - `reportDate` + `dept` 기준으로 `staff_diary_analysis_cache` 삭제

## 8. 운영 제약 및 리스크

- 외부 의존성:
  - KJCA 웹 구조 변경 시 파싱 실패 가능
  - Gemini API 상태/쿼터에 따라 분석 중단 가능
- 환경 변수:
  - `GEMINI_API_KEY` 또는 `GEMINI_AI_KEY` 필요
- 계정 매핑 제약:
  - superuser 이메일과 동일한 `users` 계정 + `name/kjcaPw` 설정 필요
- 보안 이슈:
  - `users.kjcaPw`는 현재 평문 저장 구조

## 9. 변경 시 우선 검토 항목

- 파싱 로직 변경 시:
  - `staff-auth-probe`, `staff-diary-analyze`, `utils.ts` 동시 점검 필요
- 분석 스키마 변경 시:
  - Gemini 프롬프트 + 정규화 + 캐시 구조 + UI 렌더 로직 동시 수정 필요
- 집계 정책 변경 시:
  - `collect-weekly` 업서트/응답 구조와 화면 병합 로직 동시 수정 필요
