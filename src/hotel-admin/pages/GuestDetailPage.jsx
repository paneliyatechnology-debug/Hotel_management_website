"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Button,
  Chip,
  Avatar,
  Divider,
  IconButton,
  Tooltip,
  Grid,
  Tabs,
  Tab,
  Dialog,
  DialogContent,
  CircularProgress,
  Alert,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";
import {
  ArrowBack,
  Person,
  Phone,
  Email,
  LocationOn,
  CalendarMonth,
  Hotel as HotelIcon,
  Receipt,
  Payments,
  CurrencyRupee,
  Print,
  WhatsApp,
  ContentCopy,
  Schedule,
  Bed,
  AccountBalanceWallet,
  Description,
  Close,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { formatTime12Hour } from "@/shared/utils/timeUtils";
import { computeBookingBill } from "@/shared/utils/billingUtils";
import { toast } from "@/shared/utils/toast";
import { useSocket } from "@/shared/context/SocketContext";
import { normalizeBooking } from "@/shared/utils/liveSync";
import { downloadBookingBill } from "@/shared/utils/bookingPdf";
import FolioPdfButton from "@/shared/components/FolioPdfButton";
import RoomNumberChips from "@/shared/components/RoomNumberChips";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";

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

function humanizeLabel(value) {
  if (!value) return "";
  return String(value)
    .replace(/[_-]+/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatCurrency(val) {
  const n = Number(val);
  if (!Number.isFinite(n)) return "₹0";
  return `₹${n.toLocaleString("en-IN")}`;
}

function formatDate(val) {
  if (!val) return "—";
  try {
    const d = new Date(val);
    if (Number.isNaN(d.getTime())) return String(val);
    return d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch {
    return String(val);
  }
}

function formatDateTime(val) {
  if (!val) return "—";
  try {
    const raw = String(val);
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    const dateOnly = /T00:00:00(\.000)?Z$/.test(raw);
    if (dateOnly) {
      return d.toLocaleDateString("en-IN", {
        timeZone: "UTC",
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    }
    return d.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(val);
  }
}

export default function GuestDetailPage({
  guest = null,
  guestId = null,
  hotelSettings = {},
  onBack,
  onRefresh,
  embedded = false,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookingDetail, setBookingDetail] = useState(guest);
  const [copiedKey, setCopiedKey] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [detailTick, setDetailTick] = useState(0);

  const effectiveId = guestId || guest?._id || guest?.id || guest?.bookingId || guest?.booking_id;

  useSocket(
    ["BOOKING_UPDATED", "BOOKING_CREATED", "GUEST_CHECKED_OUT", "PAYMENT_RECORDED", "GUEST_UPDATED", "ROOM_UPDATED"],
    () => setDetailTick((tick) => tick + 1)
  );

  // booking:updated carries the full booking: show it instantly when it is this booking
  useSocket(["booking:updated"], (payload) => {
    const updatedId = payload?.id ?? payload?._id;
    if (updatedId && effectiveId && String(updatedId) === String(effectiveId)) {
      setBookingDetail((prev) => ({ ...(prev || {}), ...normalizeBooking(payload) }));
    }
  });

  // Fetch full details, and again whenever a live socket event arrives
  useEffect(() => {
    if (!effectiveId) return;
    let isCancelled = false;

    const fetchDetail = async () => {
      if (!bookingDetail) setLoading(true);
      try {
        const endpoint =
          (typeof API_ENDPOINTS.BOOKINGS?.BY_ID === "function" && API_ENDPOINTS.BOOKINGS.BY_ID(effectiveId)) ||
          `${API_ENDPOINTS.BOOKINGS?.ALL || `${API_ENDPOINTS.API_BASE_URL || ""}/api/v1/bookings`}/${effectiveId}`;

        const res = await apiRequest(endpoint, { forceRefresh: true });
        if (!isCancelled && res) {
          const detail = res.data?.data || res.data || res.booking || res;
          if (detail && typeof detail === "object") {
            setBookingDetail(detail);
          }
        }
      } catch (err) {
        console.warn("Unable to fetch fresh guest detail, using local guest data:", err?.message || err);
      } finally {
        if (!isCancelled) setLoading(false);
      }
    };

    fetchDetail();
    return () => {
      isCancelled = true;
    };
  }, [effectiveId, detailTick]);

  const b = bookingDetail || guest || {};
  const g = b.guest || b.guestData || b;

  // Normalized Fields
  const guestName =
    b.primary_guest_name ||
    g.name ||
    g.fullName ||
    b.guestName ||
    b.customer_name ||
    "Guest";

  const secondaryGuestName =
    b.secondary_guest_name ||
    b.secondaryGuestName ||
    g.secondary_guest_name ||
    g.secondaryGuestName ||
    "";

  const guestPhone =
    g.phone ||
    g.mobile ||
    g.mobileNumber ||
    g.mobile_number ||
    b.guestPhone ||
    b.mobile ||
    b.phone ||
    "";

  const guestEmail = g.email || b.email || b.guestEmail || "";

  const roomNumbersList = (() => {
    const fromRooms = Array.isArray(b.rooms)
      ? b.rooms
          .map((r) => (typeof r === "object" ? r.room_number || r.roomNumber || r.number : r))
          .filter(Boolean)
          .map(String)
      : [];
    const fromIds = Array.isArray(b.roomNumbers)
      ? b.roomNumbers.map(String).filter(Boolean)
      : Array.isArray(b.room_numbers)
        ? b.room_numbers.map(String).filter(Boolean)
        : [];
    const list = fromRooms.length ? fromRooms : fromIds;
    if (list.length) return [...new Set(list)];
    const single = b.roomNumber || b.room_number || b.room?.room_number || b.room?.roomNumber;
    return single ? [String(single)] : [];
  })();
  const roomAssigned = roomNumbersList.length ? roomNumbersList.join(", ") : "—";

  const roomType = (() => {
    const typesFromRooms = Array.isArray(b.rooms)
      ? b.rooms.map((r) => r.room_type_name || r.roomTypeName).filter(Boolean)
      : [];
    if (typesFromRooms.length) return [...new Set(typesFromRooms)].join(", ");
    return (
      b.roomTypeName ||
      b.room_type_name ||
      b.roomType?.name ||
      b.room?.roomType?.name ||
      b.rooms?.[0]?.room_type_name ||
      "Deluxe Room"
    );
  })();

  const rawStatus = String(b.booking_status || b.status || "CONFIRMED").toUpperCase();
  const normalizedStatus =
    rawStatus === "IN-HOUSE" || rawStatus === "IN_HOUSE"
      ? "CHECKED_IN"
      : rawStatus;

  const checkInDate = b.check_in_date || b.checkInDate || b.check_in || b.checkIn;
  const checkOutDate = b.check_out_date || b.checkOutDate || b.check_out || b.checkOut;
  const actualCheckIn = b.actual_check_in || b.actualCheckIn || null;
  const actualCheckOut = b.actual_check_out || b.actualCheckOut || null;

  // Nights count
  const nights = useMemo(() => {
    if (b.nights !== undefined) return Number(b.nights);
    if (!checkInDate || !checkOutDate) return 1;
    try {
      const d1 = new Date(checkInDate);
      const d2 = new Date(checkOutDate);
      const diffDays = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 1;
    } catch {
      return 1;
    }
  }, [b.nights, checkInDate, checkOutDate]);

  // Financials
  // Total bill = base - discount + extra charges + late check-out, then GST on that amount
  const bill = computeBookingBill(b);
  const totalAmount = bill.hasBase ? bill.total : Number(b.total_amount ?? b.totalAmount ?? b.grand_total ?? 0);
  const paidAmount = Number(
    b.paid_amount ??
      b.paidAmount ??
      b.advancePaymentAmount ??
      b.advance_amount ??
      b.advancePaid ??
      0
  );
  const dueAmount = bill.hasBase
    ? Math.max(0, totalAmount - paidAmount)
    : Number(b.due_amount ?? b.dueAmount ?? Math.max(0, totalAmount - paidAmount));

  const mediaSections = useMemo(() => {
    const seen = new Set();
    const collect = (sources, fallback) => {
      const items = [];
      sources.forEach((source) =>
        parseMaybeList(source).forEach((entry) => {
          const url = toUrl(entry);
          if (!url || seen.has(url)) return;
          seen.add(url);
          items.push({ url, label: `${fallback} ${items.length + 1}` });
        })
      );
      return items;
    };
    const signatures = collect(
      [b.signatures, g.signatures, b.signature, b.guest_signature, b.guestSignature, g.signature],
      "Signature"
    );
    const idProofs = collect(
      [
        b.id_images,
        b.idImages,
        b.front_image,
        b.frontImage,
        b.back_image,
        b.backImage,
        b.id_proof_image,
        b.id_proof_back_image,
        g.frontImage,
        g.backImage,
        g.front_image,
        g.back_image,
        g.idProof?.frontImage,
        g.idProof?.backImage,
        b.images,
        g.images,
        b.documents,
        g.documents,
      ],
      "ID proof"
    );
    return [
      { key: "id", title: "ID proofs", description: "Identity documents uploaded at check-in.", items: idProofs },
      { key: "sig", title: "Signatures", description: "Guest signature captured at check-in.", items: signatures },    ];
  }, [b, g]);
  const imageCount = mediaSections.reduce((sum, section) => sum + section.items.length, 0);

  // Payment transactions
  const paymentsList = useMemo(() => {
    const list = parseMaybeList(b.payment_history || b.payments || b.payment_transactions || b.transactions);
    if (list.length > 0) return list;
    if (paidAmount > 0) {
      return [
        {
          id: "tx-init",
          amount: paidAmount,
          payment_method: b.payment_method || b.paymentMethod || "CASH",
          status: "SUCCESS",
          created_at: checkInDate || b.created_at,
          reference: b.payment_reference || b.transactionId || "INITIAL_ADVANCE",
        },
      ];
    }
    return [];
  }, [b, paidAmount, checkInDate]);

  const copyToClipboard = (text, key) => {
    if (!text) return;
    try {
      navigator.clipboard.writeText(text);
      setCopiedKey(key);
      toast.show("Copied to clipboard!", "success");
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      toast.show("Failed to copy", "error");
    }
  };

  const handleGuestPdf = async () => {
    if (!effectiveId) {
      toast.show("Booking is not ready for a PDF yet", "error");
      return;
    }
    try {
      setPdfLoading(true);
      const label = String(b.booking_number || b.bookingNumber || `guest-${effectiveId}`).replace(/\s+/g, "-");
      await downloadBookingBill(effectiveId, label);
      toast.show("Bill ready", "success");
    } catch (err) {
      toast.show(err?.message || "Could not generate the bill", "error");
    } finally {
      setPdfLoading(false);
    }
  };

  const handleOpenWhatsApp = () => {
    if (!guestPhone) {
      toast.show("No phone number available for this guest", "info");
      return;
    }
    const clean = guestPhone.replace(/\D/g, "");
    const hotelName = hotelSettings?.hotelName || "Hotel";
    const msg = encodeURIComponent(
      `Hello ${guestName}, Greetings from ${hotelName}! Regarding your stay in Room ${roomAssigned}: Total Billed: ₹${totalAmount}, Paid: ₹${paidAmount}, Balance: ₹${dueAmount}. Please reach out if you need any assistance!`
    );
    window.open(`https://wa.me/91${clean}?text=${msg}`, "_blank");
  };

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: embedded ? 2 : 3 }}>
      {/* Top Navigation & Action Header */}
      <Paper
        elevation={0}
        sx={{
          p: embedded ? 1.25 : { xs: 2, sm: 2.5 },
          borderRadius: "16px",
          bgcolor: themeConfig.bgCard,
          border: `1px solid ${themeConfig.border}`,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          <Button
            variant="outlined"
            size={embedded ? "small" : "medium"}
            onClick={onBack}
            startIcon={<ArrowBack />}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              color: themeConfig.textMain,
              borderColor: themeConfig.border,
              flexShrink: 0,
              "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
            }}
          >
            {embedded ? "Close" : "Back to Guest List"}
          </Button>
          {!embedded && (
            <>
              <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
              <Box sx={{ display: { xs: "none", sm: "block" }, minWidth: 0 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  Guest Directory
                </Typography>
                <Typography variant="body1" noWrap sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                  {guestName}
                </Typography>
              </Box>
            </>
          )}
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          {guestPhone && (
            <Tooltip title="WhatsApp">
              <IconButton
                size="small"
                onClick={handleOpenWhatsApp}
                aria-label="WhatsApp"
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  border: "1px solid rgba(37, 211, 102, 0.4)",
                  color: "#25D366",
                  "&:hover": { bgcolor: "rgba(37, 211, 102, 0.08)" },
                }}
              >
                <WhatsApp fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          <Tooltip title={pdfLoading ? "Preparing bill" : "Bill"}>
            <span>
              <IconButton
                size="small"
                disabled={pdfLoading}
                onClick={handleGuestPdf}
                aria-label="Bill"
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  border: `1px solid ${themeConfig.border}`,
                  color: themeConfig.textMain,
                  "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
                }}
              >
                {pdfLoading ? <CircularProgress size={16} /> : <Print fontSize="small" />}
              </IconButton>
            </span>
          </Tooltip>
          <FolioPdfButton booking={{ id: effectiveId, bookingNumber: b.booking_number || b.bookingNumber || guestName }} iconOnly />
        </Box>
      </Paper>

      {/* Hero Profile Banner */}
      <Card
        elevation={0}
        sx={{
          borderRadius: "20px",
          bgcolor: themeConfig.bgCard,
          border: `1px solid ${themeConfig.border}`,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <Box
          sx={{
            height: "8px",
            background: `linear-gradient(90deg, ${themeConfig.primary} 0%, #D4AF37 50%, #10B981 100%)`,
          }}
        />
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              alignItems: { xs: "flex-start", md: "center" },
              justifyContent: "space-between",
              gap: 3,
            }}
          >
            {/* Avatar & Guest Details */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
              <Avatar
                sx={{
                  width: { xs: 64, sm: 76 },
                  height: { xs: 64, sm: 76 },
                  fontSize: { xs: "1.5rem", sm: "1.8rem" },
                  fontWeight: 900,
                  bgcolor: themeConfig.primary,
                  color: themeConfig.onPrimary,
                  boxShadow: `0 8px 24px -4px ${themeConfig.primaryGlow || "rgba(0,0,0,0.2)"}`,
                }}
              >
                {guestName ? guestName.charAt(0).toUpperCase() : "G"}
              </Avatar>

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", mb: 0.5 }}>
                  <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                    {guestName}
                  </Typography>
                  <StatusChip status={normalizedStatus} />
                </Box>

                <Box sx={{ display: "flex", alignItems: "center", gap: 2.5, flexWrap: "wrap", mt: 1 }}>
                  {guestPhone && (
                    <Box
                      component="a"
                      href={`tel:${guestPhone}`}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.8,
                        color: themeConfig.textMuted,
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        "&:hover": { color: themeConfig.primary },
                      }}
                    >
                      <Phone fontSize="small" sx={{ color: themeConfig.primary }} />
                      {guestPhone}
                    </Box>
                  )}

                  {guestEmail && (
                    <Box
                      component="a"
                      href={`mailto:${guestEmail}`}
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.8,
                        color: themeConfig.textMuted,
                        textDecoration: "none",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        "&:hover": { color: themeConfig.primary },
                      }}
                    >
                      <Email fontSize="small" sx={{ color: themeConfig.primary }} />
                      {guestEmail}
                    </Box>
                  )}

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: themeConfig.textMuted, fontSize: "0.85rem", flexWrap: "wrap" }}>
                    <HotelIcon fontSize="small" sx={{ color: themeConfig.primary }} />
                    <RoomNumberChips rooms={roomNumbersList.length ? roomNumbersList : roomAssigned} />
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                      ({roomType})
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* Financial Quick Glance */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: { xs: 1.5, sm: 2 },
                p: { xs: 1.25, sm: 1.5 },
                borderRadius: "14px",
                bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                border: `1px solid ${themeConfig.border}`,
                width: { xs: "100%", lg: "auto" },
                justifyContent: "space-between",
                flexWrap: "wrap",
              }}
            >
              <Box sx={{ textAlign: "center", px: 1 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  Total Bill
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, mt: 0.2 }}>
                  {formatCurrency(totalAmount)}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: "center", px: 1 }}>
                <Typography variant="caption" sx={{ color: "#059669", fontWeight: 700 }}>
                  Paid
                </Typography>
                <Typography variant="h6" sx={{ fontWeight: 900, color: "#059669", mt: 0.2 }}>
                  {formatCurrency(paidAmount)}
                </Typography>
              </Box>
              <Divider orientation="vertical" flexItem />
              <Box sx={{ textAlign: "center", px: 1 }}>
                <Typography variant="caption" sx={{ color: dueAmount > 0 ? "#DC2626" : themeConfig.textMuted, fontWeight: 700 }}>
                  Balance Due
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 900,
                    color: dueAmount > 0 ? "#DC2626" : "#059669",
                    mt: 0.2,
                  }}
                >
                  {formatCurrency(dueAmount)}
                </Typography>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Tabs Bar */}
      <Tabs
        value={activeTab}
        onChange={(e, val) => setActiveTab(val)}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: 46,
          "& .MuiTab-root": {
            minHeight: 38,
            minWidth: 0,
            px: { xs: 1.25, sm: 2 },
            fontSize: { xs: "0.78rem", sm: "0.85rem" },
          },
        }}
      >
          <Tab icon={<HotelIcon fontSize="small" />} iconPosition="start" label="Stay & Room Details" />
          <Tab icon={<Description fontSize="small" />} iconPosition="start" label={`Images (${imageCount})`} />
          <Tab icon={<Receipt fontSize="small" />} iconPosition="start" label="Folio & Billing" />
          <Tab icon={<Payments fontSize="small" />} iconPosition="start" label={`Payment Ledger (${paymentsList.length})`} />
        </Tabs>

      {/* TAB 0: STAY & ROOM DETAILS */}
      {activeTab === 0 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: "16px",
                bgcolor: themeConfig.bgCard,
                border: `1px solid ${themeConfig.border}`,
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2 }}>
                  Room & Stay Summary
                </Typography>

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Assigned Room
                    </Typography>
                    <Box sx={{ mt: 0.5 }}>
                      <RoomNumberChips rooms={roomNumbersList.length ? roomNumbersList : roomAssigned} />
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Room Category
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                      {roomType}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Check-In Date & Time
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                      {formatDateTime(actualCheckIn || checkInDate)}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Check-Out Date & Time
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                      {formatDateTime(actualCheckOut || checkOutDate)}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Stay Duration
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                      {nights} Night{nights > 1 ? "s" : ""}
                    </Typography>
                  </Grid>

                  {secondaryGuestName && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                        Secondary Guest
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                        {secondaryGuestName}
                      </Typography>
                    </Grid>
                  )}

                  <Grid size={{ xs: 12 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Address
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                      {[g.address || g.residential_address || b.address, g.city, g.state, g.pincode || g.zip]
                        .filter(Boolean)
                        .join(", ") || "Not provided"}
                    </Typography>
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Special Requests / Notes
                    </Typography>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 500,
                        color: themeConfig.textMain,
                        mt: 0.5,
                        p: 1.5,
                        borderRadius: "10px",
                        bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                        border: `1px solid ${themeConfig.border}`,
                      }}
                    >
                      {b.notes || b.special_requests || g.notes || "No special requests recorded for this stay."}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: "16px",
                bgcolor: themeConfig.bgCard,
                border: `1px solid ${themeConfig.border}`,
                height: "100%",
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2 }}>
                  Booking Metadata
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Booking ID / Reference
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                        {b.booking_number || b.bookingNumber || effectiveId || "—"}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => copyToClipboard(b.booking_number || b.bookingNumber || effectiveId, "bId")}
                      >
                        <ContentCopy fontSize="inherit" sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Box>
                  </Box>
                  <Divider />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Reservation Status
                    </Typography>
                    <StatusChip status={normalizedStatus} />
                  </Box>
                  <Divider />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Booking Date
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                      {formatDate(b.created_at || b.createdAt || checkInDate)}
                    </Typography>
                  </Box>
                  <Divider />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Payment Method
                    </Typography>
                    <Chip
                      size="small"
                      label={b.payment_method || b.paymentMethod || "CASH"}
                      sx={{ fontWeight: 800, textTransform: "uppercase" }}
                    />
                  </Box>
                  <Divider />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Handled By (Front Desk)
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                      {b.created_by_name || b.staff_name || "Receptionist"}
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {activeTab === 1 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
          {imageCount === 0 ? (
            <Card
              elevation={0}
              sx={{ borderRadius: "16px", bgcolor: themeConfig.bgCard, border: `1px solid ${themeConfig.border}` }}
            >
              <CardContent sx={{ p: 3 }}>
                <EmptyState title="No documents" description="No ID proofs or signatures are attached to this stay." />
              </CardContent>
            </Card>
          ) : (
            mediaSections
              .map((section) => (
                <Card
                  key={section.key}
                  elevation={0}
                  sx={{ borderRadius: "16px", bgcolor: themeConfig.bgCard, border: `1px solid ${themeConfig.border}` }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ pb: 1.5, mb: 2.5, borderBottom: `1px solid ${themeConfig.border}` }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                          {section.title}
                        </Typography>
                        <Chip
                          size="small"
                          label={section.items.length}
                          sx={{ height: 22, fontWeight: 800, bgcolor: themeConfig.bgSoft || "#F0FDFA", color: themeConfig.primary }}
                        />
                      </Box>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 600 }}>
                        {section.description}
                      </Typography>
                    </Box>
                    {section.items.length === 0 ? (
                      <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontWeight: 600 }}>
                        {section.key === "sig" ? "No signature attached." : "No ID proof attached."}
                      </Typography>
                    ) : (
                      <Grid container spacing={2}>
                        {section.items.map((item) => (
                          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={item.url}>
                            <Paper
                              elevation={0}
                              onClick={() => setPreviewUrl(item.url)}
                              sx={{
                                borderRadius: "14px",
                                overflow: "hidden",
                                border: `1px solid ${themeConfig.border}`,
                                cursor: "pointer",
                                bgcolor: section.key === "sig" ? "#FFFFFF" : themeConfig.bgSubtle,
                                "&:hover": { borderColor: themeConfig.primary },
                              }}
                            >
                              <Box
                                component="img"
                                src={item.url}
                                alt={item.label}
                                sx={{
                                  width: "100%",
                                  height: 160,
                                  objectFit: section.key === "sig" ? "contain" : "cover",
                                  display: "block",
                                }}
                              />
                              <Box sx={{ px: 1.5, py: 1, borderTop: `1px solid ${themeConfig.border}` }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                  {item.label}
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    )}
                  </CardContent>
                </Card>
              ))
          )}
        </Box>
      )}

      {/* TAB 2: FOLIO & BILLING */}
      {activeTab === 2 && (
        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: "16px",
                bgcolor: themeConfig.bgCard,
                border: `1px solid ${themeConfig.border}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2 }}>
                  Bill calculation
                </Typography>

                <Box>
                  {bill.hasBase ? (
                    <>
                      {[
                        { label: "Room charges", hint: `${nights} night${nights > 1 ? "s" : ""} · before tax`, value: formatCurrency(bill.base), show: true },
                        { label: "Discount", value: bill.discount > 0 ? `-${formatCurrency(bill.discount)}` : formatCurrency(0), color: bill.discount > 0 ? themeConfig.tones.success.color : undefined, show: true },
                        { label: "Extra charges", value: bill.extra > 0 ? `+${formatCurrency(bill.extra)}` : formatCurrency(0), show: true },
                        {
                          label: "Late check-out charges",
                          hint: bill.lateHours ? `${bill.lateHours}h` : "",
                          value: bill.late > 0 ? `+${formatCurrency(bill.late)}` : formatCurrency(0),
                          show: true,
                        },
                        { label: "Taxable amount", value: formatCurrency(bill.taxable), strong: true, show: true },
                        { label: `CGST (${bill.gstRate / 2}%)`, value: `+${formatCurrency(bill.cgst)}`, show: bill.cgst > 0 },
                        { label: `SGST (${bill.gstRate / 2}%)`, value: `+${formatCurrency(bill.sgst)}`, show: bill.sgst > 0 },
                        { label: `IGST (${bill.gstRate}%)`, value: `+${formatCurrency(bill.igst)}`, show: bill.igst > 0 },
                        { label: "Total bill", hint: "Taxable amount + GST", value: formatCurrency(bill.total), strong: true, show: true },
                      ]
                        .filter((row) => row.show)
                        .map((row) => (
                          <Box
                            key={row.label}
                            sx={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "baseline",
                              gap: 2,
                              py: 0.9,
                              ...(row.strong ? { mt: 0.5, pt: 1.5, borderTop: `1px solid ${themeConfig.border}` } : {}),
                            }}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography component="span" sx={{ color: themeConfig.textMain, fontSize: row.strong ? "0.95rem" : "0.88rem", fontWeight: row.strong ? 700 : 500 }}>
                                {row.label}
                              </Typography>
                              {row.hint ? (
                                <Typography component="span" sx={{ color: themeConfig.textMuted, fontSize: "0.78rem", ml: 1 }}>
                                  {row.hint}
                                </Typography>
                              ) : null}
                            </Box>
                            <Typography sx={{ color: row.color || themeConfig.textMain, fontSize: row.strong ? "1rem" : "0.88rem", fontWeight: row.strong ? 700 : 600, whiteSpace: "nowrap" }}>
                              {row.value}
                            </Typography>
                          </Box>
                        ))}
                      <Typography sx={{ mt: 1.5, color: themeConfig.textMuted, fontSize: "0.76rem", lineHeight: 1.6 }}>
                        {`${formatCurrency(bill.base)} - ${formatCurrency(bill.discount)} discount + ${formatCurrency(bill.extra)} extra + ${formatCurrency(bill.late)} late check-out = ${formatCurrency(bill.taxable)}; + ${bill.gstRate}% GST ${formatCurrency(bill.gstAmount)} = ${formatCurrency(bill.total)}`}
                      </Typography>
                    </>
                  ) : (
                    <Box sx={{ display: "flex", justifyContent: "space-between", py: 0.9 }}>
                      <Typography sx={{ fontWeight: 700, color: themeConfig.textMain }}>Total bill</Typography>
                      <Typography sx={{ fontWeight: 700, color: themeConfig.textMain }}>{formatCurrency(totalAmount)}</Typography>
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card
              elevation={0}
              sx={{
                borderRadius: "16px",
                bgcolor: themeConfig.bgCard,
                border: `1px solid ${themeConfig.border}`,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2 }}>
                  Settlement Summary
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>Extra charges</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>{formatCurrency(bill.extra)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
                      Late check-out charges{bill.lateHours ? ` (${bill.lateHours}h)` : ""}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>{formatCurrency(bill.late)}</Typography>
                  </Box>
                  <Divider />
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>Gross Total</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>{formatCurrency(totalAmount)}</Typography>
                  </Box>
                  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                    <Typography variant="body2" sx={{ color: "#059669" }}>Total Paid (Advance & Settled)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "#059669" }}>{formatCurrency(paidAmount)}</Typography>
                  </Box>
                  <Divider />

                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: dueAmount > 0 ? "#DC2626" : themeConfig.textMain }}>
                      Balance Remaining
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 900, color: dueAmount > 0 ? "#DC2626" : "#059669" }}>
                      {formatCurrency(dueAmount)}
                    </Typography>
                  </Box>

                  {dueAmount > 0 ? (
                    <Alert severity="warning" sx={{ borderRadius: "10px", fontWeight: 700 }}>
                      Outstanding balance of {formatCurrency(dueAmount)} pending collection at reception desk.
                    </Alert>
                  ) : (
                    <Alert severity="success" sx={{ borderRadius: "10px", fontWeight: 700 }}>
                      Folio is fully settled. No dues pending.
                    </Alert>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* TAB 3: PAYMENT LEDGER */}
      {activeTab === 3 && (
        <Card
          elevation={0}
          sx={{
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard,
            border: `1px solid ${themeConfig.border}`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2 }}>
              Payment Receipts & Transaction Ledger
            </Typography>

            {paymentsList.length === 0 ? (
              <EmptyState
                title="No Payments Recorded"
                description="No payment transactions have been logged for this reservation yet."
              />
            ) : (
              <TableContainer sx={{ overflowX: "auto", borderRadius: "12px", border: `1px solid ${themeConfig.border}` }}>
                <Table size="small" sx={{ minWidth: 720 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>Date & Time</TableCell>
                      <TableCell>Payment Mode</TableCell>
                      <TableCell>Source</TableCell>
                      <TableCell>Received By</TableCell>
                      <TableCell align="right">Amount Paid</TableCell>
                      <TableCell align="right">Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentsList.map((tx, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ color: themeConfig.textMain, fontWeight: 600 }}>
                          {formatDateTime(tx.received_at || tx.created_at || tx.createdAt || checkInDate)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={tx.payment_method || tx.paymentMethod || "CASH"}
                            sx={{ fontWeight: 800, textTransform: "uppercase" }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: themeConfig.textMain, fontWeight: 600 }}>
                          {humanizeLabel(tx.source || tx.payment_source) || "—"}
                        </TableCell>
                        <TableCell sx={{ color: themeConfig.textMain, fontWeight: 600 }}>
                          {tx.received_by?.name ||
                            (typeof tx.received_by === "string" ? tx.received_by : "") ||
                            tx.received_by_name ||
                            "—"}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: "#059669" }}>
                          {formatCurrency(tx.amount || 0)}
                        </TableCell>
                        <TableCell align="center">
                          <Chip
                            size="small"
                            color="success"
                            label={tx.status || "SUCCESS"}
                            sx={{ fontWeight: 800 }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={Boolean(previewUrl)} onClose={() => setPreviewUrl(null)} maxWidth="md" fullWidth>
        <DialogContent sx={{ p: 1.5, position: "relative", bgcolor: themeConfig.bgCard }}>
          <IconButton
            onClick={() => setPreviewUrl(null)}
            size="small"
            sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(0,0,0,0.45)", color: "#fff" }}
          >
            <Close fontSize="small" />
          </IconButton>
          {previewUrl && (
            <Box
              component="img"
              src={previewUrl}
              alt=""
              sx={{ width: "100%", maxHeight: "80vh", objectFit: "contain", display: "block", borderRadius: "10px" }}
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
