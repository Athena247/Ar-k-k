from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

import os
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr

# ---------------------------------------------------------------------------
# DB
# ---------------------------------------------------------------------------
mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------
app = FastAPI(title="Arı Köşk Digital Menu API")
api = APIRouter(prefix="/api")

JWT_ALGO = "HS256"
JWT_SECRET = os.environ["JWT_SECRET"]

# ---------------------------------------------------------------------------
# Helpers: password + jwt
# ---------------------------------------------------------------------------
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()


def verify_password(pw: str, hashed: str) -> bool:
    return bcrypt.checkpw(pw.encode(), hashed.encode())


def create_access_token(email: str) -> str:
    payload = {
        "sub": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=12),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


async def get_current_admin(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth = request.headers.get("Authorization", "")
        if auth.startswith("Bearer "):
            token = auth[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"email": payload.get("sub")}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
CATEGORIES = [
    {"slug": "corbalar", "name": "Çorbalar", "order": 1},
    {"slug": "pideler", "name": "Pideler", "order": 2},
    {"slug": "kebaplar", "name": "Kebaplar", "order": 3},
    {"slug": "lahmacunlar", "name": "Lahmacunlar", "order": 4},
    {"slug": "tatlilar", "name": "Tatlılar", "order": 5},
    {"slug": "icecekler", "name": "İçecekler", "order": 6},
]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class MenuItemCreate(BaseModel):
    name: str
    description: str
    price: float
    image: str
    category: str
    popular: bool = False
    chef_choice: bool = False
    order: int = 0
    active: bool = True


class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    category: Optional[str] = None
    popular: Optional[bool] = None
    chef_choice: Optional[bool] = None
    order: Optional[int] = None
    active: Optional[bool] = None


class MenuItem(BaseModel):
    id: str
    name: str
    description: str
    price: float
    image: str
    category: str
    popular: bool = False
    chef_choice: bool = False
    order: int = 0
    active: bool = True
    created_at: str
    updated_at: str


# ---------------------------------------------------------------------------
# Seed data
# ---------------------------------------------------------------------------
IMG = {
    "kebap": "https://images.pexels.com/photos/17794709/pexels-photo-17794709.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "pide": "https://images.unsplash.com/photo-1772758632889-b3518f24a4a7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHw0fHx0dXJraXNoJTIwZmxhdGJyZWFkJTIwcGlkZXxlbnwwfHx8fDE3ODQ0NzQyMzF8MA&ixlib=rb-4.1.0&q=85",
    "lahmacun": "https://images.pexels.com/photos/7545571/pexels-photo-7545571.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "corba": "https://images.unsplash.com/photo-1761830476467-0ff86dbcc75d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHw0fHxzb3VwJTIwYm93bCUyMHJlc3RhdXJhbnR8ZW58MHx8fHwxNzg0NDc0MjMxfDA&ixlib=rb-4.1.0&q=85",
    "tatli": "https://images.pexels.com/photos/35712797/pexels-photo-35712797.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "icecek": "https://images.pexels.com/photos/28617425/pexels-photo-28617425.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
}

SEED_ITEMS = [
    # Çorbalar
    {"name": "Mercimek Çorbası", "description": "Kırmızı mercimek, taze nane ve limon ile pişirilmiş, ev usulü", "price": 85, "image": IMG["corba"], "category": "corbalar", "popular": True, "chef_choice": False, "order": 1},
    {"name": "İşkembe Çorbası", "description": "Sarımsak, sirke ve pul biberle servis edilir", "price": 120, "image": IMG["corba"], "category": "corbalar", "popular": False, "chef_choice": False, "order": 2},
    {"name": "Yayla Çorbası", "description": "Yoğurt, pirinç ve kuru nane ile hazırlanır", "price": 95, "image": IMG["corba"], "category": "corbalar", "popular": False, "chef_choice": False, "order": 3},

    # Pideler
    {"name": "Kuşbaşılı Pide", "description": "Elde kesilmiş dana kuşbaşı, közlenmiş biber, kekik", "price": 260, "image": IMG["pide"], "category": "pideler", "popular": True, "chef_choice": False, "order": 1},
    {"name": "Kıymalı Pide", "description": "Zırh kıyması, soğan, maydanoz ve tereyağı", "price": 230, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 2},
    {"name": "Kaşarlı Pide", "description": "Tam yağlı taze kaşar ve tereyağı ile", "price": 210, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 3},
    {"name": "Karışık Pide", "description": "Kuşbaşı, kaşar, sucuk, yumurta — hepsi bir arada", "price": 285, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": True, "order": 4},
    {"name": "Kavurmalı Pide", "description": "Ev yapımı dana kavurma, kekik ve tereyağı", "price": 275, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 5},

    # Kebaplar
    {"name": "Adana Kebap", "description": "Zırh kıyması, közlenmiş biber ve domates, bulgur pilavı ile", "price": 340, "image": IMG["kebap"], "category": "kebaplar", "popular": True, "chef_choice": True, "order": 1},
    {"name": "Urfa Kebap", "description": "Acısız zırh kıyması, közlenmiş sebzeler eşliğinde", "price": 340, "image": IMG["kebap"], "category": "kebaplar", "popular": False, "chef_choice": False, "order": 2},
    {"name": "Beyti Sarma", "description": "Zırh kıyma, lavaş sargı, yoğurt ve domates sosu", "price": 385, "image": IMG["kebap"], "category": "kebaplar", "popular": False, "chef_choice": True, "order": 3},
    {"name": "Kuzu Şiş", "description": "Marine edilmiş kuzu but, kömür ateşinde", "price": 420, "image": IMG["kebap"], "category": "kebaplar", "popular": True, "chef_choice": False, "order": 4},
    {"name": "Tavuk Şiş", "description": "Marine tavuk göğsü, közlenmiş domates ve biber", "price": 285, "image": IMG["kebap"], "category": "kebaplar", "popular": False, "chef_choice": False, "order": 5},
    {"name": "Ciğer Şiş", "description": "Kuzu ciğer, soğan piyaz ve sumak ile", "price": 310, "image": IMG["kebap"], "category": "kebaplar", "popular": False, "chef_choice": False, "order": 6},

    # Lahmacunlar
    {"name": "Çıtır Lahmacun", "description": "İnce hamur, elde çekilmiş kıyma, maydanoz, limon", "price": 95, "image": IMG["lahmacun"], "category": "lahmacunlar", "popular": True, "chef_choice": False, "order": 1},
    {"name": "Antep Usulü Acılı", "description": "Acılı harç, taze biber, sumak ve maydanoz", "price": 105, "image": IMG["lahmacun"], "category": "lahmacunlar", "popular": False, "chef_choice": True, "order": 2},
    {"name": "Peynirli Lahmacun", "description": "Kaşar ve dil peyniri, taze fesleğen", "price": 115, "image": IMG["lahmacun"], "category": "lahmacunlar", "popular": False, "chef_choice": False, "order": 3},

    # Tatlılar
    {"name": "Fıstıklı Baklava", "description": "40 kat yufka, taze Antep fıstığı ve tereyağı", "price": 180, "image": IMG["tatli"], "category": "tatlilar", "popular": True, "chef_choice": True, "order": 1},
    {"name": "Künefe", "description": "Kadayıf, hatay peyniri, şerbet ve fıstık", "price": 190, "image": IMG["tatli"], "category": "tatlilar", "popular": True, "chef_choice": False, "order": 2},
    {"name": "Sütlaç", "description": "Fırında pişmiş, tarçınlı ev usulü sütlaç", "price": 110, "image": IMG["tatli"], "category": "tatlilar", "popular": False, "chef_choice": False, "order": 3},

    # İçecekler
    {"name": "Şalgam Suyu", "description": "Acılı veya sade, hakiki Adana usulü", "price": 45, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 1},
    {"name": "Ayran", "description": "Ev yapımı, köpüklü ve serin", "price": 40, "image": IMG["icecek"], "category": "icecekler", "popular": True, "chef_choice": False, "order": 2},
    {"name": "Türk Kahvesi", "description": "Bakır cezvede pişirilmiş, lokum eşliğinde", "price": 65, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": True, "order": 3},
    {"name": "Çay", "description": "Demlikte pişmiş, ince belli bardakta", "price": 20, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 4},
]


async def seed_admin_and_menu():
    # Admin
    admin_email = os.environ["ADMIN_EMAIL"]
    admin_pw = os.environ["ADMIN_PASSWORD"]
    existing = await db.users.find_one({"email": admin_email})
    if existing is None:
        await db.users.insert_one({
            "email": admin_email,
            "password_hash": hash_password(admin_pw),
            "role": "admin",
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    elif not verify_password(admin_pw, existing["password_hash"]):
        await db.users.update_one({"email": admin_email}, {"$set": {"password_hash": hash_password(admin_pw)}})

    # Menu items — upsert each seed item by (name, category) so any missing item is restored
    now = datetime.now(timezone.utc).isoformat()
    for item in SEED_ITEMS:
        existing_item = await db.menu_items.find_one(
            {"name": item["name"], "category": item["category"]}
        )
        if existing_item is None:
            await db.menu_items.insert_one({
                "id": str(uuid.uuid4()),
                **item,
                "active": True,
                "created_at": now,
                "updated_at": now,
            })


# ---------------------------------------------------------------------------
# Routes: public
# ---------------------------------------------------------------------------
@api.get("/")
async def root():
    return {"message": "Arı Köşk Digital Menu API"}


@api.get("/menu/categories")
async def get_categories():
    return CATEGORIES


@api.get("/menu/items")
async def list_items():
    cursor = db.menu_items.find({"active": True}, {"_id": 0}).sort([("category", 1), ("order", 1)])
    items = await cursor.to_list(1000)
    return items


# ---------------------------------------------------------------------------
# Routes: auth
# ---------------------------------------------------------------------------
@api.post("/auth/login")
async def login(payload: LoginRequest, response: Response):
    email = payload.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(payload.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="E-posta veya şifre hatalı")
    token = create_access_token(email)
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=True,
        samesite="none",
        max_age=60 * 60 * 12,
        path="/",
    )
    return {"email": email, "role": user.get("role", "admin"), "token": token}


@api.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    return {"ok": True}


@api.get("/auth/me")
async def me(user=Depends(get_current_admin)):
    return user


# ---------------------------------------------------------------------------
# Routes: admin menu CRUD
# ---------------------------------------------------------------------------
@api.get("/admin/menu/items")
async def admin_list_items(user=Depends(get_current_admin)):
    cursor = db.menu_items.find({}, {"_id": 0}).sort([("category", 1), ("order", 1)])
    return await cursor.to_list(2000)


@api.post("/admin/menu/items")
async def admin_create_item(payload: MenuItemCreate, user=Depends(get_current_admin)):
    now = datetime.now(timezone.utc).isoformat()
    doc = {
        "id": str(uuid.uuid4()),
        **payload.model_dump(),
        "created_at": now,
        "updated_at": now,
    }
    await db.menu_items.insert_one(doc)
    doc.pop("_id", None)
    return doc


@api.put("/admin/menu/items/{item_id}")
async def admin_update_item(item_id: str, payload: MenuItemUpdate, user=Depends(get_current_admin)):
    update = {k: v for k, v in payload.model_dump().items() if v is not None}
    if not update:
        raise HTTPException(status_code=400, detail="No fields to update")
    update["updated_at"] = datetime.now(timezone.utc).isoformat()
    result = await db.menu_items.update_one({"id": item_id}, {"$set": update})
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    doc = await db.menu_items.find_one({"id": item_id}, {"_id": 0})
    return doc


@api.delete("/admin/menu/items/{item_id}")
async def admin_delete_item(item_id: str, user=Depends(get_current_admin)):
    result = await db.menu_items.delete_one({"id": item_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Item not found")
    return {"ok": True}


# ---------------------------------------------------------------------------
# Wire app
# ---------------------------------------------------------------------------
app.include_router(api)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@app.on_event("startup")
async def _startup():
    await db.users.create_index("email", unique=True)
    await db.menu_items.create_index([("category", 1), ("order", 1)])
    await seed_admin_and_menu()
    logger.info("Startup complete")


@app.on_event("shutdown")
async def _shutdown():
    client.close()
