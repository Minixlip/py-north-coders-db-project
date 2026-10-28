from datetime import datetime
from pathlib import Path

import pytest
from fastapi.testclient import TestClient
from pwdlib import PasswordHash

from db.connection import db_connection
from db.seed import seed
from src.app import app


USER = {
    "name": "Alice Smith",
    "email": "registration-test@example.invalid",
    "password": "securepassword123",
}


@pytest.fixture
def connection(monkeypatch):
    conn = db_connection()
    with conn.transaction(force_rollback=True):
        with monkeypatch.context() as context:
            context.chdir(Path(__file__).resolve().parents[2] / "db")
            seed()
        yield conn


@pytest.fixture
def client(connection):
    with TestClient(app) as client:
        yield client


def test_register_creates_user_with_hashed_password(client, connection):
    response = client.post("/api/auth/register", json=USER)

    assert response.status_code == 201
    assert set(response.json()) == {"user"}
    user = response.json()["user"]
    assert set(user) == {"id", "name", "email", "created_at"}
    assert user["name"] == USER["name"]
    assert user["email"] == USER["email"]
    stored = connection.execute(
        "SELECT id, name, password, created_at FROM users WHERE email = %s",
        (USER["email"],),
    ).fetchone()
    assert stored[0] == user["id"]
    assert stored[1] == user["name"]
    assert stored[2] != USER["password"]
    assert PasswordHash.recommended().verify(USER["password"], stored[2])
    assert stored[3] == datetime.fromisoformat(user["created_at"])


def test_register_rejects_duplicate_email(client, connection):
    assert client.post("/api/auth/register", json=USER).status_code == 201

    response = client.post("/api/auth/register", json=USER)

    assert response.status_code == 409
    assert response.json() == {"detail": "Email already registered."}
    assert connection.execute(
        "SELECT COUNT(*) FROM users WHERE email = %s", (USER["email"],)
    ).fetchone()[0] == 1


@pytest.mark.parametrize("missing_field", ["name", "email", "password"])
def test_register_rejects_missing_fields(client, missing_field):
    body = {key: value for key, value in USER.items() if key != missing_field}

    response = client.post("/api/auth/register", json=body)

    assert response.status_code == 400
    assert response.json() == {"detail": "Invalid registration details."}
