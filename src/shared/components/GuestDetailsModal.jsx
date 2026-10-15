"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Grid,
  Paper,
  Chip,
  Button,
  IconButton,
  Avatar,
  Tabs,
  Tab,
  Divider,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  CircularProgress,
  Tooltip,
} from "@mui/material";
import {
  Close,
  Person,
  Phone,
  Email,
  LocationOn,
  MeetingRoom,
  CalendarMonth,
  BadgeOutlined,
  CreditCard,
  Receipt,
  Payments as PaymentIcon,
  FileDownload,
  Visibility,
  Print,
  WhatsApp,
  Hotel as HotelIcon,
  CheckCircle,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import StatusChip from "@/shared/components/StatusChip";
import { apiRequest, API_ENDPOINTS, API_BASE_URL } from "@/config/api";
import { toast } from "@/shared/utils/toast";

// Helper: Normalize relative or S3 image URLs
function normalizeImageSrc(src) {
  if (!src) return null;
  if (typeof src === "object") {
    src = src.url || src.secure_url || src.path || src.src || src.uri || src.fileUrl || src.data || src.link || src.image;
  }
  if (!src || typeof src !== "string") return null;
  const trimmed = src.trim();
  if (
    trimmed === "null" ||
    trimmed === "undefined" ||
    trimmed === "[object Object]" ||
    trimmed === ""
  ) {
    return null;
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr) && arr.length > 0) {
        return normalizeImageSrc(arr[0]);
      }
    } catch {}
  }
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:") ||
    trimmed.startsWith("blob:")
  ) {
    return trimmed;
  }
  const base = (API_BASE_URL || "").replace(/\/api\/v1\/?$/, "");
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${cleanPath}`;
}

// Helper: Single Image Downloader
function downloadImage(url, filename) {
  if (!url) return;
  fetch(url)
    .then((res) => res.blob())
    .then((blob) => {
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename || "document.png";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    })
    .catch(() => {
      window.open(url, "_blank");
    });
}

export default function GuestDetailsModal({
  open = false,
  guestId = null,
  guestData = null,
  onClose,
  hotelSettings = { checkInTime: "14:00", checkOutTime: "12:00", timezone: "Asia/Kolkata" },
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  // Target ID to fetch from API
  const targetId =
    guestId ||
    guestData?.id ||
    guestData?._id ||
    guestData?.bookingId ||
    guestData?.booking?.id ||
    guestData?.booking?._id ||
    guestData?.guestId;

  // Fetch full booking details whenever modal opens
  useEffect(() => {
    if (!open) {
      setData(null);
      setActiveTab(0);
      return;
    }

    if (!targetId || String(targetId).startsWith("b-")) {
      // Use locally passed data
      setData(guestData || {});
      return;
    }

    setLoading(true);
    const endpoint = API_ENDPOINTS.RECEPTIONIST.GUEST_BY_ID(targetId);
    apiRequest(endpoint)
      .then((res) => {
        if (res?.success && res?.data) {
          setData(res.data);
        } else {
          setData(guestData || {});
        }
      })
      .catch((err) => {
        console.warn("Could not fetch detailed booking data, using fallback:", err);
        setData(guestData || {});
      })
      .finally(() => setLoading(false));
  }, [open, targetId, guestData]);

  // Combined source of truth: Prefer API `data`, fallback to `guestData`
  const booking = useMemo(() => {
    return data || guestData || {};
  }, [data, guestData]);

  // Primary Guest Fields
  const primaryGuestName =
    booking.primary_guest_name ||
    booking.fullName ||
    booking.name ||
    booking.guestName ||
    "MAULIK";

  const secondaryGuestName = booking.secondary_guest_name || null;

  const mobileNumber =
    booking.mobile_number ||
    booking.phone ||
    booking.mobileNumber ||
    "N/A";

  const email = booking.email || "Not Provided";
  const address = booking.address || "";
  const bookingNumber =
    booking.booking_number ||
    booking.bookingNumber ||
    `BK-${booking.id || "N/A"}`;

  const hotelName = booking.hotel?.name || "JK";
  const creator = booking.creator || null;

  // Dates & Schedule
  const checkInDate = booking.check_in_date || booking.checkInDate || null;
  const checkOutDate = booking.check_out_date || booking.checkOutDate || null;
  const actualCheckIn = booking.actual_check_in || booking.actualCheckIn || null;
  const actualCheckOut = booking.actual_check_out || booking.actualCheckOut || null;

  const nights = Number(booking.number_of_nights || booking.numberOfNights || 1);
  const adults = Number(booking.adults !== undefined ? booking.adults : 1);
  const children = Number(booking.children !== undefined ? booking.children : 0);

  // Statuses
  const bookingStatus = (booking.booking_status || booking.status || "CHECKED_IN").toUpperCase();
  const paymentStatus = (booking.payment_status || booking.paymentStatus || "PARTIALLY_PAID").toUpperCase();

  // Financial Ledger
  const baseAmount = Number(booking.base_amount ?? booking.baseAmount ?? 0);
  const taxAmount = Number(booking.tax_amount ?? booking.taxAmount ?? booking.gst_amount ?? 0);
  const gstRate = Number(booking.gst_rate ?? booking.gstRate ?? 18);
  const cgstRate = Number(booking.cgst_rate ?? booking.cgstRate ?? 9);
  const sgstRate = Number(booking.sgst_rate ?? booking.sgstRate ?? 9);
  const gstAmount = Number(booking.gst_amount ?? booking.gstAmount ?? taxAmount);
  const cgstAmount = Number(booking.cgst_amount ?? booking.cgstAmount ?? (gstAmount / 2));
  const sgstAmount = Number(booking.sgst_amount ?? booking.sgstAmount ?? (gstAmount / 2));
  const totalAmount = Number(booking.total_amount ?? booking.totalAmount ?? (baseAmount + gstAmount));
  const paidAmount = Number(booking.paid_amount ?? booking.paidAmount ?? 0);
  const dueAmount = Number(booking.due_amount ?? booking.dueAmount ?? Math.max(0, totalAmount - paidAmount));
  const notes = booking.notes || "";

  // Rooms List
  const rooms = useMemo(() => {
    if (Array.isArray(booking.rooms) && booking.rooms.length > 0) {
      return booking.rooms.map((r, i) => ({
        id: r.id || i,
        roomNumber: r.room_number || r.roomNumber || "N/A",
        floor: r.floor !== undefined ? r.floor : (parseInt(r.room_number || "101", 10) >= 100 ? Math.floor(parseInt(r.room_number, 10) / 100) : 1),
        roomType: r.room_type_name || r.roomType || "Standard Room",
        pricePerNight: baseAmount ? Math.round((baseAmount / nights) * 100) / 100 : 0,
        numberOfNights: nights,
        roomTotal: baseAmount,
      }));
    }
    const rNum = booking.room_number || booking.roomNumber || "206";
    const rType = booking.room_type_name || booking.roomType || "Family Room";
    const fl = booking.floor !== undefined ? booking.floor : 2;
    return [
      {
        id: 1,
        roomNumber: rNum,
        floor: fl,
        roomType: rType,
        pricePerNight: baseAmount ? Math.round((baseAmount / nights) * 100) / 100 : 0,
        numberOfNights: nights,
        roomTotal: baseAmount,
      },
    ];
  }, [booking.rooms, baseAmount, nights]);

  // Payment History List
  const paymentHistory = useMemo(() => {
    if (Array.isArray(booking.payment_history) && booking.payment_history.length > 0) {
      return booking.payment_history.map((p, idx) => ({
        id: p.id || idx,
        date: p.received_at
          ? new Date(p.received_at).toLocaleDateString("en-IN") + " " + new Date(p.received_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })
          : p.created_at
          ? new Date(p.created_at).toLocaleDateString("en-IN")
          : "At Check-In",
        transactionId: `TXN-${String(p.id || idx + 101).padStart(5, "0")}`,
        source: p.source || "BOOKING",
        method: p.payment_method || "CASH",
        amount: Number(p.amount || 0),
        status: (p.status || "PARTIALLY_PAID").toUpperCase(),
        receivedBy: p.received_by?.name || creator?.name || "Front Desk",
      }));
    }
    if (paidAmount > 0) {
      return [
        {
          id: 1,
          date: actualCheckIn ? new Date(actualCheckIn).toLocaleDateString("en-IN") : "At Check-In",
          transactionId: `TXN-${bookingNumber}`,
          source: "BOOKING",
          method: "CASH",
          amount: paidAmount,
          status: paymentStatus,
          receivedBy: creator?.name || "Front Desk",
        },
      ];
    }
    return [];
  }, [booking.payment_history, paidAmount, actualCheckIn, bookingNumber, paymentStatus, creator]);

  // ID Proof Images (array of Tigris S3 URLs, local uploads, or candidate fields)
  const images = useMemo(() => {
    const list = [];
    const seen = new Set();

    const addImg = (val) => {
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach(addImg);
        return;
      }
      if (typeof val === "object" && val !== null) {
        if (val.frontImage || val.front_image || val.front || val.frontImageUrl || val.front_image_url) {
          addImg(val.frontImage || val.front_image || val.front || val.frontImageUrl || val.front_image_url);
        }
        if (val.backImage || val.back_image || val.back || val.backImageUrl || val.back_image_url) {
          addImg(val.backImage || val.back_image || val.back || val.backImageUrl || val.back_image_url);
        }
        if (val.id_proof_front || val.idProofFront || val.id_proof_front_image) {
          addImg(val.id_proof_front || val.idProofFront || val.id_proof_front_image);
        }
        if (val.id_proof_back || val.idProofBack || val.id_proof_back_image) {
          addImg(val.id_proof_back || val.idProofBack || val.id_proof_back_image);
        }
        if (val.id_proof_image || val.idProofImage || val.id_proof_url || val.idProofUrl) {
          addImg(val.id_proof_image || val.idProofImage || val.id_proof_url || val.idProofUrl);
        }
        if (val.govt_id_front || val.govtIdFront || val.govt_id_image || val.govtIdImage || val.govt_id_photo) {
          addImg(val.govt_id_front || val.govtIdFront || val.govt_id_image || val.govtIdImage || val.govt_id_photo);
        }
        if (val.govt_id_back || val.govtIdBack || val.govt_id_photo_back) {
          addImg(val.govt_id_back || val.govtIdBack || val.govt_id_photo_back);
        }
        if (val.id_card_front || val.idCardFront || val.id_card_image) {
          addImg(val.id_card_front || val.idCardFront || val.id_card_image);
        }
        if (val.id_card_back || val.idCardBack) {
          addImg(val.id_card_back || val.idCardBack);
        }
        if (val.url || val.secure_url || val.path || val.src || val.image || val.fileUrl || val.uri || val.data) {
          addImg(val.url || val.secure_url || val.path || val.src || val.image || val.fileUrl || val.uri || val.data);
        }
        if (Array.isArray(val.images)) val.images.forEach(addImg);
        if (Array.isArray(val.documents)) val.documents.forEach(addImg);
        if (Array.isArray(val.photos)) val.photos.forEach(addImg);
        return;
      }
      if (typeof val === "string") {
        const trimmed = val.trim();
        if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
          try {
            const parsed = JSON.parse(trimmed);
            addImg(parsed);
            return;
          } catch {}
        }
        if (trimmed.includes(",") && !trimmed.startsWith("data:")) {
          trimmed.split(",").forEach((item) => addImg(item.trim()));
          return;
        }
        const normalized = normalizeImageSrc(trimmed);
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          list.push(normalized);
        }
      }
    };

    const candidateSources = [
      booking,
      booking.guest,
      guestData,
      guestData?.guest,
      guestData?.booking,
      guestData?.activeBooking,
    ];

    candidateSources.forEach((src) => {
      if (!src || typeof src !== "object") return;
      addImg(src.images);
      addImg(src.documents);
      addImg(src.photos);
      addImg(src.front_image);
      addImg(src.frontImage);
      addImg(src.frontImageUrl);
      addImg(src.front_image_url);
      addImg(src.back_image);
      addImg(src.backImage);
      addImg(src.backImageUrl);
      addImg(src.back_image_url);
      addImg(src.idProof);
      addImg(src.id_proof);
      addImg(src.id_proof_image);
      addImg(src.idProofImage);
      addImg(src.id_proof_url);
      addImg(src.idProofUrl);
      addImg(src.id_proof_front);
      addImg(src.idProofFront);
      addImg(src.id_proof_back);
      addImg(src.idProofBack);
      addImg(src.govt_id_front);
      addImg(src.govtIdFront);
      addImg(src.govt_id_back);
      addImg(src.govtIdBack);
      addImg(src.govt_id_image);
      addImg(src.govtIdImage);
      addImg(src.govt_id_photo);
      addImg(src.id_card_front);
      addImg(src.id_card_back);
      if (Array.isArray(src.members)) {
        src.members.forEach((m) => {
          if (!m || typeof m !== "object") return;
          addImg(m.images);
          addImg(m.front_image || m.frontImage || m.frontImageUrl);
          addImg(m.back_image || m.backImage || m.backImageUrl);
          addImg(m.id_proof_image || m.idProofImage);
          addImg(m.photo || m.image);
        });
      }
      if (Array.isArray(src.accompanyingGuests)) {
        src.accompanyingGuests.forEach((m) => {
          if (!m || typeof m !== "object") return;
          addImg(m.images);
          addImg(m.front_image || m.frontImage);
          addImg(m.back_image || m.backImage);
          addImg(m.id_proof_image || m.idProofImage);
          addImg(m.photo || m.image);
        });
      }
    });

    return list;
  }, [booking, guestData]);

  // Digital Signatures (array of Tigris S3 URLs, data URIs, or candidate fields)
  const signatures = useMemo(() => {
    const list = [];
    const seen = new Set();

    const addSig = (val) => {
      if (!val) return;
      if (Array.isArray(val)) {
        val.forEach(addSig);
        return;
      }
      if (typeof val === "object" && val !== null) {
        if (val.url || val.secure_url || val.path || val.src || val.image || val.fileUrl || val.uri || val.data || val.signature) {
          addSig(val.url || val.secure_url || val.path || val.src || val.image || val.fileUrl || val.uri || val.data || val.signature);
        }
        return;
      }
      if (typeof val === "string") {
        const trimmed = val.trim();
        if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
          try {
            const parsed = JSON.parse(trimmed);
            addSig(parsed);
            return;
          } catch {}
        }
        const normalized = normalizeImageSrc(trimmed);
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          list.push(normalized);
        }
      }
    };

    const candidateSources = [
      booking,
      booking.guest,
      guestData,
      guestData?.guest,
      guestData?.booking,
      guestData?.activeBooking,
    ];

    candidateSources.forEach((src) => {
      if (!src || typeof src !== "object") return;
      addSig(src.signatures);
      addSig(src.signature);
      addSig(src.signature_url);
      addSig(src.signatureUrl);
      addSig(src.signature_image);
      addSig(src.signatureImage);
      addSig(src.guest_signature);
      addSig(src.guestSignature);
      addSig(src.guest_signature_url);
      addSig(src.guestSignatureUrl);
      addSig(src.digital_signature);
      addSig(src.digitalSignature);
      addSig(src.e_signature);
      addSig(src.eSignature);
      addSig(src.idProof?.signature);
      addSig(src.idProof?.signatureUrl);
      addSig(src.idProof?.guestSignature);
    });

    return list;
  }, [booking, guestData]);

  // Folio Print / Print Invoice Handler
  const handlePrintFolio = () => {
    window.print();
  };

  if (!open) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        scroll="paper"
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              border: `1px solid ${themeConfig.border}`,
              boxShadow: isDarkMode ? "0 20px 60px rgba(0,0,0,0.6)" : "0 20px 60px rgba(12,39,59,0.15)",
              overflow: "hidden",
              maxHeight: "92vh",
            },
          },
        }}
      >
        {/* ================= MODAL HEADER ================= */}
        <DialogTitle
          component="div"
          sx={{
            p: { xs: 2, sm: 2.5 },
            bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(238, 245, 240, 0.7)",
            borderBottom: `1px solid ${themeConfig.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
            <Avatar
              sx={{
                bgcolor: themeConfig.primary,
                color: "#FFFFFF",
                width: 48,
                height: 48,
                fontWeight: 900,
                fontSize: "1.2rem",
                boxShadow: `0 4px 14px ${themeConfig.primaryGlow}`,
              }}
            >
              {primaryGuestName.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "1.15rem" }}>
                  {primaryGuestName}
                </Typography>
                <StatusChip status={bookingStatus} />
                <Chip
                  label={paymentStatus === "PAID" ? "FULLY PAID" : paymentStatus === "PARTIALLY_PAID" ? "PARTIALLY PAID" : "PENDING DUE"}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    bgcolor:
                      paymentStatus === "PAID"
                        ? "rgba(16, 185, 129, 0.15)"
                        : paymentStatus === "PARTIALLY_PAID"
                        ? "rgba(245, 158, 11, 0.15)"
                        : "rgba(239, 68, 68, 0.15)",
                    color:
                      paymentStatus === "PAID"
                        ? "#10B981"
                        : paymentStatus === "PARTIALLY_PAID"
                        ? "#F59E0B"
                        : "#EF4444",
                    border: `1px solid ${
                      paymentStatus === "PAID"
                        ? "rgba(16, 185, 129, 0.3)"
                        : paymentStatus === "PARTIALLY_PAID"
                        ? "rgba(245, 158, 11, 0.3)"
                        : "rgba(239, 68, 68, 0.3)"
                    }`,
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, fontFamily: "monospace" }}>
                Booking Ref: {bookingNumber} &bull; Property: {hotelName}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Tooltip title="Print Guest Folio / Bill">
              <IconButton onClick={handlePrintFolio} size="small" sx={{ color: themeConfig.primary }}>
                <Print sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <IconButton onClick={onClose} size="small" sx={{ color: themeConfig.textMuted, "&:hover": { color: "#EF4444" } }}>
              <Close sx={{ fontSize: 22 }} />
            </IconButton>
          </Box>
        </DialogTitle>

        {/* ================= TABS NAVIGATION ================= */}
        <Box sx={{ px: 2.5, borderBottom: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(0,0,0,0.15)" : "#FAFCFB" }}>
          <Tabs
            value={activeTab}
            onChange={(_, nv) => setActiveTab(nv)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 46,
              "& .MuiTab-root": {
                fontWeight: 800,
                fontSize: "0.85rem",
                textTransform: "none",
                minHeight: 46,
                color: themeConfig.textMuted,
                "&.Mui-selected": { color: themeConfig.primary },
              },
              "& .MuiTabs-indicator": { bgcolor: themeConfig.primary, height: 3, borderRadius: "3px" },
            }}
          >
            <Tab icon={<Person sx={{ fontSize: 17 }} />} iconPosition="start" label="Guest & Stay Details" />
            <Tab icon={<BadgeOutlined sx={{ fontSize: 17 }} />} iconPosition="start" label={`ID Proofs & Signatures (${images.length + signatures.length})`} />
            <Tab icon={<CreditCard sx={{ fontSize: 17 }} />} iconPosition="start" label="Billing & Payments" />
          </Tabs>
        </Box>

        {/* ================= MODAL CONTENT ================= */}
        <DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, gap: 2 }}>
              <CircularProgress sx={{ color: themeConfig.primary }} />
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                Loading comprehensive booking details...
              </Typography>
            </Box>
          ) : (
            <>
              {/* ================= TAB 0: GUEST & STAY PROFILE ================= */}
              {activeTab === 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {/* 1. Primary Guest Profile */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: "16px",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <Person sx={{ fontSize: 18, color: themeConfig.primary }} />
                      Primary Guest Profile
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Primary Guest Name</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {primaryGuestName}
                        </Typography>
                      </Grid>

                      {secondaryGuestName && (
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Secondary Guest</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                            {secondaryGuestName}
                          </Typography>
                        </Grid>
                      )}

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Mobile Number</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Phone sx={{ fontSize: 13, color: themeConfig.primary }} />
                          {mobileNumber}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Email Address</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Email sx={{ fontSize: 13, color: themeConfig.primary }} />
                          {email}
                        </Typography>
                      </Grid>

                      {address && (
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Address / City</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 0.5 }}>
                            <LocationOn sx={{ fontSize: 13, color: themeConfig.primary }} />
                            {address}
                          </Typography>
                        </Grid>
                      )}

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Hotel Property</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary }}>
                          {hotelName}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Checked In / Handled By</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {creator?.name ? `${creator.name} (${creator.role || "Staff"})` : "Front Desk"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* 2. Stay Schedule & Duration */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: "16px",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarMonth sx={{ fontSize: 18, color: themeConfig.primary }} />
                      Stay Schedule & Timeline
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Booking Number / Ref</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary, fontFamily: "monospace" }}>
                          {bookingNumber}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Check-In Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {checkInDate ? new Date(checkInDate).toLocaleDateString("en-IN") : "N/A"}
                        </Typography>
                        {actualCheckIn && (
                          <Typography variant="caption" sx={{ color: "#10B981", fontWeight: 700, display: "block" }}>
                            Actual: {new Date(actualCheckIn).toLocaleDateString("en-IN") + " " + new Date(actualCheckIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </Typography>
                        )}
                      </Grid>

                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Check-Out Date</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {checkOutDate ? new Date(checkOutDate).toLocaleDateString("en-IN") : "N/A"}
                        </Typography>
                        {actualCheckOut ? (
                          <Typography variant="caption" sx={{ color: "#10B981", fontWeight: 700, display: "block" }}>
                            Actual: {new Date(actualCheckOut).toLocaleDateString("en-IN") + " " + new Date(actualCheckOut).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                          </Typography>
                        ) : (
                          <Typography variant="caption" sx={{ color: "#F59E0B", fontWeight: 700, display: "block" }}>
                            Actual: In-House Resident
                          </Typography>
                        )}
                      </Grid>

                      <Grid size={{ xs: 12, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Duration & Guests</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary }}>
                          {nights} Night(s) &bull; {adults} Adult(s), {children} Child
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* 3. Allocated Room Breakdown */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: "16px",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <MeetingRoom sx={{ fontSize: 18, color: themeConfig.primary }} />
                      Allocated Room Details ({rooms.length})
                    </Typography>

                    <Grid container spacing={2}>
                      {rooms.map((rm, idx) => (
                        <Grid key={rm.id || idx} size={{ xs: 12, sm: 6 }}>
                          <Paper
                            elevation={0}
                            sx={{
                              p: 2,
                              borderRadius: "14px",
                              border: `1.5px solid ${themeConfig.border}`,
                              bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                            }}
                          >
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                                  Room #{rm.roomNumber}
                                </Typography>
                                <Chip
                                  label={`Floor ${rm.floor}`}
                                  size="small"
                                  sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, fontWeight: 800, fontSize: "0.7rem", height: 22 }}
                                />
                              </Box>
                              <Chip label={bookingStatus} size="small" sx={{ fontWeight: 800, fontSize: "0.7rem" }} />
                            </Box>

                            <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                              {rm.roomType}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", mt: 0.3 }}>
                              ₹{rm.pricePerNight?.toLocaleString()} / night &bull; {rm.numberOfNights} Night(s)
                            </Typography>

                            <Divider sx={{ my: 1 }} />
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>
                                Base Room Total:
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primaryDark }}>
                                ₹{rm.roomTotal?.toLocaleString()}
                              </Typography>
                            </Box>
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Paper>

                  {/* 4. Govt ID KYC Document & Signature Highlights */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: "16px",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
                        <BadgeOutlined sx={{ fontSize: 18, color: themeConfig.primary }} />
                        Govt Identity KYC Proofs &amp; Signatures ({images.length + signatures.length})
                      </Typography>
                      <Button
                        size="small"
                        onClick={() => setActiveTab(1)}
                        sx={{ textTransform: "none", fontWeight: 800, color: themeConfig.primary, fontSize: "0.8rem" }}
                      >
                        Open Full KYC Tab &rarr;
                      </Button>
                    </Box>

                    {images.length > 0 || signatures.length > 0 ? (
                      <Grid container spacing={2}>
                        {images.map((imgUrl, idx) => (
                          <Grid key={`quick-img-${idx}`} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.2,
                                borderRadius: "12px",
                                border: `1px solid ${themeConfig.border}`,
                                bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                                textAlign: "center",
                                transition: "all 0.2s ease",
                                "&:hover": { borderColor: themeConfig.primary, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                              }}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.74rem" }} noWrap>
                                  📄 {idx === 0 ? "Front ID (Primary)" : idx === 1 ? "Back ID" : `Document #${idx + 1}`}
                                </Typography>
                                <Chip
                                  icon={<FileDownload sx={{ fontSize: "13px !important" }} />}
                                  label="Download"
                                  size="small"
                                  clickable
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(imgUrl, `${primaryGuestName}_ID_${idx + 1}.png`);
                                  }}
                                  sx={{
                                    height: 20,
                                    fontSize: "0.65rem",
                                    fontWeight: 800,
                                    bgcolor: "rgba(11, 142, 224, 0.1)",
                                    color: "#0B8EE0",
                                  }}
                                />
                              </Box>
                              <Box
                                component="img"
                                src={imgUrl}
                                alt={`ID Proof ${idx + 1}`}
                                onClick={() => setPreviewImage(imgUrl)}
                                sx={{
                                  width: "100%",
                                  height: 120,
                                  objectFit: "contain",
                                  bgcolor: isDarkMode ? "rgba(0,0,0,0.25)" : "#FFFFFF",
                                  border: `1px solid ${themeConfig.border}`,
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  transition: "transform 0.2s",
                                  "&:hover": { transform: "scale(1.02)" },
                                }}
                              />
                            </Paper>
                          </Grid>
                        ))}

                        {signatures.map((sigUrl, sIdx) => (
                          <Grid key={`quick-sig-${sIdx}`} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.2,
                                borderRadius: "12px",
                                border: `1px solid ${themeConfig.border}`,
                                bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                                textAlign: "center",
                                transition: "all 0.2s ease",
                                "&:hover": { borderColor: "#10B981" },
                              }}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.74rem" }} noWrap>
                                  ✍️ Signature #{sIdx + 1}
                                </Typography>
                                <Chip
                                  icon={<FileDownload sx={{ fontSize: "13px !important" }} />}
                                  label="Download"
                                  size="small"
                                  clickable
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(sigUrl, `${primaryGuestName}_Signature_${sIdx + 1}.png`);
                                  }}
                                  sx={{
                                    height: 20,
                                    fontSize: "0.65rem",
                                    fontWeight: 800,
                                    bgcolor: "rgba(16, 185, 129, 0.1)",
                                    color: "#10B981",
                                  }}
                                />
                              </Box>
                              <Box
                                component="img"
                                src={sigUrl}
                                alt={`Signature ${sIdx + 1}`}
                                onClick={() => setPreviewImage(sigUrl)}
                                sx={{
                                  width: "100%",
                                  height: 100,
                                  objectFit: "contain",
                                  bgcolor: isDarkMode ? "rgba(0,0,0,0.25)" : "#FFFFFF",
                                  border: `1px solid ${themeConfig.border}`,
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  transition: "transform 0.2s",
                                  "&:hover": { transform: "scale(1.02)" },
                                }}
                              />
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box sx={{ py: 3, textAlign: "center", color: themeConfig.textMuted }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
                          No KYC Document Photos Uploaded
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}

              {/* ================= TAB 1: KYC DOCUMENTS & SIGNATURES ================= */}
              {activeTab === 1 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {/* ID Proof Photos */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: "16px",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
                        <BadgeOutlined sx={{ fontSize: 18, color: themeConfig.primary }} />
                        Govt Identity KYC Documents ({images.length})
                      </Typography>
                      {images.length > 0 && (
                        <Chip
                          label={`${images.length} Document${images.length > 1 ? "s" : ""} Attached`}
                          size="small"
                          sx={{ bgcolor: "rgba(11, 142, 224, 0.12)", color: "#0B8EE0", fontWeight: 800 }}
                        />
                      )}
                    </Box>

                    {images.length > 0 ? (
                      <Grid container spacing={2}>
                        {images.map((imgUrl, idx) => (
                          <Grid key={idx} size={{ xs: 12, sm: 6, md: 4 }}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                borderRadius: "12px",
                                border: `1px solid ${themeConfig.border}`,
                                bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                                textAlign: "center",
                                transition: "all 0.2s ease",
                                "&:hover": { borderColor: themeConfig.primary, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" },
                              }}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                  📄 {idx === 0 ? "Front ID (Primary KYC)" : idx === 1 ? "Back ID" : `KYC Document #${idx + 1}`}
                                </Typography>
                                <Chip
                                  icon={<FileDownload sx={{ fontSize: "14px !important" }} />}
                                  label="Download"
                                  size="small"
                                  clickable
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(imgUrl, `${primaryGuestName}_ID_${idx + 1}.png`);
                                  }}
                                  sx={{
                                    height: 20,
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    bgcolor: "rgba(11, 142, 224, 0.1)",
                                    color: "#0B8EE0",
                                  }}
                                />
                              </Box>
                              <Box
                                component="img"
                                src={imgUrl}
                                alt={`KYC Proof ${idx + 1}`}
                                onClick={() => setPreviewImage(imgUrl)}
                                sx={{
                                  width: "100%",
                                  height: 150,
                                  objectFit: "contain",
                                  bgcolor: isDarkMode ? "rgba(0,0,0,0.25)" : "#FFFFFF",
                                  border: `1px solid ${themeConfig.border}`,
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  transition: "transform 0.2s",
                                  "&:hover": { transform: "scale(1.02)" },
                                }}
                              />
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box sx={{ py: 4, textAlign: "center", color: themeConfig.textMuted }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          No KYC Document Photos Uploaded
                        </Typography>
                      </Box>
                    )}
                  </Paper>

                  {/* Digital Signatures */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: "16px",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
                        ✍️ Guest Digital E-Signatures ({signatures.length})
                      </Typography>
                      {signatures.length > 0 && (
                        <Chip
                          label={`${signatures.length} Signature${signatures.length > 1 ? "s" : ""} On File`}
                          size="small"
                          sx={{ bgcolor: "rgba(16, 185, 129, 0.12)", color: "#10B981", fontWeight: 800 }}
                        />
                      )}
                    </Box>

                    {signatures.length > 0 ? (
                      <Grid container spacing={2}>
                        {signatures.map((sigUrl, sIdx) => (
                          <Grid key={sIdx} size={{ xs: 12, sm: signatures.length === 1 ? 12 : 6 }}>
                            <Paper
                              elevation={0}
                              sx={{
                                p: 1.5,
                                borderRadius: "12px",
                                border: `1px solid ${themeConfig.border}`,
                                bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                                textAlign: "center",
                                transition: "all 0.2s ease",
                                "&:hover": { borderColor: "#10B981" },
                              }}
                            >
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                  ✍️ Signature Record #{sIdx + 1}
                                </Typography>
                                <Chip
                                  icon={<FileDownload sx={{ fontSize: "14px !important" }} />}
                                  label="Download"
                                  size="small"
                                  clickable
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadImage(sigUrl, `${primaryGuestName}_Signature_${sIdx + 1}.png`);
                                  }}
                                  sx={{
                                    height: 20,
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    bgcolor: "rgba(16, 185, 129, 0.1)",
                                    color: "#10B981",
                                  }}
                                />
                              </Box>
                              <Box
                                component="img"
                                src={sigUrl}
                                alt={`Signature ${sIdx + 1}`}
                                onClick={() => setPreviewImage(sigUrl)}
                                sx={{
                                  width: "100%",
                                  height: 120,
                                  objectFit: "contain",
                                  bgcolor: isDarkMode ? "rgba(0,0,0,0.25)" : "#FFFFFF",
                                  border: `1px solid ${themeConfig.border}`,
                                  borderRadius: "8px",
                                  cursor: "pointer",
                                  transition: "transform 0.2s",
                                  "&:hover": { transform: "scale(1.02)" },
                                }}
                              />
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box sx={{ py: 4, textAlign: "center", color: themeConfig.textMuted }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          No Digital Signatures Recorded
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}

              {/* ================= TAB 2: BILLING & FOLIO LEDGER ================= */}
              {activeTab === 2 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {/* Financial Settlement Snapshot */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: "16px",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
                        <Receipt sx={{ fontSize: 18, color: themeConfig.primary }} />
                        Financial Settlement &amp; Taxes
                      </Typography>
                      <Chip
                        label={paymentStatus === "PAID" ? "FULLY SETTLED" : paymentStatus === "PARTIALLY_PAID" ? "PARTIALLY PAID" : "PENDING DUE"}
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          bgcolor:
                            paymentStatus === "PAID"
                              ? "rgba(16, 185, 129, 0.15)"
                              : paymentStatus === "PARTIALLY_PAID"
                              ? "rgba(245, 158, 11, 0.15)"
                              : "rgba(239, 68, 68, 0.15)",
                          color:
                            paymentStatus === "PAID"
                              ? "#10B981"
                              : paymentStatus === "PARTIALLY_PAID"
                              ? "#F59E0B"
                              : "#EF4444",
                        }}
                      />
                    </Box>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Base Room Charge</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                          ₹{baseAmount.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.7rem" }}>
                          ₹{Math.round((baseAmount / nights) * 100) / 100}/night &bull; {nights} night(s)
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                          GST ({gstRate}%)
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                          ₹{gstAmount.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.7rem" }}>
                          CGST ({cgstRate}%): ₹{cgstAmount} | SGST ({sgstRate}%): ₹{sgstAmount}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Total Paid to Date</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: "#10B981" }}>
                          ₹{paidAmount.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#10B981", fontSize: "0.7rem", fontWeight: 700 }}>
                          ✓ Received &amp; Logged
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6, sm: 3 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Pending Balance Due</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: dueAmount > 0 ? "#EF4444" : "#10B981" }}>
                          {dueAmount > 0 ? `₹${dueAmount.toLocaleString()}` : "✓ Settled"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: dueAmount > 0 ? "#EF4444" : "#10B981", fontSize: "0.7rem", fontWeight: 700 }}>
                          {dueAmount > 0 ? "⚠️ Collect at Desk" : "No Balance Dues"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Itemized Folio Table */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: "16px",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <Receipt sx={{ fontSize: 18, color: themeConfig.primary }} />
                      Itemized Tax Invoice Breakdown
                    </Typography>

                    <TableContainer sx={{ borderRadius: "12px", border: `1px solid ${themeConfig.border}`, overflowX: "auto" }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Description / Item</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Rate / Night</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Duration</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain }}>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                              Room #{rooms[0]?.roomNumber} ({rooms[0]?.roomType})
                            </TableCell>
                            <TableCell>₹{Math.round((baseAmount / nights) * 100) / 100}</TableCell>
                            <TableCell>{nights} Night(s)</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>₹{baseAmount.toLocaleString()}</TableCell>
                          </TableRow>

                          <TableRow sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC" }}>
                            <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                              CGST ({cgstRate}%)
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>₹{cgstAmount.toLocaleString()}</TableCell>
                          </TableRow>

                          <TableRow sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC" }}>
                            <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                              SGST ({sgstRate}%)
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>₹{sgstAmount.toLocaleString()}</TableCell>
                          </TableRow>

                          <TableRow sx={{ borderTop: `2px solid ${themeConfig.border}` }}>
                            <TableCell colSpan={3} sx={{ fontWeight: 900, fontSize: "0.95rem", color: themeConfig.textMain }}>Grand Total Payable</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, fontSize: "1rem", color: themeConfig.primary }}>₹{totalAmount.toLocaleString()}</TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell colSpan={3} sx={{ fontWeight: 800, color: "#10B981" }}>Total Amount Paid</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, color: "#10B981" }}>₹{paidAmount.toLocaleString()}</TableCell>
                          </TableRow>

                          <TableRow sx={{ bgcolor: dueAmount > 0 ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)" }}>
                            <TableCell colSpan={3} sx={{ fontWeight: 900, color: dueAmount > 0 ? "#EF4444" : "#10B981" }}>
                              {dueAmount > 0 ? "⚠️ Outstanding Balance Due" : "✓ Folio Completely Cleared"}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, fontSize: "1rem", color: dueAmount > 0 ? "#EF4444" : "#10B981" }}>
                              ₹{dueAmount.toLocaleString()}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {notes && (
                      <Box sx={{ mt: 1.5, p: 1.2, borderRadius: "8px", bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC", border: `1px solid ${themeConfig.border}` }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Settlement Note: </Typography>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain }}>{notes}</Typography>
                      </Box>
                    )}
                  </Paper>

                  {/* Payment Transaction History */}
                  <Paper
                    elevation={0}
                    sx={{
                      p: 2.2,
                      borderRadius: "16px",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <PaymentIcon sx={{ fontSize: 18, color: themeConfig.primary }} />
                      Payment Transaction History ({paymentHistory.length})
                    </Typography>

                    {paymentHistory.length > 0 ? (
                      <TableContainer sx={{ borderRadius: "12px", border: `1px solid ${themeConfig.border}`, overflowX: "auto" }}>
                        <Table size="small">
                          <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 800 }}>Date &amp; Time</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Transaction ID</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Source / Method</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Received By</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Amount Paid</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {paymentHistory.map((p, idx) => (
                              <TableRow key={p.id || idx}>
                                <TableCell sx={{ fontWeight: 700 }}>{p.date}</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: themeConfig.primary, fontFamily: "monospace" }}>{p.transactionId}</TableCell>
                                <TableCell>
                                  <Chip label={`${p.source} (${p.method})`} size="small" sx={{ fontWeight: 800, fontSize: "0.7rem", bgcolor: themeConfig.champagne, color: themeConfig.primaryDark }} />
                                </TableCell>
                                <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                  {p.receivedBy}
                                </TableCell>
                                <TableCell sx={{ fontWeight: 900, color: "#10B981" }}>₹{p.amount?.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={p.status}
                                    size="small"
                                    color={p.status === "PAID" || p.status === "PARTIALLY_PAID" ? "success" : "default"}
                                    sx={{ fontWeight: 800, fontSize: "0.7rem" }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ py: 3, textAlign: "center", color: themeConfig.textMuted }}>
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          No payment transactions logged yet. Balance of ₹{dueAmount.toLocaleString()} is pending.
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Full-Screen Image Preview Modal */}
      {previewImage && (
        <Dialog open={Boolean(previewImage)} onClose={() => setPreviewImage(null)} maxWidth="lg">
          <Box sx={{ position: "relative", p: 1, bgcolor: "#000000" }}>
            <IconButton
              onClick={() => setPreviewImage(null)}
              sx={{ position: "absolute", top: 8, right: 8, color: "#FFFFFF", bgcolor: "rgba(0,0,0,0.6)" }}
            >
              <Close />
            </IconButton>
            <Box
              component="img"
              src={previewImage}
              alt="Preview"
              sx={{ maxWidth: "90vw", maxHeight: "85vh", objectFit: "contain", display: "block" }}
            />
          </Box>
        </Dialog>
      )}
    </>
  );
}
