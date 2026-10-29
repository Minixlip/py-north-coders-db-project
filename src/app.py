from fastapi import FastAPI
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from src.routes.auth.login.login import router as auth_router
from src.routes.events.events import router as events_router
from src.routes.events.rsvp.rsvp import router as rsvp_router

app = FastAPI()
app.include_router(auth_router)
app.include_router(events_router)
app.include_router(rsvp_router)


@app.exception_handler(RequestValidationError)
async def validation_error_handler(request, exc):
    if request.method == "POST" and request.url.path == "/api/events":
        return JSONResponse(
            status_code=400, content={"detail": "Missing or invalid event fields."}
        )
    if request.url.path == "/api/auth/register":
        return JSONResponse(
            status_code=400, content={"detail": "Invalid registration details."}
        )
    return await request_validation_exception_handler(request, exc)
