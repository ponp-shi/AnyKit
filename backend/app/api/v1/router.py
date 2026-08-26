from fastapi import APIRouter

from app.api.v1 import auth, storage, tasks

api_router = APIRouter()
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(storage.router, prefix="/storage", tags=["storage"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
