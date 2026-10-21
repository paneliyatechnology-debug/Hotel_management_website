"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  TextField,
  MenuItem,
  Chip,
  IconButton,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  LinearProgress,
  InputAdornment,
} from "@mui/material";
import {
  CurrencyRupee,
  Receipt,
  Search,
  Refresh,
  FilterList,
  CalendarMonth,
  CreditCard,
  Payments as PaymentIcon,
  Close,
  ArrowBack,
  AccountBalanceWallet,
  Restaurant,
  RoomService,
  Hotel,
  TrendingUp,
  Download,
  Visibility,
  CheckCircle,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { useSocket } from "@/shared/context/SocketContext";
import { folioMoney } from "@/shared/utils/folioMoney";
import EmptyState from "@/shared/components/EmptyState";

export default function RevenueDetailsPage({ onBackToDashboard, hotelSettings, initialFilter = "THIS_WEEK", dashboardData }) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [liveTick, setLiveTick] = useState(0);
  useSocket(
    ["PAYMENT_RECORDED", "BOOKING_CREATED", "BOOKING_UPDATED", "GUEST_CHECKED_OUT", "DASHBOARD_SYNC"],
    () => setLiveTick((tick) => tick + 1)
  );

  // Filters State
  const [filterType, setFilterType] = useState(initialFilter);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    if (initialFilter) {
      setFilterType(initialFilter);
    }
  }, [initialFilter]);

  const [search, setSearch] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("ALL");
  const [paymentStatus, setPaymentStatus] = useState("ALL");

  // Data & Pagination
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [txnState, setTxnState] = useState({ rows: [], total: 0 });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selected Transaction for Dialog
  const [selectedTxn, setSelectedTxn] = useState(null);
  const [bookingRows, setBookingRows] = useState([]);

  const toYmd = (value) => {
    if (!value) return "";
    const text = String(value);
    const match = text.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
    const parsed = new Date(value);
    if (isNaN(parsed.getTime())) return "";
    const month = String(parsed.getMonth() + 1).padStart(2, "0");
    const day = String(parsed.getDate()).padStart(2, "0");
    return `${parsed.getFullYear()}-${month}-${day}`;
  };

  const dateWindow = () => {
    const now = new Date();
    const ymd = (d) => toYmd(d);
    if (filterType === "TODAY") return [ymd(now), ymd(now)];
    if (filterType === "THIS_WEEK" || filterType === "LAST_WEEK") {
      const day = now.getDay();
      const monday = new Date(now);
      monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1) - (filterType === "LAST_WEEK" ? 7 : 0));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      return [ymd(monday), ymd(sunday)];
    }
    if (filterType === "THIS_MONTH" || filterType === "LAST_MONTH") {
      const start = new Date(now.getFullYear(), now.getMonth() - (filterType === "LAST_MONTH" ? 1 : 0), 1);
      const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
      return [ymd(start), ymd(end)];
    }
    if (filterType === "CUSTOM" && startDate && endDate) return [toYmd(startDate), toYmd(endDate)];
    return ["", ""];
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest(`${API_ENDPOINTS.BOOKINGS.ALL}?page=1&limit=100`, { forceRefresh: true });
        const list = Array.isArray(res?.data) ? res.data : res?.data?.bookings || [];
        if (!cancelled) setBookingRows(list);
      } catch {
        if (!cancelled) setBookingRows([]);
      }
    })();
    return () => { cancelled = true; };
  }, [filterType, startDate, endDate, liveTick]);

  const fetchRevenueDetails = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      let query = `?filter=${filterType}&page=${page + 1}&limit=${rowsPerPage}`;
      if (filterType === "CUSTOM" && startDate && endDate) {
        query += `&start_date=${startDate}&end_date=${endDate}`;
      }
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (paymentMethod !== "ALL") query += `&payment_method=${paymentMethod}`;
      if (paymentStatus !== "ALL") query += `&status=${paymentStatus}`;

      const endpoint = `${API_ENDPOINTS.HOTEL_ADMIN.REVENUE_DETAILS}${query}`;
      const res = await apiRequest(endpoint);
      if (res?.success && res?.data) {
        setRevenueData(res.data);
      }
    } catch (err) {
      console.warn("Failed to fetch revenue details:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRevenueDetails(liveTick > 0);
  }, [filterType, startDate, endDate, paymentMethod, paymentStatus, page, rowsPerPage, liveTick]);

  useEffect(() => {
    const [start, end] = dateWindow();
    if (!start || !end) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.SUMMARY(start, end), { forceRefresh: true });
        const payload = res?.data && !Array.isArray(res.data) ? res.data : null;
        if (!cancelled) setSummary(payload);
      } catch {
        if (!cancelled) setSummary(null);
      }
    })();
    return () => { cancelled = true; };
  }, [filterType, startDate, endDate, liveTick]);

  useEffect(() => {
    const [start, end] = dateWindow();
    if (!start || !end) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const params = new URLSearchParams({
          start_date: start,
          end_date: end,
          page: String(page + 1),
          limit: String(rowsPerPage),
        });
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.TRANSACTIONS(params.toString()), { forceRefresh: true });
        const payload = res?.data && !Array.isArray(res.data) ? res.data : {};
        const list = Array.isArray(payload.transactions) ? payload.transactions : [];
        const rows = list.map((txn) => ({
          id: txn.id,
          formattedDate: txn.created_at ? new Date(txn.created_at).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "",
          transactionId: txn.id,
          guestName: txn.primary_guest_name || "Guest",
          bookingNumber: txn.booking_number || txn.booking_id || "—",
          roomNumber: "—",
          description: txn.source || "Payment",
          paymentMethod: String(txn.payment_method || "CASH").toUpperCase(),
          amount: Number(txn.amount || 0),
          tax: 0,
          total: Number(txn.amount || 0),
          status: String(txn.status || "PAID").toUpperCase(),
          receivedBy: txn.received_by?.name || "",
        }));
        if (!cancelled) setTxnState({ rows, total: Number(payload.total ?? rows.length) });
      } catch {
        if (!cancelled) setTxnState({ rows: [], total: 0 });
      }
    })();
    return () => { cancelled = true; };
  }, [filterType, startDate, endDate, page, rowsPerPage, liveTick]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.();
    setPage(0);
    fetchRevenueDetails();
  };

  const handleClearSearch = () => {
    setSearch("");
    setPage(0);
  };

  const kpis = dashboardData?.kpis || {};
  const methods = dashboardData?.revenue_by_payment_method || dashboardData?.revenueByPaymentMethod || {};
  const weekly = dashboardData?.weeklyRevenue?.breakdown || dashboardData?.weekly_revenue_graph || dashboardData?.weeklyRevenueGraph || [];
  const todayRevenue = Number(dashboardData?.financials?.todayRevenue ?? kpis.today_revenue ?? kpis.todayRevenue ?? 0);
  const monthRevenue = Number(dashboardData?.financials?.monthlyRevenue ?? kpis.month_revenue ?? kpis.monthRevenue ?? 0);
  const weekRevenue = weekly.reduce((sum, day) => sum + Number(day.amount ?? day.revenue ?? 0), 0);
  const methodsFromSummary = summary?.collection_by_payment_method || summary?.collectionByPaymentMethod || {};
  const cashTotal = summary
    ? Number(methodsFromSummary.cash_collected_amount ?? methodsFromSummary.cashCollectedAmount ?? 0)
    : Number(methods.CASH ?? methods.cash ?? dashboardData?.weeklyRevenue?.totalCash ?? 0);
  const upiTotal = summary
    ? Number(methodsFromSummary.upi_collected_amount ?? methodsFromSummary.upiCollectedAmount ?? 0)
    : Number(methods.UPI ?? methods.upi ?? dashboardData?.weeklyRevenue?.totalUpi ?? 0);
  const cardTotal = summary
    ? Number(methodsFromSummary.card_collected_amount ?? methodsFromSummary.cardCollectedAmount ?? 0)
    : Number(methods.CARD ?? methods.card ?? 0);
  const otherTotal = summary
    ? Number(methodsFromSummary.bank_transfer_collected_amount ?? methodsFromSummary.bankTransferCollectedAmount ?? 0)
      + Number(methodsFromSummary.online_collected_amount ?? methodsFromSummary.onlineCollectedAmount ?? 0)
    : Number(methods.BANK_TRANSFER ?? methods.bankTransfer ?? 0) + Number(methods.ONLINE ?? methods.online ?? 0);
  const apiTransactions = revenueData?.transactions || [];
  const usingDashboard = !(Number(revenueData?.totalRevenue) > 0 || apiTransactions.length > 0);
  const rangeRevenue = filterType === "TODAY" ? todayRevenue : (filterType === "THIS_MONTH" || filterType === "LAST_MONTH" ? monthRevenue : weekRevenue);
  const [rangeStart, rangeEnd] = dateWindow();
  const bookingTransactions = (() => {
    const mapped = bookingRows.map((b) => {
      const money = folioMoney(b);
      const checkIn = toYmd(b.check_in_date || b.checkInDate || b.actual_check_in || b.actualCheckIn);
      const checkOut = toYmd(b.check_out_date || b.checkOutDate || b.actual_check_out || b.actualCheckOut);
      const created = toYmd(b.created_at || b.createdAt || b.payment_date || b.paymentDate);
      const room = (Array.isArray(b.rooms) && (b.rooms[0]?.room_number || b.rooms[0]?.roomNumber)) || b.room_number || b.roomNumber || "—";
      const dates = [checkIn, checkOut, created].filter(Boolean);
      const inRange = !rangeStart || !rangeEnd || dates.some((day) => day >= rangeStart && day <= rangeEnd) || (checkIn && checkOut && checkIn <= rangeEnd && checkOut >= rangeStart);
      return {
        id: b.id || b._id || b.booking_number,
        inRange,
        formattedDate: checkIn || created || checkOut,
        transactionId: b.booking_number || b.bookingNumber || b.id || "",
        guestName: b.primary_guest_name || b.guestName || b.guest?.name || b.guest?.fullName || "Guest",
        bookingNumber: b.booking_number || b.bookingNumber || "—",
        roomNumber: room,
        description: b.room_type_name || b.roomTypeName || "Room booking",
        paymentMethod: String(b.payment_method || b.paymentMethod || "CASH").toUpperCase(),
        amount: money.base || money.total,
        tax: money.gst,
        total: money.total || money.paid,
        status: String(b.payment_status || b.paymentStatus || b.booking_status || b.status || "PAID").toUpperCase(),
      };
    });
    const inRange = mapped.filter((row) => row.inRange);
    const source = inRange.length > 0 ? inRange : mapped;
    return source.filter((row) => {
      if (paymentMethod !== "ALL" && row.paymentMethod !== paymentMethod) return false;
      if (paymentStatus !== "ALL" && row.status !== paymentStatus) return false;
      if (search.trim()) {
        const q = search.trim().toLowerCase();
        return [row.guestName, row.transactionId, row.bookingNumber, row.roomNumber].some((value) => String(value || "").toLowerCase().includes(q));
      }
      return true;
    });
  })();

  const transactions = txnState.rows.length > 0 || txnState.total > 0 ? txnState.rows : (apiTransactions.length > 0 ? apiTransactions : bookingTransactions);
  const breakdown = {
    roomBooking: cashTotal,
    extraServices: upiTotal,
    foodRestaurant: cardTotal,
    otherCharges: otherTotal,
    total: cashTotal + upiTotal + cardTotal + otherTotal,
  };
  const sourceLabels = ["Cash", "UPI", "Card", "Bank / Online"];
  const dateRangeLabel = summary?.period_start_date && summary?.period_end_date
    ? `${summary.period_start_date} to ${summary.period_end_date}`
    : (filterType === "TODAY" ? "Today" : filterType === "THIS_MONTH" ? "This Month" : "This Week");
  const totalRev = summary
    ? Number(summary.total_collected_amount ?? summary.totalCollectedAmount ?? 0)
    : (apiTransactions.length > 0 ? (revenueData?.totalRevenue || 0) : rangeRevenue);
  const totalTxnCount = summary
    ? Number(summary.total_booking_count ?? summary.totalBookingCount ?? 0)
    : (apiTransactions.length > 0 ? (revenueData?.totalTransactions || apiTransactions.length) : bookingTransactions.length);
  const avgTicket = totalTxnCount > 0 ? Math.round(totalRev / totalTxnCount) : 0;
  const shareBase = Number(breakdown.total) > 0 ? Number(breakdown.total) : totalRev;
  const sharePercent = (amount) => {
    if (!(shareBase > 0)) return 0;
    return Math.min(100, Math.max(0, Math.round((Number(amount) || 0) / shareBase * 100)));
  };

  const getMethodColor = (method) => {
    switch (method?.toUpperCase()) {
      case "CASH": return { bg: "rgba(16, 185, 129, 0.12)", color: "#059669", border: "rgba(16, 185, 129, 0.3)" };
      case "UPI": return { bg: "rgba(14, 165, 233, 0.12)", color: "#0284C7", border: "rgba(14, 165, 233, 0.3)" };
      case "CARD": return { bg: "rgba(139, 92, 246, 0.12)", color: "#7C3AED", border: "rgba(139, 92, 246, 0.3)" };
      default: return { bg: "rgba(100, 116, 139, 0.12)", color: "#475569", border: "rgba(100, 116, 139, 0.3)" };
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: { xs: 10, sm: 4 } }}>
      {/* Top Header Card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: "20px",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          border: `1.5px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "0 4px 20px rgba(0,0,0,0.4)" : "0 4px 20px rgba(0,0,0,0.04)",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 2, mb: 2.5 }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: 1.5 }}>
            {onBackToDashboard && (
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={onBackToDashboard}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  px: 2,
                  py: 0.9,
                  justifyContent: "center",
                  borderColor: themeConfig.border,
                  color: themeConfig.textMain,
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                  "&:hover": {
                    bgcolor: themeConfig.champagne,
                    borderColor: themeConfig.primary,
                    transform: "translateX(-2px)",
                  },
                  transition: "all 0.2s ease-in-out",
                }}
              >
                Back to Dashboard
              </Button>
            )}
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: "-0.5px", fontSize: { xs: "1.2rem", sm: "1.5rem" } }}>
                Detailed Revenue &amp; Financial Ledger
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "block", mt: 0.5, fontSize: { xs: "0.75rem", sm: "0.8rem" } }}>
                Period: <span style={{ color: themeConfig.primary, fontWeight: 800 }}>{dateRangeLabel}</span> &bull; Real-time verified booking &amp; payment transactions
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: "center", gap: 1.2, width: { xs: "100%", sm: "auto" } }}>

            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchRevenueDetails}
              sx={{
                width: { xs: "100%", sm: "auto" },
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "0.82rem",
                px: 2,
                py: 0.9,
                justifyContent: "center",
                whiteSpace: "nowrap",
                bgcolor: themeConfig.primary,
                boxShadow: `0 4px 12px ${themeConfig.primaryGlow}`,
                "&:hover": { bgcolor: themeConfig.primaryDark },
              }}
            >
              Refresh Data
            </Button>
          </Box>
        </Box>

        {/* Date Filter Preset Buttons */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            flexWrap: "nowrap",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            py: 1,
            borderTop: `1px solid ${themeConfig.border}`,
            width: "100%",
            maxWidth: "100%",
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {[
            { id: "TODAY", label: "Today" },
            { id: "THIS_WEEK", label: "This Week" },
            { id: "LAST_WEEK", label: "Last Week" },
            { id: "THIS_MONTH", label: "This Month" },
            { id: "LAST_MONTH", label: "Last Month" },
            { id: "CUSTOM", label: "Custom Range" },
          ].map((preset) => {
            const isActive = filterType === preset.id;
            return (
              <Chip
                key={preset.id}
                label={preset.label}
                clickable
                onClick={() => {
                  setFilterType(preset.id);
                  setPage(0);
                }}
                sx={{
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  px: 1.4,
                  height: 36,
                  borderRadius: "10px",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  bgcolor: isActive ? themeConfig.primary : (isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9"),
                  color: isActive ? "#FFFFFF" : themeConfig.textMain,
                  border: `1.5px solid ${isActive ? themeConfig.primary : themeConfig.border}`,
                  boxShadow: isActive ? `0 4px 12px ${themeConfig.primaryGlow}` : "none",
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: isActive ? themeConfig.primaryDark : (isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0"),
                  },
                }}
              />
            );
          })}

          {/* Custom Date Inputs if CUSTOM is chosen */}
          {filterType === "CUSTOM" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, ml: { xs: 0, sm: 1 }, mt: { xs: 1, sm: 0 }, flexWrap: "wrap" }}>
              <TextField
                size="small"
                type="date"
                label="Start Date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 160 }}
              />
              <TextField
                size="small"
                type="date"
                label="End Date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ width: 160 }}
              />
            </Box>
          )}
        </Box>
      </Paper>

      {/* KPI Highlight Summary Cards */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.8,
              borderRadius: "20px",
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              border: `1.5px solid ${themeConfig.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  TOTAL REVENUE ({dateRangeLabel})
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: "#10B981", mt: 0.5, letterSpacing: "-1px", fontSize: { xs: "1.5rem", sm: "2.2rem" } }}>
                  ₹{totalRev.toLocaleString()}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: "14px",
                  bgcolor: "rgba(16, 185, 129, 0.12)",
                  color: "#10B981",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <CurrencyRupee sx={{ fontSize: 26 }} />
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: "#10B981", fontWeight: 800, display: "flex", alignItems: "center", gap: 0.5, mt: 1 }}>
              <CheckCircle sx={{ fontSize: 14 }} /> 100% Calculated from verified transactions
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.8,
              borderRadius: "20px",
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              border: `1.5px solid ${themeConfig.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  TOTAL TRANSACTIONS
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: themeConfig.textMain, mt: 0.5, letterSpacing: "-1px", fontSize: { xs: "1.5rem", sm: "2.2rem" } }}>
                  {totalTxnCount}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: "14px",
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "rgba(100, 116, 139, 0.12)",
                  color: themeConfig.textMain,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Receipt sx={{ fontSize: 26 }} />
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "block", mt: 1 }}>
              Completed in this selected date range
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.8,
              borderRadius: "20px",
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              border: `1.5px solid ${themeConfig.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  AVERAGE TICKET / TRANSACTION SIZE
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: themeConfig.primary, mt: 0.5, letterSpacing: "-1px", fontSize: { xs: "1.5rem", sm: "2.2rem" } }}>
                  ₹{avgTicket.toLocaleString()}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: "14px",
                  bgcolor: themeConfig.champagne,
                  color: themeConfig.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <TrendingUp sx={{ fontSize: 26 }} />
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "block", mt: 1 }}>
              Per transaction revenue average
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Revenue Source Breakdown */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: "20px",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          border: `1.5px solid ${themeConfig.border}`,
        }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
          <Receipt sx={{ fontSize: 20, color: themeConfig.primary }} />
          Revenue Source Breakdown
        </Typography>

        <Grid container spacing={2}>
          {/* Room Bookings */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: "16px",
                bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                border: `1px solid ${themeConfig.border}`,
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Hotel sx={{ fontSize: 20, color: themeConfig.primary }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>
                    {sourceLabels[0]}
                  </Typography>
                </Box>
                <Chip
                  label={`${sharePercent(breakdown.roomBooking)}%`}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: "0.7rem", height: 20, bgcolor: themeConfig.champagne, color: themeConfig.primary }}
                />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                ₹{breakdown.roomBooking?.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                {`${sharePercent(breakdown.roomBooking)}% of total`}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={sharePercent(breakdown.roomBooking)}
                sx={{
                  mt: 1.5,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                  "& .MuiLinearProgress-bar": { bgcolor: themeConfig.primary, borderRadius: 3 },
                }}
              />
            </Paper>
          </Grid>

          {/* Extra Services / Beds */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: "16px",
                bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                border: `1px solid ${themeConfig.border}`,
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <RoomService sx={{ fontSize: 20, color: "#8B5CF6" }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>
                    {sourceLabels[1]}
                  </Typography>
                </Box>
                <Chip
                  label={`${sharePercent(breakdown.extraServices)}%`}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: "0.7rem", height: 20, bgcolor: "rgba(139, 92, 246, 0.12)", color: "#8B5CF6" }}
                />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                ₹{breakdown.extraServices?.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                {`${sharePercent(breakdown.extraServices)}% of total`}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={sharePercent(breakdown.extraServices)}
                sx={{
                  mt: 1.5,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                  "& .MuiLinearProgress-bar": { bgcolor: "#8B5CF6", borderRadius: 3 },
                }}
              />
            </Paper>
          </Grid>

          {/* Food / Restaurant */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: "16px",
                bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                border: `1px solid ${themeConfig.border}`,
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Restaurant sx={{ fontSize: 20, color: "#F59E0B" }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>
                    {sourceLabels[2]}
                  </Typography>
                </Box>
                <Chip
                  label={`${sharePercent(breakdown.foodRestaurant)}%`}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: "0.7rem", height: 20, bgcolor: "rgba(245, 158, 11, 0.12)", color: "#D97706" }}
                />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                ₹{breakdown.foodRestaurant?.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                {`${sharePercent(breakdown.foodRestaurant)}% of total`}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={sharePercent(breakdown.foodRestaurant)}
                sx={{
                  mt: 1.5,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                  "& .MuiLinearProgress-bar": { bgcolor: "#F59E0B", borderRadius: 3 },
                }}
              />
            </Paper>
          </Grid>

          {/* Other Charges */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper
              elevation={0}
              sx={{
                p: 2.2,
                borderRadius: "16px",
                bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                border: `1px solid ${themeConfig.border}`,
                transition: "transform 0.2s",
                "&:hover": { transform: "translateY(-2px)" },
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <AccountBalanceWallet sx={{ fontSize: 20, color: "#10B981" }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>
                    {sourceLabels[3]}
                  </Typography>
                </Box>
                <Chip
                  label={`${sharePercent(breakdown.otherCharges)}%`}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: "0.7rem", height: 20, bgcolor: "rgba(16, 185, 129, 0.12)", color: "#10B981" }}
                />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                ₹{breakdown.otherCharges?.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                {`${sharePercent(breakdown.otherCharges)}% of total`}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={sharePercent(breakdown.otherCharges)}
                sx={{
                  mt: 1.5,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                  "& .MuiLinearProgress-bar": { bgcolor: "#10B981", borderRadius: 3 },
                }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Paper>

      {/* Transaction Records Table & Filtering */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: "20px",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          border: `1.5px solid ${themeConfig.border}`,
        }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 2 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
            <CreditCard sx={{ fontSize: 20, color: themeConfig.primary }} />
            Transaction Records ({txnState.total || transactions.length})
          </Typography>

          {/* Search and Filters Bar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", flexDirection: { xs: "column", sm: "row" }, width: { xs: "100%", sm: "auto" } }}>
            <TextField
              size="small"
              placeholder="Search Guest, TXN, Room..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit(e)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: themeConfig.textMuted }} />
                    </InputAdornment>
                  ),
                  endAdornment: search ? (
                    <InputAdornment position="end">
                      <IconButton size="small" onClick={handleClearSearch}>
                        <Close sx={{ fontSize: 16 }} />
                      </IconButton>
                    </InputAdornment>
                  ) : null,
                },
              }}
              sx={{
                width: { xs: "100%", sm: 240 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                },
              }}
            />

            <Box sx={{ display: "flex", gap: 1, width: { xs: "100%", sm: "auto" } }}>
              <TextField
                select
                size="small"
                label="Payment Method"
                value={paymentMethod}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setPage(0);
                }}
                sx={{
                  flex: 1,
                  width: { xs: "50%", sm: 160 },
                  "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                }}
              >
                <MenuItem value="ALL">All Methods</MenuItem>
                <MenuItem value="UPI">UPI</MenuItem>
                <MenuItem value="CASH">Cash</MenuItem>
                <MenuItem value="CARD">Card</MenuItem>
                <MenuItem value="ONLINE">Online Gateway</MenuItem>
                <MenuItem value="BANK_TRANSFER">Bank Transfer</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                label="Status"
                value={paymentStatus}
                onChange={(e) => {
                  setPaymentStatus(e.target.value);
                  setPage(0);
                }}
                sx={{
                  flex: 1,
                  width: { xs: "50%", sm: 140 },
                  "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                }}
              >
                <MenuItem value="ALL">All Status</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
                <MenuItem value="PARTIALLY_PAID">Partial</MenuItem>
                <MenuItem value="FAILED">Failed</MenuItem>
                <MenuItem value="REFUNDED">Refunded</MenuItem>
              </TextField>
            </Box>
          </Box>
        </Box>

        {/* Table Content */}
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, gap: 2 }}>
            <CircularProgress sx={{ color: themeConfig.primary }} />
            <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
              Loading financial records...
            </Typography>
          </Box>
        ) : transactions.length > 0 ? (
          <>
            <TableContainer sx={{ borderRadius: "14px", border: `1px solid ${themeConfig.border}`, overflowX: "auto" }}>
              <Table size="medium" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F0FDFA" }}>
                    {["Date", "Guest", "Booking", "Method", "Amount", "Status"].map((heading) => (
                      <TableCell key={heading} sx={{ fontWeight: 800, fontSize: "0.75rem", letterSpacing: "0.04em", textTransform: "uppercase", color: themeConfig.primaryDark, py: 1.6, whiteSpace: "nowrap", borderBottom: `1px solid ${themeConfig.border}` }}>
                        {heading}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((t, idx) => {
                    const methodStyle = getMethodColor(t.paymentMethod);
                    return (
                      <TableRow
                        key={t.id || idx}
                        hover
                        sx={{ "& td": { borderBottom: `1px solid ${themeConfig.border}`, py: 1.6 } }}
                      >
                        <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain, whiteSpace: "nowrap" }}>
                          {t.formattedDate}
                        </TableCell>
                        <TableCell>
                          <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.9rem", lineHeight: 1.2 }}>
                            {t.guestName}
                          </Typography>
                          {t.receivedBy ? (
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 600 }}>
                              Received by {t.receivedBy}
                            </Typography>
                          ) : null}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.primary, whiteSpace: "nowrap" }}>
                          {t.bookingNumber}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t.paymentMethod}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              borderRadius: "999px",
                              bgcolor: methodStyle.bg,
                              color: methodStyle.color,
                              border: `1px solid ${methodStyle.border}`,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 900, color: "#0F766E", whiteSpace: "nowrap" }}>
                          ₹{Number(t.amount || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t.status}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              borderRadius: "999px",
                              bgcolor: t.status === "PAID" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                              color: t.status === "PAID" ? "#059669" : "#D97706",
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={txnState.total || transactions.length}
              page={page}
              onPageChange={(e, np) => setPage(np)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 20, 50]}
              sx={{
                borderTop: `1px solid ${themeConfig.border}`,
                mt: 1,
                "& .MuiTablePagination-toolbar": {
                  flexWrap: "wrap",
                  px: { xs: 1, sm: 2 },
                  justifyContent: { xs: "center", sm: "flex-end" },
                  gap: 1,
                },
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontWeight: 700,
                  color: themeConfig.textMuted,
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  m: 0,
                },
              }}
            />
          </>
        ) : (
          <EmptyState
            title="No Transactions Found"
            message="There are no payment or booking transactions matching the selected filters."
          />
        )}
      </Paper>

      {/* Transaction Details Dialog */}
      {selectedTxn && (
        <Dialog
          open={Boolean(selectedTxn)}
          onClose={() => setSelectedTxn(null)}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: "20px",
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                border: `1.5px solid ${themeConfig.border}`,
                backgroundImage: "none",
              },
            },
          }}
        >
          <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Receipt sx={{ color: themeConfig.primary }} />
              <Typography variant="h6" component="div" sx={{ fontWeight: 900 }}>
                Transaction Receipt
              </Typography>
            </Box>
            <IconButton onClick={() => setSelectedTxn(null)} size="small">
              <Close />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: themeConfig.border }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Transaction ID:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primary, fontFamily: "monospace" }}>{selectedTxn.transactionId}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Guest Name:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedTxn.guestName} {selectedTxn.guestMobile ? `(${selectedTxn.guestMobile})` : ""}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Booking / Room:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>#{selectedTxn.bookingNumber} &bull; Room {selectedTxn.roomNumber}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Date & Time:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedTxn.formattedDate}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Payment Method:</Typography>
                <Chip label={selectedTxn.paymentMethod} size="small" sx={{ fontWeight: 800 }} />
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Description:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMuted, textAlign: "right", maxWidth: 280 }}>{selectedTxn.description}</Typography>
              </Box>
              <Divider sx={{ my: 1, borderColor: themeConfig.border }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>Base Amount:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>₹{selectedTxn.amount?.toLocaleString()}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>Tax / GST:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>₹{selectedTxn.tax?.toLocaleString() || 0}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 1.5, borderRadius: "12px", bgcolor: isDarkMode ? "rgba(16, 185, 129, 0.08)" : "#F0FDF4" }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 900 }}>Total Paid Amount:</Typography>
                <Typography variant="h5" sx={{ fontWeight: 900, color: "#10B981" }}>₹{selectedTxn.total?.toLocaleString()}</Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, display: "flex", justifyContent: "flex-end", alignItems: "center" }}>
            <Button
              onClick={() => setSelectedTxn(null)}
              variant="contained"
              sx={{ width: { xs: "100%", sm: "auto" }, borderRadius: "10px", fontWeight: 800, bgcolor: themeConfig.primary, justifyContent: "center" }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

