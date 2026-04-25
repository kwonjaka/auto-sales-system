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
    { key: "companyName", label: "회사명", required: true },
    { key: "contactName", label: "담당자명", required: true },
    { key: "phone", label: "전화번호", required: false },
    { key: "email", label: "이메일", required: false },
    { key: "address", label: "주소", required: false },
    { key: "industry", label: "업종", required: false },
  ];

  return (
    <AppLayout>
      <h2 className="text-xl font-bold mb-4">고객 등록</h2>
      <div className="bg-white rounded shadow p-6 max-w-lg">
        <form onSubmit={submit} className="space-y-4">
          {fields.map(({ key, label, required }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}{required && " *"}</label>
              <input type="text" required={required} value={(form as Record<string, string>)[key]}
                onChange={(e) => set(key, e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          ))}
          {errorMsg && <p className="text-red-500 text-sm">{errorMsg}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={() => router.push("/customers")} className="px-4 py-2 border rounded text-sm hover:bg-gray-50">취소</button>
            <button type="submit" disabled={loading} className="bg-blue-700 text-white px-6 py-2 rounded text-sm hover:bg-blue-800 disabled:opacity-50">
              {loading ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      </div>
    </AppLayout>
  );
}
