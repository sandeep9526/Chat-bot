# Technical Plan for the First Step (The MVP)

This is the build plan for the FIRST version of Zeva (working name). We build only the smallest useful product first. We call this the MVP (Minimum Viable Product - the smallest thing that gives real value).

The MVP has three parts:
1. A RAG chatbot backend (the brain that answers from the client's own content).
2. An embeddable website widget (one line of code that puts a chat bubble on any website).
3. Lead capture (the bot collects name, email, phone and saves it).

Everything else (WhatsApp, CRM, dashboard, billing) comes later. This document explains, in simple words and with real numbers, exactly how to build the MVP from an empty folder to a working demo.

RAG means "Retrieval-Augmented Generation". In plain words: we first find the right text from the client's own documents, then we give that text to the AI and ask it to answer. So the AI answers from real data, not from guesses.

---

## 1. MVP Scope (What Is In, What Is Out)

### What is IN (build now)

| Feature | What it does |
|---|---|
| RAG chatbot backend | Reads the client's content, answers questions from it, shows sources. |
| Data ingestion | Takes the client's website text, PDFs, and docs and prepares them for search. |
| Embeddable widget | A chat bubble you add to any website with one line of JavaScript. |
| Lead capture | Bot asks for name, email, phone at the right time and saves the lead. |
| Simple config | Each client (bot) has settings: name, color, welcome message, model choice. |
| Multi-tenant base | Each client is a separate "botId" with its own data. No data mixing. |

### What is OUT (build later, not now)

- WhatsApp channel.
- CRM sync (HubSpot, Zoho, etc.).
- Full admin dashboard with charts.
- Human handoff / live chat takeover.
- Billing and self-signup SaaS.
- White-label branding for resellers.

**Why this matters:** A small scope ships fast. A working demo in weeks is worth more than a big plan in months. We can sell the MVP and add the rest with client money.

---

## 2. Architecture (The Big Picture)

```
   ANY WEBSITE (WordPress / Shopify / React / plain HTML)
   +--------------------------------------------------+
   |   <script src=".../widget.js"></script>          |
   |                                                  |
   |        [ Chat bubble ]  <-- vanilla JS widget    |
   +--------------------------------------------------+
                    |  (HTTPS: send question + botId)
                    v
   +--------------------------------------------------+
   |   BACKEND API  (Next.js on Vercel)               |
   |   /chat  /ingest  /lead  /config                 |
   |   - checks botId                                  |
   |   - runs the RAG pipeline                         |
   |   - keeps API keys secret (server-side)          |
   +--------------------------------------------------+
        |                         |
        |  (find similar text)    |  (ask the AI)
        v                         v
   +----------------+     +---------------------------+
   | VECTOR DB      |     | LLM (OpenAI / Claude)     |
   | Supabase       |     | via Vercel AI SDK         |
   | Postgres +     |     | writes the final answer   |
   | pgvector       |     |                           |
   +----------------+     +---------------------------+
```

**One line for each box:**
- **Widget** - a tiny JavaScript file that draws the chat bubble and talks to the backend.
- **Backend API** - the server that receives questions, runs RAG, and returns answers. It holds all secrets.
- **Vector DB (Supabase + pgvector)** - a database that stores the client's text as numbers so we can find "similar" text fast. (pgvector is a Postgres add-on for vector search.)
- **LLM** - the AI model (OpenAI GPT or Anthropic Claude) that writes the final human answer.

---

## 3. Tech Stack (And Why Each One)

| Layer | Choice | One-line reason |
|---|---|---|
| Backend + API | Next.js (API routes) | One framework for API now and the dashboard later. Easy deploy on Vercel. |
| Language | TypeScript / Node.js | Founder is strong here. Type safety means fewer bugs. |
| Database + Vectors | Supabase (Postgres + pgvector) | One tool for normal data, vector search, auth, and file storage. Cheap to start. |
| AI calls | OpenAI / Claude via Vercel AI SDK | Simple, tidy code for streaming answers. Can switch model with one line. Use LangChain only if a chain gets complex. |
| Widget | Vanilla JavaScript bundle on a CDN | No framework, so it works on ANY website. Small and fast. (CDN = fast global file server.) |
| Hosting | Vercel (API) + Supabase (DB) | Free/cheap tiers, fast setup, scales later. Render is a backup option. |

**Why this matters:** Every tool here is one the founder already knows or can learn fast. Fewer new tools means a faster first ship.

---

## 4. Data Flow (Step by Step)

There are two flows: **ingestion** (loading the client's content once) and **chat** (answering a live question).

### A) Ingestion flow (run once per client, or when content changes)

1. **Get documents** - collect the client's website text, PDFs, and docs.
2. **Split into chunks** - cut the text into small pieces (about 500-800 words each). Big text is too much for the AI at once.
3. **Create embeddings** - turn each chunk into a list of numbers (a "vector") that captures its meaning.
4. **Store vectors** - save each vector + its text + the botId in pgvector.

### B) Chat flow (every time a visitor asks something)

1. **Embed the question** - turn the visitor's question into a vector too.
2. **Search similar chunks** - ask pgvector for the top few chunks whose vectors are closest to the question (this is "top-k").
3. **Build a prompt** - make one message for the AI: system rules + the found chunks + the question.
4. **Call the LLM** - send that prompt to OpenAI or Claude and get an answer.
5. **Return answer with sources** - send the answer back to the widget, plus which chunks it used.
6. **Log / capture the lead** - save the chat, and if it is the right moment, ask for and store contact details.

**Why this matters:** The AI only sees the client's real content in step 3. That is what stops made-up answers.

---

## 5. The Embeddable Widget (One Line of Code)

### How one line works

The client pastes one `<script>` tag. That script downloads a small JavaScript file from our CDN. The file then:
1. Reads the `botId` from the tag.
2. Draws a chat bubble in the corner of the page.
3. When clicked, opens a small chat window.
4. Sends questions to our backend and shows answers.

### The example snippet

```html
<!-- Zeva chat widget -->
<script
  src="https://cdn.zeva.app/widget.js"
  data-bot-id="acme-salon-123"
  data-color="#4f46e5"
  async>
</script>
```

`data-bot-id` tells the widget which client this is. `async` means it loads without slowing the page.

### Script vs iframe

- The **script** creates the bubble button and the launcher on the page.
- The **chat window itself** is drawn inside an **iframe** (a small web page inside the page).

**Why an iframe for the chat window:** it keeps our CSS and the client's CSS apart, so the client's website styles cannot break our chat, and our styles cannot break their site. This is the main trick that makes the widget "stack-agnostic" (works the same on every website).

### Where to paste it

| Platform | Where to paste |
|---|---|
| Plain HTML | Just before the closing `</body>` tag. |
| WordPress | Appearance > Theme File Editor > footer.php before `</body>`, OR use a plugin like "Insert Headers and Footers". |
| Shopify | Online Store > Themes > Edit code > `theme.liquid`, before `</body>`. |
| React / Next.js | Add the `<script>` in the root layout, or load it with the `next/script` component. |
| Vue | Add the script tag in `public/index.html` before `</body>`. |
| Angular | Add the script tag in `src/index.html` before `</body>`. |

**Why this matters:** "One line, any website" is the main selling point. It must be truly copy-paste for non-technical clients.

---

## 6. The Backend API (Main Endpoints)

All endpoints live under `/api`. All need a valid `botId`. Chat runs are public (from the widget); ingest and config need an admin key.

| Endpoint | Method | What it does | Inputs | Outputs |
|---|---|---|---|---|
| `/api/ingest` | POST | Load and index a client's content. Admin only. | `botId`, list of documents or file URLs | count of chunks stored, status |
| `/api/chat` | POST | Answer one question with RAG. | `botId`, `message`, `sessionId` | `answer` text, `sources` list, `askForLead` flag |
| `/api/lead` | POST | Save a captured lead. | `botId`, `sessionId`, `name`, `email`, `phone` | `ok`, `leadId` |
| `/api/config` | GET | Get a bot's public settings for the widget. | `botId` | name, color, welcome text, suggested questions |

**Notes:**
- `/api/chat` should **stream** the answer (send words as they come) so the chat feels fast.
- `/api/config` returns only safe, public settings. Never secrets.

---

## 7. The RAG Pipeline (The Details)

### Chunking strategy
- Split by paragraphs and headings first, then by size.
- Target about 500-800 words per chunk (roughly 700-1000 tokens).
- Add a small **overlap** (about 100 words) between chunks so meaning is not cut in half.
- Store with each chunk: the text, the source name/URL, and the `botId`.

### Embedding model
- Use OpenAI `text-embedding-3-small` to start. It is cheap and good enough.
- The same model MUST be used for both documents and questions. (You cannot mix models.)

### pgvector and retrieval
- Store vectors in a Postgres table with a `vector` column.
- Add an index (IVFFlat or HNSW) so search stays fast when data grows.
- On a question, do **top-k = 4 to 6** (get the 4-6 closest chunks).
- Filter by `botId` in the same query so we only search that one client's data.

### The prompt template (example)

```
SYSTEM:
You are the support assistant for {business_name}.
Answer ONLY using the CONTEXT below.
If the answer is not in the context, say:
"I'm not sure about that. I can connect you to a person - may I have your email?"
Never make up facts, prices, or dates.
Be short, friendly, and clear.

CONTEXT:
{top_k_chunks}

USER QUESTION:
{question}
```

### Guardrails against hallucination (made-up answers)
1. **Only answer from context** - the system prompt forbids outside knowledge.
2. **Say "I don't know"** - if nothing relevant is found, the bot admits it and offers a human.
3. **Show sources** - return which chunks were used, so answers are checkable.
4. **Low temperature** - set the model temperature low (about 0.2) so it stays factual, not creative.
5. **Empty-retrieval check** - if the top chunk similarity score is too low, skip the AI and go straight to the "I'm not sure, want a human?" reply.

**Why this matters:** SMB clients care most about wrong answers to their customers. Guardrails are the product's trust.

---

## 8. Multi-Tenant Design (Many Clients, One System)

- Every client = one **bot** with a unique **botId** (example: `acme-salon-123`).
- Every row of data (chunks, chats, leads, config) stores the `botId`.
- Every query filters by `botId`. A bot can only ever read its own rows.
- Use Supabase Row Level Security (RLS) as a second lock, so even a code mistake cannot leak data across clients.

Simple picture:

```
bots
  acme-salon-123   -> its chunks, its chats, its leads, its config
  bright-dental-45 -> its chunks, its chats, its leads, its config
```

**Why this matters:** One client seeing another client's data would end the business. Isolation is not optional.

---

## 9. Lead Capture Logic (When And How To Ask)

The bot should not ask for contact details too early (that annoys people). Ask at the right moment.

**Ask for a lead when any of these happen:**
1. The bot cannot answer from the content (no good chunk found).
2. The visitor shows buying intent ("price", "book", "demo", "quote", "sign up").
3. The chat reaches about 4-5 messages and the visitor seems engaged.
4. The visitor asks to talk to a human.

**How it asks (one field at a time):**
- "Happy to help with that. What's your name?"
- "Thanks {name}. What email should we use to reach you?"
- "Great - and a phone number in case email misses you? (optional)"

**Storage:** save to a `leads` table with `botId`, `sessionId`, name, email, phone, time, and the last few messages. Add a simple `score` field (warm / cold) based on which trigger fired. Warm = buying words or asked for a human.

**Why this matters:** Lead capture is what makes clients pay. A support bot is nice; a bot that brings paying customers is a must-have.

---

## 10. Hosting and Deployment

### Where it runs
- **API:** Vercel (Next.js). Render is the backup if a long-running task is needed.
- **Database + vectors:** Supabase.
- **Widget file:** built once, served from a CDN (Vercel or Cloudflare).

### Secrets and environment variables
Keep all keys in environment variables on the server. Never in the widget. Example `.env`:

```
OPENAI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_KEY=...
ADMIN_API_KEY=...
```

The widget never sees these. It only knows the `botId` and the public API URL.

### The two delivery models

| Model | Who hosts | Who owns keys | Best for |
|---|---|---|---|
| Founder-hosted retainer | Founder | Founder | Non-technical SMBs. Recurring monthly income. |
| Client-hosted | Client | Client | Bigger clients with their own team and their own OpenAI account. |

**Why this matters:** The founder-hosted model is the money engine. The founder owns the keys and hosting, so the client pays a monthly retainer to keep the bot alive.

---

## 11. Security (Non-Negotiable Rules)

1. **Keys server-side only** - OpenAI/Supabase keys live on the server. The widget carries none.
2. **Rate limiting** - cap requests per botId and per IP (example: 20 messages per minute) to stop abuse and runaway bills.
3. **Tenant isolation** - always filter by botId + use Supabase RLS.
4. **Input validation** - check and clean every input; cap message length; reject junk.
5. **Domain allow-list** - each bot lists the domains it may run on, so others cannot steal the widget.
6. **Data privacy** - store only what is needed; have a simple delete-on-request path; use HTTPS everywhere.
7. **Prompt-injection care** - treat retrieved content and user text as untrusted; keep the system rules firm.

**Why this matters:** The founder's own brand (from his DevOps and OWASP skills) is "secure by default". This is a real selling edge over cheap no-code tools.

---

## 12. Cost Estimate Per Bot (And Who Pays)

Rough monthly cost for one small-business bot with normal traffic:

| Item | Rough cost | Notes |
|---|---|---|
| LLM tokens (chat answers) | $3 - $20 / mo | Depends on chat volume. GPT-4o-mini or Claude Haiku keep it low. |
| Embeddings (ingestion) | under $1 | One-time-ish, cheap model. |
| Vector DB + Postgres | $0 - $25 / mo | Supabase free tier fits several small bots; paid tier as it grows. |
| Hosting (API + CDN) | $0 - $20 / mo | Vercel free/pro tier shared across bots. |
| **Total per bot** | **~$5 - $50 / mo** | Most small bots sit near the low end. |

**Who pays:** In the founder-hosted model, the client's monthly retainer ($300-1,000) easily covers this. The gap between cost (~$5-50) and retainer is the founder's recurring profit. Keep a per-bot usage limit so one heavy client cannot burn the budget.

**Why this matters:** Know the cost before you quote. The retainer must always be far above the real cost.

---

## 13. File / Folder Structure (Example Repo)

```
zeva/
├── app/
│   └── api/
│       ├── chat/route.ts        # POST /api/chat
│       ├── ingest/route.ts      # POST /api/ingest
│       ├── lead/route.ts        # POST /api/lead
│       └── config/route.ts      # GET  /api/config
├── lib/
│   ├── rag/
│   │   ├── chunk.ts             # split text into chunks
│   │   ├── embed.ts             # create embeddings
│   │   ├── retrieve.ts          # top-k search in pgvector
│   │   └── prompt.ts            # build the prompt template
│   ├── db/
│   │   ├── supabase.ts          # db client
│   │   └── queries.ts           # per-botId queries
│   ├── leads/capture.ts         # lead trigger + save logic
│   └── security/
│       ├── rateLimit.ts
│       └── validate.ts
├── widget/
│   ├── src/widget.ts            # vanilla JS widget source
│   └── dist/widget.js           # built file for the CDN
├── supabase/
│   └── migrations/              # tables: bots, chunks, chats, leads
├── .env.example
├── package.json
└── README.md
```

---

## 14. Build Order (Phase 1 Task List)

Do these in order. Each step should end with something you can test.

1. **Set up repo** - create the Next.js + TypeScript project. Add `.env.example`.
2. **Set up Supabase** - create the project, enable the `pgvector` extension.
3. **Make the tables** - `bots`, `chunks` (with a vector column), `chats`, `leads`. Turn on RLS.
4. **Build ingestion** - write `chunk.ts` and `embed.ts`. Make `/api/ingest` take text, chunk it, embed it, and store it.
5. **Test ingestion** - load one sample business's content. Check the rows appear with the right botId.
6. **Build retrieval** - write `retrieve.ts` for top-k search filtered by botId.
7. **Build the prompt + LLM call** - write `prompt.ts`. Make `/api/chat` do the full RAG flow and stream the answer.
8. **Add guardrails** - "only from context", "I don't know", sources, low temperature, empty-retrieval check.
9. **Build `/api/config`** - return the bot's public settings.
10. **Build the widget** - vanilla JS bubble + iframe chat window. Read `botId` from the tag. Talk to `/api/chat` and `/api/config`.
11. **Add lead capture** - triggers, the ask-flow, and `/api/lead` to save leads.
12. **Add security** - rate limiting, input validation, domain allow-list.
13. **Deploy** - push API to Vercel, build the widget to the CDN.
14. **Make a demo bot** - ingest a fake business's content and get a working chat bubble on a test page.

---

## 15. How To Test And How To Demo

### How to test
- **Unit test** the small parts: chunking gives the right sizes; retrieval returns the right chunks.
- **RAG accuracy test:** write 15-20 real questions for a test business. Check the bot answers correctly and shows sources.
- **Hallucination test:** ask questions NOT in the content. The bot must say "I'm not sure" and offer a human, not make things up.
- **Isolation test:** load two bots. Ask bot A a question only bot B can answer. Bot A must NOT know it.
- **Lead test:** trigger each lead moment and confirm the lead is saved with the right botId.
- **Load/limit test:** send many fast requests and confirm rate limiting kicks in.

### How to demo (portfolio)
- Build a public demo page (for example `demo.zeva.app`) that looks like a fake small business (a salon or dental clinic).
- Put the real widget on it, loaded with one line, so visitors can chat live.
- Add a short "Try asking..." list of sample questions.
- Record a 60-90 second screen video: paste one line of code, refresh, chat, capture a lead. Use this in Upwork proposals and on sandeepsharmadev.in.

**Why this matters:** A live, clickable demo closes clients faster than any words. It proves the "one line, any website" promise and shows the RAG answers with sources.

---

## Summary

The MVP is small on purpose: a RAG backend, an embeddable widget, and lead capture, built multi-tenant from day one. Ship this, put it on a public demo page, win the first Upwork reviews, then add WhatsApp, CRM, and the dashboard with client money. Every choice here uses tools the founder already knows, so the first working demo can be weeks away, not months.