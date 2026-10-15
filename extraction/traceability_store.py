"""Traceability store compatibility module.

Canonical implementation is maintained in database.traceability_store.
"""
from database.traceability_store import DEFAULT_OUTPUT_FILE as OUTPUT_FILE
from database.traceability_store import load_traceability, save_traceability

__all__ = ["OUTPUT_FILE", "load_traceability", "save_traceability"]