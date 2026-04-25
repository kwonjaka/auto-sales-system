"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import AppLayout from "@/components/Layout";
import { authHeaders } from "@/lib/client-auth";

interface Salesperson { id: number; name: string; department?: string; position?: string; manager?: { name: string } }

export default function SalespersonPage() {
  const [list, setList] = useState<Salesperson[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const limit = 20;

  const load = useCallback(async () => {
    const params = new URLSearchParams({ keyword: search, page: String(page), limit: String(limit) });
    const res = await fetch(`/api/v1/salespeople?${params}`, { headers: authHeaders() });
    const json = await res.json();
    if (json.success) { setList(json.data.items); setTotal(json.data.total); }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  const totalPages = Math.ceil(total / limit);

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">영업사원 마스터</h2>
        <Link href="/salespeople/new" className="bg-blue-700 text-white px-4 py-2 rounded text-sm hover:bg-blue-800">+ 사원 등록</Link>
      </div>

      <div className="bg-white rounded shadow p-4 mb-4 flex gap-2">
        <input type="text" value={keyword} onChange={(e) => setKeyword(e.target.value)}
          placeholder="이름 검색"
          className="flex-1 border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          onKeyDown={(e) => e.key === "Enter" && (setSearch(keyword), setPage(1))} />
        <button onClick={() => { setSearch(keyword); setPage(1); }}
          className="bg-gray-100 px-3 py-1.5 rounded text-sm border hover:bg-gray-200">검색</button>
      </div>

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-gray-600">이름</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">부서</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">직급</th>
              <th className="text-left px-4 py-3 font-medium text-gray-600">상급자</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y">
            {list.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-400">등록된 영업사원이 없습니다.</td></tr>}
            {list.map((s) => (
              <tr key={s.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">{s.name}</td>
                <td className="px-4 py-3 text-gray-500">{s.department ?? "-"}</td>
                <td className="px-4 py-3 text-gray-500">{s.position ?? "-"}</td>
                <td className="px-4 py-3 text-gray-500">{s.manager?.name ?? "-"}</td>
                <td className="px-4 py-3 text-right">
                  <Link href={`/salespeople/${s.id}/edit`} className="text-blue-600 hover:underline text-xs">수정</Link>
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
              className={`px-3 py-1 rounded text-sm border ${p === page ? "bg-blue-700 text-white" : "bg-white hover:bg-gray-50"}`}>{p}</button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
