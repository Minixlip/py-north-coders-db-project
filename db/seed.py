import json

if __package__:
    from .connection import db_connection
    from .schemas.events import create_events_table, drop_events_table, insert_events
    from .schemas.users import create_users_table, drop_users_table, insert_users
    from .schemas.venues import create_venues_table, drop_venues_table, insert_venues
else:
    from connection import db_connection
    from schemas.events import create_events_table, drop_events_table, insert_events
    from schemas.users import create_users_table, drop_users_table, insert_users
    from schemas.venues import create_venues_table, drop_venues_table, insert_venues


def seed():
    """Recreate users, venues and events and load the JSON seed data."""
    with open("./data/users.json", encoding="utf-8") as data_file:
        users = json.load(data_file)
    with open("./data/venues.json", encoding="utf-8") as data_file:
        venues = json.load(data_file)
    with open("./data/events.json", encoding="utf-8") as data_file:
        events = json.load(data_file)

    connection = db_connection()
    with connection.transaction():
        with connection.cursor() as cursor:
            drop_events_table(cursor)
            drop_users_table(cursor)
            drop_venues_table(cursor)
            create_users_table(cursor)
            create_venues_table(cursor)
            create_events_table(cursor)
            insert_users(cursor, users)
            insert_venues(cursor, venues)
            insert_events(cursor, events)


if __name__ == "__main__":
    try:
        seed()
    finally:
        db_connection().close()
