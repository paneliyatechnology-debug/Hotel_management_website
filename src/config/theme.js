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
    // Semantic surface / accent tokens (shared by light + dark so components never hardcode colors)
    accent: "#115E59", // readable brand colour for text & icons on card surfaces
    onPrimary: "#FFFFFF", // text on solid primary fills
    bgSoft: "#F0FDFA", // soft tinted surface (headers, selected rows, callouts)
    bgSubtle: "#F8FAFC", // neutral inset surface (sub-panels inside cards)
    bgInput: "#FFFFFF",
    bgElevated: "#FFFFFF", // menus, popovers, dialogs
    overlay: "rgba(15, 41, 38, 0.45)",
    tones: {
      success: { color: "#047857", bg: "#ECFDF5", border: "#A7F3D0" },
      warning: { color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
      danger: { color: "#B42318", bg: "#FEF2F2", border: "#FECACA" },
      info: { color: "#0F766E", bg: "#F0FDFA", border: "#99F6E4" },
      neutral: { color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0" },
      violet: { color: "#7C3AED", bg: "#F5F3FF", border: "#DDD6FE" },
      blue: { color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
    },
  },
};

/**
 * ====================================================================
 * 🌙 DARK THEME PALETTE (Emerald Slate)
 * ====================================================================
 */
export const darkThemePalettes = {
  // 💎 Dark Emerald Slate: neutral green-black surfaces, three elevation levels, restrained teal accent
  palette1: {
    name: "Dark Emerald Slate",
    mode: "dark",
    primary: "#0D9488", // solid teal (white text passes contrast)
    primaryDark: "#0F766E", // hover / pressed fill
    primaryLight: "#5EEAD4", // mint highlight
    primaryGlow: "rgba(45, 212, 191, 0.16)", // hover tint + focus ring
    bgMain: "#0A1312", // page
    bgHeader: "#0E1A18", // app bar / sidebar
    bgCard: "#111E1C", // cards & panels
    bgFooter: "#0E1A18",
    textMain: "#E7F2F0",
    textMuted: "#9DB5B0",
    textLight: "#71898A",
    border: "rgba(148, 210, 198, 0.14)",
    borderLight: "rgba(148, 210, 198, 0.07)",
    borderHover: "#2DD4BF",
    champagne: "rgba(45, 212, 191, 0.10)", // selected / hover tint
    success: "#10B981",
    successBg: "rgba(16, 185, 129, 0.14)",
    warning: "#F59E0B",
    warningBg: "rgba(245, 158, 11, 0.14)",
    danger: "#EF4444",
    dangerBg: "rgba(239, 68, 68, 0.14)",
    info: "#2DD4BF",
    infoBg: "rgba(45, 212, 191, 0.14)",
    cleaning: "#22D3EE",
    cleaningBg: "rgba(34, 211, 238, 0.14)",
    shadowCard: "0 1px 2px rgba(0, 0, 0, 0.35), 0 8px 24px -12px rgba(0, 0, 0, 0.55)",
    shadowHover: "0 12px 32px -10px rgba(0, 0, 0, 0.65)",
    shadowModal: "0 24px 64px rgba(0, 0, 0, 0.7)",
    accent: "#5EEAD4",
    onPrimary: "#FFFFFF",
    bgSoft: "rgba(45, 212, 191, 0.08)",
    bgSubtle: "rgba(255, 255, 255, 0.035)",
    bgInput: "rgba(255, 255, 255, 0.045)",
    bgElevated: "#16262A",
    overlay: "rgba(2, 8, 7, 0.68)",
    tones: {
      success: { color: "#34D399", bg: "rgba(52, 211, 153, 0.12)", border: "rgba(52, 211, 153, 0.28)" },
      warning: { color: "#FBBF24", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.28)" },
      danger: { color: "#F87171", bg: "rgba(248, 113, 113, 0.12)", border: "rgba(248, 113, 113, 0.28)" },
      info: { color: "#5EEAD4", bg: "rgba(45, 212, 191, 0.12)", border: "rgba(45, 212, 191, 0.28)" },
      neutral: { color: "#A9BBB7", bg: "rgba(255, 255, 255, 0.06)", border: "rgba(255, 255, 255, 0.12)" },
      violet: { color: "#A78BFA", bg: "rgba(167, 139, 250, 0.12)", border: "rgba(167, 139, 250, 0.28)" },
      blue: { color: "#60A5FA", bg: "rgba(96, 165, 250, 0.12)", border: "rgba(96, 165, 250, 0.28)" },
    },
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
