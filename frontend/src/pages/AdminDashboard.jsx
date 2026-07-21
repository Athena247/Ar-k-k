import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { adminApi, publicApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Pencil, Trash2, Plus, LogOut, X, Star, Flame, Search, Settings, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast, Toaster } from "sonner";
import ImageUpload from "@/components/ImageUpload";

const EMPTY = {
    name: "",
    name_en: "",
    name_ar: "",
    description: "",
    description_en: "",
    description_ar: "",
    price: 0,
    image: "",
    category: "kebaplar",
    popular: false,
    chef_choice: false,
    today_special: false,
    order: 1,
    active: true,
};

export default function AdminDashboard() {
    const { user, logout, loading } = useAuth();
    const nav = useNavigate();
    const [items, setItems] = useState([]);
    const [cats, setCats] = useState([]);
    const [editing, setEditing] = useState(null);
    const [formLang, setFormLang] = useState("tr");
    const [busy, setBusy] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    // Site Settings State
    const [showSettings, setShowSettings] = useState(false);
    const [siteSettings, setSiteSettings] = useState({
        hero_image: "",
        hero_title: "Arı Köşk",
        hero_subtitle: ""
    });

    const handleAddCategory = async () => {
        const name = prompt("Yeni kategori adı (Örn: Tatlılar):");
        if (!name) return;
        const slug = name.toLowerCase().replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c").replace(/[^a-z0-9]/g, "-");
        
        try {
            await adminApi.createCategory({ name, slug });
            toast.success("Kategori eklendi");
            await refresh();
        } catch (e) {
            toast.error("Kategori eklenemedi");
        }
    };

    const handleRemoveCategory = async (slug) => {
        if (!window.confirm("Bu kategoriyi silmek istediğinize emin misiniz?")) return;
        try {
            await adminApi.removeCategory(slug);
            toast.success("Kategori silindi");
            await refresh();
        } catch (e) {
            toast.error("Kategori silinemedi");
        }
    };

    useEffect(() => {
        if (!loading && !user) nav("/admin/login");
    }, [loading, user, nav]);

    const refresh = async () => {
        const [its, cs] = await Promise.all([
            adminApi.list(),
            publicApi.listCategories(),
        ]);
        setItems(its);
        setCats(cs);
        
        // Site ayarlarını çek
        try {
            const res = await fetch("https://ar-k-k.onrender.com/api/settings");
            const data = await res.json();
            if (data) {
                setSiteSettings(data);
            }
        } catch (err) {
            console.error("Settings fetch error:", err);
        }
    };

    useEffect(() => {
        if (user) refresh().catch((e) => console.error(e));
    }, [user]);

    const save = async () => {
        setBusy(true);
        try {
            const payload = {
                ...editing,
                price: Number(editing.price),
                order: Number(editing.order || 0),
            };
            if (editing.id) {
                await adminApi.update(editing.id, payload);
                toast.success("Menü öğesi güncellendi");
            } else {
                await adminApi.create(payload);
                toast.success("Menü öğesi eklendi");
            }
            setEditing(null);
            await refresh();
        } catch (e) {
            toast.error(e.response?.data?.detail || "Kayıt başarısız");
        } finally {
            setBusy(false);
        }
    };

    const saveSettings = async () => {
        setBusy(true);
        try {
            const token = localStorage.getItem("admin_token") || ""; 
            // Cookie authentication yapıyorsak ekstra header gerekmeyebilir ama emin olmak için:
            const res = await fetch("https://ar-k-k.onrender.com/api/admin/settings", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    // Authorization eklenebilir eğer JWT localStorage'da tutuluyorsa
                },
                body: JSON.stringify(siteSettings)
            });
            if (res.ok) {
                toast.success("Site ayarları başarıyla güncellendi");
                setShowSettings(false);
                await refresh();
            } else {
                toast.error("Ayarlar kaydedilirken hata oluştu");
            }
        } catch (e) {
            toast.error("Ayarlar kaydedilemedi");
        } finally {
            setBusy(false);
        }
    };

    const remove = async (id) => {
        if (!window.confirm("Bu menü öğesini silmek istediğinize emin misiniz?"))
            return;
        try {
            await adminApi.remove(id);
            toast.success("Silindi");
            await refresh();
        } catch (e) {
            toast.error("Silme başarısız");
        }
    };

    if (loading || !user) return null;

    const filteredItems = items.filter((it) =>
        it.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (it.description && it.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
        it.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const grouped = cats.map((c) => ({
        ...c,
        items: filteredItems
            .filter((i) => i.category === c.slug)
            .sort((a, b) => (a.order || 0) - (b.order || 0)),
    }));

    return (
        <div className="min-h-screen bg-bone text-ink">
            <Toaster position="top-right" richColors />

            <header className="border-b border-line px-4 md:px-12 lg:px-16 py-5 flex items-center justify-between sticky top-0 bg-bone/85 backdrop-blur-md z-30">
                <div className="flex items-center gap-4">
                    <Link
                        to="/"
                        className="font-serif text-xl md:text-2xl tracking-tight"
                    >
                        Arı Köşk
                        <span className="text-ember italic">.</span>
                    </Link>
                    <span className="eyebrow hidden md:inline">Yönetim</span>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSettings(true)}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-line hover:bg-bone-2 transition-colors text-sm"
                    >
                        <Settings className="w-4 h-4" /> Site Ayarları
                    </button>
                    <button
                        data-testid="new-item-btn"
                        onClick={() => {
                            setFormLang("tr");
                            setEditing({ ...EMPTY });
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-ink text-bone hover:bg-ember transition-colors text-sm"
                    >
                        <Plus className="w-4 h-4" /> Yeni Öğe
                    </button>
                    <button
                        data-testid="logout-btn"
                        onClick={async () => {
                            await logout();
                            nav("/admin/login");
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-line hover:bg-bone-2 transition-colors text-sm"
                    >
                        <LogOut className="w-4 h-4" /> Çıkış
                    </button>
                </div>
            </header>

            <main className="px-4 md:px-12 lg:px-16 py-10 md:py-16 space-y-12">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-2" />
                    <input
                        type="text"
                        placeholder="Menüde ürün ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-transparent border border-line focus:border-ember outline-none text-sm text-ink placeholder:text-ink-2"
                    />
                </div>

                {grouped.map((c) => (
                    <section
                        key={c.slug}
                        data-testid={`admin-cat-${c.slug}`}
                    >
                        <div className="flex items-baseline justify-between mb-4">
                            <h2 className="font-serif text-3xl md:text-5xl tracking-[-0.02em]">
                                {c.name}
                            </h2>
                            <span className="eyebrow">
                                {c.items.length} öğe
                            </span>
                        </div>
                        <div className="border-t border-line">
                            {c.items.map((it) => (
                                <div
                                    key={it.id}
                                    data-testid={`admin-item-${it.id}`}
                                    className="grid grid-cols-12 gap-4 py-4 border-b border-line items-center"
                                >
                                    <div className="col-span-2 md:col-span-1">
                                        <div className="frame aspect-square">
                                            <img
                                                src={it.image}
                                                alt=""
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-6 md:col-span-7">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <p className="font-serif text-lg md:text-xl">
                                                {it.name}
                                            </p>
                                            {it.popular && (
                                                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-ink-2">
                                                    <Flame className="w-3 h-3" /> Popüler
                                                </span>
                                            )}
                                            {it.chef_choice && (
                                                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-ember">
                                                    <Star className="w-3 h-3" /> Şef
                                                </span>
                                            )}
                                            {it.today_special && (
                                                <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-ember border border-ember/30 px-1.5 py-0.5">
                                                    Günün Şefi
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-ink-2 mt-1 line-clamp-1">
                                            {it.description}
                                        </p>
                                    </div>
                                    <div className="col-span-2 md:col-span-2 font-serif italic">
                                        ₺{Number(it.price).toLocaleString("tr-TR")}
                                    </div>
                                    <div className="col-span-2 md:col-span-2 flex items-center justify-end gap-2">
                                        <button
                                            data-testid={`edit-${it.id}`}
                                            onClick={() => {
                                                setFormLang("tr");
                                                setEditing({ ...it });
                                            }}
                                            className="w-9 h-9 inline-flex items-center justify-center border border-line hover:bg-ink hover:text-bone transition-colors"
                                        >
                                            <Pencil className="w-4 h-4" strokeWidth={1.5} />
                                        </button>
                                        <button
                                            data-testid={`delete-${it.id}`}
                                            onClick={() => remove(it.id)}
                                            className="w-9 h-9 inline-flex items-center justify-center border border-line hover:bg-ember hover:text-bone hover:border-ember transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" strokeWidth={1.5} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            {c.items.length === 0 && (
                                <p className="py-8 text-center text-ink-2 text-sm">
                                    Aramaya uygun öğe bulunamadı.
                                </p>
                            )}
                        </div>
                    </section>
                ))}
            </main>

            {/* Ayarlar (Site Görseli) Modal Form */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setShowSettings(false)}
                    >
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-xl bg-bone border border-line p-8 md:p-10 relative"
                        >
                            <button
                                onClick={() => setShowSettings(false)}
                                className="absolute top-4 right-4 w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-bone-2"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <p className="eyebrow">Ayarlar</p>
                            <h3 className="font-serif italic text-3xl md:text-4xl mt-2 mb-8 leading-tight">
                                Dükkan Görseli
                            </h3>

                            <div className="space-y-6">
                                <label className="block">
                                    <span className="eyebrow block mb-2">Görselin Açıklaması (Başlık)</span>
                                    <input
                                        value={siteSettings.hero_subtitle}
                                        onChange={(e) => setSiteSettings({ ...siteSettings, hero_subtitle: e.target.value })}
                                        placeholder="Örn: Dükkanımızdan Kareler veya Hoş Geldiniz"
                                        className="w-full bg-transparent border-0 border-b border-line focus:border-ember outline-none py-2 mt-1 text-lg"
                                    />
                                </label>
                                
                                <div className="block">
                                    <span className="eyebrow block mb-2 flex items-center gap-2"><ImageIcon className="w-4 h-4"/> Mekan Resmi Yükle</span>
                                    <ImageUpload
                                        value={siteSettings.hero_image}
                                        onChange={(url) => setSiteSettings({ ...siteSettings, hero_image: url })}
                                    />
                                    {siteSettings.hero_image && (
                                        <div className="mt-4 aspect-video rounded overflow-hidden border border-line">
                                            <img src={siteSettings.hero_image} alt="Dükkan" className="w-full h-full object-cover"/>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="flex items-center gap-3 mt-8">
                                <button
                                    onClick={saveSettings}
                                    disabled={busy}
                                    className="px-6 py-3 bg-ink text-bone hover:bg-ember transition-colors disabled:opacity-50"
                                >
                                    {busy ? "Kaydediliyor…" : "Değişiklikleri Kaydet"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Menü Öğesi Düzenleme Modal Form */}
            <AnimatePresence>
                {editing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] bg-ink/40 backdrop-blur-md flex items-center justify-center p-4"
                        onClick={() => setEditing(null)}
                    >
                        <motion.div
                            initial={{ y: 30, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 20, opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="w-full max-w-2xl bg-bone border border-line p-8 md:p-10 relative max-h-[92vh] overflow-y-auto"
                        >
                            <button
                                onClick={() => setEditing(null)}
                                className="absolute top-4 right-4 w-9 h-9 inline-flex items-center justify-center rounded-full hover:bg-bone-2"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <p className="eyebrow">{editing.id ? "Düzenle" : "Yeni Öğe"}</p>
                            <h3 className="font-serif italic text-3xl md:text-4xl mt-2 mb-8 leading-tight">
                                Menü kartı
                            </h3>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="col-span-2">
                                    <div className="inline-flex items-center gap-1 border border-line rounded-full p-1 mb-1">
                                        {["tr", "en", "ar"].map((lg) => (
                                            <button
                                                key={lg}
                                                type="button"
                                                onClick={() => setFormLang(lg)}
                                                className={`relative px-3 py-1 text-[11px] tracking-[0.22em] uppercase font-medium transition-colors ${
                                                    formLang === lg ? "text-bone" : "text-ink-2 hover:text-ink"
                                                }`}
                                            >
                                                {formLang === lg && (
                                                    <motion.span
                                                        layoutId="form-lang-pill"
                                                        className="absolute inset-0 bg-ink rounded-full"
                                                    />
                                                )}
                                                <span className="relative">
                                                    {lg === "tr" ? "Türkçe" : lg === "en" ? "English" : "عربي"}
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {formLang === "tr" ? (
                                    <>
                                        <label className="col-span-2 block">
                                            <span className="eyebrow">Yemek Adı (TR)</span>
                                            <input
                                                value={editing.name}
                                                onChange={(e) => setEditing({ ...editing, name: e.target.value })}
                                                className="w-full bg-transparent border-0 border-b border-line focus:border-ember outline-none py-2 mt-1 text-lg"
                                            />
                                        </label>
                                        <label className="col-span-2 block">
                                            <span className="eyebrow">Açıklama (TR)</span>
                                            <textarea
                                                rows={2}
                                                value={editing.description}
                                                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                                                className="w-full bg-transparent border-0 border-b border-line focus:border-ember outline-none py-2 mt-1"
                                            />
                                        </label>
                                    </>
                                ) : formLang === "en" ? (
                                    <>
                                        <label className="col-span-2 block">
                                            <span className="eyebrow">Dish Name (EN)</span>
                                            <input
                                                value={editing.name_en || ""}
                                                onChange={(e) => setEditing({ ...editing, name_en: e.target.value })}
                                                className="w-full bg-transparent border-0 border-b border-line focus:border-ember outline-none py-2 mt-1 text-lg"
                                            />
                                        </label>
                                        <label className="col-span-2 block">
                                            <span className="eyebrow">Description (EN)</span>
                                            <textarea
                                                rows={2}
                                                value={editing.description_en || ""}
                                                onChange={(e) => setEditing({ ...editing, description_en: e.target.value })}
                                                className="w-full bg-transparent border-0 border-b border-line focus:border-ember outline-none py-2 mt-1"
                                            />
                                        </label>
                                    </>
                                ) : (
                                    <>
                                        <label className="col-span-2 block" dir="rtl">
                                            <span className="eyebrow">اسم الوجبة (AR)</span>
                                            <input
                                                value={editing.name_ar || ""}
                                                onChange={(e) => setEditing({ ...editing, name_ar: e.target.value })}
                                                className="w-full bg-transparent border-0 border-b border-line focus:border-ember outline-none py-2 mt-1 text-lg text-right"
                                            />
                                        </label>
                                        <label className="col-span-2 block" dir="rtl">
                                            <span className="eyebrow">الوصف (AR)</span>
                                            <textarea
                                                rows={2}
                                                value={editing.description_ar || ""}
                                                onChange={(e) => setEditing({ ...editing, description_ar: e.target.value })}
                                                className="w-full bg-transparent border-0 border-b border-line focus:border-ember outline-none py-2 mt-1 text-right"
                                            />
                                        </label>
                                    </>
                                )}

                                <label className="block">
                                    <span className="eyebrow">Fiyat (₺)</span>
                                    <input
                                        type="number"
                                        value={editing.price}
                                        onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                                        className="w-full bg-transparent border-0 border-b border-line focus:border-ember outline-none py-2 mt-1"
                                    />
                                </label>
                                <label className="block">
                                    <span className="eyebrow">Sıra</span>
                                    <input
                                        type="number"
                                        value={editing.order || 0}
                                        onChange={(e) => setEditing({ ...editing, order: e.target.value })}
                                        className="w-full bg-transparent border-0 border-b border-line focus:border-ember outline-none py-2 mt-1"
                                    />
                                </label>
                                <label className="col-span-2 block">
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="eyebrow">Kategori</span>
                                        <button
                                            type="button"
                                            onClick={handleAddCategory}
                                            className="text-xs text-ember hover:underline flex items-center gap-1"
                                        >
                                            <Plus className="w-3 h-3" /> Yeni Kategori Ekle
                                        </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {cats.map((c) => (
                                            <div key={c.slug} className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => setEditing({ ...editing, category: c.slug })}
                                                    className={`px-3 py-1.5 text-sm rounded-l-full border ${
                                                        editing.category === c.slug ? "bg-ink text-bone border-ink" : "border-line hover:border-ink"
                                                    }`}
                                                >
                                                    {c.name}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveCategory(c.slug)}
                                                    className="px-2 py-1.5 text-xs rounded-r-full border border-l-0 border-line hover:bg-ember hover:text-bone hover:border-ember transition-colors"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </label>
                                
                                <div className="col-span-2 block">
                                    <span className="eyebrow block mb-2">Görsel</span>
                                    <ImageUpload
                                        value={editing.image}
                                        onChange={(url) => setEditing({ ...editing, image: url })}
                                    />
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!editing.popular}
                                        onChange={(e) => setEditing({ ...editing, popular: e.target.value === 'on' || e.target.checked })}
                                        className="w-4 h-4 accent-ember"
                                    />
                                    <span className="text-sm">Popüler</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={!!editing.chef_choice}
                                        onChange={(e) => setEditing({ ...editing, chef_choice: e.target.checked })}
                                        className="w-4 h-4 accent-ember"
                                    />
                                    <span className="text-sm">Şefin Seçimi</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer col-span-2">
                                    <input
                                        type="checkbox"
                                        checked={!!editing.today_special}
                                        onChange={(e) => setEditing({ ...editing, today_special: e.target.checked })}
                                        className="w-4 h-4 accent-ember"
                                    />
                                    <span className="text-sm">Günün Şef Seçimi (Ana Banner)</span>
                                </label>
                            </div>

                            <div className="flex items-center gap-3 mt-8">
                                <button
                                    onClick={save}
                                    disabled={busy}
                                    className="px-6 py-3 bg-ink text-bone hover:bg-ember transition-colors disabled:opacity-50"
                                >
                                    {busy ? "Kaydediliyor…" : "Kaydet"}
                                </button>
                                <button
                                    onClick={() => setEditing(null)}
                                    className="px-6 py-3 border border-line hover:bg-bone-2 transition-colors"
                                >
                                    Vazgeç
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
