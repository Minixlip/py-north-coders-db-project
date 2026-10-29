from datetime import datetime, timedelta, timezone
from pathlib import Path

import jwt
import pytest
from fastapi.testclient import TestClient

from db.connection import db_connection
from db.seed import seed
from src.app import app
from src.security import create_access_token


TEST_SECRET = "integration-test-signing-key-for-rsvp-tests-only"


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
    monkeypatch.setenv("JWT_SECRET_KEY", TEST_SECRET)
    with TestClient(app) as client:
        yield client


@pytest.mark.parametrize("body", [None, {"user_id": 2}])
def test_rsvp_uses_token_user_id_instead_of_request_body(client, connection, body):
    response = client.post(
        "/api/events/1/rsvp",
        headers={"Authorization": f"Bearer {create_access_token(1)}"},
        json=body,
    )

    assert response.status_code == 201
    assert set(response.json()) == {"rsvp"}
    rsvp = response.json()["rsvp"]
    assert set(rsvp) == {"id", "attendee_id", "event_id", "created_at"}
    assert rsvp["attendee_id"] == 1
    assert rsvp["event_id"] == 1
    assert connection.execute(
        "SELECT attendee_id, event_id, created_at FROM rsvps WHERE id = %s", (rsvp["id"],)
    ).fetchone() == (1, 1, datetime.fromisoformat(rsvp["created_at"]))


@pytest.mark.parametrize(
    "token_case",
    ["missing", "malformed", "expired", "wrong_signature", "missing_sub", "missing_exp"],
)
def test_rsvp_rejects_invalid_tokens_without_creating_a_record(client, connection, token_case):
    before = connection.execute("SELECT COUNT(*) FROM rsvps").fetchone()[0]
    payload = {"sub": "1", "exp": datetime.now(timezone.utc) + timedelta(minutes=30)}
    secret = TEST_SECRET
    if token_case == "expired":
        payload["exp"] = datetime.now(timezone.utc) - timedelta(minutes=1)
    elif token_case == "wrong_signature":
        secret = "a-different-signing-key-for-invalid-token-tests"
    elif token_case == "missing_sub":
        del payload["sub"]
    elif token_case == "missing_exp":
        del payload["exp"]
    token = jwt.encode(payload, secret, algorithm="HS256")
    if token_case == "malformed":
        token = "not-a-jwt"
    headers = {} if token_case == "missing" else {"Authorization": f"Bearer {token}"}

    response = client.post("/api/events/1/rsvp", headers=headers)

    assert response.status_code == 401
    assert response.headers["www-authenticate"] == "Bearer"
    assert connection.execute("SELECT COUNT(*) FROM rsvps").fetchone()[0] == before


@pytest.mark.parametrize("event_id, expected_status", [(999999, 404), (2, 409)])
def test_rsvp_rejects_missing_events_and_duplicates(client, connection, event_id, expected_status):
    # User 1 already has an RSVP for event 2 in the seed data.
    before = connection.execute("SELECT COUNT(*) FROM rsvps").fetchone()[0]

    response = client.post(
        f"/api/events/{event_id}/rsvp",
        headers={"Authorization": f"Bearer {create_access_token(1)}"},
    )

    assert response.status_code == expected_status
    assert connection.execute("SELECT COUNT(*) FROM rsvps").fetchone()[0] == before


def test_delete_rsvp_removes_only_the_authenticated_users_rsvp(client, connection):
    query = "SELECT id, attendee_id, event_id FROM rsvps ORDER BY id"
    before = connection.execute(query).fetchall()

    response = client.delete(
        "/api/events/2/rsvp/me",
        headers={"Authorization": f"Bearer {create_access_token(1)}"},
    )

    assert response.status_code == 204
    assert response.content == b""
    assert connection.execute(query).fetchall() == [
        row for row in before if row[1:] != (1, 2)
    ]


@pytest.mark.parametrize("token", [None, "invalid-token"])
def test_delete_rsvp_requires_a_valid_token(client, connection, token):
    query = "SELECT * FROM rsvps ORDER BY id"
    before = connection.execute(query).fetchall()
    headers = {} if token is None else {"Authorization": f"Bearer {token}"}

    response = client.delete("/api/events/2/rsvp/me", headers=headers)

    assert response.status_code == 401
    assert connection.execute(query).fetchall() == before


@pytest.mark.parametrize("event_id", [1, 999999])
def test_delete_rsvp_returns_404_when_user_has_no_matching_rsvp(client, connection, event_id):
    # User 1 has no RSVP for event 1, but other users do.
    query = "SELECT * FROM rsvps ORDER BY id"
    before = connection.execute(query).fetchall()

    response = client.delete(
        f"/api/events/{event_id}/rsvp/me",
        headers={"Authorization": f"Bearer {create_access_token(1)}"},
    )

    assert response.status_code == 404
    assert connection.execute(query).fetchall() == before
