# WhatsApp Cloud API Setup — Zeva ko WhatsApp se jodo 📱

Ye guide tab ke liye hai jab tum (Sandeep) ready ho **wahi RAG dimaag** ko WhatsApp pe le jaane ke liye. Website widget already `/chat` se chal raha hai — WhatsApp bas ek **naya darwaaza** hai jis se wahi message andar aata hai aur wahi jawaab bahar jaata hai.

**Samajh lo:** Dimaag (RAG: embed → retrieve → LLM answer) same rehta hai. Sirf "message kahan se aaya, jawaab kahan bheja" badalta hai. Website `POST /chat` use karta hai; WhatsApp `POST /whatsapp/webhook` use karega. Dono ek hi backend, ek hi `botId`, ek hi documents.

> ⚠️ **Ye setup manual hai.** WhatsApp Cloud API Meta (Facebook) ka product hai — tumhe apne haath se Meta account banana padega, buttons dabane padenge. Koi code isse automate nahi kar sakta. Ye guide sirf steps batata hai; asli account tum khud banaoge jab ready ho.

**Time: ~1-2 ghante (pehli baar Meta ka dashboard thoda confusing lagta hai — patience rakho).**

---

## Task 1: Meta Developer account + test WhatsApp number banao 🏗️

WhatsApp Cloud API free me ek **test number** deta hai — client ka asli number chhue bina practice kar sakte ho.

1. Jao 👉 **[developers.facebook.com](https://developers.facebook.com)** → apne normal Facebook account se login karo.
2. Upar right me **"My Apps"** → **"Create App"** dabao.
3. Use case me **"Other"** → app type me **"Business"** chuno → app ko naam do (e.g. `zeva-whatsapp`).
4. App ban gayi → left sidebar/products me **"WhatsApp"** dhoondo → **"Set up"** dabao.
5. Ek **Meta Business Account** maangega — naya bana lo (bas naam daalo, free hai).
6. Ab **WhatsApp → API Setup** page khulega. Yahan Meta ne tumhe automatic ek **test number** de diya hai (`+1 555...` type ka). Isi se practice karoge.

**Kaise check karein:** API Setup page pe ek dropdown me "From" number dikhe, aur ek "To" me tum apna **personal WhatsApp number add** kar sako (recipient list me). Test message bhejne ke liye apna number verify karna padega (OTP aayega WhatsApp pe). ✅

> ⚠️ Test number sirf un numbers ko message bhej sakta hai jo tumne **manually recipient list me add** kiye ho (max ~5). Random logon ko message nahi jaayega — ye jaan-boojh ke hai (spam rokne ke liye).

---

## Task 2: Temporary Access Token + Phone Number ID lo 🔑

Webhook ko WhatsApp par jawaab bhejne ke liye 2 cheezein chahiye — dono **usi API Setup page** pe milti hain:

1. **Temporary access token** — page ke upar ek lamba token (`EAAG...`) hai + **"Copy"** button. Ye 24 ghante me expire hota hai (isiliye "temporary").
2. **Phone number ID** — "From" number ke neeche ek number likha hoga: **Phone number ID** (ye number ka database ID hai, asli phone number nahi). Isko bhi copy karo.
3. Ek aur cheez note kar lo: **WhatsApp Business Account ID** (WABA ID) — baad me templates ke kaam aayega.

Inko backend ke `.env` me daalna hai (jaise `OPENROUTER_API_KEY` already hai):

```bash
# .env me (git me commit NAHI hota)
WHATSAPP_TOKEN=EAAG...tumhara-temporary-token
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_VERIFY_TOKEN=zeva-secret-verify-123   # ye tum khud banate ho (koi bhi random string)
```

> ⚠️ **Temporary token 24 ghante me mar jaata hai.** Development me theek hai. Client ke liye live jaane se pehle **permanent token** banana padega — uske liye Meta me ek "System User" banake usko permanent token deना padता hai (Task 6 me niche). Abhi ke liye temporary se practice karo.

**Kaise check karein:** Terminal me ye curl chalao (apne token + phone ID + apna verified number daal ke). Tumhare WhatsApp pe "Hello World" template aana chahiye. ✅

```bash
curl -X POST "https://graph.facebook.com/v21.0/<PHONE_NUMBER_ID>/messages" \
  -H "Authorization: Bearer <WHATSAPP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
        "messaging_product": "whatsapp",
        "to": "<TERA_NUMBER_91...>",
        "type": "template",
        "template": { "name": "hello_world", "language": { "code": "en_US" } }
      }'
```

---

## Task 3: Webhook set up karo (verify handshake + incoming messages) 🔗

WhatsApp tumhare backend se **do tarah** se baat karta hai:

### (a) `GET /whatsapp/webhook` — verification handshake (sirf ek baar, setup ke time)

Jab tum Meta dashboard me webhook URL add karoge, Meta pehle ek **GET request** bhejega ye check karne ke liye ki URL sach me tumhara hai. Us request me 3 query params aate hain:

- `hub.mode` = `subscribe`
- `hub.verify_token` = wahi string jo tumne `.env` me `WHATSAPP_VERIFY_TOKEN` set ki
- `hub.challenge` = ek random number

**Tumhara kaam:** agar `hub.verify_token` match kare, to `hub.challenge` ko **as-is wapas** kar do (plain text, number). Match nahi kare → `403`. Bas isi se Meta samajh jaata hai ki webhook tumhara hai.

### (b) `POST /whatsapp/webhook` — asli incoming messages

Verify hone ke baad, jab bhi koi user tumhare WhatsApp number pe message bhejega, Meta ek **POST** karega isi URL pe. JSON kuch aisa dikhta hai (thoda simplify karke):

```json
{
  "entry": [{
    "changes": [{
      "value": {
        "metadata": { "phone_number_id": "123456789012345" },
        "messages": [{
          "from": "919876543210",
          "type": "text",
          "text": { "body": "aapke salon me haircut ka price kya hai?" }
        }]
      }
    }]
  }]
}
```

**Samajh lo:** Asli message is gehre dafaan me hai — `entry[0].changes[0].value.messages[0].text.body`. Aur user ka number `...messages[0].from` me. Bas yahi 2 cheezein chahiye: **kya poocha** aur **kisne poocha**.

> ⚠️ **Delivery/read receipts bhi POST karte hain** (jab tumhara bheja message deliver/read hota hai). Un me `messages` key nahi, `statuses` key hoti hai. Inko ignore karo — sirf `messages` waale POST process karo, warna bot khud ke receipts pe reply karne lagega.

**Webhook URL kahan daalein:** Meta dashboard → **WhatsApp → Configuration → Webhook** → "Edit" → apna URL (e.g. `https://tumhara-domain.com/whatsapp/webhook`) + wahi Verify Token daalo → **"Verify and save"**. Phir neeche **"messages"** field ko **Subscribe** karna mat bhoolna (warna incoming message aayega hi nahi).

> ⚠️ **Localhost pe test karna hai?** WhatsApp ko ek **public https URL** chahiye — `localhost` nahi chalega. Development me **ngrok** use karo: `ngrok http 8000` → jo `https://xxxx.ngrok.io` mile usko webhook URL banao.

**Kaise check karein:** Apne verified number se test WhatsApp number ko message bhejo → tumhare backend ke logs me incoming JSON dikhe (`text.body` + `from`). ✅

---

## Task 4: Webhook ko existing RAG se jodo 🧠

Ye asli jaadu hai — aur ye **almost zero naya logic** hai, kyunki `main.py` me sab helpers already hain:

1. Incoming JSON me se `text.body` (message) aur `from` (user number) nikaalo.
2. **Wahi RAG flow** chalao jo `/chat` chalata hai:
   - `retrieve(message, botId, k=3)` — is bot ke documents me se related chunks. (`rag.py`)
   - `good = [h for h in hits if h["match"] >= RELEVANCE_THRESHOLD]` — kuch relevant mila ya nahi.
   - Kuch nahi mila → wahi guardrail line ("documents me nahi mila, guess nahi karunga").
   - Mila → context banao aur `call_llm([...])` se grounded jawaab lo. (`main.py`)
   - `db.save_chat(botId, message, answer, is_guardrail=...)` — chat save (dashboard/lead scoring ke liye).
3. Jo `answer` mila, usko **WhatsApp Cloud API Send Message endpoint** se wapas bhejo — user ke `from` number pe.

Send karne ka curl shape (yehi tumhara webhook code karega, `type: "text"`):

```bash
curl -X POST "https://graph.facebook.com/v21.0/<PHONE_NUMBER_ID>/messages" \
  -H "Authorization: Bearer <WHATSAPP_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
        "messaging_product": "whatsapp",
        "to": "919876543210",
        "type": "text",
        "text": { "body": "Haircut ₹300 se shuru hota hai. Aur kuch poochna hai?" }
      }'
```

**Samajh lo:** `botId` yahan kaise tay hoga? Simple rule — **ek WhatsApp number = ek client = ek botId**. Tum `WHATSAPP_PHONE_NUMBER_ID` ko `botId` se map kar sakte ho (ek dict ya DB me). Isse ek hi backend kai clients ke WhatsApp handle kar sakta hai, bilkul `/chat` ke `botId` ki tarah.

---

## Task 5: Python (FastAPI) code sketch — REFERENCE ke liye ✍️

> ⚠️ **Ye sirf ek SKETCH hai** — copy-paste karke chalane ke liye nahi, samajhne ke liye. Asli implementation tum (main dev) `main.py` me add karoge, apne error-handling + `phone_number_id → botId` mapping ke saath. Ye `retrieve`, `call_llm`, `db.save_chat` wahi hain jo `main.py` me already maujood hain.

```python
# main.py me add karne ke liye — SKETCH (~35 lines)
import os, httpx
from fastapi import Request, Response, HTTPException

WA_TOKEN    = os.getenv("WHATSAPP_TOKEN")
WA_PHONE_ID = os.getenv("WHATSAPP_PHONE_NUMBER_ID")
WA_VERIFY   = os.getenv("WHATSAPP_VERIFY_TOKEN")
PHONE_TO_BOT = {WA_PHONE_ID: "acme-salon"}   # ek number = ek client ka bot

# (a) Verification handshake — Meta sirf setup ke time GET karta hai
@app.get("/whatsapp/webhook")
def wa_verify(request: Request):
    p = request.query_params
    if p.get("hub.mode") == "subscribe" and p.get("hub.verify_token") == WA_VERIFY:
        return Response(content=p.get("hub.challenge"), media_type="text/plain")
    raise HTTPException(status_code=403, detail="verify token galat")

# (b) Incoming messages — har user message yahan POST hota hai
@app.post("/whatsapp/webhook")
async def wa_incoming(request: Request):
    data = await request.json()
    try:
        value = data["entry"][0]["changes"][0]["value"]
        msg = value["messages"][0]            # statuses/receipts me ye nahi hoga
    except (KeyError, IndexError):
        return {"ok": True}                   # receipt/status → ignore, 200 do
    if msg.get("type") != "text":
        return {"ok": True}                   # image/audio abhi skip

    user_num = msg["from"]
    text     = msg["text"]["body"]
    bot_id   = PHONE_TO_BOT.get(value["metadata"]["phone_number_id"], "acme-salon")

    answer = answer_with_rag(text, bot_id)    # neeche wahi /chat waala logic
    await wa_send(user_num, answer)
    return {"ok": True}                        # Meta ko hamesha 200 do (warna retry karega)

# wahi RAG jo /chat me hai — reuse
def answer_with_rag(message: str, bot_id: str) -> str:
    hits = retrieve(message, bot_id, k=3)
    good = [h for h in hits if h["match"] >= RELEVANCE_THRESHOLD]
    if not good:
        ans = "Ye documents me nahi mila — main guess nahi karunga. Team aapse baat karegi."
        db.save_chat(bot_id, message, ans, is_guardrail=True)
        return ans
    context = "\n\n".join(f"[{h['file']}]\n{h['text']}" for h in good)
    ans, _model = call_llm([
        {"role": "system", "content": "Sirf niche CONTEXT se chhota jawaab do."},
        {"role": "user",   "content": f"CONTEXT:\n{context}\n\nQUESTION: {message}"},
    ])
    db.save_chat(bot_id, message, ans, is_guardrail=False)
    return ans

# WhatsApp Cloud API se text reply bhejo
async def wa_send(to: str, body: str):
    url = f"https://graph.facebook.com/v21.0/{WA_PHONE_ID}/messages"
    payload = {"messaging_product": "whatsapp", "to": to,
               "type": "text", "text": {"body": body}}
    headers = {"Authorization": f"Bearer {WA_TOKEN}"}
    async with httpx.AsyncClient(timeout=30) as client:
        await client.post(url, json=payload, headers=headers)
```

**Kaise check karein:** Test number ko WhatsApp pe sawaal bhejo jiska jawaab documents me ho → thodi der me bot ka grounded jawaab WhatsApp pe wapas aaye, aur `zeva.db` me chat save ho. ✅

---

## Task 6: ⚠️ WhatsApp ke rules, billing aur 24-hour window — ZAROOR padho

Ye WhatsApp/Meta ke apne rules hain — tod diye to number **ban** ho sakta hai. Halka mat lena.

- **Test number vs client number:**
  - *Test number* = free, sirf ~5 pehle-se-add kiye numbers ko message. Practice ke liye perfect.
  - *Client ka asli number* = uske apne WhatsApp Business number ko is app se jodना padता hai, aur **business verification** (Meta document maangega) karna padता hai. Ye tab karo jab client sach me live jaa raha ho.

- **24-hour customer service window ⏰ (sabse important rule):**
  - Jab user tumhe message bhejta hai, ek **24-ghante ki window** khulti hai. Us window me tum **free-form text** (jaise upar `wa_send`) jitna chaho reply kar sakte ho. RAG bot ke normal reply isi window me aate hain — koi extra paisa/permission nahi.
  - Window band hone ke baad (24 ghante user ne kuch nahi bola) tum **free-form message nahi bhej sakte**. Ab sirf ek pre-approved **template message** hi jaa sakta hai.

- **Template messages 📋:**
  - Template = pehle se Meta se **approve karaya hua** message (jaise `hello_world`). Business-initiated ya window-ke-baad ke liye zaroori.
  - Meta dashboard → **WhatsApp Manager → Message Templates** me banate aur approve karate ho (approval me kuch ghante–din lagte hain).
  - RAG bot mostly window ke andar reply karta hai, to shuru me template ki zyada zaroorat nahi — bas rule jaan lo.

- **Billing 💰:** WhatsApp per-**conversation** charge karta hai (per-message nahi), aur category pe depend karta hai (service/marketing/utility). Har mahine kuch free service conversations milti hain. Test number free hai — paise tab lagenge jab asli business number pe volume aayega. Client ko pitch karne se pehle Meta ka **latest pricing page** dekh lena (rates change hote rehte hain, aur India ke rates alag hain).

- **Permanent token 🔐:** Temporary token 24 ghante me marta hai. Live ke liye Meta **Business Settings → System Users** me ek system user bana ke usse **permanent token** generate karo, aur usi ko `.env` me daalo. Warna roz token badalna padega.

- **Meta ko hamesha `200` do:** Webhook POST ka jawaab jaldi `200 OK` do (bhale hi reply background me bhejo). Agar tum error ya slow response doge, Meta **baar-baar retry** karega aur duplicate messages aa sakte hain.

---

## ✅ WhatsApp Checklist

- [ ] Meta developer account + app + test number ban gaya
- [ ] Temporary token + phone number ID `.env` me daal diye
- [ ] `GET /whatsapp/webhook` verify handshake (hub.challenge) chal raha hai
- [ ] Webhook Meta me verify + "messages" field subscribe ho gaya
- [ ] `POST /whatsapp/webhook` incoming message parse kar raha hai (`text.body`, `from`)
- [ ] Wahi RAG (`retrieve → call_llm`) reply WhatsApp pe wapas jaa raha hai
- [ ] 24-hour window, template, billing rules padh liye
- [ ] Live se pehle: permanent token + client number + business verification

**Samajh lo:** Yahan tak aa gaye, to Zeva ka **ek hi dimaag** ab do jagah bol raha hai — website widget aur WhatsApp. Client ke liye yeh bada wow moment hai. 🎉

👉 Wapas plan pe: `second-setup-hinglish/05-whatsapp-aur-handoff.md` (Part B: Lead Scoring, Part C: Handoff).
