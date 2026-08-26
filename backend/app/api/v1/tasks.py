from enum import Enum
from uuid import uuid4

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.v1.auth import get_current_user, require_tool

router = APIRouter()
_tasks: dict[str, dict] = {}


class ToolType(str, Enum):
    VIDEO_TO_GIF = "video_to_gif"
    VIDEO_FRAME_EXTRACTOR = "video_frame_extractor"


class TaskRequest(BaseModel):
    tool_type: ToolType
    input_object_key: str = Field(min_length=1)
    parameters: dict = Field(default_factory=dict)


@router.post("")
def create_task(payload: TaskRequest, user: dict = Depends(get_current_user)):
    require_tool(payload.tool_type.value.replace("_", "-"), user)
    task_id = str(uuid4())
    task = {
        "id": task_id,
        "tool_type": payload.tool_type,
        "status": "pending",
        "input_object_key": payload.input_object_key,
        "output_object_key": None,
        "parameters": payload.parameters,
        "user_id": user["id"],
    }
    _tasks[task_id] = task
    return task


@router.get("/{task_id}")
def get_task(task_id: str, user: dict = Depends(get_current_user)):
    task = _tasks.get(task_id)
    if task is None or task.get("user_id") != user["id"]:
        return {"id": task_id, "status": "not_found"}
    return task
