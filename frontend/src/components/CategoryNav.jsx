import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, X, QrCode } from "lucide-react";
import { scrollToId } from "@/lib/lenis";
import { useLang, pickCategoryName } from "@/context/LangContext";

export default function CategoryNav({
    categories,
    active,
    setActive,
    query,
    setQuery,
    onShareClick,
}) {
    const { t, lang } = useLang();
    const [scrolled, setScrolled] = useState(false);
    const [searchOpen, setSearchOpen] = useState(false);
    const listRef = useRef(null);

    useEffect(() => {
        const handler = () => setScrolled(window.scrollY > 40);
        window.addEventListener("scroll", handler, { passive: true });
        return () => window.removeEventListener("scroll", handler);
    }, []);

    // Center active pill on mobile
    useEffect(() => {
        if (!listRef.current) return;
        const el = listRef.current.querySelector(
            `[data-cat="${active}"]`
        );
        if (el && listRef.current.scrollBy) {
            const r = el.getBoundingClientRect();
            const pr = listRef.current.getBoundingClientRect();
            const delta = r.left - pr.left - pr.width / 2 + r.width / 2;
            listRef.current.scrollBy({ left: delta, behavior: "smooth" });
        }
    }, [active]);

    const onPick = (slug) => {
        setActive(slug);
        scrollToId(`cat-${slug}`);
    };

    return (
        <div
            data-testid="category-nav"
            className={`sticky top-0 z-40 transition-colors ${
                scrolled
                    ? "bg-bone/95 backdrop-blur-xl border-b border-line shadow-[0_1px_0_rgba(0,0,0,0.02)]"
                    : "bg-bone/0 border-b border-transparent"
            }`}
        >
            <div className="px-4 md:px-12 lg:px-16">
                <div className="flex items-center gap-3 md:gap-6 py-3 md:py-4">
                    {/* Wordmark small */}
                    <a
                        href="#top"
                        className="shrink-0 font-serif text-lg md:text-xl tracking-tight hidden md:inline"
                    >
                        Arı Köşk
                        <span className="text-ember italic">.</span>
                    </a>

                    <span className="hidden md:inline text-line">|</span>

                    {/* Scrollable pills */}
                    <div
                        ref={listRef}
                        className="flex-1 overflow-x-auto no-scrollbar"
                    >
                        <ul className="flex items-center gap-2 md:gap-1">
                            {categories.map((c) => {
                                const isActive = c.slug === active;
                                return (
                                    <li key={c.slug} className="shrink-0">
                                        <button
                                            data-cat={c.slug}
                                            data-testid={`category-tab-${c.slug}`}
                                            onClick={() => onPick(c.slug)}
                                            className={`relative px-3.5 md:px-4 py-2 text-sm rounded-full transition-colors ${
                                                isActive
                                                    ? "text-bone"
                                                    : "text-ink-2 hover:text-ink"
                                            }`}
                                        >
                                            {isActive && (
                                                <motion.span
                                                    layoutId="cat-pill"
                                                    transition={{
                                                        type: "spring",
                                                        stiffness: 350,
                                                        damping: 32,
                                                    }}
                                                    className="absolute inset-0 bg-ink rounded-full"
                                                />
                                            )}
                                            <span className="relative">
                                                {pickCategoryName(c, lang)}
                                            </span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                        <button
                            data-testid="search-toggle-btn"
                            onClick={() => setSearchOpen((v) => !v)}
                            aria-label={t.search}
                            className="w-10 h-10 inline-flex items-center justify-center rounded-full hover:bg-bone-2 transition-colors"
                        >
                            {searchOpen ? (
                                <X className="w-4 h-4" strokeWidth={1.5} />
                            ) : (
                                <Search className="w-4 h-4" strokeWidth={1.5} />
                            )}
                        </button>
                        <button
                            data-testid="qr-share-btn"
                            onClick={onShareClick}
                            aria-label="Menüyü Paylaş"
                            className="w-10 h-10 inline-flex items-center justify-center rounded-full hover:bg-bone-2 transition-colors"
                        >
                            <QrCode className="w-4 h-4" strokeWidth={1.5} />
                        </button>
                    </div>
                </div>

                <AnimatePresence>
                    {searchOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="overflow-hidden"
                        >
                            <div className="pb-4 border-t border-line pt-4">
                                <input
                                    autoFocus
                                    data-testid="search-input"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t.searchPh}
                                    className="w-full bg-transparent border-0 border-b border-line focus:border-ember outline-none font-serif italic text-2xl md:text-4xl py-3 placeholder:text-ink-2/40 transition-colors"
                                />
                                <p className="eyebrow mt-2">
                                    {t.search}
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
