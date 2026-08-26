FROM python:3.12-slim
WORKDIR /workspace
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip install --no-cache-dir -r /tmp/requirements.txt
COPY worker ./worker
