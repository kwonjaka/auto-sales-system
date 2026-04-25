import bcrypt from "bcryptjs";
import type { NextRequest } from "next/server";

import { created, error, handleError } from "@/lib/api";
import { signToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return error("VALIDATION_ERROR", "이메일과 비밀번호를 입력해주세요.");
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return error("VALIDATION_ERROR", "이메일 형식이 올바르지 않습니다.");
    }

    const salesperson = await prisma.salesperson.findUnique({ where: { email } });
    if (!salesperson || !(await bcrypt.compare(password, salesperson.password))) {
      return error("UNAUTHORIZED", "이메일 또는 비밀번호가 올바르지 않습니다.");
    }

    const isManager = await prisma.salesperson.count({ where: { managerId: salesperson.id } }) > 0;

    const token = signToken({
      id: salesperson.id,
      email: salesperson.email,
      isManager,
      managerId: salesperson.managerId,
    });

    return created({
      accessToken: token,
      salesperson: {
        id: salesperson.id,
        name: salesperson.name,
        email: salesperson.email,
        department: salesperson.department,
        position: salesperson.position,
        isManager,
      },
    });
  } catch (e) {
    return handleError(e);
  }
}
