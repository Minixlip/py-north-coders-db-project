from db.connection import db_connection
from psycopg import sql
from psycopg.rows import dict_row
from fastapi import HTTPException
from src.types.events.event import CreateNewEvent, UpdatedEvent


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
        

def create_event(new_event: CreateNewEvent, user_id: int):
    conn = db_connection()
    with conn.transaction():
        with conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                """
                INSERT INTO events (title, description, starts_at, ends_at, venue_id, organiser_id)
                VALUES (%s, %s, %s, %s, %s, %s)
                RETURNING *
                """,
                (
                    new_event.title,
                    new_event.description,
                    new_event.starts_at,
                    new_event.ends_at,
                    new_event.venue_id,
                    user_id,
                ),
            )
            return cursor.fetchone()


def update_event(event_id: int, updated_fields: UpdatedEvent, user_id: int):
    conn = db_connection()
    changes = updated_fields.model_dump(exclude_unset=True)
    with conn.transaction():
        with conn.cursor(row_factory=dict_row) as cursor:
            cursor.execute(
                "SELECT * FROM events WHERE id = %s FOR UPDATE", (event_id,)
            )
            event = cursor.fetchone()
            if event is None:
                raise HTTPException(status_code=404, detail="Event not found.")
            if event["organiser_id"] != user_id:
                raise HTTPException(status_code=403, detail="Only the organiser can update this event.")
            if not changes:
                return event
            if "title" in changes and changes["title"] is None:
                raise HTTPException(status_code=400, detail="Title cannot be null.")

            if "starts_at" in changes or "ends_at" in changes:
                starts_at = changes.get("starts_at", event["starts_at"])
                ends_at = changes.get("ends_at", event["ends_at"])
                if ends_at <= starts_at:
                    raise HTTPException(status_code=400, detail="ends_at must be after starts_at.")

            assignments = sql.SQL(", ").join(
                sql.SQL("{} = %s").format(sql.Identifier(field)) for field in changes
            )
            cursor.execute(
                sql.SQL("UPDATE events SET {} WHERE id = %s RETURNING *").format(assignments),
                (*changes.values(), event_id),
            )
            return cursor.fetchone()
