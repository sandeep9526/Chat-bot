# From First Step to Brand: Your 0-to-100 Journey

This document is your map. It shows how to go from a new freelancer to a real business brand. Read it slowly. Do one step at a time. Do not try to do everything at once.

## The Big Picture (One Line)

**First sell the service. Use the money and the lessons to build a product. Then build a brand.**

That is the whole plan in one line. You are one person in Mohali, India. You do not have money to burn. So you cannot start by building a big product and hoping people come. Instead, you get paid by clients first. Every paid job teaches you what real businesses want. You save that knowledge and that money. Then you turn it into a product. Then you turn the product into a brand.

**Why this matters:** Most solo founders fail because they build a product nobody wants, run out of money, and quit. You will do the opposite. Clients pay you to learn what to build. That is a huge, safe advantage.

---

## The Five Stages

You will move through five stages. Do not skip. Each stage funds the next one.

| Stage | Name | What you sell | Main goal |
|-------|------|---------------|-----------|
| 0 | Freelancer | Your hours | Get 2-3 five-star reviews + cash |
| 1 | Productize | Fixed-price builds | One reusable codebase, faster jobs |
| 2 | Retainers | Managed hosting | Monthly recurring money |
| 3 | SaaS | Self-serve app | Many customers, low effort each |
| 4 | Brand | A name people trust | Inbound leads, partnerships |

Your product working name is **Zeva (working name)**. Keep using it while you build. You will pick a final name in Stage 4.

---

### Stage 0 — Freelancer (Months 1-2)

**Goal:** Win your first few Upwork gigs. Get 2-3 five-star reviews. Earn some cash. Learn exactly what clients ask for.

**What to do:**
1. Keep your Upwork profile focused. You are not a generic "AI developer". You are a **RAG chatbot and integrations specialist**. (RAG = the bot answers only from the client's own documents, not made-up answers.)
2. Publish small "catalog" packages on Upwork (fixed-price gigs people can buy directly). Price them at **$150-600**.
   - Example: "I will build a RAG chatbot for your website from your PDFs — $199."
   - Example: "I will add an AI chat widget to your site — $350."
3. Send 5-10 good proposals every day to chatbot and AI-integration jobs. Keep them short. Show you read their job. Offer one clear idea.
4. Finish your current $1,200 "Add AI and sockets" job perfectly. Ask for a 5-star review.
5. After every job, write down in a notebook: What did they ask for? What was hard? What did they not understand? This notebook becomes your product spec.

**How to get customers:** Upwork only. Do not spread thin yet. Win on Upwork first.

**Pricing:** $150-600 per small job. Your hourly is $15 rising to $25. But prefer fixed price so a slow week does not hurt you.

**Money in/out:**
- In: maybe $500-1,500/month at the start.
- Out: almost nothing. Free tiers of Supabase, Vercel, OpenAI trial credit. Keep costs near zero.

**How long:** 1-2 months.

**Milestone to move on:** You have **2-3 five-star reviews** and you have noticed the **same requests coming again and again** (usually: "answer from my docs", "capture leads", "put it on my website", "connect WhatsApp").

---

### Stage 1 — Productize (Months 2-5)

**Goal:** Stop building from scratch every time. Turn your repeated work into ONE reusable chatbot codebase (a template you copy for each new client). Raise your prices.

**What to do:**
1. Build your core template once. It should include:
   - RAG chatbot backend (Next.js API routes + Node/TypeScript).
   - Supabase with pgvector to store the client's document embeddings. (Embeddings = a math version of text so the bot can search meaning.)
   - The embeddable website widget: one line of JavaScript that works on any site (WordPress, Shopify, React, plain HTML).
   - Lead capture: the bot asks for name, email, phone, and scores if the lead is "warm".
2. Make setup fast. New client = new "bot" config + upload their docs. Aim to go live in 2-4 days, not 2 weeks.
3. Raise your price. Sell the full build (RAG bot + widget + WhatsApp + lead capture) for **$1,500-5,000**.

**How to get customers:** Upwork (now with reviews you can charge more) + start light cold outreach.

**Pricing:** $1,500-5,000 per build. Market norm is a setup fee of $2k-5k. You are in India so start at the lower end and climb as reviews grow.

**Money in/out:**
- In: 1-3 builds a month = roughly $2,000-6,000/month.
- Out: small. Maybe $50-150/month for hosting and API keys while you test.

**How long:** 3-4 months.

**Milestone to move on:** You can deliver a full bot in under a week using your template, and clients keep asking "can you host and maintain it for me?"

---

### Stage 2 — Managed Retainers (Months 4-8)

**Goal:** Build recurring income. You host the bot for the client and keep it working. You own the hosting and the API keys, so non-technical clients depend on you every month.

**What to do:**
1. When you sell a build, always offer the retainer too. Say: "I will host it, keep it updated, and fix issues — $X/month."
2. The retainer covers: hosting, API costs, keeping the bot's answers fresh when their content changes, small tweaks, and a monthly report of leads captured.
3. Add features clients pay more for: WhatsApp channel, CRM connection, human handoff (warm lead + short AI summary sent to a real person), and a simple admin dashboard.

**How to get customers:** Convert every build client into a retainer client. This is the easiest sale you will ever make.

**Pricing:** **$300-1,000/month** per client. Market norm is $500-1,500/month.

**Money in/out:**
- In: builds + retainers. This is where money gets stable.
- Out: your real API and hosting bills. Charge enough that the retainer always covers costs plus profit. **Never lose money on API keys.** Track each client's usage.

**How long:** Runs forever. Start in month 4-5.

**Milestone to move on:** You have **5+ retainer clients** paying every month, and managing them one by one is getting slow.

---

### Stage 3 — SaaS Product (Months 8-14+)

**Goal:** Turn the template into a self-serve app. People sign up, pay online, and set up their own bot. You stop doing everything by hand.

**What to do:**
1. Make it multi-tenant. (Multi-tenant = one app serves many clients, each with private, separated data.) Each client is a "bot" with its own config and isolated data.
2. Add sign-up and login (Supabase auth).
3. Add billing: Stripe for global cards, Razorpay for India. Add plans (Starter, Pro, Business).
4. Add a self-serve setup wizard: upload docs, get the widget code, go live.
5. Keep the "done-for-you managed" offer as a premium plan. Many SMBs will still pay you to set it up for them. That is your edge over no-code tools like Chatbase, Tidio, and Boei.

**How to get customers:** Your website, content marketing, Upwork clients who upgrade, and partners.

**Pricing:** Monthly subscriptions. Copy the proven shape: a low entry plan (like Boei's ~$19/month) up to higher plans with WhatsApp, CRM, and more messages.

**Money in/out:**
- In: many small monthly payments + a few big managed clients.
- Out: hosting, API, and maybe one part-time helper (a cousin or friend).

**How long:** Ongoing. Build it slowly on nights and weekends while retainers pay the bills.

**Milestone to move on:** You have paying self-serve users who signed up without you talking to them.

---

### Stage 4 — Brand (Runs alongside from Month 6, strong by Month 12+)

**Goal:** Become a name businesses trust and recommend. A brand means people come to you instead of you chasing them.

This is covered in detail in the Brand Building section below.

---

## Go-To-Market: How You Get Customers

Do the channels in this order. Add a new one only when the last one is working.

### 1. Upwork (start here)
Your first source of paid work and reviews. Keep bidding daily until you have 10+ reviews.

### 2. Cold outreach (add in Stage 1)
Message SMBs directly by email, LinkedIn, and WhatsApp. Target businesses that clearly need leads: salons, clinics, gyms, coaching centers, real estate, local service firms.
- Simple script: "Hi, I saw your website. I can add an AI assistant that answers your customers 24/7 and collects leads for you. Want a free 5-minute demo on your own site?"

### 3. Content (add in Stage 2)
- Short videos: show a bot answering questions from a real website. 30-60 seconds.
- LinkedIn posts: 2-3 per week. Share what you built and what you learned.
- A simple blog on your site for SEO (so Google sends you visitors).

### 4. Partnerships (add in Stage 3)
Web-design agencies build sites but do not build AI bots. Offer to be their "AI chatbot guy". They bring you clients; you give them a cut or a wholesale price. This is the fastest way to scale.

### 5. Referrals (always on)
After every happy client, ask: "Do you know one other business owner who needs this?" Give a small reward for a referral that becomes a client.

### Simple weekly actions (do these every week)
- [ ] Send 25+ Upwork proposals or cold messages.
- [ ] Post 2-3 times on LinkedIn.
- [ ] Record 1 short demo video.
- [ ] Message 1 web-design agency about partnering.
- [ ] Ask 1 happy client for a referral.
- [ ] Update your notebook of "what clients keep asking for".

---

## Brand Building

### Product name ideas
Your working name is **Zeva (working name)**. Here are options. Pick a short, easy-to-say name that hints at chat, help, or leads.

| Name | Why it works |
|------|--------------|
| **Zeva** | Short, soft, easy to say worldwide. Sounds friendly, like a helper. |
| **Replyo** | Says "reply" clearly — the bot replies to customers. Modern -o ending. |
| **Leadchat** | Very clear: it chats and gets leads. Easy to understand, weak on uniqueness. |
| **Answerly** | Says the bot gives answers. Trustworthy, calm feel. |
| **Convo** | Short for "conversation". Friendly and simple. |
| **Nova AI** | "Nova" = new star. Feels smart and premium. |

**Recommended:** **Zeva**. It is short, easy for any customer to say, has no fixed meaning (so it can grow), and sounds friendly. Second choice: **Replyo**.

**IMPORTANT — check before you commit:**
- [ ] Domain: is zeva.com / zeva.ai / getzeva.com free? Buy the best available.
- [ ] Trademark: search your country's trademark database and a quick Google. Do not build a brand on a name someone else owns.
- [ ] Social handles: is the name free on LinkedIn, X, Instagram, YouTube?

Do all three checks before printing anything or telling clients the final name.

### Logo and identity (keep it simple)
- A clean wordmark (the name in a nice font) plus one small symbol — like a chat bubble with a small spark or dot.
- Pick 2 colors: one main (a calm blue or green = trust) and one accent (for buttons).
- Use the same look everywhere: website, Upwork profile, LinkedIn, invoices.
- Tools: Canva or a cheap Fiverr designer. Do not overspend early.

### Positioning statement
> "Zeva gives small businesses an AI assistant that answers customer questions from their own content and turns visitors into leads — on their website and WhatsApp, set up for them in days."

### Tagline options
- "Answers from your business. Leads to your inbox."
- "Your 24/7 AI that talks and sells."
- "Turn website visitors into leads."

### What the marketing website needs
A simple 5-part site:
1. **Home** — one clear line about what it does, a demo bot in the corner, a big "Book a call" button.
2. **How it works** — 3 steps: upload your content, add one line of code, start getting leads.
3. **Pricing** — clear plans (self-serve + a "done-for-you" managed option).
4. **Demo** — a live bot the visitor can chat with right now. This sells better than any words.
5. **Book a call** — a calendar link so a serious buyer can talk to you.

---

## Money Model (Simple Math)

The magic is the monthly retainer. Recurring money adds up.

| Clients | Retainer each | Monthly income |
|---------|---------------|----------------|
| 2 | $500/mo | $1,000/mo |
| 6 | $500/mo | $3,000/mo |
| 10 | $500/mo | $5,000/mo |
| 20 | $500/mo | $10,000/mo |

Add build fees on top. Each build is $1,500-5,000 one time.

**Path to your goals:**
- **$1,000/month:** just 2 retainer clients at $500. You can reach this in Stage 2 with 2-3 clients.
- **$3,000/month:** 6 retainer clients — or 3 retainers + 1 build per month.
- **$10,000/month:** 20 retainers, OR a mix like 10 retainers ($5,000) + 2 builds ($5,000). Or fewer clients on higher retainers ($1,000/mo).

**Why this matters:** Builds pay you once. Retainers pay you every month, even in a slow month. Chase retainers hard. They are the difference between stress and freedom.

---

## KPIs to Track (Know Your Numbers)

Track these in a simple Google Sheet. Numbers tell you what is working.

| Stage | Watch these numbers |
|-------|---------------------|
| 0 Freelancer | Proposals sent, jobs won, reviews earned, cash in |
| 1 Productize | Build price, days to deliver, builds per month |
| 2 Retainers | Retainer clients, MRR (monthly recurring revenue), API cost per client, profit per client |
| 3 SaaS | Sign-ups, free-to-paid rate, MRR, churn (clients who cancel), demos booked |
| 4 Brand | Website visitors, inbound leads, close rate (leads that become clients), referrals, partners |

**Key ones to never lose sight of:** MRR (are you growing?), churn (are people leaving?), and profit per client (are you actually making money after API costs?).

---

## 12-Month Timeline (Realistic for One Person + a Small Team)

You may have a cousin or friend help part-time. Keep it lean.

| Quarter | Months | Focus | Target |
|---------|--------|-------|--------|
| Q1 | 1-3 | Freelance + reviews | Finish current job, publish catalog gigs, get 2-3 five-star reviews, build the reusable template |
| Q2 | 4-6 | Productize + first retainers | Sell 1-2 builds/month at $1,500+, land first 2-3 retainer clients, add WhatsApp |
| Q3 | 7-9 | Grow retainers + start SaaS | Reach 5+ retainers (~$3,000 MRR), start building the multi-tenant SaaS on the side, buy the brand domain |
| Q4 | 10-12 | Brand + SaaS launch | Launch the marketing website with a live demo, open self-serve sign-up + billing, sign 1-2 agency partners, aim for $4,000-6,000/month total |

Month-by-month, the pattern is simple: **every month, keep bidding, keep shipping, keep asking for reviews and referrals, and slowly move more income from one-time builds to monthly retainers.**

---

## Mindset and Personal Notes

These rules protect you. Do not break them.

**1. Keep this 100% separate from your day job and clients.**
- Do not use any employer or client code, tools, accounts, or data. PrepVia is a client project — it is not yours. Zeva must be built only from your own new code, on your own time, with your own accounts.
- Do not work on Zeva during hours you owe to a client or employer.
- **Why this matters:** Using someone else's IP (their code or ideas) can destroy your reputation and cause legal trouble. Your clean name is your most valuable asset. Guard it.

**2. Protect your reputation above money.**
- Never over-promise. If a job needs 5 days, do not say 2.
- Deliver a little more than you promised. Happy clients give reviews and referrals.
- One angry client with a bad review hurts more than one gig pays.

**3. Start small and ship.**
- Do not wait for the "perfect" product. A simple bot that works today beats a perfect one that never launches.
- Ship, get feedback, improve. Repeat.

**4. Manage money and energy.**
- Keep costs near zero until real income comes.
- Always charge enough that retainers cover your API and hosting bills plus profit.
- Rest. You are the whole company right now. If you burn out, everything stops.

**5. Remember the one line.**
Sell the service. Learn and earn. Build the product. Build the brand. One step at a time, from 0 to 100.