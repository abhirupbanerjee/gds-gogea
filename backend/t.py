import io
import json
import pdfplumber
import pandas as pd
from docx import Document
from minio import Minio
from elasticsearch import Elasticsearch
from fastapi import FastAPI, Query

app = FastAPI()

# ✅ Elasticsearch Configuration
ES_HOST = "http://localhost:9200"
INDEX_NAME = "documents"

es = Elasticsearch([ES_HOST])

# ✅ MinIO Configuration
MINIO_ENDPOINT = "localhost:9100"  # Use 9090 as per your setup
MINIO_ACCESS_KEY = "minioadmin"
MINIO_SECRET_KEY = "minioadmin"
BUCKET_NAME = "mybucket"

minio_client = Minio(
    MINIO_ENDPOINT,
    access_key=MINIO_ACCESS_KEY,
    secret_key=MINIO_SECRET_KEY,
    secure=False
)


# ✅ Function to Parse Text-Based Metadata
def parse_text_metadata(text: str):
    """Extract metadata from plain text."""
    metadata = {}
    lines = text.split("\n")

    for line in lines:
        parts = line.split(":", 1)
        if len(parts) == 2:
            key, value = parts
            key, value = key.strip(), value.strip()
            if key:
                metadata[key] = value

    return metadata


# ✅ Function to Parse Excel Metadata
def parse_excel_metadata(df):
    """Extract metadata from an Excel table."""
    metadata = {}

    for index, row in df.iterrows():
        if len(row) >= 2:
            key, value = str(row[0]).strip(), str(row[1]).strip()
            if key:
                metadata[key] = value

    return metadata


# ✅ Extract PDF Table Metadata
def extract_pdf_table_metadata(pdf):
    """Extract metadata from a structured table inside a PDF."""
    table_metadata = {}

    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                if len(row) >= 3:
                    key = row[1].strip() if row[1] else None
                    value = row[2].strip() if row[2] else None

                    if key and value:
                        table_metadata[key] = value

    return table_metadata


# ✅ Extract Metadata from Files
def extract_metadata_from_file(file_data: bytes, filename: str):
    """Extract metadata from PDF, Excel, and DOCX files."""
    metadata = {}

    if filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_data)) as pdf:
            text = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
            metadata = parse_text_metadata(text)
            table_metadata = extract_pdf_table_metadata(pdf)
            metadata.update(table_metadata)

    elif filename.endswith(".xlsx"):
        df = pd.read_excel(io.BytesIO(file_data), sheet_name="Metadata")
        if not df.empty and df.shape[1] >= 2:
            metadata = parse_excel_metadata(df)

    elif filename.endswith(".docx"):
        doc = Document(io.BytesIO(file_data))
        text = "\n".join([para.text for para in doc.paragraphs])
        metadata = parse_text_metadata(text)

    metadata = {k.lower(): v.lower() for k, v in metadata.items() if k.strip()}

    metadata["filename"] = filename.lower()
    metadata["status"] = metadata.get("present status", "unknown").lower()
    metadata["language"] = metadata.get("language", "unknown").lower()

    return metadata


# ✅ Generate Pre-signed URL for MinIO Object
def get_minio_file_url(bucket_name, object_name):
    """Generate a pre-signed URL for a file in MinIO."""
    return minio_client.presigned_get_object(bucket_name, object_name)


# ✅ Process All Files in MinIO Bucket
@app.post("/index-documents/")
def process_minio_documents():
    """Extract metadata from all documents in MinIO and index them in Elasticsearch."""
    objects = minio_client.list_objects(BUCKET_NAME, recursive=True)
    indexed_files = []

    for obj in objects:
        object_name = obj.object_name
        try:
            file_data = minio_client.get_object(BUCKET_NAME, object_name).read()
            metadata = extract_metadata_from_file(file_data, object_name)

            metadata["file_url"] = get_minio_file_url(BUCKET_NAME, object_name)
            
            # Index metadata in Elasticsearch
            es.index(index=INDEX_NAME, document=metadata)
            indexed_files.append(object_name)
        except Exception as e:
            return {"error": f"Error processing {object_name}: {e}"}

    return {"message": "Indexed files", "files": indexed_files}


# ✅ List All Files in MinIO
@app.get("/list-files/")
def list_minio_files():
    """List all files in the MinIO bucket."""
    objects = minio_client.list_objects(BUCKET_NAME, recursive=True)
    files = [{"filename": obj.object_name, "url": get_minio_file_url(BUCKET_NAME, obj.object_name)} for obj in objects]
    return {"files": files}


# ✅ Filter Documents in Elasticsearch
@app.get("/search-documents/")
def filter_documents(
    status: str = Query(None),
    publisher: str = Query(None),
    year_of_publish: str = Query(None),
    document_type: str = Query(None),
    enforcement: str = Query(None),
    creator: str = Query(None),
    contributor: str = Query(None),
    target_audience: str = Query(None),
    format: str = Query(None),
    language: str = Query(None),
    coverage: str = Query(None),
    title: str = Query(None),
    version: str = Query(None),
    description: str = Query(None),
    owner: str = Query(None),
):
    """Search and filter documents based on metadata fields."""
    filters = {
        "status": status,
        "publisher": publisher,
        "year_of_publish": year_of_publish,
        "document_type": document_type,
        "enforcement": enforcement,
        "creator": creator,
        "contributor": contributor,
        "target_audience": target_audience,
        "format": format,
        "language": language,
        "coverage": coverage,
        "title": title,
        "version": version,
        "description": description,
        "owner": owner,
    }
    
    query = {
        "bool": {
            "must": [{"match": {key: value}} for key, value in filters.items() if value]
        }
    }

    response = es.search(index=INDEX_NAME, query=query)
    results = [{"filename": doc["_source"]["filename"], "metadata": doc["_source"]} for doc in response["hits"]["hits"]]

    return {"count": len(results), "documents": results}


# ✅ Run FastAPI Server
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
