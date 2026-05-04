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
        <div
            style={{
                background: "#dde8f5",
                border: "1px solid #b0c9e8",
                borderRadius: 5,
                overflow: "hidden",
            }}
        >
            {/* Source strip */}
            <div
                dir="ltr"
                style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "5px 12px",
                    borderBottom: "1px solid #b0c9e8",
                    background: "#eef4fd",
                    fontSize: 12,
                    color: "#555",
                    fontFamily: "Cairo, sans-serif",
                }}
            >
                <span>
                    <strong style={{ color: "#7b1f32" }}>التفسير</strong>
                    {" – "}
                    {tafseerSourceName}
                </span>
                {/* Share icons */}
                <div style={{ display: "flex", gap: 4 }}>
                    {["f", "𝕏", "🔗"].map((ic, i) => (
                        <button
                            key={i}
                            id={`share-${i}`}
                            style={{
                                width: 24,
                                height: 24,
                                border: "1px solid #ccc",
                                borderRadius: 3,
                                background: "#fff",
                                fontSize: 10,
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#555",
                            }}
                            title="Share"
                        >
                            {ic}
                        </button>
                    ))}
                </div>
            </div>

            {isLoading ? (
                <div style={{ padding: 24 }}>
                    <div className="skel" style={{ height: 36, marginBottom: 14, borderRadius: 4 }} />
                    <div className="skel" style={{ height: 36, width: "85%", marginBottom: 20, borderRadius: 4 }} />
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="skel" style={{ height: 18, marginBottom: 10, width: `${90 - i * 8}%`, borderRadius: 4 }} />
                    ))}
                </div>
            ) : (
                <>
                    {/* Featured Arabic verse */}
                    {arabicText && (
                        <div
                            className="qfont fin"
                            dir="rtl"
                            style={{
                                fontSize: "clamp(1.35rem, 2.8vw, 1.8rem)",
                                fontWeight: 700,
                                padding: "18px 28px 14px",
                                borderBottom: "1px solid #b0c9e8",
                                background: "#eef4fd",
                                textAlign: "center",
                                lineHeight: 2.4,
                            }}
                        >
                            {arabicText}
                            {" "}
                            <span className="ayah-num" style={{ border: "1px solid #333" }}>
                                {ayahNumber}
                            </span>
                        </div>
                    )}

                    {/* Somali tafseer body */}
                    <div
                        style={{
                            background: "#fff",
                            padding: "18px 22px",
                            minHeight: 160,
                        }}
                    >
                        {somaliText ? (
                            <p
                                className="sfont fin"
                                style={{
                                    fontSize: "clamp(0.92rem, 1.4vw, 1.05rem)",
                                    color: "#1a1a1a",
                                }}
                            >
                                {somaliText}
                            </p>
                        ) : (
                            <p
                                style={{
                                    color: "#888",
                                    fontFamily: "Cairo, sans-serif",
                                    fontSize: 14,
                                    textAlign: "center",
                                    paddingTop: 24,
                                }}
                            >
                                Tafsiirka aayadda {ayahNumber} weli lama soo gelin. <br />
                                <span style={{ fontSize: 12, color: "#aaa" }}>
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
