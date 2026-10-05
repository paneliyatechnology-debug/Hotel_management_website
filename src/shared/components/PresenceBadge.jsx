"use client";

import React from "react";
import { Box, Typography } from "@mui/material";

export default function PresenceBadge({
  isOnline = false,
  showLabel = true,
  size = "small",
  sx = {},
}) {
  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.8,
        ...sx,
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: size === "small" ? 9 : 12,
          height: size === "small" ? 9 : 12,
          borderRadius: "50%",
          bgcolor: isOnline ? "#10B981" : "#94A3B8",
          boxShadow: isOnline ? "0 0 8px #10B981" : "none",
          flexShrink: 0,
          "&::after": isOnline
            ? {
                content: '""',
                position: "absolute",
                top: -2,
                left: -2,
                right: -2,
                bottom: -2,
                borderRadius: "50%",
                border: "2px solid #10B981",
                animation: "presencePulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }
            : {},
          "@keyframes presencePulse": {
            "0%": {
              transform: "scale(0.95)",
              opacity: 1,
            },
            "50%": {
              transform: "scale(1.8)",
              opacity: 0,
            },
            "100%": {
              transform: "scale(0.95)",
              opacity: 0,
            },
          },
        }}
      />
      {showLabel && (
        <Typography
          variant="caption"
          sx={{
            fontWeight: 800,
            fontSize: size === "small" ? "0.72rem" : "0.82rem",
            color: isOnline ? "#059669" : "#64748B",
            letterSpacing: 0.2,
          }}
        >
          {isOnline ? "Online" : "Offline"}
        </Typography>
      )}
    </Box>
  );
}
