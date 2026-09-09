from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import engine, Base
from app.seed_data import seed_database
from app.routers import auth, challenges, execution, ai, gamification, profile, admin


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: create tables and seed default challenges & achievements
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    try:
        await seed_database()
    except Exception as e:
        print(f"Database seeding note: {e}")
    yield
    # Shutdown
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Backend API for Python Quest: The Ultimate Python Coding Adventure",
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    docs_url=f"{settings.API_V1_STR}/docs",
    redoc_url=f"{settings.API_V1_STR}/redoc",
    lifespan=lifespan
)

# CORS Middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Production can restrict to domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
        "tagline": "The Ultimate Python Coding Adventure",
        "status": "online",
        "docs": f"{settings.API_V1_STR}/docs"
    }


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "version": settings.VERSION}
