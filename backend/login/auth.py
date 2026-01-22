#auth.py
from passlib.context import CryptContext
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv
from pydantic import BaseModel
from models import User
from database import get_db
from uuid import UUID

# Load environment variables
load_dotenv()

# Password context for hashing passwords
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Environment variables for JWT
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

# OAuth2PasswordBearer for token validation
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class UserOut(BaseModel):
    user_id: UUID
    name: str
    email: str
    role: str
    organisation: str

    class Config:
        orm_mode = True

# Hash a password
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

# Verify password
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

# Create a JWT access token
# def create_access_token(data: dict) -> str:
#     to_encode = data.copy()
#     expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
#     to_encode.update({"exp": expire})
#     return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# Dependency to get the current user from the token
def get_current_user(db: Session = Depends(get_db), token: str = Depends(oauth2_scheme)) -> UserOut:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        print(f"Received token: {token}")
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_email: str = payload.get("sub")
        print(f"Decoded email from token: {user_email}")  # ✅ Log decoded email
        if user_email is None:
            raise credentials_exception
    except JWTError as e:
        print(f"JWTError: {e}")  # ✅ Log decoding issues
        raise credentials_exception

    user = db.query(User).filter(User.email == user_email).first()
    print(f"User from DB: {user}")  # ✅ Log user result

    if user is None:
        raise credentials_exception

    return UserOut(
        user_id=user.user_id,
        name=user.name,
        email=user.email,
        role=user.role,
        organisation=user.organisation
    )

def require_role(role: str):
    def role_checker(user: User = Depends(get_current_user)):
        print(f"Checking role. Expected: {role}, Found: {user.role}")  # ✅ Log roles
        if user.role != role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: insufficient permissions"
            )
        return user
    return role_checker






from jose import jwt

def create_access_token(data: dict):
    ALGORITHM = "HS256"
    to_encode = data.copy()
    # Expiration time can be added if needed
    to_encode.update({"exp": datetime.utcnow() + timedelta(minutes=15)})
    
    # Ensure algorithm is not None
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)




