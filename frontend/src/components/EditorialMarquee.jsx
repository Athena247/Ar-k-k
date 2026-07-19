import React from "react";
import Marquee from "react-fast-marquee";

export default function EditorialMarquee() {
    const words = [
        "Pide",
        "·",
        "Kebap",
        "·",
        "Lahmacun",
        "·",
        "Odun Ateşinde Lezzet",
        "·",
    ];
    return (
        <section
            data-testid="marquee-section"
            className="border-y border-line py-8 md:py-14 bg-bone marquee-mask"
            aria-hidden="true"
        >
            <Marquee gradient={false} speed={38} pauseOnHover={false}>
                {[...Array(6)].flatMap((_, i) =>
                    words.map((w, j) => (
                        <span
                            key={`${i}-${j}`}
                            className="font-serif italic text-6xl md:text-8xl lg:text-9xl mx-4 md:mx-8 text-ink/90"
                            style={{
                                WebkitTextStroke:
                                    w === "·" ? "0" : "0.5px transparent",
                            }}
                        >
                            {w === "·" ? (
                                <span className="text-ember not-italic">
                                    ·
                                </span>
                            ) : (
                                w
                            )}
                        </span>
                    ))
                )}
            </Marquee>
        </section>
    );
}
