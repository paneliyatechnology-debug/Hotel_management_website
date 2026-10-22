"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Button,
  TextField,
  MenuItem,
  Menu,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableFooter,
  TableHead,
  TableRow,
  TablePagination,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Download } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { toast } from "@/shared/utils/toast";

const PRESETS = [
  { value: "THIS_MONTH", label: "This month" },
  { value: "LAST_MONTH", label: "Last month" },
  { value: "THIS_QUARTER", label: "This quarter" },
  { value: "THIS_FY", label: "This financial year" },
  { value: "CUSTOM", label: "Custom range" },
];

const SERVICE_OPTIONS = [
  { value: "", label: "All services" },
  { value: "ROOM_BOOKING", label: "Room booking" },
  { value: "OTHER_CHARGES", label: "Other charges" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "FINAL", label: "Final" },
  { value: "PROVISIONAL", label: "Provisional" },
  { value: "CANCELLED", label: "Cancelled" },
];

const RATE_OPTIONS = [
  { value: "", label: "All rates" },
  { value: "0", label: "0%" },
  { value: "5", label: "5%" },
  { value: "12", label: "12%" },
  { value: "18", label: "18%" },
  { value: "28", label: "28%" },
];

const SERVICE_LABELS = { ROOM_BOOKING: "Room booking", OTHER_CHARGES: "Other charges" };

const ymd = (date) => {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
};

// Date range for a preset. The financial year runs from 1 April.
const presetRange = (preset) => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  if (preset === "LAST_MONTH") return [ymd(new Date(year, month - 1, 1)), ymd(new Date(year, month, 0))];
  if (preset === "THIS_QUARTER") return [ymd(new Date(year, Math.floor(month / 3) * 3, 1)), ymd(now)];
  if (preset === "THIS_FY") return [ymd(new Date(month >= 3 ? year : year - 1, 3, 1)), ymd(now)];
  return [ymd(new Date(year, month, 1)), ymd(now)];
};

// The report covers at most one year from the start date.
const validateRange = (start, end) => {
  if (!start || !end) return "Choose both a start and an end date.";
  if (start > end) return "The start date must be on or before the end date.";
  const [y, m, d] = start.split("-").map(Number);
  const limit = new Date(y + 1, m - 1, d);
  if (new Date(`${end}T00:00:00`) > limit) return "A GST report can cover at most one year.";
  return "";
};

const pick = (obj, snake) => {
  if (!obj) return undefined;
  const camel = snake.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  return obj[snake] ?? obj[camel];
};

const num = (value) => Number(value) || 0;

const formatDisplayDate = (iso) => {
  if (!iso) return "";
  const [y, m, d] = String(iso).split("-");
  return y && m && d ? `${d}-${m}-${y}` : String(iso);
};

export default function GstReportPage({ hotelSettings }) {
  const { themeConfig, isDarkMode } = useAppTheme();

  const [initialStart, initialEnd] = presetRange("THIS_MONTH");
  const [preset, setPreset] = useState("THIS_MONTH");
  const [startDate, setStartDate] = useState(initialStart);
  const [endDate, setEndDate] = useState(initialEnd);
  const [serviceType, setServiceType] = useState("");
  const [invoiceStatus, setInvoiceStatus] = useState("");
  const [gstRate, setGstRate] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [result, setResult] = useState({ key: "", report: null, error: "" });
  const [exportAnchor, setExportAnchor] = useState(null);
  const [exporting, setExporting] = useState("");

  const rangeError = validateRange(startDate, endDate);

  const filterParams = () => {
    const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
    if (serviceType) params.set("service_type", serviceType);
    if (invoiceStatus) params.set("invoice_status", invoiceStatus);
    if (gstRate !== "") params.set("gst_rate", gstRate);
    return params;
  };

  const listParams = filterParams();
  listParams.set("page", String(page + 1));
  listParams.set("limit", String(rowsPerPage));
  const requestKey = rangeError ? "" : listParams.toString();

  useEffect(() => {
    if (!requestKey) return undefined;
    let cancelled = false;
    apiRequest(API_ENDPOINTS.GST_REPORT.LIST(requestKey))
      .then((res) => {
        if (!cancelled) setResult({ key: requestKey, report: res?.data || res, error: "" });
      })
      .catch((err) => {
        if (!cancelled) setResult((prev) => ({ ...prev, key: requestKey, error: err?.message || "Could not load the GST report." }));
      });
    return () => {
      cancelled = true;
    };
  }, [requestKey]);

  const loading = Boolean(requestKey) && result.key !== requestKey;
  const report = result.report;
  const rows = Array.isArray(report?.rows) ? report.rows : [];
  const totals = pick(report, "grand_totals") || {};
  const pagination = report?.pagination || {};
  const totalRows = num(pick(pagination, "total_rows"));
  const hotel = report?.hotel || {};
  const gstin = pick(hotel, "gstin");

  const currencyCode = hotelSettings?.currency || "INR";
  const symbol = currencyCode === "INR" ? "₹" : `${currencyCode} `;
  const money = (value) =>
    num(value).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const changePreset = (value) => {
    setPreset(value);
    setPage(0);
    if (value !== "CUSTOM") {
      const [start, end] = presetRange(value);
      setStartDate(start);
      setEndDate(end);
    }
  };

  const changeDate = (setter) => (e) => {
    setter(e.target.value);
    setPreset("CUSTOM");
    setPage(0);
  };

  const changeFilter = (setter) => (e) => {
    setter(e.target.value);
    setPage(0);
  };

  const handleExport = async (format) => {
    setExportAnchor(null);
    if (rangeError) {
      toast.error(rangeError);
      return;
    }
    setExporting(format);
    try {
      const params = filterParams();
      params.set("format", format);
      const res = await apiRequest(API_ENDPOINTS.GST_REPORT.EXPORT(params.toString()));
      const info = res?.data || res;
      if (!info?.url) throw new Error("The report link was not returned.");

      const link = document.createElement("a");
      link.href = info.url;
      link.target = "_blank";
      link.rel = "noopener";
      link.download = pick(info, "file_name") || "";
      document.body.appendChild(link);
      link.click();
      link.remove();

      const count = pick(info, "row_count");
      toast.success(`${format === "pdf" ? "PDF" : "Excel"} report ready${count !== undefined ? ` (${count} invoices)` : ""}.`);
    } catch (err) {
      toast.error(err?.message || "Could not export the report.");
    } finally {
      setExporting("");
    }
  };

  // Shared styles, matching the other pages
  const cardSx = {
    borderRadius: "14px",
    border: `1px solid ${themeConfig.border}`,
    bgcolor: themeConfig.bgCard || (themeConfig.bgCard),
    boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(32, 41, 35, 0.04)",
  };
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
    },
  };
  const fieldLabel = (text) => (
    <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.8rem", mb: 0.6 }}>{text}</Typography>
  );
  const selectField = (label, value, onChange, options, size) => (
    <Grid size={{ xs: 12, sm: 6, lg: size }}>
      {fieldLabel(label)}
      <TextField select fullWidth size="small" value={value} onChange={onChange} sx={inputSx}>
        {options.map((opt) => (
          <MenuItem key={opt.value} value={opt.value}>
            {opt.label}
          </MenuItem>
        ))}
      </TextField>
    </Grid>
  );

  const statusStyle = (status) => {
    if (status === "FINAL") return { color: themeConfig.success, bgcolor: themeConfig.successBg };
    if (status === "CANCELLED") return { color: themeConfig.danger, bgcolor: themeConfig.dangerBg };
    return { color: themeConfig.tones.warning.color, bgcolor: themeConfig.tones.warning.bg };
  };

  const summary = [
    {
      label: "Invoices",
      value: num(pick(totals, "total_invoices")).toLocaleString("en-IN"),
      note: `${num(pick(totals, "credit_note_count"))} cancelled`,
    },
    { label: "Taxable value", value: `${symbol}${money(pick(totals, "total_taxable_value"))}`, note: "Before GST" },
    {
      label: "Total GST",
      value: `${symbol}${money(pick(totals, "total_gst"))}`,
      note: `CGST ${money(pick(totals, "total_cgst"))} · SGST ${money(pick(totals, "total_sgst"))} · IGST ${money(pick(totals, "total_igst"))}`,
    },
    { label: "Invoice value", value: `${symbol}${money(pick(totals, "total_stored_invoice"))}`, note: "Including GST" },
  ];

  const headCellSx = {
    fontWeight: 800,
    fontSize: "0.72rem",
    textTransform: "uppercase",
    letterSpacing: "0.04em",
    color: themeConfig.textMuted,
    whiteSpace: "nowrap",
    bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFB",
    borderBottom: `1px solid ${themeConfig.border}`,
  };
  const bodyCellSx = {
    fontSize: "0.84rem",
    color: themeConfig.textMain,
    whiteSpace: "nowrap",
    borderBottom: `1px solid ${themeConfig.border}`,
  };
  const numericColumns = ["Taxable value", "GST %", "CGST", "SGST", "IGST", "Total GST", "Invoice total"];
  const columns = ["Date", "Invoice no.", "Guest", "Service", ...numericColumns, "Status"];

  return (
    <Box sx={{ width: "100%", minWidth: 0, px: { xs: 1.5, sm: 2.5, md: 3 }, py: { xs: 1, sm: 1.5 }, pb: { xs: 10, sm: 4 } }}>
      {/* Header */}
      <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, mb: 2.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "1.25rem", lineHeight: 1.3 }}>GST report</Typography>
          <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.84rem", mt: 0.25 }}>
            Invoice-wise GST for your hotel
            {report ? ` · GSTIN ${gstin || "not added"}` : ""}
            {report ? ` · ${formatDisplayDate(report?.filters?.start_date)} to ${formatDisplayDate(report?.filters?.end_date)}` : ""}
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={exporting ? <CircularProgress size={16} color="inherit" /> : <Download fontSize="small" />}
          onClick={(e) => setExportAnchor(e.currentTarget)}
          disabled={Boolean(exporting) || Boolean(rangeError)}
          sx={{
            height: 40,
            px: 2.5,
            borderRadius: "10px",
            textTransform: "none",
            fontWeight: 700,
            boxShadow: "none",
            bgcolor: themeConfig.primary,
            "&:hover": { bgcolor: themeConfig.primaryDark, boxShadow: "none" },
          }}
        >
          {exporting ? "Preparing..." : "Export"}
        </Button>
        <Menu
          anchorEl={exportAnchor}
          open={Boolean(exportAnchor)}
          onClose={() => setExportAnchor(null)}
          slotProps={{ paper: { sx: { borderRadius: "10px", mt: 0.5, minWidth: 180, border: `1px solid ${themeConfig.border}` } } }}
        >
          <MenuItem onClick={() => handleExport("pdf")} sx={{ fontSize: "0.88rem", fontWeight: 600 }}>
            PDF document
          </MenuItem>
          <MenuItem onClick={() => handleExport("xlsx")} sx={{ fontSize: "0.88rem", fontWeight: 600 }}>
            Excel workbook
          </MenuItem>
        </Menu>
      </Box>

      {/* Filters */}
      <Card sx={{ ...cardSx, mb: 2.5 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
          <Grid container spacing={2}>
            {selectField("Period", preset, (e) => changePreset(e.target.value), PRESETS, 2)}
            <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
              {fieldLabel("From")}
              <TextField fullWidth size="small" type="date" value={startDate} onChange={changeDate(setStartDate)} error={Boolean(rangeError)} sx={inputSx} />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, lg: 2 }}>
              {fieldLabel("To")}
              <TextField fullWidth size="small" type="date" value={endDate} onChange={changeDate(setEndDate)} error={Boolean(rangeError)} sx={inputSx} />
            </Grid>
            {selectField("Service", serviceType, changeFilter(setServiceType), SERVICE_OPTIONS, 2)}
            {selectField("Status", invoiceStatus, changeFilter(setInvoiceStatus), STATUS_OPTIONS, 2)}
            {selectField("GST rate", gstRate, changeFilter(setGstRate), RATE_OPTIONS, 2)}
          </Grid>
          {rangeError && (
            <Alert severity="warning" icon={false} sx={{ mt: 2, borderRadius: "10px" }}>
              {rangeError}
            </Alert>
          )}
        </CardContent>
      </Card>

      {result.error && !loading && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: "10px" }}>
          {result.error}
        </Alert>
      )}

      {/* Summary */}
      <Grid container spacing={2} sx={{ mb: 2.5 }}>
        {summary.map((item) => (
          <Grid key={item.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <Card sx={{ ...cardSx, height: "100%" }}>
              <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
                <Typography sx={{ color: themeConfig.textMuted, fontWeight: 700, fontSize: "0.78rem" }}>{item.label}</Typography>
                <Typography sx={{ color: themeConfig.textMain, fontWeight: 800, fontSize: "1.4rem", lineHeight: 1.3, mt: 0.5 }}>
                  {report ? item.value : "—"}
                </Typography>
                <Typography noWrap sx={{ color: themeConfig.textMuted, fontSize: "0.76rem", mt: 0.25 }}>
                  {report ? item.note : " "}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Invoices */}
      <Card sx={cardSx}>
        <TableContainer sx={{ opacity: loading && rows.length ? 0.55 : 1, transition: "opacity 0.2s ease" }}>
          <Table size="small" sx={{ minWidth: 1080 }}>
            <TableHead>
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col} align={numericColumns.includes(col) ? "right" : "left"} sx={headCellSx}>
                    {col}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length} align="center" sx={{ ...bodyCellSx, py: 6, color: themeConfig.textMuted }}>
                    {loading ? (
                      <CircularProgress size={26} sx={{ color: themeConfig.primary }} />
                    ) : rangeError ? (
                      "Choose a valid period to see invoices."
                    ) : (
                      "No invoices found for this period."
                    )}
                  </TableCell>
                </TableRow>
              )}
              {rows.map((row, index) => {
                const status = pick(row, "invoice_status");
                return (
                  <TableRow key={`${pick(row, "invoice_number")}-${pick(row, "service_type")}-${index}`} hover>
                    <TableCell sx={bodyCellSx}>{pick(row, "invoice_date")}</TableCell>
                    <TableCell sx={{ ...bodyCellSx, fontWeight: 700 }}>{pick(row, "invoice_number")}</TableCell>
                    <TableCell sx={{ ...bodyCellSx, maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{pick(row, "guest_name") || "—"}</TableCell>
                    <TableCell sx={bodyCellSx}>{SERVICE_LABELS[pick(row, "service_type")] || pick(row, "service_type")}</TableCell>
                    <TableCell align="right" sx={bodyCellSx}>{money(pick(row, "taxable_amount"))}</TableCell>
                    <TableCell align="right" sx={bodyCellSx}>{num(pick(row, "gst_rate"))}%</TableCell>
                    <TableCell align="right" sx={bodyCellSx}>{money(pick(row, "cgst_amount"))}</TableCell>
                    <TableCell align="right" sx={bodyCellSx}>{money(pick(row, "sgst_amount"))}</TableCell>
                    <TableCell align="right" sx={bodyCellSx}>{money(pick(row, "igst_amount"))}</TableCell>
                    <TableCell align="right" sx={{ ...bodyCellSx, fontWeight: 700 }}>{money(pick(row, "gst_total"))}</TableCell>
                    <TableCell align="right" sx={{ ...bodyCellSx, fontWeight: 700 }}>{money(pick(row, "invoice_total"))}</TableCell>
                    <TableCell sx={bodyCellSx}>
                      <Chip
                        size="small"
                        label={String(status || "").charAt(0) + String(status || "").slice(1).toLowerCase()}
                        sx={{ height: 22, fontWeight: 700, fontSize: "0.72rem", ...statusStyle(status) }}
                      />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
            {rows.length > 0 && (
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={4} sx={{ ...bodyCellSx, fontWeight: 800, bgcolor: themeConfig.champagne || "#EAF6F3", borderBottom: "none" }}>
                    Period total ({num(pick(totals, "total_invoices"))} invoices)
                  </TableCell>
                  {[
                    pick(totals, "total_taxable_value"),
                    null,
                    pick(totals, "total_cgst"),
                    pick(totals, "total_sgst"),
                    pick(totals, "total_igst"),
                    pick(totals, "total_gst"),
                    pick(totals, "total_stored_invoice"),
                  ].map((value, i) => (
                    <TableCell
                      key={i}
                      align="right"
                      sx={{ ...bodyCellSx, fontWeight: 800, bgcolor: themeConfig.champagne || "#EAF6F3", borderBottom: "none" }}
                    >
                      {value === null ? "" : money(value)}
                    </TableCell>
                  ))}
                  <TableCell sx={{ bgcolor: themeConfig.champagne || "#EAF6F3", borderBottom: "none" }} />
                </TableRow>
              </TableFooter>
            )}
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={totalRows}
          page={Math.min(page, Math.max(0, Math.ceil(totalRows / rowsPerPage) - 1))}
          onPageChange={(e, next) => setPage(next)}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(Number(e.target.value));
            setPage(0);
          }}
          rowsPerPageOptions={[10, 25, 50, 100]}
          sx={{ borderTop: `1px solid ${themeConfig.border}`, color: themeConfig.textMuted }}
        />
      </Card>
    </Box>
  );
}
