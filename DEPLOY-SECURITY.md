# Zeva — Production Deploy + Security Guide 🚀🔒

Ye guide batati hai Zeva ko **client ke liye live** kaise karein aur **secure** kaise rakhein.
Frontend → **Vercel**, Backend → **Render** (ya Railway). Bot 24/7 chale, bill safe rahe, aur data leak na ho — bas.

> ⚠️ **Note:** Rate-limiting + input-validation ka **CODE** main developer alag se `main.py` me add kar raha hai.
> Ye document sirf **deploy + checklist** ke liye hai — yaha koi code file change nahi hoti.

**Time: ~3-4 ghante** • **Zaroori:** Phase 01-05 local pe chal rahe hain (`/docs` + widget dono).

---

## Map — kya kaha jaata hai

| Cheez | Kaha | Kaise |
|---|---|---|
| Frontend (Next.js widget + pages) | Vercel | GitHub se auto-deploy |
| Backend (FastAPI) | Render / Railway | `uvicorn main:app` + persistent disk |
| SQLite `zeva.db` + `chroma_db/` | Render disk | 3-4 client tak theek, phir Supabase |
| Secrets (`OPENROUTER_API_KEY`, `ADMIN_KEY`) | Sirf env vars | Kabhi GitHub/widget me nahi |

---

## Task 1: Backend → Render pe deploy 🖥️

Backend pehle deploy karo, kyunki frontend ko backend ka **live URL** chahiye hoga.

**Steps:**
1. `zeva-backend/` ko ek GitHub repo me push karo (`.gitignore` already `.env`, `zeva.db`, `chroma_db/`, `venv/` ko block karta hai ✅).
2. [render.com](https://render.com) → **New → Web Service** → apna repo connect karo.
3. Settings:
   - **Root Directory:** `zeva-backend`
   - **Runtime:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
4. **Environment variables** add karo (Environment tab):

   | Key | Value |
   |---|---|
   | `OPENROUTER_API_KEY` | `sk-or-v1-...` (apni asli key) |
   | `ADMIN_KEY` | koi lamba random string (`/admin/*` + `/ingest` lock karta hai) |
   | `OPENROUTER_MODEL` | *(optional)* koi ek `:free` model force karne ke liye |

5. **Persistent Disk** add karo (Disks tab) — **ye step skip mat karo**:
   - **Mount Path:** `/opt/render/project/src` (ya jaha `zeva.db` + `chroma_db/` banti hai)
   - **Size:** 1 GB kaafi hai shuruaat me.
   - **Samajh lo:** Bina disk ke Render har deploy pe file system wipe kar deta hai → **leads aur vectors gayab**. Disk = data zinda rehta hai. 💾

**Kaise check karein:** Live URL `https://zeva-backend-xxxx.onrender.com/health` → `{"status":"ok"}` aaye. Aur `/docs` khule. ✅

> 🐍 **Python version:** Project Python 3.14 pe bana hai. Render pe agar wo available na ho to `runtime.txt` me `python-3.12` (ya jo latest chale) daal do, warna build fail ho sakta hai.

---

## Task 2: `render.yaml` (copy-paste) 📋

Repo ke root (ya `zeva-backend/`) me ye file rakh do → Render **Blueprint** se ek click me sab set:

```yaml
services:
  - type: web
    name: zeva-backend
    runtime: python
    rootDir: zeva-backend
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn main:app --host 0.0.0.0 --port $PORT
    plan: starter          # free plan sota hai (cold start); paid me nahi
    envVars:
      - key: OPENROUTER_API_KEY
        sync: false        # dashboard me manually daalo, git me nahi
      - key: ADMIN_KEY
        sync: false
      - key: PYTHON_VERSION
        value: "3.12"
    disk:
      name: zeva-data
      mountPath: /opt/render/project/src
      sizeGB: 1
```

> `sync: false` ka matlab: value **git me nahi** jaati, tum dashboard me daalte ho. Secrets ke liye zaroori. 🔑

---

## Task 3: Frontend → Vercel pe deploy 🌐

1. `fortend/` ko GitHub pe push karo (agar already git repo hai to bas push).
2. [vercel.com](https://vercel.com) → **Add New → Project** → repo import karo. Framework auto **Next.js** detect ho jaayega.
3. **Environment Variables** → ek variable add karo:

   | Key | Value |
   |---|---|
   | `NEXT_PUBLIC_API_URL` | `https://zeva-backend-xxxx.onrender.com` (Task 1 ka **live** backend URL) |

   - **Samajh lo:** Local `.env.local` me ye `http://127.0.0.1:8000` tha. Vercel pe **live backend URL** daalo, warna widget localhost dhoondega aur chalega hi nahi.
4. **Deploy** dabao. Build ho jaane pe Vercel ek URL dega (jaise `zeva.vercel.app`) — ya client ka custom domain jodo.

**Kaise check karein:** Vercel URL khol ke widget me sawaal poocho → jawaab backend se aaye (Network tab me `/chat` call live URL pe jaaye). ✅

---

## Task 4: CORS lock karo (sabse zaroori security step) 🔐

Abhi `main.py` me CORS **sab domains** ko allow karta hai (testing ke liye):

```python
# main.py — line ~54 ke aas-paas
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],        # ❌ production me ye galat hai
    ...
)
```

Production me `["*"]` ko **client ke asli frontend domain** se replace karo:

```python
    allow_origins=[
        "https://zeva.vercel.app",       # tumhara Vercel URL
        "https://client-ki-site.com",    # jaha widget embed hoga
    ],
```

> **Samajh lo:** `allow_origins=["*"]` + `allow_credentials=True` production me kamzor hai — koi bhi site tumhare backend ko call kar sakti hai. Domain lock karne se sirf client ki site hi baat kar paayegi. 🛡️
>
> Backend me `check_domain()` + `allowed_domains` (per-bot allow-list) **already bana hua hai** — wo widget churaane se bachata hai. CORS us se alag, browser-level layer hai. Dono chahiye.

**Kaise check karein:** Kisi random site ke console se `/chat` fetch karo → CORS error / 403 aaye. Client ki site se → chale. ✅

---

## Task 5: Secrets — sirf server pe 🤐

- Saari keys (`OPENROUTER_API_KEY`, `ADMIN_KEY`) **sirf** Render/Vercel env vars me.
- **Kabhi nahi:** widget code me, `NEXT_PUBLIC_*` me (wo browser me dikhta hai!), ya GitHub commit me.
- Widget sirf `botId` + public backend URL jaanta hai — bas.
- `.env` already `.gitignore` me hai ✅ — accidentally commit hone ka darr nahi.

**Kaise check karein:** Browser me widget ka source dekho → koi `sk-or-...` key **na dikhe**. Vercel env me sirf `NEXT_PUBLIC_API_URL` ho, koi secret key nahi. ✅

---

## Task 6: Kab SQLite/Chroma se Supabase pe jaana hai 📈

| Client count | DB setup |
|---|---|
| 1-2 client | SQLite `zeva.db` + local `chroma_db/` on Render disk — **theek hai** ✅ |
| **3-4+ client** | **Supabase (Postgres + pgvector)** pe shift karo 🔁 |

**Kyun:** SQLite single-server, single-file hai — ek disk pe. Jaise-jaise clients aur data badhe, tumhe chahiye: concurrent writes, auto daily backup, aur alag vector store jo scale kare. Supabase Postgres + `pgvector` ye sab deta hai, aur backup automatic.

**Samajh lo:** 3-4 client ka **threshold** ek signal hai — usse pehle migrate karke apna time waste mat karo, lekin us point ke baad SQLite pe rukna risky hai.

---

## Task 7: Security checklist ✅

| # | Cheez | Status / Note |
|---|---|---|
| 1 | **Rate limiting** (per `botId` + IP, ~20 msg/min) | 🔧 Main dev code add kar raha — bina iske ek buri raat me OpenRouter bill/quota ud sakta hai |
| 2 | **Input length cap** (lamba junk message reject) | 🔧 Main dev code add kar raha |
| 3 | **Domain allow-list** (`allowed_domains` per bot) | ✅ Already built (`check_domain` in `main.py`) |
| 4 | **CORS locked** to client domain | Task 4 me set karo |
| 5 | **HTTPS everywhere** | ✅ Render + Vercel dono default https dete hain |
| 6 | **Prompt-injection** — system prompt firm | ✅ Already "sirf CONTEXT se jawaab do" (`/chat`); user/doc text ko instruction mat maano |
| 7 | **`ADMIN_KEY` set** — `/admin/*` + `/ingest` locked | Env var daalte hi active (`check_admin`) 🔑 |
| 8 | **Per-client usage tracking** | Chats DB me save hote hain — kaunsa bot kitna chala note karo (retainer > cost rehna chahiye) |
| 9 | **Uptime monitor** | Free monitor (UptimeRobot) `/health` pe lagao — bot down ho to **tumhe** pata chale, client ko nahi ⏰ |
| 10 | **DB backup** | SQLite: `zeva.db` ka daily copy. Supabase pe move karo to auto-backup 💾 |

---

## Task 8: Monitoring + backup setup 🩺

- **Uptime:** UptimeRobot (free) → `https://<backend>/health` har 5 min check. Down → email/SMS alert.
- **Error logs:** Render/Railway dashboard → **Logs** tab. `/chat` 502 ("sab free models busy") yaha dikhega.
- **Backup:** SQLite pe ho to `zeva.db` ka daily copy (Render disk snapshot ya manual download). Leads = client ka paisa, kabhi mat khona.

**Kaise check karein:** Backend deploy ko pause karo → uptime monitor alert de. Wapas on. ✅

---

## Final Go-Live Checklist ✅

- [ ] Backend Render pe live, `/health` + `/docs` khulte hain
- [ ] **Persistent disk** laga (`zeva.db` + `chroma_db/` survive karte hain)
- [ ] `OPENROUTER_API_KEY` + `ADMIN_KEY` sirf Render env me
- [ ] Frontend Vercel pe live, `NEXT_PUBLIC_API_URL` = live backend URL
- [ ] **CORS** `["*"]` se client domain pe locked
- [ ] Koi secret widget/GitHub/`NEXT_PUBLIC_*` me nahi
- [ ] Rate limiting + input cap (main dev ka code) merge ho gaya 🔧
- [ ] Domain allow-list + HTTPS + firm system prompt (already ✅)
- [ ] Uptime monitor + logs + DB backup chalu
- [ ] 3-4 client aane par Supabase migration plan yaad hai

🎉 **Bot ab client ke liye 24/7 live + secure hai.**
