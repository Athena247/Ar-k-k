"""Backend API tests for Arı Köşk Digital Menu — iteration 2 (TR/EN + Cloudinary)"""
import os
import pytest
import requests

BASE_URL = os.environ.get("REACT_APP_BACKEND_URL", "https://ari-kosk-menu.preview.emergentagent.com").rstrip("/")
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@arikosk.com"
ADMIN_PW = "arikosk2025"

EXPECTED_CATS = ["corbalar", "pideler", "kebaplar", "lahmacunlar", "tatlilar", "icecekler"]
EXPECTED_EN_NAMES = {
    "corbalar": "Soups",
    "pideler": "Pides",
    "kebaplar": "Kebabs",
    "lahmacunlar": "Lahmacuns",
    "tatlilar": "Desserts",
    "icecekler": "Drinks",
}


@pytest.fixture(scope="session")
def token():
    r = requests.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PW})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


# ---------------- Public menu ----------------
def test_categories_order_and_en():
    r = requests.get(f"{API}/menu/categories")
    assert r.status_code == 200
    data = r.json()
    assert [c["slug"] for c in data] == EXPECTED_CATS
    for c in data:
        assert "name" in c and "order" in c and "name_en" in c
        assert c["name_en"] == EXPECTED_EN_NAMES[c["slug"]]


def test_menu_items_seeded_with_en():
    r = requests.get(f"{API}/menu/items")
    assert r.status_code == 200
    items = r.json()
    assert len(items) >= 23, f"Expected >=23 items, got {len(items)}"
    required = {"id", "name", "description", "price", "image", "category", "popular", "chef_choice", "order", "active"}
    missing_en = []
    for it in items:
        assert required.issubset(it.keys()), f"Missing keys: {required - it.keys()}"
        assert it["category"] in EXPECTED_CATS
        assert "_id" not in it
        if not it.get("name_en") or not it.get("description_en"):
            missing_en.append(it["name"])
    assert not missing_en, f"Items missing EN fields: {missing_en}"


def test_menu_has_known_en_values():
    r = requests.get(f"{API}/menu/items")
    items = r.json()
    by_name = {it["name"]: it for it in items}
    if "Adana Kebap" in by_name:
        assert by_name["Adana Kebap"]["name_en"] == "Adana Kebab"
    if "Mercimek Çorbası" in by_name:
        assert by_name["Mercimek Çorbası"]["name_en"] == "Lentil Soup"


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


# ---------------- Cloudinary signature ----------------
def test_cloudinary_signature_requires_auth():
    r = requests.get(f"{API}/admin/cloudinary/signature")
    assert r.status_code == 401


def test_cloudinary_signature_ok(auth_headers):
    r = requests.get(f"{API}/admin/cloudinary/signature", params={"folder": "arikosk/menu"}, headers=auth_headers)
    assert r.status_code == 200, r.text
    d = r.json()
    for k in ("signature", "timestamp", "cloud_name", "api_key", "folder"):
        assert k in d, f"Missing key {k}"
    assert d["folder"] == "arikosk/menu"
    assert isinstance(d["signature"], str) and len(d["signature"]) > 10
    assert isinstance(d["timestamp"], int)


def test_cloudinary_signature_rejects_bad_folder(auth_headers):
    r = requests.get(f"{API}/admin/cloudinary/signature", params={"folder": "evil/menu"}, headers=auth_headers)
    assert r.status_code == 400


def test_cloudinary_signature_default_folder(auth_headers):
    r = requests.get(f"{API}/admin/cloudinary/signature", headers=auth_headers)
    assert r.status_code == 200
    assert r.json()["folder"] == "arikosk/menu"


# ---------------- Admin CRUD w/ EN fields ----------------
def test_admin_create_requires_auth():
    r = requests.post(f"{API}/admin/menu/items", json={
        "name": "X", "description": "x", "price": 1, "image": "http://x", "category": "kebaplar"
    })
    assert r.status_code == 401


def test_admin_crud_with_bilingual(auth_headers):
    payload = {
        "name": "TEST_Bilingual",
        "name_en": "TEST_Bilingual_EN",
        "description": "test tr",
        "description_en": "test en",
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
    assert created["name_en"] == "TEST_Bilingual_EN"
    assert created["description_en"] == "test en"
    assert "_id" not in created
    item_id = created["id"]

    # Verify in public list
    r2 = requests.get(f"{API}/menu/items")
    found = [it for it in r2.json() if it["id"] == item_id]
    assert found and found[0]["name_en"] == "TEST_Bilingual_EN"

    # Update EN fields
    r3 = requests.put(
        f"{API}/admin/menu/items/{item_id}",
        json={"name_en": "TEST_Updated_EN", "description_en": "updated en"},
        headers=auth_headers,
    )
    assert r3.status_code == 200
    updated = r3.json()
    assert updated["name_en"] == "TEST_Updated_EN"
    assert updated["description_en"] == "updated en"

    # Cleanup
    r4 = requests.delete(f"{API}/admin/menu/items/{item_id}", headers=auth_headers)
    assert r4.status_code == 200
