import json

if __package__:
    from .connection import db_connection
    from .schemas.users import create_users_table, drop_users_table, insert_users
else:
    from connection import db_connection
    from schemas.users import create_users_table, drop_users_table, insert_users


def seed():
    """Recreate the users table and load the JSON seed data."""
    with open("db/data/users.json", encoding="utf-8") as data_file:
        users = json.load(data_file)

    connection = db_connection()
    with connection.transaction():
        with connection.cursor() as cursor:
            drop_users_table(cursor)
            create_users_table(cursor)
            insert_users(cursor, users)


if __name__ == "__main__":
    try:
        seed()
    finally:
        db_connection().close()
