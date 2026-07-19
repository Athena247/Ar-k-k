# Arı Köşk — Digital Menu (PRD)

## Original Problem Statement
Turkish digital menu SPA for "Arı Köşk Pide & Kebap & Lahmacun". Mobile-first, minimalist, editorial (Awwwards-style) with framer-motion + lenis smooth scroll. Sticky horizontal-scrollable category nav, dynamic search filter, menu cards with Popüler / Şefin Seçimi badges, footer, admin panel. Style inspiration: central.dijital.menu.

## User Choices
- Light theme
- Admin panel + MongoDB backed CRUD
- QR code sharing
- Unsplash food images

## Architecture
- **Backend:** FastAPI + Motor (MongoDB). JWT auth via Bearer token (bcrypt). Endpoints: /api/menu/categories, /api/menu/items, /api/auth/{login,me,logout}, /api/admin/menu/items CRUD.
- **Frontend:** React 19 + react-router-dom 7. framer-motion, lenis (smooth scroll), react-fast-marquee, qrcode.react. Editorial art direction — Playfair Display (serif) + Manrope (body). Palette: bone #F7F5F0, ink #1A1A1A, ember #C44100.
- **Seed:** Idempotent seed on startup (24 Arı Köşk items across 6 categories + admin user).

## Implemented (2026-07-19)
- Kinetic hero with masked line-by-line reveal ("Arı Köşk"), parallax hero image, live İstanbul clock, meta bar
- Sticky glassmorphic category nav with layoutId active-pill animation, horizontal-scroll on mobile, search toggle, QR share button
- Slow editorial marquee (Pide · Kebap · Lahmacun · Odun Ateşinde Lezzet)
- 6 numbered menu sections (chapter-numbered) with staggered fade-up cards; menu cards with animated underline hover, price, badges (Popüler / Şefin Seçimi)
- Search filter (TR-aware locale) with elegant editorial input + empty state
- Manifesto section: 3 numbered chapters + sticky parallax image
- Dark footer with map/phone/hours/socials
- QR share modal with copy-to-clipboard
- Admin login (JWT Bearer) + Admin dashboard with full CRUD modal (create/edit/delete) and toasts
- Grain overlay, custom focus rings, TR locale prices (₺)

## Test Credentials
- Admin: admin@arikosk.com / arikosk2025 (also in /app/memory/test_credentials.md)

## Backlog (Next)
- P1: Multi-language toggle (TR / EN)
- P1: Rich image upload (S3/Cloud storage) in admin instead of URL field
- P2: Category reorder & drag-drop in admin
- P2: Featured "Today's specials" scheduler
- P2: WhatsApp-order deep link per item
