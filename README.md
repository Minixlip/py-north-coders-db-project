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

Run from the project root:

```sh
python3 db/seed.py
```

This drops and recreates `users`, then loads `db/data/users.json`.
User helpers live in `db/schemas/users.py`; the table definition is in
[`db/schemas/users.sql`](db/schemas/users.sql).

Run the seed tests from the project root:

```sh
python3 -m pytest -q
```

These tests reset the users table in the database configured in `.env`.
