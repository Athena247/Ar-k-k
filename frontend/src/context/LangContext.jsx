import React, { createContext, useContext, useEffect, useState } from "react";

const LangCtx = createContext(null);

const STRINGS = {
    tr: {
        open: "Açık",
        est: "Est. 1998",
        woodFire: "Odun Ateşi",
        tel: "Tel · 0212 000 00 00",
        admin: "Yönetim",
        chapter00: "Bölüm 00 — Menü",
        heroSub:
            "Zırh kıyması, közlenmiş biber, odun kokusu. Anadolu'dan sofranıza.",
        concept: "Konsept",
        pideKebapLahmacun: "Pide · Kebap · Lahmacun",
        signature: "Signature — 2025",
        signatureLine: "Adana, kömür üstünde",
        todaysChoice: "Bugünün Şef Seçimi",
        exploreMenu: "Menüyü keşfet",
        popular: "Popüler",
        chefsChoice: "Şefin Seçimi",
        search: "Menü içinde ara — Enter",
        searchPh: "Örn. Adana, künefe, pide...",
        loading: "Menü hazırlanıyor…",
        noResults: "Sonuç yok",
        noMatch: (q) => `"${q}" için bir şey bulamadık.`,
        contactVisit: "İletişim — Ziyaret",
        letsMeet: "Sofrada",
        atTheTable: "buluşalım.",
        everyDay: "Her gün · 11:00 — 23:30",
        weekend: "Cuma & Cumartesi · 00:30",
        adminPanel: "Yönetim Paneli →",
        backToMenu: "← Menüye Dön",
        shareQr: "Paylaş — QR",
        qrHeadline: "Menü'yü masana getir.",
        qrCopy:
            "Kamerayla okut veya bağlantıyı kopyala. Menü tüm cihazlarda sorunsuz açılır.",
        soup: "Sıcak · İlk Tabak",
        pideKick: "Odun Fırını · İnce Hamur",
        kebapKick: "Kömür Ateşi · Elde İşlenmiş",
        lahKick: "Antep · Adana Usulü",
        tatKick: "Şerbetli · Sütlü",
        icKick: "Serin · Aromalı",
        manifesto: "Manifesto — 1998",
        threePrinciples: "Üç",
        principlesEmph: " ilkeyle",
        weCook: "pişiriyoruz.",
        // Manifesto chapters
        fire: "Ateş",
        fireBody:
            "Her sabah kütükler kesilir, kömür usulca hazırlanır. Kebap ancak doğru ateşle olur; sabır bir malzemedir.",
        zirh: "Zırh",
        zirhBody:
            "Kıyma makinede değil, iki demir zırhla elle hazırlanır. Doku, ısı ve tuz — Adana&apos;nın hafızasıdır.",
        oven: "Fırın",
        ovenBody:
            "Pide hamuru üç kez dinlenir, 380°C&apos;de otuz saniye pişer. İnce, çıtır, tarif kağıda değil ele yazılır.",
    },
    en: {
        open: "Open",
        est: "Est. 1998",
        woodFire: "Wood Fire",
        tel: "Tel · +90 212 000 00 00",
        admin: "Admin",
        chapter00: "Chapter 00 — Menu",
        heroSub:
            "Hand-chopped mince, charred peppers, wood smoke. Anatolia, to your table.",
        concept: "Concept",
        pideKebapLahmacun: "Pide · Kebab · Lahmacun",
        signature: "Signature — 2025",
        signatureLine: "Adana, over the coals",
        todaysChoice: "Today's Chef Pick",
        exploreMenu: "Explore the menu",
        popular: "Popular",
        chefsChoice: "Chef's Choice",
        search: "Search the menu — Enter",
        searchPh: "e.g. Adana, künefe, pide...",
        loading: "Preparing the menu…",
        noResults: "No results",
        noMatch: (q) => `Couldn't find anything for "${q}".`,
        contactVisit: "Contact — Visit",
        letsMeet: "Let's meet",
        atTheTable: "at the table.",
        everyDay: "Every day · 11:00 — 23:30",
        weekend: "Fri & Sat · 00:30",
        adminPanel: "Admin Panel →",
        backToMenu: "← Back to Menu",
        shareQr: "Share — QR",
        qrHeadline: "Bring the menu to your table.",
        qrCopy:
            "Scan with your camera or copy the link. The menu opens perfectly on every device.",
        soup: "Warm · First Course",
        pideKick: "Wood Oven · Thin Crust",
        kebapKick: "Charcoal · Hand-Chopped",
        lahKick: "Antep · Adana Style",
        tatKick: "Syrupy · Milky",
        icKick: "Cool · Aromatic",
        manifesto: "Manifesto — 1998",
        threePrinciples: "Three",
        principlesEmph: " principles",
        weCook: "we cook by.",
        // Manifesto chapters
        fire: "Fire",
        fireBody:
            "Every morning the logs are cut, the coals are prepared quietly. A proper kebab needs the right fire; patience is an ingredient.",
        zirh: "The Blade",
        zirhBody:
            "The mince is not machine-ground — it's hand-chopped with two iron blades. Texture, heat and salt: the memory of Adana.",
        oven: "The Oven",
        ovenBody:
            "The pide dough rests three times, then bakes for thirty seconds at 380°C. Thin, crisp — the recipe lives in the hands, not on paper.",
    },
};

export function LangProvider({ children }) {
    const [lang, setLang] = useState(() => {
        if (typeof window === "undefined") return "tr";
        return localStorage.getItem("arikosk_lang") || "tr";
    });

    useEffect(() => {
        localStorage.setItem("arikosk_lang", lang);
        if (typeof document !== "undefined") {
            document.documentElement.lang = lang;
        }
    }, [lang]);

    const t = STRINGS[lang];
    const toggle = () => setLang((l) => (l === "tr" ? "en" : "tr"));

    return (
        <LangCtx.Provider value={{ lang, setLang, toggle, t }}>
            {children}
        </LangCtx.Provider>
    );
}

export const useLang = () => useContext(LangCtx);

/**
 * Pick the localized field of an item.
 * Falls back to the TR field when the EN one is missing.
 */
export function pickLocalized(item, field, lang) {
    if (!item) return "";
    if (lang === "en") {
        const en = item[`${field}_en`];
        if (en && String(en).trim()) return en;
    }
    return item[field] || "";
}

export function pickCategoryName(cat, lang) {
    if (!cat) return "";
    if (lang === "en" && cat.name_en) return cat.name_en;
    return cat.name;
}
