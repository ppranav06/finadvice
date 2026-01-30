from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .config import get_settings
from .routes import metrics, forecast, recurring, snapshots, chat


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler."""
    # Startup
    settings = get_settings()
    print(f"🚀 ML Service starting on port {settings.ml_service_port}")
    print(f"📊 Cache TTL: {settings.cache_ttl_hours} hours")
    print(f"🔮 Forecast horizon: {settings.forecast_months} months")
    print(f"🤖 Gemini model: {settings.gemini_model}")
    print(f"🔑 Gemini API key configured: {'Yes' if settings.gemini_api_key else 'No'}")
    yield
    # Shutdown
    print("👋 ML Service shutting down")


app = FastAPI(
    title="FinAdvice ML Service",
    description="Machine learning service for financial predictions and metrics",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(metrics.router, prefix="/api/ml", tags=["Metrics"])
app.include_router(forecast.router, prefix="/api/ml", tags=["Forecast"])
app.include_router(recurring.router, prefix="/api/ml", tags=["Recurring"])
app.include_router(snapshots.router, prefix="/api/ml", tags=["Snapshots"])
app.include_router(chat.router, prefix="/api/ml", tags=["Chat"])


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "service": "ml"}


@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "service": "FinAdvice ML Service",
        "version": "1.0.0",
        "endpoints": {
            "metrics": "/api/ml/metrics/{user_id}",
            "forecast": "/api/ml/forecast/{user_id}",
            "recurring": "/api/ml/recurring/{user_id}",
            "snapshots": "/api/ml/snapshots/{user_id}",
            "analyze": "/api/ml/analyze/{user_id}",
            "chat": "/api/ml/chat/{user_id}"
        }
    }
