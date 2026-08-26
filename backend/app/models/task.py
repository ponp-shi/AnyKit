from dataclasses import dataclass, field
from datetime import datetime, timezone


@dataclass
class Task:
    id: str
    user_id: str | None
    tool_type: str
    status: str = "pending"
    input_s3_key: str | None = None
    output_s3_key: str | None = None
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
