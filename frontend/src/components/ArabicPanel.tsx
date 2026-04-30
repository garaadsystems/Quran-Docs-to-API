"use client";

import { AlQuranAyah } from "@/types/quran";

const PER_PAGE = 10;

interface ArabicPanelProps {
    ayahs: AlQuranAyah[];
    activeAyah: number;
    onAyahClick: (n: number) => void;
    isLoading: boolean;
    page: number;
    onPageChange: (p: number) => void;
}

export default function ArabicPanel({
    ayahs,
    activeAyah,
    onAyahClick,
    isLoading,
    page,
    onPageChange,
}: ArabicPanelProps) {
    const totalPages = Math.max(1, Math.ceil(ayahs.length / PER_PAGE));
    const slice = ayahs.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div
            style={{
                background: "#e8f5e9",
                border: "1px solid #b2dfbc",
                borderRadius: 5,
                overflow: "hidden",
            }}
        >
            {/* Text body */}
            <div
                style={{
                    background: "#f1faf2",
                    padding: "28px 36px",
                    minHeight: 140,
                }}
            >
                {isLoading ? (
                    <div dir="rtl" style={{ textAlign: "center", padding: "20px 0" }}>
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="skel" style={{ height: 28, marginBottom: 16, borderRadius: 4 }} />
                        ))}
                    </div>
                ) : (
                    <p className="qfont fin" style={{ fontSize: "clamp(1.35rem, 2.5vw, 1.75rem)" }} dir="rtl">
                        {slice.map((a) => (
                            <span key={a.numberInSurah}>
                                {a.text}
                                {" "}
                                <span
                                    className={`ayah-num${a.numberInSurah === activeAyah ? " sel" : ""}`}
                                    onClick={() => onAyahClick(a.numberInSurah)}
                                    title={`Ayah ${a.numberInSurah}`}
                                >
                                    {a.numberInSurah}
                                </span>
                                {" "}
                            </span>
                        ))}
                    </p>
                )}
            </div>

            {/* Pagination */}
            {!isLoading && totalPages > 1 && (
                <div className="pg-bar" dir="ltr">
                    <button
                        className="pg-btn"
                        id="ar-prev"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page <= 1}
                    >
                        ›
                    </button>
                    <span className="pg-info">الصفحة {page} / {totalPages}</span>
                    <button
                        className="pg-btn"
                        id="ar-next"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page >= totalPages}
                    >
                        ‹
                    </button>
                </div>
            )}
        </div>
    );
}
