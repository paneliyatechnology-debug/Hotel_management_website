"use client";

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from "react";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { ToastContainer } from "react-toastify";
import { themePalettes, darkThemePalettes, getThemeConfig, getThemeCssVars } from "@/config/theme";

const ThemeContext = createContext(null);

export function buildMuiTheme(themeConfig, mode = "light") {
  const isDark = mode === "dark";
  const surface = themeConfig.bgCard || (isDark ? "#191F1B" : "#FFFFFF");
  const elevated = themeConfig.bgElevated || surface;
  const accent = themeConfig.accent || themeConfig.primaryDark;
  const tones = themeConfig.tones || {};
  // Dark surfaces separate with a hairline border + soft drop shadow (no glow / inset highlights)
  const shadowSm = isDark ? "0 1px 2px rgba(0, 0, 0, 0.35)" : "0 4px 20px -2px rgba(32, 41, 35, 0.05), inset 0 1px 0 rgba(255, 255, 255, 0.9)";
  const shadowMd = isDark ? themeConfig.shadowCard : "0 10px 25px -5px rgba(32, 41, 35, 0.06), 0 4px 10px -4px rgba(32, 41, 35, 0.03), inset 0 1px 1px rgba(255, 255, 255, 0.95)";
  const shadowLg = isDark ? "0 16px 36px -8px rgba(0, 0, 0, 0.6)" : "0 18px 36px -6px rgba(32, 41, 35, 0.12), inset 0 1px 2px rgba(255, 255, 255, 1)";
  const alertTone = (tone) => (isDark && tones[tone]
    ? {
        backgroundColor: tones[tone].bg,
        color: tones[tone].color,
        border: `1px solid ${tones[tone].border}`,
        boxShadow: "none",
        "& .MuiAlert-icon": { color: tones[tone].color },
      }
    : {});

  return createTheme({
    palette: {
      mode: isDark ? "dark" : "light",
      primary: {
        main: themeConfig.primary,
        dark: themeConfig.primaryDark,
        light: themeConfig.primaryLight,
        contrastText: themeConfig.onPrimary || "#FFFFFF",
      },
      secondary: {
        main: themeConfig.champagne || themeConfig.border,
        contrastText: themeConfig.textMain,
      },
      background: {
        default: themeConfig.bgMain,
        paper: surface,
      },
      ...(isDark
        ? {
            action: {
              active: themeConfig.textMuted,
              hover: "rgba(255, 255, 255, 0.05)",
              selected: "rgba(52, 211, 153, 0.14)",
              disabled: "rgba(255, 255, 255, 0.3)",
              disabledBackground: "rgba(255, 255, 255, 0.08)",
              focus: "rgba(52, 211, 153, 0.18)",
            },
          }
        : {}),
      text: {
        primary: themeConfig.textMain,
        secondary: themeConfig.textMuted,
      },
      divider: themeConfig.border,
      success: {
        main: themeConfig.success,
        contrastText: isDark ? "#101412" : "#FFFFFF",
      },
      warning: {
        main: themeConfig.warning,
        contrastText: isDark ? "#101412" : "#FFFFFF",
      },
      error: {
        main: themeConfig.danger,
        contrastText: isDark ? "#101412" : "#FFFFFF",
      },
      info: {
        main: themeConfig.info,
        contrastText: isDark ? "#101412" : "#FFFFFF",
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
      MuiTextField: {
        defaultProps: {
          autoComplete: "off",
        },
      },
      MuiInputBase: {
        defaultProps: {
          autoComplete: "off",
        },
      },
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: themeConfig.bgMain,
            color: themeConfig.textMain,
            WebkitFontSmoothing: "antialiased",
            MozOsxFontSmoothing: "grayscale",
            colorScheme: isDark ? "dark" : "light",
          },
          "::selection": {
            backgroundColor: isDark ? "rgba(52, 211, 153, 0.32)" : "rgba(4, 120, 87, 0.18)",
          },
          // Browsers autofill with a bright yellow/white fill - keep it on-theme in both modes
          "input:-webkit-autofill, input:-webkit-autofill:hover, input:-webkit-autofill:focus, textarea:-webkit-autofill, select:-webkit-autofill": {
            WebkitTextFillColor: themeConfig.textMain,
            caretColor: themeConfig.textMain,
            transition: "background-color 9999s ease-in-out 0s",
            WebkitBoxShadow: `0 0 0 100px ${themeConfig.bgInput || (isDark ? "#141A16" : "#FFFFFF")} inset`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: "none",
            borderRadius: 18,
            border: `1px solid ${themeConfig.border}`,
            backgroundColor: surface,
            boxShadow: shadowMd,
          },
          elevation0: {
            boxShadow: "none",
            border: `1px solid ${themeConfig.border}`,
          },
          elevation1: {
            boxShadow: shadowSm,
          },
          elevation2: {
            boxShadow: isDark
              ? "0 8px 24px -8px rgba(0, 0, 0, 0.55)"
              : "0 10px 25px -5px rgba(32, 41, 35, 0.08), 0 8px 10px -6px rgba(32, 41, 35, 0.04), inset 0 1px 1px rgba(255, 255, 255, 0.95)",
          },
          elevation3: {
            boxShadow: shadowLg,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            backgroundColor: surface,
            border: `1px solid ${themeConfig.border}`,
            borderRadius: 20,
            boxShadow: shadowMd,
            position: "relative",
            transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            "&:hover": {
              boxShadow: isDark
                ? themeConfig.shadowHover
                : "0 16px 32px -6px rgba(32, 41, 35, 0.1), 0 8px 16px -4px rgba(32, 41, 35, 0.04), inset 0 1px 2px #FFFFFF",
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
              ? "none"
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
              color: isDark ? (themeConfig.onPrimary || "#FFFFFF") : themeConfig.primaryDark,
              backgroundColor: isDark ? themeConfig.primary : "#FFFFFF",
              boxShadow: isDark
                ? "0 2px 8px rgba(0, 0, 0, 0.35)"
                : "0 4px 12px rgba(32, 41, 35, 0.08), inset 0 1px 0 #FFFFFF",
            },
            "&:hover": {
              color: themeConfig.textMain,
              backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.5)",
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
            boxShadow: isDark ? "none" : "0 2px 6px rgba(0,0,0,0.04)",
            "&:hover": {
              transform: "translateY(-1.5px)",
            },
            "&:active": {
              transform: "translateY(0.5px)",
            },
          },
          // Dark mode uses flat solid fills (no gradients / glows); light mode keeps the gradient look
          containedPrimary: {
            background: isDark
              ? themeConfig.primary
              : `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
            color: themeConfig.onPrimary || "#FFFFFF",
            boxShadow: isDark ? "0 1px 2px rgba(0, 0, 0, 0.4)" : `0 4px 14px -2px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255, 255, 255, 0.35)`,
            "&:hover": {
              background: isDark
                ? themeConfig.primaryDark
                : `linear-gradient(135deg, ${themeConfig.primaryDark} 0%, ${themeConfig.primary} 100%)`,
              boxShadow: isDark ? "0 4px 12px -2px rgba(0, 0, 0, 0.5)" : `0 8px 20px -2px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255, 255, 255, 0.45)`,
            },
            "&.Mui-disabled": {
              background: isDark ? "rgba(255, 255, 255, 0.08)" : "#E6ECE8",
              color: isDark ? "rgba(255, 255, 255, 0.32)" : "#9AA69E",
              boxShadow: "none",
            },
          },
          containedSuccess: {
            background: isDark ? themeConfig.success : `linear-gradient(135deg, ${themeConfig.success} 0%, #065F46 100%)`,
            color: isDark ? "#101412" : "#FFFFFF",
            boxShadow: isDark ? "0 1px 2px rgba(0, 0, 0, 0.4)" : "0 4px 14px -2px rgba(22, 163, 74, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
          },
          containedError: {
            background: isDark ? themeConfig.danger : `linear-gradient(135deg, ${themeConfig.danger} 0%, #912018 100%)`,
            color: isDark ? "#101412" : "#FFFFFF",
            boxShadow: isDark ? "0 1px 2px rgba(0, 0, 0, 0.4)" : "0 4px 14px -2px rgba(220, 38, 38, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.35)",
          },
          outlined: {
            borderColor: themeConfig.border,
            color: themeConfig.textMain,
            backgroundColor: isDark ? "rgba(255,255,255,0.03)" : "#FFFFFF",
            boxShadow: isDark ? "none" : "0 2px 4px rgba(0,0,0,0.02)",
            "&:hover": {
              borderColor: isDark ? themeConfig.borderHover : themeConfig.primary,
              backgroundColor: themeConfig.champagne || "rgba(255,255,255,0.06)",
              boxShadow: isDark ? "none" : `0 4px 12px ${themeConfig.primaryGlow}`,
            },
            "&.Mui-disabled": {
              borderColor: themeConfig.borderLight || themeConfig.border,
              color: isDark ? "rgba(255, 255, 255, 0.28)" : undefined,
            },
          },
          ...(isDark
            ? {
                // MUI's default dark "primary" text/outlined colour is too dim on dark surfaces - use the mint accent
                textPrimary: { color: accent, "&:hover": { backgroundColor: themeConfig.champagne } },
                outlinedPrimary: { color: accent, borderColor: "rgba(52, 211, 153, 0.4)" },
              }
            : {}),
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            fontWeight: 800,
            borderRadius: 8,
            fontSize: "0.75rem",
            boxShadow: isDark ? "none" : "0 2px 5px rgba(0,0,0,0.04)",
          },
        },
      },
      MuiTableContainer: {
        styleOverrides: {
          root: {
            borderRadius: 18,
            border: `1px solid ${themeConfig.border}`,
            backgroundColor: surface,
            boxShadow: isDark ? themeConfig.shadowCard : "0 10px 25px -5px rgba(32, 41, 35, 0.06), inset 0 1px 1px #FFFFFF",
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
            fontWeight: "700 !important",
            fontSize: "0.72rem !important",
            letterSpacing: "0.06em !important",
            textTransform: "uppercase !important",
            color: `${accent || "#047857"} !important`,
            backgroundColor: `${isDark ? themeConfig.bgSubtle : (themeConfig.champagne || "#EDF5EF")} !important`,
            borderBottom: `1px solid ${themeConfig.border} !important`,
            whiteSpace: "nowrap",
            paddingTop: "14px !important",
            paddingBottom: "14px !important",
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            transition: "background-color 0.15s ease",
            "&:hover": {
              backgroundColor: `${themeConfig.champagne} !important`,
            },
          },
        },
      },
      MuiTablePagination: {
        styleOverrides: {
          root: {
            color: themeConfig.textMain,
            backgroundColor: "transparent",
            borderTop: "none",
          },
          toolbar: {
            minHeight: 52,
            flexWrap: "wrap",
            justifyContent: "flex-end",
            gap: 8,
            paddingLeft: 16,
            paddingRight: 16,
          },
          selectLabel: {
            color: themeConfig.textMuted,
            fontWeight: 700,
            fontSize: "0.875rem",
            margin: 0,
          },
          displayedRows: {
            color: themeConfig.textMuted,
            fontWeight: 700,
            fontSize: "0.875rem",
            margin: 0,
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
      // Field labels sit above the input (not floating inside the border)
      MuiFormControl: {
        styleOverrides: {
          root: {
            "& label[data-shrink=false] + .MuiInputBase-formControl .MuiInputBase-input::placeholder": {
              opacity: "0.5 !important",
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
            "&&.MuiInputLabel-outlined": {
              position: "static",
              transform: "none",
              display: "block",
              maxWidth: "100%",
              overflow: "visible",
              whiteSpace: "normal",
              fontSize: "0.78rem",
              lineHeight: 1.4,
              marginBottom: 6,
              pointerEvents: "auto",
            },
            "& .MuiInputLabel-asterisk": {
              color: isDark ? "#F87171" : themeConfig.tones.danger.color,
            },
            "&&.Mui-error": {
              color: themeConfig.textMuted,
            },
          },
        },
      },
      MuiFormHelperText: {
        styleOverrides: {
          root: {
            marginLeft: 2,
            marginRight: 2,
            fontSize: "0.72rem",
          },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: {
            // Label is rendered above the field, so the outline needs no notch
            "& legend": {
              display: "none",
            },
            borderRadius: 12,
            backgroundColor: themeConfig.bgInput || (isDark ? "rgba(255,255,255,0.045)" : "#FFFFFF"),
            color: themeConfig.textMain,
            boxShadow: isDark ? "none" : "inset 0 1px 3px rgba(0, 0, 0, 0.02)",
            transition: "all 0.2s ease",
            "& fieldset": {
              top: 0,
              borderColor: themeConfig.border,
            },
            "&:hover fieldset": {
              borderColor: isDark ? themeConfig.borderHover : themeConfig.primary,
            },
            "&.Mui-error fieldset": {
              borderColor: themeConfig.danger,
            },
            "&.Mui-disabled": {
              backgroundColor: themeConfig.bgSubtle,
              "& fieldset": { borderColor: themeConfig.borderLight || themeConfig.border },
            },
            "& .MuiInputBase-input.Mui-disabled": {
              WebkitTextFillColor: themeConfig.textMuted,
            },
            "& .MuiInputBase-input::placeholder": {
              color: themeConfig.textMuted,
              opacity: isDark ? 0.6 : 0.7,
            },
            // Native date / time pickers: dark popup + readable indicator icon
            "& input[type='date'], & input[type='time'], & input[type='datetime-local'], & input[type='month']": {
              colorScheme: isDark ? "dark" : "light",
            },
            "&.Mui-focused": {
              boxShadow: `0 0 0 3px ${themeConfig.primaryGlow}`,
            },
            "&.Mui-focused fieldset": {
              borderColor: isDark ? themeConfig.primaryLight : themeConfig.primary,
              borderWidth: "1.5px",
            },
            "&.Mui-focused.Mui-error fieldset": {
              borderColor: themeConfig.danger,
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
              backgroundColor: themeConfig.champagne || (isDark ? "rgba(52, 211, 153, 0.12)" : "rgba(4, 120, 87, 0.08)"),
            },
            "&.Mui-selected": {
              backgroundColor: `${themeConfig.primaryGlow} !important`,
              color: accent,
              fontWeight: 800,
            },
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          root: isDark ? { "& .MuiBackdrop-root:not(.MuiBackdrop-invisible)": { backgroundColor: themeConfig.overlay, backdropFilter: "blur(2px)" } } : {},
          paper: {
            borderRadius: 16,
            overflowX: "hidden",
            overflowY: "auto",
            maxHeight: "90vh",
            backgroundImage: "none",
            backgroundColor: elevated,
            boxShadow: isDark ? themeConfig.shadowModal : "0 12px 32px rgba(32, 41, 35, 0.14)",
            border: `1px solid ${themeConfig.border}`,
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            padding: "16px 20px",
            fontWeight: 700,
            fontSize: "1.05rem",
            lineHeight: 1.3,
            color: themeConfig.textMain,
            backgroundColor: themeConfig.bgSoft,
            borderBottom: `1px solid ${themeConfig.border}`,
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            padding: "24px",
            overflowY: "auto",
            // MUI removes the top padding when content follows a title; keep breathing room under the header
            "&&": {
              paddingTop: 24,
            },
          },
          dividers: {
            borderTop: "none",
            borderBottom: "none",
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            padding: "14px 20px",
            gap: 8,
            backgroundColor: themeConfig.bgSubtle,
            borderTop: `1px solid ${themeConfig.border}`,
            "& .MuiButton-root": {
              minHeight: 40,
              borderRadius: 10,
              textTransform: "none",
              fontWeight: 700,
              boxShadow: "none",
            },
          },
        },
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            borderRadius: 16,
            backgroundColor: elevated,
            boxShadow: isDark
              ? "0 12px 28px -6px rgba(0, 0, 0, 0.65)"
              : "0 12px 28px -6px rgba(32, 41, 35, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.9)",
            border: `1px solid ${themeConfig.border}`,
          },
        },
      },
      // Popovers, autocomplete lists and other floating panels share the elevated surface
      MuiPopover: {
        styleOverrides: {
          paper: {
            backgroundColor: elevated,
            border: `1px solid ${themeConfig.border}`,
            boxShadow: isDark ? "0 12px 28px -6px rgba(0, 0, 0, 0.65)" : "0 12px 28px -6px rgba(32, 41, 35, 0.18)",
          },
        },
      },
      MuiAutocomplete: {
        styleOverrides: {
          paper: {
            backgroundColor: elevated,
            border: `1px solid ${themeConfig.border}`,
            boxShadow: isDark ? "0 12px 28px -6px rgba(0, 0, 0, 0.65)" : "0 12px 28px -6px rgba(32, 41, 35, 0.18)",
          },
          listbox: { padding: 4 },
          option: {
            borderRadius: 8,
            '&[aria-selected="true"]': { backgroundColor: `${themeConfig.primaryGlow} !important` },
            "&.Mui-focused": { backgroundColor: `${themeConfig.champagne} !important` },
          },
          noOptions: { color: themeConfig.textMuted },
          loading: { color: themeConfig.textMuted },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: isDark
            ? {
                backgroundColor: "#262F29",
                color: themeConfig.textMain,
                border: `1px solid ${themeConfig.border}`,
                boxShadow: "0 8px 20px rgba(0, 0, 0, 0.5)",
                fontWeight: 600,
              }
            : {},
          arrow: isDark ? { color: "#262F29", "&:before": { border: `1px solid ${themeConfig.border}` } } : {},
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            textTransform: "none",
            fontWeight: 700,
            color: themeConfig.textMuted,
            borderColor: themeConfig.border,
            "&.Mui-selected": {
              color: accent,
              backgroundColor: themeConfig.champagne,
              "&:hover": { backgroundColor: themeConfig.primaryGlow },
            },
          },
        },
      },
      MuiSkeleton: {
        styleOverrides: {
          root: { backgroundColor: isDark ? "rgba(255, 255, 255, 0.07)" : undefined },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRadius: 0,
            backgroundColor: themeConfig.bgHeader || surface,
            borderRight: `1px solid ${themeConfig.border}`,
            borderTop: "none",
            borderBottom: "none",
            borderLeft: "none",
            boxShadow: isDark
              ? "4px 0 24px rgba(0, 0, 0, 0.4)"
              : "4px 0 24px rgba(32, 41, 35, 0.04)",
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderRadius: 0,
            backgroundColor: themeConfig.bgHeader || (isDark ? "#141A16" : "#FFFFFF"),
            borderBottom: `1px solid ${themeConfig.border}`,
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            backdropFilter: "blur(14px)",
            boxShadow: isDark
              ? "0 4px 20px -4px rgba(0, 0, 0, 0.5)"
              : "0 4px 20px -4px rgba(32, 41, 35, 0.04)",
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            borderRadius: "16px !important",
            border: `1px solid ${themeConfig.border}`,
            backgroundColor: surface,
            boxShadow: isDark
              ? shadowSm
              : "0 4px 14px rgba(32, 41, 35, 0.04), inset 0 1px 0 #FFFFFF",
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
            boxShadow: isDark ? "none" : "0 4px 14px rgba(0, 0, 0, 0.1)",
          },
          standardSuccess: alertTone("success"),
          standardWarning: alertTone("warning"),
          standardError: alertTone("danger"),
          standardInfo: alertTone("info"),
        },
      },
    },
  });
}

function readSavedMode() {
  if (typeof window === "undefined") return "light";
  try {
    return localStorage.getItem("admin_theme_mode") === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

export function AppThemeProvider({ children }) {
  const [paletteKey, setPaletteKeyInternal] = useState("palette1");
  // Provider only mounts client-side, so the saved mode can seed the first render (no light flash on reload)
  const [mode, setModeInternal] = useState(readSavedMode);
  const [settings, setSettingsInternal] = useState({
    autoRefresh: true,
    compactMode: false,
    notificationsEnabled: true,
    soundAlerts: true,
  });

  const applyDomStyles = useCallback((pal, currentMode) => {
    if (typeof window !== "undefined" && pal) {
      Object.entries(getThemeCssVars(pal)).forEach(([name, value]) => document.documentElement.style.setProperty(name, value));
      document.documentElement.setAttribute("data-theme-mode", currentMode);
      document.documentElement.classList.remove("light-theme", "dark-theme");
      document.documentElement.classList.add(`${currentMode}-theme`);

      if (document.body) {
        document.body.style.backgroundColor = pal.bgMain;
        document.body.style.color = pal.textMain;
        document.body.style.colorScheme = currentMode;
      }
      document.documentElement.style.colorScheme = currentMode;
    }
  }, []);

  // Leaving the themed app (e.g. to the public marketing pages) must not leave dark-mode styles behind
  useEffect(() => {
    return () => {
      if (typeof document === "undefined") return;
      const light = getThemeConfig("palette1", "light");
      const root = document.documentElement;
      root.classList.remove("dark-theme", "light-theme");
      root.removeAttribute("data-theme-mode");
      root.style.colorScheme = "";
      // Restore the light defaults the root layout renders for public pages
      Object.entries(getThemeCssVars(light)).forEach(([name, value]) => root.style.setProperty(name, value));
      if (document.body) {
        document.body.style.backgroundColor = light.bgMain;
        document.body.style.color = light.textMain;
        document.body.style.colorScheme = "";
      }
    };
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
          theme={isDarkMode ? "dark" : "light"}
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
