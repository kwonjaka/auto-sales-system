import { rest } from "msw";

const BASE = "http://localhost/api/v1";

export const handlers = [
  // 인증
  rest.post(`${BASE}/auth/login`, (_, res, ctx) =>
    res(
      ctx.json({
        success: true,
        data: {
          accessToken: "mock-token",
          salesperson: { id: 1, name: "홍길동", email: "hong@test.com", isManager: false },
        },
      })
    )
  ),

  rest.post(`${BASE}/auth/logout`, (_, res, ctx) =>
    res(ctx.json({ success: true, data: null }))
  ),

  // 보고서
  rest.get(`${BASE}/reports`, (_, res, ctx) =>
    res(
      ctx.json({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      })
    )
  ),

  rest.get(`${BASE}/reports/:id`, (_, res, ctx) =>
    res(
      ctx.json({
        success: true,
        data: {
          id: 1,
          reportDate: "2026-04-25",
          salesperson: { id: 1, name: "홍길동", department: "영업1팀" },
          visitRecords: [],
          currentIssues: "",
          tomorrowPlan: "",
          comments: [],
          createdAt: "2026-04-25T09:00:00Z",
          updatedAt: "2026-04-25T09:00:00Z",
        },
      })
    )
  ),

  rest.post(`${BASE}/reports`, (_, res, ctx) =>
    res(ctx.status(201), ctx.json({ success: true, data: { id: 1 } }))
  ),

  rest.put(`${BASE}/reports/:id`, (_, res, ctx) =>
    res(ctx.json({ success: true, data: { id: 1 } }))
  ),

  rest.delete(`${BASE}/reports/:id`, (_, res, ctx) =>
    res(ctx.json({ success: true, data: null }))
  ),

  // 방문기록
  rest.post(`${BASE}/reports/:reportId/visit-records`, (_, res, ctx) =>
    res(ctx.status(201), ctx.json({ success: true, data: { id: 100 } }))
  ),

  rest.delete(`${BASE}/reports/:reportId/visit-records/:id`, (_, res, ctx) =>
    res(ctx.json({ success: true, data: null }))
  ),

  // 댓글
  rest.post(`${BASE}/reports/:reportId/comments`, (_, res, ctx) =>
    res(
      ctx.status(201),
      ctx.json({
        success: true,
        data: {
          id: 1,
          commenter: { id: 2, name: "김상사" },
          content: "mock comment",
          createdAt: "2026-04-25T18:00:00Z",
        },
      })
    )
  ),

  rest.delete(`${BASE}/reports/:reportId/comments/:id`, (_, res, ctx) =>
    res(ctx.json({ success: true, data: null }))
  ),

  // 고객 마스터
  rest.get(`${BASE}/customers`, (_, res, ctx) =>
    res(
      ctx.json({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      })
    )
  ),

  rest.get(`${BASE}/customers/:id`, (_, res, ctx) =>
    res(
      ctx.json({
        success: true,
        data: {
          id: 1,
          companyName: "(주)ABC상사",
          contactName: "이철수",
          phone: "02-1234-5678",
          email: "lee@abc.co.kr",
          address: "서울시 강남구",
          industry: "제조업",
        },
      })
    )
  ),

  rest.post(`${BASE}/customers`, (_, res, ctx) =>
    res(ctx.status(201), ctx.json({ success: true, data: { id: 1 } }))
  ),

  rest.put(`${BASE}/customers/:id`, (_, res, ctx) =>
    res(ctx.json({ success: true, data: { id: 1 } }))
  ),

  // 영업사원 마스터
  rest.get(`${BASE}/salespeople`, (_, res, ctx) =>
    res(
      ctx.json({
        success: true,
        data: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
      })
    )
  ),

  rest.post(`${BASE}/salespeople`, (_, res, ctx) =>
    res(ctx.status(201), ctx.json({ success: true, data: { id: 1 } }))
  ),

  rest.put(`${BASE}/salespeople/:id`, (_, res, ctx) =>
    res(ctx.json({ success: true, data: { id: 1 } }))
  ),
];
