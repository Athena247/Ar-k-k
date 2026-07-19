import React, { useEffect, useMemo, useState } from "react";
import { publicApi } from "@/lib/api";
import { useLenis, scrollToId } from "@/lib/lenis";
import Hero from "@/components/Hero";
import CategoryNav from "@/components/CategoryNav";
import EditorialMarquee from "@/components/EditorialMarquee";
import MenuSection from "@/components/MenuSection";
import Manifesto from "@/components/Manifesto";
import Footer from "@/components/Footer";
import QRModal from "@/components/QRModal";
import { useLang } from "@/context/LangContext";

export default function DigitalMenu() {
    useLenis();
    const { t, lang } = useLang();
    const [categories, setCategories] = useState([]);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [active, setActive] = useState("");
    const [query, setQuery] = useState("");
    const [qrOpen, setQrOpen] = useState(false);

    useEffect(() => {
        Promise.all([publicApi.listCategories(), publicApi.listItems()])
            .then(([cats, its]) => {
                setCategories(cats);
                setItems(its);
                if (cats?.length) setActive(cats[0].slug);
            })
            .catch((e) => console.error(e))
            .finally(() => setLoading(false));
    }, []);

    // Scroll takibi için useEffect
    useEffect(() => {
        if (!categories || !Array.isArray(categories) || categories.length === 0) return;
        const observer = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (entry.isIntersecting) {
                        const slug = entry.target.id.replace("cat-", "");
                        setActive(slug);
                        break;
                    }
                }
            },
            { rootMargin: "-40% 0px -55% 0px", threshold: 0 }
        );
        categories.forEach((c) => {
            const el = document.getElementById(`cat-${c.slug}`);
            if (el) observer.observe(el);
        });
        return () => observer.disconnect();
    }, [categories]); 

    // useMemo'ları useEffect dışına taşıdık
    const grouped = useMemo(() => {
        const q = query.trim().toLocaleLowerCase("tr");
        const filtered = q
            ? items.filter((i) => {
                  const n = (i.name || "").toLocaleLowerCase("tr");
                  const d = (i.description || "").toLocaleLowerCase("tr");
                  const ne = (i.name_en || "").toLocaleLowerCase("en");
                  const de = (i.description_en || "").toLocaleLowerCase("en");
                  return n.includes(q) || d.includes(q) || ne.includes(q) || de.includes(q);
              })
            : items;
        const map = {};
        for (const it of filtered) {
            (map[it.category] = map[it.category] || []).push(it);
        }
        return map;
    }, [items, query]);

    const totalFiltered = useMemo(() => {
        if (!grouped || typeof grouped !== 'object') return 0;
        return Object.values(grouped).reduce((n, arr) => n + (arr?.length || 0), 0);
    }, [grouped]);

    return (
        <div className="grain min-h-screen bg-bone text-ink" id="top">
            <Hero onExplore={() => scrollToId("cat-corbalar")} />

            <CategoryNav
                categories={categories}
                active={active}
                setActive={setActive}
                query={query}
                setQuery={setQuery}
                onShareClick={() => setQrOpen(true)}
            />

            <EditorialMarquee />

            {loading ? (
                <div data-testid="menu-loading" className="px-4 md:px-16 py-32 text-center eyebrow">
                    {t.loading}
                </div>
            ) : query && totalFiltered === 0 ? (
                <div data-testid="empty-state" className="px-4 md:px-16 py-32 text-center">
                    <p className="eyebrow mb-3">{t.noResults}</p>
                    <p className="font-serif italic text-3xl md:text-5xl">
                        {t.noMatch(query)}
                    </p>
                </div>
            ) : (
                <div>
                    {Array.isArray(categories) && categories.map((c, i) => {
                        const sectionItems = grouped[c.slug];
                        return sectionItems && sectionItems.length > 0 ? (
                            <MenuSection
                                key={c.slug}
                                category={c}
                                items={sectionItems}
                                chapter={i + 1}
                            />
                        ) : null;
                    })}
                </div>
            )}

            <Manifesto />
            <Footer />

            <QRModal open={qrOpen} onClose={() => setQrOpen(false)} />
        </div>
    );
}
