from pydantic import BaseModel

class SystemHealthResponse(BaseModel):
    database: str = "connected"
    google_auth: str = "connected"
    groq: str = "connected"
    qdrant: str = "connected"
