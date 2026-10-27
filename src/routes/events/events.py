from fastapi import APIRouter,HTTPException
from db.connection import connection
from src.controller.events.events import fetch_events
from src.types.events.event import Event
router = APIRouter(prefix="/events")

@router.get("",response_model=dict[str,list[Event]], status_code=200)
def get_events():
    
    try:
        event_list = fetch_events()
    except Exception as e:
        raise HTTPException(status_code=500, detail=e)
    
    return(event_list)
    