import { NextResponse } from "next/server";

// POST /api/lead — dynamic mutation, no caching.
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json();
  const { name, email, phone, botId } = body as {
    name: string;
    email: string;
    phone?: string;
    botId?: string;
  };

  if (!name || !email) {
    return NextResponse.json(
      { error: "name and email are required" },
      { status: 400 },
    );
  }

  // TODO: wire to real lead storage
  console.log("Lead received:", { name, email, phone, botId });

  return NextResponse.json({ ok: true });
}
