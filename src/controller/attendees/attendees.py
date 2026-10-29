from db.connection import db_connection
from fastapi import HTTPException
from psycopg.rows import dict_row


def get_attendees(event_id: int, user_id: int):
    conn = db_connection()
    with conn.transaction():
        with conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                "SELECT organiser_id FROM events WHERE id = %s",
                (event_id,),
            )
            event = cursor.fetchone()
            if event is None:
                raise HTTPException(status_code=404, detail="Event not found.")
            if event["organiser_id"] != user_id:
                raise HTTPException(status_code=403, detail="Not authorised.")

            cursor.execute(
                """
                SELECT users.id, users.name, users.email
                FROM rsvps
                JOIN users ON users.id = rsvps.attendee_id
                WHERE rsvps.event_id = %s
                ORDER BY users.id
                """,
                (event_id,),
            )
            return cursor.fetchall()
