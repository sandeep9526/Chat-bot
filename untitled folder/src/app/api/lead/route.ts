import { NextResponse } from "next/server";

// Architectural Clean-up:
// All client-side lead captures directly communicate with the FastAPI engine
// via `submitLead` in `src/lib/api.ts`. This stub remains only as an explicit
// HTTP forwarder for external form automation or legacy CLI testing tools.
export const dynamic = "force-dynamic";
const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const res = await fetch(`${BACKEND_URL}/lead`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err) {
    return NextResponse.json(
      { error: "FastAPI RAG backend connection failed", details: String(err) },
      { status: 502 },
    );
  }
}
