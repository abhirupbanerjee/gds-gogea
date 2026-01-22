import requests
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from minio import Minio
from elasticsearch import Elasticsearch
import pdfplumber
import json
import io
from docx import Document
from datetime import datetime

# MinIO Client
minio_client = Minio(
    "localhost:9100",  # ✅ Ensure this is the API port, NOT the console port (9090)
    access_key="minioadmin",  # ✅ Check if credentials match your MinIO setup
    secret_key="minioadmin",
    secure=False
)

BUCKET_NAME = "mybucket"

# Elasticsearch Client
es = Elasticsearch("http://localhost:9200")


def extract_text_from_file(file_data: bytes, filename: str):
    """Extract text from JSON, PDF, and DOCX files"""
    if filename.endswith(".json"):
        return json.loads(file_data.decode("utf-8"))

    elif filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_data)) as pdf:
            return "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])

    elif filename.endswith(".docx"):
        doc = Document(io.BytesIO(file_data))
        return "\n".join([para.text for para in doc.paragraphs])

    return None


async def index_all_files():
    """Index all files in MinIO bucket"""
    try:
        objects = minio_client.list_objects(BUCKET_NAME, recursive=True)

        indexed_files = []
        for obj in objects:
            filename = obj.object_name
            response = minio_client.stat_object(BUCKET_NAME, filename)  # Get metadata
            last_modified = response.last_modified.isoformat()  # Convert date to string

            file_data = minio_client.get_object(BUCKET_NAME, filename).read()
            text = extract_text_from_file(file_data, filename)

            if text:
                es.index(index="documents", id=filename, body={
                    "content": text,
                    "date": last_modified  # ✅ Store last modified date
                })
                indexed_files.append(filename)

        return {"message": f"Indexed {len(indexed_files)} files", "files": indexed_files}

    except Exception as e:
        return {"error": str(e)}


async def search_documents(query: str = None, start_date: str = None, end_date: str = None):
    """Search for documents in Elasticsearch with multiple filters."""
    
    # Base query
    es_query = {"bool": {"must": [], "filter": []}}

    # Add text search if query is provided
    if query:
        es_query["bool"]["must"].append({"match": {"content": query}})

    # Add date range filter if provided
    if start_date or end_date:
        date_filter = {"range": {"date": {}}}
        if start_date:
            date_filter["range"]["date"]["gte"] = f"{start_date}T00:00:00"  # Ensure ISO format
        if end_date:
            date_filter["range"]["date"]["lte"] = f"{end_date}T23:59:59"
        es_query["bool"]["filter"].append(date_filter)

    # Perform search
    results = es.search(index="documents", body={"query": es_query})
    return results["hits"]["hits"]


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event for FastAPI"""
    await index_all_files()  # ✅ Automatically index files when API starts
    yield


app = FastAPI(lifespan=lifespan)

# Enable CORS (for frontend integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/articles")
async def get_articles():
    """Fetch articles from Drupal Headless API"""
    url = "http://localhost:8080/drupal_test/jsonapi/node/article"  # Fetch all articles
    headers = {"Accept": "application/vnd.api+json"}

    response = requests.get(url, headers=headers)

    if response.status_code != 200:
        return {"error": "Failed to fetch articles", "status_code": response.status_code}

    try:
        drupal_data = response.json()
        articles = drupal_data.get("data", [])

        if not articles:
            return {"message": "No articles found"}

        formatted_articles = [
            {
                "id": article.get("id", "N/A"),
                "title": article.get("attributes", {}).get("title", "No Title"),
                "body": article.get("attributes", {}).get("body", {}).get("value", "No Content"),
            }
            for article in articles
        ]

        return {"articles": formatted_articles}

    except requests.exceptions.JSONDecodeError:
        return {"error": "Invalid JSON response", "raw_response": response.text}


@app.get("/index_all/")
async def trigger_index_all():
    """Manually trigger indexing of all files"""
    return await index_all_files()


@app.get("/search_new/")
async def trigger_search_documents(query: str = None, start_date: str = None, end_date: str = None):
    """Manually trigger document search"""
    return await search_documents(query, start_date, end_date)



@app.get("/search-documents/")
async def search_documents(tag_key: str, tag_value: str):
    """
    Search for PDF documents in MinIO based on tag values.
    """
    matching_files = []

    # List all objects in the bucket
    objects = minio_client.list_objects(BUCKET_NAME, recursive=True)

    for obj in objects:
        try:
            # Get tags for each object
            tags = minio_client.get_object_tags(BUCKET_NAME, obj.object_name)
            if tags and tags.get(tag_key) == tag_value:
                matching_files.append({
                    "file_name": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified.strftime("%Y-%m-%d %H:%M:%S"),
                    "etag": obj.etag,
                    "tags": tags
                })
        except:
            continue  # Skip objects without tags

    if not matching_files:
        return {"message": "No documents found with the given tag."}

    return {"matching_documents": matching_files}
