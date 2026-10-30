from fastapi import APIRouter, Depends
from src.security import check_access_token
from src.controller.user.user import get_events_rsvp
router = APIRouter(prefix="/api/user/me/events")


@router.get("")
def get_events_rsvp_route(user_id: int = Depends(check_access_token)):
    
    return {"events": get_events_rsvp(user_id)}