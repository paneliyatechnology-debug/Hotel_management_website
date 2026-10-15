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

  // KPI telemetry counts based on actual booking_status
  const stats = useMemo(() => {
    const total = guests.length;
    const inHouse = guests.filter((g) => {
      const s = (g.booking_status || g.status || "").toUpperCase();
      return s === "CHECKED_IN" || s === "IN-HOUSE";
    }).length;
    const departed = guests.filter((g) => {
      const s = (g.booking_status || g.status || "").toUpperCase();
      return s === "CHECKED_OUT" || s === "DEPARTED";
    }).length;
    return { total, inHouse, departed };
  }, [guests]);

  const handleRowClick = (guest) => {
    setSelectedGuestForModal({
      open: true,
      guest: createSafeGuestModalData(guest),
      guestId: guest._id || guest.id || guest.guestId || guest.bookingId,
    });
  };

  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const bStatus = (g.booking_status || g.status || "").toUpperCase();
      if (statusFilter !== "ALL") {
        if (statusFilter === "CHECKED_IN" && bStatus !== "CHECKED_IN" && bStatus !== "IN-HOUSE") return false;
        if (statusFilter === "CHECKED_OUT" && bStatus !== "CHECKED_OUT" && bStatus !== "DEPARTED") return false;
      }
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim();
        const name = (g.primary_guest_name || g.fullName || g.name || "").toLowerCase();
        const phone = (g.mobile_number || g.phone || g.mobileNumber || "").toLowerCase();
        const bNum = (g.booking_number || g.bookingNumber || "").toLowerCase();
        const rNum = (
          g.rooms?.[0]?.room_number ||
          (Array.isArray(g.rooms) ? g.rooms.map((r) => r.room_number || r.roomNumber).join(" ") : "") ||
          g.roomNumber ||
          g.roomAssigned ||
          ""
        ).toLowerCase();
        return name.includes(q) || phone.includes(q) || bNum.includes(q) || rNum.includes(q);
      }
      return true;
    });
  }, [guests, statusFilter, debouncedSearch]);

  const paginatedGuests = useMemo(() => {
    return filteredGuests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [filteredGuests, page, rowsPerPage]);

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
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
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
            Total Bookings
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 900, color: themeConfig.primary }}>
            {stats.total}
          </Typography>

          <Typography variant="caption" sx={{ color: themeConfig.textSecondary, fontWeight: 600 }}>
            All booking records logged
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
            Checked-In Guests
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 900, color: "#10B981" }}>
            {stats.inHouse}
          </Typography>

          <Typography variant="caption" sx={{ color: themeConfig.textSecondary, fontWeight: 600 }}>
            Currently in-house guests
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
            Checked-Out Guests
          </Typography>

          <Typography variant="h4" sx={{ fontWeight: 900, color: "#F59E0B" }}>
            {stats.departed}
          </Typography>

          <Typography variant="caption" sx={{ color: themeConfig.textSecondary, fontWeight: 600 }}>
            Past stays checked out
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
          placeholder="Search by guest name, mobile, booking #, or room..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          size="small"
          sx={{ width: { xs: "100%", sm: 340 } }}
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
            { label: "All Bookings", value: "ALL" },
            { label: "Checked-In", value: "CHECKED_IN" },
            { label: "Checked-Out", value: "CHECKED_OUT" },
          ].map((item) => (
            <Chip
              key={item.value}
              label={item.label}
              onClick={() => {
                setStatusFilter(item.value);
                setPage(0);
              }}
              sx={{
                fontWeight: 800,
                fontSize: "0.8rem",
                borderRadius: "10px",
                px: 1.2,
                py: 0.5,
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
        ) : filteredGuests.length === 0 ? (
          <EmptyState
            icon={<People sx={{ fontSize: 48, color: themeConfig.textSecondary }} />}
            title="No Bookings Found"
            description="No guest records matched your current search and filter parameters."
          />
        ) : (
          <>
            <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
              <Table size="small" sx={{ width: "100%", minWidth: 700, tableLayout: "fixed" }}>
                <TableHead sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary, py: 1.4, px: 2, width: "22%", whiteSpace: "nowrap" }}>
                      Booking Ref
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary, py: 1.4, px: 2, width: "32%", whiteSpace: "nowrap" }}>
                      Primary Guest &amp; Mobile
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary, py: 1.4, px: 2, width: "26%", whiteSpace: "nowrap" }}>
                      Allocated Room
                    </TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary, py: 1.4, px: 2, width: "12%", whiteSpace: "nowrap" }}>
                      Booking Status
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textSecondary, py: 1.4, px: 2, width: "8%", whiteSpace: "nowrap" }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedGuests.map((g) => {
                    const guestName =
                      g.primary_guest_name ||
                      g.fullName ||
                      g.name ||
                      g.guestName ||
                      "Guest";

                    const guestPhone =
                      g.mobile_number ||
                      g.phone ||
                      g.mobileNumber ||
                      g.guestPhone ||
                      "N/A";

                    const bookingNum =
                      g.booking_number ||
                      g.bookingNumber ||
                      `BK-${g.id}`;

                    const firstRoom = Array.isArray(g.rooms) && g.rooms.length > 0 ? g.rooms[0] : null;
                    const roomNum =
                      firstRoom?.room_number ||
                      firstRoom?.roomNumber ||
                      g.room_number ||
                      g.roomNumber ||
                      g.roomAssigned ||
                      "N/A";

                    const roomType =
                      firstRoom?.room_type_name ||
                      firstRoom?.roomType ||
                      g.room_type_name ||
                      g.roomType ||
                      "";

                    const floor =
                      firstRoom?.floor !== undefined && firstRoom?.floor !== null
                        ? firstRoom.floor
                        : (parseInt(roomNum, 10) >= 100 ? Math.floor(parseInt(roomNum, 10) / 100) : null);

                    const status = (g.booking_status || g.status || "CHECKED_IN").toUpperCase();

                    return (
                      <TableRow
                        key={g._id || g.id || bookingNum}
                        hover
                        onClick={() => handleRowClick(g)}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#F0FDFA" },
                        }}
                      >
                        {/* 1. Booking Reference */}
                        <TableCell sx={{ py: 1.4, px: 2, width: "22%" }}>
                          <Typography
                            variant="body2"
                            sx={{
                              fontWeight: 800,
                              color: themeConfig.primary,
                              fontFamily: "monospace",
                              fontSize: "0.85rem",
                              letterSpacing: "0.3px",
                            }}
                          >
                            {bookingNum}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textSecondary, fontSize: "0.72rem" }}>
                            ID #{g.id}
                          </Typography>
                        </TableCell>

                        {/* 2. Primary Guest & Contact */}
                        <TableCell sx={{ py: 1.4, px: 2, width: "32%" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <Avatar
                              sx={{
                                width: 34,
                                height: 34,
                                bgcolor: status === "CHECKED_IN" ? themeConfig.primary : "#64748B",
                                color: "#FFFFFF",
                                fontWeight: 800,
                                fontSize: "0.82rem",
                                flexShrink: 0,
                              }}
                            >
                              {guestName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ minWidth: 0, overflow: "hidden" }}>
                              <Typography
                                variant="body2"
                                sx={{
                                  fontWeight: 800,
                                  color: themeConfig.textMain,
                                  fontSize: "0.86rem",
                                  whiteSpace: "nowrap",
                                  overflow: "hidden",
                                  textOverflow: "ellipsis",
                                }}
                              >
                                {guestName}
                              </Typography>
                              <Typography
                                variant="caption"
                                sx={{
                                  color: themeConfig.textSecondary,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 0.5,
                                  fontSize: "0.74rem",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                <Phone sx={{ fontSize: 12, color: themeConfig.primary }} /> {guestPhone}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        {/* 3. Allocated Room */}
                        <TableCell sx={{ py: 1.4, px: 2, width: "26%" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.86rem" }}>
                              Room #{roomNum}
                            </Typography>
                            {floor !== null && (
                              <Chip
                                label={`Floor ${floor}`}
                                size="small"
                                sx={{
                                  bgcolor: themeConfig.champagne,
                                  color: themeConfig.primaryDark,
                                  fontWeight: 800,
                                  fontSize: "0.68rem",
                                  height: 20,
                                }}
                              />
                            )}
                          </Box>
                          {roomType && (
                            <Typography variant="caption" sx={{ color: themeConfig.textSecondary, fontSize: "0.74rem", display: "block", mt: 0.2 }}>
                              {roomType}
                            </Typography>
                          )}
                        </TableCell>

                        {/* 4. Booking Status */}
                        <TableCell sx={{ py: 1.4, px: 2, width: "12%" }}>
                          <StatusChip status={status} size="small" />
                        </TableCell>

                        {/* 5. Action */}
                        <TableCell align="right" sx={{ py: 1.4, px: 2, width: "8%" }} onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.5 }}>
                            <Tooltip title="View Complete Folio">
                              <IconButton
                                size="small"
                                onClick={() => handleRowClick(g)}
                                sx={{
                                  color: themeConfig.primary,
                                  bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F0FDFA",
                                  border: `1px solid ${themeConfig.border}`,
                                  "&:hover": { bgcolor: themeConfig.champagne },
                                }}
                              >
                                <Visibility sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            {guestPhone && guestPhone !== "N/A" && (
                              <Tooltip title="Send WhatsApp Notification">
                                <IconButton
                                  size="small"
                                  onClick={() => sendCheckInWhatsApp(g, hotelSettings)}
                                  sx={{ color: "#25D366", p: 0.5, "&:hover": { bgcolor: "#DCFCE7" } }}
                                >
                                  <WhatsApp sx={{ fontSize: 17 }} />
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
              count={filteredGuests.length}
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
