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
  CreditCard,
  Close,
  ArrowBack,
  AccountBalanceWallet,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { useSocket } from "@/shared/context/SocketContext";
import {
  paymentMethodLabel,
  useHotelPaymentMethods,
  buildPaymentCollectionSourceRows,
} from "@/shared/hooks/useHotelPaymentMethods";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { folioMoney } from "@/shared/utils/folioMoney";
import EmptyState from "@/shared/components/EmptyState";
import PeriodRangeFilter from "@/shared/components/PeriodRangeFilter";
import { TableCard, TableToolbar, TablePager, tableFieldSx, tableSearchSx } from "@/shared/components/DataTable";
import { buildListQuery } from "@/shared/utils/listQuery";
import { resolveBookingGuestNames } from "@/shared/utils/guestUtils";

function txnAmount(record) {
  if (!record || typeof record !== "object") return 0;
  const money = folioMoney(record);
  const direct = [record.amount, record.collected_amount, record.collectedAmount, record.total, record.payment_amount]
    .map((value) => Number(value))
    .find((value) => Number.isFinite(value) && value > 0) || 0;
  return money.total || money.paid || money.base || direct || 0;
}

const SOURCE_COLORS = ["#0B8EE0", "#8B5CF6", "#F59E0B", "#10B981", "#EF4444", "#06B6D4", "#D946EF", "#64748B"];

/** Prefer summary collections; fall back to dashboard when summary has no rows yet */
function pickPaymentCollections(summaryMethods, dashboardMethods) {
  if (Array.isArray(summaryMethods) && summaryMethods.length > 0) return summaryMethods;
  if (summaryMethods && typeof summaryMethods === "object" && Object.keys(summaryMethods).length > 0) {
    return summaryMethods;
  }
  return dashboardMethods;
}

export default function RevenueDetailsPage({ onBackToDashboard, initialFilter = "THIS_WEEK", dashboardData }) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const { methods: hotelPaymentMethods } = useHotelPaymentMethods();
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

  // Data & Pagination — summary KPIs + transactions page/limit only (no bookings dump)
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [txnState, setTxnState] = useState({ rows: [], total: 0 });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [appliedSearch, setAppliedSearch] = useState("");

  const [selectedTxn, setSelectedTxn] = useState(null);

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

  // 1) KPI summary for the selected date range
  useEffect(() => {
    const [start, end] = dateWindow();
    if (!start || !end) return undefined;
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.SUMMARY(start, end));
        const payload = res?.data && !Array.isArray(res.data) ? res.data : null;
        if (!cancelled) setSummary(payload);
      } catch {
        if (!cancelled) setSummary(null);
      }
    })();
    return () => { cancelled = true; };
  }, [filterType, startDate, endDate, liveTick]);

  // 2) Transactions — server page/limit (not load-all then slice)
  useEffect(() => {
    const [start, end] = dateWindow();
    if (!start || !end) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const q = buildListQuery({
          page: page + 1,
          limit: rowsPerPage,
          start_date: start,
          end_date: end,
          payment_method: paymentMethod,
          status: paymentStatus,
          search: appliedSearch.trim() || undefined,
        });
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.TRANSACTIONS(q));
        const payload = res?.data && !Array.isArray(res.data) ? res.data : {};
        const list = Array.isArray(payload.transactions)
          ? payload.transactions
          : Array.isArray(payload.data)
            ? payload.data
            : Array.isArray(res?.data)
              ? res.data
              : [];
        const rows = list.map((txn) => {
          const amount = txnAmount(txn);
          return {
            id: txn.id,
            formattedDate: txn.created_at
              ? new Date(txn.created_at).toLocaleString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "",
            transactionId: txn.id,
            guestName: resolveBookingGuestNames(txn).primaryGuestName || "Guest",
            bookingNumber: txn.booking_number || txn.booking_id || "—",
            roomNumber: "—",
            description: txn.source || "Payment",
            paymentMethod: String(txn.payment_method || txn.paymentMethod || "CASH").toUpperCase(),
            amount,
            bookingId: txn.booking_id || txn.bookingId || "",
            tax: 0,
            total: amount,
            status: String(txn.booking_status || txn.status || txn.payment_status || "PAID").toUpperCase(),
            receivedBy: txn.received_by?.name || "",
          };
        });
        const total = Number(
          payload.total ??
            payload.pagination?.total ??
            payload.pagination?.totalRecords ??
            res?.total ??
            rows.length
        ) || rows.length;
        if (!cancelled) setTxnState({ rows, total });
      } catch {
        if (!cancelled) setTxnState({ rows: [], total: 0 });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [filterType, startDate, endDate, paymentMethod, paymentStatus, page, rowsPerPage, appliedSearch, liveTick]);

  const handleSearchSubmit = (e) => {
    e?.preventDefault?.();
    setPage(0);
    setAppliedSearch(search);
  };

  const handleClearSearch = () => {
    setSearch("");
    setAppliedSearch("");
    setPage(0);
  };

  const kpis = dashboardData?.kpis || {};
  const methods =
    dashboardData?.collection_by_payment_method ||
    dashboardData?.collectionByPaymentMethod ||
    dashboardData?.revenue_by_payment_method ||
    dashboardData?.revenueByPaymentMethod ||
    [];
  const methodsFromSummary =
    summary?.collection_by_payment_method || summary?.collectionByPaymentMethod || [];
  const sourceRows = buildPaymentCollectionSourceRows(
    pickPaymentCollections(methodsFromSummary, methods),
    hotelPaymentMethods
  ).map((row, index) => ({
    ...row,
    color: SOURCE_COLORS[index % SOURCE_COLORS.length],
  }));
  const sourcesTotal = sourceRows.reduce((sum, row) => sum + (Number(row.amount) || 0), 0);

  const pagedTransactions = txnState.rows;
  const dateRangeLabel = summary?.period_start_date && summary?.period_end_date
    ? `${summary.period_start_date} to ${summary.period_end_date}`
    : (filterType === "TODAY" ? "Today" : filterType === "THIS_MONTH" ? "This Month" : "This Week");
  const totalRev = summary
    ? Number(summary.total_collected_amount ?? summary.totalCollectedAmount ?? 0)
    : Number(dashboardData?.financials?.todayRevenue ?? kpis.today_revenue ?? 0);
  const totalTxnCount = summary
    ? Number(summary.total_booking_count ?? summary.totalBookingCount ?? txnState.total ?? 0)
    : txnState.total;
  const totalOutstanding = summary
    ? Number(summary.total_outstanding_amount ?? summary.totalOutstandingAmount ?? 0)
    : Number(dashboardData?.financials?.outstandingDue ?? kpis.total_outstanding_due ?? kpis.totalOutstandingDue ?? 0);
  const shareBase = sourcesTotal > 0 ? sourcesTotal : totalRev;
  const sharePercent = (amount) => {
    if (!(shareBase > 0)) return 0;
    return Math.min(100, Math.max(0, Math.round((Number(amount) || 0) / shareBase * 100)));
  };

  const getMethodColor = (method) => {
    switch (method?.toUpperCase()) {
      case "CASH": return { bg: "rgba(16, 185, 129, 0.12)", color: themeConfig.tones.success.color, border: "rgba(16, 185, 129, 0.3)" };
      case "UPI": return { bg: "rgba(14, 165, 233, 0.12)", color: themeConfig.tones.blue.color, border: "rgba(14, 165, 233, 0.3)" };
      case "CARD": return { bg: "rgba(139, 92, 246, 0.12)", color: themeConfig.tones.violet.color, border: "rgba(139, 92, 246, 0.3)" };
      default: return { bg: "rgba(100, 116, 139, 0.12)", color: themeConfig.tones.neutral.color, border: "rgba(100, 116, 139, 0.3)" };
    }
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3, pb: { xs: 10, sm: 4 } }}>
      {/* Period selector (shared with the front desk dashboard) */}
      <PeriodRangeFilter
        eyebrow="Revenue"
        value={filterType}
        onChange={(id) => {
          setFilterType(id);
          setPage(0);
        }}
        start={startDate}
        end={endDate}
        onApplyCustom={(from, to) => {
          setStartDate(from);
          setEndDate(to);
          setFilterType("CUSTOM");
          setPage(0);
        }}
        leading={
          onBackToDashboard ? (
            <IconButton
              aria-label="Back to dashboard"
              title="Back to dashboard"
              onClick={onBackToDashboard}
              sx={{
                width: 40,
                height: 40,
                flexShrink: 0,
                borderRadius: "12px",
                border: `1px solid ${themeConfig.border}`,
                color: themeConfig.textMain,
                bgcolor: themeConfig.bgCard,
                "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
              }}
            >
              <ArrowBack fontSize="small" />
            </IconButton>
          ) : null
        }
      />

      {/* KPI Highlight Summary Cards */}
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.8,
              borderRadius: "20px",
              bgcolor: themeConfig.bgCard || (themeConfig.bgCard),
              border: `1.5px solid ${themeConfig.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Revenue
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
              Collected
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.8,
              borderRadius: "20px",
              bgcolor: themeConfig.bgCard || (themeConfig.bgCard),
              border: `1.5px solid ${themeConfig.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Transactions
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
              In this range
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 6, md: 4 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2.8,
              borderRadius: "20px",
              bgcolor: themeConfig.bgCard || (themeConfig.bgCard),
              border: `1.5px solid ${themeConfig.border}`,
              position: "relative",
              overflow: "hidden",
            }}
          >
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <Box>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  Outstanding Amount
                </Typography>
                <Typography variant="h3" sx={{ fontWeight: 900, color: totalOutstanding > 0 ? (themeConfig.danger || "#EF4444") : themeConfig.primary, mt: 0.5, letterSpacing: "-1px", fontSize: { xs: "1.5rem", sm: "2.2rem" } }}>
                  ₹{totalOutstanding.toLocaleString("en-IN")}
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 1.2,
                  borderRadius: "14px",
                  bgcolor: totalOutstanding > 0 ? (themeConfig.dangerBg || "rgba(180, 35, 24, 0.10)") : themeConfig.champagne,
                  color: totalOutstanding > 0 ? (themeConfig.danger || "#EF4444") : themeConfig.primary,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AccountBalanceWallet sx={{ fontSize: 26 }} />
              </Box>
            </Box>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "block", mt: 1 }}>
              Pending balance
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Payment sources — one compact tile per hotel payment method */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 1.25, sm: 1.5 },
          borderRadius: "16px",
          bgcolor: themeConfig.bgCard || "#FFFFFF",
          border: `1px solid ${themeConfig.border}`,
        }}
      >
        <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.85rem", mb: 1 }}>
          Sources
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              sm: sourceRows.length <= 4 ? `repeat(${Math.max(sourceRows.length, 2)}, minmax(0, 1fr))` : "repeat(4, minmax(0, 1fr))",
              md: `repeat(${Math.min(Math.max(sourceRows.length, 2), 6)}, minmax(0, 1fr))`,
            },
            gap: 1,
          }}
        >
          {sourceRows.map((item) => {
            const pct = sharePercent(item.amount);
            return (
              <Box
                key={item.name}
                sx={{
                  minWidth: 0,
                  p: 1.1,
                  borderRadius: "12px",
                  border: `1px solid ${themeConfig.border}`,
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5, mb: 0.35 }}>
                  <Typography noWrap sx={{ fontSize: "0.72rem", fontWeight: 800, color: themeConfig.textMuted }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: item.color, flexShrink: 0 }}>
                    {pct}%
                  </Typography>
                </Box>
                <Typography noWrap sx={{ fontWeight: 800, fontSize: "0.95rem", color: themeConfig.textMain, lineHeight: 1.2 }}>
                  ₹{Number(item.amount || 0).toLocaleString("en-IN")}
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    mt: 0.65,
                    height: 4,
                    borderRadius: 3,
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "#E2E8F0",
                    "& .MuiLinearProgress-bar": { bgcolor: item.color, borderRadius: 3 },
                  }}
                />
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* Transaction Records Table & Filtering */}
      <TableCard>
        <TableToolbar
          filtersRight
          title={
            <>
              <CreditCard sx={{ fontSize: 20, color: themeConfig.primary }} />
              Transactions ({txnState.total})
            </>
          }
        >
          <TextField
            size="small"
            placeholder="Search guest, booking, or room"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ fontSize: 18, color: themeConfig.textMuted }} />
                  </InputAdornment>
                ),
                endAdornment: search ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={handleClearSearch} aria-label="Clear search">
                      <Close sx={{ fontSize: 16 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              },
            }}
            sx={tableSearchSx(themeConfig)}
          />
          <TextField
            select
            size="small"
            value={paymentMethod}
            onChange={(e) => {
              setPaymentMethod(e.target.value);
              setPage(0);
            }}
            sx={tableFieldSx(themeConfig, 170)}
          >
            <MenuItem value="ALL">All methods</MenuItem>
            {hotelPaymentMethods.map((item) => (
              <MenuItem key={item.id || item.name} value={item.name}>
                {paymentMethodLabel(item.name)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            size="small"
            value={paymentStatus}
            onChange={(e) => {
              setPaymentStatus(e.target.value);
              setPage(0);
            }}
            sx={tableFieldSx(themeConfig, 180)}
          >
            <MenuItem value="ALL">All statuses</MenuItem>
            <MenuItem value="CHECKED_IN">Checked in</MenuItem>
            <MenuItem value="CHECKED_OUT">Checked out</MenuItem>
            <MenuItem value="PAID">Paid</MenuItem>
            <MenuItem value="PARTIALLY_PAID">Partial</MenuItem>
            <MenuItem value="FAILED">Failed</MenuItem>
            <MenuItem value="REFUNDED">Refunded</MenuItem>
          </TextField>
        </TableToolbar>

        {/* Table Content */}
        {loading ? (
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, gap: 2 }}>
            <CircularProgress sx={{ color: themeConfig.primary }} />
            <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
              Loading financial records...
            </Typography>
          </Box>
        ) : pagedTransactions.length > 0 ? (
          <>
            <TableContainer sx={{ overflowX: "auto" }}>
              <Table size="medium" sx={{ minWidth: 720 }}>
                <TableHead>
                  <TableRow>
                    {["Date", "Guest", "Booking", "Method", "Amount", "Status"].map((heading) => (
                      <TableCell key={heading}>{heading}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pagedTransactions.map((t, idx) => {
                    const methodStyle = getMethodColor(t.paymentMethod);
                    return (
                      <TableRow key={t.id || idx} hover>
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
                        <TableCell sx={{ fontWeight: 900, color: themeConfig.accent, whiteSpace: "nowrap" }}>
                          ₹{Number(t.amount || t.total || 0).toLocaleString("en-IN")}
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

            <TablePager
              count={txnState.total}
              page={page}
              onPageChange={(e, np) => setPage(np)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        ) : (
          <EmptyState
            title="No Transactions Found"
            message="There are no payment or booking transactions matching the selected filters."
          />
        )}
      </TableCard>

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
                bgcolor: themeConfig.bgCard || (themeConfig.bgCard),
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

