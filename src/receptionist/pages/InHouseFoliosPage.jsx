"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  Tooltip,
  TextField,
  InputAdornment,
  MenuItem,
  Tabs,
  Tab,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  IconButton,
  Grid,
  Divider,
  TablePagination,
} from "@mui/material";
import {
  Add,
  Receipt,
  Logout,
  Search,
  CurrencyRupee,
  Schedule,
  MeetingRoom,
  Warning,
  CheckCircle,
  Phone,
  ContentCopy,
  CreditCard,
  AccountBalance,
  QrCode2,
  Close,
  Print,
  InfoOutlined,
  Fastfood,
  Check,
  WhatsApp,
} from "@/shared/icons";
import dynamic from "next/dynamic";
import { useAppTheme } from "@/shared/context/ThemeContext";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import StatCard from "@/shared/components/StatCard";
import { formatTime12Hour, calculateOverstayFee } from "@/shared/utils/timeUtils";
import { sendCheckInWhatsApp, sendCheckoutBillWhatsApp } from "@/shared/utils/whatsappUtils";
import { toast } from "@/shared/utils/toast";

const GuestDetailsModal = dynamic(() => import("@/shared/components/GuestDetailsModal"));

export default function InHouseFoliosPage({
  bookings = [],
  hotelSettings = {
    checkInTime: "14:00",
    checkOutTime: "12:00",
    timezone: "Asia/Kolkata",
    upiId: "jatinkakadiya234-1@okicici",
  },
  onCheckOut,
  onOpenInvoice,
  onOpenPosCharge,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeStatusTab, setActiveStatusTab] = useState("ALL");
  const [balanceFilter, setBalanceFilter] = useState("ALL");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Check-Out Settlement Dialog State
  const [checkoutDialog, setCheckoutDialog] = useState({
    open: false,
    booking: null,
    overstay: null,
    lateOption: "hourly",
    lateFee: 0,
    paymentMethod: "CASH",
    amount: 0,
    transactionId: "",
    paymentReference: "",
  });

  // Folio Details Modal State
  const [detailsModal, setDetailsModal] = useState({
    open: false,
    booking: null,
  });

  // Guest Details Dossier Modal State
  const [selectedGuestModal, setSelectedGuestModal] = useState({
    open: false,
    guest: null,
    guestId: null,
  });

  // Full-size Photo Preview Modal State
  const [previewImage, setPreviewImage] = useState(null);

  const hotelUpi = hotelSettings?.upiId || "jatinkakadiya234-1@okicici";
  const checkOutTimeFormatted = formatTime12Hour(hotelSettings?.checkOutTime || "12:00");
  const checkInTimeFormatted = formatTime12Hour(hotelSettings?.checkInTime || "14:00");
  const timezoneStr = hotelSettings?.timezone || "Asia/Kolkata";
  const todayStr = new Date().toISOString().split("T")[0];

  // Telemetry Calculations
  const inHouseBookings = bookings.filter((b) => b.status === "CHECKED_IN");
  const confirmedBookings = bookings.filter((b) => b.status === "CONFIRMED" || b.status === "PENDING");
  const checkedOutBookings = bookings.filter((b) => b.status === "CHECKED_OUT");

  const totalGrossLedger = bookings.reduce((sum, b) => {
    const pos = (b.posCharges || []).reduce((pSum, c) => pSum + (c.amount || 0), 0);
    const overstay = calculateOverstayFee(b, hotelSettings);
    return sum + (b.totalAmount || 0) + pos + (overstay.lateFee || 0);
  }, 0);

  const totalPendingDues = bookings.reduce((sum, b) => {
    const pos = (b.posCharges || []).reduce((pSum, c) => pSum + (c.amount || 0), 0);
    const overstay = calculateOverstayFee(b, hotelSettings);
    const gross = (b.totalAmount || 0) + pos + (overstay.lateFee || 0);
    const paid = b.paidAmount || 0;
    return sum + Math.max(0, gross - paid);
  }, 0);

  const todayCheckoutsDueCount = inHouseBookings.filter((b) => {
    const outDate = b.checkOutDate ? String(b.checkOutDate).split("T")[0] : "";
    return outDate && outDate <= todayStr;
  }).length;

  // Helper to extract all room numbers from booking
  const getBookingRoomNumbers = (b) => {
    if (!b) return [];
    if (Array.isArray(b.roomNumbers) && b.roomNumbers.length > 0) {
      return b.roomNumbers.map(String);
    }
    if (Array.isArray(b.rooms) && b.rooms.length > 0 && typeof b.rooms[0] === "object" && b.rooms[0]?.roomNumber) {
      return b.rooms.map((r) => String(r.roomNumber));
    }
    if (b.roomNumber) {
      return String(b.roomNumber).split(",").map((s) => s.trim()).filter(Boolean);
    }
    if (b.room?.roomNumber) {
      return [String(b.room.roomNumber)];
    }
    return ["N/A"];
  };

  // Filter Bookings List
  const filteredBookings = bookings.filter((b) => {
    // Status Filter
    if (activeStatusTab !== "ALL" && b.status !== activeStatusTab) return false;

    // Balance Filter
    const overstay = calculateOverstayFee(b, hotelSettings);
    const posChargesTotal = (b.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
    const grandTotal = (b.totalAmount || 0) + posChargesTotal + (overstay.lateFee || 0);
    const paidTotal = b.paidAmount || 0;
    const dueBalance = Math.max(0, grandTotal - paidTotal);

    if (balanceFilter === "DUES" && dueBalance <= 0) return false;
    if (balanceFilter === "SETTLED" && dueBalance > 0) return false;

    // Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchFolio = (b.bookingNumber || "").toLowerCase().includes(q);
      const matchGuest = (b.guest?.name || b.guest?.fullName || "").toLowerCase().includes(q);
      const matchPhone = (b.guest?.phone || b.guest?.mobileNumber || "").toLowerCase().includes(q);
      const roomsList = getBookingRoomNumbers(b);
      const matchRoom = roomsList.some((rn) => rn.toLowerCase().includes(q)) || String(b.roomNumber || "").toLowerCase().includes(q);
      if (!matchFolio && !matchGuest && !matchPhone && !matchRoom) return false;
    }

    return true;
  });

  const handleOpenCheckout = (booking) => {
    const defaultOption = "hourly";
    const overstay = calculateOverstayFee(booking, hotelSettings, { selectedOption: defaultOption });
    const posChargesTotal = (booking.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
    const grandTotal = (booking.totalAmount || 0) + posChargesTotal + (overstay.lateFee || 0);
    const paidTotal = booking.paidAmount || 0;
    const due = Math.max(0, grandTotal - paidTotal);

    setCheckoutDialog({
      open: true,
      booking,
      overstay,
      lateOption: defaultOption,
      lateFee: overstay.lateFee || 0,
      paymentMethod: due > 0 ? "UPI" : "CASH",
      amount: due,
      transactionId: "",
      paymentReference: "",
    });
  };

  const handleLateOptionChange = (newOption) => {
    if (!checkoutDialog.booking) return;
    const overstay = calculateOverstayFee(checkoutDialog.booking, hotelSettings, { selectedOption: newOption });
    const posChargesTotal = (checkoutDialog.booking.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
    const grandTotal = (checkoutDialog.booking.totalAmount || 0) + posChargesTotal + (overstay.lateFee || 0);
    const paidTotal = checkoutDialog.booking.paidAmount || 0;
    const due = Math.max(0, grandTotal - paidTotal);

    setCheckoutDialog((prev) => ({
      ...prev,
      overstay,
      lateOption: newOption,
      lateFee: overstay.lateFee || 0,
      amount: due,
      paymentMethod: due > 0 ? prev.paymentMethod || "UPI" : "CASH",
    }));
  };

  const handleConfirmCheckout = () => {
    if (checkoutDialog.booking && onCheckOut) {
      onCheckOut(checkoutDialog.booking, {
        paymentMethod: checkoutDialog.paymentMethod,
        settlementPaymentAmount: Number(checkoutDialog.amount) || 0,
        lateCheckoutFee: Number(checkoutDialog.lateFee) || 0,
        lateCheckoutType: checkoutDialog.overstay?.lateCheckoutType || checkoutDialog.lateOption || "none",
        lateCheckoutHours: checkoutDialog.overstay?.chargeableHours || 0,
        lateCheckoutMinutes: checkoutDialog.overstay?.overdueMinutes || 0,
        hourlyRate: checkoutDialog.overstay?.hourlyRate || 0,
        dailyRoomRate: checkoutDialog.overstay?.dailyRate || 0,
        gracePeriodMinutes: checkoutDialog.overstay?.gracePeriodMinutes || 10,
        overstayData: checkoutDialog.overstay,
        transactionId: checkoutDialog.transactionId,
        paymentReference: checkoutDialog.paymentReference,
      });
    }
    setCheckoutDialog({
      open: false,
      booking: null,
      overstay: null,
      lateOption: "hourly",
      lateFee: 0,
      paymentMethod: "CASH",
      amount: 0,
      transactionId: "",
      paymentReference: "",
    });
  };

  const handleCopyUpi = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(hotelUpi);
      setCopiedUpi(true);
      setTimeout(() => setCopiedUpi(false), 2500);
    }
  };

  // UPI QR String for settlement
  const upiSettlementAmount = checkoutDialog.amount > 0 ? checkoutDialog.amount : 0;
  const upiString = `upi://pay?pa=${encodeURIComponent(hotelUpi)}&pn=HotelFrontDesk&am=${upiSettlementAmount}&tn=CheckoutSettlement_Folio_${checkoutDialog.booking?.bookingNumber || "Stay"}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=4&data=${encodeURIComponent(upiString)}`;

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      {/* 3D Page Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", mb: 3.5, gap: 2 }}>
        <div>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 0.5 }}>
            <Avatar sx={{ bgcolor: themeConfig.primary, width: 38, height: 38, borderRadius: "12px", boxShadow: `0 4px 12px ${themeConfig.primaryGlow}` }}>
              <Receipt sx={{ color: "#FFFFFF", fontSize: 22 }} />
            </Avatar>
            <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5 }}>
              In-House Guest Folios & Account Ledgers
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
            Real-time active resident stay ledger, room charges, ancillary POS services, and instant checkout settlement.
          </Typography>
        </div>

        <Chip
          icon={<Schedule sx={{ fontSize: 16, color: `${themeConfig.primaryDark} !important` }} />}
          label={`Standard Check-Out: ${checkOutTimeFormatted} (${timezoneStr})`}
          sx={{
            bgcolor: themeConfig.champagne,
            color: themeConfig.primaryDark,
            fontWeight: 800,
            borderRadius: "12px",
            border: `1px solid ${themeConfig.border}`,
            boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
            py: 2,
            px: 1,
            fontSize: "0.8rem",
          }}
        />
      </Box>

      {/* ========================================================================= */}
      {/* SECTION 1: TELEMETRY METRIC STAT CARDS                                   */}
      {/* ========================================================================= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2.5,
          mb: 4,
          alignItems: "stretch",
        }}
      >
        <StatCard
          title="Total Registered Folios"
          value={bookings.length}
          subtitle={`${inHouseBookings.length} In-House • ${checkedOutBookings.length} Checked-Out`}
          icon={<MeetingRoom />}
          color="#0B8EE0"
          badgeText="Folios"
        />

        <StatCard
          title="Total Folio Ledger"
          value={`₹${totalGrossLedger.toLocaleString()}`}
          subtitle="Total stay & ancillary billings"
          icon={<CurrencyRupee />}
          color="#10B981"
          badgeText="Billed"
        />

        <StatCard
          title="Pending Settlement Dues"
          value={`₹${totalPendingDues.toLocaleString()}`}
          subtitle={totalPendingDues > 0 ? "Outstanding balance to collect" : "All active folios settled"}
          icon={<Warning />}
          color={totalPendingDues > 0 ? "#EF4444" : "#10B981"}
          badgeText={totalPendingDues > 0 ? "Dues Active" : "All Clear"}
        />

        <StatCard
          title="Checked-Out / Closed"
          value={checkedOutBookings.length}
          subtitle={`${todayCheckoutsDueCount} due today • Departures`}
          icon={<Schedule />}
          color="#8B5CF6"
          badgeText="Departures"
        />
      </Box>

      {/* ========================================================================= */}
      {/* SECTION 2: FOLIOS SEARCH, FILTER TABS & LIVE LEDGER TABLE                */}
      {/* ========================================================================= */}
      <Paper
        className="card-3d"
        sx={{
          p: { xs: 2, sm: 3 },
          borderRadius: "22px",
          bgcolor: themeConfig.bgCard,
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode
            ? "0 10px 30px -5px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
            : "0 10px 30px -5px rgba(12, 39, 59, 0.08), inset 0 1px 1px #FFFFFF",
        }}
      >
        {/* Controls Bar: Search, Status Tabs & Balance Filter */}
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, mb: 3 }}>
          <Tabs
            value={activeStatusTab}
            onChange={(e, v) => {
              setActiveStatusTab(v);
              setPage(0);
            }}
            sx={{
              "& .MuiTabs-indicator": { display: "none" },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 800,
                fontSize: "0.85rem",
                borderRadius: "12px",
                minHeight: 38,
                px: 2,
                mr: 1,
                color: themeConfig.textMuted,
                "&.Mui-selected": {
                  bgcolor: themeConfig.primary,
                  color: "#FFFFFF",
                  boxShadow: `0 4px 12px ${themeConfig.primaryGlow}`,
                },
              },
            }}
          >
            <Tab value="ALL" label={`All Folios (${bookings.length})`} />
            <Tab value="CHECKED_IN" label={`Active In-House (${inHouseBookings.length})`} />
            <Tab value="CONFIRMED" label={`Reserved (${confirmedBookings.length})`} />
            <Tab value="CHECKED_OUT" label={`Checked-Out (${checkedOutBookings.length})`} />
          </Tabs>

          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <Select
                value={balanceFilter}
                onChange={(e) => {
                  setBalanceFilter(e.target.value);
                  setPage(0);
                }}
                sx={{ borderRadius: "12px", bgcolor: themeConfig.bgMain, fontSize: "0.85rem", fontWeight: 700 }}
              >
                <MenuItem value="ALL">All Balances</MenuItem>
                <MenuItem value="DUES">⚠️ Dues Pending</MenuItem>
                <MenuItem value="SETTLED">✅ Fully Settled</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              placeholder="Search folio #, guest, room #, phone..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: { xs: "100%", sm: 260 }, "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: themeConfig.bgMain } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search fontSize="small" sx={{ color: themeConfig.textMuted }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </Box>

        {/* 3D Folios Table */}
        <TableContainer
          sx={{
            borderRadius: "16px",
            border: `1px solid ${themeConfig.border}`,
            overflowX: "auto",
            overflowY: "auto",
            maxHeight: "560px",
            "&::-webkit-scrollbar": { height: "7px", width: "7px" },
            "&::-webkit-scrollbar-track": { background: "rgba(0,0,0,0.02)", borderRadius: "8px" },
            "&::-webkit-scrollbar-thumb": { background: themeConfig.border, borderRadius: "8px" },
            "&::-webkit-scrollbar-thumb:hover": { background: themeConfig.primary },
          }}
        >
          <Table stickyHeader size="small" sx={{ minWidth: 1020 }}>
            <TableHead>
              <TableRow sx={{ "& th": { bgcolor: themeConfig.champagne, color: themeConfig.textMain, fontWeight: 800, py: 1.5 } }}>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Folio #</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Guest Profile</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Allocated Room</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Stay Schedule</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Ledger Breakdown</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Balance Due</TableCell>
                <TableCell sx={{ whiteSpace: "nowrap" }}>Status</TableCell>
                <TableCell align="right" sx={{ whiteSpace: "nowrap", pr: 2 }}>Front Desk Actions</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} sx={{ py: 6 }}>
                    <EmptyState
                      title="No Folios Found"
                      description={
                        searchQuery
                          ? "No reservation folios match your search query."
                          : activeStatusTab === "CHECKED_IN"
                          ? "No resident guests currently checked in. Use the Check-In Wizard to register guests."
                          : "No folios under this category."
                      }
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((b) => {
                  const guestName = b.guest?.name || b.guest?.fullName || "Walk-In Guest";
                  const guestPhone = b.guest?.phone || b.guest?.mobileNumber || "";
                  const roomsList = getBookingRoomNumbers(b);
                  const roomType = b.roomType?.name || b.room?.roomType?.name || "Room Stay";
                  const overstay = calculateOverstayFee(b, hotelSettings);
                  const posChargesTotal = (b.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
                  const grandTotal = (b.totalAmount || 0) + posChargesTotal + (overstay.lateFee || 0);
                  const paidTotal = b.paidAmount || 0;
                  const dueBalance = Math.max(0, grandTotal - paidTotal);
                  const isCheckoutToday = b.checkOutDate && String(b.checkOutDate).split("T")[0] <= todayStr;

                  return (
                    <TableRow key={b._id} hover sx={{ "&:hover": { bgcolor: "rgba(11, 142, 224, 0.03)" } }}>
                      {/* Folio # */}
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography
                          variant="body2"
                          sx={{
                            fontFamily: "monospace",
                            fontWeight: 900,
                            color: themeConfig.primaryDark,
                            cursor: "pointer",
                            "&:hover": { textDecoration: "underline" },
                          }}
                          onClick={() => setDetailsModal({ open: true, booking: b })}
                        >
                          #{b.bookingNumber}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.7rem" }}>
                          {b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "Direct"}
                        </Typography>
                      </TableCell>

                      {/* Guest Details */}
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            gap: 1.2,
                            cursor: "pointer",
                            "&:hover": { opacity: 0.8 },
                          }}
                          onClick={() => {
                            const targetGuest = b.guest || {
                              name: b.guestName || b.guest?.name,
                              mobileNumber: b.guestPhone || b.guest?.mobileNumber,
                              email: b.guestEmail || b.guest?.email,
                              roomAssigned: roomsList.join(", "),
                              booking: b,
                            };
                            setSelectedGuestModal({
                              open: true,
                              guest: targetGuest,
                              guestId: b.guest?._id || b.guest?.id || (typeof b.guest === "string" ? b.guest : null),
                            });
                          }}
                        >
                          <Avatar sx={{ bgcolor: themeConfig.primary, width: 34, height: 34, fontSize: "0.85rem", fontWeight: 800 }}>
                            {guestName.charAt(0).toUpperCase()}
                          </Avatar>
                          <div>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, "&:hover": { textDecoration: "underline" } }}>
                              {guestName}
                            </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, flexWrap: "wrap", mt: 0.4 }}>
                              {guestPhone && (
                                <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "flex", alignItems: "center", gap: 0.5 }}>
                                  <Phone sx={{ fontSize: 11 }} /> {guestPhone}
                                </Typography>
                              )}
                              {(b.guest?.idProof?.frontImage || b.guest?.frontImage) && (
                                <Chip
                                  label="📄 ID Photo"
                                  size="small"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewImage(b.guest?.idProof?.frontImage || b.guest?.frontImage);
                                  }}
                                  sx={{
                                    height: 18,
                                    fontSize: "0.65rem",
                                    fontWeight: 800,
                                    bgcolor: "rgba(16, 185, 129, 0.12)",
                                    color: "#059669",
                                    border: "1px solid rgba(16, 185, 129, 0.3)",
                                    cursor: "pointer",
                                    "&:hover": { bgcolor: "#10B981", color: "#FFF" },
                                  }}
                                />
                              )}
                            </Box>
                            {b.accompanyingGuests && b.accompanyingGuests.length > 0 && (
                              <Tooltip title={b.accompanyingGuests.map((m) => `${m.name} (${m.relationship || 'Family'})`).join(', ')}>
                                <Chip
                                  label={`+${b.accompanyingGuests.length} Member(s)`}
                                  size="small"
                                  sx={{
                                    height: 18,
                                    fontSize: "0.65rem",
                                    fontWeight: 800,
                                    bgcolor: "rgba(11, 142, 224, 0.1)",
                                    color: themeConfig.primary,
                                    mt: 0.3,
                                  }}
                                />
                              </Tooltip>
                            )}
                          </div>
                        </Box>
                      </TableCell>

                      {/* Room Details */}
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {roomsList.length > 1 ? (
                          <Box sx={{ mb: 0.3 }}>
                            <Chip
                              icon={<MeetingRoom sx={{ fontSize: 14, color: `${themeConfig.primaryDark} !important` }} />}
                              label={`Rooms ${roomsList.join(", ")}`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                bgcolor: themeConfig.champagne,
                                color: themeConfig.primaryDark,
                                border: `1px solid ${themeConfig.border}`,
                                height: 24,
                              }}
                            />
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", fontSize: "0.72rem", mt: 0.3 }}>
                              {roomType} ({roomsList.length} Rooms)
                            </Typography>
                          </Box>
                        ) : (
                          <Box sx={{ mb: 0.3 }}>
                            <Chip
                              icon={<MeetingRoom sx={{ fontSize: 14, color: `${themeConfig.primaryDark} !important` }} />}
                              label={`Room ${roomsList[0] || "N/A"}`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                bgcolor: themeConfig.champagne,
                                color: themeConfig.primaryDark,
                                border: `1px solid ${themeConfig.border}`,
                                height: 24,
                              }}
                            />
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", fontSize: "0.72rem", mt: 0.3 }}>
                              {roomType}
                            </Typography>
                          </Box>
                        )}
                      </TableCell>

                      {/* Stay Duration */}
                      <TableCell sx={{ color: themeConfig.textMuted, fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        <div><strong>In:</strong> {b.checkInDate || "Today"} ({b.checkInTime ? formatTime12Hour(b.checkInTime) : checkInTimeFormatted})</div>
                        <div>
                          <strong>Out:</strong> {(() => {
                            if (b.actualCheckOut) {
                              const d = new Date(b.actualCheckOut);
                              if (!isNaN(d.getTime())) {
                                const y = d.getFullYear();
                                const m = String(d.getMonth() + 1).padStart(2, "0");
                                const day = String(d.getDate()).padStart(2, "0");
                                return `${y}-${m}-${day}`;
                              }
                            }
                            return b.checkOutDate || "Tomorrow";
                          })()} ({(() => {
                            if (b.actualCheckOut) {
                              const d = new Date(b.actualCheckOut);
                              if (!isNaN(d.getTime())) {
                                const h = String(d.getHours()).padStart(2, "0");
                                const m = String(d.getMinutes()).padStart(2, "0");
                                return formatTime12Hour(`${h}:${m}`);
                              }
                            }
                            return formatTime12Hour(b.checkOutTime || hotelSettings?.checkOutTime || "12:00");
                          })()})
                          {overstay.isOverstay ? (
                            <Tooltip title={`Late Check-Out: Stayed +${overstay.overdueHours}h past check-out time. +₹${overstay.lateFee} (${overstay.extraDays} Extra Day Tariff) automatically applied.`}>
                              <Chip
                                label={`🚨 Overdue (+${overstay.overdueHours}h)`}
                                size="small"
                                sx={{
                                  ml: 0.8,
                                  height: 18,
                                  fontSize: "0.65rem",
                                  bgcolor: "rgba(220, 38, 38, 0.15)",
                                  color: "#DC2626",
                                  fontWeight: 900,
                                  border: "1px solid rgba(220, 38, 38, 0.4)",
                                }}
                              />
                            </Tooltip>
                          ) : isCheckoutToday && b.status === "CHECKED_IN" ? (
                            <Chip
                              label="Due Today"
                              size="small"
                              sx={{
                                ml: 0.8,
                                height: 18,
                                fontSize: "0.65rem",
                                bgcolor: "rgba(239, 68, 68, 0.12)",
                                color: "#DC2626",
                                fontWeight: 800,
                              }}
                            />
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Ledger Breakdown */}
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                          ₹{grandTotal.toLocaleString()}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", display: "block" }}>
                          Room: ₹{(b.totalAmount || 0).toLocaleString()}
                          {overstay.isOverstay && ` + Extra Day: ₹${overstay.lateFee}`}
                          {posChargesTotal > 0 && ` + POS: ₹${posChargesTotal}`}
                        </Typography>
                        <Box sx={{ display: "flex", gap: 0.5, flexWrap: "wrap", mt: 0.3 }}>
                          {overstay.isOverstay && (
                            <Chip
                              label={`+₹${overstay.lateFee} Extra Day`}
                              size="small"
                              sx={{
                                height: 18,
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                bgcolor: "rgba(220, 38, 38, 0.12)",
                                color: "#DC2626",
                                border: "1px solid rgba(220, 38, 38, 0.3)",
                              }}
                            />
                          )}
                          {(b.posCharges || []).length > 0 && (
                            <Chip
                              label={`${b.posCharges.length} POS Items`}
                              size="small"
                              onClick={() => setDetailsModal({ open: true, booking: b })}
                              sx={{
                                height: 18,
                                fontSize: "0.65rem",
                                fontWeight: 800,
                                cursor: "pointer",
                                bgcolor: "rgba(11, 142, 224, 0.1)",
                                color: themeConfig.primary,
                              }}
                            />
                          )}
                        </Box>
                      </TableCell>

                      {/* Balance Due */}
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        {dueBalance > 0 ? (
                          <Chip
                            label={`₹${dueBalance.toLocaleString()} Due`}
                            size="small"
                            sx={{
                              bgcolor: "rgba(239, 68, 68, 0.12)",
                              color: "#DC2626",
                              fontWeight: 800,
                              fontSize: "0.75rem",
                              border: "1px solid rgba(239, 68, 68, 0.3)",
                            }}
                          />
                        ) : (
                          <Chip
                            label="Fully Settled"
                            size="small"
                            sx={{
                              bgcolor: "rgba(16, 185, 129, 0.12)",
                              color: "#059669",
                              fontWeight: 800,
                              fontSize: "0.75rem",
                              border: "1px solid rgba(16, 185, 129, 0.3)",
                            }}
                          />
                        )}
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", fontSize: "0.7rem", mt: 0.2 }}>
                          Paid: ₹{paidTotal.toLocaleString()}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ whiteSpace: "nowrap" }}>
                        <StatusChip status={b.status} size="small" />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" sx={{ whiteSpace: "nowrap", pr: 2.5 }}>
                        <Box sx={{ display: "flex", gap: 0.8, justifyContent: "flex-end", alignItems: "center" }}>
                          {/* 1. WhatsApp Notification */}
                          <Tooltip title={b.status === "CHECKED_IN" ? "Send Check-In Confirmation on WhatsApp" : "Send Final Bill on WhatsApp"}>
                            <IconButton
                              size="small"
                              onClick={() => {
                                if (b.status === "CHECKED_IN") {
                                  sendCheckInWhatsApp({
                                    booking: b,
                                    guest: b.guest || { name: b.guestName, mobileNumber: b.guestPhone },
                                    hotel: hotelSettings,
                                    onShowToast: (msg, sev) => toast.show(msg, sev),
                                  });
                                } else {
                                  sendCheckoutBillWhatsApp({
                                    booking: b,
                                    guest: b.guest || { name: b.guestName, mobileNumber: b.guestPhone },
                                    hotel: hotelSettings,
                                    onShowToast: (msg, sev) => toast.show(msg, sev),
                                  });
                                }
                              }}
                              sx={{
                                color: "#25D366",
                                bgcolor: "rgba(37, 211, 102, 0.08)",
                                border: "1px solid rgba(37, 211, 102, 0.28)",
                                borderRadius: "10px",
                                p: 0.8,
                                transition: "all 0.18s ease",
                                "&:hover": {
                                  bgcolor: "#25D366",
                                  color: "#FFFFFF",
                                  transform: "translateY(-2px)",
                                  boxShadow: "0 4px 10px rgba(37, 211, 102, 0.35)",
                                },
                              }}
                            >
                              <WhatsApp sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          {/* 3. View / Download Invoice */}
                          <Tooltip title="View & Print Tax Invoice">
                            <IconButton
                              size="small"
                              onClick={() => onOpenInvoice(b)}
                              sx={{
                                color: themeConfig.primary,
                                bgcolor: isDarkMode ? "rgba(11, 142, 224, 0.12)" : themeConfig.champagne,
                                border: `1px solid ${themeConfig.border}`,
                                borderRadius: "10px",
                                p: 0.8,
                                transition: "all 0.18s ease",
                                "&:hover": {
                                  background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                                  color: "#FFFFFF",
                                  transform: "translateY(-2px)",
                                  boxShadow: `0 4px 10px ${themeConfig.primaryGlow}`,
                                },
                              }}
                            >
                              <Receipt sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Tooltip>

                          {/* 4. Check-Out Guest */}
                          {b.status === "CHECKED_IN" && (
                            <Tooltip title="Check-Out Guest & Release Room">
                              <IconButton
                                size="small"
                                onClick={() => handleOpenCheckout(b)}
                                sx={{
                                  color: "#DC2626",
                                  bgcolor: "rgba(220, 38, 38, 0.08)",
                                  border: "1px solid rgba(220, 38, 38, 0.28)",
                                  borderRadius: "10px",
                                  p: 0.8,
                                  transition: "all 0.18s ease",
                                  "&:hover": {
                                    bgcolor: "#DC2626",
                                    color: "#FFFFFF",
                                    transform: "translateY(-2px)",
                                    boxShadow: "0 4px 10px rgba(220, 38, 38, 0.35)",
                                  },
                                }}
                              >
                                <Logout sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Table Pagination */}
        {filteredBookings.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredBookings.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              borderTop: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard,
              color: themeConfig.textMain,
              mt: 1,
            }}
          />
        )}
      </Paper>

      {/* ========================================================================= */}
      {/* CHECK-OUT SETTLEMENT CONFIRMATION MODAL                                  */}
      {/* ========================================================================= */}
      <Dialog
        open={checkoutDialog.open}
        onClose={() => setCheckoutDialog({ open: false, booking: null, paymentMethod: "CASH", amount: 0, transactionId: "", paymentReference: "" })}
        slotProps={{ paper: { sx: { borderRadius: "22px", p: 2, maxWidth: 520, border: `1px solid ${themeConfig.border}` } } }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 900, color: themeConfig.textMain, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>
            Check-Out Settlement ({(() => {
              const rList = getBookingRoomNumbers(checkoutDialog.booking);
              return rList.length > 1 ? `Rooms ${rList.join(", ")}` : `Room ${rList[0] || ""}`;
            })()})
          </span>
          <IconButton size="small" onClick={() => setCheckoutDialog({ open: false, booking: null, paymentMethod: "CASH", amount: 0, transactionId: "", paymentReference: "" })}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
            {/* Guest Summary Card */}
            <Paper sx={{ p: 2, borderRadius: "14px", bgcolor: themeConfig.champagne, border: `1px solid ${themeConfig.border}` }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                    {checkoutDialog.booking?.guest?.name || checkoutDialog.booking?.guest?.fullName || "Resident Guest"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                    Folio #{checkoutDialog.booking?.bookingNumber} &bull; {(() => {
                      const rList = getBookingRoomNumbers(checkoutDialog.booking);
                      return rList.length > 1 ? `Rooms: ${rList.join(", ")}` : `Room ${rList[0] || ""}`;
                    })()}
                  </Typography>
                </div>
                <Chip
                  label={checkoutDialog.amount > 0 ? `₹${checkoutDialog.amount.toLocaleString()} Due` : "₹0 Due (Clear)"}
                  size="small"
                  sx={{
                    fontWeight: 800,
                    bgcolor: checkoutDialog.amount > 0 ? "rgba(239, 68, 68, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    color: checkoutDialog.amount > 0 ? "#DC2626" : "#059669",
                  }}
                />
              </Box>
            </Paper>

            {/* LATE CHECKOUT DETECTED SECTION (PART E) */}
            {checkoutDialog.overstay?.isLate && (
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  bgcolor: "rgba(239, 68, 68, 0.06)",
                  border: "1.5px solid rgba(239, 68, 68, 0.35)",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: "#DC2626", color: "#FFF", width: 30, height: 30 }}>
                    <Schedule sx={{ fontSize: 18 }} />
                  </Avatar>
                  <div>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#DC2626", lineHeight: 1.2 }}>
                      Late Checkout Detected
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                      Exceeded standard {checkoutDialog.overstay?.gracePeriodMinutes}-minute grace period
                    </Typography>
                  </div>
                </Box>

                {/* Breakdown Grid */}
                <Grid container spacing={1.5} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "block" }}>Scheduled Checkout</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                      {formatTime12Hour(checkoutDialog.overstay?.scheduledCheckOutTime || "12:00")}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "block" }}>Actual Checkout</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: "#DC2626" }}>
                      {formatTime12Hour(checkoutDialog.overstay?.actualCheckOutTime || "12:00")}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "block" }}>Late Duration</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: "#DC2626" }}>
                      {checkoutDialog.overstay?.chargeableHours} Hour{checkoutDialog.overstay?.chargeableHours !== 1 ? "s" : ""}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "block" }}>Hourly Rate (Rent ÷ 12)</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary }}>
                      ₹{checkoutDialog.overstay?.hourlyRate?.toLocaleString()}/hr
                    </Typography>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1.5, borderColor: "rgba(239, 68, 68, 0.2)" }} />

                <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "block", mb: 1, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Select Charging Option:
                </Typography>

                <Grid container spacing={1.5}>
                  {/* OPTION 1: Charge Full Day */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper
                      onClick={() => handleLateOptionChange("full_day")}
                      sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        cursor: "pointer",
                        border: `2px solid ${checkoutDialog.lateOption === "full_day" ? "#DC2626" : "rgba(239, 68, 68, 0.25)"}`,
                        bgcolor: checkoutDialog.lateOption === "full_day" ? "#FEF2F2" : "#FFFFFF",
                        transition: "all 0.2s ease",
                        "&:hover": { borderColor: "#DC2626" },
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: checkoutDialog.lateOption === "full_day" ? "#DC2626" : themeConfig.textMain }}>
                            Option 1 — Charge Full Day
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                            Full Day Charge: ₹{checkoutDialog.overstay?.fullDayCharge?.toLocaleString()}
                          </Typography>
                        </div>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#DC2626" }}>
                          ₹{checkoutDialog.overstay?.fullDayCharge?.toLocaleString()}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>

                  {/* OPTION 2: Charge By Hour */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Paper
                      onClick={() => handleLateOptionChange("hourly")}
                      sx={{
                        p: 1.5,
                        borderRadius: "12px",
                        cursor: "pointer",
                        border: `2px solid ${checkoutDialog.lateOption === "hourly" ? "#059669" : "rgba(5, 150, 105, 0.25)"}`,
                        bgcolor: checkoutDialog.lateOption === "hourly" ? "#F0FDF4" : "#FFFFFF",
                        transition: "all 0.2s ease",
                        "&:hover": { borderColor: "#059669" },
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: checkoutDialog.lateOption === "hourly" ? "#059669" : themeConfig.textMain }}>
                            Option 2 — Charge {checkoutDialog.overstay?.chargeableHours} Hour{checkoutDialog.overstay?.chargeableHours !== 1 ? "s" : ""}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                            ₹{checkoutDialog.overstay?.hourlyRate}/hr &times; {checkoutDialog.overstay?.chargeableHours}h
                          </Typography>
                        </div>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: "#059669" }}>
                          ₹{checkoutDialog.overstay?.hourlyCharge?.toLocaleString()}
                        </Typography>
                      </Box>
                    </Paper>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {/* ITEMISED FOLIO BILL BREAKDOWN TABLE */}
            <Paper
              sx={{
                p: 2,
                borderRadius: "16px",
                border: `1px solid ${themeConfig.border}`,
                bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                <Receipt sx={{ fontSize: 18, color: themeConfig.primary }} />
                Folio Billing & Settlement Breakdown
              </Typography>
              <TableContainer sx={{ borderRadius: "10px", border: `1px solid ${themeConfig.border}` }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, fontSize: "0.78rem" }}>Bill Item / Description</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.78rem" }}>Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {/* Base Room Stay Tariff */}
                    <TableRow>
                      <TableCell sx={{ fontSize: "0.82rem", color: themeConfig.textMain }}>
                        <strong>Room Stay Tariff</strong>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                          {checkoutDialog.booking?.roomType?.name || "Room"} &bull; {checkoutDialog.booking?.checkInDate || "In"} to {checkoutDialog.booking?.checkOutDate || "Out"}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
                        ₹{(checkoutDialog.booking?.totalAmount || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>

                    {/* Late Checkout Fee if applicable */}
                    {checkoutDialog.lateFee > 0 && (
                      <TableRow sx={{ bgcolor: "rgba(239, 68, 68, 0.04)" }}>
                        <TableCell sx={{ fontSize: "0.82rem", color: "#DC2626" }}>
                          <strong>⏰ Late Check-Out Charge ({checkoutDialog.lateOption === "full_day" ? "Full Day" : `${checkoutDialog.overstay?.chargeableHours || 0} Extra Hours`})</strong>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                            {checkoutDialog.lateOption === "full_day"
                              ? "Charged standard 1-day tariff"
                              : `${checkoutDialog.overstay?.chargeableHours || 0} hrs @ ₹${checkoutDialog.overstay?.hourlyRate || 0}/hr`}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#DC2626", fontSize: "0.85rem" }}>
                          +₹{Number(checkoutDialog.lateFee).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )}

                    {/* Ancillary / POS Charges if any */}
                    {(checkoutDialog.booking?.posCharges || []).map((c, i) => (
                      <TableRow key={i}>
                        <TableCell sx={{ fontSize: "0.82rem", color: themeConfig.textMain }}>
                          {c.description || c.item || `Extra Service (${c.serviceType || "POS"})`}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.85rem" }}>
                          +₹{(c.amount || 0).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    ))}

                    {/* Grand Total */}
                    <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                      <TableCell sx={{ fontWeight: 900, fontSize: "0.85rem", color: themeConfig.textMain }}>
                        Total Folio Bill
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, fontSize: "0.92rem", color: themeConfig.textMain }}>
                        ₹{((checkoutDialog.booking?.totalAmount || 0) + (checkoutDialog.lateFee || 0) + ((checkoutDialog.booking?.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0))).toLocaleString()}
                      </TableCell>
                    </TableRow>

                    {/* Advance Already Paid */}
                    <TableRow>
                      <TableCell sx={{ fontSize: "0.82rem", color: "#059669" }}>
                        <strong>Advance Payment Paid at Check-In</strong>
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: "#059669", fontSize: "0.85rem" }}>
                        -₹{(checkoutDialog.booking?.paidAmount || 0).toLocaleString()}
                      </TableCell>
                    </TableRow>

                    {/* Balance to Settle */}
                    <TableRow sx={{ bgcolor: checkoutDialog.amount > 0 ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)" }}>
                      <TableCell sx={{ fontWeight: 900, fontSize: "0.88rem", color: checkoutDialog.amount > 0 ? "#DC2626" : "#059669" }}>
                        {checkoutDialog.amount > 0 ? "Net Amount to Collect at Checkout:" : "Folio Balance Status:"}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, fontSize: "1rem", color: checkoutDialog.amount > 0 ? "#DC2626" : "#059669" }}>
                        {checkoutDialog.amount > 0 ? `₹${checkoutDialog.amount.toLocaleString()}` : "₹0 (Fully Cleared)"}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>

            {/* Dues & Payment Section */}
            {checkoutDialog.amount > 0 ? (
              <Box sx={{ p: 2, borderRadius: "16px", bgcolor: "rgba(239, 68, 68, 0.04)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#DC2626", mb: 0.5 }}>
                  Outstanding Balance to Settle: ₹{checkoutDialog.amount.toLocaleString()}
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", mb: 2 }}>
                  Collect remaining folio balance before keycard return & check-out release:
                </Typography>

                <FormControl fullWidth size="small" sx={{ mb: 2 }}>
                  <InputLabel>Settlement Payment Mode</InputLabel>
                  <Select
                    value={checkoutDialog.paymentMethod}
                    label="Settlement Payment Mode"
                    onChange={(e) => setCheckoutDialog({ ...checkoutDialog, paymentMethod: e.target.value })}
                  >
                    <MenuItem value="UPI">📱 UPI / QR Code (Instant Scan)</MenuItem>
                    <MenuItem value="CARD">💳 Credit / Debit Card (POS)</MenuItem>
                    <MenuItem value="CASH">💵 Cash at Counter</MenuItem>
                    <MenuItem value="BANK_TRANSFER">🏦 Bank Transfer (NEFT / IMPS)</MenuItem>
                  </Select>
                </FormControl>

                {/* DYNAMIC PAYMENT METHOD UI */}
                {checkoutDialog.paymentMethod === "UPI" && (
                  <Paper
                    sx={{
                      p: 2,
                      borderRadius: "14px",
                      bgcolor: themeConfig.bgCard,
                      border: `1.5px solid ${themeConfig.primary}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 1.5,
                      boxShadow: "0 4px 12px rgba(11, 142, 224, 0.1)",
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.primary, textTransform: "uppercase" }}>
                      Scan UPI QR to Settle ₹{checkoutDialog.amount.toLocaleString()}
                    </Typography>

                    <Box
                      component="img"
                      src={qrCodeUrl}
                      alt="UPI Payment QR Code"
                      sx={{
                        width: 140,
                        height: 140,
                        borderRadius: "10px",
                        border: "1px solid #E2E8F0",
                      }}
                    />

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: themeConfig.champagne, px: 1.5, py: 0.6, borderRadius: "8px" }}>
                      <Typography variant="caption" sx={{ fontFamily: "monospace", fontWeight: 800, color: themeConfig.primaryDark }}>
                        {hotelUpi}
                      </Typography>
                      <IconButton size="small" onClick={handleCopyUpi} sx={{ p: 0.3 }}>
                        {copiedUpi ? <Check sx={{ fontSize: 14, color: themeConfig.success }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                      </IconButton>
                    </Box>

                    <TextField
                      size="small"
                      fullWidth
                      label="UPI Ref / Transaction ID (Optional)"
                      placeholder="e.g. 423819283741"
                      value={checkoutDialog.transactionId}
                      onChange={(e) => setCheckoutDialog({ ...checkoutDialog, transactionId: e.target.value })}
                      sx={{ mt: 0.5 }}
                    />
                  </Paper>
                )}

                {checkoutDialog.paymentMethod === "CARD" && (
                  <Paper sx={{ p: 2, borderRadius: "14px", bgcolor: themeConfig.bgCard, border: `1px solid ${themeConfig.border}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, display: "block", mb: 1.5 }}>
                      💳 POS Card Terminal Details:
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1.5 }}>
                      <TextField
                        size="small"
                        label="Card Last 4 Digits"
                        placeholder="e.g. 4829"
                        value={checkoutDialog.transactionId}
                        onChange={(e) => setCheckoutDialog({ ...checkoutDialog, transactionId: e.target.value })}
                        fullWidth
                      />
                      <TextField
                        size="small"
                        label="POS Auth Code"
                        placeholder="e.g. AUTH-8821"
                        value={checkoutDialog.paymentReference}
                        onChange={(e) => setCheckoutDialog({ ...checkoutDialog, paymentReference: e.target.value })}
                        fullWidth
                      />
                    </Box>
                  </Paper>
                )}

                {checkoutDialog.paymentMethod === "CASH" && (
                  <Paper sx={{ p: 2, borderRadius: "14px", bgcolor: themeConfig.bgCard, border: `1px solid ${themeConfig.border}` }}>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                      💵 Cash Counter Settlement
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                      Collect physical cash of <strong>₹{checkoutDialog.amount.toLocaleString()}</strong> at the front desk counter and print the cash receipt.
                    </Typography>
                  </Paper>
                )}

                {checkoutDialog.paymentMethod === "BANK_TRANSFER" && (
                  <Paper sx={{ p: 2, borderRadius: "14px", bgcolor: themeConfig.bgCard, border: `1px solid ${themeConfig.border}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, display: "block", mb: 1 }}>
                      🏦 Bank Transfer / NEFT / IMPS Reference:
                    </Typography>
                    <TextField
                      size="small"
                      fullWidth
                      label="Bank NEFT / IMPS UTR Number *"
                      placeholder="e.g. HDFCN24091823901"
                      value={checkoutDialog.transactionId}
                      onChange={(e) => setCheckoutDialog({ ...checkoutDialog, transactionId: e.target.value })}
                    />
                  </Paper>
                )}
              </Box>
            ) : (
              <Paper sx={{ p: 2.5, borderRadius: "16px", bgcolor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <CheckCircle sx={{ color: "#059669", fontSize: 28 }} />
                  <div>
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#059669" }}>
                      Account Fully Settled (₹0 Balance Due)
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                      Keycard can be returned now. Room will be automatically marked for <strong>Housekeeping Cleaning</strong>.
                    </Typography>
                  </div>
                </Box>
              </Paper>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2.5, pt: 1, display: "flex", flexDirection: "column", gap: 1.5 }}>
          <Button
            fullWidth
            variant="contained"
            startIcon={<WhatsApp sx={{ color: "#FFFFFF" }} />}
            onClick={() => {
              sendCheckoutBillWhatsApp({
                booking: checkoutDialog.booking,
                guest: checkoutDialog.booking?.guest || { name: checkoutDialog.booking?.guestName, mobileNumber: checkoutDialog.booking?.guestPhone },
                hotel: hotelSettings,
                settlementData: {
                  settlementPaymentAmount: checkoutDialog.amount,
                  lateCheckoutFee: checkoutDialog.lateFee,
                },
                onShowToast: (msg, sev) => toast.show(msg, sev),
              });
            }}
            sx={{
              borderRadius: "12px",
              fontWeight: 800,
              py: 1.2,
              bgcolor: "#25D366",
              color: "#FFFFFF",
              boxShadow: "0 4px 14px rgba(37, 211, 102, 0.3)",
              "&:hover": { bgcolor: "#1EBE5D" },
            }}
          >
            Send Bill on WhatsApp
          </Button>

          <Box sx={{ display: "flex", width: "100%", gap: 1.5 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => setCheckoutDialog({ open: false, booking: null, paymentMethod: "CASH", amount: 0, transactionId: "", paymentReference: "" })}
              sx={{
                borderRadius: "12px",
                fontWeight: 700,
                py: 1.1,
                borderColor: themeConfig.border,
                color: themeConfig.textMain,
                bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                "&:hover": { borderColor: themeConfig.primary, bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" },
              }}
            >
              Cancel
            </Button>

            <Button
              fullWidth
              variant="contained"
              onClick={handleConfirmCheckout}
              className="btn-3d"
              sx={{
                background: `linear-gradient(135deg, ${themeConfig.danger} 0%, #B91C1C 100%)`,
                color: "#FFFFFF",
                fontWeight: 800,
                py: 1.1,
                borderRadius: "12px",
                boxShadow: "0 4px 14px rgba(220, 38, 38, 0.3)",
              }}
            >
              Confirm & Settle Check-Out
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* ========================================================================= */}
      {/* DETAILED FOLIO BREAKDOWN MODAL                                           */}
      {/* ========================================================================= */}
      <Dialog
        open={detailsModal.open}
        onClose={() => setDetailsModal({ open: false, booking: null })}
        slotProps={{ paper: { sx: { borderRadius: "22px", p: 2, maxWidth: 600, border: `1px solid ${themeConfig.border}` } } }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 900, color: themeConfig.textMain, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span>Folio #{detailsModal.booking?.bookingNumber} Ledger Details</span>
          <IconButton size="small" onClick={() => setDetailsModal({ open: false, booking: null })}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {detailsModal.booking && (() => {
            const b = detailsModal.booking;
            const overstay = calculateOverstayFee(b, hotelSettings);
            const posChargesTotal = (b.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
            const grandTotal = (b.totalAmount || 0) + posChargesTotal + (overstay.lateFee || 0);
            const paidTotal = b.paidAmount || 0;
            const dueBalance = Math.max(0, grandTotal - paidTotal);

            return (
              <Box sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
                <Paper sx={{ p: 2, borderRadius: "14px", bgcolor: themeConfig.champagne, border: `1px solid ${themeConfig.border}` }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                    <div>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                        {b.guest?.name || b.guest?.fullName}
                      </Typography>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                        {(() => {
                          const rList = getBookingRoomNumbers(b);
                          return rList.length > 1 ? `Rooms: ${rList.join(", ")}` : `Room ${rList[0] || ""}`;
                        })()} &bull; Check-in: {b.checkInDate} ({b.checkInTime ? formatTime12Hour(b.checkInTime) : checkInTimeFormatted}) &bull; Check-out: {b.checkOutDate} ({(() => {
                          if (b.actualCheckOut) {
                            const d = new Date(b.actualCheckOut);
                            if (!isNaN(d.getTime())) {
                              const h = String(d.getHours()).padStart(2, "0");
                              const m = String(d.getMinutes()).padStart(2, "0");
                              return formatTime12Hour(`${h}:${m}`);
                            }
                          }
                          return formatTime12Hour(b.checkOutTime || hotelSettings?.checkOutTime || "12:00");
                        })()})
                      </Typography>
                    </div>
                    <StatusChip status={b.status} size="small" />
                  </Box>

                  {b.accompanyingGuests && b.accompanyingGuests.length > 0 && (
                    <Box sx={{ mt: 1.5, pt: 1, borderTop: `1px dashed ${themeConfig.border}` }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.primaryDark, display: "block", mb: 0.5 }}>
                        👥 Accompanying Members ({b.accompanyingGuests.length}):
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {b.accompanyingGuests.map((m, idx) => (
                          <Chip
                            key={idx}
                            size="small"
                            label={`${m.name} (${m.relationship || "Family"}${m.idNumber ? ` • ${m.idType}: ${m.idNumber}` : ""})`}
                            sx={{ bgcolor: themeConfig.bgCard, color: themeConfig.textMain, fontSize: "0.72rem", border: `1px solid ${themeConfig.border}` }}
                          />
                        ))}
                      </Box>
                    </Box>
                  )}

                  {/* Guest ID & Documents Showcase */}
                  {(b.guest?.idProof?.frontImage || b.guest?.frontImage || b.guest?.idProof?.backImage || b.guest?.backImage || (b.accompanyingGuests && b.accompanyingGuests.some(m => m.frontImage || m.backImage))) && (
                      <Box sx={{ mt: 2, pt: 1.5, borderTop: `1px dashed ${themeConfig.border}` }}>
                        <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.primaryDark, display: "block", mb: 1 }}>
                          📄 Guest ID Documents & Photo Verification:
                        </Typography>
                        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                          {/* Main Guest Front ID */}
                          {(b.guest?.idProof?.frontImage || b.guest?.frontImage) && (
                            <Paper
                              sx={{
                                p: 1,
                                borderRadius: "10px",
                                border: "1px solid #10B981",
                                bgcolor: "rgba(16, 185, 129, 0.04)",
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 0.5,
                                cursor: "pointer",
                                "&:hover": { boxShadow: "0 4px 12px rgba(16, 185, 129, 0.2)" },
                              }}
                              onClick={() => setPreviewImage(b.guest?.idProof?.frontImage || b.guest?.frontImage)}
                            >
                              <Box
                                component="img"
                                src={b.guest?.idProof?.frontImage || b.guest?.frontImage}
                                alt="Main Guest Front ID"
                                sx={{ width: 110, height: 70, objectFit: "cover", borderRadius: "6px" }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 800, color: "#059669", fontSize: "0.68rem" }}>
                                Main Front ID
                              </Typography>
                            </Paper>
                          )}

                          {/* Main Guest Back ID */}
                          {(b.guest?.idProof?.backImage || b.guest?.backImage) && (
                            <Paper
                              sx={{
                                p: 1,
                                borderRadius: "10px",
                                border: `1px solid ${themeConfig.border}`,
                                bgcolor: themeConfig.bgCard,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap: 0.5,
                                cursor: "pointer",
                                "&:hover": { borderColor: themeConfig.primary },
                              }}
                              onClick={() => setPreviewImage(b.guest?.idProof?.backImage || b.guest?.backImage)}
                            >
                              <Box
                                component="img"
                                src={b.guest?.idProof?.backImage || b.guest?.backImage}
                                alt="Main Guest Back ID"
                                sx={{ width: 110, height: 70, objectFit: "cover", borderRadius: "6px" }}
                              />
                              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, fontSize: "0.68rem" }}>
                                Main Back ID
                              </Typography>
                            </Paper>
                          )}

                          {/* Accompanying Member IDs */}
                          {(b.accompanyingGuests || []).map((m, mIdx) => (
                            m.frontImage ? (
                              <Paper
                                key={mIdx}
                                sx={{
                                  p: 1,
                                  borderRadius: "10px",
                                  border: `1px solid ${themeConfig.border}`,
                                  bgcolor: themeConfig.bgCard,
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 0.5,
                                  cursor: "pointer",
                                  "&:hover": { borderColor: themeConfig.primary },
                                }}
                                onClick={() => setPreviewImage(m.frontImage)}
                              >
                                <Box
                                  component="img"
                                  src={m.frontImage}
                                  alt={`${m.name} ID`}
                                  sx={{ width: 110, height: 70, objectFit: "cover", borderRadius: "6px" }}
                                />
                                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.primary, fontSize: "0.68rem" }}>
                                  {m.name || `Member ${mIdx + 1}`}
                                </Typography>
                              </Paper>
                            ) : null
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Paper>

                {overstay.isOverstay && (
                  <Paper sx={{ p: 1.8, borderRadius: "14px", bgcolor: "rgba(239, 68, 68, 0.08)", border: "1.5px dashed rgba(239, 68, 68, 0.4)" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Warning sx={{ color: "#DC2626", fontSize: 20 }} />
                      <Typography variant="body2" sx={{ fontWeight: 900, color: "#DC2626" }}>
                        Late Check-Out Policy: +{overstay.overdueHours}h Overdue past {formatTime12Hour(overstay.scheduledCheckOutTime || "12:00")}
                      </Typography>
                    </Box>
                    <Typography variant="caption" sx={{ color: themeConfig.textMain, display: "block", mt: 0.5 }}>
                      Automatic extra <strong>{overstay.extraDays} day room tariff</strong> (+₹{overstay.lateFee.toLocaleString()}) applied to this stay.
                    </Typography>
                  </Paper>
                )}

                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                  Itemized Charges & Ancillary Services:
                </Typography>

                <TableContainer sx={{ borderRadius: "12px", border: `1px solid ${themeConfig.border}` }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                        <TableCell sx={{ fontWeight: 800 }}>Category</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Room Accommodation</TableCell>
                        <TableCell><Chip label="STAY" size="small" sx={{ height: 20, fontSize: "0.65rem" }} /></TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>₹{(b.totalAmount || 0).toLocaleString()}</TableCell>
                      </TableRow>

                      {overstay.isOverstay && (
                        <TableRow sx={{ bgcolor: "rgba(239, 68, 68, 0.04)" }}>
                          <TableCell sx={{ fontWeight: 700, color: "#DC2626" }}>
                            ⏰ Late Check-Out ({overstay.extraDays} Extra Day past {formatTime12Hour(overstay.scheduledCheckOutTime || "12:00")})
                          </TableCell>
                          <TableCell><Chip label="OVERSTAY" size="small" sx={{ height: 20, fontSize: "0.65rem", bgcolor: "rgba(239, 68, 68, 0.15)", color: "#DC2626", fontWeight: 800 }} /></TableCell>
                          <TableCell align="right" sx={{ fontWeight: 800, color: "#DC2626" }}>+₹{overstay.lateFee.toLocaleString()}</TableCell>
                        </TableRow>
                      )}

                      {(b.posCharges || []).map((c, idx) => (
                        <TableRow key={idx}>
                          <TableCell>{c.item || c.title || "POS Service"}</TableCell>
                          <TableCell><Chip label={c.type || "POS"} size="small" sx={{ height: 20, fontSize: "0.65rem" }} /></TableCell>
                          <TableCell align="right" sx={{ fontWeight: 700 }}>₹{(c.amount || 0).toLocaleString()}</TableCell>
                        </TableRow>
                      ))}

                      <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                        <TableCell colSpan={2} sx={{ fontWeight: 900 }}>Total Billed Ledger</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                          ₹{grandTotal.toLocaleString()}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={2} sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Advance / Paid Amount</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#059669" }}>
                          ₹{paidTotal.toLocaleString()}
                        </TableCell>
                      </TableRow>

                      <TableRow>
                        <TableCell colSpan={2} sx={{ fontWeight: 900, color: themeConfig.danger }}>Outstanding Balance Due</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: themeConfig.danger }}>
                          ₹{dueBalance.toLocaleString()}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            );
          })()}
        </DialogContent>

        <DialogActions sx={{ p: 2, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="contained"
              startIcon={<WhatsApp sx={{ color: "#FFFFFF" }} />}
              onClick={() => {
                const b = detailsModal.booking;
                sendCheckoutBillWhatsApp({
                  booking: b,
                  guest: b?.guest || { name: b?.guestName, mobileNumber: b?.guestPhone },
                  hotel: hotelSettings,
                  onShowToast: (msg, sev) => toast.show(msg, sev),
                });
              }}
              sx={{
                borderRadius: "10px",
                fontWeight: 800,
                bgcolor: "#25D366",
                color: "#FFFFFF",
                boxShadow: "0 4px 12px rgba(37, 211, 102, 0.3)",
                "&:hover": { bgcolor: "#1EBE5D" },
              }}
            >
              Send Bill on WhatsApp
            </Button>
            <Button
              variant="outlined"
              startIcon={<WhatsApp sx={{ color: "#25D366" }} />}
              onClick={() => {
                const b = detailsModal.booking;
                sendCheckInWhatsApp({
                  booking: b,
                  guest: b?.guest || { name: b?.guestName, mobileNumber: b?.guestPhone },
                  hotel: hotelSettings,
                  onShowToast: (msg, sev) => toast.show(msg, sev),
                });
              }}
              sx={{
                borderRadius: "10px",
                fontWeight: 800,
                borderColor: "rgba(37, 211, 102, 0.5)",
                color: isDarkMode ? "#25D366" : "#059669",
                bgcolor: "rgba(37, 211, 102, 0.08)",
                "&:hover": { bgcolor: "rgba(37, 211, 102, 0.16)", borderColor: "#25D366" },
              }}
            >
              Send WhatsApp
            </Button>
          </Box>

          <Box sx={{ display: "flex", gap: 1 }}>
            <Button onClick={() => setDetailsModal({ open: false, booking: null })} sx={{ borderRadius: "10px" }}>
              Close
            </Button>
            <Button
              variant="contained"
              startIcon={<Receipt />}
              onClick={() => {
                const b = detailsModal.booking;
                setDetailsModal({ open: false, booking: null });
                if (onOpenInvoice) onOpenInvoice(b);
              }}
              className="btn-3d"
              sx={{
                background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                color: "#FFFFFF",
                fontWeight: 800,
                borderRadius: "10px",
              }}
            >
              View Tax Invoice
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Comprehensive Guest Details Dossier */}
      <GuestDetailsModal
        open={selectedGuestModal.open}
        onClose={() => setSelectedGuestModal({ open: false, guest: null, guestId: null })}
        guestId={selectedGuestModal.guestId}
        guestData={selectedGuestModal.guest}
        hotelSettings={hotelSettings}
      />

      {/* High-Resolution Document Image Zoom Preview Modal */}
      <Dialog
        open={Boolean(previewImage)}
        onClose={() => setPreviewImage(null)}
        maxWidth="md"
        slotProps={{ paper: { sx: { borderRadius: "18px", p: 1.5, bgcolor: "#111827", color: "#FFF" } } }}
      >
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", px: 1, pb: 1 }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 800, color: "#F8FAFC" }}>
            🔍 Document Photo Preview
          </Typography>
          <IconButton size="small" onClick={() => setPreviewImage(null)} sx={{ color: "#FFF" }}>
            <Close fontSize="small" />
          </IconButton>
        </Box>
        <Box sx={{ p: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: 250 }}>
          {previewImage && (
            <Box
              component="img"
              src={previewImage}
              alt="Document Full Preview"
              sx={{ maxWidth: "100%", maxHeight: "75vh", objectFit: "contain", borderRadius: "10px", border: "1px solid #374151" }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
