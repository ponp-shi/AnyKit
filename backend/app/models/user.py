from dataclasses import dataclass


@dataclass
class User:
    id: str
    email: str
    tier: str = "free"
    credits: int = 50
