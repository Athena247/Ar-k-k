import React from "react";
import { Instagram, MapPin, Phone, Clock } from "lucide-react";
import { FadeUp } from "./Reveal";
import { useLang } from "@/context/LangContext";

export default function Footer() {
    const { t } = useLang();
    return (
        <footer
            data-testid="footer"
            className="bg-ink text-bone px-4 md:px-12 lg:px-16 pt-20 md:pt-32 pb-10"
        >
            <FadeUp>
                <div className="grid grid-cols-12 gap-6 md:gap-10 pb-16 md:pb-24 border-b border-bone/15">
                    <div className="col-span-12 md:col-span-7">
                        <p
                            className="eyebrow"
                            style={{ color: "#f7f5f0aa" }}
                        >
                            {t.contactVisit}
                        </p>
                        <h2 className="font-serif text-5xl md:text-8xl leading-[0.85] mt-4 tracking-[-0.02em]">
                            {t.letsMeet}
                            <br />
                            <span className="italic text-ember-2">
                                {t.atTheTable}
                            </span>
                        </h2>
                    </div>
                    <div className="col-span-12 md:col-span-5 flex flex-col gap-6 md:pt-6 text-bone/85">
                        <div className="flex items-start gap-3">
                            <MapPin
                                className="w-5 h-5 mt-0.5 text-ember-2"
                                strokeWidth={1.5}
                            />
                            <a
                                href="https://www.google.com/maps/search/?api=1&query=Konaklar,+%C5%9Eht.+Aste%C4%9Fmen+Orhan+Sancar+Cd.+No%3A30,+61010+Ortahisar%2FTrabzon"
                                target="_blank"
                                rel="noopener noreferrer"
                                data-testid="footer-address"
                                className="leading-relaxed hover:text-ember-2 transition-colors"
                            >
                                Konaklar, Şht. Asteğmen Orhan Sancar Cd. No:30
                                <br />
                                61010 Ortahisar · Trabzon
                            </a>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone
                                className="w-5 h-5 mt-0.5 text-ember-2"
                                strokeWidth={1.5}
                            />
                            <a
                                href="tel:+904623350046"
                                data-testid="footer-phone"
                                className="hover:text-ember-2 transition-colors"
                            >
                                0 (462) 335 00 46
                            </a>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock
                                className="w-5 h-5 mt-0.5 text-ember-2"
                                strokeWidth={1.5}
                            />
                            <div
                                data-testid="footer-hours"
                                className="leading-relaxed w-full"
                            >
                                {t.hours.map((row) => (
                                    <div
                                        key={row.day}
                                        className="flex items-baseline justify-between gap-4 py-0.5"
                                    >
                                        <span>{row.day}</span>
                                        <span className="text-bone/60 tabular-nums">
                                            {row.time}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </FadeUp>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-10">
                <div className="flex items-center gap-6">
                    {/* Instagram Linki */}
                    <a
                        href="https://www.instagram.com/kosk.pide/?hl=tr"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Instagram"
                        data-testid="social-instagram"
                        className="hover:text-ember-2 transition-colors"
                    >
                        <Instagram className="w-5 h-5" strokeWidth={1.5} />
                    </a>

                    {/* Yemeksepeti Linki ve Logosu */}
                    <a
                        href="https://www.yemeksepeti.com/restaurant/s9on/ari-kosk-pide-and-kebap-and-lahmacun"
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label="Yemeksepeti"
                        data-testid="social-yemeksepeti"
                        className="hover:text-ember-2 transition-colors flex items-center"
                        title="Yemeksepeti'nde Sipariş Ver"
                    >
                        <svg
                            className="w-5 h-5 fill-current"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.02-.42 1.95-1.07 2.62z" />
                        </svg>
                    </a>
                </div>

                <p className="eyebrow" style={{ color: "#f7f5f0aa" }}>
                    © {new Date().getFullYear()} Arı Köşk — Pide · Kebap ·
                    Lahmacun[cite: 2]
                </p>

                <a
                    href="/admin/login"
                    data-testid="footer-admin-link"
                    className="eyebrow hover:text-ember-2 transition-colors"
                    style={{ color: "#f7f5f0aa" }}
                >
                    {t.adminPanel}
                </a>
            </div>
        </footer>
    );
}
