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
    """Send formatted HTML email alert to bot owner for Hot/Warm leads."""
    smtp_host = os.getenv("SMTP_HOST")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER")
    smtp_pass = os.getenv("SMTP_PASSWORD")
    sender_email = os.getenv("NOTIFICATION_SENDER_EMAIL", smtp_user or "notifications@zeva.app")

    if not smtp_host or not to_email:
        logger.info(f"Skipping email alert for lead '{lead_name}' (SMTP_HOST or to_email not configured)")
        return False

    badge_color = "#ef4444" if score == "hot" else "#f59e0b"

    html_content = f"""
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;">
      <h2 style="color: #1e293b; margin-top: 0;">🔥 New <span style="background-color: {badge_color}; color: white; padding: 2px 8px; border-radius: 4px; font-size: 14px; text-transform: uppercase;">{score}</span> Lead for {bot_name}</h2>
      
      <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 15px 0;">
        <p style="margin: 5px 0; font-size: 15px;"><strong>Name:</strong> {lead_name}</p>
        <p style="margin: 5px 0; font-size: 15px;"><strong>Email:</strong> <a href="mailto:{lead_email}">{lead_email}</a></p>
        <p style="margin: 5px 0; font-size: 15px;"><strong>Phone:</strong> {lead_phone or 'Not provided'}</p>
        <p style="margin: 5px 0; font-size: 15px;"><strong>Message:</strong> {message or '(No message)'}</p>
      </div>

      <div style="background-color: #e0e7ff; border-left: 4px solid #4f46e5; padding: 12px; margin: 15px 0;">
        <p style="margin: 0; font-size: 14px; color: #3730a3;"><strong>AI Handoff Summary:</strong> {summary}</p>
      </div>

      <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">Sent automatically by your Zeva AI Assistant.</p>
    </div>
    """

    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"[{score.upper()} LEAD] {lead_name} - {bot_name}"
    msg["From"] = sender_email
    msg["To"] = to_email
    msg.attach(MIMEText(html_content, "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port, timeout=10) as server:
            server.starttls()
            if smtp_user and smtp_pass:
                server.login(smtp_user, smtp_pass)
            server.sendmail(sender_email, [to_email], msg.as_string())
        logger.info(f"Email alert sent successfully to {to_email} for lead {lead_name}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email alert to {to_email}: {e}")
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

