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
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">보고서 목록</h2>
        {!user?.isManager && (
          <button
            onClick={() => router.push("/reports/new")}
            disabled={todayReportExists}
            className="bg-blue-700 text-white px-4 py-2 rounded text-sm hover:bg-blue-800 disabled:opacity-40"
          >
            + 새 보고서 작성
          </button>
        )}
      </div>

      <div className="bg-white rounded shadow p-4 mb-4 flex flex-wrap gap-3 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">시작일</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">종료일</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="border rounded px-2 py-1 text-sm" />
        </div>
        <button onClick={() => { setPage(1); load(); }}
          className="bg-gray-100 px-3 py-1 rounded text-sm border hover:bg-gray-200">검색</button>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">날짜</th>
              {user?.isManager && <th className="text-left px-4 py-3 font-medium text-gray-600">영업사원</th>}
              <th className="text-center px-4 py-3 font-medium text-gray-600">방문건수</th>
              <th className="text-center px-4 py-3 font-medium text-gray-600">댓글수</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {reports.length === 0 && (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400">보고서가 없습니다.</td></tr>
            )}
            {reports.map((r) => (
              <tr key={r.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{r.reportDate}</td>
                {user?.isManager && <td className="px-4 py-3">{r.salesperson.name}</td>}
                <td className="px-4 py-3 text-center">{r.visitCount}건</td>
                <td className="px-4 py-3 text-center">{r.commentCount}건</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/reports/${r.id}`} className="text-blue-600 hover:underline text-xs">상세보기</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`px-3 py-1 rounded text-sm border ${p === page ? "bg-blue-700 text-white border-blue-700" : "bg-white hover:bg-gray-50"}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
