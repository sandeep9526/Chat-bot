# Phase 06 — Production Deploy + Security 🔒

Client ki site pe bot **24/7 bina toote** chalna chahiye, aur secure hona chahiye. Ye tumhari asli taakat hai (DevOps + security skills). Yahi cheez tumhe saste no-code tools se alag banati hai.

**Time: ~4-5 ghante**

## Shuru karne se pehle ✅
- Phase 01-05 local pe chal rahe hain.

---

## Task 1: Sahi hosting choose karo
- **Frontend (widget + dashboard):** Vercel.
- **Backend (FastAPI):** Render / Railway / Fly.io. (Vercel pe streaming + long tasks ke liye backend alag rakho.)
- **DB + vectors:** 3-4 client ho gaye? **Supabase (Postgres + pgvector)** pe shift karo — SQLite/Chroma local single-server tak theek, production multi-client ke liye Postgres behtar.

**Kaise check karein:** Live URL pe backend `/docs` aur widget dono khulein. ✅

---

## Task 2: Secrets sirf server pe
- Saari keys (OpenAI, Supabase) **environment variables** me — kabhi widget me nahi, kabhi GitHub pe nahi.
- Widget sirf `botId` + public API URL jaanta hai, aur kuch nahi.

**Kaise check karein:** Browser me widget ka code dekho → koi API key na dikhe. ✅

---

## Task 3: Rate limiting (bill bachao) ⚠️
Har `botId` + IP pe limit lagao (jaise 20 message/minute). Warna koi bot spam karke tumhara OpenAI bill uda dega.

**Kaise check karein:** Tez-tez 30 request bhejo → kuch ke baad "too many requests" aaye. ✅

**Samajh lo:** API paisa leti hai. Bina limit ke ek buri raat me bada bill aa sakta hai. Ye line skip mat karna.

---

## Task 4: Baaki security basics
- **Input validation:** message ki length cap karo, junk reject karo.
- **Domain allow-list:** (Phase 02 se) — widget sirf client ki site pe chale.
- **HTTPS everywhere:** sab jagah https.
- **Prompt-injection:** system prompt firm rakho ("sirf context se jawab do") — user ya doc ka text "instruction" ki tarah mat maano.

**Kaise check karein:** Bahut lamba junk message bhejo → reject ho. Doosri site se widget → na chale. ✅

---

## Task 5: Per-client usage track karo
Har client ka token/API usage note karo (kaunsa bot kitna use kar raha). Isse pata rahega retainer se profit ho raha hai ya nahi.

**Samajh lo:** Retainer hamesha asli API+hosting cost se upar hona chahiye. Ek bhaari client se ghata na ho, isliye track karo aur zaroorat pade to us plan pe limit ya extra charge lagao.

---

## Task 6: Monitoring + backup
- **Uptime check:** koi free uptime monitor lagao (bot down ho to tumhe pata chale, client ko nahi).
- **Error logs:** backend errors dekhne ka tareeka (Render/Railway logs).
- **DB backup:** leads ka daily backup (Supabase auto karta hai).

**Kaise check karein:** Backend band karke dekho → uptime monitor alert de. ✅

---

## ✅ Checklist
- [ ] Backend + frontend live, custom URL pe
- [ ] Saari keys sirf env me (widget/GitHub me nahi)
- [ ] Rate limiting laga (bill safe)
- [ ] Input validation + domain allow-list + HTTPS
- [ ] Per-client usage track ho raha hai
- [ ] Uptime monitor + logs + backup

👉 **Agla: `07-client-demo-aur-pitch.md`**
