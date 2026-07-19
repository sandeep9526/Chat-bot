import { NextResponse } from "next/server";
import type { ChatResponse } from "@/lib/types";

// POST /api/chat — always dynamic, per-request, streamed.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { message, botId } = body as { message: string; botId?: string };

  if (!message || typeof message !== "string") {
    return NextResponse.json(
      { error: "message is required" },
      { status: 400 },
    );
  }

  // TODO: wire to real RAG backend, keyed by botId (the tenant).
  const response: ChatResponse = {
    answer: `Placeholder response for "${message}" (bot: ${botId ?? "demo"}). Wire me to your real /chat endpoint.`,
    sources: [],
    isGuardrail: true,
  };

  return NextResponse.json(response);
}
