"use client";

import React, { isValidElement } from "react";
import { Box, Typography, Button } from "@mui/material";
import { InboxOutlined } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";

export default function EmptyState({
  icon: Icon = InboxOutlined,
  title = "No Records Found",
  description = "There are no items matching your criteria at this moment.",
  actionLabel,
  actionText,
  onAction,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const label = actionLabel || actionText;

  return (
    <Box
      sx={{
        py: 8,
        px: 3,
        textAlign: "center",
        bgcolor: themeConfig.bgCard,
        borderRadius: "18px",
        border: `1px solid ${themeConfig.border}`,
        boxShadow: isDarkMode
          ? "0 10px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
          : "0 10px 25px -5px rgba(12, 39, 59, 0.05), inset 0 1px 1px rgba(255, 255, 255, 0.9)",
      }}
    >
      <Box
        sx={{
          width: 58,
          height: 58,
          borderRadius: "16px",
          background: isDarkMode
            ? `linear-gradient(135deg, ${themeConfig.bgCard} 0%, ${themeConfig.champagne || "rgba(255,255,255,0.05)"} 100%)`
            : `linear-gradient(135deg, #FFFFFF 0%, ${themeConfig.champagne} 100%)`,
          color: themeConfig.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          mx: "auto",
          mb: 2,
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode
            ? `0 6px 16px -2px ${themeConfig.primaryGlow}`
            : `0 6px 16px -2px ${themeConfig.primaryGlow}, inset 0 1px 1px #FFFFFF`,
        }}
      >
        {isValidElement(Icon) ? (
          Icon
        ) : typeof Icon === "function" || typeof Icon === "object" ? (
          <Icon sx={{ fontSize: 28 }} />
        ) : (
          <InboxOutlined sx={{ fontSize: 28 }} />
        )}
      </Box>

      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.5 }}>
        {title}
      </Typography>

      <Typography variant="body2" sx={{ color: themeConfig.textMuted, maxWidth: 400, mx: "auto", mb: label ? 2.5 : 0 }}>
        {description}
      </Typography>

      {label && onAction && (
        <Button
          variant="contained"
          onClick={onAction}
          sx={{
            background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
            borderRadius: "12px",
            fontWeight: 700,
            boxShadow: `0 4px 14px ${themeConfig.primaryGlow}`,
            "&:hover": {
              background: `linear-gradient(135deg, ${themeConfig.primaryDark} 0%, ${themeConfig.primary} 100%)`,
              transform: "translateY(-1.5px)",
            },
          }}
        >
          {label}
        </Button>
      )}
    </Box>
  );
}
