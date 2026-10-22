"use client";

import { useState } from "react";
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import { CalendarMonth, Close } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";

/**
 * Period selector shared by the dashboards: a summary of the selected period, a segmented
 * range switcher and a popup for choosing custom start / end dates.
 *
 *   <PeriodRangeFilter
 *     value={filterType}                 // TODAY | THIS_WEEK | LAST_WEEK | THIS_MONTH | LAST_MONTH | CUSTOM
 *     onChange={setFilterType}           // called for the preset ranges
 *     start={startDate} end={endDate}    // yyyy-mm-dd, used when value === "CUSTOM"
 *     onApplyCustom={(start, end) => {}} // called when "Apply range" is pressed (parent should also set value to CUSTOM)
 *     eyebrow="Period"                   // small uppercase caption
 *     leading={<IconButton/>}            // optional element before the calendar badge (e.g. a back button)
 *   />
 */

const DEFAULT_RANGES = [
  { id: "TODAY", label: "Today" },
  { id: "THIS_WEEK", label: "This Week" },
  { id: "LAST_WEEK", label: "Last Week" },
  { id: "THIS_MONTH", label: "This Month" },
  { id: "LAST_MONTH", label: "Last Month" },
  { id: "CUSTOM", label: "Custom" },
];

const pad = (n) => String(n).padStart(2, "0");
const toYmd = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
const parseYmd = (value) => {
  const [y, m, d] = String(value).split("-").map(Number);
  return new Date(y, m - 1, d);
};
const fmtLong = (value) => parseYmd(value).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

const daysAgo = (n) => {
  const now = new Date();
  return toYmd(new Date(now.getFullYear(), now.getMonth(), now.getDate() - n));
};

const QUICK_RANGES = [
  { label: "Today", getRange: () => ({ start: daysAgo(0), end: daysAgo(0) }) },
  { label: "Last 7 days", getRange: () => ({ start: daysAgo(6), end: daysAgo(0) }) },
  { label: "Last 30 days", getRange: () => ({ start: daysAgo(29), end: daysAgo(0) }) },
  { label: "Last 90 days", getRange: () => ({ start: daysAgo(89), end: daysAgo(0) }) },
  { label: "This year", getRange: () => ({ start: toYmd(new Date(new Date().getFullYear(), 0, 1)), end: daysAgo(0) }) },
];

// Readable dates for the active period, e.g. "13 Oct – 19 Oct 2026"
function describeRange(value, start, end) {
  const now = new Date();
  let from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  let to = from;
  if (value === "THIS_WEEK" || value === "LAST_WEEK") {
    const day = now.getDay();
    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - (day === 0 ? 6 : day - 1) - (value === "LAST_WEEK" ? 7 : 0));
    to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 6);
  } else if (value === "THIS_MONTH" || value === "LAST_MONTH") {
    from = new Date(now.getFullYear(), now.getMonth() - (value === "LAST_MONTH" ? 1 : 0), 1);
    to = new Date(from.getFullYear(), from.getMonth() + 1, 0);
  } else if (value === "CUSTOM") {
    if (!start || !end) return "Select start and end dates";
    from = parseYmd(start);
    to = parseYmd(end);
  }
  const short = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  const long = (d) => d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  if (from.getTime() === to.getTime()) return long(from);
  return from.getFullYear() === to.getFullYear() ? `${short(from)} – ${long(to)}` : `${long(from)} – ${long(to)}`;
}

export default function PeriodRangeFilter({
  value,
  onChange,
  start = "",
  end = "",
  onApplyCustom,
  ranges = DEFAULT_RANGES,
  eyebrow = "Period",
  leading = null,
  sx,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [draftStart, setDraftStart] = useState("");
  const [draftEnd, setDraftEnd] = useState("");

  const label = ranges.find((r) => r.id === value)?.label || "Today";
  const draftReady = Boolean(draftStart && draftEnd);
  const draftInvalid = draftReady && draftStart > draftEnd;
  const draftDays = draftReady && !draftInvalid
    ? Math.round((parseYmd(draftEnd).getTime() - parseYmd(draftStart).getTime()) / 86400000) + 1
    : 0;

  const openDialog = () => {
    const today = toYmd(new Date());
    setDraftStart(value === "CUSTOM" && start ? start : today);
    setDraftEnd(value === "CUSTOM" && end ? end : today);
    setDialogOpen(true);
  };

  const apply = () => {
    if (!draftReady || draftInvalid) return;
    onApplyCustom?.(draftStart, draftEnd);
    setDialogOpen(false);
  };

  return (
    <>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: "16px",
          border: `1px solid ${themeConfig.border}`,
          bgcolor: themeConfig.bgCard || "#FFFFFF",
          ...sx,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
          {/* Selected period summary */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            {leading}
            <Box sx={{ width: 40, height: 40, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, bgcolor: themeConfig.champagne, color: themeConfig.primary }}>
              <CalendarMonth sx={{ fontSize: 22 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1.3 }}>
                {eyebrow}
              </Typography>
              <Typography sx={{ color: themeConfig.textMain, fontSize: "0.98rem", fontWeight: 800, lineHeight: 1.3 }}>
                {label}
                <Box component="span" sx={{ ml: 1, color: themeConfig.textMuted, fontSize: "0.82rem", fontWeight: 600 }}>
                  {describeRange(value, start, end)}
                </Box>
                {value === "CUSTOM" && (
                  <Box
                    component="button"
                    type="button"
                    onClick={openDialog}
                    sx={{ ml: 1, p: 0, border: 0, bgcolor: "transparent", cursor: "pointer", color: themeConfig.primary, fontSize: "0.8rem", fontWeight: 800, fontFamily: "inherit", textDecoration: "underline", textUnderlineOffset: "3px" }}
                  >
                    Change
                  </Box>
                )}
              </Typography>
            </Box>
          </Box>

          {/* Range switcher */}
          <Box
            role="tablist"
            aria-label="Select period"
            sx={{
              display: "inline-flex",
              gap: 0.5,
              p: 0.5,
              maxWidth: "100%",
              overflowX: "auto",
              borderRadius: "12px",
              bgcolor: themeConfig.bgSubtle,
              border: `1px solid ${themeConfig.border}`,
              scrollbarWidth: "none",
              "&::-webkit-scrollbar": { display: "none" },
            }}
          >
            {ranges.map((range) => {
              const active = value === range.id;
              return (
                <Button
                  key={range.id}
                  role="tab"
                  aria-selected={active}
                  disableElevation
                  onClick={() => (range.id === "CUSTOM" ? openDialog() : onChange?.(range.id))}
                  sx={{
                    flexShrink: 0,
                    minWidth: 0,
                    height: 34,
                    px: 1.75,
                    borderRadius: "9px",
                    textTransform: "none",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    bgcolor: active ? themeConfig.primary : "transparent",
                    color: active ? themeConfig.onPrimary : themeConfig.textMuted,
                    "&:hover": { bgcolor: active ? themeConfig.primaryDark || themeConfig.primary : themeConfig.champagne, color: active ? themeConfig.onPrimary : themeConfig.textMain },
                  }}
                >
                  {range.label}
                </Button>
              );
            })}
          </Box>
        </Box>
      </Paper>

      {/* Custom date range popup */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              bgcolor: themeConfig.bgCard || "#FFFFFF",
              border: `1.5px solid ${themeConfig.border}`,
              boxShadow: isDarkMode ? "0 20px 60px rgba(0,0,0,0.6)" : "0 20px 60px rgba(12,39,59,0.15)",
              overflow: "hidden",
              m: 2,
            },
          },
        }}
      >
        <DialogTitle
          component="div"
          sx={{ p: 2.5, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1.5, bgcolor: themeConfig.bgSoft, borderBottom: `1px solid ${themeConfig.border}` }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
            <Box sx={{ width: 42, height: 42, borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, bgcolor: themeConfig.bgCard, border: `1px solid ${themeConfig.border}`, color: themeConfig.primary }}>
              <CalendarMonth sx={{ fontSize: 22 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ color: themeConfig.accent, fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", lineHeight: 1.3 }}>
                Custom range
              </Typography>
              <Typography sx={{ color: themeConfig.textMain, fontSize: "1.1rem", fontWeight: 800, lineHeight: 1.3 }}>Select dates</Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setDialogOpen(false)}
            aria-label="Close"
            sx={{ width: 36, height: 36, borderRadius: "10px", border: `1px solid ${themeConfig.border}`, bgcolor: themeConfig.bgCard, color: themeConfig.textMain }}
          >
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2.5, pt: "20px !important" }}>
          <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.75rem", fontWeight: 700, mb: 1 }}>Quick select</Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 2.5 }}>
            {QUICK_RANGES.map((quick) => {
              const range = quick.getRange();
              const active = draftStart === range.start && draftEnd === range.end;
              return (
                <Button
                  key={quick.label}
                  disableElevation
                  onClick={() => {
                    setDraftStart(range.start);
                    setDraftEnd(range.end);
                  }}
                  sx={{
                    minWidth: 0,
                    height: 32,
                    px: 1.5,
                    borderRadius: "999px",
                    textTransform: "none",
                    fontSize: "0.78rem",
                    fontWeight: 700,
                    color: active ? themeConfig.onPrimary : themeConfig.textMain,
                    bgcolor: active ? themeConfig.primary : "transparent",
                    border: `1px solid ${active ? themeConfig.primary : themeConfig.border}`,
                    "&:hover": { bgcolor: active ? themeConfig.primaryDark || themeConfig.primary : themeConfig.champagne },
                  }}
                >
                  {quick.label}
                </Button>
              );
            })}
          </Box>

          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
            {[
              { label: "Start date", value: draftStart, onChange: setDraftStart, max: draftEnd || undefined },
              { label: "End date", value: draftEnd, onChange: setDraftEnd, min: draftStart || undefined },
            ].map((field) => (
              <Box key={field.label}>
                <Typography component="label" htmlFor={`range-${field.label}`} sx={{ display: "block", mb: 0.75, color: themeConfig.textMuted, fontSize: "0.75rem", fontWeight: 700 }}>
                  {field.label} <Box component="span" sx={{ color: "#DC2626" }}>*</Box>
                </Typography>
                <TextField
                  id={`range-${field.label}`}
                  fullWidth
                  size="small"
                  type="date"
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  onClick={(e) => {
                    try {
                      e.target.showPicker?.();
                    } catch {
                      /* showPicker is not available everywhere */
                    }
                  }}
                  slotProps={{ htmlInput: { min: field.min, max: field.max } }}
                  sx={{
                    "& .MuiOutlinedInput-root": { height: 44, borderRadius: "10px", bgcolor: themeConfig.bgMain, fontSize: "0.88rem", fontWeight: 600, color: themeConfig.textMain },
                    "& input": { cursor: "pointer" },
                    "& input::-webkit-calendar-picker-indicator": { cursor: "pointer", opacity: 0.6, filter: isDarkMode ? "invert(1)" : "none" },
                  }}
                />
              </Box>
            ))}
          </Box>

          <Box
            sx={{
              mt: 2.5,
              px: 2,
              py: 1.5,
              borderRadius: "12px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 1.5,
              bgcolor: draftInvalid ? themeConfig.tones.danger.bg : themeConfig.bgSoft,
              border: `1px solid ${draftInvalid ? themeConfig.tones.danger.border : themeConfig.border}`,
            }}
          >
            {draftInvalid ? (
              <Typography sx={{ color: themeConfig.tones.danger.color, fontSize: "0.82rem", fontWeight: 700 }}>End date must be on or after the start date.</Typography>
            ) : draftReady ? (
              <>
                <Typography sx={{ color: themeConfig.textMain, fontSize: "0.88rem", fontWeight: 800 }}>
                  {fmtLong(draftStart)}
                  <Box component="span" sx={{ mx: 1, color: themeConfig.textMuted }}>→</Box>
                  {fmtLong(draftEnd)}
                </Typography>
                <Chip
                  size="small"
                  label={`${draftDays} ${draftDays === 1 ? "day" : "days"}`}
                  sx={{ fontWeight: 800, borderRadius: "999px", bgcolor: themeConfig.bgCard, color: themeConfig.accent, border: `1px solid ${themeConfig.border}` }}
                />
              </>
            ) : (
              <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.82rem", fontWeight: 600 }}>Choose a start and end date to continue.</Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 2, gap: 1, borderTop: `1px solid ${themeConfig.border}` }}>
          <Button
            onClick={() => setDialogOpen(false)}
            sx={{ height: 42, px: 2.5, borderRadius: "10px", textTransform: "none", fontWeight: 700, color: themeConfig.textMain, border: `1px solid ${themeConfig.border}` }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            disableElevation
            disabled={!draftReady || draftInvalid}
            onClick={apply}
            sx={{ height: 42, px: 3, borderRadius: "10px", textTransform: "none", fontWeight: 800, bgcolor: themeConfig.primary, color: themeConfig.onPrimary, "&:hover": { bgcolor: themeConfig.primaryDark || themeConfig.primary } }}
          >
            Apply range
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
