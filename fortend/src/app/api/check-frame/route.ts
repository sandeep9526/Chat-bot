import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  let url = searchParams.get("url");

  if (!url) {
    return NextResponse.json({ canFrame: false }, { status: 400 });
  }

  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    const xFrameOptions = res.headers.get("x-frame-options")?.toLowerCase();
    const csp = res.headers.get("content-security-policy")?.toLowerCase();

    let canFrame = true;

    if (xFrameOptions === "deny" || xFrameOptions === "sameorigin") {
      canFrame = false;
    }

    if (csp && csp.includes("frame-ancestors")) {
      if (csp.includes("frame-ancestors 'none'") || csp.includes("frame-ancestors 'self'")) {
        canFrame = false;
      }
    }

    return NextResponse.json({ canFrame });
  } catch (err) {
    return NextResponse.json({ canFrame: false });
  }
}
