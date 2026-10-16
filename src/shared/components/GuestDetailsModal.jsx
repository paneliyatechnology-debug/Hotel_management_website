"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Chip,
  Paper,
  Grid,
  Tabs,
  Tab,
  Avatar,
} from "@mui/material";
import {
  Close,
  Person,
  Phone,
  Bed,
  CalendarToday,
  AccountBalanceWallet,
  Description,
  Draw,
  Payments,
  Hotel,
  LocationOn,
  Email,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";

function unwrapBooking(res) {
  if (!res || typeof res !== "object") return null;
  if (Array.isArray(res)) return null;
  const nested = res.data;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    if (nested.data && typeof nested.data === "object" && !Array.isArray(nested.data) && (nested.data.id || nested.data.booking_number || nested.data.images)) {
      return nested.data;
    }
    if (nested.id || nested.booking_number || nested.primary_guest_name || nested.images || nested.signatures) {
      return nested;
    }
  }
  if (res.id || res.booking_number || res.primary_guest_name || res.images) return res;
  if (Array.isArray(nested)) return res.booking || null;
  return nested || res;
}

function parseMaybeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value;
  if (typeof value === "string") {
    const t = value.trim();
    if (!t) return [];
    if ((t.startsWith("[") && t.endsWith("]")) || (t.startsWith("{") && t.endsWith("}"))) {
      try {
        const parsed = JSON.parse(t);
        if (Array.isArray(parsed)) return parsed;
        if (parsed && typeof parsed === "object") return Object.values(parsed);
      } catch {
        return [];
      }
    }
    if (t.includes(",")) return t.split(",").map((s) => s.trim()).filter(Boolean);
    return [t];
  }
  if (typeof value === "object") return Object.values(value);
  return [];
}

function toUrl(entry) {
  if (!entry) return "";
  if (typeof entry === "string") return entry.trim();
  return (
    entry.url ||
    entry.secure_url ||
    entry.path ||
    entry.src ||
    entry.image ||
    entry.image_url ||
    entry.imageUrl ||
    entry.file ||
    entry.file_url ||
    entry.signature ||
    ""
  );
}

function collectMedia(sources, fallbackLabel) {
  const seen = new Set();
  const items = [];
  sources.flatMap((source) => parseMaybeList(source)).forEach((entry, idx) => {
    const url = toUrl(entry);
    if (!url || seen.has(url)) return;
    seen.add(url);
    items.push({ url, label: mediaLabel(url, fallbackLabel, items.length || idx) });
  });
  return items;
}

function mediaLabel(url, fallback, index) {
  const name = String(url || "").split("?")[0].split("/").pop() || "";
  const lower = name.toLowerCase();
  if (lower.includes("front_id")) return "ID Front";
  if (lower.includes("back_id")) return "ID Back";
  const docMatch = lower.match(/id_doc[_-]?(\d+)/);
  if (docMatch) return `ID Document ${docMatch[1]}`;
  if (lower.includes("signature")) return `Signature ${index + 1}`;
  return `${fallback} ${index + 1}`;
}

function formatMoney(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return "₹0.00";
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function formatDate(value) {
  if (!value && value !== 0) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value && value !== 0) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function statusColor(status) {
  const s = String(status || "").toUpperCase();
  if (s.includes("CHECKED_IN") || s === "IN-HOUSE" || s === "PAID") return "success";
  if (s.includes("CHECKED_OUT") || s === "DEPARTED") return "default";
  if (s.includes("PARTIAL") || s.includes("DUE") || s.includes("PENDING")) return "warning";
  if (s.includes("CANCEL")) return "error";
  return "info";
}

function InfoField({ label, value, themeConfig, accent }) {
  return (
    <Box>
      <Typography
        variant="caption"
        sx={{ color: themeConfig?.textMuted, fontWeight: 700, letterSpacing: 0.4, display: "block" }}
      >
        {label}
      </Typography>
      <Typography
        variant="body2"
        sx={{ fontWeight: 800, color: accent || themeConfig?.textMain, mt: 0.25, wordBreak: "break-word" }}
      >
        {value || "—"}
      </Typography>
    </Box>
  );
}

function EmptyState({ text, themeConfig }) {
  return (
    <Box sx={{ py: 4, textAlign: "center" }}>
      <Typography variant="body2" sx={{ color: themeConfig?.textMuted, fontWeight: 600 }}>
        {text}
      </Typography>
    </Box>
  );
}

function MediaGrid({ items, fallbackLabel, themeConfig, onPreview }) {
  if (!items.length) {
    return <EmptyState text={`No ${fallbackLabel.toLowerCase()} attached.`} themeConfig={themeConfig} />;
  }
  return (
    <Grid container spacing={1.5}>
      {items.map((item, idx) => (
        <Grid key={`${item.url}-${idx}`} size={{ xs: 6, sm: 4, md: 3 }}>
          <Paper
            elevation={0}
            onClick={() => onPreview(item)}
            sx={{
              overflow: "hidden",
              borderRadius: "12px",
              border: `1px solid ${themeConfig?.border || "#E2E8F0"}`,
              cursor: "pointer",
              bgcolor: themeConfig?.bgCard,
              "&:hover": { boxShadow: "0 8px 20px rgba(0,0,0,0.12)" },
            }}
          >
            <Box
              component="img"
              src={item.url}
              alt={item.label}
              onError={(e) => {
                e.currentTarget.style.opacity = "0.25";
              }}
              sx={{ width: "100%", height: 110, objectFit: "cover", display: "block", bgcolor: "#0F172A" }}
            />
            <Typography variant="caption" sx={{ display: "block", px: 1, py: 0.75, fontWeight: 700, color: themeConfig?.textMain }}>
              {item.label}
            </Typography>
          </Paper>
        </Grid>
      ))}
    </Grid>
  );
}

export default function GuestDetailsModal({
  open = false,
  onClose,
  guestId,
  guestData = null,
  hotelSettings = null,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const mutedCard = isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC";

  const [loading, setLoading] = useState(false);
  const [apiData, setApiData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState("overview");
  const [preview, setPreview] = useState(null);

  const resolvedId = useMemo(() => {
    return (
      guestId ||
      guestData?._id ||
      guestData?.id ||
      guestData?.bookingId ||
      guestData?.booking_id ||
      guestData?.guest?._id ||
      guestData?.guest?.id ||
      ""
    );
  }, [guestId, guestData]);

  useEffect(() => {
    if (!open) {
      setApiData(null);
      setError(null);
      setTab("overview");
      setPreview(null);
      return;
    }

    if (!resolvedId) {
      setApiData(guestData);
      setError(null);
      return;
    }

    let cancelled = false;
    const fetchBooking = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint =
          (typeof API_ENDPOINTS.BOOKINGS?.BY_ID === "function" && API_ENDPOINTS.BOOKINGS.BY_ID(resolvedId)) ||
          (typeof API_ENDPOINTS.RECEPTIONIST?.GUEST_BY_ID === "function" && API_ENDPOINTS.RECEPTIONIST.GUEST_BY_ID(resolvedId)) ||
          `${API_ENDPOINTS.BOOKINGS?.ALL || `${String(API_ENDPOINTS.API_BASE_URL || "")}/api/v1/bookings`}/${resolvedId}`;

        const res = await apiRequest(endpoint, { forceRefresh: true });
        const booking = unwrapBooking(res);
        if (!cancelled) {
          if (booking && typeof booking === "object" && !Array.isArray(booking)) {
            setApiData(booking);
          } else {
            setApiData(guestData || null);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err?.message || "Failed to load booking details");
          setApiData(guestData);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchBooking();
    return () => {
      cancelled = true;
    };
  }, [open, resolvedId, guestData]);

  const booking = apiData || guestData || {};
  const guestObj = booking.guest || booking.guestData || {};

  const name =
    booking.primary_guest_name ||
    guestObj.name ||
    guestObj.fullName ||
    booking.guestName ||
    guestData?.name ||
    "Guest";

  const secondaryName = booking.secondary_guest_name || guestObj.secondaryName || "";
  const phone = booking.mobile_number || guestObj.phone || guestObj.mobileNumber || booking.phone || guestData?.phone || "—";
  const email = booking.email || guestObj.email || guestData?.email || "—";
  const address = booking.address || guestObj.address || "—";
  const bookingNumber = booking.booking_number || booking.bookingNumber || "—";
  const stayStatus = booking.booking_status || booking.status || guestData?.status || "—";
  const payStatus = booking.payment_status || "—";

  const rooms = Array.isArray(booking.rooms) ? booking.rooms : [];
  const roomLabel =
    rooms.map((r) => r.room_number || r.roomNumber).filter(Boolean).join(", ") ||
    booking.roomNumber ||
    booking.roomAssigned ||
    guestData?.roomAssigned ||
    "—";

  const images = collectMedia(
    [
      booking.images,
      booking.id_images,
      booking.idImages,
      booking.front_image,
      booking.frontImage,
      booking.back_image,
      booking.backImage,
      booking.id_proof_image,
      booking.idProofImage,
      guestObj.frontImage,
      guestObj.backImage,
      guestObj.idProof?.frontImage,
      guestObj.idProof?.backImage,
      guestData?.images,
      guestData?.raw?.images,
    ],
    "Document"
  );

  const signatures = collectMedia(
    [
      booking.signatures,
      booking.signature,
      booking.guest_signature,
      booking.guestSignature,
      guestObj.signature,
      guestData?.signatures,
      guestData?.raw?.signatures,
    ],
    "Signature"
  );

  const payments = Array.isArray(booking.payment_history) ? booking.payment_history : booking.paymentHistory || [];
  const notes = (booking.notes || "").trim();

  const dueAmount = Number(booking.due_amount ?? booking.dueAmount ?? 0);

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "18px",
              border: `1px solid ${themeConfig?.border || "#E2E8F0"}`,
              bgcolor: themeConfig?.bgCard || (isDarkMode ? "#0F172A" : "#FFFFFF"),
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
              overflow: "hidden",
              maxHeight: "92vh",
            },
          },
        }}
      >
        <DialogTitle
          sx={{
            m: 0,
            p: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            bgcolor: mutedCard,
            borderBottom: `1px solid ${themeConfig?.border || "#E2E8F0"}`,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: themeConfig?.primary || "#0B8EE0", fontWeight: 800 }}>
              {String(name).charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ fontWeight: 800, fontSize: "1.05rem" }}>
                  Guest Details
                </Typography>
                <Chip label={stayStatus} size="small" color={statusColor(stayStatus)} sx={{ fontWeight: 800, fontSize: "0.68rem", height: 22 }} />
                <Chip label={payStatus} size="small" color={statusColor(payStatus)} variant="outlined" sx={{ fontWeight: 800, fontSize: "0.68rem", height: 22 }} />
              </Box>
              <Typography variant="caption" sx={{ color: themeConfig?.textMuted, fontWeight: 700 }}>
                {bookingNumber} · Room {roomLabel}
              </Typography>
            </Box>
          </Box>
          <IconButton aria-label="close" onClick={onClose} size="small" sx={{ color: themeConfig?.textMuted || "#64748B" }}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <Box sx={{ px: 1, borderBottom: `1px solid ${themeConfig?.border || "#E2E8F0"}` }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 44,
              "& .MuiTab-root": {
                minHeight: 44,
                textTransform: "none",
                fontWeight: 800,
                fontSize: "0.82rem",
                color: themeConfig?.textMuted,
              },
              "& .Mui-selected": { color: `${themeConfig?.primary || "#0B8EE0"} !important` },
              "& .MuiTabs-indicator": { bgcolor: themeConfig?.primary || "#0B8EE0" },
            }}
          >
            <Tab value="overview" icon={<Person sx={{ fontSize: 16 }} />} iconPosition="start" label="Overview" />
            <Tab value="stay" icon={<Bed sx={{ fontSize: 16 }} />} iconPosition="start" label="Stay" />
            <Tab value="billing" icon={<AccountBalanceWallet sx={{ fontSize: 16 }} />} iconPosition="start" label="Billing" />
            <Tab value="payments" icon={<Payments sx={{ fontSize: 16 }} />} iconPosition="start" label={`Payments (${payments.length})`} />
            <Tab value="documents" icon={<Description sx={{ fontSize: 16 }} />} iconPosition="start" label={`Documents (${images.length + signatures.length})`} />
            <Tab value="notes" icon={<Draw sx={{ fontSize: 16 }} />} iconPosition="start" label="Notes" />
          </Tabs>
        </Box>

        <DialogContent sx={{ p: 2.5 }}>
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 6, gap: 1.5 }}>
              <CircularProgress size={36} sx={{ color: themeConfig?.primary || "#0B8EE0" }} />
              <Typography variant="body2" sx={{ color: themeConfig?.textMuted, fontWeight: 600 }}>
                Loading booking details...
              </Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {error && (
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "10px",
                    bgcolor: "rgba(239, 68, 68, 0.1)",
                    border: "1px solid rgba(239, 68, 68, 0.3)",
                    color: "#EF4444",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                  }}
                >
                  {error}. Showing available local details.
                </Box>
              )}

              {tab === "overview" && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${themeConfig?.border || "#E2E8F0"}`, bgcolor: mutedCard }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoField label="FULL NAME" value={name} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoField label="SECONDARY GUEST" value={secondaryName || "—"} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
                        <Phone sx={{ fontSize: 16, mt: 1.6, color: themeConfig?.textMuted }} />
                        <InfoField label="MOBILE" value={phone} themeConfig={themeConfig} />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
                        <Email sx={{ fontSize: 16, mt: 1.6, color: themeConfig?.textMuted }} />
                        <InfoField label="EMAIL" value={email} themeConfig={themeConfig} />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
                        <LocationOn sx={{ fontSize: 16, mt: 1.6, color: themeConfig?.textMuted }} />
                        <InfoField label="ADDRESS" value={address} themeConfig={themeConfig} />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoField label="BOOKING NO." value={bookingNumber} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
                        <Hotel sx={{ fontSize: 16, mt: 1.6, color: themeConfig?.textMuted }} />
                        <InfoField label="HOTEL" value={booking.hotel?.name || hotelSettings?.name || "—"} themeConfig={themeConfig} />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoField label="CREATED BY" value={booking.creator?.name ? `${booking.creator.name} (${booking.creator.role || "STAFF"})` : "—"} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoField label="CREATED AT" value={formatDateTime(booking.created_at || booking.createdAt)} themeConfig={themeConfig} />
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {tab === "stay" && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${themeConfig?.border || "#E2E8F0"}`, bgcolor: mutedCard }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75 }}>
                        <CalendarToday sx={{ fontSize: 16, mt: 1.6, color: themeConfig?.textMuted }} />
                        <InfoField label="CHECK-IN" value={formatDate(booking.check_in_date || booking.checkInDate)} themeConfig={themeConfig} />
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoField label="CHECK-OUT" value={formatDate(booking.check_out_date || booking.checkOutDate)} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoField label="ACTUAL CHECK-IN" value={formatDateTime(booking.actual_check_in)} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <InfoField label="ACTUAL CHECK-OUT" value={formatDateTime(booking.actual_check_out)} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <InfoField label="NIGHTS" value={booking.number_of_nights ?? "—"} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <InfoField label="ADULTS" value={booking.adults ?? "—"} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <InfoField label="CHILDREN" value={booking.children ?? 0} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 3 }}>
                      <InfoField label="LATE HOURS" value={booking.late_checkout_hours ?? 0} themeConfig={themeConfig} />
                    </Grid>
                  </Grid>

                  <Typography variant="caption" sx={{ display: "block", mt: 2.5, mb: 1, fontWeight: 800, color: themeConfig?.textMuted }}>
                    ASSIGNED ROOMS
                  </Typography>
                  {rooms.length === 0 ? (
                    <Typography variant="body2" sx={{ fontWeight: 700 }}>Room {roomLabel}</Typography>
                  ) : (
                    <Grid container spacing={1.2}>
                      {rooms.map((room) => (
                        <Grid key={room.id || room.room_number} size={{ xs: 12, sm: 6 }}>
                          <Box sx={{ p: 1.4, borderRadius: "10px", border: `1px solid ${themeConfig?.border || "#E2E8F0"}`, bgcolor: themeConfig?.bgCard || "#fff" }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig?.primary || "#0B8EE0" }}>
                              Room {room.room_number || room.roomNumber}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig?.textMuted, fontWeight: 700, display: "block" }}>
                              {room.room_type_name || room.roomTypeName || "Room"} · Floor {room.floor ?? "—"}
                            </Typography>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  )}
                </Paper>
              )}

              {tab === "billing" && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${themeConfig?.border || "#E2E8F0"}`, bgcolor: mutedCard }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <InfoField label="BASE" value={formatMoney(booking.base_amount ?? booking.baseAmount)} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <InfoField label="TAXABLE" value={formatMoney(booking.taxable_amount)} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <InfoField label="DISCOUNT" value={formatMoney(booking.discount_amount)} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <InfoField label={`GST (${booking.gst_rate ?? 0}%)`} value={formatMoney(booking.gst_amount ?? booking.tax_amount)} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <InfoField label={`CGST (${booking.cgst_rate ?? 0}%)`} value={formatMoney(booking.cgst_amount)} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <InfoField label={`SGST (${booking.sgst_rate ?? 0}%)`} value={formatMoney(booking.sgst_amount)} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <InfoField label="EXTRA CHARGES" value={formatMoney(booking.extra_charges_total)} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <InfoField label="LATE CHECKOUT" value={formatMoney(booking.late_checkout_charge)} themeConfig={themeConfig} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <InfoField label="TOTAL" value={formatMoney(booking.total_amount ?? booking.totalAmount)} themeConfig={themeConfig} accent={themeConfig?.primary || "#0B8EE0"} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <InfoField label="PAID" value={formatMoney(booking.paid_amount ?? booking.paidAmount)} themeConfig={themeConfig} accent="#10B981" />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <InfoField
                        label="DUE"
                        value={formatMoney(dueAmount)}
                        themeConfig={themeConfig}
                        accent={dueAmount > 0 ? "#EF4444" : "#10B981"}
                      />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 4 }}>
                      <InfoField label="PAYMENT STATUS" value={payStatus} themeConfig={themeConfig} />
                    </Grid>
                  </Grid>
                </Paper>
              )}

              {tab === "payments" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1.2 }}>
                  {payments.length === 0 ? (
                    <EmptyState text="No payment history for this booking." themeConfig={themeConfig} />
                  ) : (
                    payments.map((p) => (
                      <Paper
                        key={p.id || `${p.received_at}-${p.amount}`}
                        elevation={0}
                        sx={{ p: 1.6, borderRadius: "12px", border: `1px solid ${themeConfig?.border || "#E2E8F0"}`, bgcolor: mutedCard }}
                      >
                        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, flexWrap: "wrap" }}>
                          <Box>
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              {formatMoney(p.amount)} · {p.payment_method || "—"}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig?.textMuted, fontWeight: 700 }}>
                              {p.source || "PAYMENT"} · {p.received_by?.name || "Staff"} · {formatDateTime(p.received_at)}
                            </Typography>
                          </Box>
                          <Chip label={p.status || "—"} size="small" color={statusColor(p.status)} sx={{ fontWeight: 800, fontSize: "0.7rem" }} />
                        </Box>
                      </Paper>
                    ))
                  )}
                </Box>
              )}

              {tab === "documents" && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig?.textMuted, display: "block", mb: 1 }}>
                      ID PHOTOS ({images.length})
                    </Typography>
                    <MediaGrid items={images} fallbackLabel="ID photos" themeConfig={themeConfig} onPreview={setPreview} />
                  </Box>
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig?.textMuted, display: "block", mb: 1 }}>
                      SIGNATURES ({signatures.length})
                    </Typography>
                    <MediaGrid items={signatures} fallbackLabel="Signatures" themeConfig={themeConfig} onPreview={setPreview} />
                  </Box>
                </Box>
              )}

              {tab === "notes" && (
                <Paper elevation={0} sx={{ p: 2, borderRadius: "12px", border: `1px solid ${themeConfig?.border || "#E2E8F0"}`, bgcolor: mutedCard }}>
                  {notes ? (
                    <Typography variant="body2" sx={{ fontWeight: 600, whiteSpace: "pre-wrap", color: themeConfig?.textMain, lineHeight: 1.7 }}>
                      {notes}
                    </Typography>
                  ) : (
                    <EmptyState text="No notes recorded for this booking." themeConfig={themeConfig} />
                  )}
                  <Typography variant="caption" sx={{ display: "block", mt: 2, color: themeConfig?.textMuted, fontWeight: 700 }}>
                    Last updated {formatDateTime(booking.updated_at)}
                  </Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 1.5,
            borderTop: `1px solid ${themeConfig?.border || "#E2E8F0"}`,
            bgcolor: mutedCard,
          }}
        >
          <Button
            onClick={onClose}
            variant="contained"
            sx={{
              borderRadius: "10px",
              fontWeight: 800,
              bgcolor: themeConfig?.primary || "#0B8EE0",
              px: 3,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(preview?.url)}
        onClose={() => setPreview(null)}
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: "16px", p: 1.5, bgcolor: "#0F172A" } } }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#F8FAFC" }}>
            {preview?.label || "Preview"}
          </Typography>
          <IconButton size="small" onClick={() => setPreview(null)} sx={{ color: "#FFF" }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
        {preview?.url && (
          <Box
            component="img"
            src={preview.url}
            alt={preview.label}
            sx={{ width: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: "10px" }}
          />
        )}
      </Dialog>
    </>
  );
}
