# schemas.py


from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str
    organisation: Optional[str] = None

class UserOut(BaseModel):
    user_id: UUID
    name: str
    email: EmailStr
    role: str
    organisation: Optional[str]

    class Config:
        orm_mode = True
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
    role: str
    
class TokenData(BaseModel):
    email: Optional[str] = None

# class UserUpdate(BaseModel):
#     name: Optional[str] = None
#     organisation: Optional[str] = None

# Service Request Schemas
class ServiceRequestOut(BaseModel):
    request_id: UUID
    submitter_id: UUID
    representative_name: Optional[str]
    representative_email: Optional[str]
    contact_number: Optional[str]
    ministry_name: Optional[str]
    service_id: UUID
    reason: Optional[str]
    notes: Optional[str]
    additional_info: Optional[str]
    status: Optional[str]
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        orm_mode = True
        from_attributes = True

class ServiceRequestCreate(BaseModel):
    representative_name: Optional[str]
    representative_email: Optional[str]
    contact_number: Optional[str]
    ministry_name: Optional[str]
    service_id: UUID
    reason: Optional[str]
    notes: Optional[str]
    additional_info: Optional[str]
    status: Optional[str] = "Draft"



from pydantic import BaseModel
from uuid import UUID
from typing import Optional
from datetime import datetime

class ServiceCreate(BaseModel):
    name: str
    description: Optional[str] = None
    #delivery_timeline_days: Optional[int] = None

class ServiceOut(BaseModel):
    service_id: UUID
    name: str
    description: Optional[str]
    delivery_timeline_days: Optional[int]
    created_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True

import uuid

from pydantic import BaseModel
from typing import List, Optional


# class ServiceRequestOut(BaseModel):
#     request_id: uuid.UUID
#     title: str
#     description: str
#     status: str
#     # Add any other fields you need
#     class Config:
#         orm_mode = True
#         from_attributes = True

class ServiceRequestOut(BaseModel):
    request_id: UUID
    submitter_id: UUID
    representative_name: str
    representative_email: str
    contact_number: str
    ministry_name: str
    service_id: UUID
    reason: str
    notes: str
    additional_info: str
    status: str
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True




class UserOut_allUsers(BaseModel):
    user_id: UUID
    name: str
    email: str
    role: str
    organisation: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True  # This is the required change



class UserWithServiceRequestsOut(BaseModel):
    user: UserOut
    service_requests: List[ServiceRequestOut]
    class Config:
        orm_mode = True
        from_attributes = True



from pydantic import BaseModel, EmailStr
class UserBase(BaseModel):
    email: EmailStr

class ServicesByEmailResponse(BaseModel):
    user_email: EmailStr
    services: List[ServiceOut]







from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional

class ServiceRequestOut_update(BaseModel):
    request_id: UUID
    submitter_id: UUID
    representative_name: Optional[str]
    representative_email: Optional[str]
    contact_number: Optional[str]
    ministry_name: Optional[str]
    service_id: Optional[UUID]
    reason: Optional[str]
    notes: Optional[str]
    additional_info: Optional[str]
    status: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True
        from_attributes = True



from pydantic import BaseModel, Field
from typing import Optional
import uuid

class ServiceRequestUpdate(BaseModel):
    representative_name: Optional[str]
    representative_email: Optional[str]
    contact_number: Optional[str]
    ministry_name: Optional[str]
    service_id: Optional[uuid.UUID]
    reason: Optional[str]
    notes: Optional[str]
    additional_info: Optional[str]
    status: Optional[str] = Field(default=None, pattern="^(Draft|Submitted|Active|Completed)$")

    class Config:
        from_attributes = True  # Use this instead of orm_mode in Pydantic v2
        from_attributes = True


from pydantic import BaseModel, EmailStr
from typing import Optional

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    password: Optional[str] = None
    role: Optional[str] = None
    organisation: Optional[str] = None



# class ServiceRequestUpdateAdmin(BaseModel):
#     submitter_id: UUID
#     representative_name: Optional[str]
#     representative_email: Optional[str]
#     contact_number: Optional[str]
#     ministry_name: Optional[str]
#     service_id: UUID
#     reason: Optional[str]
#     notes: Optional[str]
#     additional_info: Optional[str]
#     status: Optional[str]  # 'Draft', 'Submitted', 'Active', 'Completed'


class ServiceRequestUpdateAdmin(BaseModel):
    representative_name: Optional[str] = None
    representative_email: Optional[str] = None
    contact_number: Optional[str] = None
    ministry_name: Optional[str] = None
    service_id: Optional[UUID] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    additional_info: Optional[str] = None
    status: Optional[str] = None



# Request body schema
class CreateServiceRequest_admin(BaseModel):
    service_id: int
    description: str
    submitter_id: int



class ServiceRequestUpdate_user(BaseModel):
    representative_name: Optional[str]
    representative_email: Optional[str]
    contact_number: Optional[str]
    ministry_name: Optional[str]
    reason: Optional[str]
    notes: Optional[str]
    additional_info: Optional[str]
    status: Optional[str]

class ServiceRequestUpdateWithEmail(BaseModel):
    email: EmailStr
    update_data: ServiceRequestUpdate_user





from pydantic import BaseModel, EmailStr
from typing import Literal

class PendingUserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str
    organisation: str | None = None
    role: Literal["admin", "user"]  # ✅ Add this


from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime
from uuid import UUID

class PendingUserOut(BaseModel):
    temp_user_id: UUID
    name: str
    email: str
    organisation: Optional[str]
    submitted_at: datetime
    role: Literal["admin", "user"]  # ✅ Add this if you want to include role in the response

    class Config:
        orm_mode = True


from uuid import UUID
from pydantic import BaseModel

class ApprovePendingUserRequest(BaseModel):
    temp_user_id: UUID
 