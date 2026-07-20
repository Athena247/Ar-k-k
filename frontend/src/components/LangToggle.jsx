import React from "react";
import { motion } from "framer-motion";
import { useLang } from "@/context/LangContext";

export default function LangToggle({ compact = false, className = "" }) {
    const { lang, setLang } = useLang();

    const opt = (v, label) => {
        const active = lang === v;
        return (
            <button
                key={v}
                type="button"
                data-testid={`lang-${v}`}
                aria-pressed={active}
                onClick={() => setLang(v)}
                className={`relative px-2.5 py-1 text-[11px] tracking-[0.22em] uppercase font-medium transition-colors ${
                    active ? "text-bone" : "text-ink-2 hover:text-ink"
                }`}
            >
                {active && (
                    <motion.span
                        layoutId={compact ? "lang-pill-c" : "lang-pill"}
                        transition={{
                            type: "spring",
                            stiffness: 380,
                            damping: 32,
                        }}
                        className="absolute inset-0 bg-ink rounded-full"
                    />
                )}
                <span className="relative">{label}</span>
            </button>
        );
    };

    return (
        <div
            data-testid="lang-toggle"
            className={`inline-flex items-center gap-0.5 border border-line rounded-full p-0.5 bg-bone/60 backdrop-blur-sm ${className}`}
        >
            {opt("tr", "TR")}
            {opt("en", "EN")}
            {opt("ar", "AR")}
        </div>
    );
}
