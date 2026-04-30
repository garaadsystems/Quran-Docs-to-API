// ─── External API Types (alquran.cloud) ─────────────────────────────────────

export interface AlQuranSurah {
    number: number;
    name: string;         // Arabic name
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: "Meccan" | "Medinan";
}

export interface AlQuranAyah {
    number: number;         // global ayah number
    text: string;           // arabic text
    numberInSurah: number;
    juz: number;
    manzil: number;
    page: number;
    ruku: number;
    hizbQuarter: number;
    sajda: boolean | { id: number; recommended: boolean; obligatory: boolean };
}

export interface AlQuranSurahDetail {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
    revelationType: string;
    ayahs: AlQuranAyah[];
}

// ─── Local Backend Types (Somali Tafseer API) ────────────────────────────────

export interface SomaliAyah {
    number: number;
    text_ar: string;
    tafseer_so: string;
}

export interface SomaliSurahData {
    surah: {
        id: number | null;
        name_ar: string;
        name_en: string;
        name_so: string;
        revelation_place: string | null;
        ayah_count: number;
    };
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
