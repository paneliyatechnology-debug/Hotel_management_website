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
import EmptyState from "@/shared/components/EmptyState";
import { downloadRevenueDetailsReportPDF, downloadPaymentReceiptPDF } from "@/shared/utils/pdfGenerator";

export default function RevenueDetailsPage({ onBackToDashboard, hotelSettings, initialFilter = "THIS_WEEK" }) {
  const { themeConfig, isDarkMode } = useAppTheme();

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
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selected Transaction for Dialog
  const [selectedTxn, setSelectedTxn] = useState(null);

  const fetchRevenueDetails = async () => {
    setLoading(true);
    try {
      let query = `?filter=${filterType}&page=${page + 1}&limit=${rowsPerPage}`;
      if (filterType === "CUSTOM" && startDate && endDate) {
        query += `&startDate=${startDate}&endDate=${endDate}`;
      }
      if (search) query += `&search=${encodeURIComponent(search)}`;
      if (paymentMethod !== "ALL") query += `&paymentMethod=${paymentMethod}`;
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
    fetchRevenueDetails();
  }, [filterType, startDate, endDate, paymentMethod, paymentStatus, page, rowsPerPage]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.();
    setPage(0);
    fetchRevenueDetails();
  };

  const handleClearSearch = () => {
    setSearch("");
    setPage(0);
  };

  const transactions = revenueData?.transactions || [];
  const breakdown = revenueData?.revenueBreakdown || { roomBooking: 0, extraServices: 0, foodRestaurant: 0, otherCharges: 0, total: 0 };
  const dateRangeLabel = revenueData?.dateRange?.label || "Selected Range";
  const totalRev = revenueData?.totalRevenue || 0;
  const totalTxnCount = revenueData?.totalTransactions || 0;
  const avgTicket = totalTxnCount > 0 ? Math.round(totalRev / totalTxnCount) : 0;

  const getMethodColor = (method) => {
    switch (method?.toUpperCase()) {
      case "CASH": return { bg: "rgba(16, 185, 129, 0.12)", color: "#059669", border: "rgba(16, 185, 129, 0.3)" };
      case "UPI": return { bg: "rgba(14, 165, 233, 0.12)", color: "#0284C7", border: "rgba(14, 165, 233, 0.3)" };
      case "CARD": return { bg: "rgba(139, 92, 246, 0.12)", color: "#7C3AED", border: "rgba(139, 92, 246, 0.3)" };
      default: return { bg: "rgba(100, 116, 139, 0.12)", color: "#475569", border: "rgba(100, 116, 139, 0.3)" };
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: 4 }}>
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 2.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            {onBackToDashboard && (
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={onBackToDashboard}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "0.85rem",
                  px: 2,
                  py: 1,
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
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: "-0.5px" }}>
                Detailed Revenue & Financial Ledger
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5, mt: 0.2 }}>
                Period: <span style={{ color: themeConfig.primary, fontWeight: 800 }}>{dateRangeLabel}</span> &bull; Real-time verified booking & payment transactions
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={() => {
                downloadRevenueDetailsReportPDF(
                  revenueData || {},
                  hotelSettings?.hotel || {},
                  dateRangeLabel
                );
              }}
              sx={{
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "0.85rem",
                px: 2.2,
                py: 1.1,
                bgcolor: "#10B981",
                color: "#FFFFFF",
                boxShadow: "0 4px 12px rgba(16, 185, 129, 0.25)",
                "&:hover": { bgcolor: "#059669", boxShadow: "0 6px 16px rgba(16, 185, 129, 0.35)" },
              }}
            >
              Download Statement PDF
            </Button>

            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={fetchRevenueDetails}
              sx={{
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "0.85rem",
                px: 2,
                py: 1.1,
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
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", pt: 1, borderTop: `1px solid ${themeConfig.border}` }}>
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
                  fontSize: "0.82rem",
                  px: 1.2,
                  py: 2.1,
                  borderRadius: "10px",
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
                <Typography variant="h3" sx={{ fontWeight: 900, color: "#10B981", mt: 0.5, letterSpacing: "-1px" }}>
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
                <Typography variant="h3" sx={{ fontWeight: 900, color: themeConfig.textMain, mt: 0.5, letterSpacing: "-1px" }}>
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
                <Typography variant="h3" sx={{ fontWeight: 900, color: themeConfig.primary, mt: 0.5, letterSpacing: "-1px" }}>
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
                    Room Bookings
                  </Typography>
                </Box>
                <Chip
                  label={totalRev > 0 ? `${Math.round((breakdown.roomBooking / totalRev) * 100)}%` : "0%"}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: "0.7rem", height: 20, bgcolor: themeConfig.champagne, color: themeConfig.primary }}
                />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                ₹{breakdown.roomBooking?.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                {totalRev > 0 ? `${Math.round((breakdown.roomBooking / totalRev) * 100)}% of total` : "0% of total"}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalRev > 0 ? (breakdown.roomBooking / totalRev) * 100 : 0}
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
                    Extra Services / Beds
                  </Typography>
                </Box>
                <Chip
                  label={totalRev > 0 ? `${Math.round((breakdown.extraServices / totalRev) * 100)}%` : "0%"}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: "0.7rem", height: 20, bgcolor: "rgba(139, 92, 246, 0.12)", color: "#8B5CF6" }}
                />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                ₹{breakdown.extraServices?.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                {totalRev > 0 ? `${Math.round((breakdown.extraServices / totalRev) * 100)}% of total` : "0% of total"}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalRev > 0 ? (breakdown.extraServices / totalRev) * 100 : 0}
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
                    Food / Restaurant
                  </Typography>
                </Box>
                <Chip
                  label={totalRev > 0 ? `${Math.round((breakdown.foodRestaurant / totalRev) * 100)}%` : "0%"}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: "0.7rem", height: 20, bgcolor: "rgba(245, 158, 11, 0.12)", color: "#D97706" }}
                />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                ₹{breakdown.foodRestaurant?.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                {totalRev > 0 ? `${Math.round((breakdown.foodRestaurant / totalRev) * 100)}% of total` : "0% of total"}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalRev > 0 ? (breakdown.foodRestaurant / totalRev) * 100 : 0}
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
                    Other Charges
                  </Typography>
                </Box>
                <Chip
                  label={totalRev > 0 ? `${Math.round((breakdown.otherCharges / totalRev) * 100)}%` : "0%"}
                  size="small"
                  sx={{ fontWeight: 800, fontSize: "0.7rem", height: 20, bgcolor: "rgba(16, 185, 129, 0.12)", color: "#10B981" }}
                />
              </Box>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                ₹{breakdown.otherCharges?.toLocaleString()}
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                {totalRev > 0 ? `${Math.round((breakdown.otherCharges / totalRev) * 100)}% of total` : "0% of total"}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={totalRev > 0 ? (breakdown.otherCharges / totalRev) * 100 : 0}
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
            Transaction Records ({totalTxnCount})
          </Typography>

          {/* Search and Filters Bar */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
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
                width: { xs: "100%", sm: 160 },
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
                width: { xs: "100%", sm: 140 },
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
              <Table size="small">
                <TableHead sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.5 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Transaction ID</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Guest</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Booking ID</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Room</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Method</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Amount</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Tax</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Total</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, textAlign: "center" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {transactions.map((t, idx) => {
                    const methodStyle = getMethodColor(t.paymentMethod);
                    return (
                      <TableRow
                        key={t.id || idx}
                        hover
                        sx={{
                          cursor: "pointer",
                          transition: "background-color 0.15s",
                          "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(11, 142, 224, 0.04)" },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain, py: 1.5 }}>
                          {t.formattedDate}
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.primary }}>
                          <Box
                            onClick={() => setSelectedTxn(t)}
                            sx={{
                              display: "inline-block",
                              cursor: "pointer",
                              "&:hover": { textDecoration: "underline" },
                            }}
                          >
                            {t.transactionId}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {t.guestName}
                        </TableCell>
                        <TableCell sx={{ color: themeConfig.textMuted, fontWeight: 700, fontFamily: "monospace" }}>
                          {t.bookingNumber}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t.roomNumber || "N/A"}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: "0.75rem", borderRadius: "6px" }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: themeConfig.textMuted, fontSize: "0.82rem", maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {t.description}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t.paymentMethod}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              borderRadius: "6px",
                              bgcolor: methodStyle.bg,
                              color: methodStyle.color,
                              border: `1px solid ${methodStyle.border}`,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>₹{t.amount?.toLocaleString()}</TableCell>
                        <TableCell sx={{ color: themeConfig.textMuted }}>₹{t.tax?.toLocaleString() || 0}</TableCell>
                        <TableCell sx={{ fontWeight: 900, color: "#10B981", fontSize: "0.9rem" }}>
                          ₹{t.total?.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={t.status}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              borderRadius: "6px",
                              bgcolor: t.status === "PAID" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                              color: t.status === "PAID" ? "#059669" : "#D97706",
                              border: `1px solid ${t.status === "PAID" ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)"}`,
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ textAlign: "center" }}>
                          <Tooltip title="View & Print Receipt">
                            <IconButton
                              size="small"
                              onClick={() => setSelectedTxn(t)}
                              sx={{
                                color: themeConfig.primary,
                                bgcolor: themeConfig.champagne,
                                "&:hover": { bgcolor: themeConfig.primary, color: "#FFFFFF" },
                              }}
                            >
                              <Visibility sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={totalTxnCount}
              page={page}
              onPageChange={(e, np) => setPage(np)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 20, 50]}
              sx={{ borderTop: `1px solid ${themeConfig.border}`, mt: 1 }}
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
          <DialogActions sx={{ p: 2, display: "flex", justifyContent: "space-between" }}>
            <Button
              startIcon={<Download />}
              onClick={() => downloadPaymentReceiptPDF(selectedTxn, hotelSettings?.hotel || {})}
              variant="outlined"
              sx={{
                borderRadius: "10px",
                fontWeight: 800,
                borderColor: themeConfig.border,
                color: themeConfig.textMain,
                "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
              }}
            >
              Download PDF Receipt
            </Button>
            <Button
              onClick={() => setSelectedTxn(null)}
              variant="contained"
              sx={{ borderRadius: "10px", fontWeight: 800, bgcolor: themeConfig.primary }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}

