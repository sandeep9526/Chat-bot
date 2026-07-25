# Roadmap to the Complete Brand Product

This is the full plan to grow from a solo freelancer to a real product brand. It goes from 0 to 100. It is written in simple English so it is easy to follow and act on.

The product is a RAG-powered lead-qualification and customer-support AI chatbot for small and medium businesses (SMBs). RAG means "retrieval-augmented generation" - the bot reads the business's own content (website, PDFs, docs, database) and answers from that real data, with sources, instead of making up generic answers.

The working product name is **Zeva (working name)**. This name is a placeholder. Check domain and trademark before you fix on it.

---

## The Big Picture (0 to 100)

Think of the journey in 6 phases. Each phase builds on the one before. You do NOT jump ahead. You finish one, take the money and the lessons, then move up.

- **Phase 0 - MVP:** RAG website widget + lead capture. Goal: a demo and first paying clients.
- **Phase 1 - Channels and smarts:** WhatsApp, human handoff, lead scoring.
- **Phase 2 - Control and proof:** admin dashboard, analytics, CRM links, chat history.
- **Phase 3 - SaaS:** self-serve sign-up, billing, plans, usage limits, onboarding wizard.
- **Phase 4 - Expand:** white-label reseller program, more channels, voice add-on, industry templates.
- **Phase 5 - Scale and brand:** team, marketing engine, integrations marketplace, partners, funding or bootstrap scale.

> **Why this matters:** Most solo founders fail because they try to build the big SaaS on day one. You will instead sell services first (real cash, real clients), then slowly turn that into a product. This lowers your risk to almost zero.

---

## North-Star Vision

> **Zeva helps any small business turn its website and WhatsApp into a 24/7 sales and support team - a smart AI that answers from the business's own knowledge, captures every lead, and never sleeps.**

Everything you build must serve this one idea: **answer accurately from their data, and never lose a lead.**

---

## Phase 0 - MVP (The First Product)

**What we build (features)**
- A RAG chatbot backend (the "brain"). It reads the client's content and answers with sources.
- A content ingestion step: upload a website URL, PDFs, or text. The system splits it, makes embeddings (number versions of text for search), and stores them.
- An embeddable website widget: one line of JavaScript that works on ANY site (WordPress, Shopify, React, Vue, plain HTML).
- Basic lead capture: the bot asks for name, email, phone, and saves it.

**Who it is for:** Your first 1-3 paying clients from Upwork. Small businesses with a website and questions from customers.

**Goal:** Have a live demo you can show, and land your first paying builds to get reviews.

**Timeline:** Month 1 to Month 2.

**Tech added:** Next.js (dashboard + API routes), Node/TypeScript, Supabase (Postgres database + pgvector for embeddings + auth + file storage), OpenAI or Claude via the Vercel AI SDK, the widget as a small vanilla-JavaScript bundle served from a CDN, deploy on Vercel or Render.

**How it makes money:** Small Upwork catalog packages, $150-600 per RAG chatbot build. This is to get your first reviews, not big profit.

**Success metric:** 1 working demo live + 2-3 completed paid builds + 2-3 five-star reviews.

> **Why this matters:** The widget that works on "any website" is your unfair edge over no-code tools that only work in their own box. One line of code = easy "yes" from a client.

**What to do checklist**
- [ ] Build the ingestion + RAG answer flow.
- [ ] Build the widget script (test on a WordPress and a plain HTML page).
- [ ] Put up a live demo on your own site (sandeepsharmadev.in).
- [ ] Create 2-3 small Upwork packages ($150-600).
- [ ] Deliver, ask for a review, repeat.

---

## Phase 1 - Channels and Smarts

**What we build (features)**
- WhatsApp channel: the same bot answers on WhatsApp, not just the website.
- Human handoff: when a lead is warm or the bot is unsure, it passes the chat to a human, with a short AI summary of what the customer wants.
- Lead scoring and qualification: the bot asks questions, then scores how "warm" each lead is (hot, warm, cold).

**Who it is for:** Same SMB clients, but now bigger ones who use WhatsApp to talk to customers. This is a strong selling point in India and many markets.

**Goal:** Sell a bigger, more complete package. Move past $600 jobs into real fixed-price builds.

**Timeline:** Month 2 to Month 4.

**Tech added:** WhatsApp Cloud API or Twilio for WhatsApp, a simple notification system (email or Slack) for handoff, scoring logic in the backend based on the answers a lead gives.

**How it makes money:** Fixed build (RAG bot + widget + WhatsApp + lead capture) for **$1,500-5,000**. Start the recurring retainer here: **$300-1,000/month** for hosting and maintenance (you own the hosting and API keys, so non-technical clients stay with you).

**Success metric:** First $1,500+ fixed build closed. First 2 monthly retainers signed. This is when recurring income begins.

> **Why this matters:** The retainer is the seed of your future SaaS income. Even 5 retainers at $400/month is $2,000 every month while you sleep.

**What to do checklist**
- [ ] Get a WhatsApp Cloud API number working end to end.
- [ ] Build handoff + AI summary.
- [ ] Build a simple lead score (hot/warm/cold).
- [ ] Rewrite your Upwork offer as "AI bot for website + WhatsApp".
- [ ] Add the retainer to every proposal by default.

---

## Phase 2 - Control and Proof

**What we build (features)**
- Admin dashboard: clients (and you) can see and manage the bot from one place.
- Analytics: number of chats, leads captured, top questions, hot leads.
- CRM integrations: HubSpot, Google Sheets, and email. Leads flow straight into the client's tools.
- Conversation history: see every past chat, search it, review it.

**Who it is for:** Clients who want proof the bot works and want leads inside their own systems. Also for YOU, to manage many clients at once.

**Goal:** Look professional. Prove value with numbers. Make managing 10+ clients easy.

**Timeline:** Month 4 to Month 7.

**Tech added:** Dashboard pages in Next.js, charts, background jobs to sync leads, API links to HubSpot and Google Sheets, secure per-client data separation (each client's data stays isolated).

**How it makes money:** Higher build prices ($3,000-8,000) because now it is a full system, not just a bot. Higher retainers ($500-1,000/month) because you now host, monitor, and report.

**Success metric:** 8-15 active retainer clients. Monthly recurring revenue (MRR) of $3,000-6,000. Clients renew because they see the analytics value.

> **Why this matters:** Analytics turn a "nice bot" into a "must-keep tool". When a client sees "42 leads captured this month", they never cancel.

**What to do checklist**
- [ ] Build the multi-client admin dashboard.
- [ ] Add the top 5 analytics numbers clients care about.
- [ ] Ship HubSpot + Google Sheets + email integrations.
- [ ] Send each retainer client a simple monthly report.

---

## Phase 3 - SaaS (The Product)

**What we build (features)**
- Multi-tenant self-serve sign-up: anyone can sign up and make their own bot without you.
- Billing: Stripe (global) + Razorpay (India).
- Subscription plans: for example Starter, Growth, Pro.
- Usage limits: message caps, number of bots, number of documents per plan.
- Onboarding wizard: a step-by-step setup so a new user gets a working bot in 10 minutes.

**Who it is for:** Small businesses worldwide who want to self-serve. Also a cheaper entry tier for clients who cannot afford a full build.

**Goal:** Turn the service business into a product business. Grow without doing every setup by hand.

**Timeline:** Month 7 to Month 12.

**Tech added:** Full multi-tenant design (each client is a "bot" with its own config and isolated data), Stripe + Razorpay billing, plan and usage metering, a guided onboarding flow, email flows for trials and payments.

**How it makes money:** SaaS subscriptions (MRR). Example: Starter $19/mo, Growth $49/mo, Pro $99/mo. Plus you still sell high-touch builds and retainers to bigger clients (this stays your best margin).

**Success metric:** 50-150 paying self-serve accounts. SaaS MRR of $2,000-5,000 on TOP of your service and retainer income. Low churn (fewer than 5% cancel per month).

> **Why this matters:** This is the "0 to 100" jump. Service income has a ceiling (your hours). SaaS income does not. But you only build it AFTER services fund it - no risky loans.

**What to do checklist**
- [ ] Build multi-tenant sign-up and data isolation.
- [ ] Add Stripe and Razorpay.
- [ ] Design 3 clear plans with usage limits.
- [ ] Build a 10-minute onboarding wizard.
- [ ] Add a free trial and payment reminder emails.

---

## Phase 4 - Expand

**What we build (features)**
- White-label / agency reseller program: other agencies sell Zeva under their own name and pay you.
- More channels: Instagram DM, Facebook Messenger.
- Voice-agent add-on: the bot can talk on calls (voice is a higher price tier).
- Template library by industry: ready-made bots for salons, clinics, real estate, e-commerce, coaching, etc.

**Who it is for:** Agencies who want a product to resell, and businesses that want a fast start with a template made for their industry.

**Goal:** Reach more customers without more of your own selling. Let others sell for you.

**Timeline:** Month 12 to Month 18.

**Tech added:** White-label theming (custom logo, colors, domain per reseller), Instagram/Messenger APIs, a voice layer (speech-to-text + text-to-speech), a template system that pre-loads settings and prompts per industry.

**How it makes money:** Reseller/white-label plans (higher price, for example $199-499/mo per agency). Voice add-on as a premium tier. Industry templates raise sign-up conversion, so more paying users.

**Success metric:** 10+ active resellers. Voice add-on on 15%+ of paid accounts. MRR crosses $10,000.

> **Why this matters:** Resellers are a sales team you do not pay a salary. Each agency brings many end clients. This is how a solo brand scales fast.

**What to do checklist**
- [ ] Build white-label branding per account.
- [ ] Add Instagram + Messenger channels.
- [ ] Ship the voice add-on as a paid tier.
- [ ] Make 5-8 industry templates.
- [ ] Launch a simple reseller sign-up page.

---

## Phase 5 - Scale and Brand

**What we build (features)**
- A small team (see team plan below).
- A marketing engine: content, SEO, ads, case studies, referrals.
- An integrations marketplace: many third-party tool connections, and let others build add-ons.
- Partnerships: with agencies, hosting companies, industry groups.
- A funding choice: raise money to grow faster, or stay bootstrapped (grow from profit).

**Who it is for:** The whole market. Now Zeva is a known brand, not a freelancer's side project.

**Goal:** Become a real company with steady growth, a team, and a brand people trust.

**Timeline:** Month 18 onward.

**Tech added:** Public API and marketplace, better infrastructure for scale, monitoring and support tools, a strong data/security setup for bigger clients.

**How it makes money:** All streams together - SaaS MRR, resellers, enterprise deals, add-ons, marketplace fees.

**Success metric:** MRR of $25,000+ and growing. A team running daily work without you touching every task. Named as a trusted SMB chatbot brand.

> **Why this matters:** This is "100". The founder moves from doing the work to leading the company.

**What to do checklist**
- [ ] Hire and train a real team.
- [ ] Build a repeatable marketing machine.
- [ ] Open an integrations marketplace.
- [ ] Sign 2-3 big partnerships.
- [ ] Decide: raise funds or bootstrap.

---

## Feature Table (What Exists in Each Phase)

| Feature | P0 | P1 | P2 | P3 | P4 | P5 |
|---|---|---|---|---|---|---|
| RAG answers from client data (with sources) | Yes | Yes | Yes | Yes | Yes | Yes |
| Website widget (one line of JS) | Yes | Yes | Yes | Yes | Yes | Yes |
| Lead capture (name/email/phone) | Yes | Yes | Yes | Yes | Yes | Yes |
| WhatsApp channel | - | Yes | Yes | Yes | Yes | Yes |
| Human handoff + AI summary | - | Yes | Yes | Yes | Yes | Yes |
| Lead scoring (hot/warm/cold) | - | Yes | Yes | Yes | Yes | Yes |
| Admin dashboard | - | - | Yes | Yes | Yes | Yes |
| Analytics | - | - | Yes | Yes | Yes | Yes |
| CRM integrations (HubSpot, Sheets, email) | - | - | Yes | Yes | Yes | Yes |
| Conversation history | - | - | Yes | Yes | Yes | Yes |
| Self-serve sign-up (multi-tenant) | - | - | - | Yes | Yes | Yes |
| Billing (Stripe + Razorpay) | - | - | - | Yes | Yes | Yes |
| Plans + usage limits | - | - | - | Yes | Yes | Yes |
| Onboarding wizard | - | - | - | Yes | Yes | Yes |
| White-label / reseller | - | - | - | - | Yes | Yes |
| Instagram + Messenger | - | - | - | - | Yes | Yes |
| Voice-agent add-on | - | - | - | - | Yes | Yes |
| Industry templates | - | - | - | - | Yes | Yes |
| Integrations marketplace | - | - | - | - | - | Yes |
| Partnerships + team + marketing engine | - | - | - | - | - | Yes |

---

## Timeline (Months) for a Solo Founder with a Small Team

| Phase | Months | Main job |
|---|---|---|
| Phase 0 - MVP | 1-2 | Build core + get first reviews |
| Phase 1 - Channels/smarts | 2-4 | WhatsApp + handoff + scoring; start retainers |
| Phase 2 - Control/proof | 4-7 | Dashboard + analytics + CRM |
| Phase 3 - SaaS | 7-12 | Self-serve + billing + plans |
| Phase 4 - Expand | 12-18 | White-label + channels + voice + templates |
| Phase 5 - Scale/brand | 18+ | Team + marketing + marketplace |

Note: phases overlap a little. You keep selling services while you build the SaaS. The dates are realistic, not rushed. Real life (client work, energy) may push each phase by 1-2 months. That is fine.

---

## Team-Growth Plan

You start alone. You add people only when the money can pay for them. Never hire before the income is there.

| Stage | Who helps | What they do | When |
|---|---|---|---|
| Solo | Just you | Everything: build, sell, support | Phase 0-1 |
| Small help | Cousins / friends (part-time) | Simple tasks: data entry, testing, replying to easy client messages, content | Phase 1-2 |
| First hires | 1 support person | Answer client questions, onboard clients, monthly reports | Phase 2-3 |
| | 1 second developer | Build features so you are not the only coder | Phase 3 |
| | 1 marketer | Content, SEO, ads, social, case studies | Phase 3-4 |
| Real team | Add: sales, senior dev, ops | Run the company daily | Phase 4-5 |

> **Why this matters:** Your first bottleneck will be support and setup, not coding. So your first real hire is a support person, not a second coder. This frees your time to build and sell.

---

## Money Model Evolution

You move through three money types. They stack on top of each other. You do NOT drop the old ones when a new one starts.

**1. One-off service income (Phase 0-2)** - you build a bot, get paid once.
**2. Retainers (Phase 1 onward)** - clients pay every month for hosting and care. Steady cash.
**3. SaaS MRR (Phase 3 onward)** - many small subscriptions add up. Scales without your hours.

Example numbers per phase (rough, to guide you):

| Phase | One-off builds | Retainers | SaaS MRR | Rough monthly total |
|---|---|---|---|---|
| P0 | 2-3 builds x $150-600 | $0 | $0 | ~$600-1,500 (one-time) |
| P1 | 1-2 builds x $1,500-5,000 | 2 x $400 = $800 | $0 | ~$1,600-6,000 |
| P2 | 1-2 builds x $3,000-8,000 | 10 x $500 = $5,000 | $0 | ~$5,000-10,000 |
| P3 | high-touch builds as wanted | 12 x $600 = $7,200 | ~$3,000 | ~$10,000+ |
| P4 | fewer builds, more product | 15 x $700 + resellers | ~$8,000 | ~$15,000+ |
| P5 | enterprise deals | large + resellers | $20,000+ | $25,000+ |

> **Why this matters:** Fixed-price + retainer beats hourly for an India-based founder. Hourly caps your income at your hours and your rate. Retainers and SaaS do not.

---

## KPIs / Metrics per Phase

Track only a few numbers per phase. Too many numbers = confusion.

- **Phase 0:** demos shown, builds delivered, 5-star reviews.
- **Phase 1:** first $1,500+ build, number of retainers signed, WhatsApp bots live.
- **Phase 2:** active retainer count, MRR, client renewal rate, leads captured per client.
- **Phase 3:** self-serve sign-ups, trial-to-paid rate, SaaS MRR, monthly churn (keep under 5%).
- **Phase 4:** active resellers, voice add-on take rate, MRR growth rate.
- **Phase 5:** total MRR, customer acquisition cost vs lifetime value, team output without founder.

The single most important number across all phases: **MRR (monthly recurring revenue).** It shows if the business is really growing.

---

## Risks per Phase and How to Reduce Them

| Phase | Main risk | How to reduce it |
|---|---|---|
| P0 | No clients trust a new freelancer | Show a strong live demo; price low first for reviews; over-deliver |
| P0 | Bot gives wrong answers | Always answer from client data with sources; add "I am not sure, talk to a human" fallback |
| P1 | WhatsApp API rules and costs | Start on official WhatsApp Cloud API; read the rules; test billing early |
| P1 | You do too much free custom work | Fix the package scope in writing; charge for extras |
| P2 | Managing many clients gets messy | Build the admin dashboard early; automate reports |
| P2 | Client data leaks between clients | Strong per-client data isolation; test it hard |
| P3 | SaaS is complex and eats time | Build only 3 plans first; keep it simple; do not add features nobody asked for |
| P3 | Payment failures / India + global tax | Use trusted providers (Stripe, Razorpay); handle failed payments with reminder emails |
| P4 | Resellers hurt your brand | Give clear rules and training; approve resellers; keep quality checks |
| P4 | Voice is costly and hard | Launch voice as a paid add-on only; charge enough to cover the extra cost |
| P5 | Growing too fast, cash runs low | Watch cash every month; hire only when MRR pays for it; keep 3-6 months of runway |
| All | Founder burnout (you are solo) | Automate boring tasks; get part-time help early; do not skip rest |
| All | Using client or employer IP by mistake | Build everything fresh under Zeva; never reuse PrepVia or any client code or data |

> **Why this matters:** The biggest risk for a solo founder is doing too much at once. Each phase has ONE main job. Finish it before the next.

---

## Next 90 Days - Start Right Now

A simple action list to begin today. Do these in order.

**Days 1-15: Foundation**
- [ ] Finish the current $1,200 Upwork contract well; ask for a great review.
- [ ] Check domain + trademark for the name (Zeva or a backup name).
- [ ] Set up the base project: Next.js + Supabase (with pgvector) + one LLM (OpenAI or Claude).
- [ ] Build the RAG answer flow: upload content, make embeddings, answer with sources.

**Days 16-35: MVP live**
- [ ] Build the embeddable widget (one line of JavaScript).
- [ ] Test the widget on WordPress and on a plain HTML page.
- [ ] Add basic lead capture (name, email, phone).
- [ ] Put a live demo on sandeepsharmadev.in.

**Days 36-60: First clients**
- [ ] Create 2-3 small Upwork catalog packages ($150-600).
- [ ] Rewrite your Upwork profile around RAG + integrations (not "generic AI developer").
- [ ] Send 5-10 strong proposals per week to chatbot / RAG jobs.
- [ ] Deliver first paid build; collect a 5-star review.

**Days 61-90: Momentum + retainer seed**
- [ ] Deliver 2-3 paid builds total; collect reviews.
- [ ] Start WhatsApp channel work (Phase 1).
- [ ] Offer a $300-500/month retainer to every client (you host + own API keys).
- [ ] Sign your first 1-2 retainers.

> **Why this matters:** In 90 days you go from "new on Upwork" to "developer with reviews, a live product, and the first recurring income." That is the real start of the brand.

---

## One Last Rule

Sell services first. Let paying clients fund the product. Turn every client into a monthly retainer. Then, and only then, build the SaaS. This path has almost no risk and a very high ceiling. This is how a solo self-taught developer in Mohali becomes a real product brand - step by step, 0 to 100.