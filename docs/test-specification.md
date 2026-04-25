# 영업일일보고 시스템 테스트 명세서

**작성일:** 2026-04-25  
**버전:** 1.0

---

## 목차

1. [테스트 범위 및 전략](#테스트-범위-및-전략)
2. [테스트 환경](#테스트-환경)
3. [인증](#인증)
4. [보고서](#보고서)
5. [방문기록](#방문기록)
6. [댓글](#댓글)
7. [고객 마스터](#고객-마스터)
8. [영업사원 마스터](#영업사원-마스터)
9. [권한 공통](#권한-공통)

---

## 테스트 범위 및 전략

| 구분 | 내용 |
|------|------|
| 단위 테스트 | 각 API 엔드포인트의 정상/비정상 케이스 |
| 통합 테스트 | 보고서 작성 → 상세 조회 → 댓글 등록 전체 흐름 |
| 권한 테스트 | 영업사원 / 상급자 / 비인증 사용자 접근 제어 |
| 경계값 테스트 | 입력 최대 길이, 방문기록 0건/최대건 |

### 테스트 ID 규칙

`TC-[도메인]-[번호]`  
예) `TC-AUTH-001`, `TC-REPORT-003`

---

## 테스트 환경

| 항목 | 내용 |
|------|------|
| 테스트 DB | 별도 테스트용 DB (프로덕션 DB 사용 금지) |
| 각 테스트 전 | DB 초기화 또는 트랜잭션 롤백으로 독립성 확보 |
| 인증 토큰 | 테스트용 영업사원/상급자 계정으로 발급 |

### 공통 픽스처

| 역할 | 이름 | 이메일 |
|------|------|--------|
| 영업사원 A | 홍길동 | hong@test.com |
| 영업사원 B | 김영업 | kim@test.com |
| 상급자 | 이상사 | lee@test.com (홍길동, 김영업의 manager) |
| 고객 A | (주)ABC상사 | - |
| 고객 B | DEF전자 | - |

---

## 인증

### TC-AUTH-001 정상 로그인
- **대상 API:** `POST /auth/login`
- **전제 조건:** 영업사원 계정 존재
- **입력값:**
  ```json
  { "email": "hong@test.com", "password": "password123" }
  ```
- **기대 결과:**
  - HTTP 200
  - `data.accessToken` 존재
  - `data.salesperson.email` = `"hong@test.com"`

---

### TC-AUTH-002 잘못된 비밀번호로 로그인 실패
- **대상 API:** `POST /auth/login`
- **입력값:**
  ```json
  { "email": "hong@test.com", "password": "wrongpassword" }
  ```
- **기대 결과:**
  - HTTP 401
  - `error.code` = `"UNAUTHORIZED"`

---

### TC-AUTH-003 존재하지 않는 이메일로 로그인 실패
- **대상 API:** `POST /auth/login`
- **입력값:**
  ```json
  { "email": "nobody@test.com", "password": "password123" }
  ```
- **기대 결과:**
  - HTTP 401
  - `error.code` = `"UNAUTHORIZED"`

---

### TC-AUTH-004 이메일 형식 오류
- **대상 API:** `POST /auth/login`
- **입력값:**
  ```json
  { "email": "not-an-email", "password": "password123" }
  ```
- **기대 결과:**
  - HTTP 400
  - `error.code` = `"VALIDATION_ERROR"`

---

### TC-AUTH-005 토큰 없이 인증 필요 API 호출
- **대상 API:** `GET /reports`
- **입력값:** Authorization 헤더 없음
- **기대 결과:**
  - HTTP 401
  - `error.code` = `"UNAUTHORIZED"`

---

### TC-AUTH-006 만료된 토큰으로 API 호출
- **대상 API:** `GET /reports`
- **입력값:** 만료된 accessToken
- **기대 결과:**
  - HTTP 401
  - `error.code` = `"UNAUTHORIZED"`

---

### TC-AUTH-007 정상 로그아웃
- **대상 API:** `POST /auth/logout`
- **전제 조건:** 로그인 상태
- **기대 결과:**
  - HTTP 200
  - `success` = `true`

---

## 보고서

### TC-REPORT-001 보고서 정상 생성
- **대상 API:** `POST /reports`
- **전제 조건:** 영업사원 A 로그인, 오늘 날짜 보고서 없음
- **입력값:**
  ```json
  {
    "reportDate": "오늘 날짜",
    "visitRecords": [
      { "customerId": 1, "visitContent": "계약 논의", "visitTime": "10:00" }
    ],
    "currentIssues": "계약 검토 중",
    "tomorrowPlan": "견적서 제출"
  }
  ```
- **기대 결과:**
  - HTTP 201
  - `data.id` 존재 (숫자)

---

### TC-REPORT-002 같은 날 보고서 중복 생성 불가
- **대상 API:** `POST /reports`
- **전제 조건:** 영업사원 A의 오늘 날짜 보고서 이미 존재
- **입력값:** TC-REPORT-001과 동일
- **기대 결과:**
  - HTTP 409
  - `error.code` = `"CONFLICT"`

---

### TC-REPORT-003 방문기록 0건으로 생성 불가
- **대상 API:** `POST /reports`
- **입력값:**
  ```json
  {
    "reportDate": "오늘 날짜",
    "visitRecords": [],
    "currentIssues": "",
    "tomorrowPlan": ""
  }
  ```
- **기대 결과:**
  - HTTP 400
  - `error.code` = `"VALIDATION_ERROR"`

---

### TC-REPORT-004 존재하지 않는 고객 ID로 생성 불가
- **대상 API:** `POST /reports`
- **입력값:**
  ```json
  {
    "reportDate": "오늘 날짜",
    "visitRecords": [
      { "customerId": 99999, "visitContent": "방문", "visitTime": "10:00" }
    ]
  }
  ```
- **기대 결과:**
  - HTTP 400
  - `error.code` = `"VALIDATION_ERROR"`

---

### TC-REPORT-005 보고서 목록 조회 - 영업사원은 본인 것만
- **대상 API:** `GET /reports`
- **전제 조건:** 영업사원 A, B 각각 보고서 존재
- **실행:** 영업사원 A 토큰으로 조회
- **기대 결과:**
  - HTTP 200
  - 반환된 모든 항목의 `salesperson.id` = 영업사원 A ID

---

### TC-REPORT-006 보고서 목록 조회 - 상급자는 팀 전체 조회
- **대상 API:** `GET /reports`
- **전제 조건:** 영업사원 A, B 각각 보고서 존재. 상급자는 두 사람의 manager
- **실행:** 상급자 토큰으로 조회
- **기대 결과:**
  - HTTP 200
  - 영업사원 A, B 보고서 모두 포함

---

### TC-REPORT-007 상급자가 특정 영업사원 필터 조회
- **대상 API:** `GET /reports?salespersonId={A_ID}`
- **실행:** 상급자 토큰으로 조회
- **기대 결과:**
  - HTTP 200
  - 반환된 모든 항목의 `salesperson.id` = 영업사원 A ID

---

### TC-REPORT-008 기간 필터 조회
- **대상 API:** `GET /reports?startDate=2026-04-01&endDate=2026-04-10`
- **기대 결과:**
  - HTTP 200
  - 반환된 모든 항목의 `reportDate`가 해당 기간 내

---

### TC-REPORT-009 보고서 상세 조회 - 본인
- **대상 API:** `GET /reports/:id`
- **전제 조건:** 영업사원 A의 보고서 존재
- **실행:** 영업사원 A 토큰으로 조회
- **기대 결과:**
  - HTTP 200
  - `visitRecords`, `currentIssues`, `tomorrowPlan`, `comments` 포함

---

### TC-REPORT-010 보고서 상세 조회 - 타인 접근 불가 (영업사원)
- **대상 API:** `GET /reports/:id`
- **전제 조건:** 영업사원 B의 보고서
- **실행:** 영업사원 A 토큰으로 조회
- **기대 결과:**
  - HTTP 403
  - `error.code` = `"FORBIDDEN"`

---

### TC-REPORT-011 존재하지 않는 보고서 조회
- **대상 API:** `GET /reports/99999`
- **기대 결과:**
  - HTTP 404
  - `error.code` = `"NOT_FOUND"`

---

### TC-REPORT-012 보고서 정상 수정
- **대상 API:** `PUT /reports/:id`
- **전제 조건:** 영업사원 A의 오늘 날짜 보고서 존재
- **입력값:** 방문내용 변경
- **기대 결과:**
  - HTTP 200
  - `GET /reports/:id` 재조회 시 변경 내용 반영

---

### TC-REPORT-013 당일 보고서 아닌 경우 수정 불가
- **대상 API:** `PUT /reports/:id`
- **전제 조건:** 영업사원 A의 어제 날짜 보고서
- **기대 결과:**
  - HTTP 403
  - `error.code` = `"FORBIDDEN"`

---

### TC-REPORT-014 보고서 정상 삭제
- **대상 API:** `DELETE /reports/:id`
- **전제 조건:** 영업사원 A의 오늘 날짜 보고서 존재
- **기대 결과:**
  - HTTP 200
  - `GET /reports/:id` 재조회 시 HTTP 404

---

### TC-REPORT-015 당일 보고서 아닌 경우 삭제 불가
- **대상 API:** `DELETE /reports/:id`
- **전제 조건:** 영업사원 A의 어제 날짜 보고서
- **기대 결과:**
  - HTTP 403
  - `error.code` = `"FORBIDDEN"`

---

## 방문기록

### TC-VISIT-001 방문기록 단건 추가
- **대상 API:** `POST /reports/:reportId/visit-records`
- **전제 조건:** 영업사원 A의 오늘 날짜 보고서 존재
- **입력값:**
  ```json
  { "customerId": 2, "visitContent": "추가 방문", "visitTime": "16:00" }
  ```
- **기대 결과:**
  - HTTP 201
  - `data.id` 존재
  - 보고서 상세 조회 시 방문기록에 포함

---

### TC-VISIT-002 방문기록 단건 삭제
- **대상 API:** `DELETE /reports/:reportId/visit-records/:id`
- **전제 조건:** 방문기록 존재
- **기대 결과:**
  - HTTP 200
  - 보고서 상세 조회 시 해당 방문기록 미포함

---

### TC-VISIT-003 방문내용 빈 값으로 추가 불가
- **대상 API:** `POST /reports/:reportId/visit-records`
- **입력값:**
  ```json
  { "customerId": 1, "visitContent": "", "visitTime": "10:00" }
  ```
- **기대 결과:**
  - HTTP 400
  - `error.code` = `"VALIDATION_ERROR"`

---

### TC-VISIT-004 당일 보고서 아닌 경우 방문기록 추가 불가
- **대상 API:** `POST /reports/:reportId/visit-records`
- **전제 조건:** 어제 날짜 보고서
- **기대 결과:**
  - HTTP 403
  - `error.code` = `"FORBIDDEN"`

---

## 댓글

### TC-COMMENT-001 상급자가 댓글 정상 등록
- **대상 API:** `POST /reports/:reportId/comments`
- **전제 조건:** 상급자 로그인, 팀원의 보고서 존재
- **입력값:**
  ```json
  { "content": "확인했습니다. 계약 진행 바랍니다." }
  ```
- **기대 결과:**
  - HTTP 201
  - `data.commenter.id` = 상급자 ID
  - 보고서 상세 조회 시 댓글 포함

---

### TC-COMMENT-002 영업사원은 댓글 등록 불가
- **대상 API:** `POST /reports/:reportId/comments`
- **전제 조건:** 영업사원 A 로그인
- **기대 결과:**
  - HTTP 403
  - `error.code` = `"FORBIDDEN"`

---

### TC-COMMENT-003 댓글 내용 빈 값으로 등록 불가
- **대상 API:** `POST /reports/:reportId/comments`
- **전제 조건:** 상급자 로그인
- **입력값:**
  ```json
  { "content": "" }
  ```
- **기대 결과:**
  - HTTP 400
  - `error.code` = `"VALIDATION_ERROR"`

---

### TC-COMMENT-004 상급자가 본인 댓글 삭제
- **대상 API:** `DELETE /reports/:reportId/comments/:id`
- **전제 조건:** 상급자 본인이 작성한 댓글 존재
- **기대 결과:**
  - HTTP 200
  - 보고서 상세 조회 시 해당 댓글 미포함

---

### TC-COMMENT-005 타인 댓글 삭제 불가
- **대상 API:** `DELETE /reports/:reportId/comments/:id`
- **전제 조건:** 다른 상급자가 작성한 댓글
- **기대 결과:**
  - HTTP 403
  - `error.code` = `"FORBIDDEN"`

---

## 고객 마스터

### TC-CUSTOMER-001 고객 정상 등록
- **대상 API:** `POST /customers`
- **입력값:**
  ```json
  {
    "companyName": "(주)테스트상사",
    "contactName": "테스트담당",
    "phone": "02-9999-9999",
    "email": "test@test.co.kr",
    "address": "서울시 강남구",
    "industry": "IT"
  }
  ```
- **기대 결과:**
  - HTTP 201
  - `data.id` 존재
  - `GET /customers/:id` 조회 시 등록 데이터 일치

---

### TC-CUSTOMER-002 회사명 중복 등록 불가
- **대상 API:** `POST /customers`
- **전제 조건:** "(주)테스트상사" 이미 등록
- **입력값:** 동일 회사명
- **기대 결과:**
  - HTTP 409
  - `error.code` = `"CONFLICT"`

---

### TC-CUSTOMER-003 필수 항목 누락으로 등록 불가
- **대상 API:** `POST /customers`
- **입력값:** `companyName` 누락
- **기대 결과:**
  - HTTP 400
  - `error.code` = `"VALIDATION_ERROR"`

---

### TC-CUSTOMER-004 고객 목록 키워드 검색
- **대상 API:** `GET /customers?keyword=ABC`
- **전제 조건:** "(주)ABC상사" 등록
- **기대 결과:**
  - HTTP 200
  - 결과 목록에 "(주)ABC상사" 포함

---

### TC-CUSTOMER-005 고객 정보 수정
- **대상 API:** `PUT /customers/:id`
- **입력값:** `contactName` 변경
- **기대 결과:**
  - HTTP 200
  - `GET /customers/:id` 재조회 시 변경 내용 반영

---

### TC-CUSTOMER-006 존재하지 않는 고객 수정 불가
- **대상 API:** `PUT /customers/99999`
- **기대 결과:**
  - HTTP 404
  - `error.code` = `"NOT_FOUND"`

---

### TC-CUSTOMER-007 페이지네이션 동작 확인
- **대상 API:** `GET /customers?page=1&limit=5`
- **전제 조건:** 고객 10건 이상 등록
- **기대 결과:**
  - HTTP 200
  - `data.items` 길이 = 5
  - `data.totalPages` >= 2

---

## 영업사원 마스터

### TC-SALESPERSON-001 영업사원 정상 등록
- **대상 API:** `POST /salespeople`
- **전제 조건:** 상급자 로그인
- **입력값:**
  ```json
  {
    "name": "신입사원",
    "email": "new@test.com",
    "password": "password123",
    "department": "영업1팀",
    "position": "사원",
    "managerId": 3
  }
  ```
- **기대 결과:**
  - HTTP 201
  - `data.id` 존재

---

### TC-SALESPERSON-002 이메일 중복 등록 불가
- **대상 API:** `POST /salespeople`
- **전제 조건:** `hong@test.com` 이미 등록
- **입력값:** 동일 이메일
- **기대 결과:**
  - HTTP 409
  - `error.code` = `"CONFLICT"`

---

### TC-SALESPERSON-003 영업사원은 영업사원 등록 불가
- **대상 API:** `POST /salespeople`
- **전제 조건:** 영업사원 A 로그인
- **기대 결과:**
  - HTTP 403
  - `error.code` = `"FORBIDDEN"`

---

### TC-SALESPERSON-004 비밀번호 8자 미만으로 등록 불가
- **대상 API:** `POST /salespeople`
- **전제 조건:** 상급자 로그인
- **입력값:** `password` = `"1234567"` (7자)
- **기대 결과:**
  - HTTP 400
  - `error.code` = `"VALIDATION_ERROR"`

---

### TC-SALESPERSON-005 영업사원 정보 수정
- **대상 API:** `PUT /salespeople/:id`
- **전제 조건:** 상급자 로그인
- **입력값:** `department` 변경
- **기대 결과:**
  - HTTP 200
  - `GET /salespeople/:id` 재조회 시 변경 내용 반영

---

### TC-SALESPERSON-006 영업사원 목록 조회 - 영업사원은 접근 불가
- **대상 API:** `GET /salespeople`
- **전제 조건:** 영업사원 A 로그인
- **기대 결과:**
  - HTTP 403
  - `error.code` = `"FORBIDDEN"`

---

## 권한 공통

### TC-AUTH-PERM-001 영업사원이 타인 보고서 수정 불가
- **대상 API:** `PUT /reports/:id`
- **전제 조건:** 영업사원 B의 보고서
- **실행:** 영업사원 A 토큰으로 요청
- **기대 결과:** HTTP 403

---

### TC-AUTH-PERM-002 영업사원이 타인 보고서 삭제 불가
- **대상 API:** `DELETE /reports/:id`
- **전제 조건:** 영업사원 B의 보고서
- **실행:** 영업사원 A 토큰으로 요청
- **기대 결과:** HTTP 403

---

### TC-AUTH-PERM-003 상급자가 팀 외 영업사원 보고서 접근 불가
- **대상 API:** `GET /reports/:id`
- **전제 조건:** 다른 팀 영업사원의 보고서
- **실행:** 상급자 토큰으로 요청
- **기대 결과:** HTTP 403

---

## 통합 시나리오

### TS-001 영업사원 일일보고 전체 흐름

| 순서 | 동작 | 기대 결과 |
|------|------|-----------|
| 1 | 영업사원 A 로그인 | accessToken 발급 |
| 2 | `POST /reports` 보고서 생성 (방문 2건) | 201, report.id 반환 |
| 3 | `GET /reports/:id` 상세 조회 | 방문기록 2건 포함 |
| 4 | `POST /reports/:id/visit-records` 방문기록 1건 추가 | 201 |
| 5 | `GET /reports/:id` 재조회 | 방문기록 3건 |
| 6 | `PUT /reports/:id` 내일 할 일 수정 | 200 |
| 7 | `GET /reports/:id` 재조회 | 수정된 내일 할 일 반영 |

---

### TS-002 상급자 보고서 확인 및 댓글 흐름

| 순서 | 동작 | 기대 결과 |
|------|------|-----------|
| 1 | 상급자 로그인 | accessToken 발급 |
| 2 | `GET /reports` 팀 전체 보고서 목록 조회 | 팀원 보고서 포함 |
| 3 | `GET /reports/:id` 특정 보고서 상세 조회 | 정상 조회 |
| 4 | `POST /reports/:id/comments` 댓글 등록 | 201 |
| 5 | `GET /reports/:id` 재조회 | 댓글 포함 확인 |
| 6 | `DELETE /reports/:id/comments/:commentId` 댓글 삭제 | 200 |
| 7 | `GET /reports/:id` 재조회 | 댓글 미포함 확인 |

---

## 테스트 케이스 요약

| 도메인 | 테스트 케이스 수 |
|--------|----------------|
| 인증 (TC-AUTH) | 7개 |
| 보고서 (TC-REPORT) | 15개 |
| 방문기록 (TC-VISIT) | 4개 |
| 댓글 (TC-COMMENT) | 5개 |
| 고객 마스터 (TC-CUSTOMER) | 7개 |
| 영업사원 마스터 (TC-SALESPERSON) | 6개 |
| 권한 공통 (TC-AUTH-PERM) | 3개 |
| 통합 시나리오 (TS) | 2개 |
| **합계** | **49개** |
