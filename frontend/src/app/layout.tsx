import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Quran – تفسير القرآن الكريم",
  description: "Tafsiirada Qur'aanka Kariimka ah – Afka Soomaaliga",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body style={{ background: "#f0f0f0", minHeight: "100vh" }}>{children}</body>
    </html>
  );
}
