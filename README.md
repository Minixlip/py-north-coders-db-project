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

## Browser access

FastAPI's `CORSMiddleware` lets a frontend such as Vite at
`http://localhost:5173` call the API directly. For local development it allows
all origins, methods, and request headers, including `Authorization` and
`Content-Type` on browser preflights. Protected routes use bearer tokens, and
CORS credentials are disabled.

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

## Frontend API client

The TypeScript modules in `frontend/src/api` use the response shapes from this
backend. Pass the API base URL to `createApiClient`, for example
`createApiClient("http://127.0.0.1:8000")`.

- Login returns `{ access_token, token_type }`. `sessionFromToken` validates
  the locally decoded claims and checks expiry. It converts the string JWT
  subject to a numeric user ID for comparison with an event's `organiser_id`.
  The API verifies tokens and permissions on protected requests.
- Event lists include `organiser_id` and `venue_id`. Event details add
  `venue_name`, `venue_address`, and `venue_capacity`, which can be null.
  Use `getMyEvents` to check whether the signed-in user has RSVPed.
- The client normalizes errors to `ApiError` with a status, message, and any
  validation issues. Incomplete login bodies and invalid event detail IDs
  produce `422`. An RSVP cancellation returns `204` with an empty body.
- Organiser stats, a standalone current-user profile, and a venue list are
  absent from this backend.

## Tests

With PostgreSQL running and `.env` configured:

```sh
pytest -q
```

Integration tests seed data inside transactions and roll back their changes.
