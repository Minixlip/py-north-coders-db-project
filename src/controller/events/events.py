from db.connection import db_connection
from psycopg.rows import dict_row
from fastapi import HTTPException


def fetch_events():
    conn = db_connection()

    with conn.cursor(row_factory=dict_row) as cursor:
        cursor.execute("SELECT * FROM events ORDER BY starts_at ASC, id ASC")
        events_list = cursor.fetchall()

    return {"events": events_list}

def fetch_event(id):
    conn = db_connection()
    
    with conn.cursor(row_factory=dict_row) as cursor:
        cursor.execute("""
                        SELECT
                        events.*,
                        venues.name AS venue_name,
                        venues.address AS venue_address,
                        venues.capacity AS venue_capacity
                        FROM events
                        LEFT JOIN venues ON events.venue_id = venues.id
                        WHERE events.id = %s
                    """, (id,))
        event = cursor.fetchone()
        
        if event is None:
            raise HTTPException(status_code=404, detail="Event not found.")
        
        return {"event":event}
        
        