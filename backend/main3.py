import requests
from fastapi.middleware.cors import CORSMiddleware
from minio import Minio
from elasticsearch import Elasticsearch
import pdfplumber
import json
import io
from docx import Document
from datetime import datetime
from contextlib import asynccontextmanager
from fastapi import FastAPI, Query, Response
import pandas as pd
from typing import List, Dict
from minio.error import S3Error
from fastapi.responses import RedirectResponse
from fastapi.responses import HTMLResponse
from bs4 import BeautifulSoup
import pandas as pd
import io
import re
from elasticsearch.exceptions import NotFoundError

# Lifespan event handler
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event handler to execute startup tasks."""
    await index_all_files()  # Automatically index all files in MinIO on startup
    yield  # Keep the application running

# Initialize FastAPI with lifespan
app = FastAPI(lifespan=lifespan)

# Enable CORS (for frontend integration)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Change this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
BASE_URL = "http://drupal"
HEADERS = {"Accept": "application/vnd.api+json"}
# Helper function to convert Drupal page HTML into structured sections
def convert_drupal_page(page, base_url=BASE_URL):
    soup = BeautifulSoup(page['body'], 'html.parser')
    sections = []
    banner_image = None

    for elem in soup.find_all(['p', 'img', 'ul', 'ol']):
        if elem.name == 'p':
            text = elem.get_text(strip=True)
            if text:
                sections.append({'type': 'text', 'content': text})

        elif elem.name == 'img':
            src = elem.get('src')
            alt = elem.get('alt', '')
            full_url = base_url + src if src and src.startswith('/') else src
            if not banner_image:
                banner_image = full_url
            sections.append({'type': 'image', 'url': full_url, 'alt': alt})

        elif elem.name in ['ul', 'ol']:
            items = [li.get_text(strip=True) for li in elem.find_all('li')]
            if items:
                sections.append({'type': 'list', 'items': items})

    return {
        'title': page.get('title'),
        'banner_image': banner_image,
        'sections': sections
    }

# Your route (works directly with FastAPI app)
@app.get("/drupal_pages_new")
async def get_basic_pages():
    url = f"{BASE_URL}/jsonapi/node/page"

    response = requests.get(url, headers=HEADERS)
    if response.status_code != 200:
        return {"error": "Failed to fetch pages", "status_code": response.status_code}

    try:
        drupal_data = response.json()
        pages = drupal_data.get("data", [])
        results = []

        for page in pages:
            attributes = page.get("attributes", {})
            simplified_page = {
                "id": page.get("id"),
                "title": attributes.get("title"),
                "body": attributes.get("body", {}).get("value")
            }

            # Convert the simplified page into structured format
            converted = convert_drupal_page(simplified_page)
            results.append(converted)

        return {"pages": results}

    except Exception as e:
        return {"error": "Exception occurred", "details": str(e)}

def parse_drupal_body(body_html: str):
    base_url = BASE_URL  # or use your domain when deployed

    soup = BeautifulSoup(body_html, "html.parser")

    sections = []

    for element in soup.find_all(['p', 'img']):
        if element.name == 'p':
            text = element.get_text(strip=True)
            if text:
                sections.append({
                    "type": "text",
                    "content": text
                })
        elif element.name == 'img':
            img_src = element.get("src")
            img_alt = element.get("alt", "")
            if img_src:
                sections.append({
                    "type": "image",
                    "url": base_url + img_src,
                    "alt": img_alt
                })

    return sections


@app.get("/drupal/pages")
async def get_basic_pages():
    url = f"{BASE_URL}/jsonapi/node/page"

    response = requests.get(url, headers=HEADERS)

    if response.status_code != 200:
        return {"error": f"Failed to fetch pages", "status_code": response.status_code}

    try:
        drupal_data = response.json()
        pages = drupal_data.get("data", [])
        page_list = []

        for page in pages:
            attributes = page.get("attributes", {})
            body_html = attributes.get("body", {}).get("value", "")

            page_list.append({
                "id": page.get("id"),
                "title": attributes.get("title"),
                "sections": parse_drupal_body(body_html)
            })

        return {"pages": page_list}

    except Exception as e:
        return {"error": "Exception occurred", "details": str(e)}
    

# Fetch articles from Drupal Headless API
@app.get("/articles")
async def get_articles():
    url = f"{BASE_URL}/jsonapi/node/article"  # Fetch all articles
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
    


# MinIO Client
minio_client = Minio(
    "minio:9000",  # ✅ Ensure this is the API port
    access_key="minioadmin",  # ✅ Check if credentials match your MinIO setup
    secret_key="minioadmin",
    secure=False
)

BUCKET_NAME = "mydocuments"

# Elasticsearch Client
es = Elasticsearch("http://elasticsearch:9200")

# ✅ Metadata Extraction Functions (Integrated)
def parse_text_metadata(text: str):
    """Extract metadata from plain text, ensuring no empty keys."""
    metadata = {}
    lines = text.split("\n")

    for line in lines:
        parts = line.split(":", 1)
        if len(parts) == 2:
            key, value = parts
            key, value = key.strip(), value.strip()
            if key:  # ✅ Ignore empty keys
                metadata[key] = value

    return metadata


def parse_excel_metadata(df):
    """Extract metadata from an Excel table, ensuring no empty keys."""
    metadata = {}

    for index, row in df.iterrows():
        if len(row) >= 2:
            key, value = str(row[0]).strip(), str(row[1]).strip()
            if key:  # ✅ Ignore empty keys
                metadata[key] = value

    return metadata



import re

def extract_pdf_table_metadata(pdf):
    """Extract metadata from a structured table inside a PDF, ensuring correct key-value mapping."""
    table_metadata = {}

    for page in pdf.pages:
        tables = page.extract_tables()
        for table in tables:
            for row in table:
                # Ensure row has at least three columns (S. No., Data Elements, Values)
                if len(row) >= 3:
                    key = row[1].strip() if row[1] else None  # Extract 'Data Elements' column
                    value = row[2].strip() if row[2] else None  # Extract 'Values' column

                    if key and value:  # Ensure valid key-value pairs
                        if key == "Document Version, Month, Year of Release":
                            # Split the value into parts
                            match = re.match(r"Version (\S+), (\w+) (\d{4})", value)
                            if match:
                                table_metadata["Document Version"] = f"Version {match.group(1)}"
                                table_metadata["Month"] = match.group(2)
                                table_metadata["Date"] = match.group(3)
                            else:
                                table_metadata[key] = value  # Fallback if the format doesn't match
                        else:
                            table_metadata[key] = value

    return table_metadata

def extract_excel_metadata(file_data: bytes):
    """Extracts metadata from an Excel sheet named 'Metadata' and returns it in the required format."""
    metadata = {}

    try:
        xls = pd.ExcelFile(io.BytesIO(file_data))
        print("Available sheets:", xls.sheet_names)  # Debug: Print available sheets

        if "Metadata" not in xls.sheet_names:
            print("❌ Sheet 'Metadata' not found! Check the sheet names in the Excel file.")
            return {}

        df = pd.read_excel(xls, sheet_name="Metadata", header=None)
        print("🔹 DataFrame read successfully:")
        print(df.head())  # Debug: Print first few rows

        if df.empty or df.shape[1] < 3:  # Ensure at least 3 columns exist
            print("❌ Sheet is empty or does not have enough columns.")
            return {}

        # Skip the first row if it contains headers (like "S. No." / "Data Elements / Values")
        if "S. No." in str(df.iloc[0, 0]) and "Data Elements" in str(df.iloc[0, 1]):
            df = df.iloc[1:]  # Skip first row
            print("🔹 Skipped first row (header detected)")

        # Extract key-value pairs from columns 1 and 2 (Data Elements and Values)
        for _, row in df.iterrows():
            key = str(row[1]).strip()  # Column 1: Data Elements
            value = str(row[2]).strip()  # Column 2: Values

            if key and value:  # Ensure valid key-value pairs
                if key == "Document Version, Month, Year of Release":
                    # Split the value into parts
                    match = re.match(r"Version (\S+), (\w+) (\d{4})", value)
                    if match:
                        metadata["Document Version"] = f"Version {match.group(1)}"
                        metadata["Month"] = match.group(2)
                        metadata["Date"] = match.group(3)
                    else:
                        metadata[key] = value  # Fallback if the format doesn't match
                else:
                    metadata[key] = value

        print("✅ Extracted metadata:", metadata)
        return metadata

    except Exception as e:
        print(f"❌ Error reading Excel file: {e}")


def extract_metadata_from_file(file_data: bytes, filename: str):
    """Extract metadata from PDF, Excel, and DOCX files and remove empty keys."""
    metadata = {}

    if filename.endswith(".pdf"):
        with pdfplumber.open(io.BytesIO(file_data)) as pdf:
            # Extract text-based metadata
            text = "\n".join([page.extract_text() for page in pdf.pages if page.extract_text()])
            metadata = parse_text_metadata(text)

            # Extract structured table metadata
            table_metadata = extract_pdf_table_metadata(pdf)

            # Merge extracted metadata
            metadata.update(table_metadata)

    elif filename.endswith(".xlsx"):
        # df = pd.read_excel(io.BytesIO(file_data))
        # with open(filename, "rb") as f:
        #      file_data = f.read()
        file_data = minio_client.get_object(BUCKET_NAME, filename.strip()).read()
        metadata = extract_excel_metadata(file_data) 
        #metadata = extract_excel_metadata(df)

    elif filename.endswith(".docx"):
        doc = Document(io.BytesIO(file_data))
        text = "\n".join([para.text for para in doc.paragraphs])
        metadata = parse_text_metadata(text)

    metadata["filename"] = filename

    # ✅ Extract and use meaningful metadata fields
    metadata["filename"] = filename.lower()
    metadata["status"] = metadata.get("Present Status", "Unknown").lower()
    metadata["language"] = metadata.get("Language", "Unknown").lower()

    # ✅ Remove empty keys
    metadata = {k: v for k, v in metadata.items() if k.strip()}

    return metadata


# ✅ Indexing Files from MinIO into Elasticsearch
async def index_all_files():
    """Index all files from MinIO into Elasticsearch."""
    try:
        objects = minio_client.list_objects(BUCKET_NAME, recursive=True)
        indexed_files = []

        for obj in objects:
            filename = obj.object_name
            response = minio_client.stat_object(BUCKET_NAME, filename)
            last_modified = response.last_modified.isoformat()

            file_data = minio_client.get_object(BUCKET_NAME, filename).read()
            metadata = extract_metadata_from_file(file_data, filename)
            metadata["date"] = last_modified

            # ✅ Ensure metadata is valid before indexing
            if metadata:
                es.index(index="documents", id=filename, body=metadata)
                indexed_files.append(filename)
                print(metadata)

        return {"message": f"Indexed {len(indexed_files)} files", "files": indexed_files}
    except Exception as e:
        return {"error": str(e)}


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan event to index files at startup."""
    await index_all_files()  # ✅ Index files when FastAPI starts
    yield




@app.get("/index_all/")
async def trigger_index_all():
    """Manually trigger indexing of all files"""
    return await index_all_files()


@app.post("/index")
async def index_document(document: dict):
    """Index a single document into Elasticsearch."""
    
    # ✅ Ensure there are no empty keys in the document
    document = {k: v for k, v in document.items() if k.strip()}

    if not document:
        return {"error": "Document contains only empty keys"}

    es.index(index="documents", body=document)
    return {"message": "Document indexed"}


@app.get("/filter-documents-old/")
async def filter_documents(
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
    identifier: str = Query(None),
    month: str = Query(None),
    document_version: str = Query(None),
    title: str = Query(None),
    title_alternative: str = Query(None),
    owner: str = Query(None),
    subject: str = Query(None),
    subject_category: str = Query(None),
    filename: str = Query(None),
    copyrights: str = Query(None),
    brief_description: str = Query(None),



):
    """Filter documents based on metadata fields."""
    es_query = {"bool": {"must": [], "filter": []}}

    filters = {
    "Present Status": status,
    "Publisher": publisher,
    "Document Version, Month, Year of Release ": year_of_publish,
    "month": month,  # New filter
    "document version": document_version,  # New filter
    "Type of Standard Document": document_type,
    "Enforcement Category": enforcement,
    "Creator": creator,
    "Contributor": contributor,
    "Target Audience": target_audience,
    "Format": format,
    "Language": language,
    "Coverage: Spatial": coverage,
    "Document Identifier": identifier,
    "Title": title,  # New filter
    "Title Alternative": title_alternative,  # New filter
    "Owner of Approved Standard ": owner,  # New filter
    "Subject": subject,  # New filter
    "Subject Category": subject_category,  # New filter
    "filename": filename,  # New filter
    "Copyrights": copyrights,  # New filter
    "Brief Description": brief_description,

}

   

    for key, value in filters.items():
        if value:
            es_query["bool"]["must"].append({"match_phrase": {key: value}}) 

        



    print("Elasticsearch Query:", json.dumps(es_query, indent=4))  # Debugging

    response = es.search(index="documents", body={"query": es_query})

    documents = [
        hit["_source"].get("filename", "Unknown") for hit in response["hits"]["hits"]
    ]

    return {"message": "Filter function works!", "documents": documents}


@app.get("/filter-documents/")
async def filter_documents(
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
    identifier: str = Query(None),
    month: str = Query(None),
    document_version: str = Query(None),
    title: str = Query(None),
    title_alternative: str = Query(None),
    owner: str = Query(None),
    subject: str = Query(None),
    subject_category: str = Query(None),
    filename: str = Query(None),
    copyrights: str = Query(None),
    brief_description: str = Query(None),
    date: str = Query(None),
):
    """Filter documents based on metadata fields."""
    es_query = {"bool": {"must": []}}

    filters = {
    "Present Status": status,
    "Publisher": publisher,
    "Document Version, Month, Year of Release ": year_of_publish,
    "month": month,  # New filter
    "document version": document_version,  # New filter
    "Type of Standard Document": document_type,
    "Enforcement Category": enforcement,
    "Creator": creator,
    "Contributor": contributor,
    "Target Audience": target_audience,
    "Format": format,
    "Language": language,
    "Coverage: Spatial": coverage,
    "Document Identifier": identifier,
    "Title": title,  # New filter
    "Title Alternative": title_alternative,  # New filter
    "Owner of Approved Standard ": owner,  # New filter
    "Subject": subject,  # New filter
    "Subject Category": subject_category,  # New filter
    "Filename": filename,  # New filter
    "Copyrights": copyrights,  # New filter
    "Brief Description": brief_description,
    "Date":date

}

    for key, value in filters.items():
        if value:  # ✅ Ensure value is not None
            es_query["bool"]["must"].append({"match_phrase": {key: value}})
            

    print("Filters being applied:", filters)
    print("Elasticsearch Query:", json.dumps(es_query, indent=4))  # Debugging
    print("Search Value:", list(es_query["bool"]["must"][0]["match_phrase"].values())[0])
    search_value =  list(es_query["bool"]["must"][0]["match_phrase"].values())[0]
    # ✅ Check if query contains at least one filter
    if not es_query["bool"]["must"]:
        print("not found query triggered")
        return {"message": "No filters provided!"}

    try:
        response = es.search(index="documents", body={"query": es_query})
        documents = [hit["_source"].get("filename", "Unknown") for hit in response["hits"]["hits"]]

        if not documents:  # ✅ Redirect if no documents found
            print("No documents found, redirecting...")
            #return RedirectResponse(url="/filter-document-title/")

        return {"message": "Filter function works!", "documents": documents}
        #return search_value

    except Exception as e:
        return {"error": str(e)}






@app.get("/filter-document-title/")
async def filter_documents(
    title: str = Query(None),
    title_alternative: str = Query(None),
    owner: str = Query(None),
    subject: str = Query(None),
    subject_category: str = Query(None),
    filename: str = Query(None),
    copyrights: str = Query(None),
    brief_description: str = Query(None),
):
    """Filter documents based on metadata fields."""
    es_query = {"bool": {"must": []}}

    filters = {
        "Title": title,  # Ensure case matches Elasticsearch stored field
        "Title Alternative": title_alternative,
        "Owner of Approved Standard": owner,  # New filter
        "Subject": subject,  # New filter
        "Subject Category": subject_category,  # New filter
        "filename": filename,  # New filter
        "Copyrights": copyrights,  # New filter
        "Brief Description": brief_description,

    }

    for key, value in filters.items():
        if value:
            es_query["bool"]["must"].append({"match_phrase": {key: value}})  # Use match_phrase for exact phrase match

    print("Elasticsearch Query:", json.dumps(es_query, indent=4))  # Debugging

    response = es.search(index="documents", body={"query": es_query})

    documents = [
        hit["_source"].get("filename", "Unknown") for hit in response["hits"]["hits"]
    ]

    return {"message": "Filter function works!", "documents": documents}



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


@app.get("/list-files", response_model=List[str])
def list_files():
    """API route to list all files in the MinIO bucket."""
    try:
        objects = minio_client.list_objects(BUCKET_NAME, recursive=True)
        file_list = [obj.object_name for obj in objects]
        return file_list
    except Exception as e:
        return {"error": str(e)}


@app.get("/list-files-with-tags", response_model=Dict[str, Dict[str, str]])
async def list_files_with_tags():
    """
    List all files in MinIO with their tags.
    """
    files_with_tags = {}

    try:
        # Get list of all files
        objects = minio_client.list_objects(BUCKET_NAME, recursive=True)

        for obj in objects:
            try:
                # Fetch object tags
                tags = minio_client.get_object_tags(BUCKET_NAME, obj.object_name)
                
                # Store filename with its tags
                files_with_tags[obj.object_name] = tags if tags else {}

            except S3Error as e:
                print(f"Error fetching tags for {obj.object_name}: {str(e)}")

    except S3Error as e:
        return {"error": str(e)}

    return files_with_tags


@app.get("/download-file/{file_name}")
async def download_file(file_name: str):
    """
    Download a file from MinIO and return it as a response.
    """
    try:
        # Get the file from MinIO
        file_obj = minio_client.get_object(BUCKET_NAME, file_name)
        
        # Read the file data
        file_data = file_obj.read()

        # Return the file as a response
        return Response(content=file_data, media_type="application/octet-stream",
                        headers={"Content-Disposition": f'attachment; filename="{file_name}"'})

    except S3Error as e:
        return {"error": str(e)}
    

from typing import List, Optional



INDEX_NAME = "documents"

@app.get("/search/")
async def search_documents(
    title: Optional[str] = None,
    title_alternative: Optional[str] = None,
    document_identifier: Optional[str] = None,
    document_version: Optional[str] = None,
    month: Optional[str] = None,
    date: Optional[str] = None,
    status: Optional[str] = None,
    publisher: Optional[str] = None,
    document_type: Optional[str] = None,
    enforcement: Optional[str] = None,
    creator: Optional[str] = None,
    contributor: Optional[str] = None,
    brief_description: Optional[str] = None,
    target_audience: Optional[str] = None,
    owner: Optional[str] = None,
    subject: Optional[str] = None,
    subject_category: Optional[str] = None,
    coverage: Optional[str] = None,
    format: Optional[str] = None,
    language: Optional[str] = None,
    copyrights: Optional[str] = None,
    filename: Optional[str] = None
):
    query = {"bool": {"must": []}}

    filters = {
        "Title.keyword": title,
        "Title Alternative.keyword": title_alternative,
        "Document Identifier.keyword": document_identifier,
        "Document Version.keyword": document_version,
        "Month.keyword": month,
        "Date.keyword": date,
        "Present Status.keyword": status,
        "Publisher.keyword": publisher,
        "Type of Standard Document.keyword": document_type,
        "Enforcement Category.keyword": enforcement,
        "Creator.keyword": creator,
        "Contributor.keyword": contributor,
        "Brief Description.keyword": brief_description,
        "Target Audience.keyword": target_audience,
        "Owner of Approved Standard.keyword": owner,
        "Subject.keyword": subject,
        "Subject Category.keyword": subject_category,
        "Coverage: Spatial.keyword": coverage,
        "Language.keyword": language,
        "Copyrights.keyword": copyrights,
    }

    # Exact match filters
    for field, value in filters.items():
        if value:
            query["bool"]["must"].append({"term": {field: value}})

    # Partial match for `filename` and `format`
    # if filename:
    #     query["bool"]["must"].append({"match_phrase": {"filename": filename}})
    must_conditions = []
    if filename:
        query["bool"]["must"].append({"wildcard": {"filename.keyword": f"*{filename}*"}})

    if format:
        query["bool"]["must"].append({"match_phrase": {"Format": format}})
    
    if title_alternative:
        query["bool"]["must"].append({"wildcard": {"Title Alternative.keyword": f"*{title_alternative}*"}})

       
    response = es.search(index=INDEX_NAME, query=query, size=100)

    filenames = [hit["_source"]["filename"] for hit in response["hits"]["hits"]]

    return {"filenames": filenames}



@app.get("/files/descriptions")
async def get_file_description(filename: str = Query(..., description="Enter the filename")):
    INDEX_NAME = "documents"  # Correct index name
    query = {
        "bool": {
            "must": [
                {"match": {"filename": filename}}  # Match query for case insensitivity
            ]
        }
    }

    response = es.search(index=INDEX_NAME, query=query, size=1)

    if response["hits"]["hits"]:
        file_metadata = response["hits"]["hits"][0]["_source"]
        brief_description = file_metadata.get("Brief Description", "No description available")
        return {"Brief Description": brief_description}
    
    return {"error": "File not found"}


@app.get("/combined-search/")
def combined_search(title: str = Query(..., description="Search query for title or tag")):
    # --- Elasticsearch query ---
    es_query = {
        "query": {
            "bool": {
                "should": [
                    {"match_phrase": {"Title": title}},
                    {"term": {"Title Alternative.keyword": title}},
                    {"term": {"Document Identifier.keyword": title}},
                    {"match_phrase": {"Document Version": title}},
                    {"match_phrase": {"Month": title}},
                    {"match_phrase": {"Date": title}},
                    {"match_phrase": {"Publisher": title}},
                    {"match_phrase": {"Type of Standard Document": title}},
                    {"match_phrase": {"Enforcement Category": title}},
                    {"match_phrase": {"Creator": title}},
                    {"match_phrase": {"Contributor": title}},
                    {"match_phrase": {"Brief Description": title}},
                    {"match_phrase": {"Target Audience": title}},
                    {"match_phrase": {"Owner of Approved Standard": title}},
                    {"match_phrase": {"Subject": title}},
                    {"match_phrase": {"Subject Category": title}},
                    {"match_phrase": {"Coverage: Spatial": title}},
                    {"match_phrase": {"Format": title}},
                    {"match_phrase": {"Language": title}},
                    {"match_phrase": {"Copyrights": title}},
                    {"wildcard": {"filename.keyword": f"*{title}*"}},
                    {"match": {"filename": title}}
                ],
                "minimum_should_match": 1
            }
        }
    }

    es_response = es.search(index="documents", body=es_query)
    elastic_files = [
        hit["_source"]["filename"]
        for hit in es_response["hits"]["hits"]
        if "filename" in hit["_source"]
    ]

    # --- MinIO tag-based search ---
    minio_matches = []
    objects = minio_client.list_objects(BUCKET_NAME, recursive=True)
    for obj in objects:
        try:
            tags = minio_client.get_object_tags(BUCKET_NAME, obj.object_name)
            # Here we use title as both key and value
            if tags and tags.get(title) == title:
                minio_matches.append({
                    "file_name": obj.object_name,
                    "size": obj.size,
                    "last_modified": obj.last_modified.strftime("%Y-%m-%d %H:%M:%S"),
                    "etag": obj.etag,
                    "tags": tags
                })
        except:
            continue

    return {
        "elasticsearch_results": elastic_files,
        "minio_results": minio_matches or "No documents found with the given tag."
    }


@app.get("/preview-file/{file_name}")
def preview_file(file_name: str):
    """
    Returns a preview of the file from MinIO.
    - For PDF files: returns the first page as a PNG image.
    - For Excel (.xlsx) files: returns an HTML table preview from the sheet named "Title"
      (if exists, otherwise the first sheet).
    """
    if file_name.lower().endswith(".pdf"):
        try:
            # Fetch PDF data from MinIO
            file_obj = minio_client.get_object(BUCKET_NAME, file_name)
            file_data = file_obj.read()

            # Open PDF and convert the first page to an image using pdfplumber
            with pdfplumber.open(io.BytesIO(file_data)) as pdf:
                if len(pdf.pages) == 0:
                    return {"error": "No pages found in PDF."}
                first_page = pdf.pages[0]
                pdf_image = first_page.to_image(resolution=150)

                # Save the image to a BytesIO buffer
                img_buffer = io.BytesIO()
                pdf_image.save(img_buffer, format="PNG")
                img_buffer.seek(0)

            # Return the image as a PNG response
            return Response(content=img_buffer.getvalue(), media_type="image/png")

        except Exception as e:
            return {"error": str(e)}

    elif file_name.lower().endswith(".xlsx"):
        try:
            # Fetch Excel file from MinIO
            file_obj = minio_client.get_object(BUCKET_NAME, file_name)
            file_data = file_obj.read()

            # Load Excel file
            xls = pd.ExcelFile(io.BytesIO(file_data))
            # Use the sheet named "Title" if it exists, otherwise fall back to the first sheet.
            sheet_name = "Title" if "Title" in xls.sheet_names else xls.sheet_names[0]
            df = pd.read_excel(xls, sheet_name=sheet_name)
            # Take a preview (first 5 rows)
            preview_df = df.head(5)
            # Convert the DataFrame to an HTML table
            html_content = preview_df.to_html(index=False, border=1)

            # Return the HTML content
            return HTMLResponse(content=html_content)

        except Exception as e:
            return {"error": str(e)}

    else:
        return {"error": "Preview is only supported for PDF and Excel (.xlsx) files."}
    


@app.get("/file-metadata/")
async def get_file_metadata(
    filename: str = Query(..., description="Enter the filename to retrieve its metadata")
):
    """
    Retrieve the following metadata for the given filename:
    - Document Version
    - Present Status
    - Publisher
    - Date of Publishing
    """
    try:
        # Case-insensitive match query
        query = {
            "query": {
                "match": {
                    "filename": filename
                }
            }
        }
        response = es.search(index="documents", body=query)

        hits = response["hits"]["hits"]
        if not hits:
            return {"error": "File not found in Elasticsearch."}

        file_metadata = hits[0]["_source"]

        result = {
            "Document Version": file_metadata.get("Document Version", "Not available"),
            "Present Status": file_metadata.get("Present Status", "Not available"),
            "Publisher": file_metadata.get("Publisher", "Not available"),
            "Date of Publishing": file_metadata.get("Date of Publishing", "Not available"),
        }
        return result
    except NotFoundError:
        return {"error": "File not found in Elasticsearch."}
    except Exception as e:
        return {"error": f"An error occurred: {str(e)}"}
    


# @app.get("/file-metadata/")
# async def get_file_metadata(
#     filename: str = Query(..., description="Enter the filename to retrieve its metadata")
# ):
#     """
#     Retrieve the following metadata for the given filename:
#     - Document Version
#     - Present Status
#     - Publisher
#     """
#     try:
#         # Retrieve the document from Elasticsearch using the filename as the document ID.
#         doc = es.get(index="documents", id=filename)
#         file_metadata = doc["_source"]
        
#         # Build the result dictionary using the desired keys.
#         result = {
#             "Document Version": file_metadata.get("Document Version", "Not available"),
#             "Present Status": file_metadata.get("Present Status", "Not available"),
#             "Publisher": file_metadata.get("Publisher", "Not available"),
#             "Date of Publishing": file_metadata.get("Date of Publishing", "Not available"),
#         }
#         return result
#     except Exception as e:
#         return {"error": f"File not found or an error occurred: {str(e)}"}
