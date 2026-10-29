from fastapi import APIRouter,HTTPException, Depends
from src.security import check_access_token
from src.controller.events.events import fetch_events,fetch_event, create_event, update_event
from src.types.events.event import Event, EventWithVenue, CreateNewEvent, CreateNewEventResponse, UpdatedEvent
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



@router.post("", response_model=dict[str, CreateNewEventResponse], status_code=201)
def create_event_route(new_event: CreateNewEvent, user_id: int = Depends(check_access_token)):
    return {"event": create_event(new_event, user_id)}

@router.patch("/{id}", response_model=dict[str, Event], status_code=200)
def update_event_route(
    id: int, updated_fields: UpdatedEvent, user_id: int = Depends(check_access_token)
):
    return {"event": update_event(id, updated_fields, user_id)}
