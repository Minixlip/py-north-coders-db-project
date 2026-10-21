# NC Plus One

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
