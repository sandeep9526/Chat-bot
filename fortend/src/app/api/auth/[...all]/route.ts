import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import fs from "fs";
import path from "path";

const handlers = toNextJsHandler(auth);

function logAuth(type: string, data: any) {
  try {
    const line = `[${new Date().toISOString()}] [${type}] ${JSON.stringify(data)}\n`;
    fs.appendFileSync(path.join(process.cwd(), "auth-debug.log"), line);
    console.log(`[AUTH DEBUG ${type}]`, data);
  } catch (e) {
    console.error("Failed to write auth log", e);
  }
}

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  if (url.pathname.includes("reset-password")) {
    logAuth("GET reset-password", {
      url: req.url,
      pathname: url.pathname,
      search: url.search,
    });
  }
  return handlers.GET(req);
};

export const POST = async (req: Request) => {
  const url = new URL(req.url);
  if (url.pathname.includes("reset-password") || url.pathname.includes("request-password-reset")) {
    const clone = req.clone();
    let body: any = null;
    try {
      body = await clone.json();
    } catch {
      body = "(unparseable)";
    }
    logAuth("POST " + url.pathname, {
      url: req.url,
      query: Object.fromEntries(url.searchParams.entries()),
      body: {
        ...body,
        newPassword: body?.newPassword ? `[len ${body.newPassword.length}]` : undefined,
      },
    });
  }
  const response = await handlers.POST(req);
  if (url.pathname.includes("reset-password") || url.pathname.includes("request-password-reset")) {
    const cloneRes = response.clone();
    let resBody: any = null;
    try {
      resBody = await cloneRes.json();
    } catch {
      resBody = "(not json)";
    }
    logAuth("POST RESPONSE " + url.pathname, {
      status: response.status,
      body: resBody,
    });
  }
  return response;
};
