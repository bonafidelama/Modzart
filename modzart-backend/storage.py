# storage.py
import os
import uuid
import time
import logging
import aiofiles
import boto3
import requests
import shutil
from fastapi import UploadFile, HTTPException, status
from botocore.exceptions import ClientError
from config import settings
from fastapi.responses import FileResponse

logger = logging.getLogger(__name__)

STORAGE_MODE = settings.STORAGE_MODE
LOCAL_STORAGE_PATH = settings.LOCAL_STORAGE_PATH
TEMP_UPLOAD_DIR = settings.TEMP_UPLOAD_DIR
VIRUS_TOTAL_API_KEY = settings.VIRUS_TOTAL_API_KEY

# Ensure directories exist
os.makedirs(TEMP_UPLOAD_DIR, exist_ok=True)
os.makedirs(LOCAL_STORAGE_PATH, exist_ok=True)

# Initialize S3 client if using S3 mode
s3_client = None
if STORAGE_MODE == "s3" and settings.AWS_ACCESS_KEY_ID and settings.AWS_SECRET_ACCESS_KEY:
    s3_client = boto3.client(
        "s3",
        region_name=settings.S3_REGION,
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    )
elif STORAGE_MODE == "s3":
    s3_client = boto3.client("s3", region_name=settings.S3_REGION)


async def save_upload_file_temp(upload_file: UploadFile) -> str:
    """Save uploaded file to temporary location. Returns the file path."""
    safe_filename = os.path.basename(upload_file.filename or "unknown_file")
    temp_file_path = os.path.join(TEMP_UPLOAD_DIR, f"{uuid.uuid4().hex}_{safe_filename}")
    try:
        async with aiofiles.open(temp_file_path, 'wb') as out_file:
            while content := await upload_file.read(1024 * 1024):
                await out_file.write(content)
        logger.info(f"Temporarily saved uploaded file to: {temp_file_path}")
        return temp_file_path
    except Exception as e:
        logger.error(f"Failed to save uploaded file temporarily: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Could not save uploaded file.")
    finally:
        await upload_file.seek(0)


async def scan_file_for_viruses(file_path: str) -> bool:
    """Scan file for viruses. In local mode, always returns True."""
    if STORAGE_MODE == "local" or not VIRUS_TOTAL_API_KEY:
        logger.warning("Virus scanning disabled in local mode or no API key")
        return True

    file_size = os.path.getsize(file_path)
    logger.info(f"Starting VirusTotal scan for file: {file_path} (Size: {file_size} bytes)")

    # VirusTotal API v3 endpoints
    vt_upload_url = 'https://www.virustotal.com/api/v3/files'
    vt_analysis_url_template = 'https://www.virustotal.com/api/v3/analyses/{}'
    headers = {'x-apikey': VIRUS_TOTAL_API_KEY}

    # --- 1. Upload File (or get ID for existing hash) ---
    analysis_id = None
    try:
        with open(file_path, 'rb') as file:
            files = {'file': (os.path.basename(file_path), file)}
            response = requests.post(vt_upload_url, files=files, headers=headers, timeout=120) # Increased timeout for upload
            response.raise_for_status() # Raise HTTPError for bad responses (4xx or 5xx)

            response_data = response.json()
            analysis_id = response_data.get('data', {}).get('id')
            if not analysis_id:
                logger.error(f"VirusTotal upload response missing analysis ID: {response_data}")
                return False # Treat as unsafe on unexpected response

            logger.info(f"VirusTotal file upload successful. Analysis ID: {analysis_id}")

    except requests.exceptions.RequestException as e:
        logger.error(f"VirusTotal API request failed during upload: {e}", exc_info=True)
        # Policy: Treat API errors as potentially unsafe? Or allow upload with warning? Let's treat as unsafe.
        return False
    except Exception as e:
        logger.error(f"Unexpected error during VirusTotal upload: {e}", exc_info=True)
        return False # Treat as unsafe

    # --- 2. Poll Analysis Result ---
    if not analysis_id: return False # Should not happen if upload succeeded, but safety check

    analysis_url = vt_analysis_url_template.format(analysis_id)
    max_attempts = 15 # e.g., 15 attempts * 20 seconds = 5 minutes max wait
    poll_interval_seconds = 20

    for attempt in range(max_attempts):
        try:
            logger.info(f"Polling VirusTotal analysis (Attempt {attempt + 1}/{max_attempts}): {analysis_url}")
            response = requests.get(analysis_url, headers=headers, timeout=30)
            response.raise_for_status()
            analysis_data = response.json().get('data', {})
            status = analysis_data.get('attributes', {}).get('status')

            if status == 'completed':
                logger.info("VirusTotal analysis completed.")
                results = analysis_data.get('attributes', {}).get('stats', {})
                malicious = results.get('malicious', 0)
                suspicious = results.get('suspicious', 0)
                undetected = results.get('undetected', 0)
                logger.info(f"VirusTotal Results: Malicious={malicious}, Suspicious={suspicious}, Undetected={undetected}")

                if malicious > 0 or suspicious > 0:
                     logger.warning(f"File deemed MALICIOUS or SUSPICIOUS by VirusTotal: {file_path}")
                     return False # File is not clean
                else:
                     logger.info(f"File deemed CLEAN by VirusTotal: {file_path}")
                     return True # File is clean

            elif status == 'queued' or status == 'inprogress':
                 logger.info(f"VirusTotal analysis status: {status}. Waiting {poll_interval_seconds}s...")
                 time.sleep(poll_interval_seconds) # Wait before next poll
            else:
                 logger.error(f"VirusTotal analysis returned unexpected status: {status}. Data: {analysis_data}")
                 return False # Treat unexpected status as unsafe

        except requests.exceptions.RequestException as e:
            logger.error(f"VirusTotal API request failed during polling: {e}", exc_info=True)
            # Decide if transient API errors should fail the scan or allow retry? Let's fail for now.
            return False
        except Exception as e:
            logger.error(f"Unexpected error during VirusTotal polling: {e}", exc_info=True)
            return False

    logger.error(f"VirusTotal analysis did not complete within the timeout period for file: {file_path}")
    return False # Failed to get result in time


def upload_file_to_storage(file_path: str, object_name: str) -> str:
    """Upload file to storage (S3 or local). Returns the object key/path."""
    if STORAGE_MODE == "local":
        try:
            # Create directory structure if it doesn't exist
            final_path = os.path.join(LOCAL_STORAGE_PATH, object_name)
            os.makedirs(os.path.dirname(final_path), exist_ok=True)
            
            # Copy file to local storage
            shutil.copy2(file_path, final_path)
            logger.info(f"Successfully copied file to local storage: {final_path}")
            return object_name
        except Exception as e:
            logger.error(f"Failed to copy file to local storage: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to store file locally.")
    else:
        if not s3_client:
            raise HTTPException(status_code=500, detail="S3 storage not configured.")
        try:
            s3_client.upload_file(file_path, settings.S3_BUCKET_NAME, object_name)
            logger.info(f"Successfully uploaded to S3: s3://{settings.S3_BUCKET_NAME}/{object_name}")
            return object_name
        except Exception as e:
            logger.error(f"Failed to upload file to S3: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to upload file to storage.")


def delete_file_from_storage(object_name: str) -> bool:
    """Delete file from storage (S3 or local)."""
    if STORAGE_MODE == "local":
        try:
            file_path = os.path.join(LOCAL_STORAGE_PATH, object_name)
            if os.path.exists(file_path):
                os.remove(file_path)
                logger.info(f"Successfully deleted local file: {file_path}")
            return True
        except Exception as e:
            logger.error(f"Failed to delete local file: {e}", exc_info=True)
            return False
    else:
        if not s3_client:
            return False
        try:
            s3_client.delete_object(Bucket=settings.S3_BUCKET_NAME, Key=object_name)
            return True
        except Exception as e:
            logger.error(f"Failed to delete from S3: {e}", exc_info=True)
            return False


def generate_download_url(object_name: str, expiration=3600) -> str:
    """Generate a URL for downloading a file."""
    if STORAGE_MODE == "local":
        file_path = os.path.join(LOCAL_STORAGE_PATH, object_name)
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        # For local storage, return the direct file path
        return f"/download/{object_name}"
    else:
        if not s3_client:
            raise HTTPException(status_code=500, detail="S3 storage not configured.")
        try:
            return s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': settings.S3_BUCKET_NAME, 'Key': object_name},
                ExpiresIn=expiration
            )
        except Exception as e:
            logger.error(f"Failed to generate download URL: {e}", exc_info=True)
            raise HTTPException(status_code=500, detail="Failed to generate download URL.")


async def handle_mod_upload(upload_file: UploadFile, mod_id: int, file_path: str = None) -> str:
    """Process a mod file upload with virus scanning and storage."""
    temp_file_path = None
    try:
        temp_file_path = await save_upload_file_temp(upload_file)
        
        logger.info(f"Starting security scan for temp file: {temp_file_path}")
        is_clean = await scan_file_for_viruses(temp_file_path)
        if not is_clean:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="File failed security scan.")
        
        if file_path:
            # Use the provided custom file path
            object_name = file_path
        else:
            # Use the default path for regular mod uploads
            safe_filename = os.path.basename(upload_file.filename or f"mod_{mod_id}_file")
            object_name = f"mods/{mod_id}/{safe_filename}"
        
        return upload_file_to_storage(temp_file_path, object_name)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error during mod upload: {e}", exc_info=True)
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to process file upload.")
    finally:
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.info(f"Cleaned up temporary file: {temp_file_path}")
            except OSError as e:
                logger.error(f"Failed to clean up temporary file: {e}", exc_info=True)