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

logger = logging.getLogger("ochreshift.notifications")


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

    sender_email = os.getenv("NOTIFICATION_SENDER_EMAIL", "notifications@ochreshift.com")
    dashboard_url = os.getenv("NEXT_PUBLIC_APP_URL", "https://app.ochreshift.com") + "/dashboard#leads"
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
                  <span style="font-size:20px; font-weight:800; letter-spacing:-0.5px;">OCHRESHIFT AI</span>
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
                  This instant notification was delivered automatically by your <strong>Ochreshift AI Assistant</strong>.
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
                    "from": os.getenv("RESEND_FROM", f"Ochreshift AI <{sender_email}>"),
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
    custom_data: dict | None = None,
    form_schema: list[dict] | None = None,
) -> bool:
    """Post structured lead row JSON to client's Google Apps Script Webhook or Google Sheets endpoint."""
    if not google_sheets_url:
        return False

    row_fields = []
    if form_schema and isinstance(form_schema, list) and len(form_schema) > 0:
        c_data = custom_data or {}
        for f in form_schema:
            fid = f.get("id", "")
            flabel = f.get("label", "")
            if fid == "name" or "name" in flabel.lower():
                row_fields.append(name)
            elif fid == "email" or "email" in flabel.lower() or f.get("type") == "email":
                row_fields.append(email)
            elif fid == "phone" or "phone" in flabel.lower() or f.get("type") == "tel":
                row_fields.append(phone or "")
            elif fid == "message" or "message" in flabel.lower() or "help" in flabel.lower() or f.get("type") == "textarea":
                row_fields.append(message or "")
            else:
                row_fields.append(c_data.get(flabel) or c_data.get(fid) or "")
        payload_row = [lead_id, *row_fields, score, summary]
    else:
        payload_row = [lead_id, name, email, phone or "", score, message or "", summary]

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
        "customData": custom_data or {},
        "row": payload_row,
    }

    try:
        headers = {
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Accept": "application/json, text/plain, */*",
        }
        with httpx.Client(timeout=12.0, follow_redirects=True) as client:
            resp = client.post(google_sheets_url, json=payload, headers=headers)
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
    custom_data: dict | None = None,
):
    """Trigger email, webhook, and Google Sheets notifications for leads."""
    if not bot:
        return

    bot_name = bot.get("name") or bot.get("bot_id") or "Ochreshift Bot"
    to_email = bot.get("notification_email")
    webhook_url = bot.get("webhook_url")
    google_sheets_url = bot.get("google_sheets_url")
    design = bot.get("design") or {}
    form_schema = design.get("form_schema") or bot.get("form_schema") or []

    # Real-time Google Sheets sync (runs for all captured leads if configured)
    if google_sheets_url:
        send_google_sheets_row(
            google_sheets_url, bot.get("bot_id"), bot_name, lead_id, name, email, phone, message, score, summary,
            custom_data=custom_data,
            form_schema=form_schema,
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

    sender_email = os.getenv("NOTIFICATION_SENDER_EMAIL", "billing@ochreshift.com")
    dashboard_url = os.getenv("NEXT_PUBLIC_APP_URL", "https://app.ochreshift.com") + "/dashboard#subscription"

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
                  <span style="font-size:20px; font-weight:800; letter-spacing:-0.5px;">OCHRESHIFT AI</span>
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
                    Ochreshift AI Intelligent Conversational Infrastructure &bull; Automatic System Notification
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
    subject = f"⚠️ [Ochreshift Alert] Usage Quota Exceeded for {bot_name}"

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

    sender_email = os.getenv("NOTIFICATION_SENDER_EMAIL", "security@ochreshift.com")
    subject = "🔒 Reset Your Ochreshift Dashboard Password"

    html_template = """
    <!DOCTYPE html>
      <html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="x-apple-disable-message-reformatting">
        <meta name="format-detection" content="telephone=no,address=no,email=no,date=no,url=no">
        <title>Password Reset – Ochreshift AI</title>
        <!--[if mso]>
        <noscript>
          <xml>
            <o:OfficeDocumentSettings>
              <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
          </xml>
        </noscript>
        <![endif]-->
        <style>
          body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
          table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
          img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
          body { margin: 0 !important; padding: 0 !important; width: 100% !important; height: 100% !important; }
          a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }

          @media only screen and (max-width: 620px) {
            .email-container { width: 100% !important; }
            .stack-column { display: block !important; width: 100% !important; max-width: 100% !important; }
            .center-on-narrow { text-align: center !important; display: block !important; margin-left: auto !important; margin-right: auto !important; float: none !important; }
            .padding-mobile { padding-left: 22px !important; padding-right: 22px !important; }
            .hero-pad { padding: 32px 22px 24px 22px !important; }
            .cta-btn { padding: 16px 28px !important; }
          }
        </style>
      </head>
      <body style="margin:0; padding:0; background-color:#f1f5f9; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">

        <!-- Preheader -->
        <div style="display:none; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden; mso-hide:all;">
          Your secure password reset link is ready — expires in 60 minutes. One click and you're back in.
        </div>

        <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="background-color:#f1f5f9;">
          <tr>
            <td style="padding: 36px 16px;" align="center">

              <!-- Main Card -->
              <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="600" class="email-container" style="max-width:600px; background-color:#ffffff; border-radius:20px; overflow:hidden; box-shadow:0 8px 32px rgba(26,32,44,0.10); border:1px solid #e2e8f0;">

                <!-- ========== HEADER ========== -->
                <tr>
                  <td style="background-color:#1A202C; padding:0; position:relative;">
                    <!-- Decorative top gradient strip -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="height:5px; background:linear-gradient(90deg, #F5A623 0%, #f7b84b 40%, #F5A623 100%); font-size:0; line-height:0;">&nbsp;</td>
                      </tr>
                    </table>

                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td class="padding-mobile" style="padding:28px 40px 24px 40px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="vertical-align:middle;">
                                <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                                  <tr>
                                    <td style="vertical-align:middle; padding-right:12px;">
                                      <svg xmlns="http://www.w3.org/2000/svg" width="34" height="38" viewBox="0 0 90 100" style="display:block;">
                                        <path d="M45 0 L0 25 L0 75 L45 100 L45 72 L22 58 L22 42 L45 28 Z" fill="#F5A623"/>
                                        <path d="M45 0 L90 25 L90 75 L45 100 L45 72 L68 58 L68 42 L45 28 Z" fill="#FFFFFF"/>
                                      </svg>
                                    </td>
                                    <td style="vertical-align:middle;">
                                      <span style="font-size:21px; font-weight:700; letter-spacing:-0.7px; font-family:Arial, Helvetica, sans-serif;">
                                        <span style="color:#F5A623;">ochre</span><span style="color:#FFFFFF;">shift</span>
                                      </span>
                                    </td>
                                  </tr>
                                </table>
                              </td>
                              <td style="text-align:right; vertical-align:middle;">
                                <span style="display:inline-block; background-color:rgba(245,166,35,0.15); border:1px solid rgba(245,166,35,0.35); color:#F5A623; font-size:11px; font-weight:600; letter-spacing:0.6px; text-transform:uppercase; padding:5px 12px; border-radius:20px;">
                                  Secure Link
                                </span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- ========== HERO ILLUSTRATION ========== -->
                <tr>
                  <td class="hero-pad" style="padding:36px 40px 12px 40px; text-align:center; background:linear-gradient(180deg, #ffffff 0%, #fafbfc 100%);">
                    
                    <!-- Creative Lock + Brand Geometry -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 20px auto;">
                      <tr>
                        <td style="width:88px; height:88px; background:linear-gradient(145deg, #1A202C 0%, #2d3748 100%); border-radius:24px; text-align:center; vertical-align:middle; box-shadow:0 8px 24px rgba(26,32,44,0.18);">
                          <!-- Lock icon built with SVG for crispness -->
                          <svg xmlns="http://www.w3.org/2000/svg" width="42" height="42" viewBox="0 0 24 24" fill="none" style="display:inline-block; vertical-align:middle; margin-top:4px;">
                            <rect x="5" y="11" width="14" height="10" rx="2" fill="#F5A623"/>
                            <path d="M8 11V8a4 4 0 0 1 8 0v3" stroke="#F5A623" stroke-width="2.2" stroke-linecap="round"/>
                            <circle cx="12" cy="16" r="1.6" fill="#1A202C"/>
                          </svg>
                        </td>
                      </tr>
                    </table>

                    <h1 style="margin:0 0 10px 0; font-size:26px; font-weight:700; color:#0f172a; letter-spacing:-0.5px; line-height:1.25;">
                      Let's get you back in
                    </h1>
                    
                    <p style="margin:0 auto 8px auto; max-width:380px; font-size:15px; color:#64748b; line-height:1.55;">
                      Someone (hopefully you) requested a password reset for your Ochreshift account.
                    </p>
                  </td>
                </tr>

                <!-- ========== BODY ========== -->
                <tr>
                  <td class="padding-mobile" style="padding:8px 40px 36px 40px; color:#334155; font-size:15px; line-height:1.65;">

                    <!-- Email chip -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px;">
                      <tr>
                        <td style="background-color:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:14px 18px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="width:28px; vertical-align:middle;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" style="display:block;">
                                  <rect x="3" y="5" width="18" height="14" rx="2" stroke="#94a3b8" stroke-width="1.8"/>
                                  <path d="M3 7l9 6 9-6" stroke="#94a3b8" stroke-width="1.8" stroke-linecap="round"/>
                                </svg>
                              </td>
                              <td style="vertical-align:middle; padding-left:10px;">
                                <span style="font-size:12px; color:#94a3b8; display:block; margin-bottom:2px;">Account</span>
                                <span style="font-size:15px; font-weight:600; color:#1A202C; word-break:break-all;">{{to_email}}</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Primary CTA -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:12px;">
                      <tr>
                        <td align="center">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0">
                            <tr>
                              <td class="cta-btn" style="border-radius:12px; background:linear-gradient(135deg, #F5A623 0%, #e69112 100%); box-shadow:0 4px 14px rgba(245,166,35,0.35);">
                                <a href="{{reset_url}}" target="_blank" style="display:inline-block; padding:16px 40px; font-size:16px; font-weight:700; color:#1A202C; text-decoration:none; border-radius:12px; letter-spacing:-0.2px;">
                                  Reset My Password
                                </a>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 28px 0; text-align:center; font-size:13px; color:#94a3b8;">
                      This secure link expires in <strong style="color:#64748b;">60 minutes</strong>
                    </p>

                    <!-- Fallback link -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:32px;">
                      <tr>
                        <td style="background-color:#fafbfc; border-radius:10px; padding:14px 16px; border:1px dashed #e2e8f0;">
                          <p style="margin:0 0 6px 0; font-size:12px; color:#94a3b8; font-weight:500;">
                            Button not working? Paste this link:
                          </p>
                          <a href="{{reset_url}}" style="font-size:12px; color:#F5A623; text-decoration:underline; word-break:break-all; line-height:1.4;">{{reset_url}}</a>
                        </td>
                      </tr>
                    </table>

                    <!-- ========== STEPS / TRUST SECTION ========== -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%" style="margin-bottom:28px;">
                      <tr>
                        <td style="padding-bottom:14px;">
                          <p style="margin:0; font-size:13px; font-weight:600; color:#1A202C; letter-spacing:0.2px; text-transform:uppercase;">
                            What happens next
                          </p>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <!-- Step 1 -->
                            <tr>
                              <td style="padding:10px 0; vertical-align:top; width:36px;">
                                <div style="width:26px; height:26px; background-color:#F5A623; border-radius:50%; text-align:center; line-height:26px; font-size:12px; font-weight:700; color:#1A202C;">1</div>
                              </td>
                              <td style="padding:10px 0 10px 8px; vertical-align:middle;">
                                <span style="font-size:14px; color:#475569;">Click the button above to open a secure page</span>
                              </td>
                            </tr>
                            <!-- Step 2 -->
                            <tr>
                              <td style="padding:10px 0; vertical-align:top; width:36px;">
                                <div style="width:26px; height:26px; background-color:#1A202C; border-radius:50%; text-align:center; line-height:26px; font-size:12px; font-weight:700; color:#FFFFFF;">2</div>
                              </td>
                              <td style="padding:10px 0 10px 8px; vertical-align:middle;">
                                <span style="font-size:14px; color:#475569;">Create a strong new password</span>
                              </td>
                            </tr>
                            <!-- Step 3 -->
                            <tr>
                              <td style="padding:10px 0; vertical-align:top; width:36px;">
                                <div style="width:26px; height:26px; background-color:#e2e8f0; border-radius:50%; text-align:center; line-height:26px; font-size:12px; font-weight:700; color:#64748b;">3</div>
                              </td>
                              <td style="padding:10px 0 10px 8px; vertical-align:middle;">
                                <span style="font-size:14px; color:#475569;">You're back in — ready to create again</span>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                    <!-- Security Notice -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                      <tr>
                        <td style="background:linear-gradient(135deg, #fefce8 0%, #fef9c3 100%); border:1px solid #fde68a; border-radius:12px; padding:16px 18px;">
                          <table role="presentation" cellspacing="0" cellpadding="0" border="0" width="100%">
                            <tr>
                              <td style="width:28px; vertical-align:top; padding-top:2px;">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
                                  <path d="M12 2L4 6v6c0 5.5 3.4 10.7 8 12 4.6-1.3 8-6.5 8-12V6l-8-4z" fill="#F5A623" opacity="0.9"/>
                                  <path d="M9 12l2 2 4-4" stroke="#1A202C" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>
                              </td>
                              <td style="padding-left:12px; vertical-align:top;">
                                <p style="margin:0 0 4px 0; font-size:13px; font-weight:700; color:#713f12;">
                                  Didn't request this?
                                </p>
                                <p style="margin:0; font-size:13px; color:#854d0e; line-height:1.45;">
                                  No action needed. Your current password stays active and your account remains fully protected.
                                </p>
                              </td>
                            </tr>
                          </table>
                        </td>
                      </tr>
                    </table>

                  </td>
                </tr>

                <!-- ========== DIVIDER ========== -->
                <tr>
                  <td style="padding:0 40px;">
                    <div style="height:1px; background:linear-gradient(90deg, transparent, #e2e8f0, transparent); font-size:0; line-height:0;">&nbsp;</div>
                  </td>
                </tr>

                <!-- ========== FOOTER ========== -->
                <tr>
                  <td style="padding:28px 40px 32px 40px; text-align:center; background-color:#fafbfc;">
                    
                    <!-- Mini logo -->
                    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto 14px auto;">
                      <tr>
                        <td style="vertical-align:middle; padding-right:8px;">
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="20" viewBox="0 0 90 100" style="display:block;">
                            <path d="M45 0 L0 25 L0 75 L45 100 L45 72 L22 58 L22 42 L45 28 Z" fill="#F5A623"/>
                            <path d="M45 0 L90 25 L90 75 L45 100 L45 72 L68 58 L68 42 L45 28 Z" fill="#1A202C"/>
                          </svg>
                        </td>
                        <td style="vertical-align:middle;">
                          <span style="font-size:14px; font-weight:700; letter-spacing:-0.4px;">
                            <span style="color:#F5A623;">ochre</span><span style="color:#1A202C;">shift</span>
                          </span>
                        </td>
                      </tr>
                    </table>

                    <p style="margin:0 0 6px 0; font-size:12px; color:#64748b; line-height:1.5;">
                      Autonomous Intelligence · Built for creators who ship
                    </p>
                    <p style="margin:0 0 16px 0; font-size:11px; color:#94a3b8;">
                      This is an automated security message. Please do not reply.
                    </p>

                    <!-- Tiny trust line -->
                    <p style="margin:0; font-size:11px; color:#cbd5e1;">
                      © 2026 Ochreshift AI · All systems secured
                    </p>
                  </td>
                </tr>

              </table>
              <!-- End Card -->

            </td>
          </tr>
        </table>
      </body>
      </html>
    """
    html_content = html_template.replace("{{to_email}}", to_email).replace("{{reset_url}}", reset_url)

    # 1. Try Resend REST API first
    resend_api_key = os.getenv("RESEND_API_KEY")
    if resend_api_key:
        try:
            with httpx.Client(timeout=10.0) as client:
                resp = client.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {resend_api_key}", "Content-Type": "application/json"},
                    json={
                        "from": os.getenv("RESEND_FROM", f"Ochreshift Security <{sender_email}>"),
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
    sender_email = os.getenv("NOTIFICATION_SENDER_EMAIL", "notifications@ochreshift.com")
    
    if not resend_api_key:
        logger.warning(f"[notifications] RESEND_API_KEY not configured. Would have sent email to {to_email}")
        return False
        
    try:
        with httpx.Client(timeout=8.0) as client:
            resp = client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {resend_api_key}", "Content-Type": "application/json"},
                json={
                    "from": f"Ochreshift AI <{sender_email}>",
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
    subject = "Verify your email for Ochreshift AI"
    body = f"""
    <h2>Welcome to Ochreshift!</h2>
    <p>Please verify your email address by clicking the link below:</p>
    <a href="{verify_url}">Verify Email</a>
    <p>Or paste this link in your browser: {verify_url}</p>
    """
    return send_generic_email(to_email, subject, body)

def send_magic_link_email(to_email: str, magic_url: str) -> bool:
    subject = "Sign in to Ochreshift AI"
    body = f"""
    <h2>Sign in to Ochreshift</h2>
    <p>Click the link below to sign in:</p>
    <a href="{magic_url}">Sign In</a>
    <p>Or paste this link in your browser: {magic_url}</p>
    """
    return send_generic_email(to_email, subject, body)
