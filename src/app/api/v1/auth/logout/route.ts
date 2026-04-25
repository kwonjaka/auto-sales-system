import type { NextRequest } from "next/server";

import { handleError, ok } from "@/lib/api";
import { authenticate } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    authenticate(req);
    return ok(null);
  } catch (e) {
    return handleError(e);
  }
}
