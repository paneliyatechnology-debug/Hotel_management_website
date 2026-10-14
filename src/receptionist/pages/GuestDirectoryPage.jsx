"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
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
  CircularProgress,
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
  Refresh,
} from "@/shared/icons";
import dynamic from "next/dynamic";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { useSocket } from "@/shared/context/SocketContext";
import { formatTime12Hour } from "@/shared/utils/timeUtils";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import { sendCheckInWhatsApp, sendCheckoutBillWhatsApp } from "@/shared/utils/whatsappUtils";
import { apiRequest, API_ENDPOINTS } from "@/config/api";
import { toast } from "@/shared/utils/toast";
import { createSafeGuestModalData } from "@/shared/utils/guestModalUtils";

const GuestDetailsModal = dynamic(() => import("@/shared/components/GuestDetailsModal"));

export default function GuestDirectoryPage({
  hotelSettings = { checkInTime: "14:00", checkOutTime: "12:00", timezone: "Asia/Kolkata" },
  onRefresh,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();

  // Real-Time Socket Auto-Sync
  useSocket(
    [
      "GUEST_UPDATED",
      "BOOKING_CREATED",
      "BOOKING_UPDATED",
      "GUEST_CHECKED_OUT",
      "DASHBOARD_SYNC",
    ],
    () => {
      fetchGuests();
      if (onRefresh) onRefresh();
    }
  );
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedGuestForModal, setSelectedGuestForModal] = useState({
    open: false,
    guest: null,
  });

  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const formatDDMMYYYY = (val) => {
    if (!val || val === "N/A") return "N/A";
    if (typeof val === "string" && /^\d{2}-\d{2}-\d{4}$/.test(val)) return val;
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}/.test(val)) {
      const [y, m, d] = val.split("T")[0].split("-");
      return `${d}-${m}-${y}`;
    }
    if (typeof val === "string" && val.includes("/")) {
      const parts = val.split("/");
      if (parts.length === 3) {
        const m = parts[0].padStart(2, "0");
        const d = parts[1].padStart(2, "0");
        const y = parts[2];
        return `${d}-${m}-${y}`;
      }
    }
    const dateObj = new Date(val);
    if (isNaN(dateObj.getTime())) return String(val);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const fetchGuests = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== "ALL") {
        params.append("status", statusFilter);
      }
      if (debouncedSearch.trim()) {
        params.append("search", debouncedSearch.trim());
      }

      const endpoint = `${API_ENDPOINTS.RECEPTIONIST.GUESTS}?${params.toString()}`;
      const res = await apiRequest(endpoint);

      const rawList =
        (Array.isArray(res?.data) ? res.data : null) ||
        (Array.isArray(res?.data?.guests) ? res.data.guests : null) ||
        (Array.isArray(res?.data?.bookings) ? res.data.bookings : null) ||
        (Array.isArray(res?.guests) ? res.guests : null) ||
        (Array.isArray(res?.bookings) ? res.bookings : null) ||
        (Array.isArray(res) ? res : []);
      setGuests(rawList);
    } catch (err) {
      console.warn("Could not fetch receptionist guest list:", err);
      toast.show("Error loading guest directory", "error");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, debouncedSearch]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  // KPI telemetry counts
  const stats = useMemo(() => {
    const total = guests.length;
    const inHouse = guests.filter((g) => g.status === "IN-HOUSE" || g.status === "CHECKED_IN").length;
    const departed = guests.filter((g) => g.status === "CHECKED_OUT" || g.status === "DEPARTED").length;
    const reserved = guests.filter((g) => g.status === "RESERVED" || g.status === "CONFIRMED").length;
    return { total, inHouse, departed, reserved };
  }, [guests]);

  const handleRowClick = (guest) => {
    setSelectedGuestForModal({
      open: true,
      guest: createSafeGuestModalData(guest),
      guestId: guest._id || guest.id || guest.guestId || guest.bookingId,
    });
  };

  const paginatedGuests = useMemo(() => {
    return guests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [guests, page, rowsPerPage]);

  return (
    <Box sx={{ p: { xs: 1.5, sm: 2, md: 2.5 }, display: "flex", flexDirection: "column", gap: 3, pb: 6 }}>
      {/* 1. Header Banner */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, md: 3 },
          borderRadius: "20px",
          background: themeConfig.navBg || "linear-gradient(135deg, #092622 0%, #0F766E 50%, #14B8A6 100%)",
          color: "#FFFFFF",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Avatar
            sx={{
              width: 52,
              height: 52,
              bgcolor: "rgba(255, 255, 255, 0.15)",
              color: "#FFFFFF",
              backdropFilter: "blur(8px)",
            }}
          >
            <People sx={{ fontSize: 28 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: "-0.5px" }}>
              Guest Directory &amp; Master Dossier
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255, 255, 255, 0.85)", fontWeight: 600, mt: 0.5 }}>
              Complete record of active in-house guests, past stays, and regulatory identification proofs.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={fetchGuests}
            sx={{
              borderColor: "rgba(255, 255, 255, 0.5)",
              color: "#FFFFFF",
              bgcolor: "rgba(255, 255, 255, 0.1)",
              backdropFilter: "blur(4px)",
              fontWeight: 800,
              borderRadius: "12px",
              px: 2,
              py: 1,
              textTransform: "none",
              "&:hover": { borderColor: "#FFFFFF", bgcolor: "rgba(255, 255, 255, 0.25)" },
            }}
          >
            Refresh
          </Button>
        </Box>
      </Paper>

      {/* 2. KPI Telemetry Bar */}
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, 1fr)" }, gap: 2 }}>
        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: isDarkMode ? themeConfig.surface : "#FFFFFF",
            border: `1px solid ${themeConfig.border}`,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textSecondary, textTransform: "uppercase" }}>
            Total Registered
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 900, color: themeConfig.primary }}>
            {stats.total}
          </Typography>

          <Typography variant="caption" sx={{ color: themeConfig.textSecondary, fontWeight: 600 }}>
            Master profiles logged
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: isDarkMode ? themeConfig.surface : "#FFFFFF",
            border: `1px solid ${themeConfig.border}`,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textSecondary, textTransform: "uppercase" }}>
            Active In-House
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 900, color: "#10B981" }}>
            {stats.inHouse}
          </Typography>

          <Typography variant="caption" sx={{ color: themeConfig.textSecondary, fontWeight: 600 }}>
            Currently occupied rooms
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: isDarkMode ? themeConfig.surface : "#FFFFFF",
            border: `1px solid ${themeConfig.border}`,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textSecondary, textTransform: "uppercase" }}>
            Departed / Settled
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 900, color: "#F59E0B" }}>
            {stats.departed}
          </Typography>

          <Typography variant="caption" sx={{ color: themeConfig.textSecondary, fontWeight: 600 }}>
            Past stays checked out
          </Typography>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: isDarkMode ? themeConfig.surface : "#FFFFFF",
            border: `1px solid ${themeConfig.border}`,
            display: "flex",
            flexDirection: "column",
            gap: 0.5,
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textSecondary, textTransform: "uppercase" }}>
            Upcoming Reservations
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 900, color: "#8B5CF6" }}>
            {stats.reserved}
          </Typography>

          <Typography variant="caption" sx={{ color: themeConfig.textSecondary, fontWeight: 600 }}>
            Confirmed advance bookings
          </Typography>
        </Paper>
      </Box>

      {/* 3. Search & Status Filter Controls */}
      <Paper
        elevation={0}
        sx={{
          p: 2,
          borderRadius: "16px",
          bgcolor: isDarkMode ? themeConfig.surface : "#FFFFFF",
          border: `1px solid ${themeConfig.border}`,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <TextField
          placeholder="Search by name, mobile, room #, or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: { xs: "100%", sm: 320 } }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: themeConfig.textSecondary, fontSize: 20 }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
          {[
            { label: "All Guests", value: "ALL" },
            { label: "In-House", value: "IN-HOUSE" },
            { label: "Checked-Out", value: "CHECKED_OUT" },
            { label: "Reserved", value: "RESERVED" },
          ].map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              onClick={() => setStatusFilter(item.value)}
              sx={{
                fontWeight: 800,
                fontSize: "0.8rem",
                borderRadius: "10px",
                px: 1,
                bgcolor: statusFilter === item.value ? themeConfig.primary : isDarkMode ? "rgba(255,255,255,0.05)" : "#F1F5F9",
                color: statusFilter === item.value ? "#FFFFFF" : themeConfig.textMain,
                "&:hover": {
                  bgcolor: statusFilter === item.value ? themeConfig.primary : isDarkMode ? "rgba(255,255,255,0.1)" : "#E2E8F0",
                },
              }}
            />
          ))}
        </Box>
      </Paper>

      {/* 4. Main Guest Directory Table */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: "18px",
          bgcolor: isDarkMode ? themeConfig.surface : "#FFFFFF",
          border: `1px solid ${themeConfig.border}`,
          overflow: "hidden",
        }}
      >
        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
            <CircularProgress size={36} sx={{ color: themeConfig.primary }} />
          </Box>
        ) : guests.length === 0 ? (
          <EmptyState
            icon={<People sx={{ fontSize: 48, color: themeConfig.textSecondary }} />}
            title="No Guest Records Found"
            description="No guest profiles matched your current search and filter parameters."
          />
        ) : (
          <>
            <TableContainer sx={{ width: "100%", overflowX: "hidden" }}>
              <Table size="small" sx={{ width: "100%", tableLayout: "fixed" }}>
                <TableHead sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary, py: 1.2, px: 1, width: "24%", whiteSpace: "nowrap" }}>Guest Name &amp; Contact</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary, py: 1.2, px: 1, width: "15%", whiteSpace: "nowrap" }}>Allocated Room</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary, py: 1.2, px: 1, width: "27%", whiteSpace: "nowrap" }}>Check-In / Out</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary, py: 1.2, px: 1, width: "14%", whiteSpace: "nowrap" }}>Stay Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary, py: 1.2, px: 1, width: "12%", whiteSpace: "nowrap" }}> Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textSecondary, py: 1.2, px: 1, width: "8%", whiteSpace: "nowrap" }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedGuests.map((g) => {
                    const guestName =
                      g.fullName ||
                      g.name ||
                      g.primary_guest_name ||
                      g.primaryGuestName ||
                      g.guestName ||
                      (typeof g.guest === "object" ? (g.guest?.fullName || g.guest?.name) : "") ||
                      "Guest";

                    const guestPhone =
                      g.phone ||
                      g.mobileNumber ||
                      g.mobile_number ||
                      g.guestPhone ||
                      (typeof g.guest === "object" ? (g.guest?.phone || g.guest?.mobileNumber || g.guest?.mobile_number) : "") ||
                      "N/A";

                    const roomNum =
                      g.roomAssigned ||
                      g.roomNumber ||
                      (Array.isArray(g.room_numbers) && g.room_numbers.length > 0
                        ? g.room_numbers.join(", ")
                        : Array.isArray(g.roomNumbers) && g.roomNumbers.length > 0
                          ? g.roomNumbers.join(", ")
                          : g.room_number ||
                          (g.room?.roomNumber ? String(g.room.roomNumber) : "") ||
                          (Array.isArray(g.rooms) && g.rooms.length > 0 && typeof g.rooms[0] === "object"
                            ? g.rooms.map((r) => r.roomNumber || r.room_number).join(", ")
                            : (g.room_id ? String(g.room_id) : "Not Assigned")));

                    const isOccupied = g.status === "IN-HOUSE" || g.status === "CHECKED_IN";

                    const rawCheckIn =
                      g.checkInDate ||
                      g.check_in_date ||
                      g.checkIn ||
                      g.check_in ||
                      g.arrivalDate ||
                      g.arrival_date ||
                      g.createdAt ||
                      g.created_at ||
                      (isOccupied ? new Date().toISOString() : null);

                    const formattedCheckIn = rawCheckIn ? formatDDMMYYYY(rawCheckIn) : (isOccupied ? formatDDMMYYYY(new Date()) : "N/A");

                    let rawCheckOut =
                      g.actualCheckOut ||
                      g.actual_check_out ||
                      g.checkOutDate ||
                      g.check_out_date ||
                      g.checkOut ||
                      g.check_out ||
                      g.departureDate ||
                      g.departure_date;

                    if (!rawCheckOut && rawCheckIn) {
                      const d = new Date(rawCheckIn);
                      if (!isNaN(d.getTime())) {
                        const nights = Math.max(1, Number(g.numberOfNights || g.nights || 1));
                        d.setDate(d.getDate() + nights);
                        rawCheckOut = d.toISOString();
                      }
                    } else if (!rawCheckOut && isOccupied) {
                      const d = new Date();
                      d.setDate(d.getDate() + Math.max(1, Number(g.numberOfNights || g.nights || 1)));
                      rawCheckOut = d.toISOString();
                    }

                    const formattedCheckOut = rawCheckOut ? formatDDMMYYYY(rawCheckOut) : (isOccupied ? formatDDMMYYYY(new Date(Date.now() + 86400000)) : "Scheduled");

                    const inTime = g.checkInTime || g.check_in_time || (rawCheckIn ? (() => {
                      const d = new Date(rawCheckIn);
                      if (!isNaN(d.getTime())) {
                        const h = String(d.getHours()).padStart(2, "0");
                        const m = String(d.getMinutes()).padStart(2, "0");
                        return `${h}:${m}`;
                      }
                      return "14:00";
                    })() : "14:00");

                    const outTime = g.checkOutTime || g.check_out_time || (rawCheckOut ? (() => {
                      const d = new Date(rawCheckOut);
                      if (!isNaN(d.getTime())) {
                        const h = String(d.getHours()).padStart(2, "0");
                        const m = String(d.getMinutes()).padStart(2, "0");
                        return `${h}:${m}`;
                      }
                      return "12:00";
                    })() : "12:00");

                    return (
                      <TableRow
                        key={g._id || g.id}
                        hover
                        onClick={() => handleRowClick(g)}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#F0FDFA" },
                        }}
                      >
                        <TableCell sx={{ py: 1, px: 1, width: "24%" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                            <Avatar
                              sx={{
                                width: 32,
                                height: 32,
                                bgcolor: isOccupied ? themeConfig.primary : "#94A3B8",
                                color: "#FFFFFF",
                                fontWeight: 800,
                                fontSize: "0.8rem",
                                flexShrink: 0,
                              }}
                            >
                              {guestName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.82rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {guestName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: themeConfig.textSecondary, display: "flex", alignItems: "center", gap: 0.4, fontSize: "0.72rem", whiteSpace: "nowrap" }}>
                                <Phone sx={{ fontSize: 11 }} /> {guestPhone}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell sx={{ py: 1, px: 1, width: "15%", whiteSpace: "nowrap" }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: isOccupied ? themeConfig.primary : themeConfig.textMain, fontSize: "0.82rem" }}>
                            Room #{roomNum}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textSecondary, fontSize: "0.72rem" }}>
                            Visits: {g.totalVisits || 1}
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ py: 1, px: 1, width: "27%", whiteSpace: "nowrap" }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.78rem", lineHeight: 1.3 }}>
                            📥 {formattedCheckIn} ({formatTime12Hour(inTime)})
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textSecondary, fontSize: "0.74rem", display: "block", lineHeight: 1.3, mt: 0.2 }}>
                            📤 {formattedCheckOut} ({formatTime12Hour(outTime)})
                          </Typography>
                        </TableCell>

                        <TableCell sx={{ py: 1, px: 1, width: "14%", whiteSpace: "nowrap" }}>
                          <StatusChip status={g.status || "REGISTERED"} size="small" />
                        </TableCell>

                        <TableCell sx={{ py: 1, px: 1, width: "12%", whiteSpace: "nowrap" }}>
                          <Chip
                            label={g.paymentStatus || "PENDING"}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.7rem",
                              height: 22,
                              bgcolor:
                                g.paymentStatus === "PAID"
                                  ? "#DCFCE7"
                                  : g.paymentStatus === "PARTIAL"
                                    ? "#FEF3C7"
                                    : "#FEE2E2",
                              color:
                                g.paymentStatus === "PAID"
                                  ? "#15803D"
                                  : g.paymentStatus === "PARTIAL"
                                    ? "#B45309"
                                    : "#DC2626",
                            }}
                          />
                        </TableCell>

                        <TableCell align="right" sx={{ py: 1, px: 1, width: "8%", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                            {g.phone && (
                              <Tooltip title="Send WhatsApp Notification">
                                <IconButton
                                  size="small"
                                  onClick={() => sendCheckInWhatsApp(g, hotelSettings)}
                                  sx={{ color: "#25D366", p: 0.5, "&:hover": { bgcolor: "#DCFCE7" } }}
                                >
                                  <WhatsApp sx={{ fontSize: 18 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={guests.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
            />
          </>
        )}
      </Paper>

      {/* Guest Details Modal */}
      {selectedGuestForModal.open && (
        <GuestDetailsModal
          open={selectedGuestForModal.open}
          guestId={selectedGuestForModal.guest?._id || selectedGuestForModal.guest?.id}
          guestData={selectedGuestForModal.guest}
          onClose={() => setSelectedGuestForModal({ open: false, guest: null })}
          hotelSettings={hotelSettings}
        />
      )}
    </Box>
  );
}
