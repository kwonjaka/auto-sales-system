"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import AppLayout from "@/components/Layout";
import { type AuthUser, authHeaders, getUser } from "@/lib/client-auth";

interface Report {
  id: number; reportDate: string;
  salesperson: { id: number; name: string; department: string };
  visitRecords: { id: number; customer: { id: number; companyName: string }; visitContent: string; visitTime?: string }[];
  currentIssues: string; tomorrowPlan: string;
  comments: { id: number; commenter: { id: number; name: string }; content: string; createdAt: string }[];
}

export default function ReportDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [report, setReport] = useState<Report | null>(null);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => { setUser(getUser()); }, []);

  const load = useCallback(() => {
    fetch(`/api/v1/reports/${id}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => j.success && setReport(j.data));
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const deleteReport = async () => {
    if (!confirm("보고서를 삭제하시겠습니까?")) return;
    const res = await fetch(`/api/v1/reports/${id}`, { method: "DELETE", headers: authHeaders() });
    const json = await res.json();
    if (json.success) router.push("/reports");
    else alert(json.error.message);
  };

  const submitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/reports/${id}/comments`, {
        method: "POST", headers: authHeaders(),
        body: JSON.stringify({ content: comment }),
      });
      const json = await res.json();
      if (json.success) { setComment(""); load(); }
      else alert(json.error.message);
    } finally { setLoading(false); }
  };

  const deleteComment = async (commentId: number) => {
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    await fetch(`/api/v1/reports/${id}/comments/${commentId}`, { method: "DELETE", headers: authHeaders() });
    load();
  };

  if (!report) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-24">
          <div className="flex flex-col items-center gap-3 text-slate-400">
            <svg className="animate-spin" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56" />
            </svg>
            <p className="text-sm">불러오는 중...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const isOwner = user?.id === report.salesperson.id;
  const isToday = report.reportDate === today;

  return (
    <AppLayout>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">보고서 상세</h1>
          <p className="page-sub">{report.reportDate} · {report.salesperson.name}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/reports" className="btn btn-ghost btn-sm">목록</Link>
          {isOwner && isToday && (
            <>
              <Link href={`/reports/${id}/edit`} className="btn btn-ghost btn-sm">수정</Link>
              <button onClick={deleteReport} className="btn btn-danger btn-sm">삭제</button>
            </>
          )}
        </div>
      </div>

      {/* Meta card */}
      <div className="card mb-5" style={{ background: "linear-gradient(135deg, #f8f7ff, #f0f2ff)", border: "1px solid #e0e7ff" }}>
        <div className="flex flex-wrap gap-6">
          <div className="flex items-center gap-3">
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              {report.salesperson.name.slice(0, 2)}
            </div>
            <div>
              <p className="text-xs text-slate-500">작성자</p>
              <p className="font-semibold text-slate-800">{report.salesperson.name}</p>
            </div>
          </div>
          <div>
            <p className="text-xs text-slate-500">보고일</p>
            <p className="font-semibold text-slate-800">{report.reportDate}</p>
          </div>
          <div>
            <p className="text-xs text-slate-500">방문건수</p>
            <p className="font-semibold"><span className="badge badge-purple">{report.visitRecords.length}건</span></p>
          </div>
          <div>
            <p className="text-xs text-slate-500">댓글</p>
            <p className="font-semibold"><span className="badge badge-blue">{report.comments.length}건</span></p>
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {/* Visit records */}
        <div className="card p-0 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-50 flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#ede9fe" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800">방문 기록</h3>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: "40px" }}>#</th>
                <th style={{ width: "30%" }}>고객명</th>
                <th>방문내용</th>
              </tr>
            </thead>
            <tbody>
              {report.visitRecords.map((v, i) => (
                <tr key={v.id}>
                  <td>
                    <span className="badge badge-purple" style={{ minWidth: "24px", justifyContent: "center" }}>{i + 1}</span>
                  </td>
                  <td className="font-medium text-slate-700">{v.customer.companyName}</td>
                  <td className="text-slate-600">{v.visitContent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Issues & Plan */}
        <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {[
            { label: "현재 과제 / 상담", value: report.currentIssues, color: "#fef3c7", iconColor: "#b45309", icon: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" },
            { label: "내일 할 일", value: report.tomorrowPlan, color: "#dcfce7", iconColor: "#15803d", icon: "M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2m-6 9l2 2 4-4" },
          ].map((item) => (
            <div key={item.label} className="card">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: item.color }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={item.iconColor} strokeWidth="2">
                    <path d={item.icon} strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <h3 className="font-semibold text-slate-800">{item.label}</h3>
              </div>
              <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed min-h-12">
                {item.value || <span className="text-slate-300">내용 없음</span>}
              </p>
            </div>
          ))}
        </div>

        {/* Comments */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "#dbeafe" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="font-semibold text-slate-800">댓글</h3>
            {report.comments.length > 0 && (
              <span className="badge badge-blue">{report.comments.length}</span>
            )}
          </div>

          <div className="space-y-3 mb-4">
            {report.comments.length === 0 && (
              <p className="text-sm text-slate-400 py-4 text-center">아직 댓글이 없습니다.</p>
            )}
            {report.comments.map((c) => (
              <div key={c.id} className="flex gap-3 p-4 rounded-xl" style={{ background: "#f8fafc" }}>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, #f472b6, #a855f7)" }}
                >
                  {c.commenter.name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-slate-700">{c.commenter.name}</span>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-slate-400">{new Date(c.createdAt).toLocaleString("ko-KR")}</span>
                      {user?.id === c.commenter.id && (
                        <button
                          onClick={() => deleteComment(c.id)}
                          className="text-xs text-red-400 hover:text-red-600 transition-colors"
                        >
                          삭제
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600">{c.content}</p>
                </div>
              </div>
            ))}
          </div>

          {user?.isManager && (
            <form onSubmit={submitComment} className="flex gap-2">
              <input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="댓글을 입력하세요 (상급자만 작성 가능)"
                className="form-input flex-1"
              />
              <button type="submit" disabled={loading} className="btn btn-primary">
                {loading ? "등록 중..." : "등록"}
              </button>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
