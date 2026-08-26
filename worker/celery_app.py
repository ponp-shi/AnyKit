from celery import Celery

celery_app = Celery(
    "anykit-worker",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/1",
)
celery_app.autodiscover_tasks(["worker.tasks"])
