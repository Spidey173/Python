from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.routers import auth, challenges, execution, ai, gamification, profile, admin

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Python Quest",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
)

import time
import uuid
import logging
from starlette.requests import Request
from starlette.responses import Response

logger = logging.getLogger("pyforge.api")

# CORS Middleware configuration with credentials support
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-Request-ID"],
)


@app.middleware("http")
async def correlation_and_metrics_middleware(request: Request, call_next):
    # Correlation ID (propagation or generation)
    request_id = request.headers.get("X-Request-ID") or f"req_{uuid.uuid4().hex[:12]}"
    request.state.request_id = request_id

    start_time = time.perf_counter()
    response: Response = await call_next(request)
    duration_ms = (time.perf_counter() - start_time) * 1000

    response.headers["X-Request-ID"] = request_id
    response.headers["X-Response-Time-Ms"] = f"{duration_ms:.2f}"

    # Structured observability log for non-static endpoints
    if not request.url.path.startswith("/_next"):
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"status={response.status_code} latency={duration_ms:.1f}ms"
        )

    return response


from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    request_id = getattr(request.state, "request_id", None)
    detail_msg = exc.detail
    retry_after = exc.headers.get("Retry-After") if exc.headers else None

    # Map status codes to machine-readable typed error codes
    if exc.status_code == 429:
        code = "RATE_LIMITED"
    elif exc.status_code == 401:
        code = "INVALID_CREDENTIALS" if "Incorrect" in str(detail_msg) else "UNAUTHORIZED"
    elif exc.status_code == 403:
        code = "FORBIDDEN"
    elif exc.status_code == 404:
        code = "NOT_FOUND"
    elif exc.status_code == 400:
        if "already taken" in str(detail_msg):
            code = "USERNAME_TAKEN"
        elif "already registered" in str(detail_msg):
            code = "EMAIL_TAKEN"
        else:
            code = "BAD_REQUEST"
    elif exc.status_code == 422:
        code = "VALIDATION_ERROR"
    else:
        code = "ERROR"

    content = {
        "code": code,
        "message": str(detail_msg),
        "detail": str(detail_msg),  # Preserves backward compatibility
        "request_id": request_id,
    }
    if retry_after:
        content["retry_after"] = int(retry_after)

    return JSONResponse(
        status_code=exc.status_code,
        content=content,
        headers=exc.headers,
    )


@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    request_id = getattr(request.state, "request_id", None)
    return JSONResponse(
        status_code=422,
        content={
            "code": "VALIDATION_ERROR",
            "message": "Invalid request payload",
            "detail": exc.errors(),
            "request_id": request_id,
        },
    )

# Include Routers
app.include_router(auth.router, prefix=settings.API_V1_STR)
app.include_router(challenges.router, prefix=settings.API_V1_STR)
app.include_router(execution.router, prefix=settings.API_V1_STR)
app.include_router(ai.router, prefix=settings.API_V1_STR)
app.include_router(gamification.router, prefix=settings.API_V1_STR)
app.include_router(profile.router, prefix=settings.API_V1_STR)
app.include_router(admin.router, prefix=settings.API_V1_STR)


@app.get("/")
async def root():
    return {
        "app": "Python Quest API",
        "status": "online",
        "docs": f"{settings.API_V1_STR}/docs"
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}
