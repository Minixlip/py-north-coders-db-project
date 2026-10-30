from db.connection import db_connection
from psycopg.rows import dict_row

def get_events_rsvp(user_id):
    
    conn = db_connection()
    
    with conn.transaction():
        with conn.cursor(row_factory=dict_row) as cursor:
            
            cursor.execute("""
                        SELECT events.id, events.title,events.starts_at,
                        rsvps.created_at AS rsvp_date,
                        ROW_NUMBER() OVER (
                        ORDER BY events.starts_at, events.id
                        ) AS event_rank,
                        COUNT(*) OVER () AS total_rsvps
                        FROM rsvps
                        JOIN events ON events.id = rsvps.event_id
                        WHERE rsvps.attendee_id = %s
                        ORDER BY events.starts_at, events.id
                        """,(user_id,))
            
            events_rsvp_list = cursor.fetchall()
            
    return events_rsvp_list
            