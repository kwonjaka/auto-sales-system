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
      <h2 className="text-xl font-bold mb-4">영업사원 등록</h2>
      <div className="bg-white rounded shadow p-6 max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          {[
            { key: "name", label: "이름", type: "text", required: true },
            { key: "email", label: "이메일", type: "email", required: true },
            { key: "password", label: "비밀번호", type: "password", required: true },
            { key: "department", label: "부서", type: "text", required: false },
            { key: "position", label: "직급", type: "text", required: false },
          ].map(({ key, label, type, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && " *"}</label>
              <input type={type} required={required} value={(form as Record<string, string>)[key]}
                onChange={(e) => set(key, e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상급자</label>
            <select value={form.managerId} onChange={(e) => set("managerId", e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm">
              <option value="">선택 안 함</option>
              {managers.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.push("/salespeople")} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">취소</button>
            <button type="submit" disabled={loading} className="bg-blue-700 text-white px-6 py-2 rounded text-sm hover:bg-blue-800 disabled:opacity-50">
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
