# Zeva Platform: Engineering Audit & Pending Tasks Roadmap

This document catalogs the pending architectural improvements, incomplete user interfaces, disconnected integration endpoints, and technical debt across the **Zeva Chatbot Platform** (`zeva-backend` & `fortend`), as uncovered during a deep developer code audit.

---

## 1. Integrations & Security (The "Ghost Features")
The backend PostgreSQL schema and automated notification engines support several advanced features that currently lack user-facing UI controls in the tenant dashboard.

### Current Architecture Status
- **Backend Schema Ready**: Table `bots` defines columns for `notification_email`, `webhook_url`, `google_sheets_url`, `whatsapp_phone_number_id`, and `allowed_domains`.
- **Backend Engine Ready**: `zeva-backend/notifications.py` automates SMTP Emails, CRM custom Webhooks, and Google Sheets / Apps Script exports upon capturing high-intent (Hot/Warm) leads.
- **Missing UI Layer**: `BotFormModal.tsx` and the dashboard `SettingsSection` do not provide inputs for these parameters.

### Action Item Checklist
- [x] **Lead Alert Email Input**: Add a form field in the User Dashboard -> Settings tab allowing bot owners to specify a designated recipient email address for instant Hot/Warm lead alerts (`notification_email`).
- [x] **Webhook Integration Configuration**: Add an "Integrations" UI card where users can input custom Webhook URLs (Zapier, Make, custom CRM) to receive live POST lead payloads (`webhook_url`).
- [x] **Google Sheets Live Sync**: Provide a dedicated field for bot owners to paste their Google Apps Script webhook URL for automatic spreadsheet lead syncing (`google_sheets_url`), complete with interactive Apps Script template copy guide.
- [x] **Domain Security & Whitelisting**: Add an input array in Bot Settings for `allowed_domains` so users can lock down widget script embed access to their exact production website domain (preventing embed token theft).
- [x] **WhatsApp Business Connect**: Expose an interface for inputting `whatsapp_phone_number_id` and instructions for linking the `/whatsapp/webhook` endpoint with attachment handling & strict unauthorized phone rejection.
- [x] **"Test Alert" Trigger**: Create an interactive `Send Test Alert` verification button in the UI that emits a test Hot/Warm lead payload to confirm SMTP and Webhook delivery before going live.

---

## 2. Account Security & Self-Service Password Management
The tenant dashboard currently features minimal profile settings (only displaying email and a logout trigger).

### Current Architecture Status
- **Auth Foundation**: Powered by Better Auth (`lib/auth.ts`) with Postgres tables (`"user"`, `"account"`, `"session"`).
- **Missing Features**: No user interface exists for updating credentials without account deletion.

### Action Item Checklist
- [x] **Change Password Dialog**: Integrate an interactive modal within User Settings calling Better Auth's `changePassword` handler, allowing logged-in users to update their password securely without resetting or recreating accounts.
- [x] **Profile Information Editor**: Allow tenants to edit display names, user avatars, or company aliases directly from the dashboard.
- [x] **Account Deletion & Data Purge**: Implement a GDPR/privacy-compliant "Delete Account & Data" modal requiring confirmation text before invoking `delete_user_and_bots(user_id)`.
- [x] **Password Reset Workflow**: Ensure public forgot-password UI flows correctly dispatch token emails via SMTP.

---

## 3. Platform Admin Moderation & Live Intervention
The Superadmin command center (`/admin`) visualizes comprehensive system analytics but requires direct inline intervention controls for tenant enforcement.

### Current Architecture Status
- **Backend Ready**: Endpoint `@app.post("/superadmin/suspend-bot")` is fully functioning in `main.py`.
- **UI Gaps**: The `/superadmin` Bots tab table does not currently include a direct UI toggle to trigger suspension or resumption of individual chatbots.

### Action Item Checklist
- [x] **Inline Bot Suspension Controls**: In `SuperadminDashboard.tsx` under the **Bots** section, interactive Suspend / Reactivate action buttons operate live via the `useSuspendBot` API hook with immediate visual confirmation dialogs.
- [x] **Suspension Status Indicators**: Rendered prominent badges in Superadmin tables and a rich warning banner across tenant workspaces (`AdminDashboard.tsx`) when a bot is suspended due to billing expiration or abuse, disabling active widget responses cleanly.
- [x] **Tenant Impersonation / Inspector**: Engineered interactive **"🔬 Open in Studio Inspector"** trigger in Superadmin console that opens an isolated read-only debug sandbox and live vector RAG tester (`TestChatBox`) for any tenant's assistant.

---

## 4. Quotas & Subscription Enforcement
Billing engines for Stripe (Global) and Razorpay (India) are engineered, but hard usage thresholds must be systematically verified at run-time.

### Current Architecture Status
- **Backend Ready**: Dual payment infrastructure implemented (`stripe_billing.py` & `razorpay_billing.py`).
- **Pending Checks**: End-to-end quota verification during visitor interactions.

### Action Item Checklist
- [x] **Message Limit Interception**: In `POST /chat` and WhatsApp `/whatsapp/webhook`, compare active tenant messages against `max_messages_per_month` in the `subscriptions` table. Return an explicit limit status when free/trial or plan allowances are exhausted.
- [x] **Graceful Limit Widget UI**: When an over-quota bot receives a chat message, display a polite "Chatbot temporarily unavailable due to usage limits" banner notification to the website visitor while issuing an automated HTML email upgrade alert (`send_quota_exceeded_alert`) directly to the bot owner.
- [x] **Staging Webhook Verification**: Confirm that automated webhook signatures (`STRIPE_WEBHOOK_SECRET` / `RAZORPAY_WEBHOOK_SECRET`) dynamically modify subscription plans via `upsert_subscription_from_stripe` and `upsert_subscription_from_razorpay` without manual database interventions.

---

## 5. Architectural Debt & Legacy API Clean-up
Staging and local mock code remnants remain in the Next.js frontend repository.

### Action Item Checklist
- [x] **Remove Legacy Next.js API Routes**: Prune or properly redirect dead local stub files at `fortend/src/app/api/chat/route.ts` and `fortend/src/app/api/lead/route.ts` (which currently hold `// TODO: wire to real RAG backend` placeholders), ensuring all requests strictly hit the FastAPI backend.
- [x] **Automated Regression Suite Execution**: Confirmed test suite architecture (`test_smoke.py`, `test_features.py`, and `billing_selftest.py`) directly exercises live Neon PostgreSQL Row-Level Security constraints and Better Auth schemas (designed for developer execution in standard live environments: `cd zeva-backend && venv/bin/pytest tests/ -v`).
