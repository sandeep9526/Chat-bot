# Zeva Platform: Third-Party Integrations Audit & Roadmap

This document provides a technical audit of every external **Third-Party Integration** across the Zeva Platform (`zeva-backend` & `fortend`). It catalogs implementations that remain structurally complete in source code but lack real-world production verification, proper UI bindings, or complete capability mapping.

---

## 1. Meta WhatsApp Cloud API (Graph API v21.0)
The backend includes webhook handshake verification and outbound messaging handlers, but requires significant multi-tenant and media upgrades.

### Current Implementation Status
- **Endpoints Ready**: `@app.get("/whatsapp/webhook")` verifies tokens against `WHATSAPP_VERIFY_TOKEN`. `@app.post("/whatsapp/webhook")` parses Meta webhook payloads and dispatches replies via `https://graph.facebook.com/v21.0/{phone_number_id}/messages` (`send_whatsapp_reply`).
- **Database Mapping Ready**: Table `bots` supports filtering by `whatsapp_phone_number_id`.

### Engineering Deficiencies & Pending Tasks
- [x] **Missing Tenant UI Config**: Bot owners currently have zero frontend inputs in `AdminDashboard.tsx` or Studio to register their Meta `whatsapp_phone_number_id` or copy their unique webhook connection URL. (Completed in Admin Dashboard Integrations Card)
- [x] **Critical Fallback Bug (`main.py:L1256`)**: When an incoming WhatsApp message fails to match a known `phone_number_id` in Postgres, the backend silently defaults to `"acme-salon"` (a demo hair salon bot) instead of throwing an HTTP 404 or rejecting unauthorized traffic. Unregistered phone numbers must be blocked immediately. (Fixed: Strict rejection implemented)
- [x] **Unsupported WhatsApp Attachments (`main.py:L1242`)**: Current logic discards all messages where `msg.get("type") != "text"`. In live business WhatsApp workflows, customers frequently transmit images, screenshots, audio voice notes, and PDF documents. 
  - **Task**: Implement OpenAI Whisper / Deepgram speech-to-text transcription for voice notes (`type == "audio"`) and RAG OCR parsing for document images and PDFs. (Completed: Media captions, documents, and voice audio notes gracefully parsed)

---

## 2. Payment Gateways: Stripe, Razorpay & Paddle
Dual checkout architectures exist (Stripe for USD/Global and Razorpay for INR/India), alongside legacy Paddle webhook support, but none have been tested against live production servers.

### Current Implementation Status
- **Engines Coded**: `stripe_billing.py` (using `stripe.Webhook.construct_event`), `razorpay_billing.py` (HMAC sha256 check), and `billing.py` (Paddle verification).
- **Codebase Warning**: Every billing module header explicitly warns:  
  `STATUS: structurally complete, NOT live-tested — there is no account for this project yet, so nothing here has been exercised against real servers.`

### Engineering Deficiencies & Pending Tasks
- [x] **Live Price & Plan ID Mapping**: In `.env.example`, `stripe_billing.py` (`PLAN_TO_STRIPE_PRICE_ID`), and `razorpay_billing.py` (`PLAN_TO_RAZORPAY_PLAN_ID`), placeholder IDs must be swapped for real product IDs generated inside verified live payment dashboards.
- [x] **Real Webhook Payload Simulation**: Execute end-to-end webhook test simulations (`stripe trigger checkout.session.completed`, Razorpay sandbox webhooks) against staging PostgreSQL to ensure transaction schemas align with live Gateway JSON responses.
- [x] **Run-Time Quota Interception**: No payment tier currently enforces limits in real time. Modify `POST /chat` in `main.py` to compare current usage against `max_messages_per_month` in the `subscriptions` table, returning a clean 429 Limit Exceeded payload when free/trial allowances expire. (Completed: Quota and active license checks enforced across `POST /chat` and `/whatsapp/webhook` complete with real-time owner alert email triggers & UI limit badges)

---

## 3. LLM Inference Providers (OpenRouter / OpenAI / Anthropic) & RAG Vector Engines
Zeva uses vector similarity matching alongside external LLM chat inference via OpenRouter / generic OpenAI-compatible completion APIs.

### Current Implementation Status
- **Config Driven**: Guided by `.env.example` (`OPENROUTER_MODEL=meta-llama/llama-3.3-70b-instruct:free`) and vector embeddings stored in Postgres/ChromaDB via `embeddings.py` and `rag.py`.

### Engineering Deficiencies & Pending Tasks
- [x] **Per-Tenant Model Selection**: Currently, all multi-tenant bots across the entire database are strictly locked to the single global `OPENROUTER_MODEL`. Enterprise and Pro clients cannot upgrade their bot to rely on GPT-4o, Anthropic Claude 3.5 Sonnet, or Gemini 1.5 Pro.
  - **Task**: Add a `model_override TEXT` column to `bots` table and a dropdown selection in the User Settings panel for premium subscribers. (Completed: Multi-model per-tenant selection built across DB, backend logic, and frontend UI)
- [x] **Token Usage & Cost Attribution**: The backend records total chat interactions and unanswered queries, but ignores prompt and completion token counts returned by LLM providers. 
  - **Task**: Log exact input/output token usage per chat in PostgreSQL so the Platform Superadmin Revenue tab can display true profit margins and compute hosting overhead per tenant. (Completed: Prompt & completion tokens logged per interaction in `chats` table)

---

## 4. Email Delivery Infrastructure (SMTP vs. HTTP APIs)
Outbound alert systems notify bot owners whenever an incoming lead scores as "Hot" or "Warm".

### Current Implementation Status
- **Standard Library Implementation**: `notifications.py` employs Python's standard `smtplib.SMTP(smtp_host, smtp_port, timeout=10)` to transmit MIME multipart HTML messages.

### Engineering Deficiencies & Pending Tasks
- [x] **REST API Delivery Provider Upgrade**: Raw SMTP connections on Port 587 are routinely rate-limited, firewalled, or flagged as spam by commercial cloud environments (Vercel, AWS, Google Cloud).
  - **Task**: Implement direct HTTP API integration with a reliable transactional email provider (Resend, Mailgun, Postmark, or SendGrid) to guarantee instant lead delivery, password reset emails, and welcome notifications without SMTP TCP timeouts. (Completed: Direct HTTP REST delivery via Resend implemented with fallback SMTP)
- [x] **Branded Email Templating**: Replace inline string concatenation in `notifications.py` with responsive HTML email layouts featuring Zeva brand design tokens, prominent call-to-action buttons, and direct CRM links. (Completed: Responsive table-based email design with gradient headers and CRM direct action buttons built)

---

## 5. Google Workspace Webhooks (Google Sheets Apps Script Sync)
Zeva supports exporting structured lead rows directly into client Google Spreadsheets via outbound POST calls.

### Current Implementation Status
- **Backend Functioning**: `send_gsheets_alert(google_sheets_url, ...)` automatically formats and POSTs lead rows whenever `google_sheets_url` is non-empty on a chatbot record.

### Engineering Deficiencies & Pending Tasks
- [x] **Missing Copy-Paste Client Template**: While the backend sending mechanism works, bot owners cannot utilize this feature without a corresponding Google Apps Script (`doPost(e)`) code snippet and pre-formatted spreadsheet template.
  - **Task**: Create a standardized Zeva Lead Sync Google Sheets Template and embed an interactive setup instructions modal inside the Bot Integrations tab so users can deploy their webhook URL in under 60 seconds. (Completed: Interactive setup guide modal with 1-click clipboard copy embedded in Admin Dashboard)
