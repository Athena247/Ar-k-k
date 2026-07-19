import React from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FadeUp } from "./Reveal";

const MANIFESTO_IMG =
    "https://images.pexels.com/photos/37532766/pexels-photo-37532766.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940";

const CHAPTERS = [
    {
        num: "01",
        title: "Ateş",
        body: "Her sabah kütükler kesilir, kömür usulca hazırlanır. Kebap ancak doğru ateşle olur; sabır bir malzemedir.",
    },
    {
        num: "02",
        title: "Zırh",
        body: "Kıyma makinede değil, iki demir zırhla elle hazırlanır. Doku, ısı ve tuz — Adana&apos;nın hafızasıdır.",
    },
    {
        num: "03",
        title: "Fırın",
        body: "Pide hamuru üç kez dinlenir, 380°C&apos;de otuz saniye pişer. İnce, çıtır, tarif kağıda değil ele yazılır.",
    },
];

export default function Manifesto() {
    const ref = React.useRef(null);
    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });
    const y = useTransform(scrollYProgress, [0, 1], [-60, 60]);

    return (
        <section
            ref={ref}
            data-testid="manifesto-section"
            className="relative px-4 md:px-12 lg:px-16 py-20 md:py-32 bg-bone-2/40 border-y border-line overflow-hidden"
        >
            <div className="grid grid-cols-12 gap-6 md:gap-10">
                <div className="col-span-12 md:col-span-5 md:sticky md:top-32 self-start">
                    <FadeUp>
                        <p className="eyebrow mb-6">Manifesto — 1998</p>
                        <h2 className="font-serif text-5xl md:text-7xl leading-[0.9] tracking-[-0.02em]">
                            Üç
                            <span className="italic text-ember"> ilkeyle</span>
                            <br /> pişiriyoruz.
                        </h2>
                        <div className="mt-8 frame aspect-[4/5] max-w-md">
                            <motion.img
                                src={MANIFESTO_IMG}
                                alt="Odun ateşinde ustalık"
                                style={{ y }}
                                className="w-full h-full object-cover"
                                loading="lazy"
                            />
                        </div>
                    </FadeUp>
                </div>

                <div className="col-span-12 md:col-span-7 md:pl-8 flex flex-col gap-16 md:gap-24 md:pt-8">
                    {CHAPTERS.map((c, i) => (
                        <FadeUp key={c.num} delay={i * 0.08}>
                            <div className="grid grid-cols-12 gap-4">
                                <div className="col-span-2">
                                    <span className="chapter-num text-6xl md:text-8xl">
                                        {c.num}
                                    </span>
                                </div>
                                <div className="col-span-10">
                                    <h3 className="font-serif italic text-4xl md:text-6xl mb-4 tracking-[-0.02em]">
                                        {c.title}
                                    </h3>
                                    <p
                                        className="text-base md:text-lg text-ink-2 leading-relaxed max-w-lg"
                                        dangerouslySetInnerHTML={{
                                            __html: c.body,
                                        }}
                                    />
                                </div>
                            </div>
                        </FadeUp>
                    ))}
                </div>
            </div>
        </section>
    );
}
