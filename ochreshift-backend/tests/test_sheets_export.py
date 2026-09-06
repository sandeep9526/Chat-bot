"""
Tests for Google Sheets real-time sync and CSV export endpoint.
"""

from notifications import send_google_sheets_row


def test_send_google_sheets_row_dry_run():
    # Empty URL returns False
    res = send_google_sheets_row("", "acme-salon", "Acme Salon", 1, "Lead Name", "lead@example.com", "9876543210", "Need haircut", "hot", "Summary")
    assert res is False


def test_leads_export_auth_boundary(client):
    # Unauthenticated request returns 401
    res = client.get("/leads/export?botId=acme-salon")
    assert res.status_code == 401


def test_test_sheets_auth_boundary(client):
    # Unauthenticated request returns 401
    res = client.post("/admin/test-sheets", json={"botId": "acme-salon", "url": "https://script.google.com/macros/s/test/exec"})
    assert res.status_code == 401


def test_sync_sheets_history_auth_boundary(client):
    # Unauthenticated request returns 401
    res = client.post("/admin/sync-sheets-history", json={"botId": "acme-salon"})
    assert res.status_code == 401

