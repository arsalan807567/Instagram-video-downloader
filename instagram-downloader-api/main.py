from typing import Optional
from urllib.parse import urlparse
from uuid import uuid4

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, HttpUrl


app = FastAPI(
    title="Instagram Media Downloader API",
    version="1.0.0",
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


class MediaRequest(BaseModel):
    url: str = Field(..., min_length=1, max_length=2048)


class Quality(BaseModel):
    label: str
    width: Optional[int] = None
    height: Optional[int] = None
    download_url: HttpUrl


class MediaResult(BaseModel):
    type: str
    thumbnail: Optional[HttpUrl] = None
    duration: Optional[float] = None
    qualities: list[Quality]


class MediaResponse(BaseModel):
    success: bool
    request_id: str
    media: Optional[MediaResult] = None
    error: Optional[str] = None


ALLOWED_HOSTS = {
    "instagram.com",
    "www.instagram.com",
}


def validate_instagram_url(url: str) -> bool:
    try:
        parsed = urlparse(url)

        if parsed.scheme != "https":
            return False

        hostname = (parsed.hostname or "").lower()

        if hostname not in ALLOWED_HOSTS:
            return False

        if not parsed.path or parsed.path == "/":
            return False

        return True

    except Exception:
        return False


async def get_media(url: str) -> MediaResult:
    return MediaResult(
        type="video",
        thumbnail="https://placehold.co/1280x720/png?text=Demo+Video",
        duration=30,
        qualities=[
            Quality(
                label="360p",
                width=640,
                height=360,
                download_url="https://www.w3schools.com/html/mov_bbb.mp4",
            ),
            Quality(
                label="720p",
                width=1280,
                height=720,
                download_url="https://www.w3schools.com/html/mov_bbb.mp4",
            ),
        ],
    )


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "Instagram Media Downloader API",
    }


@app.get("/health")
async def health():
    return {
        "status": "ok",
    }


@app.post("/api/media", response_model=MediaResponse)
async def media(request: Request, payload: MediaRequest):

    request_id = uuid4().hex

    if not validate_instagram_url(payload.url):
        return MediaResponse(
            success=False,
            request_id=request_id,
            error="Please provide a valid HTTPS Instagram URL.",
        )

    try:
        result = await get_media(payload.url)

        return MediaResponse(
            success=True,
            request_id=request_id,
            media=result,
        )

    except Exception:
        return MediaResponse(
            success=False,
            request_id=request_id,
            error="Unable to process the media.",
        )
