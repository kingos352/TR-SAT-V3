from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.api.router import api_router

app = FastAPI(
    title=settings.APP_NAME,
    description="Backend services for dynamic orbit propagation, pass prediction, and resident space object tracking.",
    version="3.0.0"
)

# Configure CORS Middleware for frontend communications
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Router
app.include_router(api_router, prefix="/api/v1")

@app.get("/", response_model=dict)
async def read_root():
    """
    Service entry point returning simple greetings message.
    """
    return {
        "message": "TR-SAT Mission Control V3 API"
    }
