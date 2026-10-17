"use client";

import React, { useState } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Divider,
  IconButton,
  MenuItem,
  Tooltip,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import {
  Add,
  ArrowBack,
  Close,
  Edit,
  Delete,
  MeetingRoom,
  Wifi,
  AcUnit,
  Tv,
  Kitchen,
  Bathtub,
  Balcony,
  LocalCafe,
  Lock,
  KingBed,
  HotTub,
  RoomService,
  Pool,
  LocalParking,
  FreeBreakfast,
  Check,
  Category,
  Diamond,
  FamilyRestroom,
  Favorite,
} from "@/shared/icons";

const getCategoryIcon = (categoryName = "") => {
  const name = (categoryName || "").toLowerCase();
  if (name.includes("coupl") || name.includes("honey") || name.includes("romant") || name.includes("love")) {
    return <Favorite sx={{ fontSize: 22, color: "#E11D48" }} />;
  }
  if (name.includes("fam") || name.includes("group")) {
    return <FamilyRestroom sx={{ fontSize: 22, color: "#059669" }} />;
  }
  if (name.includes("sweet") || name.includes("suite") || name.includes("deluxe") || name.includes("vip") || name.includes("premium")) {
    return <Diamond sx={{ fontSize: 22, color: "#D97706" }} />;
  }
  return <MeetingRoom sx={{ fontSize: 22, color: "#0F766E" }} />;
};
import { useAppTheme } from "@/shared/context/ThemeContext";
import EmptyState from "@/shared/components/EmptyState";
import StatusChip from "@/shared/components/StatusChip";

// Reusable Room GST Configuration Section Component (Disabled per requirement)
export function RoomGstFields() {
  return null;
}

// Standard Popular Hotel Amenities with Icons & Labels
export const POPULAR_AMENITIES = [
  { label: "Free High-Speed WiFi", icon: <Wifi sx={{ fontSize: 16 }} /> },
  { label: "Air Conditioner (AC)", icon: <AcUnit sx={{ fontSize: 16 }} /> },
  { label: "Smart 4K LED TV", icon: <Tv sx={{ fontSize: 16 }} /> },
  { label: "Mini Fridge / Bar", icon: <Kitchen sx={{ fontSize: 16 }} /> },
  { label: "Attached Bathroom & Geyser", icon: <Bathtub sx={{ fontSize: 16 }} /> },
  { label: "Balcony / Scenic View", icon: <Balcony sx={{ fontSize: 16 }} /> },
  { label: "Tea / Coffee Maker", icon: <LocalCafe sx={{ fontSize: 16 }} /> },
  { label: "Electronic Room Safe", icon: <Lock sx={{ fontSize: 16 }} /> },
  { label: "King Size Bed", icon: <KingBed sx={{ fontSize: 16 }} /> },
  { label: "Jacuzzi / Bathtub", icon: <HotTub sx={{ fontSize: 16 }} /> },
  { label: "24/7 Room Service", icon: <RoomService sx={{ fontSize: 16 }} /> },
  { label: "Swimming Pool Access", icon: <Pool sx={{ fontSize: 16 }} /> },
  { label: "Free Valet Parking", icon: <LocalParking sx={{ fontSize: 16 }} /> },
  { label: "Complimentary Breakfast", icon: <FreeBreakfast sx={{ fontSize: 16 }} /> },
];

export const BED_OPTIONS = [
  { label: "1 King Size Bed", capacity: 2, count: 1 },
  { label: "1 Queen Size Bed", capacity: 2, count: 1 },
  { label: "2 Double Beds", capacity: 4, count: 2 },
  { label: "2 Twin Single Beds", capacity: 2, count: 2 },
  { label: "3 Single Beds", capacity: 3, count: 3 },
  { label: "1 King Bed + 1 Single Bed", capacity: 3, count: 2 },
  { label: "1 Double Bed + 2 Bunk Beds", capacity: 4, count: 3 },
  { label: "Single Bed", capacity: 1, count: 1 },
];

export default function RoomTypesPage({
  rooms = [],
  roomTypes = [],
  roomModal,
  setRoomModal,
  typeModal,
  setTypeModal,
  onSaveRoom,
  onDeleteRoom,
  onUpdateRoomStatus,
  onSaveRoomType,
  onDeleteRoomType,
  subscription,
  onTabChange,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();


  // Custom Amenity Input state for Room Modal & Type Modal
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [customTypeAmenityInput, setCustomTypeAmenityInput] = useState("");
  const [trialLimitModalOpen, setTrialLimitModalOpen] = useState(false);
  const [roomErrors, setRoomErrors] = useState({});
  const [typeErrors, setTypeErrors] = useState({});
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [categoryPage, setCategoryPage] = useState(0);
  const [categoryRowsPerPage, setCategoryRowsPerPage] = useState(6);
  const [roomPage, setRoomPage] = useState(0);
  const [roomRowsPerPage, setRoomRowsPerPage] = useState(5);

  const fieldSx = (invalid) => ({
    "& .MuiOutlinedInput-root": {
      borderRadius: "12px",
      ...(invalid
        ? {
            "& fieldset": { borderColor: "#DC2626 !important", borderWidth: "2px" },
            "&:hover fieldset": { borderColor: "#DC2626 !important" },
            "&.Mui-focused fieldset": { borderColor: "#DC2626 !important" },
          }
        : {}),
    },
    "& .MuiFormHelperText-root": { color: "#DC2626", fontWeight: 700 },
  });

  const submitRoom = (e) => {
    e.preventDefault();
    const data = roomModal.data || {};
    const blank = (value) => value === undefined || value === null || String(value).trim() === "";
    const errors = {};
    if (blank(data.roomType)) errors.roomType = "Select a room category.";
    if (blank(data.roomNumber)) errors.roomNumber = "Room number is required.";
    if (blank(data.floor)) errors.floor = "Floor is required.";
    if (blank(data.bedType)) errors.bedType = "Bed setup is required.";
    if (blank(data.bedCount)) errors.bedCount = "Total beds is required.";
    if (blank(data.seatingCapacity)) errors.seatingCapacity = "Guest capacity is required.";
    if (blank(data.customPricePerNight)) errors.customPricePerNight = "Daily price is required.";
    setRoomErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onSaveRoom(e);
  };

  const submitCategory = (e) => {
    e.preventDefault();
    const data = typeModal.data || {};
    const blank = (value) => value === undefined || value === null || String(value).trim() === "";
    const errors = {};
    if (blank(data.name)) errors.name = "Category name is required.";
    setTypeErrors(errors);
    if (Object.keys(errors).length > 0) return;
    onSaveRoomType(e);
  };

  const planSource = subscription?.plan;
  const planName = (
    typeof planSource === "string"
      ? planSource
      : planSource?.name || planSource?.title || planSource?.plan_name || "TRIAL"
  ).toString().toUpperCase();
  const isTrial = planName === "TRIAL" || planName === "FREE" || subscription?.status === "TRIAL";

  // Summary Metrics
  const totalRoomsCount = rooms.length;
  const availableRoomsCount = rooms.filter((r) => r.status === "AVAILABLE").length;
  const occupiedRoomsCount = rooms.filter((r) => r.status === "OCCUPIED" || r.status === "RESERVED").length;
  const maintenanceRoomsCount = rooms.filter((r) => r.status === "MAINTENANCE" || r.status === "CLEANING" || r.status === "BLOCKED").length;


  // Helper to open Add Room modal with preselected Category
  const handleOpenAddRoomForCategory = (category) => {
    if (isTrial && rooms.length >= 5) {
      setTrialLimitModalOpen(true);
      return;
    }

    const catId = category?._id || roomTypes[0]?._id || "";

    setRoomModal({
      open: true,
      mode: "ADD",
      data: {
        _id: "",
        roomNumber: "",
        roomType: catId,
        floor: "",
        bedCount: "",
        bedType: "",
        seatingCapacity: "",
        customPricePerNight: "",
        status: "AVAILABLE",
        notes: "",
        amenities: [],
      },
    });
  };

  // Helper to open Add Room modal with preselected Floor
  const handleOpenAddRoomForFloor = (floorNumber) => {
    if (isTrial && rooms.length >= 5) {
      setTrialLimitModalOpen(true);
      return;
    }

    const defaultCat = roomTypes[0];

    setRoomModal({
      open: true,
      mode: "ADD",
      data: {
        _id: "",
        roomNumber: "",
        roomType: defaultCat?._id || "",
        floor: "",
        bedCount: "",
        bedType: "",
        seatingCapacity: "",
        customPricePerNight: "",
        status: "AVAILABLE",
        notes: "",
        amenities: [],
      },
    });
  };

  // Helper to toggle amenity in Room Modal
  const toggleRoomAmenity = (amenityName) => {
    const currentList = Array.isArray(roomModal.data?.amenities) ? [...roomModal.data.amenities] : [];
    const index = currentList.indexOf(amenityName);
    if (index > -1) {
      currentList.splice(index, 1);
    } else {
      currentList.push(amenityName);
    }
    setRoomModal({
      ...roomModal,
      data: { ...roomModal.data, amenities: currentList },
    });
  };

  // Helper to add custom amenity in Room Modal
  const handleAddCustomRoomAmenity = () => {
    const trimmed = customAmenityInput.trim();
    if (!trimmed) return;
    const currentList = Array.isArray(roomModal.data?.amenities) ? [...roomModal.data.amenities] : [];
    if (!currentList.includes(trimmed)) {
      currentList.push(trimmed);
      setRoomModal({
        ...roomModal,
        data: { ...roomModal.data, amenities: currentList },
      });
    }
    setCustomAmenityInput("");
  };

  // Helper to reset Room Amenities to selected Category's default
  const handleResetToCategoryAmenities = (catId) => {
    const cat = roomTypes.find((t) => t._id === catId);
    if (cat && cat.amenities) {
      setRoomModal({
        ...roomModal,
        data: { ...roomModal.data, amenities: [...cat.amenities] },
      });
    }
  };

  // Helper to toggle amenity in Category Modal
  const toggleTypeAmenity = (amenityName) => {
    const currentList = Array.isArray(typeModal.data?.amenities) ? [...typeModal.data.amenities] : [];
    const index = currentList.indexOf(amenityName);
    if (index > -1) {
      currentList.splice(index, 1);
    } else {
      currentList.push(amenityName);
    }
    setTypeModal({
      ...typeModal,
      data: { ...typeModal.data, amenities: currentList },
    });
  };

  // Helper to add custom amenity in Category Modal
  const handleAddCustomTypeAmenity = () => {
    const trimmed = customTypeAmenityInput.trim();
    if (!trimmed) return;
    const currentList = Array.isArray(typeModal.data?.amenities) ? [...typeModal.data.amenities] : [];
    if (!currentList.includes(trimmed)) {
      currentList.push(trimmed);
      setTypeModal({
        ...typeModal,
        data: { ...typeModal.data, amenities: currentList },
      });
    }
    setCustomTypeAmenityInput("");
  };

  const selectedCategory = roomTypes.find((cat) => String(cat._id || cat.id) === String(selectedCategoryId)) || null;
  const selectedRooms = selectedCategory
    ? rooms.filter((r) => {
        const typeId = typeof r.roomType === "object" ? (r.roomType?._id || r.roomType?.id) : (r.roomType || r.room_type_id || r.roomTypeId);
        return String(typeId) === String(selectedCategory._id || selectedCategory.id) || (selectedCategory.name && (r.room_type_name || r.roomTypeName) === selectedCategory.name);
      })
    : [];
  const pagedRooms = selectedRooms.slice(roomPage * roomRowsPerPage, roomPage * roomRowsPerPage + roomRowsPerPage);
  const pagedCategories = roomTypes.slice(categoryPage * categoryRowsPerPage, categoryPage * categoryRowsPerPage + categoryRowsPerPage);

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 } }}>
      {/* ========================================================================= */}
      {/* 3D MASTER COMMAND RIBBON                                                  */}
      {/* ========================================================================= */}
      <Box
        sx={{
          mb: 3.5,
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
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8, flexWrap: "wrap" }}>
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
                <Category sx={{ fontSize: 18 }} />
              </Avatar>
              <Chip
                label="Category-Wise Rooms & Amenities Master"
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
              {isTrial ? (
                <Chip
                  label={`Trial Plan: 5 Rooms Limit (${totalRoomsCount}/5 Created)`}
                  size="small"
                  sx={{
                    bgcolor: totalRoomsCount >= 5 ? "#EF4444" : "#F59E0B",
                    color: "#FFFFFF",
                    fontWeight: 900,
                    fontSize: "0.72rem",
                  }}
                />
              ) : (
                <Chip
                  label={`${planName} Tier: Unlimited Rooms (${totalRoomsCount} Created)`}
                  size="small"
                  sx={{
                    bgcolor: "#10B981",
                    color: "#FFFFFF",
                    fontWeight: 900,
                    fontSize: "0.72rem",
                  }}
                />
              )}
            </Box>
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.8, color: "#FFFFFF", lineHeight: 1.2, fontSize: { xs: "1.5rem", sm: "2.1rem" } }}>
              Room Category & Amenities Management
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, maxWidth: "680px", fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
              Configure category-wise rooms, assign rich amenities (WiFi, AC, TV, Mini-bar, Jacuzzi), manage floor allocations, and customize tariffs.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 1.5, width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenAddRoomForCategory(roomTypes[0])}
              className="btn-3d"
              sx={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #E6EFF8 100%)",
                color: themeConfig.primaryDark,
                fontWeight: 900,
                borderRadius: "14px",
                px: 2.6,
                py: 1.2,
                fontSize: "0.88rem",
                width: { xs: "100%", sm: "auto" },
                boxShadow: "0 8px 20px rgba(0,0,0,0.18), inset 0 1px 0 #FFFFFF",
                border: "1px solid rgba(255,255,255,0.8)",
                "&:hover": {
                  background: "#FFFFFF",
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 26px rgba(0,0,0,0.24)",
                },
              }}
            >
              Add New Room
            </Button>

            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() =>
                setTypeModal({
                  open: true,
                  mode: "ADD",
                  data: {
                    _id: "",
                    name: "",
                    basePrice: "",
                    maxAdults: "",
                    maxChildren: "",
                    bedCount: "",
                    bedType: "",
                    description: "",
                    amenities: [],
                  },
                })
              }
              className="btn-3d"
              sx={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #E6EFF8 100%)",
                color: themeConfig.primaryDark,
                fontWeight: 900,
                borderRadius: "14px",
                px: 2.6,
                py: 1.2,
                fontSize: "0.88rem",
                width: { xs: "100%", sm: "auto" },
                boxShadow: "0 8px 20px rgba(0,0,0,0.18), inset 0 1px 0 #FFFFFF",
                border: "1px solid rgba(255,255,255,0.8)",
                "&:hover": {
                  background: "#FFFFFF",
                  transform: "translateY(-2px)",
                  boxShadow: "0 12px 26px rgba(0,0,0,0.24)",
                },
              }}
            >
              Create Room Category
            </Button>
          </Box>
        </Box>

        {/* Live Metrics Strip */}
        <Grid container spacing={2} sx={{ mt: 3, pt: 2, borderTop: "1px solid rgba(255,255,255,0.15)" }}>
          <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>
              TOTAL ROOMS
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
              {totalRoomsCount}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>
              AVAILABLE
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#4ADE80", fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
              {availableRoomsCount}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>
              OCCUPIED / RESERVED
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#FDE047", fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
              {occupiedRoomsCount}
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, sm: 3, md: 2.4 }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>
              CLEANING / MAINT
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#F87171", fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
              {maintenanceRoomsCount}
            </Typography>
          </Grid>

          <Grid size={{ xs: 12, sm: 12, md: 2.4 }}>
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)", fontWeight: 700 }}>
              ROOM CATEGORIES
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 900, color: "#FFFFFF", fontSize: { xs: "1.3rem", sm: "1.5rem" } }}>
              {roomTypes.length}
            </Typography>
          </Grid>
        </Grid>
      </Box>


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
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <div>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5, fontSize: { xs: "1.15rem", sm: "1.45rem" }, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 1 }}>
                🏨 Room Categories &amp; Live Inventory
              </Typography>
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontSize: { xs: "0.78rem", sm: "0.85rem" }, mt: 0.3 }}>
                Live vacant/booked telemetry and room inventory status across all categories.
              </Typography>
            </div>

            {/* Add Category button hidden
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() =>
                setTypeModal({
                  open: true,
                  mode: "ADD",
                  data: {
                    _id: "",
                    name: "",
                    basePrice: "",
                    maxAdults: "",
                    maxChildren: "",
                    bedCount: "",
                    bedType: "",
                    description: "",
                    amenities: [],
                  },
                })
              }
              sx={{
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "0.82rem",
                borderColor: themeConfig.border,
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                color: themeConfig.textMain,
                width: { xs: "100%", sm: "auto" },
                whiteSpace: "nowrap",
                textTransform: "none",
                "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
              }}
            >
              Add Category
            </Button>
            */}
          </Box>

          {roomTypes.length === 0 ? (
            <Box sx={{ py: 6 }}>
              <EmptyState
                title="No Room Categories Found"
                description="No rooms or categories configured yet in the hotel inventory."
              />
            </Box>
          ) : selectedCategory ? (
            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
                <Button
                  startIcon={<ArrowBack />}
                  onClick={() => { setSelectedCategoryId(null); setRoomPage(0); }}
                  sx={{ fontWeight: 800, textTransform: "none", color: themeConfig.textMain, borderRadius: "10px" }}
                >
                  All Categories
                </Button>
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<Add />}
                  onClick={() => handleOpenAddRoomForCategory(selectedCategory)}
                  sx={{
                    background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                    fontWeight: 800,
                    borderRadius: "10px",
                    textTransform: "none",
                  }}
                >
                  Add Room to {selectedCategory.name}
                </Button>
              </Box>

              <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 1.5 }}>
                {selectedCategory.name} · {selectedRooms.length} {selectedRooms.length === 1 ? "Room" : "Rooms"}
              </Typography>

              {selectedRooms.length === 0 ? (
                <EmptyState title="No rooms in this category" description={`Add a room under ${selectedCategory.name} to see it in this list.`} />
              ) : (
                <TableContainer sx={{ border: `1px solid ${themeConfig.border}`, borderRadius: "14px" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F4F9FD" }}>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Room</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Floor</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Tariff</TableCell>
                        <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Status</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedRooms.map((room) => {
                        const tariff = Number(room.customPricePerNight || selectedCategory.basePrice || room.basePrice || 0);
                        return (
                          <TableRow key={room._id || room.roomNumber} hover>
                            <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>
                              Room {room.roomNumber}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: themeConfig.textMuted }}>
                              Floor {room.floor || 1}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "#0F766E", whiteSpace: "nowrap" }}>
                              ₹{tariff.toLocaleString("en-IN")}/night
                            </TableCell>
                            <TableCell>
                              <StatusChip status={room.status || "AVAILABLE"} size="small" />
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit room">
                                <IconButton
                                  size="small"
                                  onClick={() =>
                                    setRoomModal({
                                      open: true,
                                      mode: "EDIT",
                                      data: {
                                        _id: room._id,
                                        roomNumber: room.roomNumber,
                                        roomType: typeof room.roomType === "object" ? room.roomType._id : room.roomType,
                                        floor: room.floor || 1,
                                        bedCount: room.bedCount || 1,
                                        bedType: room.bedType || "1 King Size Bed",
                                        seatingCapacity: room.seatingCapacity || 2,
                                        customPricePerNight: room.customPricePerNight || "",
                                        status: room.status || "AVAILABLE",
                                        notes: room.notes || "",
                                        amenities: room.amenities || [],
                                      },
                                    })
                                  }
                                  sx={{ color: themeConfig.info, bgcolor: themeConfig.infoBg, borderRadius: "8px", mr: 0.5 }}
                                >
                                  <Edit sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Delete room">
                                <IconButton
                                  size="small"
                                  onClick={() => onDeleteRoom && onDeleteRoom(room)}
                                  sx={{ color: themeConfig.danger, bgcolor: themeConfig.dangerBg, borderRadius: "8px" }}
                                >
                                  <Delete sx={{ fontSize: 16 }} />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={selectedRooms.length}
                    page={roomPage}
                    onPageChange={(e, next) => setRoomPage(next)}
                    rowsPerPage={roomRowsPerPage}
                    onRowsPerPageChange={(e) => {
                      setRoomRowsPerPage(parseInt(e.target.value, 10));
                      setRoomPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25]}
                  />
                </TableContainer>
              )}
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  sm: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(auto-fit, minmax(310px, 1fr))",
                  xl: "repeat(3, 1fr)",
                },
                gap: { xs: 2, sm: 2.5 },
              }}
            >
              {pagedCategories.map((cat) => {
                const catRooms = rooms.filter((r) => {
                  const typeId = typeof r.roomType === "object" ? (r.roomType?._id || r.roomType?.id) : (r.roomType || r.room_type_id || r.roomTypeId);
                  return String(typeId) === String(cat._id || cat.id) || (cat.name && (r.room_type_name || r.roomTypeName) === cat.name);
                });
                const available = catRooms.filter((r) => (r.status || "AVAILABLE") === "AVAILABLE").length;
                const booked = catRooms.filter((r) => r.status === "OCCUPIED" || r.status === "RESERVED").length;
                const cleaning = catRooms.filter((r) => r.status === "CLEANING" || r.status === "MAINTENANCE" || r.status === "BLOCKED").length;
                const totalRooms = catRooms.length;
                const hasAvailable = available > 0;
                const isAllBooked = available === 0 && totalRooms > 0;
                const adultsCount = Number(cat.capacity?.adults || cat.maxAdults || cat.max_adults || 2);
                const kidsCount = Number(cat.capacity?.children ?? cat.maxChildren ?? cat.max_children ?? 1);
                const bedType = cat.bedType || cat.bed_type || "";
                const bedCount = cat.bedCount || cat.bed_count || 1;

                return (
                  <Card
                    key={cat._id || cat.id || cat.name}
                    className="card-3d"
                    onClick={() => { setSelectedCategoryId(cat._id || cat.id); setRoomPage(0); }}
                    sx={{
                      p: { xs: 2, sm: 2.2, md: 2.5 },
                      borderRadius: "20px",
                      cursor: "pointer",
                      border: `2px solid ${hasAvailable ? "rgba(13, 148, 136, 0.25)" : themeConfig.border}`,
                      bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                      background: isDarkMode
                        ? (themeConfig.bgCard || "#0E312C")
                        : (hasAvailable
                          ? "linear-gradient(135deg, #FFFFFF 0%, #F4F9FD 100%)"
                          : "linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)"),
                      boxShadow: isDarkMode ? "none" : "0 8px 24px rgba(12, 39, 59, 0.06), inset 0 1px 1px #FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <div>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.2, mb: 1.2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
                          <Avatar
                            sx={{
                              bgcolor: "rgba(20, 184, 166, 0.12)",
                              width: 42,
                              height: 42,
                              borderRadius: "12px",
                              flexShrink: 0,
                            }}
                          >
                            {getCategoryIcon(cat.name)}
                          </Avatar>
                          <Typography
                            variant="h6"
                            noWrap
                            title={cat.name}
                            sx={{ fontWeight: 900, color: themeConfig.textMain, lineHeight: 1.2, fontSize: { xs: "1rem", sm: "1.05rem" } }}
                          >
                            {cat.name}
                          </Typography>
                        </Box>
                      </Box>

                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, 1fr)",
                          gap: 1,
                          mt: 2,
                          p: 1.2,
                          borderRadius: "14px",
                          bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.025)",
                          border: `1px solid ${themeConfig.border}`,
                        }}
                      >
                        <Box sx={{ textAlign: "center", p: 0.8, borderRadius: "10px", bgcolor: "rgba(16, 185, 129, 0.08)" }}>
                          <Typography variant="caption" sx={{ color: "#059669", fontWeight: 800, display: "block", fontSize: "0.65rem" }}>
                            🟢 Available
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: "#10B981", fontSize: "1.15rem", lineHeight: 1.2, mt: 0.2 }}>
                            {available}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center", p: 0.8, borderRadius: "10px", bgcolor: "rgba(11, 142, 224, 0.08)" }}>
                          <Typography variant="caption" sx={{ color: "#0284C7", fontWeight: 800, display: "block", fontSize: "0.65rem" }}>
                            🔵 Booked
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: "#0B8EE0", fontSize: "1.15rem", lineHeight: 1.2, mt: 0.2 }}>
                            {booked}
                          </Typography>
                        </Box>
                        <Box sx={{ textAlign: "center", p: 0.8, borderRadius: "10px", bgcolor: "rgba(217, 119, 6, 0.08)" }}>
                          <Typography variant="caption" sx={{ color: "#D97706", fontWeight: 800, display: "block", fontSize: "0.65rem" }}>
                            🟡 Cleaning
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: "#D97706", fontSize: "1.15rem", lineHeight: 1.2, mt: 0.2 }}>
                            {cleaning}
                          </Typography>
                        </Box>
                      </Box>
                    </div>

                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pt: 1.5, borderTop: `1px solid ${themeConfig.border}`, gap: 1 }}>
                      <Chip
                        label={
                          isAllBooked
                            ? "🔴 100% Booked"
                            : available > 0
                              ? `🟢 ${available} Ready for Check-In`
                              : "⚪ No Rooms"
                        }
                        size="small"
                        sx={{
                          fontWeight: 800,
                          fontSize: "0.72rem",
                          bgcolor: isAllBooked ? "rgba(239, 68, 68, 0.1)" : hasAvailable ? "rgba(16, 185, 129, 0.12)" : "rgba(0,0,0,0.05)",
                          color: isAllBooked ? "#EF4444" : hasAvailable ? "#059669" : themeConfig.textMuted,
                          borderRadius: "8px",
                          border: "none",
                        }}
                      />
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: "#0F766E", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                          Total {totalRooms} {totalRooms === 1 ? "Room" : "Rooms"}
                        </Typography>
                        <Tooltip title={`Add room to ${cat.name}`}>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleOpenAddRoomForCategory(cat); }} sx={{ color: "#0F766E" }}>
                            <Add sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit category">
                          <IconButton
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              setTypeModal({
                                open: true,
                                mode: "EDIT",
                                data: {
                                  _id: cat._id,
                                  name: cat.name,
                                  basePrice: cat.basePrice,
                                  maxAdults: cat.capacity?.adults || adultsCount,
                                  maxChildren: cat.capacity?.children || kidsCount,
                                  bedCount,
                                  bedType,
                                  description: cat.description || "",
                                  amenities: cat.amenities || [],
                                },
                              });
                            }}
                            sx={{ color: themeConfig.info }}
                          >
                            <Edit sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title={`Delete ${cat.name}`}>
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteRoomType && onDeleteRoomType(cat); }} sx={{ color: themeConfig.danger }}>
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
          {!selectedCategory && roomTypes.length > 0 && (
            <TablePagination
              component="div"
              count={roomTypes.length}
              page={categoryPage}
              onPageChange={(e, next) => setCategoryPage(next)}
              rowsPerPage={categoryRowsPerPage}
              onRowsPerPageChange={(e) => {
                setCategoryRowsPerPage(parseInt(e.target.value, 10));
                setCategoryPage(0);
              }}
              rowsPerPageOptions={[6, 12, 24]}
              labelRowsPerPage="Cards per page"
            />
          )}
        </CardContent>
      </Card>

      {/* ========================================================================= */}
      {/* 3D MODAL: ADD / EDIT ROOM (WITH CATEGORY & AMENITIES SELECTOR)             */}
      {/* ========================================================================= */}
      <Dialog
        open={roomModal.open}
        onClose={() => setRoomModal({ ...roomModal, open: false })}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "24px",
              p: 1.5,
              border: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              boxShadow: isDarkMode ? "0 24px 50px rgba(0,0,0,0.6)" : "0 24px 50px rgba(0,0,0,0.2)",
            },
          },
        }}
      >
        <form noValidate onSubmit={submitRoom}>
          <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography component="div" variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                {roomModal.mode === "ADD" ? "Create New Hotel Room" : `Edit Room ${roomModal.data?.roomNumber}`}
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                Assign Category, customize amenities, set floor, and configure capacity.
              </Typography>
            </Box>
            <IconButton onClick={() => setRoomModal({ ...roomModal, open: false })} sx={{ borderRadius: "10px" }}>
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ borderColor: themeConfig.border }}>
            <Grid container spacing={2.5}>
              {/* Room Category Selection */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  Room Category / Type *
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={roomModal.data?.roomType ? (Number(roomModal.data.roomType) || roomModal.data.roomType) : (roomTypes[0] ? (Number(roomTypes[0]._id || roomTypes[0].id) || roomTypes[0]._id) : 15)}
                  onChange={(e) => {
                    const selectedCatId = Number(e.target.value) || e.target.value;
                    const catObj = roomTypes.find((t) => Number(t._id || t.id) === Number(selectedCatId));
                    setRoomErrors((prev) => ({ ...prev, roomType: "" }));
                    setRoomModal({
                      ...roomModal,
                      data: {
                        ...roomModal.data,
                        roomType: selectedCatId,
                        seatingCapacity: catObj?.capacity?.adults || roomModal.data?.seatingCapacity || 2,
                        amenities: roomModal.data?.amenities || [],
                      },
                    });
                  }}
                  error={Boolean(roomErrors.roomType)}
                  sx={fieldSx(Boolean(roomErrors.roomType))}
                >
                  {roomTypes.map((rt) => {
                    const optVal = Number(rt._id || rt.id) || rt._id;
                    return (
                      <MenuItem key={rt._id || rt.id} value={optVal}>
                        {rt.name}{(rt.basePrice > 0 || rt.base_price > 0) ? ` (Price: ₹${rt.basePrice || rt.base_price})` : ""}
                      </MenuItem>
                    );
                  })}
                </TextField>
                {roomErrors.roomType && <Typography variant="caption" sx={{ color: "#EF4444", fontWeight: 700 }}>{roomErrors.roomType}</Typography>}
              </Grid>

              {/* Room Number */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  Room Number *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={roomModal.data?.roomNumber || ""}
                  onChange={(e) => {
                    setRoomErrors((prev) => ({ ...prev, roomNumber: "" }));
                    setRoomModal({ ...roomModal, data: { ...roomModal.data, roomNumber: e.target.value } });
                  }}
                  placeholder="e.g. 101"
                  error={Boolean(roomErrors.roomNumber)}
                  helperText={roomErrors.roomNumber || ""}
                  sx={fieldSx(Boolean(roomErrors.roomNumber))}
                />
              </Grid>

              {/* Floor Level */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  Floor Level *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={roomModal.data?.floor ?? ""}
                  onChange={(e) => {
                    setRoomErrors((prev) => ({ ...prev, floor: "" }));
                    setRoomModal({ ...roomModal, data: { ...roomModal.data, floor: e.target.value } });
                  }}
                  placeholder="e.g. 1, 2, Ground, 3"
                  error={Boolean(roomErrors.floor)}
                  helperText={roomErrors.floor || ""}
                  sx={fieldSx(Boolean(roomErrors.floor))}
                />
              </Grid>

              {/* Bed Configuration / Type */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  🛏️ Bed Setup / Configuration *
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={roomModal.data?.bedType || ""}
                  onChange={(e) => {
                    const selectedBed = e.target.value;
                    const preset = BED_OPTIONS.find((b) => b.label === selectedBed);
                    setRoomErrors((prev) => ({ ...prev, bedType: "" }));
                    setRoomModal({
                      ...roomModal,
                      data: {
                        ...roomModal.data,
                        bedType: selectedBed,
                        bedCount: preset ? preset.count : roomModal.data?.bedCount || 1,
                        seatingCapacity: preset ? preset.capacity : roomModal.data?.seatingCapacity || 2,
                      },
                    });
                  }}
                  error={Boolean(roomErrors.bedType)}
                  sx={fieldSx(Boolean(roomErrors.bedType))}
                >
                  <MenuItem value="">Select bed setup</MenuItem>
                  {BED_OPTIONS.map((opt, i) => (
                    <MenuItem key={i} value={opt.label}>
                      🛏️ {opt.label} ({opt.capacity} Guests Capacity)
                    </MenuItem>
                  ))}
                  <MenuItem value="Custom Setup">🛠️ Custom Bed Configuration</MenuItem>
                </TextField>
              </Grid>

              {/* Number of Beds in Room */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  🛏️ Total Beds in Room *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={roomModal.data?.bedCount ?? ""}
                  onChange={(e) => {
                    const bCount = e.target.value;
                    setRoomErrors((prev) => ({ ...prev, bedCount: "" }));
                    setRoomModal({
                      ...roomModal,
                      data: {
                        ...roomModal.data,
                        bedCount: bCount,
                        // Suggest 2 guests per bed if multiple beds
                        seatingCapacity: Number(bCount) > 1 ? Number(bCount) * 2 : roomModal.data?.seatingCapacity || 2,
                      },
                    });
                  }}
                  error={Boolean(roomErrors.bedCount)}
                  helperText={roomErrors.bedCount || ""}
                  sx={fieldSx(Boolean(roomErrors.bedCount))}
                />
              </Grid>

              {/* Seating / Guest Capacity (Bed-based) */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  👥 Max Guest Capacity (Bed-based) *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={roomModal.data?.seatingCapacity ?? ""}
                  onChange={(e) => {
                    setRoomErrors((prev) => ({ ...prev, seatingCapacity: "" }));
                    setRoomModal({ ...roomModal, data: { ...roomModal.data, seatingCapacity: e.target.value } });
                  }}
                  placeholder="e.g. 2, 3, 4"
                  error={Boolean(roomErrors.seatingCapacity)}
                  helperText={roomErrors.seatingCapacity || ""}
                  sx={fieldSx(Boolean(roomErrors.seatingCapacity))}
                />
              </Grid>

              {/* Custom Price */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  Daily Price per Night (₹)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={roomModal.data?.customPricePerNight ?? ""}
                  onChange={(e) => {
                    setRoomErrors((prev) => ({ ...prev, customPricePerNight: "" }));
                    setRoomModal({ ...roomModal, data: { ...roomModal.data, customPricePerNight: e.target.value } });
                  }}
                  placeholder="e.g. 2500"
                  error={Boolean(roomErrors.customPricePerNight)}
                  helperText={roomErrors.customPricePerNight || ""}
                  sx={fieldSx(Boolean(roomErrors.customPricePerNight))}
                />
              </Grid>

              {/* Initial Status */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  Operational Status
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={roomModal.data?.status || "AVAILABLE"}
                  onChange={(e) => setRoomModal({ ...roomModal, data: { ...roomModal.data, status: e.target.value } })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                >
                  <MenuItem value="AVAILABLE">AVAILABLE (Clean & Ready)</MenuItem>
                  <MenuItem value="CLEANING">CLEANING (Housekeeping)</MenuItem>
                  <MenuItem value="MAINTENANCE">MAINTENANCE (Repair Work)</MenuItem>
                  <MenuItem value="OCCUPIED">OCCUPIED (In-House Guest)</MenuItem>
                  <MenuItem value="BLOCKED">BLOCKED (Admin Lock)</MenuItem>
                </TextField>
              </Grid>

              {/* Notes */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  Notes & Special Features
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={roomModal.data?.notes || ""}
                  onChange={(e) => setRoomModal({ ...roomModal, data: { ...roomModal.data, notes: e.target.value } })}
                  placeholder="e.g. Garden facing balcony, near elevator..."
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>

              

              {/* =================================================== */}
              {/* INTERACTIVE AMENITIES BUILDER SECTION               */}
              {/* =================================================== */}
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    p: 2.2,
                    borderRadius: "16px",
                    bgcolor: themeConfig.bgMain,
                    border: `1px solid ${themeConfig.border}`,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                        ✨ Room Amenities ({roomModal.data?.amenities?.length || 0} Selected)
                      </Typography>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                        Click popular amenity badges below to add or remove them from this room.
                      </Typography>
                    </Box>
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => handleResetToCategoryAmenities(roomModal.data?.roomType)}
                      sx={{ fontSize: "0.72rem", fontWeight: 800, borderRadius: "8px" }}
                    >
                      Reset to Category Defaults
                    </Button>
                  </Box>

                  {/* Selected Amenities Chips */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mb: 2, minHeight: 36 }}>
                    {Array.isArray(roomModal.data?.amenities) && roomModal.data.amenities.length > 0 ? (
                      roomModal.data.amenities.map((am, i) => (
                        <Chip
                          key={i}
                          label={am}
                          onDelete={() => toggleRoomAmenity(am)}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: themeConfig.primary,
                            color: "#FFFFFF",
                            borderRadius: "8px",
                            boxShadow: `0 2px 6px ${themeConfig.primaryGlow}`,
                            "& .MuiChip-deleteIcon": { color: "rgba(255,255,255,0.8)", "&:hover": { color: "#FFFFFF" } },
                          }}
                        />
                      ))
                    ) : (
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontStyle: "italic", alignSelf: "center" }}>
                        No amenities selected for this room. Click popular amenities below or add custom.
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ my: 1.5, borderColor: themeConfig.border }} />

                  {/* Popular Amenity Quick-Add Pills */}
                  <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, display: "block", mb: 1 }}>
                    POPULAR AMENITY PRESETS (Click to Toggle):
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mb: 2 }}>
                    {POPULAR_AMENITIES.map((am, i) => {
                      const isSelected = Array.isArray(roomModal.data?.amenities) && roomModal.data.amenities.includes(am.label);
                      return (
                        <Chip
                          key={i}
                          icon={isSelected ? <Check sx={{ fontSize: "16px !important", color: "#FFFFFF !important" }} /> : React.cloneElement(am.icon, { sx: { fontSize: "16px !important", color: isDarkMode ? "#14B8A6 !important" : "inherit" } })}
                          label={am.label}
                          clickable
                          onClick={() => toggleRoomAmenity(am.label)}
                          size="small"
                          sx={{
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "0.75rem",
                            bgcolor: isSelected ? (themeConfig.primaryDark || "#115E59") : (isDarkMode ? "rgba(255,255,255,0.06)" : "#FFFFFF"),
                            color: isSelected ? "#FFFFFF" : themeConfig.textMain,
                            border: `1px solid ${isSelected ? themeConfig.primaryLight || themeConfig.primary : themeConfig.border}`,
                            transition: "all 0.15s ease",
                            "&:hover": {
                              bgcolor: isSelected ? themeConfig.primaryDark : (isDarkMode ? "rgba(255,255,255,0.12)" : themeConfig.champagne),
                            },
                          }}
                        />
                      );
                    })}
                  </Box>

                  {/* Add Custom Amenity Input */}
                  <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                    <TextField
                      size="small"
                      placeholder="Add custom amenity (e.g. PlayStation 5, Private Pool)..."
                      value={customAmenityInput}
                      onChange={(e) => setCustomAmenityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomRoomAmenity();
                        }
                      }}
                      sx={{ flexGrow: 1, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF" } }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddCustomRoomAmenity}
                      disabled={!customAmenityInput.trim()}
                      sx={{
                        borderRadius: "10px",
                        fontWeight: 800,
                        bgcolor: themeConfig.primary,
                        color: "#FFFFFF",
                        px: 2,
                        textTransform: "none",
                      }}
                    >
                      + Add
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, bgcolor: themeConfig.bgMain, flexDirection: { xs: "column-reverse", sm: "row" }, gap: 1, "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } } }}>
            <Button onClick={() => setRoomModal({ ...roomModal, open: false })} sx={{ borderRadius: "10px", fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="btn-3d"
              sx={{
                background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                color: "#FFFFFF",
                fontWeight: 900,
                borderRadius: "12px",
                px: 3.5,
                boxShadow: `0 4px 14px ${themeConfig.primaryGlow}`,
              }}
            >
              {roomModal.mode === "ADD" ? "Save & Create Room" : "Update Room"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* 3D MODAL: ADD / EDIT ROOM CATEGORY                                        */}
      {/* ========================================================================= */}
      <Dialog
        open={typeModal.open}
        onClose={() => setTypeModal({ ...typeModal, open: false })}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "22px",
              p: 1.5,
              border: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              boxShadow: isDarkMode ? "0 24px 50px rgba(0,0,0,0.6)" : "0 24px 48px -12px rgba(12, 39, 59, 0.22)",
            },
          },
        }}
      >
        <form noValidate onSubmit={submitCategory}>
          <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography component="div" variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                {typeModal.mode === "EDIT" ? `Edit Category "${typeModal.data?.name}"` : "Create New Room Category"}
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                Set category name and description.
              </Typography>
            </Box>
            <IconButton onClick={() => setTypeModal({ ...typeModal, open: false })} sx={{ borderRadius: "10px" }}>
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ borderColor: themeConfig.border }}>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Room Category Name"
                  fullWidth
                  size="small"
                  value={typeModal.data.name}
                  onChange={(e) => {
                    setTypeErrors((prev) => ({ ...prev, name: "" }));
                    setTypeModal({ ...typeModal, data: { ...typeModal.data, name: e.target.value } });
                  }}
                  placeholder="e.g. Deluxe Room, Executive Suite, Family Room"
                  error={Boolean(typeErrors.name)}
                  helperText={typeErrors.name || ""}
                  sx={fieldSx(Boolean(typeErrors.name))}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Category Description (Optional)"
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  value={typeModal.data.description || ""}
                  onChange={(e) => setTypeModal({ ...typeModal, data: { ...typeModal.data, description: e.target.value } })}
                  placeholder="King bed, sea view balcony, jacuzzi, complimentary buffet breakfast..."
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2, gap: 1, flexDirection: { xs: "column-reverse", sm: "row" }, "& .MuiButton-root": { width: { xs: "100%", sm: "auto" } } }}>
            <Button onClick={() => setTypeModal({ ...typeModal, open: false })} sx={{ borderRadius: "10px", fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="btn-3d"
              sx={{
                background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                color: "#FFFFFF",
                fontWeight: 800,
                borderRadius: "12px",
                px: 3,
                boxShadow: `0 4px 14px ${themeConfig.primaryGlow}`,
              }}
            >
              {typeModal.mode === "EDIT" ? "Update Category" : "Save Category"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* FREE TRIAL 5-ROOM LIMIT UPGRADE DIALOG                                    */}
      {/* ========================================================================= */}
      <Dialog
        open={trialLimitModalOpen}
        onClose={() => setTrialLimitModalOpen(false)}
        maxWidth="xs"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "24px",
              p: 1,
              bgcolor: isDarkMode ? "#0F172A" : "#FFFFFF",
              boxShadow: "0 24px 48px -12px rgba(0,0,0,0.3)",
            },
          },
        }}
      >
        <DialogTitle component="div" sx={{ textAlign: "center", pt: 3, pb: 1 }}>
          <Avatar
            sx={{
              width: 64,
              height: 64,
              mx: "auto",
              mb: 2,
              bgcolor: "rgba(245, 158, 11, 0.15)",
              color: "#F59E0B",
            }}
          >
            <Lock sx={{ fontSize: 34 }} />
          </Avatar>
          <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
            Free Trial Limit Reached (5/5 Rooms)
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ textAlign: "center", pb: 2 }}>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted, lineHeight: 1.6 }}>
            The <b>Free Trial</b> plan allows creating up to <b>5 custom rooms</b>. You currently have 5 rooms created.
          </Typography>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted, mt: 1.5, fontWeight: 600 }}>
            To create additional rooms and unlock unlimited room management, please upgrade to a Premium plan!
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "center", pb: 3, px: 3, gap: 1.5 }}>
          <Button
            onClick={() => setTrialLimitModalOpen(false)}
            variant="outlined"
            sx={{ borderRadius: "12px", fontWeight: 700, px: 2.5 }}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setTrialLimitModalOpen(false);
              if (typeof onTabChange === "function") {
                onTabChange("subscriptions");
              }
            }}
            variant="contained"
            className="btn-3d"
            sx={{
              borderRadius: "12px",
              fontWeight: 900,
              px: 3,
              bgcolor: "#F59E0B",
              color: "#FFFFFF",
              "&:hover": { bgcolor: "#D97706" },
            }}
          >
            Upgrade to Premium Plan →
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
