"use client";

import { Box, CircularProgress, Typography, Skeleton } from "@mui/material";
import { useAppTheme } from "@/shared/context/ThemeContext";

export default function LoadingState({ message = "Loading live data...", type = "spinner" }) {
  const { themeConfig } = useAppTheme();

  if (type === "skeleton") {
    return (
      <Box sx={{ width: "100%", p: 2 }}>
        <Skeleton variant="rounded" height={60} sx={{ mb: 2, borderRadius: 0, bgcolor: themeConfig.champagne }} />
        <Skeleton variant="rounded" height={180} sx={{ mb: 2, borderRadius: 0, bgcolor: themeConfig.champagne }} />
        <Skeleton variant="rounded" height={180} sx={{ borderRadius: 0, bgcolor: themeConfig.champagne }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        py: 10,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
      }}
    >
      <CircularProgress size={42} thickness={4} sx={{ color: themeConfig.primary }} />
      {message && (
        <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontWeight: 600 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}
