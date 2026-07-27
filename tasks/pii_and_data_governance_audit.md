# Zeva Platform: PII, Data Governance & Compliance Audit

This document sets forth the comprehensive **PII (Personally Identifiable Information), Data Management, and Privacy Policy Audit** for the Zeva Platform (`zeva-backend` & `fortend`). It catalogs critical compliance gaps against global standards (GDPR, CCPA, HIPAA, and DPDPA) and outlines exact codebase engineering changes required to enforce rigorous data governance.

---

## 1. [CRITICAL] Unredacted PII Leakage in Application & Server Logs
**Location**: `zeva-backend/main.py` ([L1121](file:///Users/sandeepsharma/Manisha-Folder/chat-bot-zeva-project%202/zeva-backend/main.py#L1121), [L1210](file:///Users/sandeepsharma/Manisha-Folder/chat-bot-zeva-project%202/zeva-backend/main.py#L1210)) and stdout stream monitors.  
**Vulnerability Type**: Plaintext PII Exposure via Operational Logging

### Description & Compliance Hazard
During chat interactions and webhook invocations, the application explicitly prints raw customer message segments directly into system standard output logs:
```python
print(f"[chat] bot={req.botId} msg='{req.message[:50]}' → {len(hits)} raw hits")
```
* **Regulatory Hazard**: When visitors type sensitive PII (credit card digits, social security numbers, banking details, passwords, or personal health descriptions), unmasked sensitive data is permanently committed to standard stdout logs, Cloudwatch, Sentry, and logging aggregation pipelines. This violates strict PCI-DSS, HIPAA, and GDPR logging containment controls.

### Codebase Remediation Checklist
- [x] **Create Dedicated PII Scrubbing Logger (`logger.py`)**: Replace raw `print()` statements with a centralized application logging helper that automatically intercepts and applies Regex pattern redactors for credit cards, SSNs, and phone numbers:
  ```python
  import re, logging

  def scrub_pii(text: str) -> str:
      text = re.sub(r"\b\d{4}[ -]?\d{4}[ -]?\d{4}[ -]?\d{4}\b", "[REDACTED_CARD]", text)
      text = re.sub(r"\b\d{3}[ -]?\d{2}[ -]?\d{4}\b", "[REDACTED_SSN]", text)
      return text
  ```
- [x] **Sanitize Visitor Strings in Console Out**: Wrap all printed `req.message` and `user_message` occurrences inside `scrub_pii(req.message)`.

---

## 2. [HIGH] Unencrypted PII inside PostgreSQL Storage
**Location**: `zeva-backend/schema.sql` -> Tables `leads`, `chats`, `handoffs`  
**Vulnerability Type**: Plaintext At-Rest Sensitive Data Storage

### Description & Compliance Hazard
Customer contact details (`name`, `email`, `phone`, `notes` in `leads`) and complete visitor conversation transcripts (`user_message` in `chats`) are saved into database tables as raw, unencrypted text strings.
* **Regulatory Hazard**: In specialized vertical deployments (such as medical spas, real estate finance, or healthcare clinics), capturing patient symptom notes or financial preferences in plaintext columns violates SOC 2, HIPAA, and DPDPA storage mandates. If a database read-replica or SQL backup snapshot is inappropriately accessed, customer identities are fully exposed.

### Codebase Remediation Checklist
- [x] **Application-Layer Field Encryption**: Integrate Python `cryptography.fernet` symmetric field encryption utilizing a protected environment variable (`PII_ENCRYPTION_KEY`) when inserting or updating sensitive database attributes (`email`, `phone`, `notes`):
  ```python
  from cryptography.fernet import Fernet
  cipher = Fernet(os.getenv("PII_ENCRYPTION_KEY"))
  encrypted_phone = cipher.encrypt(lead_phone.encode()).decode()
  ```
- [x] **Role-Based Data Masking for Support**: Ensure platform superadmin debug views automatically apply pseudonymized masking (e.g., `s*******@gmail.com` and `+1-555-****-0199`) unless explicit tenant decrytion authorization is verified.

---

## 3. [HIGH] Unfiltered PII Transmission to Third-Party LLM Vendors
**Location**: `zeva-backend/main.py` -> `call_llm()` ([L1171](file:///Users/sandeepsharma/Manisha-Folder/chat-bot-zeva-project%202/zeva-backend/main.py#L1171))  
**Vulnerability Type**: Third-Party Data Dispersal & Unconsented Transmission

### Description & Compliance Hazard
Every incoming user conversation prompt and document fragment is transmitted over external HTTP POST calls directly to commercial inference providers (OpenRouter, OpenAI, Meta Cloud engines).
* **Regulatory Hazard**: Streaming unfiltered customer inquiries containing credit cards, bank account numbers, or patient records directly to third-party LLM cloud infrastructure breaches zero-retention Enterprise Data Sovereignty boundaries.

### Codebase Remediation Checklist
- [x] **Pre-Inference Redaction Pipeline**: Implement an automated pre-processing filter (utilizing Microsoft Presidio or lightweight token redactors) that strips sensitive numeric sequences and financial tokens prior to constructing outbound OpenRouter HTTP payloads.

---

## 4. [MEDIUM] Infinite Data Retention & Absence of Automated TTL Purging
**Location**: Database Layer (`db.py` & `schema.sql`)  
**Vulnerability Type**: Non-Compliance with Data Minimization & Storage Limitation Rules

### Description & Compliance Hazard
Captured conversation logs (`chats`) and contact submissions (`leads`, `handoffs`) are retained permanently inside database volumes without Time-To-Live (TTL) expiration schedules.
* **Regulatory Hazard**: Under GDPR Article 5(1)(e) (Storage Limitation) and CCPA privacy standards, enterprises cannot store visitor logs indefinitely without explicit business justification and systematic expiration pruning.

### Codebase Remediation Checklist
- [x] **Tenant Retention Configuration**: Expand the `bots` table in `schema.sql` by appending an adjustable `retention_days INT DEFAULT 90` setting controllable via the Studio dashboard.
- [x] **Automated Cron Pruning Engine**: Implement a background scheduled cleanup worker (or `pg_cron` automated database function) that executes daily pruning routines across historical tables:
  ```sql
  DELETE FROM chats WHERE bot_id = %s AND created_at < NOW() - INTERVAL '1 day' * %s;
  DELETE FROM handoffs WHERE bot_id = %s AND created_at < NOW() - INTERVAL '1 day' * %s;
  ```

---

## 5. [MEDIUM] Comprehensive Subject Erasure (GDPR "Right to be Forgotten")
**Location**: `zeva-backend/main.py` -> `@app.delete("/leads/{lead_id}")` ([L461](file:///Users/sandeepsharma/Manisha-Folder/chat-bot-zeva-project%202/zeva-backend/main.py#L461))  
**Vulnerability Type**: Incomplete Subject Access Request (SAR) & Erasure Infrastructure

### Description & Compliance Hazard
While operators can manually delete a single lead row by ID, there is no unified mechanism to execute comprehensive Subject Erasure Requests or generate automated GDPR Data Portability export packages.
* **Regulatory Hazard**: When a consumer exercises their legal "Right to be Forgotten" (GDPR Article 17), administrators lack an interface to purge all occurrences of a specific individual's email address or phone number simultaneously across every database table, log file, and embedded document archive.

### Codebase Remediation Checklist
- [x] **Unified Subject Erasure Endpoint**: Create `@app.post("/api/privacy/erasure-request")` requiring tenant authentication and target identifiers (email/phone), triggering universal cascading deletes across `leads`, `chats`, and `handoffs`:
  ```python
  @app.post("/api/privacy/erasure-request")
  def execute_subject_erasure(req: ErasureRequest, user: CurrentUser):
      db.purge_subject_across_tables(req.target_email, user["id"])
      return {"ok": True, "status": "All subject records purged cleanly."}
  ```
- [x] **1-Click Tenant Data Portability Export**: Provide a dedicated **"Export Account & Customer Data"** JSON bundle download button inside User Account Security settings.

---

## 6. [MEDIUM] Cookie Notice & Telemetry Consent Gate in Widget
**Location**: `fortend/public/widget.js` & Studio Configuration  
**Vulnerability Type**: Unnotified Data Processing & AI Interaction Without Consent

### Description & Compliance Hazard
The embeddable JavaScript chat widget launches immediately upon user visitor entry without presenting an actionable Data Processing Consent disclaimer or terms of service notification.
* **Regulatory Hazard**: Gathering analytical usage profiles, executing AI processing, and harvesting lead metrics in regulated jurisdictions (EU/California) without prior notice or affirmative opt-in confirmation exposes deployments to regulatory penalties.

### Codebase Remediation Checklist
- [x] **Studio Consent Switch**: Integrate a `data-consent-notice="on"` switch in `widget.js` and Studio customizations.
- [x] **Interactive Disclaimer UI**: When active, render a discreet agreement screen within the widget interface (*"This automated assistant utilizes Zeva AI processing. By continuing, you consent to our data terms and analytics storage."*) before unfreezing chat input controls.
