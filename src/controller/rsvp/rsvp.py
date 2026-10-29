from fastapi import HTTPException
from psycopg.rows import dict_row

from db.connection import db_connection


def rsvp_event(event_id: int, user_id: int):
    conn = db_connection()
    with conn.transaction():
        with conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                "SELECT id FROM events WHERE id = %s FOR UPDATE", (event_id,)
            )
            if cursor.fetchone() is None:
                raise HTTPException(status_code=404, detail="Event not found.")

            cursor.execute(
                "SELECT id FROM rsvps WHERE attendee_id = %s AND event_id = %s",
                (user_id, event_id),
            )
            if cursor.fetchone() is not None:
                raise HTTPException(status_code=409, detail="Already RSVPed to this event.")

            cursor.execute(
                """
                INSERT INTO rsvps (attendee_id, event_id)
                VALUES (%s, %s)
                RETURNING id, attendee_id, event_id, created_at
                """,
                (user_id, event_id),
            )
            return cursor.fetchone()


def delete_rsvp(event_id, user_id: int):
    conn = db_connection()
    
    with conn.transaction():
        with conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                            """
                            SELECT *
                            FROM events
                            WHERE id =  %s
                            """,
                            (event_id),
                        )
            found_event = cursor.fetchone()
            
            if not found_event: 
                raise HTTPException(status_code=404, detail="Couldn't find event.")
            
            cursor.execute("DELETE FROM events WHERE event_id = %s", event_id)
            
        