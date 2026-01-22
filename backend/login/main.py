
import os, certifi
os.environ.setdefault("SSL_CERT_FILE", certifi.where())
# import pip_system_certs
from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from database import get_db
import crud, schemas, auth
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import uuid
from typing import List, Optional
from fastapi import UploadFile, File, Form
from typing import Annotated
from uuid import uuid4
from datetime import datetime
import os
from models import ServiceRequest, RequestFile
from auth import require_role, UserOut
import io
from minio import Minio
from minio.error import S3Error
from fastapi import Query

from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from models import Service
from pydantic import EmailStr
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail
from dotenv import load_dotenv 
from models import User, ServiceRequest, RequestFile
from database import get_db

load_dotenv()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:8081"],  # <- your RN-Web dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/all-service-requests1", response_model=List[dict])
def get_all_service_requests(
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(require_role("admin"))
):
    reqs = db.query(ServiceRequest).all()
    if not reqs:
        raise HTTPException(404, "No service requests found.")

    out = []
    for req in reqs:
        file    = req.files[0] if req.files else None
        service = req.service
        submitter = req.submitter

        out.append({
            "email": submitter.email,           # who submitted
            "request_id": req.request_id,
            "submitter_id": req.submitter_id,
            "representative_name": req.representative_name,
            "representative_email": req.representative_email,
            "contact_number": req.contact_number,
            "ministry_name": req.ministry_name,
            "service_id": req.service_id,
            "service_name": service.name if service else None,
            "service_description": service.description if service else None,
            "reason": req.reason,
            "notes": req.notes,
            "additional_info": req.additional_info,
            "status": req.status,
            "created_at": req.created_at.isoformat() if req.created_at else None,
            "updated_at": req.updated_at.isoformat() if req.updated_at else None,
            "file": {
                "file_name": file.file_name,
                "file_path": file.file_path,
                "file_size_mb": file.file_size_mb,
                "uploaded_at": file.uploaded_at.isoformat() if file.uploaded_at else None
            } if file else None
        })

    return out


from enum import Enum
class StatusEnum(str, Enum):
    Draft     = "Draft"
    Submitted = "Submitted"
    Active    = "Active"
    Completed = "Completed"

class ServiceRequestUpdate(BaseModel):
    status: StatusEnum | None           = None
    reason: str | None                  = None
    ministry_name: str | None           = None
    representative_name: str | None     = None
    representative_email: str | None    = None
    contact_number: str | None          = None
    notes: str | None                   = None
    additional_info: str | None         = None

@app.put("/service-request_update/{request_id}")
def update_service_request(
    request_id: str,
    update_data: ServiceRequestUpdate,
    db: Session    = Depends(get_db),
    current_user: UserOut = Depends(require_role("admin"))
):
    # 1) Fetch
    req = (
      db.query(ServiceRequest)
        .filter(ServiceRequest.request_id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Service request not found.")

    # 2) Apply only the provided fields (including status)
    for field, value in update_data.dict(exclude_unset=True).items():
        setattr(req, field, value)

    # 3) Touch the updated timestamp
    req.updated_at = datetime.utcnow()

    # 4) Persist & return
    db.commit()
    db.refresh(req)
    return {
      "message": "Service request updated successfully",
      "updated_request": req.request_id
    }

# ─── contact-form model ─────────────────────────────────────────────────────
class ContactForm(BaseModel):
    firstName: str
    lastName:  str
    email:     EmailStr
    message:   str


# ─── endpoint ───────────────────────────────────────────────────────────────
@app.post("/contact", status_code=202)
async def send_contact_email(data: ContactForm):
    """
    Receives the contact-us form and sends two e-mails:
    1) to the support inbox
    2) an acknowledgement to the sender
    """
    try:
        
        sg = SendGridAPIClient(os.getenv("SENDGRID_API_KEY"))

        # 1️⃣  message to EA support
        support_msg = Mail(
            from_email="pachaurirachit6@gmail.com",
            to_emails="pachaurirachit6@gmail.com",
            subject="New GEA portal enquiry",
            html_content=(
                f"<p><strong>From:</strong> {data.firstName} {data.lastName} "
                f"&lt;{data.email}&gt;</p>"
                f"<p><strong>Message:</strong><br>"
                f"{data.message.replace(chr(10), '<br>')}</p>"
            ),
        )
        sg.send(support_msg)

        # 2️⃣  acknowledgement back to user (optional but recommended)
        ack_msg = Mail(
            from_email="pachaurirachit6@gmail.com",
            to_emails=data.email,
            subject="We received your message",
            html_content=(
                "<p>Hi there!</p>"
                "<p>Thanks for contacting the EA team. "
                "We’ve received your message and will reply soon.</p>"
                "<p>— Government of Grenada EA Team</p>"
            ),
        )
        sg.send(ack_msg)

        return {"detail": "Email queued for delivery"}

    # Any sendgrid / network / auth error bubbles up here
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"SendGrid error: {err}")



class ServiceNameIn(BaseModel):
    name: str
class ServiceIDOut(BaseModel):
    service_id: str
@app.post("/service-id", response_model=ServiceIDOut)
def get_service_id_by_name(
    payload: ServiceNameIn,
    db: Session = Depends(get_db),
):
    service = db.query(Service).filter(Service.name == payload.name).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return ServiceIDOut(service_id=str(service.service_id))





ALLOWED_EXTENSIONS = {"zip", "xlsx", "xls", "pdf", "docx"}
 
# Initialize MinIO client
MINIO_CLIENT = Minio(
     "minio:9000",  # MinIO address
    access_key="minioadmin",  # change if needed
    secret_key="minioadmin",  # change if needed
    secure=False
)
 
BUCKET_NAME = "gogdocuments"

@app.get("/admin/user-services/{user_email}")
def get_user_service_requests(
    user_email: str,
    db: Session = Depends(get_db),
    current_user: auth.UserOut = Depends(auth.require_role("admin"))
):
    # Get the user by email
    user = db.query(User).filter(User.email == user_email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
 
    # Get all service requests submitted by the user
    service_requests = (
        db.query(ServiceRequest)
        .filter(ServiceRequest.submitter_id == user.id)
        .all()
    )
 
    if not service_requests:
        return {"message": "No service requests found for this user"}
 
    # Optional: Join with Service table to get service names/details
    results = []
    for req in service_requests:
        service = db.query(Service).filter(Service.id == req.service_id).first()
        results.append({
            "request_id": str(req.request_id),
            "status": req.status,
            "submitted_at": req.created_at,
            "updated_at": req.updated_at,
            "service": {
                "id": service.id,
                "name": service.name,
                "description": service.description
            } if service else None
        })
 
    return {
        "user_email": user_email,
        "service_requests": results
    }

@app.post("/service-requests-with-file/")
async def create_service_request_with_file(
    service_id: Annotated[str, Form()],
    reason: Annotated[str, Form()],
    file: UploadFile = File(...),
    ministry_name: Annotated[str | None, Form()] = None,
    representative_name: Annotated[str | None, Form()] = None,
    representative_email: Annotated[str | None, Form()] = None,
    contact_number: Annotated[str | None, Form()] = None,
    notes: Annotated[str | None, Form()] = None,
    additional_info: Annotated[str | None, Form()] = None,
    db: Session = Depends(get_db),
    current_user: UserOut = Depends(require_role("user"))
):
    # Validate file extension
    ext = file.filename.split(".")[-1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Invalid file type: .{ext}")
 
    # Read file content into memory
    contents = await file.read()
    file_size_mb = round(len(contents) / (1024 * 1024), 2)
    if file_size_mb > 10.0:
        raise HTTPException(status_code=400, detail="File exceeds 10MB limit.")
 
    file_stream = io.BytesIO(contents)
 
    # Generate unique ID and key for MinIO
    request_id = str(uuid4())
    object_name = f"{request_id}_{file.filename}"
 
    # Upload to MinIO
    try:
        MINIO_CLIENT.put_object(
            bucket_name=BUCKET_NAME,
            object_name=object_name,
            data=file_stream,
            length=len(contents),
            content_type=file.content_type
        )
    except S3Error as e:
        raise HTTPException(status_code=500, detail=f"MinIO upload failed: {str(e)}")
 
    # Create ServiceRequest record
    new_request = ServiceRequest(
        request_id=request_id,
        submitter_id=current_user.user_id,
        representative_name=representative_name,
        representative_email=representative_email,
        contact_number=contact_number,
        ministry_name=ministry_name,
        service_id=service_id,
        reason=reason,
        notes=notes,
        additional_info=additional_info,
        status="Submitted",
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow()
    )
 
    # Create RequestFiles record (linked via FK)
    file_record = RequestFile(
        file_id=request_id,
        file_path=f"s3://{BUCKET_NAME}/{object_name}",
        file_name=file.filename,
        file_type=file.content_type,
        file_size_mb=file_size_mb,
        uploaded_at=datetime.utcnow()
    )
 
    # # Add both and commit together
    # db.add(new_request)
    # db.add(file_record)
    # db.commit()
    # db.refresh(new_request)
    try:
        db.add(new_request)
        db.add(file_record)
        db.commit()
        print("DB commit successful")
        print("DB URL:", db.bind.url)
 
    except Exception as e:
        db.rollback()
        print("DB commit failed:", e)
        raise HTTPException(status_code=500, detail=f"DB commit failed: {str(e)}")
 
 
    return {
        "message": "Service request and file uploaded successfully.",
        "service_request_id": request_id,
        "file_name": file.filename,
        "file_size_mb": file_size_mb,
        "minio_path": f"s3://{BUCKET_NAME}/{object_name}",
        "file_record": {
        "file_id": file_record.file_id,
        "file_path": file_record.file_path,
        "file_name": file_record.file_name,
        "file_type": file_record.file_type,
        "file_size_mb": file_record.file_size_mb,
        "uploaded_at": file_record.uploaded_at.isoformat()
    }
    }


@app.post("/register_admin")
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")
   
    new_user = models.User(
        user_id=str(uuid.uuid4()),
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="admin",  # force the role to "user"
        organisation=user_data.organisation
    )
 
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
 
    return {
        "message": "User registered successfully",
        "user": {
            "user_id": new_user.user_id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "organisation": new_user.organisation,
            "created_at": new_user.created_at
        }
    }


# @app.post("/login", response_model=schemas.Token)
# def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
#     user = crud.get_user_by_email(db, form_data.username)
#     if not user or not crud.verify_password(form_data.password, user.password_hash):
#         raise HTTPException(status_code=401, detail="Invalid email or password")
    
#     access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
#     return {"access_token": access_token, "token_type": "bearer"}

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    # Fetch user by email
    user = crud.get_user_by_email(db, form_data.username)
    
    # Check if user exists and verify the password
    if not user or not crud.verify_password(form_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create JWT token with user data (email and role)
    access_token = auth.create_access_token(data={"sub": user.email, "role": user.role})
    return {"access_token": access_token, "token_type": "bearer","role":user.role}




@app.post("/register")
def register_user(user_data: schemas.UserCreate, db: Session = Depends(get_db)):
    # Check if email already exists
    existing_user = db.query(models.User).filter(models.User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    new_user = models.User(
        user_id=str(uuid.uuid4()),
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role="user",  # force the role to "user"
        organisation=user_data.organisation
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User registered successfully",
        "user": {
            "user_id": new_user.user_id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "organisation": new_user.organisation,
            "created_at": new_user.created_at
        }
    }

# ------------------------------------user--------------------------------------------------------


from schemas import ServiceOut,ServiceCreate
@app.post("/services", response_model=ServiceOut)
def create_service(
    service: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: auth.UserOut = Depends(auth.require_role("admin"))  # Only users with "admin" role
):
    return crud.create_service(db, service)



# Create service request  : http://localhost:8000/service-requests 
# Auth :  breare token for user
# Example data : ''' {
#   "representative_name": "John Doe",
#   "representative_email": "john@example.com",
#   "contact_number": "1234567890",
#   "ministry_name": "Ministry of Example",
#   "service_id": "142c2122-a08f-465f-96e9-28eb5ffe3673",
#   "reason": "We need this for testing",
#   "notes": "Some additional notes",
#   "additional_info": "N/A",
#   "status": "Submitted"
# }

# '''

@app.post("/service-requests", response_model=schemas.ServiceRequestOut)
def create_service_request(
    request: schemas.ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: auth.UserOut = Depends(auth.require_role("user"))
):
    return crud.create_service_request(db=db, request=request, user_id=current_user.user_id)


#http://localhost:8000/service-requests/by-email?email=user@example.com
#GET ALL THE SERVICE REQUEST FORM THE USER
@app.get("/service-requests/by-email", response_model=list[schemas.ServiceRequestOut])
def get_requests_by_email(
    email: str,
    status: Optional[str] = None,
    db: Session = Depends(get_db)
):
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    query = db.query(ServiceRequest).filter(ServiceRequest.submitter_id == user.user_id)

    if status:
        query = query.filter(ServiceRequest.status == status)

    return query.all()









from models import User  # Your User SQLAlchemy model
#get user_id  by passing in the email
@app.get("/users/id-by-email")
def get_user_id_by_email(email: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {"user_id": user.user_id}  # changed from user.id to user.user_id

from models import ServiceRequest
from schemas import ServiceRequestOut

# Define the route directly in the app
# @app.get("/service_requests", response_model=List[ServiceRequestOut])
# def get_service_requests(current_user: auth.UserOut = Depends(auth.require_role("user")), db: Session = Depends(get_db)):
#     """
#     Get all service requests for the current user.
#     """
#     # Fetch service requests where the submitter_id matches the current user
#     service_requests = db.query(ServiceRequest).filter(ServiceRequest.submitter_id == current_user.user_id).all()

#     if not service_requests:
#         raise HTTPException(status_code=404, detail="No service requests found for this user")

#     return service_requests


# main.py or routes.py
@app.get("/requests-with-email")
def get_requests_with_email(db: Session = Depends(get_db)):
    return crud.get_service_requests_with_user_email(db)



@app.get("/user-service-requests/")
def get_user_service_requests(
    email: str = Query(..., description="User's email address"),
    db: Session = Depends(get_db)
):
    # Step 1: Get user by email
    user = db.query(User).filter(User.email == email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Step 2: Get service requests by user
    requests = (
        db.query(ServiceRequest)
        .options(joinedload(ServiceRequest.service))
        .filter(ServiceRequest.submitter_id == user.user_id)
        .all()
    )

    if not requests:
        return {
            "message": "No service requests found for this user.",
            "email": email,
            "services": []
        }

    # Step 3: Build the response
    result = []
    for req in requests:
        result.append({
            "request_id": str(req.request_id),
            "service_id": str(req.service_id),
            "service_name": req.service.name if req.service else None,
            "status": req.status,
            "reason": req.reason,
            "submitted_at": req.created_at.isoformat(),
        })

    return {
        "email": email,
        "user_id": str(user.user_id),
        "services_requested": result
    }





#----------------------------------------------------------------------Admin-----------------------------------------------------------------------------------------------------------------------


import models
#Gat all users 
@app.get("/users", response_model=List[schemas.UserOut])
def get_all_users(db: Session = Depends(get_db), current_user: auth.UserOut = Depends(auth.require_role("admin"))):
    users = db.query(models.User).all()
    return users


#gets what a partucular user has requested 
@app.get("/users/{user_id}/service-requests", response_model=List[schemas.ServiceRequestOut])
def get_service_requests_for_user(
    user_id: uuid.UUID, db: Session = Depends(get_db), current_user: auth.UserOut = Depends(auth.require_role("admin"))
):
    if current_user.user_id != user_id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access forbidden: Insufficient permissions")
    
    service_requests = db.query(models.ServiceRequest).filter(models.ServiceRequest.submitter_id == user_id).all()
    return service_requests

import datetime

#check if user exists: by passing the  user id  : method put: http://127.0.0.1:8000/users/20ccf783-8664-4e27-8d23-39b7708f71ed
@app.put("/users/{user_id}", response_model=schemas.UserOut)
def update_user(
    user_id: uuid.UUID,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: auth.UserOut = Depends(auth.require_role("admin")),
):
    # Check if the user exists
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update the user details
    for key, value in user_update.dict(exclude_unset=True).items():
        setattr(user, key, value)
    
    user.updated_at = datetime.datetime.utcnow()  # Update the timestamp
    
    db.commit()
    db.refresh(user)
    return user


#Delete user Method:DELETE: http://127.0.0.1:8000/users/20ccf783-8664-4e27-8d23-39b7708f71ed
@app.delete("/users/{user_id}", response_model=schemas.UserOut)
def delete_user(
    user_id: uuid.UUID, db: Session = Depends(get_db), current_user: auth.UserOut = Depends(auth.require_role("admin"))
):
    user = db.query(models.User).filter(models.User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(user)
    db.commit()
    return user


#Create new service
@app.post("/services_admin", response_model=schemas.ServiceOut)
def create_service(
    service: schemas.ServiceCreate, db: Session = Depends(get_db), current_user: auth.UserOut = Depends(auth.require_role("admin"))
):
    new_service = models.Service(**service.dict())
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service


#update service 
# @app.put("/services/{service_id}", response_model=schemas.ServiceOut)
# def update_service(
#     service_id: uuid.UUID,
#     service_update: schemas.ServiceUpdate,
#     db: Session = Depends(get_db),
#     current_user: auth.UserOut = Depends(auth.require_role("admin")),
# ):
#     service = db.query(models.Service).filter(models.Service.service_id == service_id).first()
#     if not service:
#         raise HTTPException(status_code=404, detail="Service not found")
    
#     for key, value in service_update.dict(exclude_unset=True).items():
#         setattr(service, key, value)
    
#     service.updated_at = datetime.datetime.utcnow()  # Update the timestamp
    
#     db.commit()
#     db.refresh(service)
#     return service

#update service  request
# @app.put("/service-requests/{request_id}", response_model=schemas.ServiceRequestOut)
# def update_service_request(
#     request_id: uuid.UUID,
#     service_request_update: schemas.ServiceRequestUpdate,
#     db: Session = Depends(get_db),
#     current_user: auth.UserOut = Depends(auth.require_role("admin")),
# ):
#     service_request = db.query(models.ServiceRequest).filter(models.ServiceRequest.request_id == request_id).first()
#     if not service_request:
#         raise HTTPException(status_code=404, detail="Service request not found")
    
#     for key, value in service_request_update.dict(exclude_unset=True).items():
#         setattr(service_request, key, value)
    
#     service_request.updated_at = datetime.datetime.utcnow()  # Update the timestamp
    
#     db.commit()
#     db.refresh(service_request)
#     return service_request


from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from database import get_db  # Your DB session dependency
from models import User, ServiceRequest, Service  # Your SQLAlchemy models
import auth  # Assuming you have an auth module with require_role
import schemas  # Only needed if you’re using schema models elsewhere
from sqlalchemy.orm import Session, joinedload



@app.get("/users/{user_id}/service-requests1")
def get_service_requests(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: auth.UserOut = Depends(auth.require_role("admin"))
):
   

    results = (
        db.query(User, ServiceRequest)
        .join(ServiceRequest, User.user_id == ServiceRequest.submitter_id)
        .filter(ServiceRequest.submitter_id == user_id)
        .all()
    )

       # Format the results into JSON-serializable dicts
    return [
        {
            "request_id": request.request_id,
            "status": request.status,
            "ministry_name": request.ministry_name,
            "created_at": request.created_at,
            "user": {
                "user_id": user.user_id,
                "name": user.name,
                "email": user.email
            }
        }
        for user, request in results
    ]


#get all the data from admin , when  passing in  user id
#http://127.0.0.1:8000/users/d6a7245d-9317-429b-82f2-c0b5177c16b9/service-requests2 : GET 
#working
@app.get("/users/{user_id}/service-requests2")
def get_service_requests(
    user_id: str,
    db: Session = Depends(get_db),
    current_user: auth.UserOut = Depends(auth.require_role("admin"))
):
   

    results = (
    db.query(User, ServiceRequest, Service)
    .join(ServiceRequest, User.user_id == ServiceRequest.submitter_id)
    .join(Service, ServiceRequest.service_id == Service.service_id)
    .filter(ServiceRequest.submitter_id == user_id)
    .all()
)


       # Format the results into JSON-serializable dicts
    return [
    {
        "request_id": request.request_id,
        "status": request.status,
        "ministry_name": request.ministry_name,
        "created_at": request.created_at,
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email
        },
        "services": {
            "service_id": service.service_id,
            "name": service.name,
            "description": service.description,
            "delivery_timeline_days": service.delivery_timeline_days,
            "created_at": service.created_at
        }
    }
    for user, request, service in results
]



from passlib.context import CryptContext
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

#Create New user  
# POST: http://localhost:8000/admin/create-user
@app.post("/admin/create-user")
def create_user(
    user_data: schemas.UserCreate,
    db: Session = Depends(get_db),
    current_user: auth.UserOut = Depends(auth.require_role("admin"))
):
    # Check if email already exists
    existing_user = db.query(User).filter(User.email == user_data.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    new_user = User(
        user_id=str(uuid.uuid4()),
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        role=user_data.role,
        organisation=user_data.organisation
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User created successfully",
        "user": {
            "user_id": new_user.user_id,
            "name": new_user.name,
            "email": new_user.email,
            "role": new_user.role,
            "organisation": new_user.organisation,
            "created_at": new_user.created_at
        }
    }

# http://localhost:8000/admin/edit-user/4d594f75-3a2e-43f5-9967-e12f625a8790
#Headers:  Content-Type: application/json
#Authorization: Bearer <your-admin-token-here>
@app.put("/admin/edit-user/{user_id}")
def edit_user(
    user_id: str,
    user_data: schemas.UserUpdate,  # update schema
    db: Session = Depends(get_db),
    current_user: auth.UserOut = Depends(auth.require_role("admin"))
):
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")

    # Check for email change conflict
    if user_data.email and user_data.email != user.email:
        email_exists = db.query(User).filter(User.email == user_data.email).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="Email already in use.")

    # Update fields
    user.name = user_data.name or user.name
    user.email = user_data.email or user.email
    user.organisation = user_data.organisation or user.organisation
    user.role = user_data.role or user.role

    if user_data.password:
        user.password_hash = hash_password(user_data.password)

    db.commit()
    db.refresh(user)

    return {
        "message": "User updated successfully",
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "role": user.role,
            "organisation": user.organisation,
            "updated_at": user.updated_at
        }
    }


import datetime
datetime.datetime.utcnow()
from datetime import datetime, timezone



@app.put("/admin/edit-service-request/{request_id}")
def update_service_request(
    request_id: uuid.UUID,
    data: schemas.ServiceRequestUpdateAdmin,
    db: Session = Depends(get_db),
    current_user: auth.UserOut = Depends(auth.require_role("admin"))
):
    request = db.query(ServiceRequest).filter(ServiceRequest.request_id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Update each field
    for field, value in data.dict(exclude_unset=True).items():
        setattr(request, field, value)

    request.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(request)

    return {
        "message": "Service request updated successfully",
        "request_id": str(request.request_id)
    }



@app.put("/admin/edit-service-request2/{request_id}")
def update_service_request(
    request_id: uuid.UUID,
    data: schemas.ServiceRequestUpdateAdmin,
    db: Session = Depends(get_db),
    current_user: auth.UserOut = Depends(auth.require_role("admin"))
):
    request = db.query(ServiceRequest).filter(ServiceRequest.request_id == request_id).first()
    if not request:
        raise HTTPException(status_code=404, detail="Service request not found")

    # Skip updating 'submitter_id'
    update_data = data.dict(exclude_unset=True, exclude={"submitter_id"})

    for field, value in update_data.items():
        setattr(request, field, value)

    request.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(request)

    return {
        "message": "Service request updated successfully",
        "request_id": str(request.request_id)
    }


#--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------








@app.post("/admin/service-requests", response_model=schemas.ServiceRequestOut)
def create_service_request_admin(
    request: schemas.ServiceRequestCreate,
    db: Session = Depends(get_db),
    current_user: auth.UserOut = Depends(auth.require_role("admin"))
):
    return crud.create_service_request(db=db, request=request, user_id=current_user.user_id)



#edit service table
@app.patch("/admin/service-requests/{request_id}", response_model=schemas.ServiceRequestOut)
def update_service_request(
    request_id: uuid.UUID, 
    request: schemas.ServiceRequestCreate, 
    db: Session = Depends(get_db), 
    current_user: auth.UserOut = Depends(auth.require_role("admin"))
):
    db_service_request = db.query(models.ServiceRequest).filter(models.ServiceRequest.request_id == request_id).first()
    if not db_service_request:
        raise HTTPException(status_code=404, detail="Service Request not found")
    
    # Update fields
    for key, value in request.dict(exclude_unset=True).items():
        setattr(db_service_request, key, value)
    
    db.commit()
    db.refresh(db_service_request)
    return db_service_request



@app.delete("/admin/service-requests/{request_id}", response_model=schemas.ServiceRequestOut)
def delete_service_request(
    request_id: uuid.UUID, 
    db: Session = Depends(get_db), 
    current_user: auth.UserOut = Depends(auth.require_role("admin"))
):
    db_service_request = db.query(models.ServiceRequest).filter(models.ServiceRequest.request_id == request_id).first()
    if not db_service_request:
        raise HTTPException(status_code=404, detail="Service Request not found")
    
    db.delete(db_service_request)
    db.commit()
    return db_service_request




@app.get("/users_details", response_model=List[schemas.UserWithServiceRequestsOut])
def get_all_users_with_service_requests(
    db: Session = Depends(get_db),
    current_user: schemas.UserOut_allUsers = Depends(auth.require_role("admin"))
):
    # Get all users
    users = db.query(models.User).all()
    
    # Prepare response data
    users_with_service_requests = []
    for user in users:
        # Get service requests for the user
        service_requests = db.query(models.ServiceRequest).filter(models.ServiceRequest.submitter_id == user.user_id).all()
        
        # Convert the service request models to Pydantic models
        service_requests_out = [schemas.ServiceRequestOut.from_orm(request) for request in service_requests]
        
        # Convert the user model to Pydantic model and add the service requests
        user_out = schemas.UserOut_allUsers.from_orm(user)
        
        users_with_service_requests.append({
            "user": user_out,
            "service_requests": service_requests_out
        })

    return users_with_service_requests



















from crud import get_services_by_user_email
from schemas import UserBase, ServicesByEmailResponse


@app.post("/admin/services-by-email", response_model=ServicesByEmailResponse)
def fetch_services_by_email(payload: UserBase, db: Session = Depends(get_db)):
    services = get_services_by_user_email(db, payload.email)
    if not services:
        raise HTTPException(status_code=404, detail="No services found for this email")

    return {"user_email": payload.email, "services": services}




#----------------------------------------------upload file  - - - -  - ------------------------------------------- - - - ---------------------------------------
# from fastapi import UploadFile, File, Form, HTTPException, Depends
# from sqlalchemy.orm import Session
# import uuid
# import os
# from datetime import datetime
# from upload_file_to_minio import upload_file_to_minio

# @app.post("/upload-file", status_code=201)
# def upload_request_file(
#     service_request_id: uuid.UUID = Form(...),
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db)
# ):
#     # 1. Check file size
#     contents = file.file.read()
#     file_size_mb = round(len(contents) / (1024 * 1024), 2)
#     file.file.seek(0)

#     if file_size_mb > 10:
#         raise HTTPException(status_code=400, detail="File too large. Max 10MB allowed.")

#     # 2. Generate unique file name for MinIO storage (not the DB ID)
#     file_ext = os.path.splitext(file.filename)[1]
#     unique_name = f"{uuid.uuid4()}{file_ext}"

#     # 3. Upload to MinIO
#     file_path = upload_file_to_minio(file, unique_name)

#     # 4. Insert file info into DB using service_request_id as file_id
#     new_file = models.RequestFile(
#         file_id=service_request_id,  # <- file_id now references ServiceRequests(request_id)
#         file_path=file_path,
#         file_name=file.filename,
#         file_type=file.content_type,
#         file_size_mb=file_size_mb,
#         uploaded_at=datetime.utcnow()
#     )

#     db.add(new_file)

#     try:
#         db.commit()
#     except Exception as e:
#         db.rollback()
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Database error while uploading file")

#     db.refresh(new_file)

#     return {"message": "File uploaded successfully", "file_id": str(new_file.file_id)}



# @app.post("/upload-file", status_code=201)
# def upload_request_file(
#     service_request_id: uuid.UUID = Form(...),
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db)
# ):
#     # 1. Check file size
#     contents = file.file.read()
#     file_size_mb = round(len(contents) / (1024 * 1024), 2)
#     file.file.seek(0)

#     if file_size_mb > 10:
#         raise HTTPException(status_code=400, detail="File too large. Max 10MB allowed.")

#     # 2. Generate unique file name for MinIO
#     file_ext = os.path.splitext(file.filename)[1]
#     unique_name = f"{uuid.uuid4()}{file_ext}"

#     # 3. Upload to MinIO
#     file_path = upload_file_to_minio(file, unique_name)

#     # 4. Insert file info into DB
#     new_file = models.RequestFile(
#         request_id=service_request_id,  # ✅ Correct FK to ServiceRequests
#         file_path=file_path,
#         file_name=file.filename,
#         file_type=file.content_type,
#         file_size_mb=file_size_mb,
#         uploaded_at=datetime.utcnow()
#     )

#     db.add(new_file)

#     try:
#         db.commit()
#     except Exception as e:
#         db.rollback()
#         import traceback
#         traceback.print_exc()
#         raise HTTPException(status_code=500, detail="Database error while uploading file")

#     db.refresh(new_file)

#     return {
#         "message": "File uploaded successfully",
#         "file_id": str(new_file.file_id)
#     }

from minio_utils import upload_file_to_minio
from fastapi import FastAPI, UploadFile, File, Form, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid
import os
from io import BytesIO

from database import get_db
#from models import RequestFile, Base, engine
# from models import RequestFile

from fastapi import UploadFile

from fastapi import UploadFile, File, HTTPException

# @app.post("/upload-file/")
# async def upload_file(
#     request_id: str = Form(...),
#     file: UploadFile = File(...),
#     db: Session = Depends(get_db)
# ):
#     # Validate request_id format
#     try:
#         request_uuid = uuid.UUID(request_id)
#     except ValueError:
#         raise HTTPException(status_code=400, detail="Invalid UUID format for request_id")

#     # Calculate file size in MB before reading the content
#     try:
#         # Using file.file to access the underlying file-like object
#         size_mb = round(file.file.seek(0, os.SEEK_END) / (1024 * 1024), 2)  # Get size in MB
#         file.file.seek(0)  # Reset the file pointer to the start
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error calculating file size: {str(e)}")

#     # Upload file to MinIO
#     file_path = upload_file_to_minio(file)

#     # Save to database
#     new_file = RequestFile(
#         request_id=request_uuid,
#         file_path=file_path,
#         file_name=file.filename,
#         file_type=file.content_type,
#         file_size_mb=size_mb
#     )

#     db.add(new_file)
#     db.commit()
#     db.refresh(new_file)

#     return {
#         "message": "File uploaded and metadata saved",
#         "file_id": str(new_file.file_id),
#         "filename": file.filename,
#         "file_size_mb": size_mb
#     }



from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
import uuid

from database import get_db
import models, schemas
from auth import hash_password  # <- from your hash function in auth.py


from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session
import uuid
from models import PendingUser
from database import get_db
import schemas

@app.post("/register_pending")
def register_pending_user(user_data: schemas.PendingUserCreate, db: Session = Depends(get_db)):
    # Check for duplicate email
    existing = db.query(PendingUser).filter(PendingUser.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already submitted for approval.")

    pending_user = PendingUser(
        temp_user_id=uuid.uuid4(),
        name=user_data.name,
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        organisation=user_data.organisation,
        role=user_data.role  # ✅ Include role
    )

    db.add(pending_user)
    db.commit()
    db.refresh(pending_user)

    return {
        "message": "Registration submitted for admin approval.",
        "pending_user_id": str(pending_user.temp_user_id)
    }



from typing import List

@app.get("/admin/pending_users", response_model=List[schemas.PendingUserOut])
def get_all_pending_users(db: Session = Depends(get_db)):
    pending_users = db.query(models.PendingUser).all()
    return pending_users






from fastapi import Depends, HTTPException, APIRouter
from sqlalchemy.orm import Session
import uuid

@app.post("/admin/approve_user")
def approve_pending_user(
    data: schemas.ApprovePendingUserRequest,
    db: Session = Depends(get_db),
    current_user: auth.UserOut = Depends(auth.require_role("admin"))  # ✅ Admin check
):
    # Fetch from PendingUsers
    pending_user = db.query(models.PendingUser).filter_by(temp_user_id=data.temp_user_id).first()

    if not pending_user:
        raise HTTPException(status_code=404, detail="Pending user not found.")

    # Check if already approved
    existing = db.query(models.User).filter_by(email=pending_user.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="User with this email already approved.")

    # Transfer to Users
    new_user = models.User(
        user_id=uuid.uuid4(),
        name=pending_user.name,
        email=pending_user.email,
        password_hash=pending_user.password_hash,
        role="user",
        organisation=pending_user.organisation,
    )

    db.add(new_user)
    db.delete(pending_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "User approved and added to system.",
        "user_id": str(new_user.user_id),
        "email": new_user.email
    }
 