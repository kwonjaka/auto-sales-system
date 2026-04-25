import type { NextRequest } from "next/server";

import { created, error, handleError } from "@/lib/api";
import { AuthError, authenticate } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = authenticate(req);
    if (!user.isManager) throw new AuthError("FORBIDDEN");

    const { id } = await params;
    const report = await prisma.dailyReport.findUnique({ where: { id: Number(id) } });
    if (!report) return error("NOT_FOUND", "보고서를 찾을 수 없습니다.");

    const { content } = await req.json();
    if (!content?.trim()) return error("VALIDATION_ERROR", "댓글 내용을 입력해주세요.");

    const comment = await prisma.comment.create({
      data: { reportId: Number(id), commenterId: user.id, content },
      include: { commenter: { select: { id: true, name: true } } },
    });

    return created({
      id: comment.id,
      commenter: comment.commenter,
      content: comment.content,
      createdAt: comment.createdAt,
    });
  } catch (e) {
    return handleError(e);
  }
}
