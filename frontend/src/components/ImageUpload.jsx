import React, { useRef, useState } from "react";
import { UploadCloud, Loader2, X } from "lucide-react";
import client from "@/lib/api";
import { toast } from "sonner";

const MAX_MB = 8;
const ACCEPT = "image/jpeg,image/png,image/webp,image/avif";

export default function ImageUpload({ value, onChange }) {
    const inputRef = useRef(null);
    const [busy, setBusy] = useState(false);
    const [progress, setProgress] = useState(0);

    const pick = () => inputRef.current?.click();

    const onFile = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;
        e.target.value = "";
        if (!ACCEPT.split(",").includes(file.type)) {
            toast.error("Yalnızca JPG / PNG / WebP / AVIF");
            return;
        }
        if (file.size > MAX_MB * 1024 * 1024) {
            toast.error(`Dosya en fazla ${MAX_MB} MB olabilir`);
            return;
        }
        setBusy(true);
        setProgress(0);
        try {
            // 1) Get signature from backend
            const { data: sig } = await client.get(
                "/admin/cloudinary/signature",
                { params: { folder: "arikosk/menu" } }
            );

            // 2) Direct upload to Cloudinary
            const form = new FormData();
            form.append("file", file);
            form.append("api_key", sig.api_key);
            form.append("timestamp", sig.timestamp);
            form.append("signature", sig.signature);
            form.append("folder", sig.folder);

            const xhr = new XMLHttpRequest();
            const url = `https://api.cloudinary.com/v1_1/${sig.cloud_name}/image/upload`;
            const secureUrl = await new Promise((resolve, reject) => {
                xhr.open("POST", url);
                xhr.upload.onprogress = (ev) => {
                    if (ev.lengthComputable) {
                        setProgress(Math.round((ev.loaded / ev.total) * 100));
                    }
                };
                xhr.onload = () => {
                    try {
                        const res = JSON.parse(xhr.responseText);
                        if (xhr.status >= 200 && xhr.status < 300 && res.secure_url) {
                            resolve(res.secure_url);
                        } else {
                            reject(new Error(res?.error?.message || "Yükleme başarısız"));
                        }
                    } catch (err) {
                        reject(err);
                    }
                };
                xhr.onerror = () => reject(new Error("Ağ hatası"));
                xhr.send(form);
            });

            onChange(secureUrl);
            toast.success("Görsel yüklendi");
        } catch (err) {
            toast.error(err.message || "Yükleme başarısız");
        } finally {
            setBusy(false);
            setProgress(0);
        }
    };

    return (
        <div data-testid="image-upload" className="space-y-3">
            <div className="flex items-start gap-4">
                <div className="frame w-28 h-28 border border-line shrink-0">
                    {value ? (
                        <img
                            src={value}
                            alt=""
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-ink-2 text-xs">
                            —
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <button
                        type="button"
                        data-testid="image-upload-btn"
                        onClick={pick}
                        disabled={busy}
                        className="inline-flex items-center gap-2 px-4 py-2 border border-ink hover:bg-ink hover:text-bone transition-colors disabled:opacity-50 text-sm"
                    >
                        {busy ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Yükleniyor… {progress}%
                            </>
                        ) : (
                            <>
                                <UploadCloud className="w-4 h-4" />
                                {value ? "Görseli Değiştir" : "Görsel Yükle"}
                            </>
                        )}
                    </button>
                    {value && !busy && (
                        <button
                            type="button"
                            data-testid="image-clear-btn"
                            onClick={() => onChange("")}
                            className="ml-2 inline-flex items-center gap-1 px-3 py-2 border border-line hover:bg-bone-2 text-sm"
                            aria-label="Görseli kaldır"
                        >
                            <X className="w-3.5 h-3.5" />
                            Kaldır
                        </button>
                    )}
                    <p className="text-xs text-ink-2 mt-2 leading-relaxed">
                        JPG / PNG / WebP · en fazla {MAX_MB} MB. Cloudinary
                        CDN&apos;e otomatik yüklenir & optimize edilir.
                    </p>
                    {value && (
                        <p
                            data-testid="image-url"
                            className="text-[11px] text-ink-2/70 mt-1 truncate"
                            title={value}
                        >
                            {value}
                        </p>
                    )}
                </div>
            </div>

            <input
                ref={inputRef}
                type="file"
                accept={ACCEPT}
                onChange={onFile}
                className="hidden"
                data-testid="image-file-input"
            />
        </div>
    );
}
