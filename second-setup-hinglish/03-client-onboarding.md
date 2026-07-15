# Phase 03 — Naye Client ko Onboard Karna 🤝

**Yehi woh "setup hai jo tum client ko dikhaoge."** Is phase ka goal: ek naye client ko **zero se live** karne ka ek saaf, dohraaya jaane wala (repeatable) tareeka. Jitni baar client aaye, bas yehi 5 step. Aaj 2 din lagte hain — target: **2-3 ghante me live.**

**Time: ~2-3 ghante (setup), phir har client 2-3 ghante**

## Shuru karne se pehle ✅
- Phase 01 + 02 ho gaye (widget real hai, multi-tenant hai).

---

## Onboarding ke 5 Step (ye tumhara "menu card" hai)

### Step 1: Naya bot banao
`bots` table me ek row: `bot_id` (jaise `bright-dental`), naam, color, welcome.

> Chhota helper script/endpoint bana lo: `POST /admin/create-bot` — ek command me naya bot ready.

### Step 2: Client ki docs ingest karo
Client se lo: website ka text, PDF price list, FAQ, policy. `/ingest` se us `bot_id` me daalo.

**Kaise check karein:** `/chat` me client ke business ka sawaal poocho → sahi jawab + source aaye. ✅

**Samajh lo:** Jitni saaf aur poori docs, utne ache jawab. Client se pehle hi accha content maang lo (ye sabse zaroori input hai).

### Step 3: Studio se widget brand karo
Apni Studio kholo → client ka color, font, launcher style, position set karo → **embed code copy** karo.

**Kaise check karein:** Studio me color badlo → widget usi rang me. Embed code me `data-accent` sahi dikhe. ✅

### Step 4: Embed line client ki site pe lagao
Woh ek line (`<script ...>`) client ki site pe paste karo — ya client ko screenshot ke saath 2-line instruction bhejo (WordPress/Shopify/plain HTML — sabme same).

**Kaise check karein:** Client ki site kholo → corner me widget aaye → asli jawab de. ✅

### Step 5: Test + handover
- 10-15 asli sawaal test karo (jo customer poochenge).
- "Pata nahi" wala case test karo (jhooth na bole).
- Ek lead khud daal ke dekho ki save ho rahi hai.
- Client ko dashboard link do (Phase 04).

---

## Task: Ek "Onboarding Checklist" file banao (har client ke liye)

Ek chhoti template rakho jise har naye client ke liye copy karo:

```
Client: ____________   Bot ID: ____________   Date: ______
[ ] Docs mili (website/PDF/FAQ)
[ ] Bot banaya + ingest kiya
[ ] 15 sawaal test — sahi jawab
[ ] "Pata nahi" test pass
[ ] Studio se branding + embed
[ ] Site pe laga + live test
[ ] Lead capture test
[ ] Dashboard link diya
[ ] Retainer + payment set
```

**Samajh lo:** Yehi checklist tumhe "freelancer" se "product wala" banati hai — har baar same quality, kam galti, jaldi delivery.

---

## ✅ Checklist
- [ ] "Create bot" ka easy tareeka hai
- [ ] Ek dummy client (jaise "Bright Dental") ko poora onboard kar liya
- [ ] Studio → embed → site → live — pura flow ek baar chal gaya
- [ ] Onboarding checklist template ready hai

👉 **Agla: `04-admin-dashboard.md`**
