from fastapi import APIRouter
from pydantic import BaseModel

from src.controller.venues.venues import fetch_venues


class VenueOption(BaseModel):
    id: int
    name: str
    address: str | None


router = APIRouter(prefix="/api/venues")


@router.get("", response_model=dict[str, list[VenueOption]])
def get_venues():
    return {"venues": fetch_venues()}
