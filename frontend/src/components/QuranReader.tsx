"use client";

import ArabicPanel from "@/components/ArabicPanel";
import Navbar from "@/components/Navbar";
import TafseerPanel from "@/components/TafseerPanel";
import { fetchSurahDetail, fetchSurahList } from "@/lib/api";
import { SomaliSurahData, SurahMeta } from "@/types/quran";
import { useCallback, useEffect, useState } from "react";

const AYAHS_PER_AR_PAGE = 10;

export default function QuranReader() {
    const [surahs, setSurahs] = useState<SurahMeta[]>([]);
    const [surahNum, setSurahNum] = useState(1);
    const [surahData, setSurahData] = useState<SomaliSurahData | null>(null);
    const [activeAyah, setActiveAyah] = useState(1);

    const [loadingList, setLoadingList] = useState(true);
    const [loadingDetail, setLoadingDetail] = useState(false);

    const [arPage, setArPage] = useState(1);

    // ── Load surah list ───────────────────────────────────────────────────────
    useEffect(() => {
        fetchSurahList()
            .then(setSurahs)
            .catch(console.error)
            .finally(() => setLoadingList(false));
    }, []);

    // ── Load detail + tafseer on surah change ─────────────────────────────────
    useEffect(() => {
        if (!surahs.length) return;
        setLoadingDetail(true);
        setActiveAyah(1);
        setArPage(1);
        setSurahData(null);

        const surah = surahs.find((s) => s.id === surahNum);
        if (!surah) return;

        fetchSurahDetail(surahNum)
            .then((data) => setSurahData(data))
            .catch(console.error)
            .finally(() => setLoadingDetail(false));
    }, [surahNum, surahs]);

    // ── When ayah changes, jump to its page ───────────────────────────────────
    useEffect(() => {
        setArPage(Math.ceil(activeAyah / AYAHS_PER_AR_PAGE));
    }, [activeAyah]);

    // ── Handlers ──────────────────────────────────────────────────────────────
    const handleSurahChange = useCallback((n: number) => setSurahNum(n), []);
    const handleAyahChange = useCallback((n: number) => setActiveAyah(n), []);

    // ── Derived ───────────────────────────────────────────────────────────────
    const arabicText = surahData?.ayahs.find((a) => a.number === activeAyah)?.text_ar ?? "";
    const somaliText = surahData?.ayahs.find((a) => a.number === activeAyah)?.tafseer_so ?? "";
    const rawSourceName = surahData?.tafseer_source?.name_en;
    const sourceName = rawSourceName
        ? rawSourceName.replace(/tabari/i, "Gaanni")
        : "Tafseer Gaanni (Somali)";

    return (
        <div
            dir="rtl"
            style={{
                minHeight: "100vh",
                background: "#f0f0f0",
                display: "flex",
                flexDirection: "column",
                fontFamily: "Cairo, sans-serif",
            }}
        >
            <Navbar
                surahs={surahs}
                selectedSurahNumber={surahNum}
                selectedAyah={activeAyah}
                ayahCount={surahData?.surah.ayah_count ?? 0}
                onSurahChange={handleSurahChange}
                onAyahChange={handleAyahChange}
                isLoading={loadingList}
            />

            <main style={{ flex: 1, maxWidth: 1000, width: "100%", margin: "0 auto", padding: "12px 14px", display: "flex", flexDirection: "column", gap: 10 }}>
                {/* Top: Arabic Quran text */}
                <ArabicPanel
                    ayahs={surahData?.ayahs ?? []}
                    activeAyah={activeAyah}
                    onAyahClick={handleAyahChange}
                    isLoading={loadingList || loadingDetail}
                    page={arPage}
                    onPageChange={setArPage}
                />

                {/* Bottom: Somali Tafseer */}
                <TafseerPanel
                    ayahNumber={activeAyah}
                    arabicText={arabicText}
                    somaliText={somaliText}
                    tafseerSourceName={sourceName}
                    isLoading={loadingList || loadingDetail}
                />
            </main>

            <footer
                dir="ltr"
                style={{
                    textAlign: "center",
                    padding: "8px",
                    borderTop: "1px solid #ddd",
                    fontSize: 11,
                    color: "#999",
                    background: "#fff",
                    fontFamily: "Cairo, sans-serif",
                }}
            >
            </footer>
        </div>
    );
}
