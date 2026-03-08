"""
Example FastAPI Application Integration for MindMate AI User Profile API

This file demonstrates how to integrate the users module into a FastAPI application.
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from contextlib import asynccontextmanager
import logging

# Import the users router
from . import router as users_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    # Startup
    logger.info("Starting MindMate AI API...")
    
    # Initialize database connections, etc.
    # await init_database()
    
    yield
    
    # Shutdown
    logger.info("Shutting down MindMate AI API...")
    
    # Close database connections, etc.
    # await close_database()


def create_application() -> FastAPI:
    """Create and configure the FastAPI application"""
    
    app = FastAPI(
        title="MindMate AI API",
        description="Mental health support platform API",
        version="1.0.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
        lifespan=lifespan,
    )
    
    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],  # Configure for production
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    
    # Include user profile router
    app.include_router(
        users_router,
        prefix="/api/v1",  # API version prefix
        tags=["users"]
    )
    
    # Add other routers here
    # app.include_router(auth_router, prefix="/api/v1")
    # app.include_router(sessions_router, prefix="/api/v1")
    # app.include_router(messages_router, prefix="/api/v1")
    
    # Exception handlers
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return JSONResponse(
            status_code=500,
            content={
                "error": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred"
            }
        )
    
    # Health check endpoint
    @app.get("/health", tags=["health"])
    async def health_check():
        return {
            "status": "healthy",
            "version": "1.0.0",
            "services": {
                "users": "healthy",
                # Add other services
            }
        }
    
    # Root endpoint
    @app.get("/", tags=["root"])
    async def root():
        return {
            "name": "MindMate AI API",
            "version": "1.0.0",
            "documentation": "/docs",
            "health": "/health"
        }
    
    return app


# Create the application instance
app = create_application()


# For running with uvicorn
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main_example:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
