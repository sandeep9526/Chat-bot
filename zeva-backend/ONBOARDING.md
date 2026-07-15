# 🤝 Client Onboarding — Menu Card (har naye client ke liye)

Naya client ko **live** karne ka repeatable tareeka. Har baar bas yehi 5 step.
`API` = `http://127.0.0.1:8000` (production me apna live URL).

> **Preferred path now:** the frontend's `/onboarding` wizard does all 5 steps
> below through a guided UI (sign in → name bot → upload docs → brand → embed
> code) — no curl needed. This file stays as the manual/scriptable reference
> (bulk-onboarding many clients, or debugging).

> Har client ke liye is file ki ek copy banao aur boxes tick karte jao.

**Every `/admin/*` and `/ingest` call below needs a real JWT now** (Better
Auth, not the old `ADMIN_KEY`). Get one:
```bash
# after signing in via the frontend, from the browser's session cookie:
curl http://localhost:3000/api/auth/token -b cookies.txt   # → {"token": "..."}
TOKEN="paste-that-token-here"   # valid ~15 minutes, refetch when it expires
```

```
Client: ____________   Bot ID: ____________   Date: ______
```

---

## Step 1 — Naya bot banao  (`POST /admin/create-bot`)

```bash
curl -X POST $API/admin/create-bot -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{
  "botId": "bright-dental",
  "name": "Bright Dental",
  "accent": "#0ea5e9",
  "welcome": "Ask about our services, timings, and pricing.",
  "suggestions": ["What are your timings?", "How much is teeth cleaning?"],
  "allowedDomains": ["*"]
}'
```
- First bot for a new account auto-starts a 14-day trial (1 bot, 500 msgs/mo).
  A second bot on the trial plan gets `402 Payment Required` until upgraded.
- `botId` = chhota unique naam (jaise `bright-dental`).
- `allowedDomains`: live jaate waqt `["brightdental.com"]` kar do (widget sirf unki site pe chale).

**Check:** `GET $API/config?botId=bright-dental` → wahi data wapas aaye. ✅

- [ ] Bot ban gaya

---

## Step 2 — Client ki docs daalo  (`POST /ingest`)

Client se lo: website ka text, price list, FAQ, timings, policies. Har cheez ek call:

```bash
curl -X POST $API/ingest -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{
  "botId": "bright-dental",
  "filename": "services.txt",
  "text": "Bright Dental — Services & Pricing. Consultation Rs. 300. Root canal from Rs. 3,500..."
}'
```
- Jitni saaf aur poori docs, utne ache jawab. **Wahi shabd daalo jo customer poochta hai** (jaise "timings" + "hours" dono).
- Ek client ke kai docs = kai `/ingest` call (alag `filename`).

**Check:** `POST $API/chat` me client ke business ka sawaal → sahi jawab + source. ✅

- [ ] Docs ingest ho gaye (`{"ok":true,"chunks":N}`)
- [ ] 10-15 asli sawaal test kiye — sahi jawab
- [ ] "Pata nahi" test pass (off-topic → guardrail, jhooth nahi bola)

---

## Step 3 — Studio se branding + embed code

Studio kholo (`/studio`) → client ka color, logo, panel background, launcher style, position set karo → **"Copy" se embed code** lo.

**Check:** color badlo → widget usi rang me; embed me `data-accent` sahi. ✅

- [ ] Branding set (color/logo/font/position)
- [ ] Embed code copy kiya

---

## Step 4 — Embed line client ki site pe

Woh ek line (`<script ... data-bot-id="bright-dental" ...>`) client ki site pe paste karo (WordPress/Shopify/plain HTML — sabme same).

**Check:** client ki site kholo → corner me widget → asli jawab de. ✅

- [ ] Site pe laga + live test

---

## Step 5 — Test + handover

- [ ] Ek lead khud daal ke dekha (`GET $API/leads?botId=...` me dikhi)
- [ ] `allowedDomains` client ki site pe lock kiya
- [ ] Client ko dashboard link diya (Phase 04)
- [ ] Retainer + payment set

---

## Quick reference — saare bots dekho (sirf apne, jo tumne banaye)
```bash
curl $API/admin/bots -H "Authorization: Bearer $TOKEN"
```

> 🔒 Auth ab JWT-based hai (Better Auth, frontend se) — `ADMIN_KEY` mechanism
> hata diya gaya. `/leads`, `/admin/stats`, `/admin/handoffs` bhi same Bearer
> token maangte hain, aur sirf apne bots ka data dikhate hain (dusre client
> ka data 404 aayega, chahe woh bhi authenticated ho — Postgres Row-Level
> Security se enforce hota hai, sirf app code se nahi).
