from datetime import datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from db.connection import db_connection
from db.seed import seed
from src.app import app
from src.security import create_access_token


@pytest.fixture
def connection(monkeypatch):
    conn = db_connection()
    with conn.transaction(force_rollback=True):
        with monkeypatch.context() as context:
            context.chdir(Path(__file__).resolve().parents[2] / "db")
            seed()
        yield conn


@pytest.fixture
def client(connection, monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "integration-test-signing-key-for-user-events-tests")
    with TestClient(app) as client:
        yield client


def test_get_user_events_returns_ordered_rsvps_with_ranks_and_totals(client, connection):
    connection.execute("UPDATE events SET starts_at = '2020-01-01T10:00:00Z' WHERE id = 8")
    connection.execute(
        "UPDATE events SET starts_at = (SELECT starts_at FROM events WHERE id = 2) WHERE id = 3"
    )

    response = client.get(
        "/api/user/me/events",
        headers={"Authorization": f"Bearer {create_access_token(1)}"},
    )

    assert response.status_code == 200
    assert set(response.json()) == {"events"}
    events = response.json()["events"]
    assert [event["id"] for event in events] == [8, 2, 3, 6]
    for rank, event in enumerate(events, start=1):
        assert set(event) == {"id", "title", "starts_at", "rsvp_date", "event_rank", "total_rsvps"}
        assert event["event_rank"] == rank
        assert event["total_rsvps"] == 4
        title, starts_at = connection.execute(
            "SELECT title, starts_at FROM events WHERE id = %s", (event["id"],)
        ).fetchone()
        rsvp_date = connection.execute(
            "SELECT created_at FROM rsvps WHERE attendee_id = 1 AND event_id = %s",
            (event["id"],),
        ).fetchone()[0]
        assert event["title"] == title
        assert datetime.fromisoformat(event["starts_at"]) == starts_at
        assert datetime.fromisoformat(event["rsvp_date"]) == rsvp_date


def test_get_user_events_returns_empty_list_without_rsvps(client, connection):
    connection.execute("DELETE FROM rsvps WHERE attendee_id = 1")

    response = client.get(
        "/api/user/me/events",
        headers={"Authorization": f"Bearer {create_access_token(1)}"},
    )

    assert response.status_code == 200
    assert response.json() == {"events": []}


@pytest.mark.parametrize("token", [None, "invalid-token"])
def test_get_user_events_requires_valid_token(client, token):
    headers = {} if token is None else {"Authorization": f"Bearer {token}"}

    response = client.get("/api/user/me/events", headers=headers)

    assert response.status_code == 401
