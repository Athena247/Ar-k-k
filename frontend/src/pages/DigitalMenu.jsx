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

export default function DigitalMenu() {
    useLenis();
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

    // Track active category on scroll
    useEffect(() => {
        if (!categories.length) return;
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
    }, [categories, items]);

    const grouped = useMemo(() => {
        const q = query.trim().toLocaleLowerCase("tr");
        const filtered = q
            ? items.filter(
                  (i) =>
                      i.name.toLocaleLowerCase("tr").includes(q) ||
                      i.description.toLocaleLowerCase("tr").includes(q)
              )
            : items;
        const map = {};
        for (const it of filtered) {
            (map[it.category] = map[it.category] || []).push(it);
        }
        return map;
    }, [items, query]);

    const totalFiltered = Object.values(grouped).reduce(
        (n, arr) => n + arr.length,
        0
    );

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
                <div
                    data-testid="menu-loading"
                    className="px-4 md:px-16 py-32 text-center eyebrow"
                >
                    Menü hazırlanıyor…
                </div>
            ) : query && totalFiltered === 0 ? (
                <div
                    data-testid="empty-state"
                    className="px-4 md:px-16 py-32 text-center"
                >
                    <p className="eyebrow mb-3">Sonuç yok</p>
                    <p className="font-serif italic text-3xl md:text-5xl">
                        &quot;{query}&quot; için bir şey bulamadık.
                    </p>
                </div>
            ) : (
                <div>
                    {categories.map((c, i) =>
                        grouped[c.slug] && grouped[c.slug].length > 0 ? (
                            <MenuSection
                                key={c.slug}
                                category={c}
                                items={grouped[c.slug]}
                                chapter={i + 1}
                            />
                        ) : null
                    )}
                </div>
            )}

            <Manifesto />
            <Footer />

            <QRModal open={qrOpen} onClose={() => setQrOpen(false)} />
        </div>
    );
}
