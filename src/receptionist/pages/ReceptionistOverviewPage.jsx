"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Paper,
  Button,
  Chip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  TablePagination,
} from "@mui/material";
import {
  HowToReg,
  CleaningServices,
  Build,
  Badge,
  Refresh,
  CheckCircle,
  ArrowForward,
  People,
  Schedule,
  AccessTime,
  Security,
  Bolt,
  MeetingRoom,
  KingBed,
  Apartment,
  Hotel,
  Bed,
  Favorite,
  FamilyRestroom,
  Diamond,
  Villa,
  SingleBed,
  Work,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import StatCard from "@/shared/components/StatCard";
import { formatTime12Hour, getTurnaroundWindow } from "@/shared/utils/timeUtils";

export default function ReceptionistOverviewPage({
  user,
  rooms = [],
  roomTypes = [],
  guests = [],
  bookings = [],
  dashboardData,
  hotelSettings = { checkInTime: "14:00", checkOutTime: "12:00", timezone: "Asia/Kolkata" },
  onRefresh,
  onNavigateTab,
  onSelectRoomForCheckIn,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();

  // Pagination for Recent Check-Ins Table
  const [guestPage, setGuestPage] = useState(0);
  const [guestRowsPerPage, setGuestRowsPerPage] = useState(5);

  // Overall Global Counts
  const totalOccupied = rooms.filter((r) => r.status === "OCCUPIED").length;
  const totalAvailable = rooms.filter((r) => r.status === "AVAILABLE").length;
  const totalCleaning = rooms.filter((r) => r.status === "CLEANING").length;
  const totalMaintenance = rooms.filter((r) => r.status === "MAINTENANCE" || r.status === "BLOCKED").length;
  const inHouseGuestsCount = guests.filter((g) => g.status === "IN-HOUSE" || g.status === "CONFIRMED").length || bookings.length;

  // Dynamic Category Icon helper
  const getCategoryIcon = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("coupl") || n.includes("copol") || n.includes("honey") || n.includes("romant") || n.includes("love"))
      return <Favorite sx={{ fontSize: 22, color: "#E11D48" }} />;
    if (n.includes("fam") || n.includes("group") || n.includes("quad"))
      return <FamilyRestroom sx={{ fontSize: 22, color: "#059669" }} />;
    if (n.includes("villa") || n.includes("cottage") || n.includes("penthouse") || n.includes("resort") || n.includes("bungalow"))
      return <Villa sx={{ fontSize: 22, color: "#0891B2" }} />;
    if (n.includes("deluxe") || n.includes("super") || n.includes("luxury") || n.includes("suite") || n.includes("vip") || n.includes("presid"))
      return <Diamond sx={{ fontSize: 22, color: "#D97706" }} />;
    if (n.includes("single") || n.includes("solo"))
      return <SingleBed sx={{ fontSize: 22, color: "#6366F1" }} />;
    if (n.includes("business") || n.includes("exec") || n.includes("corporate"))
      return <Work sx={{ fontSize: 22, color: "#2563EB" }} />;
    if (n.includes("king") || n.includes("double") || n.includes("queen"))
      return <KingBed sx={{ fontSize: 22, color: "#10B981" }} />;
    return <Hotel sx={{ fontSize: 22 }} />;
  };

  // Grouped Categories with Live Counts
  const categoryStats = useMemo(() => {
    const catMap = new Map();

    roomTypes.forEach((rt) => {
      catMap.set(rt._id, {
        _id: rt._id,
        name: rt.name,
        description: rt.description || "",
        basePrice: rt.basePrice || 0,
        bedCount: rt.bedCount || 1,
        bedType: rt.bedType || "1 King Bed",
        capacity: rt.capacity || { adults: 2, children: 1 },
        amenities: rt.amenities || [],
        totalRooms: 0,
        available: 0,
        occupied: 0,
        cleaning: 0,
        maintenance: 0,
        reserved: 0,
        rooms: [],
      });
    });

    rooms.forEach((r) => {
      const rtObj = typeof r.roomType === "object" ? r.roomType : null;
      const rtId = rtObj?._id || r.roomType || "UNCATEGORIZED";
      const rtName = rtObj?.name || r.type || "Standard Room";

      if (!catMap.has(rtId)) {
        catMap.set(rtId, {
          _id: rtId,
          name: rtName,
          description: "",
          basePrice: r.customPricePerNight || rtObj?.basePrice || r.basePrice || 0,
          bedCount: r.bedCount || 1,
          bedType: r.bedType || "1 King Bed",
          capacity: { adults: r.seatingCapacity || 2, children: 1 },
          amenities: r.amenities || [],
          totalRooms: 0,
          available: 0,
          occupied: 0,
          cleaning: 0,
          maintenance: 0,
          reserved: 0,
          rooms: [],
        });
      }

      const item = catMap.get(rtId);
      item.totalRooms += 1;
      item.rooms.push(r);

      const effectiveRoomPrice = r.customPricePerNight || rtObj?.basePrice || r.basePrice || 0;
      if (effectiveRoomPrice > 0 && (!item.basePrice || r.customPricePerNight)) {
        item.basePrice = effectiveRoomPrice;
      }

      if (r.status === "AVAILABLE") item.available += 1;
      else if (r.status === "OCCUPIED") item.occupied += 1;
      else if (r.status === "CLEANING") item.cleaning += 1;
      else if (r.status === "RESERVED") item.reserved += 1;
      else if (r.status === "MAINTENANCE" || r.status === "BLOCKED") item.maintenance += 1;
    });

    catMap.forEach((cat) => {
      cat.rooms.sort((a, b) => {
        const numA = parseInt(a.roomNumber, 10) || 0;
        const numB = parseInt(b.roomNumber, 10) || 0;
        return numA - numB;
      });
    });

    return Array.from(catMap.values());
  }, [rooms, roomTypes]);

  const inTimeFormatted = formatTime12Hour(hotelSettings?.checkInTime || "14:00");
  const outTimeFormatted = formatTime12Hour(hotelSettings?.checkOutTime || "12:00");
  const timezoneStr = hotelSettings?.timezone || "Asia/Kolkata";
  const turnaroundStr = getTurnaroundWindow(hotelSettings?.checkInTime, hotelSettings?.checkOutTime);

  // Active bookings for recent table
  const activeRecentBookings = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];
    return bookings.map((b) => {
      const g = typeof b.guest === "object" ? b.guest : {};
      const roomsList = Array.isArray(b.roomNumbers) && b.roomNumbers.length > 0
        ? b.roomNumbers.map(String)
        : Array.isArray(b.rooms) && b.rooms.length > 0 && typeof b.rooms[0] === "object" && b.rooms[0]?.roomNumber
        ? b.rooms.map((r) => String(r.roomNumber))
        : b.roomNumber
        ? String(b.roomNumber).split(",").map((s) => s.trim()).filter(Boolean)
        : [b.room?.roomNumber || "101"];

      return {
        _id: b._id,
        name: g?.fullName || g?.name || b.guestName || "Resident Guest",
        email: g?.email || b.email || "guest@hotel.com",
        phone: g?.mobileNumber || g?.phone || b.mobileNumber || "N/A",
        roomAssigned: roomsList.length > 1 ? roomsList.join(", ") : roomsList[0],
        roomNumbers: roomsList,
        checkInDate: b.checkInDate ? new Date(b.checkInDate).toLocaleDateString() : "Today",
        status: b.status === "CHECKED_IN" ? "IN-HOUSE" : b.status === "CHECKED_OUT" ? "DEPARTED" : b.status || "IN-HOUSE",
      };
    });
  }, [bookings]);

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      {/* ========================================================================= */}
      {/* SECTION 1: MASTER COMMAND HERO BANNER (Timings Ribbon & Quick Actions)     */}
      {/* ========================================================================= */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2.5, md: 3 },
          borderRadius: "24px",
          background: `linear-gradient(135deg, ${themeConfig.primaryDark || "#0C273B"} 0%, ${themeConfig.primary || "#0B8EE0"} 100%)`,
          color: "#FFFFFF",
          boxShadow: `0 16px 36px -10px ${themeConfig.primaryGlow || "rgba(11, 142, 224, 0.4)"}, inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.2)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: "-50%",
            right: "-15%",
            width: "450px",
            height: "450px",
            background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)",
            pointerEvents: "none",
          }}
        />

        <Box sx={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 2, position: "relative", zIndex: 1 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8 }}>
              <Avatar
                sx={{
                  bgcolor: "rgba(255,255,255,0.18)",
                  color: "#FFFFFF",
                  width: 32,
                  height: 32,
                  backdropFilter: "blur(8px)",
                  boxShadow: "inset 0 1px 1px rgba(255,255,255,0.6)",
                }}
              >
                <HowToReg sx={{ fontSize: 18 }} />
              </Avatar>
              <Chip
                label="Front Desk Master Operations"
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  letterSpacing: 0.5,
                  backdropFilter: "blur(6px)",
                  border: "1px solid rgba(255,255,255,0.3)",
                }}
              />
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.8, color: "#FFFFFF", lineHeight: 1.2 }}>
              Front Desk & Room Inventory
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, maxWidth: "600px" }}>
              Live room inventory, category tracker, operational timings, and 1-click express check-in.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", alignItems: "center" }}>
            <Button
              variant="contained"
              startIcon={<Bolt />}
              onClick={() => onNavigateTab && onNavigateTab(1)}
              className="btn-3d"
              sx={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #E6EFF8 100%)",
                color: themeConfig.primaryDark,
                fontWeight: 900,
                borderRadius: "14px",
                px: 2.8,
                py: 1.2,
                fontSize: "0.88rem",
                boxShadow: "0 8px 20px rgba(0,0,0,0.18), inset 0 1px 0 #FFFFFF",
                border: "1px solid rgba(255,255,255,0.8)",
                "&:hover": {
                  background: "#FFFFFF",
                  transform: "translateY(-2px)",
                },
              }}
            >
              View Rooms ({rooms.length})
            </Button>

            <Button
              variant="outlined"
              startIcon={<Badge />}
              onClick={() => onNavigateTab && onNavigateTab(3)}
              sx={{
                borderRadius: "14px",
                fontWeight: 800,
                color: "#FFFFFF",
                borderColor: "rgba(255,255,255,0.4)",
                bgcolor: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(6px)",
                px: 2,
                py: 1.1,
                fontSize: "0.85rem",
                "&:hover": {
                  borderColor: "#FFFFFF",
                  bgcolor: "rgba(255,255,255,0.2)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Govt ID Hub
            </Button>

            {onRefresh && (
              <IconButton
                onClick={onRefresh}
                sx={{
                  color: "#FFFFFF",
                  bgcolor: "rgba(255,255,255,0.15)",
                  borderRadius: "12px",
                  p: 1.2,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.3)" },
                }}
              >
                <Refresh fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>

        {/* Operational Timings Ribbon */}
        <Box
          sx={{
            mt: 3,
            pt: 2,
            borderTop: "1px solid rgba(255,255,255,0.15)",
            display: "flex",
            flexWrap: "wrap",
            gap: { xs: 1.5, md: 3 },
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <AccessTime sx={{ fontSize: 16, color: "rgba(255,255,255,0.9)" }} />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.95)", fontWeight: 700 }}>
              Check-In Opens: <strong>{inTimeFormatted}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Schedule sx={{ fontSize: 16, color: "rgba(255,255,255,0.9)" }} />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.95)", fontWeight: 700 }}>
              Check-Out Deadline: <strong>{outTimeFormatted}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CleaningServices sx={{ fontSize: 16, color: "rgba(255,255,255,0.9)" }} />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.95)", fontWeight: 700 }}>
              Buffer: <strong>{turnaroundStr}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Security sx={{ fontSize: 16, color: "rgba(255,255,255,0.9)" }} />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.95)", fontWeight: 700 }}>
              Timezone: <strong>{timezoneStr}</strong>
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* SECTION 2: LIVE TELEMETRY 5 STAT CARDS (Standardized Equal Height)         */}
      {/* ========================================================================= */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(3, 1fr)",
            lg: "repeat(5, 1fr)",
          },
          gap: 2,
          mb: 4,
          alignItems: "stretch",
        }}
      >
        <StatCard
          title="Available Vacant"
          value={totalAvailable}
          subtitle="Ready for check-in"
          icon={<CheckCircle />}
          color="#10B981"
          badgeText="Vacant"
        />

        <StatCard
          title="Occupied / Booked"
          value={totalOccupied}
          subtitle="Active guest stay"
          icon={<HowToReg />}
          color="#0B8EE0"
          badgeText="In-House"
        />

        <StatCard
          title="Housekeeping Queue"
          value={totalCleaning}
          subtitle="Sanitation in progress"
          icon={<CleaningServices />}
          color="#D97706"
          badgeText="Cleaning"
        />

        <StatCard
          title="Maintenance / Blocked"
          value={totalMaintenance}
          subtitle="Out of service repairs"
          icon={<Build />}
          color="#EF4444"
          badgeText={totalMaintenance > 0 ? "Under Fix" : "All Clear"}
        />

        <StatCard
          title="Total In-House Guests"
          value={inHouseGuestsCount}
          subtitle="Active keycard folios"
          icon={<People />}
          color="#8E24AA"
          badgeText="Guests"
        />
      </Box>

      {/* ========================================================================= */}
      {/* SECTION 3: ROOM CATEGORIES LIVE INVENTORY CARDS                           */}
      {/* ========================================================================= */}
      <Card
        className="card-3d"
        sx={{
          borderRadius: "22px",
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "none" : "0 10px 30px -5px rgba(12, 39, 59, 0.08), inset 0 1px 1px #FFFFFF",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #F9FBFC 100%)",
          mb: 4,
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <div>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5 }}>
                🏨 Room Categories & Live Inventory
              </Typography>
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontSize: "0.85rem", mt: 0.3 }}>
                Live vacant/booked telemetry and room inventory status across all categories.
              </Typography>
            </div>

            <Button
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => onNavigateTab && onNavigateTab(1)}
              sx={{
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "0.82rem",
                borderColor: themeConfig.border,
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                color: themeConfig.textMain,
                "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
              }}
            >
              Open Rooms List ({rooms.length})
            </Button>
          </Box>

          {categoryStats.length === 0 ? (
            <Box sx={{ py: 6 }}>
              <EmptyState
                title="No Room Categories Found"
                description="No rooms or categories configured yet in the hotel inventory."
              />
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(3, 1fr)",
                },
                gap: 3,
              }}
            >
              {categoryStats.map((cat) => {
                const hasAvailable = cat.available > 0;
                const isAllBooked = cat.available === 0 && cat.totalRooms > 0;
                const adultsCount = cat.capacity?.adults || 2;
                const kidsCount = cat.capacity?.children || 1;

                return (
                  <Card
                    key={cat._id}
                    className="card-3d"
                    onClick={() => onNavigateTab && onNavigateTab(1, cat._id)}
                    sx={{
                      p: 3,
                      borderRadius: "20px",
                      border: `2px solid ${hasAvailable ? themeConfig.primaryGlow || "#0B8EE033" : themeConfig.border}`,
                      bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                      background: isDarkMode
                        ? (themeConfig.bgCard || "#0E312C")
                        : (hasAvailable
                          ? "linear-gradient(135deg, #FFFFFF 0%, #F4F9FD 100%)"
                          : "linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)"),
                      boxShadow: isDarkMode ? "none" : "0 8px 24px rgba(12, 39, 59, 0.06), inset 0 1px 1px #FFFFFF",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 2,
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        borderColor: themeConfig.primary,
                        boxShadow: `0 16px 32px -4px ${themeConfig.primaryGlow || "rgba(11, 142, 224, 0.25)"}`,
                      },
                    }}
                  >
                    <div>
                      {/* Header */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2, minWidth: 0 }}>
                          <Avatar
                            sx={{
                              bgcolor: themeConfig.champagne,
                              color: themeConfig.primaryDark,
                              width: 40,
                              height: 40,
                              borderRadius: "12px",
                              flexShrink: 0,
                            }}
                          >
                            {getCategoryIcon(cat.name)}
                          </Avatar>
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, lineHeight: 1.2, fontSize: "1.05rem" }}>
                              {cat.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 800, display: "block", mt: 0.3 }}>
                              👥 Max {adultsCount} Guests {kidsCount > 0 ? `(+ ${kidsCount} Kids)` : ""}
                            </Typography>
                            <Box sx={{ mt: 0.5 }}>
                              <Chip
                                icon={<Bed sx={{ fontSize: 13, color: `${themeConfig.primaryDark} !important` }} />}
                                label={`${cat.bedCount} Bed (${cat.bedType})`}
                                size="small"
                                sx={{
                                  bgcolor: themeConfig.champagne,
                                  color: themeConfig.primaryDark,
                                  fontWeight: 800,
                                  fontSize: "0.68rem",
                                  height: 22,
                                }}
                              />
                            </Box>
                          </Box>
                        </Box>

                        <Box sx={{ textAlign: "right", flexShrink: 0, whiteSpace: "nowrap" }}>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.primary, lineHeight: 1 }}>
                            ₹{Number(cat.basePrice || 0).toLocaleString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "block" }}>
                            / night
                          </Typography>
                        </Box>
                      </Box>

                      {/* 3 Status Units */}
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 1,
                          mt: 2,
                          p: 1.2,
                          borderRadius: "14px",
                          bgcolor: "rgba(0,0,0,0.025)",
                          border: `1px solid ${themeConfig.border}`,
                        }}
                      >
                        <Box sx={{ textAlign: "center", p: 0.8, borderRadius: "10px", bgcolor: "rgba(16, 185, 129, 0.08)" }}>
                          <Typography variant="caption" sx={{ color: "#059669", fontWeight: 800, display: "block", fontSize: "0.62rem" }}>
                            🟢 Available
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: "#10B981" }}>
                            {cat.available}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: "center", p: 0.8, borderRadius: "10px", bgcolor: "rgba(11, 142, 224, 0.08)" }}>
                          <Typography variant="caption" sx={{ color: "#0284C7", fontWeight: 800, display: "block", fontSize: "0.62rem" }}>
                            🔵 Booked
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: "#0B8EE0" }}>
                            {cat.occupied + cat.reserved}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: "center", p: 0.8, borderRadius: "10px", bgcolor: "rgba(217, 119, 6, 0.08)" }}>
                          <Typography variant="caption" sx={{ color: "#D97706", fontWeight: 800, display: "block", fontSize: "0.62rem" }}>
                            🟡 Cleaning
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: "#D97706" }}>
                            {cat.cleaning}
                          </Typography>
                        </Box>
                      </Box>
                    </div>

                    {/* Footer */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1.5, borderTop: `1px solid ${themeConfig.border}` }}>
                      <Chip
                        label={
                          isAllBooked
                            ? "🔴 100% Booked"
                            : cat.available > 0
                              ? `🟢 ${cat.available} Ready for Check-In`
                              : "⚪ No Rooms"
                        }
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.7rem",
                          bgcolor: isAllBooked ? "rgba(239, 68, 68, 0.1)" : hasAvailable ? "rgba(16, 185, 129, 0.12)" : "rgba(0,0,0,0.05)",
                          color: isAllBooked ? "#EF4444" : hasAvailable ? "#059669" : themeConfig.textMuted,
                        }}
                      />

                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.primary, fontSize: "0.78rem" }}>
                        View {cat.totalRooms} Rooms &rarr;
                      </Typography>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* SECTION 4: RECENT FRONT DESK CHECK-INS & IN-HOUSE FOLIOS                  */}
      {/* ========================================================================= */}
      <Card
        className="card-3d"
        sx={{
          borderRadius: "22px",
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "none" : "0 10px 30px -5px rgba(12, 39, 59, 0.08), inset 0 1px 1px #FFFFFF",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #F9FBFC 100%)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Avatar sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, width: 34, height: 34, borderRadius: "10px" }}>
                <People sx={{ fontSize: 20 }} />
              </Avatar>
              <div>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "1.05rem" }}>
                  Recent Front Desk Check-Ins & In-House Folios
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                  Live guest registry, allocated room numbers & stay status
                </Typography>
              </div>
            </Box>

            <Button
              size="small"
              endIcon={<ArrowForward fontSize="small" />}
              onClick={() => onNavigateTab && onNavigateTab(2)}
              sx={{
                fontWeight: 800,
                fontSize: "0.8rem",
                borderRadius: "10px",
                color: themeConfig.primaryDark,
                "&:hover": { bgcolor: themeConfig.champagne },
              }}
            >
              View In-House Folios
            </Button>
          </Box>

          <TableContainer
            component={Paper}
            sx={{
              borderRadius: "16px",
              border: `1px solid ${themeConfig.border}`,
              boxShadow: "none",
              overflowX: "auto",
            }}
          >
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.2 }}>Guest Name</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Assigned Room</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Check-In Date</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeRecentBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3, color: themeConfig.textMuted, fontWeight: 700 }}>
                      No active check-ins or in-house guest folios found.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeRecentBookings
                    .slice(guestPage * guestRowsPerPage, guestPage * guestRowsPerPage + guestRowsPerPage)
                    .map((g) => (
                      <TableRow key={g._id || g.name} sx={{ "&:hover": { bgcolor: `${themeConfig.primaryGlow} !important` } }}>
                        <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: "0.75rem", fontWeight: 800, bgcolor: themeConfig.primary, color: "#FFFFFF" }}>
                              {(g.name || "G").charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                {g.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                                {g.email}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          {g.roomNumbers && g.roomNumbers.length > 1 ? (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                              {g.roomNumbers.map((rn) => (
                                <Chip
                                  key={rn}
                                  label={`Room #${rn}`}
                                  size="small"
                                  sx={{
                                    fontWeight: 800,
                                    borderRadius: "8px",
                                    bgcolor: themeConfig.champagne,
                                    color: themeConfig.primaryDark,
                                    border: `1px solid ${themeConfig.border}`,
                                  }}
                                />
                              ))}
                            </Box>
                          ) : (
                            <Chip
                              label={`Room #${g.roomAssigned}`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                borderRadius: "8px",
                                bgcolor: themeConfig.champagne,
                                color: themeConfig.primaryDark,
                                border: `1px solid ${themeConfig.border}`,
                              }}
                            />
                          )}
                        </TableCell>
                        <TableCell sx={{ color: themeConfig.textMuted }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                            {g.phone}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ color: themeConfig.textMuted }}>
                          <Typography variant="caption" sx={{ fontWeight: 700 }}>
                            {g.checkInDate}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <StatusChip status={g.status || "IN-HOUSE"} size="small" />
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {activeRecentBookings.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={activeRecentBookings.length}
              rowsPerPage={guestRowsPerPage}
              page={guestPage}
              onPageChange={(e, newPage) => setGuestPage(newPage)}
              onRowsPerPageChange={(e) => {
                setGuestRowsPerPage(parseInt(e.target.value, 10));
                setGuestPage(0);
              }}
              sx={{ borderTop: `1px solid ${themeConfig.border}`, bgcolor: themeConfig.bgCard, color: themeConfig.textMain, mt: 1 }}
            />
          )}
        </CardContent>
      </Card>
    </Box>
  );
}
