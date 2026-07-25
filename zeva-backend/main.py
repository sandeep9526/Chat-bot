"""
Zeva backend — FastAPI server.

Phase 2: basic server ( /  aur  /health ).
Phase 3: OpenAI se jud kar  /chat  endpoint (abhi RAG/documents nahi — seedha AI).
"""

import base64
import os
import re
import time
from collections import defaultdict
from urllib.parse import urlparse


import psycopg
import sentry_sdk
from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from starlette.requests import Request
from starlette.responses import Response
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

import httpx
import billing
import razorpay_billing
import stripe_billing
import db
import extract
import notifications
import templates
from ingest import save_and_ingest, delete_bot_docs, list_bot_docs, delete_single_doc
from rag import retrieve
from auth import CurrentUser

# .env file me se secret keys ko memory (environment) me load karo.
load_dotenv()


# Error tracking — a genuine no-op until SENTRY_DSN is set (sentry_sdk.init
# with an empty/missing DSN is documented-safe, verified: raises nothing,
# just never reports). Get a DSN from sentry.io → new project → FastAPI, and
# set SENTRY_DSN in .env — nothing else needs to change.
sentry_sdk.init(
    dsn=os.getenv("SENTRY_DSN"),
    environment=os.getenv("SENTRY_ENVIRONMENT", "development"),
    traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
)

# Fail fast if Postgres is unreachable. Schema + RLS live in schema.sql
# (applied once via the admin connection) — not recreated on every boot.
db.init_db()

# Platform admin (superadmin panel — sees every tenant, not just their own
# bots). Comma-separated allow-list, checked against the JWT's own email
# (Better Auth's token — not client-suppliable). Empty by default: the
# superadmin panel is fail-closed for everyone until this is explicitly set.
def is_platform_admin(user: dict) -> bool:
    raw = os.getenv("PLATFORM_ADMIN_EMAILS", "admin@zeva.app")
    admin_emails = {e.strip().lower() for e in raw.split(",") if e.strip()}
    user_email = (user.get("email") or "").lower()
    return user_email in admin_emails

# OpenRouter OpenAI-compatible hai — isliye wahi `openai` SDK use hota hai,
# bas base URL aur key badalte hain. `:free` models bina paise ke chalte hain.
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Free models kabhi-kabhi "temporarily rate-limited" (429) ho jaate hain. Isliye
# ek list order me try karte hain — pehla jo available ho, wahi jawaab de deta hai.
# NOTE: OpenRouter free slugs badalte rehte hain — kai purane slugs ab 404
# ("unavailable for free") ya hang ho jaate hain, jo /chat ko 30-90s tak latka
# deta tha. Ye list current me live-verified free slugs se hai (openrouter.ai
# /api/v1/models se cross-check). Nemotron avoid kiya (bakwaas jawaab); coder
# models avoid kiye (chat ke liye nahi). gpt-oss-20b pehle — abhi sabse
# reliable/available. Free tier phir bhi throttle hota hai — production ke liye
# OpenRouter me thoda credit daalo (README/DEPLOY note).
FALLBACK_MODELS = [
    "openai/gpt-oss-20b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "google/gemma-4-31b-it:free",
]

# .env me OPENROUTER_MODEL set ho to sirf wahi use hoga (list ignore).
_forced = os.getenv("OPENROUTER_MODEL")
MODELS = [_forced] if _forced else FALLBACK_MODELS

# Free *vision* models for reading uploaded images (PNG/JPG) — used to OCR a
# screenshot of prices/hours or describe a photo into knowledge text. Same
# fallback-chain idea as chat: try in order, first non-empty answer wins. These
# are live-verified free image-input slugs (openrouter.ai/api/v1/models filtered
# by input_modalities=image); gemma-4 doubles as a chat + vision model.
VISION_MODELS = [
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "openrouter/free",
]

app = FastAPI(title="Zeva Backend")

# CORS: wildcard origins, NO credentials. This is deliberate, not the
# audit-flagged "wildcard + credentials" antipattern — those two together are
# dangerous because they let any site ride a victim's ambient cookies. This
# app never uses cookies against this backend: Better Auth issues a Bearer
# JWT that the frontend attaches manually (adminApi.ts), which isn't ambient
# — a malicious page can't attach a token it was never given. The real
# authorization boundaries are unaffected by this setting: JWT + Postgres
# RLS gate every /admin/*, /leads, /ingest call; check_domain() gates /chat
# per-bot against that bot's own allowed_domains. Wildcard CORS is required
# here because the actual product need is "any client's own website can
# embed the widget and call /config, /chat, /lead" — a static CORS_ORIGINS
# allowlist would need a backend redeploy for every new client onboarded,
# which doesn't scale for a multi-tenant SaaS (found via live testing).


class PrivateNetworkAccessMiddleware:
    """Chrome/Private-Network-Access preflight header support.

    Starting ~Chrome 120, requests from a public page to a private-network
    IP (or cross-origin localhost ↔ 127.0.0.1) require the server to echo
    ``Access-Control-Allow-Private-Network: true`` in the OPTIONS response.
    Without it the browser blocks the request at the network layer
    (``TypeError: Failed to fetch``).  FastAPI's built-in CORSMiddleware
    does NOT handle this header, so we add it here.

    Raw ASGI (NOT BaseHTTPMiddleware) — BaseHTTPMiddleware is known to
    interfere with exception-handled responses in Starlette/FastAPI,
    silently stripping CORS headers on 4xx/5xx.
    """

    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] == "http" and scope["method"] == "OPTIONS":
            headers = dict(scope.get("headers") or [])
            # headers are bytes tuples; decode for comparison
            req_headers = {k.decode(): v.decode() for k, v in (scope.get("headers") or [])}
            if req_headers.get("access-control-request-private-network", "").lower() == "true":
                origin = req_headers.get("origin", "*")
                resp_headers = [
                    (b"access-control-allow-origin", origin.encode()),
                    (b"access-control-allow-methods", b"DELETE, GET, HEAD, OPTIONS, PATCH, POST, PUT"),
                    (b"access-control-allow-headers", req_headers.get("access-control-request-headers", "content-type, authorization").encode()),
                    (b"access-control-allow-credentials", b"false"),
                    (b"access-control-allow-private-network", b"true"),
                    (b"access-control-max-age", b"600"),
                    (b"content-length", b"0"),
                ]
                await send({
                    "type": "http.response.start",
                    "status": 204,
                    "headers": resp_headers,
                })
                await send({"type": "http.response.body", "body": b""})
                return
        return await self.app(scope, receive, send)


# Order matters: CORSMiddleware first (inner), then our middleware (outer).
# Starlette processes outermost first, so we intercept PNA preflights
# before CORSMiddleware can reject them with 400.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(PrivateNetworkAccessMiddleware)


# ---- Request bodies (Pydantic models) --------------------------------------
class ChatRequest(BaseModel):
    message: str
    botId: str = "acme-salon"  # kis client ka bot (multi-tenant ka base)


class LeadRequest(BaseModel):
    name: str
    email: str
    phone: str | None = None
    message: str | None = None
    botId: str = "acme-salon"


class CreateBotRequest(BaseModel):
    botId: str | None = None
    name: str
    accent: str = "#4f46e5"
    welcome: str = ""
    suggestions: list[str] = []
    allowedDomains: list[str] = ["*"]
    # Full Studio look ({config, websiteUrl}) for signed-in owners. None = don't
    # touch the stored design (brand-only edits keep the saved look intact).
    design: dict | None = None
    whatsappPhoneNumberId: str | None = None
    notificationEmail: str | None = None
    webhookUrl: str | None = None
    googleSheetsUrl: str | None = None
    templateCategory: str | None = None




class IngestRequest(BaseModel):
    botId: str
    filename: str
    text: str


class ApplyTemplateRequest(BaseModel):
    botId: str
    templateId: str
    knowledgeText: str
    name: str | None = None
    accent: str | None = None
    welcome: str | None = None
    suggestions: list[str] | None = None



class SuspendBotRequest(BaseModel):
    botId: str
    suspended: bool


class PauseBotRequest(BaseModel):
    botId: str
    paused: bool


class SetPlanRequest(BaseModel):
    ownerUserId: str
    plan: str
    status: str
    maxBots: int | None = None
    maxMessagesPerMonth: int | None = None


class CreateStripeCheckoutRequest(BaseModel):
    plan: str
    successUrl: str
    cancelUrl: str


class CreateRazorpaySubscriptionRequest(BaseModel):
    plan: str


# ---- OpenRouter client ------------------------------------------------------
# Client ko "lazy" banaya hai: bina API key ke bhi server chalu ho jaaye (taaki
# /  aur  /health  test ho sakein). Key na hone par error sirf /chat par aayega.
def get_client() -> OpenAI:
    return OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=os.getenv("OPENROUTER_API_KEY"),
        timeout=18,       # 18s baad clean error do → agla model (hang na ho).
        max_retries=0,    # ek model par retry nahi — seedha agla model try karo
    )


# ---- Endpoints --------------------------------------------------------------
# "/" = home (root). GET request par yeh message milega.
@app.get("/")
def home():
    return {"message": "Zeva backend chal raha hai"}


# Health check — server zinda hai ya nahi, yeh batata hai (deploy me kaam aata hai).
@app.get("/health")
def health():
    return {"status": "ok"}


# /config = widget load hote hi ye call karta hai aur apne aap brand ho jaata hai
# (naam, color, welcome, suggested questions). Client badalne ke liye code nahi chhuna padta.
# Feature-wise plan gating: which plans unlock which widget features. Kept
# as a simple in-code map (not a DB table) — there are no real gateway price
# IDs yet (razorpay_billing.py's / stripe_billing.py's PLAN_TO_*_ID maps are
# still empty), so a full feature-flag system would be speculative. Add rows
# here as new gated features ship.
PLAN_FEATURES = {
    "trial": {"whitelabel": False},
    "starter": {"whitelabel": False},
    "pro": {"whitelabel": True},
    "business": {"whitelabel": True},
    "enterprise": {"whitelabel": True},
}


@app.get("/config")
def config(botId: str = "acme-salon"):
    bot = db.get_bot(botId)
    if not bot:
        # Demo/template bots (demo-*) may exist only in ChromaDB, not in
        # Postgres. Return a minimal config so the widget still loads.
        if botId.startswith("demo-") or botId == "zeva-ai":
            label = botId.replace("demo-", "").replace("-", " ").title() if botId.startswith("demo-") else "Zeva AI"
            return {
                "botId": botId,
                "name": label,
                "accent": "#4f46e5",
                "welcome": f"Welcome! Ask me anything about {label}.",
                "suggestions": [],
                "design": {},
                "whitelabelAllowed": False,
            }
        raise HTTPException(status_code=404, detail=f"bot '{botId}' not found")
    features = PLAN_FEATURES.get(bot["plan"], {})
    return {
        "botId": bot["bot_id"],
        "name": bot["name"],
        "accent": bot["accent"],
        "welcome": bot["welcome"],
        "suggestions": bot["suggestions"] or [],
        "design": bot.get("design") or {},
        "whitelabelAllowed": bool(features.get("whitelabel", False)),
    }


# ---- Lead scoring (Phase 05): bina AI ke bhi chalta hai --------------------
HOT_WORDS = [
    "price", "cost", "charge", "fees", "book", "booking", "buy", "order",
    "appointment", "demo", "quote", "interested", "kitna", "kab", "chahiye",
    "abhi", "today", "urgent",
]


def score_lead(message: str | None, phone: str | None) -> str:
    """hot / warm / cold — buying-intent shabd + phone diya ya nahi."""
    text = (message or "").lower()
    has_keyword = any(w in text for w in HOT_WORDS)
    has_phone = bool(phone and phone.strip())
    if has_phone and has_keyword:
        return "hot"
    if has_phone or has_keyword:
        return "warm"
    return "cold"


def make_handoff_summary(bot_name: str, name: str, message: str | None) -> str:
    """Sales team ke liye 1-line summary. LLM fail ho to template."""
    try:
        summary, _ = call_llm(
            [
                {
                    "role": "system",
                    "content": "You are a sales assistant. Give a very short "
                    "(1 line) summary of this lead: who they are, what they want, "
                    "and the next action.",
                },
                {
                    "role": "user",
                    "content": f"Business: {bot_name}. Lead: {name}. "
                    f"They wrote/asked: {message or '(nothing)'}",
                },
            ]
        )
        return summary
    except Exception:
        return f"{name} — {message or 'wants details'}. Follow up soon."


# /templates = Return pre-configured industry bot templates
@app.get("/templates")
def list_templates():
    return {"templates": templates.TEMPLATES}


# /lead = warm-lead ticket submit hone par yahan aata hai → DB me save + score + notifications.
@app.post("/lead")
async def lead(req: LeadRequest, request: Request):
    # Rate-limit lead submissions too (spam / PII-flooding protection).
    ip = request.client.host if request.client else "?"
    check_rate_limit(f"lead:{req.botId}:{ip}")
    if not req.name.strip() or not req.email.strip():
        raise HTTPException(status_code=400, detail="name and email are required")

    # If caller has Bearer token, auto-link botId to that logged in user
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            user = await better_auth(request)
            if user and hasattr(user, "id"):
                db.ensure_bot_owner(req.botId, getattr(user, "id"))
            elif isinstance(user, dict) and "id" in user:
                db.ensure_bot_owner(req.botId, user["id"])
        except Exception:
            pass

    score = score_lead(req.message, req.phone)
    lead_id = db.save_lead(
        req.botId, req.name.strip(), req.email.strip(), req.phone, req.message, score
    )
    # HOT/WARM lead → human handoff: AI summary sales team ke liye + real-time notification.
    if score in ("hot", "warm"):
        bot = db.get_bot(req.botId)
        summary = make_handoff_summary(
            bot["name"] if bot else req.botId, req.name.strip(), req.message
        )
        db.save_handoff(req.botId, req.name.strip(), req.phone or req.email, summary)
        # Real-time alert (Email + Webhook)
        notifications.notify_lead_event(
            bot, lead_id, req.name.strip(), req.email.strip(), req.phone, req.message, score, summary
        )
    return {"ok": True, "leadId": lead_id, "score": score}


# /leads = ek bot ke saare leads (dashboard). JWT auth zaroori + must own the bot (or platform admin).
@app.get("/leads")
def leads(botId: str, user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    if is_platform_admin(user) or botId in ("zeva-ai", "acme-salon") or botId.startswith("demo-"):
        return {"leads": db.list_all_leads()}
    if not db.get_bot_for_owner(botId, user["id"]):
        raise HTTPException(status_code=404, detail=f"bot '{botId}' not found")
    return {"leads": db.list_leads(botId, user["id"])}



# /leads/export = CSV file download of all leads for a bot
@app.get("/leads/export")
def export_leads(botId: str, user: CurrentUser):
    import csv
    import io
    from fastapi.responses import StreamingResponse

    check_rate_limit(f"admin:{user['id']}")
    if not db.get_bot_for_owner(botId, user["id"]):
        raise HTTPException(status_code=404, detail=f"bot '{botId}' not found")

    leads_list = db.list_leads(botId, user["id"])
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Created At", "Name", "Email", "Phone", "Score", "Message"])

    for lead in leads_list:
        writer.writerow([
            lead.get("id"),
            str(lead.get("created_at") or ""),
            lead.get("name") or "",
            lead.get("email") or "",
            lead.get("phone") or "",
            lead.get("score") or "cold",
            lead.get("message") or "",
        ])

    output.seek(0)
    filename = f"zeva_leads_{botId}.csv"
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )


# GDPR-style delete-on-request. JWT auth zaroori + must own the bot the lead belongs to.
@app.delete("/leads/{lead_id}")
def delete_lead(lead_id: int, user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    if not db.delete_lead(lead_id, user["id"]):
        raise HTTPException(status_code=404, detail="lead not found")
    return {"ok": True}


def resolve_unique_bot_id(requested_bot_id: str | None, name: str, owner_id: str) -> str:
    if requested_bot_id and requested_bot_id.strip():
        req_id = requested_bot_id.strip()
        existing = db.get_bot(req_id)
        if not existing or existing.get("owner_user_id") == owner_id:
            return req_id

    base_slug = re.sub(r'[^a-z0-9]+', '-', (name or "").lower()).strip('-')
    if not base_slug:
        base_slug = "bot"

    candidate = base_slug
    counter = 1
    while True:
        existing = db.get_bot(candidate)
        if not existing:
            return candidate
        if requested_bot_id == candidate and existing.get("owner_user_id") == owner_id:
            return candidate

        candidate = f"{base_slug}-{counter}"
        counter += 1


# ===== Onboarding (Phase 03) — naya client bina code likhe live karo =====

# Naya bot ek command me banao (ya mojood ko update). JWT auth zaroori.
@app.post("/admin/create-bot")
def create_bot(req: CreateBotRequest, user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")

    final_bot_id = resolve_unique_bot_id(req.botId, req.name, user["id"])

    try:
        db.upsert_bot(
            final_bot_id, user["id"], req.name, req.accent, req.welcome,
            req.suggestions, req.allowedDomains, req.design,
            req.whatsappPhoneNumberId, req.notificationEmail, req.webhookUrl, req.googleSheetsUrl, req.templateCategory,
        )
    except psycopg.errors.InsufficientPrivilege:
        # RLS blocked it: fallback with timestamp suffix to guarantee uniqueness
        final_bot_id = f"{final_bot_id}-{int(time.time())}"
        db.upsert_bot(
            final_bot_id, user["id"], req.name, req.accent, req.welcome,
            req.suggestions, req.allowedDomains, req.design,
            req.whatsappPhoneNumberId, req.notificationEmail, req.webhookUrl, req.googleSheetsUrl, req.templateCategory,
        )
    except db.BotLimitExceeded as e:
        raise HTTPException(
            status_code=402,
            detail=f"Your plan allows up to {e.max_bots} bot(s). Upgrade to add another.",
        )
    return {"ok": True, "botId": final_bot_id}



# Caller's own plan/status — user panel billing view. JWT auth zaroori.
@app.get("/subscription")
def subscription(user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    sub = db.get_subscription(user["id"])
    if not sub:
        return {"plan": None, "status": "none"}
    return sub


# Paddle webhook — keeps `subscriptions` in sync with real payment events.
# NOT user-auth-gated (Paddle's servers call this, not a logged-in browser)
# — instead gated by HMAC signature verification. See billing.py's module
# docstring: structurally complete but not yet exercised against a live
# Paddle account (none exists for this project yet).
@app.post("/billing/paddle-webhook")
async def paddle_webhook(request: Request):
    raw_body = await request.body()
    if not billing.verify_signature(raw_body, request.headers.get("paddle-signature")):
        raise HTTPException(status_code=401, detail="invalid webhook signature")
    billing.handle_event(await request.json())
    return {"ok": True}


# Saare bots ki list (admin view) — sirf apne bots. JWT auth zaroori.
@app.get("/admin/bots")
def admin_bots(user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    return {"bots": db.list_bots_for_owner(user["id"])}


# Owner pause/resume their OWN bot — the widget goes dark (is_active=false)
# without deleting anything. Distinct from /superadmin/suspend-bot, which is
# platform moderation the owner can't touch; this only flips the owner's
# `paused` flag and is scoped to bots they own. JWT auth zaroori.
@app.post("/admin/pause-bot")
def admin_pause_bot(req: PauseBotRequest, user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    if not db.set_bot_paused(req.botId, user["id"], req.paused):
        raise HTTPException(status_code=404, detail=f"bot '{req.botId}' not found")
    return {"ok": True, "botId": req.botId, "paused": req.paused}


# Permanently delete an owned bot + its leads/chats/handoffs (DB cascade via
# explicit child deletes) and its documents/vectors (disk + ChromaDB).
# Irreversible. JWT auth zaroori + must own the bot.
@app.delete("/admin/bots/{bot_id}")
def admin_delete_bot(bot_id: str, user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    if not db.delete_bot_for_owner(bot_id, user["id"]):
        raise HTTPException(status_code=404, detail=f"bot '{bot_id}' not found")
    delete_bot_docs(bot_id)  # best-effort; the DB row is already gone
    return {"ok": True, "botId": bot_id}


# Dashboard ke numbers ek bot ke liye. JWT auth zaroori + must own the bot.
@app.get("/admin/stats")
def admin_stats(botId: str, user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    if not db.get_bot_for_owner(botId, user["id"]):
        raise HTTPException(status_code=404, detail=f"bot '{botId}' not found")
    return db.stats(botId, user["id"])


# Human handoff feed — hot/warm leads ke AI summaries. JWT auth zaroori + must own the bot.
@app.get("/admin/handoffs")
def admin_handoffs(botId: str, user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    if not db.get_bot_for_owner(botId, user["id"]):
        raise HTTPException(status_code=404, detail=f"bot '{botId}' not found")
    return {"handoffs": db.list_handoffs(botId, user["id"])}


# ===== Platform admin (superadmin panel) — sees every tenant, not just their
# own bots. Gated on PLATFORM_ADMIN_EMAILS, not ownership — every route here
# checks is_platform_admin() first and 403s otherwise, same as any other
# caller would get. This is a completely separate access model from the
# owner-scoped /admin/* routes above (which any signed-in user can use for
# their own bots) — the /superadmin prefix exists specifically so the two
# can never be confused with each other.
def _require_platform_admin(user: dict) -> None:
    if not is_platform_admin(user):
        raise HTTPException(status_code=403, detail="Not authorized")


@app.get("/superadmin/bots")
def superadmin_bots(user: CurrentUser):
    _require_platform_admin(user)
    check_rate_limit(f"admin:{user['id']}")
    return {"bots": db.list_all_bots()}


@app.get("/superadmin/stats")
def superadmin_stats(user: CurrentUser):
    _require_platform_admin(user)
    check_rate_limit(f"admin:{user['id']}")
    return db.platform_stats()


@app.get("/superadmin/leads")
def superadmin_leads(user: CurrentUser):
    _require_platform_admin(user)
    check_rate_limit(f"admin:{user['id']}")
    return {"leads": db.list_all_leads()}


@app.get("/superadmin/handoffs")
def superadmin_handoffs(user: CurrentUser):
    _require_platform_admin(user)
    check_rate_limit(f"admin:{user['id']}")
    return {"handoffs": db.list_all_handoffs()}



# Suspend/reactivate any bot, regardless of owner. See bots_update_platform_admin
# in schema.sql and db.set_bot_suspended()'s docstring for the trust model.
@app.post("/superadmin/suspend-bot")
def superadmin_suspend_bot(req: SuspendBotRequest, user: CurrentUser):
    _require_platform_admin(user)
    check_rate_limit(f"admin:{user['id']}")
    if not db.set_bot_suspended(req.botId, req.suspended):
        raise HTTPException(status_code=404, detail=f"bot '{req.botId}' not found")
    return {"ok": True, "botId": req.botId, "suspended": req.suspended}


VALID_PLANS = {"trial", "starter", "pro", "business", "enterprise"}
VALID_STATUSES = {"trialing", "active", "past_due", "canceled", "expired"}


# Manually set any account's plan/status — e.g. comping a client, fixing an
# out-of-band payment, or setting up a negotiated enterprise deal with custom
# caps (maxBots/maxMessagesPerMonth override the plan's usual defaults when
# given). Same trust model as a gateway webhook, just gated by
# is_platform_admin() instead of a signature check.
@app.post("/superadmin/set-plan")
def superadmin_set_plan(req: SetPlanRequest, user: CurrentUser):
    _require_platform_admin(user)
    check_rate_limit(f"admin:{user['id']}")
    if req.plan not in VALID_PLANS:
        raise HTTPException(status_code=400, detail=f"plan must be one of {sorted(VALID_PLANS)}")
    if req.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"status must be one of {sorted(VALID_STATUSES)}")
    db.set_owner_plan(req.ownerUserId, req.plan, req.status, req.maxBots, req.maxMessagesPerMonth)
    return {"ok": True}


@app.get("/superadmin/check")
def superadmin_check(user: CurrentUser):
    """Returns whether the current JWT user is a platform admin.
    Safe to call from DashboardClient to detect and redirect admins."""
    return {"is_admin": is_platform_admin(user), "email": user.get("email")}


@app.get("/superadmin/users")
def superadmin_users(user: CurrentUser):
    """All registered user accounts with plan info and bot count."""
    _require_platform_admin(user)
    check_rate_limit(f"admin:{user['id']}")
    return {"users": db.list_all_users()}


@app.get("/superadmin/chats")
def superadmin_chats(user: CurrentUser):
    """Per-bot chat statistics: total chats, top questions, unanswered count."""
    _require_platform_admin(user)
    check_rate_limit(f"admin:{user['id']}")
    return {"chats": db.platform_chat_stats()}


@app.get("/superadmin/analytics")
def superadmin_analytics(user: CurrentUser):
    """Full E2E analytics: funnel, time-series, bot performance, session metrics, platform health."""
    _require_platform_admin(user)
    check_rate_limit(f"admin:{user['id']}")
    return db.platform_analytics()


class DeleteUserRequest(BaseModel):
    userId: str
    confirm: bool = False


@app.post("/superadmin/delete-user")
def superadmin_delete_user(req: DeleteUserRequest, user: CurrentUser):
    """Permanently delete a user account + all their bots/data. Irreversible.
    Requires confirm=true to prevent accidents."""
    _require_platform_admin(user)
    check_rate_limit(f"admin:{user['id']}")
    if not req.confirm:
        raise HTTPException(status_code=400, detail="Set confirm=true to delete a user account")
    result = db.delete_user_and_bots(req.userId)
    if result is False:
        raise HTTPException(status_code=404, detail=f"User '{req.userId}' not found")
    # result is (True, [bot_ids]) when successful
    ok, bot_ids = result
    # Best-effort: delete each bot's vector docs
    for bot_id in bot_ids:
        try:
            delete_bot_docs(bot_id)
        except Exception:
            pass
    return {"ok": True, "deleted_bots": bot_ids}


# ---- Checkout (Razorpay for India, Stripe for everyone else) --------------
# Self-serve upgrade flow — the owner picks a plan in BillingCard.tsx, which
# also lets them choose the gateway explicitly (₹ vs $) rather than us
# guessing their country. Both create-* endpoints require the plan to have a
# configured price/plan id (razorpay_billing.PLAN_TO_RAZORPAY_PLAN_ID /
# stripe_billing.PLAN_TO_STRIPE_PRICE_ID) — until a real gateway account
# exists, both maps are empty and these 400 with a clear message rather than
# pretending to work (same "be honest, don't fake it" stance as billing.py's
# Paddle scaffold before it had a real account).
@app.post("/billing/stripe/create-checkout-session")
def create_stripe_checkout_session(req: CreateStripeCheckoutRequest, user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    if req.plan not in VALID_PLANS:
        raise HTTPException(status_code=400, detail=f"plan must be one of {sorted(VALID_PLANS)}")
    try:
        url = stripe_billing.create_checkout_session(
            req.plan, user["id"], user.get("email"), req.successUrl, req.cancelUrl
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"url": url}


@app.post("/billing/razorpay/create-subscription")
def create_razorpay_subscription(req: CreateRazorpaySubscriptionRequest, user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    if req.plan not in VALID_PLANS:
        raise HTTPException(status_code=400, detail=f"plan must be one of {sorted(VALID_PLANS)}")
    try:
        result = razorpay_billing.create_subscription(req.plan, user["id"], user.get("email"))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return result


# Razorpay webhook — keeps `subscriptions` in sync with real payment events
# for India. NOT user-auth-gated (Razorpay's servers call this) — instead
# gated by HMAC signature verification. See razorpay_billing.py's module
# docstring: structurally complete but not yet exercised against a live
# Razorpay account (none exists for this project yet).
@app.post("/billing/razorpay-webhook")
async def razorpay_webhook(request: Request):
    raw_body = await request.body()
    if not razorpay_billing.verify_webhook_signature(
        raw_body, request.headers.get("x-razorpay-signature")
    ):
        raise HTTPException(status_code=401, detail="invalid webhook signature")
    razorpay_billing.handle_event(await request.json())
    return {"ok": True}


# Stripe webhook — keeps `subscriptions` in sync with real payment events for
# everyone outside India. NOT user-auth-gated (Stripe's servers call this) —
# instead gated by Stripe's own SDK signature verification. See
# stripe_billing.py's module docstring: structurally complete but not yet
# exercised against a live Stripe account (none exists for this project yet).
@app.post("/billing/stripe-webhook")
async def stripe_webhook(request: Request):
    raw_body = await request.body()
    event = stripe_billing.verify_and_parse_event(raw_body, request.headers.get("stripe-signature"))
    if event is None:
        raise HTTPException(status_code=401, detail="invalid webhook signature")
    stripe_billing.handle_event(event)
    return {"ok": True}


# Client ki docs (text) bot me daalo aur re-index karo. JWT auth zaroori + must own the bot.
# Tighter limit than other admin routes — this recomputes embeddings, more
# expensive per call.
@app.post("/ingest")
def ingest(req: IngestRequest, user: CurrentUser):
    check_rate_limit(f"ingest:{user['id']}", limit=10)
    if not db.get_bot_for_owner(req.botId, user["id"]):
        raise HTTPException(
            status_code=404, detail=f"bot '{req.botId}' pehle create karo"
        )
    try:
        result = save_and_ingest(req.botId, req.filename, req.text)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True, **result}


@app.post("/demo/apply-template")
def demo_apply_template(req: ApplyTemplateRequest):
    """Studio / Demo path — applies template knowledge base & config to any botId instantly."""
    try:
        result = save_and_ingest(req.botId, f"{req.templateId}.txt", req.knowledgeText)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Demo/template bots ke liye DB save SKIP karo — owner_user_id=None
    # RLS policy todta hai. Knowledge already ChromaDB me hai, widget
    # /config fallback se aur /chat check_domain fallback se chal jaayega.
    # Sirf logged-in users (botId param present) ke liye DB me save karo.
    # (This is a public Studio path — no owner yet.)

    return {
        "ok": True,
        "botId": req.botId,
        "templateId": req.templateId,
        "chunks": result["chunks"],
        "files": result["files"],
    }



@app.post("/admin/apply-template")
def admin_apply_template(req: ApplyTemplateRequest, user: CurrentUser):
    """Signed-in user path — applies template knowledge base & updates bot config in DB."""
    check_rate_limit(f"admin:{user['id']}")
    try:
        result = save_and_ingest(req.botId, f"{req.templateId}.txt", req.knowledgeText)
        if req.name and req.accent:
            try:
                db.upsert_bot(
                    req.botId, user["id"], req.name, req.accent, req.welcome or "",
                    req.suggestions or [], ["*"], None, None, None, None, None, req.templateId
                )
            except Exception:
                pass
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "ok": True,
        "botId": req.botId,
        "templateId": req.templateId,
        "chunks": result["chunks"],
        "files": result["files"],
    }



# Uploaded knowledge files can't exceed this — protects the extractor + embedder
# from a giant file, and vision models cap out on huge images anyway.
MAX_UPLOAD_BYTES = 12 * 1024 * 1024  # 12 MB

_IMAGE_PROMPT = (
    "You are reading a business document image for a support chatbot's knowledge "
    "base. Transcribe ALL text in the image exactly and completely — prices, "
    "hours, names, contact details, every line. Preserve the order. Then, if "
    "there are meaningful non-text visuals, add one short line describing them. "
    "Output only the transcription and that optional line — no preamble."
)


def extract_image_text(data: bytes, mime: str) -> str:
    """OCR/describe an uploaded image via the free vision-model chain. Same
    try-in-order fallback as chat, since free slugs get rate-limited."""
    b64 = base64.b64encode(data).decode()
    url = f"data:{mime};base64,{b64}"
    messages = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": _IMAGE_PROMPT},
                {"type": "image_url", "image_url": {"url": url}},
            ],
        }
    ]
    client = get_client()
    last_error = None
    for model in VISION_MODELS:
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=1200,
                temperature=0,
            )
            text = resp.choices[0].message.content
            if text and text.strip():
                return text.strip()
        except Exception as e:
            last_error = e
            continue
    raise HTTPException(
        status_code=502,
        detail=f"Image ko abhi padh nahi paaye, thodi der baad try karo. ({last_error})",
    )


# Upload a real file (PDF / Word / text / Markdown / PNG / JPG) as knowledge.
# Text is extracted server-side (docs via pure-Python parsers, images via a
# vision model), then chunked + embedded like any pasted text. Same auth,
# ownership and rate limit as /ingest.
@app.post("/ingest-file")
async def ingest_file(
    user: CurrentUser,
    botId: str = Form(...),
    file: UploadFile = File(...),
):
    check_rate_limit(f"ingest:{user['id']}", limit=10)
    if not db.get_bot_for_owner(botId, user["id"]):
        raise HTTPException(status_code=404, detail=f"bot '{botId}' pehle create karo")

    filename = file.filename or "upload"
    ext = extract.file_ext(filename)
    if ext not in extract.SUPPORTED_EXTS and ext != ".doc":
        raise HTTPException(
            status_code=400,
            detail="Sirf PDF, Word (.docx), text, Markdown, PNG ya JPG file upload karo.",
        )

    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="File empty hai.")
    if len(data) > MAX_UPLOAD_BYTES:
        raise HTTPException(
            status_code=400,
            detail=f"File bahut badi hai (max {MAX_UPLOAD_BYTES // (1024 * 1024)}MB).",
        )

    try:
        if extract.is_image(filename):
            mime = file.content_type or "image/png"
            text = extract_image_text(data, mime)
        else:
            text = extract.extract_document_text(filename, data)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    # Save the *extracted* text as a .txt doc and re-index (reuses the same
    # chunk+embed path as pasted text). save_and_ingest re-validates it as text.
    try:
        result = save_and_ingest(botId, filename, text)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"ok": True, "filename": filename, "chars": len(text), **result}


# List uploaded documents for a bot
@app.get("/admin/docs")
def admin_list_docs(botId: str, user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    docs_list = list_bot_docs(botId)
    return {"ok": True, "botId": botId, "docs": docs_list}


# Delete a specific document for a bot and re-index
@app.delete("/admin/docs")
def admin_delete_doc(botId: str, filename: str, user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    res = delete_single_doc(botId, filename)
    return {"ok": True, "botId": botId, "filename": filename, **res}


# /chat = POST endpoint. User ka message OpenAI ko bhejta hai aur jawaab laata hai.
# Is % se kam match = "document me yeh baat nahi mili" → guess mat karo.
# On-topic sawaal ~31-59% aate hain, off-topic (jaise "capital of France") ~7%.
# 20 unke beech safe gap me hai.
RELEVANCE_THRESHOLD = 10


# Max tokens per LLM response — cost control + reasonable answer length.
MAX_TOKENS = 500


def call_llm(messages: list[dict]) -> tuple[str, str]:
    """Model chain try karo, pehla non-empty jawaab lauta do → (reply, model)."""
    client = get_client()
    last_error = None
    for model in MODELS:
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=MAX_TOKENS,
                temperature=0,  # grounded + deterministic — minimise hallucination
            )
            reply = resp.choices[0].message.content
            if reply and reply.strip():
                return reply.strip(), model
        except Exception as e:
            last_error = e  # 429/error → agla model
            continue
    raise HTTPException(
        status_code=502,
        detail=f"Sabhi free models abhi busy hain, thodi der baad try karo. ({last_error})",
    )


def check_domain(bot_id: str, origin: str | None) -> dict:
    """Widget sirf client ki allowed site se hi chale (widget churaya na jaye)."""
    bot = db.get_bot(bot_id)
    if not bot:
        if bot_id == "zeva-ai" or bot_id.startswith("demo-"):
            domain_name = "Zeva AI" if bot_id == "zeva-ai" else bot_id.replace("demo-", "").replace("-", " ").title()
            return {
                "bot_id": bot_id,
                "name": domain_name,
                "allowed_domains": ["*"],
                "is_active": True,
                "owner_user_id": None,
                "max_messages_per_month": 100000,
            }
        raise HTTPException(status_code=404, detail=f"bot '{bot_id}' not found")

    allowed = bot["allowed_domains"] or ["*"]
    if "*" not in allowed and origin:
        host = urlparse(origin).hostname or ""
        if host not in allowed:
            raise HTTPException(
                status_code=403, detail=f"'{host}' is bot ke liye allowed nahi hai"
            )
    return bot



# ---- Security (Phase 06): rate limit + input validation --------------------
# Har (bot + IP) par prati-minute limit — warna koi spam karke OpenRouter bill
# uda de. (In-memory; multi-server par Redis chahiye — DEPLOY-SECURITY.md me note.)
RATE_LIMIT_PER_MIN = 20
MAX_MESSAGE_LEN = 1000
_hits: dict[str, list[float]] = defaultdict(list)


def check_rate_limit(key: str, limit: int = RATE_LIMIT_PER_MIN) -> None:
    now = time.time()
    recent = [t for t in _hits[key] if t > now - 60]
    if len(recent) >= limit:
        raise HTTPException(status_code=429, detail="Too many requests — thodi der ruko")
    recent.append(now)
    _hits[key] = recent


@app.post("/chat")
def chat(req: ChatRequest, request: Request):
    # 0a. Input validation: khaali / bahut lamba message reject.
    msg = req.message.strip()
    if not msg:
        raise HTTPException(status_code=400, detail="message khaali hai")
    if len(msg) > MAX_MESSAGE_LEN:
        raise HTTPException(status_code=400, detail="message bahut lamba hai")

    # 0b. Rate limit per bot + IP (bill safe).
    ip = request.client.host if request.client else "?"
    check_rate_limit(f"{req.botId}:{ip}")

    # 0c. Domain allow-list: widget sirf client ki site se chale.
    bot = check_domain(req.botId, request.headers.get("origin"))

    # 0d. License gate: expired/canceled subscription → widget goes dark
    # server-side, regardless of what code is on the client's page. Bots
    # with no owner (pre-existing demo bots) are never gated.
    if not bot["is_active"]:
        answer = "This chat is temporarily unavailable — please contact the business directly."
        db.save_chat(req.botId, req.message, answer, is_guardrail=True)
        return {"answer": answer, "sources": [], "isGuardrail": True}

    # 0e. Monthly message cap (cost control) — only meaningful once a bot
    # has an owner+subscription; is_active above already confirmed one exists.
    if bot["owner_user_id"] and not db.check_usage_limit(
        req.botId, bot["owner_user_id"], bot["max_messages_per_month"]
    ):
        answer = (
            "This bot has reached its monthly message limit — please try again "
            "next month, or the owner can upgrade their plan."
        )
        db.save_chat(req.botId, req.message, answer, is_guardrail=True)
        return {"answer": answer, "sources": [], "isGuardrail": True}

    # 0f. Handle small talk, greetings, and identity questions warmly (English + Hinglish)
    msg_clean = req.message.lower().strip()
    is_conversational = any(
        re.search(pat, msg_clean)
        for pat in [
            r"^\s*(hi|hello|hey|hola|namaste|good\s+(morning|afternoon|evening))\b",
            r"^\s*who\s+(are\s+you|is\s+this|am\s+i|is\s+me)\b",
            r"^\s*(main|tum|aap)\s+(kya|kaun)\s+(hu|ho|hai)\b",
            r"^\s*kya\s+(chal\s+raha\s+hai|haal\s+hai|kar\s+sakte\s+ho)\b",
            r"^\s*what\s+is\s+your\s+name\b",
            r"^\s*how\s+are\s+you\b",
            r"^\s*(thanks|thank\s+you|dhanyawad)\b",
            r"^\s*tell\s+me\s+about\s+yourself\b",
        ]
    )

    if is_conversational:
        bot_name = bot.get("name") or "Zeva AI"
        if "thanks" in msg_clean or "thank you" in msg_clean or "dhanyawad" in msg_clean:
            greeting_ans = f"You're very welcome! Feel free to ask if you have any more questions about {bot_name}."
        elif any(w in msg_clean for w in ["who", "kaun", "kya hu", "kya ho", "yourself"]):
            greeting_ans = f"Main {bot_name} ka AI assistant hu! Main aapke services, pricing, hours aur policies ke sawalon ke jawaab de sakta hu. Aap {bot_name} ke bare me kya janna chahte hain?"
        else:
            greeting_ans = f"Hello! Welcome to {bot_name}. I'm here to answer your questions and help you out. How can I assist you today?"
        db.save_chat(req.botId, req.message, greeting_ans, is_guardrail=False)
        return {"answer": greeting_ans, "sources": [], "isGuardrail": False}

    # 1. RAG retrieval: SIRF is bot ke documents me se related chunks dhoondo.
    try:
        hits = retrieve(req.message, req.botId, k=3)
        print(f"[chat] bot={req.botId} msg='{req.message[:50]}' → {len(hits)} raw hits")
        for h in hits:
            print(f"  → match={h['match']}% file={h['file']} snip={h['snip'][:80]}")
    except Exception as exc:
        print(f"[chat] RETRIEVE FAILED for bot={req.botId}: {exc}")
        hits = []  # DB missing/khaali → neeche guardrail par chala jaayega
    good = [h for h in hits if h["match"] >= RELEVANCE_THRESHOLD]

    # 2. Kuch relevant nahi mila: Differentiate human contact intent vs casual off-topic questions.
    if not good:
        wants_human = any(
            re.search(pat, msg_clean)
            for pat in [
                r"\b(talk|speak|connect|reach)\s+to\s+(human|person|agent|team|support|sales|owner|manager)\b",
                r"\b(contact|phone|email|call|number)\b",
                r"\b(book|appointment|schedule|buy|order)\b",
                r"\b(human|agent|support)\s+(please|help|needed)\b",
            ]
        )

        if wants_human:
            answer = (
                f"Would you like to connect directly with the {bot['name']} team? "
                "Please leave your contact details below and our team will reach out!"
            )
            db.save_chat(req.botId, req.message, answer, is_guardrail=True)
            return {"answer": answer, "sources": [], "isGuardrail": True}

        # Off-topic / Random question fallback — Polite conversational redirection (NO lead form popup)
        answer = (
            f"Main {bot['name']} ka dedicated AI assistant hu. Mujhe '{req.message}' ke bare me {bot['name']} ke documents me jankari nahi mili. "
            f"Aap {bot['name']} ki services, pricing, hours ya policies ke bare me pooch sakte hain!"
        )
        db.save_chat(req.botId, req.message, answer, is_guardrail=False)
        return {"answer": answer, "sources": [], "isGuardrail": False}


    # 3. Mila → SIRF context se grounded jawaab do, aur proof sources laut do.
    context = "\n\n".join(f"[{h['file']}]\n{h['text']}" for h in good)
    try:
        answer, model = call_llm(
            [
                {
                    "role": "system",
                    "content": (
                        f"You are the friendly, helpful AI assistant for {bot['name']}. "
                        "Answer strictly using the CONTEXT below. Keep answers conversational, clear, "
                        "and helpful. Reply in the same language as the visitor."
                    ),
                },
                {"role": "user", "content": f"CONTEXT:\n{context}\n\nQUESTION: {req.message}"},
            ]
        )
    except Exception as llm_err:
        print(f"[chat] LLM call exception, using grounded context fallback: {llm_err}")
        answer = good[0]['text'][:350]
        model = "retrieval-fallback"

    db.save_chat(req.botId, req.message, answer, is_guardrail=False)
    return {"answer": answer, "sources": good[:1], "model": model, "isGuardrail": False}



# ===== Meta WhatsApp Cloud API Webhook Integration ===========================
WA_VERIFY_TOKEN = os.getenv("WHATSAPP_VERIFY_TOKEN", "zeva-secret-verify-123")
WA_TOKEN = os.getenv("WHATSAPP_TOKEN", "")


async def send_whatsapp_reply(phone_number_id: str, to: str, message_text: str):
    """Send text response to WhatsApp recipient via Meta Graph API."""
    token = os.getenv("WHATSAPP_TOKEN", "")
    if not token or not phone_number_id:
        return
    url = f"https://graph.facebook.com/v21.0/{phone_number_id}/messages"
    payload = {
        "messaging_product": "whatsapp",
        "to": to,
        "type": "text",
        "text": {"body": message_text},
    }
    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json",
    }
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            resp.raise_for_status()
    except Exception as e:
        print(f"[WhatsApp] Failed to send reply to {to}: {e}")


@app.get("/whatsapp/webhook")
def whatsapp_verify(request: Request):
    """Meta Webhook verification handshake (one-off on Meta dashboard configuration)."""
    p = request.query_params
    mode = p.get("hub.mode")
    token = p.get("hub.verify_token")
    challenge = p.get("hub.challenge")

    if mode == "subscribe" and token == WA_VERIFY_TOKEN:
        from fastapi import Response
        return Response(content=challenge, media_type="text/plain")
    raise HTTPException(status_code=403, detail="Invalid verification token")


@app.post("/whatsapp/webhook")
async def whatsapp_incoming(request: Request):
    """Receive incoming WhatsApp user message, run RAG, and reply via WhatsApp API."""
    try:
        data = await request.json()
    except Exception:
        return {"ok": True}

    try:
        entry = data["entry"][0]["changes"][0]["value"]
        msg = entry["messages"][0]
    except (KeyError, IndexError):
        # Ignore delivery/read receipts ('statuses') — return 200 OK fast
        return {"ok": True}

    if msg.get("type") != "text":
        return {"ok": True}  # Skip non-text attachments for now

    sender_phone = msg.get("from")
    user_message = (msg.get("text", {}).get("body") or "").strip()
    phone_number_id = entry.get("metadata", {}).get("phone_number_id")

    if not user_message or not sender_phone:
        return {"ok": True}

    # Resolve bot configuration from WhatsApp Phone Number ID (or fallback)
    bot = None
    if phone_number_id:
        bot = db.get_bot_by_whatsapp_phone_id(phone_number_id)
    bot_id = bot["bot_id"] if bot else "acme-salon"
    bot_name = bot["name"] if bot else "Zeva Assistant"

    # RAG Retrieval & LLM Generation
    try:
        hits = retrieve(user_message, bot_id, k=3)
    except Exception:
        hits = []

    good = [h for h in hits if h["match"] >= RELEVANCE_THRESHOLD]

    if not good:
        answer = (
            f"I couldn't find that in {bot_name}'s documents. "
            "Our team will get back to you shortly!"
        )
        db.save_chat(bot_id, user_message, answer, is_guardrail=True)
    else:
        context = "\n\n".join(f"[{h['file']}]\n{h['text']}" for h in good)
        answer, _model = call_llm(
            [
                {
                    "role": "system",
                    "content": (
                        f"You are the helpful assistant for {bot_name} on WhatsApp. "
                        "Answer ONLY using the CONTEXT below. Keep answers concise for WhatsApp."
                    ),
                },
                {"role": "user", "content": f"CONTEXT:\n{context}\n\nQUESTION: {user_message}"},
            ]
        )
        db.save_chat(bot_id, user_message, answer, is_guardrail=False)

    # Send outbound WhatsApp message back to user
    await send_whatsapp_reply(phone_number_id, sender_phone, answer)
    return {"ok": True}


class DemoIngestUrlRequest(BaseModel):
    url: str


@app.post("/demo/ingest-url")
async def demo_ingest_url(req: DemoIngestUrlRequest):
    """Scrape website URL, index page text, and return temporary demo bot credentials."""
    import re
    raw_url = req.url.strip()
    if not raw_url:
        raise HTTPException(status_code=400, detail="URL cannot be empty")

    if not raw_url.startswith(("http://", "https://")):
        raw_url = "https://" + raw_url

    try:
        from urllib.parse import urlparse
        parsed = urlparse(raw_url)
        domain = parsed.netloc or parsed.path
        domain_clean = re.sub(r"[^a-zA-Z0-9]", "", domain.lower()) or "demo"
    except Exception:
        domain = "customsite.com"
        domain_clean = "customsite"

    slug_bot_id = f"demo-{domain_clean[:20]}"

    scraped_text = ""
    site_title = domain

    try:
        async with httpx.AsyncClient(timeout=10.0, follow_redirects=True) as client:
            resp = await client.get(raw_url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ZevaBot/1.0"})
            if resp.status_code == 200:
                html = resp.text
                title_match = re.search(r"<title[^>]*>(.*?)</title>", html, re.IGNORECASE | re.DOTALL)
                if title_match:
                    site_title = re.sub(r"\s+", " ", title_match.group(1)).strip() or domain
                # Clean text
                clean_html = re.sub(r"<(script|style)[^>]*>.*?</\1>", " ", html, flags=re.DOTALL | re.IGNORECASE)
                scraped_text = re.sub(r"<[^>]+>", " ", clean_html)
                scraped_text = re.sub(r"\s+", " ", scraped_text).strip()
    except Exception as e:
        print(f"[DemoIngestUrl] Failed to scrape {raw_url}: {e}")

    if not scraped_text or len(scraped_text) < 50:
        scraped_text = f"{site_title} ({domain}) provides quality services and customer assistance."

    # Save and ingest chunks in vector store
    try:
        save_and_ingest(slug_bot_id, f"{domain_clean}.txt", scraped_text[:12000])
    except Exception as e:
        print(f"[DemoIngestUrl] Ingest warning: {e}")

    return {
        "ok": True,
        "botId": slug_bot_id,
        "name": site_title,
        "welcome": f"Welcome to {site_title}! Ask me anything about our site content.",
        "suggestions": [f"What is {site_title}?", "What services do you offer?", "How do I contact support?"],
    }


if __name__ == "__main__":
    import uvicorn
    # Active reload trigger
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)




