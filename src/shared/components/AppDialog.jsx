"use client";

import { Box, DialogTitle, DialogActions, IconButton, Typography } from "@mui/material";
import { Close } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";

export function dialogPaperSx(themeConfig, isDarkMode) {
  return {
    borderRadius: "16px",
    border: `1px solid ${themeConfig.border}`,
    bgcolor: themeConfig.bgElevated || themeConfig.bgCard || "#FFFFFF",
    boxShadow: isDarkMode ? themeConfig.shadowModal : "0 12px 32px rgba(15, 23, 42, 0.12)",
    overflowX: "hidden",
    overflowY: "auto",
    maxHeight: "90vh",
    p: 0,
    backgroundImage: "none",
  };
}

export function dialogFooterSx(themeConfig, isDarkMode) {
  return {
    px: 2.5,
    py: 1.75,
    gap: 1,
    borderTop: `1px solid ${themeConfig.border}`,
    bgcolor: isDarkMode ? themeConfig.bgSubtle : "#F8FAFC",
  };
}

export function dialogCancelButtonSx(themeConfig, isDarkMode) {
  return {
    minWidth: 104,
    height: 40,
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 700,
    color: themeConfig.textMain,
    borderColor: themeConfig.border,
    bgcolor: isDarkMode ? "transparent" : "#FFFFFF",
    "&:hover": {
      borderColor: isDarkMode ? themeConfig.borderHover : themeConfig.primary,
      bgcolor: isDarkMode ? themeConfig.champagne : "#F0FDFA",
    },
  };
}

export function dialogPrimaryButtonSx(themeConfig, accent, hover) {
  return {
    minWidth: 104,
    height: 40,
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 700,
    boxShadow: "none",
    px: 2.5,
    bgcolor: accent || themeConfig.primary,
    color: "#FFFFFF",
    "&:hover": { bgcolor: hover || themeConfig.primaryDark, boxShadow: "none" },
  };
}

export function dialogCloseButtonSx(themeConfig, isDarkMode) {
  return {
    width: 36,
    height: 36,
    borderRadius: "10px",
    flexShrink: 0,
    color: themeConfig.textMuted,
    bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF",
    border: `1px solid ${themeConfig.border}`,
    "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "#F8FAFC", color: themeConfig.textMain },
  };
}

export function AppDialogHeader({ eyebrow, title, icon, onClose, closeDisabled = false }) {
  const { themeConfig, isDarkMode } = useAppTheme();

  return (
    <DialogTitle component="div" sx={{ p: 0, m: 0, flexShrink: 0, bgcolor: "transparent", borderBottom: "none" }}>
      <Box
        sx={{
          px: 2.5,
          py: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
          bgcolor: isDarkMode ? themeConfig.bgSubtle : "#F0FDFA",
          borderBottom: `1px solid ${themeConfig.border}`,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          {icon ? (
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                color: themeConfig.primary,
                bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#FFFFFF",
                border: `1px solid ${themeConfig.border}`,
              }}
            >
              {icon}
            </Box>
          ) : null}
          <Box sx={{ minWidth: 0 }}>
            {eyebrow ? (
              <Typography sx={{ color: themeConfig.primary, fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", wordBreak: "break-all" }}>
                {eyebrow}
              </Typography>
            ) : null}
            <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "1.05rem", lineHeight: 1.3, wordBreak: "break-word" }}>
              {title}
            </Typography>
          </Box>
        </Box>
        {onClose ? (
          <IconButton onClick={onClose} disabled={closeDisabled} aria-label="Close" sx={dialogCloseButtonSx(themeConfig, isDarkMode)}>
            <Close fontSize="small" />
          </IconButton>
        ) : null}
      </Box>
    </DialogTitle>
  );
}

export function AppDialogFooter({ children, sx }) {
  const { themeConfig, isDarkMode } = useAppTheme();
  return <DialogActions sx={{ ...dialogFooterSx(themeConfig, isDarkMode), ...sx }}>{children}</DialogActions>;
}
