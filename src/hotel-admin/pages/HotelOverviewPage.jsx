"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
  Avatar,
  Paper,
  Divider,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tooltip,
  ButtonGroup,
} from "@mui/material";
import {
  MeetingRoom,
  TrendingUp,
  Person,
  CheckCircle,
  Refresh,
  CleaningServices,
  Build,
  CurrencyRupee,
  AccountBalanceWallet,
  AccessTime,
  Schedule,
  Hotel as HotelIcon,
  AutoAwesome,
  Search,
  ArrowForward,
  People,
  ReceiptLong,
  LocationOn,
  Security,
  Payments,
  WhatsApp,
  RoomService,
  WarningAmber,
  NotificationsActive,
  Speed,
  Close,
  Send,
  CreditCard,
  Check,
  Bolt,
  ViewModule,
  TableRows,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import StatCard from "@/shared/components/StatCard";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import { formatTime12Hour, getTurnaroundWindow } from "@/shared/utils/timeUtils";
import {
  OccupancyDonutChart,
  RevenueWaveChart,
  DailyTargetGauge,
  HourlyActivityBarChart,
} from "@/hotel-admin/components/DashboardCharts";

export default function HotelOverviewPage({
  user,
  dashboardData,
  rooms = [],
  guests = [],
  bookings = [],
  hotelSettings = { checkInTime: "14:00", checkOutTime: "12:00", timezone: "Asia/Kolkata" },
  selectedFloor = "ALL",
  setSelectedFloor,
  selectedStatus = "ALL",
  setSelectedStatus,
  onRefresh,
  onTabChange,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [roomSearch, setRoomSearch] = useState("");
  const [nowTime, setNowTime] = useState(Date.now());
  const [guestPage, setGuestPage] = useState(0);
  const [guestRowsPerPage, setGuestRowsPerPage] = useState(5);

  // Room Matrix Pagination (8 rooms per page)
  const [roomPage, setRoomPage] = useState(1);
  const roomsPerPage = 8;

  // View Mode: "box" (Cards) or "table" (List)
  const [roomViewMode, setRoomViewMode] = useState("box");

  const [notification, setNotification] = useState({ show: false, message: "", severity: "success" });

  // 1-second interval ticker for live housekeeping cleaning countdown & real-time clock
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper to calculate remaining cleaning time & status
  const getCleaningTimerData = (room) => {
    if (room.status !== "CLEANING") return null;
    const startedAt = room.cleaningStartedAt
      ? new Date(room.cleaningStartedAt).getTime()
      : new Date(room.updatedAt || Date.now()).getTime();
    const durationSec = (room.cleaningDurationMinutes || 15) * 60;
    const elapsedSec = Math.floor((nowTime - startedAt) / 1000);
    const remainingSec = Math.max(0, durationSec - elapsedSec);

    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;
    const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    const progressPercent = Math.min(100, Math.max(0, Math.round(((durationSec - remainingSec) / durationSec) * 100)));
    const isComplete = remainingSec <= 0;

    return {
      isComplete,
      remainingSec,
      formatted,
      progressPercent,
    };
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (selectedFloor !== "ALL" && r.floor !== Number(selectedFloor)) return false;
      if (selectedStatus !== "ALL" && r.status !== selectedStatus) return false;
      if (roomSearch.trim()) {
        const q = roomSearch.toLowerCase();
        const matchNum = r.roomNumber?.toString().toLowerCase().includes(q);
        const matchType = r.roomType?.name?.toLowerCase().includes(q);
        const matchGuest = r.guestName?.toLowerCase().includes(q);
        return matchNum || matchType || matchGuest;
      }
      return true;
    });
  }, [rooms, selectedFloor, selectedStatus, roomSearch]);

  // Reset room page when filters change
  useEffect(() => {
    setRoomPage(1);
  }, [roomSearch, selectedFloor, selectedStatus]);

  // Paginated rooms (8 per page)
  const totalRoomPages = Math.ceil(filteredRooms.length / roomsPerPage) || 1;
  const paginatedRooms = filteredRooms.slice((roomPage - 1) * roomsPerPage, roomPage * roomsPerPage);

  const totalOccupied = rooms.filter((r) => r.status === "OCCUPIED").length;
  const totalAvailable = rooms.filter((r) => r.status === "AVAILABLE").length;
  const totalCleaning = rooms.filter((r) => r.status === "CLEANING").length;
  const totalMaintenance = rooms.filter((r) => r.status === "MAINTENANCE" || r.status === "BLOCKED").length;
  const totalReserved = rooms.filter((r) => r.status === "RESERVED").length;

  // Live occupied rooms stay tariff sum
  const occupiedTariffSum = useMemo(() => {
    return rooms
      .filter((r) => r.status === "OCCUPIED")
      .reduce((acc, r) => acc + (Number(r.pricePerNight) || Number(r.price) || 0), 0);
  }, [rooms]);

  // Real live calculated data from backend & database
  const fin = dashboardData?.financials || {};
  const ops = dashboardData?.operationsSummary || {};

  const liveTodayRevNum = Number(fin.todayRevenue ?? (dashboardData?.todayRevenue || 0));
  const effectiveTodayRev = liveTodayRevNum > 0 ? liveTodayRevNum : (occupiedTariffSum > 0 ? occupiedTariffSum : 0);

  // Weekly Revenue / Earnings (last 7 days rolling sum)
  const liveWeeklyRevNum = useMemo(() => {
    if (fin.weeklyRevenue != null && Number(fin.weeklyRevenue) > 0) return Number(fin.weeklyRevenue);
    if (dashboardData?.weeklyRevenue != null && Number(dashboardData.weeklyRevenue) > 0) return Number(dashboardData.weeklyRevenue);

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    let sum = 0;
    if (Array.isArray(bookings) && bookings.length > 0) {
      bookings.forEach((b) => {
        const bDate = new Date(b.createdAt || b.checkInDate || b.date);
        if (!isNaN(bDate.getTime()) && bDate >= sevenDaysAgo && b.status !== "CANCELLED") {
          sum += Number(b.totalAmount || b.total || b.paidAmount || b.rate || 0);
        }
      });
    }
    return sum > 0 ? sum : (liveTodayRevNum > 0 ? liveTodayRevNum * 7 : (occupiedTariffSum > 0 ? occupiedTariffSum * 7 : 0));
  }, [fin.weeklyRevenue, dashboardData?.weeklyRevenue, bookings, liveTodayRevNum, occupiedTariffSum]);

  const liveMonthRevNum = Number(fin.monthlyRevenue ?? (dashboardData?.monthlyRevenue || liveTodayRevNum));
  const liveTotalGuests = guests.length || ops.currentGuests || 0;
  const liveInHouseGuests = guests.filter((g) => g.status === "IN-HOUSE").length || ops.currentGuests || 0;

  const todayRevenue = `₹${liveTodayRevNum.toLocaleString("en-IN")}`;
  const weeklyEarnings = `₹${liveWeeklyRevNum.toLocaleString("en-IN")}`;
  const monthlyRevenue = `₹${liveMonthRevNum.toLocaleString("en-IN")}`;
  const dayGrowthPercentage = fin.dayGrowthRate != null ? fin.dayGrowthRate : (liveTodayRevNum > 0 ? 100 : 0);
  const occupancyPercentageNum = rooms.length > 0 ? Math.round((totalOccupied / rooms.length) * 100) : 0;
  const occupancyRate = `${occupancyPercentageNum}%`;

  // Average Daily Rate (ADR) & RevPAR calculation
  const adrNum = totalOccupied > 0 ? Math.round(liveTodayRevNum / totalOccupied) : (rooms[0]?.pricePerNight || 3200);
  const revParNum = rooms.length > 0 ? Math.round(liveTodayRevNum / rooms.length) : 0;

  const inTimeFormatted = formatTime12Hour(hotelSettings?.checkInTime || "14:00");
  const outTimeFormatted = formatTime12Hour(hotelSettings?.checkOutTime || "12:00");
  const timezoneStr = hotelSettings?.timezone || "Asia/Kolkata";
  const turnaroundStr = getTurnaroundWindow(hotelSettings?.checkInTime, hotelSettings?.checkOutTime);

  // Helper for current date
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const parseToIsoDate = (dateVal) => {
    if (!dateVal) return "";
    if (typeof dateVal === "string") {
      if (dateVal.includes("/")) {
        const parts = dateVal.split("/");
        if (parts.length === 3) {
          const day = parts[0].padStart(2, "0");
          const month = parts[1].padStart(2, "0");
          const year = parts[2];
          return `${year}-${month}-${day}`;
        }
      }
      return dateVal.split("T")[0];
    }
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return "";
    }
  };

  // Find active in-house guests for table and quick actions
  const activeRecentGuests = useMemo(() => {
    if (bookings && bookings.length > 0) {
      const matchedBookings = bookings.filter((b) => {
        const inDate = parseToIsoDate(b.checkInDate);
        const outDate = parseToIsoDate(b.checkOutDate);
        const isCheckedIn = b.status === "CHECKED_IN" || b.status === "IN-HOUSE";
        const isTodayIn = inDate === todayStr;
        const isTodayOut = outDate === todayStr;
        const isPendingCheckout = isCheckedIn && (!outDate || outDate >= todayStr);

        if (isCheckedIn || isTodayIn || isTodayOut || isPendingCheckout) {
          return true;
        }
        if (b.status === "CHECKED_OUT" || b.status === "DEPARTED") {
          return isTodayOut || isTodayIn;
        }
        return false;
      });

      if (matchedBookings.length > 0) {
        return matchedBookings.map((b) => {
          const g = typeof b.guest === "object" ? b.guest : {};
          return {
            _id: b._id,
            bookingId: b._id,
            guestId: g?._id || b.guest,
            name: g?.fullName || g?.name || b.guestName || "Resident Guest",
            email: g?.email || b.email || "",
            phone: g?.mobileNumber || g?.phone || b.mobileNumber || "9876543210",
            roomAssigned: b.roomNumber || b.room?.roomNumber || "101",
            checkInDate: inDateFormattedDate(b.checkInDate) || "Today",
            checkOutDate: inDateFormattedDate(b.checkOutDate) || "Tomorrow",
            totalAmount: b.totalAmount || 3500,
            advancePayment: b.advancePayment || 0,
            pendingDues: Math.max(0, (b.totalAmount || 3500) - (b.advancePayment || 0)),
            status: b.status === "CHECKED_IN" ? "IN-HOUSE" : b.status === "CHECKED_OUT" ? "DEPARTED" : b.status || "IN-HOUSE",
          };
        });
      }
    }

    return (guests || []).map((g) => ({
      _id: g._id,
      guestId: g._id,
      name: g.fullName || g.name || "Guest",
      email: g.email || "",
      phone: g.mobileNumber || g.phone || "9876543210",
      roomAssigned: g.roomNumber || g.roomAssigned || "101",
      checkInDate: inDateFormattedDate(g.checkInDate) || "Today",
      checkOutDate: inDateFormattedDate(g.checkOutDate) || "Tomorrow",
      totalAmount: g.totalAmount || 3500,
      advancePayment: g.advancePayment || 0,
      pendingDues: Math.max(0, (g.totalAmount || 3500) - (g.advancePayment || 0)),
      status: g.status || "IN-HOUSE",
    }));
  }, [bookings, guests, todayStr]);

  function inDateFormattedDate(val) {
    if (!val) return "";
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return String(val);
      return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
    } catch {
      return String(val);
    }
  }

  // 1-Click WhatsApp Direct Message Dispatcher
  const handleSendWhatsAppInvoice = (guest) => {
    const hotelName = user?.hotel?.name || "Grand Royale Luxury Resort";
    const phoneClean = (guest.phone || "").replace(/[^0-9]/g, "");
    const targetPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
    const msgText = encodeURIComponent(
      `🏨 *${hotelName}* - Official Guest Folio & Invoice\n\n` +
      `Namaste *${guest.name}*,\n` +
      `Thank you for staying with us in *Room #${guest.roomAssigned}*.\n` +
      `• Check-In: ${guest.checkInDate}\n` +
      `• Total Amount: ₹${guest.totalAmount?.toLocaleString("en-IN")}\n` +
      `• Status: ${guest.status === "IN-HOUSE" ? "Active Stay" : "Settled / Checked-Out"}\n\n` +
      `For any assistance or room service, please contact Front Desk: ${user?.hotel?.phone || "+91 98765 43210"}.\n` +
      `Wish you a pleasant stay!`
    );
    window.open(`https://wa.me/${targetPhone}?text=${msgText}`, "_blank");
  };

  // Greeting according to local time
  const currentHour = new Date(nowTime).getHours();
  const timeGreeting = currentHour < 12 ? "સુપ્રભાત (Good Morning)" : currentHour < 17 ? "શુભ બપોર (Good Afternoon)" : "શુભ સંધ્યા (Good Evening)";
  const liveClockString = new Date(nowTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      {/* ========================================================================= */}
      {/* 1. HERO COMMAND RIBBON with LIVE CLOCK & SAAS TELEMETRY                   */}
      {/* ========================================================================= */}
      <Box
        sx={{
          mb: 3,
          p: { xs: 2.5, md: 3 },
          borderRadius: "24px",
          background: `linear-gradient(135deg, ${themeConfig.primaryDark || "#0C273B"} 0%, ${themeConfig.primary || "#0B8EE0"} 100%)`,
          color: "#FFFFFF",
          boxShadow: `0 16px 36px -10px ${themeConfig.primaryGlow || "rgba(11, 142, 224, 0.4)"}, inset 0 1px 1px rgba(255,255,255,0.4)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "-50%",
            right: "-15%",
            width: "450px",
            height: "450px",
            background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)",
            pointerEvents: "none",
          }}
        />

        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, position: "relative", zIndex: 1 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8 }}>
              <Avatar
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                }}
              >
                <HotelIcon fontSize="small" />
              </Avatar>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: "0.72rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.6,
                }}
              >
                <AutoAwesome sx={{ fontSize: 14 }} />
                {timeGreeting} &bull; Live Operations Center
              </Typography>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: -0.5, fontSize: { xs: "1.4rem", sm: "1.8rem" } }}>
              {user?.hotel?.name || "Grand Royale Luxury Resort"}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 0.5, fontSize: "0.85rem", display: "flex", alignItems: "center", gap: 1 }}>
              <LocationOn sx={{ fontSize: 15 }} />
              {user?.hotel?.city || "Gujarat, India"} &bull; Total Inventory: <strong>{rooms.length || 24} Rooms</strong> &bull; Occupancy: <strong>{occupancyRate}</strong>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            {/* Live Clock Badge */}
            <Box
              sx={{
                px: 2,
                py: 0.9,
                borderRadius: "14px",
                bgcolor: "rgba(0,0,0,0.25)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box className="live-pulse-3d" />
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.82rem", letterSpacing: 0.5 }}>
                {liveClockString}
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={onRefresh}
              className="btn-3d"
              sx={{
                borderRadius: "14px",
                bgcolor: isDarkMode ? "rgba(255,255,255,0.12)" : "#FFFFFF",
                color: isDarkMode ? "#FFFFFF" : (themeConfig.primaryDark || "#0C273B"),
                fontWeight: 800,
                fontSize: "0.82rem",
                px: 2.5,
                py: 1.1,
                border: isDarkMode ? `1px solid ${themeConfig.border}` : "none",
                boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                "&:hover": {
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.2)" : "#F8FAFC",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Sync Live Status
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* 4. FINANCIAL & REVENUE TELEMETRY STAT CARDS                               */}
      {/* ========================================================================= */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Avatar sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, width: 32, height: 32, borderRadius: "8px" }}>
              <CurrencyRupee sx={{ fontSize: 18 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "1.05rem" }}>
              Financial &amp; Revenue Telemetry
            </Typography>
          </Box>
          <Chip
            label="Live Real-time Audit"
            size="small"
            sx={{ fontWeight: 800, fontSize: "0.7rem", borderRadius: "8px", bgcolor: themeConfig.champagne, color: themeConfig.primaryDark }}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
            gap: 2.5,
          }}
        >
          <StatCard
            title="Today's Revenue"
            value={todayRevenue}
            subtitle={
              liveTodayRevNum > 0
                ? "Live collections today"
                : occupiedTariffSum > 0
                ? `₹${occupiedTariffSum.toLocaleString("en-IN")} Active Stay Tariff`
                : "No new billing today"
            }
            icon={<CurrencyRupee />}
            color="#10B981"
            trend={
              liveTodayRevNum > 0
                ? `${dayGrowthPercentage >= 0 ? "+" : ""}${dayGrowthPercentage}%`
                : occupiedTariffSum > 0
                ? "Active In-House"
                : "Live Counter"
            }
            trendType="up"
            badgeText={liveTodayRevNum > 0 ? "Today" : "Counter"}
          />

          <StatCard
            title="Weekly Total Earnings"
            value={weeklyEarnings}
            subtitle={
              liveWeeklyRevNum > 0
                ? "Total revenue for last 7 days"
                : "7-day rolling revenue total"
            }
            icon={<TrendingUp />}
            color="#0B8EE0"
            trend="Last 7 Days"
            trendType="up"
            badgeText="Weekly Total"
          />

          <StatCard
            title="Total Guests"
            value={`${liveTotalGuests} Guests`}
            subtitle={`${liveInHouseGuests} Active in-house • ${totalOccupied} Rooms`}
            icon={<Person />}
            color="#8B5CF6"
            badgeText="In-House"
          />

          <StatCard
            title="Monthly Revenue"
            value={monthlyRevenue}
            subtitle="Current billing cycle"
            icon={<AccountBalanceWallet />}
            color="#F59E0B"
            badgeText="Monthly Total"
          />
        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* 4.5 📊 EXECUTIVE VISUAL ANALYTICS & INTELLIGENCE SUITE                    */}
      {/* ========================================================================= */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Avatar sx={{ bgcolor: "rgba(67, 97, 238, 0.12)", color: themeConfig.primary, width: 32, height: 32, borderRadius: "8px" }}>
              <TrendingUp sx={{ fontSize: 18 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "1.05rem" }}>
              Visual Revenue &amp; Occupancy Analytics
            </Typography>
          </Box>
          <Chip
            icon={<AutoAwesome sx={{ fontSize: "14px !important", color: themeConfig.primary }} />}
            label="Live Realtime Telemetry"
            size="small"
            sx={{ fontWeight: 800, fontSize: "0.7rem", borderRadius: "8px", bgcolor: themeConfig.champagne, color: themeConfig.primaryDark }}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(12, 1fr)" },
            gap: 2.5,
          }}
        >
          {/* 1. Circular Occupancy Donut */}
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 4" } }}>
            <OccupancyDonutChart rooms={rooms} />
          </Box>

          {/* 2. 7-Day Revenue Curve Wave */}
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 8" } }}>
            <RevenueWaveChart dashboardData={dashboardData} isDarkMode={isDarkMode} />
          </Box>

          {/* 3. Daily Target Gauge */}
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 5" } }}>
            <DailyTargetGauge
              currentRevenue={liveTodayRevNum ?? 0}
              targetRevenue={hotelSettings?.dailyRevenueTarget ?? 35000}
            />
          </Box>

          {/* 4. Hourly Reception Traffic Heat Bars */}
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 7" } }}>
            <HourlyActivityBarChart bookings={bookings} guests={guests} />
          </Box>
        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* 5. 🎮 3D INTERACTIVE ROOM COMMAND MATRIX with 1-TAP ACTION TILES         */}
      {/* ========================================================================= */}
      <Card
        className="card-3d"
        sx={{
          borderRadius: "22px",
          border: `1px solid ${themeConfig.border}`,
          boxShadow: "0 10px 30px -5px rgba(12, 39, 59, 0.08)",
          background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #F9FBFC 100%)",
          mb: 4,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          {/* Filter Bar with Floor & Status Dropdowns */}
          <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", mb: 2.5, gap: 2 }}>
            <div>
              <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, letterSpacing: -0.3, display: "flex", alignItems: "center", gap: 1 }}>
                <HotelIcon sx={{ color: themeConfig.primary, fontSize: 24 }} />
                Live Room &amp; Occupancy Monitor
              </Typography>
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontSize: "0.82rem" }}>
                Real-time room occupancy, in-house guest details, tariffs, and payment dues
              </Typography>
            </div>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
              <TextField
                size="small"
                placeholder="Search room #, guest..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                sx={{ minWidth: { xs: "100%", sm: 200 }, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" sx={{ color: themeConfig.textMuted }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              {/* Floor Dropdown */}
              <TextField
                select
                size="small"
                value={selectedFloor}
                onChange={(e) => setSelectedFloor(e.target.value)}
                sx={{ minWidth: 125, "& .MuiOutlinedInput-root": { borderRadius: "12px", fontWeight: 700 } }}
              >
                <MenuItem value="ALL">All Floors</MenuItem>
                {Array.from(new Set(rooms.map((r) => r.floor || 1)))
                  .sort((a, b) => a - b)
                  .map((fl) => (
                    <MenuItem key={fl} value={String(fl)}>
                      Floor {fl}
                    </MenuItem>
                  ))}
              </TextField>

              {/* Status Dropdown */}
              <TextField
                select
                size="small"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                sx={{ minWidth: 155, "& .MuiOutlinedInput-root": { borderRadius: "12px", fontWeight: 700 } }}
              >
                <MenuItem value="ALL">All Status ({rooms.length})</MenuItem>
                <MenuItem value="AVAILABLE">🟢 Available ({totalAvailable})</MenuItem>
                <MenuItem value="OCCUPIED">🔵 Occupied ({totalOccupied})</MenuItem>
                <MenuItem value="RESERVED">🟡 Reserved ({totalReserved})</MenuItem>
                <MenuItem value="CLEANING">🟣 Cleaning ({totalCleaning})</MenuItem>
                <MenuItem value="MAINTENANCE">🔴 Maintenance ({totalMaintenance})</MenuItem>
              </TextField>

              {/* View Mode Switcher Toggle: Box Cards vs Table */}
              <ButtonGroup
                size="small"
                sx={{
                  borderRadius: "12px",
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  p: 0.3,
                  border: `1px solid ${themeConfig.border}`,
                }}
              >
                <Button
                  onClick={() => setRoomViewMode("box")}
                  variant={roomViewMode === "box" ? "contained" : "text"}
                  startIcon={<ViewModule fontSize="small" />}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    borderRadius: "10px !important",
                    textTransform: "none",
                    boxShadow: roomViewMode === "box" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                    bgcolor: roomViewMode === "box" ? themeConfig.primary : "transparent",
                    color: roomViewMode === "box" ? "#FFFFFF" : themeConfig.textMuted,
                  }}
                >
                  Box Cards
                </Button>
                <Button
                  onClick={() => setRoomViewMode("table")}
                  variant={roomViewMode === "table" ? "contained" : "text"}
                  startIcon={<TableRows fontSize="small" />}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    borderRadius: "10px !important",
                    textTransform: "none",
                    boxShadow: roomViewMode === "table" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                    bgcolor: roomViewMode === "table" ? themeConfig.primary : "transparent",
                    color: roomViewMode === "table" ? "#FFFFFF" : themeConfig.textMuted,
                  }}
                >
                  Table View
                </Button>
              </ButtonGroup>
            </Box>
          </Box>

          {/* Room Matrix Grid Cards or Table View */}
          {filteredRooms.length === 0 ? (
            <Box sx={{ py: 6 }}>
              <EmptyState
                title="No Rooms Found"
                description={rooms.length === 0 ? "No rooms configured yet." : "No rooms match your filter criteria."}
              />
            </Box>
          ) : (
            <>
              {roomViewMode === "box" ? (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "repeat(1, 1fr)",
                      sm: "repeat(2, 1fr)",
                      md: "repeat(3, 1fr)",
                      lg: "repeat(4, 1fr)",
                    },
                    gap: 2.2,
                  }}
                >
                  {paginatedRooms.map((room) => {
                    let statusBg = "rgba(16, 185, 129, 0.05)";
                    let statusBorder = "rgba(16, 185, 129, 0.35)";
                    let statusGlow = "rgba(16, 185, 129, 0.15)";
                    let statusLabel = "Available for Check-in";
                    let statusLabelColor = "#10B981";

                    if (room.status === "OCCUPIED") {
                      statusBg = "rgba(59, 130, 246, 0.05)";
                      statusBorder = "rgba(59, 130, 246, 0.35)";
                      statusGlow = "rgba(59, 130, 246, 0.15)";
                      statusLabel = "Active In-House Stay";
                      statusLabelColor = "#3B82F6";
                    } else if (room.status === "RESERVED") {
                      statusBg = "rgba(245, 158, 11, 0.05)";
                      statusBorder = "rgba(245, 158, 11, 0.35)";
                      statusGlow = "rgba(245, 158, 11, 0.15)";
                      statusLabel = "Upcoming Reservation";
                      statusLabelColor = "#F59E0B";
                    } else if (room.status === "CLEANING") {
                      statusBg = "rgba(139, 92, 246, 0.05)";
                      statusBorder = "rgba(139, 92, 246, 0.35)";
                      statusGlow = "rgba(139, 92, 246, 0.15)";
                      statusLabel = "Housekeeping In Progress";
                      statusLabelColor = "#8B5CF6";
                    } else if (room.status === "MAINTENANCE" || room.status === "BLOCKED") {
                      statusBg = "rgba(239, 68, 68, 0.05)";
                      statusBorder = "rgba(239, 68, 68, 0.35)";
                      statusGlow = "rgba(239, 68, 68, 0.15)";
                      statusLabel = "Under Maintenance / Blocked";
                      statusLabelColor = "#EF4444";
                    }

                    const matchedBooking = bookings.find(
                      (b) => String(b.roomNumber) === String(room.roomNumber) && (b.status === "CHECKED_IN" || b.status === "IN-HOUSE")
                    );

                    const guestName = room.guestName || matchedBooking?.guestName || (room.status === "OCCUPIED" ? "Resident Guest" : null);
                    const totalBill = matchedBooking?.totalAmount || room.customPricePerNight || room.pricePerNight || 0;
                    const advancePaid = matchedBooking?.advancePayment || 0;
                    const duesAmount = Math.max(0, totalBill - advancePaid);

                    return (
                      <Card
                        key={room._id}
                        elevation={0}
                        sx={{
                          p: 2.2,
                          borderRadius: "20px",
                          border: `1.5px solid ${statusBorder}`,
                          bgcolor: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "#FFFFFF",
                          boxShadow: `0 8px 24px -6px ${statusGlow}`,
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          transition: "all 0.25s ease",
                          "&:hover": {
                            transform: "translateY(-3px)",
                            boxShadow: `0 14px 28px -4px ${statusGlow}`,
                            borderColor: statusLabelColor,
                          },
                        }}
                      >
                        <Box>
                          {/* Header: Floor Badge + Price Per Night */}
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.2 }}>
                            <Chip
                              label={`Floor ${room.floor || 1}`}
                              size="small"
                              sx={{
                                fontSize: "0.68rem",
                                fontWeight: 800,
                                height: 20,
                                bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : themeConfig.champagne,
                                color: isDarkMode ? "#E2E8F0" : themeConfig.primaryDark,
                              }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 800, fontSize: "0.82rem", color: themeConfig.primary }}>
                              ₹{(room.customPricePerNight || room.roomType?.basePrice || room.pricePerNight || 3500).toLocaleString("en-IN")}/night
                            </Typography>
                          </Box>

                          {/* Room Number & Live Status Badge */}
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 0.5 }}>
                            <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5 }}>
                              Room #{room.roomNumber}
                            </Typography>
                            <StatusChip status={room.status} size="small" />
                          </Box>

                          {/* Room Category */}
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", mb: 1.5, fontWeight: 600 }}>
                            {room.roomType?.name || "Standard Room"} &bull; {room.roomType?.ac ? "AC" : "Non-AC"}
                          </Typography>

                          {/* OCCUPIED: Sleek Guest Details Box */}
                          {room.status === "OCCUPIED" && (
                            <Box
                              sx={{
                                p: 1.4,
                                borderRadius: "14px",
                                bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.1)" : "rgba(59, 130, 246, 0.05)",
                                border: `1px solid ${isDarkMode ? "rgba(59, 130, 246, 0.2)" : "rgba(59, 130, 246, 0.15)"}`,
                                mb: 1,
                              }}
                            >
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.6 }}>
                                <Avatar sx={{ width: 26, height: 26, bgcolor: "#3B82F6", color: "#FFFFFF", fontSize: "0.75rem", fontWeight: 800 }}>
                                  {guestName ? guestName[0].toUpperCase() : "G"}
                                </Avatar>
                                <Box sx={{ minWidth: 0, flex: 1 }}>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                                    {guestName}
                                  </Typography>
                                  {matchedBooking?.guestPhone && (
                                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.68rem", display: "block" }}>
                                      📱 {matchedBooking.guestPhone}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>

                              {/* Dues & Settlement Indicator */}
                              <Box
                                sx={{
                                  display: "flex",
                                  justifyContent: "space-between",
                                  alignItems: "center",
                                  pt: 0.8,
                                  mt: 0.6,
                                  borderTop: `1px dashed ${isDarkMode ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
                                }}
                              >
                                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.7rem", fontWeight: 600 }}>
                                  Dues Balance:
                                </Typography>
                                <Chip
                                  size="small"
                                  label={duesAmount > 0 ? `₹${duesAmount.toLocaleString("en-IN")} Pending` : "✓ Bill Settled"}
                                  sx={{
                                    height: 20,
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    bgcolor: duesAmount > 0 ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                                    color: duesAmount > 0 ? "#EF4444" : "#10B981",
                                    border: `1px solid ${duesAmount > 0 ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.25)"}`,
                                  }}
                                />
                              </Box>
                            </Box>
                          )}

                          {/* AVAILABLE: Clean Ready Details Box */}
                          {room.status === "AVAILABLE" && (
                            <Box
                              sx={{
                                p: 1.4,
                                borderRadius: "14px",
                                bgcolor: isDarkMode ? "rgba(16, 185, 129, 0.08)" : "rgba(16, 185, 129, 0.05)",
                                border: `1px solid ${isDarkMode ? "rgba(16, 185, 129, 0.2)" : "rgba(16, 185, 129, 0.15)"}`,
                                mb: 1,
                              }}
                            >
                              <Typography variant="caption" sx={{ color: "#10B981", fontWeight: 800, display: "flex", alignItems: "center", gap: 0.6, mb: 0.5 }}>
                                <CheckCircle sx={{ fontSize: 15 }} /> Clean &amp; Sanitized
                              </Typography>
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", fontSize: "0.7rem" }}>
                                🛏️ Ready for Walk-in &amp; Online Booking
                              </Typography>
                            </Box>
                          )}

                          {/* CLEANING: Housekeeping Countdown Box */}
                          {room.status === "CLEANING" && (() => {
                            const timerData = getCleaningTimerData(room);
                            return (
                              <Box
                                sx={{
                                  p: 1.4,
                                  borderRadius: "14px",
                                  bgcolor: isDarkMode ? "rgba(139, 92, 246, 0.08)" : "rgba(139, 92, 246, 0.05)",
                                  border: `1px solid ${isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.15)"}`,
                                  mb: 1,
                                }}
                              >
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#8B5CF6", fontSize: "0.72rem" }}>
                                    🧹 Turnaround: {timerData?.formatted || "12:00"}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.7rem", fontWeight: 700 }}>
                                    {timerData?.progressPercent || 50}%
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={timerData?.progressPercent || 50}
                                  sx={{
                                    borderRadius: "6px",
                                    height: 6,
                                    bgcolor: "rgba(139, 92, 246, 0.2)",
                                    "& .MuiLinearProgress-bar": { bgcolor: "#8B5CF6" },
                                  }}
                                />
                              </Box>
                            );
                          })()}

                          {/* MAINTENANCE / BLOCKED: Issue Box */}
                          {(room.status === "MAINTENANCE" || room.status === "BLOCKED") && (
                            <Box
                              sx={{
                                p: 1.4,
                                borderRadius: "14px",
                                bgcolor: "rgba(239, 68, 68, 0.06)",
                                border: "1px solid rgba(239, 68, 68, 0.2)",
                                mb: 1,
                              }}
                            >
                              <Typography variant="caption" sx={{ color: "#EF4444", fontWeight: 800, display: "flex", alignItems: "center", gap: 0.6 }}>
                                ⚠️ Service / Repair Inspection
                              </Typography>
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", fontSize: "0.7rem", mt: 0.3 }}>
                                Temporarily blocked from allocation
                              </Typography>
                            </Box>
                          )}
                        </Box>

                        {/* Clean Executive Telemetry Footer (No operational buttons) */}
                        <Box
                          sx={{
                            pt: 1.2,
                            borderTop: `1px solid ${isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Typography variant="caption" sx={{ fontSize: "0.68rem", fontWeight: 700, color: statusLabelColor }}>
                            {statusLabel}
                          </Typography>
                          <Box sx={{ width: 7, height: 7, borderRadius: "50%", bgcolor: statusLabelColor }} />
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              ) : (
                /* TABLE VIEW */
                <TableContainer
                  component={Paper}
                  sx={{
                    borderRadius: "16px",
                    border: `1px solid ${themeConfig.border}`,
                    boxShadow: "none",
                    overflowX: "auto",
                  }}
                >
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : themeConfig.champagne }}>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Room #</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Floor</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Category &amp; Type</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Live Status</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>In-House Guest Details</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Nightly Tariff</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Billing &amp; Dues</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {paginatedRooms.map((room) => {
                        const matchedBooking = bookings.find(
                          (b) => String(b.roomNumber) === String(room.roomNumber) && (b.status === "CHECKED_IN" || b.status === "IN-HOUSE")
                        );
                        const guestName = room.guestName || matchedBooking?.guestName || (room.status === "OCCUPIED" ? "Resident Guest" : null);
                        const totalBill = matchedBooking?.totalAmount || room.customPricePerNight || room.pricePerNight || 0;
                        const advancePaid = matchedBooking?.advancePayment || 0;
                        const duesAmount = Math.max(0, totalBill - advancePaid);

                        return (
                          <TableRow
                            key={room._id}
                            hover
                            sx={{
                              "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC" },
                            }}
                          >
                            <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.95rem" }}>
                              Room #{room.roomNumber}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`Floor ${room.floor || 1}`}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  height: 20,
                                  fontSize: "0.68rem",
                                  bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : themeConfig.champagne,
                                  color: isDarkMode ? "#E2E8F0" : themeConfig.primaryDark,
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 600, color: themeConfig.textMuted }}>
                              {room.roomType?.name || "Standard Room"} &bull; {room.roomType?.ac ? "AC" : "Non-AC"}
                            </TableCell>
                            <TableCell>
                              <StatusChip status={room.status} size="small" />
                            </TableCell>
                            <TableCell>
                              {room.status === "OCCUPIED" && guestName ? (
                                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                  <Avatar sx={{ width: 26, height: 26, bgcolor: "#3B82F6", color: "#FFFFFF", fontSize: "0.72rem", fontWeight: 800 }}>
                                    {guestName[0].toUpperCase()}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                      {guestName}
                                    </Typography>
                                    {matchedBooking?.guestPhone && (
                                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.68rem" }}>
                                        📱 {matchedBooking.guestPhone}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              ) : (
                                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontStyle: "italic" }}>
                                  {room.status === "CLEANING" ? "🧹 Turnaround in Progress" : room.status === "AVAILABLE" ? "✨ Ready for Guest" : "⚠️ Maintenance / Blocked"}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: themeConfig.primary }}>
                              ₹{(room.customPricePerNight || room.roomType?.basePrice || room.pricePerNight || 3500).toLocaleString("en-IN")}/n
                            </TableCell>
                            <TableCell>
                              {room.status === "OCCUPIED" ? (
                                <Chip
                                  size="small"
                                  label={duesAmount > 0 ? `₹${duesAmount.toLocaleString("en-IN")} Pending` : "✓ Paid"}
                                  sx={{
                                    height: 20,
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    bgcolor: duesAmount > 0 ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                                    color: duesAmount > 0 ? "#EF4444" : "#10B981",
                                    border: `1px solid ${duesAmount > 0 ? "rgba(239, 68, 68, 0.25)" : "rgba(16, 185, 129, 0.25)"}`,
                                  }}
                                />
                              ) : (
                                <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>—</Typography>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}

              {/* Room Matrix 8-per-page Pagination Controls */}
              {filteredRooms.length > roomsPerPage && (
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 2,
                    mt: 3,
                    pt: 2.5,
                    borderTop: `1px solid ${themeConfig.border}`,
                  }}
                >
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, fontSize: "0.8rem" }}>
                    Showing <strong>{(roomPage - 1) * roomsPerPage + 1}</strong> &ndash; <strong>{Math.min(roomPage * roomsPerPage, filteredRooms.length)}</strong> of <strong>{filteredRooms.length}</strong> Rooms
                  </Typography>

                  <Pagination
                    count={totalRoomPages}
                    page={roomPage}
                    onChange={(e, p) => setRoomPage(p)}
                    color="primary"
                    shape="rounded"
                    size="medium"
                    showFirstButton
                    showLastButton
                    sx={{
                      "& .MuiPaginationItem-root": { fontWeight: 800, borderRadius: "10px" },
                      "& .Mui-selected": { bgcolor: `${themeConfig.primary} !important`, color: "#FFFFFF !important" },
                    }}
                  />
                </Box>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 6. 👥 LIVE IN-HOUSE GUESTS & 1-CLICK WHATSAPP INVOICE DISPATCHER           */}
      {/* ========================================================================= */}
      <Card
        className="card-3d"
        sx={{
          borderRadius: "22px",
          border: `1px solid ${themeConfig.border}`,
          boxShadow: "0 10px 30px -5px rgba(12, 39, 59, 0.08)",
          background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #F9FBFC 100%)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Avatar sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, width: 32, height: 32, borderRadius: "8px" }}>
                <People sx={{ fontSize: 18 }} />
              </Avatar>
              <div>
                <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "1.05rem" }}>
                  Active In-House Guests &amp; Direct WhatsApp Folio
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                  Live billing balances, stay timelines, and 1-click WhatsApp tax invoice
                </Typography>
              </div>
            </Box>

            <Button
              size="small"
              endIcon={<ArrowForward fontSize="small" />}
              onClick={() => onTabChange && onTabChange(2)}
              sx={{
                fontWeight: 800,
                fontSize: "0.8rem",
                borderRadius: "10px",
                color: themeConfig.primaryDark,
                "&:hover": { bgcolor: themeConfig.champagne },
              }}
            >
              Guest Directory
            </Button>
          </Box>

          <TableContainer
            component={Paper}
            sx={{
              borderRadius: "16px",
              border: `1px solid ${themeConfig.border}`,
              boxShadow: "none",
              overflowX: "auto",
              maxHeight: "420px",
            }}
          >
            <Table size="small" stickyHeader sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Guest Name</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Room</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Stay Dates</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Balance Dues</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: themeConfig.textMain }}>1-Click WhatsApp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeRecentGuests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: themeConfig.textMuted, fontWeight: 700 }}>
                      No active in-house guests currently checked in.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeRecentGuests
                    .slice(guestPage * guestRowsPerPage, guestPage * guestRowsPerPage + guestRowsPerPage)
                    .map((g) => (
                      <TableRow key={g._id || g.name} sx={{ "&:hover": { bgcolor: `${themeConfig.primaryGlow} !important` } }}>
                        <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: "0.8rem", fontWeight: 800, bgcolor: themeConfig.primary, color: "#FFFFFF" }}>
                              {(g.name || "G").charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                {g.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem" }}>
                                {g.phone}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`Room #${g.roomAssigned}`}
                            size="small"
                            sx={{ fontWeight: 800, borderRadius: "6px", bgcolor: themeConfig.champagne, color: themeConfig.primaryDark }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: themeConfig.textMuted, fontSize: "0.82rem" }}>
                          {g.checkInDate} &ndash; {g.checkOutDate}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: g.pendingDues > 0 ? "#EF4444" : "#10B981" }}>
                          {g.pendingDues > 0 ? `₹${g.pendingDues.toLocaleString("en-IN")}` : "✓ Paid"}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={g.status} size="small" />
                        </TableCell>
                        <TableCell align="center">
                          <Tooltip title="Send Folio & Invoice on WhatsApp">
                            <IconButton
                              size="small"
                              onClick={() => handleSendWhatsAppInvoice(g)}
                              sx={{
                                bgcolor: "rgba(37, 211, 102, 0.15)",
                                color: "#25D366",
                                "&:hover": { bgcolor: "#25D366", color: "#FFFFFF" },
                              }}
                            >
                              <WhatsApp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Table Pagination */}
          {activeRecentGuests.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={activeRecentGuests.length}
              rowsPerPage={guestRowsPerPage}
              page={guestPage}
              onPageChange={(e, newPage) => setGuestPage(newPage)}
              onRowsPerPageChange={(e) => {
                setGuestRowsPerPage(parseInt(e.target.value, 10));
                setGuestPage(0);
              }}
              sx={{ borderTop: `1px solid ${themeConfig.border}`, mt: 1 }}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
