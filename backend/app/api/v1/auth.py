from datetime import datetime, timedelta, timezone
from hashlib import pbkdf2_hmac
from secrets import token_hex
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from pydantic import BaseModel, Field

from app.core.config import settings

router = APIRouter()
bearer = HTTPBearer(auto_error=False)
TOOLS = [
    "video-to-gif", "video-frame-extractor", "video-compressor", "video-to-audio",
    "image-compressor", "pdf-merge", "json-formatter", "qr-generator",
]


def _hash(password: str, salt: str | None = None) -> str:
    salt = salt or token_hex(16)
    digest = pbkdf2_hmac("sha256", password.encode(), salt.encode(), 120_000).hex()
    return salt + "$" + digest


def _matches(password: str, stored: str) -> bool:
    salt, expected = stored.split("$", 1)
    return _hash(password, salt).split("$", 1)[1] == expected


def _public(user: dict) -> dict:
    return {
        "id": user["id"],
        "username": user["username"],
        "email": user.get("email", ""),
        "role": user["role"],
        "tier": user.get("tier", "free"),
        "credits": user.get("credits", 50),
        "permissions": TOOLS[:] if user["role"] == "admin" else user["permissions"][:],
    }


_users: dict[str, dict] = {
    "admin": {
        "id": "admin",
        "username": "admin",
        "email": "",
        "password_hash": _hash("admin", "anykit-admin-salt"),
        "role": "admin",
        "tier": "pro",
        "credits": 999999,
        "permissions": TOOLS[:],
    },
}


class LoginRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64)
    password: str = Field(min_length=1, max_length=128)


class UserCreateRequest(BaseModel):
    username: str = Field(min_length=1, max_length=64, pattern=r"^[a-zA-Z0-9_.-]+$")
    password: str = Field(min_length=4, max_length=128)
    email: str = ""
    permissions: list[str] = Field(default_factory=list)


class PermissionUpdateRequest(BaseModel):
    permissions: list[str] = Field(default_factory=list)


def _valid_permissions(permissions: list[str]) -> list[str]:
    return list(dict.fromkeys(item for item in permissions if item in TOOLS))


def _token(user: dict) -> str:
    expires = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_minutes)
    return jwt.encode({"sub": user["id"], "exp": expires}, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def get_current_user(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> dict:
    if credentials is None:
        raise HTTPException(status_code=401, detail="\u8bf7\u5148\u767b\u5f55")
    try:
        payload = jwt.decode(credentials.credentials, settings.jwt_secret, algorithms=[settings.jwt_algorithm])
        user_id = payload.get("sub")
    except JWTError as error:
        raise HTTPException(status_code=401, detail="\u767b\u5f55\u5df2\u8fc7\u671f\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55") from error
    user = next((item for item in _users.values() if item["id"] == user_id), None)
    if user is None:
        raise HTTPException(status_code=401, detail="\u7528\u6237\u4e0d\u5b58\u5728")
    return user


def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user["role"] != "admin":
        raise HTTPException(status_code=403, detail="\u4ec5\u7ba1\u7406\u5458\u53ef\u4ee5\u6267\u884c\u6b64\u64cd\u4f5c")
    return user


def require_tool(tool_id: str, user: dict) -> None:
    if user["role"] != "admin" and tool_id not in user["permissions"]:
        raise HTTPException(status_code=403, detail="\u5f53\u524d\u8d26\u6237\u6ca1\u6709\u6b64\u5de5\u5177\u6743\u9650")


@router.post("/login")
def login(payload: LoginRequest):
    user = _users.get(payload.username)
    if user is None or not _matches(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="\u7528\u6237\u540d\u6216\u5bc6\u7801\u9519\u8bef")
    return {"access_token": _token(user), "token_type": "bearer", "user": _public(user)}


@router.get("/me")
def current_user(user: dict = Depends(get_current_user)):
    return _public(user)


@router.get("/tools")
def available_tools():
    return {"tools": TOOLS}


@router.get("/users")
def list_users(_: dict = Depends(require_admin)):
    return {"users": [_public(user) for user in _users.values()]}


@router.post("/users", status_code=201)
def create_user(payload: UserCreateRequest, _: dict = Depends(require_admin)):
    if payload.username in _users:
        raise HTTPException(status_code=409, detail="\u7528\u6237\u540d\u5df2\u5b58\u5728")
    user = {
        "id": str(uuid4()),
        "username": payload.username,
        "email": payload.email,
        "password_hash": _hash(payload.password),
        "role": "user",
        "tier": "free",
        "credits": 50,
        "permissions": _valid_permissions(payload.permissions),
    }
    _users[payload.username] = user
    return _public(user)


@router.patch("/users/{user_id}/permissions")
def update_permissions(user_id: str, payload: PermissionUpdateRequest, _: dict = Depends(require_admin)):
    user = next((item for item in _users.values() if item["id"] == user_id), None)
    if user is None:
        raise HTTPException(status_code=404, detail="\u7528\u6237\u4e0d\u5b58\u5728")
    user["permissions"] = TOOLS[:] if user["role"] == "admin" else _valid_permissions(payload.permissions)
    return _public(user)

