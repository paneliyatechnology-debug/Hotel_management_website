"use client";

import { Box, Card, CardContent, Typography } from "@mui/material";
import { TrendingUp, TrendingDown } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";

export default function StatCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  trendType = "up",
  color,
  badgeText,
  onClick,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const cardColor = color || themeConfig.primary;

  return (
    <Card
      onClick={onClick}
      sx={{
        borderRadius: "22px",
        height: "100%",
        minHeight: 180,
        display: "flex",
        flexDirection: "column",
        cursor: onClick ? "pointer" : "default",
        background: isDarkMode
          ? `linear-gradient(135deg, ${themeConfig.bgCard || "#162032"} 0%, #1A2638 100%)`
          : `linear-gradient(145deg, #FFFFFF 0%, #F8FAFC 100%)`,
        border: `1px solid ${isDarkMode ? "rgba(255, 255, 255, 0.08)" : themeConfig.border}`,
        boxShadow: isDarkMode
          ? "0 10px 30px -5px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.07)"
          : "0 10px 25px -5px rgba(12, 39, 59, 0.06), 0 4px 12px -2px rgba(12, 39, 59, 0.03), inset 0 1px 1px #FFFFFF",
        position: "relative",
        overflow: "hidden",
        boxSizing: "border-box",
        width: "100%",
        backdropFilter: "blur(12px)",
        transition: "all 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        "&::before": {
          content: '""',
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "4px",
          background: `linear-gradient(90deg, ${cardColor}, ${themeConfig.primaryLight || cardColor})`,
          opacity: 0.95,
        },
        "&:hover": {
          transform: onClick ? "translateY(-5px) scale(1.01)" : "translateY(-4px)",
          boxShadow: `0 18px 32px -8px rgba(12, 39, 59, 0.14), 0 0 0 1px ${cardColor}40`,
        },
      }}
    >
      <CardContent
        sx={{
          p: { xs: 2, sm: 2.2 },
          "&:last-child": { pb: { xs: 2, sm: 2.2 } },
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          flex: 1,
          height: "100%",
          boxSizing: "border-box",
        }}
      >
        {/* Top Area: Title & Icon Medallion */}
        <Box>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              minHeight: 40,
              gap: 1,
            }}
          >
            <Typography
              variant="caption"
              title={typeof title === "string" ? title : ""}
              sx={{
                fontWeight: 800,
                textTransform: "uppercase",
                color: themeConfig.textMuted,
                letterSpacing: 0.6,
                fontSize: "0.72rem",
                lineHeight: 1.25,
                height: 36,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
                flex: 1,
              }}
            >
              {title}
            </Typography>

            {/* 3D Icon Medallion */}
            <Box
              sx={{
                width: 38,
                height: 38,
                minWidth: 38,
                borderRadius: "12px",
                background: isDarkMode
                  ? `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, ${themeConfig.champagne} 100%)`
                  : `linear-gradient(135deg, #FFFFFF 0%, ${themeConfig.champagne} 100%)`,
                color: cardColor,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${themeConfig.border}`,
                boxShadow: isDarkMode
                  ? `0 4px 12px -2px ${cardColor}35`
                  : `0 4px 12px -2px ${cardColor}25, inset 0 1px 1px #FFFFFF`,
                flexShrink: 0,
                "& svg": {
                  fontSize: 20,
                },
              }}
            >
              {icon}
            </Box>
          </Box>

          {/* Metric Value */}
          <Typography
            variant="h4"
            sx={{
              fontWeight: 900,
              color: cardColor || themeConfig.textMain,
              height: 42,
              display: "flex",
              alignItems: "center",
              fontSize: { xs: "1.75rem", sm: "1.95rem" },
              lineHeight: 1,
              letterSpacing: -0.5,
              my: 0.5,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {value}
          </Typography>
        </Box>

        {/* Dotted Divider - Guaranteed Identical Horizontal Alignment */}
        <Box
          sx={{
            width: "100%",
            borderTop: `1.5px dashed ${themeConfig.border || "#E2E8F0"}`,
            my: 1.2,
            opacity: 0.85,
          }}
        />

        {/* Bottom Area: Subtitle & Badges in One Clean Single Line */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            minHeight: 24,
            gap: 1,
          }}
        >
          <Typography
            variant="caption"
            title={typeof subtitle === "string" ? subtitle : ""}
            sx={{
              color: themeConfig.textMuted,
              fontSize: "0.74rem",
              fontWeight: 600,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              flex: 1,
            }}
          >
            {subtitle || ""}
          </Typography>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.6, flexShrink: 0 }}>
            {trend && (
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 0.3,
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  px: 0.8,
                  py: 0.25,
                  borderRadius: "6px",
                  bgcolor: trendType === "up" ? `${themeConfig.success}15` : `${themeConfig.danger}15`,
                  color: trendType === "up" ? themeConfig.success : themeConfig.danger,
                  border: `1px solid ${trendType === "up" ? themeConfig.success : themeConfig.danger}30`,
                  whiteSpace: "nowrap",
                }}
              >
                {trendType === "up" ? <TrendingUp sx={{ fontSize: 12 }} /> : <TrendingDown sx={{ fontSize: 12 }} />}
                <span>{trend}</span>
              </Box>
            )}

            {badgeText && (
              <Box
                sx={{
                  fontSize: "0.68rem",
                  fontWeight: 800,
                  px: 0.9,
                  py: 0.25,
                  borderRadius: "6px",
                  background: isDarkMode
                    ? `linear-gradient(135deg, ${themeConfig.champagne} 0%, rgba(255,255,255,0.08) 100%)`
                    : `linear-gradient(135deg, ${themeConfig.champagne} 0%, #FFFFFF 100%)`,
                  color: isDarkMode ? "#FFFFFF" : themeConfig.primaryDark,
                  border: `1px solid ${themeConfig.border}`,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.04)",
                  whiteSpace: "nowrap",
                }}
              >
                {badgeText}
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}
