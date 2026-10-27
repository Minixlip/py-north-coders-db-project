import json
from datetime import datetime
from pathlib import Path

import pytest
from pwdlib import PasswordHash

from db.connection import db_connection
from db.seed import seed


@pytest.fixture
def seed_database(monkeypatch):
    def run_seed():
        with monkeypatch.context() as context:
            context.chdir("db")
            seed()

    return run_seed


@pytest.fixture
def connection(seed_database):
    connection = db_connection()
    with connection.transaction(force_rollback=True):
        seed_database()
        yield connection


def test_inserts_all_users(connection):
    with open("db/data/users.json", encoding="utf-8") as data_file:
        users = json.load(data_file)

    rows = connection.execute(
        "SELECT id, email, password, name, created_at FROM users ORDER BY id"
    ).fetchall()

    assert [(row[0], row[1], row[3]) for row in rows] == [
        (index, user["email"], user["name"])
        for index, user in enumerate(users, start=1)
    ]
    assert all(row[4] is not None for row in rows)

    password_hash = PasswordHash.recommended()
    for row, user in zip(rows, users):
        stored_password = row[2]
        assert stored_password != user["password"]
        assert password_hash.verify(user["password"], stored_password)
        assert not password_hash.verify(user["password"] + "-wrong", stored_password)


def test_reseeding_creates_fresh_hashes_without_changing_inputs(connection, seed_database):
    data_path = Path("db/data/users.json")
    original_data = data_path.read_bytes()
    users = json.loads(original_data)
    query = "SELECT password FROM users ORDER BY id"
    original_hashes = connection.execute(query).fetchall()

    seed_database()

    new_hashes = connection.execute(query).fetchall()
    assert len(new_hashes) == len(original_hashes) == len(users)
    password_hash = PasswordHash.recommended()
    for original, new, user in zip(original_hashes, new_hashes, users):
        assert original[0] != new[0]
        assert password_hash.verify(user["password"], new[0])
    assert data_path.read_bytes() == original_data


def test_reseeding_restores_users_and_schema(connection, seed_database):
    query = "SELECT id, email, name FROM users ORDER BY id"
    with connection.transaction():
        original_users = connection.execute(query).fetchall()
        connection.execute("ALTER TABLE users ADD COLUMN stale BOOLEAN")
        connection.execute(
            "INSERT INTO users (email, password, name) VALUES (%s, %s, %s)",
            ("stale@example.com", "old-password", "Old User"),
        )

    seed_database()

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


def test_reseeding_restores_venues_and_schema(connection, seed_database):
    query = "SELECT id, name, address, capacity FROM venues ORDER BY id"
    with connection.transaction():
        original_venues = connection.execute(query).fetchall()
        connection.execute("ALTER TABLE venues ADD COLUMN stale BOOLEAN")
        connection.execute(
            "INSERT INTO venues (name, address, capacity) VALUES (%s, %s, %s)",
            ("Old Venue", "Old Address", 10),
        )

    seed_database()

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


def test_reseeding_restores_events_and_schema(connection, seed_database):
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

    seed_database()

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


def test_inserts_all_rsvps(connection):
    with open("db/data/rsvps.json", encoding="utf-8") as data_file:
        rsvps = json.load(data_file)

    rows = connection.execute(
        "SELECT id, attendee_id, event_id, created_at FROM rsvps ORDER BY id"
    ).fetchall()

    assert [row[:3] for row in rows] == [
        (index, rsvp["attendee_id"], rsvp["event_id"])
        for index, rsvp in enumerate(rsvps, start=1)
    ]
    assert all(row[3] is not None for row in rows)


def test_reseeding_restores_rsvps_and_schema(connection, seed_database):
    query = "SELECT id, attendee_id, event_id FROM rsvps ORDER BY id"
    with connection.transaction():
        original_rsvps = connection.execute(query).fetchall()
        connection.execute("ALTER TABLE rsvps ADD COLUMN stale BOOLEAN")
        connection.execute(
            "INSERT INTO rsvps (attendee_id, event_id) VALUES (%s, %s)",
            (1, 1),
        )

    seed_database()

    assert connection.execute(query).fetchall() == original_rsvps
    columns = connection.execute(
        """
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'rsvps'
        ORDER BY ordinal_position
        """
    ).fetchall()
    assert columns == [
        ("id", "integer", "NO"),
        ("attendee_id", "integer", "YES"),
        ("event_id", "integer", "YES"),
        ("created_at", "timestamp with time zone", "YES"),
    ]
    foreign_keys = connection.execute(
        """
        SELECT pg_get_constraintdef(oid)
        FROM pg_constraint
        WHERE conrelid = 'rsvps'::regclass AND contype = 'f'
        ORDER BY conname
        """
    ).fetchall()
    assert foreign_keys == [
        ("FOREIGN KEY (attendee_id) REFERENCES users(id)",),
        ("FOREIGN KEY (event_id) REFERENCES events(id)",),
    ]
