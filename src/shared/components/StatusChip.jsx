"use client";

import { Chip } from "@mui/material";
import { useAppTheme } from "@/shared/context/ThemeContext";

export default function StatusChip({ status, size = "small" }) {
  const { themeConfig } = useAppTheme();
  const norm = (status || "").toUpperCase();

  let bg = themeConfig.champagne;
  let color = themeConfig.textMain;
  let border = themeConfig.border;
  let label = status || "UNKNOWN";

  switch (norm) {
    case "ACTIVE":
      bg = themeConfig.successBg;
      color = themeConfig.success;
      border = "rgba(46, 125, 50, 0.4)";
      label = "ACTIVE";
      break;
    case "PENDING_APPROVAL":
    case "PENDING":
      bg = themeConfig.warningBg;
      color = themeConfig.warning;
      border = "rgba(217, 119, 6, 0.4)";
      label = "PENDING REVIEW";
      break;
    case "TRIAL":
      bg = themeConfig.infoBg;
      color = themeConfig.info;
      border = "rgba(51, 104, 160, 0.4)";
      label = "30-DAY TRIAL";
      break;
    case "EXPIRED":
      bg = themeConfig.dangerBg;
      color = themeConfig.danger;
      border = "rgba(220, 38, 38, 0.4)";
      label = "TRIAL EXPIRED";
      break;
    case "DISABLED":
    case "SUSPENDED":
      bg = themeConfig.dangerBg;
      color = themeConfig.danger;
      border = "rgba(220, 38, 38, 0.4)";
      label = "DISABLED";
      break;
    case "REJECTED":
      bg = "rgba(117, 109, 100, 0.15)";
      color = themeConfig.textMuted;
      border = themeConfig.border;
      label = "REJECTED";
      break;

    case "AVAILABLE":
      bg = themeConfig.successBg;
      color = themeConfig.success;
      border = "rgba(46, 125, 50, 0.4)";
      label = "AVAILABLE";
      break;
    case "OCCUPIED":
      bg = themeConfig.infoBg;
      color = themeConfig.info;
      border = "rgba(51, 104, 160, 0.4)";
      label = "OCCUPIED";
      break;
    case "RESERVED":
      bg = themeConfig.warningBg;
      color = themeConfig.warning;
      border = "rgba(217, 119, 6, 0.4)";
      label = "RESERVED";
      break;
    case "CLEANING":
      bg = themeConfig.cleaningBg;
      color = themeConfig.cleaning;
      border = "rgba(8, 145, 178, 0.4)";
      label = "HOUSEKEEPING";
      break;
    case "MAINTENANCE":
      bg = themeConfig.dangerBg;
      color = themeConfig.danger;
      border = "rgba(220, 38, 38, 0.4)";
      label = "MAINTENANCE";
      break;
    case "BLOCKED":
      bg = "rgba(117, 109, 100, 0.15)";
      color = themeConfig.textMuted;
      border = themeConfig.border;
      label = "BLOCKED";
      break;

    case "CHECKED_IN":
      bg = themeConfig.infoBg;
      color = themeConfig.info;
      border = "rgba(51, 104, 160, 0.4)";
      label = "IN-HOUSE";
      break;
    case "CHECKED_OUT":
      bg = themeConfig.champagne;
      color = themeConfig.textMuted;
      border = themeConfig.border;
      label = "DEPARTED";
      break;
    case "CANCELLED":
      bg = themeConfig.dangerBg;
      color = themeConfig.danger;
      border = "rgba(220, 38, 38, 0.4)";
      label = "CANCELLED";
      break;

    case "PAID":
      bg = themeConfig.successBg;
      color = themeConfig.success;
      border = "rgba(46, 125, 50, 0.4)";
      label = "PAID";
      break;
    case "PARTIALLY_PAID":
      bg = themeConfig.warningBg;
      color = themeConfig.warning;
      border = "rgba(217, 119, 6, 0.4)";
      label = "PARTIAL";
      break;
    case "UNPAID":
      bg = themeConfig.dangerBg;
      color = themeConfig.danger;
      border = "rgba(220, 38, 38, 0.4)";
      label = "PENDING";
      break;
    case "VERIFIED":
      bg = themeConfig.successBg;
      color = themeConfig.success;
      border = "rgba(46, 125, 50, 0.4)";
      label = "VERIFIED ✓";
      break;

    default:
      label = status;
      break;
  }

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        bgcolor: bg,
        color: color,
        border: `1px solid ${border}`,
        fontWeight: 800,
        fontSize: size === "small" ? "0.72rem" : "0.8rem",
        height: size === "small" ? 22 : 28,
        borderRadius: "8px",
        boxShadow: "0 2px 5px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,0.6)",
        letterSpacing: "0.03em",
      }}
    />
  );
}
