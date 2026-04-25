import type { NextRequest } from "next/server";

import { created, error, handleError, ok } from "@/lib/api";
import { authenticate } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const user = authenticate(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get("page") ?? 1));
    const limit = Math.max(1, Number(searchParams.get("limit") ?? 20));
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const salespersonIdParam = searchParams.get("salespersonId");

    const where: Record<string, unknown> = {};

    if (user.isManager) {
      if (salespersonIdParam) {
        where.salespersonId = Number(salespersonIdParam);
      } else {
        const subordinates = await prisma.salesperson.findMany({
          where: { managerId: user.id },
          select: { id: true },
        });
        where.salespersonId = { in: [user.id, ...subordinates.map((s) => s.id)] };
      }
    } else {
      where.salespersonId = user.id;
    }

    if (startDate || endDate) {
      where.reportDate = {
        ...(startDate ? { gte: new Date(startDate) } : {}),
        ...(endDate ? { lte: new Date(`${endDate}T23:59:59`) } : {}),
      };
    }

    const [total, items] = await prisma.$transaction([
      prisma.dailyReport.count({ where }),
      prisma.dailyReport.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { reportDate: "desc" },
        include: {
          salesperson: { select: { id: true, name: true } },
          _count: { select: { visitRecords: true, comments: true } },
        },
      }),
    ]);

    return ok({
      items: items.map((r) => ({
        id: r.id,
        reportDate: r.reportDate.toISOString().split("T")[0],
        salesperson: r.salesperson,
        visitCount: r._count.visitRecords,
        commentCount: r._count.comments,
        createdAt: r.createdAt,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    return handleError(e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = authenticate(req);
    const { reportDate, visitRecords, currentIssues, tomorrowPlan } = await req.json();

    if (!visitRecords || visitRecords.length === 0) {
      return error("VALIDATION_ERROR", "방문기록을 1건 이상 입력해주세요.");
    }

    const date = new Date(reportDate);
    const existing = await prisma.dailyReport.findFirst({
      where: {
        salespersonId: user.id,
        reportDate: { gte: new Date(date.toDateString()), lt: new Date(new Date(date.toDateString()).getTime() + 86400000) },
      },
    });
    if (existing) {
      return error("CONFLICT", "해당 날짜의 보고서가 이미 존재합니다.");
    }

    const customerIds: number[] = visitRecords.map((v: { customerId: number }) => v.customerId);
    const customers = await prisma.customer.findMany({ where: { id: { in: customerIds } } });
    if (customers.length !== new Set(customerIds).size) {
      return error("VALIDATION_ERROR", "유효하지 않은 고객입니다.");
    }

    const report = await prisma.dailyReport.create({
      data: {
        salespersonId: user.id,
        reportDate: date,
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
    });

    return created({ id: report.id });
  } catch (e) {
    return handleError(e);
  }
}
