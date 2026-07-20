import React from "react";
import MenuCard from "./MenuCard";
import { FadeUp } from "./Reveal";
import { useLang, pickCategoryName } from "@/context/LangContext";

const HERO_IMAGES = {
    corbalar:
        "https://images.unsplash.com/photo-1761830476467-0ff86dbcc75d?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAzNzl8MHwxfHNlYXJjaHw0fHxzb3VwJTIwYm93bCUyMHJlc3RhdXJhbnR8ZW58MHx8fHwxNzg0NDc0MjMxfDA&ixlib=rb-4.1.0&q=85",
    pideler:
        "https://images.unsplash.com/photo-1772758632889-b3518f24a4a7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTF8MHwxfHNlYXJjaHw0fHx0dXJraXNoJTIwZmxhdGJyZWFkJTIwcGlkZXxlbnwwfHx8fDE3ODQ0NzQyMzF8MA&ixlib=rb-4.1.0&q=85",
    kebaplar:
        "https://images.pexels.com/photos/17794709/pexels-photo-17794709.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    lahmacunlar:
        "https://images.pexels.com/photos/7545571/pexels-photo-7545571.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    tatlilar:
        "https://images.pexels.com/photos/35712797/pexels-photo-35712797.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    icecekler:
        "https://images.pexels.com/photos/28617425/pexels-photo-28617425.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
};

export default function MenuSection({ category, items, chapter }) {
    const { t, lang } = useLang();
    if (!items || items.length === 0) return null;

    const KICKERS = {
        corbalar: t.soup,
        pideler: t.pideKick,
        kebaplar: t.kebapKick,
        lahmacunlar: t.lahKick,
        tatlilar: t.tatKick,
        icecekler: t.icKick,
    };

    return (
        <section
            id={`cat-${category.slug}`}
            data-testid={`section-${category.slug}`}
            className="px-4 md:px-12 lg:px-16 py-16 md:py-24 scroll-mt-24"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
        >
            <FadeUp>
                <div className="grid grid-cols-12 gap-4 md:gap-6 items-end mb-8 md:mb-12">
                    <div className="col-span-2 md:col-span-1">
                        <span className="chapter-num text-5xl md:text-7xl">
                            {String(chapter).padStart(2, "0")}
                        </span>
                    </div>
                    <div className="col-span-10 md:col-span-7">
                        <p className="eyebrow mb-2">
                            {KICKERS[category.slug] || ""}
                        </p>
                        <h2 className="font-serif text-5xl md:text-7xl leading-[0.9] tracking-[-0.02em]">
                            {pickCategoryName(category, lang)}
                        </h2>
                    </div>
                    <div className="col-span-12 md:col-span-4 hidden md:block">
                        <div className="frame aspect-[4/3]">
                            <img
                                src={HERO_IMAGES[category.slug]}
                                alt={pickCategoryName(category, lang)}
                                loading="lazy"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>
                </div>
            </FadeUp>

            <div>
                {items.map((item, i) => (
                    <MenuCard key={item.id} item={item} index={i} />
                ))}
                <div className="border-t border-line" />
            </div>
        </section>
    );
}
