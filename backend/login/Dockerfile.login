# Dockerfile.login

FROM python:3.10-slim

WORKDIR /app

# Copy login app and requirements
COPY . /app

RUN pip install --no-cache-dir -r requirements.txt

# Entry point is login/auth app
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8002"]
