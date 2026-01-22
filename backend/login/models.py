# models.py

import uuid
from sqlalchemy import (
    Column, String, Text, ForeignKey,
    DateTime, Integer, Float
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base

class User(Base):
    __tablename__ = "users"

    user_id       = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name          = Column(Text, nullable=False)
    email         = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role          = Column(String, nullable=False)  # "user" or "admin"
    organisation  = Column(Text, nullable=True)
    created_at    = Column(DateTime(timezone=True), server_default=func.now())
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # One‐to‐many to ServiceRequest
    service_requests = relationship(
        "ServiceRequest",
        back_populates="submitter",
        cascade="all, delete-orphan"
    )

class Service(Base):
    __tablename__ = "services"

    service_id            = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name                  = Column(Text, nullable=False)
    description           = Column(Text, nullable=True)
    delivery_timeline_days = Column(Integer, nullable=True)
    created_at            = Column(DateTime(timezone=True), server_default=func.now())

    # One‐to‐many to ServiceRequest
    requests = relationship("ServiceRequest", back_populates="service")

class ServiceRequest(Base):
    __tablename__ = "servicerequests"

    request_id        = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    submitter_id      = Column(PG_UUID(as_uuid=True), ForeignKey("users.user_id"), nullable=False)
    service_id        = Column(PG_UUID(as_uuid=True), ForeignKey("services.service_id"), nullable=False)
    representative_name  = Column(Text)
    representative_email = Column(Text)
    contact_number       = Column(Text)
    ministry_name        = Column(Text)
    reason               = Column(Text, nullable=False)
    notes                = Column(Text)
    additional_info      = Column(Text)
    status               = Column(String, default="Draft", nullable=False)
    created_at           = Column(DateTime(timezone=True), server_default=func.now())
    updated_at           = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    # Relationships
    submitter = relationship("User", back_populates="service_requests")
    service   = relationship("Service", back_populates="requests")
    files     = relationship(
        "RequestFile",
        back_populates="request",
        cascade="all, delete-orphan"
    )

class RequestFile(Base):
    __tablename__ = "requestfiles"

    file_id       = Column(PG_UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id    = Column(
        PG_UUID(as_uuid=True),
        ForeignKey("servicerequests.request_id", ondelete="CASCADE"),
        nullable=False
    )
    file_path     = Column(String, nullable=False)
    file_name     = Column(String, nullable=False)
    file_type     = Column(String, nullable=False)
    file_size_mb  = Column(Float, nullable=False)
    uploaded_at   = Column(DateTime(timezone=True), server_default=func.now())

    # Back‐ref to ServiceRequest
    request = relationship("ServiceRequest", back_populates="files")




from sqlalchemy import Column, String, Text, TIMESTAMP, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
import uuid
from database import Base

class PendingUser(Base):
    __tablename__ = "pendingusers"

    temp_user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(Text, nullable=False)
    email = Column(Text, unique=True, nullable=False)
    password_hash = Column(Text, nullable=False)
    role = Column(Text, nullable=False)  # Added this line
    organisation = Column(Text, nullable=True)
    submitted_at = Column(TIMESTAMP, server_default="CURRENT_TIMESTAMP")

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'user')", name="check_role_pendingusers"),
    )