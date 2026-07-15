# Phase 02 — Multi-Tenant: Har Client ka Apna Bot 🏢

Ye phase product ka **dil** hai. Ek hi system me kai client honge — har ek ka apna bot, apni docs, apna data. Kisi ek client ka data doosre ko kabhi nahi dikhna chahiye. Ise **multi-tenant** kehte hain (ek building, kai kirayedaar, sab alag).

**Time: ~3-4 ghante**

## Shuru karne se pehle ✅
- Phase 01 ho gaya ho (widget backend se juda ho).
- Backend me `botId` ka concept thoda samajh liya ho.

---

## Task 1: `bots` table banao

Har client ki settings ek jagah. (SQLite ya Postgres — dono me same idea.)

```sql
CREATE TABLE bots (
  bot_id      TEXT PRIMARY KEY,      -- jaise "acme-salon"
  name        TEXT,                  -- "Acme Salon"
  accent      TEXT DEFAULT '#4f46e5',
  welcome     TEXT,
  suggestions TEXT,                  -- JSON: ["hours?","price?"]
  allowed_domains TEXT,              -- kaunsi site pe chal sakta hai
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);
```

**Kaise check karein:** Ek row insert karo (`acme-salon`), `/config?botId=acme-salon` se wahi data wapas aaye. ✅

---

## Task 2: Har data me `bot_id` daalo

`chunks` (embeddings), `chats`, `leads` — sab me `bot_id` column hona chahiye.

```sql
-- har table me:
bot_id TEXT NOT NULL
```

**Samajh lo:** Ab har lead, har chunk, har chat "kis client ka hai" ye pata rahega. Ye sabse zaroori line hai poore product me.

---

## Task 3: Har query `bot_id` se filter karo ⚠️

**Ye rule kabhi mat todo.** Jab bhi DB se kuch padho ya dhoondo, `WHERE bot_id = ?` zaroor lagao.

```python
# RAG retrieval me bhi:
results = collection.query(query_embeddings=[q], n_results=4,
                           where={"bot_id": bot_id})
# leads me bhi:
cursor.execute("SELECT * FROM leads WHERE bot_id = ?", (bot_id,))
```

**Kaise check karein (Isolation test — bahut zaroori):**
1. Do bot banao: `bot-a` aur `bot-b`.
2. `bot-a` me sirf "Salon" ki doc daalo, `bot-b` me sirf "Dental" ki.
3. `bot-a` se dental ka sawaal poocho → use **pata nahi** hona chahiye.

Agar `bot-a` ko `bot-b` ka data dikha — **ruk jao aur filter theek karo.** ✅

**Samajh lo:** Ek client doosre ka data dekh le to business khatam. Isliye ye test har baar chalao.

---

## Task 4: Domain allow-list (widget churaya na jaye)

Har bot ki `allowed_domains` me sirf client ki site honi chahiye. Backend `/chat` me check karo ki request usi domain se aa rahi hai (Origin header).

**Kaise check karein:** Kisi random site se widget lagao → chalna nahi chahiye. Client ki site se → chale. ✅

---

## Task 5 (Note): Kab Postgres + pgvector pe jao

- **1-3 client:** SQLite + Chroma theek hai. Aage badho.
- **4+ client / production:** Postgres + pgvector (Supabase) pe shift karo — isse:
  - Row Level Security (RLS) se data isolation ka doosra taala milta hai.
  - Ek hi DB me sab, backup aasan, scale acha.

> Abhi mat ruko iske liye. Bas dhyaan me rakho — jab 3-4 client ho jaayein, tab `06` file me upgrade ka note dekh lena.

---

## ✅ Checklist
- [ ] `bots` table bana, config wahaan se aa raha hai
- [ ] Har table me `bot_id` column hai
- [ ] Har query `bot_id` se filter ho rahi hai
- [ ] Isolation test pass (bot-a ko bot-b ka data nahi dikha)
- [ ] Domain allow-list laga
- [ ] Postgres upgrade ka plan samajh liya

👉 **Agla: `03-client-onboarding.md`**
