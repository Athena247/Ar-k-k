import React from "react";
import { motion } from "framer-motion";

/**
 * MaskedLine – reveals a single line of text by translating it up from
 * behind a hard-edged mask (overflow:hidden container).
 */
export function MaskedLine({
    children,
    delay = 0,
    duration = 1.05,
    className = "",
    as: Tag = "span",
}) {
    return (
        <Tag className={`reveal-mask ${className}`}>
            <motion.span
                style={{ display: "inline-block", willChange: "transform" }}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{
                    delay,
                    duration,
                    ease: [0.22, 1, 0.36, 1],
                }}
            >
                {children}
            </motion.span>
        </Tag>
    );
}

export function FadeUp({
    children,
    delay = 0,
    y = 24,
    duration = 0.9,
    once = true,
    className = "",
}) {
    return (
        <motion.div
            className={className}
            initial={{ opacity: 0, y }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once, margin: "-80px" }}
            transition={{ delay, duration, ease: [0.22, 1, 0.36, 1] }}
        >
            {children}
        </motion.div>
    );
}
