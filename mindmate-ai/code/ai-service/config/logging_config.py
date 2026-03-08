"""
MindMate AI - Logging Configuration
Structured logging with JSON format for production environments.
"""

import json
import logging
import sys
from datetime import datetime
from typing import Any, Dict
from pythonjsonlogger import jsonlogger
from config.settings import settings


class CustomJsonFormatter(jsonlogger.JsonFormatter):
    """Custom JSON formatter with additional fields."""
    
    def add_fields(self, log_record: Dict[str, Any], record: logging.LogRecord, message_dict: Dict[str, Any]) -> None:
        super().add_fields(log_record, record, message_dict)
        
        # Add timestamp
        log_record['timestamp'] = datetime.utcnow().isoformat()
        log_record['service'] = settings.APP_NAME
        log_record['version'] = settings.APP_VERSION
        log_record['environment'] = settings.ENVIRONMENT
        
        # Add level as uppercase string
        log_record['level'] = record.levelname
        
        # Add source location
        log_record['source'] = {
            'file': record.pathname,
            'line': record.lineno,
            'function': record.funcName
        }


def setup_logging() -> logging.Logger:
    """Configure and return the application logger."""
    
    logger = logging.getLogger("mindmate_ai")
    logger.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
    
    # Clear existing handlers
    logger.handlers = []
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(getattr(logging, settings.LOG_LEVEL.upper()))
    
    if settings.LOG_FORMAT.lower() == "json":
        formatter = CustomJsonFormatter(
            '%(timestamp)s %(level)s %(name)s %(message)s'
        )
    else:
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
    
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    return logger


# Initialize logger
logger = setup_logging()


class LoggerContext:
    """Context manager for adding context to logs."""
    
    def __init__(self, **context):
        self.context = context
        self.logger = logging.getLogger("mindmate_ai")
        self.original_extra = {}
    
    def __enter__(self):
        for key, value in self.context.items():
            self.original_extra[key] = getattr(self.logger, key, None)
            setattr(self.logger, key, value)
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        for key, value in self.original_extra.items():
            if value is None:
                delattr(self.logger, key)
            else:
                setattr(self.logger, key, value)


def log_request(request_id: str, user_id: str, endpoint: str, method: str, **extra) -> None:
    """Log incoming request with context."""
    logger.info(
        f"Incoming request: {method} {endpoint}",
        extra={
            "request_id": request_id,
            "user_id": user_id,
            "endpoint": endpoint,
            "method": method,
            **extra
        }
    )


def log_response(request_id: str, user_id: str, status_code: int, duration_ms: float, **extra) -> None:
    """Log outgoing response with context."""
    logger.info(
        f"Response: {status_code} in {duration_ms:.2f}ms",
        extra={
            "request_id": request_id,
            "user_id": user_id,
            "status_code": status_code,
            "duration_ms": duration_ms,
            **extra
        }
    )


def log_error(request_id: str, user_id: str, error: Exception, **extra) -> None:
    """Log error with context."""
    logger.error(
        f"Error: {str(error)}",
        extra={
            "request_id": request_id,
            "user_id": user_id,
            "error_type": type(error).__name__,
            "error_message": str(error),
            **extra
        },
        exc_info=True
    )
