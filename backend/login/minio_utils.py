# minio_utils.py
import boto3
from botocore.client import Config
from fastapi import UploadFile
import uuid

MINIO_ENDPOINT = "localhost:9100"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin"
MINIO_BUCKET_NAME = "request-files"

# MinIO client
s3_client = boto3.client(
    "s3",
    endpoint_url=f"http://{MINIO_ENDPOINT}",
    aws_access_key_id=MINIO_ACCESS_KEY,
    aws_secret_access_key=MINIO_SECRET_KEY,
    config=Config(signature_version="s3v4"),
    region_name="us-east-1"
)

def upload_file_to_minio(file: UploadFile) -> str:
    unique_name = f"{uuid.uuid4()}_{file.filename}"
    s3_client.upload_fileobj(
        file.file,
        MINIO_BUCKET_NAME,
        unique_name,
        ExtraArgs={"ContentType": file.content_type}
    )
    return f"{MINIO_BUCKET_NAME}/{unique_name}"
