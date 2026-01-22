# from minio import Minio
# from minio.error import S3Error
# from uuid import uuid4
# import os

# # ✅ Correct MinIO S3 API port
# MINIO_ENDPOINT = "localhost:9100"
# MINIO_ACCESS_KEY = "minioadmin"
# MINIO_SECRET_KEY = "minioadmin"
# MINIO_BUCKET_NAME = "request-files"

# # ✅ MinIO client using correct S3 API port
# minio_client = Minio(
#     MINIO_ENDPOINT,
#     access_key=MINIO_ACCESS_KEY,
#     secret_key=MINIO_SECRET_KEY,
#     secure=False,
# )

# def upload_file_to_minio(file, file_name):
#     # Ensure bucket exists
#     if not minio_client.bucket_exists(MINIO_BUCKET_NAME):
#         minio_client.make_bucket(MINIO_BUCKET_NAME)

#     # Upload file
#     minio_client.put_object(
#         bucket_name=MINIO_BUCKET_NAME,
#         object_name=file_name,
#         data=file.file,
#         length=-1,
#         part_size=10 * 1024 * 1024,
#         content_type=file.content_type
#     )
    
#     # Return the path to the file inside the bucket
#     return f"{MINIO_BUCKET_NAME}/{file_name}"
from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from uuid import uuid4
from minio import Minio
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db  # Import get_db from your database.py
from models import RequestFile, ServiceRequest  # Assuming you have models defined elsewhere
from pydantic import BaseModel

# MinIO setup
MINIO_ENDPOINT = "localhost:9100"
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin"
MINIO_BUCKET_NAME = "request-files"

# MinIO client
minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False,
)

# Pydantic model for file upload response
class FileUploadResponse(BaseModel):
    file_path: str
    file_name: str
    file_type: str
    file_size_mb: float
    uploaded_at: datetime

# Utility function to upload the file to MinIO
def upload_file_to_minio(file, file_name):
    # Ensure bucket exists
    if not minio_client.bucket_exists(MINIO_BUCKET_NAME):
        minio_client.make_bucket(MINIO_BUCKET_NAME)

    # Upload the file
    minio_client.put_object(
        bucket_name=MINIO_BUCKET_NAME,
        object_name=file_name,
        data=file.file,
        length=-1,
        part_size=10 * 1024 * 1024,
        content_type=file.content_type
    )

    # Return the path to the file inside the bucket
    return f"{MINIO_BUCKET_NAME}/{file_name}"

# FastAPI app setup
app = FastAPI()

# FastAPI endpoint to upload a file and associate it with a service request
@app.post("/upload-file/{request_id}", response_model=FileUploadResponse)
async def upload_file(request_id: str, file: UploadFile = File(...), db: Session = Depends(get_db)):
    # Check if the service request exists
    service_request = db.query(ServiceRequest).filter(ServiceRequest.request_id == request_id).first()
    if not service_request:
        raise HTTPException(status_code=404, detail="Service Request not found")

    # Generate unique file name (using UUID for uniqueness)
    file_name = f"{uuid4()}_{file.filename}"

    # Upload the file to MinIO
    file_path = upload_file_to_minio(file, file_name)

    # Insert record into RequestFiles table
    request_file = RequestFile(
        file_id=uuid4(),
        file_path=file_path,
        file_name=file_name,
        file_type=file.content_type,
        file_size_mb=len(file.file.read()) / (1024 * 1024),  # Convert size to MB
        uploaded_at=datetime.utcnow(),
    )
    db.add(request_file)
    db.commit()

    # Return file upload details
    return FileUploadResponse(
        file_path=file_path,
        file_name=file_name,
        file_type=file.content_type,
        file_size_mb=request_file.file_size_mb,
        uploaded_at=request_file.uploaded_at
    )

