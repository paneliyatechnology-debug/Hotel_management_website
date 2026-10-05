import "./globals.css";
import { themeConfig } from "@/config/theme";
import FloatingTabBar from "@/components/FloatingTabBar";

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
      style={themeStyles}
    >
      <body className="min-h-screen pb-14 md:pb-0 font-sans antialiased" style={{ backgroundColor: themeConfig.bgMain, color: themeConfig.textMain }}>
        {children}
        <FloatingTabBar />
      </body>
    </html>
  );
}


