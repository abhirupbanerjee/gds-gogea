from minio import Minio
from minio.error import S3Error
import os

# MinIO configuration
minio_client = Minio(
    "localhost:9090",
    access_key="minioadmin",
    secret_key="minioadmin",
    secure=False  # Set to True if using HTTPS
)

bucket_name = "mydocuments"
folder_path = r"C:\Users\HJ161HA\OneDrive - EY\Desktop\GoG\code_v1\repo"  # Change this to your folder path

# Create bucket if it doesn't exist
if not minio_client.bucket_exists(bucket_name):
    minio_client.make_bucket(bucket_name)

# Upload all files in the folder
for filename in os.listdir(folder_path):
    file_path = os.path.join(folder_path, filename)
    if os.path.isfile(file_path):
        try:
            minio_client.fput_object(
                bucket_name,
                object_name=filename,
                file_path=file_path
            )
            print(f"Uploaded: {filename}")
        except S3Error as e:
            print(f"Failed to upload {filename}: {e}")


from minio import Minio
from minio.commonconfig import Tags
from typing import Dict

def tag_minio_objects(
    endpoint: str,
    access_key: str,
    secret_key: str,
    bucket_name: str,
    file_tags: Dict[str, Dict[str, str]],
    secure: bool = False
):
    """
    Adds tags to objects in a MinIO bucket.

    Parameters:
        endpoint (str): MinIO endpoint (e.g., 'localhost:9090').
        access_key (str): MinIO access key.
        secret_key (str): MinIO secret key.
        bucket_name (str): Name of the bucket where files are stored.
        file_tags (dict): A dictionary mapping filenames to tag dictionaries.
        secure (bool): Whether to use HTTPS (default: False).
    """
    minio_client = Minio(endpoint, access_key=access_key, secret_key=secret_key, secure=secure)

    for object_name, tags_dict in file_tags.items():
        tags = Tags.new_object_tags()
        for k, v in tags_dict.items():
            tags[k] = v

        try:
            minio_client.set_object_tags(bucket_name, object_name, tags)
            print(f"✅ Tags added to: {object_name}")
        except Exception as e:
            print(f"❌ Error tagging {object_name}: {e}")

# Example usage
if __name__ == "__main__":
    file_tags = {
        "1 Digital Grenada.pdf": {"category": "strategy", "year": "2021"},
        "12  Roadmap tookit.xlsx": {"category": "roadmap", "owner": "ICT Dept"},
        "13 eGovernment Maturity Model.pdf": {"category": "maturity", "version": "v1"},
        "13 eGovernment Maturity model.xlsx": {"category": "maturity", "version": "v1"},
        "2 Grenada Enterprise Architecture Framework.pdf": {"type": "framework", "status": "final"},
        "2 Grenada Enterprise Architecture.pdf": {"type": "framework", "status": "draft"},
        "4 Grenada EA ADM.pdf": {"module": "ADM", "phase": "initial"},
        "5 GEA Content Framework.pdf": {"type": "content", "framework": "GEA"},
        "6 GEA Repository.pdf": {"type": "repository"},
        "7 GEA services.pdf": {"type": "services"},
        "8 GEA Principles.pdf": {"type": "principles"},
    }

    tag_minio_objects(
        endpoint="localhost:9090",
        access_key="minioadmin",
        secret_key="minioadmin",
        bucket_name="mydocuments",
        file_tags=file_tags
    )

