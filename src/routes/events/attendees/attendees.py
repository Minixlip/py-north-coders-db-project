from fastapi import APIRouter, Depends
from src.security import check_access_token
from src.controller.attendees.attendees import get_attendees


router = APIRouter(prefix="/api/events/{event_id}/attendees")


@router.get("", status_code=200)
def get_attendees_route(event_id: int, user_id: int = Depends(check_access_token)):
    return {"attendees": get_attendees(event_id, user_id)}
