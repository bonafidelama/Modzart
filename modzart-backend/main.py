# main.py
import os
import logging
import logging.config
import sys
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse

from routers import auth, users, mods
from config import settings

# --- Logging Configuration ---
LOGGING_CONFIG = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "default": {
            "()": "uvicorn.logging.DefaultFormatter",
            "fmt": "%(levelprefix)s %(asctime)s [%(name)s] %(message)s",
            "datefmt": "%Y-%m-%d %H:%M:%S",
            "use_colors": True,
        },
        "access": {
            "()": "uvicorn.logging.AccessFormatter",
            "fmt": '%(levelprefix)s %(asctime)s [%(name)s] %(client_addr)s - "%(request_line)s" %(status_code)s',
            "datefmt": "%Y-%m-%d %H:%M:%S",
            "use_colors": True,
        },
    },
    "handlers": {
        "default": {
            "formatter": "default",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stderr",
        },
        "access": {
            "formatter": "access",
            "class": "logging.StreamHandler",
            "stream": "ext://sys.stdout",
        },
    },
    "loggers": {
        "uvicorn": {"handlers": ["default"], "level": "INFO", "propagate": False},
        "uvicorn.error": {"level": "INFO"},
        "uvicorn.access": {"handlers": ["access"], "level": "INFO", "propagate": False},
        "main": {"handlers": ["default"], "level": "INFO", "propagate": False},
        "routers": {"handlers": ["default"], "level": "INFO", "propagate": True},
        "storage": {"handlers": ["default"], "level": "INFO", "propagate": True},
        "security": {"handlers": ["default"], "level": "INFO", "propagate": True},
        "db_config": {"handlers": ["default"], "level": "INFO", "propagate": True},
    },
}

is_reloader = any(arg == "--reload" for arg in sys.argv) or os.getenv("WORKERS_PER_CORE")
if not is_reloader or os.getenv("INSTANCE_ID") == "0":
    logging.config.dictConfig(LOGGING_CONFIG)
    logger = logging.getLogger(__name__)
    logger.info("Logging configured.")
else:
    logger = logging.getLogger(__name__)

app = FastAPI(
    title="Modzart API",
    description="API for GTA V mod platform",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Specific frontend origin instead of wildcard
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"]
)

@app.get("/download/{path:path}")
async def serve_file(path: str):
    """Serve files from local storage"""
    file_path = os.path.join(settings.LOCAL_STORAGE_PATH, path)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(file_path)

# Include routers
logger.info("Including routers...")
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(mods.router)
logger.info("Routers included.")

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Uvicorn server...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", "8000")),
        reload=True,
        log_config=None
    )