import asyncio
import itertools
import os
import re
import shutil
import tempfile
import time
import uuid
from pathlib import Path
from urllib.parse import urlparse

import yt_dlp
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, HttpUrl
from starlette.background import BackgroundTask, BackgroundTasks


# ============================================================
# CONFIGURATION
# ============================================================

APP_NAME = "Instagram Video Downloader API"
APP_VERSION = "2.0.0"

MAX_FILE_SIZE_MB = 500

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "https://reelfetch.online",
)

# Supports a comma-separated list so you can allow the apex domain,
# www subdomain, and a staging URL at the same time without code changes.
ALLOWED_ORIGINS = [
    origin.strip() for origin in FRONTEND_URL.split(",") if origin.strip()
]

ALLOWED_INSTAGRAM_HOSTS = {
    "instagram.com",
    "www.instagram.com",
}

# How many actual video downloads (the heavy step - real file
# generation/streaming) can run at the same time. Everyone past this
# limit waits in a queue instead of piling onto the server at once.
MAX_CONCURRENT_DOWNLOADS = int(
    os.getenv("MAX_CONCURRENT_DOWNLOADS", "5")
)

# Once a ticket becomes "ready", the client has this long to actually
# start the download before the slot is handed to the next person.
TICKET_READY_GRACE_SECONDS = 30

# Safety net: a ticket that's been "waiting" for longer than this is
# assumed abandoned (closed tab, etc.) and is dropped.
TICKET_WAITING_EXPIRE_SECONDS = 300


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
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


# ============================================================
# DOWNLOAD QUEUE
# ============================================================
#
# A lightweight, in-memory FIFO queue that caps how many real video
# downloads run at once. This is intentionally simple (a dict + a
# list, guarded by one asyncio.Lock) rather than an external queue
# service, because the backend runs as a single instance - all the
# state that matters lives in this one process already.
#
# Lifecycle of a ticket:
#   waiting  -> created, sitting in line behind others
#   ready    -> a slot opened up; client has a grace window to use it
#   (removed) -> either consumed by a real download, or expired/abandoned
#
# _active_downloads counts tickets currently "ready" or in-flight -
# both cases occupy a slot, so both count against the concurrency cap.

_queue_lock = asyncio.Lock()
_ticket_counter = itertools.count(1)
_tickets: dict[str, dict] = {}
_ticket_order: list[str] = []
_active_downloads = 0


def _make_ticket_id() -> str:
    return f"t{next(_ticket_counter)}_{uuid.uuid4().hex[:8]}"


async def _promote_waiting_tickets_locked() -> None:
    """Hand free slots to the next people in line. Caller must hold _queue_lock."""

    global _active_downloads

    while _ticket_order and _active_downloads < MAX_CONCURRENT_DOWNLOADS:
        ticket_id = _ticket_order.pop(0)
        ticket = _tickets.get(ticket_id)

        if ticket is None:
            continue

        ticket["status"] = "ready"
        ticket["ready_at"] = time.time()
        _active_downloads += 1


async def _cleanup_expired_tickets_locked() -> None:
    """Drop abandoned tickets and free up their slots. Caller must hold _queue_lock."""

    global _active_downloads

    now = time.time()
    expired_ids = []

    for ticket_id, ticket in _tickets.items():
        if (
            ticket["status"] == "waiting"
            and now - ticket["created"] > TICKET_WAITING_EXPIRE_SECONDS
        ):
            expired_ids.append(ticket_id)
        elif (
            ticket["status"] == "ready"
            and now - ticket["ready_at"] > TICKET_READY_GRACE_SECONDS
        ):
            expired_ids.append(ticket_id)

    for ticket_id in expired_ids:
        ticket = _tickets.pop(ticket_id, None)

        if ticket is None:
            continue

        if ticket_id in _ticket_order:
            _ticket_order.remove(ticket_id)

        if ticket["status"] == "ready":
            _active_downloads = max(0, _active_downloads - 1)

    if expired_ids:
        await _promote_waiting_tickets_locked()


async def queue_join() -> dict:
    """Register a new ticket and return its starting position."""

    async with _queue_lock:
        await _cleanup_expired_tickets_locked()

        ticket_id = _make_ticket_id()

        _tickets[ticket_id] = {
            "status": "waiting",
            "created": time.time(),
            "ready_at": None,
        }
        _ticket_order.append(ticket_id)

        await _promote_waiting_tickets_locked()

        ticket = _tickets[ticket_id]

        if ticket["status"] == "ready":
            position = 0
        else:
            position = _ticket_order.index(ticket_id)

        return {
            "ticket_id": ticket_id,
            "status": ticket["status"],
            "position": position,
        }


async def queue_status(ticket_id: str) -> dict:
    """Look up the current status and live position of a ticket."""

    async with _queue_lock:
        await _cleanup_expired_tickets_locked()

        ticket = _tickets.get(ticket_id)

        if ticket is None:
            raise HTTPException(
                status_code=404,
                detail=(
                    "This download slot has expired. "
                    "Please try again."
                ),
            )

        if ticket["status"] == "waiting":
            position = _ticket_order.index(ticket_id)
        else:
            position = 0

        return {
            "ticket_id": ticket_id,
            "status": ticket["status"],
            "position": position,
        }


async def queue_release(ticket_id: str) -> None:
    """Free up a ticket's slot once its download has finished (or failed)."""

    global _active_downloads

    async with _queue_lock:
        ticket = _tickets.pop(ticket_id, None)

        if ticket is not None:
            if ticket_id in _ticket_order:
                _ticket_order.remove(ticket_id)

            if ticket["status"] == "ready":
                _active_downloads = max(0, _active_downloads - 1)

        await _promote_waiting_tickets_locked()


async def queue_require_ready_ticket(ticket_id: str | None) -> None:
    """Validate a ticket is actually this caller's turn before doing real work."""

    if not ticket_id:
        raise HTTPException(
            status_code=400,
            detail="Missing download ticket. Please try again.",
        )

    async with _queue_lock:
        await _cleanup_expired_tickets_locked()

        ticket = _tickets.get(ticket_id)

        if ticket is None or ticket["status"] != "ready":
            raise HTTPException(
                status_code=409,
                detail=(
                    "Your download slot expired or isn't ready yet. "
                    "Please try again."
                ),
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

def _extract_media_info_sync(instagram_url: str) -> dict:
    ydl_options = {
        "quiet": True,
        "no_warnings": True,
        "noplaylist": True,
        "skip_download": True,
        "extract_flat": False,
    }

    with yt_dlp.YoutubeDL(ydl_options) as ydl:
        return ydl.extract_info(
            instagram_url,
            download=False,
        )


async def extract_media_info(instagram_url: str) -> dict:
    """
    Extract metadata without downloading the video.

    Runs in a worker thread (asyncio.to_thread) instead of directly on
    the event loop - yt-dlp's extract_info() is a blocking call, and
    running it inline would freeze every other request on this server
    (metadata lookups, health checks, everything) for as long as it
    takes to talk to Instagram.
    """

    try:
        info = await asyncio.to_thread(
            _extract_media_info_sync,
            instagram_url,
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
# DOWNLOAD QUEUE ROUTES
# ============================================================

@app.post("/api/queue/join")
async def queue_join_route():
    """
    Claim a spot in line for a real video download.

    Returns immediately with a ticket_id, a status ("ready" if a slot
    was free, otherwise "waiting"), and a position (how many people
    are ahead in line - 0 means it's already your turn).
    """

    return await queue_join()


@app.get("/api/queue/status")
async def queue_status_route(
    ticket_id: str = Query(
        max_length=100,
    ),
):
    """
    Poll the live position and status of a ticket.
    """

    return await queue_status(ticket_id)


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

    info = await extract_media_info(
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

def _run_download_sync(instagram_url: str, ydl_options: dict) -> dict | None:
    with yt_dlp.YoutubeDL(ydl_options) as ydl:
        return ydl.extract_info(
            instagram_url,
            download=True,
        )


@app.post("/api/download")
async def download_video(
    request: DownloadRequest,
    format_id: str | None = Query(
        default=None,
        max_length=100,
    ),
    ticket_id: str | None = Query(
        default=None,
        max_length=100,
    ),
):
    """
    Download a publicly accessible Instagram video.

    Requires a queue ticket obtained from POST /api/queue/join and
    confirmed "ready" via GET /api/queue/status - this is the heavy
    step (real file generation + streaming), so it's the one gated by
    the concurrency limit.

    Temporary files are automatically deleted after
    the response has completed.
    """

    instagram_url = str(request.url)

    validate_instagram_url(
        instagram_url
    )

    await queue_require_ready_ticket(ticket_id)

    # --------------------------------------------------------
    # Retrieve metadata first
    # --------------------------------------------------------

    info = await extract_media_info(
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
        # Download (offloaded to a thread - this is the slow,
        # bandwidth-heavy step, and running it inline would
        # freeze the event loop for every other request while
        # this one video downloads)
        # ----------------------------------------------------

        info = await asyncio.to_thread(
            _run_download_sync,
            instagram_url,
            ydl_options,
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

        finalize_tasks = BackgroundTasks()
        finalize_tasks.add_task(
            cleanup_directory,
            temporary_directory,
        )
        finalize_tasks.add_task(
            queue_release,
            ticket_id,
        )

        return FileResponse(
            path=str(video_file),

            media_type="video/mp4",

            filename=safe_filename,

            background=finalize_tasks,

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
        await queue_release(ticket_id)

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
        await queue_release(ticket_id)

        raise

    except Exception as error:
        cleanup_directory(
            temporary_directory
        )
        await queue_release(ticket_id)

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
    ticket_id: str | None = Query(
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
        ticket_id=ticket_id,
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
