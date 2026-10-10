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
import { downloadGuestDirectoryPDF, downloadGovtIdReportPDF } from "@/shared/utils/pdfGenerator";
import { sendCheckInWhatsApp, sendCheckoutBillWhatsApp } from "@/shared/utils/whatsappUtils";
import { apiRequest, API_ENDPOINTS } from "@/config/api";
import { toast } from "@/shared/utils/toast";

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

      if (res?.success && Array.isArray(res.data)) {
        setGuests(res.data);
      } else if (Array.isArray(res)) {
        setGuests(res);
      } else {
        setGuests([]);
      }
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
      guest: guest,
    });
  };

  const paginatedGuests = useMemo(() => {
    return guests.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [guests, page, rowsPerPage]);

  return (
    <Box sx={{ p: { xs: 2.5, md: 3.5 }, display: "flex", flexDirection: "column", gap: 3.5, pb: 6 }}>
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
            variant="contained"
            startIcon={<Download />}
            onClick={() => downloadGuestDirectoryPDF(guests, hotelSettings)}
            sx={{
              bgcolor: "#FFFFFF",
              color: "#0F766E",
              fontWeight: 800,
              borderRadius: "12px",
              px: 2.2,
              py: 1,
              textTransform: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              "&:hover": { bgcolor: "#F0FDFA" },
            }}
          >
            Export Register PDF
          </Button>
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
            <TableContainer>
              <Table sx={{ minWidth: 750 }}>
                <TableHead sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC" }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary }}>Guest Name &amp; Contact</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary }}>Allocated Room</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary }}>Check-In / Out</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary }}>Stay Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary }}>Payment Status</TableCell>
                    <TableCell sx={{ fontWeight: 800, color: themeConfig.textSecondary }}>Govt ID</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textSecondary }}>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedGuests.map((g) => {
                    const guestName = g.fullName || g.name || "Guest";
                    const roomNum = g.roomAssigned || g.roomNumber || "Not Assigned";
                    const isOccupied = g.status === "IN-HOUSE" || g.status === "CHECKED_IN";

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
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 38,
                                height: 38,
                                bgcolor: isOccupied ? themeConfig.primary : "#94A3B8",
                                color: "#FFFFFF",
                                fontWeight: 800,
                                fontSize: "0.9rem",
                              }}
                            >
                              {guestName.charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                {guestName}
                              </Typography>
                              <Typography variant="caption" sx={{ color: themeConfig.textSecondary, display: "flex", alignItems: "center", gap: 0.5 }}>
                                <Phone sx={{ fontSize: 13 }} /> {g.phone || g.mobileNumber || "N/A"}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: isOccupied ? themeConfig.primary : themeConfig.textMain }}>
                            Room #{roomNum}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textSecondary }}>
                            Visits: {g.totalVisits || 1}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.82rem" }}>
                            📥 {g.checkInDate || "N/A"} ({formatTime12Hour(g.checkInTime || "14:00")})
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textSecondary, fontSize: "0.78rem", display: "block" }}>
                            📤 {(() => {
                              if (g.actualCheckOut) {
                                const d = new Date(g.actualCheckOut);
                                if (!isNaN(d.getTime())) {
                                  return d.toLocaleDateString("en-IN");
                                }
                              }
                              return g.checkOutDate || "Scheduled";
                            })()} ({(() => {
                              if (g.actualCheckOut) {
                                const d = new Date(g.actualCheckOut);
                                if (!isNaN(d.getTime())) {
                                  const h = String(d.getHours()).padStart(2, "0");
                                  const m = String(d.getMinutes()).padStart(2, "0");
                                  return formatTime12Hour(`${h}:${m}`);
                                }
                              }
                              return formatTime12Hour(g.checkOutTime || "12:00");
                            })()})
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <StatusChip status={g.status || "REGISTERED"} />
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={g.paymentStatus || "PENDING"}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.72rem",
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

                        <TableCell>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, display: "block" }}>
                            {g.idType || g.govtIdType || "AADHAAR"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textSecondary, fontFamily: "monospace" }}>
                            {g.idNumber || g.govtIdNumber || "Verified"}
                          </Typography>
                        </TableCell>

                        <TableCell align="right" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.8 }}>
                            <Tooltip title="View Complete Stay Dossier &amp; Folio">
                              <IconButton
                                size="small"
                                onClick={() => handleRowClick(g)}
                                sx={{ color: themeConfig.primary, "&:hover": { bgcolor: themeConfig.champagne } }}
                              >
                                <Visibility fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            {g.phone && (
                              <Tooltip title="Send WhatsApp Notification">
                                <IconButton
                                  size="small"
                                  onClick={() => sendCheckInWhatsApp(g, hotelSettings)}
                                  sx={{ color: "#25D366", "&:hover": { bgcolor: "#DCFCE7" } }}
                                >
                                  <WhatsApp fontSize="small" />
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
          guestData={selectedGuestForModal.guest}
          onClose={() => setSelectedGuestForModal({ open: false, guest: null })}
          hotelSettings={hotelSettings}
        />
      )}
    </Box>
  );
}
