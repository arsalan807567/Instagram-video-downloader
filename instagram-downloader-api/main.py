import os
import re
import shutil
import tempfile
import uuid
from pathlib import Path
from urllib.parse import urlparse

import yt_dlp
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from starlette.background import BackgroundTask


# ============================================================
# CONFIGURATION
# ============================================================

APP_NAME = "Instagram Video Downloader API"
APP_VERSION = "2.0.0"

MAX_FILE_SIZE_MB = 500

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://instagram-video-downloader-iota-six.vercel.app",
)

ALLOWED_INSTAGRAM_HOSTS = {
    "instagram.com",
    "www.instagram.com",
}


# ============================================================
# FASTAPI
# ============================================================

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description="API for downloading publicly accessible Instagram videos.",
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        FRONTEND_URL,
    ],
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST MODELS
# ============================================================

class DownloadRequest(BaseModel):
    url: HttpUrl


# ============================================================
# URL VALIDATION
# ============================================================

def validate_instagram_url(url: str) -> None:
    parsed_url = urlparse(url)

    if parsed_url.scheme not in {"http", "https"}:
        raise HTTPException(
            status_code=400,
            detail="Only HTTP and HTTPS URLs are supported.",
        )

    hostname = (parsed_url.hostname or "").lower()

    if hostname not in ALLOWED_INSTAGRAM_HOSTS:
        raise HTTPException(
            status_code=400,
            detail="Invalid URL. Please provide a valid Instagram URL.",
        )


# ============================================================
# TEMP FILE CLEANUP
# ============================================================

def cleanup_directory(directory: str) -> None:
    try:
        shutil.rmtree(
            directory,
            ignore_errors=True,
        )
    except Exception:
        pass


# ============================================================
# FILENAME
# ============================================================

def sanitize_filename(filename: str) -> str:
    filename = re.sub(
        r"[^\w\s.-]",
        "",
        filename,
    )

    filename = re.sub(
        r"\s+",
        "_",
        filename,
    )

    filename = filename.strip("._")

    if not filename:
        filename = "instagram_video"

    return filename[:100]


# ============================================================
# VIDEO FILE FINDER
# ============================================================

def find_video_file(directory: str) -> Path | None:
    allowed_extensions = {
        ".mp4",
        ".mkv",
        ".webm",
        ".mov",
    }

    files = Path(directory).glob("*")

    video_files = [
        file
        for file in files
        if file.is_file()
        and file.suffix.lower() in allowed_extensions
    ]

    if not video_files:
        return None

    return max(
        video_files,
        key=lambda file: file.stat().st_size,
    )


# ============================================================
# YT-DLP INFORMATION
# ============================================================

def extract_media_info(instagram_url: str) -> dict:
    """
    Extract metadata without downloading the video.
    """

    ydl_options = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "skip_download": True,
        "extract_flat": False,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_options) as ydl:
            info = ydl.extract_info(
                instagram_url,
                download=False,
            )

        if not info:
            raise HTTPException(
                status_code=404,
                detail="Unable to retrieve Instagram media.",
            )

        return info

    except yt_dlp.utils.DownloadError as error:
        raise HTTPException(
            status_code=422,
            detail=(
                "Unable to retrieve this Instagram video. "
                "Make sure it is publicly accessible."
            ),
        ) from error


# ============================================================
# QUALITY NORMALIZATION
# ============================================================

def get_available_qualities(info: dict) -> list[dict]:
    """
    Convert yt-dlp formats into a small list of usable
    quality options.

    Only formats actually returned by Instagram/yt-dlp
    are exposed.
    """

    formats = info.get("formats") or []

    candidates = []

    for fmt in formats:
        height = fmt.get("height")
        width = fmt.get("width")
        format_id = fmt.get("format_id")

        if not height or not width or not format_id:
            continue

        # Ignore extremely small/odd formats.
        if height < 240:
            continue

        # We want video formats.
        if fmt.get("vcodec") in (None, "none"):
            continue

        candidates.append(
            {
                "format_id": str(format_id),
                "height": int(height),
                "width": int(width),
                "ext": fmt.get("ext") or "mp4",
                "fps": fmt.get("fps"),
                "filesize": fmt.get("filesize")
                or fmt.get("filesize_approx"),
            }
        )

    # Keep only the best format for each height.
    best_by_height: dict[int, dict] = {}

    for item in candidates:
        height = item["height"]

        existing = best_by_height.get(height)

        if existing is None:
            best_by_height[height] = item
            continue

        existing_filesize = existing.get("filesize") or 0
        item_filesize = item.get("filesize") or 0

        if item_filesize > existing_filesize:
            best_by_height[height] = item

    qualities = []

    for height, item in sorted(
        best_by_height.items(),
        key=lambda pair: pair[0],
    ):
        if height >= 2160:
            label = "2160p"
        elif height >= 1440:
            label = "1440p"
        elif height >= 1080:
            label = "1080p"
        elif height >= 720:
            label = "720p"
        elif height >= 480:
            label = "480p"
        else:
            label = "360p"

        qualities.append(
            {
                "label": label,
                "width": item["width"],
                "height": height,
                "format_id": item["format_id"],
                "fileSize": (
                    f"{round(item['filesize'] / (1024 * 1024), 1)} MB"
                    if item.get("filesize")
                    else None
                ),
            }
        )

    # Remove duplicate labels.
    unique = {}

    for quality in qualities:
        unique[quality["label"]] = quality

    return list(
        sorted(
            unique.values(),
            key=lambda item: item["height"],
        )
    )


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
async def root():
    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "status": "online",
    }


@app.get("/health")
async def health():
    return {
        "status": "healthy",
    }


# ============================================================
# MEDIA INFORMATION
# ============================================================

@app.get("/api/media")
async def media_info(
    url: HttpUrl,
):
    """
    Retrieve metadata and available video qualities
    without downloading the video.
    """

    instagram_url = str(url)

    validate_instagram_url(
        instagram_url
    )

    info = extract_media_info(
        instagram_url
    )

    qualities = get_available_qualities(
        info
    )

    if not qualities:
        raise HTTPException(
            status_code=422,
            detail=(
                "No downloadable video formats "
                "were found for this Instagram post."
            ),
        )

    thumbnail = info.get("thumbnail") or ""

    duration = info.get("duration")

    media_type = "reel"

    webpage_url = info.get("webpage_url") or instagram_url

    if "/reel/" in webpage_url:
        media_type = "reel"
    elif "/p/" in webpage_url:
        media_type = "video"

    return {
        "success": True,
        "type": media_type,
        "thumbnail": thumbnail,
        "duration": duration,
        "qualities": qualities,
    }


# ============================================================
# VIDEO DOWNLOAD
# ============================================================

@app.post("/api/download")
async def download_video(
    request: DownloadRequest,
    format_id: str | None = Query(
        default=None,
        max_length=100,
    ),
):
    """
    Download a publicly accessible Instagram video.

    Temporary files are automatically deleted after
    the response has completed.
    """

    instagram_url = str(request.url)

    validate_instagram_url(
        instagram_url
    )

    # --------------------------------------------------------
    # Retrieve metadata first
    # --------------------------------------------------------

    info = extract_media_info(
        instagram_url
    )

    formats = info.get("formats") or []

    selected_format = None

    if format_id:
        for fmt in formats:
            if str(fmt.get("format_id")) == format_id:
                selected_format = fmt
                break

        if selected_format is None:
            raise HTTPException(
                status_code=400,
                detail="The requested video quality is unavailable.",
            )

    # --------------------------------------------------------
    # Temporary directory
    # --------------------------------------------------------

    temporary_directory = tempfile.mkdtemp(
        prefix=f"instagram_{uuid.uuid4().hex}_"
    )

    output_template = os.path.join(
        temporary_directory,
        "%(id)s.%(ext)s",
    )

    # --------------------------------------------------------
    # Format selection
    # --------------------------------------------------------

    if selected_format:
        selected_format_id = str(
            selected_format.get("format_id")
        )

        format_selector = (
            f"{selected_format_id}+bestaudio/"
            f"{selected_format_id}/best"
        )
    else:
        format_selector = (
            "best[ext=mp4][height<=2160]/"
            "bestvideo[height<=2160]+bestaudio/"
            "best"
        )

    ydl_options = {
        "format": format_selector,

        "outtmpl": output_template,

        "merge_output_format": "mp4",

        "noplaylist": True,

        "writesubtitles": False,

        "writethumbnail": False,

        "quiet": True,

        "no_warnings": True,

        "retries": 3,

        "fragment_retries": 3,
    }

    try:
        # ----------------------------------------------------
        # Download
        # ----------------------------------------------------

        with yt_dlp.YoutubeDL(
            ydl_options
        ) as ydl:

            info = ydl.extract_info(
                instagram_url,
                download=True,
            )

            if not info:
                raise HTTPException(
                    status_code=404,
                    detail="Unable to retrieve the video.",
                )

            video_title = (
                info.get("title")
                or "instagram_video"
            )

        # ----------------------------------------------------
        # Locate video
        # ----------------------------------------------------

        video_file = find_video_file(
            temporary_directory
        )

        if video_file is None:
            cleanup_directory(
                temporary_directory
            )

            raise HTTPException(
                status_code=404,
                detail="The video could not be generated.",
            )

        # ----------------------------------------------------
        # Size protection
        # ----------------------------------------------------

        file_size_mb = (
            video_file.stat().st_size
            / (1024 * 1024)
        )

        if file_size_mb > MAX_FILE_SIZE_MB:
            cleanup_directory(
                temporary_directory
            )

            raise HTTPException(
                status_code=413,
                detail=(
                    f"The video is larger than the "
                    f"{MAX_FILE_SIZE_MB} MB limit."
                ),
            )

        # ----------------------------------------------------
        # Filename
        # ----------------------------------------------------

        safe_filename = sanitize_filename(
            video_title
        )

        if not safe_filename.lower().endswith(
            ".mp4"
        ):
            safe_filename += ".mp4"

        # ----------------------------------------------------
        # Response
        # ----------------------------------------------------

        return FileResponse(
            path=str(video_file),

            media_type="video/mp4",

            filename=safe_filename,

            background=BackgroundTask(
                cleanup_directory,
                temporary_directory,
            ),

            headers={
                "Content-Disposition": (
                    f'attachment; '
                    f'filename="{safe_filename}"'
                ),

                "Cache-Control": "no-store",

                "X-Content-Type-Options": "nosniff",
            },
        )

    except yt_dlp.utils.DownloadError as error:
        cleanup_directory(
            temporary_directory
        )

        raise HTTPException(
            status_code=422,
            detail=(
                "Unable to download this Instagram video. "
                "Make sure the URL points to publicly "
                "accessible content."
            ),
        ) from error

    except HTTPException:
        cleanup_directory(
            temporary_directory
        )

        raise

    except Exception as error:
        cleanup_directory(
            temporary_directory
        )

        raise HTTPException(
            status_code=500,
            detail=(
                "An unexpected error occurred while "
                "processing the video."
            ),
        ) from error


# ============================================================
# GET DOWNLOAD
# ============================================================

@app.get("/api/download")
async def download_video_get(
    url: HttpUrl,
    format_id: str | None = Query(
        default=None,
        max_length=100,
    ),
):
    """
    Browser-friendly download endpoint.
    """

    request = DownloadRequest(
        url=url
    )

    return await download_video(
        request=request,
        format_id=format_id,
    )


# ============================================================
# LOCAL DEVELOPMENT
# ============================================================

if __name__ == "__main__":
    import uvicorn

    port = int(
        os.getenv(
            "PORT",
            "8000",
        )
    )

    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=port,
        reload=True,
    )
