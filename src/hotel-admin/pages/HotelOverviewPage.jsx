"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  Chip,
  Avatar,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from "@mui/material";
import {
  TrendingUp,
  Person,
  CurrencyRupee,
  AccountBalanceWallet,
  ArrowForward,
  WhatsApp,
  Print,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { useSocket } from "@/shared/context/SocketContext";
import { sortBookingsNewestFirst, normalizeBooking, preferBookingStatus } from "@/shared/utils/liveSync";
import StatusChip from "@/shared/components/StatusChip";
import { TableCard, TableToolbar, TablePager } from "@/shared/components/DataTable";
import GuestDetailsModal from "@/shared/components/GuestDetailsModal";
import FolioPdfButton from "@/shared/components/FolioPdfButton";
import RoomNumberChips from "@/shared/components/RoomNumberChips";
import { downloadBookingBill } from "@/shared/utils/bookingPdf";
import { toast } from "@/shared/utils/toast";
import { createSafeGuestModalData } from "@/shared/utils/guestModalUtils";
import RevenueDetailsPage from "./RevenueDetailsPage";
import {
  OccupancyDonutChart,
  RevenueWaveChart,
} from "@/hotel-admin/components/DashboardCharts";
import { buildListQuery } from "@/shared/utils/listQuery";

const DEFAULT_HOTEL_SETTINGS = Object.freeze({
  checkInTime: "14:00",
  checkOutTime: "12:00",
  timezone: "Asia/Kolkata",
});

export default function HotelOverviewPage({
  user,
  dashboardData,
  hotelSettings = DEFAULT_HOTEL_SETTINGS,
  onRefresh,
  onTabChange,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [localBookings, setLocalBookings] = useState([]);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsTick, setBookingsTick] = useState(0);
  const [showRevenueDetailsView, setShowRevenueDetailsView] = useState(false);
  const [revenueFilterMode, setRevenueFilterMode] = useState("THIS_WEEK");

  const [guestPage, setGuestPage] = useState(0);
  const [guestRowsPerPage, setGuestRowsPerPage] = useState(5);
  const [billBusyId, setBillBusyId] = useState("");
  const [stayById, setStayById] = useState({});
  const [selectedGuestModal, setSelectedGuestModal] = useState({
    open: false,
    guest: null,
    guestId: null,
  });

  // Guest table: API page/limit (not load-100 then slice). Skip while revenue details is open.
  useEffect(() => {
    if (showRevenueDetailsView) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const q = buildListQuery({
          page: guestPage + 1,
          limit: guestRowsPerPage,
          status: "CHECKED_IN",
        });
        const res = await apiRequest(`${API_ENDPOINTS.RECEPTIONIST.BOOKINGS}?${q}`);
        const raw =
          res?.data?.bookings ||
          res?.bookings ||
          (Array.isArray(res?.data) ? res.data : null) ||
          (Array.isArray(res) ? res : []) ||
          [];
        const list = (Array.isArray(raw) ? raw : [])
          .map((b) => normalizeBooking(b) || b)
          .filter((item) => item && typeof item === "object");
        const total = Number(res?.data?.total ?? res?.total ?? list.length) || list.length;
        if (!cancelled) {
          setLocalBookings(list);
          setBookingsTotal(total);
        }
      } catch {
        if (!cancelled) {
          setLocalBookings([]);
          setBookingsTotal(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guestPage, guestRowsPerPage, bookingsTick, showRevenueDetailsView]);

  // Guest table refresh only — dashboard KPIs are refreshed by parent when socket says data changed
  useSocket(["booking:updated", "PAYMENT_RECORDED", "GUEST_CHECKED_OUT", "BOOKING_CREATED"], (payload, eventName) => {
    if (eventName === "booking:updated" && payload) {
      const normalized = normalizeBooking(payload);
      const key = String(payload?.id ?? payload?._id ?? "");
      const status = String(normalized?.booking_status || normalized?.status || "").toUpperCase();
      const terminal =
        status === "CHECKED_OUT" ||
        status === "DEPARTED" ||
        status === "CHECKOUT" ||
        status === "CHECK_OUT" ||
        status === "CANCELLED" ||
        Boolean(payload.deleted_at);
      if (key && normalized) {
        setStayById((prev) => {
          if (terminal) {
            const next = { ...prev };
            delete next[key];
            return next;
          }
          return {
            ...prev,
            [key]: {
              ...(prev[key] || {}),
              ...normalized,
              booking_status: preferBookingStatus(prev[key]?.booking_status || prev[key]?.status, normalized.booking_status || normalized.status),
              status: preferBookingStatus(prev[key]?.status || prev[key]?.booking_status, normalized.status || normalized.booking_status),
            },
          };
        });
        if (terminal) {
          setLocalBookings((prev) =>
            (Array.isArray(prev) ? prev : []).filter((b) => String(b?.id ?? b?._id) !== key)
          );
        }
      }
    }
    setBookingsTick((t) => t + 1);
  });

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
  const liveInHouseGuests = Number(ops.currentGuests ?? bookingsTotal) || 0;
  const liveTotalGuests = Number(
    dashboardData?.kpis?.total_guests ??
      dashboardData?.kpis?.totalGuests ??
      ops.totalGuests ??
      liveInHouseGuests
  ) || 0;

  const todayRevenue = `₹${liveTodayRevNum.toLocaleString("en-IN")}`;
  const weeklyEarnings = `₹${liveWeeklyRevNum.toLocaleString("en-IN")}`;
  const monthlyRevenue = `₹${liveMonthRevNum.toLocaleString("en-IN")}`;

  // Helper for current date
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  // Current API page of in-house guests (already page/limit from server)
  const activeRecentGuests = useMemo(() => {
    const list = localBookings;
    if (!list || list.length === 0) return [];

    const rows = list.map((b) => {
      const g = typeof b.guest === "object" ? b.guest : {};
      const paidAmt = b.paid_amount !== undefined
        ? Number(b.paid_amount)
        : (b.paidAmount !== undefined
          ? Number(b.paidAmount)
          : (b.advance_paid !== undefined
            ? Number(b.advance_paid)
            : (b.advancePaid !== undefined
              ? Number(b.advancePaid)
              : (b.advance_payment_amount !== undefined
                ? Number(b.advance_payment_amount)
                : (b.advancePaymentAmount !== undefined
                  ? Number(b.advancePaymentAmount)
                  : Number(b.advancePayment || 0))))));

      const totalAmt = Number(
        b.total_amount ??
        b.totalAmount ??
        b.grand_total ??
        b.grandTotal ??
        b.bill_amount ??
        b.invoice_total ??
        b.room?.customPricePerNight ??
        b.room?.pricePerNight ??
        0
      );

      const dueAmt = (b.due_amount !== undefined && b.due_amount !== null && b.due_amount !== "")
        ? Number(b.due_amount)
        : (b.dueAmount !== undefined && b.dueAmount !== null && b.dueAmount !== "")
          ? Number(b.dueAmount)
          : Math.max(0, totalAmt - paidAmt);

      const detail = stayById[String(b.id || b._id)] || {};
      const staySource = {
        ...b,
        ...Object.fromEntries(Object.entries(detail).filter(([, value]) => value != null && value !== "")),
      };

      // Extract room numbers cleanly from rooms array or direct properties
      let assignedRoom = "-";
      if (Array.isArray(staySource.rooms) && staySource.rooms.length > 0) {
        const nums = staySource.rooms
          .map((r) => r.room_number || r.roomNumber || (typeof r === "object" ? r.id || r._id : r))
          .filter(Boolean)
          .map(String);
        if (nums.length > 0) assignedRoom = nums.join(", ");
      } else if (Array.isArray(staySource.room_numbers) && staySource.room_numbers.length > 0) {
        assignedRoom = staySource.room_numbers.filter(Boolean).map(String).join(", ");
      } else if (Array.isArray(staySource.roomNumbers) && staySource.roomNumbers.length > 0) {
        assignedRoom = staySource.roomNumbers.filter(Boolean).map(String).join(", ");
      } else if (staySource.room_number || staySource.roomNumber) {
        assignedRoom = String(staySource.room_number || staySource.roomNumber);
      } else if (staySource.room?.room_number || staySource.room?.roomNumber) {
        assignedRoom = String(staySource.room.room_number || staySource.room.roomNumber);
      } else if (staySource.roomAssigned) {
        assignedRoom = String(staySource.roomAssigned);
      }
      assignedRoom = assignedRoom.replace(/^Room\s*#?\s*/i, "").trim() || "-";

      const liveDetail = stayById[String(b.id || b._id)] || {};
      const rawStatus = String(
        preferBookingStatus(
          liveDetail.booking_status || liveDetail.status,
          staySource.booking_status || staySource.status || "CONFIRMED"
        ) || "CONFIRMED"
      ).toUpperCase();
      const normalizedStatus = (rawStatus === "CHECKED_IN" || rawStatus === "IN-HOUSE" || rawStatus === "IN_HOUSE")
        ? "IN-HOUSE"
        : (rawStatus === "CHECKED_OUT" || rawStatus === "DEPARTED" || rawStatus === "CHECKOUT" || rawStatus === "CHECK_OUT")
          ? "CHECKED_OUT"
          : rawStatus;

      const guestName =
        staySource.primary_guest_name ||
        staySource.guestName ||
        staySource.guest_name ||
        g?.fullName ||
        g?.name ||
        staySource.name ||
        "Resident Guest";

      const guestPhone =
        staySource.mobile_number ||
        staySource.mobileNumber ||
        staySource.phone ||
        staySource.guestPhone ||
        g?.mobileNumber ||
        g?.phone ||
        "N/A";

      return {
        ...staySource,
        booking: staySource,
        activeBooking: staySource,
        _id: staySource.id || staySource._id,
        id: staySource.id || staySource._id,
        bookingId: staySource.id || staySource._id,
        booking_number: staySource.booking_number || staySource.bookingNumber,
        guestId: staySource.id || staySource._id || g?.id || g?._id || staySource.guest,
        name: guestName,
        email: staySource.email || g?.email || "",
        phone: guestPhone,
        roomAssigned: assignedRoom,
        checkInDate: formatStayLabel(staySource, "in"),
        checkOutDate: formatStayLabel(staySource, "out"),
        totalAmount: totalAmt,
        advancePayment: paidAmt,
        pendingDues: dueAmt,
        status: normalizedStatus,
      };
    });
    return sortBookingsNewestFirst(rows);
  }, [localBookings, stayById, todayStr]);

  function formatStayLabel(record, kind) {
    if (!record || typeof record !== "object") return "—";
    const names = kind === "in"
      ? ["actual_check_in", "actualCheckIn", "check_in_date", "checkInDate", "check_in", "checkIn", "expected_check_in", "from_date", "arrival_date", "created_at", "createdAt", "booked_at", "booking_date"]
      : ["actual_check_out", "actualCheckOut", "check_out_date", "checkOutDate", "check_out", "checkOut", "expected_check_out", "to_date", "departure_date", "updated_at", "updatedAt"];
    const sources = [record, record.booking, record.activeBooking, record.data].filter((item) => item && typeof item === "object");
    let raw = "";
    for (const source of sources) {
      for (const name of names) {
        const value = source[name];
        if (value == null || value === "") continue;
        raw = value instanceof Date ? value.toISOString() : value;
        break;
      }
      if (raw) break;
    }
    if (!raw) return "—";
    const text = String(raw).trim();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const clock = (hours, minutes) => {
      const hour = Number(hours);
      return `${hour % 12 || 12}:${String(minutes).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
    };
    const wall = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (wall && !text.endsWith("Z")) {
      return `${Number(wall[3])} ${months[Number(wall[2]) - 1]} ${wall[1]}, ${clock(wall[4], wall[5])}`;
    }
    const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly || /T00:00:00/.test(text)) {
      const part = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
      return part ? `${Number(part[3])} ${months[Number(part[2]) - 1]} ${part[1]}` : "—";
    }
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(parsed);
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

  // Show Full Dedicated Revenue Details Page when requested
  if (showRevenueDetailsView) {
    return (
      <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
        <RevenueDetailsPage
          onBackToDashboard={() => setShowRevenueDetailsView(false)}
          hotelSettings={hotelSettings}
          initialFilter={revenueFilterMode}
          dashboardData={dashboardData}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 } }}>
      {/* ========================================================================= */}
      {/* 4. FINANCIAL & REVENUE TELEMETRY (4 STAT CARDS - PHOTO 2 DESIGN)          */}
      {/* ========================================================================= */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" }, gap: 2, mb: 3.5 }}>
        {[
          { label: "Today's revenue", value: todayRevenue, color: "#10B981", note: "Collected today", icon: <CurrencyRupee sx={{ fontSize: 22 }} />, onClick: () => { setRevenueFilterMode("TODAY"); setShowRevenueDetailsView(true); } },
          { label: "Weekly earnings", value: weeklyEarnings, color: themeConfig.primary, note: "This week", icon: <TrendingUp sx={{ fontSize: 22 }} />, onClick: () => { setRevenueFilterMode("THIS_WEEK"); setShowRevenueDetailsView(true); } },
          { label: "Total guests", value: String(liveTotalGuests), color: themeConfig.textMain, note: `${liveInHouseGuests} in house`, icon: <Person sx={{ fontSize: 22 }} /> },
          { label: "Monthly revenue", value: monthlyRevenue, color: "#F59E0B", note: "This month", icon: <AccountBalanceWallet sx={{ fontSize: 22 }} />, onClick: () => { setRevenueFilterMode("THIS_MONTH"); setShowRevenueDetailsView(true); } },
        ].map((card) => (
          <Paper
            key={card.label}
            elevation={0}
            onClick={card.onClick}
            sx={{
              p: 2,
              borderRadius: "16px",
              border: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard || "#FFFFFF",
              minWidth: 0,
              cursor: card.onClick ? "pointer" : "default",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase" }}>{card.label}</Typography>
                <Typography sx={{ color: card.color, fontWeight: 900, fontSize: "1.35rem", lineHeight: 1.2, mt: 0.6 }}>{card.value}</Typography>
                <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.75rem", fontWeight: 700, mt: 0.4 }}>{card.note}</Typography>
              </Box>
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", display: "grid", placeItems: "center", bgcolor: themeConfig.bgSoft, color: card.color, flexShrink: 0 }}>
                {card.icon}
              </Box>
            </Box>
          </Paper>
        ))}
      </Box>

      {/* ========================================================================= */}
      {/* 4.5 📊 EXECUTIVE VISUAL ANALYTICS & INTELLIGENCE SUITE                    */}
      {/* ========================================================================= */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Avatar sx={{ bgcolor: themeConfig.bgSoft, color: themeConfig.primary, width: 32, height: 32, borderRadius: "8px" }}>
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
            sx={{ fontWeight: 800, fontSize: "0.7rem", borderRadius: "8px", bgcolor: themeConfig.champagne, color: themeConfig.accent, maxWidth: "100%" }}
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
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 12", lg: "span 5", xl: "span 4" }, display: "flex", flexDirection: "column" }}>
            <OccupancyDonutChart
              statuses={(dashboardData?.room_status_graph || dashboardData?.roomStatusGraph)?.statuses}
              occupancyRate={dashboardData?.operationsSummary?.occupancyRate}
            />
          </Box>

          {/* 2. 7-Day Revenue Curve Wave */}
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 12", lg: "span 7", xl: "span 8" }, display: "flex", flexDirection: "column" }}>
            <RevenueWaveChart dashboardData={dashboardData} isDarkMode={isDarkMode} />
          </Box>

        </Box>
      </Box>

      {/* 6. 👥 LIVE IN-HOUSE GUESTS & 1-CLICK WHATSAPP INVOICE DISPATCHER           */}
      {/* ========================================================================= */}
      <TableCard>
        <TableToolbar
          actions={
            <Button
              variant="outlined"
              size="small"
              endIcon={<ArrowForward />}
              onClick={() => onTabChange && onTabChange("guests")}
              sx={{ height: 40, borderRadius: "10px", fontWeight: 800, fontSize: "0.82rem", textTransform: "none", whiteSpace: "nowrap" }}
            >
              Full Guest Directory
            </Button>
          }
        />

          <TableContainer sx={{ overflowX: "auto", overflowY: "auto", maxHeight: { xs: "52vh", md: "420px" } }}>
            <Table size="small" stickyHeader sx={{ minWidth: 980 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Guest Name</TableCell>
                  <TableCell>Room</TableCell>
                  <TableCell>Stay Dates</TableCell>
                  <TableCell align="right">Total Amount</TableCell>
                  <TableCell align="right">Paid Amount</TableCell>
                  <TableCell align="right">Due Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeRecentGuests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3, color: themeConfig.textMuted, fontWeight: 700 }}>
                      No active in-house guests currently checked in.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeRecentGuests.map((g) => (
                      <TableRow
                        key={g._id || g.name}
                        hover
                        onClick={() => {
                          const resolvedId = g.id || g.bookingId || g._id || g.guestId;
                          setSelectedGuestModal({
                            open: true,
                            guest: createSafeGuestModalData(g),
                            guestId: resolvedId,
                          });
                        }}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(16, 185, 129, 0.05)" },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: "0.8rem", fontWeight: 800, bgcolor: themeConfig.primary, color: themeConfig.onPrimary }}>
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
                          <RoomNumberChips rooms={g.roomAssigned} />
                        </TableCell>
                        <TableCell sx={{ color: themeConfig.textMuted, fontSize: "0.82rem" }}>
                          <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1.35 }}>
                            <span>In: {g.checkInDate || "—"}</span>
                            <span>Out: {g.checkOutDate || "—"}</span>
                          </Box>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: themeConfig.textMain, whiteSpace: "nowrap" }}>
                          ₹{Number(g.totalAmount || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#10B981", whiteSpace: "nowrap" }}>
                          ₹{Number(g.advancePayment || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: g.pendingDues > 0 ? "#EF4444" : "#10B981", whiteSpace: "nowrap" }}>
                          ₹{Number(g.pendingDues || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={g.status} size="small" />
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.5 }}>
                            <Tooltip title={billBusyId === String(g.id || g._id || "") ? "Preparing bill" : "Bill"}>
                              <span>
                                <IconButton
                                  size="small"
                                  aria-label="Bill"
                                  disabled={billBusyId === String(g.id || g._id || "")}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const id = g.id || g._id || g.bookingId || g.booking_id;
                                    if (!id) return;
                                    try {
                                      setBillBusyId(String(id));
                                      const label = String(g.bookingNumber || g.booking_number || g.name || `bill-${id}`).replace(/\s+/g, "-");
                                      await downloadBookingBill(id, label);
                                      toast.show("Bill ready", "success");
                                    } catch (err) {
                                      toast.show(err?.message || "Could not generate the bill", "error");
                                    } finally {
                                      setBillBusyId("");
                                    }
                                  }}
                                  sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: "50%",
                                    bgcolor: "rgba(2, 132, 199, 0.12)",
                                    color: "#0284C7",
                                    "&:hover": { bgcolor: "rgba(2, 132, 199, 0.2)" },
                                  }}
                                >
                                  <Print sx={{ fontSize: 16 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <FolioPdfButton booking={g} iconOnly />
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
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        {bookingsTotal > 0 && (
          <TablePager
            rowsPerPageOptions={[5, 10, 25]}
            count={bookingsTotal}
            rowsPerPage={guestRowsPerPage}
            page={guestPage}
            onPageChange={(e, newPage) => setGuestPage(newPage)}
            onRowsPerPageChange={(e) => {
              setGuestRowsPerPage(parseInt(e.target.value, 10));
              setGuestPage(0);
            }}
          />
        )}
      </TableCard>

      <GuestDetailsModal
        open={selectedGuestModal.open}
        onClose={() => setSelectedGuestModal({ open: false, guest: null, guestId: null })}
        guestId={selectedGuestModal.guestId}
        guestData={selectedGuestModal.guest}
        hotelSettings={hotelSettings}
      />

    </Box>
  );
}
