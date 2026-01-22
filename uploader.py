from minio import Minio
from minio.error import S3Error
from minio.commonconfig import Tags
import os

# MinIO connection
minio_client = Minio(
    "minio:9000",  # IMPORTANT: Use container name inside Docker network
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False
)
# Define buckets to ensure exist
buckets = [
    "mydocuments",          # existing bucket
    "gogdocuments"          # new bucket for different use
]

# Create buckets if they don't exist
for bucket_name in buckets:
    try:
        if not minio_client.bucket_exists(bucket_name):
            minio_client.make_bucket(bucket_name)
            print(f"Created bucket: {bucket_name}")
        else:
            print(f"Bucket already exists: {bucket_name}")
    except S3Error as e:
        print(f"Error ensuring bucket {bucket_name}: {e}")

bucket_name = "mydocuments"
folder_path = "/data"  # Inside Docker container mount

# # Ensure bucket exists
# if not minio_client.bucket_exists(bucket_name):
#     minio_client.make_bucket(bucket_name)

# Define tags
file_tags = {
    "Digital Grenada.pdf": {"Digital Grenada": "Digital Grenada"},
    "Roadmap tookit.xlsx": {"GEA": "GEA", "roadmap": "roadmap","toolkit":"toolkit"},
    "eGovernment Maturity Model.pdf": {"GEA": "GEA"},
    "eGovernment Maturity model.xlsx": {"GEA": "GEA", "architecture capability": "architecture capability","assessment":"assessment","compliance":"compliance","eGovernment":"eGovernment","maturity model":"maturity model","toolkit":"toolkit"},
    "Grenada Enterprise Architecture Framework.pdf": {"Framework": "Framework", "GEA": "GEA"},
    "Grenada Enterprise Architecture.pdf": {"GEA": "GEA"},
    "Grenada EA ADM.pdf": {"ADM": "ADM", "GEA": "GEA"},
    "GEA Content Framework.pdf": {"Framework": "Framework", "GEA": "GEA","content":"content","documents":"documents"},
    "GEA Repository.pdf": {"Repository": "Repository","GEA":"GEA"},
    "GEA services.pdf": {"Services": "Services","GEA":"GEA"},
    "GEA Principles.pdf": {"Principles": "Principles","GEA":"GEA"},
}

# Upload files and apply tags
for filename in os.listdir(folder_path):
    file_path = os.path.join(folder_path, filename)
    if os.path.isfile(file_path):
        try:
            minio_client.fput_object(bucket_name, filename, file_path)
            print(f"Uploaded: {filename}")

            if filename in file_tags:
                tags = Tags.new_object_tags()
                for k, v in file_tags[filename].items():
                    tags[k] = v
                minio_client.set_object_tags(bucket_name, filename, tags)
                print(f"Tags added to: {filename}")
        except S3Error as e:
            print(f"Error with {filename}: {e}")
