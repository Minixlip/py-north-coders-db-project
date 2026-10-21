def drop_users_table(cursor):
    cursor.execute("DROP TABLE IF EXISTS users")


def create_users_table(cursor):
    with open("db/schemas/users.sql", encoding="utf-8") as schema_file:
        cursor.execute(schema_file.read())


def insert_users(cursor, users):
    cursor.executemany(
        """
        INSERT INTO users (email, password, name)
        VALUES (%(email)s, %(password)s, %(name)s)
        """,
        users,
    )
