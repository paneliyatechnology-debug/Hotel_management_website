"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  Grid,
  Button,
  ButtonGroup,
  Tooltip,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  TrendingUp,
  AccountBalanceWallet,
  Speed,
  AccessTime,
  Hotel as HotelIcon,
  AutoAwesome,
  Circle,
  Payments,
  CurrencyRupee,
  CheckCircle,
  Schedule,
  Edit,
  Close,
  RestartAlt,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { toast } from "@/shared/utils/toast";

/**
 * 1. OCCUPANCY RADIAL DONUT CHART (Custom High-End SVG)
 */
export function OccupancyDonutChart({ rooms = [] }) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [hoveredSegment, setHoveredSegment] = useState(null);

  const total = rooms.length || 1;
  const occupied = rooms.filter((r) => r.status === "OCCUPIED").length;
  const available = rooms.filter((r) => r.status === "AVAILABLE").length;
  const cleaning = rooms.filter((r) => r.status === "CLEANING").length;
  const maintenance = rooms.filter((r) => r.status === "MAINTENANCE" || r.status === "BLOCKED").length;

  const occRate = Math.round((occupied / total) * 100);

  const segments = [
    { label: "Occupied", count: occupied, color: "#3B82F6", grad: "url(#donutOccupied)", desc: "Currently in room" },
    { label: "Available", count: available, color: "#10B981", grad: "url(#donutAvailable)", desc: "Ready for check-in" },
    { label: "Cleaning", count: cleaning, color: "#F59E0B", grad: "url(#donutCleaning)", desc: "In turnaround" },
    { label: "Maintenance", count: maintenance, color: "#EF4444", grad: "url(#donutMaint)", desc: "Blocked / Repair" },
  ];

  // Calculate SVG arc paths
  const size = 175;
  const strokeWidth = 20;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let accumulatedOffset = 0;
  const arcs = segments.map((seg) => {
    const strokeDash = (seg.count / total) * circumference;
    const offset = accumulatedOffset;
    accumulatedOffset += strokeDash;
    return {
      ...seg,
      strokeDasharray: `${strokeDash} ${circumference - strokeDash}`,
      strokeDashoffset: -offset,
      percent: Math.round((seg.count / total) * 100),
    };
  });

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "20px",
        border: `1px solid ${themeConfig.border}`,
        bgcolor: isDarkMode ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        boxShadow: isDarkMode
          ? "0 10px 30px rgba(0,0,0,0.3)"
          : "0 10px 30px rgba(67, 97, 238, 0.05)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ p: 2.5, flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, mb: 1.5, gap: 1, flexWrap: "wrap" }}>
          <Box sx={{ minWidth: 0, flex: "1 1 auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <HotelIcon sx={{ color: "#3B82F6", fontSize: 20, flexShrink: 0 }} />
              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: { xs: "0.92rem", sm: "0.98rem" }, lineHeight: 1.2 }}>
                Live Room Occupancy
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.75rem", display: "block", mt: 0.3 }}>
              Real-time room status breakdown
            </Typography>
          </Box>
          <Chip
            icon={<CheckCircle sx={{ fontSize: "13px !important", color: "#10B981" }} />}
            label={`${occRate}% Occupied`}
            size="small"
            sx={{
              fontWeight: 800,
              bgcolor: "rgba(16, 185, 129, 0.12)",
              color: "#10B981",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              fontSize: "0.72rem",
              height: 24,
              flexShrink: 0,
              alignSelf: { xs: "flex-start", sm: "center" },
            }}
          />
        </Box>

        {/* Circular Donut Visual */}
        <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", my: 1, py: 0.5 }}>
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
            <defs>
              <linearGradient id="donutOccupied" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60A5FA" />
                <stop offset="100%" stopColor="#2563EB" />
              </linearGradient>
              <linearGradient id="donutAvailable" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#34D399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
              <linearGradient id="donutCleaning" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FBBF24" />
                <stop offset="100%" stopColor="#D97706" />
              </linearGradient>
              <linearGradient id="donutMaint" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F87171" />
                <stop offset="100%" stopColor="#DC2626" />
              </linearGradient>
            </defs>

            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="transparent"
              stroke={isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}
              strokeWidth={strokeWidth}
            />

            {/* Segments */}
            {arcs.map((arc, i) =>
              arc.count > 0 ? (
                <circle
                  key={i}
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  fill="transparent"
                  stroke={arc.grad}
                  strokeWidth={hoveredSegment === arc.label ? strokeWidth + 4 : strokeWidth}
                  strokeDasharray={arc.strokeDasharray}
                  strokeDashoffset={arc.strokeDashoffset}
                  strokeLinecap="round"
                  style={{
                    transition: "stroke-width 0.3s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.3s ease",
                    cursor: "pointer",
                  }}
                  onMouseEnter={() => setHoveredSegment(arc.label)}
                  onMouseLeave={() => setHoveredSegment(null)}
                />
              ) : null
            )}
          </svg>

          {/* Center Hub Display */}
          <Box
            sx={{
              position: "absolute",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: themeConfig.textMain, lineHeight: 1 }}>
              {hoveredSegment
                ? segments.find((s) => s.label === hoveredSegment)?.count
                : `${occRate}%`}
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", mt: 0.3, letterSpacing: "0.05em", fontSize: "0.68rem" }}>
              {hoveredSegment || "Occupancy"}
            </Typography>
            <Typography variant="caption" sx={{ fontSize: "0.68rem", color: themeConfig.primary, fontWeight: 800, mt: 0.1 }}>
              {total} Total Rooms
            </Typography>
          </Box>
        </Box>

        {/* Legend Grid */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 1,
            mt: 1.5,
          }}
        >
          {segments.map((s) => {
            const pct = Math.round((s.count / total) * 100);
            const isHovered = hoveredSegment === s.label;
            return (
              <Box
                key={s.label}
                onMouseEnter={() => setHoveredSegment(s.label)}
                onMouseLeave={() => setHoveredSegment(null)}
                sx={{
                  px: 1.2,
                  py: 0.9,
                  borderRadius: "10px",
                  bgcolor: isHovered
                    ? (isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.04)")
                    : (isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC"),
                  border: isHovered ? `1px solid ${s.color}` : `1px solid ${themeConfig.border}`,
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, minWidth: 0 }}>
                  <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: s.color, boxShadow: `0 0 6px ${s.color}`, flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.75rem", whiteSpace: "nowrap" }}>
                    {s.label}
                  </Typography>
                </Box>
                <Box sx={{ textAlign: "right", ml: 0.5, flexShrink: 0 }}>
                  <Typography component="span" variant="caption" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.8rem" }}>
                    {s.count}
                  </Typography>
                  <Typography component="span" variant="caption" sx={{ fontSize: "0.65rem", color: themeConfig.textMuted, ml: 0.4 }}>
                    ({pct}%)
                  </Typography>
                </Box>
              </Box>
            );
          })}
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * 2. 7-DAY REVENUE & PAYMENT FLOW GRADIENT AREA GRAPH
 */
export function RevenueWaveChart({ dashboardData, isDarkMode }) {
  const { themeConfig } = useAppTheme();
  const [activePoint, setActivePoint] = useState(null);

  const todayRev = Number(dashboardData?.financials?.todayRevenue ?? dashboardData?.todayRevenue ?? 0);
  const yesterdayRev = Number(dashboardData?.financials?.yesterdayRevenue ?? 0);
  const dayGrowthRate = dashboardData?.financials?.dayGrowthRate;

  const weeklyBreakdown = dashboardData?.weeklyRevenue?.breakdown || [];

  const revenueData = useMemo(() => {
    if (Array.isArray(weeklyBreakdown) && weeklyBreakdown.length > 0) {
      return weeklyBreakdown.map((item, idx) => {
        const amt = Number(item.amount || 0);
        let weekday = item.dayName;
        if (!weekday && item.date) {
          const dObj = new Date(item.date);
          if (!isNaN(dObj.getTime())) {
            weekday = dObj.toLocaleDateString("en-US", { weekday: "short" });
          }
        }
        if (!weekday) weekday = item.day ? item.day.slice(0, 3) : `D${idx + 1}`;

        return {
          day: item.formattedDate || item.day || `Day ${idx + 1}`,
          dayName: weekday,
          dayFull: item.weekdayFull || item.day || item.formattedDate,
          total: amt,
          upi: Number(item.upiAmount ?? 0),
          cash: Number(item.cashAmount ?? amt),
          index: idx,
        };
      });
    }

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day, idx) => {
      const dObj = new Date();
      dObj.setDate(dObj.getDate() - (6 - idx));
      const formatted = dObj.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
      const weekday = dObj.toLocaleDateString("en-US", { weekday: "short" });
      const total = idx === 6 ? todayRev : idx === 5 ? yesterdayRev : 0;
      return {
        day: formatted,
        dayName: weekday,
        dayFull: dObj.toLocaleDateString("en-US", { weekday: "long" }),
        total,
        upi: 0,
        cash: total,
        index: idx,
      };
    });
  }, [weeklyBreakdown, todayRev, yesterdayRev]);

  // SVG Chart Geometry
  const width = 500;
  const height = 195;
  const padding = { top: 20, right: 20, bottom: 42, left: 30 };

  const maxVal = Math.max(...revenueData.map((d) => d.total)) * 1.15 || 1000;
  const minVal = 0;

  const points = revenueData.map((d, i) => {
    const x = padding.left + (i / Math.max(1, revenueData.length - 1)) * (width - padding.left - padding.right);
    const y = height - padding.bottom - ((d.total - minVal) / (maxVal - minVal)) * (height - padding.top - padding.bottom);
    return { x, y, ...d };
  });

  // Create smooth Bezier curve string
  const createSmoothPath = (pts) => {
    if (pts.length === 0) return "";
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i === 0 ? 0 : i - 1];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[i + 2] || p2;

      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;

      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  };

  const linePath = createSmoothPath(points);
  const areaPath = points.length > 0 ? `${linePath} L ${points[points.length - 1].x} ${height - padding.bottom} L ${points[0].x} ${height - padding.bottom} Z` : "";

  const totalWeek = Number(dashboardData?.weeklyRevenue?.totalThisWeek ?? revenueData.reduce((acc, cur) => acc + cur.total, 0));
  const upiTotal = Number(dashboardData?.weeklyRevenue?.totalUpi ?? revenueData.reduce((acc, cur) => acc + cur.upi, 0));
  const cashTotal = Number(dashboardData?.weeklyRevenue?.totalCash ?? revenueData.reduce((acc, cur) => acc + cur.cash, 0));
  const upiPercent = totalWeek > 0 ? Math.round((upiTotal / totalWeek) * 100) : 0;
  const cashPercent = totalWeek > 0 ? Math.round((cashTotal / totalWeek) * 100) : 0;

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "20px",
        border: `1px solid ${themeConfig.border}`,
        bgcolor: isDarkMode ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        boxShadow: isDarkMode
          ? "0 10px 30px rgba(0,0,0,0.3)"
          : "0 10px 30px rgba(67, 97, 238, 0.05)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2, flexWrap: "wrap", gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
              <TrendingUp sx={{ color: "#10B981", fontSize: 22 }} />
              Revenue &amp; Collection Dynamics
            </Typography>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
              7-Day Total Collection: <strong style={{ color: themeConfig.primary }}>₹{totalWeek.toLocaleString("en-IN")}</strong>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Chip
              size="small"
              label={`⚡ ${upiPercent}% UPI`}
              sx={{ fontWeight: 800, bgcolor: "rgba(67, 97, 238, 0.12)", color: "#4361EE", fontSize: "0.72rem" }}
            />
            <Chip
              size="small"
              label={`💵 ${cashPercent}% Cash`}
              sx={{ fontWeight: 800, bgcolor: "rgba(16, 185, 129, 0.12)", color: "#10B981", fontSize: "0.72rem" }}
            />
          </Box>
        </Box>

        {/* SVG Curve Chart */}
        <Box sx={{ position: "relative", width: "100%", height: height, my: "auto" }}>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            style={{ width: "100%", height: "100%", overflow: "visible" }}
            onMouseLeave={() => setActivePoint(null)}
          >
            <defs>
              <linearGradient id="revAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4361EE" stopOpacity="0.45" />
                <stop offset="70%" stopColor="#4361EE" stopOpacity="0.08" />
                <stop offset="100%" stopColor="#4361EE" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id="revLineGrad" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#3B82F6" />
                <stop offset="50%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0.25, 0.5, 0.75, 1.0].map((ratio, i) => {
              const yVal = height - padding.bottom - ratio * (height - padding.top - padding.bottom);
              return (
                <line
                  key={i}
                  x1={padding.left}
                  y1={yVal}
                  x2={width - padding.right}
                  y2={yVal}
                  stroke={isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)"}
                  strokeDasharray="4 4"
                />
              );
            })}

            {/* Area Fill */}
            {areaPath && <path d={areaPath} fill="url(#revAreaGrad)" />}

            {/* Glowing Stroke Line */}
            {linePath && (
              <path
                d={linePath}
                fill="none"
                stroke="url(#revLineGrad)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ filter: "drop-shadow(0 4px 8px rgba(67, 97, 238, 0.35))" }}
              />
            )}

            {/* Points & Interactive Hover Area */}
            {points.map((pt, idx) => (
              <g key={idx}>
                {/* Invisible large touch target */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r="16"
                  fill="transparent"
                  style={{ cursor: "pointer" }}
                  onMouseEnter={() => setActivePoint(pt)}
                />
                {/* Visible Data Dot */}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={activePoint?.day === pt.day ? 6 : 4}
                  fill="#FFFFFF"
                  stroke="#4361EE"
                  strokeWidth={activePoint?.day === pt.day ? 3 : 2}
                  style={{
                    transition: "all 0.2s ease",
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))",
                  }}
                />
                {/* X-axis Date & Day Labels */}
                <text
                  x={pt.x}
                  y={height - 20}
                  textAnchor="middle"
                  fill={activePoint?.day === pt.day ? themeConfig.primary : themeConfig.textMain}
                  fontSize="10"
                  fontWeight={activePoint?.day === pt.day ? "900" : "700"}
                >
                  {pt.day}
                </text>
                <text
                  x={pt.x}
                  y={height - 6}
                  textAnchor="middle"
                  fill={activePoint?.day === pt.day ? themeConfig.primary : themeConfig.textMuted}
                  fontSize="9.5"
                  fontWeight="700"
                >
                  {pt.dayName}
                </text>
              </g>
            ))}
          </svg>

          {/* Interactive Floating Tooltip */}
          {activePoint && (
            <Box
              sx={{
                position: "absolute",
                top: 0,
                left: `${(activePoint.x / width) * 100}%`,
                transform: "translate(-50%, -10%)",
                bgcolor: isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(30, 41, 59, 0.95)",
                color: "#FFFFFF",
                p: 1.2,
                borderRadius: "10px",
                boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
                border: "1px solid rgba(255,255,255,0.15)",
                pointerEvents: "none",
                minWidth: "120px",
                textAlign: "center",
                zIndex: 10,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#93C5FD", display: "block" }}>
                {activePoint.dayFull || activePoint.day} Collection
              </Typography>
              <Typography variant="body2" sx={{ fontWeight: 900, color: "#10B981" }}>
                ₹{activePoint.total.toLocaleString("en-IN")}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mt: 0.5, fontSize: "0.65rem", color: "#CBD5E1" }}>
                <span>UPI: ₹{activePoint.upi.toLocaleString("en-IN")}</span>
                <span>Cash: ₹{activePoint.cash.toLocaleString("en-IN")}</span>
              </Box>
            </Box>
          )}
        </Box>

        {/* Quick Highlights bottom bar */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1.5, borderTop: `1px solid ${themeConfig.border}`, mt: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#10B981" }} />
            <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
              Projected Month End: <strong style={{ color: themeConfig.textMain }}>₹{(todayRev * 30).toLocaleString("en-IN")}</strong>
            </Typography>
          </Box>
          <Typography variant="caption" sx={{ color: (dayGrowthRate ?? 0) >= 0 ? "#10B981" : "#EF4444", fontWeight: 800 }}>
            {dayGrowthRate != null ? `${dayGrowthRate >= 0 ? "+" : ""}${dayGrowthRate}% vs yesterday` : "Live telemetry"}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}

/**
 * 3. DAILY REVENUE TARGET SPEEDOMETER / RADIAL GAUGE
 */
export function DailyTargetGauge({ currentRevenue = 0, targetRevenue = 0, onUpdateTarget }) {
  const { themeConfig, isDarkMode } = useAppTheme();

  const defaultCapacityTarget = Number(targetRevenue) || 0;
  const [targetModalOpen, setTargetModalOpen] = useState(false);
  const [manualTargetInput, setManualTargetInput] = useState("");
  const [customTarget, setCustomTarget] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("HOTEL_DAILY_REVENUE_TARGET");
      if (saved && !isNaN(Number(saved)) && Number(saved) > 0) {
        return Number(saved);
      }
    }
    return null;
  });

  const effectiveTarget = customTarget !== null ? customTarget : defaultCapacityTarget;
  const safeCurrent = Number(currentRevenue) || 0;
  const percentage = effectiveTarget > 0 ? Math.min(100, Math.round((safeCurrent / effectiveTarget) * 100)) : (safeCurrent > 0 ? 100 : 0);

  // 180-degree semi-circle gauge
  const size = 180;
  const strokeWidth = 18;
  const radius = (size - strokeWidth) / 2;
  const arcLength = Math.PI * radius; // Half circumference
  const strokeDash = (percentage / 100) * arcLength;

  const handleSaveManualTarget = () => {
    const val = Number(manualTargetInput);
    if (isNaN(val) || val <= 0) {
      toast.error("Please enter a valid positive target amount");
      return;
    }
    setCustomTarget(val);
    if (typeof window !== "undefined") {
      localStorage.setItem("HOTEL_DAILY_REVENUE_TARGET", String(val));
    }
    if (onUpdateTarget) onUpdateTarget(val);
    toast.success(`Daily revenue target set to ₹${val.toLocaleString("en-IN")}/day!`);
    setTargetModalOpen(false);
  };

  const handleResetToAuto = () => {
    setCustomTarget(null);
    if (typeof window !== "undefined") {
      localStorage.removeItem("HOTEL_DAILY_REVENUE_TARGET");
    }
    if (onUpdateTarget) onUpdateTarget(defaultCapacityTarget);
    toast.success("Reset to automatic full capacity target!");
    setTargetModalOpen(false);
  };

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "20px",
        border: `1px solid ${themeConfig.border}`,
        bgcolor: isDarkMode ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        boxShadow: isDarkMode
          ? "0 10px 30px rgba(0,0,0,0.3)"
          : "0 10px 30px rgba(67, 97, 238, 0.05)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1, display: "flex", flexDirection: "column" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
            <Speed sx={{ color: "#F59E0B", fontSize: 22, flexShrink: 0 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 800,
                color: themeConfig.textMain,
                fontSize: { xs: "0.95rem", sm: "1.05rem", md: "1.1rem" },
                whiteSpace: "nowrap",
                letterSpacing: "-0.01em",
              }}
            >
              Daily Revenue Goal
            </Typography>
          </Box>
          <Chip
            size="small"
            label={percentage >= 100 ? "🎯 Target Achieved" : effectiveTarget > 0 ? "⚡ In Progress" : "📊 Realtime Tracker"}
            sx={{
              fontWeight: 800,
              bgcolor: percentage >= 100 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
              color: percentage >= 100 ? "#10B981" : "#F59E0B",
              flexShrink: 0,
            }}
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 0.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap" }}>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
              Target: <strong style={{ color: themeConfig.textMain }}>₹{effectiveTarget.toLocaleString("en-IN")}</strong> / Day
            </Typography>
            {customTarget !== null ? (
              <Chip
                label="Manual Target"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  bgcolor: "rgba(59, 130, 246, 0.12)",
                  color: "#3B82F6",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                }}
              />
            ) : (
              <Chip
                label="Auto Capacity"
                size="small"
                sx={{
                  height: 20,
                  fontSize: "0.65rem",
                  fontWeight: 800,
                  bgcolor: "rgba(16, 185, 129, 0.12)",
                  color: "#10B981",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                }}
              />
            )}
          </Box>
          <Button
            size="small"
            startIcon={<Edit sx={{ fontSize: "13px !important" }} />}
            onClick={() => {
              setManualTargetInput(String(effectiveTarget));
              setTargetModalOpen(true);
            }}
            sx={{
              fontWeight: 800,
              fontSize: "0.72rem",
              borderRadius: "8px",
              py: 0.2,
              px: 1,
              textTransform: "none",
              color: themeConfig.primary,
              bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9",
              border: `1px solid ${themeConfig.border}`,
              "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0" },
            }}
          >
            Set Target
          </Button>
        </Box>

        {/* Semi Circle Gauge SVG */}
        <Box sx={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", my: "auto" }}>
          <svg width={size} height={size / 2 + 25} viewBox={`0 0 ${size} ${size / 2 + 25}`}>
            <defs>
              <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F59E0B" />
                <stop offset="50%" stopColor="#3B82F6" />
                <stop offset="100%" stopColor="#10B981" />
              </linearGradient>
            </defs>

            {/* Background Arc */}
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              fill="none"
              stroke={isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />

            {/* Progress Arc */}
            <path
              d={`M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`}
              fill="none"
              stroke="url(#gaugeGrad)"
              strokeWidth={strokeWidth}
              strokeDasharray={`${strokeDash} ${arcLength}`}
              strokeLinecap="round"
              style={{
                transition: "stroke-dasharray 1s ease-in-out",
                filter: "drop-shadow(0 4px 10px rgba(67, 97, 238, 0.3))",
              }}
            />
          </svg>

          {/* Needle / Value In Center */}
          <Box
            sx={{
              position: "absolute",
              bottom: 8,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
            }}
          >
            <Typography variant="h4" sx={{ fontWeight: 900, color: themeConfig.textMain, lineHeight: 1 }}>
              {percentage}%
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: "#10B981", mt: 0.3 }}>
              ₹{safeCurrent.toLocaleString("en-IN")} Achieved
            </Typography>
          </Box>
        </Box>

        {/* Bottom target remaining indicator */}
        <Box sx={{ p: 1.2, borderRadius: "12px", bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)", display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1 }}>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
            {effectiveTarget > 0 ? "Remaining to Goal:" : "Current Collections:"}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
            ₹{effectiveTarget > 0 ? Math.max(0, effectiveTarget - safeCurrent).toLocaleString("en-IN") : safeCurrent.toLocaleString("en-IN")}
          </Typography>
        </Box>
      </CardContent>

      {/* Manual Target Set Modal */}
      <Dialog
        open={targetModalOpen}
        onClose={() => setTargetModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "20px",
            bgcolor: isDarkMode ? "#1E293B" : "#FFFFFF",
            border: `1px solid ${themeConfig.border}`,
            p: 1,
          },
        }}
      >
        <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Speed sx={{ color: "#F59E0B", fontSize: 22 }} />
            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "1.05rem" }}>
              Set Daily Revenue Target
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setTargetModalOpen(false)} sx={{ color: themeConfig.textMuted }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ pt: 1 }}>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 2, fontSize: "0.82rem" }}>
            Enter your custom daily revenue goal or pick a quick preset:
          </Typography>

          <TextField
            fullWidth
            type="number"
            label="Daily Target Amount (₹)"
            value={manualTargetInput}
            onChange={(e) => setManualTargetInput(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <CurrencyRupee sx={{ fontSize: 18 }} />
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, display: "block", mb: 1 }}>
            QUICK PRESETS:
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mb: 1 }}>
            {[25000, 50000, 75000, 100000].map((preset) => (
              <Chip
                key={preset}
                label={`₹${preset.toLocaleString("en-IN")}`}
                clickable
                onClick={() => setManualTargetInput(String(preset))}
                sx={{
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  borderRadius: "8px",
                  bgcolor: Number(manualTargetInput) === preset ? themeConfig.primary : (isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9"),
                  color: Number(manualTargetInput) === preset ? "#FFFFFF" : themeConfig.textMain,
                }}
              />
            ))}
            {defaultCapacityTarget > 0 && (
              <Chip
                label={`Auto Capacity (₹${defaultCapacityTarget.toLocaleString("en-IN")})`}
                clickable
                onClick={() => setManualTargetInput(String(defaultCapacityTarget))}
                sx={{
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  borderRadius: "8px",
                  bgcolor: Number(manualTargetInput) === defaultCapacityTarget ? themeConfig.primary : (isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9"),
                  color: Number(manualTargetInput) === defaultCapacityTarget ? "#FFFFFF" : themeConfig.textMain,
                }}
              />
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2, display: "flex", justifyContent: "space-between" }}>
          <Button
            size="small"
            startIcon={<RestartAlt />}
            onClick={handleResetToAuto}
            sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "none" }}
          >
            Reset to Auto
          </Button>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              size="small"
              onClick={() => setTargetModalOpen(false)}
              sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleSaveManualTarget}
              sx={{
                fontWeight: 800,
                bgcolor: "#F59E0B",
                color: "#FFFFFF",
                borderRadius: "10px",
                px: 2,
                textTransform: "none",
                "&:hover": { bgcolor: "#D97706" },
              }}
            >
              Save Target
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

/**
 * 4. WEEKLY & HOURLY RECEPTION ACTIVITY TRAFFIC HEAT BARS
 */
export function HourlyActivityBarChart({ bookings = [], guests = [] }) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [viewType, setViewType] = useState("HOURLY"); // Default to Hourly view
  const [hourlyDateFilter, setHourlyDateFilter] = useState("TODAY"); // "TODAY" | "ALL"

  // Calendar day comparator
  const isSameCalendarDay = (d1, d2) => {
    if (!d1 || !d2) return false;
    const a = new Date(d1);
    const b = new Date(d2);
    if (isNaN(a.getTime()) || isNaN(b.getTime())) return false;
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  };

  // Helper to extract exact check-in hour (0-23) from booking object
  const getBookingCheckInHour = (b) => {
    if (b.actualCheckIn) {
      const dt = new Date(b.actualCheckIn);
      if (!isNaN(dt.getTime())) return dt.getHours();
    }
    if (b.checkInTime && typeof b.checkInTime === "string") {
      const timeStr = b.checkInTime.trim().toUpperCase();
      const isPM = timeStr.includes("PM");
      const isAM = timeStr.includes("AM");
      const clean = timeStr.replace(/[^0-9:]/g, "");
      const parts = clean.split(":").map(Number);
      if (!isNaN(parts[0])) {
        let h = parts[0];
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        return h;
      }
    }
    if (b.createdAt) {
      const dt = new Date(b.createdAt);
      if (!isNaN(dt.getTime())) return dt.getHours();
    }
    if (b.checkInDate) {
      const dt = new Date(b.checkInDate);
      if (!isNaN(dt.getTime()) && (dt.getHours() !== 0 || dt.getMinutes() !== 0)) {
        return dt.getHours();
      }
    }
    return 14; // Default check-in time 2:00 PM (14:00)
  };

  // Helper to extract exact check-out hour (0-23) from booking object
  const getBookingCheckOutHour = (b) => {
    if (b.actualCheckOut) {
      const dt = new Date(b.actualCheckOut);
      if (!isNaN(dt.getTime())) return dt.getHours();
    }
    if (b.checkOutTime && typeof b.checkOutTime === "string") {
      const timeStr = b.checkOutTime.trim().toUpperCase();
      const isPM = timeStr.includes("PM");
      const isAM = timeStr.includes("AM");
      const clean = timeStr.replace(/[^0-9:]/g, "");
      const parts = clean.split(":").map(Number);
      if (!isNaN(parts[0])) {
        let h = parts[0];
        if (isPM && h < 12) h += 12;
        if (isAM && h === 12) h = 0;
        return h;
      }
    }
    if (b.checkOutDate) {
      const dt = new Date(b.checkOutDate);
      if (!isNaN(dt.getTime()) && (dt.getHours() !== 0 || dt.getMinutes() !== 0)) {
        return dt.getHours();
      }
    }
    return 11; // Default check-out time 11:00 AM (11:00)
  };

  // Trailing 7 days for Weekly View
  const weeklyData = useMemo(() => {
    const today = new Date();
    const result = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);

      let checkins = 0;
      let checkouts = 0;

      bookings.forEach((b) => {
        const inDate = b.actualCheckIn || b.checkInDate || b.createdAt;
        if (inDate && isSameCalendarDay(inDate, d)) checkins++;

        const outDate = b.actualCheckOut || b.checkOutDate;
        if (outDate && isSameCalendarDay(outDate, d)) checkouts++;
      });

      const dayLabel = d.toLocaleDateString("en-US", { weekday: "short" });
      const dateFormatted = d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });

      result.push({
        label: dayLabel,
        formattedDate: dateFormatted,
        dayFull: `${d.toLocaleDateString("en-US", { weekday: "long" })}, ${dateFormatted}`,
        checkins,
        checkouts,
        total: checkins + checkouts,
        isPeak: false,
      });
    }

    const maxWeekly = Math.max(...result.map((r) => r.total));
    return result.map((r) => ({
      ...r,
      isPeak: maxWeekly > 0 && r.total === maxWeekly && maxWeekly >= 2,
    }));
  }, [bookings]);

  // Hourly slots for Today or All
  const hourlyData = useMemo(() => {
    const today = new Date();
    const currentHour = today.getHours();

    const slots = [
      { label: "6 AM", range: "6:00 AM - 8:00 AM", startH: 6, endH: 8 },
      { label: "8 AM", range: "8:00 AM - 10:00 AM", startH: 8, endH: 10 },
      { label: "10 AM", range: "10:00 AM - 12:00 PM", startH: 10, endH: 12 },
      { label: "12 PM", range: "12:00 PM - 2:00 PM", startH: 12, endH: 14 },
      { label: "2 PM", range: "2:00 PM - 4:00 PM", startH: 14, endH: 16 },
      { label: "4 PM", range: "4:00 PM - 6:00 PM", startH: 16, endH: 18 },
      { label: "6 PM", range: "6:00 PM - 8:00 PM", startH: 18, endH: 20 },
      { label: "8 PM", range: "8:00 PM - 10:00 PM", startH: 20, endH: 22 },
      { label: "10 PM", range: "10:00 PM - 12:00 AM", startH: 22, endH: 24 },
    ];

    const result = slots.map((s) => {
      let checkins = 0;
      let checkouts = 0;

      bookings.forEach((b) => {
        // 1. Check-In matching
        let isCheckInMatch = false;
        if (hourlyDateFilter === "ALL") {
          isCheckInMatch = true;
        } else {
          // Strictly Today's Check-ins
          const inDate = b.actualCheckIn || (b.createdAt && (b.status === "CHECKED_IN" || b.status === "CONFIRMED" || b.status === "CHECKED_OUT") ? b.createdAt : b.checkInDate);
          if (inDate && isSameCalendarDay(inDate, today)) {
            isCheckInMatch = true;
          }
        }

        if (isCheckInMatch) {
          const inHour = getBookingCheckInHour(b);
          if (inHour >= s.startH && inHour < s.endH) {
            checkins++;
          }
        }

        // 2. Check-Out matching
        let isCheckOutMatch = false;
        if (hourlyDateFilter === "ALL") {
          isCheckOutMatch = true;
        } else {
          // Strictly Today's Check-outs
          const outDate = b.actualCheckOut || b.checkOutDate;
          if (outDate && isSameCalendarDay(outDate, today)) {
            isCheckOutMatch = true;
          }
        }

        if (isCheckOutMatch) {
          const outHour = getBookingCheckOutHour(b);
          if (outHour >= s.startH && outHour < s.endH) {
            checkouts++;
          }
        }
      });

      const isCurrentSlot = hourlyDateFilter === "TODAY" && currentHour >= s.startH && currentHour < s.endH;

      return {
        ...s,
        dayFull: s.range,
        checkins,
        checkouts,
        total: checkins + checkouts,
        isCurrentSlot,
        isPeak: false,
      };
    });

    const maxHourly = Math.max(...result.map((r) => r.total));
    return result.map((r) => ({
      ...r,
      isPeak: maxHourly > 0 && r.total === maxHourly && maxHourly >= 2,
    }));
  }, [bookings, hourlyDateFilter]);

  const currentData = viewType === "HOURLY" ? hourlyData : weeklyData;
  const maxVal = Math.max(...currentData.map((d) => Math.max(d.checkins, d.checkouts)), 1);

  const totalIn = currentData.reduce((sum, d) => sum + d.checkins, 0);
  const totalOut = currentData.reduce((sum, d) => sum + d.checkouts, 0);

  return (
    <Card
      elevation={0}
      sx={{
        borderRadius: "20px",
        border: `1px solid ${themeConfig.border}`,
        bgcolor: isDarkMode ? "rgba(30, 41, 59, 0.85)" : "rgba(255, 255, 255, 0.95)",
        backdropFilter: "blur(12px)",
        boxShadow: isDarkMode
          ? "0 10px 30px rgba(0,0,0,0.3)"
          : "0 10px 30px rgba(67, 97, 238, 0.05)",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <CardContent sx={{ p: 3, flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Header Ribbon with Mode Toggle */}
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 1 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1, fontSize: "1rem" }}>
              <Schedule sx={{ color: "#6366F1", fontSize: 20 }} />
              {viewType === "HOURLY" ? "Hourly Reception Traffic" : "Weekly Reception Traffic"}
            </Typography>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
              {viewType === "HOURLY"
                ? hourlyDateFilter === "TODAY"
                  ? `Today (${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}) • Real-time hourly traffic`
                  : "All days guest check-in vs check-out rush by hour"
                : "Last 7 Days guest check-in vs check-out volume"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
            {/* View Switcher Toggle Button */}
            <Box sx={{ display: "flex", bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : themeConfig.champagne, p: 0.3, borderRadius: "10px", border: `1px solid ${themeConfig.border}` }}>
              <Button
                size="small"
                onClick={() => setViewType("HOURLY")}
                sx={{
                  py: 0.3,
                  px: 1.2,
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  borderRadius: "8px",
                  bgcolor: viewType === "HOURLY" ? (isDarkMode ? "rgba(255,255,255,0.15)" : "#FFFFFF") : "transparent",
                  color: viewType === "HOURLY" ? (themeConfig.primaryDark || "#0C273B") : themeConfig.textMuted,
                  boxShadow: viewType === "HOURLY" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                  minWidth: "auto",
                }}
              >
                Hourly
              </Button>
              <Button
                size="small"
                onClick={() => setViewType("WEEKLY")}
                sx={{
                  py: 0.3,
                  px: 1.2,
                  fontSize: "0.7rem",
                  fontWeight: 800,
                  borderRadius: "8px",
                  bgcolor: viewType === "WEEKLY" ? (isDarkMode ? "rgba(255,255,255,0.15)" : "#FFFFFF") : "transparent",
                  color: viewType === "WEEKLY" ? (themeConfig.primaryDark || "#0C273B") : themeConfig.textMuted,
                  boxShadow: viewType === "WEEKLY" ? "0 2px 6px rgba(0,0,0,0.08)" : "none",
                  minWidth: "auto",
                }}
              >
                Weekly
              </Button>
            </Box>

            {/* In Hourly view: Filter Today vs All */}
            {viewType === "HOURLY" && (
              <Box sx={{ display: "flex", bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9", p: 0.3, borderRadius: "8px", border: `1px solid ${themeConfig.border}` }}>
                <Button
                  size="small"
                  onClick={() => setHourlyDateFilter("TODAY")}
                  sx={{
                    py: 0.2,
                    px: 0.9,
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    borderRadius: "6px",
                    bgcolor: hourlyDateFilter === "TODAY" ? themeConfig.primary : "transparent",
                    color: hourlyDateFilter === "TODAY" ? "#FFFFFF" : themeConfig.textMuted,
                    textTransform: "none",
                    minWidth: "auto",
                  }}
                >
                  Today
                </Button>
                <Button
                  size="small"
                  onClick={() => setHourlyDateFilter("ALL")}
                  sx={{
                    py: 0.2,
                    px: 0.9,
                    fontSize: "0.68rem",
                    fontWeight: 800,
                    borderRadius: "6px",
                    bgcolor: hourlyDateFilter === "ALL" ? themeConfig.primary : "transparent",
                    color: hourlyDateFilter === "ALL" ? "#FFFFFF" : themeConfig.textMuted,
                    textTransform: "none",
                    minWidth: "auto",
                  }}
                >
                  All
                </Button>
              </Box>
            )}

            {/* In / Out Legend */}
            <Box sx={{ display: "flex", gap: 1, ml: 0.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#3B82F6" }} />
                <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: themeConfig.textMuted }}>In</Typography>
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: "#EC4899" }} />
                <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: themeConfig.textMuted }}>Out</Typography>
              </Box>
            </Box>
          </Box>
        </Box>

        {/* Bars Container */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", height: 160, pt: 2, pb: 1, my: "auto" }}>
          {currentData.map((d, i) => {
            const hasIn = d.checkins > 0;
            const hasOut = d.checkouts > 0;
            const inHeight = hasIn ? Math.max(14, (d.checkins / maxVal) * 110) : 3;
            const outHeight = hasOut ? Math.max(14, (d.checkouts / maxVal) * 110) : 3;

            return (
              <Tooltip
                key={i}
                title={`${d.dayFull || d.label}: ${d.checkins} Check-ins (In) | ${d.checkouts} Check-outs (Out) ${d.total ? `(Total: ${d.total})` : ""}`}
                arrow
              >
                <Box
                  sx={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    flex: 1,
                    cursor: "pointer",
                    position: "relative",
                    "&:hover .bar-in": { transform: hasIn ? "scaleY(1.08)" : "none" },
                    "&:hover .bar-out": { transform: hasOut ? "scaleY(1.08)" : "none" },
                  }}
                >
                  {d.isPeak ? (
                    <Typography sx={{ fontSize: "0.65rem", fontWeight: 800, color: "#EF4444", mb: 0.5, lineHeight: 1 }}>
                      🔥
                    </Typography>
                  ) : d.isCurrentSlot ? (
                    <Typography sx={{ fontSize: "0.55rem", fontWeight: 900, color: themeConfig.primary, mb: 0.5, lineHeight: 1, bgcolor: "rgba(59, 130, 246, 0.12)", px: 0.5, py: 0.1, borderRadius: "4px" }}>
                      NOW
                    </Typography>
                  ) : (
                    <Box sx={{ height: "13px" }} />
                  )}

                  {/* Paired Bars */}
                  <Box sx={{ display: "flex", alignItems: "flex-end", gap: "4px", height: 110 }}>
                    {/* In Bar */}
                    <Box
                      className="bar-in"
                      sx={{
                        width: viewType === "WEEKLY" ? 12 : 8,
                        height: `${inHeight}px`,
                        borderRadius: hasIn ? "4px 4px 0 0" : "2px",
                        bgcolor: hasIn ? "#3B82F6" : (isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"),
                        background: hasIn ? "linear-gradient(180deg, #60A5FA 0%, #2563EB 100%)" : "none",
                        transition: "transform 0.2s ease",
                        transformOrigin: "bottom",
                        position: "relative",
                      }}
                    />
                    {/* Out Bar */}
                    <Box
                      className="bar-out"
                      sx={{
                        width: viewType === "WEEKLY" ? 12 : 8,
                        height: `${outHeight}px`,
                        borderRadius: hasOut ? "4px 4px 0 0" : "2px",
                        bgcolor: hasOut ? "#EC4899" : (isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"),
                        background: hasOut ? "linear-gradient(180deg, #F472B6 0%, #DB2777 100%)" : "none",
                        transition: "transform 0.2s ease",
                        transformOrigin: "bottom",
                        position: "relative",
                      }}
                    />
                  </Box>

                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.7rem",
                      fontWeight: d.isCurrentSlot ? 900 : 800,
                      color: d.isCurrentSlot ? themeConfig.primary : themeConfig.textMain,
                      mt: 1,
                    }}
                  >
                    {d.label}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        {/* Footer Summary Strip */}
        <Box sx={{ p: 1.2, borderRadius: "12px", bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : themeConfig.champagne, display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, border: `1px solid ${themeConfig.border}` }}>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.75rem", fontWeight: 700 }}>
            {viewType === "HOURLY"
              ? hourlyDateFilter === "TODAY" ? "Today's Traffic Summary:" : "All Time Hourly Summary:"
              : "Last 7 Days Total Flow:"}
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.primaryDark, fontSize: "0.75rem" }}>
            {viewType === "HOURLY"
              ? (() => {
                  const peak = hourlyData.reduce((max, cur) => (cur.total > max.total ? cur : max), { total: 0, label: "", range: "" });
                  if (peak.total > 0) {
                    return `Peak at ${peak.label} (${peak.range || peak.label}) • ${totalIn} In / ${totalOut} Out`;
                  }
                  return `${totalIn} Check-Ins • ${totalOut} Check-Outs (Live Tracker)`;
                })()
              : `${totalIn} Check-Ins • ${totalOut} Check-Outs (${totalIn + totalOut} Total)`}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
