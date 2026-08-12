```python
import os
import re
import shutil
import tempfile
import uuid
from pathlib import Path
from urllib.parse import urlparse

import yt_dlp
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from starlette.background import BackgroundTask


# ============================================================
# CONFIGURATION
# ============================================================

APP_NAME = "Instagram Video Downloader API"
APP_VERSION = "1.0.0"

# Maximum allowed downloaded file size.
MAX_FILE_SIZE_MB = 500

# Frontend URL.
# Render/Vercel will provide the production value through
# an environment variable.
FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://instagram-downloader.arslankhan807567.workers.dev"
)

# Only allow Instagram domains.
ALLOWED_INSTAGRAM_HOSTS = {
    "instagram.com",
    "www.instagram.com",
}


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title=APP_NAME,
    version=APP_VERSION,
    description=(
        "API for downloading publicly accessible "
        "Instagram videos."
    ),
)


# ============================================================
# CORS
# ============================================================

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ============================================================
# REQUEST SCHEMA
# ============================================================

class DownloadRequest(BaseModel):
    url: HttpUrl


# ============================================================
# UTILITY FUNCTIONS
# ============================================================

def validate_instagram_url(url: str) -> None:
    """
    Validate that the supplied URL belongs to Instagram.
    """

    parsed_url = urlparse(url)

    # Make sure HTTP/HTTPS is being used.
    if parsed_url.scheme not in {"http", "https"}:
        raise HTTPException(
            status_code=400,
            detail="Only HTTP and HTTPS URLs are supported.",
        )

    hostname = (
        parsed_url.hostname or ""
    ).lower()

    if hostname not in ALLOWED_INSTAGRAM_HOSTS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Invalid URL. Please provide a valid "
                "Instagram URL."
            ),
        )


def cleanup_directory(directory: str) -> None:
    """
    Remove temporary files after the response is complete.
    """

    try:
        shutil.rmtree(
            directory,
            ignore_errors=True,
        )
    except Exception:
        pass


def sanitize_filename(filename: str) -> str:
    """
    Convert a video title into a safe filename.
    """

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


def find_video_file(directory: str) -> Path | None:
    """
    Find the downloaded video inside the temporary directory.
    """

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

    # Return the largest video file.
    # This helps when yt-dlp creates multiple files.
    return max(
        video_files,
        key=lambda file: file.stat().st_size,
    )


# ============================================================
# BASIC ROUTES
# ============================================================

@app.get("/")
async def root():
    """
    API information endpoint.
    """

    return {
        "name": APP_NAME,
        "version": APP_VERSION,
        "status": "online",
    }


@app.get("/health")
async def health():
    """
    Health check used by Render or other infrastructure.
    """

    return {
        "status": "healthy",
    }


# ============================================================
# VIDEO DOWNLOAD
# ============================================================

@app.post("/api/download")
async def download_video(
    request: DownloadRequest,
):
    """
    Download a publicly accessible Instagram video.

    The video is downloaded to a temporary directory and
    returned directly to the client.

    Temporary files are automatically deleted after
    the response is completed.
    """

    instagram_url = str(request.url)

    # --------------------------------------------------------
    # Validate URL
    # --------------------------------------------------------

    validate_instagram_url(
        instagram_url
    )

    # --------------------------------------------------------
    # Create temporary directory
    # --------------------------------------------------------

    temporary_directory = tempfile.mkdtemp(
        prefix=f"instagram_{uuid.uuid4().hex}_"
    )

    output_template = os.path.join(
        temporary_directory,
        "%(id)s.%(ext)s",
    )

    # --------------------------------------------------------
    # yt-dlp configuration
    # --------------------------------------------------------

    ydl_options = {
        # Prefer MP4 where available.
        #
        # If separate video/audio streams are returned,
        # FFmpeg will merge them.
        "format": (
            "best[ext=mp4][height<=2160]/"
            "bestvideo[height<=2160]+bestaudio/"
            "best"
        ),

        # Output filename.
        "outtmpl": output_template,

        # Convert/merge into MP4.
        "merge_output_format": "mp4",

        # Never download playlists.
        "noplaylist": True,

        # We only want the video.
        "writesubtitles": False,
        "writethumbnail": False,

        # Reduce unnecessary console output.
        "quiet": True,
        "no_warnings": True,

        # Network retry settings.
        "retries": 3,
        "fragment_retries": 3,

        # Do not use browser cookies or authentication.
        # This backend is intended for publicly accessible
        # content.
    }

    try:

        # ----------------------------------------------------
        # Download video
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
                    detail=(
                        "Unable to retrieve the "
                        "video information."
                    ),
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
                detail=(
                    "The video could not be "
                    "generated."
                ),
            )

        # ----------------------------------------------------
        # Check file size
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
        # Create safe filename
        # ----------------------------------------------------

        safe_filename = sanitize_filename(
            video_title
        )

        if not safe_filename.lower().endswith(
            ".mp4"
        ):
            safe_filename += ".mp4"

        # ----------------------------------------------------
        # Return video
        # ----------------------------------------------------

        return FileResponse(
            path=str(video_file),
            media_type="video/mp4",
            filename=safe_filename,

            # Delete temporary files after
            # FastAPI finishes sending the file.
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

    # --------------------------------------------------------
    # yt-dlp errors
    # --------------------------------------------------------

    except yt_dlp.utils.DownloadError as error:

        cleanup_directory(
            temporary_directory
        )

        # Do not expose internal yt-dlp errors.
        raise HTTPException(
            status_code=422,
            detail=(
                "Unable to download this Instagram "
                "video. Make sure the URL points to "
                "publicly accessible content and that "
                "you have permission to download it."
            ),
        ) from error

    # --------------------------------------------------------
    # Expected FastAPI errors
    # --------------------------------------------------------

    except HTTPException:

        cleanup_directory(
            temporary_directory
        )

        raise

    # --------------------------------------------------------
    # Unexpected errors
    # --------------------------------------------------------

    except Exception as error:

        cleanup_directory(
            temporary_directory
        )

        # Keep internal error details out of the API response.
        raise HTTPException(
            status_code=500,
            detail=(
                "An unexpected error occurred while "
                "processing the video."
            ),
        ) from error


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
```
