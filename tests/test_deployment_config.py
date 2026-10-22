import os
import subprocess
import sys
from pathlib import Path

import pytest

from backend import api
from rag import embeddings
from storage_paths import chroma_dir, data_dir, processed_dir


PROJECT_ROOT = Path(__file__).resolve().parents[1]


def _run_dependency_import(secret, *, require_secret="true"):
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
    env["AUTOARCH_REQUIRE_API_SECRET"] = require_secret
    if secret is not None:
        env["AUTOARCH_API_SECRET"] = secret
    env["PYTHON_DOTENV_DISABLED"] = "true"
    return subprocess.run(
        [sys.executable, "-c", "from backend.dependencies import create_access_token; print(create_access_token(7, now=123))"],
        cwd=PROJECT_ROOT,
        env=env,
        capture_output=True,
        text=True,
        timeout=30,
    )


def test_required_api_secret_missing_prevents_import():
    result = _run_dependency_import(None)

    assert result.returncode != 0
    assert "AUTOARCH_API_SECRET must be configured" in result.stderr


def test_short_api_secret_prevents_import():
    result = _run_dependency_import("deployment-test-short-secret")

    assert result.returncode != 0
    assert "AUTOARCH_API_SECRET must be at least 32 bytes" in result.stderr


def test_stable_configured_api_secret_yields_stable_token():
    test_secret = "deployment-test-secret-value-at-least-32-bytes"
    first = _run_dependency_import(test_secret)
    second = _run_dependency_import(test_secret)

    assert first.returncode == 0, first.stderr
    assert second.returncode == 0, second.stderr
    assert first.stdout == second.stdout


def test_cors_uses_explicit_configured_origins(monkeypatch):
    monkeypatch.setenv(
        "AUTOARCH_CORS_ORIGINS",
        " https://app.example.test/ ,https://admin.example.test ",
    )

    assert api._cors_origins() == [
        "https://app.example.test",
        "https://admin.example.test",
    ]


def test_cors_rejects_wildcard_origin(monkeypatch):
    monkeypatch.setenv("AUTOARCH_CORS_ORIGINS", "https://app.example.test,*")

    with pytest.raises(RuntimeError, match="wildcard CORS is not allowed"):
        api._cors_origins()


def test_unset_cors_uses_local_development_origins(monkeypatch):
    monkeypatch.delenv("AUTOARCH_CORS_ORIGINS", raising=False)

    assert api._cors_origins() == [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ]


def test_storage_paths_use_data_defaults_and_explicit_overrides(monkeypatch, tmp_path):
    for key in (
        "AUTOARCH_DATA_DIR",
        "AUTOARCH_PROCESSED_DIR",
        "AUTOARCH_CHROMA_DIR",
    ):
        monkeypatch.delenv(key, raising=False)

    assert data_dir(tmp_path) == tmp_path / "data"
    assert processed_dir(tmp_path) == tmp_path / "data" / "processed"
    assert chroma_dir(tmp_path) == tmp_path / "data" / "chroma"

    persistent_root = tmp_path / "persistent"
    monkeypatch.setenv("AUTOARCH_DATA_DIR", str(persistent_root))
    assert data_dir(tmp_path) == persistent_root
    assert processed_dir(tmp_path) == persistent_root / "processed"
    assert chroma_dir(tmp_path) == persistent_root / "chroma"

    custom_processed = tmp_path / "custom-processed"
    custom_chroma = tmp_path / "custom-chroma"
    monkeypatch.setenv("AUTOARCH_PROCESSED_DIR", str(custom_processed))
    monkeypatch.setenv("AUTOARCH_CHROMA_DIR", str(custom_chroma))
    assert processed_dir(tmp_path) == custom_processed
    assert chroma_dir(tmp_path) == custom_chroma


def test_embedding_model_is_reused_and_retries_after_initialization_failure(monkeypatch):
    instances = []
    attempts = []

    class FakeModel:
        def encode(self, _texts, **_kwargs):
            return "encoded"

    def construct_model(_name):
        attempts.append(1)
        if len(attempts) == 1:
            raise RuntimeError("test-only initialization failure")
        model = FakeModel()
        instances.append(model)
        return model

    monkeypatch.setattr(embeddings, "_MODEL", None)
    monkeypatch.setattr(embeddings, "SentenceTransformer", construct_model)

    with pytest.raises(RuntimeError, match="test-only initialization failure"):
        embeddings.EmbeddingModel()

    first = embeddings.EmbeddingModel()
    second = embeddings.EmbeddingModel()

    assert first.model is second.model
    assert first.model is instances[0]
    assert len(attempts) == 2
