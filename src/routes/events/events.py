from fastapi import APIRouter,HTTPException
from src.controller.events.events import fetch_events,fetch_event
from src.types.events.event import Event, EventWithVenue
router = APIRouter(prefix="/api/events")

@router.get("",response_model=dict[str,list[Event]], status_code=200)
def get_events():
    
    try:
        event_list = fetch_events()
    except Exception as e:
        raise HTTPException(status_code=500, detail=e)
    
    return(event_list)

@router.get("/{id}", response_model=dict[str, EventWithVenue])
def get_event(id: int):
    return fetch_event(id)