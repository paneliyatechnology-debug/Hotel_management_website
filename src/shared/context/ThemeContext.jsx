"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { themePalettes, darkThemePalettes, getThemeConfig } from "@/config/theme";

const ThemeContext = createContext(null);

export function buildMuiTheme(themeConfig, mode = "light") {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: {
        main: themeConfig.primary,
        dark: themeConfig.primaryDark,
        light: themeConfig.primaryLight,
        contrastText: "#FFFFFF",
      },
      secondary: {
        main: themeConfig.champagne || themeConfig.border,
        contrastText: themeConfig.textMain,
      },
      background: {
        default: themeConfig.bgMain,
        paper: themeConfig.bgCard || (isDark ? "#162032" : "#FFFFFF"),
      },
      text: {
        primary: themeConfig.textMain,
        secondary: themeConfig.textMuted,
      },
      divider: themeConfig.border,
      success: {
        main: themeConfig.success,
        contrastText: "#FFFFFF",
      },
      warning: {
        main: themeConfig.warning,
        contrastText: "#FFFFFF",
      },
      error: {
        main: themeConfig.danger,
        contrastText: "#FFFFFF",
      },
      info: {
        main: themeConfig.info,
        contrastText: "#FFFFFF",
      },
    },
    typography: {
      fontFamily: [
        '"Plus Jakarta Sans"',
        "-apple-system",
        "BlinkMacSystemFont",
        '"Segoe UI"',
        "Roboto",
        '"Helvetica Neue"',
        "Arial",
        "sans-serif",
      ].join(","),
      h1: { fontWeight: 800, color: themeConfig.textMain, letterSpacing: "-0.025em" },
      h2: { fontWeight: 800, color: themeConfig.textMain, letterSpacing: "-0.02em" },
      h3: { fontWeight: 800, color: themeConfig.textMain, letterSpacing: "-0.015em" },
      h4: { fontWeight: 800, color: themeConfig.textMain, letterSpacing: "-0.01em" },
      h5: { fontWeight: 800, color: themeConfig.textMain, letterSpacing: "-0.01em" },
      h6: { fontWeight: 800, color: themeConfig.textMain },
      subtitle1: { fontWeight: 700, color: themeConfig.textMain },
      subtitle2: { fontWeight: 600, color: themeConfig.textMuted },
      body1: { color: themeConfig.textMain, fontSize: "0.9125rem" },
      body2: { color: themeConfig.textMuted, fontSize: "0.85rem" },
      button: { textTransform: "none", fontWeight: 700 },
    },
    shape: {
      borderRadius: 14,
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: themeConfig.bgMain,
            color: themeConfig.textMain,
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            colorScheme: isDark ? "dark" : "light",
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            borderRadius: 18,
            border: `1px solid ${themeConfig.border}`,
            backgroundColor: themeConfig.bgCard || (isDark ? "#0E312C" : "#FFFFFF"),
            boxShadow: isDark
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.45), 0 4px 10px -4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(20, 184, 166, 0.1)"
              : "0 10px 25px -5px rgba(12, 39, 59, 0.06), 0 4px 10px -4px rgba(12, 39, 59, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
          },
          elevation0: {
            boxShadow: "none",
            border: `1px solid ${themeConfig.border}`,
          },
          elevation1: {
            boxShadow: isDark
              ? "0 4px 20px -2px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(20, 184, 166, 0.1)"
              : "0 4px 20px -2px rgba(12, 39, 59, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
          },
          elevation2: {
            boxShadow: isDark
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(20, 184, 166, 0.12)"
              : "0 10px 25px -5px rgba(12, 39, 59, 0.08), 0 8px 10px -6px rgba(12, 39, 59, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
          },
          elevation3: {
            boxShadow: isDark
              ? "0 18px 36px -6px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(20, 184, 166, 0.15)"
              : "0 18px 36px -6px rgba(12, 39, 59, 0.12), inset 0 1px 2px rgba(255, 255, 255, 1)",
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: themeConfig.bgCard || (isDark ? "#0E312C" : "#FFFFFF"),
            border: `1px solid ${themeConfig.border}`,
            borderRadius: 20,
            boxShadow: isDark
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(20, 184, 166, 0.1)"
              : "0 10px 25px -5px rgba(12, 39, 59, 0.06), 0 8px 10px -6px rgba(12, 39, 59, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
            position: "relative",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            "&:hover": {
              boxShadow: isDark
                ? "0 16px 32px -6px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(20, 184, 166, 0.15)"
                : "0 16px 32px -6px rgba(12, 39, 59, 0.1), 0 8px 16px -4px rgba(12, 39, 59, 0.04), inset 0 1px 2px #FFFFFF",
            },
          },
        },
      },
      /* 3D Segmented Tabs & Tab Pills */
      MuiTabs: {
        styleOverrides: {
          root: {
            backgroundColor: themeConfig.champagne,
            borderRadius: 16,
            padding: "5px",
            minHeight: 46,
            border: `1px solid ${themeConfig.border}`,
            boxShadow: isDark
              ? "inset 0 1px 3px rgba(0, 0, 0, 0.3)"
              : "inset 0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0,0,0,0.02)",
          },
          indicator: {
            display: "none",
          },
          flexContainer: {
            gap: "4px",
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            minHeight: 38,
            padding: "8px 18px",
            fontWeight: 800,
            fontSize: "0.85rem",
            textTransform: "none",
            color: themeConfig.textMuted,
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            "&.Mui-selected": {
              color: isDark ? "#FFFFFF" : themeConfig.primaryDark,
              backgroundColor: isDark ? themeConfig.primaryDark : "#FFFFFF",
              boxShadow: isDark
                ? "0 4px 12px rgba(0, 0, 0, 0.4)"
                : "0 4px 12px rgba(12, 39, 59, 0.08), inset 0 1px 0 #FFFFFF",
            },
            "&:hover": {
              color: themeConfig.textMain,
              backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.5)",
            },
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            padding: "8px 18px",
            fontWeight: 700,
            fontSize: "0.85rem",
            textTransform: "none",
            transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
            "&:hover": {
              transform: "translateY(-1.5px)",
            },
            "&:active": {
              transform: "translateY(0.5px)",
            },
          },
          containedPrimary: {
            background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
            color: "#FFFFFF",
            boxShadow: `0 4px 14px -2px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255, 255, 255, 0.35)`,
            "&:hover": {
              background: `linear-gradient(135deg, ${themeConfig.primaryDark} 0%, ${themeConfig.primary} 100%)`,
              boxShadow: `0 8px 20px -2px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255, 255, 255, 0.45)`,
            },
          },
          containedSuccess: {
            background: `linear-gradient(135deg, ${themeConfig.success} 0%, #15803D 100%)`,
            color: "#FFFFFF",
            boxShadow: "0 4px 14px -2px rgba(22, 163, 74, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
          },
          containedError: {
            background: `linear-gradient(135deg, ${themeConfig.danger} 0%, #B91C1C 100%)`,
            color: "#FFFFFF",
            boxShadow: "0 4px 14px -2px rgba(220, 38, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
          },
          outlined: {
            borderColor: themeConfig.border,
            color: themeConfig.textMain,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#FFFFFF",
            boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
            "&:hover": {
              borderColor: themeConfig.primary,
              backgroundColor: themeConfig.champagne || "rgba(255,255,255,0.06)",
              boxShadow: `0 4px 12px ${themeConfig.primaryGlow}`,
            },
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 800,
            borderRadius: 8,
            fontSize: "0.75rem",
            boxShadow: "0 2px 5px rgba(0,0,0,0.04)",
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            border: `1px solid ${themeConfig.border}`,
            backgroundColor: themeConfig.bgCard || (isDark ? "#0E312C" : "#FFFFFF"),
            boxShadow: isDark
              ? "0 10px 25px -5px rgba(0, 0, 0, 0.4)"
              : "0 10px 25px -5px rgba(12, 39, 59, 0.06), inset 0 1px 1px #FFFFFF",
            overflow: "hidden",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderColor: themeConfig.border,
            padding: "12px 16px",
            fontSize: "0.85rem",
            color: themeConfig.textMain,
          },
          head: {
            fontWeight: 800,
            color: themeConfig.textMain,
            backgroundColor: isDark ? "rgba(20, 184, 166, 0.1)" : (themeConfig.champagne || "#F0FDFA"),
            borderBottom: `1px solid ${themeConfig.border}`,
            letterSpacing: "0.02em",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: "background-color 0.15s ease",
            "&:hover": {
              backgroundColor: `${themeConfig.primaryGlow} !important`,
            },
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            color: themeConfig.textMain,
            backgroundColor: themeConfig.bgCard || (isDark ? "#0E312C" : "#FFFFFF"),
            borderTop: `1px solid ${themeConfig.border}`,
          },
          selectLabel: {
            color: themeConfig.textMuted,
            fontWeight: 700,
          },
          displayedRows: {
            color: themeConfig.textMuted,
            fontWeight: 700,
          },
          select: {
            color: themeConfig.textMain,
            fontWeight: 700,
          },
          selectIcon: {
            color: themeConfig.textMuted,
          },
          actions: {
            "& .MuiIconButton-root": {
              color: themeConfig.textMain,
              "&.Mui-disabled": {
                color: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
              },
            },
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: themeConfig.textMuted,
            fontWeight: 600,
            "&.Mui-focused": {
              color: themeConfig.primary,
            },
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            borderRadius: 12,
            backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "#FFFFFF",
            color: themeConfig.textMain,
            boxShadow: isDark ? "none" : "inset 0 1px 3px rgba(0, 0, 0, 0.02)",
            transition: "all 0.2s ease",
            "& fieldset": {
              borderColor: themeConfig.border,
            },
            "&:hover fieldset": {
              borderColor: themeConfig.primary,
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${themeConfig.primaryGlow}`,
            },
            "&.Mui-focused fieldset": {
              borderColor: themeConfig.primary,
              borderWidth: "1.5px",
            },
            "& .MuiSelect-icon": {
              color: themeConfig.textMuted,
            },
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: themeConfig.textMain,
            borderRadius: 8,
            margin: "2px 6px",
            fontWeight: 600,
            fontSize: "0.85rem",
            "&:hover": {
              backgroundColor: themeConfig.champagne || (isDark ? "rgba(20, 184, 166, 0.15)" : "rgba(15, 118, 110, 0.08)"),
            },
            "&.Mui-selected": {
              backgroundColor: `${themeConfig.primaryGlow} !important`,
              color: isDark ? "#5EEAD4" : themeConfig.primaryDark,
              fontWeight: 800,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: 22,
            backgroundColor: themeConfig.bgCard || (isDark ? "#0E312C" : "#FFFFFF"),
            boxShadow: isDark
              ? "0 24px 48px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(20, 184, 166, 0.15)"
              : "0 24px 48px -12px rgba(12, 39, 59, 0.22), 0 12px 24px -8px rgba(12, 39, 59, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
            border: `1px solid ${themeConfig.border}`,
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            backgroundColor: themeConfig.bgCard || (isDark ? "#0E312C" : "#FFFFFF"),
            boxShadow: isDark
              ? "0 12px 28px -6px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(20, 184, 166, 0.12)"
              : "0 12px 28px -6px rgba(12, 39, 59, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
            border: `1px solid ${themeConfig.border}`,
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRadius: 0,
            backgroundColor: themeConfig.bgCard || (isDark ? "#0E312C" : "#FFFFFF"),
            borderRight: `1px solid ${themeConfig.border}`,
            borderTop: "none",
            borderBottom: "none",
            borderLeft: "none",
            boxShadow: isDark
              ? "4px 0 24px rgba(0, 0, 0, 0.4)"
              : "4px 0 24px rgba(12, 39, 59, 0.04)",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            backgroundColor: themeConfig.bgHeader || (isDark ? "#0A2522" : "#FFFFFF"),
            borderBottom: `1px solid ${themeConfig.border}`,
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            backdropFilter: "blur(14px)",
            boxShadow: isDark
              ? "0 4px 20px -4px rgba(0, 0, 0, 0.5)"
              : "0 4px 20px -4px rgba(12, 39, 59, 0.04)",
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: "16px !important",
            border: `1px solid ${themeConfig.border}`,
            backgroundColor: themeConfig.bgCard || (isDark ? "#0E312C" : "#FFFFFF"),
            boxShadow: isDark
              ? "0 4px 14px rgba(0, 0, 0, 0.3)"
              : "0 4px 14px rgba(12, 39, 59, 0.04), inset 0 1px 0 #FFFFFF",
            "&:before": {
              display: "none",
            },
            marginBottom: "12px",
          },
        },
      },
      MuiDivider: {
        styleOverrides: {
          root: {
            borderColor: themeConfig.border,
          },
        },
      },
      MuiAlert: {
        styleOverrides: {
          root: {
            borderRadius: 14,
            boxShadow: "0 4px 14px rgba(0, 0, 0, 0.1)",
          },
        },
      },
    },
  });
}

export function AppThemeProvider({ children }) {
  const [paletteKey, setPaletteKeyInternal] = useState("palette1");
  const [mode, setModeInternal] = useState("light");
  const [settings, setSettingsInternal] = useState({
    autoRefresh: true,
    compactMode: false,
    notificationsEnabled: true,
    soundAlerts: true,
  });

  const applyDomStyles = useCallback((pal, currentMode) => {
    if (typeof window !== "undefined" && pal) {
      document.documentElement.style.setProperty("--color-primary", pal.primary);
      document.documentElement.style.setProperty("--color-primary-dark", pal.primaryDark);
      document.documentElement.style.setProperty("--color-primary-light", pal.primaryLight);
      document.documentElement.style.setProperty("--color-bg-main", pal.bgMain);
      document.documentElement.style.setProperty("--color-bg-card", pal.bgCard);
      document.documentElement.style.setProperty("--color-bg-header", pal.bgHeader);
      document.documentElement.style.setProperty("--color-text-main", pal.textMain);
      document.documentElement.style.setProperty("--color-text-muted", pal.textMuted);
      document.documentElement.style.setProperty("--color-border", pal.border);
      document.documentElement.style.setProperty("--color-champagne", pal.champagne);
      document.documentElement.setAttribute("data-theme-mode", currentMode);
      document.documentElement.classList.remove("light-theme", "dark-theme");
      document.documentElement.classList.add(`${currentMode}-theme`);

      if (document.body) {
        document.body.style.backgroundColor = pal.bgMain;
        document.body.style.color = pal.textMain;
        document.body.style.colorScheme = currentMode;
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPalette = localStorage.getItem("admin_theme_palette");
      const savedMode = localStorage.getItem("admin_theme_mode");
      
      const initialPalette = (savedPalette && themePalettes[savedPalette]) ? savedPalette : "palette1";
      const initialMode = (savedMode === "dark" || savedMode === "light") ? savedMode : "light";

      setPaletteKeyInternal(initialPalette);
      setModeInternal(initialMode);

      const cfg = getThemeConfig(initialPalette, initialMode);
      applyDomStyles(cfg, initialMode);

      const savedSettings = localStorage.getItem("admin_app_settings");
      if (savedSettings) {
        try {
          setSettingsInternal(JSON.parse(savedSettings));
        } catch {}
      }
    }
  }, [applyDomStyles]);

  const changePalette = (newKey) => {
    if (themePalettes[newKey] || darkThemePalettes[newKey]) {
      setPaletteKeyInternal(newKey);
      const cfg = getThemeConfig(newKey, mode);
      applyDomStyles(cfg, mode);
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_theme_palette", newKey);
      }
    }
  };

  const changeMode = (newMode) => {
    const validMode = newMode === "dark" ? "dark" : "light";
    setModeInternal(validMode);
    const cfg = getThemeConfig(paletteKey, validMode);
    applyDomStyles(cfg, validMode);
    if (typeof window !== "undefined") {
      localStorage.setItem("admin_theme_mode", validMode);
    }
  };

  const toggleThemeMode = () => {
    changeMode(mode === "dark" ? "light" : "dark");
  };

  const updateSettings = (partial) => {
    setSettingsInternal((prev) => {
      const next = { ...prev, ...partial };
      if (typeof window !== "undefined") {
        localStorage.setItem("admin_app_settings", JSON.stringify(next));
      }
      return next;
    });
  };

  const isDarkMode = mode === "dark";
  const activeThemeConfig = useMemo(() => getThemeConfig(paletteKey, mode), [paletteKey, mode]);
  const muiTheme = useMemo(() => buildMuiTheme(activeThemeConfig, mode), [activeThemeConfig, mode]);

  return (
    <ThemeContext.Provider
      value={{
        themeConfig: activeThemeConfig,
        paletteKey,
        setPaletteKey: changePalette,
        themePalettes: isDarkMode ? darkThemePalettes : themePalettes,
        lightThemePalettes: themePalettes,
        darkThemePalettes,
        mode,
        themeMode: mode,
        isDarkMode,
        toggleThemeMode,
        setThemeMode: changeMode,
        settings,
        updateSettings,
      }}
    >
      <ThemeProvider theme={muiTheme}>
        <CssBaseline />
        <ToastContainer
          position="top-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={isDarkMode ? "dark" : "colored"}
          style={{ zIndex: 99999 }}
        />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useAppTheme must be used within AppThemeProvider");
  }
  return ctx;
}
