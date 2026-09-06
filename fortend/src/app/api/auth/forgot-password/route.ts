import { auth } from "@/lib/auth";
import { NextRequest } from "next/server";

/**
 * Route alias: /api/auth/forgot-password -> Better Auth request-password-reset
 */
export async function POST(req: NextRequest) {
  const url = new URL("/api/auth/request-password-reset", req.url);
  const bodyText = await req.text();
  const forwardReq = new Request(url.toString(), {
    method: "POST",
    headers: req.headers,
    body: bodyText,
  });
  return auth.handler(forwardReq);
}
