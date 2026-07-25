"""
Tests for WhatsApp Webhook verification, Templates API, and Notification handlers.
"""

from notifications import send_webhook_alert, notify_lead_event
from templates import get_template, TEMPLATES


def test_list_templates(client):
    res = client.get("/templates")
    assert res.status_code == 200
    body = res.json()
    assert "templates" in body
    assert "salon" in body["templates"]
    assert "clinic" in body["templates"]
    assert "realestate" in body["templates"]


def test_get_template_helper():
    salon_tmpl = get_template("salon")
    assert salon_tmpl["id"] == "salon"
    assert salon_tmpl["accent"] == "#ec4899"

    unknown_tmpl = get_template("nonexistent_category")
    assert unknown_tmpl["id"] == "general"


def test_whatsapp_webhook_verification(client):
    # Valid token verification handshake
    res = client.get("/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=zeva-secret-verify-123&hub.challenge=123456")
    assert res.status_code == 200
    assert res.text == "123456"

    # Invalid token verification handshake
    res_bad = client.get("/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=wrong-token&hub.challenge=123456")
    assert res_bad.status_code == 403


def test_notifications_dry_run():
    # Test webhook notification fallback without real URL
    res = send_webhook_alert("", "acme-salon", "Acme Salon", 1, "Lead Name", "lead@example.com", "9876543210", "Price?", "hot", "Summary")
    assert res is False

    # Test lead event notification trigger doesn't crash on unconfigured bot
    bot = {"bot_id": "demo", "name": "Demo Bot", "notification_email": None, "webhook_url": None}
    notify_lead_event(bot, 1, "Test Lead", "lead@example.com", None, None, "hot", "Summary")
