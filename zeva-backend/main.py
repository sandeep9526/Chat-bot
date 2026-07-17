"""
Zeva backend — FastAPI server.

Phase 2: basic server ( /  aur  /health ).
Phase 3: OpenAI se jud kar  /chat  endpoint (abhi RAG/documents nahi — seedha AI).
"""

import os
import time
from collections import defaultdict
from urllib.parse import urlparse

import psycopg
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import OpenAI
from dotenv import load_dotenv

import billing
import db
from ingest import save_and_ingest
from rag import retrieve
from auth import CurrentUser

# .env file me se secret keys ko memory (environment) me load karo.
load_dotenv()

# Fail fast if Postgres is unreachable. Schema + RLS live in schema.sql
# (applied once via the admin connection) — not recreated on every boot.
db.init_db()

# Platform admin (superadmin panel — sees every tenant, not just their own
# bots). Comma-separated allow-list, checked against the JWT's own email
# (Better Auth's token — not client-suppliable). Empty by default: the
# superadmin panel is fail-closed for everyone until this is explicitly set.
PLATFORM_ADMIN_EMAILS = {
    e.strip().lower() for e in os.getenv("PLATFORM_ADMIN_EMAILS", "").split(",") if e.strip()
}


def is_platform_admin(user: dict) -> bool:
    return (user.get("email") or "").lower() in PLATFORM_ADMIN_EMAILS

# OpenRouter OpenAI-compatible hai — isliye wahi `openai` SDK use hota hai,
# bas base URL aur key badalte hain. `:free` models bina paise ke chalte hain.
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"

# Free models kabhi-kabhi "temporarily rate-limited" (429) ho jaate hain. Isliye
# ek list order me try karte hain — pehla jo available ho, wahi jawaab de deta hai.
# Sirf achhe, bharose-mand instruct models. (auto-router "openrouter/free" hata
# diya kyunki wo kabhi-kabhi Nemotron jaise models pe ja kar bakwaas jawaab deta tha.)
FALLBACK_MODELS = [
    "google/gemma-4-31b-it:free",
    "openai/gpt-oss-120b:free",
    "meta-llama/llama-3.3-70b-instruct:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "google/gemma-4-26b-a4b-it:free",
]

# .env me OPENROUTER_MODEL set ho to sirf wahi use hoga (list ignore).
_forced = os.getenv("OPENROUTER_MODEL")
MODELS = [_forced] if _forced else FALLBACK_MODELS

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
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


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
    botId: str
    name: str
    accent: str = "#4f46e5"
    welcome: str = ""
    suggestions: list[str] = []
    allowedDomains: list[str] = ["*"]


class IngestRequest(BaseModel):
    botId: str
    filename: str
    text: str


# ---- OpenRouter client ------------------------------------------------------
# Client ko "lazy" banaya hai: bina API key ke bhi server chalu ho jaaye (taaki
# /  aur  /health  test ho sakein). Key na hone par error sirf /chat par aayega.
def get_client() -> OpenAI:
    return OpenAI(
        base_url=OPENROUTER_BASE_URL,
        api_key=os.getenv("OPENROUTER_API_KEY"),
        timeout=30,       # 30s baad clean error do (hang na ho)
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
# as a simple in-code map (not a DB table) — there are no real Paddle price
# IDs yet (billing.py's PRICE_TO_PLAN is still empty), so a full feature-flag
# system would be speculative. Add rows here as new gated features ship.
PLAN_FEATURES = {
    "trial": {"whitelabel": False},
    "starter": {"whitelabel": False},
    "pro": {"whitelabel": True},
    "business": {"whitelabel": True},
}


@app.get("/config")
def config(botId: str = "acme-salon"):
    bot = db.get_bot(botId)
    if not bot:
        raise HTTPException(status_code=404, detail=f"bot '{botId}' not found")
    features = PLAN_FEATURES.get(bot["plan"], {})
    return {
        "botId": bot["bot_id"],
        "name": bot["name"],
        "accent": bot["accent"],
        "welcome": bot["welcome"],
        "suggestions": bot["suggestions"] or [],
        # Server-authoritative — the embed's own data-whitelabel attribute is
        # only a request; this is the grant. See public/widget.js.
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


# /lead = warm-lead ticket submit hone par yahan aata hai → DB me save + score.
@app.post("/lead")
def lead(req: LeadRequest, request: Request):
    # Rate-limit lead submissions too (spam / PII-flooding protection).
    ip = request.client.host if request.client else "?"
    check_rate_limit(f"lead:{req.botId}:{ip}")
    if not req.name.strip() or not req.email.strip():
        raise HTTPException(status_code=400, detail="name and email are required")
    score = score_lead(req.message, req.phone)
    lead_id = db.save_lead(
        req.botId, req.name.strip(), req.email.strip(), req.phone, req.message, score
    )
    # HOT/WARM lead → human handoff: AI summary sales team ke liye (abhi DB me;
    # Phase 05 guide me bataya hai isse Slack/WhatsApp/email par kaise bhejein).
    if score in ("hot", "warm"):
        bot = db.get_bot(req.botId)
        summary = make_handoff_summary(
            bot["name"] if bot else req.botId, req.name.strip(), req.message
        )
        db.save_handoff(req.botId, req.name.strip(), req.phone or req.email, summary)
    return {"ok": True, "leadId": lead_id, "score": score}


# /leads = ek bot ke saare leads (dashboard). JWT auth zaroori + must own the bot.
@app.get("/leads")
def leads(botId: str, user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    if not db.get_bot_for_owner(botId, user["id"]):
        raise HTTPException(status_code=404, detail=f"bot '{botId}' not found")
    return {"leads": db.list_leads(botId, user["id"])}


# ===== Onboarding (Phase 03) — naya client bina code likhe live karo =====

# Naya bot ek command me banao (ya mojood ko update). JWT auth zaroori.
@app.post("/admin/create-bot")
def create_bot(req: CreateBotRequest, user: CurrentUser):
    check_rate_limit(f"admin:{user['id']}")
    try:
        db.upsert_bot(
            req.botId, user["id"], req.name, req.accent, req.welcome,
            req.suggestions, req.allowedDomains,
        )
    except psycopg.errors.InsufficientPrivilege:
        # RLS blocked it: bot_id already exists and belongs to someone else.
        raise HTTPException(
            status_code=403, detail=f"bot '{req.botId}' already exists"
        )
    except db.BotLimitExceeded as e:
        raise HTTPException(
            status_code=402,
            detail=f"Your plan allows up to {e.max_bots} bot(s). Upgrade to add another.",
        )
    return {"ok": True, "botId": req.botId}


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
    result = save_and_ingest(req.botId, req.filename, req.text)
    return {"ok": True, **result}


# /chat = POST endpoint. User ka message OpenAI ko bhejta hai aur jawaab laata hai.
# Is % se kam match = "document me yeh baat nahi mili" → guess mat karo.
# On-topic sawaal ~31-59% aate hain, off-topic (jaise "capital of France") ~7%.
# 20 unke beech safe gap me hai.
RELEVANCE_THRESHOLD = 20


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

    # 1. RAG retrieval: SIRF is bot ke documents me se related chunks dhoondo.
    try:
        hits = retrieve(req.message, req.botId, k=3)
    except Exception:
        hits = []  # DB missing/khaali → neeche guardrail par chala jaayega
    good = [h for h in hits if h["match"] >= RELEVANCE_THRESHOLD]

    # 2. Kuch relevant nahi mila → guess mat karo, human ko route karo (guardrail).
    if not good:
        answer = (
            "I couldn’t find that in the documents — so I won’t guess. "
            "Let me hand you to the team instead."
        )
        db.save_chat(req.botId, req.message, answer, is_guardrail=True)
        return {"answer": answer, "sources": [], "isGuardrail": True}

    # 3. Mila → SIRF context se grounded jawaab do, aur proof sources laut do.
    #    Context me poora chunk (h['text']) bhejo — snip truncate ho jaata hai.
    context = "\n\n".join(f"[{h['file']}]\n{h['text']}" for h in good)
    answer, model = call_llm(
        [
            {
                "role": "system",
                "content": (
                    f"You are the helpful assistant for {bot['name']}. "
                    "Answer ONLY using the CONTEXT below. If the answer is not in "
                    "the context, clearly say you don't know and offer to connect "
                    "the visitor with the team. Keep answers short and clear, and "
                    "reply in the same language the visitor used."
                ),
            },
            {"role": "user", "content": f"CONTEXT:\n{context}\n\nQUESTION: {req.message}"},
        ]
    )
    db.save_chat(req.botId, req.message, answer, is_guardrail=False)
    # sources me sirf top proof (prototype ki tarah ek card). model debug ke liye.
    return {"answer": answer, "sources": good[:1], "model": model, "isGuardrail": False}
