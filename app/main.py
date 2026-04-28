from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.api.router import api_router
from app.core.config import get_settings
from app.core.database import init_db


@asynccontextmanager
async def lifespan(_: FastAPI):
    init_db()
    yield


settings = get_settings()

app = FastAPI(
    title=settings.app_name,
    lifespan=lifespan,
)
app.include_router(api_router, prefix="/api")


@app.get("/", tags=["root"])
def root() -> dict[str, str]:
    return {"message": settings.app_name}
