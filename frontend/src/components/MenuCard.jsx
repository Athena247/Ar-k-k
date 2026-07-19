import React from "react";
import { motion } from "framer-motion";
import { FadeUp } from "./Reveal";

function Badge({ variant, children, testId }) {
    const base =
        "inline-flex items-center gap-1.5 uppercase tracking-[0.22em] text-[10px] font-medium px-2.5 py-1 rounded-full";
    const styles =
        variant === "chef"
            ? "bg-ember text-bone"
            : "bg-ink text-bone";
    return (
        <span data-testid={testId} className={`${base} ${styles}`}>
            {children}
        </span>
    );
}

function formatPrice(p) {
    return `₺${Number(p).toLocaleString("tr-TR")}`;
}

export default function MenuCard({ item, index = 0 }) {
    return (
        <FadeUp delay={Math.min(index * 0.04, 0.32)} y={30}>
            <article
                data-testid={`menu-item-${item.id}`}
                className="group grid grid-cols-12 gap-4 md:gap-6 py-6 md:py-8 border-t border-line"
            >
                {/* Image */}
                <div className="col-span-4 md:col-span-3">
                    <div className="frame aspect-[4/5] md:aspect-[4/5]">
                        <img
                            src={item.image}
                            alt={item.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Content */}
                <div className="col-span-8 md:col-span-9 flex flex-col justify-between gap-3">
                    <div>
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            {item.chef_choice && (
                                <Badge
                                    variant="chef"
                                    testId={`badge-chef-${item.id}`}
                                >
                                    Şefin Seçimi
                                </Badge>
                            )}
                            {item.popular && (
                                <Badge
                                    variant="popular"
                                    testId={`badge-popular-${item.id}`}
                                >
                                    Popüler
                                </Badge>
                            )}
                        </div>
                        <h3 className="font-serif text-2xl md:text-3xl leading-tight tracking-tight">
                            <span className="bg-[linear-gradient(currentColor,currentColor)] bg-no-repeat bg-[length:0%_1px] bg-[position:0_98%] group-hover:bg-[length:100%_1px] transition-[background-size] duration-700 ease-out">
                                {item.name}
                            </span>
                        </h3>
                        <p className="text-sm md:text-base text-ink-2 mt-2 max-w-xl leading-relaxed">
                            {item.description}
                        </p>
                    </div>

                    <div className="flex items-end justify-between">
                        <motion.span
                            whileHover={{ x: 3 }}
                            className="font-serif italic text-xl md:text-2xl text-ink"
                            data-testid={`price-${item.id}`}
                        >
                            {formatPrice(item.price)}
                        </motion.span>
                        <span className="eyebrow hidden md:inline">
                            №{String(item.order || 0).padStart(2, "0")}
                        </span>
                    </div>
                </div>
            </article>
        </FadeUp>
    );
}
