import type { NextRequest } from "next/server";

import { error, handleError, ok } from "@/lib/api";
import { AuthError, authenticate } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isToday(date: Date) {
  return new Date(date).toDateString() === new Date().toDateString();
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; visitId: string }> }
) {
  try {
    const user = authenticate(req);
    const { id, visitId } = await params;

    const record = await prisma.visitRecord.findUnique({
      where: { id: Number(visitId) },
      include: { report: true },
    });
    if (!record || record.reportId !== Number(id)) return error("NOT_FOUND", "방문기록을 찾을 수 없습니다.");
    if (record.report.salespersonId !== user.id) throw new AuthError("FORBIDDEN");
    if (!isToday(record.report.reportDate)) return error("FORBIDDEN", "당일 보고서만 수정할 수 있습니다.");

    await prisma.visitRecord.delete({ where: { id: record.id } });
    return ok(null);
  } catch (e) {
    return handleError(e);
  }
}
