from fastapi import FastAPI
from src.routes.events.events import router as events_router

app = FastAPI()
app.include_router(events_router)