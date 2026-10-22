from pathlib import Path

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile, status

from backend.dependencies import get_authorized_project, get_current_user, require_project_roles
from backend.schemas import DocumentResponse
from database.access_control import AuthorizationError, list_project_documents
from database.audit_log import log_event
from backend.document_processor import process_uploaded_pdf
from backend.upload_utils import UploadTooLargeError


router = APIRouter(prefix="/projects/{project_id}/documents", tags=["documents"])


class _UploadedDocument:
    """Expose FastAPI uploads through the existing processor's filename interface."""

    def __init__(self, upload: UploadFile):
        self.name = Path(upload.filename or "").name
        self.filename = self.name
        self.file = upload.file


def _document_response(record):
    return {
        "document_id": record["document_id"],
        "project_id": record["project_id"],
        "filename": record["filename"],
        "version": record["version"],
        "pages": record["page_count"],
        "chunks": record["chunk_count"],
        "traceability_count": record["traceability_count"],
        "relationship_count": record.get("relationship_count", 0),
        "upload_timestamp": record.get("upload_timestamp"),
    }


@router.post("", response_model=DocumentResponse, status_code=201, summary="Upload and process a project PDF")
def upload_document(
    project_id: int,
    file: UploadFile = File(..., description="AUTOSAR PDF document"),
    current_user: dict = Depends(get_current_user),
    project: dict = Depends(get_authorized_project),
):
    require_project_roles(project, "admin", "architect")
    filename = Path(file.filename or "").name
    if not filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "invalid_file", "message": "Only PDF uploads are supported."},
        )
    try:
        result = process_uploaded_pdf(
            _UploadedDocument(file),
            user_id=current_user["id"],
            project_id=project_id,
        )
    except UploadTooLargeError as error:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail={"code": "upload_too_large", "message": str(error)},
        ) from None
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "project_forbidden", "message": "You are not authorized to upload to this project."},
        ) from None
    except PermissionError as error:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "upload_forbidden", "message": str(error)},
        ) from None
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "invalid_document", "message": str(error)},
        ) from None
    except FileNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "document_not_found", "message": "The uploaded document could not be read."},
        ) from None

    log_event(
        "DOCUMENT_UPLOAD",
        document_name=result["filename"],
        status="success",
        user_id=current_user["id"],
        username=current_user["username"],
        project_id=project_id,
        document_id=result["document_id"],
        details={"client": "api", "version": result["version"]},
    )
    return {
        **result,
        "project_id": project_id,
        "traceability_count": result["traceability_records"],
        "relationship_count": result["relationship_records"],
        "upload_timestamp": result["version_info"].get("upload_timestamp"),
    }


@router.get("", response_model=list[DocumentResponse], summary="List documents in an authorized project")
def list_documents(
    project_id: int,
    current_user: dict = Depends(get_current_user),
    project: dict = Depends(get_authorized_project),
):
    try:
        documents = list_project_documents(current_user["id"], project["id"])
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "project_forbidden", "message": "You are not authorized for this project."},
        ) from None
    return [_document_response(document) for document in documents]


@router.get("/{document_id}", response_model=DocumentResponse, summary="Get document details in an authorized project")
def get_document(
    project_id: int,
    document_id: str,
    current_user: dict = Depends(get_current_user),
    project: dict = Depends(get_authorized_project),
):
    try:
        from database.access_control import get_project_document
        document = get_project_document(current_user["id"], project["id"], document_id)
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "document_not_found", "message": "Document not found in this project."},
        ) from None
    return _document_response(document)


@router.get("/{document_id}/versions", response_model=list[dict], summary="Get version history for a project document")
def get_document_versions(
    project_id: int,
    document_id: str,
    current_user: dict = Depends(get_current_user),
    project: dict = Depends(get_authorized_project),
):
    from database.access_control import get_project_document
    from database.versioning import list_document_versions
    try:
        document = get_project_document(current_user["id"], project["id"], document_id)
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "document_not_found", "message": "Document not found."},
        ) from None
    return list_document_versions(
        document["filename"],
        user_id=current_user["id"],
        project_id=project["id"],
    )


@router.get("/{document_id}/pages", summary="Get extracted pages for a project document")
def get_pages_endpoint(
    project_id: int,
    document_id: str,
    current_user: dict = Depends(get_current_user),
    project: dict = Depends(get_authorized_project),
):
    from backend.services import get_document_pages
    try:
        _document, pages = get_document_pages(current_user["id"], project["id"], document_id)
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "document_not_found", "message": "Document not found."},
        ) from None
    return [{"page_number": p.get("page_number", p.get("page")), "text": p.get("text", "")} for p in pages]


@router.get("/{document_id}/evidence", summary="Get entity context evidence from source pages")
def get_evidence_endpoint(
    project_id: int,
    document_id: str,
    entity: str,
    page: int | str | None = None,
    current_user: dict = Depends(get_current_user),
    project: dict = Depends(get_authorized_project),
):
    from backend.services import get_document_pages, get_entity_context
    try:
        _document, pages = get_document_pages(current_user["id"], project["id"], document_id)
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={"code": "document_not_found", "message": "Document not found."},
        ) from None

    if page is not None:
        context = get_entity_context(pages, entity, page)
    else:
        # Search across pages
        contexts = []
        for p in pages:
            c = get_entity_context(pages, entity, p.get("page_number", p.get("page")))
            if c:
                contexts.append(c)
        context = "\n\n---\n\n".join(contexts) if contexts else ""

    return {
        "document_id": document_id,
        "entity": entity,
        "page": page,
        "context": context,
    }
