import type { NextRequest } from "next/server";

import { created, error, handleError, ok } from "@/lib/api";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    authenticate(req);
    const { searchParams } = new URL(req.url);
    const keyword = searchParams.get("keyword") ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 20));

    const where = keyword
      ? { OR: [{ companyName: { contains: keyword } }, { contactName: { contains: keyword } }] }
      : {};

    const [total, items] = await prisma.$transaction([
      prisma.customer.count({ where }),
      prisma.customer.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { companyName: "asc" },
      }),
    ]);

    return ok({ items, total, page, limit, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    authenticate(req);
    const { companyName, contactName, phone, email, address, industry } = await req.json();

    if (!companyName) return error("VALIDATION_ERROR", "회사명을 입력해주세요.");
    if (!contactName) return error("VALIDATION_ERROR", "담당자명을 입력해주세요.");

    const exists = await prisma.customer.findUnique({ where: { companyName } });
    if (exists) return error("CONFLICT", "이미 등록된 회사명입니다.");

    const customer = await prisma.customer.create({
      data: { companyName, contactName, phone, email, address, industry },
    });
    return created({ id: customer.id });
  } catch (e) {
    return handleError(e);
  }
}
