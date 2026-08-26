from fastapi import APIRouter

router = APIRouter()


@router.post("/webhook")
def payment_webhook():
    return {"status": "received"}
