"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Button,
  Grid,
  Chip,
  Avatar,
  Paper,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tooltip,
  Tabs,
  Tab,
} from "@mui/material";
import {
  Close,
  Person,
  Phone,
  Email,
  Badge,
  BadgeOutlined,
  CalendarMonth,
  MeetingRoom,
  CreditCard,
  History,
  CheckCircle,
  WarningAmber,
  Receipt,
  Payments as PaymentIcon,
  Timeline as TimelineIcon,
  RoomService,
  Home,
  DoneAll,
  Visibility,
  FileDownload,
  LocationOn,
  Group,
  WhatsApp,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import StatusChip from "@/shared/components/StatusChip";
import { downloadGuestFolioPDF } from "@/shared/utils/pdfGenerator";
import { downloadAllGuestIdImages, downloadSingleImage, sanitizeFilename } from "@/shared/utils/idProofDownloader";
import { sendCheckInWhatsApp, sendCheckoutBillWhatsApp } from "@/shared/utils/whatsappUtils";
import { formatTime12Hour } from "@/shared/utils/timeUtils";
import { toast } from "@/shared/utils/toast";

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
  const [details, setDetails] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);

  const targetId =
    guestId ||
    guestData?.guest?._id ||
    guestData?.guestId ||
    guestData?._id ||
    guestData?.id;

  useEffect(() => {
    if (!open) {
      setDetails(null);
      return;
    }

    if (!targetId || String(targetId).startsWith("b-")) {
      const g = guestData?.guest || guestData || {};
      const b = guestData?.booking || guestData?.activeBooking || null;
      setDetails({
        guest: g,
        activeBooking: b,
        roomsDetail: [],
        paymentDetails: null,
        paymentHistory: [],
        timeline: [],
      });
      return;
    }

    setLoading(true);
    const endpoint = API_ENDPOINTS.RECEPTIONIST.GUEST_BY_ID(targetId);
    apiRequest(endpoint)
      .then((res) => {
        if (res?.success && res?.data) {
          const apiData = res.data;
          if (!apiData.activeBooking && (guestData?.booking || guestData?.activeBooking)) {
            apiData.activeBooking = guestData.booking || guestData.activeBooking;
          }
          if (!apiData.guest && guestData) {
            apiData.guest = guestData.guest || guestData;
          }
          setDetails(apiData);
        } else {
          // Fallback to locally passed data if API response structure is basic
          setDetails({
            guest: guestData?.guest || guestData,
            activeBooking: guestData?.booking || guestData?.activeBooking || null,
            roomsDetail: [],
            paymentDetails: null,
            paymentHistory: [],
            timeline: [],
          });
        }
      })
      .catch((err) => {
        console.warn("Could not fetch detailed guest data, using fallback:", err);
        setDetails({
          guest: guestData?.guest || guestData,
          activeBooking: guestData?.booking || guestData?.activeBooking || null,
          roomsDetail: [],
          paymentDetails: null,
          paymentHistory: [],
          timeline: [],
        });
      })
      .finally(() => setLoading(false));
  }, [open, targetId, guestData]);

  if (!open) return null;

  const guest = details?.guest || guestData || {};
  const activeBooking = details?.activeBooking || null;
  const roomsDetail = details?.roomsDetail || [];
  const paymentDetails = details?.paymentDetails || null;
  const paymentHistory = details?.paymentHistory || [];
  const timeline = details?.timeline || [];
  const accompanyingGuests = (
    (activeBooking?.accompanyingGuests && activeBooking.accompanyingGuests.length > 0)
      ? activeBooking.accompanyingGuests
      : (activeBooking?.members && activeBooking.members.length > 0)
        ? activeBooking.members
        : (guest?.accompanyingGuests && guest.accompanyingGuests.length > 0)
          ? guest.accompanyingGuests
          : (guest?.members && guest.members.length > 0)
            ? guest.members
            : (guestData?.accompanyingGuests && guestData.accompanyingGuests.length > 0)
              ? guestData.accompanyingGuests
              : (guestData?.members && guestData.members.length > 0)
                ? guestData.members
                : (guestData?.booking?.accompanyingGuests && guestData.booking.accompanyingGuests.length > 0)
                  ? guestData.booking.accompanyingGuests
                  : (guestData?.booking?.members && guestData.booking.members.length > 0)
                    ? guestData.booking.members
                    : []
  );

  const bookingStatus = activeBooking?.status || (guest.status === "IN-HOUSE" ? "CHECKED_IN" : guest.status || "REGISTERED");

  const rawDue = paymentDetails?.dueAmount !== undefined ? paymentDetails.dueAmount : (activeBooking?.dueAmount !== undefined ? activeBooking.dueAmount : (guest?.dueAmount !== undefined ? guest.dueAmount : guest?.balanceAmount));
  const rawPaid = paymentDetails?.paidAmount !== undefined ? paymentDetails.paidAmount : (activeBooking?.paidAmount !== undefined ? activeBooking.paidAmount : (guest?.paidAmount !== undefined ? guest.paidAmount : guest?.advanceAmount || 0));
  const rawTotal = paymentDetails?.totalAmount !== undefined ? paymentDetails.totalAmount : (activeBooking?.totalAmount !== undefined ? activeBooking.totalAmount : (guest?.totalAmount || 0));

  let guestPayStatus = (paymentDetails?.paymentStatus || activeBooking?.paymentStatus || guest?.paymentStatus || "").toUpperCase();
  if (guestPayStatus === "PARTIALLY_PAID") guestPayStatus = "PARTIAL";
  if (!guestPayStatus || guestPayStatus === "PENDING") {
    if (rawDue !== undefined && rawDue !== null && Number(rawDue) <= 0 && (Number(rawPaid) > 0 || Number(rawTotal) > 0)) {
      guestPayStatus = "PAID";
    } else if (Number(rawPaid) > 0) {
      guestPayStatus = "PARTIAL";
    } else {
      guestPayStatus = "PENDING";
    }
  }
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
              maxHeight: "90vh",
            },
          },
        }}
      >
        {/* Modal Header */}
        <DialogTitle
          component="div"
          sx={{
            p: { xs: 2, sm: 3 },
            bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(238, 245, 240, 0.7)",
            borderBottom: `1px solid ${themeConfig.border}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                bgcolor: themeConfig.primary,
                color: "#FFFFFF",
                width: 52,
                height: 52,
                fontWeight: 900,
                fontSize: "1.3rem",
                boxShadow: `0 4px 14px ${themeConfig.primaryGlow}`,
              }}
            >
              {(guest.fullName || guest.name || "G")[0]?.toUpperCase()}
            </Avatar>
            <div>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                  {guest.fullName || guest.name || "Guest Details"}
                </Typography>
                <StatusChip status={bookingStatus} />
                <Chip
                  label={guestPayStatus === "PAID" ? "PAID" : guestPayStatus === "PARTIAL" ? "PARTIAL" : "PENDING DUE"}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.72rem",
                    bgcolor:
                      guestPayStatus === "PAID"
                        ? "rgba(16, 185, 129, 0.15)"
                        : guestPayStatus === "PARTIAL"
                          ? "rgba(245, 158, 11, 0.15)"
                          : "rgba(239, 68, 68, 0.15)",
                    color:
                      guestPayStatus === "PAID"
                        ? "#10B981"
                        : guestPayStatus === "PARTIAL"
                          ? "#F59E0B"
                          : "#EF4444",
                    border: `1px solid ${guestPayStatus === "PAID"
                        ? "rgba(16, 185, 129, 0.3)"
                        : guestPayStatus === "PARTIAL"
                          ? "rgba(245, 158, 11, 0.3)"
                          : "rgba(239, 68, 68, 0.3)"
                      }`,
                  }}
                />
              </Box>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                {activeBooking?.bookingNumber ? `Booking #${activeBooking.bookingNumber}` : `Guest Folio: ${guest.mobileNumber || guest.phone || "N/A"}`}
              </Typography>
            </div>
          </Box>

          <IconButton onClick={onClose} sx={{ color: themeConfig.textMuted, "&:hover": { color: "#EF4444" } }}>
            <Close />
          </IconButton>
        </DialogTitle>

        {/* Navigation Tabs */}
        <Box sx={{ px: 3, borderBottom: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(0,0,0,0.15)" : "#FAFCFB" }}>
          <Tabs
            value={activeTab}
            onChange={(e, nv) => setActiveTab(nv)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              minHeight: 48,
              "& .MuiTab-root": {
                fontWeight: 800,
                fontSize: "0.85rem",
                textTransform: "none",
                minHeight: 48,
                color: themeConfig.textMuted,
                "&.Mui-selected": { color: themeConfig.primary },
              },
              "& .MuiTabs-indicator": { bgcolor: themeConfig.primary, height: 3, borderRadius: "3px" },
            }}
          >
            <Tab icon={<Person sx={{ fontSize: 18 }} />} iconPosition="start" label="Guest Profile & KYC" />
            <Tab icon={<MeetingRoom sx={{ fontSize: 18 }} />} iconPosition="start" label="Booking & Rooms" />
            <Tab icon={<CreditCard sx={{ fontSize: 18 }} />} iconPosition="start" label="Billing & Payments" />
            <Tab icon={<TimelineIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Activity Timeline" />
          </Tabs>
        </Box>

        {/* Content Area */}
        <DialogContent sx={{ p: { xs: 1.5, sm: 3 } }}>
          {loading ? (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", py: 8, gap: 2 }}>
              <CircularProgress sx={{ color: themeConfig.primary }} />
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                Loading comprehensive guest folio...
              </Typography>
            </Box>
          ) : (
            <>
              {/* ================= TAB 0: GUEST PROFILE & KYC ================= */}
              {activeTab === 0 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Basic Information Card */}
                  <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <Person sx={{ fontSize: 18, color: themeConfig.primary }} />
                      Personal Information
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Full Name</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {guest.fullName || guest.name || "N/A"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Mobile Number</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Phone sx={{ fontSize: 14, color: themeConfig.primary }} />
                          {guest.mobileNumber || guest.phone || "N/A"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Email Address</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Email sx={{ fontSize: 14, color: themeConfig.primary }} />
                          {guest.email || "Not Provided"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Gender</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {guest.gender || "Male"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Nationality</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {guest.nationality || "Indian"}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* KYC & ID Proof Card */}
                  <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
                        <BadgeOutlined sx={{ fontSize: 18, color: themeConfig.primary }} />
                        Govt KYC ID Proof
                      </Typography>
                      <Chip
                        label={guest.idProof?.verificationStatus === "VERIFIED" || guest.idVerified ? "VERIFIED ID" : "ON RECORD"}
                        size="small"
                        color={guest.idProof?.verificationStatus === "VERIFIED" || guest.idVerified ? "success" : "default"}
                        sx={{ fontWeight: 800 }}
                      />
                    </Box>

                    <Grid container spacing={2} sx={{ mb: 2 }}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>ID Document Type</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary }}>
                          {guest.idProof?.idType || guest.idType || guest.govtIdType || "AADHAAR"}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>ID Document Number</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, letterSpacing: 0.5 }}>
                          {guest.idProof?.idNumber || guest.idNumber || guest.govtIdNumber || "On Record"}
                        </Typography>
                      </Grid>
                    </Grid>

                    {/* ID Photos Preview */}
                    {(() => {
                      const frontIdPhoto =
                        guest.idProof?.frontImage ||
                        guest.idProof?.frontImageUrl ||
                        guest.frontImage ||
                        guest.frontImageUrl ||
                        guest.idProofImage ||
                        activeBooking?.idProof?.frontImage ||
                        activeBooking?.frontImage ||
                        null;

                      const backIdPhoto =
                        guest.idProof?.backImage ||
                        guest.idProof?.backImageUrl ||
                        guest.backImage ||
                        guest.backImageUrl ||
                        guest.idProofBackImage ||
                        activeBooking?.idProof?.backImage ||
                        activeBooking?.backImage ||
                        null;

                      return (
                        <>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", display: "block", mb: 1 }}>
                            Uploaded ID Proof Photos:
                          </Typography>
                          <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Paper
                                sx={{
                                  p: 1.5,
                                  borderRadius: "12px",
                                  border: `1px solid ${themeConfig.border}`,
                                  textAlign: "center",
                                  bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                                }}
                              >
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                    📄 Front ID Photo
                                  </Typography>
                                  {frontIdPhoto && (
                                    <Chip
                                      icon={<FileDownload sx={{ fontSize: "14px !important" }} />}
                                      label="Download"
                                      size="small"
                                      clickable
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const cleanName = sanitizeFilename(guest.fullName || guest.name || "Guest");
                                        downloadSingleImage(frontIdPhoto, `${cleanName}_Front_ID`);
                                      }}
                                      sx={{
                                        height: 20,
                                        fontSize: "0.68rem",
                                        fontWeight: 800,
                                        bgcolor: "rgba(11, 142, 224, 0.1)",
                                        color: "#0B8EE0",
                                        "&:hover": { bgcolor: "rgba(11, 142, 224, 0.2)" },
                                      }}
                                    />
                                  )}
                                </Box>
                                {frontIdPhoto ? (
                                  <Box
                                    component="img"
                                    src={frontIdPhoto}
                                    alt="Front ID"
                                    onClick={() => setPreviewImage(frontIdPhoto)}
                                    sx={{
                                      width: "100%",
                                      height: 150,
                                      objectFit: "contain",
                                      bgcolor: isDarkMode ? "rgba(0,0,0,0.25)" : "#FFFFFF",
                                      border: `1px solid ${themeConfig.border}`,
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      transition: "transform 0.2s, box-shadow 0.2s",
                                      "&:hover": { transform: "scale(1.02)", opacity: 0.95, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" },
                                    }}
                                  />
                                ) : (
                                  <Box sx={{ py: 4, color: themeConfig.textMuted }}>
                                    <Typography variant="caption">No Front Photo</Typography>
                                  </Box>
                                )}
                              </Paper>
                            </Grid>

                            <Grid size={{ xs: 12, sm: 6 }}>
                              <Paper
                                sx={{
                                  p: 1.5,
                                  borderRadius: "12px",
                                  border: `1px solid ${themeConfig.border}`,
                                  textAlign: "center",
                                  bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                                }}
                              >
                                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                    📄 Back ID Photo (Optional)
                                  </Typography>
                                  {backIdPhoto && (
                                    <Chip
                                      icon={<FileDownload sx={{ fontSize: "14px !important" }} />}
                                      label="Download"
                                      size="small"
                                      clickable
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        const cleanName = sanitizeFilename(guest.fullName || guest.name || "Guest");
                                        downloadSingleImage(backIdPhoto, `${cleanName}_Back_ID`);
                                      }}
                                      sx={{
                                        height: 20,
                                        fontSize: "0.68rem",
                                        fontWeight: 800,
                                        bgcolor: "rgba(11, 142, 224, 0.1)",
                                        color: "#0B8EE0",
                                        "&:hover": { bgcolor: "rgba(11, 142, 224, 0.2)" },
                                      }}
                                    />
                                  )}
                                </Box>
                                {backIdPhoto ? (
                                  <Box
                                    component="img"
                                    src={backIdPhoto}
                                    alt="Back ID"
                                    onClick={() => setPreviewImage(backIdPhoto)}
                                    sx={{
                                      width: "100%",
                                      height: 150,
                                      objectFit: "contain",
                                      bgcolor: isDarkMode ? "rgba(0,0,0,0.25)" : "#FFFFFF",
                                      border: `1px solid ${themeConfig.border}`,
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      transition: "transform 0.2s, box-shadow 0.2s",
                                      "&:hover": { transform: "scale(1.02)", opacity: 0.95, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" },
                                    }}
                                  />
                                ) : (
                                  <Box sx={{ py: 4, color: themeConfig.textMuted }}>
                                    <Typography variant="caption">No Back Photo Attached</Typography>
                                  </Box>
                                )}
                              </Paper>
                            </Grid>
                          </Grid>

                          {/* Digital Signature Card */}
                          {(() => {
                            const signaturePhoto =
                              guest?.signature ||
                              guest?.signatureUrl ||
                              guest?.guestSignature ||
                              activeBooking?.guestSignature ||
                              activeBooking?.signature ||
                              guestData?.signature ||
                              guestData?.guestSignature ||
                              guestData?.guest?.signature ||
                              guestData?.booking?.guestSignature ||
                              guestData?.booking?.signature ||
                              guestData?.activeBooking?.guestSignature ||
                              guestData?.activeBooking?.signature ||
                              null;

                            return (
                              <Box sx={{ mt: 2.5 }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", display: "block", mb: 1 }}>
                                  Guest E-Signature Record:
                                </Typography>
                                <Paper
                                  sx={{
                                    p: 1.5,
                                    borderRadius: "12px",
                                    border: `1px solid ${themeConfig.border}`,
                                    bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                                  }}
                                >
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 0.5 }}>
                                      ✍️ Guest Digital Signature
                                    </Typography>
                                    {signaturePhoto && (
                                      <Chip
                                        icon={<FileDownload sx={{ fontSize: "14px !important" }} />}
                                        label="Download"
                                        size="small"
                                        clickable
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const cleanName = sanitizeFilename(guest.fullName || guest.name || "Guest");
                                          downloadSingleImage(signaturePhoto, `${cleanName}_Digital_Signature`);
                                        }}
                                        sx={{
                                          height: 20,
                                          fontSize: "0.68rem",
                                          fontWeight: 800,
                                          bgcolor: "rgba(16, 185, 129, 0.1)",
                                          color: "#10B981",
                                          "&:hover": { bgcolor: "rgba(16, 185, 129, 0.2)" },
                                        }}
                                      />
                                    )}
                                  </Box>
                                  {signaturePhoto ? (
                                    <Box
                                      component="img"
                                      src={signaturePhoto}
                                      alt="Guest Digital Signature"
                                      onClick={() => setPreviewImage(signaturePhoto)}
                                      sx={{
                                        width: "100%",
                                        height: 110,
                                        objectFit: "contain",
                                        bgcolor: isDarkMode ? "rgba(0,0,0,0.25)" : "#FFFFFF",
                                        border: `1px solid ${themeConfig.border}`,
                                        borderRadius: "8px",
                                        cursor: "pointer",
                                        p: 1,
                                        transition: "transform 0.2s, box-shadow 0.2s",
                                        "&:hover": { transform: "scale(1.02)", opacity: 0.95, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" },
                                      }}
                                    />
                                  ) : (
                                    <Box sx={{ py: 3, textAlign: "center", color: themeConfig.textMuted }}>
                                      <Typography variant="caption" sx={{ fontStyle: "italic" }}>No Digital Signature Recorded</Typography>
                                    </Box>
                                  )}
                                </Paper>
                              </Box>
                            );
                          })()}
                        </>
                      );
                    })()}
                  </Paper>

                  {/* Accompanying Members if any */}
                  {accompanyingGuests && accompanyingGuests.length > 0 && (
                    <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                        <Group sx={{ fontSize: 18, color: themeConfig.primary }} />
                        Accompanying Members ({accompanyingGuests.length})
                      </Typography>

                      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        {accompanyingGuests.map((m, i) => {
                          const mName = m.name || m.fullName || `Member ${i + 1}`;
                          const cleanMName = sanitizeFilename(mName);

                          // Extract all document images for this member
                          const memberDocs = [];

                          if (Array.isArray(m.images) && m.images.length > 0) {
                            m.images.forEach((imgSrc, imgIdx) => {
                              if (imgSrc) {
                                memberDocs.push({
                                  id: `img_${imgIdx}`,
                                  label: `${mName} - Photo ${imgIdx + 1}`,
                                  src: imgSrc,
                                  filename: `${cleanMName}_Doc_${imgIdx + 1}`,
                                });
                              }
                            });
                          }

                          const mFront = m.frontImage || m.frontImageUrl || m.idProofImage || m.idProof?.frontImage || m.idProof?.frontImageUrl;
                          if (mFront && !memberDocs.some((d) => d.src === mFront)) {
                            memberDocs.push({
                              id: "front",
                              label: `${mName} - Front ID`,
                              src: mFront,
                              filename: `${cleanMName}_Front_ID`,
                            });
                          }

                          const mBack = m.backImage || m.backImageUrl || m.idProofBackImage || m.idProof?.backImage || m.idProof?.backImageUrl;
                          if (mBack && !memberDocs.some((d) => d.src === mBack)) {
                            memberDocs.push({
                              id: "back",
                              label: `${mName} - Back ID`,
                              src: mBack,
                              filename: `${cleanMName}_Back_ID`,
                            });
                          }

                          if (typeof m === "string" && (m.startsWith("data:image") || m.startsWith("http"))) {
                            memberDocs.push({
                              id: "direct_str",
                              label: `Member ${i + 1} ID Photo`,
                              src: m,
                              filename: `Member_${i + 1}_Photo`,
                            });
                          }

                          return (
                            <Paper
                              key={m.id || i}
                              sx={{
                                p: 2,
                                borderRadius: "14px",
                                border: `1px solid ${themeConfig.border}`,
                                bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                              }}
                            >
                              <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                                👤 {i + 1}. {mName} {m.relationship ? `(${m.relationship})` : ""}
                              </Typography>

                              {memberDocs.length > 0 ? (
                                <Grid container spacing={2}>
                                  {memberDocs.map((doc) => (
                                    <Grid key={doc.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                      <Paper
                                        sx={{
                                          p: 1.5,
                                          borderRadius: "12px",
                                          border: `1px solid ${themeConfig.border}`,
                                          textAlign: "center",
                                          bgcolor: isDarkMode ? "rgba(0,0,0,0.2)" : "#FFFFFF",
                                        }}
                                      >
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1, gap: 1 }}>
                                          <Typography
                                            variant="caption"
                                            sx={{
                                              fontWeight: 800,
                                              color: themeConfig.textMain,
                                              overflow: "hidden",
                                              textOverflow: "ellipsis",
                                              whiteSpace: "nowrap",
                                            }}
                                          >
                                            📄 {doc.label}
                                          </Typography>
                                          <Chip
                                            icon={<FileDownload sx={{ fontSize: "14px !important" }} />}
                                            label="Download"
                                            size="small"
                                            clickable
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              downloadSingleImage(doc.src, doc.filename);
                                            }}
                                            sx={{
                                              height: 20,
                                              fontSize: "0.68rem",
                                              fontWeight: 800,
                                              bgcolor: "rgba(11, 142, 224, 0.1)",
                                              color: "#0B8EE0",
                                              "&:hover": { bgcolor: "rgba(11, 142, 224, 0.2)" },
                                              flexShrink: 0,
                                            }}
                                          />
                                        </Box>
                                        <Box
                                          component="img"
                                          src={doc.src}
                                          alt={doc.label}
                                          onClick={() => setPreviewImage(doc.src)}
                                          sx={{
                                            width: "100%",
                                            height: 140,
                                            objectFit: "contain",
                                            bgcolor: isDarkMode ? "rgba(0,0,0,0.25)" : "#F8FAFC",
                                            border: `1px solid ${themeConfig.border}`,
                                            borderRadius: "8px",
                                            cursor: "pointer",
                                            transition: "transform 0.2s, box-shadow 0.2s",
                                            "&:hover": { transform: "scale(1.02)", opacity: 0.95, boxShadow: "0 6px 16px rgba(0,0,0,0.15)" },
                                          }}
                                        />
                                      </Paper>
                                    </Grid>
                                  ))}
                                </Grid>
                              ) : (
                                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontStyle: "italic" }}>
                                  No document photos uploaded for this member.
                                </Typography>
                              )}
                            </Paper>
                          );
                        })}
                      </Box>
                    </Paper>
                  )}
                </Box>
              )}

              {/* ================= TAB 1: BOOKING & ROOMS ================= */}
              {activeTab === 1 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Stay Schedule Card */}
                  <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <CalendarMonth sx={{ fontSize: 18, color: themeConfig.primary }} />
                      Stay Schedule & Duration
                    </Typography>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Check-In Date & Time</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {activeBooking?.checkInDate ? new Date(activeBooking.checkInDate).toLocaleDateString("en-IN") : guest.checkInDate || "N/A"} ({formatTime12Hour(activeBooking?.checkInTime || guest.checkInTime || hotelSettings?.checkInTime || "14:00")})
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Check-Out Date & Time</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          {activeBooking?.checkOutDate ? new Date(activeBooking.checkOutDate).toLocaleDateString("en-IN") : guest.checkOutDate || "N/A"} ({formatTime12Hour(activeBooking?.checkOutTime || guest.checkOutTime || hotelSettings?.checkOutTime || "12:00")})
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Duration / Nights</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary }}>
                          {activeBooking?.numberOfNights || 1} Night(s)
                        </Typography>
                      </Grid>
                    </Grid>
                  </Paper>

                  {/* Multi-Room Detailed Breakdown (Requirement: Show ALL Rooms) */}
                  <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <MeetingRoom sx={{ fontSize: 18, color: themeConfig.primary }} />
                      Allocated Room Details ({roomsDetail.length || 1})
                    </Typography>

                    {roomsDetail.length > 0 ? (
                      <Grid container spacing={2}>
                        {roomsDetail.map((rm, idx) => (
                          <Grid key={rm.id || idx} size={{ xs: 12, sm: 6 }}>
                            <Paper
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
                                    label={`Floor ${rm.floor !== undefined && rm.floor !== null ? rm.floor : (parseInt(rm.roomNumber, 10) >= 100 ? Math.floor(parseInt(rm.roomNumber, 10) / 100) : 1)}`}
                                    size="small"
                                    sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, fontWeight: 800, fontSize: "0.7rem", height: 22 }}
                                  />
                                </Box>
                                <Chip label={rm.status || "OCCUPIED"} size="small" sx={{ fontWeight: 800, fontSize: "0.7rem" }} />
                              </Box>

                              <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                {rm.roomType}
                              </Typography>
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                                ₹{rm.pricePerNight?.toLocaleString()} / night &bull; {rm.numberOfNights} Night(s)
                              </Typography>

                              <Divider sx={{ my: 1 }} />
                              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>
                                  Room Total:
                                </Typography>
                                <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primaryDark }}>
                                  ₹{rm.roomTotal?.toLocaleString()}
                                </Typography>
                              </Box>
                            </Paper>
                          </Grid>
                        ))}
                      </Grid>
                    ) : (
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          Room Assigned: {guest.roomAssigned || guest.roomNumber || "Standard Room"}
                        </Typography>
                        {(guest.floor || guest.roomNumber) && (
                          <Chip
                            label={`Floor ${guest.floor !== undefined && guest.floor !== null ? guest.floor : (parseInt(guest.roomNumber || guest.roomAssigned, 10) >= 100 ? Math.floor(parseInt(guest.roomNumber || guest.roomAssigned, 10) / 100) : 1)}`}
                            size="small"
                            sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, fontWeight: 800, fontSize: "0.7rem", height: 22 }}
                          />
                        )}
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}

              {/* ================= TAB 2: BILLING & PAYMENTS ================= */}
              {activeTab === 2 && (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
                  {/* Financial Breakdown Summary */}
                  {paymentDetails ? (
                    <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                        <Receipt sx={{ fontSize: 18, color: themeConfig.primary }} />
                        Financial Settlement & Tax Details
                      </Typography>

                      <Grid container spacing={2}>
                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Base Amount</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                            ₹{paymentDetails.baseAmount?.toLocaleString()}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>GST / Taxes (CGST+SGST)</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                            ₹{paymentDetails.gstAmount?.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.7rem" }}>
                            CGST: ₹{paymentDetails.cgstAmount} | SGST: ₹{paymentDetails.sgstAmount}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Paid Amount</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: "#10B981" }}>
                            ₹{paymentDetails.paidAmount?.toLocaleString()}
                          </Typography>
                        </Grid>

                        <Grid size={{ xs: 6, sm: 3 }}>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Pending Due</Typography>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: paymentDetails.dueAmount > 0 ? "#EF4444" : "#10B981" }}>
                            ₹{paymentDetails.dueAmount?.toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  ) : null}

                  {/* Payment History Table (Requirement: Full Financial History for Guest) */}
                  <Paper sx={{ p: 2.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 1 }}>
                      <PaymentIcon sx={{ fontSize: 18, color: themeConfig.primary }} />
                      Payment Transaction History ({paymentHistory.length})
                    </Typography>

                    {paymentHistory.length > 0 ? (
                      <TableContainer sx={{ borderRadius: "12px", border: `1px solid ${themeConfig.border}`, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
                        <Table size="small" sx={{ minWidth: 650 }}>
                          <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                            <TableRow>
                              <TableCell sx={{ fontWeight: 800 }}>Date</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Transaction ID</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Method</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Amount</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>GST</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Total</TableCell>
                              <TableCell sx={{ fontWeight: 800 }}>Status</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {paymentHistory.map((p, idx) => (
                              <TableRow key={p.id || idx}>
                                <TableCell sx={{ fontWeight: 700 }}>{p.formattedDate}</TableCell>
                                <TableCell sx={{ fontWeight: 800, color: themeConfig.primary }}>{p.transactionId}</TableCell>
                                <TableCell>{p.description}</TableCell>
                                <TableCell>
                                  <Chip label={p.paymentMethod} size="small" sx={{ fontWeight: 800, fontSize: "0.7rem" }} />
                                </TableCell>
                                <TableCell>₹{p.amount?.toLocaleString()}</TableCell>
                                <TableCell>₹{p.gst?.toLocaleString()}</TableCell>
                                <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain }}>₹{p.total?.toLocaleString()}</TableCell>
                                <TableCell>
                                  <Chip
                                    label={p.status}
                                    size="small"
                                    color={p.status === "PAID" ? "success" : "default"}
                                    sx={{ fontWeight: 800, fontSize: "0.7rem" }}
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Box sx={{ p: 4, textAlign: "center" }}>
                        <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
                          No individual payment transactions recorded yet.
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                </Box>
              )}

              {/* ================= TAB 3: ACTIVITY TIMELINE ================= */}
              {activeTab === 3 && (
                <Paper sx={{ p: 3, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 3, display: "flex", alignItems: "center", gap: 1 }}>
                    <TimelineIcon sx={{ fontSize: 18, color: themeConfig.primary }} />
                    Real-time Stay Activity Timeline
                  </Typography>

                  {timeline && timeline.length > 0 ? (
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pl: 1 }}>
                      {timeline.map((step, idx) => (
                        <Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 2, position: "relative" }}>
                          {idx < timeline.length - 1 && (
                            <Box
                              sx={{
                                position: "absolute",
                                left: 15,
                                top: 32,
                                bottom: -20,
                                width: 2,
                                bgcolor: themeConfig.border,
                              }}
                            />
                          )}

                          <Avatar
                            sx={{
                              width: 32,
                              height: 32,
                              bgcolor: themeConfig.primary,
                              color: "#FFFFFF",
                              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
                              zIndex: 1,
                            }}
                          >
                            <CheckCircle sx={{ fontSize: 18 }} />
                          </Avatar>

                          <Box sx={{ flex: 1 }}>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                                {step.title}
                              </Typography>
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                                {step.timestamp ? new Date(step.timestamp).toLocaleString("en-IN") : "Recorded"}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: themeConfig.textMuted, mt: 0.3 }}>
                              {step.description}
                            </Typography>
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  ) : (
                    <Box sx={{ p: 4, textAlign: "center" }}>
                      <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
                        No specific timeline milestones registered for this guest.
                      </Typography>
                    </Box>
                  )}
                </Paper>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: { xs: 1.5, sm: 2 },
            px: { xs: 1.5, sm: 2.5 },
            bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC",
            borderTop: `1px solid ${themeConfig.border}`,
            display: "flex",
            alignItems: "stretch",
            justifyContent: "space-between",
            flexDirection: { xs: "column", sm: "row" },
            gap: 1.5,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap", flexDirection: { xs: "column", sm: "row" }, width: { xs: "100%", sm: "auto" } }}>
            <Button
              size="small"
              startIcon={<FileDownload sx={{ fontSize: 18 }} />}
              variant="outlined"
              onClick={() => {
                downloadGuestFolioPDF(
                  {
                    guest,
                    activeBooking,
                    paymentDetails,
                    paymentHistory,
                    timeline: details?.timeline || [],
                    roomsDetail,
                    accompanyingGuests,
                    charges: activeBooking?.charges || activeBooking?.posCharges || [],
                  },
                  guest?.hotel || {}
                );
              }}
              sx={{
                width: { xs: "100%", sm: "auto" },
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.78rem",
                textTransform: "none",
                borderColor: themeConfig.border,
                color: themeConfig.textMain,
                px: 1.6,
                py: 0.75,
                justifyContent: "center",
                "&:hover": { borderColor: themeConfig.primary, bgcolor: themeConfig.champagne },
              }}
            >
              Guest Folio PDF
            </Button>

            <Button
              size="small"
              startIcon={<FileDownload sx={{ fontSize: 18 }} />}
              variant="outlined"
              onClick={() => {
                downloadAllGuestIdImages(
                  {
                    guest,
                    activeBooking,
                    accompanyingGuests,
                  },
                  (msg, sev) => toast.show(msg, sev)
                );
              }}
              sx={{
                width: { xs: "100%", sm: "auto" },
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.78rem",
                textTransform: "none",
                borderColor: themeConfig.primary || "#0F766E",
                color: themeConfig.primary || "#0F766E",
                bgcolor: "rgba(15, 118, 110, 0.06)",
                px: 1.6,
                py: 0.75,
                justifyContent: "center",
                "&:hover": { bgcolor: "rgba(15, 118, 110, 0.12)", borderColor: themeConfig.primary || "#0F766E" },
              }}
            >
              Download ID Proofs (.ZIP)
            </Button>

            {/* Single Unified WhatsApp Action Button */}
            <Button
              size="small"
              startIcon={<WhatsApp sx={{ color: "#FFFFFF", fontSize: 18 }} />}
              variant="contained"
              onClick={() => {
                if (activeBooking) {
                  sendCheckoutBillWhatsApp({
                    booking: activeBooking,
                    guest,
                    hotel: guest?.hotel || {},
                    onShowToast: (msg, sev) => toast.show(msg, sev),
                  });
                } else {
                  sendCheckInWhatsApp({
                    booking: { guestName: guest.name || guest.fullName, roomNumber: guest.roomAssigned },
                    guest,
                    hotel: guest?.hotel || {},
                    onShowToast: (msg, sev) => toast.show(msg, sev),
                  });
                }
              }}
              sx={{
                width: { xs: "100%", sm: "auto" },
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.78rem",
                textTransform: "none",
                bgcolor: "#25D366",
                color: "#FFFFFF",
                boxShadow: "0 2px 8px rgba(37, 211, 102, 0.3)",
                px: 1.8,
                py: 0.75,
                justifyContent: "center",
                "&:hover": { bgcolor: "#1EBE5D" },
              }}
            >
              Send on WhatsApp
            </Button>
          </Box>

          <Button
            onClick={onClose}
            variant="contained"
            size="small"
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              width: { xs: "100%", sm: "auto" },
              borderRadius: "10px",
              fontWeight: 800,
              fontSize: "0.8rem",
              textTransform: "none",
              background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
              color: "#FFFFFF",
              px: 2.5,
              py: 0.75,
              justifyContent: "center",
              boxShadow: `0 3px 10px ${themeConfig.primaryGlow}`,
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* Image Zoom / Lightbox Preview Modal */}
      {previewImage && (
        <Dialog open={Boolean(previewImage)} onClose={() => setPreviewImage(null)} maxWidth="md">
          <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="subtitle1" component="div" sx={{ fontWeight: 800 }}>ID Proof Document Preview</Typography>
            <IconButton onClick={() => setPreviewImage(null)}><Close /></IconButton>
          </DialogTitle>
          <DialogContent sx={{ p: 2, textAlign: "center" }}>
            <Box component="img" src={previewImage} alt="ID Document Preview" sx={{ maxWidth: "100%", maxHeight: "80vh", borderRadius: "12px", objectFit: "contain" }} />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
