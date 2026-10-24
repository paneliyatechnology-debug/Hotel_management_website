"use client";

import { Box, Chip, Tooltip } from "@mui/material";
import { useAppTheme } from "@/shared/context/ThemeContext";

const DEFAULT_MAX_VISIBLE = 3;

/**
 * Normalize any room field into a clean list of room number strings.
 * Accepts: "101, 102", "Room #101", ["101","102"], [{room_number}], etc.
 */
export function parseRoomNumbers(value) {
  if (value === undefined || value === null || value === "") return [];

  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (item === undefined || item === null || item === "") return "";
        if (typeof item === "object") {
          return String(item.room_number || item.roomNumber || item.number || item.id || item._id || "").trim();
        }
        return String(item).trim();
      })
      .map((s) => s.replace(/^Room\s*#?\s*/i, "").trim())
      .filter(Boolean);
  }

  return String(value)
    .split(/[,|/]+/)
    .map((part) => part.replace(/^Room\s*#?\s*/i, "").trim())
    .filter(Boolean)
    .filter((part) => part !== "-" && part !== "—");
}

/**
 * Professional room column UI:
 * - up to 3 mint room chips
 * - then a dark "+N more" chip when there are additional rooms
 */
export default function RoomNumberChips({
  rooms,
  maxVisible = DEFAULT_MAX_VISIBLE,
  emptyLabel = "—",
  size = "small",
  sx,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const list = parseRoomNumbers(rooms);

  if (list.length === 0) {
    return (
      <Box component="span" sx={{ color: themeConfig.textMuted, fontWeight: 700, fontSize: "0.82rem", ...sx }}>
        {emptyLabel}
      </Box>
    );
  }

  const visible = list.slice(0, Math.max(1, maxVisible));
  const hidden = list.slice(visible.length);
  const moreCount = hidden.length;

  const roomChipSx = {
    height: size === "small" ? 26 : 30,
    borderRadius: "10px",
    fontWeight: 800,
    fontSize: size === "small" ? "0.75rem" : "0.8rem",
    bgcolor: isDarkMode ? "rgba(16, 185, 129, 0.16)" : (themeConfig.champagne || "rgba(16, 185, 129, 0.12)"),
    color: themeConfig.accent || themeConfig.primaryDark || "#0F766E",
    border: `1px solid ${isDarkMode ? "rgba(16, 185, 129, 0.28)" : (themeConfig.border || "rgba(15, 118, 110, 0.18)")}`,
    "& .MuiChip-label": { px: 1.1 },
  };

  const moreChipSx = {
    height: size === "small" ? 26 : 30,
    borderRadius: "10px",
    fontWeight: 800,
    fontSize: size === "small" ? "0.72rem" : "0.78rem",
    bgcolor: isDarkMode ? "#1F2937" : "#1F2937",
    color: "#FFFFFF",
    border: `1px solid ${isDarkMode ? "rgba(255,255,255,0.18)" : "rgba(148, 163, 184, 0.55)"}`,
    "& .MuiChip-label": { px: 1.15 },
  };

  return (
    <Box
      sx={{
        display: "inline-flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: 0.75,
        maxWidth: "100%",
        ...sx,
      }}
    >
      {visible.map((room) => (
        <Chip key={room} label={room} size="small" sx={roomChipSx} />
      ))}
      {moreCount > 0 ? (
        <Tooltip title={hidden.map((r) => `#${r}`).join(", ")} arrow>
          <Chip label={`+${moreCount} more`} size="small" sx={moreChipSx} />
        </Tooltip>
      ) : null}
    </Box>
  );
}
