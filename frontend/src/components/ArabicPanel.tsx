"use client";

import { SomaliAyah } from "@/types/quran";

const PER_PAGE = 10;

interface ArabicPanelProps {
    ayahs: SomaliAyah[];
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
        <div className="bg-[#e8f5e9] border border-[#b2dfbc] rounded-md overflow-hidden">
            {/* Text body */}
            <div className="bg-[#f1faf2] px-9 py-7 min-h-[140px]">
                {isLoading ? (
                    <div dir="rtl" className="text-center py-5">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="skel h-[28px] mb-4 rounded" />
                        ))}
                    </div>
                ) : (
                    <p className="qfont fin text-[clamp(1.35rem,2.5vw,1.75rem)] leading-[2.5]" dir="rtl">
                        {slice.map((a) => (
                            <span
                                key={a.number}
                                className={`ayah-text${a.number === activeAyah ? " active" : ""}`}
                            >
                                <span onClick={() => onAyahClick(a.number)} className="cursor-pointer">
                                    {a.text_ar || "‎"}
                                </span>
                                {" "}
                                <span
                                    className={`ayah-num${a.number === activeAyah ? " sel" : ""}`}
                                    onClick={() => onAyahClick(a.number)}
                                    title={`Ayah ${a.number}`}
                                >
                                    {a.number}
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
