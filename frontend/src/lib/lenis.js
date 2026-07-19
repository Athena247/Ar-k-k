import { useEffect } from "react";
import Lenis from "lenis";

export function useLenis() {
    useEffect(() => {
        if (
            typeof window !== "undefined" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ) {
            return;
        }
        const lenis = new Lenis({
            duration: 1.15,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smoothWheel: true,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        const id = requestAnimationFrame(raf);

        // Expose scrollTo helper
        window.__lenis = lenis;

        return () => {
            cancelAnimationFrame(id);
            lenis.destroy();
            window.__lenis = null;
        };
    }, []);
}

export function scrollToId(id) {
    const el = document.getElementById(id);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 120;
    if (window.__lenis) {
        window.__lenis.scrollTo(y, { duration: 1.2 });
    } else {
        window.scrollTo({ top: y, behavior: "smooth" });
    }
}
