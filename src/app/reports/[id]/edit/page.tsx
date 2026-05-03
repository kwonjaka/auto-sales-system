"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AppLayout from "@/components/Layout";
import { authHeaders } from "@/lib/client-auth";

interface Customer { id: number; companyName: string }
interface VisitRow { customerId: string; visitContent: string; visitTime: string }

export default function EditReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rows, setRows] = useState<VisitRow[]>([]);
  const [currentIssues, setCurrentIssues] = useState("");
  const [tomorrowPlan, setTomorrowPlan] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/customers?limit=200", { headers: authHeaders() })
      .then((r) => r.json()).then((j) => j.success && setCustomers(j.data.items));

    fetch(`/api/v1/reports/${id}`, { headers: authHeaders() })
      .then((r) => r.json()).then((j) => {
        if (!j.success) return;
        const r = j.data;
        setRows(r.visitRecords.map((v: { customer: { id: number }; visitContent: string; visitTime?: string }) => ({
          customerId: String(v.customer.id),
          visitContent: v.visitContent,
          visitTime: v.visitTime ?? "",
        })));
        setCurrentIssues(r.currentIssues ?? "");
        setTomorrowPlan(r.tomorrowPlan ?? "");
      });
  }, [id]);

  const addRow = () => { if (rows.length < 20) setRows([...rows, { customerId: "", visitContent: "", visitTime: "" }]); };
  const removeRow = (i: number) => { if (rows.length > 1) setRows(rows.filter((_, idx) => idx !== i)); };
  const updateRow = (i: number, f: keyof VisitRow, v: string) => setRows(rows.map((r, idx) => idx === i ? { ...r, [f]: v } : r));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const visitRecords = rows.filter((r) => r.customerId && r.visitContent);
    if (visitRecords.length === 0) { setErrorMsg("방문기록을 1건 이상 입력해주세요."); return; }
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/reports/${id}`, {
        method: "PUT", headers: authHeaders(),
        body: JSON.stringify({
          visitRecords: visitRecords.map((r) => ({ customerId: Number(r.customerId), visitContent: r.visitContent, visitTime: r.visitTime || undefined })),
          currentIssues, tomorrowPlan,
        }),
      });
      const json = await res.json();
      if (!json.success) { setErrorMsg(json.error.message); return; }
      router.push(`/reports/${id}`);
    } finally { setLoading(false); }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">보고서 수정</h1>
          <p className="page-sub">방문 기록 및 내용을 수정합니다</p>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-5">
        {/* Visit records */}
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#ede9fe" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-800">방문 기록</h3>
              <span className="badge badge-purple">{rows.length}행</span>
            </div>
            <button type="button" onClick={addRow} disabled={rows.length >= 20} className="btn btn-ghost btn-sm">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              행 추가
            </button>
          </div>

          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "32px" }}>#</th>
                <th style={{ width: "35%" }}>고객명 *</th>
                <th>방문내용 *</th>
                <th style={{ width: "48px" }} />
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={i}>
                  <td><span className="badge badge-purple" style={{ minWidth: "24px", justifyContent: "center" }}>{i + 1}</span></td>
                  <td>
                    <select value={row.customerId} onChange={(e) => updateRow(i, "customerId", e.target.value)} className="form-input" style={{ padding: "8px 12px" }}>
                      <option value="">고객 선택</option>
                      {customers.map((c) => <option key={c.id} value={c.id}>{c.companyName}</option>)}
                    </select>
                  </td>
                  <td>
                    <input type="text" value={row.visitContent} onChange={(e) => updateRow(i, "visitContent", e.target.value)}
                      placeholder="방문 내용을 입력하세요" className="form-input" style={{ padding: "8px 12px" }} />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <button type="button" onClick={() => removeRow(i)} disabled={rows.length <= 1}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all disabled:opacity-30">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Issues & Plan */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {[
            { label: "현재 과제 / 상담", value: currentIssues, setter: setCurrentIssues, placeholder: "현재 진행 중인 과제나 상담 내용" },
            { label: "내일 할 일", value: tomorrowPlan, setter: setTomorrowPlan, placeholder: "내일 예정된 업무" },
          ].map((item) => (
            <div key={item.label} className="card">
              <label className="block text-sm font-semibold text-slate-700 mb-2">{item.label}</label>
              <textarea value={item.value} onChange={(e) => item.setter(e.target.value)}
                rows={4} className="form-input" placeholder={item.placeholder} style={{ resize: "vertical" }} />
            </div>
          ))}
        </div>

        {errorMsg && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p className="text-red-600 text-sm">{errorMsg}</p>
          </div>
        )}

        <div className="flex justify-end gap-3">
          <button type="button" onClick={() => router.push(`/reports/${id}`)} className="btn btn-ghost">취소</button>
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? "저장 중..." : "저장"}
          </button>
        </div>
      </form>
    </AppLayout>
  );
}
