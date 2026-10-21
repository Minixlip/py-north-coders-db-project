def drop_venues_table(cursor):
    cursor.execute("DROP TABLE IF EXISTS venues")


def create_venues_table(cursor):
    with open("db/schemas/venues.sql", encoding="utf-8") as schema_file:
        cursor.execute(schema_file.read())


def insert_venues(cursor, venues):
    cursor.executemany(
        """
        INSERT INTO venues (name, address, capacity)
        VALUES (%(name)s, %(address)s, %(capacity)s)
        """,
        venues,
    )
