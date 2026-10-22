/**
 * ====================================================================
 * CENTRAL THEME CONFIGURATION SYSTEM (Charcoal + Emerald Green)
 * ====================================================================
 * Single source of truth for both colour modes. Components read these tokens through
 * `useAppTheme()` (MUI + inline styles) or the CSS variables set by `applyDomStyles`
 * (Tailwind / plain CSS) - never hardcode colours in components.
 *
 * Token cheat-sheet
 *   bgMain      page background            bgHeader   sidebar / app bar
 *   bgCard      cards & panels             bgElevated menus, popovers, dialogs
 *   champagne   hover / selected surface   bgSoft     tinted callouts & table heads
 *   bgSubtle    inset sub-panels           bgInput    form field fill
 *   primary     solid brand fills          accent     brand colour for text & icons
 *   onPrimary   text on solid primary      tones.*    status colours { color, bg, border }
 */

export const themePalettes = {
  // Light: soft mint-white canvas, white surfaces, deep emerald accent
  palette1: {
    name: "Charcoal Emerald Light",
    mode: "light",
    primary: "#047857",
    primaryDark: "#065F46", // hover / pressed fill
    primaryLight: "#10B981",
    primaryGlow: "rgba(4, 120, 87, 0.18)",
    bgMain: "#F7F9F7",
    bgHeader: "#FFFFFF",
    bgCard: "#FFFFFF",
    bgFooter: "#FFFFFF",
    textMain: "#202923",
    textMuted: "#647067",
    textLight: "#7A867E",
    border: "#DDE5DF",
    borderLight: "#EBF0EC",
    borderHover: "#047857",
    champagne: "#EDF5EF", // hover / selected surface
    success: "#047857",
    successBg: "rgba(4, 120, 87, 0.12)",
    warning: "#B45309",
    warningBg: "rgba(180, 83, 9, 0.12)",
    danger: "#B42318",
    dangerBg: "rgba(180, 35, 24, 0.10)",
    info: "#0F766E",
    infoBg: "rgba(15, 118, 110, 0.12)",
    cleaning: "#0E7490",
    cleaningBg: "rgba(14, 116, 144, 0.12)",
    shadowCard: "0 1px 2px rgba(32, 41, 35, 0.04), 0 6px 20px -8px rgba(32, 41, 35, 0.08)",
    shadowHover: "0 10px 28px -8px rgba(32, 41, 35, 0.16)",
    shadowModal: "0 20px 50px rgba(32, 41, 35, 0.18)",
    // Semantic surface / accent tokens (shared by light + dark so components never hardcode colors)
    accent: "#047857",
    onPrimary: "#FFFFFF",
    bgSoft: "#EDF5EF",
    bgSubtle: "#F3F7F4",
    bgInput: "#FFFFFF",
    bgElevated: "#FFFFFF",
    overlay: "rgba(20, 28, 23, 0.45)",
    tones: {
      success: { color: "#047857", bg: "#ECFDF5", border: "#A7F3D0" },
      warning: { color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
      danger: { color: "#B42318", bg: "#FEF2F2", border: "#FECACA" },
      info: { color: "#0F766E", bg: "#F0FDFA", border: "#99F6E4" },
      neutral: { color: "#647067", bg: "#F1F5F2", border: "#DDE5DF" },
      violet: { color: "#6D28D9", bg: "#F5F3FF", border: "#DDD6FE" },
      blue: { color: "#1D4ED8", bg: "#EFF6FF", border: "#BFDBFE" },
    },
  },
};

/**
 * ====================================================================
 * DARK THEME PALETTE (Charcoal + Emerald)
 * ====================================================================
 */
export const darkThemePalettes = {
  // Dark: charcoal surfaces with a restrained emerald accent; elevation by lighter surface + hairline border
  palette1: {
    name: "Charcoal Emerald Dark",
    mode: "dark",
    primary: "#34D399",
    primaryDark: "#10B981", // hover / pressed fill
    primaryLight: "#6EE7B7",
    primaryGlow: "rgba(52, 211, 153, 0.16)", // focus ring & soft tint
    bgMain: "#101412",
    bgHeader: "#141A16",
    bgCard: "#191F1B",
    bgFooter: "#141A16",
    textMain: "#F3F6F4",
    textMuted: "#A7B0AA",
    textLight: "#7F8A83",
    border: "#2A342D",
    borderLight: "#222B25",
    borderHover: "#34D399",
    champagne: "#222C25", // hover / selected surface
    success: "#34D399",
    successBg: "rgba(52, 211, 153, 0.14)",
    warning: "#FBBF24",
    warningBg: "rgba(251, 191, 36, 0.14)",
    danger: "#F87171",
    dangerBg: "rgba(248, 113, 113, 0.14)",
    info: "#2DD4BF",
    infoBg: "rgba(45, 212, 191, 0.14)",
    cleaning: "#22D3EE",
    cleaningBg: "rgba(34, 211, 238, 0.14)",
    shadowCard: "0 1px 2px rgba(0, 0, 0, 0.35), 0 8px 24px -12px rgba(0, 0, 0, 0.55)",
    shadowHover: "0 12px 32px -10px rgba(0, 0, 0, 0.65)",
    shadowModal: "0 24px 64px rgba(0, 0, 0, 0.7)",
    accent: "#34D399",
    onPrimary: "#06281C", // dark text on the bright emerald fill (AA contrast)
    bgSoft: "rgba(52, 211, 153, 0.08)",
    bgSubtle: "rgba(255, 255, 255, 0.03)",
    bgInput: "#141A16",
    bgElevated: "#1E2621",
    overlay: "rgba(5, 8, 6, 0.7)",
    tones: {
      success: { color: "#34D399", bg: "rgba(52, 211, 153, 0.12)", border: "rgba(52, 211, 153, 0.28)" },
      warning: { color: "#FBBF24", bg: "rgba(251, 191, 36, 0.12)", border: "rgba(251, 191, 36, 0.28)" },
      danger: { color: "#F87171", bg: "rgba(248, 113, 113, 0.12)", border: "rgba(248, 113, 113, 0.28)" },
      info: { color: "#5EEAD4", bg: "rgba(45, 212, 191, 0.12)", border: "rgba(45, 212, 191, 0.28)" },
      neutral: { color: "#A7B0AA", bg: "rgba(255, 255, 255, 0.06)", border: "rgba(255, 255, 255, 0.12)" },
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
 * CSS custom properties for a palette. Used by the root layout (light defaults), the pre-paint
 * boot script (saved dark mode) and ThemeContext (live switching) so all three stay identical.
 */
export function getThemeCssVars(pal) {
  const tones = pal.tones || {};
  return {
    "--color-primary": pal.primary,
    "--color-primary-dark": pal.primaryDark,
    "--color-primary-light": pal.primaryLight,
    "--color-primary-glow": pal.primaryGlow,
    "--color-bg-main": pal.bgMain,
    "--color-bg-card": pal.bgCard,
    "--color-bg-header": pal.bgHeader,
    "--color-bg-footer": pal.bgFooter,
    "--color-bg-elevated": pal.bgElevated || pal.bgCard,
    "--color-bg-subtle": pal.bgSubtle || pal.bgCard,
    "--color-bg-input": pal.bgInput || pal.bgCard,
    "--color-text-main": pal.textMain,
    "--color-text-muted": pal.textMuted,
    "--color-border": pal.border,
    "--color-border-hover": pal.borderHover || pal.primary,
    "--color-champagne": pal.champagne,
    "--color-accent": pal.accent || pal.primaryDark,
    "--color-on-primary": pal.onPrimary || "#FFFFFF",
    "--color-overlay": pal.overlay,
    "--color-success": tones.success?.color || pal.success,
    "--color-warning": tones.warning?.color || pal.warning,
    "--color-danger": tones.danger?.color || pal.danger,
    "--color-info": tones.info?.color || pal.info,
  };
}

/**
 * DEFAULT ACTIVE THEME:
 */
export const themeConfig = themePalettes.palette1;
