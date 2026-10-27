from datetime import datetime
from pydantic import BaseModel
class Event(BaseModel):
    id: int
    title: str
    description : str | None
    starts_at : datetime
    ends_at: datetime
    organiser_id: int | None
    venue_id: int | None
    created_at: datetime | None
    