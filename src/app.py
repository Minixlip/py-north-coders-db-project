from fastapi import FastAPI
from src.routes.auth.login.login import router as auth_router
from src.routes.events.events import router as events_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(events_router)
