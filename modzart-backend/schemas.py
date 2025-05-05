from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserInDB(UserBase):
    id: int
    
    class Config:
        from_attributes = True

class User(UserInDB):
    pass

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class ModBase(BaseModel):
    title: str
    description: str

class ModCreate(ModBase):
    pass

class ModUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None

class ModInDB(ModBase):
    id: int
    filename: str
    downloads: int
    created_at: datetime
    user_id: int
    
    class Config:
        from_attributes = True

class Mod(ModInDB):
    uploader: User