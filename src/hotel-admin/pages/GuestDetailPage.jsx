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
  Refresh,
  AccountBalanceWallet,
  Description,
  Close,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { formatTime12Hour } from "@/shared/utils/timeUtils";
import { toast } from "@/shared/utils/toast";
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
}) {
  const { themeConfig, isDarkMode } = useAppTheme();

  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [bookingDetail, setBookingDetail] = useState(guest);
  const [copiedKey, setCopiedKey] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const effectiveId = guestId || guest?._id || guest?.id || guest?.bookingId || guest?.booking_id;

  // Fetch full details if needed
  useEffect(() => {
    if (!effectiveId) return;
    let isCancelled = false;

    const fetchDetail = async () => {
      setLoading(true);
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
  }, [effectiveId]);

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

  const roomAssigned =
    b.roomNumber ||
    b.room_number ||
    b.room?.roomNumber ||
    (Array.isArray(b.roomNumbers) ? b.roomNumbers.join(", ") : "") ||
    (Array.isArray(b.rooms)
      ? b.rooms.map((r) => r.room_number || r.roomNumber).filter(Boolean).join(", ")
      : "") ||
    "—";

  const roomType =
    b.roomTypeName ||
    b.room_type_name ||
    b.roomType?.name ||
    b.room?.roomType?.name ||
    "Deluxe Room";

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
  const totalAmount = Number(b.total_amount ?? b.totalAmount ?? b.grand_total ?? 0);
  const paidAmount = Number(
    b.paid_amount ??
      b.paidAmount ??
      b.advancePaymentAmount ??
      b.advance_amount ??
      b.advancePaid ??
      0
  );
  const dueAmount = Number(
    b.due_amount ??
      b.dueAmount ??
      Math.max(0, totalAmount - paidAmount)
  );

  const imageList = useMemo(() => {
    const seen = new Set();
    const urls = [];
    const push = (entry) => {
      const url = toUrl(entry);
      if (!url || seen.has(url)) return;
      seen.add(url);
      urls.push(url);
    };
    [
      b.images,
      g.images,
      b.documents,
      g.documents,
      b.signatures,
      g.signatures,
      b.id_images,
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
      b.signature,
      g.signature,
    ].forEach((source) => parseMaybeList(source).forEach(push));
    return urls;
  }, [b, g]);

  // Payment transactions
  const paymentsList = useMemo(() => {
    const list = parseMaybeList(b.payments || b.payment_transactions || b.transactions);
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

  const handlePrint = () => {
    window.print();
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
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      {/* Top Navigation & Action Header */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, sm: 2.5 },
          borderRadius: "16px",
          bgcolor: themeConfig.bgCard,
          border: `1px solid ${themeConfig.border}`,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button
            variant="outlined"
            onClick={onBack}
            startIcon={<ArrowBack />}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              color: themeConfig.textMain,
              borderColor: themeConfig.border,
              "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
            }}
          >
            Back to Guest List
          </Button>
          <Divider orientation="vertical" flexItem sx={{ display: { xs: "none", sm: "block" } }} />
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
              Hotel Admin / Guest Directory
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
              {guestName}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          {guestPhone && (
            <Button
              variant="outlined"
              size="small"
              startIcon={<WhatsApp sx={{ color: "#25D366" }} />}
              onClick={handleOpenWhatsApp}
              sx={{
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                borderColor: "rgba(37, 211, 102, 0.4)",
                color: themeConfig.textMain,
                "&:hover": { bgcolor: "rgba(37, 211, 102, 0.08)" },
              }}
            >
              WhatsApp
            </Button>
          )}

          <Button
            variant="outlined"
            size="small"
            startIcon={<Print />}
            onClick={handlePrint}
            sx={{
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              color: themeConfig.textMain,
              borderColor: themeConfig.border,
            }}
          >
            Print Registration
          </Button>

          {onRefresh && (
            <IconButton
              onClick={onRefresh}
              size="small"
              sx={{
                border: `1px solid ${themeConfig.border}`,
                borderRadius: "10px",
                color: themeConfig.primary,
              }}
            >
              <Refresh fontSize="small" />
            </IconButton>
          )}
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
                  color: "#FFFFFF",
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

                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, color: themeConfig.textMuted, fontSize: "0.85rem" }}>
                    <HotelIcon fontSize="small" sx={{ color: themeConfig.primary }} />
                    <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                      Room {roomAssigned}
                    </Typography>
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
                gap: 2,
                p: 2,
                borderRadius: "14px",
                bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                border: `1px solid ${themeConfig.border}`,
                width: { xs: "100%", md: "auto" },
                justifyContent: { xs: "space-between", md: "flex-end" },
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
      <Paper
        elevation={0}
        sx={{
          borderRadius: "14px",
          bgcolor: themeConfig.bgCard,
          border: `1px solid ${themeConfig.border}`,
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, val) => setActiveTab(val)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            minHeight: "48px",
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 800,
              fontSize: "0.9rem",
              minHeight: "48px",
              color: themeConfig.textMuted,
              "&.Mui-selected": {
                color: themeConfig.primary,
              },
            },
            "& .MuiTabs-indicator": {
              bgcolor: themeConfig.primary,
              height: 3,
              borderRadius: "3px 3px 0 0",
            },
          }}
        >
          <Tab icon={<HotelIcon fontSize="small" />} iconPosition="start" label="Stay & Room Details" />
          <Tab icon={<Description fontSize="small" />} iconPosition="start" label={`Images (${imageList.length})`} />
          <Tab icon={<Receipt fontSize="small" />} iconPosition="start" label="Folio & Billing" />
          <Tab icon={<Payments fontSize="small" />} iconPosition="start" label={`Payment Ledger (${paymentsList.length})`} />
          <Tab icon={<Person fontSize="small" />} iconPosition="start" label="Guest Profile & Address" />
        </Tabs>
      </Paper>

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
                    <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                      Room {roomAssigned}
                    </Typography>
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

                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Number of Guests
                    </Typography>
                    <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                      {b.adults || g.adults || 2} Adult(s) {b.children || g.children ? `, ${b.children || g.children} Child` : ""}
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
        <Card
          elevation={0}
          sx={{
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard,
            border: `1px solid ${themeConfig.border}`,
          }}
        >
          <CardContent sx={{ p: 3 }}>
            {imageList.length === 0 ? (
              <EmptyState title="No images" description="No images are attached to this stay." />
            ) : (
              <Grid container spacing={2}>
                {imageList.map((url) => (
                  <Grid size={{ xs: 12, sm: 6, md: 3 }} key={url}>
                    <Paper
                      elevation={0}
                      onClick={() => setPreviewUrl(url)}
                      sx={{
                        borderRadius: "14px",
                        overflow: "hidden",
                        border: `1px solid ${themeConfig.border}`,
                        cursor: "pointer",
                        bgcolor: "#0F172A",
                        "&:hover": { borderColor: themeConfig.primary },
                      }}
                    >
                      <Box
                        component="img"
                        src={url}
                        alt=""
                        sx={{ width: "100%", height: 180, objectFit: "cover", display: "block" }}
                      />
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            )}
          </CardContent>
        </Card>
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
                  Folio Charges Breakdown
                </Typography>

                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Item / Description</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Qty / Nights</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                          Room Tariff ({roomType} - Room {roomAssigned})
                        </TableCell>
                        <TableCell align="center" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                          {nights} Night{nights > 1 ? "s" : ""}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {formatCurrency(totalAmount)}
                        </TableCell>
                      </TableRow>

                      {b.additional_charges && b.additional_charges.length > 0 &&
                        b.additional_charges.map((charge, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ color: themeConfig.textMain }}>
                              {charge.description || `Extra Charge #${idx + 1}`}
                            </TableCell>
                            <TableCell align="center">{charge.quantity || 1}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {formatCurrency(charge.amount || 0)}
                            </TableCell>
                          </TableRow>
                        ))
                      }

                      <TableRow sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC" }}>
                        <TableCell colSpan={2} sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                          Total Billed Amount
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "1.05rem" }}>
                          {formatCurrency(totalAmount)}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
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
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Date & Time</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Payment Mode</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Reference / TXN ID</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Amount Paid</TableCell>
                      <TableCell align="center" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {paymentsList.map((tx, idx) => (
                      <TableRow key={idx}>
                        <TableCell sx={{ color: themeConfig.textMain, fontWeight: 600 }}>
                          {formatDateTime(tx.created_at || tx.createdAt || checkInDate)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            size="small"
                            label={tx.payment_method || tx.paymentMethod || "CASH"}
                            sx={{ fontWeight: 800, textTransform: "uppercase" }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: themeConfig.textMuted, fontFamily: "monospace" }}>
                          {tx.reference || tx.transactionId || tx.id || "—"}
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

      {/* TAB 4: GUEST PROFILE & ADDRESS */}
      {activeTab === 4 && (
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
              Full Guest Profile & Residential Information
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  Full Legal Name
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                  {guestName}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  Contact Phone
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                  {guestPhone || "Not provided"}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  Email Address
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                  {guestEmail || "Not provided"}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  Nationality
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                  {g.nationality || "Indian"}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  Residential Address
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                  {g.address || g.residential_address || "No residential address recorded."}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  City
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                  {g.city || "—"}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  State
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                  {g.state || "—"}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  Pincode
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.3 }}>
                  {g.pincode || g.zip || "—"}
                </Typography>
              </Grid>
            </Grid>
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
