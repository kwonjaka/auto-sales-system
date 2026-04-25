import type { NextRequest } from "next/server";

import { created, error, handleError } from "@/lib/api";
import { AuthError, authenticate } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isToday(date: Date) {
  return new Date(date).toDateString() === new Date().toDateString();
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = authenticate(req);
    const { id } = await params;
    const report = await prisma.dailyReport.findUnique({ where: { id: Number(id) } });
    if (!report) return error("NOT_FOUND", "보고서를 찾을 수 없습니다.");
    if (report.salespersonId !== user.id) throw new AuthError("FORBIDDEN");
    if (!isToday(report.reportDate)) return error("FORBIDDEN", "당일 보고서만 수정할 수 있습니다.");

    const { customerId, visitContent, visitTime } = await req.json();
    if (!visitContent) return error("VALIDATION_ERROR", "방문내용을 입력해주세요.");

    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) return error("VALIDATION_ERROR", "유효하지 않은 고객입니다.");

    const record = await prisma.visitRecord.create({
      data: { reportId: Number(id), customerId, visitContent, visitTime },
    });
    return created({ id: record.id });
  } catch (e) {
    return handleError(e);
  }
}
