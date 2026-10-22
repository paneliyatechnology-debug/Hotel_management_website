"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Box,
  Typography,
  Card,
  Paper,
  Button,
  Chip,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  InputAdornment,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  TablePagination,
  LinearProgress,
} from "@mui/material";
import {
  AccountBalanceWallet,
  Payments,
  QrCode2,
  CreditCard,
  AccountBalance,
  TrendingUp,
  Schedule,
  CheckCircle,
  Print,
  Download,
  Lock,
  LockOpen,
  PieChart,
  ShowChart,
  MeetingRoom,
  Handshake,
  Search,
  FilterList,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { useSocket } from "@/shared/context/SocketContext";
import { toast } from "@/shared/utils/toast";
import EmptyState from "@/shared/components/EmptyState";
import { TableCard, TableToolbar, TablePager, tableFieldSx, tableSearchSx } from "@/shared/components/DataTable";

import { folioMoney } from "@/shared/utils/folioMoney";

function bookingsToCollections(list) {
  const rows = (Array.isArray(list) ? list : [])
    .map((b) => {
      const money = folioMoney(b);
      const amount = money.paid || money.total;
      const method = String(b.payment_method || b.paymentMethod || "CASH").toUpperCase();
      const when = b.actual_check_in || b.actualCheckIn || b.created_at || b.createdAt || b.check_in_date || b.checkInDate;
      return {
        receiptNumber: b.booking_number || b.bookingNumber || b.id,
        timeStr: when ? new Date(when).toLocaleString("en-IN", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" }) : "",
        roomNumber: b.room_number || b.roomNumber || (Array.isArray(b.rooms) ? b.rooms.map((r) => r.room_number || r.roomNumber).filter(Boolean).join(", ") : "") || "—",
        guestName: b.primary_guest_name || b.guestName || b.guest?.name || "Guest",
        guestPhone: b.mobile_number || b.phone || "—",
        bookingNumber: b.booking_number || b.bookingNumber || b.id,
        paymentMethod: method,
        paymentType: money.paid > 0 ? "Paid amount" : "Booking total",
        note: b.notes || "",
        amount,
        collectedByName: b.creator?.name || "Front Desk",
        drawerSettlementStatus: "UNSETTLED",
        transactionId: "",
      };
    })
    .filter((row) => row.amount > 0);

  const sum = (method) => rows.filter((row) => row.paymentMethod === method).reduce((total, row) => total + row.amount, 0);
  const todayGross = rows.reduce((total, row) => total + row.amount, 0);
  return {
    telemetry: {
      todayGross,
      todayCash: sum("CASH"),
      todayUpi: sum("UPI"),
      todayCard: sum("CARD"),
      todayBank: sum("BANK_TRANSFER") + sum("NET_BANKING"),
      cashInDrawer: sum("CASH"),
      unsettledTotal: todayGross,
      totalVaultSettled: 0,
    },
    guestPaymentsList: rows,
    pagination: { page: 1, limit: rows.length || 10, totalRecords: rows.length, totalPages: 1 },
    handoverHistory: [],
  };
}

export default function DailyCollectionsPage({ user, hotelSettings, onRefreshOverview }) {
  const { themeConfig, isDarkMode } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [data, setData] = useState(null);

  // Backend Pagination & Search Filters
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [settlementFilter, setSettlementFilter] = useState("ALL");

  // Handover History Pagination
  const [handoverPage, setHandoverPage] = useState(1);
  const [handoverRowsPerPage, setHandoverRowsPerPage] = useState(5);

  // Handover Settlement Modal
  const [handoverModalOpen, setHandoverModalOpen] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState("");
  const [settling, setSettling] = useState(false);

  // Voucher Modal
  const [voucherModal, setVoucherModal] = useState({ open: false, record: null });

  const fetchDailyData = useCallback(
    async (
      p = page,
      l = rowsPerPage,
      q = searchQuery,
      m = methodFilter,
      hp = handoverPage,
      hl = handoverRowsPerPage
    ) => {
      setLoading(true);
      setLoadError("");
      try {
        const res = await apiRequest(`${API_ENDPOINTS.BOOKINGS.ALL}?page=${p}&limit=${Math.min(l, 100)}`, { forceRefresh: true });
        const list = Array.isArray(res?.data) ? res.data : res?.data?.bookings || [];
        setData(bookingsToCollections(list));
      } catch (err) {
        console.error("Failed to load daily collections:", err);
        setLoadError(err?.message || "Could not load collections.");
      } finally {
        setLoading(false);
      }
    },
    [page, rowsPerPage, searchQuery, methodFilter, handoverPage, handoverRowsPerPage, user?.role]
  );

  useEffect(() => {
    fetchDailyData(page, rowsPerPage, searchQuery, methodFilter, handoverPage, handoverRowsPerPage);
  }, [page, rowsPerPage, methodFilter, handoverPage, handoverRowsPerPage]);

  // Real-time Socket.io Sync for Instant Payment & Shift Handover Updates
  useSocket(
    ["PAYMENT_RECORDED", "HANDOVER_SETTLED", "DASHBOARD_SYNC", "BOOKING_CREATED", "GUEST_CHECKED_OUT"],
    (payload, eventName) => {
      fetchDailyData(page, rowsPerPage, searchQuery, methodFilter, handoverPage, handoverRowsPerPage);
    }
  );

  const handleSearchSubmit = (e) => {
    if (e) e.preventDefault();
    setPage(1);
    fetchDailyData(1, rowsPerPage, searchQuery, methodFilter, handoverPage, handoverRowsPerPage);
  };

  const handleMethodChange = (newMethod) => {
    setMethodFilter(newMethod);
    setPage(1);
    fetchDailyData(1, rowsPerPage, searchQuery, newMethod, handoverPage, handoverRowsPerPage);
  };

  const showToast = (message, severity = "success") => {
    toast.show(message, severity);
  };

  const handleSettleDrawer = async () => {
    setSettling(true);
    try {
      const isReceptionist = user?.role === "RECEPTIONIST";
      const settleEndpoint = isReceptionist
        ? API_ENDPOINTS.RECEPTIONIST.SETTLE_HANDOVER
        : API_ENDPOINTS.HOTEL_ADMIN.SETTLE_HANDOVER;
      const res = await apiRequest(settleEndpoint, {
        method: "POST",
        body: { notes: handoverNotes },
      });

      showToast(res.message || "Cash drawer successfully settled! Front desk counter reset to ₹0.");
      setHandoverModalOpen(false);
      setHandoverNotes("");
      await fetchDailyData(1, rowsPerPage, searchQuery, methodFilter);
      if (onRefreshOverview) onRefreshOverview();
    } catch (err) {
      showToast(err.message || "Failed to settle cash drawer", "error");
    } finally {
      setSettling(false);
    }
  };

  const formatRupee = (val) => Number(val || 0).toLocaleString("en-IN");

  const telemetry = {
    todayGross: 0,
    todayCash: 0,
    todayUpi: 0,
    todayCard: 0,
    todayBank: 0,
    todayOnline: 0,
    yesterdayGross: 0,
    thisMonthGross: 0,
    lastMonthGross: 0,
    cashInDrawer: 0,
    unsettledTotal: 0,
    totalVaultSettled: 0,
    todayEstimatedNetEarnings: 0,
    monthEstimatedNetEarnings: 0,
    ...(data?.telemetry || {}),
  };

  const percentages = {
    cashPercentage: 0,
    upiPercentage: 0,
    cardPercentage: 0,
    bankPercentage: 0,
    dailyTarget: 25000,
    dailyTargetPercentage: 0,
    dayGrowthPercentage: 0,
    monthGrowthPercentage: 0,
    netEarningsMarginPercentage: 78.5,
    ...(data?.percentages || {}),
  };

  const rawGuestList = data?.guestPaymentsList || [];
  const guestList = rawGuestList.filter((g) => {
    if (settlementFilter === "UNSETTLED") {
      return g.drawerSettlementStatus !== "SETTLED_TO_ADMIN";
    }
    if (settlementFilter === "SETTLED") {
      return g.drawerSettlementStatus === "SETTLED_TO_ADMIN";
    }
    return true;
  });
  const pagination = data?.pagination || {
    page: 1,
    limit: rowsPerPage,
    totalRecords: guestList.length,
    totalPages: 1,
  };
  const handoverHistory = data?.handoverHistory || [];
  const handoverPagination = data?.handoverPagination || {
    page: 1,
    limit: handoverRowsPerPage,
    totalRecords: handoverHistory.length,
    totalPages: 1,
  };

  const getMethodBadge = (method) => {
    const m = (method || "").toUpperCase();
    switch (m) {
      case "UPI":
        return { label: "UPI QR", icon: <QrCode2 sx={{ fontSize: 16 }} />, ...themeConfig.tones.violet };
      case "CASH":
        return { label: "Cash", icon: <Payments sx={{ fontSize: 16 }} />, ...themeConfig.tones.success };
      case "CARD":
        return { label: "Card POS", icon: <CreditCard sx={{ fontSize: 16 }} />, ...themeConfig.tones.blue };
      case "BANK_TRANSFER":
        return { label: "Bank NEFT", icon: <AccountBalance sx={{ fontSize: 16 }} />, ...themeConfig.tones.warning };
      default:
        return { label: "Online", icon: <AccountBalanceWallet sx={{ fontSize: 16 }} />, ...themeConfig.tones.neutral };
    }
  };

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: "100%",
        overflowX: "hidden",
        px: { xs: 0, sm: 0.5 },
        py: { xs: 0.5, sm: 1 },
        pb: { xs: 10, sm: 4 },
        display: "flex",
        flexDirection: "column",
        gap: { xs: 2, sm: 2.5, md: 3 },
      }}
    >
      {loadError ? <Alert severity="error">{loadError}</Alert> : null}
      {/* Header */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", lg: "center" },
          flexDirection: { xs: "column", lg: "row" },
          gap: 2,
          width: "100%",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              color: themeConfig.textMain,
              letterSpacing: -0.5,
              fontSize: { xs: "1.25rem", sm: "1.5rem", md: "1.65rem" },
              wordBreak: "break-word",
            }}
          >
            Collections
          </Typography>
        </Box>

        <Box
          sx={{
            display: "flex",
            gap: 1.2,
            flexWrap: "wrap",
            alignItems: "center",
            width: { xs: "100%", lg: "auto" },
            justifyContent: { xs: "flex-start", sm: "flex-end" },
          }}
        >
          <Box sx={{ display: "flex", gap: 1, width: { xs: "100%", sm: "auto" }, flexWrap: "wrap" }}>
          </Box>

          <Button
            variant="contained"
            startIcon={<Handshake sx={{ fontSize: "18px !important" }} />}
            disabled={Number(telemetry.unsettledTotal || 0) <= 0}
            onClick={() => setHandoverModalOpen(true)}
            sx={{
              width: { xs: "100%", sm: "auto" },
              borderRadius: "12px",
              py: 0.9,
              px: 2,
              background: telemetry.cashInDrawer > 0
                ? "linear-gradient(135deg, #F59E0B 0%, #D97706 100%) !important"
                : "linear-gradient(135deg, #10B981 0%, #059669 100%) !important",
              color: "#FFFFFF !important",
              fontWeight: 800,
              fontSize: { xs: "0.75rem", sm: "0.82rem" },
              textTransform: "none",
              whiteSpace: "nowrap",
              justifyContent: "center",
              boxShadow: telemetry.cashInDrawer > 0
                ? "0 4px 14px rgba(245, 158, 11, 0.35)"
                : "0 4px 14px rgba(16, 185, 129, 0.35)",
              "& .MuiSvgIcon-root": {
                color: "#FFFFFF !important",
              },
              "&:hover": {
                filter: "brightness(1.08)",
              },
              "&.Mui-disabled": {
                background: (isDarkMode ? "rgba(255,255,255,0.08)" : "#E2E8F0") + " !important",
                color: (isDarkMode ? "#94A3B8" : "#64748B") + " !important",
                border: `1px solid ${themeConfig.border}`,
                boxShadow: "none !important",
                cursor: "not-allowed",
                "& .MuiSvgIcon-root": {
                  color: (isDarkMode ? "#94A3B8" : "#64748B") + " !important",
                },
              },
            }}
          >
            {telemetry.cashInDrawer > 0
              ? `Settle Cash Handover (₹${formatRupee(telemetry.cashInDrawer)})`
              : "Settle Shift Handover (₹0 Balanced)"}
          </Button>
        </Box>
      </Box>

      {/* 4 ESSENTIAL DAILY COLLECTION STAT CARDS */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            lg: "repeat(4, 1fr)",
          },
          gap: { xs: 1.5, sm: 2 },
          width: "100%",
        }}
      >
        {/* CARD 1: Cash in Counter Drawer */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.8, sm: 2, md: 2.2 },
            minWidth: 0,
            overflow: "hidden",
            borderRadius: "18px",
            bgcolor: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "#FFFFFF",
            border: `1.5px solid ${telemetry.cashInDrawer > 0 ? "rgba(245, 158, 11, 0.35)" : themeConfig.border}`,
            boxShadow: telemetry.cashInDrawer > 0
              ? (isDarkMode ? "0 8px 24px rgba(245, 158, 11, 0.15)" : "0 8px 24px rgba(245, 158, 11, 0.08)")
              : "0 4px 14px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: telemetry.cashInDrawer > 0 ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)", color: telemetry.cashInDrawer > 0 ? "#F59E0B" : "#10B981", flexShrink: 0 }}>
                {telemetry.cashInDrawer > 0 ? <LockOpen sx={{ fontSize: 18 }} /> : <Lock sx={{ fontSize: 18 }} />}
              </Avatar>
              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                Cash in Drawer
              </Typography>
            </Box>
            <Chip
              label={telemetry.cashInDrawer > 0 ? "At Counter" : "₹0 Balanced"}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: "0.68rem",
                height: 20,
                bgcolor: telemetry.cashInDrawer > 0 ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)",
                color: telemetry.cashInDrawer > 0 ? "#D97706" : "#10B981",
              }}
            />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: telemetry.cashInDrawer > 0 ? (isDarkMode ? "#FBBF24" : "#D97706") : themeConfig.textMain, letterSpacing: -0.5, my: 0.5, fontSize: { xs: "1.35rem", sm: "1.6rem", xl: "1.8rem" }, wordBreak: "break-word" }}>
            ₹{formatRupee(telemetry.cashInDrawer)}
          </Typography>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", lineHeight: 1.3 }}>
            Unsettled cash awaiting admin vault handover
          </Typography>
        </Paper>

        {/* CARD 2: Total Today Gross Collections */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.8, sm: 2, md: 2.2 },
            minWidth: 0,
            overflow: "hidden",
            borderRadius: "18px",
            bgcolor: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "#FFFFFF",
            border: `1.5px solid ${themeConfig.border}`,
            boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(59, 130, 246, 0.12)", color: "#3B82F6", flexShrink: 0 }}>
                <TrendingUp sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                Today&apos;s Gross
              </Typography>
            </Box>
            <Chip
              label={`${pagination.totalRecords || guestList.length} Receipts`}
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: "0.68rem",
                height: 20,
                bgcolor: "rgba(59, 130, 246, 0.12)",
                color: "#2563EB",
              }}
            />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5, my: 0.5, fontSize: { xs: "1.35rem", sm: "1.6rem", xl: "1.8rem" }, wordBreak: "break-word" }}>
            ₹{formatRupee(telemetry.todayGross)}
          </Typography>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", lineHeight: 1.3 }}>
            Cash (₹{formatRupee(telemetry.todayCash)}) + Digital (₹{formatRupee((Number(telemetry.todayUpi) || 0) + (Number(telemetry.todayCard) || 0) + (Number(telemetry.todayBank) || 0))})
          </Typography>
        </Paper>

        {/* CARD 3: Digital Collections (UPI, Card, Bank) */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.8, sm: 2, md: 2.2 },
            minWidth: 0,
            overflow: "hidden",
            borderRadius: "18px",
            bgcolor: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "#FFFFFF",
            border: `1.5px solid ${themeConfig.border}`,
            boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(139, 92, 246, 0.12)", color: "#8B5CF6", flexShrink: 0 }}>
                <QrCode2 sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                Digital Total
              </Typography>
            </Box>
            <Chip
              label="UPI &amp; Card"
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: "0.68rem",
                height: 20,
                bgcolor: "rgba(139, 92, 246, 0.12)",
                color: "#7C3AED",
              }}
            />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: isDarkMode ? "#A78BFA" : "#7C3AED", letterSpacing: -0.5, my: 0.5, fontSize: { xs: "1.35rem", sm: "1.6rem", xl: "1.8rem" }, wordBreak: "break-word" }}>
            ₹{formatRupee((Number(telemetry.todayUpi) || 0) + (Number(telemetry.todayCard) || 0) + (Number(telemetry.todayBank) || 0))}
          </Typography>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", lineHeight: 1.3 }}>
            UPI: ₹{formatRupee(telemetry.todayUpi)} • Card: ₹{formatRupee(telemetry.todayCard)}
          </Typography>
        </Paper>

        {/* CARD 4: Total Deposited in Vault */}
        <Paper
          elevation={0}
          sx={{
            p: { xs: 1.8, sm: 2, md: 2.2 },
            minWidth: 0,
            overflow: "hidden",
            borderRadius: "18px",
            bgcolor: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "#FFFFFF",
            border: `1.5px solid ${themeConfig.border}`,
            boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, flexWrap: "wrap", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(16, 185, 129, 0.12)", color: "#10B981", flexShrink: 0 }}>
                <AccountBalance sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                In Admin Vault
              </Typography>
            </Box>
            <Chip
              label="Settled"
              size="small"
              sx={{
                fontWeight: 800,
                fontSize: "0.68rem",
                height: 20,
                bgcolor: "rgba(16, 185, 129, 0.12)",
                color: "#059669",
              }}
            />
          </Box>
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#10B981", letterSpacing: -0.5, my: 0.5, fontSize: { xs: "1.35rem", sm: "1.6rem", xl: "1.8rem" }, wordBreak: "break-word" }}>
            ₹{formatRupee(telemetry.totalVaultSettled)}
          </Typography>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", lineHeight: 1.3 }}>
            Historical verified vault deposits
          </Typography>
        </Paper>
      </Box>

      {/* TODAY'S GUEST PAYMENTS LIST */}
      <TableCard>
        <TableToolbar component="form" onSubmit={handleSearchSubmit}>
          <TextField
            size="small"
            placeholder="Search receipt #, guest, room #..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={tableSearchSx(themeConfig)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: themeConfig.textMuted }} />
                  </InputAdornment>
                ),
              },
            }}
          />
          <TextField
            select
            size="small"
            value={methodFilter}
            onChange={(e) => handleMethodChange(e.target.value)}
            sx={tableFieldSx(themeConfig, 170)}
          >
            <MenuItem value="ALL">All modes</MenuItem>
            <MenuItem value="CASH">Cash</MenuItem>
            <MenuItem value="UPI">UPI QR</MenuItem>
            <MenuItem value="CARD">Card POS</MenuItem>
            <MenuItem value="BANK_TRANSFER">Bank NEFT</MenuItem>
          </TextField>
          <TextField
            select
            size="small"
            value={settlementFilter}
            onChange={(e) => setSettlementFilter(e.target.value)}
            sx={tableFieldSx(themeConfig, 220)}
          >
            <MenuItem value="ALL">All settlements</MenuItem>
            <MenuItem value="UNSETTLED">At counter (unsettled)</MenuItem>
            <MenuItem value="SETTLED">In vault (settled)</MenuItem>
          </TextField>
        </TableToolbar>
        {loading ? (
          <Box sx={{ py: 6, display: "flex", justifyContent: "center" }}>
            <CircularProgress sx={{ color: themeConfig.primary }} />
          </Box>
        ) : guestList.length === 0 ? (
          <Box sx={{ py: 6 }}>
            <EmptyState
              title={searchQuery || methodFilter !== "ALL" ? "No Matching Receipts Found" : "No Payments Today"}
              description={searchQuery || methodFilter !== "ALL" ? "Try clearing search filters or selecting another payment mode." : "No guest payments have been recorded yet today. Check-ins or checkout settlements will appear here."}
            />
          </Box>
        ) : (
          <>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="medium" sx={{ width: "100%", minWidth: 900 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Time &amp; Receipt #</TableCell>
                    <TableCell>Guest &amp; Room</TableCell>
                    <TableCell>Payment Method</TableCell>
                    <TableCell>Stage / Reason</TableCell>
                    <TableCell>Amount (₹)</TableCell>
                    <TableCell>Collector</TableCell>
                    <TableCell align="right">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {guestList.map((g) => {
                    const methodBadge = getMethodBadge(g.paymentMethod);
                    const isSettled = g.drawerSettlementStatus === "SETTLED_TO_ADMIN";

                    return (
                      <TableRow key={g._id} hover>
                        {/* Column 1: Receipt Number & Time */}
                        <TableCell sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primary, fontSize: "0.85rem" }}>
                            #{g.receiptNumber}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", display: "block" }}>
                            ⏰ {g.timeStr}
                          </Typography>
                        </TableCell>

                        {/* Column 2: Guest & Room Allocation */}
                        <TableCell sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <Box
                              sx={{
                                px: 0.8,
                                py: 0.3,
                                borderRadius: "8px",
                                bgcolor: themeConfig.champagne,
                                color: themeConfig.accent,
                                fontWeight: 800,
                                fontSize: "0.75rem",
                                border: `1px solid ${themeConfig.border}`,
                                display: "flex",
                                alignItems: "center",
                                gap: 0.4,
                              }}
                            >
                              <MeetingRoom sx={{ fontSize: 14, color: themeConfig.primary }} />
                              Rm {g.roomNumber}
                            </Box>
                            <Box sx={{ minWidth: 0, flex: 1, overflow: "hidden" }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 800,
                                  color: themeConfig.textMain,
                                  fontSize: "0.85rem",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {g.guestName}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: themeConfig.textMuted,
                                  fontSize: "0.72rem",
                                  display: "block",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                📞 {g.guestPhone} &bull; Folio #{g.bookingNumber}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Column 3: Payment Method */}
                        <TableCell sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                          <Chip
                            icon={methodBadge.icon}
                            label={methodBadge.label}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              height: 22,
                              bgcolor: methodBadge.bg,
                              color: methodBadge.color,
                              border: `1px solid ${methodBadge.border}`,
                              borderRadius: "7px",
                            }}
                          />
                          {g.transactionId && g.transactionId !== "N/A" && (
                            <Typography variant="caption" sx={{ display: "block", color: themeConfig.textMuted, fontSize: "0.7rem", mt: 0.2 }}>
                              Ref: {g.transactionId}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Column 4: Reason / Stage */}
                        <TableCell sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.82rem" }}>
                            {g.paymentType}
                          </Typography>
                          {g.note && (
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", display: "block", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {g.note}
                            </Typography>
                          )}
                        </TableCell>

                        {/* Column 5: Amount */}
                        <TableCell sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: "#059669", fontSize: "0.92rem" }}>
                            ₹{formatRupee(g.amount)}
                          </Typography>
                        </TableCell>

                        {/* Column 6: Collector Staff */}
                        <TableCell sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.82rem" }}>
                            {g.collectedByName || "Front Desk Staff"}
                          </Typography>
                        </TableCell>

                        {/* Column 7: Status */}
                        <TableCell align="right" sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                          <Chip
                            label={isSettled ? "Deposited" : "In Drawer"}
                            title={isSettled ? "Deposited in Vault" : "In Counter Drawer"}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.7rem",
                              height: 22,
                              bgcolor: isSettled ? themeConfig.tones.success.bg : themeConfig.tones.warning.bg,
                              color: isSettled ? themeConfig.tones.success.color : themeConfig.tones.warning.color,
                              borderRadius: "6px",
                              border: `1px solid ${isSettled ? themeConfig.tones.success.border : themeConfig.tones.warning.border}`,
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePager
              rowsPerPageOptions={[5, 10, 20, 50]}
              count={pagination.totalRecords || 0}
              rowsPerPage={rowsPerPage}
              page={Math.max(0, page - 1)}
              onPageChange={(e, newPage) => {
                const targetPage = newPage + 1;
                setPage(targetPage);
                fetchDailyData(targetPage, rowsPerPage, searchQuery, methodFilter);
              }}
              onRowsPerPageChange={(e) => {
                const newLimit = parseInt(e.target.value, 10);
                setRowsPerPage(newLimit);
                setPage(1);
                fetchDailyData(1, newLimit, searchQuery, methodFilter);
              }}
            />
          </>
        )}
      </TableCard>

      {/* HANDOVER HISTORY AUDIT LOG */}
      {handoverHistory.length > 0 && (
        <TableCard>
          <TableToolbar title="Recent cash drawer handover audit log" />

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="medium" sx={{ width: "100%", minWidth: 800 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Handover Code &amp; Date</TableCell>
                  <TableCell>Cash Collected</TableCell>
                  <TableCell>Digital Payments</TableCell>
                  <TableCell>Total Settled</TableCell>
                  <TableCell>Settled By</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {handoverHistory.map((h) => (
                  <TableRow
                    key={h._id}
                    hover
                    sx={{
                      transition: "all 0.15s ease",
                      "&:hover": { bgcolor: `${themeConfig.primaryGlow} !important` },
                    }}
                  >
                    <TableCell sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primary, fontSize: "0.85rem" }}>
                        #{h.handoverCode}
                      </Typography>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem" }}>
                        📅 {new Date(h.createdAt).toLocaleString("en-IN")}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ py: 1.1, fontWeight: 800, color: "#10B981", whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                      ₹{(h.cashAmount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ py: 1.1, color: themeConfig.textMuted, whiteSpace: "nowrap", fontSize: "0.8rem" }}>
                      UPI: ₹{(h.upiAmount || 0).toLocaleString()} &bull; Card: ₹{(h.cardAmount || 0).toLocaleString()}
                    </TableCell>
                    <TableCell sx={{ py: 1.1, fontWeight: 900, color: themeConfig.textMain, whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                      ₹{(h.totalSettledAmount || 0).toLocaleString()} ({h.paymentsCount} receipts)
                    </TableCell>
                    <TableCell sx={{ py: 1.1, color: themeConfig.textMain, fontWeight: 700, whiteSpace: "nowrap", fontSize: "0.82rem" }}>
                      {h.settledByAdmin?.name || "Hotel Admin"}
                    </TableCell>
                    <TableCell align="right" sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<Print sx={{ fontSize: 14 }} />}
                        onClick={() => setVoucherModal({ open: true, record: h })}
                        sx={{
                          borderRadius: "8px",
                          borderColor: themeConfig.border,
                          color: themeConfig.textMain,
                          fontWeight: 700,
                          fontSize: "0.75rem",
                          py: 0.3,
                          px: 1.2,
                          textTransform: "none",
                        }}
                      >
                        Voucher
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <TablePager
            rowsPerPageOptions={[5, 10, 20]}
            count={handoverPagination.totalRecords || 0}
            rowsPerPage={handoverRowsPerPage}
            page={Math.max(0, handoverPage - 1)}
            onPageChange={(e, newPage) => {
              const targetPage = newPage + 1;
              setHandoverPage(targetPage);
              fetchDailyData(page, rowsPerPage, searchQuery, methodFilter, targetPage, handoverRowsPerPage);
            }}
            onRowsPerPageChange={(e) => {
              const newLimit = parseInt(e.target.value, 10);
              setHandoverRowsPerPage(newLimit);
              setHandoverPage(1);
              fetchDailyData(page, rowsPerPage, searchQuery, methodFilter, 1, newLimit);
            }}
          />
        </TableCard>
      )}

      {/* MODAL 1: Confirm Cash Drawer Handover */}
      <Dialog
        open={handoverModalOpen}
        onClose={() => !settling && setHandoverModalOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: "16px", maxWidth: 480, border: `1px solid ${themeConfig.border}`, overflow: "hidden" } } }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 900, color: themeConfig.textMain, pb: 1 }}>
          🤝 Confirm Cash Drawer Settlement into Vault
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            <Alert severity="info" sx={{ borderRadius: "10px" }}>
              This will collect <strong>₹{formatRupee(telemetry.cashInDrawer)}</strong> from the front desk counter cash drawer and reset the counter balance to <strong>₹0</strong>.
            </Alert>

            <Box sx={{ p: 2, bgcolor: themeConfig.champagne, borderRadius: "12px" }}>
              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase" }}>Settlement Breakdown:</Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1, fontSize: "0.9rem" }}>
                <span>Physical Cash Collected:</span>
                <strong style={{ color: "#059669" }}>₹{formatRupee(telemetry.cashInDrawer)}</strong>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5, fontSize: "0.9rem" }}>
                <span>Total Shift Handover Value:</span>
                <strong>₹{formatRupee(telemetry.unsettledTotal)}</strong>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5, fontSize: "0.9rem", color: "#059669" }}>
                <span>New Counter Cash Balance:</span>
                <strong>₹0 (Balanced)</strong>
              </Box>
            </Box>

            <TextField
              size="small"
              label="Admin Handover Remarks (Optional)"
              placeholder="e.g. Verified by Hotel Owner & Deposited to Vault"
              value={handoverNotes}
              onChange={(e) => setHandoverNotes(e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1, flexDirection: { xs: "column-reverse", sm: "row" } }}>
          <Button onClick={() => setHandoverModalOpen(false)} disabled={settling} sx={{ width: { xs: "100%", sm: "auto" }, borderRadius: "10px" }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleSettleDrawer}
            disabled={settling}
            className="btn-3d"
            sx={{
              width: { xs: "100%", sm: "auto" },
              background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
              borderRadius: "10px",
              fontWeight: 800,
            }}
          >
            {settling ? <CircularProgress size={20} sx={{ color: themeConfig.onPrimary }} /> : "Confirm Settlement (Reset to 0)"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 2: Printable Handover Voucher */}
      <Dialog
        open={voucherModal.open}
        onClose={() => setVoucherModal({ open: false, record: null })}
        slotProps={{ paper: { sx: { borderRadius: "16px", maxWidth: 540, border: `1px solid ${themeConfig.border}`, overflow: "hidden" } } }}
      >
        {voucherModal.record && (
          <Box sx={{ p: 1 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", pb: 2, borderBottom: `2px solid ${themeConfig.primary}` }}>
              <div>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                  {user?.hotel?.name || "Hotel Management System"}
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                  Daily Cash Drawer Handover Certificate
                </Typography>
              </div>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                  #{voucherModal.record.handoverCode}
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                  {new Date(voucherModal.record.createdAt).toLocaleDateString("en-IN")}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ my: 2.5, p: 2, bgcolor: themeConfig.champagne, borderRadius: "12px", display: "flex", justifyContent: "space-between" }}>
              <div>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Settled By Admin:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800 }}>{voucherModal.record.settledByAdmin?.name || "Admin"}</Typography>
              </div>
              <div style={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Counter Balance Post-Handover:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: "#059669" }}>₹0 (Balanced)</Typography>
              </div>
            </Box>

            <TableContainer sx={{ mb: 2, borderRadius: "10px", border: `1px solid ${themeConfig.border}` }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Physical Cash Collected</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: "#059669" }}>₹{(voucherModal.record.cashAmount || 0).toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>UPI Digital Receipts</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>₹{(voucherModal.record.upiAmount || 0).toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Card POS Receipts</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>₹{(voucherModal.record.cardAmount || 0).toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                    <TableCell sx={{ fontWeight: 900 }}>Total Handover Volume</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, color: themeConfig.primary }}>₹{(voucherModal.record.totalSettledAmount || 0).toLocaleString()}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            <DialogActions sx={{ p: 0, pt: 2.5, display: "flex", justifyContent: "space-between", alignItems: "stretch", flexDirection: { xs: "column-reverse", sm: "row" }, borderTop: `1px solid ${themeConfig.border}`, mt: 2, gap: 1.5 }}>
              <Button
                onClick={() => setVoucherModal({ open: false, record: null })}
                sx={{
                  width: { xs: "100%", sm: "auto" },
                  borderRadius: "10px",
                  fontWeight: 700,
                  color: themeConfig.textMuted,
                  px: 2,
                  justifyContent: "center",
                  "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                }}
              >
                Close
              </Button>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexDirection: { xs: "column", sm: "row" }, width: { xs: "100%", sm: "auto" } }}>
                <Button
                  variant="contained"
                  startIcon={<Print sx={{ fontSize: 18 }} />}
                  onClick={() => {
                    window.print();
                  }}
                  className="btn-3d"
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                    borderRadius: "10px",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    whiteSpace: "nowrap",
                    px: 1.8,
                    justifyContent: "center",
                    boxShadow: `0 4px 12px ${themeConfig.primaryGlow}`,
                  }}
                >
                  Print Slip
                </Button>
              </Box>
            </DialogActions>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
