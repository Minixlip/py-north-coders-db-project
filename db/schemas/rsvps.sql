CREATE TABLE rsvps (
    id SERIAL PRIMARY KEY,
    attendee_id INT REFERENCES users(id),
    event_id INT REFERENCES events(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
