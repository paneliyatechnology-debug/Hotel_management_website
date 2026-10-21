"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Grid,
  Divider,
  TablePagination,
  CircularProgress,
} from "@mui/material";
import {
  Add,
  Receipt,
  Logout,
  Search,
  CurrencyRupee,
  Schedule,
  MeetingRoom,
  Warning,
  CheckCircle,
  Phone,
  ContentCopy,
  CreditCard,
  AccountBalance,
  QrCode2,
  Close,
  Print,
  InfoOutlined,
  Fastfood,
  Check,
  WhatsApp,
} from "@/shared/icons";
import dynamic from "next/dynamic";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { useSocket } from "@/shared/context/SocketContext";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import StatCard from "@/shared/components/StatCard";
import { formatTime12Hour, calculateOverstayFee } from "@/shared/utils/timeUtils";
import CheckoutDialog from "@/receptionist/components/CheckoutDialog";
import { sendCheckInWhatsApp, sendCheckoutBillWhatsApp } from "@/shared/utils/whatsappUtils";
import { toast } from "@/shared/utils/toast";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { createSafeGuestModalData } from "@/shared/utils/guestModalUtils";
import GuestDetailsModal from "@/shared/components/GuestDetailsModal";

export default function InHouseFoliosPage({
  bookings = [],
  hotelSettings = {
    checkInTime: "14:00",
    checkOutTime: "12:00",
    timezone: "Asia/Kolkata",
    upiId: "jatinkakadiya234-1@okicici",
  },
  onRefresh,
  onCheckOut,
  onOpenInvoice,
  onOpenPosCharge,
  loading = false,
  loadError = "",
  checkoutRequest = null,
  onCheckoutRequestHandled,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [stayById, setStayById] = useState({});

  useEffect(() => {
    let cancelled = false;
    const ids = bookings.map((booking) => booking.id || booking._id).filter(Boolean);
    if (ids.length === 0) return undefined;
    (async () => {
      const loaded = {};
      await Promise.all(ids.map(async (id) => {
        try {
          const res = await apiRequest(API_ENDPOINTS.BOOKINGS.BY_ID(id), { forceRefresh: true });
          const detail = res?.data?.data || res?.data || null;
          if (detail && typeof detail === "object" && !Array.isArray(detail)) loaded[String(id)] = detail;
        } catch {
          loaded[String(id)] = null;
        }
      }));
      if (!cancelled) setStayById((prev) => ({ ...prev, ...loaded }));
    })();
    return () => {
      cancelled = true;
    };
  }, [bookings]);

  // Real-Time Socket Auto-Sync
  useSocket(
    [
      "ROOM_UPDATED",
      "BOOKING_CREATED",
      "BOOKING_UPDATED",
      "GUEST_CHECKED_OUT",
      "PAYMENT_RECORDED",
      "GUEST_UPDATED",
      "DASHBOARD_SYNC",
    ],
    () => {
      if (onRefresh) onRefresh();
    }
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatusTab, setActiveStatusTab] = useState("CHECKED_IN");

  const [balanceFilter, setBalanceFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Booking currently being checked out (shared check-out dialog)
  const [checkoutTarget, setCheckoutTarget] = useState(null);

  // Folio Details Modal State
  const [detailsModal, setDetailsModal] = useState({
    open: false,
    booking: null,
  });

  // Guest Details Modal State
  const [selectedGuestModal, setSelectedGuestModal] = useState({
    open: false,
    guest: null,
    guestId: null,
  });

  // Full-size Photo Preview Modal State
  const [previewImage, setPreviewImage] = useState(null);

  const checkOutTimeFormatted = formatTime12Hour(hotelSettings?.checkOutTime || "12:00");
  const checkInTimeFormatted = formatTime12Hour(hotelSettings?.checkInTime || "14:00");
  const timezoneStr = hotelSettings?.timezone || "Asia/Kolkata";
  const todayStr = new Date().toISOString().split("T")[0];

  const formatDDMMYYYY = (val) => {
    if (!val || val === "N/A" || val === "Today" || val === "Tomorrow") return val || "";
    if (typeof val === "string" && /^\d{2}-\d{2}-\d{4}$/.test(val)) return val;
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split("-");
      return `${d}-${m}-${y}`;
    }
    if (typeof val === "string" && val.includes("/")) {
      const parts = val.split("/");
      if (parts.length === 3) {
        const m = parts[0].padStart(2, "0");
        const d = parts[1].padStart(2, "0");
        const y = parts[2];
        return `${d}-${m}-${y}`;
      }
    }
    const dateObj = new Date(val);
    if (isNaN(dateObj.getTime())) return String(val);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const formatStayStamp = (val) => {
    if (!val) return "—";
    const text = String(val).trim();
    if (/^(today|tomorrow)$/i.test(text)) return "—";
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const toLabel = (year, month, day, hour24, minute) => {
      const hourNum = Number(hour24);
      const ampm = hourNum >= 12 ? "PM" : "AM";
      const hour12 = hourNum % 12 || 12;
      return `${Number(day)} ${months[Number(month) - 1]} ${year}, ${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${ampm}`;
    };
    const wall = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (wall && !/[zZ]$/.test(text) && !text.includes("+")) {
      return toLabel(wall[1], wall[2], wall[3], wall[4], wall[5]);
    }
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return text;
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).formatToParts(parsed);
    const get = (type) => parts.find((part) => part.type === type)?.value || "00";
    return toLabel(get("year"), get("month"), get("day"), get("hour"), get("minute"));
  };

  const readStayValue = (source, names) => {
    if (!source || typeof source !== "object") return "";
    const entries = Object.entries(source);
    for (const name of names) {
      const hit = entries.find(([key, value]) => key.toLowerCase() === name.toLowerCase() && value);
      if (hit) return hit[1];
    }
    return "";
  };

  const formatSchedule = (booking, which) => {
    const detail = stayById[String(booking?.id || booking?._id || "")];
    const sources = [detail, booking, booking?.booking, booking?.guest?.booking, booking?.activeBooking];
    const dateNames = which === "in"
      ? ["actual_check_in", "actualCheckIn", "check_in_date", "checkInDate", "check_in", "checkIn", "checkin_date", "checkinDate"]
      : ["actual_check_out", "actualCheckOut", "check_out_date", "checkOutDate", "check_out", "checkOut", "checkout_date", "checkoutDate"];
    const timeNames = which === "in"
      ? ["check_in_time", "checkInTime", "actual_check_in_time"]
      : ["check_out_time", "checkOutTime", "actual_check_out_time"];
    const dateVal = sources.map((source) => readStayValue(source, dateNames)).find(Boolean) || "";
    const timeVal = sources.map((source) => readStayValue(source, timeNames)).find(Boolean) || "";
    const dateText = String(dateVal).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateText) && timeVal) {
      return formatStayStamp(`${dateText} ${String(timeVal).slice(0, 5)}:00`);
    }
    return formatStayStamp(dateVal);
  };

  // Status Helper
  const getNormalizedStatus = (b) => {
    const s = String(b.booking_status || b.status || "").toUpperCase();
    if (s === "IN-HOUSE" || s === "IN_HOUSE") return "CHECKED_IN";
    return s || "CONFIRMED";
  };

  // Telemetry Calculations
  const safeBookings = Array.isArray(bookings) ? bookings.filter(Boolean) : [];
  const inHouseBookings = safeBookings.filter((b) => getNormalizedStatus(b) === "CHECKED_IN");
  const confirmedBookings = safeBookings.filter((b) => {
    const s = getNormalizedStatus(b);
    return s === "CONFIRMED" || s === "PENDING" || s === "BOOKED";
  });
  const checkedOutBookings = safeBookings.filter((b) => getNormalizedStatus(b) === "CHECKED_OUT" || getNormalizedStatus(b) === "DEPARTED");

  // Operational active folios
  const activeOperationalBookings = safeBookings.filter((b) => {
    const s = getNormalizedStatus(b);
    if (s === "CHECKED_IN" || s === "CONFIRMED" || s === "PENDING" || s === "BOOKED") return true;
    if (s === "CHECKED_OUT" || s === "DEPARTED") {
      const outDate = (b.checkOutDate || b.check_out_date) ? String(b.checkOutDate || b.check_out_date).split("T")[0] : "";
      return outDate && outDate >= todayStr;
    }
    return false;
  });

  const totalGrossLedger = safeBookings.reduce((sum, b) => {
    const pos = (b.posCharges || []).reduce((pSum, c) => pSum + (c.amount || 0), 0);
    return sum + (Number(b.totalAmount ?? b.total_amount ?? 0)) + pos;
  }, 0);

  const totalPendingDues = safeBookings.reduce((sum, b) => {
    const pos = (b.posCharges || []).reduce((pSum, c) => pSum + (c.amount || 0), 0);
    const gross = (Number(b.totalAmount ?? b.total_amount ?? 0)) + pos;
    const paid = Number(b.paidAmount ?? b.paid_amount ?? 0);
    return sum + Math.max(0, gross - paid);
  }, 0);

  const todayCheckoutsDueCount = inHouseBookings.filter((b) => {
    const outDate = (b.checkOutDate || b.check_out_date) ? String(b.checkOutDate || b.check_out_date).split("T")[0] : "";
    return outDate && outDate <= todayStr;
  }).length;

  // Helper to extract all room numbers from booking
  const getBookingRoomNumbers = (b) => {
    if (!b) return [];
    if (Array.isArray(b.roomNumbers) && b.roomNumbers.length > 0) {
      return b.roomNumbers.map(String);
    }
    if (Array.isArray(b.rooms) && b.rooms.length > 0) {
      const extracted = b.rooms
        .map((r) => String(r.room_number || r.roomNumber || r.room || ""))
        .filter(Boolean);
      if (extracted.length > 0) return extracted;
    }
    if (b.roomNumber || b.room_number) {
      return String(b.roomNumber || b.room_number).split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (b.room?.room_number || b.room?.roomNumber) {
      return [String(b.room.room_number || b.room.roomNumber)];
    }
    return ["N/A"];
  };

  // Filter Bookings List
  const filteredBookings = safeBookings.filter((b) => {
    const s = getNormalizedStatus(b);

    // Status Filter
    if (activeStatusTab === "CHECKED_IN" && s !== "CHECKED_IN") return false;
    if (activeStatusTab === "CHECKED_OUT" && s !== "CHECKED_OUT" && s !== "DEPARTED") return false;
    // When activeStatusTab === "ALL", show all bookings

    // Balance Filter
    const posChargesTotal = (b.posCharges || []).reduce((pSum, c) => pSum + (c.amount || 0), 0);
    const grandTotal = (Number(b.totalAmount ?? b.total_amount ?? 0)) + posChargesTotal;
    const paidTotal = Number(b.paidAmount ?? b.paid_amount ?? 0);
    const dueBalance = Math.max(0, grandTotal - paidTotal);

    if (balanceFilter === "DUES" && dueBalance <= 0) return false;
    if (balanceFilter === "SETTLED" && dueBalance > 0) return false;

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFolio = (b.bookingNumber || b.booking_number || "").toLowerCase().includes(q);
      const guestName = (b.guestName || b.primary_guest_name || b.guest_name || b.guest?.name || b.guest?.fullName || "").toLowerCase();
      const matchGuest = guestName.includes(q);
      const guestPhone = (b.phone || b.mobile_number || b.guest?.phone || b.guest?.mobileNumber || "").toLowerCase();
      const matchPhone = guestPhone.includes(q);
      const roomsList = getBookingRoomNumbers(b);
      const matchRoom = roomsList.some((rn) => rn.toLowerCase().includes(q)) || String(b.roomNumber || b.room_number || "").toLowerCase().includes(q);
      if (!matchFolio && !matchGuest && !matchPhone && !matchRoom) return false;
    }

    return true;
  });

  const handleOpenCheckout = (booking) => {
    setCheckoutTarget(booking);
  };

  useEffect(() => {
    if (!checkoutRequest?.guest) return;
    const guest = checkoutRequest.guest;
    const booking = guest.booking || guest;
    handleOpenCheckout(booking);
    if (onCheckoutRequestHandled) onCheckoutRequestHandled();
  }, [checkoutRequest]);

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      {/* 3D Page Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", mb: 3.5, gap: 2 }}>
        <div>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 0.5 }}>
            <Avatar sx={{ bgcolor: themeConfig.primary, width: 38, height: 38, borderRadius: "12px", boxShadow: `0 4px 12px ${themeConfig.primaryGlow}` }}>
              <Receipt sx={{ color: "#FFFFFF", fontSize: 22 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5 }}>
              In-House Guest Folios & Account Ledgers
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
            Real-time active resident stay ledger, room charges, ancillary POS services, and instant checkout settlement.
          </Typography>
        </div>

        <Chip
          icon={<Schedule sx={{ fontSize: 16, color: `${themeConfig.primaryDark} !important` }} />}
          label={`Standard Check-Out: ${checkOutTimeFormatted} (${timezoneStr})`}
          sx={{
            bgcolor: themeConfig.champagne,
            color: themeConfig.primaryDark,
            fontWeight: 800,
            borderRadius: "12px",
            border: `1px solid ${themeConfig.border}`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            py: 2,
            px: 1,
            fontSize: "0.8rem",
          }}
        />
      </Box>

      {/* ========================================================================= */}
      {/* SECTION 1: TELEMETRY METRIC STAT CARDS                                   */}
      {/* ========================================================================= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2.5,
          mb: 4,
          alignItems: "stretch",
        }}
      >
        <StatCard
          title="Total Registered Folios"
          value={bookings.length}
          subtitle={`${inHouseBookings.length} In-House • ${checkedOutBookings.length} Checked-Out`}
          icon={<MeetingRoom />}
          color="#0B8EE0"
          badgeText="Folios"
        />

        <StatCard
          title="Total Folio Ledger"
          value={`₹${totalGrossLedger.toLocaleString()}`}
          subtitle="Total stay & ancillary billings"
          icon={<CurrencyRupee />}
          color="#10B981"
          badgeText="Billed"
        />

        <StatCard
          title="Pending Settlement Dues"
          value={`₹${totalPendingDues.toLocaleString()}`}
          subtitle={totalPendingDues > 0 ? "Outstanding balance to collect" : "All active folios settled"}
          icon={<Warning />}
          color={totalPendingDues > 0 ? "#EF4444" : "#10B981"}
          badgeText={totalPendingDues > 0 ? "Dues Active" : "All Clear"}
        />

        <StatCard
          title="Checked-Out / Closed"
          value={checkedOutBookings.length}
          subtitle={`${todayCheckoutsDueCount} due today • Departures`}
          icon={<Schedule />}
          color="#8B5CF6"
          badgeText="Departures"
        />
      </Box>

      {/* ========================================================================= */}
      {/* SECTION 2: FOLIOS SEARCH, FILTER TABS & LIVE LEDGER TABLE                */}
      {/* ========================================================================= */}
      <Paper
        className="card-3d"
        sx={{
          p: { xs: 1.5, sm: 2 },
          borderRadius: "22px",
          bgcolor: themeConfig.bgCard,
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode
            ? "0 10px 30px -5px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
            : "0 10px 30px -5px rgba(12, 39, 59, 0.08), inset 0 1px 1px #FFFFFF",
        }}
      >
        {/* Controls Bar: Search, Status Tabs & Balance Filter */}
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 1.5, mb: 2 }}>
          <Tabs
            value={activeStatusTab}
            onChange={(e, v) => {
              setActiveStatusTab(v);
              setPage(0);
            }}
            sx={{
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 800,
                fontSize: "0.85rem",
                borderRadius: "12px",
                minHeight: 38,
                px: 2,
                mr: 1,
                color: themeConfig.textMuted,
                "&.Mui-selected": {
                  bgcolor: themeConfig.primary,
                  color: "#FFFFFF",
                  boxShadow: `0 4px 12px ${themeConfig.primaryGlow}`,
                },
              },
            }}
          >
            <Tab value="ALL" label={`All Folios (${bookings.length})`} />
            <Tab value="CHECKED_IN" label={`Active In-House (${inHouseBookings.length})`} />
            <Tab value="CHECKED_OUT" label={`Checked-Out (${checkedOutBookings.length})`} />
          </Tabs>

          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={balanceFilter}
                onChange={(e) => {
                  setBalanceFilter(e.target.value);
                  setPage(0);
                }}
                sx={{ borderRadius: "12px", bgcolor: themeConfig.bgMain, fontSize: "0.85rem", fontWeight: 700 }}
              >
                <MenuItem value="ALL">All Balances</MenuItem>
                <MenuItem value="DUES">⚠️ Dues Pending</MenuItem>
                <MenuItem value="SETTLED">✅ Fully Settled</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Search folio #, guest, room #, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: { xs: "100%", sm: 260 }, "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: themeConfig.bgMain } }}
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
          </Box>
        </Box>

        {/* 3D Folios Table */}
        <TableContainer
          sx={{
            borderRadius: "16px",
            border: `1px solid ${themeConfig.border}`,
            overflowX: "hidden",
            overflowY: "auto",
            maxHeight: "560px",
            "&::-webkit-scrollbar": { height: "7px", width: "7px" },
            "&::-webkit-scrollbar-track": { background: "rgba(0,0,0,0.02)", borderRadius: "8px" },
            "&::-webkit-scrollbar-thumb": { background: themeConfig.border, borderRadius: "8px" },
            "&::-webkit-scrollbar-thumb:hover": { background: themeConfig.primary },
          }}
        >
          <Table stickyHeader size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
            <TableHead>
              <TableRow sx={{ "& th": { bgcolor: themeConfig.champagne, color: themeConfig.textMain, fontWeight: 800, py: 1, px: 1.5, fontSize: "0.8rem" } }}>
                <TableCell sx={{ width: "22%" }}>Guest</TableCell>
                <TableCell sx={{ width: "16%" }}>Room</TableCell>
                <TableCell sx={{ width: "23%" }}>Schedule</TableCell>
                <TableCell sx={{ width: "13%" }}>Balance</TableCell>
                <TableCell sx={{ width: "12%" }}>Status</TableCell>
                <TableCell align="right" sx={{ width: "14%", pr: 2 }}>Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {loading && filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: "center" }}>
                    <CircularProgress size={28} sx={{ color: themeConfig.primary }} />
                  </TableCell>
                </TableRow>
              ) : loadError && filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 4, textAlign: "center" }}>
                    <EmptyState
                      title="Could not load folios"
                      description={loadError}
                      actionText="Retry"
                      onAction={onRefresh}
                    />
                  </TableCell>
                </TableRow>
              ) : filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: "center", color: themeConfig.textMuted, fontWeight: 700 }}>
                    {activeStatusTab === "CHECKED_IN"
                      ? "No guests currently in-house."
                      : searchQuery
                        ? "No folios match your search."
                        : "No folios under this category."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((b) => {
                    const guestName = b.guestName || b.primary_guest_name || b.guest_name || b.guest?.name || b.guest?.fullName || "Walk-In Guest";
                    const guestPhone = b.phone || b.mobile_number || b.guest?.phone || b.guest?.mobileNumber || "";
                    const roomsList = getBookingRoomNumbers(b);
                    const roomType = b.roomType?.name || b.room_type_name || b.room?.roomType?.name || "Room Stay";
                    const overstay = calculateOverstayFee(b, hotelSettings);
                    const posChargesTotal = (b.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
                    const grandTotal = (Number(b.totalAmount ?? b.total_amount ?? 0)) + posChargesTotal;
                    const paidTotal = Number(b.paidAmount ?? b.paid_amount ?? 0);
                    const dueBalance = Math.max(0, grandTotal - paidTotal);
                    const outDateRaw = b.checkOutDate || b.check_out_date;
                    const isCheckoutToday = outDateRaw && String(outDateRaw).split("T")[0] <= todayStr;
                    const idPhoto = b.frontImage || b.id_proof_image || b.images?.[0] || b.guest?.idProof?.frontImage || b.guest?.frontImage;

                    return (
                      <TableRow key={b._id || b.id} hover sx={{ "&:hover": { bgcolor: "rgba(11, 142, 224, 0.03)" }, "& td": { py: 1, px: 1.5 } }}>

                        {/* Guest Details */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1.2,
                              cursor: "pointer",
                              "&:hover": { opacity: 0.8 },
                            }}
                            onClick={() => {
                              setSelectedGuestModal({
                                open: true,
                                guest: createSafeGuestModalData(b),
                                guestId: b.id || b._id || b.bookingId || b.guest?.id || b.guest?._id,
                              });
                            }}
                          >
                            <Avatar sx={{ bgcolor: themeConfig.primary, width: 34, height: 34, fontSize: "0.85rem", fontWeight: 800 }}>
                              {guestName.charAt(0).toUpperCase()}
                            </Avatar>
                            <div>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, "&:hover": { textDecoration: "underline" } }}>
                                {guestName}
                              </Typography>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap", mt: 0.4 }}>
                                {guestPhone && (
                                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "flex", alignItems: "center", gap: 0.5, fontSize: "0.72rem" }}>
                                    <Phone sx={{ fontSize: 11 }} /> {guestPhone}
                                  </Typography>
                                )}

                                {idPhoto && (
                                  <Chip
                                    label="📄 ID Photo"
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewImage(idPhoto);
                                    }}
                                    sx={{
                                      height: 18,
                                      fontSize: "0.65rem",
                                      fontWeight: 800,
                                      bgcolor: "rgba(16, 185, 129, 0.12)",
                                      color: "#059669",
                                      border: "1px solid rgba(16, 185, 129, 0.3)",
                                      cursor: "pointer",
                                    }}
                                  />
                                )}
                              </Box>
                            </div>
                          </Box>
                        </TableCell>

                        {/* Room Details */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {roomsList.length > 1 ? (
                            <Box sx={{ mb: 0.3 }}>
                              <Chip
                                icon={<MeetingRoom sx={{ fontSize: 14, color: `${themeConfig.primaryDark} !important` }} />}
                                label={`Rooms ${roomsList.join(", ")}`}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  bgcolor: themeConfig.champagne,
                                  color: themeConfig.primaryDark,
                                  border: `1px solid ${themeConfig.border}`,
                                  height: 24,
                                }}
                              />
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", fontSize: "0.72rem", mt: 0.3 }}>
                                {roomType} ({roomsList.length} Rooms)
                              </Typography>
                            </Box>
                          ) : (
                            <Box sx={{ mb: 0.3 }}>
                              <Chip
                                icon={<MeetingRoom sx={{ fontSize: 14, color: `${themeConfig.primaryDark} !important` }} />}
                                label={`Room ${roomsList[0] || "N/A"}`}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  bgcolor: themeConfig.champagne,
                                  color: themeConfig.primaryDark,
                                  border: `1px solid ${themeConfig.border}`,
                                  height: 24,
                                }}
                              />
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", fontSize: "0.72rem", mt: 0.3 }}>
                                {roomType}
                              </Typography>
                            </Box>
                          )}
                        </TableCell>

                        {/* Stay Duration */}
                        <TableCell sx={{ color: themeConfig.textMuted, fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                          <div><strong>In:</strong> {formatSchedule(b, "in")}</div>
                          <div>
                            <strong>Out:</strong> {formatSchedule(b, "out")}
                            {overstay.isOverstay ? (
                              <Tooltip title={`Stayed +${overstay.overdueHours}h past check-out time.`}>
                                <Chip
                                  label={`🚨 Overdue (+${overstay.overdueHours}h)`}
                                  size="small"
                                  sx={{
                                    ml: 0.8,
                                    height: 18,
                                    fontSize: "0.65rem",
                                    bgcolor: "rgba(220, 38, 38, 0.15)",
                                    color: "#DC2626",
                                    fontWeight: 900,
                                    border: "1px solid rgba(220, 38, 38, 0.4)",
                                  }}
                                />
                              </Tooltip>
                            ) : isCheckoutToday && b.status === "CHECKED_IN" ? (
                              <Chip
                                label="Due Today"
                                size="small"
                                sx={{
                                  ml: 0.8,
                                  height: 18,
                                  fontSize: "0.65rem",
                                  bgcolor: "rgba(239, 68, 68, 0.12)",
                                  color: "#DC2626",
                                  fontWeight: 800,
                                }}
                              />
                            ) : null}
                          </div>
                        </TableCell>

                        {/* Balance Due */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          {dueBalance > 0 ? (
                            <Chip
                              label={`₹${dueBalance.toLocaleString()} Due`}
                              size="small"
                              sx={{
                                bgcolor: "rgba(239, 68, 68, 0.12)",
                                color: "#DC2626",
                                fontWeight: 800,
                                fontSize: "0.75rem",
                                border: "1px solid rgba(239, 68, 68, 0.3)",
                              }}
                            />
                          ) : (
                            <Chip
                              label="Fully Settled"
                              size="small"
                              sx={{
                                bgcolor: "rgba(16, 185, 129, 0.12)",
                                color: "#059669",
                                fontWeight: 800,
                                fontSize: "0.75rem",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                              }}
                            />
                          )}
                          {/* <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", fontSize: "0.7rem", mt: 0.2 }}>
                            Paid: ₹{paidTotal.toLocaleString()}
                          </Typography> */}
                        </TableCell>

                        {/* Status */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <StatusChip status={b.status} size="small" />
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ whiteSpace: "nowrap", pr: 2.5 }}>
                          <Box sx={{ display: "flex", gap: 0.8, justifyContent: "flex-end", alignItems: "center" }}>
                            {/* 1. WhatsApp Notification */}
                            <Tooltip title={b.status === "CHECKED_IN" ? "Send Check-In Confirmation on WhatsApp" : "Send Final Bill on WhatsApp"}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  if (b.status === "CHECKED_IN") {
                                    sendCheckInWhatsApp({
                                      booking: b,
                                      guest: b.guest || { name: b.guestName, mobileNumber: b.guestPhone },
                                      hotel: hotelSettings,
                                      onShowToast: (msg, sev) => toast.show(msg, sev),
                                    });
                                  } else {
                                    sendCheckoutBillWhatsApp({
                                      booking: b,
                                      guest: b.guest || { name: b.guestName, mobileNumber: b.guestPhone },
                                      hotel: hotelSettings,
                                      onShowToast: (msg, sev) => toast.show(msg, sev),
                                    });
                                  }
                                }}
                                sx={{
                                  color: "#25D366",
                                  bgcolor: "rgba(37, 211, 102, 0.08)",
                                  border: "1px solid rgba(37, 211, 102, 0.28)",
                                  borderRadius: "10px",
                                  p: 0.8,
                                  transition: "all 0.18s ease",
                                  "&:hover": {
                                    bgcolor: "#25D366",
                                    color: "#FFFFFF",
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 4px 10px rgba(37, 211, 102, 0.35)",
                                  },
                                }}
                              >
                                <WhatsApp sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>


                            {/* 3. Check-Out Guest */}
                            {b.status === "CHECKED_IN" && (
                              <Tooltip title="Check-Out Guest & Release Room">
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenCheckout(b)}
                                  sx={{
                                    color: "#DC2626",
                                    bgcolor: "rgba(220, 38, 38, 0.08)",
                                    border: "1px solid rgba(220, 38, 38, 0.28)",
                                    borderRadius: "10px",
                                    p: 0.8,
                                    transition: "all 0.18s ease",
                                    "&:hover": {
                                      bgcolor: "#DC2626",
                                      color: "#FFFFFF",
                                      transform: "translateY(-2px)",
                                      boxShadow: "0 4px 10px rgba(220, 38, 38, 0.35)",
                                    },
                                  }}
                                >
                                  <Logout sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table Pagination */}
        {filteredBookings.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredBookings.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              borderTop: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard,
              color: themeConfig.textMain,
              mt: 1,
            }}
          />
        )}
      </Paper>

      {/* Check-out */}
      <CheckoutDialog
        open={Boolean(checkoutTarget)}
        booking={checkoutTarget}
        roomNumber={checkoutTarget ? getBookingRoomNumbers(checkoutTarget).join(", ") : ""}
        hotelSettings={hotelSettings}
        onClose={() => setCheckoutTarget(null)}
        onCheckOut={onCheckOut}
      />

      {/* ========================================================================= */}
      {/* DETAILED FOLIO BREAKDOWN MODAL                                           */}
      {/* ========================================================================= */}
      <Dialog
        open={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, booking: null })}
        slotProps={{ paper: { sx: { borderRadius: "16px", maxWidth: 600, border: `1px solid ${themeConfig.border}`, overflow: "hidden" } } }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 900, color: themeConfig.textMain, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Folio #{detailsModal.booking?.bookingNumber} Ledger Details</span>
          <IconButton size="small" onClick={() => setDetailsModal({ open: false, booking: null })}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {detailsModal.booking && (() => {
            const b = detailsModal.booking;
            const posChargesTotal = (b.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
            const grandTotal = (b.totalAmount || 0) + posChargesTotal;
            const paidTotal = b.paidAmount || 0;
            const dueBalance = Math.max(0, grandTotal - paidTotal);

            return (
              <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper sx={{ p: 2, borderRadius: "14px", bgcolor: themeConfig.champagne, border: `1px solid ${themeConfig.border}` }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <div>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                        {b.guest?.name || b.guest?.fullName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                        {(() => {
                          const rList = getBookingRoomNumbers(b);
                          return rList.length > 1 ? `Rooms: ${rList.join(", ")}` : `Room ${rList[0] || ""}`;
                        })()} &bull; Check-in: {b.checkInDate} ({b.checkInTime ? formatTime12Hour(b.checkInTime) : checkInTimeFormatted}) &bull; Check-out: {b.checkOutDate} ({(() => {
                          if (b.actualCheckOut) {
                            const d = new Date(b.actualCheckOut);
                            if (!isNaN(d.getTime())) {
                              const h = String(d.getHours()).padStart(2, "0");
                              const m = String(d.getMinutes()).padStart(2, "0");
                              return formatTime12Hour(`${h}:${m}`);
                            }
                          }
                          return formatTime12Hour(b.checkOutTime || hotelSettings?.checkOutTime || "12:00");
                        })()})
                      </Typography>
                    </div>
                    <StatusChip status={b.status} size="small" />
                  </Box>

                  {b.accompanyingGuests && b.accompanyingGuests.length > 0 && (
                    <Box sx={{ mt: 1.5, pt: 1, borderTop: `1px dashed ${themeConfig.border}` }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.primaryDark, display: "block", mb: 0.5 }}>
                        👥 Accompanying Members ({b.accompanyingGuests.length}):
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {b.accompanyingGuests.map((m, idx) => (
                          <Chip
                            key={idx}
                            size="small"
                            label={`${m.name} (${m.relationship || "Family"}${m.idNumber ? ` • ${m.idType}: ${m.idNumber}` : ""})`}
                            sx={{ bgcolor: themeConfig.bgCard, color: themeConfig.textMain, fontSize: "0.72rem", border: `1px solid ${themeConfig.border}` }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Guest ID & Documents Showcase */}
                  {(b.guest?.idProof?.frontImage || b.guest?.frontImage || b.guest?.idProof?.backImage || b.guest?.backImage || (b.accompanyingGuests && b.accompanyingGuests.some(m => m.frontImage || m.backImage))) && (
                    <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px dashed ${themeConfig.border}` }}>
                      <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.primaryDark, display: "block", mb: 1 }}>
                        📄 Guest ID Documents & Photo Verification:
                      </Typography>
                      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                        {/* Main Guest Front ID */}
                        {(b.guest?.idProof?.frontImage || b.guest?.frontImage) && (
                          <Paper
                            sx={{
                              p: 1,
                              borderRadius: "10px",
                              border: "1px solid #10B981",
                              bgcolor: "rgba(16, 185, 129, 0.04)",
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 0.5,
                              cursor: "pointer",
                              "&:hover": { boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)" },
                            }}
                            onClick={() => setPreviewImage(b.guest?.idProof?.frontImage || b.guest?.frontImage)}
                          >
                            <Box
                              component="img"
                              src={b.guest?.idProof?.frontImage || b.guest?.frontImage}
                              alt="Main Guest Front ID"
                              sx={{ width: 110, height: 70, objectFit: "cover", borderRadius: "6px" }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 800, color: "#059669", fontSize: "0.68rem" }}>
                              Main Front ID
                            </Typography>
                          </Paper>
                        )}

                        {/* Main Guest Back ID */}
                        {(b.guest?.idProof?.backImage || b.guest?.backImage) && (
                          <Paper
                            sx={{
                              p: 1,
                              borderRadius: "10px",
                              border: `1px solid ${themeConfig.border}`,
                              bgcolor: themeConfig.bgCard,
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              gap: 0.5,
                              cursor: "pointer",
                              "&:hover": { borderColor: themeConfig.primary },
                            }}
                            onClick={() => setPreviewImage(b.guest?.idProof?.backImage || b.guest?.backImage)}
                          >
                            <Box
                              component="img"
                              src={b.guest?.idProof?.backImage || b.guest?.backImage}
                              alt="Main Guest Back ID"
                              sx={{ width: 110, height: 70, objectFit: "cover", borderRadius: "6px" }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, fontSize: "0.68rem" }}>
                              Main Back ID
                            </Typography>
                          </Paper>
                        )}

                        {/* Accompanying Member IDs */}
                        {(b.accompanyingGuests || []).map((m, mIdx) => (
                          m.frontImage ? (
                            <Paper
                              key={mIdx}
                              sx={{
                                p: 1,
                                borderRadius: "10px",
                                border: `1px solid ${themeConfig.border}`,
                                bgcolor: themeConfig.bgCard,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 0.5,
                                cursor: "pointer",
                                "&:hover": { borderColor: themeConfig.primary },
                              }}
                              onClick={() => setPreviewImage(m.frontImage)}
                            >
                              <Box
                                component="img"
                                src={m.frontImage}
                                alt={`${m.name} ID`}
                                sx={{ width: 110, height: 70, objectFit: "cover", borderRadius: "6px" }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.primary, fontSize: "0.68rem" }}>
                                {m.name || `Member ${mIdx + 1}`}
                              </Typography>
                            </Paper>
                          ) : null
                        ))}
                      </Box>
                    </Box>
                  )}
                </Paper>

                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                  Itemized Charges & Ancillary Services:
                </Typography>

                <TableContainer sx={{ borderRadius: "12px", border: `1px solid ${themeConfig.border}` }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Room Accommodation</TableCell>
                        <TableCell><Chip label="STAY" size="small" sx={{ height: 20, fontSize: "0.65rem" }} /></TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>₹{(b.totalAmount || 0).toLocaleString()}</TableCell>
                      </TableRow>

                      {(b.posCharges || []).map((c, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{c.item || c.title || "POS Service"}</TableCell>
                          <TableCell><Chip label={c.type || "POS"} size="small" sx={{ height: 20, fontSize: "0.65rem" }} /></TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>₹{(c.amount || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}

                      <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                        <TableCell colSpan={2} sx={{ fontWeight: 900 }}>Total Billed Ledger</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                          ₹{grandTotal.toLocaleString()}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={2} sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Advance / Paid Amount</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#059669" }}>
                          ₹{paidTotal.toLocaleString()}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={2} sx={{ fontWeight: 900, color: themeConfig.danger }}>Outstanding Balance Due</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: themeConfig.danger }}>
                          ₹{dueBalance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })()}
        </DialogContent>

        <DialogActions sx={{ p: 2, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<WhatsApp sx={{ color: "#FFFFFF" }} />}
              onClick={() => {
                const b = detailsModal.booking;
                sendCheckoutBillWhatsApp({
                  booking: b,
                  guest: b?.guest || { name: b?.guestName, mobileNumber: b?.guestPhone },
                  hotel: hotelSettings,
                  onShowToast: (msg, sev) => toast.show(msg, sev),
                });
              }}
              sx={{
                borderRadius: "10px",
                fontWeight: 800,
                bgcolor: "#25D366",
                color: "#FFFFFF",
                boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
                "&:hover": { bgcolor: "#1EBE5D" },
              }}
            >
              Send Bill on WhatsApp
            </Button>
            <Button
              variant="outlined"
              startIcon={<WhatsApp sx={{ color: "#25D366" }} />}
              onClick={() => {
                const b = detailsModal.booking;
                sendCheckInWhatsApp({
                  booking: b,
                  guest: b?.guest || { name: b?.guestName, mobileNumber: b?.guestPhone },
                  hotel: hotelSettings,
                  onShowToast: (msg, sev) => toast.show(msg, sev),
                });
              }}
              sx={{
                borderRadius: "10px",
                fontWeight: 800,
                borderColor: "rgba(37, 211, 102, 0.5)",
                color: isDarkMode ? "#25D366" : "#059669",
                bgcolor: "rgba(37, 211, 102, 0.08)",
                "&:hover": { bgcolor: "rgba(37, 211, 102, 0.16)", borderColor: "#25D366" },
              }}
            >
              Send WhatsApp
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={() => setDetailsModal({ open: false, booking: null })} sx={{ borderRadius: "10px" }}>
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<Receipt />}
              onClick={() => {
                const b = detailsModal.booking;
                setDetailsModal({ open: false, booking: null });
                if (onOpenInvoice) onOpenInvoice(b);
              }}
              className="btn-3d"
              sx={{
                background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                color: "#FFFFFF",
                fontWeight: 800,
                borderRadius: "10px",
              }}
            >
              View Tax Invoice
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Guest Details Modal */}
      <GuestDetailsModal
        open={selectedGuestModal.open}
        onClose={() => setSelectedGuestModal({ open: false, guest: null, guestId: null })}
        guestId={selectedGuestModal.guestId}
        guestData={selectedGuestModal.guest}
        hotelSettings={hotelSettings}
      />

      {/* High-Resolution Document Image Zoom Preview Modal */}
      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: "18px", p: 1.5, bgcolor: "#111827", color: "#FFF" } } }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#F8FAFC" }}>
            🔍 Document Photo Preview
          </Typography>
          <IconButton size="small" onClick={() => setPreviewImage(null)} sx={{ color: "#FFF" }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ p: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 250 }}>
          {previewImage && (
            <Box
              component="img"
              src={previewImage}
              alt="Document Full Preview"
              sx={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: "10px", border: "1px solid #374151" }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
