from worker.celery_app import celery_app


@celery_app.task(bind=True)
def process_video(self, tool_type: str, input_object_key: str, parameters: dict):
    return {
        "tool_type": tool_type,
        "input_object_key": input_object_key,
        "parameters": parameters,
        "status": "not_implemented",
    }
