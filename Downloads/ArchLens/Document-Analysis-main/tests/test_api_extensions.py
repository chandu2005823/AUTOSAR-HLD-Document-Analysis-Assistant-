import pytest
from fastapi.testclient import TestClient

from backend.api import app
from backend.dependencies import create_access_token
from database import access_control


@pytest.fixture
def api_test_data(tmp_path, monkeypatch):
    monkeypatch.setattr(access_control, "DATABASE_PATH", tmp_path / "access.sqlite3")
    access_control.init_db()

    admin = access_control.bootstrap_admin("admin_test", "supersecret1234")
    user = access_control.create_user(admin["user_id"], "viewer_test", "viewerpassword123", "viewer")
    project = access_control.create_project(admin["user_id"], "Extension Test Project")

    admin_token = create_access_token(admin["user_id"])
    viewer_token = create_access_token(user["id"])

    return {
        "admin": admin,
        "viewer": user,
        "project": project,
        "admin_token": admin_token,
        "viewer_token": viewer_token,
    }


def test_user_management_endpoints(api_test_data):
    client = TestClient(app)
    admin_headers = {"Authorization": f"Bearer {api_test_data['admin_token']}"}
    viewer_headers = {"Authorization": f"Bearer {api_test_data['viewer_token']}"}

    # Viewer should be forbidden from listing users
    res = client.get("/users", headers=viewer_headers)
    assert res.status_code == 403

    # Admin should list users
    res = client.get("/users", headers=admin_headers)
    assert res.status_code == 200
    users = res.json()
    assert len(users) >= 2
    assert any(u["username"] == "admin_test" for u in users)

    # Admin creates user
    res = client.post(
        "/users",
        json={"username": "new_architect", "password": "architectpassword123", "role": "architect"},
        headers=admin_headers,
    )
    assert res.status_code == 201
    created = res.json()
    assert created["username"] == "new_architect"
    assert created["role"] == "architect"

    # Admin updates user
    res = client.patch(
        f"/users/{created['id']}",
        json={"role": "viewer", "active": False},
        headers=admin_headers,
    )
    assert res.status_code == 200
    updated = res.json()
    assert updated["role"] == "viewer"
    assert updated["active"] is False


def test_project_members_endpoints(api_test_data):
    client = TestClient(app)
    admin_headers = {"Authorization": f"Bearer {api_test_data['admin_token']}"}
    project_id = api_test_data["project"]["id"]

    # List members
    res = client.get(f"/projects/{project_id}/members", headers=admin_headers)
    assert res.status_code == 200
    members = res.json()
    assert any(m["username"] == "admin_test" for m in members)

    # Add member
    res = client.post(
        f"/projects/{project_id}/members",
        json={"username": "viewer_test", "role": "architect"},
        headers=admin_headers,
    )
    assert res.status_code == 200

    # Verify updated membership
    res = client.get(f"/projects/{project_id}/members", headers=admin_headers)
    assert res.status_code == 200
    members = res.json()
    viewer_member = next(m for m in members if m["username"] == "viewer_test")
    assert viewer_member["role"] == "architect"
