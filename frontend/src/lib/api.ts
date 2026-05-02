import { AlQuranSurah, AlQuranSurahDetail, SomaliSurahData } from "@/types/quran";

const ALQURAN_BASE = "https://api.alquran.cloud/v1";
const TAFSEER_BASE = process.env.NEXT_PUBLIC_TAFSEER_API_URL || "http://localhost:8000";

// ─── Quran text API ──────────────────────────────────────────────────────────

/**
 * Fetch the list of all 114 surahs (metadata only)
 */
export async function fetchSurahList(): Promise<AlQuranSurah[]> {
    const res = await fetch(`${ALQURAN_BASE}/meta`);
    if (!res.ok) throw new Error("Failed to fetch surah list");
    const data = await res.json();
    return data.data.surahs.references as AlQuranSurah[];
}

/**
 * Fetch a full surah with Arabic text (Uthmani script)
 */
export async function fetchSurahDetail(
    surahNumber: number
): Promise<AlQuranSurahDetail> {
    const res = await fetch(
        `${ALQURAN_BASE}/surah/${surahNumber}/quran-uthmani`
    );
    if (!res.ok) throw new Error(`Failed to fetch surah ${surahNumber}`);
    const data = await res.json();
    return data.data as AlQuranSurahDetail;
}

// ─── Somali Tafseer API (local FastAPI) ─────────────────────────────────────

/**
 * Fetch Somali Tafseer for a surah from the local backend.
 * Returns null if the surah JSON has not yet been uploaded.
 */
export async function fetchSomaliTafseer(
    surahId: string | number
): Promise<SomaliSurahData | null> {
    try {
        const res = await fetch(`${TAFSEER_BASE}/api/surahs/${encodeURIComponent(String(surahId))}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error("Failed to fetch tafseer");
        return await res.json();
    } catch {
        return null;
    }
}
