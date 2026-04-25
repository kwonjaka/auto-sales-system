# 영업일일보고 시스템

**작성일:** 2026-04-25  
**버전:** 1.0

---

## 프로젝트 개요

영업사원이 당일 방문한 고객과 방문내용을 보고하고, 상급자가 댓글로 피드백을 남기는 영업일일보고 시스템.

---

## 목차

1. [화면정의서](#화면정의서)
2. [API 명세서](#api-명세서)
3. [테스트 명세서](#테스트-명세서)

---

# 화면정의서

> 상세 내용: `docs/screen-definition.md`

## 화면 목록

| 화면ID | 화면명 | URL | 접근 권한 |
|--------|--------|-----|-----------|
| SCR-01 | 로그인 | `/login` | 전체 |
| SCR-02 | 보고서 목록 | `/reports` | 영업사원, 상급자 |
| SCR-03 | 보고서 작성 | `/reports/new` | 영업사원 |
| SCR-04 | 보고서 상세 | `/reports/:id` | 영업사원, 상급자 |
| SCR-05 | 고객 마스터 목록 | `/customers` | 영업사원, 상급자 |
| SCR-06 | 고객 마스터 등록/수정 | `/customers/new`, `/customers/:id/edit` | 영업사원, 상급자 |
| SCR-07 | 영업사원 마스터 목록 | `/salespeople` | 상급자 |
| SCR-08 | 영업사원 마스터 등록/수정 | `/salespeople/new`, `/salespeople/:id/edit` | 상급자 |

## 핵심 화면 요약

### SCR-03 보고서 작성
- 방문기록(고객 선택 + 방문내용)을 여러 행 추가/삭제 가능 (최대 20행)
- 현재 과제/상담, 내일 할 일을 자유 텍스트로 입력
- 하루 1건만 작성 가능

### SCR-04 보고서 상세
- 방문기록 목록, 현재 과제/상담, 내일 할 일 조회
- 상급자만 댓글 입력 가능
- 본인(당일)만 수정/삭제 가능

### 공통 에러 메시지 규칙

| 상황 | 메시지 |
|------|--------|
| 필수 항목 미입력 | "{항목명}을(를) 입력해주세요." |
| 형식 오류 | "{항목명} 형식이 올바르지 않습니다." |
| 중복 오류 | "이미 등록된 {항목명}입니다." |
| 권한 없음 | "접근 권한이 없습니다." |
| 서버 오류 | "오류가 발생했습니다. 잠시 후 다시 시도해주세요." |

---

# API 명세서

> 상세 내용: `docs/api-specification.md`  
> **Base URL:** `/api/v1`

## 공통 규격

**요청 헤더**

| 헤더 | 필수 | 설명 |
|------|------|------|
| `Content-Type` | Y | `application/json` |
| `Authorization` | Y (로그인 제외) | `Bearer {accessToken}` |

**공통 응답 형식**
```json
{
  "success": true,
  "data": { },
  "error": null
}
```

**에러 코드**

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `VALIDATION_ERROR` | 400 | 입력값 유효성 오류 |
| `UNAUTHORIZED` | 401 | 인증 토큰 없음 또는 만료 |
| `FORBIDDEN` | 403 | 접근 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `CONFLICT` | 409 | 중복 데이터 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

## API 목록

| 메서드 | 경로 | 설명 | 권한 |
|--------|------|------|------|
| POST | `/auth/login` | 로그인 | 전체 |
| POST | `/auth/logout` | 로그아웃 | 전체 |
| GET | `/reports` | 보고서 목록 | 영업사원·상급자 |
| GET | `/reports/:id` | 보고서 상세 | 영업사원·상급자 |
| POST | `/reports` | 보고서 생성 | 영업사원 |
| PUT | `/reports/:id` | 보고서 수정 | 영업사원(본인·당일) |
| DELETE | `/reports/:id` | 보고서 삭제 | 영업사원(본인·당일) |
| POST | `/reports/:reportId/visit-records` | 방문기록 추가 | 영업사원(본인·당일) |
| DELETE | `/reports/:reportId/visit-records/:id` | 방문기록 삭제 | 영업사원(본인·당일) |
| POST | `/reports/:reportId/comments` | 댓글 등록 | 상급자 |
| DELETE | `/reports/:reportId/comments/:id` | 댓글 삭제 | 상급자(본인) |
| GET | `/customers` | 고객 목록 | 영업사원·상급자 |
| GET | `/customers/:id` | 고객 상세 | 영업사원·상급자 |
| POST | `/customers` | 고객 등록 | 영업사원·상급자 |
| PUT | `/customers/:id` | 고객 수정 | 영업사원·상급자 |
| GET | `/salespeople` | 영업사원 목록 | 상급자 |
| GET | `/salespeople/:id` | 영업사원 상세 | 상급자 |
| POST | `/salespeople` | 영업사원 등록 | 상급자 |
| PUT | `/salespeople/:id` | 영업사원 수정 | 상급자 |

## 주요 비즈니스 규칙

- 보고서는 **1인 1일 1건** — 중복 생성 시 `409 CONFLICT`
- 방문기록은 **1건 이상** 필수 — 0건 저장 시 `400 VALIDATION_ERROR`
- 보고서 수정/삭제는 **본인, 당일**만 가능
- 댓글은 **상급자만** 작성 가능

---

# 테스트 명세서

> 상세 내용: `docs/test-specification.md`

## 테스트 전략

| 구분 | 내용 |
|------|------|
| 단위 테스트 | 각 API 엔드포인트의 정상/비정상 케이스 |
| 통합 테스트 | 보고서 작성 → 상세 조회 → 댓글 등록 전체 흐름 |
| 권한 테스트 | 영업사원 / 상급자 / 비인증 사용자 접근 제어 |
| 경계값 테스트 | 입력 최대 길이, 방문기록 0건/최대건 |

## 공통 픽스처

| 역할 | 이름 | 이메일 |
|------|------|--------|
| 영업사원 A | 홍길동 | hong@test.com |
| 영업사원 B | 김영업 | kim@test.com |
| 상급자 | 이상사 | lee@test.com |
| 고객 A | (주)ABC상사 | - |
| 고객 B | DEF전자 | - |

## 테스트 케이스 요약

| 도메인 | TC ID 범위 | 케이스 수 |
|--------|-----------|----------|
| 인증 | TC-AUTH-001 ~ 007 | 7개 |
| 보고서 | TC-REPORT-001 ~ 015 | 15개 |
| 방문기록 | TC-VISIT-001 ~ 004 | 4개 |
| 댓글 | TC-COMMENT-001 ~ 005 | 5개 |
| 고객 마스터 | TC-CUSTOMER-001 ~ 007 | 7개 |
| 영업사원 마스터 | TC-SALESPERSON-001 ~ 006 | 6개 |
| 권한 공통 | TC-AUTH-PERM-001 ~ 003 | 3개 |
| 통합 시나리오 | TS-001 ~ 002 | 2개 |
| **합계** | | **49개** |

## 통합 시나리오 요약

### TS-001 영업사원 일일보고 전체 흐름

| 순서 | 동작 | 기대 결과 |
|------|------|-----------|
| 1 | 영업사원 A 로그인 | accessToken 발급 |
| 2 | `POST /reports` 보고서 생성 (방문 2건) | 201, report.id 반환 |
| 3 | `GET /reports/:id` 상세 조회 | 방문기록 2건 포함 |
| 4 | `POST /reports/:id/visit-records` 방문기록 추가 | 201 |
| 5 | `GET /reports/:id` 재조회 | 방문기록 3건 |
| 6 | `PUT /reports/:id` 내일 할 일 수정 | 200 |
| 7 | `GET /reports/:id` 재조회 | 수정된 내일 할 일 반영 |

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

## 문서 구조

```
auto-sales-system/
├── CLAUDE.md                        # 프로젝트 전체 명세 요약 (이 파일)
└── docs/
    ├── screen-definition.md         # 화면정의서 (전체)
    ├── api-specification.md         # API 명세서 (전체)
    └── test-specification.md        # 테스트 명세서 (전체)
```
