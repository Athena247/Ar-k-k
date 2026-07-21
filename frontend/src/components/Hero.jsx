import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MaskedLine } from "./Reveal";
import { ArrowDown } from "lucide-react";
import { useLang } from "@/context/LangContext";
import LangToggle from "./LangToggle";

const DEFAULT_IMG =
    "https://images.pexels.com/photos/5779787/pexels-photo-5779787.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=1200&w=1600";

export default function Hero({ onExplore }) {
    const { t, lang } = useLang();

    const [time, setTime] = useState("");
    const [todaySpecial, setTodaySpecial] = useState(null);

    // Saat güncellemesi
    useEffect(() => {
        const update = () => {
            const d = new Date();
            setTime(
                d.toLocaleTimeString(lang === "en" ? "en-GB" : "tr-TR", {
                    timeZone: "Europe/Istanbul",
                    hour: "2-digit",
                    minute: "2-digit",
                })
            );
        };
        update();
        const iv = setInterval(update, 60000);
        return () => clearInterval(iv);
    }, [lang]);

    // Günün şef seçimini API'den çekme
    useEffect(() => {
        const fetchSpecial = async () => {
            try {
                const res = await fetch("/api/menu/items");
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0) {
                    // Kesinlikle today_special true olanı öne al, yoksa ilk ürünü seç
                    const special =
                        data.find((item) => item.today_special === true) ||
                        data.find((item) => item.chef_choice === true) ||
                        data[0];
                    setTodaySpecial(special);
                }
            } catch (err) {
                console.error("Error fetching special item:", err);
            }
        };
        fetchSpecial();
    }, []);

    const getItemName = (item) => {
        if (!item) return "Adana Kebap";
        if (lang === "en" && item.name_en) return item.name_en;
        if (lang === "ar" && item.name_ar) return item.name_ar;
        return item.name;
    };

    const getItemDesc = (item) => {
        if (!item) return "Kömür ateşinde özenle pişirilir.";
        if (lang === "en" && item.description_en) return item.description_en;
        if (lang === "ar" && item.description_ar) return item.description_ar;
        return item.description;
    };

    return (
        <section
            data-testid="hero-section"
            className="relative w-full overflow-hidden bg-bone"
        >
            {/* Top meta bar */}
            <div className="relative z-20 flex items-center justify-between px-6 md:px-12 lg:px-16 pt-6 md:pt-8 gap-4">
                <div className="flex items-center gap-3">
                    <span className="dot" aria-hidden />
                    <span className="eyebrow" data-testid="hero-open-badge">
                        {t.open} · {time}
                    </span>
                </div>
                <div className="hidden md:flex items-center gap-8 eyebrow">
                    <span>{t.est}</span>
                    <span>{t.woodFire}</span>
                    <span>{t.tel}</span>
                </div>
                <div className="flex items-center gap-3">
                    <LangToggle />
                    <a
                        href="/admin/login"
                        data-testid="hero-admin-link"
                        className="eyebrow underline underline-offset-4 hover:text-ember transition-colors hidden sm:inline"
                    >
                        {t.admin}
                    </a>
                </div>
            </div>

            {/* Hero content */}
            <div className="relative z-10 px-6 md:px-12 lg:px-16 pt-16 md:pt-24 pb-8 md:pb-14 grid grid-cols-12 gap-6 md:gap-10">
                <div className="col-span-12 md:col-span-3 flex md:flex-col justify-between md:justify-start md:pt-8 gap-4">
                    <div>
                        <p className="eyebrow">{t.chapter00}</p>
                        <p className="mt-3 text-sm text-ink-2 max-w-[220px] leading-relaxed">
                            {t.heroSub}
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <p className="eyebrow">{t.concept}</p>
                        <p className="font-serif italic text-2xl mt-1">
                            {t.pideKebapLahmacun}
                        </p>
                    </div>
                </div>

                <div className="col-span-12 md:col-span-9">
                    <h1
                        data-testid="hero-title"
                        className="font-serif leading-[0.85] text-ink tracking-[-0.03em]"
                        style={{ fontWeight: 500 }}
                    >
                        <div className="block text-[19vw] md:text-[15vw] lg:text-[13.5vw]">
                            <MaskedLine delay={0.05}>Arı</MaskedLine>{" "}
                            <MaskedLine
                                delay={0.15}
                                className="text-ember italic"
                            >
                                Köşk
                            </MaskedLine>
                        </div>
                        <div className="block text-[7vw] md:text-[3.5vw] lg:text-[3vw] mt-2 md:mt-4 text-ink-2">
                            <MaskedLine delay={0.35}>
                                {t.pideKebapLahmacun}
                            </MaskedLine>
                        </div>
                    </h1>
                </div>
            </div>

            {/* Sabit görsel ve dinamik ürün bilgileri */}
            <div className="relative z-10 px-6 md:px-12 lg:px-16 pb-14 md:pb-20 grid grid-cols-12 gap-6 md:gap-10 items-end">
                <div className="col-span-12 md:col-span-8 relative">
                    <motion.div
                        initial={{ opacity: 0, y: 40 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.65,
                            duration: 1.1,
                            ease: [0.22, 1, 0.36, 1],
                        }}
                        className="frame aspect-[16/10] md:aspect-[16/9] rounded-none overflow-hidden bg-bone-2"
                        style={{ borderTop: "1px solid var(--line)" }}
                    >
                        <img
                            src={todaySpecial?.image || DEFAULT_IMG}
                            alt={getItemName(todaySpecial)}
                            className="w-full h-full object-cover"
                            loading="eager"
                        />
                        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/70 via-black/30 to-transparent text-bone">
                            <p className="eyebrow text-bone/80 tracking-widest text-xs">
                                GÜNÜN ÖZELİ
                            </p>
                            <p className="font-serif italic text-2xl md:text-4xl mt-1 drop-shadow-md">
                                {getItemName(todaySpecial)}
                            </p>
                        </div>
                    </motion.div>
                </div>

                <div className="col-span-12 md:col-span-4 flex flex-col gap-6 md:gap-8">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.0, duration: 0.9 }}
                        className="border-t border-line pt-5"
                    >
                        <p className="eyebrow mb-2">ŞEFIN ÖNERİSİ</p>
                        <p className="font-serif italic text-2xl md:text-3xl leading-tight text-ink">
                            {getItemName(todaySpecial)}
                        </p>
                        <p className="text-sm text-ink-2 mt-2 leading-relaxed">
                            {getItemDesc(todaySpecial)}
                        </p>
                        <p className="mt-3 font-medium text-ink text-lg">
                            {todaySpecial ? `₺${todaySpecial.price}` : ""}
                        </p>
                    </motion.div>

                    <motion.button
                        onClick={onExplore}
                        data-testid="hero-explore-btn"
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 1.15, duration: 0.7 }}
                        whileHover={{ x: 4 }}
                        className="group inline-flex items-center gap-3 self-start text-ink hover:text-ember transition-colors"
                    >
                        <span className="font-serif italic text-2xl md:text-3xl">
                            {t.exploreMenu}
                        </span>
                        <span className="inline-flex items-center justify-center w-10 h-10 border border-ink rounded-full group-hover:border-ember group-hover:bg-ember group-hover:text-bone transition-colors">
                            <ArrowDown
                                className="w-4 h-4"
                                strokeWidth={1.5}
                            />
                        </span>
                    </motion.button>
                </div>
            </div>

            <div className="hairline" />
        </section>
    );
}
