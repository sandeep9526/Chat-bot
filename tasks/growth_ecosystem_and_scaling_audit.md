# Zeva Platform: Product Growth, CMS Ecosystem & Enterprise Scaling Audit

This document details strategic product growth capabilities, zero-code CMS plugins, lifecycle email automations, AI regression evaluation tools, and operational resiliency protocols required to elevate the **Zeva AI Chatbot Platform** from an operational engineering codebase into a self-scaling, high-retention SaaS enterprise.

---

## 1. E-Commerce & CMS Zero-Code Plugins (Mass Market Ecosystem)
Requiring customers to manually modify HTML template files and paste raw `<script>` tags creates high technical friction for standard small business owners and e-commerce operators.

### Strategic Product Gap
- Over 70% of potential client businesses (salons, real estate agencies, health clinics, and retail stores) build their web presence on **WordPress / WooCommerce, Shopify, Wix, and Squarespace**. Most operators do not possess technical coding knowledge to inject custom scripts safely into DOM footers.

### Action Item Checklist
- [x] **Official WordPress / WooCommerce Plugin (`zeva-wp-plugin.zip`)**:
  * Author a standardized PHP WordPress plugin featuring a dedicated WP Admin Settings dashboard.
  * Enable users to input their unique Zeva `botId` in a single text field; the plugin programmatically injects `<script src="https://cdn.zeva.app/widget.js" data-bot-id="...">` across all pages without requiring theme manual code edits.
  * Optionally allow excluding specific URL slugs (e.g. `/cart` or `/checkout`).
- [x] **Shopify Theme App Extension**:
  * Develop an embedded Shopify Theme Extension enabling shop operators to add the Zeva floating chat assistant via Shopify's graphical visual Theme Editor toggle switches.
  * Integrate real-time Shopify Storefront API queries into Zeva's RAG backend, permitting visitors to ask live product inventory questions (*"Is the silk summer dress available in Medium?"*) and tracking shipment orders directly inside the widget.
- [x] **Wix & Squarespace Integration Guides**:
  * Produce dedicated step-by-step visual documentation and embed blocks explicitly structured for Wix App Market and Squarespace Code Injection consoles.

---

## 2. Viral Loop Infrastructure & Affiliate Referral Portal
In successful B2B embeddable widget businesses (Intercom, Tawk.to, Chatbase), organic referral traffic originating from client web interfaces generates significant recurring revenue.

### Strategic Product Gap
- When Free or Starter plan tenants deploy our widget displaying the bottom watermark badge (**"Powered by Zeva AI"**), clicking the attribution link currently routes visitors to a static landing page without attribution tracking or partner monetization mechanisms.

### Action Item Checklist
- [x] **Affiliate & Partner Commission Engine**:
  * Integrate an automated B2B affiliate platform (e.g., Rewardful, PartnerStack, or internal custom affiliate tracking hooks) allowing digital marketing agencies, SEO consultants, and web developers to receive a 20% recurring monthly revenue share for referring paying Pro/Enterprise chatbot clients.
- [x] **Attribution Query Parameter Binding**:
  * Configure `widget.js` to construct outbound watermark URLs incorporating unique affiliate or source tenant tracking parameter signatures: `https://zeva.app/?ref=bot_prime_realty&utm_source=widget_watermark`.
- [x] **Referral Analytics Console**:
  * Expose an **"Affiliate & Referrals"** tab inside the tenant user panel where bot owners can view their unique referral link, total clicks generated from their website widget badge, converted subscriber referrals, and earned commission payouts.

---

## 3. Product-Led Growth (PLG) Lifecycle & Drip Nurturing Automations
SaaS retention relies on automated event-driven interventions to guide users from initial onboarding to paid plan upgrades.

### Strategic Product Gap
- When a newly registered customer initializes a chatbot inside the Studio but fails to paste the embed snippet onto their live server within 48 hours, the system issues zero automated follow-up communication, resulting in silent user drop-off and churn.

### Action Item Checklist
- [x] **Event-Driven Automated Lifecycle Email Drip (Resend / Postmark / Customer.io)**:
  * **Day 0 (Instant Onboarding Welcome)**: *"Welcome to Zeva AI! Here is your custom 1-line installation script and quick-start guide."*
  * **Day 2 (Installation Intervention Helper)**: Triggered automatically if zero incoming chat requests hit the API within 48 hours: *"We noticed your Zeva assistant isn't live yet. Need our engineering support to embed it on WordPress, Shopify, or custom HTML?"*
  * **Day 7 (Value & Revenue Proof)**: Triggered upon capturing first 5 hot/warm leads: *"🎉 Success! Your Zeva chatbot just captured 5 high-intent visitor leads! Upgrade to Pro today to unlock unlimited lead exporting, real-time Google Sheets syncing, and WhatsApp integration."*
  * **Day 25 (Usage Threshold Warning)**: Triggered when trial or starter message volume crosses 85% of allowance: *"⚠️ Alert: Your Zeva chatbot has consumed 85% of your monthly message allowance. Upgrade your plan to prevent service interruption!"*
- [x] **In-App Interactive Studio Walkthrough**:
  * Integrate an interactive onboarding tour library (Driver.js or Intro.js) to guide first-time administrators step-by-step through document uploading, color accent selection, testing chat interactions, and copying embed code blocks.

---

## 4. AI Observability, Automated "LLM Eval" & Vendor Failover
Iterating on backend AI models and document extraction parameters requires systematic safeguards against regression and cloud service outages.

### Strategic Product Gap
- Whenever engineering updates the inference LLM provider (switching from Llama 3.3 to DeepSeek R1, Anthropic Claude 3.5 Sonnet, or OpenAI GPT-4o) or modifies text chunk sizes in `ingest.py`, there is zero empirical testing framework to prove whether retrieval precision improved or degraded into hallucinations. Furthermore, if OpenRouter API encounters cloud latency or rate limits (HTTP 502/504), the backend fails without attempting secondary provider fallbacks.

### Action Item Checklist
- [x] **Automated RAG Evaluation Suite ("LLM Eval")**:
  * Implement an automated AI regression benchmarking pipeline (via Ragas, DeepEval, or LangSmith) within our automated pytest infrastructure.
  * Establish a baseline suite of 50 standardized domain questions verified against test documents to automatically calculate **Retrieval Precision, Faithfulness, and Answer Relevance** percentages prior to merging production codebase alterations.
- [x] **Multi-Vendor Failover Routing**:
  * Upgrade `call_llm()` in `main.py` with multi-provider retry and secondary fallback switching:
    ```python
    try:
        return call_openrouter(messages, timeout=6.0)
    except (TimeoutException, HTTPError):
        logger.warning("[AI Eval] OpenRouter primary timed out; failing over to OpenAI backup provider.")
        return call_openai_fallback(messages)
    ```

---

## 5. Disaster Recovery Plan (DRP) & Live System Status Portal
Commercial enterprise clients relying on Zeva for round-the-clock customer helpdesk operations require documented operational safety and service visibility guarantees.

### Strategic Product Gap
- The platform lacks documented database disaster recovery testing protocols and an active public system status dashboard for enterprise SLAs.

### Action Item Checklist
- [x] **Automated Point-in-Time Recovery (PITR) & Snapshot Drills**:
  * Configure automated nightly point-in-time recovery backup schedules on Neon PostgreSQL database instances.
  * Document simple rollback commands and simulation drill procedures to ensure accidental administrative deletions or flawed database migrations can be restored within a 15-minute Recovery Time Objective (RTO).
- [x] **Public Status Portal (`status.zeva.app`)**:
  * Deploy a publicly accessible real-time uptime health dashboard (utilizing Better Stack, Atlassian Statuspage, or Upptime).
  * Automatically monitor and display continuous availability metrics for FastAPI ingestion endpoints, CDN static asset delivery, database query latency, and AI inference response times.
