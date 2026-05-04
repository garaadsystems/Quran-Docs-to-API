// ─── Local Backend Types (Somali Tafseer API) ────────────────────────────────

export interface SomaliAyah {
    number: number;
    text_ar: string;
    tafseer_so: string;
}

export interface SurahMeta {
    id: number | null;
    name_ar: string;
    name_en: string;
    name_so: string;
    revelation_place: string | null;
    ayah_count: number;
}

export interface SomaliSurahData {
    surah: SurahMeta;
    tafseer_source: {
        id: string;
        name_ar: string;
        name_en: string;
        language: string;
    };
    ayahs: SomaliAyah[];
}

// ─── UI State Types ──────────────────────────────────────────────────────────

export interface SelectedVerse {
    surahNumber: number;
    ayahNumber: number;
    arabicText: string;
    somaliTafseer: string;
    surahName: string;
    surahEnglishName: string;
}
