"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import AppLayout from "@/components/Layout";
import { authHeaders } from "@/lib/client-auth";

interface Customer { id: number; companyName: string; contactName: string; phone?: string }

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const limit = 20;

  const load = useCallback(async () => {
    const params = new URLSearchParams({ keyword: search, page: String(page), limit: String(limit) });
    const res = await fetch(`/api/v1/customers?${params}`, { headers: authHeaders() });
    const json = await res.json();
    if (json.success) { setCustomers(json.data.items); setTotal(json.data.total); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">고객 마스터</h1>
          <p className="page-sub">총 {total}개 고객사</p>
        </div>
        <Link href="/customers/new" className="btn btn-primary">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          고객 등록
        </Link>
      </div>

      {/* Search */}
      <div className="card mb-6">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2"
              style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)" }}
            >
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="회사명 또는 담당자명 검색"
              className="form-input"
              style={{ paddingLeft: "40px" }}
              onKeyDown={(e) => e.key === "Enter" && (setSearch(keyword), setPage(1))}
            />
          </div>
          <button onClick={() => { setSearch(keyword); setPage(1); }} className="btn btn-ghost">
            검색
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="card p-0 overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>회사명</th>
              <th>담당자명</th>
              <th>전화번호</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {customers.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "48px", color: "#94a3b8" }}>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    <p>등록된 고객이 없습니다.</p>
                  </div>
                </td>
              </tr>
            )}
            {customers.map((c) => (
              <tr key={c.id}>
                <td>
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: "linear-gradient(135deg, #06b6d4, #3b82f6)" }}
                    >
                      {c.companyName.slice(0, 1)}
                    </div>
                    <span className="font-semibold text-slate-700">{c.companyName}</span>
                  </div>
                </td>
                <td className="text-slate-600">{c.contactName}</td>
                <td>
                  {c.phone
                    ? <span className="badge badge-blue">{c.phone}</span>
                    : <span style={{ color: "#cbd5e1" }}>-</span>}
                </td>
                <td style={{ textAlign: "right" }}>
                  <Link href={`/customers/${c.id}/edit`} className="btn btn-ghost btn-sm">
                    수정
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)} className={`btn btn-sm ${p === page ? "btn-primary" : "btn-ghost"}`} style={{ minWidth: "36px" }}>
              {p}
            </button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
