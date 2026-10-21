import json
from datetime import datetime

import pytest

from db.connection import db_connection
from db.seed import seed


@pytest.fixture
def connection():
    connection = db_connection()
    seed()
    try:
        yield connection
    finally:
        connection.rollback()


def test_inserts_all_users(connection):
    with open("db/data/users.json", encoding="utf-8") as data_file:
        users = json.load(data_file)

    rows = connection.execute(
        "SELECT id, email, password, name, created_at FROM users ORDER BY id"
    ).fetchall()

    assert [row[:4] for row in rows] == [
        (index, user["email"], user["password"], user["name"])
        for index, user in enumerate(users, start=1)
    ]
    assert all(row[4] is not None for row in rows)


def test_reseeding_restores_users_and_schema(connection):
    query = "SELECT id, email, password, name FROM users ORDER BY id"
    with connection.transaction():
        original_users = connection.execute(query).fetchall()
        connection.execute("ALTER TABLE users ADD COLUMN stale BOOLEAN")
        connection.execute(
            "INSERT INTO users (email, password, name) VALUES (%s, %s, %s)",
            ("stale@example.com", "old-password", "Old User"),
        )

    seed()

    assert connection.execute(query).fetchall() == original_users
    columns = connection.execute(
        """
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'users'
        ORDER BY ordinal_position
        """
    ).fetchall()
    assert columns == [
        ("id", "integer", None, "NO"),
        ("email", "character varying", 255, "NO"),
        ("password", "character varying", 255, "NO"),
        ("name", "character varying", 255, "NO"),
        ("created_at", "timestamp with time zone", None, "YES"),
    ]


def test_inserts_all_venues(connection):
    with open("db/data/venues.json", encoding="utf-8") as data_file:
        venues = json.load(data_file)

    rows = connection.execute(
        "SELECT id, name, address, capacity FROM venues ORDER BY id"
    ).fetchall()

    assert rows == [
        (index, venue["name"], venue["address"], venue["capacity"])
        for index, venue in enumerate(venues, start=1)
    ]


def test_reseeding_restores_venues_and_schema(connection):
    query = "SELECT id, name, address, capacity FROM venues ORDER BY id"
    with connection.transaction():
        original_venues = connection.execute(query).fetchall()
        connection.execute("ALTER TABLE venues ADD COLUMN stale BOOLEAN")
        connection.execute(
            "INSERT INTO venues (name, address, capacity) VALUES (%s, %s, %s)",
            ("Old Venue", "Old Address", 10),
        )

    seed()

    assert connection.execute(query).fetchall() == original_venues
    columns = connection.execute(
        """
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'venues'
        ORDER BY ordinal_position
        """
    ).fetchall()
    assert columns == [
        ("id", "integer", None, "NO"),
        ("name", "character varying", 255, "NO"),
        ("address", "text", None, "YES"),
        ("capacity", "integer", None, "YES"),
    ]


def test_inserts_all_events(connection):
    with open("db/data/events.json", encoding="utf-8") as data_file:
        events = json.load(data_file)

    rows = connection.execute(
        """
        SELECT id, title, description, starts_at, ends_at,
               organiser_id, venue_id, created_at
        FROM events ORDER BY id
        """
    ).fetchall()

    assert [row[:7] for row in rows] == [
        (
            index, event["title"], event["description"],
            datetime.fromisoformat(event["starts_at"]),
            datetime.fromisoformat(event["ends_at"]),
            event["organiser_id"], event["venue_id"],
        )
        for index, event in enumerate(events, start=1)
    ]
    assert all(row[7] is not None for row in rows)


def test_reseeding_restores_events_and_schema(connection):
    query = (
        "SELECT id, title, description, starts_at, ends_at, organiser_id, venue_id "
        "FROM events ORDER BY id"
    )
    with connection.transaction():
        original_events = connection.execute(query).fetchall()
        connection.execute("ALTER TABLE events ADD COLUMN stale BOOLEAN")
        connection.execute(
            """
            INSERT INTO events (title, starts_at, ends_at, organiser_id, venue_id)
            VALUES (%s, %s, %s, %s, %s)
            """,
            ("Old Event", "2020-01-01T10:00:00Z", "2020-01-01T12:00:00Z", 1, 1),
        )

    seed()

    assert connection.execute(query).fetchall() == original_events
    columns = connection.execute(
        """
        SELECT column_name, data_type, character_maximum_length, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'events'
        ORDER BY ordinal_position
        """
    ).fetchall()
    assert columns == [
        ("id", "integer", None, "NO"),
        ("title", "character varying", 255, "NO"),
        ("description", "character varying", 255, "YES"),
        ("starts_at", "timestamp with time zone", None, "NO"),
        ("ends_at", "timestamp with time zone", None, "NO"),
        ("organiser_id", "integer", None, "YES"),
        ("venue_id", "integer", None, "YES"),
        ("created_at", "timestamp with time zone", None, "YES"),
    ]
    foreign_keys = connection.execute(
        """
        SELECT pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conrelid = 'events'::regclass AND contype = 'f'
        ORDER BY conname
        """
    ).fetchall()
    assert foreign_keys == [
        ("FOREIGN KEY (organiser_id) REFERENCES users(id)",),
        ("FOREIGN KEY (venue_id) REFERENCES venues(id)",),
    ]
