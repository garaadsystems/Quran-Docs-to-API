"use client";

interface TafseerPanelProps {
    ayahNumber: number;
    arabicText: string;
    somaliText: string;      // tafseer or translation in Somali
    tafseerSourceName: string;
    isLoading: boolean;
}

export default function TafseerPanel({
    ayahNumber,
    arabicText,
    somaliText,
    tafseerSourceName,
    isLoading,
}: TafseerPanelProps) {
    return (
        <div className="bg-[#dde8f5] border border-[#b0c9e8] rounded-md overflow-hidden">
            {/* Source strip */}
            <div
                dir="ltr"
                className="flex items-center justify-between px-3 py-1 border-b border-[#b0c9e8] bg-[#eef4fd] text-xs text-[#555] font-cairo"
            >
                <span>
                    <strong className="text-[#7b1f32]">التفسير</strong>
                    {" – "}
                    {tafseerSourceName}
                </span>
                {/* Share icons */}
                <div className="flex gap-1">
                    {["f", "𝕏", "🔗"].map((ic, i) => (
                        <button
                            key={i}
                            id={`share-${i}`}
                            className="w-6 h-6 border border-[#ccc] rounded-[3px] bg-white text-[10px] cursor-pointer flex items-center justify-center text-[#555]"
                            title="Share"
                        >
                            {ic}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div className="p-6">
                    <div className="skel h-9 mb-3.5 rounded" />
                    <div className="skel h-9 w-[85%] mb-5 rounded" />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skel h-[18px] mb-2.5 rounded" style={{ width: `${90 - i * 8}%` }} />
                    ))}
                </div>
            ) : (
                <>
                    {/* Featured Arabic verse */}
                    {arabicText && (
                        <div
                            className="qfont fin text-[clamp(1.35rem,2.8vw,1.8rem)] font-bold px-7 pt-[18px] pb-3.5 border-b border-[#b0c9e8] bg-[#eef4fd] text-center leading-[2.4]"
                            dir="rtl"
                        >
                            {arabicText}
                            {" "}
                            <span className="ayah-num border border-gray-800">
                                {ayahNumber}
                            </span>
                        </div>
                    )}

                    {/* Somali tafseer body */}
                    <div className="bg-white px-5 py-4 min-h-[160px]">
                        {somaliText ? (
                            <p className="sfont fin text-[clamp(0.92rem,1.4vw,1.05rem)] text-[#1a1a1a]">
                                {somaliText}
                            </p>
                        ) : (
                            <p className="text-[#888] font-cairo text-sm text-center pt-6">
                                Tafsiirka aayadda {ayahNumber} weli lama soo gelin. <br />
                                <span className="text-[12px] text-[#aaa]">
                                    Tafseer for this ayah has not been added yet.
                                </span>
                            </p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
