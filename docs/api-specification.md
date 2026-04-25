# 영업일일보고 시스템 API 명세서

**작성일:** 2026-04-25  
**버전:** 1.0  
**Base URL:** `/api/v1`

---

## 목차

1. [공통 규격](#공통-규격)
2. [인증 API](#인증-api)
3. [보고서 API](#보고서-api)
4. [방문기록 API](#방문기록-api)
5. [댓글 API](#댓글-api)
6. [고객 마스터 API](#고객-마스터-api)
7. [영업사원 마스터 API](#영업사원-마스터-api)

---

## 공통 규격

### 요청 헤더

| 헤더 | 필수 | 설명 |
|------|------|------|
| `Content-Type` | Y | `application/json` |
| `Authorization` | Y (로그인 제외) | `Bearer {accessToken}` |

### 공통 응답 형식

```json
{
  "success": true,
  "data": { },
  "error": null
}
```

### 에러 응답 형식

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "이메일 형식이 올바르지 않습니다."
  }
}
```

### 에러 코드

| 코드 | HTTP Status | 설명 |
|------|-------------|------|
| `VALIDATION_ERROR` | 400 | 입력값 유효성 오류 |
| `UNAUTHORIZED` | 401 | 인증 토큰 없음 또는 만료 |
| `FORBIDDEN` | 403 | 접근 권한 없음 |
| `NOT_FOUND` | 404 | 리소스 없음 |
| `CONFLICT` | 409 | 중복 데이터 |
| `INTERNAL_ERROR` | 500 | 서버 내부 오류 |

### 페이지네이션 (목록 API 공통)

**요청 파라미터**

| 파라미터 | 타입 | 기본값 | 설명 |
|----------|------|--------|------|
| `page` | number | 1 | 페이지 번호 |
| `limit` | number | 20 | 페이지당 항목 수 |

**응답 형식**

```json
{
  "success": true,
  "data": {
    "items": [],
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

---

## 인증 API

### POST /auth/login
로그인

**요청**
```json
{
  "email": "hong@example.com",
  "password": "password123"
}
```

**응답 200**
```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGci...",
    "salesperson": {
      "id": 1,
      "name": "홍길동",
      "email": "hong@example.com",
      "department": "영업1팀",
      "position": "사원",
      "isManager": false
    }
  }
}
```

**에러**

| 상황 | 코드 | 메시지 |
|------|------|--------|
| 이메일/비밀번호 불일치 | `UNAUTHORIZED` | 이메일 또는 비밀번호가 올바르지 않습니다. |

---

### POST /auth/logout
로그아웃

**응답 200**
```json
{
  "success": true,
  "data": null
}
```

---

## 보고서 API

### GET /reports
보고서 목록 조회

**권한:** 영업사원(본인), 상급자(팀 전체)

**쿼리 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `startDate` | string (YYYY-MM-DD) | N | 기간 시작 (기본: 당월 1일) |
| `endDate` | string (YYYY-MM-DD) | N | 기간 종료 (기본: 오늘) |
| `salespersonId` | number | N | 영업사원 ID (상급자만 사용 가능) |
| `page` | number | N | 페이지 번호 |
| `limit` | number | N | 페이지당 항목 수 |

**응답 200**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 10,
        "reportDate": "2026-04-25",
        "salesperson": {
          "id": 1,
          "name": "홍길동"
        },
        "visitCount": 3,
        "commentCount": 1,
        "createdAt": "2026-04-25T17:30:00Z"
      }
    ],
    "total": 30,
    "page": 1,
    "limit": 20,
    "totalPages": 2
  }
}
```

---

### GET /reports/:id
보고서 상세 조회

**권한:** 영업사원(본인), 상급자(팀 전체)

**응답 200**
```json
{
  "success": true,
  "data": {
    "id": 10,
    "reportDate": "2026-04-25",
    "salesperson": {
      "id": 1,
      "name": "홍길동",
      "department": "영업1팀"
    },
    "visitRecords": [
      {
        "id": 101,
        "customer": {
          "id": 5,
          "companyName": "(주)ABC상사",
          "contactName": "이철수"
        },
        "visitContent": "신규 계약 논의",
        "visitTime": "10:30"
      }
    ],
    "currentIssues": "ABC상사 계약 조건 협의 중.",
    "tomorrowPlan": "GHI물산 방문 및 견적서 제출",
    "comments": [
      {
        "id": 201,
        "commenter": {
          "id": 2,
          "name": "김상사"
        },
        "content": "ABC상사 계약 관련 본부장 보고 필요.",
        "createdAt": "2026-04-25T18:30:00Z"
      }
    ],
    "createdAt": "2026-04-25T17:30:00Z",
    "updatedAt": "2026-04-25T17:30:00Z"
  }
}
```

**에러**

| 상황 | 코드 |
|------|------|
| 보고서 없음 | `NOT_FOUND` |
| 타인 보고서 접근 (영업사원) | `FORBIDDEN` |

---

### POST /reports
보고서 생성

**권한:** 영업사원

**요청**
```json
{
  "reportDate": "2026-04-25",
  "visitRecords": [
    {
      "customerId": 5,
      "visitContent": "신규 계약 논의",
      "visitTime": "10:30"
    },
    {
      "customerId": 8,
      "visitContent": "클레임 대응 방문",
      "visitTime": "14:00"
    }
  ],
  "currentIssues": "ABC상사 계약 조건 협의 중.",
  "tomorrowPlan": "GHI물산 방문 및 견적서 제출"
}
```

**응답 201**
```json
{
  "success": true,
  "data": {
    "id": 10
  }
}
```

**에러**

| 상황 | 코드 | 메시지 |
|------|------|--------|
| 해당 날짜 보고서 이미 존재 | `CONFLICT` | 해당 날짜의 보고서가 이미 존재합니다. |
| 방문기록 0건 | `VALIDATION_ERROR` | 방문기록을 1건 이상 입력해주세요. |
| 존재하지 않는 고객 ID | `VALIDATION_ERROR` | 유효하지 않은 고객입니다. |

---

### PUT /reports/:id
보고서 수정

**권한:** 영업사원(본인, 당일만)

**요청** *(POST /reports 와 동일)*

**응답 200**
```json
{
  "success": true,
  "data": {
    "id": 10
  }
}
```

**에러**

| 상황 | 코드 | 메시지 |
|------|------|--------|
| 보고서 없음 | `NOT_FOUND` | - |
| 타인 보고서 | `FORBIDDEN` | - |
| 당일 보고서 아님 | `FORBIDDEN` | 당일 보고서만 수정할 수 있습니다. |

---

### DELETE /reports/:id
보고서 삭제

**권한:** 영업사원(본인, 당일만)

**응답 200**
```json
{
  "success": true,
  "data": null
}
```

**에러**

| 상황 | 코드 | 메시지 |
|------|------|--------|
| 보고서 없음 | `NOT_FOUND` | - |
| 타인 보고서 | `FORBIDDEN` | - |
| 당일 보고서 아님 | `FORBIDDEN` | 당일 보고서만 삭제할 수 있습니다. |

---

## 방문기록 API

> 방문기록은 보고서 생성/수정 시 함께 처리하는 것을 원칙으로 한다.  
> 개별 추가/삭제가 필요한 경우 아래 API를 사용한다.

### POST /reports/:reportId/visit-records
방문기록 단건 추가

**권한:** 영업사원(본인, 당일만)

**요청**
```json
{
  "customerId": 5,
  "visitContent": "추가 방문 내용",
  "visitTime": "16:00"
}
```

**응답 201**
```json
{
  "success": true,
  "data": {
    "id": 105
  }
}
```

---

### DELETE /reports/:reportId/visit-records/:id
방문기록 단건 삭제

**권한:** 영업사원(본인, 당일만)

**응답 200**
```json
{
  "success": true,
  "data": null
}
```

---

## 댓글 API

### POST /reports/:reportId/comments
댓글 등록

**권한:** 상급자만

**요청**
```json
{
  "content": "ABC상사 계약 관련 본부장 보고 필요. 확인 바람."
}
```

**응답 201**
```json
{
  "success": true,
  "data": {
    "id": 201,
    "commenter": {
      "id": 2,
      "name": "김상사"
    },
    "content": "ABC상사 계약 관련 본부장 보고 필요. 확인 바람.",
    "createdAt": "2026-04-25T18:30:00Z"
  }
}
```

**에러**

| 상황 | 코드 | 메시지 |
|------|------|--------|
| 상급자 아님 | `FORBIDDEN` | 댓글은 상급자만 작성할 수 있습니다. |
| 보고서 없음 | `NOT_FOUND` | - |

---

### DELETE /reports/:reportId/comments/:id
댓글 삭제

**권한:** 상급자(본인 댓글만)

**응답 200**
```json
{
  "success": true,
  "data": null
}
```

---

## 고객 마스터 API

### GET /customers
고객 목록 조회

**권한:** 영업사원, 상급자

**쿼리 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `keyword` | string | N | 회사명 또는 담당자명 부분 검색 |
| `page` | number | N | 페이지 번호 |
| `limit` | number | N | 페이지당 항목 수 |

**응답 200**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 5,
        "companyName": "(주)ABC상사",
        "contactName": "이철수",
        "phone": "02-1234-5678",
        "email": "lee@abc.co.kr",
        "industry": "제조업"
      }
    ],
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

---

### GET /customers/:id
고객 상세 조회

**응답 200**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "companyName": "(주)ABC상사",
    "contactName": "이철수",
    "phone": "02-1234-5678",
    "email": "lee@abc.co.kr",
    "address": "서울시 강남구 테헤란로 123",
    "industry": "제조업"
  }
}
```

---

### POST /customers
고객 등록

**권한:** 영업사원, 상급자

**요청**
```json
{
  "companyName": "(주)ABC상사",
  "contactName": "이철수",
  "phone": "02-1234-5678",
  "email": "lee@abc.co.kr",
  "address": "서울시 강남구 테헤란로 123",
  "industry": "제조업"
}
```

**응답 201**
```json
{
  "success": true,
  "data": {
    "id": 5
  }
}
```

**에러**

| 상황 | 코드 | 메시지 |
|------|------|--------|
| 회사명 중복 | `CONFLICT` | 이미 등록된 회사명입니다. |

---

### PUT /customers/:id
고객 수정

**권한:** 영업사원, 상급자

**요청** *(POST /customers 와 동일)*

**응답 200**
```json
{
  "success": true,
  "data": {
    "id": 5
  }
}
```

---

## 영업사원 마스터 API

### GET /salespeople
영업사원 목록 조회

**권한:** 상급자

**쿼리 파라미터**

| 파라미터 | 타입 | 필수 | 설명 |
|----------|------|------|------|
| `keyword` | string | N | 이름 부분 검색 |
| `page` | number | N | 페이지 번호 |
| `limit` | number | N | 페이지당 항목 수 |

**응답 200**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "홍길동",
        "email": "hong@example.com",
        "department": "영업1팀",
        "position": "사원",
        "manager": {
          "id": 2,
          "name": "김상사"
        }
      }
    ],
    "total": 10,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

### GET /salespeople/:id
영업사원 상세 조회

**권한:** 상급자

**응답 200**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "name": "홍길동",
    "email": "hong@example.com",
    "department": "영업1팀",
    "position": "사원",
    "manager": {
      "id": 2,
      "name": "김상사"
    }
  }
}
```

---

### POST /salespeople
영업사원 등록

**권한:** 상급자

**요청**
```json
{
  "name": "홍길동",
  "email": "hong@example.com",
  "password": "password123",
  "department": "영업1팀",
  "position": "사원",
  "managerId": 2
}
```

**응답 201**
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```

**에러**

| 상황 | 코드 | 메시지 |
|------|------|--------|
| 이메일 중복 | `CONFLICT` | 이미 등록된 이메일입니다. |

---

### PUT /salespeople/:id
영업사원 수정

**권한:** 상급자

**요청** *(password 제외하고 POST /salespeople 와 동일, password는 선택)*

**응답 200**
```json
{
  "success": true,
  "data": {
    "id": 1
  }
}
```

---

## API 목록 요약

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
