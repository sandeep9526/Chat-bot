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
- [ ] **Lead Alert Email Input**: Add a form field in the User Dashboard -> Settings tab allowing bot owners to specify a designated recipient email address for instant Hot/Warm lead alerts (`notification_email`).
- [ ] **Webhook Integration Configuration**: Add an "Integrations" UI card where users can input custom Webhook URLs (Zapier, Make, custom CRM) to receive live POST lead payloads (`webhook_url`).
- [ ] **Google Sheets Live Sync**: Provide a dedicated field for bot owners to paste their Google Apps Script webhook URL for automatic spreadsheet lead syncing (`google_sheets_url`).
- [ ] **Domain Security & Whitelisting**: Add an input array in Bot Settings for `allowed_domains` so users can lock down widget script embed access to their exact production website domain (preventing embed token theft).
- [ ] **WhatsApp Business Connect**: Expose an interface for inputting `whatsapp_phone_number_id` and instructions for linking the `/whatsapp/webhook` endpoint.
- [ ] **"Test Alert" Trigger**: Create an interactive `Send Test Alert` verification button in the UI that emits a test Hot/Warm lead payload to confirm SMTP and Webhook delivery before going live.

---

## 2. Account Security & Self-Service Password Management
The tenant dashboard currently features minimal profile settings (only displaying email and a logout trigger).

### Current Architecture Status
- **Auth Foundation**: Powered by Better Auth (`lib/auth.ts`) with Postgres tables (`"user"`, `"account"`, `"session"`).
- **Missing Features**: No user interface exists for updating credentials without account deletion.

### Action Item Checklist
- [ ] **Change Password Dialog**: Integrate an interactive modal within User Settings calling Better Auth's `changePassword` handler, allowing logged-in users to update their password securely without resetting or recreating accounts.
- [ ] **Profile Information Editor**: Allow tenants to edit display names, user avatars, or company aliases directly from the dashboard.
- [ ] **Account Deletion & Data Purge**: Implement a GDPR/privacy-compliant "Delete Account & Data" modal requiring confirmation text before invoking `delete_user_and_bots(user_id)`.
- [ ] **Password Reset Workflow**: Ensure public forgot-password UI flows correctly dispatch token emails via SMTP.

---

## 3. Platform Admin Moderation & Live Intervention
The Superadmin command center (`/admin`) visualizes comprehensive system analytics but requires direct inline intervention controls for tenant enforcement.

### Current Architecture Status
- **Backend Ready**: Endpoint `@app.post("/superadmin/suspend-bot")` is fully functioning in `main.py`.
- **UI Gaps**: The `/superadmin` Bots tab table does not currently include a direct UI toggle to trigger suspension or resumption of individual chatbots.

### Action Item Checklist
- [ ] **Inline Bot Suspension Controls**: In `SuperadminDashboard.tsx` under the **Bots** section, add an action toggle icon (Suspend / Activate) calling the `useSuspendBot` API hook.
- [ ] **Suspension Status Indicators**: Render prominent badges in both Superadmin and tenant panels when a bot is suspended due to billing expiration or abuse, disabling active widget responses cleanly.
- [ ] **Tenant Impersonation / Inspector**: Allow platform admins to click "Open in Studio" on any tenant's bot from the Superadmin UI in read-only debug mode.

---

## 4. Quotas & Subscription Enforcement
Billing engines for Stripe (Global) and Razorpay (India) are engineered, but hard usage thresholds must be systematically verified at run-time.

### Current Architecture Status
- **Backend Ready**: Dual payment infrastructure implemented (`stripe_billing.py` & `razorpay_billing.py`).
- **Pending Checks**: End-to-end quota verification during visitor interactions.

### Action Item Checklist
- [ ] **Message Limit Interception**: In `POST /chat`, compare active tenant messages against `max_messages_per_month` in the `subscriptions` table. Return an explicit error code when free/trial allowances are exhausted.
- [ ] **Graceful Limit Widget UI**: When an over-quota bot receives a chat message, display a polite "Chatbot temporarily unavailable due to usage limits" notification to the website visitor while issuing an email upgrade alert to the owner.
- [ ] **Staging Webhook Verification**: Confirm that automated webhook signatures (`STRIPE_WEBHOOK_SECRET` / `RAZORPAY_WEBHOOK_SECRET`) dynamically modify subscription plans without manual database interventions.

---

## 5. Architectural Debt & Legacy API Clean-up
Staging and local mock code remnants remain in the Next.js frontend repository.

### Action Item Checklist
- [ ] **Remove Legacy Next.js API Routes**: Prune or properly redirect dead local stub files at `fortend/src/app/api/chat/route.ts` and `fortend/src/app/api/lead/route.ts` (which currently hold `// TODO: wire to real RAG backend` placeholders), ensuring all requests strictly hit the FastAPI backend.
- [ ] **Automated Regression Suite Execution**: Re-verify all pytest suites (`test_smoke.py` and `test_features.py`), ensuring Row-Level Security (RLS) constraints and Better Auth `"createdAt"` / `created_at` schemas operate with 100% test pass rates.
