"use client";

import { IconButton, Tooltip } from "@mui/material";
import { DarkMode, LightMode } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";

// Compact light/dark switch for screens without the dashboard sidebar (e.g. login).
export default function ThemeModeToggle({ sx }) {
  const { themeConfig, isDarkMode, toggleThemeMode } = useAppTheme();
  const label = isDarkMode ? "Switch to light mode" : "Switch to dark mode";

  return (
    <Tooltip title={label}>
      <IconButton
        onClick={toggleThemeMode}
        aria-label={label}
        sx={{
          width: 40,
          height: 40,
          color: themeConfig.accent,
          bgcolor: themeConfig.bgCard,
          border: `1px solid ${themeConfig.border}`,
          boxShadow: themeConfig.shadowCard,
          "&:hover": { bgcolor: themeConfig.champagne, transform: "none" },
          ...sx,
        }}
      >
        {isDarkMode ? <LightMode fontSize="small" /> : <DarkMode fontSize="small" />}
      </IconButton>
    </Tooltip>
  );
}
