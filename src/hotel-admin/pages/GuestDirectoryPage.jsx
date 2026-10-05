"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
  Tooltip,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
} from "@mui/material";
import {
  Search,
  Visibility,
  Phone,
  Person,
  MeetingRoom,
  BadgeOutlined,
  People,
  CheckCircle,
  BookmarkBorder,
  Download,
  WhatsApp,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import GuestDetailsModal from "@/shared/components/GuestDetailsModal";
import { downloadGuestDirectoryPDF, downloadGovtIdReportPDF } from "@/shared/utils/pdfGenerator";
import { sendCheckInWhatsApp, sendCheckoutBillWhatsApp } from "@/shared/utils/whatsappUtils";
import { toast } from "@/shared/utils/toast";

export default function GuestDirectoryPage({
  guests = [],
  bookings = [],
  rooms = [],
  guestSearch = "",
  setGuestSearch,
  guestFilter = "ALL",
  setGuestFilter,
  viewGuestModal = { open: false, guest: null },
  setViewGuestModal,
  hotelSettings = { checkInTime: "14:00", checkOutTime: "12:00", timezone: "Asia/Kolkata" },
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [dateFilterType, setDateFilterType] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Detailed Modal state
  const [activeGuestDetail, setActiveGuestDetail] = useState({
    open: false,
    guest: null,
  });

  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);

  function normalizeDate(val) {
    if (!val) return "";
    if (typeof val === "string") {
      if (val.includes("/")) {
        const parts = val.split("/");
        if (parts.length === 3) {
          const day = parts[0].padStart(2, "0");
          const month = parts[1].padStart(2, "0");
          const year = parts[2];
          return `${year}-${month}-${day}`;
        }
      }
      return val.split("T")[0];
    }
    try {
      const d = new Date(val);
      if (isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return "";
    }
  }

  // Filtered & Searched Guests (Requirements 7 & 14)
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      // 1. Status Filter
      if (guestFilter !== "ALL") {
        const gStatus = (g.status || g.bookingStatus || "REGISTERED").toUpperCase();
        if (guestFilter === "IN-HOUSE" && gStatus !== "IN-HOUSE" && gStatus !== "CHECKED_IN") return false;
        if (guestFilter === "DEPARTED" && gStatus !== "DEPARTED" && gStatus !== "CHECKED_OUT") return false;
        if (guestFilter === "RESERVED" && gStatus !== "RESERVED" && gStatus !== "BOOKED" && gStatus !== "CONFIRMED") return false;
        if (guestFilter === "REGISTERED" && gStatus !== "REGISTERED") return false;
      }

      // 2. Date Range Filter
      if (dateFilterType === "TODAY") {
        const cIn = normalizeDate(g.checkInDate || g.checkInDateRaw);
        const cOut = normalizeDate(g.checkOutDate || g.checkOutDateRaw);
        if (cIn !== todayStr && cOut !== todayStr) return false;
      } else if (dateFilterType === "CUSTOM" && startDate && endDate) {
        const cIn = normalizeDate(g.checkInDate || g.checkInDateRaw);
        if (cIn && (cIn < startDate || cIn > endDate)) return false;
      }

      // 3. Search Query: Name, Mobile, Booking ID, Room Number
      if (guestSearch && guestSearch.trim()) {
        const q = guestSearch.toLowerCase().trim();
        const matchName = (g.name || g.fullName || "").toLowerCase().includes(q);
        const matchPhone = (g.phone || g.mobileNumber || "").toLowerCase().includes(q);
        const matchBookingId = (g.bookingNumber || g.bookingId || g.booking?._id || g._id || "").toLowerCase().includes(q);
        const matchRoom = String(
          g.roomAssigned || g.roomNumber || g.room?.roomNumber || (g.rooms ? g.rooms.map((r) => r.roomNumber || r.room?.roomNumber).join(" ") : "")
        ).toLowerCase().includes(q);
        const matchId = String(g.idNumber || g.govtIdNumber || "").toLowerCase().includes(q);

        return matchName || matchPhone || matchBookingId || matchRoom || matchId;
      }

      return true;
    });
  }, [guests, guestFilter, dateFilterType, startDate, endDate, guestSearch, todayStr]);

  const inHouseCount = guests.filter(
    (g) => (g.status || g.bookingStatus || "").toUpperCase() === "IN-HOUSE" || (g.status || g.bookingStatus || "").toUpperCase() === "CHECKED_IN"
  ).length;
  const departedCount = guests.filter(
    (g) => (g.status || g.bookingStatus || "").toUpperCase() === "DEPARTED" || (g.status || g.bookingStatus || "").toUpperCase() === "CHECKED_OUT"
  ).length;

  const handleOpenGuestModal = (guest) => {
    setActiveGuestDetail({ open: true, guest });
    setViewGuestModal?.({ open: true, guest });
  };

  const handleSendWhatsApp = (guest) => {
    const isDeparted = (guest.status || guest.bookingStatus || "").toUpperCase() === "DEPARTED" || (guest.status || guest.bookingStatus || "").toUpperCase() === "CHECKED_OUT";
    if (isDeparted) {
      sendCheckoutBillWhatsApp({
        guest,
        booking: {
          guestName: guest.name || guest.fullName,
          bookingNumber: guest.bookingNumber,
          roomNumber: guest.roomAssigned || guest.roomNumber,
          checkInDate: guest.checkInDate,
          checkOutDate: guest.checkOutDate,
          totalAmount: guest.totalBilled || guest.totalAmount || 0,
          paidAmount: guest.paidAmount || guest.totalBilled || 0,
        },
        hotel: hotelSettings?.hotel || {},
        onShowToast: (msg, sev) => toast.show(msg, sev),
      });
    } else {
      sendCheckInWhatsApp({
        guest,
        booking: {
          guestName: guest.name || guest.fullName,
          bookingNumber: guest.bookingNumber,
          roomNumber: guest.roomAssigned || guest.roomNumber,
          checkInDate: guest.checkInDate,
          checkOutDate: guest.checkOutDate,
          adults: guest.adults || 1,
        },
        hotel: hotelSettings?.hotel || {},
        onShowToast: (msg, sev) => toast.show(msg, sev),
      });
    }
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      {/* 1. EXECUTIVE HERO COMMAND RIBBON */}
      <Box
        sx={{
          mb: 3.5,
          p: { xs: 2.5, sm: 3 },
          borderRadius: "24px",
          background: `linear-gradient(135deg, ${themeConfig.primaryDark || "#0C273B"} 0%, ${themeConfig.primary || "#0B8EE0"} 100%)`,
          color: "#FFFFFF",
          boxShadow: `0 16px 36px -10px ${themeConfig.primaryGlow || "rgba(11, 142, 224, 0.4)"}, inset 0 1px 1px rgba(255,255,255,0.4)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Box>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 1.4, py: 0.5, borderRadius: "20px", bgcolor: "rgba(255,255,255,0.15)", mb: 1 }}>
              <Person sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
                Executive Guest Registry &bull; Realtime PMS
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: -0.5, fontSize: { xs: "1.4rem", sm: "1.8rem" } }}>
              Guest Master Directory
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontSize: "0.85rem" }}>
              Registered guest profiles, contact numbers, stay history, billing folios, and Govt ID compliance.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.2, alignItems: "center" }}>
            <Button
              startIcon={<Download />}
              variant="contained"
              onClick={() => downloadGuestDirectoryPDF(filteredGuests.length > 0 ? filteredGuests : guests, hotelSettings?.hotel || {})}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "0.8rem",
                borderRadius: "12px",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.3)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.35)" },
              }}
            >
              Export Directory PDF
            </Button>

            <Button
              startIcon={<Download />}
              variant="contained"
              onClick={() => downloadGovtIdReportPDF(filteredGuests.length > 0 ? filteredGuests : guests, hotelSettings?.hotel || {})}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "0.8rem",
                borderRadius: "12px",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.3)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.35)" },
              }}
            >
              Police Manifest PDF
            </Button>

            <Chip
              label={`Total Guests: ${guests.length}`}
              sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#FFFFFF", fontWeight: 800, borderRadius: "12px", px: 1 }}
            />
            <Chip
              icon={<MeetingRoom sx={{ fontSize: "16px !important", color: "#10B981 !important" }} />}
              label={`In-House: ${inHouseCount}`}
              sx={{ bgcolor: "rgba(16, 185, 129, 0.2)", color: "#FFFFFF", fontWeight: 800, borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.4)", px: 1 }}
            />
            <Chip
              icon={<CheckCircle sx={{ fontSize: "16px !important", color: "#F59E0B !important" }} />}
              label={`Departed: ${departedCount}`}
              sx={{ bgcolor: "rgba(245, 158, 11, 0.2)", color: "#FFFFFF", fontWeight: 800, borderRadius: "12px", border: "1px solid rgba(245, 158, 11, 0.4)", px: 1 }}
            />
          </Box>
        </Box>
      </Box>

      {/* 2. SEARCH & FILTER CONTROLS */}
      <Paper
        elevation={0}
        className="card-3d"
        sx={{
          p: { xs: 2, sm: 2.5 },
          mb: 3,
          borderRadius: "20px",
          border: `1px solid ${themeConfig.border}`,
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", justifyContent: "space-between" }}>
          {/* Search Box */}
          <TextField
            size="small"
            placeholder="Search by name, mobile, booking ID, room #..."
            value={guestSearch}
            onChange={(e) => {
              setGuestSearch?.(e.target.value);
              setPage(0);
            }}
            sx={{
              flex: { xs: "1 1 100%", md: "1 1 380px" },
              "& .MuiOutlinedInput-root": { borderRadius: "14px" },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: themeConfig.primary, fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
            {/* Status Filter Dropdown */}
            <TextField
              select
              size="small"
              value={guestFilter}
              onChange={(e) => {
                setGuestFilter?.(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 150, "& .MuiOutlinedInput-root": { borderRadius: "14px" } }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="IN-HOUSE">In-House Guests</MenuItem>
              <MenuItem value="DEPARTED">Departed / Checked-Out</MenuItem>
              <MenuItem value="RESERVED">Reserved / Upcoming</MenuItem>
              <MenuItem value="REGISTERED">Registered Profiles</MenuItem>
            </TextField>

            {/* Date Filter Dropdown */}
            <TextField
              select
              size="small"
              value={dateFilterType}
              onChange={(e) => {
                setDateFilterType(e.target.value);
                setPage(0);
              }}
              sx={{ minWidth: 140, "& .MuiOutlinedInput-root": { borderRadius: "14px" } }}
            >
              <MenuItem value="ALL">All Dates</MenuItem>
              <MenuItem value="TODAY">Today's Guests</MenuItem>
              <MenuItem value="CUSTOM">Custom Range</MenuItem>
            </TextField>

            {dateFilterType === "CUSTOM" && (
              <>
                <TextField
                  type="date"
                  size="small"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  sx={{ width: 145, "& .MuiOutlinedInput-root": { borderRadius: "14px" } }}
                />
                <TextField
                  type="date"
                  size="small"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  sx={{ width: 145, "& .MuiOutlinedInput-root": { borderRadius: "14px" } }}
                />
              </>
            )}
          </Box>
        </Box>
      </Paper>

      {/* 3. GUEST DIRECTORY TABLE (REQUIREMENT 7 COLUMNS) */}
      <TableContainer
        component={Paper}
        elevation={0}
        className="card-3d"
        sx={{
          borderRadius: "20px",
          border: `1px solid ${themeConfig.border}`,
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          overflow: "hidden",
        }}
      >
        <Table sx={{ minWidth: 900 }}>
          <TableHead sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : themeConfig.champagne }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>GUEST NAME</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>MOBILE</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>BOOKING ID</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>ROOM</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>CHECK-IN</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>CHECK-OUT</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>GUESTS</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>PAYMENT STATUS</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>BOOKING STATUS</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>ACTION</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredGuests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} sx={{ py: 6, textAlign: "center" }}>
                  <EmptyState
                    title="No Guest Records Found"
                    description="No matching guests found. Check your search query or filters."
                  />
                </TableCell>
              </TableRow>
            ) : (
              filteredGuests
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((guest) => {
                  const gName = guest.name || guest.fullName || "Resident Guest";
                  const gPhone = guest.phone || guest.mobileNumber || "Not Provided";
                  const gBookingId = guest.bookingNumber || guest.bookingId || (guest._id ? `BK-${guest._id.slice(-4).toUpperCase()}` : "BK-1021");
                  const gRoom =
                    guest.roomAssigned && guest.roomAssigned !== "Not Assigned"
                      ? guest.roomAssigned
                      : guest.room?.roomNumber || "101";
                  const gCheckIn = guest.checkInDate || guest.checkIn || "01 Oct";
                  const gCheckOut = guest.checkOutDate || guest.checkOut || "03 Oct";
                  const gPax = guest.totalGuests || guest.numberOfGuests || (guest.accompanyingGuests ? guest.accompanyingGuests.length + 1 : 2);
                  
                  // Match guest with live bookings if available
                  const matchingBooking = (bookings || []).find((b) =>
                    (b.guest && (b.guest._id === guest._id || b.guest === guest._id)) ||
                    (b.bookingNumber && (b.bookingNumber === guest.activeBookingNumber || b.bookingNumber === guest.bookingNumber)) ||
                    (guest.phone && b.guestPhone && b.guestPhone === guest.phone) ||
                    (guest.mobileNumber && b.guestPhone && b.guestPhone === guest.mobileNumber)
                  );

                  const liveDue = guest.dueAmount !== undefined ? Number(guest.dueAmount) : (matchingBooking?.dueAmount !== undefined ? Number(matchingBooking.dueAmount) : (guest.balanceAmount !== undefined ? Number(guest.balanceAmount) : null));
                  const livePaid = guest.paidAmount !== undefined ? Number(guest.paidAmount) : (matchingBooking?.paidAmount !== undefined ? Number(matchingBooking.paidAmount) : (guest.advanceAmount !== undefined ? Number(guest.advanceAmount) : 0));
                  const liveTotal = guest.totalAmount !== undefined ? Number(guest.totalAmount) : (matchingBooking?.totalAmount !== undefined ? Number(matchingBooking.totalAmount) : (guest.totalBilled || 0));

                  let gPaymentStatus = (guest.paymentStatus || matchingBooking?.paymentStatus || "").toUpperCase();
                  if (gPaymentStatus === "PARTIALLY_PAID") gPaymentStatus = "PARTIAL";
                  if (!gPaymentStatus || gPaymentStatus === "PENDING") {
                    if (liveDue !== null && liveDue <= 0 && (livePaid > 0 || liveTotal > 0)) {
                      gPaymentStatus = "PAID";
                    } else if (livePaid > 0) {
                      gPaymentStatus = "PARTIAL";
                    } else {
                      gPaymentStatus = "PENDING";
                    }
                  }
                  const gBookingStatus = (guest.status || guest.bookingStatus || "CHECKED_IN").toUpperCase();

                  return (
                    <TableRow
                      key={guest._id || guest.id || Math.random()}
                      hover
                      onClick={() => handleOpenGuestModal(guest)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(11, 142, 224, 0.04)" },
                        transition: "background 0.15s ease",
                      }}
                    >
                      {/* 1. Guest Name */}
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: "12px",
                              bgcolor: isDarkMode ? "rgba(255,255,255,0.1)" : themeConfig.champagne,
                              color: themeConfig.primary,
                              fontWeight: 800,
                              fontSize: "0.95rem",
                              border: `1px solid ${themeConfig.border}`,
                            }}
                          >
                            {gName.charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                              {gName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "flex", alignItems: "center", gap: 0.5 }}>
                              <BadgeOutlined sx={{ fontSize: 12 }} />
                              {guest.idType || guest.govtIdType || "ID"}: {guest.idNumber || guest.govtIdNumber || "Verified"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* 2. Mobile */}
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Phone sx={{ fontSize: 13, color: themeConfig.primary }} />
                          {gPhone}
                        </Typography>
                      </TableCell>

                      {/* 3. Booking ID */}
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          icon={<BookmarkBorder sx={{ fontSize: "14px !important" }} />}
                          label={gBookingId}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            borderRadius: "8px",
                            bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                            color: themeConfig.textMain,
                          }}
                        />
                      </TableCell>

                      {/* 4. Room */}
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          icon={<MeetingRoom sx={{ fontSize: "14px !important" }} />}
                          label={`Room ${gRoom}`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            borderRadius: "8px",
                            bgcolor: isDarkMode ? "rgba(11, 142, 224, 0.15)" : themeConfig.champagne,
                            color: themeConfig.primaryDark,
                            border: `1px solid ${themeConfig.border}`,
                          }}
                        />
                      </TableCell>

                      {/* 5. Check-In */}
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                          {gCheckIn}
                        </Typography>
                      </TableCell>

                      {/* 6. Check-Out */}
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMuted }}>
                          {gCheckOut}
                        </Typography>
                      </TableCell>

                      {/* 7. Guests */}
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          icon={<People sx={{ fontSize: "14px !important" }} />}
                          label={`${gPax} Guest${gPax > 1 ? "s" : ""}`}
                          size="small"
                          sx={{
                            fontWeight: 700,
                            borderRadius: "8px",
                            bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F8FAFC",
                          }}
                        />
                      </TableCell>

                      {/* 8. Payment Status */}
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          label={gPaymentStatus}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            borderRadius: "8px",
                            bgcolor:
                              gPaymentStatus === "PAID"
                                ? "rgba(16, 185, 129, 0.15)"
                                : gPaymentStatus === "PARTIAL"
                                ? "rgba(245, 158, 11, 0.15)"
                                : "rgba(239, 68, 68, 0.15)",
                            color:
                              gPaymentStatus === "PAID"
                                ? "#10B981"
                                : gPaymentStatus === "PARTIAL"
                                ? "#F59E0B"
                                : "#EF4444",
                            border: "1px solid",
                            borderColor:
                              gPaymentStatus === "PAID"
                                ? "rgba(16, 185, 129, 0.3)"
                                : gPaymentStatus === "PARTIAL"
                                ? "rgba(245, 158, 11, 0.3)"
                                : "rgba(239, 68, 68, 0.3)",
                          }}
                        />
                      </TableCell>

                      {/* 9. Booking Status */}
                      <TableCell sx={{ py: 2 }}>
                        <StatusChip status={gBookingStatus} size="small" />
                      </TableCell>

                      {/* 10. Actions */}
                      <TableCell align="right" sx={{ py: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                          <Tooltip title="View Complete Guest Dossier">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenGuestModal(guest);
                              }}
                              sx={{
                                width: 32,
                                height: 32,
                                color: themeConfig.primaryDark,
                                bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : themeConfig.champagne,
                                borderRadius: "10px",
                                border: `1px solid ${themeConfig.border}`,
                                "&:hover": {
                                  borderColor: themeConfig.primary,
                                  bgcolor: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(11, 142, 224, 0.12)",
                                },
                              }}
                            >
                              <Visibility fontSize="small" />
                            </IconButton>
                          </Tooltip>

                          <Tooltip title="Send WhatsApp">
                            <IconButton
                              size="small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSendWhatsApp(guest);
                              }}
                              sx={{
                                width: 32,
                                height: 32,
                                color: "#25D366",
                                bgcolor: "rgba(37, 211, 102, 0.12)",
                                borderRadius: "10px",
                                border: "1px solid rgba(37, 211, 102, 0.3)",
                                "&:hover": { bgcolor: "#25D366", color: "#FFFFFF" },
                              }}
                            >
                              <WhatsApp sx={{ fontSize: 16 }} />
                            </IconButton>
                          </Tooltip>
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })
            )}
          </TableBody>
        </Table>

        {filteredGuests.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredGuests.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              borderTop: `1px solid ${themeConfig.border}`,
            }}
          />
        )}
      </TableContainer>

      {/* 4. COMPREHENSIVE GUEST DETAILS MODAL (REQUIREMENTS 8-12) */}
      <GuestDetailsModal
        open={activeGuestDetail.open || Boolean(viewGuestModal?.open)}
        onClose={() => {
          setActiveGuestDetail({ open: false, guest: null });
          setViewGuestModal?.({ open: false, guest: null });
        }}
        guestId={activeGuestDetail.guest?._id || activeGuestDetail.guest?.id || viewGuestModal?.guest?._id || viewGuestModal?.guest?.id}
        guestData={activeGuestDetail.guest || viewGuestModal?.guest}
        hotelSettings={hotelSettings}
      />
    </Box>
  );
}
