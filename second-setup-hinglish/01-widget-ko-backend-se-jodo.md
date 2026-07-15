# Phase 01 — Widget ko Asli Backend se Jodo 🔌

Tak ab tumhara Studio/Answer-Engine widget **mock (nakli) jawab** deta tha. Is phase me hum use **asli RAG backend** se joddenge, taaki widget sach me documents se jawab de, sources dikhaye, aur leads save kare.

**Time: ~3-4 ghante**

## Shuru karne se pehle ✅
- Backend chal raha ho (`/chat`, `/lead`, `/ingest` endpoints).
- Next.js widget project ready ho (jo humne prompt se banaya).
- `.env` me API URL set ho.

---

## Task 1: Backend ke 3 endpoint pakke karo

Widget ko sirf 3 cheezein chahiye. Confirm karo ye teeno kaam kar rahe hain:

| Endpoint | Method | Bhejta hai | Wapas aata hai |
|---|---|---|---|
| `/config` | GET | `botId` | name, accent, welcome, suggested questions |
| `/chat` | POST | `botId`, `message` | `answer`, `sources[]` (stream ho to aur best) |
| `/lead` | POST | `botId`, name, email, phone | `ok`, `leadId` |

**Kaise check karein:** `/docs` (FastAPI) me teeno "Try it out" se chalao. Sahi jawab aaye. ✅

**Samajh lo:** Widget in teeno ko call karega. `/config` se widget apne aap client ka naam/color le lega — tumhe har baar code me haath nahi lagana padega.

---

## Task 2: Mock ko real fetch se badlo

Studio me abhi `KB` (nakli knowledge) se jawab aata tha. Us jagah asli `fetch` lagao.

```javascript
// hooks/useSendMessage (React Query mutation)
async function sendMessage({ botId, message }) {
  const res = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ botId, message }),
  });
  if (!res.ok) throw new Error("chat failed");
  return res.json();   // { answer, sources }
}
```

**Kaise check karein:** Widget me sawaal poocho jo tumhari uploaded doc me hai — asli jawab + asli source filename aana chahiye (nakli nahi). ✅

**Samajh lo:** "Scan → answer → proof card" waala pura animation waisa hi rahega — bas data ab asli hai. Design nahi badla, sirf source badla.

---

## Task 3: Streaming jawab (feel fast) — optional par badhiya

Chat tab acha lagta hai jab shabd ek-ek karke aayein (typing jaisa). Backend ko stream karne do (FastAPI `StreamingResponse` / SSE), aur frontend me chunks padho.

**Kaise check karein:** Jawab ek saath dhamake se nahi, dheere-dheere aaye. ✅

> ⚠️ Agar abhi time nahi, to skip karo. Non-stream bhi chalega. Baad me laga lena.

---

## Task 4: Lead form ko real `/lead` se jodo

Warm-lead ticket submit hone par asli `/lead` call ho aur SQLite/DB me save ho.

**Kaise check karein:** Ticket bharo → submit → backend ke `/leads` me woh entry dikhe. ✅

---

## Task 5: `/config` se widget ko auto-brand karo

Widget load hote hi `/config?botId=...` call kare aur name, accent color, welcome, suggested questions le le.

**Kaise check karein:** Backend me botId ka color badlo → widget khud us color me khul jaye (code chhue bina). ✅

**Samajh lo:** Yehi cheez tumhe "har client alag" karne deti hai bina naya code likhe. Ye Phase 02 ka base hai.

---

## ✅ Checklist
- [ ] `/config`, `/chat`, `/lead` teeno test ho gaye
- [ ] Widget me mock hataya, real fetch laga
- [ ] Asli jawab + asli sources aa rahe hain
- [ ] Lead ticket asli DB me save ho raha hai
- [ ] Widget `/config` se apne aap brand ho raha hai
- [ ] (Optional) streaming laga

👉 **Agla: `02-multi-tenant-har-client-ka-bot.md`**
