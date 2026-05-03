"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import AppLayout from "@/components/Layout";
import { type AuthUser, authHeaders, getUser } from "@/lib/client-auth";

interface ReportItem {
  id: number;
  reportDate: string;
  salesperson: { id: number; name: string };
  visitCount: number;
  commentCount: number;
}

export default function ReportsPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [todayReportExists, setTodayReportExists] = useState(false);

  const limit = 20;

  const load = useCallback(async () => {
    const params = new URLSearchParams({ startDate, endDate, page: String(page), limit: String(limit) });
    const res = await fetch(`/api/v1/reports?${params}`, { headers: authHeaders() });
    const json = await res.json();
    if (!json.success) return;
    setReports(json.data.items);
    setTotal(json.data.total);
    const today = new Date().toISOString().split("T")[0];
    const u = getUser();
    setTodayReportExists(json.data.items.some(
      (r: ReportItem) => r.reportDate === today && r.salesperson.id === u?.id
    ));
  }, [startDate, endDate, page]);

  useEffect(() => { setUser(getUser()); }, []);
  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">보고서 목록</h1>
          <p className="page-sub">총 {total}건의 보고서</p>
        </div>
        {!user?.isManager && (
          <button
            onClick={() => router.push("/reports/new")}
            disabled={todayReportExists}
            className="btn btn-primary"
            title={todayReportExists ? "오늘 보고서가 이미 작성되었습니다" : ""}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            새 보고서 작성
          </button>
        )}
      </div>

      {/* Filter */}
      <div className="card mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">시작일</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="form-input"
              style={{ width: "160px" }}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">종료일</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="form-input"
              style={{ width: "160px" }}
            />
          </div>
          <button onClick={() => { setPage(1); load(); }} className="btn btn-ghost">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            검색
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>날짜</th>
              {user?.isManager && <th>영업사원</th>}
              <th style={{ textAlign: "center" }}>방문건수</th>
              <th style={{ textAlign: "center" }}>댓글수</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {reports.length === 0 && (
              <tr>
                <td colSpan={user?.isManager ? 5 : 4} style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                    </svg>
                    <p>보고서가 없습니다.</p>
                  </div>
                </td>
              </tr>
            )}
            {reports.map((r) => (
              <tr key={r.id}>
                <td>
                  <span className="font-semibold text-slate-700">{r.reportDate}</span>
                </td>
                {user?.isManager && (
                  <td>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                      >
                        {r.salesperson.name.slice(0, 1)}
                      </div>
                      {r.salesperson.name}
                    </div>
                  </td>
                )}
                <td style={{ textAlign: "center" }}>
                  <span className="badge badge-purple">{r.visitCount}건</span>
                </td>
                <td style={{ textAlign: "center" }}>
                  {r.commentCount > 0
                    ? <span className="badge badge-blue">{r.commentCount}건</span>
                    : <span style={{ color: "#cbd5e1", fontSize: "13px" }}>-</span>}
                </td>
                <td style={{ textAlign: "right" }}>
                  <Link href={`/reports/${r.id}`} className="btn btn-ghost btn-sm">
                    상세보기
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`btn btn-sm ${p === page ? "btn-primary" : "btn-ghost"}`}
              style={{ minWidth: "36px" }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
