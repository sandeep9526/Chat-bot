# Phase 04 — Chhota Admin Dashboard 📊

Client ko jab **numbers dikhte hain** — "is hafte 18 leads aaye" — tab woh kabhi cancel nahi karta. Aur tumhare liye bhi 5-10 client ek jagah se manage karna aasan ho jaata hai. Bada fancy dashboard nahi chahiye — chhota, kaam ka.

**Time: ~4-5 ghante**

## Shuru karne se pehle ✅
- Phase 01-03 ho gaye. Leads aur chats DB me `bot_id` ke saath save ho rahe hain.

---

## Task 1: Login (simple)

Ek basic auth lagao (Next.js + Supabase auth, ya ek simple password-protected admin route). Har client apna hi data dekhe.

**Kaise check karein:** Bina login dashboard na khule. ✅

---

## Task 2: Dashboard ke 4 sabse zaroori cards

Bas ye 4 numbers dikhao (isse zyada abhi mat karo):

| Card | Kya dikhata hai |
|---|---|
| **Leads is mahine** | Kitne naye leads aaye |
| **Total chats** | Kitni baar bot se baat hui |
| **Top sawaal** | Log kya sabse zyada poochte hain |
| **Warm leads** | Kitne "ready to buy" the |

**Samajh lo:** "Top sawaal" tumhare liye sona hai — usse pata chalta hai client ki docs me kya missing hai (aur tum use behtar kar sakte ho).

---

## Task 3: Leads ki list (download bhi)

Ek table: naam, email, phone, sawaal, date, score (hot/warm/cold). Upar ek **"Download CSV"** button.

**Kaise check karein:** Leads dikhein, CSV download ho aur Excel me khule. ✅

**Samajh lo:** Client CSV maangega taaki apne sales team ko de sake. Ye chhoti cheez badi value deti hai.

---

## Task 4: Docs upload + re-index (client khud kare)

Ek page jahan client apni nayi PDF/text upload kare aur bot update ho jaye — tumhe har baar bolne ki zaroorat na pade.

**Kaise check karein:** Nayi doc upload karo → us doc ka sawaal bot sahi jawab de. ✅

---

## Task 5: Embed code + widget settings

Dashboard me hi Studio (branding) aur embed code rakho, taaki client (ya tum) kabhi bhi color/position badal sako.

**Kaise check karein:** Dashboard se color badlo → widget update. ✅

---

## Task 6: Har mahine ka simple report (auto email)

Mahine ke end me ek chhota email: "Is mahine: 18 leads, 240 chats, 6 warm." Isse client ko value yaad rehti hai.

> Abhi manual bhej sakte ho. Baad me automate karna.

---

## ✅ Checklist
- [ ] Login laga, har client apna data dekhta hai
- [ ] 4 number-cards dikhte hain
- [ ] Leads table + CSV download
- [ ] Client khud docs upload kar sakta hai
- [ ] Embed/branding dashboard me hai
- [ ] Monthly report ka plan (manual bhi chalega)

👉 **Agla: `05-whatsapp-aur-handoff.md`**
