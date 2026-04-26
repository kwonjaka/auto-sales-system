# 영업일일보고 시스템

영업사원이 당일 방문한 고객과 방문내용을 보고하고, 상급자가 댓글로 피드백을 남기는 시스템입니다.

## 기술 스택

- **Frontend/Backend**: Next.js 15 (App Router)
- **Database**: Prisma + SQLite (개발) / PostgreSQL (프로덕션)
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Style**: Tailwind CSS
- **Test**: Jest + MSW

## 시작하기

```bash
# 1. 의존성 설치
npm install

# 2. 환경 변수 설정
cp .env.example .env
# .env 파일의 JWT_SECRET을 안전한 값으로 변경

# 3. DB 마이그레이션 및 시드 데이터 생성
npx prisma migrate dev
npx prisma db seed

# 4. 개발 서버 실행
npm run dev
```

브라우저에서 http://localhost:3000 접속

## 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 상급자 | manager@company.com | password123 |
| 영업사원 A | hong@company.com | password123 |
| 영업사원 B | kim@company.com | password123 |

## 명령어

```bash
npm run dev      # 개발 서버
npm run build    # 프로덕션 빌드
npm run lint     # ESLint 검사
npm test         # Jest 테스트
```

## 문서

- [화면정의서](docs/screen-definition.md)
- [API 명세서](docs/api-specification.md)
- [테스트 명세서](docs/test-specification.md)
