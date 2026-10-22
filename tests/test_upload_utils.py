from io import BytesIO
import os
from pathlib import Path
import subprocess
import sys

from fastapi import HTTPException
import pytest
from starlette.datastructures import UploadFile

from backend import upload_utils
from backend.routes import comparison


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def test_empty_document_upload_is_rejected_and_temp_file_is_cleaned(
    monkeypatch, tmp_path
):
    from backend import document_processor

    upload_root = tmp_path / "uploads"
    monkeypatch.setenv("AUTOARCH_TEMP_DIR", str(upload_root))
    monkeypatch.setattr(document_processor, "can_upload", lambda *_args: True)
    monkeypatch.setattr(
        document_processor,
        "require_project_access",
        lambda *_args: {"id": 4, "name": "test", "role": "admin"},
    )
    monkeypatch.setattr(
        document_processor,
        "extract_text_from_pdf",
        lambda _path: pytest.fail("empty upload must not reach PDF extraction"),
    )

    class EmptyUpload:
        name = "empty.pdf"

        def getbuffer(self):
            return memoryview(b"")

    with pytest.raises(ValueError, match="Uploaded file is empty"):
        document_processor.process_uploaded_pdf(
            EmptyUpload(), user_id=1, project_id=4
        )

    assert list(upload_root.iterdir()) == []


def test_oversized_stream_removes_partial_temporary_file(tmp_path):
    destination = tmp_path / "oversized.pdf"
    upload = type("Upload", (), {"file": BytesIO(b"12345")})()

    with pytest.raises(upload_utils.UploadTooLargeError):
        upload_utils.copy_upload_to_path(upload, destination, max_bytes=4)

    assert not destination.exists()
    assert list(tmp_path.iterdir()) == []


def test_upload_temp_dir_defaults_under_system_temp(monkeypatch, tmp_path):
    monkeypatch.delenv("AUTOARCH_TEMP_DIR", raising=False)
    monkeypatch.setattr(upload_utils.tempfile, "gettempdir", lambda: str(tmp_path))

    temp_dir = upload_utils.upload_temp_dir()

    assert temp_dir == tmp_path / "autoarch_ai"
    assert temp_dir.is_dir()


def test_configured_upload_limit_is_applied_on_import(tmp_path):
    env = {
        key: os.environ[key]
        for key in (
            "PATH",
            "SYSTEMROOT",
            "WINDIR",
            "TEMP",
            "TMP",
            "VIRTUAL_ENV",
            "PYTHONPATH",
            "PYTHONHOME",
        )
        if key in os.environ
    }
    env["AUTOARCH_MAX_UPLOAD_MB"] = "1"
    env["PYTHONDONTWRITEBYTECODE"] = "1"
    env["TEMP"] = str(tmp_path)
    env["TMP"] = str(tmp_path)
    env["PYTHON_DOTENV_DISABLED"] = "true"
    script = """
from io import BytesIO
from pathlib import Path
from tempfile import TemporaryDirectory
from backend.upload_utils import MAX_UPLOAD_BYTES, UploadTooLargeError, copy_upload_to_path
assert MAX_UPLOAD_BYTES == 1024 * 1024
with TemporaryDirectory() as folder:
    target = Path(folder) / "too-large.pdf"
    upload = type("Upload", (), {"file": BytesIO(b"x" * (MAX_UPLOAD_BYTES + 1))})()
    try:
        copy_upload_to_path(upload, target)
    except UploadTooLargeError:
        pass
    else:
        raise AssertionError("oversized upload was accepted")
    assert not target.exists()
print("upload-limit-ok")
"""
    result = subprocess.run(
        [sys.executable, "-c", script],
        cwd=PROJECT_ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=30,
    )

    assert result.returncode == 0, result.stderr
    assert "upload-limit-ok" in result.stdout


@pytest.mark.parametrize("oversized_side", ["baseline", "current"])
def test_oversized_comparison_upload_is_rejected_and_temp_files_are_cleaned(
    oversized_side, monkeypatch, tmp_path
):
    upload_root = tmp_path / "comparison-uploads"
    monkeypatch.setenv("AUTOARCH_TEMP_DIR", str(upload_root))
    monkeypatch.setattr(comparison, "require_project_roles", lambda *_args: None)
    original_copy = upload_utils.copy_upload_to_path
    monkeypatch.setattr(
        upload_utils,
        "copy_upload_to_path",
        lambda upload, path: original_copy(upload, path, max_bytes=4),
    )
    baseline = UploadFile(
        filename="baseline.pdf",
        file=BytesIO(b"12345" if oversized_side == "baseline" else b"1234"),
    )
    current = UploadFile(
        filename="current.pdf",
        file=BytesIO(b"12345" if oversized_side == "current" else b"1234"),
    )

    with pytest.raises(HTTPException) as error:
        comparison.compare_uploaded_files(
            1,
            baseline,
            current,
            current_user={"id": 1, "username": "test"},
            project={"id": 1},
        )

    assert error.value.status_code == 413
    assert list(upload_root.iterdir()) == []


@pytest.mark.parametrize("fail_during_extraction", [False, True])
def test_comparison_temp_files_are_cleaned_on_success_and_failure(
    fail_during_extraction, monkeypatch, tmp_path
):
    upload_root = tmp_path / "comparison-uploads"
    monkeypatch.setenv("AUTOARCH_TEMP_DIR", str(upload_root))
    monkeypatch.setattr(comparison, "require_project_roles", lambda *_args: None)
    captured_paths = []

    def extract_text(path):
        captured_paths.append(Path(path))
        if fail_during_extraction:
            raise RuntimeError("test-only parser failure")
        return []

    from extraction import traceability
    from ingestion import pdf_parser

    monkeypatch.setattr(pdf_parser, "extract_text_from_pdf", extract_text)
    monkeypatch.setattr(traceability, "extract_traceable_entities", lambda _pages: [])
    monkeypatch.setattr(comparison, "compare_entities", lambda *_args: {})
    monkeypatch.setattr(comparison, "log_event", lambda *_args, **_kwargs: None)

    baseline = UploadFile(filename="baseline.pdf", file=BytesIO(b"base"))
    current = UploadFile(filename="current.pdf", file=BytesIO(b"curr"))
    if fail_during_extraction:
        with pytest.raises(RuntimeError, match="test-only parser failure"):
            comparison.compare_uploaded_files(
                1,
                baseline,
                current,
                current_user={"id": 1, "username": "test"},
                project={"id": 1},
            )
    else:
        comparison.compare_uploaded_files(
            1,
            baseline,
            current,
            current_user={"id": 1, "username": "test"},
            project={"id": 1},
        )

    assert captured_paths
    assert all(not path.exists() for path in captured_paths)
    assert list(upload_root.iterdir()) == []
