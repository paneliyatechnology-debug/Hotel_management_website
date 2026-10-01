/**
 * ====================================================================
 * CENTRAL THEME CONFIGURATION SYSTEM (2026 Modern Luxury Emerald Teal)
 * ====================================================================
 */

export const themePalettes = {
  // 💎 2026 Modern Luxury Hotel Palette
  palette1: {
    name: "Modern Luxury Emerald Teal",
    mode: "light",
    primary: "#0F766E", // Deep Emerald Teal
    primaryDark: "#115E59",
    primaryLight: "#14B8A6", // Vibrant Mint Teal
    primaryGlow: "rgba(15, 118, 110, 0.25)",
    bgMain: "#F0FDFA", // Light Mint Surface
    bgHeader: "#FFFFFF",
    bgCard: "#FFFFFF",
    bgFooter: "#FFFFFF",
    textMain: "#0F2926",
    textMuted: "#3E6661",
    textLight: "#64948E",
    border: "#CCFBF1",
    borderLight: "#E6FFFA",
    borderHover: "#0F766E",
    champagne: "#CCFBF1",
    success: "#059669",
    successBg: "rgba(5, 150, 105, 0.12)",
    warning: "#D97706",
    warningBg: "rgba(217, 119, 6, 0.12)",
    danger: "#EF4444",
    dangerBg: "rgba(239, 68, 68, 0.12)",
    info: "#0F766E",
    infoBg: "rgba(15, 118, 110, 0.12)",
    cleaning: "#06B6D4",
    cleaningBg: "rgba(6, 182, 212, 0.12)",
    shadowCard: "0 4px 20px rgba(15, 41, 38, 0.05)",
    shadowHover: "0 8px 24px rgba(15, 118, 110, 0.18)",
    shadowModal: "0 16px 48px rgba(15, 41, 38, 0.16)",
  },
};

/**
 * ====================================================================
 * 🌙 DARK THEME PALETTE (Sleek OLED / Emerald Dark Mode)
 * ====================================================================
 */
export const darkThemePalettes = {
  // 💎 2026 Dark Emerald Teal & Mint
  palette1: {
    name: "Dark Emerald Teal & Mint",
    mode: "dark",
    primary: "#14B8A6", // Vibrant Mint Teal
    primaryDark: "#0F766E", // Deep Emerald
    primaryLight: "#5EEAD4", // Mint Glow
    primaryGlow: "rgba(20, 184, 166, 0.35)",
    bgMain: "#061B18", // Deep Luxury Obsidian Emerald
    bgHeader: "#0A2522",
    bgCard: "#0E312C",
    bgFooter: "#0A2522",
    textMain: "#F0FDFA",
    textMuted: "#99B8B3",
    textLight: "#5EEAD4",
    border: "rgba(20, 184, 166, 0.22)",
    borderLight: "rgba(20, 184, 166, 0.1)",
    borderHover: "#14B8A6",
    champagne: "rgba(20, 184, 166, 0.14)",
    success: "#10B981",
    successBg: "rgba(16, 185, 129, 0.18)",
    warning: "#F59E0B",
    warningBg: "rgba(245, 158, 11, 0.18)",
    danger: "#EF4444",
    dangerBg: "rgba(239, 68, 68, 0.18)",
    info: "#14B8A6",
    infoBg: "rgba(20, 184, 166, 0.18)",
    cleaning: "#22D3EE",
    cleaningBg: "rgba(34, 211, 238, 0.18)",
    shadowCard: "0 10px 30px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(20, 184, 166, 0.1)",
    shadowHover: "0 14px 40px rgba(0, 0, 0, 0.65)",
    shadowModal: "0 24px 60px rgba(0, 0, 0, 0.9)",
  },
};

/**
 * Helper to get active theme config based on paletteKey and mode ("light" | "dark")
 */
export function getThemeConfig(paletteKey = "palette1", mode = "light") {
  if (mode === "dark") {
    return darkThemePalettes[paletteKey] || darkThemePalettes.palette1;
  }
  return themePalettes[paletteKey] || themePalettes.palette1;
}

/**
 * 👉 DEFAULT ACTIVE THEME:
 */
export const themeConfig = themePalettes.palette1;
