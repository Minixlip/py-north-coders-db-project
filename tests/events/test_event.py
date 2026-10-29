import json
from datetime import datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from db.connection import db_connection
from db.seed import seed
from src.app import app


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
