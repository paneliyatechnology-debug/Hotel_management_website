"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
  Receipt,
  ReceiptLong,
  CalendarMonth,
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
import GuestDetailsModal from "@/shared/components/GuestDetailsModal";
import RevenueDetailsPage from "./RevenueDetailsPage";
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
  const [localRooms, setLocalRooms] = useState(rooms);
  const [showRevenueDetailsView, setShowRevenueDetailsView] = useState(false);
  const [revenueFilterMode, setRevenueFilterMode] = useState("THIS_WEEK");
  const [selectedGuestModal, setSelectedGuestModal] = useState({ open: false, guestId: null, guestData: null });
  const [roomSearch, setRoomSearch] = useState("");
  const [nowTime, setNowTime] = useState(Date.now());
  const [guestPage, setGuestPage] = useState(0);
  const [guestRowsPerPage, setGuestRowsPerPage] = useState(5);

  // Sync localRooms with incoming prop
  useEffect(() => {
    setLocalRooms(rooms);
  }, [rooms]);

  // Room Matrix Pagination (8 rooms per page)
  const [roomPage, setRoomPage] = useState(1);
  const roomsPerPage = 8;

  // View Mode: "box" (Cards) or "table" (List)
  const [roomViewMode, setRoomViewMode] = useState("box");

  const [notification, setNotification] = useState({ show: false, message: "", severity: "success" });

  const resolvedCleaningRoomIds = useRef(new Set());

  // Quick Room Status Handler (e.g. Mark Cleaned / AVAILABLE)
  const handleQuickRoomStatusChange = async (room, nextStatus = "AVAILABLE") => {
    if (!room?._id) return;
    try {
      // 1. Instant optimistic update in local state
      setLocalRooms((prev) =>
        prev.map((r) =>
          r._id === room._id
            ? { ...r, status: nextStatus, cleaningStartedAt: null, cleaningDurationMinutes: undefined }
            : r
        )
      );

      // 2. Persist to Backend API
      await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_ROOM_STATUS(room._id), {
        method: "PUT",
        body: { status: nextStatus },
      });

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to update room status:", err);
      if (onRefresh) onRefresh();
    }
  };

  // 1-second interval ticker for live housekeeping cleaning countdown & auto-transition
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setNowTime(now);

      // 🧹 Auto-transition 100% completed cleaning rooms to AVAILABLE
      if (Array.isArray(localRooms) && localRooms.length > 0) {
        localRooms.forEach((r) => {
          if (r.status === "CLEANING") {
            const startedAt = r.cleaningStartedAt
              ? new Date(r.cleaningStartedAt).getTime()
              : new Date(r.updatedAt || now).getTime();
            const durationSec = (r.cleaningDurationMinutes || 15) * 60;
            const elapsedSec = Math.floor((now - startedAt) / 1000);
            if (elapsedSec >= durationSec && !resolvedCleaningRoomIds.current.has(r._id)) {
              resolvedCleaningRoomIds.current.add(r._id);
              handleQuickRoomStatusChange(r, "AVAILABLE");
            }
          }
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [localRooms]);

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
    return localRooms.filter((r) => {
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
  }, [localRooms, selectedFloor, selectedStatus, roomSearch]);

  // Reset room page when filters change
  useEffect(() => {
    setRoomPage(1);
  }, [roomSearch, selectedFloor, selectedStatus]);

  // Paginated rooms (8 per page)
  const totalRoomPages = Math.ceil(filteredRooms.length / roomsPerPage) || 1;
  const paginatedRooms = filteredRooms.slice((roomPage - 1) * roomsPerPage, roomPage * roomsPerPage);

  const totalOccupied = localRooms.filter((r) => r.status === "OCCUPIED").length;
  const totalAvailable = localRooms.filter((r) => r.status === "AVAILABLE").length;
  const totalCleaning = localRooms.filter((r) => r.status === "CLEANING").length;
  const totalMaintenance = localRooms.filter((r) => r.status === "MAINTENANCE" || r.status === "BLOCKED").length;
  const totalReserved = localRooms.filter((r) => r.status === "RESERVED").length;

  // Live occupied rooms stay tariff sum
  const occupiedTariffSum = useMemo(() => {
    return localRooms
      .filter((r) => r.status === "OCCUPIED")
      .reduce((acc, r) => acc + (Number(r.pricePerNight) || Number(r.price) || 0), 0);
  }, [localRooms]);

  // Real live calculated data from backend & database (100% matched with Revenue Details screen)
  const fin = dashboardData?.financials || {};
  const ops = dashboardData?.operationsSummary || {};

  const liveTodayRevNum = Number(fin.todayRevenue ?? dashboardData?.todayRevenue ?? 0);
  const liveWeeklyRevNum = Number(
    fin.weeklyRevenue ??
    fin.weekRevenue ??
    dashboardData?.weeklyRevenue?.totalThisWeek ??
    dashboardData?.weeklyRevenue ??
    0
  );
  const liveMonthRevNum = Number(fin.monthlyRevenue ?? dashboardData?.monthlyRevenue ?? 0);
  const liveTotalGuests = guests.length || ops.currentGuests || 0;
  const liveInHouseGuests = guests.filter((g) => g.status === "IN-HOUSE").length || ops.currentGuests || 0;

  const todayRevenue = `₹${liveTodayRevNum.toLocaleString("en-IN")}`;
  const weeklyEarnings = `₹${liveWeeklyRevNum.toLocaleString("en-IN")}`;
  const monthlyRevenue = `₹${liveMonthRevNum.toLocaleString("en-IN")}`;
  const dayGrowthPercentage = fin.dayGrowthRate != null ? fin.dayGrowthRate : (liveTodayRevNum > 0 ? 100 : 0);
  const occupancyPercentageNum = rooms.length > 0 ? Math.round((totalOccupied / rooms.length) * 100) : 0;
  const occupancyRate = `${occupancyPercentageNum}%`;
  const cleaningPercentage = rooms.length > 0 ? Math.round((totalCleaning / rooms.length) * 100) : 0;
  const maintenancePercentage = rooms.length > 0 ? Math.round((totalMaintenance / rooms.length) * 100) : 0;

  // Average Daily Rate (ADR) & RevPAR calculation
  const adrNum = totalOccupied > 0
    ? Math.round(liveTodayRevNum / totalOccupied)
    : (Number(rooms[0]?.customPricePerNight || rooms[0]?.pricePerNight || rooms[0]?.roomType?.basePrice || 0));
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
          const paidAmt = b.paidAmount !== undefined ? Number(b.paidAmount) : (b.advancePaymentAmount !== undefined ? Number(b.advancePaymentAmount) : (b.advancePaid !== undefined ? Number(b.advancePaid) : (b.advancePayment || 0)));
          const totalAmt = Number(b.totalAmount || b.room?.customPricePerNight || b.room?.pricePerNight || 0);
          const dueAmt = b.dueAmount !== undefined ? Number(b.dueAmount) : Math.max(0, totalAmt - paidAmt);
          const assignedRoom = b.roomNumber || b.room?.roomNumber || (Array.isArray(b.roomNumbers) && b.roomNumbers.length > 0 ? b.roomNumbers.join(", ") : "-");
          return {
            _id: b._id,
            bookingId: b._id,
            guestId: g?._id || b.guest,
            name: g?.fullName || g?.name || b.guestName || "Resident Guest",
            email: g?.email || b.email || "",
            phone: g?.mobileNumber || g?.phone || b.mobileNumber || b.guestPhone || "N/A",
            roomAssigned: assignedRoom,
            checkInDate: inDateFormattedDate(b.actualCheckIn || b.checkInDate) || "Today",
            checkOutDate: inDateFormattedDate(b.actualCheckOut || b.checkOutDate) || "Tomorrow",
            totalAmount: totalAmt,
            advancePayment: paidAmt,
            pendingDues: dueAmt,
            status: b.status === "CHECKED_IN" ? "IN-HOUSE" : b.status === "CHECKED_OUT" ? "DEPARTED" : b.status || "IN-HOUSE",
          };
        });
      }
    }

    return (guests || []).map((g) => {
      const paidAmt = g.paidAmount !== undefined ? Number(g.paidAmount) : (g.advancePayment || 0);
      const totalAmt = Number(g.totalAmount || 0);
      const dueAmt = g.dueAmount !== undefined ? Number(g.dueAmount) : Math.max(0, totalAmt - paidAmt);
      const assignedRoom = g.roomNumber || g.roomAssigned || (Array.isArray(g.roomNumbers) && g.roomNumbers.length > 0 ? g.roomNumbers.join(", ") : "-");
      return {
        _id: g._id,
        guestId: g._id,
        name: g.fullName || g.name || "Guest",
        email: g.email || "",
        phone: g.mobileNumber || g.phone || "N/A",
        roomAssigned: assignedRoom,
        checkInDate: inDateFormattedDate(g.actualCheckIn || g.checkInDate) || "Today",
        checkOutDate: inDateFormattedDate(g.actualCheckOut || g.checkOutDate) || "Tomorrow",
        totalAmount: totalAmt,
        advancePayment: paidAmt,
        pendingDues: dueAmt,
        status: g.status || "IN-HOUSE",
      };
    });
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
    const hotelName = user?.hotel?.name || "MYOWNPMS";
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
  const timeGreeting = currentHour < 12 ? "Good Morning" : currentHour < 17 ? "Good Afternoon" : "Good Evening";
  const liveClockString = new Date(nowTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  // Show Full Dedicated Revenue Details Page when requested
  if (showRevenueDetailsView) {
    return (
      <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
        <RevenueDetailsPage
          onBackToDashboard={() => setShowRevenueDetailsView(false)}
          hotelSettings={hotelSettings}
          initialFilter={revenueFilterMode}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 } }}>
      {/* ========================================================================= */}
      {/* 1. HERO COMMAND RIBBON with LIVE CLOCK & SAAS TELEMETRY                   */}
      {/* ========================================================================= */}
      <Box
        sx={{
          mb: 3,
          p: { xs: 2, sm: 2.5, md: 3 },
          borderRadius: { xs: "18px", sm: "24px" },
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

        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 2, position: "relative", zIndex: 1 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8, flexWrap: "wrap" }}>
              <Avatar
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                }}
              >
                <HotelIcon fontSize="small" />
              </Avatar>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: { xs: "0.65rem", sm: "0.72rem" },
                  display: "flex",
                  alignItems: "center",
                  gap: 0.6,
                }}
              >
                <HotelIcon sx={{ fontSize: 14 }} />
                {timeGreeting} &bull; Live Operations Center
              </Typography>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: -0.5, fontSize: { xs: "1.25rem", sm: "1.8rem" } }}>
              {user?.hotel?.name || "MYOWNPMS"}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 0.5, fontSize: { xs: "0.78rem", sm: "0.85rem" }, flexWrap: "wrap", display: "flex", alignItems: "center", gap: 0.6 }}>
              <LocationOn sx={{ fontSize: 15 }} />
              <span>{user?.hotel?.city ? `${user.hotel.city} • ` : ""}</span>
              <span>Total Inventory: <strong>{rooms.length} Rooms</strong></span>
              <span>&bull; Occupancy: <strong>{occupancyRate}</strong></span>
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "space-between", sm: "flex-end" } }}>
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
                width: { xs: "100%", sm: "auto" },
                justifyContent: "center",
                whiteSpace: "nowrap",
                borderRadius: "14px",
                bgcolor: isDarkMode ? "rgba(255,255,255,0.12)" : "#FFFFFF",
                color: isDarkMode ? "#FFFFFF" : (themeConfig.primaryDark || "#0C273B"),
                fontWeight: 800,
                fontSize: { xs: "0.78rem", sm: "0.82rem" },
                px: { xs: 2, sm: 2.5 },
                py: 1,
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
      {/* 4. FINANCIAL & REVENUE TELEMETRY (4 STAT CARDS - PHOTO 2 DESIGN)          */}
      {/* ========================================================================= */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.15)", color: "#10B981", width: 32, height: 32, borderRadius: "8px" }}>
              <CurrencyRupee sx={{ fontSize: 18 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: { xs: "0.95rem", sm: "1.05rem" } }}>
              Financial &amp; Revenue Telemetry
            </Typography>
          </Box>
          <Chip
            label="Live Real-time Audit"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: "0.72rem",
              borderRadius: "8px",
              bgcolor: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              maxWidth: "100%",
            }}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
            gap: 2.5,
          }}
        >
          {/* Card 1: Today's Revenue */}
          <StatCard
            title="TODAY'S REVENUE"
            value={todayRevenue}
            subtitle={liveTodayRevNum > 0 ? "Verified collections today" : "No new billing transactions today"}
            icon={<CurrencyRupee />}
            color="#10B981"
            trend="Live Counter"
            trendType="up"
            badgeText="Counter"
            onClick={() => {
              setRevenueFilterMode("TODAY");
              setShowRevenueDetailsView(true);
            }}
          />

          {/* Card 2: Weekly Total Earnings */}
          <StatCard
            title="WEEKLY TOTAL EARNINGS"
            value={weeklyEarnings}
            subtitle="7-day rolling revenue aggregate"
            icon={<TrendingUp />}
            color="#0B8EE0"
            trend="Last 7 Days"
            trendType="up"
            badgeText="Weekly Total"
            onClick={() => {
              setRevenueFilterMode("THIS_WEEK");
              setShowRevenueDetailsView(true);
            }}
          />

          {/* Card 3: Total Guests */}
          <StatCard
            title="TOTAL GUESTS"
            value={`${liveTotalGuests || liveInHouseGuests || 0} Guests`}
            subtitle={`${liveInHouseGuests || 0} Active in-house • ${totalOccupied} Rooms`}
            icon={<Person />}
            color="#8B5CF6"
            badgeText="In-House"
            onClick={() => {
              if (onTabChange) {
                onTabChange(2);
              }
            }}
          />

          {/* Card 4: Monthly Revenue */}
          <StatCard
            title="MONTHLY REVENUE"
            value={monthlyRevenue}
            subtitle="Current billing cycle"
            icon={<AccountBalanceWallet />}
            color="#F59E0B"
            badgeText="Monthly Total"
            onClick={() => {
              setRevenueFilterMode("THIS_MONTH");
              setShowRevenueDetailsView(true);
            }}
          />
        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* 4.5 📊 EXECUTIVE VISUAL ANALYTICS & INTELLIGENCE SUITE                    */}
      {/* ========================================================================= */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Avatar sx={{ bgcolor: "rgba(67, 97, 238, 0.12)", color: themeConfig.primary, width: 32, height: 32, borderRadius: "8px" }}>
              <TrendingUp sx={{ fontSize: 18 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: { xs: "0.95rem", sm: "1.05rem" } }}>
              Visual Revenue &amp; Occupancy Analytics
            </Typography>
          </Box>
          <Chip
            icon={<TrendingUp sx={{ fontSize: "14px !important", color: themeConfig.primary }} />}
            label="Live Realtime Telemetry"
            size="small"
            sx={{ fontWeight: 800, fontSize: "0.7rem", borderRadius: "8px", bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, maxWidth: "100%" }}
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
              targetRevenue={Number(hotelSettings?.dailyRevenueTarget || (rooms.reduce((acc, r) => acc + (Number(r.customPricePerNight || r.roomType?.basePrice || r.pricePerNight || 0)), 0)) || 0)}
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
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, mb: 2.5, gap: 2 }}>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.3, display: "flex", alignItems: "center", gap: 1, fontSize: { xs: "1rem", sm: "1.15rem", md: "1.25rem" } }}>
                <HotelIcon sx={{ color: themeConfig.primary, fontSize: { xs: 20, sm: 24 } }} />
                Live Room &amp; Occupancy Monitor
              </Typography>
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontSize: { xs: "0.75rem", sm: "0.82rem" }, mt: 0.3 }}>
                Real-time room occupancy, in-house guest details, tariffs, and payment dues
              </Typography>
            </Box>

            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", width: { xs: "100%", sm: "auto" } }}>
              <TextField
                size="small"
                placeholder="Search room #, guest..."
                value={roomSearch}
                onChange={(e) => setRoomSearch(e.target.value)}
                sx={{ width: "100%", minWidth: { xs: "100%", sm: 200 }, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
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

              <Box sx={{ display: "flex", gap: 1.5, width: { xs: "100%", sm: "auto" }, flexWrap: { xs: "nowrap", sm: "wrap" } }}>
                {/* Floor Dropdown */}
                <TextField
                  select
                  size="small"
                  value={selectedFloor}
                  onChange={(e) => setSelectedFloor(e.target.value)}
                  sx={{ flex: 1, minWidth: { xs: 0, sm: 125 }, "& .MuiOutlinedInput-root": { borderRadius: "12px", fontWeight: 700 } }}
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
                  sx={{ flex: 1, minWidth: { xs: 0, sm: 155 }, "& .MuiOutlinedInput-root": { borderRadius: "12px", fontWeight: 700 } }}
                >
                  <MenuItem value="ALL">All Status ({rooms.length})</MenuItem>
                  <MenuItem value="AVAILABLE">🟢 Available ({totalAvailable})</MenuItem>
                  <MenuItem value="OCCUPIED">🔵 Occupied ({totalOccupied})</MenuItem>
                  <MenuItem value="RESERVED">🟡 Reserved ({totalReserved})</MenuItem>
                  <MenuItem value="CLEANING">🟣 Cleaning ({totalCleaning})</MenuItem>
                  <MenuItem value="MAINTENANCE">🔴 Maintenance ({totalMaintenance})</MenuItem>
                </TextField>
              </Box>

              {/* View Mode Switcher Toggle: Box Cards vs Table */}
              <ButtonGroup
                size="small"
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  borderRadius: "12px",
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
                  p: 0.3,
                  border: `1px solid ${themeConfig.border}`,
                  display: "flex",
                }}
              >
                <Button
                  onClick={() => setRoomViewMode("box")}
                  variant={roomViewMode === "box" ? "contained" : "text"}
                  startIcon={<ViewModule fontSize="small" />}
                  sx={{
                    flex: 1,
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    borderRadius: "10px !important",
                    textTransform: "none",
                    whiteSpace: "nowrap",
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
                    flex: 1,
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    borderRadius: "10px !important",
                    textTransform: "none",
                    whiteSpace: "nowrap",
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

                    const matchedBooking = bookings.find((b) => {
                      const bStatus = b.status === "CHECKED_IN" || b.status === "IN-HOUSE";
                      if (!bStatus) return false;
                      const rNum = String(room.roomNumber);
                      const rId = String(room._id || room.id);
                      const bRoomId = String(b.room?._id || b.room || "");
                      const bRoomNum = String(b.roomNumber || b.room?.roomNumber || "");
                      const bRoomsList = Array.isArray(b.roomNumbers) ? b.roomNumbers.map(String) : [];
                      const bRoomIdsList = Array.isArray(b.rooms) ? b.rooms.map((r) => String(typeof r === "object" ? r._id || r.id : r)) : [];
                      return bRoomNum === rNum || bRoomId === rId || bRoomsList.includes(rNum) || bRoomIdsList.includes(rId);
                    });

                    const guestName =
                      matchedBooking?.guest?.fullName ||
                      matchedBooking?.guest?.name ||
                      matchedBooking?.guestName ||
                      room.guestName ||
                      (room.status === "OCCUPIED" ? "Resident Guest" : null);

                    const guestPhone =
                      matchedBooking?.guest?.mobileNumber ||
                      matchedBooking?.guest?.phone ||
                      matchedBooking?.guestPhone ||
                      matchedBooking?.mobileNumber ||
                      "";

                    const totalBill =
                      matchedBooking?.totalAmount !== undefined
                        ? Number(matchedBooking.totalAmount)
                        : Number(room.customPricePerNight || room.pricePerNight || 0);

                    const advancePaid =
                      matchedBooking?.paidAmount !== undefined
                        ? Number(matchedBooking.paidAmount)
                        : matchedBooking?.advancePaymentAmount !== undefined
                        ? Number(matchedBooking.advancePaymentAmount)
                        : matchedBooking?.advancePaid !== undefined
                        ? Number(matchedBooking.advancePaid)
                        : 0;

                    const duesAmount = matchedBooking?.dueAmount !== undefined
                      ? Number(matchedBooking.dueAmount)
                      : Math.max(0, totalBill - advancePaid);

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
                              ₹{(Number(room.customPricePerNight || room.roomType?.basePrice || room.pricePerNight || 0)).toLocaleString("en-IN")}/night
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
                                  {guestPhone && (
                                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.68rem", display: "block" }}>
                                      📱 {guestPhone}
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
                            const isDone = timerData?.isComplete;
                            return (
                              <Box
                                sx={{
                                  p: 1.4,
                                  borderRadius: "14px",
                                  bgcolor: isDone ? "rgba(16, 185, 129, 0.08)" : (isDarkMode ? "rgba(139, 92, 246, 0.08)" : "rgba(139, 92, 246, 0.05)"),
                                  border: `1px solid ${isDone ? "rgba(16, 185, 129, 0.3)" : (isDarkMode ? "rgba(139, 92, 246, 0.2)" : "rgba(139, 92, 246, 0.15)")}`,
                                  mb: 1,
                                }}
                              >
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: isDone ? "#10B981" : "#8B5CF6", fontSize: "0.72rem" }}>
                                    {isDone ? "✨ Cleaning Done (100%)" : `🧹 Turnaround: ${timerData?.formatted || "12:00"}`}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: isDone ? "#10B981" : themeConfig.textMuted, fontSize: "0.7rem", fontWeight: 700 }}>
                                    {timerData?.progressPercent || 50}%
                                  </Typography>
                                </Box>
                                <LinearProgress
                                  variant="determinate"
                                  value={timerData?.progressPercent || 50}
                                  sx={{
                                    borderRadius: "6px",
                                    height: 6,
                                    bgcolor: isDone ? "rgba(16, 185, 129, 0.2)" : "rgba(139, 92, 246, 0.2)",
                                    "& .MuiLinearProgress-bar": { bgcolor: isDone ? "#10B981" : "#8B5CF6" },
                                  }}
                                />
                                <Button
                                  size="small"
                                  fullWidth
                                  variant={isDone ? "contained" : "outlined"}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleQuickRoomStatusChange(room, "AVAILABLE");
                                  }}
                                  sx={{
                                    mt: 1,
                                    py: 0.4,
                                    fontSize: "0.72rem",
                                    fontWeight: 800,
                                    borderRadius: "8px",
                                    textTransform: "none",
                                    bgcolor: isDone ? "#10B981" : "transparent",
                                    color: isDone ? "#FFFFFF" : "#8B5CF6",
                                    borderColor: isDone ? "#10B981" : "rgba(139, 92, 246, 0.4)",
                                    "&:hover": {
                                      bgcolor: isDone ? "#059669" : "rgba(139, 92, 246, 0.1)",
                                      borderColor: isDone ? "#059669" : "#8B5CF6",
                                    },
                                  }}
                                >
                                  {isDone ? "✓ Set Available Now" : "⚡ Mark Cleaned (Make Available)"}
                                </Button>
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
                        const matchedBooking = bookings.find((b) => {
                          const bStatus = b.status === "CHECKED_IN" || b.status === "IN-HOUSE" || b.status === "RESERVED" || b.status === "CONFIRMED";
                          if (!bStatus) return false;
                          const rNum = String(room.roomNumber);
                          const rId = String(room._id || room.id);
                          const bRoomId = String(b.room?._id || b.room || "");
                          const bRoomNum = String(b.roomNumber || b.room?.roomNumber || "");
                          const bRoomsList = Array.isArray(b.roomNumbers) ? b.roomNumbers.map(String) : [];
                          const bRoomIdsList = Array.isArray(b.rooms) ? b.rooms.map((r) => String(typeof r === "object" ? r._id || r.id : r)) : [];
                          return bRoomNum === rNum || bRoomId === rId || bRoomsList.includes(rNum) || bRoomIdsList.includes(rId);
                        });

                        const guestName = (room.status === "OCCUPIED" || room.status === "RESERVED")
                          ? (matchedBooking?.guest?.fullName || matchedBooking?.guest?.name || matchedBooking?.guestName || room.guestName || "Resident Guest")
                          : null;

                        const guestPhone =
                          matchedBooking?.guest?.mobileNumber ||
                          matchedBooking?.guest?.phone ||
                          matchedBooking?.guestPhone ||
                          matchedBooking?.mobileNumber ||
                          "";

                        const totalBill =
                          matchedBooking?.totalAmount !== undefined
                            ? Number(matchedBooking.totalAmount)
                            : Number(room.customPricePerNight || room.pricePerNight || 0);

                        const advancePaid =
                          matchedBooking?.paidAmount !== undefined
                            ? Number(matchedBooking.paidAmount)
                            : matchedBooking?.advancePaymentAmount !== undefined
                            ? Number(matchedBooking.advancePaymentAmount)
                            : matchedBooking?.advancePaid !== undefined
                            ? Number(matchedBooking.advancePaid)
                            : 0;

                        const duesAmount = matchedBooking?.dueAmount !== undefined
                          ? Number(matchedBooking.dueAmount)
                          : Math.max(0, totalBill - advancePaid);

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
                                    {guestPhone && (
                                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.68rem" }}>
                                        📱 {guestPhone}
                                      </Typography>
                                    )}
                                  </Box>
                                </Box>
                              ) : room.status === "CLEANING" ? (() => {
                                const timerData = getCleaningTimerData(room);
                                const isDone = timerData?.isComplete;
                                return (
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                    <Chip
                                      size="small"
                                      label={isDone ? "✨ 100% Done" : `🧹 ${timerData?.formatted || "12:00"} (${timerData?.progressPercent || 50}%)`}
                                      sx={{
                                        height: 22,
                                        fontSize: "0.68rem",
                                        fontWeight: 800,
                                        bgcolor: isDone ? "rgba(16, 185, 129, 0.12)" : "rgba(139, 92, 246, 0.12)",
                                        color: isDone ? "#10B981" : "#8B5CF6",
                                        border: `1px solid ${isDone ? "rgba(16, 185, 129, 0.3)" : "rgba(139, 92, 246, 0.3)"}`,
                                      }}
                                    />
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleQuickRoomStatusChange(room, "AVAILABLE");
                                      }}
                                      sx={{
                                        py: 0.2,
                                        px: 1,
                                        height: 22,
                                        fontSize: "0.68rem",
                                        fontWeight: 800,
                                        borderRadius: "6px",
                                        textTransform: "none",
                                        color: isDone ? "#10B981" : "#8B5CF6",
                                        borderColor: isDone ? "#10B981" : "rgba(139, 92, 246, 0.4)",
                                        "&:hover": {
                                          bgcolor: isDone ? "rgba(16, 185, 129, 0.1)" : "rgba(139, 92, 246, 0.1)",
                                        },
                                      }}
                                    >
                                      {isDone ? "Set Available" : "Make Available"}
                                    </Button>
                                  </Box>
                                );
                              })() : (
                                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontStyle: "italic" }}>
                                  {room.status === "AVAILABLE" ? "✨ Ready for Guest" : "⚠️ Maintenance / Blocked"}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: themeConfig.primary }}>
                              ₹{(Number(room.customPricePerNight || room.roomType?.basePrice || room.pricePerNight || 0)).toLocaleString("en-IN")}/night
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
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1.5, mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
              <Avatar sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, width: { xs: 26, sm: 32 }, height: { xs: 26, sm: 32 }, borderRadius: "8px", mt: 0.2 }}>
                <People sx={{ fontSize: { xs: 15, sm: 18 } }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: { xs: "0.82rem", sm: "0.98rem", md: "1.05rem" }, letterSpacing: -0.2, lineHeight: 1.25 }}>
                  Active In-House Guests &amp; Direct WhatsApp Folio
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: { xs: "0.7rem", sm: "0.8rem" }, display: "block", mt: 0.3, lineHeight: 1.25 }}>
                  Live billing balances, stay timelines, and 1-click WhatsApp tax invoice
                </Typography>
              </Box>
            </Box>

            <Button
              size="small"
              endIcon={<ArrowForward fontSize="small" />}
              onClick={() => onTabChange && onTabChange(2)}
              sx={{
                width: { xs: "100%", sm: "auto" },
                alignSelf: { xs: "stretch", sm: "center" },
                whiteSpace: "nowrap",
                fontWeight: 800,
                fontSize: { xs: "0.75rem", sm: "0.8rem" },
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
                      <TableRow
                        key={g._id || g.name}
                        hover
                        onClick={() => setSelectedGuestModal({ open: true, guestId: g.guestId || g._id, guestData: g })}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(16, 185, 129, 0.05)" },
                        }}
                      >
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
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
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

      {/* Full Comprehensive Guest Details & Folio Modal (Requirement #8 & #9) */}
      <GuestDetailsModal
        open={selectedGuestModal.open}
        guestId={selectedGuestModal.guestId}
        guestData={selectedGuestModal.guestData}
        onClose={() => setSelectedGuestModal({ open: false, guestId: null, guestData: null })}
        hotelSettings={hotelSettings}
      />
    </Box>
  );
}
