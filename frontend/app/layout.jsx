import { Inter, Inter_Tight } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-display",
  display: "swap",
});

export const metadata = {
  title: "CricWarehouse | IPL Data Engineering & Analytics",
  description:
    "An end-to-end IPL data engineering pipeline transforming raw ball-by-ball cricket data into analytics-ready insights using Medallion Architecture.",
  keywords: "IPL, cricket, data engineering, analytics, PySpark, medallion architecture, pipeline",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
