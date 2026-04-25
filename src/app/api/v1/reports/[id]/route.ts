import type { NextRequest } from "next/server";

import { error, handleError, ok } from "@/lib/api";
import { AuthError, authenticate } from "@/lib/auth";
import { prisma } from "@/lib/db";

function isToday(date: Date) {
  const today = new Date().toDateString();
  return new Date(date).toDateString() === today;
}

async function getReportOrFail(id: number, userId: number, isManager: boolean) {
  const report = await prisma.dailyReport.findUnique({
    where: { id },
    include: {
      salesperson: { select: { id: true, name: true, department: true } },
      visitRecords: {
        include: { customer: { select: { id: true, companyName: true, contactName: true } } },
        orderBy: { createdAt: "asc" },
      },
      comments: {
        include: { commenter: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!report) throw Object.assign(new Error("NOT_FOUND"), { code: "NOT_FOUND" });

  if (!isManager && report.salespersonId !== userId) throw new AuthError("FORBIDDEN");
  if (isManager) {
    const sub = await prisma.salesperson.count({ where: { id: report.salespersonId, managerId: userId } });
    if (sub === 0 && report.salespersonId !== userId) throw new AuthError("FORBIDDEN");
  }
  return report;
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = authenticate(req);
    const { id } = await params;
    const report = await getReportOrFail(Number(id), user.id, user.isManager);

    return ok({
      id: report.id,
      reportDate: report.reportDate.toISOString().split("T")[0],
      salesperson: report.salesperson,
      visitRecords: report.visitRecords.map((v) => ({
        id: v.id,
        customer: v.customer,
        visitContent: v.visitContent,
        visitTime: v.visitTime,
      })),
      currentIssues: report.currentIssues,
      tomorrowPlan: report.tomorrowPlan,
      comments: report.comments.map((c) => ({
        id: c.id,
        commenter: c.commenter,
        content: c.content,
        createdAt: c.createdAt,
      })),
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "NOT_FOUND") return error("NOT_FOUND", "보고서를 찾을 수 없습니다.");
    return handleError(e);
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = authenticate(req);
    const { id } = await params;
    const report = await getReportOrFail(Number(id), user.id, false);

    if (report.salespersonId !== user.id) throw new AuthError("FORBIDDEN");
    if (!isToday(report.reportDate)) return error("FORBIDDEN", "당일 보고서만 수정할 수 있습니다.");

    const { visitRecords, currentIssues, tomorrowPlan } = await req.json();

    if (!visitRecords || visitRecords.length === 0) {
      return error("VALIDATION_ERROR", "방문기록을 1건 이상 입력해주세요.");
    }

    await prisma.$transaction([
      prisma.visitRecord.deleteMany({ where: { reportId: report.id } }),
      prisma.dailyReport.update({
        where: { id: report.id },
        data: {
          currentIssues,
          tomorrowPlan,
          visitRecords: {
            create: visitRecords.map((v: { customerId: number; visitContent: string; visitTime?: string }) => ({
              customerId: v.customerId,
              visitContent: v.visitContent,
              visitTime: v.visitTime,
            })),
          },
        },
      }),
    ]);

    return ok({ id: report.id });
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "NOT_FOUND") return error("NOT_FOUND", "보고서를 찾을 수 없습니다.");
    return handleError(e);
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = authenticate(req);
    const { id } = await params;
    const report = await getReportOrFail(Number(id), user.id, false);

    if (report.salespersonId !== user.id) throw new AuthError("FORBIDDEN");
    if (!isToday(report.reportDate)) return error("FORBIDDEN", "당일 보고서만 삭제할 수 있습니다.");

    await prisma.dailyReport.delete({ where: { id: report.id } });
    return ok(null);
  } catch (e: unknown) {
    if ((e as { code?: string }).code === "NOT_FOUND") return error("NOT_FOUND", "보고서를 찾을 수 없습니다.");
    return handleError(e);
  }
}
