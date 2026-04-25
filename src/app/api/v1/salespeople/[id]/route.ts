import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

import { error, handleError, ok } from "@/lib/api";
import { AuthError, authenticate } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = authenticate(req);
    if (!user.isManager) throw new AuthError("FORBIDDEN");

    const { id } = await params;
    const sp = await prisma.salesperson.findUnique({
      where: { id: Number(id) },
      select: {
        id: true, name: true, email: true, department: true, position: true,
        manager: { select: { id: true, name: true } },
      },
    });
    if (!sp) return error("NOT_FOUND", "영업사원을 찾을 수 없습니다.");
    return ok(sp);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = authenticate(req);
    if (!user.isManager) throw new AuthError("FORBIDDEN");

    const { id } = await params;
    const sp = await prisma.salesperson.findUnique({ where: { id: Number(id) } });
    if (!sp) return error("NOT_FOUND", "영업사원을 찾을 수 없습니다.");

    const { name, email, password, department, position, managerId } = await req.json();
    if (!name) return error("VALIDATION_ERROR", "이름을 입력해주세요.");
    if (!email) return error("VALIDATION_ERROR", "이메일을 입력해주세요.");

    if (email !== sp.email) {
      const dup = await prisma.salesperson.findUnique({ where: { email } });
      if (dup) return error("CONFLICT", "이미 등록된 이메일입니다.");
    }

    await prisma.salesperson.update({
      where: { id: sp.id },
      data: {
        name, email, department, position, managerId,
        ...(password ? { password: await bcrypt.hash(password, 10) } : {}),
      },
    });
    return ok({ id: sp.id });
  } catch (e) {
    return handleError(e);
  }
}
