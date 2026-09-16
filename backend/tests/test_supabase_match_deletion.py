"""Regression tests — Supabase REST verification for the match-deletion bug fix.

Covers (review iteration 6):
- Seeded match fc0fca8c and its match_player_stats rows are gone after UI delete (cascade).
- Final cleanup: test player 'Demo Uno' (e07e48bd) removed from players table.
- User DB left without test data (only user's real players/matches remain).
"""
import os

import pytest
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://wafagwibbakdopgcqfkb.supabase.co").rstrip("/")
ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "sb_publishable_9-SKsBOVcKoYpCRddsZ6rQ_apgmovhj")
ADMIN_EMAIL = os.environ.get("SUPABASE_ADMIN_EMAIL", "joseilloortega600@gmail.com")
ADMIN_PASSWORD = os.environ.get("SUPABASE_ADMIN_PASSWORD", "123456")

SEED_MATCH_ID = "fc0fca8c-656c-41ee-a701-8110ab168e6f"
DEMO_PLAYER_ID = "e07e48bd-db79-4bc6-9a50-11ec0db419a5"


@pytest.fixture(scope="module")
def admin_headers():
    """Login as admin via Supabase Auth and return REST headers with the JWT."""
    resp = requests.post(
        f"{SUPABASE_URL}/auth/v1/token?grant_type=password",
        headers={"apikey": ANON_KEY, "Content-Type": "application/json"},
        json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD},
        timeout=20,
    )
    assert resp.status_code == 200, f"Admin login failed: {resp.text}"
    token = resp.json()["access_token"]
    role = resp.json().get("user", {}).get("app_metadata", {}).get("role")
    assert role == "admin", f"Expected admin role, got: {role}"
    return {"apikey": ANON_KEY, "Authorization": f"Bearer {token}"}


class TestMatchDeletionCascade:
    """Step 4: match and stats must be empty after the UI delete (cascade)."""

    def test_match_deleted(self, admin_headers):
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/matches?id=eq.{SEED_MATCH_ID}",
            headers=admin_headers, timeout=20,
        )
        assert resp.status_code == 200
        assert resp.json() == [], f"Match {SEED_MATCH_ID} still exists: {resp.json()}"

    def test_stats_deleted_cascade(self, admin_headers):
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/match_player_stats?match_id=eq.{SEED_MATCH_ID}",
            headers=admin_headers, timeout=20,
        )
        assert resp.status_code == 200
        assert resp.json() == [], f"Stats for {SEED_MATCH_ID} still exist: {resp.json()}"


class TestFinalCleanup:
    """Step 5: remove test player 'Demo Uno' so the user's DB has no test data."""

    def test_delete_demo_player(self, admin_headers):
        resp = requests.delete(
            f"{SUPABASE_URL}/rest/v1/players?id=eq.{DEMO_PLAYER_ID}",
            headers=admin_headers, timeout=20,
        )
        assert resp.status_code in (200, 204), f"DELETE failed: {resp.status_code} {resp.text}"
        # verify gone
        check = requests.get(
            f"{SUPABASE_URL}/rest/v1/players?id=eq.{DEMO_PLAYER_ID}",
            headers=admin_headers, timeout=20,
        )
        assert check.status_code == 200
        assert check.json() == [], f"Demo Uno still present: {check.json()}"

    def test_no_test_data_left(self, admin_headers):
        players = requests.get(
            f"{SUPABASE_URL}/rest/v1/players?select=id,name,active",
            headers=admin_headers, timeout=20,
        ).json()
        names = [p["name"] for p in players]
        assert "Demo Uno" not in names, f"Test player still in DB: {names}"
        print(f"Remaining players: {names}")
        matches = requests.get(
            f"{SUPABASE_URL}/rest/v1/matches?select=id,location,status",
            headers=admin_headers, timeout=20,
        ).json()
        assert all(m["location"] != "Pabellón Demo" for m in matches), f"Demo match still in DB: {matches}"
        print(f"Remaining matches: {matches}")
