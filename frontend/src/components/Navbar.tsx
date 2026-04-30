"use client";

import { AlQuranSurah } from "@/types/quran";

interface NavbarProps {
    surahs: AlQuranSurah[];
    selectedSurahNumber: number;
    selectedAyah: number;
    ayahCount: number;
    onSurahChange: (n: number) => void;
    onAyahChange: (n: number) => void;
    isLoading: boolean;
}

export default function Navbar({
    surahs,
    selectedSurahNumber,
    selectedAyah,
    ayahCount,
    onSurahChange,
    onAyahChange,
    isLoading,
}: NavbarProps) {
    const ayahOptions = Array.from({ length: ayahCount }, (_, i) => i + 1);

    return (
        <nav
            dir="rtl"
            style={{
                background: "#fff",
                borderBottom: "2px solid #c0c0c0",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "6px 16px",
                gap: 12,
                position: "sticky",
                top: 0,
                zIndex: 100,
                boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
            }}
        >
            {/* Logo */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                <div
                    style={{
                        width: 32,
                        height: 32,
                        borderRadius: 5,
                        background: "#7b1f32",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        color: "#fff",
                        fontFamily: "'Amiri Quran', serif",
                        fontSize: "1.1rem",
                    }}
                >
                    ق
                </div>
                <div>
                    <div style={{ fontFamily: "Cairo, sans-serif", fontWeight: 700, fontSize: 15, color: "#7b1f32", lineHeight: 1.1 }}>
                        Gaaraad
                    </div>
                    <div style={{ fontFamily: "Cairo, sans-serif", fontSize: 10, color: "#888", lineHeight: 1 }}>
                        تفسير القرآن الكريم
                    </div>
                </div>
            </div>

            {/* Selectors */}
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                {/* Ayah */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <label
                        htmlFor="ayah-sel"
                        style={{ fontFamily: "Cairo, sans-serif", fontSize: 13, color: "#555", whiteSpace: "nowrap" }}
                    >
                        آية:
                    </label>
                    <select
                        id="ayah-sel"
                        className="ksu-sel"
                        style={{ minWidth: 70 }}
                        value={selectedAyah}
                        onChange={(e) => onAyahChange(Number(e.target.value))}
                        disabled={isLoading || ayahCount === 0}
                    >
                        {ayahOptions.map((n) => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>

                {/* Surah */}
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <label
                        htmlFor="surah-sel"
                        style={{ fontFamily: "Cairo, sans-serif", fontSize: 13, color: "#555", whiteSpace: "nowrap" }}
                    >
                        سورة:
                    </label>
                    <select
                        id="surah-sel"
                        className="ksu-sel"
                        style={{ minWidth: 175 }}
                        value={selectedSurahNumber}
                        onChange={(e) => onSurahChange(Number(e.target.value))}
                        disabled={isLoading || surahs.length === 0}
                    >
                        {surahs.length === 0 ? (
                            <option>Waa la raraa…</option>
                        ) : (
                            surahs.map((s) => (
                                <option key={s.number} value={s.number}>
                                    {s.number}. {s.name}
                                </option>
                            ))
                        )}
                    </select>
                </div>
            </div>
        </nav>
    );
}
