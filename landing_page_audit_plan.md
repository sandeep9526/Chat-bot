# OchreShift Landing Page Audit Plan

This document outlines the step-by-step process for auditing and refining the OchreShift AI-generated landing page to ensure it matches the actual product offering, has no grammar/link issues, and maintains a consistent, premium design language.

## 1. Content & Value Proposition Alignment
The product is "OchreShift" (formerly Zeva), an AI Answer Engine and Lead Capture widget for service businesses. It answers questions using the business's knowledge base, captures leads, and hands off to humans for hot leads.

- [x] Audit `Hero.tsx` to ensure messaging hits these points correctly.
- [x] Audit `ProblemSection.tsx`, `ProductMechanism.tsx`, and `ProductProof.tsx`.
- [x] Audit `GroundedAnswers.tsx`, `KnowledgeBase.tsx`, and `LeadQualification.tsx`.
- [x] Audit `HumanTakeover.tsx`, `UseCases.tsx`, `TrustSection.tsx`, `InstallationSpeed.tsx`, and `FinalCTA.tsx`.
- [x] Rewrite any generic AI copy to be sharp, concise, and aligned with OchreShift's actual features.

## 2. Interactive Elements (Buttons, Links, Forms)
- [x] Check all `<Link>` and `<a>` tags in `Nav.tsx`, `SiteHeader.tsx`, `Footer.tsx` and all marketing components.
- [x] Ensure CTAs (like "Start free", "Try the live demo") point to the correct routes (`/sign-up`, `/demo`, etc.).
- [x] Verify hover states and micro-animations on all buttons for a premium feel.

## 3. Grammar and Copywriting
- [x] Run a grammar check across all marketing components.
- [x] Standardize the voice and tone (professional, tech-forward, reassuring for service businesses).
- [x] Fix capitalization inconsistencies (e.g., "AI lead capture", "Answer Engine").

## 4. Theme & Layout Consistency (Aesthetics)
The site uses a dark mode first approach (`bg-[#0B0F19]`), with yellow/orange accents (`#FFB800`), `Inter`, `Space Grotesk`, and `JetBrains Mono` fonts.

- [x] Ensure all sections flow naturally into one another without jarring background color shifts.
- [x] Verify that paddings (`pt-32 pb-28`, etc.) are consistent across sections.
- [x] Check that `text-slate-*` and text sizing classes are uniform across headers, subheaders, and body text.
- [x] Verify that `useAnimations` and `framer-motion` transitions are smooth and consistent.

## Execution Strategy
We will tackle these one by one, verifying changes after each component/section update.
