from fastapi import APIRouter, Depends, HTTPException, status

from backend.dependencies import get_current_user, require_system_role
from backend.schemas import UserCreate, UserDetailResponse, UserUpdate
from database.access_control import (
    AuthorizationError,
    create_user,
    list_users,
    update_user,
)
from database.audit_log import log_event


router = APIRouter(prefix="/users", tags=["users"])


@router.get("", response_model=list[UserDetailResponse], summary="List all user accounts (admin only)")
def get_users(current_user: dict = Depends(get_current_user)):
    require_system_role(current_user, "admin")
    try:
        return list_users(current_user["id"])
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "role_forbidden", "message": "Only admins can view all users."},
        ) from None


@router.post("", response_model=UserDetailResponse, status_code=201, summary="Create a new user (admin only)")
def create_new_user(
    request: UserCreate,
    current_user: dict = Depends(get_current_user),
):
    require_system_role(current_user, "admin")
    try:
        user = create_user(
            current_user["id"],
            request.username,
            request.password,
            role=request.role,
        )
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "role_forbidden", "message": "Only admins can create user accounts."},
        ) from None
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "invalid_user", "message": str(error)},
        ) from None

    log_event(
        "USER_CREATED",
        user_id=current_user["id"],
        username=current_user["username"],
        details={"created_username": user["username"], "account_role": user["role"], "client": "api"},
    )
    return user


@router.patch("/{user_id}", response_model=UserDetailResponse, summary="Update a user's role or active status (admin only)")
def update_user_account(
    user_id: int,
    request: UserUpdate,
    current_user: dict = Depends(get_current_user),
):
    require_system_role(current_user, "admin")
    try:
        updated = update_user(
            current_user["id"],
            user_id,
            role=request.role,
            active=request.active,
        )
    except AuthorizationError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail={"code": "role_forbidden", "message": "Only admins can update user accounts."},
        ) from None
    except ValueError as error:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "invalid_update", "message": str(error)},
        ) from None

    log_event(
        "USER_UPDATED",
        user_id=current_user["id"],
        username=current_user["username"],
        details={"target_user_id": user_id, "role": request.role, "active": request.active, "client": "api"},
    )
    return updated
