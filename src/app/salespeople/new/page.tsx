"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import AppLayout from "@/components/Layout";
import { authHeaders } from "@/lib/client-auth";

interface Manager { id: number; name: string }

export default function NewSalespersonPage() {
  const router = useRouter();
  const [managers, setManagers] = useState<Manager[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "", department: "", position: "", managerId: "" });
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/v1/salespeople?limit=200", { headers: authHeaders() })
      .then((r) => r.json()).then((j) => j.success && setManagers(j.data.items));
  }, []);

  const set = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);
    try {
      const res = await fetch("/api/v1/salespeople", {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ ...form, managerId: form.managerId ? Number(form.managerId) : undefined }),
      });
      const json = await res.json();
      if (!json.success) { setErrorMsg(json.error.message); return; }
      router.push("/salespeople");
    } finally { setLoading(false); }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <div>
          <h1 className="page-title">영업사원 등록</h1>
          <p className="page-sub">새 영업사원을 등록합니다</p>
        </div>
      </div>

      <div style={{ maxWidth: "560px" }}>
        <div className="card">
          <form onSubmit={submit} className="space-y-4">
            <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
              {[
                { key: "name", label: "이름", type: "text", required: true, placeholder: "홍길동", full: false },
                { key: "email", label: "이메일", type: "email", required: true, placeholder: "hong@company.com", full: false },
                { key: "password", label: "비밀번호", type: "password", required: true, placeholder: "최소 8자 이상", full: false },
                { key: "department", label: "부서", type: "text", required: false, placeholder: "영업1팀", full: false },
                { key: "position", label: "직급", type: "text", required: false, placeholder: "대리", full: false },
              ].map(({ key, label, type, required, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    {label}{required && <span className="text-indigo-500 ml-0.5">*</span>}
                  </label>
                  <input
                    type={type}
                    required={required}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => set(key, e.target.value)}
                    placeholder={placeholder}
                    className="form-input"
                  />
                </div>
              ))}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">상급자</label>
                <select value={form.managerId} onChange={(e) => set("managerId", e.target.value)} className="form-input">
                  <option value="">선택 안 함</option>
                  {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
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
              <button type="button" onClick={() => router.push("/salespeople")} className="btn btn-ghost">취소</button>
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
