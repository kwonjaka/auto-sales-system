import type { NextRequest } from "next/server";

import { error, handleError, ok } from "@/lib/api";
import { AuthError, authenticate } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; commentId: string }> }
) {
  try {
    const user = authenticate(req);
    if (!user.isManager) throw new AuthError("FORBIDDEN");

    const { id, commentId } = await params;
    const comment = await prisma.comment.findUnique({ where: { id: Number(commentId) } });
    if (!comment || comment.reportId !== Number(id)) return error("NOT_FOUND", "댓글을 찾을 수 없습니다.");
    if (comment.commenterId !== user.id) throw new AuthError("FORBIDDEN");

    await prisma.comment.delete({ where: { id: comment.id } });
    return ok(null);
  } catch (e) {
    return handleError(e);
  }
}
