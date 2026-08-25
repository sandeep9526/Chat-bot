# OchreShift Marketing Site — Conversion Audit & Implementation Plan

Basis: full code review of every homepage section + supporting pages (sign-up, demo, docs, footer),
plus 2026 SaaS conversion research (Slack / HubSpot / Asana / Intercom patterns, section-order
studies, pricing & social-proof data).

Key research facts driving this plan:
- Proven section order: Hero → Proof bar → Problem → Features-as-benefits → How-it-works →
  Testimonials → Pricing → FAQ → Final CTA.
- Visible pricing lifts conversion ~20–30%; hidden pricing sends buyers to competitors.
- One repeated CTA (same action at hero/mid/bottom) beats CTA variety — single-CTA tests show up to +266%.
- 50–60% of visitors never scroll past the second section → proof must appear early.
- Trust copy must be specific buyer language (encryption in transit/at rest, "your data never
  trains models", deletion control), not generic reassurance.
- AI-chatbot buyers' top pre-purchase questions: Does it hallucinate? Is my data used for training?
  What happens when it doesn't know? Which platforms? Setup effort? Cancel anytime?
- "No credit card required" microcopy is a standard risk-reversal lever (and our sign-up page
  already honestly says "no card required").

Legend: [KEEP] minor polish · [FIX] targeted repairs · [REWRITE] substantial rework · [NEW] build

---

## P0 — Conversion blockers (do first)

### 1. [NEW] ProofBar — insert directly under Hero
Research: logo walls/counters directly below the hero are the highest-impact proof placement;
50–60% of visitors never scroll further.
- Build `ProofBar.tsx`: one quiet strip: honest usage counters ("questions answered",
  "businesses onboarded" from real beta numbers) + "Works with" platform badges
  (WordPress, Shopify, Wix, Webflow, Squarespace, custom HTML).
- No fake logos. If no counters yet, ship integrations-only version.
- Effort: small.

### 2. [REWRITE] Pricing section — render it on the page
Research: showing price lifts conversion 20–30%; HubSpot keeps Pricing in top nav.
Existing `Pricing.tsx` is unusable as-is:
- Stale tokens: `text-bg` renders near-invisible under current theme vars; hardcoded light-only
  colors (`bg-white`, `#F8F8F6`, slate hexes).
- "Contact Sales" links to `/contact` → **404** (verified).
Plan:
- Rebuild with current design tokens (bg-surface/text-fg/border-border/accent), dark+light safe.
- Keep 3 tiers ($19 Starter / $49 Pro "Most Popular" / Enterprise Custom) but verify prices with
  billing reality in `BillingCard.tsx` before shipping.
- Enterprise CTA → `mailto:hello@ochreshift.com` until a contact page exists.
- Under grid: "14-day free trial · No credit card required · Cancel anytime".
- Add `id="pricing"`; add Pricing link to header nav.

### 3. [REWRITE] FAQ section — rebuild and place before FinalCTA
Research: FAQ = objection handling right before the decision point. Existing `FAQ.tsx` has good
questions but stale light-only tokens (`text-bg`, hardcoded `#F8F8F6`) — broken in current themes.
Plan:
- Rebuild accordion with tokens (keep grid-rows animation pattern, it's nice).
- Question set (research-derived):
  1. How does it work? (RAG answer)
  2. Will it make things up? (grounding + human fallback ← our #1 differentiator)
  3. Is my business data used to train AI models? (No — isolated per business)
  4. What happens when it doesn't know an answer? (asks for contact → human takeover)
  5. Which website platforms does it work with? (one script tag, any site)
  6. How long does setup take? (minutes; upload or point us at your site)
  7. Can I cancel anytime? (yes, no contracts)
  8. What happens after the free trial? (pick a plan or widget pauses)

### 4. [FIX] SiteHeader — sticky nav + working anchors + Pricing link
- Header is currently NOT sticky → CTA scrolls away. Make it sticky/fixed with scroll state
  (globals already have `.nav-shell[data-scrolled]` styles unused here).
- Nav link `#features` is dead — no element carries that id anywhere (verified in live HTML).
  Either add `id="features"` to the GroundedAnswers/Knowledge cluster or repoint the link.
- Add Pricing item. Keep mobile drawer behavior.

### 5. [NEW] Embed our own widget on ochreshift.com (dogfooding)
Research: Intercom's homepage IS the demo; HubSpot's chat books meetings on their own site.
We sell an AI answer-widget yet don't run it on our own marketing pages.
- Include `public/widget.js` on the home layout so visitors can literally ask the product questions.
- This is simultaneously proof, demo, and lead capture. Highest credibility-per-effort item.

---

## P1 — High-value fixes to existing sections

### 6. [FIX] Global theme-token audit (light mode is broken today)
Marketing honors OS/saved theme (MarketingThemeInit), so light mode is a real user path — and
multiple sections hardcode dark-only values that vanish on light backgrounds:
- `Hero.tsx`: eyebrow `bg-white/[0.03]`, window dots `bg-white/10`.
- `ProductMechanism.tsx`: connector lines `bg-white/10`, inactive ring `ring-white/10`.
- `KnowledgeBase.tsx`: icon tile `bg-white/[0.03]`; also `hover:border-border` is a no-op.
- Various `text-slate-500/600` labels.
Plan: sweep all marketing components → token equivalents (`bg-panel`, `border-border`,
`text-muted`, `ring-border`). No visual change in dark, fixes light.

### 7. [FIX] Hero
Keep structure (headline/sub/demo/CTAs already match best-practice anatomy). Changes:
- Add microcopy row under CTAs: "14-day free trial · No credit card required · Live in minutes".
- Fix light-mode fills (see audit #6).
- Demo animation: hot-lead alert lands at ~5.5s delay — most visitors never see the punchline.
  Compress timeline (~2.5s total) or trigger on view.
- Headline A/B candidate (later): add specificity/number once real stats exist.

### 8. [FIX] ProductMechanism (How-it-works)
Research: 3 steps outperform 6-step process strips; steps should carry proof.
- Collapse 6 nodes into 3 phases: **Ask** (01–02) → **Capture & Score** (03–05) → **Alert** (06),
  or keep 6 visually grouped under those 3 labels.
- Fix invisible light-mode connector lines; consider animated fill-on-scroll (polish, optional).

### 9. [FIX] LeadQualification
- "View conversation" is a dead `<button>` → make it a Link to `/demo` (turns illustration into funnel).
- Align button styling to accent tokens instead of hardcoded white/black.

### 10. [FIX] HumanTakeover
Strongest visual on the page — keep the mockup. Changes:
- Blue-600 "Take Over Conversation" button is off-brand; move to accent or neutral dark button
  (blue can stay as semantic "human agent" color in small doses).
- Tone down `shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)]` for light mode via shadow token.

### 11. [FIX] UseCases — make each card concrete
Research: use-case sections convert when visitors see themselves in a specific scenario.
- Keep 4 industries (right ICP). Add one example visitor question per card as a tiny chat-bubble
  chip ("Do you take walk-ins?") — makes the abstract tangible.
- Add `id="use-cases"` exists ✓ (already fine).

### 12. [REWRITE copy only] TrustSection — specific evidence, not vibes
Research: replace generic reassurance with plain-language controls buyers can repeat internally.
Rewrite card bodies to:
- Isolated Knowledge → "Your documents are stored separately and are **never used to train AI
  models**." (+ encryption in transit & at rest if true — verify before claiming)
- Secure Lead Capture → state where leads go and who sees them.
- Data Control → "Delete your account or any document anytime — immediate, not 'on request'."
- Add micro-disclaimer links to Privacy/Terms. NO fake SOC 2 badges (honesty constraint + FTC risk).

### 13. [MERGE] InstallationSpeed + integrations
- Reduce 5 cards → 3 steps (Create → Upload knowledge → Paste one script tag).
- Add an actual embed `<script>` snippet preview (code block component exists in globals).
- Append "works with any stack" badge row here if ProofBar ships integrations-light.

---

## P2 — Add when assets exist / polish

### 14. [NEW] Testimonials module
Research: testimonials with specific named outcomes are top-tier proof; placeholder quotes would
be worse than none. Plan: build the component now, ship empty-safe variant (founder guarantee +
refund-policy promise) until 2–3 real beta quotes with names/metrics exist. Slot between UseCases
and Pricing.

### 15. [FIX] ProblemSection — quantify the pain
Cards are well-written PAS already. Add one agitation stat line under the head
(e.g., response-time expectation data — must be sourced before publishing). Low priority.

### 16. [FIX] FinalCTA
- Contrast bug: `bg-accent text-white` ≈ 2:1 ratio → use dark text like Hero (`text-[#08111F]`).
- Add same risk-reversal row as Hero (consistency = the single repeated CTA pattern).
- Consider gradient-text echo of headline for cohesion.

### 17. [FIX] Footer
- Three empty placeholder circles look unfinished → wire real social URLs or delete.
- Add visible contact email (basic trust signal).
- Legal/product links verified OK.

### 18. [LATER] Page assembly order (after components ready)
Final order:
`Header(sticky) → Hero → ProofBar → Problem → Workflow(3-phase) → GroundedAnswers(id=features?)
→ KnowledgeBase → LeadQualification → HumanTakeover → UseCases → Trust → Installation(merged)
→ Testimonials → Pricing(id=pricing) → FAQ → FinalCTA → Footer(+widget script)`

---

## Verification checklist before "done"
- [ ] tsc + eslint + production build green
- [ ] Light AND dark theme spot-check every touched section
- [ ] All nav anchors resolve to existing ids (curl the HTML)
- [ ] Every CTA/link target returns 200 (incl. mailto fallbacks)
- [ ] Mobile pass: no horizontal overflow, CTAs thumb-reachable, animation delays compressed
- [ ] No fabricated claims: every stat/badge/compliance mention traced to something real
