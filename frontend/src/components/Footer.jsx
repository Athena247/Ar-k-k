import React from "react";
import { Instagram, Facebook, MapPin, Phone, Clock } from "lucide-react";
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
                            <p className="leading-relaxed">
                                Kadıköy Mah. Söğütlüçeşme Cad. No: 42/A
                                <br />
                                Kadıköy · İstanbul
                            </p>
                        </div>
                        <div className="flex items-start gap-3">
                            <Phone
                                className="w-5 h-5 mt-0.5 text-ember-2"
                                strokeWidth={1.5}
                            />
                            <a
                                href="tel:+902120000000"
                                data-testid="footer-phone"
                                className="hover:text-ember-2 transition-colors"
                            >
                                +90 212 000 00 00
                            </a>
                        </div>
                        <div className="flex items-start gap-3">
                            <Clock
                                className="w-5 h-5 mt-0.5 text-ember-2"
                                strokeWidth={1.5}
                            />
                            <p className="leading-relaxed">
                                {t.everyDay}
                                <br />
                                {t.weekend}
                            </p>
                        </div>
                    </div>
                </div>
            </FadeUp>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mt-10">
                <div className="flex items-center gap-6">
                    <a
                        href="#"
                        aria-label="Instagram"
                        data-testid="social-instagram"
                        className="hover:text-ember-2 transition-colors"
                    >
                        <Instagram className="w-5 h-5" strokeWidth={1.5} />
                    </a>
                    <a
                        href="#"
                        aria-label="Facebook"
                        data-testid="social-facebook"
                        className="hover:text-ember-2 transition-colors"
                    >
                        <Facebook className="w-5 h-5" strokeWidth={1.5} />
                    </a>
                </div>

                <p className="eyebrow" style={{ color: "#f7f5f0aa" }}>
                    © {new Date().getFullYear()} Arı Köşk — Pide · Kebap ·
                    Lahmacun
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
