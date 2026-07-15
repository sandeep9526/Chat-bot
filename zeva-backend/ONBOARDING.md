# 🤝 Client Onboarding — Menu Card (har naye client ke liye)

Naya client ko **live** karne ka repeatable tareeka. Har baar bas yehi 5 step.
`API` = `http://127.0.0.1:8000` (production me apna live URL).

> Har client ke liye is file ki ek copy banao aur boxes tick karte jao.

```
Client: ____________   Bot ID: ____________   Date: ______
```

---

## Step 1 — Naya bot banao  (`POST /admin/create-bot`)

```bash
curl -X POST $API/admin/create-bot -H "Content-Type: application/json" -d '{
  "botId": "bright-dental",
  "name": "Bright Dental",
  "accent": "#0ea5e9",
  "welcome": "Ask about our services, timings, and pricing.",
  "suggestions": ["What are your timings?", "How much is teeth cleaning?"],
  "allowedDomains": ["*"]
}'
```
- `botId` = chhota unique naam (jaise `bright-dental`).
- `allowedDomains`: live jaate waqt `["brightdental.com"]` kar do (widget sirf unki site pe chale).

**Check:** `GET $API/config?botId=bright-dental` → wahi data wapas aaye. ✅

- [ ] Bot ban gaya

---

## Step 2 — Client ki docs daalo  (`POST /ingest`)

Client se lo: website ka text, price list, FAQ, timings, policies. Har cheez ek call:

```bash
curl -X POST $API/ingest -H "Content-Type: application/json" -d '{
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

## Quick reference — saare bots dekho
```bash
curl $API/admin/bots
```

> 🔒 Production me `.env` me `ADMIN_KEY` set karo; phir har `/admin/*` aur `/ingest`
> call me header `-H "x-admin-key: <key>"` lagana padega (Phase 06 security).
