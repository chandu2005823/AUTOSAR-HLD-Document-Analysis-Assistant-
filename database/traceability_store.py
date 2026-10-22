import json
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parent.parent

from storage_paths import processed_dir

DEFAULT_OUTPUT_FILE = processed_dir(PROJECT_ROOT) / "traceability.json"


def save_traceability(records, output_file=None):
    target_path = Path(output_file) if output_file else DEFAULT_OUTPUT_FILE
    target_path.parent.mkdir(parents=True, exist_ok=True)

    with open(target_path, "w", encoding="utf-8") as file:
        json.dump(records, file, indent=4, ensure_ascii=False)


def load_traceability(output_file=None):
    target_path = Path(output_file) if output_file else DEFAULT_OUTPUT_FILE

    if not target_path.exists():
        return []

    with open(target_path, "r", encoding="utf-8") as file:
        data = json.load(file)

    return data if isinstance(data, list) else []