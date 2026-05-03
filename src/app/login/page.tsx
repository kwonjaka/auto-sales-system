"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { saveAuth } from "@/lib/client-auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!json.success) { setErrorMsg(json.error.message); return; }
      saveAuth(json.data.accessToken, json.data.salesperson);
      router.push("/reports");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex" style={{ background: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4c1d95 100%)" }}>
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 text-white">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.15)" }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </div>
          <span className="font-bold text-lg">영업일일보고 시스템</span>
        </div>

        <div>
          <h1 className="text-4xl font-bold leading-snug mb-4">
            매일의 영업 활동을<br />
            <span style={{ color: "#a78bfa" }}>스마트하게 기록</span>하세요
          </h1>
          <p className="text-white/60 text-lg leading-relaxed">
            방문 고객, 상담 내용, 내일 할 일을 간편하게 보고하고<br />
            상급자의 피드백을 실시간으로 받아보세요.
          </p>
        </div>

        <div className="flex gap-6">
          {[
            { label: "일일 보고", desc: "간편한 방문 기록" },
            { label: "실시간 피드백", desc: "상급자 댓글 알림" },
            { label: "고객 관리", desc: "통합 고객 마스터" },
          ].map((item) => (
            <div key={item.label} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.08)" }}>
              <p className="font-semibold text-sm">{item.label}</p>
              <p className="text-white/50 text-xs mt-1">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="rounded-2xl p-8 shadow-2xl" style={{ background: "white" }}>
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-slate-800">로그인</h2>
              <p className="text-slate-500 text-sm mt-1">계정에 로그인하여 시작하세요</p>
            </div>

            <form onSubmit={submit} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="form-input"
                  placeholder="이메일 주소 입력"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">비밀번호</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="form-input"
                  placeholder="비밀번호 입력"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-red-50 border border-red-100">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#e11d48" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p className="text-red-600 text-sm">{errorMsg}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary w-full justify-center py-3"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                    </svg>
                    로그인 중...
                  </>
                ) : "로그인"}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-100">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">테스트 계정</p>
              <div className="space-y-2">
                {[
                  { role: "상급자", email: "manager@company.com" },
                  { role: "영업사원", email: "hong@company.com" },
                ].map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => { setEmail(acc.email); setPassword("password123"); }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
                  >
                    <span className="text-xs font-medium text-slate-600">{acc.role}</span>
                    <span className="text-xs text-slate-400">{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
