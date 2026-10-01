import { Inter, Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import { themeConfig } from "@/config/theme";
import FloatingTabBar from "@/components/FloatingTabBar";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
});

const playfair = Playfair_Display({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800", "900"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata = {
  title: "MYOWNPMS | Hotel Management System",
  description: "Next-Generation Multi-Tenant Hotel Management & Cloud PMS Platform",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }) {
  const themeStyles = {
    "--color-primary": themeConfig.primary,
    "--color-primary-dark": themeConfig.primaryDark,
    "--color-primary-light": themeConfig.primaryLight,
    "--color-primary-glow": themeConfig.primaryGlow || "rgba(0, 0, 0, 0.15)",
    "--color-bg-main": themeConfig.bgMain,
    "--color-bg-header": themeConfig.bgHeader || "#ffffff",
    "--color-bg-card": themeConfig.bgCard || "#ffffff",
    "--color-bg-footer": themeConfig.bgFooter || "#ffffff",
    "--color-text-main": themeConfig.textMain,
    "--color-text-muted": themeConfig.textMuted,
    "--color-border": themeConfig.border,
    "--color-border-hover": themeConfig.borderHover || themeConfig.primary,
  };

  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${outfit.variable}`}
      style={themeStyles}
    >
      <body className="min-h-screen pb-14 md:pb-0 font-sans antialiased" style={{ backgroundColor: themeConfig.bgMain, color: themeConfig.textMain }}>
        {children}
        <FloatingTabBar />
      </body>
    </html>
  );
}


