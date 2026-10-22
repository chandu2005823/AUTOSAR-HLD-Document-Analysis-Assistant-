from pathlib import Path
import os

PROJECT_ROOT = Path(__file__).resolve().parent


def resolve_path(value, project_root=PROJECT_ROOT):
    path = Path(value)
    return path if path.is_absolute() else Path(project_root) / path


def configured_path(environment_name, default_path, project_root=PROJECT_ROOT):
    value = os.environ.get(environment_name)
    return resolve_path(value, project_root) if value else Path(default_path)


def data_dir(project_root=PROJECT_ROOT):
    return configured_path("AUTOARCH_DATA_DIR", Path(project_root) / "data", project_root)


def processed_dir(project_root=PROJECT_ROOT):
    return configured_path(
        "AUTOARCH_PROCESSED_DIR",
        data_dir(project_root) / "processed",
        project_root,
    )


def chroma_dir(project_root=PROJECT_ROOT):
    return configured_path(
        "AUTOARCH_CHROMA_DIR",
        data_dir(project_root) / "chroma",
        project_root,
    )
