# Phase 05 — WhatsApp + Human Handoff + Lead Scoring 📱

Ye 3 features tumhe **chhote jobs se bade jobs** me le jaate hain. India (aur bahut markets) me client WhatsApp ke liye zyada paisa dene ko taiyaar hai. Handoff + scoring se bot sirf "support" nahi, "sales" tool ban jaata hai.

**Time: ~5-6 ghante (WhatsApp thoda dhyaan maangta hai)**

## Shuru karne se pehle ✅
- Phase 01-04 ho gaye. Website widget acche se chal raha hai.

---

## Part A: WhatsApp Channel

### Task 1: WhatsApp Cloud API setup
- **WhatsApp Cloud API** (Meta ka official) use karo — Twilio bhi option hai.
- Ek business number + Meta developer account chahiye.
- Ek **webhook** banao: `/whatsapp/webhook` — WhatsApp yahan message bhejega.

**Kaise check karein:** Apne number se test message bhejo → tumhare webhook pe aaye (logs me dikhe). ✅

### Task 2: Same RAG, naya channel
Jab WhatsApp message aaye → wahi RAG flow chalao (embed → retrieve → answer) → jawab WhatsApp API se wapas bhejo.

**Samajh lo:** Dimaag (RAG) same hai. Sirf "message kahan se aaya aur kahan bheja" badla. Website aur WhatsApp dono ek hi backend use karte hain.

> ⚠️ WhatsApp ke rules aur billing pehle padh lo. Test number pe pehle try karo, phir client ke number pe.

---

## Part B: Lead Scoring (hot / warm / cold)

### Task 3: Simple score logic
Har chat ko ek score do — bina AI ke bhi chalega:

- **HOT** 🔥 — "price", "book", "demo", "buy", "abhi chahiye" jaise shabd, ya email/phone diya.
- **WARM** 🙂 — specific product/service poocha, 3+ message ki baat.
- **COLD** ❄️ — bas general "hello", ek-do message.

**Kaise check karein:** Alag-alag chat karo → sahi score lage. ✅

**Samajh lo:** Client ka sales-banda pehle HOT leads pe call karega. Yehi bot ko "paisa laane wala" banata hai.

---

## Part C: Human Handoff

### Task 4: Warm/hot lead → insaan ko bhejo
Jab lead HOT ho (ya bot unsure ho, ya user "insaan se baat karni hai" bole):
1. Chat ka ek **chhota AI summary** banao ("Arjun, oily-skin cream, Pune delivery, budget puchha").
2. Ye summary + contact **Slack/email/WhatsApp** pe sales team ko bhejo.

**Kaise check karein:** HOT lead banao → sales team ko summary notification aaye. ✅

**Samajh lo:** Client ke liye ye jaadu hai — bot raat ko lead pakadta hai, subah sales-banda ready summary ke saath call karta hai.

---

## ✅ Checklist
- [ ] WhatsApp webhook aa raha hai
- [ ] WhatsApp pe bhi RAG jawab de raha hai
- [ ] Lead score (hot/warm/cold) lag raha hai
- [ ] Handoff: warm lead + AI summary sales team ko jaa raha hai
- [ ] WhatsApp rules/billing padh liye

👉 **Agla: `06-production-deploy-security.md`**
