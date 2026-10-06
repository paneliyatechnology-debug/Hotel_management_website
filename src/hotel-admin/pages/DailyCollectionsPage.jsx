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
  Refresh,
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
import EmptyState from "@/shared/components/EmptyState";
import { downloadDailyLedgerPDF, downloadHandoverVoucherPDF } from "@/shared/utils/pdfGenerator";
import { toast } from "@/shared/utils/toast";

export default function DailyCollectionsPage({ user, hotelSettings, onRefreshOverview }) {
  const { themeConfig, isDarkMode } = useAppTheme();

  const [loading, setLoading] = useState(true);
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
      try {
        const params = new URLSearchParams();
        params.append("page", String(p));
        params.append("limit", String(l));
        if (q && q.trim()) params.append("search", q.trim());
        if (m && m !== "ALL") params.append("paymentMethod", m);
        params.append("handoverPage", String(hp));
        params.append("handoverLimit", String(hl));

        const isReceptionist = user?.role === "RECEPTIONIST";
        const baseEndpoint = isReceptionist
          ? API_ENDPOINTS.RECEPTIONIST.DAILY_COLLECTIONS
          : API_ENDPOINTS.HOTEL_ADMIN.DAILY_COLLECTIONS;
        const endpoint = `${baseEndpoint}?${params.toString()}`;
        const res = await apiRequest(endpoint);
        if (res?.success) {
          setData(res.data);
        }
      } catch (err) {
        console.error("Failed to load daily collections:", err);
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
      console.log(`⚡ [DailyCollectionsPage] Real-time sync triggered by ${eventName}`);
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
        return { label: "UPI QR", icon: <QrCode2 sx={{ fontSize: 16 }} />, bg: "#F5F3FF", color: "#7C3AED", border: "#DDD6FE" };
      case "CASH":
        return { label: "Cash", icon: <Payments sx={{ fontSize: 16 }} />, bg: "#ECFDF5", color: "#059669", border: "#A7F3D0" };
      case "CARD":
        return { label: "Card POS", icon: <CreditCard sx={{ fontSize: 16 }} />, bg: "#EFF6FF", color: "#2563EB", border: "#BFDBFE" };
      case "BANK_TRANSFER":
        return { label: "Bank NEFT", icon: <AccountBalance sx={{ fontSize: 16 }} />, bg: "#FFFBEB", color: "#D97706", border: "#FDE68A" };
      default:
        return { label: "Online", icon: <AccountBalanceWallet sx={{ fontSize: 16 }} />, bg: "#F3F4F6", color: "#4B5563", border: "#E5E7EB" };
    }
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3, md: 3.5 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 }, display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 2 }}>
        <div>
          <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5, fontSize: { xs: "1.3rem", sm: "1.6rem" } }}>
            Daily Collections &amp; Cash Drawer
          </Typography>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontSize: { xs: "0.78rem", sm: "0.85rem" } }}>
            Real-time collection ledger &amp; shift handover reconciliation
          </Typography>
        </div>

        <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", alignItems: "center", width: { xs: "100%", sm: "auto" }, flexDirection: { xs: "column", sm: "row" } }}>
          <Box sx={{ display: "flex", gap: 1, width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={fetchDailyData}
              sx={{
                flex: 1,
                width: { xs: "50%", sm: "auto" },
                borderRadius: "12px",
                borderColor: themeConfig.border,
                bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF",
                color: themeConfig.textMain,
                fontWeight: 700,
                fontSize: { xs: "0.75rem", sm: "0.82rem" },
                textTransform: "none",
                whiteSpace: "nowrap",
                justifyContent: "center",
              }}
            >
              Refresh
            </Button>

            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={() => {
                downloadDailyLedgerPDF(data?.payments || [], telemetry, hotelSettings || user?.hotel || {});
                showToast("Treasury Statement PDF generated successfully!", "success");
              }}
              sx={{
                flex: 1,
                width: { xs: "50%", sm: "auto" },
                borderRadius: "12px",
                borderColor: themeConfig.border,
                bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF",
                color: themeConfig.textMain,
                fontWeight: 700,
                fontSize: { xs: "0.75rem", sm: "0.82rem" },
                textTransform: "none",
                whiteSpace: "nowrap",
                justifyContent: "center",
              }}
            >
              Export PDF
            </Button>
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
            md: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {/* CARD 1: Cash in Counter Drawer */}
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
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
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: telemetry.cashInDrawer > 0 ? "rgba(245, 158, 11, 0.15)" : "rgba(16, 185, 129, 0.15)", color: telemetry.cashInDrawer > 0 ? "#F59E0B" : "#10B981" }}>
                {telemetry.cashInDrawer > 0 ? <LockOpen sx={{ fontSize: 18 }} /> : <Lock sx={{ fontSize: 18 }} />}
              </Avatar>
              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", fontSize: "0.72rem" }}>
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
          <Typography variant="h4" sx={{ fontWeight: 900, color: telemetry.cashInDrawer > 0 ? (isDarkMode ? "#FBBF24" : "#D97706") : themeConfig.textMain, letterSpacing: -0.5, my: 0.5, fontSize: { xs: "1.4rem", sm: "1.8rem" } }}>
            ₹{formatRupee(telemetry.cashInDrawer)}
          </Typography>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem" }}>
            Unsettled cash awaiting admin vault handover
          </Typography>
        </Paper>

        {/* CARD 2: Total Today Gross Collections */}
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: "18px",
            bgcolor: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "#FFFFFF",
            border: `1.5px solid ${themeConfig.border}`,
            boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(59, 130, 246, 0.12)", color: "#3B82F6" }}>
                <TrendingUp sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", fontSize: "0.72rem" }}>
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
          <Typography variant="h4" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5, my: 0.5, fontSize: { xs: "1.4rem", sm: "1.8rem" } }}>
            ₹{formatRupee(telemetry.todayGross)}
          </Typography>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem" }}>
            Cash (₹{formatRupee(telemetry.todayCash)}) + Digital (₹{formatRupee((Number(telemetry.todayUpi) || 0) + (Number(telemetry.todayCard) || 0) + (Number(telemetry.todayBank) || 0))})
          </Typography>
        </Paper>

        {/* CARD 3: Digital Collections (UPI, Card, Bank) */}
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: "18px",
            bgcolor: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "#FFFFFF",
            border: `1.5px solid ${themeConfig.border}`,
            boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(139, 92, 246, 0.12)", color: "#8B5CF6" }}>
                <QrCode2 sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", fontSize: "0.72rem" }}>
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
          <Typography variant="h4" sx={{ fontWeight: 900, color: isDarkMode ? "#A78BFA" : "#7C3AED", letterSpacing: -0.5, my: 0.5, fontSize: { xs: "1.4rem", sm: "1.8rem" } }}>
            ₹{formatRupee((Number(telemetry.todayUpi) || 0) + (Number(telemetry.todayCard) || 0) + (Number(telemetry.todayBank) || 0))}
          </Typography>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem" }}>
            UPI: ₹{formatRupee(telemetry.todayUpi)} • Card: ₹{formatRupee(telemetry.todayCard)}
          </Typography>
        </Paper>

        {/* CARD 4: Total Deposited in Vault */}
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: "18px",
            bgcolor: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "#FFFFFF",
            border: `1.5px solid ${themeConfig.border}`,
            boxShadow: "0 4px 14px rgba(0,0,0,0.03)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: "rgba(16, 185, 129, 0.12)", color: "#10B981" }}>
                <AccountBalance sx={{ fontSize: 18 }} />
              </Avatar>
              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", fontSize: "0.72rem" }}>
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
          <Typography variant="h4" sx={{ fontWeight: 900, color: "#10B981", letterSpacing: -0.5, my: 0.5, fontSize: { xs: "1.4rem", sm: "1.8rem" } }}>
            ₹{formatRupee(telemetry.totalVaultSettled)}
          </Typography>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem" }}>
            Historical verified vault deposits
          </Typography>
        </Paper>
      </Box>

      {/* TODAY'S GUEST PAYMENTS LIST */}
      <Card
        className="card-3d"
        sx={{
          borderRadius: "20px",
          bgcolor: themeConfig.bgCard,
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "0 10px 30px rgba(0,0,0,0.4)" : "0 10px 30px rgba(12, 39, 59, 0.06), inset 0 1px 1px #FFFFFF",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            p: { xs: 2, sm: 2.2 },
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "stretch", md: "center" },
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            borderBottom: `1px solid ${themeConfig.border}`,
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #FAFBFD 100%)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: { sm: 260 } }}>
            <Avatar
              sx={{
                bgcolor: themeConfig.champagne,
                color: themeConfig.primaryDark,
                width: 38,
                height: 38,
                borderRadius: "10px",
                border: `1px solid ${themeConfig.border}`,
                boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
              }}
            >
              <Payments sx={{ fontSize: 20 }} />
            </Avatar>
            <div>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: { xs: "1.05rem", sm: "1.15rem" }, lineHeight: 1.2 }}>
                  Today&apos;s Guest Collections
                </Typography>
                <Chip
                  label={`${pagination.totalRecords || guestList.length} Receipts`}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.7rem",
                    height: 20,
                    bgcolor: themeConfig.champagne,
                    color: themeConfig.primaryDark,
                    border: `1px solid ${themeConfig.border}`,
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", mt: 0.2, fontSize: "0.76rem" }}>
                Real-time guest-by-guest payment ledger with backend search &amp; pagination
              </Typography>
            </div>
          </Box>

          {/* Search & Payment Mode Filter Toolbar */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.2,
              flexWrap: "wrap",
              flexDirection: { xs: "column", sm: "row" },
              width: { xs: "100%", md: "auto" },
              justifyContent: { xs: "stretch", sm: "flex-end" },
            }}
          >
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", width: "100%", flexGrow: 1 }}>
              <TextField
                size="small"
                placeholder="Search receipt #, guest, room #..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{
                  width: "100%",
                  minWidth: { xs: "100%", sm: 220, md: 260 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF",
                    boxShadow: "inset 0 1px 2px rgba(0,0,0,0.03)",
                  },
                }}
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
            </form>

            <Box sx={{ display: "flex", gap: 1, width: { xs: "100%", sm: "auto" } }}>
              <TextField
                select
                size="small"
                value={methodFilter}
                onChange={(e) => handleMethodChange(e.target.value)}
                sx={{
                  flex: 1,
                  width: { xs: "50%", sm: 130 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                  },
                }}
              >
                <MenuItem value="ALL">All Modes</MenuItem>
                <MenuItem value="CASH">💵 Cash</MenuItem>
                <MenuItem value="UPI">📱 UPI QR</MenuItem>
                <MenuItem value="CARD">💳 Card POS</MenuItem>
                <MenuItem value="BANK_TRANSFER">🏦 Bank NEFT</MenuItem>
              </TextField>

              <TextField
                select
                size="small"
                value={settlementFilter}
                onChange={(e) => setSettlementFilter(e.target.value)}
                sx={{
                  flex: 1,
                  width: { xs: "50%", sm: 160 },
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                  },
                }}
              >
                <MenuItem value="ALL">All Settlements</MenuItem>
                <MenuItem value="UNSETTLED">🟡 At Counter (Unsettled)</MenuItem>
                <MenuItem value="SETTLED">🟢 In Vault (Settled)</MenuItem>
              </TextField>
            </Box>
          </Box>
        </Box>

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
            <TableContainer
              sx={{
                overflowX: "auto",
                "&::-webkit-scrollbar": { height: "7px", width: "7px" },
                "&::-webkit-scrollbar-track": { background: "rgba(0,0,0,0.02)" },
                "&::-webkit-scrollbar-thumb": { background: themeConfig.border, borderRadius: "6px" },
              }}
            >
              <Table size="small" stickyHeader sx={{ minWidth: 960 }}>
                <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, py: 1.2, whiteSpace: "nowrap" }}>Time &amp; Receipt #</TableCell>
                    <TableCell sx={{ fontWeight: 800, py: 1.2, whiteSpace: "nowrap" }}>Guest &amp; Room</TableCell>
                    <TableCell sx={{ fontWeight: 800, py: 1.2, whiteSpace: "nowrap" }}>Payment Method</TableCell>
                    <TableCell sx={{ fontWeight: 800, py: 1.2, whiteSpace: "nowrap" }}>Stage / Reason</TableCell>
                    <TableCell sx={{ fontWeight: 800, py: 1.2, whiteSpace: "nowrap" }}>Amount (₹)</TableCell>
                    <TableCell sx={{ fontWeight: 800, py: 1.2, whiteSpace: "nowrap" }}>Collector</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, py: 1.2, whiteSpace: "nowrap" }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {guestList.map((g) => {
                    const methodBadge = getMethodBadge(g.paymentMethod);
                    const isSettled = g.drawerSettlementStatus === "SETTLED_TO_ADMIN";

                    return (
                      <TableRow
                        key={g._id}
                        hover
                        sx={{
                          transition: "all 0.15s ease",
                          "&:hover": { bgcolor: "rgba(11, 142, 224, 0.04)" },
                        }}
                      >
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
                                color: themeConfig.primaryDark,
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
                            <Box sx={{ maxWidth: 220, overflow: "hidden" }}>
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
                            label={isSettled ? "Deposited in Vault" : "In Counter Drawer"}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.7rem",
                              height: 22,
                              bgcolor: isSettled ? "#ECFDF5" : "#FEF3C7",
                              color: isSettled ? "#059669" : "#D97706",
                              borderRadius: "6px",
                              border: isSettled ? "1px solid rgba(5, 150, 105, 0.2)" : "1px solid rgba(217, 119, 6, 0.2)",
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Backend Table Pagination Bar */}
            <TablePagination
              rowsPerPageOptions={[5, 10, 20, 50]}
              component="div"
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
              sx={{
                borderTop: `1px solid ${themeConfig.border}`,
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
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
        )}
      </Card>

      {/* HANDOVER HISTORY AUDIT LOG */}
      {handoverHistory.length > 0 && (
        <Card
          className="card-3d"
          sx={{
            borderRadius: "20px",
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            border: `1px solid ${themeConfig.border}`,
            boxShadow: isDarkMode ? "0 6px 20px rgba(0,0,0,0.3)" : "0 6px 20px rgba(12, 39, 59, 0.05), inset 0 1px 1px #FFFFFF",
            overflow: "hidden",
          }}
        >
          <Box sx={{ p: 2.5, borderBottom: `1px solid ${themeConfig.border}` }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
              Recent Cash Drawer Handover Audit Log
            </Typography>
          </Box>

          <TableContainer
            sx={{
              overflowX: "auto",
              "&::-webkit-scrollbar": { height: "7px", width: "7px" },
              "&::-webkit-scrollbar-track": { background: "rgba(0,0,0,0.02)" },
              "&::-webkit-scrollbar-thumb": { background: themeConfig.border, borderRadius: "6px" },
            }}
          >
            <Table size="small" stickyHeader sx={{ minWidth: 800 }}>
              <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, py: 1.2, whiteSpace: "nowrap" }}>Handover Code &amp; Date</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.2, whiteSpace: "nowrap" }}>Cash Collected</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.2, whiteSpace: "nowrap" }}>Digital Payments</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.2, whiteSpace: "nowrap" }}>Total Settled</TableCell>
                  <TableCell sx={{ fontWeight: 800, py: 1.2, whiteSpace: "nowrap" }}>Settled By</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, py: 1.2, whiteSpace: "nowrap" }}>Action</TableCell>
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

          {/* Handover Table Pagination Bar */}
          <TablePagination
            rowsPerPageOptions={[5, 10, 20]}
            component="div"
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
            sx={{
              borderTop: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
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
        </Card>
      )}

      {/* MODAL 1: Confirm Cash Drawer Handover */}
      <Dialog
        open={handoverModalOpen}
        onClose={() => !settling && setHandoverModalOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: "20px", p: 2, maxWidth: 480, border: `1px solid ${themeConfig.border}` } } }}
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
            {settling ? <CircularProgress size={20} sx={{ color: "#FFFFFF" }} /> : "Confirm Settlement (Reset to 0)"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 2: Printable Handover Voucher */}
      <Dialog
        open={voucherModal.open}
        onClose={() => setVoucherModal({ open: false, record: null })}
        slotProps={{ paper: { sx: { borderRadius: "20px", p: 3, maxWidth: 540, border: `1px solid ${themeConfig.border}` } } }}
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
                  variant="outlined"
                  startIcon={<Download sx={{ fontSize: 18 }} />}
                  onClick={() => {
                    downloadHandoverVoucherPDF(voucherModal.record, hotelSettings || user?.hotel || {});
                    showToast("Handover slip PDF downloaded!", "success");
                  }}
                  sx={{
                    width: { xs: "100%", sm: "auto" },
                    borderRadius: "10px",
                    borderColor: themeConfig.border,
                    color: themeConfig.textMain,
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    whiteSpace: "nowrap",
                    px: 1.8,
                    justifyContent: "center",
                    "&:hover": { borderColor: themeConfig.primary, bgcolor: themeConfig.champagne },
                  }}
                >
                  Download PDF
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Print sx={{ fontSize: 18 }} />}
                  onClick={() => {
                    downloadHandoverVoucherPDF(voucherModal.record, hotelSettings || user?.hotel || {});
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
                  Print / Save
                </Button>
              </Box>
            </DialogActions>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
