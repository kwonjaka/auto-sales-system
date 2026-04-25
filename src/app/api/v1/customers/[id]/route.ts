import type { NextRequest } from "next/server";

import { error, handleError, ok } from "@/lib/api";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    authenticate(req);
    const { id } = await params;
    const customer = await prisma.customer.findUnique({ where: { id: Number(id) } });
    if (!customer) return error("NOT_FOUND", "고객을 찾을 수 없습니다.");
    return ok(customer);
  } catch (e) {
    return handleError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    authenticate(req);
    const { id } = await params;
    const customer = await prisma.customer.findUnique({ where: { id: Number(id) } });
    if (!customer) return error("NOT_FOUND", "고객을 찾을 수 없습니다.");

    const { companyName, contactName, phone, email, address, industry } = await req.json();
    if (!companyName) return error("VALIDATION_ERROR", "회사명을 입력해주세요.");
    if (!contactName) return error("VALIDATION_ERROR", "담당자명을 입력해주세요.");

    if (companyName !== customer.companyName) {
      const dup = await prisma.customer.findUnique({ where: { companyName } });
      if (dup) return error("CONFLICT", "이미 등록된 회사명입니다.");
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: { companyName, contactName, phone, email, address, industry },
    });
    return ok({ id: customer.id });
  } catch (e) {
    return handleError(e);
  }
}
