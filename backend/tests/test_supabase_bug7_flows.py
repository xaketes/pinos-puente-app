"""Regression tests — Supabase REST verification for iteration 7 bug fixes.

Covers:
- BUG 1: marking attendance (VOY) on a scheduled match must NOT finalize it
  (match status stays 'scheduled'; no side effect that could trigger a
  'Partido finalizado' notice).
- BUG 2: deleting a played match removes it with cascade (stats + attendance).
- User real data (Jose Ortega, Jose Moreno, 'Pinos' matches) stays untouched.
- Mandatory cleanup of any TEST_ / 'Test %' data created during tests.
"""
import os
import uuid

import pytest
import requests

SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://wafagwibbakdopgcqfkb.supabase.co").rstrip("/")
ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "sb_publishable_9-SKsBOVcKoYpCRddsZ6rQ_apgmovhj")
ADMIN_EMAIL = os.environ.get("SUPABASE_ADMIN_EMAIL", "joseilloortega600@gmail.com")
ADMIN_PASSWORD = os.environ.get("SUPABASE_ADMIN_PASSWORD", "123456")

TEST_VENUE_1 = "Test Asistencia"
TEST_VENUE_2 = "Test Borrar"


@pytest.fixture(scope="module")
def admin():
    """Login as admin via Supabase Auth; return (headers, user_id)."""
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
    headers = {"apikey": ANON_KEY, "Authorization": f"Bearer {token}", "Content-Type": "application/json"}
    return headers, resp.json()["user"]["id"]


@pytest.fixture(scope="module")
def first_player_id(admin):
    headers, _ = admin
    resp = requests.get(
        f"{SUPABASE_URL}/rest/v1/players?active=eq.true&select=id,name&order=name",
        headers=headers, timeout=20,
    )
    assert resp.status_code == 200
    players = resp.json()
    assert players, "No active players in DB"
    return players[0]["id"]


class TestBug1AttendanceNeverFinalizes:
    """BUG 1: VOY on a scheduled match must keep status='scheduled'."""

    match_id = None

    def test_create_scheduled_match(self, admin):
        headers, _ = admin
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/matches",
            headers={**headers, "Prefer": "return=representation"},
            json={"played_at": "2026-01-20T20:30:00+00:00", "location": TEST_VENUE_1,
                  "status": "scheduled", "home_score": 0, "away_score": 0},
            timeout=20,
        )
        assert resp.status_code == 201, f"Create failed: {resp.status_code} {resp.text}"
        TestBug1AttendanceNeverFinalizes.match_id = resp.json()[0]["id"]

    def test_mark_attendance_voy(self, admin, first_player_id):
        headers, user_id = admin
        mid = TestBug1AttendanceNeverFinalizes.match_id
        assert mid, "match not created"
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/attendance",
            headers={**headers, "Prefer": "resolution=merge-duplicates,return=representation"},
            json={"match_id": mid, "player_id": first_player_id, "user_id": user_id,
                  "attending": True, "updated_at": "2026-01-16T10:00:00+00:00"},
            timeout=20,
        )
        assert resp.status_code in (200, 201), f"Attendance upsert failed: {resp.status_code} {resp.text}"

    def test_match_still_scheduled_after_voy(self, admin):
        headers, _ = admin
        mid = TestBug1AttendanceNeverFinalizes.match_id
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/matches?id=eq.{mid}&select=status,home_score,away_score",
            headers=headers, timeout=20,
        )
        assert resp.status_code == 200
        rows = resp.json()
        assert len(rows) == 1
        assert rows[0]["status"] == "scheduled", (
            f"BUG1 REGRESSION: match became '{rows[0]['status']}' after marking attendance"
        )


class TestBug2DeleteCascade:
    """BUG 2: played match deletion cascades to stats and attendance."""

    match_id = None

    def test_create_and_finalize_test_match(self, admin, first_player_id):
        headers, _ = admin
        resp = requests.post(
            f"{SUPABASE_URL}/rest/v1/matches",
            headers={**headers, "Prefer": "return=representation"},
            json={"played_at": "2026-01-15T20:30:00+00:00", "location": TEST_VENUE_2,
                  "status": "played", "home_score": 2, "away_score": 1},
            timeout=20,
        )
        assert resp.status_code == 201, f"Create failed: {resp.text}"
        mid = resp.json()[0]["id"]
        TestBug2DeleteCascade.match_id = mid
        stats = requests.post(
            f"{SUPABASE_URL}/rest/v1/match_player_stats",
            headers=headers,
            json={"match_id": mid, "player_id": first_player_id, "team": "green", "goals": 1, "assists": 0},
            timeout=20,
        )
        assert stats.status_code in (200, 201), f"Stats insert failed: {stats.text}"

    def test_delete_match_cascades(self, admin):
        headers, _ = admin
        mid = TestBug2DeleteCascade.match_id
        assert mid, "match not created"
        resp = requests.delete(f"{SUPABASE_URL}/rest/v1/matches?id=eq.{mid}", headers=headers, timeout=20)
        assert resp.status_code in (200, 204), f"DELETE failed: {resp.status_code} {resp.text}"
        for table in ("matches", "match_player_stats", "attendance"):
            key = "id" if table == "matches" else "match_id"
            check = requests.get(
                f"{SUPABASE_URL}/rest/v1/{table}?{key}=eq.{mid}",
                headers=headers, timeout=20,
            )
            assert check.status_code == 200
            assert check.json() == [], f"{table} rows remain for deleted match: {check.json()}"


class TestUserRealDataIntact:
    """User's real data must not be touched by tests."""

    def test_real_players_present(self, admin):
        headers, _ = admin
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/players?select=id,name,active",
            headers=headers, timeout=20,
        )
        names = [p["name"] for p in resp.json()]
        assert "Jose Ortega" in names and "Jose Moreno" in names, f"Missing real players: {names}"

    def test_real_matches_present(self, admin):
        headers, _ = admin
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/matches?select=id,location,status,played_at",
            headers=headers, timeout=20,
        )
        pinos = [m for m in resp.json() if "Pinos" in (m.get("location") or "")]
        assert pinos, f"User's 'Pinos' matches missing: {resp.json()}"


class TestFinalCleanup:
    """Mandatory cleanup: no TEST data left in the user's DB."""

    def test_cleanup_bug1_match_and_attendance(self, admin):
        headers, _ = admin
        mid = TestBug1AttendanceNeverFinalizes.match_id
        if mid:
            resp = requests.delete(f"{SUPABASE_URL}/rest/v1/matches?id=eq.{mid}", headers=headers, timeout=20)
            assert resp.status_code in (200, 204), f"Cleanup delete failed: {resp.text}"
            for table in ("matches", "match_player_stats", "attendance"):
                key = "id" if table == "matches" else "match_id"
                check = requests.get(f"{SUPABASE_URL}/rest/v1/{table}?{key}=eq.{mid}", headers=headers, timeout=20)
                assert check.json() == [], f"{table} rows remain after cleanup: {check.json()}"

    def test_no_test_venues_left(self, admin):
        headers, _ = admin
        resp = requests.get(
            f"{SUPABASE_URL}/rest/v1/matches?select=id,location",
            headers=headers, timeout=20,
        )
        leftovers = [m for m in resp.json() if (m.get("location") or "").startswith("Test")]
        assert leftovers == [], f"Test matches left in DB: {leftovers}"
