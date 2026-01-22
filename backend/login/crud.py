#crud.py


from passlib.context import CryptContext
from sqlalchemy.orm import Session
from models import User, ServiceRequest
from schemas import UserCreate, ServiceRequestCreate
from uuid import uuid4
from datetime import datetime
import uuid
from sqlalchemy.exc import IntegrityError

# Initialize password context for hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ----------------------
# UTILITY FUNCTIONS
# ----------------------

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

# ----------------------
# USER CRUD OPERATIONS
# ----------------------

def create_user(db: Session, user: UserCreate):
    hashed_password = get_password_hash(user.password)
    db_user = User(
        user_id=str(uuid4()),
        name=user.name,
        email=user.email,
        password_hash=hashed_password,
        role=user.role,
        organisation=user.organisation,
    )
    try:
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    except IntegrityError:
        db.rollback()
        return None

def create_user(db: Session, user_data: UserCreate):
    hashed_password = pwd_context.hash(user_data.password)
    db_user = User(email=user_data.email, password_hash=hashed_password, **user_data.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

# ----------------------
# SERVICE REQUEST CRUD OPERATIONS
# ----------------------

def create_service_request(db: Session, request: ServiceRequestCreate, user_id: uuid.UUID):
    service_request = ServiceRequest(
        request_id=uuid.uuid4(),
        service_id=request.service_id,
        representative_name=request.representative_name,
        representative_email=request.representative_email,
        contact_number=request.contact_number,
        ministry_name=request.ministry_name,
        reason=request.reason,
        notes=request.notes,
        additional_info=request.additional_info,
        status=request.status,
        submitter_id=user_id,
        created_at=datetime.utcnow(),
        updated_at=datetime.utcnow(),
    )
    db.add(service_request)
    db.commit()
    db.refresh(service_request)
    return service_request

from sqlalchemy.orm import Session
from models import User

def get_user_by_email(db: Session, email: str):
    """
    Fetch a user by email from the database.
    
    :param db: SQLAlchemy session
    :param email: Email of the user to be fetched
    :return: User object if found, otherwise None
    """
    return db.query(User).filter(User.email == email).first()

from passlib.context import CryptContext

# Initialize the password context for hashing and verification
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a plain password against a hashed password.

    :param plain_password: The plain password to verify
    :param hashed_password: The hashed password to compare against
    :return: True if the password matches, False otherwise
    """
    return pwd_context.verify(plain_password, hashed_password)



from sqlalchemy.orm import Session
import models, schemas

def create_service(db: Session, service: schemas.ServiceCreate):
    db_service = models.Service(
        name=service.name,
        description=service.description,
        delivery_timeline_days=None # Set default or leave as NULL
    )
    db.add(db_service)
    db.commit()
    db.refresh(db_service)
    return db_service



def create_service_update(db: Session, service: schemas.ServiceCreate, user_id: uuid.UUID):
    new_service = models.Service(
        name=service.name,
        description=service.description,
        user_id=user_id
    )
    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service



from models import User, ServiceRequest, Service
from typing import List

def get_user_by_email(db: Session, email: str):
    return db.query(User).filter(User.email == email).first()

def get_services_by_user_email(db: Session, email: str) -> List[Service]:
    user = get_user_by_email(db, email)
    if not user:
        return []

    service_ids = db.query(ServiceRequest.service_id).filter(ServiceRequest.submitter_id == user.user_id).distinct()
    services = db.query(Service).filter(Service.service_id.in_(service_ids)).all()
    return services


#remove this later
def get_services_by_user(db: Session, user_id: uuid.UUID):
    return db.query(models.Service).filter(models.Service.user_id == user_id).all()



# crud.py
from sqlalchemy.orm import Session
from models import User, ServiceRequest

def get_service_requests_with_user_email(db: Session):
    results = (
        db.query(ServiceRequest, User.email)
        .join(User, ServiceRequest.submitter_id == User.user_id)
        .all()
    )

    data = []
    for request, email in results:
        data.append({
            "request_id": str(request.id),
            "submitter_id": str(request.submitter_id),
            "description": request.description,
            "user_email": email
        })
    return data


