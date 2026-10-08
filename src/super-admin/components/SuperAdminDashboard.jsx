"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
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
  CircularProgress,
  Alert,
  TablePagination,
} from "@mui/material";
import {
  Search,
  Visibility,
  Phone,
  Close,
  Hotel as HotelIcon,
  People,
  CheckCircle,
  CurrencyRupee,
  CalendarMonth,
  Stars,
  TrendingUp,
  AccountBalance,
  Warning,
  Block,
  MeetingRoom,
  BookmarkBorder,
  Schedule,
  Payments,
  Refresh,
} from "@/shared/icons";
import dynamic from "next/dynamic";
import { useAppTheme } from "@/shared/context/ThemeContext";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import StatCard from "@/shared/components/StatCard";
import { API_ENDPOINTS, apiRequest } from "@/config/api";

const SettingsView = dynamic(() => import("@/shared/components/SettingsView"), {
  loading: () => (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
      <CircularProgress size={36} />
    </Box>
  ),
});

export default function SuperAdminDashboard({ user, activeNav = 0, onTabChange }) {
  const { themeConfig, isDarkMode } = useAppTheme();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [hotels, setHotels] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Selected Hotel Details Modal
  const [selectedHotelModal, setSelectedHotelModal] = useState({
    open: false,
    hotel: null,
    loading: false,
    details: null,
  });

  // Action status loading
  const [actionLoading, setActionLoading] = useState(false);
  const [actionMsg, setActionMsg] = useState("");

  const fetchDashboardMetrics = async () => {
    if (!user || user.role !== "SUPER_ADMIN") return;
    try {
      setLoading(true);
      const res = await apiRequest(API_ENDPOINTS.SUPER_ADMIN.DASHBOARD);
      if (res?.success) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.warn("Failed to load super admin dashboard metrics:", err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchHotels = async () => {
    if (!user || user.role !== "SUPER_ADMIN") return;
    try {
      const res = await apiRequest(API_ENDPOINTS.SUPER_ADMIN.HOTELS);
      if (res?.success) {
        setHotels(res.data || []);
      }
    } catch (err) {
      console.warn("Failed to load hotels:", err.message);
    }
  };

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      fetchDashboardMetrics();
      fetchHotels();
    }
  }, [user]);

  const handleOpenHotelDetails = async (hotel) => {
    setSelectedHotelModal({
      open: true,
      hotel,
      loading: true,
      details: null,
    });
    try {
      const res = await apiRequest(API_ENDPOINTS.SUPER_ADMIN.UPDATE_HOTEL(hotel._id || hotel.id));
      if (res?.success) {
        setSelectedHotelModal((prev) => ({
          ...prev,
          loading: false,
          details: res.data,
        }));
      } else {
        setSelectedHotelModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (err) {
      console.error("Failed to load hotel detail:", err);
      setSelectedHotelModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const handleHotelStatusUpdate = async (hotelId, newStatus) => {
    try {
      setActionLoading(true);
      const res = await apiRequest(API_ENDPOINTS.SUPER_ADMIN.UPDATE_STATUS(hotelId), {
        method: "PUT",
        body: { status: newStatus },
      });
      if (res?.success) {
        setActionMsg(`Hotel status updated to ${newStatus} successfully.`);
        fetchDashboardMetrics();
        fetchHotels();
        if (selectedHotelModal.hotel?._id === hotelId) {
          handleOpenHotelDetails({ ...selectedHotelModal.hotel, status: newStatus });
        }
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveHotel = async (hotelId) => {
    try {
      setActionLoading(true);
      const res = await apiRequest(API_ENDPOINTS.SUPER_ADMIN.APPROVE_HOTEL(hotelId), {
        method: "PUT",
      });
      if (res?.success) {
        setActionMsg("Hotel approved and credentials generated successfully.");
        fetchDashboardMetrics();
        fetchHotels();
        setSelectedHotelModal((prev) => ({ ...prev, open: false }));
      }
    } catch (err) {
      console.error("Approval error:", err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filtered hotels
  const filteredHotels = useMemo(() => {
    return hotels.filter((h) => {
      if (statusFilter !== "ALL" && h.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = (h.name || "").toLowerCase().includes(q);
        const matchOwner = (h.ownerName || "").toLowerCase().includes(q);
        const matchEmail = (h.ownerEmail || "").toLowerCase().includes(q);
        const matchCity = (h.city || "").toLowerCase().includes(q);
        const matchCode = (h.hotelCode || "").toLowerCase().includes(q);
        return matchName || matchOwner || matchEmail || matchCity || matchCode;
      }
      return true;
    });
  }, [hotels, statusFilter, searchQuery]);

  if (activeNav === 3) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 } }}>
        <SettingsView user={user} />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      {/* 1. HERO COMMAND RIBBON */}
      <Box
        sx={{
          mb: 3.5,
          p: { xs: 2.5, sm: 3 },
          borderRadius: "24px",
          background: `linear-gradient(135deg, #3B0764 0%, #7E22CE 60%, #9333EA 100%)`,
          color: "#FFFFFF",
          boxShadow: "0 16px 36px -10px rgba(126, 34, 206, 0.4), inset 0 1px 1px rgba(255,255,255,0.4)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Box>
            <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1, px: 1.4, py: 0.5, borderRadius: "20px", bgcolor: "rgba(255,255,255,0.15)", mb: 1 }}>
              <Stars sx={{ fontSize: 16 }} />
              <Typography variant="caption" sx={{ fontWeight: 800, letterSpacing: 0.5, textTransform: "uppercase" }}>
                Super Admin Enterprise Command Center
              </Typography>
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: -0.5, fontSize: { xs: "1.4rem", sm: "1.8rem" } }}>
              Global Hotel &amp; Revenue Overview
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, fontSize: "0.85rem" }}>
              Multi-property performance metrics, subscription health, booking velocity, and platform financial ledger.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={() => {
                fetchDashboardMetrics();
                fetchHotels();
              }}
              sx={{
                bgcolor: "rgba(255,255,255,0.2)",
                color: "#FFFFFF",
                fontWeight: 800,
                borderRadius: "14px",
                px: 2.2,
                backdropFilter: "blur(10px)",
                "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
              }}
            >
              Sync Analytics
            </Button>
          </Box>
        </Box>
      </Box>

      {actionMsg && (
        <Alert severity="success" sx={{ mb: 3, borderRadius: "14px" }} onClose={() => setActionMsg("")}>
          {actionMsg}
        </Alert>
      )}

      {/* 2. TOP SUMMARY METRICS CARDS (11 REQUESTED KPIS) */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMuted, mb: 1.5, textTransform: "uppercase", letterSpacing: 0.8 }}>
          Business KPI Summary
        </Typography>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, 1fr)",
              md: "repeat(3, 1fr)",
              lg: "repeat(4, 1fr)",
              xl: "repeat(6, 1fr)",
            },
            gap: 2,
          }}
        >
          {/* 1. Total Hotels */}
          <StatCard
            title="Total Hotels"
            value={dashboardData?.totalHotels ?? hotels.length}
            icon={<HotelIcon />}
            color="#7E22CE"
            subtitle={`${dashboardData?.pendingHotels || 0} pending approval`}
          />

          {/* 2. Active Hotels */}
          <StatCard
            title="Active Hotels"
            value={dashboardData?.activeHotels ?? hotels.filter((h) => h.status === "ACTIVE").length}
            icon={<CheckCircle />}
            color="#10B981"
            subtitle="Verified live properties"
          />

          {/* 3. Total Guests */}
          <StatCard
            title="Total Guests"
            value={dashboardData?.totalGuests ?? 0}
            icon={<People />}
            color="#0B8EE0"
            subtitle="Platform-wide registered"
          />

          {/* 4. Total Bookings */}
          <StatCard
            title="Total Bookings"
            value={dashboardData?.totalBookings ?? 0}
            icon={<BookmarkBorder />}
            color="#6366F1"
            subtitle="All bookings recorded"
          />

          {/* 5. Today's Check-ins */}
          <StatCard
            title="Today's Check-ins"
            value={dashboardData?.todayCheckIns ?? 0}
            icon={<MeetingRoom />}
            color="#059669"
            subtitle="Arrivals scheduled today"
          />

          {/* 6. Today's Check-outs */}
          <StatCard
            title="Today's Check-outs"
            value={dashboardData?.todayCheckOuts ?? 0}
            icon={<Schedule />}
            color="#EA580C"
            subtitle="Departures scheduled today"
          />

          {/* 7. Total Revenue */}
          <StatCard
            title="Total Revenue"
            value={`₹${(dashboardData?.totalRevenue || 0).toLocaleString("en-IN")}`}
            icon={<CurrencyRupee />}
            color="#0D9488"
            subtitle="Lifetime settled payments"
          />

          {/* 8. Weekly Revenue */}
          <StatCard
            title="Weekly Revenue"
            value={`₹${(dashboardData?.weeklyRevenue || 0).toLocaleString("en-IN")}`}
            icon={<TrendingUp />}
            color="#2563EB"
            subtitle="Mon – Sun collections"
          />

          {/* 9. Monthly Revenue */}
          <StatCard
            title="Monthly Revenue"
            value={`₹${(dashboardData?.monthlyRevenue || 0).toLocaleString("en-IN")}`}
            icon={<CalendarMonth />}
            color="#8B5CF6"
            subtitle="Current calendar month"
          />

          {/* 10. Pending Payments */}
          <StatCard
            title="Pending Payments"
            value={`₹${(dashboardData?.pendingPayments || 0).toLocaleString("en-IN")}`}
            icon={<Warning />}
            color="#EF4444"
            subtitle="Unsettled guest folio dues"
          />

          {/* 11. Active Subscriptions */}
          <StatCard
            title="Active Subscriptions"
            value={dashboardData?.activeSubscriptions ?? 0}
            icon={<Stars />}
            color="#D97706"
            subtitle={`${dashboardData?.trialHotels || 0} hotels in trial`}
          />
        </Box>
      </Box>

      {/* 3. HOTELS MANAGEMENT DIRECTORY */}
      <Paper
        elevation={0}
        className="card-3d"
        sx={{
          borderRadius: "20px",
          border: `1px solid ${themeConfig.border}`,
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5, display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
              Registered Properties &amp; Hotels
            </Typography>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
              Select any hotel to inspect complete operational stats, room counts, owner profile, and subscription health.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="Search hotel, owner, city..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              sx={{ width: { xs: "100%", sm: 260 }, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: themeConfig.primary, fontSize: 18 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              select
              size="small"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(0);
              }}
              sx={{ width: { xs: "100%", sm: 160 }, "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
            >
              <MenuItem value="ALL">All Statuses</MenuItem>
              <MenuItem value="ACTIVE">Active</MenuItem>
              <MenuItem value="PENDING_APPROVAL">Pending Approval</MenuItem>
              <MenuItem value="SUSPENDED">Suspended</MenuItem>
              <MenuItem value="DISABLED">Disabled</MenuItem>
              <MenuItem value="EXPIRED">Expired</MenuItem>
            </TextField>
          </Box>
        </Box>

        <TableContainer>
          <Table sx={{ minWidth: 800 }}>
            <TableHead sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : themeConfig.champagne }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>HOTEL PROPERTY</TableCell>
                <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>LOCATION</TableCell>
                <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>OWNER CONTACT</TableCell>
                <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>SUBSCRIPTION</TableCell>
                <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain }}>ACTION</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredHotels.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} sx={{ py: 6, textAlign: "center" }}>
                    <EmptyState
                      title="No Hotels Found"
                      description="No matching hotel properties found for the current search/filters."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredHotels
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((hotel) => (
                    <TableRow
                      key={hotel._id || hotel.id}
                      hover
                      onClick={() => handleOpenHotelDetails(hotel)}
                      sx={{
                        cursor: "pointer",
                        "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(126, 34, 206, 0.04)" },
                        transition: "background 0.15s ease",
                      }}
                    >
                      <TableCell sx={{ py: 2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 42,
                              height: 42,
                              borderRadius: "12px",
                              bgcolor: isDarkMode ? "rgba(126, 34, 206, 0.2)" : "rgba(126, 34, 206, 0.1)",
                              color: "#7E22CE",
                              fontWeight: 900,
                            }}
                          >
                            {(hotel.name || "H").charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                              {hotel.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                              Code: {hotel.hotelCode || hotel._id?.slice(-6) || "N/A"}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                          {hotel.city || "Not Specified"}, {hotel.state || ""}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                          {hotel.address || "Address on file"}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                          {hotel.ownerName || "Owner"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                          {hotel.ownerPhone || hotel.phone || hotel.ownerEmail}
                        </Typography>
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        <Chip
                          label={hotel.subscription?.plan || "TRIAL"}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            borderRadius: "8px",
                            bgcolor: hotel.subscription?.status === "ACTIVE" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: hotel.subscription?.status === "ACTIVE" ? "#10B981" : "#F59E0B",
                            border: "1px solid",
                            borderColor: hotel.subscription?.status === "ACTIVE" ? "rgba(16, 185, 129, 0.3)" : "rgba(245, 158, 11, 0.3)",
                          }}
                        />
                      </TableCell>

                      <TableCell sx={{ py: 2 }}>
                        <StatusChip status={hotel.status || "ACTIVE"} size="small" />
                      </TableCell>

                      <TableCell align="right" sx={{ py: 2 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<Visibility />}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenHotelDetails(hotel);
                          }}
                          sx={{
                            borderRadius: "10px",
                            fontWeight: 800,
                            color: "#7E22CE",
                            borderColor: "rgba(126, 34, 206, 0.3)",
                            "&:hover": { bgcolor: "rgba(126, 34, 206, 0.1)", borderColor: "#7E22CE" },
                          }}
                        >
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredHotels.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredHotels.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{ borderTop: `1px solid ${themeConfig.border}` }}
          />
        )}
      </Paper>

      {/* 4. HOTEL DETAILED INFORMATION MODAL */}
      <Dialog
        open={Boolean(selectedHotelModal.open)}
        onClose={() => setSelectedHotelModal({ open: false, hotel: null, loading: false, details: null })}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "24px",
              p: 0,
              border: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              overflow: "hidden",
            },
          },
        }}
      >
        {selectedHotelModal.hotel && (
          <Box>
            {/* Modal Header */}
            <Box
              sx={{
                p: { xs: 2, sm: 3 },
                background: "linear-gradient(135deg, #3B0764 0%, #7E22CE 100%)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 1.5,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                <Avatar
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "14px",
                    bgcolor: "rgba(255,255,255,0.2)",
                    color: "#FFFFFF",
                    fontWeight: 900,
                    fontSize: "1.3rem",
                  }}
                >
                  {(selectedHotelModal.hotel.name || "H").charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2 }}>
                    {selectedHotelModal.hotel.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>
                    Hotel Code: {selectedHotelModal.hotel.hotelCode || selectedHotelModal.hotel._id?.slice(-6)} &bull; Joined: {new Date(selectedHotelModal.hotel.createdAt || Date.now()).toLocaleDateString("en-IN")}
                  </Typography>
                </Box>
              </Box>
              <IconButton
                onClick={() => setSelectedHotelModal({ open: false, hotel: null, loading: false, details: null })}
                sx={{ color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}
              >
                <Close fontSize="small" />
              </IconButton>
            </Box>

            {/* Modal Body */}
            <Box sx={{ p: { xs: 1.5, sm: 3 } }}>
              {selectedHotelModal.loading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
                  <CircularProgress sx={{ color: "#7E22CE" }} />
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {/* Stats Ribbon */}
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                      gap: 2,
                    }}
                  >
                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: "16px",
                        bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : themeConfig.champagne,
                        border: `1px solid ${themeConfig.border}`,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Total Rooms</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.primaryDark }}>
                        {selectedHotelModal.details?.stats?.totalRooms ?? "—"}
                      </Typography>
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: "16px",
                        bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : themeConfig.champagne,
                        border: `1px solid ${themeConfig.border}`,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Total Bookings</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.primaryDark }}>
                        {selectedHotelModal.details?.stats?.totalBookings ?? "—"}
                      </Typography>
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: "16px",
                        bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : themeConfig.champagne,
                        border: `1px solid ${themeConfig.border}`,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Total Guests</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.primaryDark }}>
                        {selectedHotelModal.details?.stats?.totalGuests ?? "—"}
                      </Typography>
                    </Paper>

                    <Paper
                      elevation={0}
                      sx={{
                        p: 2,
                        borderRadius: "16px",
                        bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : themeConfig.champagne,
                        border: `1px solid ${themeConfig.border}`,
                      }}
                    >
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Lifetime Revenue</Typography>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: "#10B981" }}>
                        ₹{(selectedHotelModal.details?.stats?.totalRevenue || 0).toLocaleString("en-IN")}
                      </Typography>
                    </Paper>
                  </Box>

                  {/* Information Cards Grid */}
                  <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 2.5 }}>
                    {/* Hotel & Owner Profile */}
                    <Card elevation={0} sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: "18px", border: `1px solid ${themeConfig.border}` }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 1.5, display: "flex", alignItems: "center", gap: 0.8 }}>
                        <HotelIcon fontSize="small" sx={{ color: "#7E22CE" }} /> Property &amp; Owner Profile
                      </Typography>
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, fontSize: "0.85rem" }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Owner Name:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>{selectedHotelModal.hotel.ownerName || "N/A"}</Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Owner Phone:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>{selectedHotelModal.hotel.ownerPhone || selectedHotelModal.hotel.phone || "N/A"}</Typography>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Email Address:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700, wordBreak: "break-word" }}>{selectedHotelModal.hotel.ownerEmail || selectedHotelModal.hotel.email || "N/A"}</Typography>
                        </Box>
                        <Box sx={{ gridColumn: { xs: "span 1", sm: "span 2" } }}>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Physical Address:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>{selectedHotelModal.hotel.address || "N/A"}, {selectedHotelModal.hotel.city || ""}, {selectedHotelModal.hotel.state || ""}</Typography>
                        </Box>
                      </Box>
                    </Card>

                    {/* Subscription & Account Status */}
                    <Card elevation={0} sx={{ p: { xs: 1.5, sm: 2.5 }, borderRadius: "18px", border: `1px solid ${themeConfig.border}` }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 1.5, display: "flex", alignItems: "center", gap: 0.8 }}>
                        <Stars fontSize="small" sx={{ color: "#D97706" }} /> Subscription &amp; Governance
                      </Typography>
                      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 1.5, fontSize: "0.85rem" }}>
                        <Box>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Hotel Status:</Typography>
                          <Box sx={{ mt: 0.3 }}><StatusChip status={selectedHotelModal.hotel.status || "ACTIVE"} size="small" /></Box>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Plan Name:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary }}>
                            {selectedHotelModal.hotel.subscription?.plan || "TRIAL"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Trial End Date:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {selectedHotelModal.hotel.subscription?.trialEndDate
                              ? new Date(selectedHotelModal.hotel.subscription.trialEndDate).toLocaleDateString("en-IN")
                              : "N/A"}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Staff Count:</Typography>
                          <Typography variant="body2" sx={{ fontWeight: 800 }}>
                            {selectedHotelModal.details?.staff?.length ?? "—"} Members
                          </Typography>
                        </Box>
                      </Box>
                    </Card>
                  </Box>

                  {/* Quick Administration Actions */}
                  <Card elevation={0} sx={{ p: 2, borderRadius: "18px", bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(126, 34, 206, 0.04)", border: `1px solid ${themeConfig.border}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", display: "block", mb: 1.5 }}>
                      Administrative Override Actions
                    </Typography>
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
                      {selectedHotelModal.hotel.status === "PENDING_APPROVAL" && (
                        <Button
                          variant="contained"
                          color="success"
                          disabled={actionLoading}
                          onClick={() => handleApproveHotel(selectedHotelModal.hotel._id)}
                          sx={{ borderRadius: "10px", fontWeight: 800 }}
                        >
                          Approve Hotel &amp; Grant Access
                        </Button>
                      )}

                      {selectedHotelModal.hotel.status !== "ACTIVE" && selectedHotelModal.hotel.status !== "PENDING_APPROVAL" && (
                        <Button
                          variant="contained"
                          color="success"
                          disabled={actionLoading}
                          onClick={() => handleHotelStatusUpdate(selectedHotelModal.hotel._id, "ACTIVE")}
                          sx={{ borderRadius: "10px", fontWeight: 800 }}
                        >
                          Re-Activate Hotel
                        </Button>
                      )}

                      {selectedHotelModal.hotel.status === "ACTIVE" && (
                        <>
                          <Button
                            variant="outlined"
                            color="warning"
                            disabled={actionLoading}
                            onClick={() => handleHotelStatusUpdate(selectedHotelModal.hotel._id, "SUSPENDED")}
                            sx={{ borderRadius: "10px", fontWeight: 800 }}
                          >
                            Suspend Hotel
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            disabled={actionLoading}
                            onClick={() => handleHotelStatusUpdate(selectedHotelModal.hotel._id, "DISABLED")}
                            sx={{ borderRadius: "10px", fontWeight: 800 }}
                          >
                            Disable Hotel
                          </Button>
                        </>
                      )}
                    </Box>
                  </Card>
                </Box>
              )}
            </Box>

            <DialogActions sx={{ p: 2.5, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : themeConfig.champagne }}>
              <Button
                onClick={() => setSelectedHotelModal({ open: false, hotel: null, loading: false, details: null })}
                variant="contained"
                sx={{
                  borderRadius: "12px",
                  fontWeight: 800,
                  bgcolor: "#7E22CE",
                  "&:hover": { bgcolor: "#6B21A8" },
                  px: 3,
                }}
              >
                Close Inspector
              </Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
