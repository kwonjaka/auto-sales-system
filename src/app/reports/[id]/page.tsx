"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

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

  const load = () => {
    fetch(`/api/v1/reports/${id}`, { headers: authHeaders() })
      .then((r) => r.json())
      .then((j) => j.success && setReport(j.data));
  };

  useEffect(() => { load(); }, [id]);

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

  if (!report) return <AppLayout><p className="text-gray-400 text-center py-12">불러오는 중...</p></AppLayout>;

  const isOwner = user?.id === report.salesperson.id;
  const isToday = report.reportDate === today;

  return (
    <AppLayout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">보고서 상세</h2>
        <div className="flex gap-2">
          <Link href="/reports" className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">목록</Link>
          {isOwner && isToday && (
            <>
              <Link href={`/reports/${id}/edit`} className="px-3 py-1.5 border rounded text-sm hover:bg-gray-50">수정</Link>
              <button onClick={deleteReport} className="px-3 py-1.5 bg-red-50 border border-red-200 text-red-600 rounded text-sm hover:bg-red-100">삭제</button>
            </>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-white rounded shadow p-4">
          <div className="flex gap-6 text-sm text-gray-600 mb-4 pb-4 border-b">
            <span>작성자: <strong>{report.salesperson.name}</strong></span>
            <span>보고일: <strong>{report.reportDate}</strong></span>
          </div>

          <h3 className="font-medium text-gray-700 mb-2">방문 기록</h3>
          <table className="w-full text-sm mb-1">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-gray-600 w-8">#</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600 w-1/3">고객명</th>
                <th className="text-left px-3 py-2 font-medium text-gray-600">방문내용</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {report.visitRecords.map((v, i) => (
                <tr key={v.id}>
                  <td className="px-3 py-2 text-gray-400">{i + 1}</td>
                  <td className="px-3 py-2">{v.customer.companyName}</td>
                  <td className="px-3 py-2">{v.visitContent}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded shadow p-4 space-y-4">
          <div>
            <h3 className="font-medium text-gray-700 mb-1">현재 과제 / 상담</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap min-h-[2rem]">{report.currentIssues || <span className="text-gray-300">없음</span>}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700 mb-1">내일 할 일</h3>
            <p className="text-sm text-gray-600 whitespace-pre-wrap min-h-[2rem]">{report.tomorrowPlan || <span className="text-gray-300">없음</span>}</p>
          </div>
        </div>

        <div className="bg-white rounded shadow p-4">
          <h3 className="font-medium text-gray-700 mb-3">댓글</h3>
          <div className="space-y-3 mb-4">
            {report.comments.length === 0 && <p className="text-sm text-gray-400">댓글이 없습니다.</p>}
            {report.comments.map((c) => (
              <div key={c.id} className="bg-gray-50 rounded p-3">
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium text-gray-700">{c.commenter.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">{new Date(c.createdAt).toLocaleString("ko-KR")}</span>
                    {user?.id === c.commenter.id && (
                      <button onClick={() => deleteComment(c.id)} className="text-xs text-red-400 hover:text-red-600">삭제</button>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{c.content}</p>
              </div>
            ))}
          </div>
          {user?.isManager && (
            <form onSubmit={submitComment} className="flex gap-2">
              <input type="text" value={comment} onChange={(e) => setComment(e.target.value)}
                placeholder="댓글 입력 (상급자만 작성 가능)"
                className="flex-1 border rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <button type="submit" disabled={loading}
                className="bg-blue-700 text-white px-4 py-1.5 rounded text-sm hover:bg-blue-800 disabled:opacity-50">
                등록
              </button>
            </form>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
