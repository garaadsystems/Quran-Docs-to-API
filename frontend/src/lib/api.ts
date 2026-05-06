import { SomaliSurahData, SurahMeta } from "@/types/quran";

const TAFSEER_BASE = process.env.NEXT_PUBLIC_TAFSEER_API_URL || "http://localhost:8000";

// ─── Local Quran API (MongoDB-backed) ────────────────────────────────────────

/**
 * Fetch the list of all 114 surahs (metadata only)
 */
export async function fetchSurahList(): Promise<SurahMeta[]> {
    const res = await fetch(`${TAFSEER_BASE}/api/surahs`);
    if (!res.ok) throw new Error("Failed to fetch surah list");
    const data = await res.json();
    return data.surahs as SurahMeta[];
}

/**
 * Fetch a full surah with Arabic text (Uthmani script)
 */
export async function fetchSurahDetail(
    surahId: number | string
): Promise<SomaliSurahData | null> {
    try {
        const res = await fetch(`${TAFSEER_BASE}/api/surahs/${encodeURIComponent(String(surahId))}`);
        if (res.status === 404) return null;
        if (!res.ok) throw new Error(`Failed to fetch surah ${surahId}`);
        return await res.json();
    } catch {
        return null;
    }
}
