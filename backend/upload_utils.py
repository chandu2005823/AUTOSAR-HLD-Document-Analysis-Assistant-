import os
import tempfile
from pathlib import Path

CHUNK_SIZE = 1024 * 1024
try:
    MAX_UPLOAD_MB = int(os.environ.get("AUTOARCH_MAX_UPLOAD_MB", "50"))
except ValueError as error:
    raise RuntimeError("AUTOARCH_MAX_UPLOAD_MB must be a positive integer.") from error
if MAX_UPLOAD_MB <= 0:
    raise RuntimeError("AUTOARCH_MAX_UPLOAD_MB must be a positive integer.")
MAX_UPLOAD_BYTES = MAX_UPLOAD_MB * 1024 * 1024


class UploadTooLargeError(Exception):
    pass


def upload_temp_dir():
    configured = os.environ.get("AUTOARCH_TEMP_DIR")
    path = Path(configured) if configured else Path(tempfile.gettempdir()) / "autoarch_ai"
    if not path.is_absolute():
        path = Path(__file__).resolve().parent.parent / path
    path.mkdir(parents=True, exist_ok=True)
    return path


def copy_upload_to_path(upload, destination, *, max_bytes=MAX_UPLOAD_BYTES):
    """Copy an upload in bounded chunks to a new file and reject oversize input."""
    destination = Path(destination)
    source = getattr(upload, "file", None)
    buffer = None
    if source is None and hasattr(upload, "getbuffer"):
        buffer = memoryview(upload.getbuffer())
        size = len(buffer)
        if size > max_bytes:
            raise UploadTooLargeError(f"PDF exceeds the {MAX_UPLOAD_MB} MB upload limit.")
    elif source is not None and hasattr(source, "read"):
        if hasattr(source, "seek"):
            source.seek(0)
    else:
        raise TypeError("Upload must provide a readable file or getbuffer().")

    total = 0
    created = False
    try:
        with destination.open("xb") as target:
            created = True
            if buffer is not None:
                for offset in range(0, len(buffer), CHUNK_SIZE):
                    target.write(buffer[offset:offset + CHUNK_SIZE])
                total = len(buffer)
            else:
                while True:
                    chunk = source.read(min(CHUNK_SIZE, max_bytes - total + 1))
                    if not chunk:
                        break
                    total += len(chunk)
                    if total > max_bytes:
                        raise UploadTooLargeError(
                            f"PDF exceeds the {MAX_UPLOAD_MB} MB upload limit."
                        )
                    target.write(chunk)
    except Exception:
        if created:
            destination.unlink(missing_ok=True)
        raise
    return total
