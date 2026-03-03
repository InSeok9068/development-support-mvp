# Portfolio 서비스 기능 정의서 (재작성)

문서 버전: 1.0  
기준 코드: `apps/portfolio`  
작성일: 2026-03-03

## 1. 문서 목적

본 문서는 `apps/portfolio`의 현재 구현을 기준으로, 사용자 분석 기능과 관리자 운영 기능을 제품 관점에서 재정의한다.  
실제 코드 동작과 데이터 흐름을 우선하며, 추상 설계보다 운영 가능한 명세를 목표로 한다.

## 2. 서비스 개요

- 서비스 목표:
  - 이미지 기반 자산내역을 분석해 자산 목록/요약을 제공
  - 매칭 실패 자산을 관리자가 후처리해 매칭 정확도를 개선
- 핵심 구성:
  - 일반 사용자 화면(`/`)
  - 관리자 로그인/회원가입 화면(`/sign`)
  - 관리자 운영 화면(`/admin`)

## 3. 사용자 및 권한

- 일반 사용자:
  - `/`에서 이미지 분석 실행 가능
  - 로컬 편집(수동 자산 추가/수정) 가능
- 관리자(슈퍼유저):
  - `/admin`에서 매칭 등록, 관리자 자산 CRUD, AI 분류 추천 사용 가능
- 권한 기준:
  - 관리자 전용 API는 PocketBase `superuser` 인증 필요
  - `/api/public/report`는 공개 API

## 4. 화면/기능 정의

| 경로 | 화면명 | 핵심 기능 |
|---|---|---|
| `/` | 자산 분석 화면 | 이미지 업로드 분석, 요약/차트/상위 자산 표시, 로컬 자산 편집/수동 추가 |
| `/sign` | 인증 화면 | 관리자 로그인(`superusers`), 일반 사용자 회원가입(`users`) |
| `/admin` | 관리자 화면 | 매칭 실패 처리, 관리자 자산 관리, AI 추천 기반 분류 보조 |

### 4.1 일반 사용자 분석 화면 (`/`)

- 입력:
  - 이미지 파일 1개 선택 후 분석 실행
- 분석 결과:
  - 총 평가액, 손익, 손익률, 매칭률, 미매칭 개수
  - 카테고리/프로파일/태그/섹터 도넛 차트
  - 금액 기준 상위 자산 리스트(전체보기 토글)
- 자산 편집:
  - 항목별 분류 편집 다이얼로그 제공
  - 수동 자산 추가 가능
  - 주의: 편집/수동 추가 결과는 현재 로컬 상태만 변경(서버 반영 없음)

### 4.2 인증 화면 (`/sign`)

- 관리자 로그인:
  - `Superusers.authWithPassword` 사용
  - 로그인 성공 시 슈퍼유저면 `/admin`, 아니면 `/`
- 일반 사용자 회원가입:
  - `Users.create`
  - 관리자 권한과 무관한 계정 생성

### 4.3 관리자 화면 (`/admin`)

- 탭 1: 매칭 등록
  - 미매칭(`adminAssetId = ""`) 자산 조회
  - 필터: 키워드, 카테고리, 최근 기간(from/to), 중복명 제거
  - 처리 모드:
    - 신규 자산 생성 후 즉시 연결
    - 기존 자산 선택 후 연결
  - AI 추천:
    - `/api/match-failure/suggest` 호출
    - 추천 category/groupType/tags/sectors 반영
- 탭 2: 자산 관리
  - 관리자 자산 목록 조회/검색/필터
  - 생성/수정/삭제
  - 삭제 시 연결된 `extracted_assets`, `match_logs`의 `adminAssetId`를 먼저 해제 후 삭제

## 5. 핵심 비즈니스 규칙

### 5.1 분석 리포트 처리

- 분석 요청 시 `baseCurrency`는 현재 UI에서 `KRW` 고정 전달
- 이미지 해시(`sourceImageHash`)가 이전 완료 리포트와 같으면 OCR/Gemini 재호출 없이 캐시 재사용
- 유효 항목 기준:
  - `rawName` 존재
  - `amount > 0`

### 5.2 관리자 자산 매칭 규칙

- 1차: `admin_assets.name` exact match
- 2차: `alias1~3` match
- 매칭 로그(`match_logs`) 기록:
  - `matchedBy`: `exact`/`alias`/`ai`
  - `status`: `confirmed`/`pending`

### 5.3 다중 선택 제한

- 태그(`tags`) 최대 3개
- 섹터(`sectors`) 최대 2개

### 5.4 데이터 정리 정책

- 스케줄 훅에서 `match_logs`, `extracted_assets` 14일 초과 데이터 일괄 정리

## 6. 데이터 모델 (PocketBase)

### 6.1 주요 컬렉션

- `admin_assets`: 관리자 자산 마스터
- `extracted_assets`: OCR/분석으로 추출된 자산 원본
- `match_logs`: 매칭 시도/결과 로그
- `reports`: 분석 실행 단위 리포트
- `users`: 일반 사용자 계정

### 6.2 핵심 필드 및 enum

- `admin_assets`
  - `name`(required)
  - `category` enum: `cash/deposit/stock/.../etc`
  - `groupType` enum: `liquid/risk/defensive/real`
  - `tags`, `sectors`(multi select)
- `extracted_assets`
  - `reportId`(required relation)
  - `adminAssetId`(optional relation)
  - `rawName`, `category`, `amount`, `profit`, `profitRate`, `quantity`
- `match_logs`
  - `matchedBy`: `exact/alias/ai`
  - `status`: `pending/confirmed/rejected`
- `reports`
  - `status`: `pending/processing/done/failed`
  - `sourceImageHash`, 집계값(`totalValue`, `totalProfit`, `totalProfitRate`)

### 6.3 인덱스 요약

- `admin_assets`
  - `name` unique
  - `alias1` unique
  - `alias2`, `alias3` index

## 7. API 및 훅 명세

### 7.1 공개 API

- `POST /api/public/report`
  - 이미지 분석 요청
  - OCR/파싱 + 매칭 + 결과 저장 후 응답
  - `GEMINI_API_KEY` 필요

### 7.2 관리자 API

- `POST /api/match-failure/suggest` (superuser auth)
  - 종목명/카테고리 힌트 기반 AI 분류 추천
  - 허용 enum으로 정규화 후 반환

### 7.3 스케줄 훅

- `match-logs-cleanup-daily`
  - `match_logs`, `extracted_assets` 보존기간(14일) 초과 데이터 삭제

## 8. 운영 제약 및 리스크

- 일반 분석 화면의 자산 편집/수동 추가는 서버 미반영(세션 로컬 상태)
- Gemini 키 미설정 시 분석/AI 추천 실패
- 주요 도메인 컬렉션 rule이 `null`(오픈)로 되어 있어, 실제 접근 통제는 앱 플로우/관리자 인증 정책 의존

## 9. 변경 시 우선 검토 항목

- 분류 enum 변경 시:
  - `pocketbase schema`, 프론트 옵션, AI 프롬프트/정규화 로직 동시 수정 필요
- 매칭 정책 변경 시:
  - `report.pb.ts`, `useAdminAssets.ts`, 관리자 화면 처리 흐름 동시 영향
- 보존기간 정책 변경 시:
  - `data-retention-cleanup.pb.ts` 및 운영 모니터링 기준 동시 수정 필요
