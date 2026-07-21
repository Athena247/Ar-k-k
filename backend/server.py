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

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr
import cloudinary
import cloudinary.utils

# Cloudinary setup
cloudinary.config(
    cloud_name=os.environ.get("CLOUDINARY_CLOUD_NAME"),
    api_key=os.environ.get("CLOUDINARY_API_KEY"),
    api_secret=os.environ.get("CLOUDINARY_API_SECRET"),
    secure=True,
)

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
    {"slug": "pideler", "name": "Pideler", "name_en": "Pides", "order": 1},
    {"slug": "soteler", "name": "Soteler", "name_en": "Sautes", "order": 2},
    {"slug": "pizzalar", "name": "Pizzalar", "name_en": "Pizzas", "order": 3},
    {"slug": "izgaralar", "name": "Izgaralar", "name_en": "Grills", "order": 4},
    {"slug": "durumler", "name": "Dürümler", "name_en": "Wraps", "order": 5},
    {"slug": "burgerler", "name": "Burgerler", "name_en": "Burgers", "order": 6},
    {"slug": "corbalar-yanlar", "name": "Çorbalar ve Yanlar", "name_en": "Soups & Sides", "order": 7},
    {"slug": "lahmacunlar", "name": "Lahmacunlar", "name_en": "Lahmacuns", "order": 8},
    {"slug": "tatlilar", "name": "Tatlılar", "name_en": "Desserts", "order": 9},
    {"slug": "icecekler", "name": "İçecekler", "name_en": "Drinks", "order": 10},
]


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class MenuItemCreate(BaseModel):
    name: str
    name_en: Optional[str] = ""
    name_ar: Optional[str] = ""
    description_ar: Optional[str] = ""
    description: str
    description_en: Optional[str] = ""
    price: float
    image: str
    category: str
    popular: bool = False
    chef_choice: bool = False
    today_special: bool = False
    order: int = 0
    active: bool = True


class MenuItemUpdate(BaseModel):
    name_ar: Optional[str] = None
    description_ar: Optional[str] = None
    name: Optional[str] = None
    name_en: Optional[str] = None
    description: Optional[str] = None
    description_en: Optional[str] = None
    price: Optional[float] = None
    image: Optional[str] = None
    category: Optional[str] = None
    popular: Optional[bool] = None
    chef_choice: Optional[bool] = None
    today_special: Optional[bool] = None
    order: Optional[int] = None
    active: Optional[bool] = None


class MenuItem(BaseModel):
    id: str
    name: str
    name_en: Optional[str] = None
    name_ar: Optional[str] = None
    description: str
    description_en: Optional[str] = None
    description_ar: Optional[str] = None
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
    # --- 1. PİDELER ---
    {"name": "Tavuklu Pide", "name_en": "Chicken Pide", "name_ar": "فطيره دجاج", "description": "Tavuklu Pide", "description_en": "Chicken Pide", "description_ar": "فطيره دجاج", "price": 320, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 1},
    {"name": "Mantarlı Pide", "name_en": "Mushroom Pide", "name_ar": "فطيره بالمشر", "description": "Mantarlı Pide", "description_en": "Mushroom Pide", "description_ar": "فطيره بالمشر", "price": 320, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 2},
    {"name": "Tavuk Mantarlı Pide", "name_en": "Chicken & Mushroom Pide", "name_ar": "فطيره دجاج مع المشر", "description": "Tavuk Mantarlı Pide", "description_en": "Chicken & Mushroom Pide", "description_ar": "فطيره دجاج مع المشر", "price": 340, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 3},
    {"name": "Trabzon Peynirli Pide", "name_en": "Trabzon Cheese Pide", "name_ar": "فطيره طرابزون بالجبن", "description": "Trabzon Peynirli Pide", "description_en": "Trabzon Cheese Pide", "description_ar": "فطيره طرابزون بالجبن", "price": 320, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 4},
    {"name": "Kaşarlı Peynirli Pide", "name_en": "Kaşar Cheese Pide", "name_ar": "فطيره بالجبن المشكول", "description": "Kaşarlı Peynirli Pide", "description_en": "Kaşar Cheese Pide", "description_ar": "فطيره بالجبن المشكول", "price": 350, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 5},
    {"name": "Açık Kıymalı Pide", "name_en": "Open Minced Meat Pide", "name_ar": "فطيره مفتوحه باللحم المفروم", "description": "Açık Kıymalı Pide", "description_en": "Open Minced Meat Pide", "description_ar": "فطيره مفتوحه باللحم المفروم", "price": 360, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 6},
    {"name": "Kaşarlı Sucuklu Pide", "name_en": "Sujuk & Cheese Pide", "name_ar": "فطيره بالسحق والجبن", "description": "Kaşarlı Sucuklu Pide", "description_en": "Sujuk & Cheese Pide", "description_ar": "فطيره بالسحق والجبن", "price": 350, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 7},
    {"name": "Trabzon Kıymalı Pide", "name_en": "Trabzon Minced Pide", "name_ar": "فطيره طرابزون باللحم المفروم", "description": "Trabzon Kıymalı Pide", "description_en": "Trabzon Minced Pide", "description_ar": "فطيره طرابزون باللحم المفروم", "price": 370, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 8},
    {"name": "Mevlana Pide", "name_en": "Mevlana Pide", "name_ar": "فطيره مولانا", "description": "Mevlana Pide", "description_en": "Mevlana Pide", "description_ar": "فطيره مولانا", "price": 320, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 9},
    {"name": "Sürmene Peynirli Pide", "name_en": "Sürmene Cheese Pide", "name_ar": "فطيره سورمسه بالجبن", "description": "Sürmene Peynirli Pide", "description_en": "Sürmene Cheese Pide", "description_ar": "فطيره سورمسه بالجبن", "price": 350, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 10},
    {"name": "Karışık Pide", "name_en": "Mixed Pide", "name_ar": "فطيره مشكله", "description": "Karışık Pide", "description_en": "Mixed Pide", "description_ar": "فطيره مشكله", "price": 440, "image": IMG["pide"], "category": "pideler", "popular": True, "chef_choice": False, "order": 11},
    {"name": "Kıymalı Kaşarlı Pide", "name_en": "Minced & Cheese Pide", "name_ar": "فطيره باللحم المفروم والجبن", "description": "Kıymalı Kaşarlı Pide", "description_en": "Minced & Cheese Pide", "description_ar": "فطيره باللحم المفروم والجبن", "price": 380, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 12},
    {"name": "Kaşarlı Kavurmalı Pide", "name_en": "Kavurma & Cheese Pide", "name_ar": "فطيره مشكله بالجبن", "description": "Kaşarlı Kavurmalı Pide", "description_en": "Kavurma & Cheese Pide", "description_ar": "فطيره مشكله بالجبن", "price": 460, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 13},
    {"name": "Kuşbaşılı Kaşarlı Pide", "name_en": "Diced Beef & Cheese Pide", "name_ar": "فطيره مكعبات بالجبن", "description": "Kuşbaşılı Kaşarlı Pide", "description_en": "Diced Beef & Cheese Pide", "description_ar": "فطيره مكعبات بالجبن", "price": 420, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 14},
    {"name": "Kapalı Kavurmalı Pide", "name_en": "Closed Kavurma Pide", "name_ar": "فطيره مسدله بالشمول", "description": "Kapalı Kavurmalı Pide", "description_en": "Closed Kavurma Pide", "description_ar": "فطيره مسدله بالشمول", "price": 500, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 15},
    {"name": "Kapalı Kıymalı Pide", "name_en": "Closed Minced Pide", "name_ar": "فطيره مغلقه باللحم المفروم", "description": "Kapalı Kıymalı Pide", "description_en": "Closed Minced Pide", "description_ar": "فطيره مغلقه باللحم المفروم", "price": 400, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 16},
    {"name": "Labneli Pide", "name_en": "Labneh Pide", "name_ar": "فطيره باللبنه", "description": "Labneli Pide", "description_en": "Labneh Pide", "description_ar": "فطيره باللبنه", "price": 420, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 17},
    {"name": "Zahterli Pide", "name_en": "Thyme Pide", "name_ar": "فطيره الزعتر", "description": "Zahterli Pide", "description_en": "Thyme Pide", "description_ar": "فطيره الزعتر", "price": 350, "image": IMG["pide"], "category": "pideler", "popular": False, "chef_choice": False, "order": 18},

    # --- 2. SOTELER ---
    {"name": "Kiremitte Kaşarlı Tavuk Sote", "name_en": "Chicken Saute with Cheese in Earthenware", "name_ar": "سوسه دجاج بالجبن في الصحن العفاري", "description": "Kiremitte Kaşarlı Tavuk Sote", "description_en": "Chicken Saute with Cheese in Earthenware", "description_ar": "سوسه دجاج بالجبن في الصحن العفاري", "price": 400, "image": IMG["kebap"], "category": "soteler", "popular": False, "chef_choice": False, "order": 1},
    {"name": "Kiremitte Kaşarlı Tavuk Mantar Sote", "name_en": "Chicken & Mushroom Saute with Cheese", "name_ar": "سوسه دجاج وفطر بالجبن في الصحن العفاري", "description": "Kiremitte Kaşarlı Tavuk Mantar Sote", "description_en": "Chicken & Mushroom Saute with Cheese", "description_ar": "سوسه دجاج وفطر بالجبن في الصحن العفاري", "price": 420, "image": IMG["kebap"], "category": "soteler", "popular": False, "chef_choice": False, "order": 2},
    {"name": "Kiremitte Kaşarlı Et Sote", "name_en": "Beef Saute with Cheese in Earthenware", "name_ar": "سوسه لحم بالجبن في الصحن العفاري", "description": "Kiremitte Kaşarlı Et Sote", "description_en": "Beef Saute with Cheese in Earthenware", "description_ar": "سوسه لحم بالجبن في الصحن العفاري", "price": 480, "image": IMG["kebap"], "category": "soteler", "popular": False, "chef_choice": True, "order": 3},
    {"name": "Kiremitte Kaşarlı Karışık Sote", "name_en": "Mixed Saute with Cheese in Earthenware", "name_ar": "سوسه مشكله بالجبن في الصحن العفاري", "description": "Kiremitte Kaşarlı Karışık Sote", "description_en": "Mixed Saute with Cheese in Earthenware", "description_ar": "سوسه مشكله بالجبن في الصحن العفاري", "price": 440, "image": IMG["kebap"], "category": "soteler", "popular": False, "chef_choice": False, "order": 4},
    {"name": "Kiremitte Kaşarlı Mantar Sote", "name_en": "Mushroom Saute with Cheese in Earthenware", "name_ar": "سوسه فطر بالجبن في الصحن العفاري", "description": "Kiremitte Kaşarlı Mantar Sote", "description_en": "Mushroom Saute with Cheese in Earthenware", "description_ar": "سوسه فطر بالجبن في الصحن العفاري", "price": 400, "image": IMG["kebap"], "category": "soteler", "popular": False, "chef_choice": False, "order": 5},

    # --- 3. PİZZALAR ---
    {"name": "Margarita Pizza", "name_en": "Margarita Pizza", "name_ar": "بيتزا مارغرينا", "description": "Margarita Pizza", "description_en": "Margarita Pizza", "description_ar": "بيتزا مارغرينا", "price": 350, "image": IMG["pide"], "category": "pizzalar", "popular": False, "chef_choice": False, "order": 1},
    {"name": "Karışık Pizza", "name_en": "Mixed Pizza", "name_ar": "بيتزا مشكله", "description": "Karışık Pizza", "description_en": "Mixed Pizza", "description_ar": "بيتزا مشكله", "price": 370, "image": IMG["pide"], "category": "pizzalar", "popular": True, "chef_choice": False, "order": 2},
    {"name": "Vejetaryen Pizza", "name_en": "Vegetarian Pizza", "name_ar": "بيتزا سايسه", "description": "Vejetaryen Pizza", "description_en": "Vegetarian Pizza", "description_ar": "بيتزا سايسه", "price": 360, "image": IMG["pide"], "category": "pizzalar", "popular": False, "chef_choice": False, "order": 3},
    {"name": "Köşk Pizza", "name_en": "Köşk Special Pizza", "name_ar": "بيتزا كوشك", "description": "Köşk Pizza", "description_en": "Köşk Special Pizza", "description_ar": "بيتزا كوشك", "price": 370, "image": IMG["pide"], "category": "pizzalar", "popular": False, "chef_choice": True, "order": 4},
    {"name": "Tavuklu Pizza", "name_en": "Chicken Pizza", "name_ar": "بيتزا الدجاج", "description": "Tavuklu Pizza", "description_en": "Chicken Pizza", "description_ar": "بيتزا الدجاج", "price": 370, "image": IMG["pide"], "category": "pizzalar", "popular": False, "chef_choice": False, "order": 5},

    # --- 4. IZGARALAR ---
    {"name": "Adana Kebap", "name_en": "Adana Kebab", "name_ar": "كباب أهنة", "description": "Adana Kebap", "description_en": "Adana Kebab", "description_ar": "كباب أهنة", "price": 460, "image": IMG["kebap"], "category": "izgaralar", "popular": True, "chef_choice": True, "order": 1},
    {"name": "Urfa Kebap", "name_en": "Urfa Kebab", "name_ar": "كباب أورفا", "description": "Urfa Kebap", "description_en": "Urfa Kebab", "description_ar": "كباب أورفا", "price": 460, "image": IMG["kebap"], "category": "izgaralar", "popular": False, "chef_choice": False, "order": 2},
    {"name": "Tavuk Şiş", "name_en": "Chicken Skewer", "name_ar": "شيش دجاج", "description": "Tavuk Şiş", "description_en": "Chicken Skewer", "description_ar": "شيش دجاج", "price": 340, "image": IMG["kebap"], "category": "izgaralar", "popular": False, "chef_choice": False, "order": 3},
    {"name": "Et Şiş", "name_en": "Meat Skewer", "name_ar": "شيش لحم", "description": "Et Şiş", "description_en": "Meat Skewer", "description_ar": "شيش لحم", "price": 600, "image": IMG["kebap"], "category": "izgaralar", "popular": False, "chef_choice": True, "order": 4},
    {"name": "Ciğer Şiş", "name_en": "Liver Skewer", "name_ar": "شيش كبدة", "description": "Ciğer Şiş", "description_en": "Liver Skewer", "description_ar": "شيش كبدة", "price": 460, "image": IMG["kebap"], "category": "izgaralar", "popular": False, "chef_choice": False, "order": 5},
    {"name": "Izgara Köfte", "name_en": "Grilled Meatballs", "name_ar": "كفته مشوية", "description": "Izgara Köfte", "description_en": "Grilled Meatballs", "description_ar": "كفته مشوية", "price": 460, "image": IMG["kebap"], "category": "izgaralar", "popular": True, "chef_choice": False, "order": 6},
    {"name": "Tavuk Kebap", "name_en": "Chicken Kebab", "name_ar": "كياب دجاج", "description": "Tavuk Kebap", "description_en": "Chicken Kebab", "description_ar": "كياب دجاج", "price": 450, "image": IMG["kebap"], "category": "izgaralar", "popular": False, "chef_choice": False, "order": 7},
    {"name": "Tavuk Kanat", "name_en": "Chicken Wings", "name_ar": "أجنحة دجاج", "description": "Tavuk Kanat", "description_en": "Chicken Wings", "description_ar": "أجنحة دجاج", "price": 380, "image": IMG["kebap"], "category": "izgaralar", "popular": False, "chef_choice": False, "order": 8},
    {"name": "Tavuk Pirzola", "name_en": "Chicken Chops", "name_ar": "قطعة دجاج مشوية", "description": "Tavuk Pirzola", "description_en": "Chicken Chops", "description_ar": "قطعة دجاج مشوية", "price": 0, "image": IMG["kebap"], "category": "izgaralar", "popular": False, "chef_choice": False, "order": 9},
    {"name": "Karışık Kebap 2 Kişilik", "name_en": "Mixed Kebab for 2", "name_ar": "مشاوي مشكلة لشخصن", "description": "Karışık Kebap 2 Kişilik", "description_en": "Mixed Kebab for 2", "description_ar": "مشاوي مشكلة لشخصن", "price": 1750, "image": IMG["kebap"], "category": "izgaralar", "popular": True, "chef_choice": True, "order": 10},
    {"name": "Karışık Kebap 1 Kişilik", "name_en": "Mixed Kebab for 1", "name_ar": "مشاوي مشكلة نشرحس واحد", "description": "Karışık Kebap 1 Kişilik", "description_en": "Mixed Kebab for 1", "description_ar": "مشاوي مشكلة نشرحس واحد", "price": 1335, "image": IMG["kebap"], "category": "izgaralar", "popular": False, "chef_choice": False, "order": 11},

    # --- 5. DÜRÜMLER ---
    {"name": "Adana Dürüm", "name_en": "Adana Wrap", "name_ar": "لفافة أهنة", "description": "Adana Dürüm", "description_en": "Adana Wrap", "description_ar": "لفافة أهنة", "price": 235, "image": IMG["kebap"], "category": "durumler", "popular": True, "chef_choice": False, "order": 1},
    {"name": "Urfa Dürüm", "name_en": "Urfa Wrap", "name_ar": "دوروم أورفا", "description": "Urfa Dürüm", "description_en": "Urfa Wrap", "description_ar": "دوروم أورفا", "price": 235, "image": IMG["kebap"], "category": "durumler", "popular": False, "chef_choice": False, "order": 2},
    {"name": "Tavuk Şiş Dürüm", "name_en": "Chicken Skewer Wrap", "name_ar": "دوروم شيش دجاج", "description": "Tavuk Şiş Dürüm", "description_en": "Chicken Skewer Wrap", "description_ar": "دوروم شيش دجاج", "price": 175, "image": IMG["kebap"], "category": "durumler", "popular": False, "chef_choice": False, "order": 3},
    {"name": "Et Şiş Dürüm", "name_en": "Meat Skewer Wrap", "name_ar": "دوروم شيش لحم", "description": "Et Şiş Dürüm", "description_en": "Meat Skewer Wrap", "description_ar": "دوروم شيش لحم", "price": 305, "image": IMG["kebap"], "category": "durumler", "popular": False, "chef_choice": False, "order": 4},
    {"name": "Ciğer Şiş Dürüm", "name_en": "Liver Skewer Wrap", "name_ar": "دوروم شيش كبدة", "description": "Ciğer Şiş Dürüm", "description_en": "Liver Skewer Wrap", "description_ar": "دوروم شيش كبدة", "price": 235, "image": IMG["kebap"], "category": "durumler", "popular": False, "chef_choice": False, "order": 5},
    {"name": "Tavuk Kebap Dürüm", "name_en": "Chicken Kebab Wrap", "name_ar": "دوروم كباب دجاج", "description": "Tavuk Kebap Dürüm", "description_en": "Chicken Kebab Wrap", "description_ar": "دوروم كباب دجاج", "price": 230, "image": IMG["kebap"], "category": "durumler", "popular": False, "chef_choice": False, "order": 6},
    {"name": "Köfte Dürüm", "name_en": "Meatball Wrap", "name_ar": "دوروم كفته", "description": "Köfte Dürüm", "description_en": "Meatball Wrap", "description_ar": "دوروم كفته", "price": 270, "image": IMG["kebap"], "category": "durumler", "popular": False, "chef_choice": False, "order": 7},
    {"name": "Tavuk Pirzola Dürüm", "name_en": "Chicken Chop Wrap", "name_ar": "دپوروم دجاج مشونة", "description": "Tavuk Pirzola Dürüm", "description_en": "Chicken Chop Wrap", "description_ar": "دپوروم دجاج مشونة", "price": 0, "image": IMG["kebap"], "category": "durumler", "popular": False, "chef_choice": False, "order": 8},
    {"name": "Ekmek Arası Köfte", "name_en": "Meatball in Bread", "name_ar": "ساندويش كفته", "description": "Ekmek Arası Köfte", "description_en": "Meatball in Bread", "description_ar": "ساندويش كفته", "price": 270, "image": IMG["kebap"], "category": "durumler", "popular": False, "chef_choice": False, "order": 9},
    {"name": "Ekmek Arası Tavuk Pirzola", "name_en": "Chicken Chop in Bread", "name_ar": "ساندويش دجاج مشونة", "description": "Ekmek Arası Tavuk Pirzola", "description_en": "Chicken Chop in Bread", "description_ar": "ساندويش دجاج مشونة", "price": 0, "image": IMG["kebap"], "category": "durumler", "popular": False, "chef_choice": False, "order": 10},
    {"name": "Ekmek Arası Adana", "name_en": "Adana in Bread", "name_ar": "ساندويش اقنة", "description": "Ekmek Arası Adana", "description_en": "Adana in Bread", "description_ar": "ساندويش اقنة", "price": 270, "image": IMG["kebap"], "category": "durumler", "popular": False, "chef_choice": False, "order": 11},
    {"name": "Tavuk Kavurma Dürüm", "name_en": "Chicken Kavurma Wrap", "name_ar": "دورسه دجاج", "description": "Tavuk Kavurma Dürüm", "description_en": "Chicken Kavurma Wrap", "description_ar": "دورسه دجاج", "price": 200, "image": IMG["kebap"], "category": "durumler", "popular": False, "chef_choice": False, "order": 12},
    {"name": "Tophane Tavuk Kavurma", "name_en": "Tophane Chicken Kavurma Wrap", "name_ar": "ساورما دجاج في خير نوبجانه", "description": "Tophane Tavuk Kavurma", "description_en": "Tophane Chicken Kavurma Wrap", "description_ar": "ساورما دجاج في خير نوبجانه", "price": 215, "image": IMG["kebap"], "category": "durumler", "popular": False, "chef_choice": True, "order": 13},

    # --- 6. BURGERLER ---
    {"name": "Çıtır Tavuk Burger", "name_en": "Crispy Chicken Burger", "name_ar": "برغر دجاج مقروش", "description": "Çıtır Tavuk Burger", "description_en": "Crispy Chicken Burger", "description_ar": "برغر دجاج مقروش", "price": 320, "image": IMG["kebap"], "category": "burgerler", "popular": False, "chef_choice": False, "order": 1},
    {"name": "Cheddarlı Tavuk Burger", "name_en": "Cheddar Chicken Burger", "name_ar": "برغر دجاج جسثة شهيد", "description": "Cheddarlı Tavuk Burger", "description_en": "Cheddar Chicken Burger", "description_ar": "برغر دجاج جسثة شهيد", "price": 340, "image": IMG["kebap"], "category": "burgerler", "popular": False, "chef_choice": False, "order": 2},
    {"name": "Eko Burger", "name_en": "Eco Burger", "name_ar": "إيكو برغر", "description": "Eko Burger", "description_en": "Eco Burger", "description_ar": "إيكو برغر", "price": 370, "image": IMG["kebap"], "category": "burgerler", "popular": False, "chef_choice": False, "order": 3},
    {"name": "Et Burger", "name_en": "Beef Burger", "name_ar": "برغر لحم", "description": "Et Burger", "description_en": "Beef Burger", "description_ar": "برغر لحم", "price": 440, "image": IMG["kebap"], "category": "burgerler", "popular": True, "chef_choice": True, "order": 4},

    # --- 7. ÇORBALAR VE YANLAR ---
    {"name": "Siizma Merziinak Çorbası", "name_en": "Mercimek Soup", "name_ar": "شوربة مص مصنلة", "description": "Siizma Merziinak Çorbası", "description_en": "Mercimek Soup", "description_ar": "شوربة مص مصنلة", "price": 120, "image": IMG["corba"], "category": "corbalar-yanlar", "popular": False, "chef_choice": False, "order": 1},
    {"name": "Ezogelin Çorbası", "name_en": "Ezogelin Soup", "name_ar": "شوربة إيروقيتين", "description": "Ezogelin Çorbası", "description_en": "Ezogelin Soup", "description_ar": "شوربة إيروقيتين", "price": 120, "image": IMG["corba"], "category": "corbalar-yanlar", "popular": False, "chef_choice": False, "order": 2},
    {"name": "Ezme", "name_en": "Spicy Salad (Ezme)", "name_ar": "إزمه", "description": "Ezme", "description_en": "Spicy Salad (Ezme)", "description_ar": "إزمه", "price": 65, "image": IMG["corba"], "category": "corbalar-yanlar", "popular": False, "chef_choice": False, "order": 3},
    {"name": "Mevsim Salata", "name_en": "Seasonal Salad", "name_ar": "سلطة الموسم", "description": "Mevsim Salata", "description_en": "Seasonal Salad", "description_ar": "سلطة الموسم", "price": 130, "image": IMG["corba"], "category": "corbalar-yanlar", "popular": False, "chef_choice": False, "order": 4},
    {"name": "Pilav", "name_en": "Rice Pilaf", "name_ar": "أرز", "description": "Pilav", "description_en": "Rice Pilaf", "description_ar": "أرز", "price": 120, "image": IMG["corba"], "category": "corbalar-yanlar", "popular": False, "chef_choice": False, "order": 5},
    {"name": "Humus", "name_en": "Hummus", "name_ar": "حمص", "description": "Humus", "description_en": "Hummus", "description_ar": "حمص", "price": 150, "image": IMG["corba"], "category": "corbalar-yanlar", "popular": False, "chef_choice": False, "order": 6},
    {"name": "Mutebbel", "name_en": "Mutebbel", "name_ar": "منتل", "description": "Mutebbel", "description_en": "Mutebbel", "description_ar": "منتل", "price": 150, "image": IMG["corba"], "category": "corbalar-yanlar", "popular": False, "chef_choice": False, "order": 7},
    {"name": "Patates Cips", "name_en": "French Fries", "name_ar": "رقائق البطائس", "description": "Patates Cips", "description_en": "French Fries", "description_ar": "رقائق البطائس", "price": 235, "image": IMG["corba"], "category": "corbalar-yanlar", "popular": False, "chef_choice": False, "order": 8},

    # --- 8. LAHMACUNLAR ---
    {"name": "Lahmacun", "name_en": "Lahmacun", "name_ar": "لحم بعجين", "description": "Lahmacun", "description_en": "Lahmacun", "description_ar": "لحم بعجين", "price": 140, "image": IMG["lahmacun"], "category": "lahmacunlar", "popular": True, "chef_choice": False, "order": 1},

    # --- 9. TATLILAR ---
    {"name": "Fıstıklı Baklava", "name_en": "Pistachio Baklava", "name_ar": "بقلاوة بالفستق", "description": "Fıstıklı Baklava", "description_en": "Pistachio Baklava", "description_ar": "بقلاوة بالفستق", "price": 180, "image": IMG["tatli"], "category": "tatlilar", "popular": True, "chef_choice": True, "order": 1},
    {"name": "Künefe", "name_en": "Künefe", "name_ar": "كنافة", "description": "Künefe", "description_en": "Künefe", "description_ar": "كنافة", "price": 190, "image": IMG["tatli"], "category": "tatlilar", "popular": True, "chef_choice": False, "order": 2},

    # --- 10. İÇECEKLER ---
    {"name": "Cola", "name_en": "Cola", "name_ar": "كولا", "description": "Cola", "description_en": "Cola", "description_ar": "كولا", "price": 75, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 1},
    {"name": "Fanta", "name_en": "Fanta", "name_ar": "فانتا", "description": "Fanta", "description_en": "Fanta", "description_ar": "فانتا", "price": 75, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 2},
    {"name": "Sprite", "name_en": "Sprite", "name_ar": "سبرايت", "description": "Sprite", "description_en": "Sprite", "description_ar": "سبرايت", "price": 75, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 3},
    {"name": "Fusetea", "name_en": "Fusetea", "name_ar": "شاي فستق", "description": "Fusetea", "description_en": "Fusetea", "description_ar": "شاي فستق", "price": 75, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 4},
    {"name": "Meyve Suyu", "name_en": "Fruit Juice", "name_ar": "عصير فواكه", "description": "Meyve Suyu", "description_en": "Fruit Juice", "description_ar": "عصير فواكه", "price": 75, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 5},
    {"name": "Şişe Cola", "name_en": "Glass Bottle Cola", "name_ar": "كولا زجاج", "description": "Şişe Cola", "description_en": "Glass Bottle Cola", "description_ar": "كولا زجاج", "price": 75, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 6},
    {"name": "Ayran", "name_en": "Ayran", "name_ar": "ايران", "description": "Ayran", "description_en": "Ayran", "description_ar": "ايران", "price": 40, "image": IMG["icecek"], "category": "icecekler", "popular": True, "chef_choice": False, "order": 7},
    {"name": "Şalgam", "name_en": "Turnip Juice", "name_ar": "شالقم", "description": "Şalgam", "description_en": "Turnip Juice", "description_ar": "شالقم", "price": 65, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 8},
    {"name": "Sıkma Portakal", "name_en": "Fresh Orange Juice", "name_ar": "عصير برتقال طازج", "description": "Sıkma Portakal", "description_en": "Fresh Orange Juice", "description_ar": "عصير برتقال طازج", "price": 200, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": True, "order": 9},
    {"name": "Limonata", "name_en": "Lemonade", "name_ar": "ليموناده", "description": "Limonata", "description_en": "Lemonade", "description_ar": "ليموناده", "price": 0, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 10},
    {"name": "Limonlu Soda", "name_en": "Lemon Soda", "name_ar": "صودا ليمون", "description": "Limonlu Soda", "description_en": "Lemon Soda", "description_ar": "صودا ليمون", "price": 45, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 11},
    {"name": "Soda", "name_en": "Mineral Water", "name_ar": "ماء غازي", "description": "Soda", "description_en": "Mineral Water", "description_ar": "ماء غازي", "price": 45, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 12},
    {"name": "Şeftali Meyve Suyu", "name_en": "Peach Juice", "name_ar": "عصير خوخ", "description": "Şeftali Meyve Suyu", "description_en": "Peach Juice", "description_ar": "عصير خوخ", "price": 75, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 13},
    {"name": "Vişneli Meyve Suyu", "name_en": "Cherry Juice", "name_ar": "عصير كرز", "description": "Vişneli Meyve Suyu", "description_en": "Cherry Juice", "description_ar": "عصير كرز", "price": 75, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 14},
    {"name": "Karışık Meyve Suyu", "name_en": "Mixed Fruit Juice", "name_ar": "عصير فواكه مشكل", "description": "Karışık Meyve Suyu", "description_en": "Mixed Fruit Juice", "description_ar": "عصير فواكه مشكل", "price": 75, "image": IMG["icecek"], "category": "icecekler", "popular": False, "chef_choice": False, "order": 15},
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

    # Menu items — upsert each seed item by (name, category); backfill missing EN fields
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
        else:
            patch = {}
            if not existing_item.get("name_en"):
                patch["name_en"] = item.get("name_en", "")
            if not existing_item.get("name_ar"): # AR desteği eklendi
                patch["name_ar"] = item.get("name_ar", "")
            if not existing_item.get("description_en"):
                patch["description_en"] = item.get("description_en", "")
            if not existing_item.get("description_ar"): # AR desteği eklendi
                patch["description_ar"] = item.get("description_ar", "")
            if patch:
                await db.menu_items.update_one(
                    {"_id": existing_item["_id"]}, {"$set": patch}
                )


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
    data = payload.model_dump()
    
    # Eğer yeni eklenen ürün günün şef seçimi yapıldıysa, diğerlerinin günün şef seçimini kaldır
    if data.get("today_special"):
        await db.menu_items.update_many({}, {"$set": {"today_special": False}})
        
    doc = {
        "id": str(uuid.uuid4()),
        **data,
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
        
    # Eğer güncellenen ürün günün şef seçimi yapıldıysa, diğer tüm ürünlerin günün şef seçimini false yap
    if update.get("today_special") is True:
        await db.menu_items.update_many({"id": {"$ne": item_id}}, {"$set": {"today_special": False}})
        
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
# Routes: cloudinary signature (admin-only)
# ---------------------------------------------------------------------------
import time as _time


@api.get("/admin/cloudinary/signature")
async def cloudinary_signature(
    folder: str = Query("arikosk/menu"),
    user=Depends(get_current_admin),
):
    ALLOWED_PREFIXES = ("arikosk/",)
    if not folder.startswith(ALLOWED_PREFIXES):
        raise HTTPException(status_code=400, detail="Invalid folder path")

    api_secret = os.environ.get("CLOUDINARY_API_SECRET")
    if not api_secret:
        raise HTTPException(status_code=500, detail="Cloudinary not configured")

    timestamp = int(_time.time())
    params = {"timestamp": timestamp, "folder": folder}
    signature = cloudinary.utils.api_sign_request(params, api_secret)
    return {
        "signature": signature,
        "timestamp": timestamp,
        "cloud_name": os.environ.get("CLOUDINARY_CLOUD_NAME"),
        "api_key": os.environ.get("CLOUDINARY_API_KEY"),
        "folder": folder,
    }


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
