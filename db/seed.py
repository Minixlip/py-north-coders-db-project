import json

from pwdlib import PasswordHash

if __package__:
    from .connection import db_connection
    from .schemas.events import create_events_table, drop_events_table, insert_events
    from .schemas.rsvps import create_rsvps_table, drop_rsvps_table, insert_rsvps
    from .schemas.users import create_users_table, drop_users_table, insert_users
    from .schemas.venues import create_venues_table, drop_venues_table, insert_venues
else:
    from connection import db_connection
    from schemas.events import create_events_table, drop_events_table, insert_events
    from schemas.rsvps import create_rsvps_table, drop_rsvps_table, insert_rsvps
    from schemas.users import create_users_table, drop_users_table, insert_users
    from schemas.venues import create_venues_table, drop_venues_table, insert_venues


def seed():
    """Recreate the tables and load seed data, hashing user passwords first."""
    with open("./data/users.json", encoding="utf-8") as data_file:
        users = json.load(data_file)
    with open("./data/venues.json", encoding="utf-8") as data_file:
        venues = json.load(data_file)
    with open("./data/events.json", encoding="utf-8") as data_file:
        events = json.load(data_file)
    with open("./data/rsvps.json", encoding="utf-8") as data_file:
        rsvps = json.load(data_file)

    password_hash = PasswordHash.recommended()
    for user in users:
        user["password"] = password_hash.hash(user["password"])

    connection = db_connection()
    with connection.transaction():
        with connection.cursor() as cursor:
            drop_rsvps_table(cursor)
            drop_events_table(cursor)
            drop_users_table(cursor)
            drop_venues_table(cursor)
            create_users_table(cursor)
            create_venues_table(cursor)
            create_events_table(cursor)
            create_rsvps_table(cursor)
            insert_users(cursor, users)
            insert_venues(cursor, venues)
            insert_events(cursor, events)
            insert_rsvps(cursor, rsvps)


if __name__ == "__main__":
    try:
        seed()
    finally:
        db_connection().close()
