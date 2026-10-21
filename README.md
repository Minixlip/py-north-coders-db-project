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

Import the connection with `from db.connection import connection`.

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

The seed function is a placeholder for now and makes no database changes.
