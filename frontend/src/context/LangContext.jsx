import React, { createContext, useContext, useEffect, useState } from "react";

const LangCtx = createContext(null);

const STRINGS = {
    tr: {
        open: "Açık",
        est: "Est. 2000",
        woodFire: "Odun Ateşi",
        tel: "Tel · 0 (462) 335 00 46",
        admin: "Yönetim",
        chapter00: "Bölüm 00 — Menü",
        heroSub:
            "Odun ateşi, taze malzemeler ve geleneksel reçetelerle hazırlanan lezzetler.",
        concept: "Konsept",
        pideKebapLahmacun: "Pide · Kebap · Lahmacun",
        signature: "Şefin Seçimi",
        signatureLine: "Günün Özel Lezzeti",
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
        everyDay: "Her gün · 09:00 — 00:30",
        weekend: "Cumartesi & Pazar · 08:00",
        hours: [
            { day: "Pazartesi", time: "09:00 — 00:30" },
            { day: "Salı", time: "09:00 — 00:30" },
            { day: "Çarşamba", time: "09:00 — 00:30" },
            { day: "Perşembe", time: "09:00 — 00:30" },
            { day: "Cuma", time: "09:00 — 00:30" },
            { day: "Cumartesi", time: "08:00 — 00:30" },
            { day: "Pazar", time: "08:00 — 00:30" },
        ],
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
        manifesto: "Manifesto — 2000",
        threePrinciples: "Üç",
        principlesEmph: " ilkeyle",
        weCook: "pişiriyoruz.",
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
        est: "Est. 2000",
        woodFire: "Wood Fire",
        tel: "Tel · +90 462 335 00 46",
        admin: "Admin",
        chapter00: "Chapter 00 — Menu",
        heroSub:
            "Flavors prepared with wood fire, fresh ingredients, and traditional recipes.",
        concept: "Concept",
        pideKebapLahmacun: "Pide · Kebab · Lahmacun",
        signature: "Chef's Pick",
        signatureLine: "Today's Special Flavor",
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
        everyDay: "Every day · 09:00 — 00:30",
        weekend: "Sat & Sun · 08:00",
        hours: [
            { day: "Monday", time: "09:00 — 00:30" },
            { day: "Tuesday", time: "09:00 — 00:30" },
            { day: "Wednesday", time: "09:00 — 00:30" },
            { day: "Thursday", time: "09:00 — 00:30" },
            { day: "Friday", time: "09:00 — 00:30" },
            { day: "Saturday", time: "08:00 — 00:30" },
            { day: "Sunday", time: "08:00 — 00:30" },
        ],
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
        manifesto: "Manifesto — 2000",
        threePrinciples: "Three",
        principlesEmph: " principles",
        weCook: "we cook by.",
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
    ar: {
        open: "مفتوح",
        est: "تأسس 2000",
        woodFire: "حطب",
        tel: "هاتف · 0 (462) 335 00 46",
        admin: "إدارة",
        chapter00: "الفصل 00 — القائمة",
        heroSub: "نكهات محضرة على النار وبمكونات طازجة ووصفات تقليدية.",
        concept: "المفهوم",
        pideKebapLahmacun: "بيده · كباب · لحم بعجين",
        signature: "اختيار الشيف",
        signatureLine: "نكهة اليوم المميزة",
        todaysChoice: "اختيار الشيف اليوم",
        exploreMenu: "استكشف القائمة",
        popular: "الأكثر طلباً",
        chefsChoice: "اختيار الشيف",
        search: "بحث في القائمة — Enter",
        searchPh: "مثال: أضنة، كنافة، بيده...",
        loading: "جاري تحضير القائمة...",
        noResults: "لا توجد نتائج",
        noMatch: (q) => `لم نجد شيئاً لـ "${q}".`,
        contactVisit: "تواصل — زيارة",
        letsMeet: "لنجتمع",
        atTheTable: "على المائدة.",
        everyDay: "يومياً · 09:00 — 00:30",
        weekend: "السبت والأحد · 08:00",
        hours: [
            { day: "الاثنين", time: "09:00 — 00:30" },
            { day: "الثلاثاء", time: "09:00 — 00:30" },
            { day: "الأربعاء", time: "09:00 — 00:30" },
            { day: "الخميس", time: "09:00 — 00:30" },
            { day: "الجمعة", time: "09:00 — 00:30" },
            { day: "السبت", time: "08:00 — 00:30" },
            { day: "الأحد", time: "08:00 — 00:30" },
        ],
        adminPanel: "لوحة الإدارة →",
        backToMenu: "← العودة للقائمة",
        shareQr: "مشاركة — QR",
        qrHeadline: "أحضر القائمة إلى طاولتك.",
        qrCopy:
            "امسح الكود بالكاميرا أو انسخ الرابط. القائمة تفتح بسلاسة على جميع الأجهزة.",
        soup: "ساخن · طبق البداية",
        pideKick: "فرن حطب · عجين رقيق",
        kebapKick: "نار الفحم · تحضير يدوي",
        lahKick: "عنتاب · أسلوب أضنة",
        tatKick: "بالشيرة · بالحليب",
        icKick: "بارد · منعش",
        manifesto: "المانيفستو — 2000",
        threePrinciples: "ثلاثة",
        principlesEmph: " مبادئ",
        weCook: "نطهو بها.",
        fire: "النار",
        fireBody:
            "كل صباح نعدّ الحطب ونجهز الفحم بهدوء. الكباب الحقيقي يحتاج للنار الصحيحة؛ الصبر هو أحد المكونات.",
        zirh: "الساطور",
        zirhBody:
            "اللحم لا يفرم بالآلة، بل يقطع يدوياً بساطورين من حديد. القوام، الحرارة، والملح — هي ذاكرة أضنة.",
        oven: "الفرن",
        ovenBody:
            "عجينة البيده ترتاح ثلاث مرات، وتُخبز لمدة ثلاثين ثانية في حرارة 380 درجة. رقيقة، مقرمشة — الوصفة تعيش في اليد لا على الورق.",
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

export function pickLocalized(item, field, lang) {
    if (!item) return "";
    
    if (lang === "ar") {
        const ar = item[`${field}_ar`]; 
        if (ar && String(ar).trim()) return ar;
    }

    if (lang === "en") {
        const en = item[`${field}_en`];
        if (en && String(en).trim()) return en;
    }
    
    return item[field] || "";
}

export function pickCategoryName(cat, lang) {
    if (!cat) return "";
    
    if (lang === "ar") {
        if (cat.name_ar) return cat.name_ar;
    }

    if (lang === "en") {
        if (cat.name_en) return cat.name_en;
    }
    
    return cat.name;
}
