"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogContent,
  DialogActions,
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
  Divider,
  Card,
  CardContent,
  TablePagination,
} from "@mui/material";
import {
  Search,
  Visibility,
  Phone,
  Close,
  Person,
  MeetingRoom,
  EventNote,
  Email,
  CalendarMonth,
  Hotel,
  Receipt,
  Payments,
  BadgeOutlined,
  People,
  CheckCircle,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";

export default function GuestDirectoryPage({
  guests = [],
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

  // Filtered & Searched Guests
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      // 1. Status Filter
      if (guestFilter !== "ALL") {
        const gStatus = (g.status || "REGISTERED").toUpperCase();
        if (guestFilter === "IN-HOUSE" && gStatus !== "IN-HOUSE" && gStatus !== "CHECKED_IN") return false;
        if (guestFilter === "DEPARTED" && gStatus !== "DEPARTED" && gStatus !== "CHECKED_OUT") return false;
        if (guestFilter === "RESERVED" && gStatus !== "RESERVED" && gStatus !== "BOOKED") return false;
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

      // 3. Search Query
      if (guestSearch && guestSearch.trim()) {
        const q = guestSearch.toLowerCase().trim();
        const matchName = (g.name || g.fullName || "").toLowerCase().includes(q);
        const matchPhone = (g.phone || g.mobileNumber || "").toLowerCase().includes(q);
        const matchEmail = (g.email || "").toLowerCase().includes(q);
        const matchRoom = String(g.roomAssigned || g.roomNumber || g.room?.roomNumber || "").toLowerCase().includes(q);
        const matchId = String(g.idNumber || g.govtIdNumber || "").toLowerCase().includes(q);
        return matchName || matchPhone || matchEmail || matchRoom || matchId;
      }

      return true;
    });
  }, [guests, guestFilter, dateFilterType, startDate, endDate, guestSearch, todayStr]);

  const inHouseCount = guests.filter(
    (g) => (g.status || "").toUpperCase() === "IN-HOUSE" || (g.status || "").toUpperCase() === "CHECKED_IN"
  ).length;
  const departedCount = guests.filter(
    (g) => (g.status || "").toUpperCase() === "DEPARTED" || (g.status || "").toUpperCase() === "CHECKED_OUT"
  ).length;

  const handleSendWhatsApp = (guest) => {
    const phoneClean = (guest.phone || guest.mobileNumber || "").replace(/[^0-9]/g, "");
    const targetPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
    const msgText = encodeURIComponent(
      `🏨 *Grand Royale Luxury Resort* - Guest Folio Summary\n\n` +
      `Namaste *${guest.name || guest.fullName || "Guest"}*,\n` +
      `Thank you for staying with us in *Room #${guest.roomAssigned || guest.roomNumber || "101"}*.\n` +
      `• Check-In: ${guest.checkInDate || "Today"}\n` +
      `• Total Amount: ₹${(guest.totalAmount || 0).toLocaleString("en-IN")}\n` +
      `• Status: ${(guest.status || "IN-HOUSE").toUpperCase()}\n\n` +
      `For any assistance, please contact Front Desk.\nWish you a pleasant stay!`
    );
    window.open(`https://wa.me/${targetPhone}?text=${msgText}`, "_blank");
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      {/* ========================================================================= */}
      {/* 1. EXECUTIVE HERO COMMAND RIBBON                                          */}
      {/* ========================================================================= */}
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
                Executive Guest Registry &bull; Read-Only Audit
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: -0.5, fontSize: { xs: "1.4rem", sm: "1.8rem" } }}>
              Guest Master Directory
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontSize: "0.85rem" }}>
              Registered guest profiles, contact numbers, stay history, billing folios, and Govt ID compliance.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
            <Chip
              icon={<People sx={{ fontSize: "16px !important", color: "#FFFFFF !important" }} />}
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

      {/* ========================================================================= */}
      {/* 2. SEARCH & FILTER CONTROLS                                               */}
      {/* ========================================================================= */}
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
            placeholder="Search by name, phone, room #, Govt ID..."
            value={guestSearch}
            onChange={(e) => {
              setGuestSearch?.(e.target.value);
              setPage(0);
            }}
            sx={{
              flex: { xs: "1 1 100%", md: "1 1 360px" },
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

      {/* ========================================================================= */}
      {/* 3. GUEST DIRECTORY TABLE                                                  */}
      {/* ========================================================================= */}
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
        <Table sx={{ minWidth: 750 }}>
          <TableHead sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : themeConfig.champagne }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>GUEST PROFILE</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>CONTACT DETAILS</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>ASSIGNED ROOM</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>CHECK-IN &bull; OUT</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>FOLIO TOTAL</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>STATUS</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.8 }}>ACTION</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredGuests.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 6, textAlign: "center" }}>
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
                  const gEmail = guest.email || "N/A";
                  const gRoom =
                    guest.roomAssigned && guest.roomAssigned !== "Not Assigned"
                      ? guest.roomAssigned
                      : guest.room?.roomNumber || "101";
                  const gTotal = guest.totalAmount || 0;
                  const gStatus = guest.status || "IN-HOUSE";

                  return (
                    <TableRow
                      key={guest._id || guest.id || Math.random()}
                      hover
                      sx={{
                        "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(11, 142, 224, 0.04)" },
                        transition: "background 0.15s ease",
                      }}
                    >
                      {/* Profile Column */}
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "12px",
                              bgcolor: isDarkMode ? "rgba(255,255,255,0.1)" : themeConfig.champagne,
                              color: themeConfig.primary,
                              fontWeight: 800,
                              fontSize: "1rem",
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
                              <BadgeOutlined sx={{ fontSize: 13 }} />
                              {guest.idType || guest.govtIdType || "Govt ID"}: {guest.idNumber || guest.govtIdNumber || "N/A"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Contact Column */}
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 0.6 }}>
                          <Phone sx={{ fontSize: 14, color: themeConfig.primary }} />
                          {gPhone}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "flex", alignItems: "center", gap: 0.6 }}>
                          <Email sx={{ fontSize: 13 }} />
                          {gEmail}
                        </Typography>
                      </TableCell>

                      {/* Assigned Room Column */}
                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          icon={<MeetingRoom sx={{ fontSize: "14px !important" }} />}
                          label={`Room #${gRoom}`}
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

                      {/* Stay Dates */}
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, display: "block", color: themeConfig.textMain }}>
                          In: {guest.checkInDate || "Today"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                          Out: {guest.checkOutDate || "Tomorrow"}
                        </Typography>
                      </TableCell>

                      {/* Folio Total */}
                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                          ₹{Number(gTotal).toLocaleString("en-IN")}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell sx={{ py: 2 }}>
                        <StatusChip status={gStatus} size="small" />
                      </TableCell>

                      {/* Actions */}
                      <TableCell align="right" sx={{ py: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                          <Tooltip title="Inspect Full Guest Dossier & Folio">
                            <IconButton
                              size="small"
                              onClick={() => setViewGuestModal?.({ open: true, guest })}
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

                          <Tooltip title="Send Folio Summary via WhatsApp">
                            <IconButton
                              size="small"
                              onClick={() => handleSendWhatsApp(guest)}
                              sx={{
                                width: 32,
                                height: 32,
                                color: "#10B981",
                                bgcolor: "rgba(16, 185, 129, 0.12)",
                                borderRadius: "10px",
                                border: "1px solid rgba(16, 185, 129, 0.3)",
                                "&:hover": { bgcolor: "rgba(16, 185, 129, 0.25)" },
                              }}
                            >
                              <Phone fontSize="small" />
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

      {/* ========================================================================= */}
      {/* 4. MODAL: VIEW GUEST DOSSIER & FOLIO DETAILS                              */}
      {/* ========================================================================= */}
      <Dialog
        open={Boolean(viewGuestModal?.open)}
        onClose={() => setViewGuestModal?.({ open: false, guest: null })}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "24px",
              p: 0,
              border: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              boxShadow: isDarkMode ? "0 20px 50px rgba(0,0,0,0.6)" : "0 20px 50px rgba(0,0,0,0.18)",
              overflow: "hidden",
            },
          },
        }}
      >
        {viewGuestModal?.guest && (
          <Box>
            {/* Header Ribbon */}
            <Box
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${themeConfig.primaryDark || "#0C273B"} 0%, ${themeConfig.primary || "#0B8EE0"} 100%)`,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "14px",
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.15)" : "#FFFFFF",
                    color: isDarkMode ? "#FFFFFF" : themeConfig.primaryDark,
                    fontWeight: 900,
                    fontSize: "1.3rem",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                  }}
                >
                  {(viewGuestModal.guest.name || viewGuestModal.guest.fullName || "G").charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2 }}>
                    {viewGuestModal.guest.name || viewGuestModal.guest.fullName || "Resident Guest"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>
                    Registered Guest Dossier &bull; Folio #{viewGuestModal.guest._id?.slice(-6) || "PMS-001"}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={() => setViewGuestModal?.({ open: false, guest: null })}
                sx={{ color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>

            {/* Dossier Content Cards */}
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
                {/* Contact & ID Card */}
                <Card className="card-3d" sx={{ p: 2.5, borderRadius: "18px", border: `1px solid ${themeConfig.border}` }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 0.8 }}>
                    <Phone fontSize="small" sx={{ color: themeConfig.primary }} /> Guest Contact &amp; Identity
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, fontSize: "0.85rem" }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>Phone Number:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800 }}>{viewGuestModal.guest.phone || viewGuestModal.guest.mobileNumber || "N/A"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>Email Address:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{viewGuestModal.guest.email || "N/A"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>Govt ID Type:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary }}>{viewGuestModal.guest.idType || viewGuestModal.guest.govtIdType || "Govt ID"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>Govt ID Number:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{viewGuestModal.guest.idNumber || viewGuestModal.guest.govtIdNumber || "Not Provided"}</Typography>
                    </Box>
                    <Box sx={{ gridColumn: "span 2" }}>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>Permanent Address / City:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>{viewGuestModal.guest.address || "Not Provided"}</Typography>
                    </Box>
                  </Box>
                </Card>

                {/* Stay & Room Card */}
                <Card className="card-3d" sx={{ p: 2.5, borderRadius: "18px", border: `1px solid ${themeConfig.border}` }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 2, display: "flex", alignItems: "center", gap: 0.8 }}>
                    <MeetingRoom fontSize="small" sx={{ color: themeConfig.primary }} /> Room Allocation &amp; Stay
                  </Typography>
                  <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2, fontSize: "0.85rem" }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>Assigned Room:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primaryDark }}>
                        {viewGuestModal.guest.roomAssigned && viewGuestModal.guest.roomAssigned !== "Not Assigned"
                          ? `Room #${viewGuestModal.guest.roomAssigned}`
                          : viewGuestModal.guest.room?.roomNumber
                          ? `Room #${viewGuestModal.guest.room.roomNumber}`
                          : "Room #101"}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>Current Stay Status:</Typography>
                      <Box sx={{ mt: 0.3 }}>
                        <StatusChip status={viewGuestModal.guest.status || "IN-HOUSE"} size="small" />
                      </Box>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>Check-In Timeline:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{viewGuestModal.guest.checkInDate || "Today"}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>Expected Check-Out:</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 700 }}>{viewGuestModal.guest.checkOutDate || "Tomorrow"}</Typography>
                    </Box>
                    <Box sx={{ gridColumn: "span 2", pt: 1 }}>
                      <Divider sx={{ mb: 1.5 }} />
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Folio Total Amount:</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                          ₹{(viewGuestModal.guest.totalAmount || 0).toLocaleString("en-IN")}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              </Box>
            </Box>

            {/* Modal Actions */}
            <DialogActions sx={{ p: 2.5, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : themeConfig.champagne, display: "flex", justifyContent: "space-between" }}>
              <Button
                variant="outlined"
                startIcon={<Phone sx={{ color: "#10B981" }} />}
                onClick={() => handleSendWhatsApp(viewGuestModal.guest)}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 800,
                  color: "#10B981",
                  borderColor: "rgba(16, 185, 129, 0.4)",
                  "&:hover": { bgcolor: "rgba(16, 185, 129, 0.1)" },
                }}
              >
                Send WhatsApp Folio
              </Button>
              <Button
                onClick={() => setViewGuestModal?.({ open: false, guest: null })}
                variant="contained"
                className="btn-3d"
                sx={{
                  borderRadius: "12px",
                  fontWeight: 800,
                  bgcolor: themeConfig.primary,
                  px: 3,
                }}
              >
                Close Dossier
              </Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
