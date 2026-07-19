import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check } from "lucide-react";

export default function QRModal({ open, onClose }) {
    const url =
        typeof window !== "undefined" ? window.location.origin + "/" : "";
    const [copied, setCopied] = React.useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
        } catch (e) {}
    };

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="fixed inset-0 z-[200] bg-ink/40 backdrop-blur-md flex items-center justify-center p-6"
                    onClick={onClose}
                    data-testid="qr-modal"
                >
                    <motion.div
                        initial={{ y: 30, opacity: 0, scale: 0.98 }}
                        animate={{ y: 0, opacity: 1, scale: 1 }}
                        exit={{ y: 20, opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full max-w-md bg-bone border border-line p-8 md:p-10 relative"
                    >
                        <button
                            data-testid="qr-modal-close"
                            aria-label="Kapat"
                            onClick={onClose}
                            className="absolute top-4 right-4 w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-bone-2"
                        >
                            <X className="w-4 h-4" strokeWidth={1.5} />
                        </button>

                        <p className="eyebrow">Paylaş — QR</p>
                        <h3 className="font-serif italic text-3xl md:text-4xl mt-2 mb-6 leading-tight">
                            Menü&apos;yü <br />
                            masana getir.
                        </h3>

                        <div className="flex justify-center bg-bone-2/50 border border-line p-6">
                            <QRCodeSVG
                                data-testid="qr-code"
                                value={url}
                                size={196}
                                bgColor="transparent"
                                fgColor="#1A1A1A"
                                level="M"
                            />
                        </div>

                        <p className="text-sm text-ink-2 mt-6 leading-relaxed">
                            Kamerayla okut veya bağlantıyı kopyala. Menü tüm
                            cihazlarda sorunsuz açılır.
                        </p>

                        <button
                            onClick={copy}
                            data-testid="qr-copy-btn"
                            className="mt-4 w-full inline-flex items-center justify-between gap-3 px-4 py-3 border border-ink hover:bg-ink hover:text-bone transition-colors"
                        >
                            <span className="truncate text-sm">{url}</span>
                            {copied ? (
                                <Check className="w-4 h-4 shrink-0" />
                            ) : (
                                <Copy className="w-4 h-4 shrink-0" />
                            )}
                        </button>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
