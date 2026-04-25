"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AppLayout from "@/components/Layout";
import { authHeaders } from "@/lib/client-auth";

interface Customer { id: number; companyName: string; contactName: string }
interface VisitRow { customerId: string; visitContent: string; visitTime: string }

export default function NewReportPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rows, setRows] = useState<VisitRow[]>([{ customerId: "", visitContent: "", visitTime: "" }]);
  const [currentIssues, setCurrentIssues] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    fetch("/api/v1/customers?limit=200", { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => j.success && setCustomers(j.data.items));
  }, []);

  const addRow = () => {
    if (rows.length < 20) setRows([...rows, { customerId: "", visitContent: "", visitTime: "" }]);
  };

  const removeRow = (i: number) => {
    if (rows.length > 1) setRows(rows.filter((_, idx) => idx !== i));
  };

  const updateRow = (i: number, field: keyof VisitRow, value: string) => {
    setRows(rows.map((r, idx) => idx === i ? { ...r, [field]: value } : r));
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    const visitRecords = rows.filter((r) => r.customerId && r.visitContent);
    if (visitRecords.length === 0) { setErrorMsg("방문기록을 1건 이상 입력해주세요."); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/reports", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          reportDate: today,
          visitRecords: visitRecords.map((r) => ({
            customerId: Number(r.customerId),
            visitContent: r.visitContent,
            visitTime: r.visitTime || undefined,
          })),
          currentIssues,
          tomorrowPlan,
        }),
      });
      const json = await res.json();
      if (!json.success) { setErrorMsg(json.error.message); return; }
      router.push(`/reports/${json.data.id}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppLayout>
      <h2 className="text-xl font-bold mb-4">보고서 작성</h2>
      <form onSubmit={submit} className="space-y-6">
        <div className="bg-white rounded shadow p-4">
          <div className="flex gap-4 text-sm text-gray-600 mb-4">
            <span>보고일: <strong>{today}</strong></span>
          </div>

          <h3 className="font-medium mb-2 text-gray-700">방문 기록</h3>
          <table className="w-full text-sm mb-2">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-2 py-2 font-medium text-gray-600 w-1/3">고객명</th>
                <th className="text-left px-2 py-2 font-medium text-gray-600">방문내용</th>
                <th className="px-2 py-2 w-20" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((row, i) => (
                <tr key={i}>
                  <td className="px-2 py-2">
                    <select value={row.customerId} onChange={(e) => updateRow(i, "customerId", e.target.value)}
                      className="w-full border rounded px-2 py-1">
                      <option value="">고객 선택</option>
                      {customers.map((c) => (
                        <option key={c.id} value={c.id}>{c.companyName}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-2 py-2">
                    <input type="text" value={row.visitContent} onChange={(e) => updateRow(i, "visitContent", e.target.value)}
                      placeholder="방문내용" className="w-full border rounded px-2 py-1" />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button type="button" onClick={() => removeRow(i)}
                      className="text-red-500 hover:text-red-700 text-xs">삭제</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={addRow} disabled={rows.length >= 20}
            className="text-blue-600 text-sm hover:underline disabled:opacity-40">+ 행 추가</button>
        </div>

        <div className="bg-white rounded shadow p-4 space-y-4">
          <div>
            <label className="block font-medium text-gray-700 mb-1">현재 과제 / 상담</label>
            <textarea value={currentIssues} onChange={(e) => setCurrentIssues(e.target.value)}
              rows={3} maxLength={2000}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="현재 진행 중인 과제나 상담 내용을 입력하세요." />
          </div>
          <div>
            <label className="block font-medium text-gray-700 mb-1">내일 할 일</label>
            <textarea value={tomorrowPlan} onChange={(e) => setTomorrowPlan(e.target.value)}
              rows={3} maxLength={2000}
              className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="내일 예정된 업무를 입력하세요." />
          </div>
        </div>

        {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push("/reports")}
            className="px-4 py-2 border rounded text-sm hover:bg-gray-50">취소</button>
          <button type="submit" disabled={loading}
            className="bg-blue-700 text-white px-6 py-2 rounded text-sm hover:bg-blue-800 disabled:opacity-50">
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
