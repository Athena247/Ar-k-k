import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { MaskedLine } from "@/components/Reveal";

function formatApiErrorDetail(detail) {
    if (detail == null) return "Bir hata oluştu.";
    if (typeof detail === "string") return detail;
    if (Array.isArray(detail))
        return detail
            .map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e)))
            .join(" ");
    return String(detail);
}

export default function AdminLogin() {
    const { login } = useAuth();
    const nav = useNavigate();
    const [email, setEmail] = useState("admin@arikosk.com");
    const [password, setPassword] = useState("");
    const [err, setErr] = useState("");
    const [busy, setBusy] = useState(false);

    const submit = async (e) => {
        e.preventDefault();
        setErr("");
        setBusy(true);
        try {
            await login(email, password);
            nav("/admin");
        } catch (e) {
            setErr(formatApiErrorDetail(e.response?.data?.detail) || e.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="min-h-screen bg-bone text-ink grain flex items-center px-6 py-12">
            <div className="max-w-5xl mx-auto w-full grid grid-cols-12 gap-10 items-center">
                <div className="col-span-12 md:col-span-6">
                    <Link
                        to="/"
                        data-testid="back-to-menu"
                        className="eyebrow hover:text-ember"
                    >
                        ← Menüye Dön
                    </Link>
                    <h1 className="font-serif text-6xl md:text-8xl leading-[0.85] mt-6 tracking-[-0.02em]">
                        <MaskedLine>Yönetim</MaskedLine>
                        <br />
                        <MaskedLine delay={0.1} className="italic text-ember">
                            Paneli
                        </MaskedLine>
                    </h1>
                    <p className="mt-6 text-ink-2 max-w-md leading-relaxed">
                        Menü öğelerini ekle, düzenle, kaldır. Değişiklikler
                        anında yayına alınır.
                    </p>
                </div>

                <motion.form
                    onSubmit={submit}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2, duration: 0.7 }}
                    className="col-span-12 md:col-span-6 bg-bone-2/40 border border-line p-8 md:p-10"
                    data-testid="login-form"
                >
                    <label className="block mb-6">
                        <span className="eyebrow">E-posta</span>
                        <input
                            data-testid="login-email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-line focus:border-ember outline-none py-2 mt-1 text-lg"
                        />
                    </label>
                    <label className="block mb-6">
                        <span className="eyebrow">Şifre</span>
                        <input
                            data-testid="login-password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full bg-transparent border-0 border-b border-line focus:border-ember outline-none py-2 mt-1 text-lg"
                        />
                    </label>
                    {err && (
                        <p
                            data-testid="login-error"
                            className="text-sm text-ember mb-4"
                        >
                            {err}
                        </p>
                    )}
                    <button
                        data-testid="login-submit"
                        type="submit"
                        disabled={busy}
                        className="w-full bg-ink text-bone py-4 hover:bg-ember transition-colors disabled:opacity-50 font-medium tracking-wide"
                    >
                        {busy ? "Giriş yapılıyor…" : "Giriş Yap"}
                    </button>
                </motion.form>
            </div>
        </div>
    );
}
