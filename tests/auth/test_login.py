import json
from datetime import datetime, timezone
from pathlib import Path

import jwt
import pytest
from fastapi.testclient import TestClient

from db.connection import db_connection
from db.seed import seed
from src.app import app


PROJECT_ROOT = Path(__file__).resolve().parents[2]
TEST_JWT_SECRET = "integration-test-signing-key-for-login-tests-only"


@pytest.fixture
def connection(monkeypatch):
    connection = db_connection()
    with connection.transaction(force_rollback=True):
        with monkeypatch.context() as context:
            context.chdir(PROJECT_ROOT / "db")
            seed()
        yield connection


@pytest.fixture
def client(connection, monkeypatch):
    monkeypatch.setenv("JWT_SECRET_KEY", TEST_JWT_SECRET)
    with TestClient(app) as client:
        yield client


@pytest.fixture
def users():
    with (PROJECT_ROOT / "db/data/users.json").open(encoding="utf-8") as data_file:
        return json.load(data_file)


@pytest.mark.parametrize("user_index", [0, 2])
def test_login_returns_a_signed_token_for_the_matching_user(
    client, connection, users, user_index
):
    user = users[user_index]
    expected_id = connection.execute(
        "SELECT id FROM users WHERE email = %s", (user["email"],)
    ).fetchone()[0]
    before = int(datetime.now(timezone.utc).timestamp())

    response = client.post(
        "/api/auth/login",
        json={"email": user["email"], "password": user["password"]},
        follow_redirects=False,
    )

    after = int(datetime.now(timezone.utc).timestamp())
    assert response.status_code == 200
    assert response.headers["content-type"] == "application/json"
    assert response.headers["cache-control"] == "no-store"
    assert response.headers["pragma"] == "no-cache"
    body = response.json()
    assert set(body) == {"access_token", "token_type"}
    assert body["token_type"] == "bearer"

    # Decoding verifies the signature and expiry using the configured secret.
    claims = jwt.decode(
        body["access_token"],
        TEST_JWT_SECRET,
        algorithms=["HS256"],
        options={"require": ["sub", "iat", "exp"]},
    )
    assert set(claims) == {"sub", "iat", "exp"}
    assert claims["sub"] == str(expected_id)
    assert before <= claims["iat"] <= after
    assert claims["exp"] - claims["iat"] == 30 * 60
    assert claims["exp"] > after


@pytest.mark.parametrize("failure", ["wrong_password", "unknown_email", "sql_injection"])
def test_login_rejects_invalid_credentials_with_the_same_message(client, users, failure):
    user = users[0]
    credentials = {"email": user["email"], "password": user["password"]}
    if failure == "wrong_password":
        credentials["password"] += "-wrong"
    elif failure == "unknown_email":
        credentials["email"] = "unknown@example.invalid"
    else:
        credentials["email"] = "' OR 1=1 --"

    response = client.post("/api/auth/login", json=credentials)

    assert response.status_code == 401
    assert response.json() == {"detail": "Invalid email or password."}


@pytest.mark.parametrize(
    "credentials",
    [
        {},
        {"email": "test@example.com"},
        {"password": "example-password"},
        {"email": 123, "password": "example-password"},
        {"email": "test@example.com", "password": 123},
        {"email": "test@example.com", "password": ""},
        {"email": "", "password": "example-password"},
    ],
)
def test_login_rejects_missing_empty_or_incorrectly_typed_credentials(client, credentials):
    response = client.post("/api/auth/login", json=credentials)

    assert response.status_code == 422
    assert "access_token" not in response.json()


@pytest.mark.parametrize("secret", [None, "too-short"])
def test_login_does_not_issue_a_token_without_a_valid_signing_secret(
    client, users, monkeypatch, secret
):
    if secret is None:
        monkeypatch.delenv("JWT_SECRET_KEY", raising=False)
    else:
        monkeypatch.setenv("JWT_SECRET_KEY", secret)
    user = users[0]

    response = client.post(
        "/api/auth/login",
        json={"email": user["email"], "password": user["password"]},
    )

    assert response.status_code == 503
    assert response.json() == {"detail": "Authentication is not configured."}
