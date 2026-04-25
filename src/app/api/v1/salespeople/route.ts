import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

import { created, error, handleError, ok } from "@/lib/api";
import { AuthError, authenticate } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user.isManager) throw new AuthError("FORBIDDEN");

    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 20));

    const where = keyword ? { name: { contains: keyword } } : {};

    const [total, items] = await prisma.$transaction([
      prisma.salesperson.count({ where }),
      prisma.salesperson.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { name: "asc" },
        select: {
          id: true, name: true, email: true,
          department: true, position: true,
          manager: { select: { id: true, name: true } },
        },
      }),
    ]);

    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = authenticate(req);
    if (!user.isManager) throw new AuthError("FORBIDDEN");

    const { name, email, password, department, position, managerId } = await req.json();
    if (!name) return error("VALIDATION_ERROR", "이름을 입력해주세요.");
    if (!email) return error("VALIDATION_ERROR", "이메일을 입력해주세요.");
    if (!password || password.length < 8) return error("VALIDATION_ERROR", "비밀번호는 최소 8자 이상이어야 합니다.");

    const exists = await prisma.salesperson.findUnique({ where: { email } });
    if (exists) return error("CONFLICT", "이미 등록된 이메일입니다.");

    const sp = await prisma.salesperson.create({
      data: { name, email, password: await bcrypt.hash(password, 10), department, position, managerId },
    });
    return created({ id: sp.id });
  } catch (e) {
    return handleError(e);
  }
}
