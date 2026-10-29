import json
from datetime import datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from psycopg.rows import dict_row

from db.connection import db_connection
from db.seed import seed
from src.app import app
from src.security import create_access_token


PROJECT_ROOT = Path(__file__).resolve().parents[2]


@pytest.fixture
def connection(monkeypatch):
    connection = db_connection()

    # Seed inside a transaction so the original tables and data are restored.
    with connection.transaction(force_rollback=True):
        with monkeypatch.context() as context:
            context.chdir(PROJECT_ROOT / "db")
            seed()
        yield connection


@pytest.fixture
def client(connection):
    with TestClient(app) as client:
        yield client


@pytest.fixture
def authenticated_headers(monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", "integration-test-signing-key-for-event-patch-tests")
    return {"Authorization": f"Bearer {create_access_token(1)}"}


def test_get_events_returns_all_events_as_json(client):
    response = client.get("/api/events")

    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    body = response.json()
    assert set(body) == {"events"}
    assert isinstance(body["events"], list)

    with (PROJECT_ROOT / "db/data/events.json").open(encoding="utf-8") as data_file:
        seed_events = json.load(data_file)

    expected_events = dict(enumerate(seed_events, start=1))
    events = body["events"]
    assert len(events) == len(expected_events)
    assert {event["id"] for event in events} == set(expected_events)

    for event in events:
        assert type(event["id"]) is int
        expected = expected_events[event["id"]]
        assert set(event) == set(expected) | {"id", "created_at"}
        for field in ("title", "description", "organiser_id", "venue_id"):
            assert event[field] == expected[field]
        for field in ("starts_at", "ends_at"):
            assert datetime.fromisoformat(event[field]) == datetime.fromisoformat(
                expected[field]
            )
        assert datetime.fromisoformat(event["created_at"]).utcoffset() is not None


def test_get_events_orders_by_start_time_then_id(client, connection):
    connection.execute("DELETE FROM rsvps")
    connection.execute("DELETE FROM events")
    # Insert out of chronological and ID order, including identical start times.
    with connection.cursor() as cursor:
        cursor.executemany(
            """
            INSERT INTO events (id, title, starts_at, ends_at)
            VALUES (%s, %s, %s, %s)
            """,
            [
                (30, "Later event", "2026-12-02T10:00:00Z", "2026-12-02T12:00:00Z"),
                (20, "Earlier, higher ID", "2026-12-01T10:00:00Z", "2026-12-01T12:00:00Z"),
                (10, "Earlier, lower ID", "2026-12-01T10:00:00Z", "2026-12-01T12:00:00Z"),
            ],
        )

    response = client.get("/api/events")

    assert response.status_code == 200
    assert [event["id"] for event in response.json()["events"]] == [10, 20, 30]


def test_get_events_returns_an_empty_list_when_no_events_exist(client, connection):
    connection.execute("DELETE FROM rsvps")
    connection.execute("DELETE FROM events")

    response = client.get("/api/events")

    assert response.status_code == 200
    assert response.json() == {"events": []}


def test_get_events_returns_null_for_nullable_fields(client, connection):
    connection.execute(
        """
        UPDATE events
        SET description = NULL, organiser_id = NULL, venue_id = NULL, created_at = NULL
        WHERE id = 1
        """
    )

    response = client.get("/api/events")

    assert response.status_code == 200
    event = next(event for event in response.json()["events"] if event["id"] == 1)
    for field in ("description", "organiser_id", "venue_id", "created_at"):
        assert event[field] is None


@pytest.mark.parametrize("changes", [
    {"description": "Updated description"},
    {
        "title": "Updated event",
        "venue_id": 3,
        "starts_at": "2027-08-16T19:00:00Z",
        "ends_at": "2027-08-16T23:00:00Z",
    },
])
def test_patch_event_updates_only_submitted_fields(client, connection, authenticated_headers, changes):
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute("SELECT * FROM events ORDER BY id")
        before = cursor.fetchall()

    response = client.patch("/api/events/1", json=changes, headers=authenticated_headers)

    assert response.status_code == 200
    assert set(response.json()) == {"event"}
    expected = {**before[0], **changes}
    for field in ("starts_at", "ends_at"):
        if field in changes:
            expected[field] = datetime.fromisoformat(changes[field])
    event = response.json()["event"]
    for field in ("starts_at", "ends_at", "created_at"):
        event[field] = datetime.fromisoformat(event[field])
    assert event == expected
    with connection.cursor(row_factory=dict_row) as cursor:
        cursor.execute("SELECT * FROM events ORDER BY id")
        assert cursor.fetchall() == [expected, *before[1:]]


@pytest.mark.parametrize("case, event_id, status", [
    ("missing_token", 1, 401),
    ("invalid_token", 1, 401),
    ("not_organiser", 1, 403),
    ("missing_event", 999999, 404),
])
def test_patch_event_rejects_unauthorised_or_missing_events(
    client, connection, authenticated_headers, case, event_id, status
):
    query = "SELECT * FROM events ORDER BY id"
    before = connection.execute(query).fetchall()
    headers = authenticated_headers
    if case == "missing_token":
        headers = {}
    elif case == "invalid_token":
        headers = {"Authorization": "Bearer invalid-token"}
    elif case == "not_organiser":
        headers = {"Authorization": f"Bearer {create_access_token(2)}"}

    response = client.patch(
        f"/api/events/{event_id}", json={"description": "Changed"}, headers=headers
    )

    assert response.status_code == status
    assert connection.execute(query).fetchall() == before


@pytest.mark.parametrize("changes", [
    {"starts_at": "not-a-date"},
    {"ends_at": "not-a-date"},
    {"starts_at": "2027-08-16T23:00:00Z", "ends_at": "2027-08-16T19:00:00Z"},
    {"starts_at": "2027-08-16T19:00:00Z", "ends_at": "2027-08-16T19:00:00Z"},
    {"starts_at": "2027-08-16T19:00:00Z"},
    {"ends_at": "2020-01-01T19:00:00Z"},
])
def test_patch_event_rejects_invalid_dates_and_ranges(client, connection, authenticated_headers, changes):
    query = "SELECT * FROM events ORDER BY id"
    before = connection.execute(query).fetchall()

    response = client.patch("/api/events/1", json=changes, headers=authenticated_headers)

    assert response.status_code == 400
    assert connection.execute(query).fetchall() == before


def test_get_attendees_returns_only_rsvped_users_without_passwords(client, authenticated_headers):
    response = client.get("/api/events/1/attendees", headers=authenticated_headers)

    assert response.status_code == 200
    with (PROJECT_ROOT / "db/data/users.json").open(encoding="utf-8") as data_file:
        users = json.load(data_file)
    expected = [
        {"id": user_id, "name": user["name"], "email": user["email"]}
        for user_id, user in enumerate(users, start=1)
        if user_id in {2, 3, 4, 5}
    ]
    assert response.json() == {"attendees": expected}


@pytest.mark.parametrize("user_id, event_id, status", [
    (None, 1, 401),
    ("invalid", 1, 401),
    (2, 1, 403),
    (1, 999999, 404),
])
def test_get_attendees_rejects_invalid_access(client, authenticated_headers, user_id, event_id, status):
    headers = authenticated_headers
    if user_id is None:
        headers = {}
    elif user_id == "invalid":
        headers = {"Authorization": "Bearer invalid-token"}
    elif user_id != 1:
        headers = {"Authorization": f"Bearer {create_access_token(user_id)}"}

    response = client.get(f"/api/events/{event_id}/attendees", headers=headers)

    assert response.status_code == status
