# routers/mods.py
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Body
from sqlalchemy.orm import Session
from typing import List, Optional
import logging
from pydantic import BaseModel
from datetime import datetime

from db_config import get_db
from models import User, Mod
from schemas import ModCreate, Mod as ModSchema, ModUpdate
from security import get_current_user
from storage import handle_mod_upload, generate_download_url, delete_file_from_storage

logger = logging.getLogger(__name__)

# Define a Project model for request validation
class ProjectCreate(BaseModel):
    name: str
    url: str
    visibility: str
    summary: str

# Define Version-related models
class VersionCreate(BaseModel):
    version_number: str
    changelog: Optional[str] = None

class Version(VersionCreate):
    id: int
    mod_id: int
    file_path: str
    created_at: datetime
    
    class Config:
        from_attributes = True

router = APIRouter(
    prefix="/mods",
    tags=["mods"],
)

# Project creation endpoint
@router.post("/project", response_model=ModSchema, status_code=status.HTTP_201_CREATED)
async def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new project (mod without file)"""
    try:
        # Create a new mod entry with project data
        db_mod = Mod(
            title=project.name,
            description=project.summary,
            filename=f"project:{project.url}",  # Using filename field to store project URL with a prefix
            user_id=current_user.id,
            project_visibility=project.visibility,
        )
        
        db.add(db_mod)
        db.commit()
        db.refresh(db_mod)
        
        logger.info(f"Successfully created project '{project.name}' (ID: {db_mod.id}) by user '{current_user.username}'.")
        return db_mod
        
    except Exception as e:
        db.rollback()
        logger.error(f"Error creating project: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create project: {str(e)}"
        )

@router.post("/", response_model=ModSchema, status_code=status.HTTP_201_CREATED)
async def create_mod(
    title: str = Form(...),
    description: str = Form(...),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a new mod"""
    original_filename = file.filename or "unknown"
    db_mod = Mod(
        title=title,
        description=description,
        filename="PENDING_UPLOAD",
        user_id=current_user.id
    )

    db.add(db_mod)
    try:
        db.flush()
        db.refresh(db_mod)
    except Exception as db_exc:
        db.rollback()
        logger.error(f"Database error during initial mod flush: {db_exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create mod entry in database: {str(db_exc)}"
        )

    s3_object_key = None
    try:
        s3_object_key = await handle_mod_upload(file, db_mod.id)
        db_mod.filename = s3_object_key
        db.commit()
        db.refresh(db_mod)
        logger.info(f"Successfully created mod '{title}' (ID: {db_mod.id}) by user '{current_user.username}'. S3 Key: {s3_object_key}")
        return db_mod

    except HTTPException as http_exc:
        db.rollback()
        logger.warning(f"HTTP error during mod file upload (mod_id: {db_mod.id}): {http_exc.detail}")
        raise http_exc
    except Exception as e:
        db.rollback()
        logger.error(f"Error during mod file upload (mod_id: {db_mod.id}), rolling back DB changes: {e}", exc_info=True)
        if s3_object_key:
            logger.warning(f"Attempting to clean up partially uploaded S3 file: {s3_object_key}")
            delete_file_from_storage(s3_object_key)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload mod file: {str(e)}"
        )

@router.post("/{mod_id}/versions", status_code=status.HTTP_201_CREATED)
async def upload_version(
    mod_id: int,
    version_number: str = Form(...),
    changelog: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload a new version for a mod"""
    # First check if the mod exists and the user owns it
    db_mod = db.query(Mod).filter(Mod.id == mod_id).first()
    if db_mod is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mod not found"
        )
    
    if db_mod.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to add versions to this mod"
        )
    
    try:
        # Process the file upload
        original_filename = file.filename or f"v{version_number}"
        file_path = f"versions/{mod_id}/{version_number}/{original_filename}"
        
        # Use existing storage utility to handle the upload
        s3_object_key = await handle_mod_upload(file, mod_id, file_path=file_path)
        
        # Return success response
        logger.info(f"Successfully uploaded version {version_number} for mod {mod_id} by user '{current_user.username}'")
        
        return {
            "success": True,
            "version": {
                "version_number": version_number,
                "changelog": changelog,
                "file_path": s3_object_key,
                "created_at": datetime.utcnow()
            }
        }
        
    except Exception as e:
        logger.error(f"Error uploading version for mod {mod_id}: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload version: {str(e)}"
        )

@router.get("/{mod_id}/versions", status_code=status.HTTP_200_OK)
async def get_versions(
    mod_id: int,
    db: Session = Depends(get_db)
):
    """Get all versions for a mod"""
    # Check if the mod exists
    db_mod = db.query(Mod).filter(Mod.id == mod_id).first()
    if db_mod is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mod not found"
        )
    
    # In a complete implementation, this would query a versions table
    # For now, we'll return a placeholder empty list since we haven't set up a versions table yet
    return []

@router.get("/", response_model=List[ModSchema])
async def read_mods(
    skip: int = 0,
    limit: int = 100,
    search: Optional[str] = None,
    user_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    """List all mods with optional search and filtering"""
    query = db.query(Mod)
    
    # Filter by search term if provided
    if search:
        search_term = f"%{search}%"
        query = query.filter(Mod.title.ilike(search_term))
    
    # Filter by user_id if provided
    if user_id:
        query = query.filter(Mod.user_id == user_id)
        
    mods = query.order_by(Mod.created_at.desc()).offset(skip).limit(limit).all()
    return mods

@router.get("/{mod_id}", response_model=ModSchema)
async def read_mod(mod_id: int, db: Session = Depends(get_db)):
    """Get a specific mod by ID"""
    db_mod = db.query(Mod).filter(Mod.id == mod_id).first()
    if db_mod is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mod not found"
        )
    return db_mod

@router.put("/{mod_id}", response_model=ModSchema)
async def update_mod(
    mod_id: int,
    mod_update: ModUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a mod's details (title and description only)"""
    db_mod = db.query(Mod).filter(Mod.id == mod_id).first()
    if db_mod is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mod not found"
        )
    if db_mod.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to modify this mod"
        )

    update_data = mod_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_mod, key, value)

    try:
        db.commit()
        db.refresh(db_mod)
        logger.info(f"Updated mod {mod_id} details by user '{current_user.username}'.")
    except Exception as db_exc:
        db.rollback()
        logger.error(f"Database error during mod update (mod_id: {mod_id}): {db_exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update mod in database."
        )
    return db_mod

@router.delete("/{mod_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_mod(
    mod_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a mod and its associated file from storage"""
    db_mod = db.query(Mod).filter(Mod.id == mod_id).first()
    if db_mod is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mod not found"
        )
    if db_mod.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this mod"
        )

    s3_object_key = db_mod.filename
    delete_succeeded = True

    if s3_object_key and s3_object_key != "PENDING_UPLOAD":
        logger.info(f"Attempting S3 deletion for key: {s3_object_key} (mod_id: {mod_id})")
        try:
            s3_deleted = delete_file_from_storage(s3_object_key)
            if not s3_deleted:
                delete_succeeded = False
                logger.error(f"Failed to delete S3 object {s3_object_key} for mod {mod_id}. Aborting database deletion.")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to delete file from storage. Mod deletion aborted."
                )
            else:
                logger.info(f"S3 deletion successful (or file already gone) for key: {s3_object_key}")

        except Exception as s3_exc:
            delete_succeeded = False
            logger.error(f"Error occurred during S3 deletion for key {s3_object_key}: {s3_exc}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error deleting file from storage: {s3_exc}. Mod deletion aborted."
            )
    else:
        logger.warning(f"No valid S3 object key found for mod {mod_id} (Filename: {s3_object_key}). Skipping S3 deletion.")

    if delete_succeeded:
        try:
            db.delete(db_mod)
            db.commit()
            logger.info(f"Successfully deleted mod {mod_id} from database.")
        except Exception as db_exc:
            db.rollback()
            logger.error(f"Database error during mod deletion (mod_id: {mod_id}) after storage cleanup: {db_exc}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to delete mod from database after attempting storage cleanup."
            )
    return None

@router.get("/{mod_id}/download", response_model=dict)
async def download_mod(
    mod_id: int,
    db: Session = Depends(get_db)
):
    """Get a temporary presigned download URL for a mod file"""
    db_mod = db.query(Mod).filter(Mod.id == mod_id).first()
    if db_mod is None or not db_mod.filename or db_mod.filename == "PENDING_UPLOAD":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mod not found or file reference missing"
        )

    s3_object_key = db_mod.filename

    try:
        download_url = generate_download_url(s3_object_key)
        db_mod.downloads = (db_mod.downloads or 0) + 1
        db.commit()
        logger.info(f"Generated download URL for mod {mod_id}. New download count: {db_mod.downloads}")
        return {"download_url": download_url}

    except HTTPException as http_exc:
        db.rollback()
        logger.error(f"Failed to generate download URL for mod {mod_id} (key: {s3_object_key}): {http_exc.detail}")
        raise http_exc
    except Exception as e:
        db.rollback()
        logger.error(f"Unexpected error generating download URL for mod {mod_id} (key: {s3_object_key}): {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Failed to generate download URL.")