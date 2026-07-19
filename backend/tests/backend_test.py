"""Backend API tests for Arı Köşk Digital Menu"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ari-kosk-menu.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@arikosk.com"
ADMIN_PW = "arikosk2025"

EXPECTED_CATS = ["corbalar", "pideler", "kebaplar", "lahmacunlar", "tatlilar", "icecekler"]


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Public menu ----------------
def test_categories_order():
    r = requests.get(f"{API}/menu/categories")
    assert r.status_code == 200
    data = r.json()
    assert [c["slug"] for c in data] == EXPECTED_CATS
    for c in data:
        assert "name" in c and "order" in c


def test_menu_items_seeded():
    r = requests.get(f"{API}/menu/items")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 24, f"Expected >=24 items, got {len(items)}"
    required = {"id", "name", "description", "price", "image", "category", "popular", "chef_choice", "order", "active"}
    for it in items:
        assert required.issubset(it.keys()), f"Missing keys: {required - it.keys()}"
        assert it["category"] in EXPECTED_CATS
        assert "_id" not in it


# ---------------- Auth ----------------
def test_login_success():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW})
    assert r.status_code == 200
    d = r.json()
    assert d["email"] == ADMIN_EMAIL
    assert d["role"] == "admin"
    assert isinstance(d["token"], str) and len(d["token"]) > 20


def test_login_wrong_password():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_me_without_token():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


def test_me_with_token(auth_headers):
    r = requests.get(f"{API}/auth/me", headers=auth_headers)
    assert r.status_code == 200
    d = r.json()
    assert d["email"] == ADMIN_EMAIL
    assert d["role"] == "admin"
    assert "password_hash" not in d


# ---------------- Admin CRUD ----------------
def test_admin_create_requires_auth():
    r = requests.post(f"{API}/admin/menu/items", json={
        "name": "X", "description": "x", "price": 1, "image": "http://x", "category": "kebaplar"
    })
    assert r.status_code == 401


def test_admin_crud_flow(auth_headers):
    # Create
    payload = {
        "name": "TEST_Item",
        "description": "test desc",
        "price": 99.5,
        "image": "https://example.com/x.jpg",
        "category": "kebaplar",
        "popular": True,
        "chef_choice": False,
        "order": 99,
        "active": True,
    }
    r = requests.post(f"{API}/admin/menu/items", json=payload, headers=auth_headers)
    assert r.status_code == 200, r.text
    created = r.json()
    assert created["name"] == "TEST_Item"
    assert "_id" not in created
    item_id = created["id"]

    # Verify via public list
    r2 = requests.get(f"{API}/menu/items")
    assert any(it["id"] == item_id for it in r2.json())

    # Update
    r3 = requests.put(f"{API}/admin/menu/items/{item_id}", json={"price": 150.0}, headers=auth_headers)
    assert r3.status_code == 200
    assert r3.json()["price"] == 150.0

    # Update no fields
    r4 = requests.put(f"{API}/admin/menu/items/{item_id}", json={}, headers=auth_headers)
    assert r4.status_code == 400

    # Update non-existent
    r5 = requests.put(f"{API}/admin/menu/items/nonexistent", json={"price": 10.0}, headers=auth_headers)
    assert r5.status_code == 404

    # Delete requires auth
    r6 = requests.delete(f"{API}/admin/menu/items/{item_id}")
    assert r6.status_code == 401

    # Delete
    r7 = requests.delete(f"{API}/admin/menu/items/{item_id}", headers=auth_headers)
    assert r7.status_code == 200

    # Delete again -> 404
    r8 = requests.delete(f"{API}/admin/menu/items/{item_id}", headers=auth_headers)
    assert r8.status_code == 404
