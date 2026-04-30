"use client";

import { useEffect, useRef } from "react";

interface ReadProgressProps {
    current: number;
    total: number;
}

export default function ReadProgress({ current, total }: ReadProgressProps) {
    const barRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!barRef.current || total === 0) return;
        const pct = Math.round((current / total) * 100);
        barRef.current.style.width = `${pct}%`;
    }, [current, total]);

    return <div ref={barRef} className="read-progress" style={{ width: "0%" }} />;
}
