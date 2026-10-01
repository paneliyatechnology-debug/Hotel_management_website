"use client";

import { createTheme } from "@mui/material/styles";
import { themeConfig } from "@/config/theme";

export const muiTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: themeConfig.primary,
      dark: themeConfig.primaryDark,
      light: themeConfig.primaryLight,
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: themeConfig.champagne,
      contrastText: themeConfig.textMain,
    },
    background: {
      default: themeConfig.bgMain,
      paper: themeConfig.bgCard,
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
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 18,
          border: `1px solid ${themeConfig.border}`,
          boxShadow: "0 10px 25px -5px rgba(12, 39, 59, 0.06), 0 4px 10px -4px rgba(12, 39, 59, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
        },
        elevation0: {
          boxShadow: "none",
          border: `1px solid ${themeConfig.border}`,
        },
        elevation1: {
          boxShadow: "0 4px 20px -2px rgba(12, 39, 59, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
        },
        elevation2: {
          boxShadow: "0 10px 25px -5px rgba(12, 39, 59, 0.08), 0 8px 10px -6px rgba(12, 39, 59, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
        },
        elevation3: {
          boxShadow: "0 18px 36px -6px rgba(12, 39, 59, 0.12), inset 0 1px 2px rgba(255, 255, 255, 1)",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: themeConfig.bgCard,
          border: `1px solid ${themeConfig.border}`,
          borderRadius: 20,
          boxShadow: "0 10px 25px -5px rgba(12, 39, 59, 0.06), 0 8px 10px -6px rgba(12, 39, 59, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
          position: "relative",
          transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
          "&:hover": {
            boxShadow: "0 16px 32px -6px rgba(12, 39, 59, 0.1), 0 8px 16px -4px rgba(12, 39, 59, 0.04), inset 0 1px 2px #FFFFFF",
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
          boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.06), 0 2px 6px rgba(0,0,0,0.02)",
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
            color: themeConfig.primaryDark,
            backgroundColor: "#FFFFFF",
            boxShadow: "0 4px 12px rgba(12, 39, 59, 0.08), inset 0 1px 0 #FFFFFF",
          },
          "&:hover": {
            color: themeConfig.textMain,
            backgroundColor: "rgba(255,255,255,0.5)",
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
          backgroundColor: "#FFFFFF",
          boxShadow: "0 2px 4px rgba(0,0,0,0.02), inset 0 1px 0 #FFFFFF",
          "&:hover": {
            borderColor: themeConfig.primary,
            backgroundColor: themeConfig.champagne,
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
          boxShadow: "0 2px 5px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.5)",
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 18,
          border: `1px solid ${themeConfig.border}`,
          boxShadow: "0 10px 25px -5px rgba(12, 39, 59, 0.06), inset 0 1px 1px #FFFFFF",
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
        },
        head: {
          fontWeight: 800,
          color: themeConfig.textMain,
          backgroundColor: themeConfig.champagne,
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
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          backgroundColor: "#FFFFFF",
          boxShadow: "inset 0 1px 3px rgba(0, 0, 0, 0.02)",
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
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 22,
          boxShadow: "0 24px 48px -12px rgba(12, 39, 59, 0.22), 0 12px 24px -8px rgba(12, 39, 59, 0.1), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
          border: `1px solid ${themeConfig.border}`,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
          boxShadow: "0 12px 28px -6px rgba(12, 39, 59, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
          border: `1px solid ${themeConfig.border}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRadius: 0,
          backgroundColor: themeConfig.bgCard,
          borderRight: `1px solid ${themeConfig.border}`,
          borderTop: "none",
          borderBottom: "none",
          borderLeft: "none",
          boxShadow: "4px 0 24px rgba(12, 39, 59, 0.04)",
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          backgroundColor: "rgba(255, 255, 255, 0.95)",
          borderBottom: `1px solid ${themeConfig.border}`,
          borderTop: "none",
          borderLeft: "none",
          borderRight: "none",
          backdropFilter: "blur(12px)",
          boxShadow: "0 4px 20px -4px rgba(12, 39, 59, 0.04)",
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          borderRadius: "16px !important",
          border: `1px solid ${themeConfig.border}`,
          boxShadow: "0 4px 14px rgba(12, 39, 59, 0.04), inset 0 1px 0 #FFFFFF",
          "&:before": {
            display: "none",
          },
          marginBottom: "12px",
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 14,
          boxShadow: "0 4px 14px rgba(12, 39, 59, 0.06)",
        },
      },
    },
  },
});
