# NC Plus One

A FastAPI backend for creating events, managing RSVPs, and viewing attendees.
Authentication uses JWTs, and passwords are hashed with Argon2.

## Tools

- Python 3.13, FastAPI and Uvicorn
- PostgreSQL and Psycopg
- Pydantic, pwdlib (Argon2) and PyJWT
- pytest and HTTPX

## Setup

Install Python and PostgreSQL, and make sure PostgreSQL is running.
Run these commands from the project root:

```sh
python3 -m venv venv
source venv/bin/activate
python -m pip install -r requirements.txt "uvicorn[standard]"
cp .env.example .env
```

Fill in `.env` with your local database details:

```dotenv
DB_NAME=nc_plus_one
DB_USER=your_postgres_user
DB_PASSWORD=your_password
DB_HOST=localhost
DB_PORT=5432
JWT_SECRET_KEY=your_generated_secret
```

Leave `DB_PASSWORD` empty if your local database does not require one.
Generate a JWT secret with the command below and copy it into `.env`:

```sh
python -c 'import secrets; print(secrets.token_hex(32))'
```

Keep `.env` private; it is ignored by Git.

## Database

Create the database, then load the seed data from the project root:

```sh
psql -X -d postgres -f db/setup.sql
python - <<'PYTHON'
from os import chdir
from db.seed import seed

chdir("db")
seed()
PYTHON
```

Database setup deletes any existing `nc_plus_one` database. Seeding recreates its
four tables and loads `db/data`, hashing user passwords before insertion.

## Run

```sh
python -m uvicorn src.app:app --reload
```

Server: http://127.0.0.1:8000

Interactive API documentation: http://127.0.0.1:8000/docs

## Endpoints

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| POST | `/api/auth/register` | Public | Register with name, email and password |
| POST | `/api/auth/login` | Public | Log in with email and password to get a JWT |
| GET | `/api/events` | Public | List events in start-time order |
| GET | `/api/events/{id}` | Public | Get an event with venue details |
| POST | `/api/events` | JWT | Create an event as its organiser |
| PATCH | `/api/events/{id}` | Organiser | Update selected event fields |
| POST | `/api/events/{id}/rsvp` | JWT | RSVP to an event |
| DELETE | `/api/events/{id}/rsvp/me` | JWT | Cancel your own RSVP |
| GET | `/api/events/{id}/attendees` | Organiser | List attendees without passwords |
| GET | `/api/user/me/events` | JWT | List your RSVPed events with ranks and totals |

For protected endpoints, send the login response's `access_token` in this header:

```text
Authorization: Bearer <access_token>
```

Tokens expire after 30 minutes. Organiser endpoints also check event ownership.
Seeded login credentials are in `db/data/users.json`. Use `/docs` to inspect
request bodies and try the endpoints.

## Tests

With PostgreSQL running and `.env` configured:

```sh
pytest -q
```

Integration tests seed data inside transactions and roll back their changes.
