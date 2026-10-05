"use client";

import { useState, useEffect, useMemo } from "react";
import { useSocket } from "@/shared/context/SocketContext";
import {
  Box,
  Typography,
  Card,
  Paper,
  Button,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Tooltip,
  TablePagination,
} from "@mui/material";
import {
  Search,
  Receipt,
  AccountBalanceWallet,
  QrCode2,
  CreditCard,
  AccountBalance,
  Payments,
  Print,
  Download,
  Refresh,
  Add,
  Schedule,
  TrendingUp,
  MeetingRoom,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { apiRequest, API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/shared/components/EmptyState";
import { downloadPaymentReceiptPDF, downloadDailyLedgerPDF } from "@/shared/utils/pdfGenerator";

export default function PaymentLedgerView({
  user,
  hotelSettings,
  bookings = [],
  apiEndpoint,
  recordPaymentEndpoint,
  onPaymentSuccess,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState([]);
  const [summary, setSummary] = useState({
    totalGrossCollected: 0,
    todayCollected: 0,
    cashTotal: 0,
    upiTotal: 0,
    cardTotal: 0,
    bankTotal: 0,
    onlineTotal: 0,
    todayCash: 0,
    todayUpi: 0,
    todayCard: 0,
    todayBank: 0,
    advanceTotal: 0,
    settlementTotal: 0,
    extraChargeTotal: 0,
    totalPendingDues: 0,
    totalTransactions: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedMethod, setSelectedMethod] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [timeRange, setTimeRange] = useState("all");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Collect Payment Modal
  const [collectModalOpen, setCollectModalOpen] = useState(false);
  const [collectData, setCollectData] = useState({
    bookingId: "",
    amount: "",
    paymentMethod: "UPI",
    paymentType: "PARTIAL",
    transactionId: "",
    paymentReference: "",
    note: "",
  });
  const [collectLoading, setCollectLoading] = useState(false);
  const [collectError, setCollectError] = useState("");

  // Receipt Modal
  const [receiptModal, setReceiptModal] = useState({
    open: false,
    payment: null,
  });

  // Toast
  const [toast, setToast] = useState({ show: false, message: "", severity: "success" });

  const activeUpiId = hotelSettings?.upiId || "jatinkakadiya234-1@okicici";
  const hotelName = user?.hotel?.name || "MYOWNPMS";

  const fetchPayments = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const endpoint = apiEndpoint || API_ENDPOINTS.RECEPTIONIST.PAYMENTS;
      const params = new URLSearchParams();
      if (selectedMethod && selectedMethod !== "ALL") params.append("paymentMethod", selectedMethod);
      if (selectedType && selectedType !== "ALL") params.append("paymentType", selectedType);
      if (timeRange && timeRange !== "all") params.append("timeRange", timeRange);
      if (searchQuery.trim()) params.append("search", searchQuery.trim());

      const url = `${endpoint}${params.toString() ? `?${params.toString()}` : ""}`;
      const res = await apiRequest(url);

      if (res?.success) {
        setPayments(res.data || []);
        if (res.summary) setSummary(res.summary);
      }
    } catch (err) {
      console.error("Failed to load payments ledger:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [selectedMethod, selectedType, timeRange]);

  // Real-Time Socket Auto-Sync on new transactions
  useSocket(
    ["PAYMENT_RECORDED", "BOOKING_CREATED", "GUEST_CHECKED_OUT", "HANDOVER_SETTLED", "DASHBOARD_SYNC"],
    () => {
      fetchPayments(true);
    }
  );

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchPayments();
  };

  const showToast = (message, severity = "success") => {
    setToast({ show: true, message, severity });
    setTimeout(() => setToast({ show: false, message: "", severity: "success" }), 4000);
  };

  const handleOpenCollectModal = (defaultBooking = null) => {
    setCollectError("");
    const checkedInList = bookings.filter((b) => b.status === "CHECKED_IN" || b.status === "CONFIRMED");
    const targetBooking = defaultBooking || checkedInList[0] || null;

    setCollectData({
      bookingId: targetBooking?._id || "",
      amount: targetBooking?.dueAmount ? String(targetBooking.dueAmount) : "",
      paymentMethod: "UPI",
      paymentType: targetBooking?.dueAmount ? "FULL_SETTLEMENT" : "PARTIAL",
      transactionId: "",
      paymentReference: "",
      note: "",
    });
    setCollectModalOpen(true);
  };

  const handleRecordPayment = async () => {
    if (!collectData.bookingId) {
      setCollectError("Please select a guest booking / folio.");
      return;
    }
    if (!collectData.amount || Number(collectData.amount) <= 0) {
      setCollectError("Please enter a valid payment amount (₹).");
      return;
    }

    setCollectLoading(true);
    setCollectError("");
    try {
      const endpoint = recordPaymentEndpoint || "/api/v1/receptionist/payments";
      const res = await apiRequest(endpoint, {
        method: "POST",
        body: {
          bookingId: collectData.bookingId,
          amount: Number(collectData.amount),
          paymentMethod: collectData.paymentMethod,
          paymentType: collectData.paymentType,
          transactionId: collectData.transactionId,
          paymentReference: collectData.paymentReference,
          note: collectData.note,
        },
      });

      showToast(res.message || "Payment recorded successfully!");
      setCollectModalOpen(false);
      await fetchPayments();
      if (onPaymentSuccess) onPaymentSuccess();
    } catch (err) {
      setCollectError(err.message || "Failed to record payment");
    } finally {
      setCollectLoading(false);
    }
  };

  const checkedInBookings = useMemo(() => {
    return bookings.filter((b) => b.status === "CHECKED_IN" || b.status === "CONFIRMED");
  }, [bookings]);

  const selectedBookingDetails = useMemo(() => {
    return checkedInBookings.find((b) => b._id === collectData.bookingId) || null;
  }, [checkedInBookings, collectData.bookingId]);

  // Dynamic UPI URL for direct collection
  const dynamicUpiUrl = useMemo(() => {
    const amt = Number(collectData.amount) || 0;
    const note = encodeURIComponent(`Hotel Bill - ${selectedBookingDetails?.roomNumber || "Folio"}`);
    const name = encodeURIComponent(hotelName);
    return `upi://pay?pa=${activeUpiId}&pn=${name}&am=${amt}&cu=INR&tn=${note}`;
  }, [activeUpiId, hotelName, collectData.amount, selectedBookingDetails]);

  const dynamicQrCodeUrl = useMemo(() => {
    return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(dynamicUpiUrl)}`;
  }, [dynamicUpiUrl]);

  // Method Icon & Color
  const getMethodBadge = (method) => {
    const m = (method || "").toUpperCase();
    switch (m) {
      case "UPI":
        return {
          label: "UPI QR",
          icon: <QrCode2 sx={{ fontSize: 16 }} />,
          bg: "#F5F3FF",
          color: "#7C3AED",
          border: "#DDD6FE",
        };
      case "CASH":
        return {
          label: "Cash Counter",
          icon: <Payments sx={{ fontSize: 16 }} />,
          bg: "#ECFDF5",
          color: "#059669",
          border: "#A7F3D0",
        };
      case "CARD":
        return {
          label: "Card POS",
          icon: <CreditCard sx={{ fontSize: 16 }} />,
          bg: "#EFF6FF",
          color: "#2563EB",
          border: "#BFDBFE",
        };
      case "BANK_TRANSFER":
        return {
          label: "Bank / NEFT",
          icon: <AccountBalance sx={{ fontSize: 16 }} />,
          bg: "#FFFBEB",
          color: "#D97706",
          border: "#FDE68A",
        };
      default:
        return {
          label: "Online",
          icon: <AccountBalanceWallet sx={{ fontSize: 16 }} />,
          bg: "#F3F4F6",
          color: "#4B5563",
          border: "#E5E7EB",
        };
    }
  };

  const getTypeBadge = (type) => {
    const t = (type || "").toUpperCase();
    switch (t) {
      case "ADVANCE":
        return { label: "Advance Check-In", bg: "#EFF6FF", color: "#1D4ED8" };
      case "FULL_SETTLEMENT":
        return { label: "Checkout Settlement", bg: "#ECFDF5", color: "#047857" };
      case "EXTRA_CHARGE":
        return { label: "POS / Extra Service", bg: "#FFF7ED", color: "#C2410C" };
      case "PARTIAL":
        return { label: "Partial Payment", bg: "#FDF4FF", color: "#A21CAF" };
      default:
        return { label: type || "Payment", bg: "#F3F4F6", color: "#374151" };
    }
  };

  const handleExportCSV = () => {
    if (payments.length === 0) {
      showToast("No payment records to export.", "warning");
      return;
    }
    const headers = [
      "Receipt #",
      "Date",
      "Time",
      "Guest Name",
      "Guest Phone",
      "Room #",
      "Booking #",
      "Amount (INR)",
      "Payment Mode",
      "Payment Type",
      "Txn ID / Ref",
      "Collected By",
    ];

    const rows = payments.map((p) => [
      p.receiptNumber,
      p.dateStr,
      p.timeStr,
      `"${p.guest?.fullName || "Guest"}"`,
      `"${p.guest?.mobileNumber || ""}"`,
      p.booking?.roomNumber || "N/A",
      p.booking?.bookingNumber || "N/A",
      p.amount,
      p.paymentMethod,
      p.paymentType,
      `"${p.transactionId || p.paymentReference || ""}"`,
      `"${p.collectedBy?.name || "Staff"}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `payment_ledger_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Payment Ledger exported as CSV successfully!");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
      {/* Toast Alert */}
      {toast.show && (
        <Alert
          severity={toast.severity}
          sx={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            boxShadow: themeConfig.shadowModal,
            borderRadius: "12px",
          }}
        >
          {toast.message}
        </Alert>
      )}

      {/* Header & Quick Action */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", md: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", md: "center" },
          gap: 2,
        }}
      >
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5 }}>
            Payment Collections &amp; Cash Drawer Ledger
          </Typography>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
            Real-time multi-mode billing telemetry &bull; UPI QR, Cash Counter, Card POS &amp; NEFT Bank Transfers
          </Typography>
        </Box>

        <Box sx={{ display: "flex", gap: 1.2, alignItems: "center", flexShrink: 0, flexWrap: "nowrap" }}>
          <Button
            variant="outlined"
            size="small"
            startIcon={<Download sx={{ fontSize: 16 }} />}
            onClick={handleExportCSV}
            className="btn-3d"
            sx={{
              borderRadius: "10px",
              borderColor: themeConfig.border,
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              color: themeConfig.textMain,
              fontWeight: 700,
              fontSize: "0.78rem",
              textTransform: "none",
              py: 0.7,
              px: 1.5,
              whiteSpace: "nowrap",
            }}
          >
            Export CSV
          </Button>

          <Button
            variant="outlined"
            size="small"
            startIcon={<Download sx={{ fontSize: 16 }} />}
            onClick={() => {
              downloadDailyLedgerPDF(payments, summary, { ...hotelSettings, ...(user?.hotel || {}) });
              showToast("Collections statement PDF generated successfully!");
            }}
            className="btn-3d"
            sx={{
              borderRadius: "10px",
              borderColor: themeConfig.primary,
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              color: themeConfig.primaryLight || themeConfig.primary,
              fontWeight: 800,
              fontSize: "0.78rem",
              textTransform: "none",
              py: 0.7,
              px: 1.5,
              whiteSpace: "nowrap",
            }}
          >
            Statement (PDF)
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<Add sx={{ fontSize: 16 }} />}
            onClick={() => handleOpenCollectModal()}
            className="btn-3d"
            sx={{
              background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
              borderRadius: "10px",
              fontWeight: 800,
              fontSize: "0.78rem",
              textTransform: "none",
              py: 0.7,
              px: 1.8,
              whiteSpace: "nowrap",
              boxShadow: `0 4px 12px ${themeConfig.primaryGlow}`,
            }}
          >
            Collect Payment
          </Button>
        </Box>
      </Box>

      {/* 6-Card Telemetry Grid */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            xl: "repeat(6, 1fr)",
          },
          gap: 2.5,
        }}
      >
        {/* Card 1: Total Gross Revenue */}
        <Paper
          className="card-3d"
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            border: `1px solid ${themeConfig.border}`,
            background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #FAFBFD 100%)",
            boxShadow: isDarkMode ? "none" : "0 6px 16px rgba(12, 39, 59, 0.04), inset 0 1px 1px #FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase" }}>
              Total Revenue
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: themeConfig.champagne, color: themeConfig.primary }}>
              <TrendingUp sx={{ fontSize: 18 }} />
            </Box>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
            ₹{(summary.totalGrossCollected || 0).toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
            {summary.totalTransactions || 0} total receipts
          </Typography>
        </Paper>

        {/* Card 2: Today's Shift Collections */}
        <Paper
          className="card-3d"
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            border: `1px solid ${themeConfig.border}`,
            background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)",
            boxShadow: isDarkMode ? "none" : "0 6px 16px rgba(12, 39, 59, 0.04), inset 0 1px 1px #FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isDarkMode ? "#34D399" : "#059669", textTransform: "uppercase" }}>
              Today&apos;s Collection
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: isDarkMode ? "rgba(52, 211, 153, 0.15)" : "#ECFDF5", color: isDarkMode ? "#34D399" : "#059669" }}>
              <Schedule sx={{ fontSize: 18 }} />
            </Box>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: isDarkMode ? "#34D399" : "#059669" }}>
            ₹{(summary.todayCollected || 0).toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ color: isDarkMode ? "#34D399" : "#059669", fontWeight: 700 }}>
            Cash: ₹{(summary.todayCash || 0).toLocaleString()} &bull; UPI: ₹{(summary.todayUpi || 0).toLocaleString()}
          </Typography>
        </Paper>

        {/* Card 3: Cash Counter Drawer */}
        <Paper
          className="card-3d"
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            border: `1px solid ${themeConfig.border}`,
            background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #FAFBFD 100%)",
            boxShadow: isDarkMode ? "none" : "0 6px 16px rgba(12, 39, 59, 0.04), inset 0 1px 1px #FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase" }}>
              Cash In Drawer
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: isDarkMode ? "rgba(52, 211, 153, 0.15)" : "#ECFDF5", color: isDarkMode ? "#34D399" : "#059669" }}>
              <Payments sx={{ fontSize: 18 }} />
            </Box>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
            ₹{(summary.cashTotal || 0).toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
            Physical Counter Cash
          </Typography>
        </Paper>

        {/* Card 4: UPI QR Collections */}
        <Paper
          className="card-3d"
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            border: `1px solid ${themeConfig.border}`,
            background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #F5F3FF 100%)",
            boxShadow: isDarkMode ? "none" : "0 6px 16px rgba(12, 39, 59, 0.04), inset 0 1px 1px #FFFFFF",
            overflow: "hidden",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isDarkMode ? "#A78BFA" : "#7C3AED", textTransform: "uppercase" }}>
              UPI QR Pay
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: isDarkMode ? "rgba(167, 139, 250, 0.15)" : "#F5F3FF", color: isDarkMode ? "#A78BFA" : "#7C3AED" }}>
              <QrCode2 sx={{ fontSize: 18 }} />
            </Box>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: isDarkMode ? "#A78BFA" : "#7C3AED" }}>
            ₹{(summary.upiTotal || 0).toLocaleString()}
          </Typography>
          <Tooltip title={activeUpiId}>
            <Typography
              variant="caption"
              sx={{
                color: themeConfig.textMuted,
                display: "block",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {activeUpiId}
            </Typography>
          </Tooltip>
        </Paper>

        {/* Card 5: Card POS & Bank Transfers */}
        <Paper
          className="card-3d"
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            border: `1px solid ${themeConfig.border}`,
            background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #FAFBFD 100%)",
            boxShadow: isDarkMode ? "none" : "0 6px 16px rgba(12, 39, 59, 0.04), inset 0 1px 1px #FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase" }}>
              Card & Bank NEFT
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: isDarkMode ? "rgba(96, 165, 250, 0.15)" : "#EFF6FF", color: isDarkMode ? "#60A5FA" : "#2563EB" }}>
              <CreditCard sx={{ fontSize: 18 }} />
            </Box>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
            ₹{((summary.cardTotal || 0) + (summary.bankTotal || 0)).toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
            Card: ₹{(summary.cardTotal || 0).toLocaleString()} &bull; NEFT: ₹{(summary.bankTotal || 0).toLocaleString()}
          </Typography>
        </Paper>

        {/* Card 6: Pending Dues / Receivables */}
        <Paper
          className="card-3d"
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            border: `1px solid ${themeConfig.border}`,
            background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #FFF5F5 100%)",
            boxShadow: isDarkMode ? "none" : "0 6px 16px rgba(12, 39, 59, 0.04), inset 0 1px 1px #FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.danger, textTransform: "uppercase" }}>
              Pending Dues
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: isDarkMode ? "rgba(239, 68, 68, 0.15)" : "#FEF2F2", color: themeConfig.danger }}>
              <AccountBalanceWallet sx={{ fontSize: 18 }} />
            </Box>
          </Box>
          <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.danger }}>
            ₹{(summary.totalPendingDues || 0).toLocaleString()}
          </Typography>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
            Active Resident Balances
          </Typography>
        </Paper>
      </Box>

      {/* Filter Toolbar & Search */}
      <Card
        className="card-3d"
        sx={{
          p: 2,
          borderRadius: "18px",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "none" : "0 8px 20px rgba(12, 39, 59, 0.05), inset 0 1px 1px #FFFFFF",
        }}
      >
        <Box
          component="form"
          onSubmit={handleSearchSubmit}
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
          }}
        >
          <TextField
            size="small"
            placeholder="Search receipt #, guest, room #, phone, UTR..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              flex: { xs: "1 1 auto", md: "1 1 360px" },
              minWidth: { xs: "100%", sm: "240px" },
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.04)" : themeConfig.champagne,
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: themeConfig.textMuted }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Payment Mode</InputLabel>
              <Select
                value={selectedMethod}
                label="Payment Mode"
                onChange={(e) => {
                  setSelectedMethod(e.target.value);
                  setPage(0);
                }}
                sx={{ borderRadius: "12px", bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF") }}
              >
                <MenuItem value="ALL">All Modes</MenuItem>
                <MenuItem value="UPI">🟣 UPI QR</MenuItem>
                <MenuItem value="CASH">🟢 Cash Counter</MenuItem>
                <MenuItem value="CARD">🔵 Card POS</MenuItem>
                <MenuItem value="BANK_TRANSFER">🟠 Bank Transfer (NEFT)</MenuItem>
                <MenuItem value="ONLINE">⚪ Online Gateway</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Payment Stage</InputLabel>
              <Select
                value={selectedType}
                label="Payment Stage"
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(0);
                }}
                sx={{ borderRadius: "12px", bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF") }}
              >
                <MenuItem value="ALL">All Stages</MenuItem>
                <MenuItem value="ADVANCE">Advance Check-In</MenuItem>
                <MenuItem value="FULL_SETTLEMENT">Full Settlement</MenuItem>
                <MenuItem value="EXTRA_CHARGE">POS Extra Charge</MenuItem>
                <MenuItem value="PARTIAL">Partial Payment</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 130 }}>
              <InputLabel>Timeline</InputLabel>
              <Select
                value={timeRange}
                label="Timeline"
                onChange={(e) => {
                  setTimeRange(e.target.value);
                  setPage(0);
                }}
                sx={{ borderRadius: "12px", bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF") }}
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="today">Today Only</MenuItem>
                <MenuItem value="yesterday">Yesterday</MenuItem>
                <MenuItem value="this_week">Last 7 Days</MenuItem>
                <MenuItem value="this_month">This Month</MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Refresh Payment Ledger">
              <IconButton
                onClick={fetchPayments}
                sx={{
                  bgcolor: themeConfig.champagne,
                  borderRadius: "12px",
                  p: 1.1,
                  border: `1px solid ${themeConfig.border}`,
                  "&:hover": { bgcolor: themeConfig.border },
                }}
              >
                <Refresh sx={{ color: themeConfig.textMain }} />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>
      </Card>

      {/* Transactions Ledger Table */}
      <Card
        className="card-3d"
        sx={{
          borderRadius: "20px",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "none" : "0 10px 30px rgba(12, 39, 59, 0.06), inset 0 1px 1px #FFFFFF",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${themeConfig.border}` }}>
          <div>
            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
              Audited Collections Ledger ({payments.length})
            </Typography>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
              Chronological financial records stamped with staff identity & GST compliance
            </Typography>
          </div>
        </Box>

        {loading ? (
          <Box sx={{ py: 8, display: "flex", justifyContent: "center", alignItems: "center" }}>
            <CircularProgress sx={{ color: themeConfig.primary }} />
          </Box>
        ) : payments.length === 0 ? (
          <Box sx={{ py: 8 }}>
            <EmptyState
              title="No Payment Records Found"
              description="No financial transactions match your selected filter criteria. Try changing filters or search terms."
            />
          </Box>
        ) : (
          <TableContainer
            sx={{
              overflowX: "auto",
              "&::-webkit-scrollbar": { height: "6px", width: "6px" },
              "&::-webkit-scrollbar-track": { background: "rgba(0,0,0,0.02)" },
              "&::-webkit-scrollbar-thumb": { background: themeConfig.border, borderRadius: "6px" },
            }}
          >
            <Table size="small" sx={{ minWidth: 900 }}>
              <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.2, whiteSpace: "nowrap" }}>Receipt &amp; Time</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.2, whiteSpace: "nowrap" }}>Guest &amp; Room</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.2, whiteSpace: "nowrap" }}>Payment Mode</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.2, whiteSpace: "nowrap" }}>Stage / Reason</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.2, whiteSpace: "nowrap" }}>Amount Paid</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.2, whiteSpace: "nowrap" }}>Collector Staff</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.2, whiteSpace: "nowrap" }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {payments
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((p) => {
                  const methodBadge = getMethodBadge(p.paymentMethod);
                  const typeBadge = getTypeBadge(p.paymentType);

                  return (
                    <TableRow
                      key={p._id}
                      hover
                      sx={{
                        "&:hover": { bgcolor: "rgba(12, 39, 59, 0.02)" },
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      {/* Column 1: Receipt Number & Timestamp */}
                      <TableCell sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primary, fontSize: "0.85rem" }}>
                          #{p.receiptNumber}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", display: "block" }}>
                          📅 {p.dateStr} &bull; ⏰ {p.timeStr}
                        </Typography>
                      </TableCell>

                      {/* Column 2: Guest Name & Room Allocation */}
                      <TableCell sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Box sx={{ p: 0.5, borderRadius: "6px", bgcolor: themeConfig.champagne, color: themeConfig.primary, display: "flex", alignItems: "center" }}>
                            <MeetingRoom sx={{ fontSize: 15 }} />
                          </Box>
                          <div>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.82rem" }}>
                              Room {p.booking?.roomNumber || "N/A"} - {p.guest?.fullName || "Guest"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", display: "block" }}>
                              📞 {p.guest?.mobileNumber || "N/A"} &bull; Folio: #{p.booking?.bookingNumber || "N/A"}
                            </Typography>
                          </div>
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
                            bgcolor: methodBadge.bg,
                            color: methodBadge.color,
                            border: `1px solid ${methodBadge.border}`,
                            borderRadius: "8px",
                            height: 24,
                            fontSize: "0.72rem",
                          }}
                        />
                        {(p.transactionId && p.transactionId !== "N/A" && p.transactionId !== "") && (
                          <Typography variant="caption" sx={{ display: "block", color: themeConfig.textMuted, fontSize: "0.7rem", mt: 0.2 }}>
                            Ref: {p.transactionId}
                          </Typography>
                        )}
                      </TableCell>

                      {/* Column 4: Payment Stage */}
                      <TableCell sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                        <Chip
                          label={typeBadge.label}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            bgcolor: typeBadge.bg,
                            color: typeBadge.color,
                            borderRadius: "6px",
                            height: 22,
                            fontSize: "0.72rem",
                          }}
                        />
                      </TableCell>

                      {/* Column 5: Amount */}
                      <TableCell sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: "#059669", fontSize: "0.9rem" }}>
                          ₹{(p.amount || 0).toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#059669", fontSize: "0.7rem", fontWeight: 700 }}>
                          PAID
                        </Typography>
                      </TableCell>

                      {/* Column 6: Collector Staff */}
                      <TableCell sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.82rem" }}>
                          {p.collectedBy?.name || "Front Desk"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.7rem", textTransform: "uppercase" }}>
                          {p.collectedBy?.role || "Receptionist"}
                        </Typography>
                      </TableCell>

                      {/* Column 7: Actions */}
                      <TableCell align="right" sx={{ py: 1.1, whiteSpace: "nowrap" }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Receipt sx={{ fontSize: 14 }} />}
                          onClick={() => setReceiptModal({ open: true, payment: p })}
                          className="btn-3d"
                          sx={{
                            borderRadius: "8px",
                            borderColor: themeConfig.border,
                            color: themeConfig.textMain,
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            textTransform: "none",
                            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                            py: 0.3,
                            px: 1.2,
                          }}
                        >
                          Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Table Pagination */}
        {payments.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={payments.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              borderTop: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            }}
          />
        )}
      </Card>

      {/* MODAL 1: Collect Folio Payment */}
      <Dialog
        open={collectModalOpen}
        onClose={() => !collectLoading && setCollectModalOpen(false)}
        slotProps={{ paper: { sx: { borderRadius: "20px", p: 2, maxWidth: 520, border: `1px solid ${themeConfig.border}` } } }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 900, color: themeConfig.textMain, pb: 1 }}>
          💰 Collect Folio Payment
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
            {collectError && <Alert severity="error">{collectError}</Alert>}

            {/* Select Booking / Room */}
            <FormControl fullWidth size="small">
              <InputLabel>Select Active Guest / Room Folio *</InputLabel>
              <Select
                value={collectData.bookingId}
                label="Select Active Guest / Room Folio *"
                onChange={(e) => {
                  const bId = e.target.value;
                  const b = checkedInBookings.find((x) => x._id === bId);
                  setCollectData({
                    ...collectData,
                    bookingId: bId,
                    amount: b?.dueAmount ? String(b.dueAmount) : collectData.amount,
                  });
                }}
              >
                {checkedInBookings.map((b) => (
                  <MenuItem key={b._id} value={b._id}>
                    Room {b.roomNumber || b.room?.roomNumber} - {b.guest?.fullName || b.guest?.name} (Due: ₹{(b.dueAmount || 0).toLocaleString()})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {selectedBookingDetails && (
              <Box sx={{ p: 1.5, bgcolor: themeConfig.champagne, borderRadius: "10px", fontSize: "0.85rem" }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Folio Balance Overview:</Typography>
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                  <span>Total Tariff: <strong>₹{(selectedBookingDetails.totalAmount || 0).toLocaleString()}</strong></span>
                  <span>Paid: <strong style={{ color: "#059669" }}>₹{(selectedBookingDetails.paidAmount || 0).toLocaleString()}</strong></span>
                  <span>Pending Due: <strong style={{ color: themeConfig.danger }}>₹{(selectedBookingDetails.dueAmount || 0).toLocaleString()}</strong></span>
                </Box>
              </Box>
            )}

            {/* Amount */}
            <TextField
              size="small"
              label="Collection Amount (₹) *"
              value={collectData.amount}
              onChange={(e) => setCollectData({ ...collectData, amount: e.target.value })}
              fullWidth
              placeholder="e.g. 5000"
              slotProps={{
                input: {
                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                },
              }}
            />

            {/* Payment Method Selector */}
            <FormControl fullWidth size="small">
              <InputLabel>Payment Method *</InputLabel>
              <Select
                value={collectData.paymentMethod}
                label="Payment Method *"
                onChange={(e) => setCollectData({ ...collectData, paymentMethod: e.target.value })}
              >
                <MenuItem value="UPI">🟣 UPI QR Code (GPay / PhonePe / Paytm)</MenuItem>
                <MenuItem value="CASH">🟢 Cash Counter Drawer</MenuItem>
                <MenuItem value="CARD">🔵 Card POS Terminal</MenuItem>
                <MenuItem value="BANK_TRANSFER">🟠 Bank Transfer / NEFT / RTGS</MenuItem>
              </Select>
            </FormControl>

            {/* Dynamic UPI QR Display if UPI is selected */}
            {collectData.paymentMethod === "UPI" && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: isDarkMode ? "rgba(167, 139, 250, 0.1)" : "#F5F3FF",
                  borderRadius: "14px",
                  border: `1px solid ${isDarkMode ? "rgba(167, 139, 250, 0.25)" : "#DDD6FE"}`,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: isDarkMode ? "#A78BFA" : "#7C3AED" }}>
                  Scan UPI QR to Pay ₹{Number(collectData.amount || 0).toLocaleString()}
                </Typography>
                <Box
                  component="img"
                  src={dynamicQrCodeUrl}
                  alt="UPI QR Code"
                  sx={{
                    width: 170,
                    height: 170,
                    borderRadius: "10px",
                    bgcolor: "#FFFFFF",
                    p: 1,
                    boxShadow: "0 4px 12px rgba(124, 58, 237, 0.15)",
                  }}
                />
                <Typography variant="caption" sx={{ fontWeight: 800, color: isDarkMode ? "#A78BFA" : "#7C3AED" }}>
                  UPI ID: {activeUpiId}
                </Typography>
              </Box>
            )}

            {/* Reference Fields */}
            {collectData.paymentMethod === "UPI" && (
              <TextField
                size="small"
                label="UPI UTR / Reference ID"
                placeholder="e.g. 324512984512"
                value={collectData.transactionId}
                onChange={(e) => setCollectData({ ...collectData, transactionId: e.target.value })}
                fullWidth
              />
            )}

            {collectData.paymentMethod === "CARD" && (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                <TextField
                  size="small"
                  label="Card Last 4 Digits"
                  placeholder="e.g. 4022"
                  value={collectData.paymentReference}
                  onChange={(e) => setCollectData({ ...collectData, paymentReference: e.target.value })}
                />
                <TextField
                  size="small"
                  label="POS Approval Auth Code"
                  placeholder="e.g. 981245"
                  value={collectData.transactionId}
                  onChange={(e) => setCollectData({ ...collectData, transactionId: e.target.value })}
                />
              </Box>
            )}

            {collectData.paymentMethod === "BANK_TRANSFER" && (
              <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.5 }}>
                <TextField
                  size="small"
                  label="Bank Name"
                  placeholder="e.g. HDFC / SBI / ICICI"
                  value={collectData.paymentReference}
                  onChange={(e) => setCollectData({ ...collectData, paymentReference: e.target.value })}
                />
                <TextField
                  size="small"
                  label="NEFT / RTGS UTR Number"
                  placeholder="e.g. UTIB000123..."
                  value={collectData.transactionId}
                  onChange={(e) => setCollectData({ ...collectData, transactionId: e.target.value })}
                />
              </Box>
            )}

            <TextField
              size="small"
              label="Staff Notes / Remarks (Optional)"
              placeholder="e.g. Settled remaining dining bill"
              value={collectData.note}
              onChange={(e) => setCollectData({ ...collectData, note: e.target.value })}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button
            onClick={() => setCollectModalOpen(false)}
            disabled={collectLoading}
            sx={{ borderRadius: "10px", color: themeConfig.textMuted }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleRecordPayment}
            disabled={collectLoading}
            className="btn-3d"
            sx={{
              background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
              borderRadius: "10px",
              fontWeight: 800,
            }}
          >
            {collectLoading ? <CircularProgress size={20} sx={{ color: "#FFFFFF" }} /> : "Record & Print Receipt"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* MODAL 2: Printable Official Payment Voucher Receipt */}
      <Dialog
        open={receiptModal.open}
        onClose={() => setReceiptModal({ open: false, payment: null })}
        slotProps={{ paper: { sx: { borderRadius: "20px", p: 3, maxWidth: 580, border: `1px solid ${themeConfig.border}` } } }}
      >
        {receiptModal.payment && (
          <Box id="printable-payment-receipt" sx={{ p: 1 }}>
            {/* Header */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", pb: 2, borderBottom: `2px solid ${themeConfig.primary}` }}>
              <div>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                  {hotelName}
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                  {user?.hotel?.address || "Hotel Operations & Front Desk Billing Hub"}
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                  GSTIN: {user?.hotel?.gstNumber || "24AAACG1234F1Z5"} &bull; UPI: {activeUpiId}
                </Typography>
              </div>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                  OFFICIAL PAYMENT VOUCHER
                </Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                  #{receiptModal.payment.receiptNumber}
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                  {receiptModal.payment.timestamp}
                </Typography>
              </Box>
            </Box>

            {/* Guest & Room Details */}
            <Box sx={{ my: 2.5, p: 2, bgcolor: themeConfig.champagne, borderRadius: "12px", display: "flex", justifyContent: "space-between" }}>
              <div>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase" }}>Received From:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                  {receiptModal.payment.guest?.fullName || "Guest"}
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                  Mobile: {receiptModal.payment.guest?.mobileNumber || "N/A"}
                </Typography>
              </div>
              <Box sx={{ textAlign: "right" }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase" }}>Room Allocation:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                  Room {receiptModal.payment.booking?.roomNumber || "N/A"}
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                  Folio: #{receiptModal.payment.booking?.bookingNumber}
                </Typography>
              </Box>
            </Box>

            {/* Payment Particulars */}
            <TableContainer sx={{ mb: 2, borderRadius: "10px", border: `1px solid ${themeConfig.border}` }}>
              <Table size="small">
                <TableBody>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: themeConfig.textMuted }}>Payment Stage / Reason</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                      {receiptModal.payment.paymentType}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: themeConfig.textMuted }}>Payment Mode</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                      {receiptModal.payment.paymentMethod}
                    </TableCell>
                  </TableRow>
                  {(receiptModal.payment.transactionId && receiptModal.payment.transactionId !== "N/A") && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: themeConfig.textMuted }}>Transaction / UTR Ref</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                        {receiptModal.payment.transactionId}
                      </TableCell>
                    </TableRow>
                  )}
                  {receiptModal.payment.note && (
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700, color: themeConfig.textMuted }}>Remarks</TableCell>
                      <TableCell align="right" sx={{ color: themeConfig.textMain }}>
                        {receiptModal.payment.note}
                      </TableCell>
                    </TableRow>
                  )}
                  <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                    <TableCell sx={{ fontWeight: 900, fontSize: "1rem" }}>Total Amount Received</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 900, fontSize: "1.1rem", color: "#059669" }}>
                      ₹{(receiptModal.payment.amount || 0).toLocaleString()}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </TableContainer>

            {/* Signature & Auth Footer */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", pt: 2, borderTop: `1px dashed ${themeConfig.border}` }}>
              <div>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                  Collected By: <strong>{receiptModal.payment.collectedBy?.name || "Front Desk"}</strong> ({receiptModal.payment.collectedBy?.role || "Receptionist"})
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                  Computer-generated authorized receipt &bull; Valid without physical signature
                </Typography>
              </div>
              <Box sx={{ textAlign: "center" }}>
                <Box sx={{ width: 120, borderBottom: `1px solid ${themeConfig.border}`, mb: 0.5 }} />
                <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Authorized Signatory</Typography>
              </Box>
            </Box>

            {/* Actions */}
            <DialogActions sx={{ p: 0, pt: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${themeConfig.border}`, mt: 2 }}>
              <Button
                onClick={() => setReceiptModal({ open: false, payment: null })}
                sx={{
                  borderRadius: "10px",
                  fontWeight: 700,
                  color: themeConfig.textMuted,
                  px: 2,
                  "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                }}
              >
                Close
              </Button>
              <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "nowrap" }}>
                <Button
                  variant="outlined"
                  startIcon={<Download sx={{ fontSize: 18 }} />}
                  onClick={() => {
                    downloadPaymentReceiptPDF(receiptModal.payment, { ...hotelSettings, ...(user?.hotel || {}) });
                    showToast("Payment Receipt downloaded / opened!");
                  }}
                  sx={{
                    borderRadius: "10px",
                    borderColor: themeConfig.border,
                    color: themeConfig.textMain,
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    whiteSpace: "nowrap",
                    px: 1.8,
                    "&:hover": { borderColor: themeConfig.primary, bgcolor: themeConfig.champagne },
                  }}
                >
                  Download PDF
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Print sx={{ fontSize: 18 }} />}
                  onClick={() => {
                    downloadPaymentReceiptPDF(receiptModal.payment, { ...hotelSettings, ...(user?.hotel || {}) });
                  }}
                  className="btn-3d"
                  sx={{
                    background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                    borderRadius: "10px",
                    fontWeight: 800,
                    fontSize: "0.82rem",
                    whiteSpace: "nowrap",
                    px: 1.8,
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
