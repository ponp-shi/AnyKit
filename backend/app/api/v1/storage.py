from uuid import uuid4

from fastapi import APIRouter
from pydantic import BaseModel, Field

router = APIRouter()


class PresignedUploadRequest(BaseModel):
    filename: str = Field(min_length=1)
    content_type: str = Field(min_length=1)
    size_bytes: int = Field(gt=0)


@router.post("/presigned-url")
def create_presigned_upload(payload: PresignedUploadRequest):
    object_key = f"inputs/{uuid4()}-{payload.filename}"
    return {
        "object_key": object_key,
        "upload_url": None,
        "expires_in": 900,
        "status": "storage_not_configured",
    }
