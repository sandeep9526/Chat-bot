"""
Real-time Lead Notifications Module

Sends instant notifications via Email (SMTP) and Outbound Webhook POST
whenever a hot or warm lead is captured.
"""

import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

import httpx

logger = logging.getLogger("zeva.notifications")


def send_email_alert(
    to_email: str,
    bot_name: str,
    lead_name: str,
    lead_email: str,
    lead_phone: str | None,
    message: str | None,
    score: str,
    summary: str,
) -> bool:
    """Send premium branded HTML email alert (via Resend REST API or fallback SMTP)."""
    if not to_email:
        return False

    sender_email = os.getenv("NOTIFICATION_SENDER_EMAIL", "notifications@zeva-ai.com")
    dashboard_url = os.getenv("NEXT_PUBLIC_APP_URL", "https://app.zeva.ai") + "/dashboard#leads"
    badge_color = "#ef4444" if score == "hot" else "#f59e0b"
    badge_bg = "#fef2f2" if score == "hot" else "#fffbeb"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding: 30px 15px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 25px 30px; color:#ffffff;">
                  <span style="font-size:20px; font-weight:800; letter-spacing:-0.5px;">ZEVA AI</span>
                  <p style="margin:5px 0 0 0; font-size:14px; opacity:0.9;">Instant Lead Handoff Notification</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 30px;">
                  <div style="display:flex; align-items:center; margin-bottom:20px;">
                    <h2 style="color:#0f172a; font-size:20px; font-weight:700; margin:0; display:inline-block;">
                      🔥 New Lead for <span style="color:#4f46e5;">{bot_name}</span>
                    </h2>
                    <span style="background-color:{badge_bg}; color:{badge_color}; border:1px solid {badge_color}; font-weight:700; padding:3px 10px; border-radius:20px; font-size:12px; text-transform:uppercase; margin-left:10px;">
                      {score}
                    </span>
                  </div>

                  <!-- AI Handoff Summary Callout -->
                  <div style="background-color:#eff6ff; border-left:4px solid #3b82f6; padding:16px; border-radius:0 8px 8px 0; margin-bottom:24px;">
                    <span style="font-size:11px; font-weight:700; color:#1d4ed8; text-transform:uppercase; letter-spacing:0.5px; display:block; margin-bottom:4px;">✨ AI Intelligence Summary</span>
                    <p style="margin:0; font-size:14px; color:#1e3a8a; line-height:1.5; font-weight:500;">{summary}</p>
                  </div>

                  <!-- Lead Info Cards -->
                  <table border="0" cellpadding="10" cellspacing="0" width="100%" style="background-color:#f8fafc; border:1px solid #f1f5f9; border-radius:8px; margin-bottom:24px;">
                    <tr>
                      <td width="30%" style="color:#64748b; font-size:13px; font-weight:600; border-bottom:1px solid #f1f5f9;">Name</td>
                      <td style="color:#0f172a; font-size:14px; font-weight:600; border-bottom:1px solid #f1f5f9;">{lead_name}</td>
                    </tr>
                    <tr>
                      <td style="color:#64748b; font-size:13px; font-weight:600; border-bottom:1px solid #f1f5f9;">Email</td>
                      <td style="color:#2563eb; font-size:14px; font-weight:500; border-bottom:1px solid #f1f5f9;"><a href="mailto:{lead_email}" style="color:#2563eb; text-decoration:none;">{lead_email}</a></td>
                    </tr>
                    <tr>
                      <td style="color:#64748b; font-size:13px; font-weight:600; border-bottom:1px solid #f1f5f9;">Phone</td>
                      <td style="color:#0f172a; font-size:14px; border-bottom:1px solid #f1f5f9;">{lead_phone or '—'}</td>
                    </tr>
                    <tr>
                      <td style="color:#64748b; font-size:13px; font-weight:600; vertical-align:top;">Message</td>
                      <td style="color:#334155; font-size:14px; line-height:1.4;">{message or '(No preliminary chat message)'}</td>
                    </tr>
                  </table>

                  <!-- Call to Action -->
                  <div style="text-align:center; margin-top:30px; margin-bottom:10px;">
                    <a href="{dashboard_url}" style="display:inline-block; background-color:#4f46e5; color:#ffffff; font-size:14px; font-weight:600; text-decoration:none; padding:12px 24px; border-radius:6px; box-shadow:0 2px 4px rgba(79,70,229,0.3);">
                      ⚡ View & Manage Lead in CRM
                    </a>
                  </div>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color:#f1f5f9; padding:15px 30px; text-align:center; color:#64748b; font-size:12px;">
                  This instant notification was delivered automatically by your <strong>Zeva AI Assistant</strong>.
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    subject = f"[{score.upper()} LEAD] {lead_name} via {bot_name}"

    # 1. Prefer HTTP REST API Delivery via Resend (Bypass SMTP timeouts & firewall restrictions)
    resend_api_key = os.getenv("RESEND_API_KEY")
    if not resend_api_key:
        logger.info(f"Skipping email alert for lead '{lead_name}' (RESEND_API_KEY not configured)")
        return False

    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {resend_api_key}", "Content-Type": "application/json"},
                json={
                    "from": os.getenv("RESEND_FROM", f"Zeva AI <{sender_email}>"),
                    "to": [to_email],
                    "subject": subject,
                    "html": html_content,
                },
            )
            resp.raise_for_status()
        logger.info(f"[Resend] REST API email alert delivered to {to_email} for lead '{lead_name}'")
        return True
    except Exception as e:
        logger.warning(f"[Resend] HTTP REST delivery failed ({e})")
        return False


def send_webhook_alert(
    webhook_url: str,
    bot_id: str,
    bot_name: str,
    lead_id: int,
    lead_name: str,
    lead_email: str,
    lead_phone: str | None,
    message: str | None,
    score: str,
    summary: str,
) -> bool:
    """POST JSON lead payload to external client CRM or Zapier webhook."""
    if not webhook_url:
        return False

    payload = {
        "event": "lead.created",
        "botId": bot_id,
        "botName": bot_name,
        "lead": {
            "id": lead_id,
            "name": lead_name,
            "email": lead_email,
            "phone": lead_phone,
            "message": message,
            "score": score,
            "summary": summary,
        },
    }

    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(webhook_url, json=payload)
            resp.raise_for_status()
        logger.info(f"Webhook alert posted successfully to {webhook_url}")
        return True
    except Exception as e:
        logger.error(f"Failed to post webhook alert to {webhook_url}: {e}")
        return False


def send_google_sheets_row(
    google_sheets_url: str,
    bot_id: str,
    bot_name: str,
    lead_id: int,
    name: str,
    email: str,
    phone: str | None,
    message: str | None,
    score: str,
    summary: str,
) -> bool:
    """Post structured lead row JSON to client's Google Apps Script Webhook or Google Sheets endpoint."""
    if not google_sheets_url:
        return False

    payload = {
        "event": "lead.created",
        "botId": bot_id,
        "botName": bot_name,
        "leadId": lead_id,
        "name": name,
        "email": email,
        "phone": phone or "",
        "message": message or "",
        "score": score,
        "summary": summary,
        "row": [lead_id, name, email, phone or "", score, message or "", summary],
    }

    try:
        with httpx.Client(timeout=8.0, follow_redirects=True) as client:
            resp = client.post(google_sheets_url, json=payload)
            resp.raise_for_status()
        logger.info(f"Google Sheets row posted successfully to {google_sheets_url}")
        return True
    except Exception as e:
        logger.error(f"Failed to post row to Google Sheets URL {google_sheets_url}: {e}")
        return False


def notify_lead_event(
    bot: dict | None,
    lead_id: int,
    name: str,
    email: str,
    phone: str | None,
    message: str | None,
    score: str,
    summary: str,
):
    """Trigger email, webhook, and Google Sheets notifications for leads."""
    if not bot:
        return

    bot_name = bot.get("name") or bot.get("bot_id") or "Zeva Bot"
    to_email = bot.get("notification_email")
    webhook_url = bot.get("webhook_url")
    google_sheets_url = bot.get("google_sheets_url")

    # Real-time Google Sheets sync (runs for all captured leads if configured)
    if google_sheets_url:
        send_google_sheets_row(
            google_sheets_url, bot.get("bot_id"), bot_name, lead_id, name, email, phone, message, score, summary
        )

    # Email & Webhook alerts run for Hot / Warm leads
    if score in ("hot", "warm"):
        if to_email:
            send_email_alert(to_email, bot_name, name, email, phone, message, score, summary)

        if webhook_url:
            send_webhook_alert(webhook_url, bot.get("bot_id"), bot_name, lead_id, name, email, phone, message, score, summary)


def send_quota_exceeded_alert(to_email: str | None, bot_id: str, bot_name: str, max_messages: int) -> bool:
    """Send automated quota exhaustion alert email to bot owner."""
    if not to_email:
        logger.info(f"No notification email set for bot {bot_id} (quota exceeded, alert skipped)")
        return False

    sender_email = os.getenv("NOTIFICATION_SENDER_EMAIL", "billing@zeva-ai.com")
    dashboard_url = os.getenv("NEXT_PUBLIC_APP_URL", "https://app.zeva.ai") + "/dashboard#subscription"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding: 30px 15px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 25px 30px; color:#ffffff;">
                  <span style="font-size:20px; font-weight:800; letter-spacing:-0.5px;">ZEVA AI</span>
                  <p style="margin:5px 0 0 0; font-size:14px; opacity:0.95;">⚠️ Usage Quota Limit Exceeded Notice</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 30px;">
                  <h2 style="color:#0f172a; font-size:20px; font-weight:700; margin-top:0; margin-bottom:12px;">
                    Monthly AI Message Cap Reached for <span style="color:#d97706;">{bot_name}</span>
                  </h2>
                  <p style="color:#475569; font-size:14px; line-height:1.6; margin-bottom:20px;">
                    Your AI chatbot <b>{bot_name}</b> (<code>{bot_id}</code>) has successfully served its monthly tier allowance of <b>{max_messages:,} interactions</b>.
                  </p>
                  <div style="background-color:#fffbeb; border:1px solid #fde68a; border-radius:8px; padding:16px; margin-bottom:24px;">
                    <p style="color:#92400e; font-size:13.5px; font-weight:600; margin:0;">
                      🚨 Active Status: Chatbot responses are temporarily paused for visitor inquiries until your monthly cycle resets or your billing subscription is upgraded.
                    </p>
                  </div>
                  <p style="color:#475569; font-size:14px; line-height:1.6; margin-bottom:25px;">
                    To restore instant AI responses immediately and avoid missing potential sales leads, please upgrade your plan to high-throughput tiers (Starter or Pro).
                  </p>
                  <table border="0" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="background-color:#2563eb; border-radius:8px; padding:13px 28px;">
                        <a href="{dashboard_url}" style="color:#ffffff; font-size:14px; font-weight:700; text-decoration:none; display:inline-block;">
                          Upgrade Subscription Now &rarr;
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="color:#94a3b8; font-size:12px; margin-top:35px; border-top:1px solid #f1f5f9; pt:20px;">
                    Zeva AI Intelligent Conversational Infrastructure &bull; Automatic System Notification
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    resend_api_key = os.getenv("RESEND_API_KEY")
    subject = f"⚠️ [Zeva Alert] Usage Quota Exceeded for {bot_name}"

    if resend_api_key:
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {resend_api_key}", "Content-Type": "application/json"},
                    json={"from": sender_email, "to": [to_email], "subject": subject, "html": html_content},
                )
                if resp.status_code in (200, 201):
                    logger.info(f"[Resend] Quota exceed email sent to {to_email} for bot {bot_id}")
                    return True
                logger.warning(f"[Resend] Quota exceed email failed: {resp.status_code} {resp.text}")
        except Exception as e:
            logger.error(f"[Resend] Error sending quota exceed email: {e}")

    # Fallback to SMTP
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", 587))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")

    if not smtp_host or not smtp_user or not smtp_pass:
        logger.warning(f"Neither Resend nor SMTP configured. Quota exceed email to {to_email} skipped.")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        logger.info(f"[SMTP] Quota exceed email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send Quota exceed SMTP alert to {to_email}: {e}")
        return False


def send_password_reset_email(to_email: str, reset_url: str) -> bool:
    """Send branded password reset email via Resend REST API or fallback SMTP."""
    if not to_email or not reset_url:
        return False

    sender_email = os.getenv("NOTIFICATION_SENDER_EMAIL", "security@zeva-ai.com")
    subject = "🔒 Reset Your Zeva Dashboard Password"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head><meta charset="UTF-8"></head>
    <body style="margin:0; padding:0; background-color:#f8fafc; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="padding: 30px 15px;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color:#ffffff; border-radius:12px; border:1px solid #e2e8f0; overflow:hidden; box-shadow:0 4px 6px -1px rgba(0,0,0,0.05);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 25px 30px; color:#ffffff;">
                  <span style="font-size:20px; font-weight:800; letter-spacing:-0.5px;">ZEVA AI</span>
                  <p style="margin:5px 0 0 0; font-size:14px; opacity:0.9;">Account Security & Recovery</p>
                </td>
              </tr>
              <!-- Body -->
              <tr>
                <td style="padding: 30px; color:#334155; font-size:15px; line-height:1.6;">
                  <h2 style="color:#0f172a; font-size:20px; font-weight:700; margin:0 0 15px 0;">
                    Password Reset Requested
                  </h2>
                  <p style="margin:0 0 20px 0;">
                    We received a request to reset the password for your Zeva account associated with <strong>{to_email}</strong>. Click the button below to set a new password:
                  </p>
                  <table border="0" cellpadding="0" cellspacing="0" style="margin: 25px 0;">
                    <tr>
                      <td align="center" style="background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); border-radius: 8px;">
                        <a href="{reset_url}" target="_blank" style="display:inline-block; padding:12px 28px; color:#ffffff; text-decoration:none; font-weight:600; font-size:15px;">
                          Reset Password
                        </a>
                      </td>
                    </tr>
                  </table>
                  <p style="margin:0 0 15px 0; font-size:13px; color:#64748b;">
                    Or copy and paste this direct link into your browser:<br>
                    <a href="{reset_url}" style="color:#3b82f6; word-break:break-all;">{reset_url}</a>
                  </p>
                  <p style="margin:20px 0 0 0; font-size:13px; color:#94a3b8; border-top:1px solid #f1f5f9; padding-top:20px;">
                    If you did not initiate this request, you may safely ignore this email. Your account credentials remain secure.
                  </p>
                </td>
              </tr>
              <!-- Footer -->
              <tr>
                <td style="background-color:#f1f5f9; padding: 15px 30px; text-align:center; font-size:12px; color:#64748b;">
                  Zeva AI Autonomous Intelligence • Automated Security Dispatch
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
    """

    # 1. Try Resend REST API first
    resend_api_key = os.getenv("RESEND_API_KEY")
    if resend_api_key:
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {resend_api_key}", "Content-Type": "application/json"},
                    json={
                        "from": os.getenv("RESEND_FROM", f"Zeva Security <{sender_email}>"),
                        "to": [to_email],
                        "subject": subject,
                        "html": html_content,
                    },
                )
                if resp.status_code in (200, 201):
                    logger.info(f"[Resend] Password reset email delivered to {to_email}")
                    return True
                logger.warning(f"[Resend] Password reset email failed: {resp.status_code} {resp.text}")
        except Exception as e:
            logger.error(f"[Resend] Error sending password reset email: {e}")

    # 2. Standard SMTP Delivery Fallback
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")

    if not smtp_host:
        logger.warning(f"Skipping password reset email to {to_email} (Neither RESEND_API_KEY nor SMTP_HOST configured)")
        return False

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = sender_email
        msg["To"] = to_email
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
            server.send_message(msg)
        logger.info(f"[SMTP] Password reset email sent successfully to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send password reset email via SMTP to {to_email}: {e}")
        return False



def send_generic_email(to_email: str, subject: str, html_body: str) -> bool:
    """Send a generic email using Resend REST API."""
    resend_api_key = os.getenv("RESEND_API_KEY")
    sender_email = os.getenv("NOTIFICATION_SENDER_EMAIL", "notifications@zeva-ai.com")
    
    if not resend_api_key:
        logger.warning(f"[notifications] RESEND_API_KEY not configured. Would have sent email to {to_email}")
        return False
        
    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {resend_api_key}", "Content-Type": "application/json"},
                json={
                    "from": f"Zeva AI <{sender_email}>",
                    "to": [to_email],
                    "subject": subject,
                    "html": html_body,
                },
            )
            resp.raise_for_status()
        logger.info(f"[notifications] Email sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"[notifications] Failed to send email via Resend HTTP: {e}")
        return False

def send_verification_email(to_email: str, verify_url: str) -> bool:
    subject = "Verify your email for Zeva AI"
    body = f"""
    <h2>Welcome to Zeva!</h2>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="{verify_url}">Verify Email</a>
    <p>Or paste this link in your browser: {verify_url}</p>
    """
    return send_generic_email(to_email, subject, body)

def send_magic_link_email(to_email: str, magic_url: str) -> bool:
    subject = "Sign in to Zeva AI"
    body = f"""
    <h2>Sign in to Zeva</h2>
    <p>Click the link below to sign in:</p>
    <a href="{magic_url}">Sign In</a>
    <p>Or paste this link in your browser: {magic_url}</p>
    """
    return send_generic_email(to_email, subject, body)
