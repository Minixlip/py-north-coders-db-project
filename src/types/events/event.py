from datetime import datetime, timezone
from pydantic import BaseModel, field_validator
class Event(BaseModel):
    id: int
    title: str
    description : str | None
    starts_at : datetime
    ends_at: datetime
    organiser_id: int | None
    venue_id: int | None
    created_at: datetime | None
    
    
class EventWithVenue(Event):
    venue_name: str | None
    venue_address: str | None
    venue_capacity: int | None


class CreateNewEvent(BaseModel):
    title : str
    description :  str
    starts_at : datetime
    ends_at : datetime
    venue_id : int

    @field_validator("starts_at", "ends_at", mode="before")
    @classmethod
    def validate_dates(cls, value):
        if isinstance(value, datetime):
            return value
        if not isinstance(value, str):
            raise ValueError("Dates must be ISO 8601 strings.")
        return datetime.fromisoformat(value)


class CreateNewEventResponse(CreateNewEvent):
    id: int
    organiser_id : int
    created_at : datetime


class UpdatedEvent(BaseModel):
    title: str | None = None
    description: str | None = None
    starts_at: datetime | None = None
    ends_at: datetime | None = None
    venue_id: int | None = None

    @field_validator("starts_at", "ends_at", mode="before")
    @classmethod
    def validate_dates(cls, value):
        parsed = CreateNewEvent.validate_dates(value)
        return parsed if parsed.tzinfo else parsed.replace(tzinfo=timezone.utc)
