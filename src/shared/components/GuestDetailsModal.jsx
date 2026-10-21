"use client";

import React, { useMemo, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  Button,
  IconButton,
  CircularProgress,
  Tabs,
  Tab,
  Avatar,
} from "@mui/material";
import { Close, Hotel } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import {
  dialogPaperSx,
  dialogPrimaryButtonSx,
  AppDialogHeader,
  AppDialogFooter,
} from "@/shared/components/AppDialog";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { computeBookingBill } from "@/shared/utils/billingUtils";

/* ------------------------------------------------------------------ */
/* Data helpers                                                        */
/* ------------------------------------------------------------------ */

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

function mediaLabel(url, fallback, index) {
  const name = String(url || "").split("?")[0].split("/").pop() || "";
  const lower = name.toLowerCase();
  if (lower.includes("front_id")) return "ID front";
  if (lower.includes("back_id")) return "ID back";
  const docMatch = lower.match(/id_doc[_-]?(\d+)/);
  if (docMatch) return `ID document ${docMatch[1]}`;
  return `${fallback} ${index + 1}`;
}

function collectMedia(sources, fallbackLabel) {
  const seen = new Set();
  const items = [];
  sources.flatMap((source) => parseMaybeList(source)).forEach((entry) => {
    const url = toUrl(entry);
    if (!url || seen.has(url)) return;
    seen.add(url);
    items.push({ url, label: mediaLabel(url, fallbackLabel, items.length) });
  });
  return items;
}

/* ------------------------------------------------------------------ */
/* Formatting                                                          */
/* ------------------------------------------------------------------ */

function num(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function formatMoney(value) {
  return `₹${num(value).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
}

function humanize(value) {
  const s = String(value || "").replace(/[_-]+/g, " ").trim().toLowerCase();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "—";
}

const DATE_TIME_OPTS = { day: "2-digit", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", hour12: true };

// Real moments in time (actual check-in/out, payments, created at) -> viewer's local time
function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", DATE_TIME_OPTS);
}

// Scheduled stay times are saved as hotel wall-clock values (e.g. 14:00Z = 2:00 PM) -> show them as saved
function formatScheduled(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", { ...DATE_TIME_OPTS, timeZone: "UTC" });
}

const TONES = {
  success: { bg: "#ECFDF5", color: "#047857", border: "#A7F3D0" },
  warning: { bg: "#FFFBEB", color: "#B45309", border: "#FDE68A" },
  danger: { bg: "#FEF2F2", color: "#B42318", border: "#FECACA" },
  neutral: { bg: "#F1F5F9", color: "#475569", border: "#E2E8F0" },
  info: { bg: "#F0FDFA", color: "#0F766E", border: "#99F6E4" },
};

function statusTone(status) {
  const s = String(status || "").toUpperCase();
  if (s.includes("CANCEL") || s.includes("FAIL") || s.includes("REFUND")) return "danger";
  if (s.includes("PARTIAL") || s.includes("PENDING") || s.includes("DUE") || s.includes("UNPAID")) return "warning";
  if (s.includes("CHECKED_OUT") || s === "DEPARTED") return "neutral";
  if (s.includes("CHECKED_IN") || s === "IN-HOUSE" || s === "PAID" || s === "SUCCESS") return "success";
  return "info";
}

function Pill({ label, tone }) {
  const t = TONES[tone] || TONES.info;
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        height: 24,
        px: 1.25,
        borderRadius: "999px",
        fontSize: "0.72rem",
        fontWeight: 600,
        whiteSpace: "nowrap",
        bgcolor: t.bg,
        color: t.color,
        border: `1px solid ${t.border}`,
      }}
    >
      {label}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function Section({ title, children, themeConfig }) {
  return (
    <Box>
      <Typography
        sx={{
          fontWeight: 700,
          fontSize: "0.85rem",
          color: themeConfig.textMain,
          pb: 1,
          mb: 2,
          borderBottom: `1px solid ${themeConfig.border}`,
        }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Field({ label, value, themeConfig, accent }) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.74rem", fontWeight: 600, mb: 0.25 }}>{label}</Typography>
      <Typography sx={{ color: accent || themeConfig.textMain, fontSize: "0.9rem", fontWeight: 600, wordBreak: "break-word" }}>
        {value || "—"}
      </Typography>
    </Box>
  );
}

function FieldGrid({ children, columns = 2 }) {
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: `repeat(${columns}, 1fr)` }, gap: 2.5 }}>{children}</Box>
  );
}

function EmptyNote({ text, themeConfig }) {
  return (
    <Box sx={{ py: 5, textAlign: "center" }}>
      <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.88rem", fontWeight: 500 }}>{text}</Typography>
    </Box>
  );
}

function MediaGrid({ items, emptyText, themeConfig, onPreview }) {
  if (!items.length) return <EmptyNote text={emptyText} themeConfig={themeConfig} />;
  return (
    <Box sx={{ display: "grid", gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" }, gap: 1.5 }}>
      {items.map((item, idx) => (
        <Box
          key={`${item.url}-${idx}`}
          onClick={() => onPreview(item)}
          sx={{
            overflow: "hidden",
            borderRadius: "12px",
            border: `1px solid ${themeConfig.border}`,
            cursor: "pointer",
            bgcolor: "#FFFFFF",
            transition: "border-color 120ms ease, box-shadow 120ms ease",
            "&:hover": { borderColor: "#99D5C9", boxShadow: "0 6px 16px rgba(15,23,42,0.08)" },
          }}
        >
          <Box
            component="img"
            src={item.url}
            alt={item.label}
            onError={(e) => {
              e.currentTarget.style.opacity = "0.25";
            }}
            sx={{ width: "100%", height: 104, objectFit: "cover", display: "block", bgcolor: "#F1F5F9" }}
          />
          <Typography sx={{ px: 1.25, py: 0.9, fontSize: "0.76rem", fontWeight: 600, color: themeConfig.textMain }}>{item.label}</Typography>
        </Box>
      ))}
    </Box>
  );
}

/* ------------------------------------------------------------------ */
/* Component                                                           */
/* ------------------------------------------------------------------ */

export default function GuestDetailsModal({
  open = false,
  onClose,
  guestId,
  guestData = null,
  hotelSettings = null,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();

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

  const name = booking.primary_guest_name || guestObj.name || guestObj.fullName || booking.guestName || guestData?.name || "Guest";
  const secondaryName = booking.secondary_guest_name || guestObj.secondaryName || "";
  const phone = booking.mobile_number || guestObj.phone || guestObj.mobileNumber || booking.phone || guestData?.phone || "";
  const email = booking.email || guestObj.email || guestData?.email || "";
  const address = booking.address || guestObj.address || "";
  const bookingNumber = booking.booking_number || booking.bookingNumber || "";
  const stayStatus = booking.booking_status || booking.status || guestData?.status || "";
  const payStatus = booking.payment_status || "";

  const rooms = Array.isArray(booking.rooms) ? booking.rooms : [];
  const roomLabel =
    rooms.map((r) => r.room_number || r.roomNumber).filter(Boolean).join(", ") ||
    booking.roomNumber ||
    booking.roomAssigned ||
    guestData?.roomAssigned ||
    "";

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

  const payments = useMemo(() => {
    const list = Array.isArray(booking.payment_history) ? booking.payment_history : booking.paymentHistory || [];
    return [...list].sort((a, b) => new Date(a.received_at || 0) - new Date(b.received_at || 0));
  }, [booking.payment_history, booking.paymentHistory]);

  const notes = String(booking.notes || "").trim();

  /* ---- billing numbers (GST is applied on room charge - discount + extras + late fee) ---- */
  const bill = computeBookingBill(booking);
  const baseAmount = bill.base;
  const discount = bill.discount;
  const extraCharges = bill.extra;
  const lateCharge = bill.late;
  const lateHours = bill.lateHours;
  const taxable = bill.taxable;
  const gstRate = bill.gstRate;
  const gstAmount = bill.gstAmount;
  const cgstAmount = bill.cgst;
  const sgstAmount = bill.sgst;
  const igstAmount = bill.igst;
  const totalAmount = bill.total;
  const paidAmount = bill.paid;
  const dueAmount = bill.due;

  const guestsLabel = [
    `${num(booking.adults) || 1} ${num(booking.adults) > 1 ? "adults" : "adult"}`,
    num(booking.children) > 0 ? `${num(booking.children)} ${num(booking.children) > 1 ? "children" : "child"}` : "",
  ].filter(Boolean).join(", ");

  const nights = booking.number_of_nights ?? booking.nights;

  const billRow = (label, value, opts = {}) => (
    <Box
      key={label}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 2,
        py: 0.75,
        ...(opts.strong ? { mt: 0.75, pt: 1.5, borderTop: `1px solid ${themeConfig.border}` } : {}),
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography component="span" sx={{ color: themeConfig.textMain, fontSize: opts.strong ? "0.95rem" : "0.88rem", fontWeight: opts.strong ? 700 : 500 }}>
          {label}
        </Typography>
        {opts.hint ? (
          <Typography component="span" sx={{ color: themeConfig.textMuted, fontSize: "0.78rem", ml: 1 }}>
            {opts.hint}
          </Typography>
        ) : null}
      </Box>
      <Typography sx={{ color: opts.color || themeConfig.textMain, fontSize: opts.strong ? "1rem" : "0.88rem", fontWeight: opts.strong ? 700 : 600, whiteSpace: "nowrap" }}>
        {value}
      </Typography>
    </Box>
  );

  const hotelName = booking.hotel?.name || hotelSettings?.name || hotelSettings?.hotelName || "";

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { ...dialogPaperSx(themeConfig, isDarkMode), maxHeight: "92vh" } } }}
      >
        <AppDialogHeader
          eyebrow={bookingNumber || "Booking"}
          title={name}
          icon={
            <Avatar sx={{ width: 40, height: 40, bgcolor: themeConfig.primary, fontWeight: 700, fontSize: "1rem" }}>
              {String(name).charAt(0).toUpperCase()}
            </Avatar>
          }
          onClose={onClose}
        />

        {/* Status strip */}
        <Box sx={{ px: 3, py: 1.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", borderBottom: `1px solid ${themeConfig.border}` }}>
          {stayStatus ? <Pill label={humanize(stayStatus)} tone={statusTone(stayStatus)} /> : null}
          {payStatus ? <Pill label={humanize(payStatus)} tone={statusTone(payStatus)} /> : null}
          {roomLabel ? (
            <Typography sx={{ ml: 0.5, color: themeConfig.textMuted, fontSize: "0.82rem", fontWeight: 500 }}>
              Room {roomLabel}
              {nights ? ` · ${nights} ${Number(nights) === 1 ? "night" : "nights"}` : ""}
            </Typography>
          ) : null}
        </Box>

        <Box sx={{ px: 1.5, borderBottom: `1px solid ${themeConfig.border}` }}>
          <Tabs
            value={tab}
            onChange={(_, v) => setTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 44,
              "& .MuiTab-root": { minHeight: 44, textTransform: "none", fontWeight: 600, fontSize: "0.86rem", color: themeConfig.textMuted },
              "& .Mui-selected": { color: `${themeConfig.primary} !important` },
              "& .MuiTabs-indicator": { bgcolor: themeConfig.primary, height: 2 },
            }}
          >
            <Tab value="overview" label="Overview" />
            <Tab value="billing" label="Billing" />
            <Tab value="payments" label={`Payments (${payments.length})`} />
            <Tab value="documents" label={`Documents (${images.length + signatures.length})`} />
          </Tabs>
        </Box>

        <DialogContent sx={{ minHeight: 320 }}>
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", py: 8, gap: 1.5 }}>
              <CircularProgress size={32} sx={{ color: themeConfig.primary }} />
              <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.88rem" }}>Loading booking details...</Typography>
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {error && (
                <Box sx={{ p: 1.5, borderRadius: "10px", bgcolor: "#FEF2F2", border: "1px solid #FECACA", color: "#B42318", fontSize: "0.84rem", fontWeight: 600 }}>
                  {error}. Showing the details available on this device.
                </Box>
              )}

              {tab === "overview" && (
                <>
                  <Section title="Guest" themeConfig={themeConfig}>
                    <FieldGrid>
                      <Field label="Main guest" value={name} themeConfig={themeConfig} />
                      <Field label="Second guest" value={secondaryName} themeConfig={themeConfig} />
                      <Field label="Mobile number" value={phone} themeConfig={themeConfig} />
                      <Field label="Email address" value={email} themeConfig={themeConfig} />
                      <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                        <Field label="Address" value={address} themeConfig={themeConfig} />
                      </Box>
                    </FieldGrid>
                  </Section>

                  <Section title="Stay" themeConfig={themeConfig}>
                    <FieldGrid>
                      <Field label="Check-in" value={formatScheduled(booking.check_in_date || booking.checkInDate)} themeConfig={themeConfig} />
                      <Field label="Check-out" value={formatScheduled(booking.check_out_date || booking.checkOutDate)} themeConfig={themeConfig} />
                      {booking.actual_check_in ? (
                        <Field label="Actual check-in" value={formatDateTime(booking.actual_check_in)} themeConfig={themeConfig} />
                      ) : null}
                      {booking.actual_check_out ? (
                        <Field label="Actual check-out" value={formatDateTime(booking.actual_check_out)} themeConfig={themeConfig} />
                      ) : null}
                      <Field label="Nights" value={nights ?? "—"} themeConfig={themeConfig} />
                      <Field label="Guests" value={guestsLabel} themeConfig={themeConfig} />
                    </FieldGrid>

                    <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.74rem", fontWeight: 600, mt: 2.5, mb: 1 }}>Rooms</Typography>
                    {rooms.length === 0 ? (
                      <Typography sx={{ fontSize: "0.9rem", fontWeight: 600, color: themeConfig.textMain }}>
                        {roomLabel ? `Room ${roomLabel}` : "—"}
                      </Typography>
                    ) : (
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)" }, gap: 1.25 }}>
                        {rooms.map((room) => (
                          <Box
                            key={room.id || room.room_number}
                            sx={{ display: "flex", alignItems: "center", gap: 1.25, p: 1.25, borderRadius: "12px", border: `1px solid ${themeConfig.border}`, bgcolor: "#F8FAFC" }}
                          >
                            <Hotel sx={{ fontSize: 18, color: themeConfig.primary }} />
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: themeConfig.textMain }}>
                                Room {room.room_number || room.roomNumber}
                              </Typography>
                              <Typography sx={{ fontSize: "0.76rem", color: themeConfig.textMuted }}>
                                {room.room_type_name || room.roomTypeName || "Room"} · Floor {room.floor ?? "—"}
                              </Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>
                    )}
                  </Section>

                  {notes ? (
                    <Section title="Notes" themeConfig={themeConfig}>
                      <Typography sx={{ fontSize: "0.88rem", fontWeight: 500, whiteSpace: "pre-wrap", color: themeConfig.textMain, lineHeight: 1.7 }}>
                        {notes}
                      </Typography>
                    </Section>
                  ) : null}

                  <Section title="Booking" themeConfig={themeConfig}>
                    <FieldGrid>
                      <Field label="Booking number" value={bookingNumber} themeConfig={themeConfig} />
                      <Field label="Hotel" value={hotelName} themeConfig={themeConfig} />
                      <Field
                        label="Created by"
                        value={booking.creator?.name ? `${booking.creator.name}${booking.creator.role ? ` (${humanize(booking.creator.role)})` : ""}` : ""}
                        themeConfig={themeConfig}
                      />
                      <Field label="Created on" value={formatDateTime(booking.created_at || booking.createdAt)} themeConfig={themeConfig} />
                    </FieldGrid>
                  </Section>
                </>
              )}

              {tab === "billing" && (
                <Section title="Bill calculation" themeConfig={themeConfig}>
                  <Box sx={{ p: 2.5, borderRadius: "12px", border: `1px solid ${themeConfig.border}`, bgcolor: "#FFFFFF" }}>
                    {billRow("Room charges", formatMoney(baseAmount), { hint: "Before tax" })}
                    {billRow("Discount", discount > 0 ? `-${formatMoney(discount)}` : formatMoney(0), { color: discount > 0 ? "#047857" : undefined })}
                    {billRow("Extra charges", extraCharges > 0 ? `+${formatMoney(extraCharges)}` : formatMoney(0))}
                    {billRow("Late check-out charges", lateCharge > 0 ? `+${formatMoney(lateCharge)}` : formatMoney(0), { hint: lateHours ? `${lateHours}h` : "" })}
                    {billRow("Taxable amount", formatMoney(taxable), { strong: true })}
                    {igstAmount > 0
                      ? billRow("IGST", `+${formatMoney(igstAmount)}`, { hint: `${gstRate}%` })
                      : cgstAmount > 0 || sgstAmount > 0
                        ? [
                            billRow("CGST", `+${formatMoney(cgstAmount)}`, { hint: `${num(booking.cgst_rate) || gstRate / 2}%` }),
                            billRow("SGST", `+${formatMoney(sgstAmount)}`, { hint: `${num(booking.sgst_rate) || gstRate / 2}%` }),
                          ]
                        : gstAmount > 0 && billRow("GST", `+${formatMoney(gstAmount)}`, { hint: `${gstRate}%` })}
                    {billRow("Total bill", formatMoney(totalAmount), { strong: true })}
                    {billRow("Paid", `-${formatMoney(paidAmount)}`, { color: "#047857" })}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mt: 1.25,
                        px: 1.5,
                        py: 1,
                        borderRadius: "10px",
                        bgcolor: dueAmount > 0 ? "#FEF2F2" : "#ECFDF5",
                      }}
                    >
                      <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: dueAmount > 0 ? "#B42318" : "#047857" }}>
                        {dueAmount > 0 ? "Balance due" : "Fully settled"}
                      </Typography>
                      <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: dueAmount > 0 ? "#B42318" : "#047857" }}>
                        {formatMoney(dueAmount)}
                      </Typography>
                    </Box>
                    <Typography sx={{ mt: 1.5, color: themeConfig.textMuted, fontSize: "0.76rem", lineHeight: 1.6 }}>
                      {`${formatMoney(baseAmount)} - ${formatMoney(discount)} discount + ${formatMoney(extraCharges)} extra + ${formatMoney(lateCharge)} late check-out = ${formatMoney(taxable)}; + ${gstRate}% GST ${formatMoney(gstAmount)} = ${formatMoney(totalAmount)}`}
                    </Typography>
                  </Box>
                </Section>
              )}

              {tab === "payments" && (
                <Section title="Payment history" themeConfig={themeConfig}>
                  {payments.length === 0 ? (
                    <EmptyNote text="No payments recorded for this booking." themeConfig={themeConfig} />
                  ) : (
                    <>
                      <Box sx={{ borderRadius: "12px", border: `1px solid ${themeConfig.border}`, overflow: "hidden" }}>
                        {payments.map((p, idx) => (
                          <Box
                            key={p.id || `${p.received_at}-${p.amount}`}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                              gap: 2,
                              px: 2,
                              py: 1.5,
                              borderTop: idx === 0 ? "none" : `1px solid ${themeConfig.border}`,
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography sx={{ fontWeight: 700, fontSize: "0.92rem", color: themeConfig.textMain }}>
                                {formatMoney(p.amount)}
                                <Typography component="span" sx={{ ml: 1, fontSize: "0.8rem", fontWeight: 500, color: themeConfig.textMuted }}>
                                  {humanize(p.payment_method)}
                                </Typography>
                              </Typography>
                              <Typography sx={{ fontSize: "0.76rem", color: themeConfig.textMuted, mt: 0.25 }}>
                                {humanize(p.source || "Payment")} · {p.received_by?.name || "Staff"} · {formatDateTime(p.received_at)}
                              </Typography>
                            </Box>
                            <Pill label={humanize(p.status)} tone={statusTone(p.status)} />
                          </Box>
                        ))}
                      </Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mt: 1.5, px: 0.5 }}>
                        <Typography sx={{ fontSize: "0.86rem", fontWeight: 600, color: themeConfig.textMuted }}>Total received</Typography>
                        <Typography sx={{ fontSize: "0.92rem", fontWeight: 700, color: "#047857" }}>
                          {formatMoney(payments.reduce((sum, p) => sum + num(p.amount), 0))}
                        </Typography>
                      </Box>
                    </>
                  )}
                </Section>
              )}

              {tab === "documents" && (
                <>
                  <Section title={`ID photos (${images.length})`} themeConfig={themeConfig}>
                    <MediaGrid items={images} emptyText="No ID photos attached." themeConfig={themeConfig} onPreview={setPreview} />
                  </Section>
                  <Section title={`Signatures (${signatures.length})`} themeConfig={themeConfig}>
                    <MediaGrid items={signatures} emptyText="No signature attached." themeConfig={themeConfig} onPreview={setPreview} />
                  </Section>
                </>
              )}
            </Box>
          )}
        </DialogContent>

        <AppDialogFooter>
          <Button onClick={onClose} variant="contained" sx={dialogPrimaryButtonSx(themeConfig)}>
            Close
          </Button>
        </AppDialogFooter>
      </Dialog>

      <Dialog
        open={Boolean(preview?.url)}
        onClose={() => setPreview(null)}
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: "16px", p: 1.5, bgcolor: "#0F172A" } } }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography sx={{ fontWeight: 600, fontSize: "0.9rem", color: "#F8FAFC" }}>{preview?.label || "Preview"}</Typography>
          <IconButton size="small" onClick={() => setPreview(null)} sx={{ color: "#FFF" }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
        {preview?.url && (
          <Box component="img" src={preview.url} alt={preview.label} sx={{ width: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: "10px" }} />
        )}
      </Dialog>
    </>
  );
}
