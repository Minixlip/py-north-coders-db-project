from psycopg.rows import dict_row

from db.connection import db_connection


def fetch_venues():
    with db_connection().cursor(row_factory=dict_row) as cursor:
        cursor.execute("SELECT id, name, address FROM venues ORDER BY name, id")
        return cursor.fetchall()
