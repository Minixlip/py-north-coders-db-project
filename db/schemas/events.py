def drop_events_table(cursor):
    cursor.execute("DROP TABLE IF EXISTS events")


def create_events_table(cursor):
    with open("./schemas/events.sql", encoding="utf-8") as schema_file:
        cursor.execute(schema_file.read())


def insert_events(cursor, events):
    cursor.executemany(
        """
        INSERT INTO events (
            title, description, starts_at, ends_at, organiser_id, venue_id
        )
        VALUES (
            %(title)s, %(description)s, %(starts_at)s, %(ends_at)s,
            %(organiser_id)s, %(venue_id)s
        )
        """,
        events
    )
