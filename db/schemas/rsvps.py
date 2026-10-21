def drop_rsvps_table(cursor):
    cursor.execute("DROP TABLE IF EXISTS rsvps")


def create_rsvps_table(cursor):
    with open("./schemas/rsvps.sql", encoding="utf-8") as schema_file:
        cursor.execute(schema_file.read())


def insert_rsvps(cursor, rsvps):
    cursor.executemany(
        """
        INSERT INTO rsvps (attendee_id, event_id)
        VALUES (%(attendee_id)s, %(event_id)s)
        """,
        rsvps
    )
