from db.connection import db_connection
from psycopg.rows import dict_row


def fetch_events():
    conn = db_connection()

    with conn.cursor(row_factory=dict_row) as cursor:
        cursor.execute("SELECT * FROM events ORDER BY starts_at ASC, id ASC")
        events_list = cursor.fetchall()

    return {"events": events_list}