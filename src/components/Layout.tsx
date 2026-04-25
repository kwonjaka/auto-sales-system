"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { type AuthUser, authHeaders, clearAuth, getUser } from "@/lib/client-auth";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const u = getUser();
    if (!u) { router.push("/login"); return; }
    setUser(u);
  }, [router]);

  const logout = async () => {
    await fetch("/api/v1/auth/logout", { method: "POST", headers: authHeaders() });
    clearAuth();
    router.push("/login");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-blue-700 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-bold text-lg">영업일일보고 시스템</span>
          <nav className="flex items-center gap-6 text-sm">
            <Link href="/reports" className="hover:underline">보고서 목록</Link>
            <Link href="/customers" className="hover:underline">고객 마스터</Link>
            {user.isManager && <Link href="/salespeople" className="hover:underline">영업사원 마스터</Link>}
            <span className="text-blue-200">{user.name}</span>
            <button onClick={logout} className="hover:underline text-blue-200">로그아웃</button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">{children}</main>
    </div>
  );
}
