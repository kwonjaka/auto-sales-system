"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import AppLayout from "@/components/Layout";
import { authHeaders } from "@/lib/client-auth";

export default function NewCustomerPage() {
  const router = useRouter();
  const [form, setForm] = useState({ companyName: "", contactName: "", phone: "", email: "", address: "", industry: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/customers", { method: "POST", headers: authHeaders(), body: JSON.stringify(form) });
      const json = await res.json();
      if (!json.success) { setErrorMsg(json.error.message); return; }
      router.push("/customers");
    } finally { setLoading(false); }
  };

  const fields = [
    { key: "companyName", label: "회사명", required: true, placeholder: "회사명을 입력하세요" },
    { key: "contactName", label: "담당자명", required: true, placeholder: "담당자 이름" },
    { key: "phone", label: "전화번호", required: false, placeholder: "010-0000-0000" },
    { key: "email", label: "이메일", required: false, placeholder: "contact@company.com" },
    { key: "address", label: "주소", required: false, placeholder: "주소 입력" },
    { key: "industry", label: "업종", required: false, placeholder: "예: IT, 제조, 유통" },
  ];

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">고객 등록</h1>
          <p className="page-sub">새 고객사를 등록합니다</p>
        </div>
      </div>

      <div style={{ maxWidth: "560px" }}>
        <div className="card">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {fields.map(({ key, label, required, placeholder }) => (
                <div key={key} style={key === "address" ? { gridColumn: "1 / -1" } : {}}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {label}{required && <span className="text-indigo-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type="text"
                    required={required}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="form-input"
                  />
                </div>
              ))}
            </div>

            {errorMsg && (
              <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-red-50 border border-red-100">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                </svg>
                <p className="text-red-600 text-sm">{errorMsg}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => router.push("/customers")} className="btn btn-ghost">취소</button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </AppLayout>
  );
}
