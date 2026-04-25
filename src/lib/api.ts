import { NextResponse } from "next/server";

import { AuthError } from "./auth";

type ErrorCode =
  | "VALIDATION_ERROR"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INTERNAL_ERROR";

const STATUS_MAP: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500,
};

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data, error: null }, { status });
}

export function created<T>(data: T) {
  return ok(data, 201);
}

export function error(code: ErrorCode, message: string) {
  return NextResponse.json(
    { success: false, data: null, error: { code, message } },
    { status: STATUS_MAP[code] }
  );
}

export function handleError(e: unknown) {
  if (e instanceof AuthError) {
    return error(e.code, e.code === "UNAUTHORIZED" ? "인증이 필요합니다." : "접근 권한이 없습니다.");
  }
  console.error(e);
  return error("INTERNAL_ERROR", "오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
}
