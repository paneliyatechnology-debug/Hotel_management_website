"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Button,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Grid,
  TextField,
  InputAdornment,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  ButtonGroup,
} from "@mui/material";
import {
  Search,
  Person,
  People,
  Hotel as HotelIcon,
  Phone,
  Email,
  CalendarMonth,
  Receipt,
  Payments,
  CurrencyRupee,
  WarningAmber,
  CheckCircle,
  Visibility,
  Print,
  Download,
  WhatsApp,
  Refresh,
  FilterList,
  Apps,
  FormatListBulleted,
  ArrowForward,
  ContentCopy,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { useSocket } from "@/shared/context/SocketContext";
import { toast } from "@/shared/utils/toast";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import StatCard from "@/shared/components/StatCard";
import GuestDetailPage from "./GuestDetailPage";

function formatCurrency(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(val);
  }
}

function formatDateTime(val) {
  if (!val) return "—";
  try {
    const raw = String(val);
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return "—";
    const dateOnly = /T00:00:00(\.000)?Z$/.test(raw);
    if (dateOnly) {
      return d.toLocaleDateString("en-IN", {
        timeZone: "UTC",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "—";
  }
}

function num(val) {
  const n = Number(val);
  return Number.isFinite(n) ? n : 0;
}

function firstValue(sources, keys) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;
    for (const key of keys) {
      const value = source[key];
      if (value !== undefined && value !== null && value !== "") return value;
    }
  }
  return null;
}

function asRecordList(value) {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];
  if (Array.isArray(value.bookings)) return value.bookings;
  if (Array.isArray(value.guests)) return value.guests;
  if (Array.isArray(value.data)) return value.data;
  if (Array.isArray(value.data?.bookings)) return value.data.bookings;
  return [];
}

function roomLabelFor(record, rooms) {
  const embedded = Array.isArray(record.rooms)
    ? record.rooms.map((r) => r.room_number || r.roomNumber).filter(Boolean).join(", ")
    : "";
  if (embedded) return embedded;
  const direct = record.roomNumber || record.room_number || record.roomAssigned;
  if (direct) return String(direct);
  const ids = Array.isArray(record.room_id) ? record.room_id : record.room_id ? [record.room_id] : Array.isArray(record.roomId) ? record.roomId : [];
  if (!ids.length || !Array.isArray(rooms)) return "—";
  const labels = ids.map((id) => {
    const room = rooms.find((r) => String(r.id || r._id) === String(id));
    return room?.roomNumber || room?.room_number || String(id);
  });
  return labels.filter(Boolean).join(", ") || "—";
}

export default function GuestListPage({
  guests = [],
  bookings = [],
  rooms = [],
  hotelSettings = {},
  onRefresh,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();

  // Selected Guest for Detail Page
  const [selectedGuest, setSelectedGuest] = useState(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("NEWEST");
  const [viewMode, setViewMode] = useState("table"); // "table" or "grid"

  // Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [bookingDetails, setBookingDetails] = useState({});

  // Real-Time Socket Auto-Sync
  useSocket(
    [
      "BOOKING_CREATED",
      "BOOKING_UPDATED",
      "GUEST_CHECKED_OUT",
      "PAYMENT_RECORDED",
      "GUEST_UPDATED",
      "ROOM_UPDATED",
      "DASHBOARD_SYNC",
    ],
    () => {
      if (onRefresh) onRefresh();
    }
  );

  // List the bookings API records (check-in / check-out stays) as they arrive.
  const unifiedGuests = useMemo(() => {
    const source = asRecordList(bookings);
    const records = source.length > 0 ? source : asRecordList(guests);
    const items = [];
    const seenIds = new Set();

    records.forEach((b) => {
      const id = String(b.id || b._id || b.booking_number || b.bookingNumber || "");
      if (!id || seenIds.has(id)) return;
      seenIds.add(id);

      const rawStatus = String(b.booking_status || b.status || "CONFIRMED").toUpperCase();
      const normalizedStatus =
        rawStatus === "IN-HOUSE" || rawStatus === "IN_HOUSE" ? "CHECKED_IN" : rawStatus;

      const sources = [b, b.booking, b.guest?.booking];
      const baseAmount = num(firstValue(sources, ["base_amount", "baseAmount", "room_amount", "roomAmount"]));
      const gstAmount = num(firstValue(sources, ["gst_amount", "gstAmount", "tax_amount", "taxAmount"]));
      const total = num(firstValue(sources, ["total_amount", "totalAmount", "grand_total", "grandTotal"])) || baseAmount + gstAmount;
      const paid = num(firstValue(sources, ["paid_amount", "paidAmount"]));
      const due = num(firstValue(sources, ["due_amount", "dueAmount"])) || Math.max(0, total - paid);
      const roomType =
        (Array.isArray(b.rooms) && (b.rooms[0]?.room_type_name || b.rooms[0]?.roomTypeName)) ||
        b.room_type_name ||
        b.roomTypeName ||
        "";

      items.push({
        id,
        _id: id,
        bookingNumber: b.booking_number || b.bookingNumber || "",
        guestName: b.primary_guest_name || b.guestName || b.guest?.name || b.guest?.fullName || "Guest",
        phone: b.mobile_number || b.phone || b.mobile || b.guest?.phone || "",
        email: b.email || b.guest?.email || "",
        roomAssigned: roomLabelFor(b, rooms),
        roomType: roomType || "—",
        status: normalizedStatus,
        checkInDate: firstValue(sources, ["check_in_date", "checkInDate", "check_in", "checkIn"]),
        checkOutDate: firstValue(sources, ["check_out_date", "checkOutDate", "check_out", "checkOut"]),
        actualCheckIn: firstValue(sources, ["actual_check_in", "actualCheckIn"]),
        actualCheckOut: firstValue(sources, ["actual_check_out", "actualCheckOut"]),
        baseAmount,
        gstAmount,
        totalAmount: total,
        paidAmount: paid,
        dueAmount: due,
        createdAt: b.created_at || b.createdAt || b.check_in_date || b.checkInDate,
        raw: b,
      });
    });

    return items;
  }, [bookings, guests, rooms]);

  useEffect(() => {
    const missing = unifiedGuests.filter((g) => {
      const known = bookingDetails[g.id];
      if (known) return false;
      return !g.actualCheckIn || !(g.baseAmount || g.gstAmount || g.totalAmount);
    });
    if (missing.length === 0) return;

    let cancelled = false;
    (async () => {
      const loaded = {};
      await Promise.all(
        missing.map(async (g) => {
          try {
            const endpoint =
              (typeof API_ENDPOINTS.BOOKINGS?.BY_ID === "function" && API_ENDPOINTS.BOOKINGS.BY_ID(g.id)) ||
              `${API_ENDPOINTS.BOOKINGS.ALL}/${g.id}`;
            const res = await apiRequest(endpoint, { forceRefresh: true });
            const detail = res?.data?.data || res?.data || res?.booking || null;
            if (detail && typeof detail === "object" && !Array.isArray(detail)) loaded[g.id] = detail;
          } catch {
            loaded[g.id] = {};
          }
        })
      );
      if (!cancelled) setBookingDetails((prev) => ({ ...prev, ...loaded }));
    })();

    return () => {
      cancelled = true;
    };
  }, [unifiedGuests, bookingDetails]);

  const withApiStay = (g) => {
    const d = bookingDetails[g.id];
    const sources = [d, g.raw, g];
    const checkIn = firstValue(sources, ["actual_check_in", "actualCheckIn", "check_in_date", "checkInDate", "check_in", "checkIn"]);
    const checkOut = firstValue(sources, ["actual_check_out", "actualCheckOut", "check_out_date", "checkOutDate", "check_out", "checkOut"]);
    const baseAmount = num(firstValue(sources, ["base_amount", "baseAmount", "room_amount", "roomAmount"]));
    const gstAmount = num(firstValue(sources, ["gst_amount", "gstAmount", "tax_amount", "taxAmount"]));
    const bookedPlusGst = baseAmount + gstAmount;
    const totalAmount = bookedPlusGst > 0 ? bookedPlusGst : num(firstValue(sources, ["total_amount", "totalAmount", "grand_total", "grandTotal"]));
    return { ...g, checkIn, checkOut, baseAmount, gstAmount, totalAmount };
  };

  // Telemetry Metrics
  const metrics = useMemo(() => {
    const total = unifiedGuests.length;
    const inHouse = unifiedGuests.filter((g) => g.status === "CHECKED_IN").length;
    const departed = unifiedGuests.filter((g) => g.status === "CHECKED_OUT" || g.status === "DEPARTED").length;
    const confirmed = unifiedGuests.filter((g) => g.status === "CONFIRMED" || g.status === "PENDING" || g.status === "BOOKED").length;
    const totalRevenue = unifiedGuests.reduce((acc, g) => acc + (g.paidAmount || 0), 0);
    const totalDues = unifiedGuests.reduce((acc, g) => acc + (g.dueAmount || 0), 0);
    const dueCount = unifiedGuests.filter((g) => g.dueAmount > 0).length;

    return {
      total,
      inHouse,
      departed,
      confirmed,
      totalRevenue,
      totalDues,
      dueCount,
    };
  }, [unifiedGuests]);

  // Filtered & Sorted List
  const filteredGuests = useMemo(() => {
    return unifiedGuests
      .filter((item) => {
        // Status filter
        if (statusFilter !== "ALL") {
          if (statusFilter === "CHECKED_IN" && item.status !== "CHECKED_IN") return false;
          if (statusFilter === "CHECKED_OUT" && item.status !== "CHECKED_OUT" && item.status !== "DEPARTED") return false;
          if (statusFilter === "CONFIRMED" && item.status !== "CONFIRMED" && item.status !== "PENDING" && item.status !== "BOOKED") return false;
          if (statusFilter === "CANCELLED" && item.status !== "CANCELLED") return false;
        }

        // Payment status filter
        if (paymentFilter === "PAID" && item.dueAmount > 0) return false;
        if (paymentFilter === "DUE" && item.dueAmount <= 0) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.guestName.toLowerCase().includes(q);
          const matchPhone = item.phone.toLowerCase().includes(q);
          const matchEmail = item.email.toLowerCase().includes(q);
          const matchRoom = String(item.roomAssigned).toLowerCase().includes(q);
          const matchRef = String(item.bookingNumber || item.id).toLowerCase().includes(q);

          return matchName || matchPhone || matchEmail || matchRoom || matchRef;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "NEWEST") {
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        }
        if (sortBy === "OLDEST") {
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        }
        if (sortBy === "NAME_ASC") {
          return a.guestName.localeCompare(b.guestName);
        }
        if (sortBy === "AMOUNT_DESC") {
          return b.totalAmount - a.totalAmount;
        }
        if (sortBy === "DUE_DESC") {
          return b.dueAmount - a.dueAmount;
        }
        return 0;
      });
  }, [unifiedGuests, statusFilter, paymentFilter, searchQuery, sortBy]);

  // Paginated Slices
  const paginatedGuests = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredGuests.slice(start, start + rowsPerPage);
  }, [filteredGuests, page, rowsPerPage]);

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExportCSV = () => {
    if (filteredGuests.length === 0) {
      toast.show("No guest records to export", "info");
      return;
    }

    const headers = [
      "Guest Name",
      "Phone",
      "Email",
      "Room",
      "Room Category",
      "Check-In Date",
      "Check-Out Date",
      "Stay Status",
      "Total Amount (INR)",
      "Paid Amount (INR)",
      "Due Balance (INR)",
      "Actual Check-In",
      "Actual Check-Out",
      "Booking Number",
    ];

    const rows = filteredGuests.map((g) => [
      `"${g.guestName.replace(/"/g, '""')}"`,
      `"${g.phone}"`,
      `"${g.email}"`,
      `"${g.roomAssigned}"`,
      `"${g.roomType}"`,
      `"${formatDate(g.checkInDate)}"`,
      `"${formatDate(g.checkOutDate)}"`,
      `"${g.status}"`,
      g.totalAmount,
      g.paidAmount,
      g.dueAmount,
      `"${formatDateTime(g.actualCheckIn)}"`,
      `"${formatDateTime(g.actualCheckOut)}"`,
      `"${g.bookingNumber}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Hotel_Guests_Directory_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.show("Guest Directory exported successfully!", "success");
  };

  const handlePrintList = () => {
    window.print();
  };

  // If a guest is selected, show the GuestDetailPage!
  if (selectedGuest) {
    return (
      <GuestDetailPage
        guest={selectedGuest.raw || selectedGuest}
        guestId={selectedGuest.id}
        hotelSettings={hotelSettings}
        onBack={() => setSelectedGuest(null)}
        onRefresh={onRefresh}
      />
    );
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Page Header */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Typography
              variant="h5"
              sx={{
                fontWeight: 900,
                color: themeConfig.textMain,
                letterSpacing: "-0.5px",
              }}
            >
              Guest Directory & Profiles
            </Typography>
            <Chip
              label={`${filteredGuests.length} Guests`}
              size="small"
              sx={{
                fontWeight: 800,
                bgcolor: themeConfig.champagne,
                color: themeConfig.primary,
                border: `1px solid ${themeConfig.border}`,
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted, mt: 0.3 }}>
            Check-in and check-out stays from the bookings list, with room, dates, and balance.
          </Typography>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportCSV}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 800,
              fontSize: "0.85rem",
              borderColor: themeConfig.border,
              color: themeConfig.textMain,
              bgcolor: themeConfig.bgCard,
              "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
            }}
          >
            Export CSV
          </Button>

          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={handlePrintList}
            sx={{
              borderRadius: "12px",
              textTransform: "none",
              fontWeight: 800,
              fontSize: "0.85rem",
              borderColor: themeConfig.border,
              color: themeConfig.textMain,
              bgcolor: themeConfig.bgCard,
            }}
          >
            Print
          </Button>

          {onRefresh && (
            <IconButton
              onClick={onRefresh}
              sx={{
                border: `1px solid ${themeConfig.border}`,
                borderRadius: "12px",
                color: themeConfig.primary,
                bgcolor: themeConfig.bgCard,
              }}
            >
              <Refresh fontSize="small" />
            </IconButton>
          )}
        </Box>
      </Box>

      {/* Telemetry Stat Cards */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Total Guests"
            value={metrics.total}
            icon={<People />}
            trend={`${metrics.confirmed} Upcoming`}
            color="#2563EB"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="In-House Active"
            value={metrics.inHouse}
            icon={<HotelIcon />}
            trend="Currently Staying"
            color="#059669"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Checked Out / Past"
            value={metrics.departed}
            icon={<CheckCircle />}
            trend="Completed Stays"
            color="#7C3AED"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Total Guest Collections"
            value={formatCurrency(metrics.totalRevenue)}
            icon={<CurrencyRupee />}
            trend="Collected Tariffs"
            color="#D97706"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 2.4 }}>
          <StatCard
            title="Outstanding Dues"
            value={formatCurrency(metrics.totalDues)}
            icon={<WarningAmber />}
            trend={metrics.dueCount > 0 ? `${metrics.dueCount} open balances` : "All settled"}
            color={metrics.totalDues > 0 ? "#DC2626" : "#059669"}
          />
        </Grid>
      </Grid>

      {/* Filter & Search Bar */}
      <Card
        elevation={0}
        sx={{
          borderRadius: "16px",
          bgcolor: themeConfig.bgCard,
          border: `1px solid ${themeConfig.border}`,
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          <Grid container spacing={2} sx={{ alignItems: "center" }}>
            {/* Search Box */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search guest name, phone, room, booking ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: themeConfig.textMuted, fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                  },
                }}
              />
            </Grid>

            {/* Status Filter */}
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Stay Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(0);
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                  },
                }}
              >
                <MenuItem value="ALL">All Statuses</MenuItem>
                <MenuItem value="CHECKED_IN">In-House Only</MenuItem>
                <MenuItem value="CHECKED_OUT">Checked-Out</MenuItem>
                <MenuItem value="CONFIRMED">Confirmed / Upcoming</MenuItem>
                <MenuItem value="CANCELLED">Cancelled</MenuItem>
              </TextField>
            </Grid>

            {/* Payment Filter */}
            <Grid size={{ xs: 6, sm: 3, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Payment"
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setPage(0);
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                  },
                }}
              >
                <MenuItem value="ALL">All Payments</MenuItem>
                <MenuItem value="PAID">Fully Settled</MenuItem>
                <MenuItem value="DUE">Balance Pending</MenuItem>
              </TextField>
            </Grid>

            {/* Sort Order & View Mode */}
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Sort By"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "12px",
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                    },
                  }}
                >
                  <MenuItem value="NEWEST">Newest Stay</MenuItem>
                  <MenuItem value="OLDEST">Oldest Stay</MenuItem>
                  <MenuItem value="NAME_ASC">Name (A-Z)</MenuItem>
                  <MenuItem value="AMOUNT_DESC">Highest Tariff</MenuItem>
                  <MenuItem value="DUE_DESC">Highest Due</MenuItem>
                </TextField>

                <ButtonGroup size="small" sx={{ borderRadius: "10px", display: { xs: "none", lg: "flex" } }}>
                  <IconButton
                    size="small"
                    onClick={() => setViewMode("table")}
                    sx={{
                      color: viewMode === "table" ? themeConfig.primary : themeConfig.textMuted,
                      border: `1px solid ${themeConfig.border}`,
                      borderRadius: "8px 0 0 8px",
                    }}
                  >
                    <FormatListBulleted fontSize="small" />
                  </IconButton>
                  <IconButton
                    size="small"
                    onClick={() => setViewMode("grid")}
                    sx={{
                      color: viewMode === "grid" ? themeConfig.primary : themeConfig.textMuted,
                      border: `1px solid ${themeConfig.border}`,
                      borderRadius: "0 8px 8px 0",
                    }}
                  >
                    <Apps fontSize="small" />
                  </IconButton>
                </ButtonGroup>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Main Guest Roster Display */}
      {filteredGuests.length === 0 ? (
        <EmptyState
          title="No Guests Found"
          description="No guest records match your search query or filter selection."
          actionText="Clear All Filters"
          onAction={() => {
            setSearchQuery("");
            setStatusFilter("ALL");
            setPaymentFilter("ALL");
          }}
        />
      ) : viewMode === "grid" ? (
        /* Grid Cards View */
        <Grid container spacing={2.5}>
          {paginatedGuests.map((g) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={g.id}>
              <Card
                elevation={0}
                sx={{
                  borderRadius: "16px",
                  bgcolor: themeConfig.bgCard,
                  border: `1px solid ${themeConfig.border}`,
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: themeConfig.primary,
                    boxShadow: `0 8px 24px -4px ${themeConfig.primaryGlow || "rgba(0,0,0,0.12)"}`,
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        sx={{
                          width: 46,
                          height: 46,
                          fontWeight: 800,
                          bgcolor: themeConfig.primary,
                          color: "#FFFFFF",
                        }}
                      >
                        {g.guestName.charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {g.guestName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                          {g.phone || "No phone"}
                        </Typography>
                      </Box>
                    </Box>

                    <StatusChip status={g.status} />
                  </Box>

                  <Divider sx={{ my: 1.5 }} />

                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1, mb: 2 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Room Assigned:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                        Room {g.roomAssigned} ({g.roomType})
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Check-In:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: themeConfig.textMain }}>
                        {formatDateTime(withApiStay(g).checkIn)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Check-Out:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: themeConfig.textMain }}>
                        {formatDateTime(withApiStay(g).checkOut)}
                      </Typography>
                    </Box>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Booked + GST:</Typography>
                      <Box sx={{ textAlign: "right" }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {formatCurrency(withApiStay(g).totalAmount)}
                        </Typography>
                        {(withApiStay(g).baseAmount > 0 || withApiStay(g).gstAmount > 0) && (
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                            {formatCurrency(withApiStay(g).baseAmount)} + GST {formatCurrency(withApiStay(g).gstAmount)}
                          </Typography>
                        )}
                        {g.dueAmount > 0 ? (
                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#DC2626", display: "block" }}>
                            Due: {formatCurrency(g.dueAmount)}
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ fontWeight: 700, color: "#059669", display: "block" }}>
                            Fully Paid
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    variant="contained"
                    endIcon={<ArrowForward />}
                    onClick={() => setSelectedGuest(g)}
                    sx={{
                      borderRadius: "10px",
                      textTransform: "none",
                      fontWeight: 800,
                      bgcolor: themeConfig.primary,
                    }}
                  >
                    View Guest Profile
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        /* Table View */
        <Card
          elevation={0}
          sx={{
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard,
            border: `1px solid ${themeConfig.border}`,
            overflow: "hidden",
          }}
        >
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC" }}>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Guest</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Room</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Check-In</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Check-Out</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Billing</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Stay Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedGuests.map((row) => {
                  const g = withApiStay(row);
                  return (
                  <TableRow
                    key={g.id}
                    hover
                    sx={{
                      cursor: "pointer",
                      "&:last-child td, &:last-child th": { border: 0 },
                    }}
                    onClick={() => setSelectedGuest(g)}
                  >
                    {/* Guest Avatar & Name */}
                    <TableCell>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                        <Avatar
                          sx={{
                            width: 40,
                            height: 40,
                            fontWeight: 800,
                            bgcolor: themeConfig.primary,
                            color: "#FFFFFF",
                            fontSize: "0.95rem",
                          }}
                        >
                          {g.guestName.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                            {g.guestName}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                            {g.phone || "No contact"}
                            {g.bookingNumber ? ` · ${g.bookingNumber}` : ""}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>

                    {/* Room */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                        Room {g.roomAssigned}
                      </Typography>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                        {g.roomType}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                        {formatDateTime(g.checkIn)}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                        {formatDateTime(g.checkOut)}
                      </Typography>
                    </TableCell>

                    {/* Billing */}
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                        {formatCurrency(g.totalAmount)}
                      </Typography>
                      {(g.baseAmount > 0 || g.gstAmount > 0) && (
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                          {formatCurrency(g.baseAmount)} + GST {formatCurrency(g.gstAmount)}
                        </Typography>
                      )}
                      {g.dueAmount > 0 ? (
                        <Chip
                          size="small"
                          label={`Due: ${formatCurrency(g.dueAmount)}`}
                          sx={{
                            height: "20px",
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            bgcolor: "rgba(220, 38, 38, 0.12)",
                            color: "#DC2626",
                            border: "1px solid rgba(220, 38, 38, 0.3)",
                            mt: 0.3,
                          }}
                        />
                      ) : (
                        <Typography variant="caption" sx={{ color: "#059669", fontWeight: 700, display: "block" }}>
                          Fully Paid
                        </Typography>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <StatusChip status={g.status} />
                    </TableCell>

                    {/* Actions */}
                    <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                        {g.phone && (
                          <Tooltip title="Chat on WhatsApp">
                            <IconButton
                              size="small"
                              onClick={() => {
                                const clean = g.phone.replace(/\D/g, "");
                                window.open(`https://wa.me/91${clean}`, "_blank");
                              }}
                              sx={{ color: "#25D366" }}
                            >
                              <WhatsApp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}

                        <Button
                          size="small"
                          variant="outlined"
                          endIcon={<ArrowForward />}
                          onClick={() => setSelectedGuest(g)}
                          sx={{
                            borderRadius: "8px",
                            textTransform: "none",
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            color: themeConfig.textMain,
                            borderColor: themeConfig.border,
                            "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
                          }}
                        >
                          Details
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePagination
            component="div"
            count={filteredGuests.length}
            page={page}
            onPageChange={handleChangePage}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={handleChangeRowsPerPage}
            rowsPerPageOptions={[5, 10, 25, 50]}
            sx={{
              borderTop: `1px solid ${themeConfig.border}`,
              color: themeConfig.textMuted,
            }}
          />
        </Card>
      )}
    </Box>
  );
}
