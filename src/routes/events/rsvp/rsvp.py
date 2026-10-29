from fastapi import APIRouter, Depends, dependencies
from src.controller.rsvp.rsvp import rsvp_event, delete_rsvp
from src.security import check_access_token

router = APIRouter(prefix="/api/events/{id}/rsvp")


@router.post("", status_code=201)
def rsvp_post_route(id: int, user_id: int = Depends(check_access_token)):
    return {"rsvp": rsvp_event(id, user_id)}


@router.delete("/me", status_code=204 )
def rsvp_delete_route(id: int, user_id: int = Depends(check_access_token)):
    
    delete_rsvp(id,user_id)
    return
    