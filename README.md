# NC Plus One

## Database Connection

In your Python virtual environment, run:

```sh
pip install -r requirements.txt
cp .env.example .env
```

Fill in `.env` with your own local database settings: `DB_NAME` (`nc_plus_one`),
`DB_USER`, `DB_PASSWORD`, `DB_HOST` and `DB_PORT`. Leave `DB_PASSWORD` empty if your
local setup doesn't use one. `.env` is ignored by Git.

To use the shared connection:

```python
from db.connection import db_connection

connection = db_connection()
```

Close it when your script finishes; all callers share the same connection.

## Database Setup

With PostgreSQL 13+ running locally, run this from the project root:

```sh
psql -X -d postgres -f db/setup.sql
```

This recreates `nc_plus_one`, deleting any existing data.

To connect:

```sh
psql -d nc_plus_one
```

## Seeding

Run from the `db` directory:

```sh
python3 seed.py
```

This drops and recreates `users`, `venues`, `events` and `rsvps`, then loads their JSON files from
`db/data`. Table helpers live in `db/schemas`, alongside the SQL definitions for
[`users`](db/schemas/users.sql), [`venues`](db/schemas/venues.sql),
[`events`](db/schemas/events.sql) and [`rsvps`](db/schemas/rsvps.sql).

The seed function hashes each password from `db/data/users.json` with Argon2
before inserting users. The JSON file keeps the plaintext inputs; the database
stores salted hashes. Use `PasswordHash.recommended().verify(password, stored_hash)`
from `pwdlib` when checking a password against a stored hash.

Run the seed tests from the project root:

```sh
python3 -m pytest -q
```

These tests seed tables inside transactions and roll back their changes, restoring
the original tables and data in the database configured in `.env`.

## Login

Set `JWT_SECRET_KEY` in `.env` to a random secret generated with:

```sh
python3 -c 'import secrets; print(secrets.token_hex(32))'
```

Use the same secret for issuing and validating tokens, and keep it private. Login
returns HTTP 503 if the secret is missing or shorter than 32 bytes.

Send `POST /api/auth/login` with a JSON body containing `email` and `password`.
Use an email and its original plaintext password from `db/data/users.json`.
Successful login returns:

```json
{"access_token": "<signed JWT>", "token_type": "bearer"}
```

Tokens use HS256, expire after 30 minutes, and contain the user's ID as the `sub`
claim. Invalid credentials return HTTP 401 with the same message for an unknown
email or an incorrect password. Missing, empty, or incorrectly typed credentials
return HTTP 422. Passwords and password hashes are excluded from successful
responses and tokens.

Run the login integration tests with:

```sh
python3 -m pytest tests/auth/test_login.py -q
```
