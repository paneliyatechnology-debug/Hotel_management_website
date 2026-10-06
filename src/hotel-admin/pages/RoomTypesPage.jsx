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
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Tooltip,
  Avatar,
  Tab,
  Tabs,
  Badge,
  Switch,
  FormControlLabel,
} from "@mui/material";
import {
  Add,
  Close,
  Search,
  Edit,
  Delete,
  MeetingRoom,
  Layers,
  People,
  CurrencyRupee,
  CleaningServices,
  Build,
  CheckCircle,
  AutoAwesome,
  EventSeat,
  Hotel as HotelIcon,
  FilterList,
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
  ViewModule,
  ViewList,
  ReceiptLong,
  Percent,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import { getAmenityIcon } from "@/shared/utils/amenityUtils";
import { calculateSingleRoomGST } from "@/shared/utils/gstUtils";

// Reusable Room GST Configuration Section Component
export function RoomGstFields({ formData = {}, setFormData, basePrice = 0, themeConfig, isDarkMode }) {
  const gstEnabled = formData.gstEnabled !== false;
  const gstRate = Number(formData.gstRate) ?? 18;
  const taxInclusive = Boolean(formData.taxInclusive);

  const calculated = calculateSingleRoomGST({
    basePrice,
    gstEnabled,
    gstRate,
    taxInclusive,
    nights: 1,
  });

  const handleRateSelect = (rate) => {
    const numericRate = Number(rate);
    const half = numericRate / 2;
    if (typeof setFormData === "function") {
      setFormData((prev) => ({
        ...prev,
        data: {
          ...prev.data,
          gstEnabled: numericRate > 0,
          gstRate: numericRate,
          cgstRate: half,
          sgstRate: half,
        },
      }));
    }
  };

  return (
    <Box sx={{ p: 2, borderRadius: "16px", bgcolor: themeConfig.bgMain, border: `1px solid ${themeConfig.border}` }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <ReceiptLong sx={{ color: themeConfig.primary }} />
          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
            Room GST / CGST / SGST Tax Configuration
          </Typography>
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={gstEnabled}
              onChange={(e) => {
                const checked = e.target.checked;
                if (typeof setFormData === "function") {
                  setFormData((prev) => ({
                    ...prev,
                    data: {
                      ...prev.data,
                      gstEnabled: checked,
                      gstRate: checked ? (prev.data?.gstRate || 18) : 0,
                      cgstRate: checked ? ((prev.data?.gstRate || 18) / 2) : 0,
                      sgstRate: checked ? ((prev.data?.gstRate || 18) / 2) : 0,
                    },
                  }));
                }
              }}
              color="primary"
            />
          }
          label={
            <Typography variant="caption" sx={{ fontWeight: 800, color: gstEnabled ? themeConfig.primary : themeConfig.textMuted }}>
              GST {gstEnabled ? "ENABLED" : "DISABLED (0%)"}
            </Typography>
          }
        />
      </Box>

      {gstEnabled && (
        <Grid container spacing={2}>
          {/* Preset GST Rate options & Tax Mode */}
          <Grid size={{ xs: 12, sm: 7 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, display: "block", mb: 0.8 }}>
              SELECT GST RATE % *
            </Typography>
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", mb: 1.5 }}>
              {[0, 5, 12, 18].map((rate) => (
                <Chip
                  key={rate}
                  label={`${rate}% GST`}
                  clickable
                  onClick={() => handleRateSelect(rate)}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.78rem",
                    bgcolor: gstRate === rate ? themeConfig.primary : (isDarkMode ? "rgba(255,255,255,0.06)" : "#FFFFFF"),
                    color: gstRate === rate ? "#FFFFFF" : themeConfig.textMain,
                    border: `1px solid ${gstRate === rate ? themeConfig.primary : themeConfig.border}`,
                  }}
                />
              ))}
            </Box>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 6 }}>
                <TextField
                  label="GST Rate (%)"
                  type="number"
                  size="small"
                  fullWidth
                  value={formData.gstRate ?? 18}
                  onChange={(e) => {
                    const val = Math.max(0, Number(e.target.value) || 0);
                    handleRateSelect(val);
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  select
                  label="Tax Calculation Mode"
                  size="small"
                  fullWidth
                  value={taxInclusive ? "INCLUSIVE" : "EXCLUSIVE"}
                  onChange={(e) => {
                    const isInc = e.target.value === "INCLUSIVE";
                    if (typeof setFormData === "function") {
                      setFormData((prev) => ({
                        ...prev,
                        data: {
                          ...prev.data,
                          taxInclusive: isInc,
                        },
                      }));
                    }
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                >
                  <MenuItem value="EXCLUSIVE">Exclusive (Base + GST)</MenuItem>
                  <MenuItem value="INCLUSIVE">Inclusive (Tax inside price)</MenuItem>
                </TextField>
              </Grid>
            </Grid>

            {/* Split Read-only indicator */}
            <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
              <Chip
                label={`CGST: ${calculated.cgstRate}%`}
                size="small"
                sx={{ fontWeight: 800, bgcolor: themeConfig.champagne, color: themeConfig.primaryDark }}
              />
              <Chip
                label={`SGST: ${calculated.sgstRate}%`}
                size="small"
                sx={{ fontWeight: 800, bgcolor: themeConfig.champagne, color: themeConfig.primaryDark }}
              />
            </Box>
          </Grid>

          {/* Dynamic Live Tax Preview Card (Requirement #3) */}
          <Grid size={{ xs: 12, sm: 5 }}>
            <Card
              sx={{
                p: 1.8,
                borderRadius: "14px",
                bgcolor: isDarkMode ? "#092420" : "#F0FDF4",
                border: `1px solid ${isDarkMode ? "rgba(16,185,129,0.3)" : "#BBF7D0"}`,
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.primaryDark, display: "block", mb: 1, letterSpacing: 0.5 }}>
                📊 LIVE ROOM TAX BREAKDOWN
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Base Price:</Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain }}>₹{calculated.taxableAmount.toLocaleString("en-IN")}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>GST ({calculated.gstRate}%):</Typography>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.primary }}>Total ₹{calculated.gstAmount.toLocaleString("en-IN")}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.4, pl: 1 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>• CGST ({calculated.cgstRate}%):</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain }}>₹{calculated.cgstAmount.toLocaleString("en-IN")}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.8, pl: 1 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>• SGST ({calculated.sgstRate}%):</Typography>
                <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain }}>₹{calculated.sgstAmount.toLocaleString("en-IN")}</Typography>
              </Box>
              <Divider sx={{ my: 0.6, borderColor: themeConfig.border }} />
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.textMain }}>Final Price:</Typography>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.primaryDark }}>₹{calculated.finalAmount.toLocaleString("en-IN")}/night</Typography>
              </Box>
            </Card>
          </Grid>
        </Grid>
      )}
    </Box>
  );
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

  // Active View Tabs:
  // 0: Category-Wise Grouped View
  // 1: All Rooms Master Inventory Table
  // 2: Room Categories & Tariffs Master
  const [activeTab, setActiveTab] = useState(0);

  const [roomSearch, setRoomSearch] = useState("");
  const [floorFilter, setFloorFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");

  // Custom Amenity Input state for Room Modal & Type Modal
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [customTypeAmenityInput, setCustomTypeAmenityInput] = useState("");
  const [trialLimitModalOpen, setTrialLimitModalOpen] = useState(false);

  const isTrial = (subscription?.plan || "TRIAL") === "TRIAL" || (subscription?.status || "TRIAL") === "TRIAL";

  // Summary Metrics
  const totalRoomsCount = rooms.length;
  const availableRoomsCount = rooms.filter((r) => r.status === "AVAILABLE").length;
  const occupiedRoomsCount = rooms.filter((r) => r.status === "OCCUPIED" || r.status === "RESERVED").length;
  const maintenanceRoomsCount = rooms.filter((r) => r.status === "MAINTENANCE" || r.status === "CLEANING" || r.status === "BLOCKED").length;

  // Distinct Floors
  const availableFloors = Array.from(new Set(rooms.map((r) => r.floor || 1))).sort((a, b) => a - b);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Helper to open Add Room modal with preselected Category
  const handleOpenAddRoomForCategory = (category) => {
    if (isTrial && rooms.length >= 5) {
      setTrialLimitModalOpen(true);
      return;
    }

    const catId = category?._id || roomTypes[0]?._id || "";
    const catAmenities = category?.amenities?.length
      ? [...category.amenities]
      : ["Free High-Speed WiFi", "Air Conditioner (AC)", "Smart 4K LED TV", "Attached Bathroom & Geyser"];

    setRoomModal({
      open: true,
      mode: "ADD",
      data: {
        _id: "",
        roomNumber: "",
        roomType: catId,
        floor: 1,
        bedCount: category?.bedCount || 1,
        bedType: category?.bedType || "1 King Size Bed",
        seatingCapacity: category?.capacity?.adults || 2,
        customPricePerNight: "",
        status: "AVAILABLE",
        notes: "",
        amenities: catAmenities,
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

  // Filtered Rooms
  const filteredRooms = rooms.filter((r) => {
    const q = roomSearch.toLowerCase();
    const roomTypeObj = typeof r.roomType === "object" ? r.roomType : roomTypes.find((t) => t._id === r.roomType);
    const typeName = (roomTypeObj?.name || "").toLowerCase();
    const roomNum = (r.roomNumber || "").toLowerCase();
    const notes = (r.notes || "").toLowerCase();
    const amenitiesText = (r.amenities || roomTypeObj?.amenities || []).join(" ").toLowerCase();

    const matchesSearch = roomNum.includes(q) || typeName.includes(q) || notes.includes(q) || amenitiesText.includes(q);
    const matchesFloor = floorFilter === "ALL" || String(r.floor || 1) === String(floorFilter);
    const matchesStatus = statusFilter === "ALL" || r.status === statusFilter;
    const matchesCategory = categoryFilter === "ALL" || (roomTypeObj?._id === categoryFilter || roomTypeObj?.name === categoryFilter);

    return matchesSearch && matchesFloor && matchesStatus && matchesCategory;
  });

  const paginatedRooms = filteredRooms.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

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
              {isTrial && (
                <Chip
                  label={`Free Trial: ${totalRoomsCount}/5 Rooms`}
                  size="small"
                  sx={{
                    bgcolor: totalRoomsCount >= 5 ? "#EF4444" : "#F59E0B",
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

      {/* ========================================================================= */}
      {/* 3D SEGMENTED TAB SWITCHER                                                 */}
      {/* ========================================================================= */}
      <Paper
        className="card-3d"
        sx={{
          p: 0.8,
          mb: 3,
          borderRadius: "16px",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "0 6px 18px rgba(0,0,0,0.3)" : "0 6px 18px rgba(12, 39, 59, 0.05)",
          display: "flex",
          width: "100%",
          maxWidth: "100%",
          overflowX: "auto",
          WebkitOverflowScrolling: "touch",
          "&::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: "auto",
            width: "100%",
            "& .MuiTabs-indicator": { display: "none" },
          }}
        >
          <Tab
            label={`🏷️ Category-Wise Rooms (${roomTypes.length})`}
            sx={{
              fontWeight: 800,
              fontSize: "0.85rem",
              borderRadius: "12px",
              py: 1,
              px: { xs: 1.5, sm: 2.5 },
              minHeight: "auto",
              whiteSpace: "nowrap",
              flexShrink: 0,
              color: activeTab === 0 ? "#FFFFFF" : themeConfig.textMuted,
              bgcolor: activeTab === 0 ? themeConfig.primary : "transparent",
              boxShadow: activeTab === 0 ? `0 4px 12px ${themeConfig.primaryGlow}` : "none",
              transition: "all 0.2s ease",
            }}
          />
          <Tab
            label={`🏨 Inventory Table (${rooms.length})`}
            sx={{
              fontWeight: 800,
              fontSize: "0.85rem",
              borderRadius: "12px",
              py: 1,
              px: { xs: 1.5, sm: 2.5 },
              minHeight: "auto",
              whiteSpace: "nowrap",
              flexShrink: 0,
              color: activeTab === 1 ? "#FFFFFF" : themeConfig.textMuted,
              bgcolor: activeTab === 1 ? themeConfig.primary : "transparent",
              boxShadow: activeTab === 1 ? `0 4px 12px ${themeConfig.primaryGlow}` : "none",
              transition: "all 0.2s ease",
            }}
          />
          <Tab
            label={`⚙️ Categories Master (${roomTypes.length})`}
            sx={{
              fontWeight: 800,
              fontSize: "0.85rem",
              borderRadius: "12px",
              py: 1,
              px: { xs: 1.5, sm: 2.5 },
              minHeight: "auto",
              whiteSpace: "nowrap",
              flexShrink: 0,
              color: activeTab === 2 ? "#FFFFFF" : themeConfig.textMuted,
              bgcolor: activeTab === 2 ? themeConfig.primary : "transparent",
              boxShadow: activeTab === 2 ? `0 4px 12px ${themeConfig.primaryGlow}` : "none",
              transition: "all 0.2s ease",
            }}
          />
        </Tabs>
      </Paper>

      {/* ========================================================================= */}
      {/* TAB 0: CATEGORY-WISE GROUPED VIEW                                         */}
      {/* ========================================================================= */}
      {activeTab === 0 && (
        <Box>
          {roomTypes.length === 0 ? (
            <Card
              className="card-3d"
              sx={{
                p: 4,
                borderRadius: "20px",
                border: `1px solid ${themeConfig.border}`,
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                boxShadow: isDarkMode ? "0 10px 25px -5px rgba(0,0,0,0.4)" : "0 10px 25px -5px rgba(12, 39, 59, 0.08)",
              }}
            >
              <EmptyState
                title="No Room Categories Created"
                description="Please create your first Room Category (e.g., Deluxe Room, Suite) to start organizing category-wise rooms."
              />
              <Box sx={{ display: "flex", justifyContent: "center", mt: 2 }}>
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
                  sx={{
                    background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                    borderRadius: "12px",
                    fontWeight: 800,
                  }}
                >
                  Create First Category
                </Button>
              </Box>
            </Card>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
              {roomTypes.map((cat) => {
                const catRooms = rooms.filter((r) => {
                  const typeId = typeof r.roomType === "object" ? r.roomType?._id : r.roomType;
                  return typeId === cat._id;
                });
                const catAmenities = Array.isArray(cat.amenities) && cat.amenities.length > 0
                  ? cat.amenities
                  : ["Free WiFi", "Air Conditioner (AC)", "Smart TV", "Attached Bathroom"];
                const catBasePrice = cat.basePrice > 0
                  ? cat.basePrice
                  : (catRooms.find((r) => (r.customPricePerNight || r.basePrice) > 0)?.customPricePerNight ||
                     catRooms.find((r) => (r.customPricePerNight || r.basePrice) > 0)?.basePrice ||
                     cat.basePrice ||
                     0);

                return (
                  <Paper
                    key={cat._id}
                    className="card-3d"
                    sx={{
                      p: { xs: 2, sm: 3 },
                      borderRadius: "22px",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                      boxShadow: isDarkMode ? "0 10px 28px -6px rgba(0,0,0,0.4)" : "0 10px 28px -6px rgba(12, 39, 59, 0.07), inset 0 1px 1px #FFFFFF",
                      transition: "all 0.25s ease",
                    }}
                  >
                    {/* Category Header Strip */}
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 2,
                        pb: 2,
                        mb: 2.5,
                        borderBottom: `1px solid ${themeConfig.border}`,
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                        <Avatar
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: "14px",
                            bgcolor: `${themeConfig.primary}18`,
                            color: themeConfig.primary,
                            fontWeight: 900,
                            boxShadow: `0 4px 12px ${themeConfig.primaryGlow}`,
                          }}
                        >
                          <Category sx={{ fontSize: 24 }} />
                        </Avatar>
                        <Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                              {cat.name}
                            </Typography>
                            <Chip
                              label={`Base: ₹${catBasePrice.toLocaleString("en-IN")}/night`}
                              size="small"
                              sx={{
                                bgcolor: themeConfig.champagne,
                                color: themeConfig.primaryDark,
                                fontWeight: 800,
                                fontSize: "0.75rem",
                                border: `1px solid ${themeConfig.border}`,
                              }}
                            />
                            <Chip
                              label={`👥 Max ${cat.capacity?.adults || 2} Adults, ${cat.capacity?.children || 1} Children`}
                              size="small"
                              sx={{
                                bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                                color: themeConfig.textMain,
                                fontWeight: 700,
                                fontSize: "0.72rem",
                              }}
                            />
                            <Chip
                              label={`🏨 ${catRooms.length} Rooms Assigned`}
                              size="small"
                              sx={{
                                bgcolor: catRooms.length > 0 ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                                color: catRooms.length > 0 ? "#10B981" : "#EF4444",
                                fontWeight: 800,
                                fontSize: "0.72rem",
                                border: `1px solid ${catRooms.length > 0 ? "rgba(16, 185, 129, 0.3)" : "rgba(239, 68, 68, 0.3)"}`,
                              }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ color: themeConfig.textMuted, mt: 0.5 }}>
                            {cat.description || "Standard room configuration with premium amenities."}
                          </Typography>
                        </Box>
                      </Box>

                      {/* Action buttons for this category */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<Add />}
                          onClick={() => handleOpenAddRoomForCategory(cat)}
                          sx={{
                            background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                            color: "#FFFFFF",
                            fontWeight: 800,
                            borderRadius: "10px",
                            px: 2,
                            py: 0.8,
                            fontSize: "0.8rem",
                            whiteSpace: "nowrap",
                            flexGrow: { xs: 1, sm: 0 },
                            boxShadow: `0 4px 12px ${themeConfig.primaryGlow}`,
                          }}
                        >
                          Add Room to {cat.name}
                        </Button>

                        <Tooltip title="Edit Category Details & Default Amenities">
                          <IconButton
                            size="small"
                            onClick={() =>
                              setTypeModal({
                                open: true,
                                mode: "EDIT",
                                data: {
                                  _id: cat._id,
                                  name: cat.name,
                                  basePrice: cat.basePrice,
                                  maxAdults: cat.capacity?.adults || 2,
                                  maxChildren: cat.capacity?.children || 1,
                                  description: cat.description || "",
                                  amenities: cat.amenities || [],
                                  gstEnabled: cat.gstEnabled !== false,
                                  gstRate: cat.gstRate ?? 18,
                                  cgstRate: cat.cgstRate ?? (cat.gstRate ? cat.gstRate / 2 : 9),
                                  sgstRate: cat.sgstRate ?? (cat.gstRate ? cat.gstRate / 2 : 9),
                                  taxInclusive: Boolean(cat.taxInclusive),
                                },
                              })
                            }
                            sx={{
                              bgcolor: themeConfig.infoBg,
                              color: themeConfig.info,
                              borderRadius: "10px",
                              border: `1px solid ${themeConfig.info}30`,
                              "&:hover": {
                                bgcolor: "rgba(11, 142, 224, 0.2)",
                              },
                            }}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={`Delete Category '${cat.name}' & All Associated Rooms`}>
                          <IconButton
                            size="small"
                            onClick={() => onDeleteRoomType && onDeleteRoomType(cat)}
                            sx={{
                              bgcolor: "rgba(220, 38, 38, 0.1)",
                              color: themeConfig.danger,
                              borderRadius: "10px",
                              border: "1px solid rgba(220, 38, 38, 0.25)",
                              "&:hover": {
                                bgcolor: "rgba(220, 38, 38, 0.2)",
                                borderColor: themeConfig.danger,
                              },
                            }}
                          >
                            <Delete fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Category Default Amenities Badges Strip */}
                    <Box sx={{ mb: 2.5, p: 1.5, borderRadius: "14px", bgcolor: themeConfig.bgMain, border: `1px dashed ${themeConfig.border}` }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, mb: 1, display: "block", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        ✨ Category Amenities (Inherited by rooms):
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                        {catAmenities.map((am, i) => (
                          <Chip
                            key={i}
                            label={am}
                            size="small"
                            sx={{
                              bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#FFFFFF",
                              color: themeConfig.textMain,
                              fontWeight: 700,
                              fontSize: "0.74rem",
                              border: `1px solid ${themeConfig.border}`,
                              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    {/* Rooms Assigned to this Category */}
                    {catRooms.length === 0 ? (
                      <Box sx={{ p: 3, textAlign: "center", bgcolor: themeConfig.bgMain, borderRadius: "14px", border: `1px solid ${themeConfig.border}` }}>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMuted }}>
                          No rooms created under &quot;{cat.name}&quot; yet.
                        </Typography>
                        <Button
                          size="small"
                          startIcon={<Add />}
                          onClick={() => handleOpenAddRoomForCategory(cat)}
                          sx={{ mt: 1, fontWeight: 800, color: themeConfig.primary }}
                        >
                          Create First Room (e.g. 101)
                        </Button>
                      </Box>
                    ) : (
                      <Grid container spacing={2}>
                        {catRooms.map((room) => {
                          const effectiveTariff = room.customPricePerNight || cat.basePrice || room.basePrice || 0;
                          const roomAmenities = Array.isArray(room.amenities) && room.amenities.length > 0
                            ? room.amenities
                            : catAmenities;

                          const roomGstCalc = calculateSingleRoomGST({
                            basePrice: effectiveTariff,
                            gstEnabled: room.gstEnabled !== false && (room.gstEnabled !== undefined || cat.gstEnabled !== false),
                            gstRate: room.gstRate ?? cat.gstRate ?? 18,
                            taxInclusive: room.taxInclusive ?? cat.taxInclusive ?? false,
                            nights: 1,
                          });

                          return (
                            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={room._id || room.roomNumber}>
                              <Card
                                sx={{
                                  borderRadius: "16px",
                                  border: `1px solid ${themeConfig.border}`,
                                  bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                                  p: 2,
                                  height: "100%",
                                  display: "flex",
                                  flexDirection: "column",
                                  justifyContent: "space-between",
                                  transition: "all 0.2s ease",
                                  boxShadow: isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(12, 39, 59, 0.04)",
                                  "&:hover": {
                                    transform: "translateY(-3px)",
                                    boxShadow: `0 8px 20px ${themeConfig.primaryGlow}`,
                                    borderColor: themeConfig.primary,
                                  },
                                }}
                              >
                                <Box>
                                  {/* Top Room No & Status */}
                                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                      <Avatar
                                        sx={{
                                          width: 36,
                                          height: 36,
                                          borderRadius: "10px",
                                          bgcolor: themeConfig.primary,
                                          color: "#FFFFFF",
                                          fontWeight: 900,
                                          fontSize: "0.9rem",
                                        }}
                                      >
                                        {room.roomNumber}
                                      </Avatar>
                                      <Box>
                                        <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                                          Room {room.roomNumber}
                                        </Typography>
                                        <Chip
                                          label={`Floor ${room.floor || 1}`}
                                          size="small"
                                          sx={{ height: 18, fontSize: "0.65rem", fontWeight: 800, bgcolor: themeConfig.champagne }}
                                        />
                                      </Box>
                                    </Box>
                                    <StatusChip status={room.status || "AVAILABLE"} size="small" />
                                  </Box>

                                  {/* Requirement #3: Pricing & GST Tax Breakdown Box */}
                                  <Box sx={{ mb: 1.5, p: 1.2, borderRadius: "10px", bgcolor: themeConfig.bgMain, border: `1px solid ${themeConfig.border}` }}>
                                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.3 }}>
                                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                                        Base Price:
                                      </Typography>
                                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                        ₹{roomGstCalc.taxableAmount.toLocaleString("en-IN")}/night
                                      </Typography>
                                    </Box>

                                    {roomGstCalc.gstEnabled ? (
                                      <>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.3 }}>
                                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                                            GST ({roomGstCalc.gstRate}%):
                                          </Typography>
                                          <Chip
                                            label={`CGST ${roomGstCalc.cgstRate}% | SGST ${roomGstCalc.sgstRate}%`}
                                            size="small"
                                            sx={{ height: 16, fontSize: "0.6rem", fontWeight: 800, bgcolor: themeConfig.champagne, color: themeConfig.primaryDark }}
                                          />
                                        </Box>
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.3 }}>
                                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                                            Total Tax:
                                          </Typography>
                                          <Typography variant="caption" sx={{ fontWeight: 800, color: "#D97706" }}>
                                            +₹{roomGstCalc.totalTax.toLocaleString("en-IN")}
                                          </Typography>
                                        </Box>
                                        <Divider sx={{ my: 0.4, borderColor: themeConfig.border }} />
                                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                          <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                                            Final Price:
                                          </Typography>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.primaryDark || "#0F766E" }}>
                                            ₹{roomGstCalc.finalAmount.toLocaleString("en-IN")}/night
                                          </Typography>
                                        </Box>
                                      </>
                                    ) : (
                                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 0.3 }}>
                                        <Chip label="No GST (0%)" size="small" sx={{ height: 18, fontSize: "0.65rem", bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#E5E7EB" }} />
                                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                                          ₹{roomGstCalc.finalAmount.toLocaleString("en-IN")}/night
                                        </Typography>
                                      </Box>
                                    )}
                                  </Box>

                                  {/* Room Amenities Badges */}
                                  <Box sx={{ mb: 1.5 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, fontSize: "0.68rem" }}>
                                      AMENITIES:
                                    </Typography>
                                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.4 }}>
                                      {roomAmenities.slice(0, 3).map((am, i) => (
                                        <Chip
                                          key={i}
                                          icon={getAmenityIcon(am, 12)}
                                          label={am}
                                          size="small"
                                          sx={{
                                            height: 22,
                                            fontSize: "0.65rem",
                                            fontWeight: 700,
                                            bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6",
                                            color: themeConfig.textMain,
                                            border: `1px solid ${themeConfig.border}`,
                                            "& .MuiChip-icon": {
                                              color: `${themeConfig.primary} !important`,
                                            },
                                          }}
                                        />
                                      ))}
                                      {roomAmenities.length > 3 && (
                                        <Tooltip title={roomAmenities.slice(3).join(", ")}>
                                          <Chip
                                            label={`+${roomAmenities.length - 3} more`}
                                            size="small"
                                            sx={{
                                              height: 20,
                                              fontSize: "0.65rem",
                                              fontWeight: 800,
                                              bgcolor: themeConfig.champagne,
                                              color: themeConfig.primaryDark,
                                            }}
                                          />
                                        </Tooltip>
                                      )}
                                    </Box>
                                  </Box>

                                  {room.notes && (
                                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", fontStyle: "italic", mb: 1 }}>
                                      &quot;{room.notes}&quot;
                                    </Typography>
                                  )}
                                </Box>

                                {/* Room Action Buttons */}
                                <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, pt: 1, borderTop: `1px solid ${themeConfig.border}` }}>
                                  <Tooltip title="Edit Room">
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
                                            amenities: room.amenities || catAmenities,
                                            gstEnabled: room.gstEnabled !== false,
                                            gstRate: room.gstRate ?? cat.gstRate ?? 18,
                                            cgstRate: room.cgstRate ?? (room.gstRate ? room.gstRate / 2 : 9),
                                            sgstRate: room.sgstRate ?? (room.gstRate ? room.gstRate / 2 : 9),
                                            taxInclusive: Boolean(room.taxInclusive ?? cat.taxInclusive),
                                          },
                                        })
                                      }
                                      sx={{
                                        color: themeConfig.info,
                                        bgcolor: themeConfig.infoBg,
                                        borderRadius: "8px",
                                      }}
                                    >
                                      <Edit fontSize="small" sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>

                                  <Tooltip title="Delete Room">
                                    <IconButton
                                      size="small"
                                      onClick={() => onDeleteRoom && onDeleteRoom(room)}
                                      sx={{
                                        color: themeConfig.danger,
                                        bgcolor: themeConfig.dangerBg,
                                        borderRadius: "8px",
                                      }}
                                    >
                                      <Delete fontSize="small" sx={{ fontSize: 16 }} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Card>
                            </Grid>
                          );
                        })}
                      </Grid>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: ALL ROOMS MASTER INVENTORY TABLE                                   */}
      {/* ========================================================================= */}
      {activeTab === 1 && (
        <Box>
          {/* Filter & Search Strip */}
          <Paper
            className="card-3d"
            sx={{
              p: 2,
              mb: 3,
              borderRadius: "18px",
              border: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              boxShadow: isDarkMode ? "0 6px 20px rgba(0,0,0,0.3)" : "0 6px 20px rgba(12, 39, 59, 0.04)",
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <TextField
              size="small"
              placeholder="Search room number, category, amenities..."
              value={roomSearch}
              onChange={(e) => {
                setRoomSearch(e.target.value);
                setPage(0);
              }}
              sx={{
                width: { xs: "100%", sm: "300px" },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: themeConfig.bgMain,
                },
              }}
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

            {/* Category Filter */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "nowrap",
                alignItems: "center",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                width: "100%",
                py: 0.5,
                "&::-webkit-scrollbar": { display: "none" },
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, mr: 0.5, whiteSpace: "nowrap", flexShrink: 0 }}>
                CATEGORY:
              </Typography>
              <Chip
                label="All Categories"
                clickable
                onClick={() => {
                  setCategoryFilter("ALL");
                  setPage(0);
                }}
                size="small"
                sx={{
                  fontWeight: 800,
                  borderRadius: "8px",
                  fontSize: "0.75rem",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  bgcolor: categoryFilter === "ALL" ? themeConfig.primary : themeConfig.champagne,
                  color: categoryFilter === "ALL" ? "#FFFFFF" : themeConfig.primaryDark,
                }}
              />
              {roomTypes.map((cat) => {
                const isSelected = categoryFilter === cat._id;
                return (
                  <Chip
                    key={cat._id}
                    label={cat.name}
                    clickable
                    onClick={() => {
                      setCategoryFilter(cat._id);
                      setPage(0);
                    }}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                      bgcolor: isSelected ? themeConfig.primary : themeConfig.champagne,
                      color: isSelected ? "#FFFFFF" : themeConfig.primaryDark,
                    }}
                  />
                );
              })}
            </Box>

            {/* Floor Filters */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "nowrap",
                alignItems: "center",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                width: "100%",
                py: 0.5,
                "&::-webkit-scrollbar": { display: "none" },
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, mr: 0.5, whiteSpace: "nowrap", flexShrink: 0 }}>
                FLOOR:
              </Typography>
              {["ALL", ...availableFloors].map((fl) => {
                const isSelected = floorFilter === String(fl);
                return (
                  <Chip
                    key={fl}
                    label={fl === "ALL" ? "All" : `F${fl}`}
                    clickable
                    onClick={() => {
                      setFloorFilter(String(fl));
                      setPage(0);
                    }}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      borderRadius: "8px",
                      fontSize: "0.75rem",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                      bgcolor: isSelected ? themeConfig.primaryDark : themeConfig.champagne,
                      color: isSelected ? "#FFFFFF" : themeConfig.primaryDark,
                    }}
                  />
                );
              })}
            </Box>

            {/* Status Filter */}
            <Box
              sx={{
                display: "flex",
                gap: 1,
                flexWrap: "nowrap",
                alignItems: "center",
                overflowX: "auto",
                WebkitOverflowScrolling: "touch",
                width: "100%",
                py: 0.5,
                "&::-webkit-scrollbar": { display: "none" },
                msOverflowStyle: "none",
                scrollbarWidth: "none",
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, mr: 0.5, whiteSpace: "nowrap", flexShrink: 0 }}>
                STATUS:
              </Typography>
              {["ALL", "AVAILABLE", "OCCUPIED", "CLEANING", "MAINTENANCE"].map((st) => {
                const isSelected = statusFilter === st;
                return (
                  <Chip
                    key={st}
                    label={st === "ALL" ? "All" : st}
                    clickable
                    onClick={() => {
                      setStatusFilter(st);
                      setPage(0);
                    }}
                    size="small"
                    sx={{
                      fontWeight: 800,
                      borderRadius: "8px",
                      fontSize: "0.72rem",
                      flexShrink: 0,
                      whiteSpace: "nowrap",
                      bgcolor: isSelected ? themeConfig.primaryDark : themeConfig.champagne,
                      color: isSelected ? "#FFFFFF" : themeConfig.primaryDark,
                    }}
                  />
                );
              })}
            </Box>
          </Paper>

          {/* Rooms Inventory Master Table */}
          <TableContainer
            component={Paper}
            className="card-3d"
            sx={{
              borderRadius: "20px",
              border: `1px solid ${themeConfig.border}`,
              boxShadow: "0 10px 30px -5px rgba(12, 39, 59, 0.08), inset 0 1px 1px #FFFFFF",
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: { xs: "520px", md: "calc(100vh - 280px)" },
              mb: 4,
            }}
          >
            <Table stickyHeader sx={{ minWidth: 950 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.6, whiteSpace: "nowrap" }}>Room & Floor</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Room Category</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Capacity & Tariff</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Room Amenities</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRooms.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 6, textAlign: "center" }}>
                      <EmptyState
                        title="No Rooms Found"
                        description="No rooms match your filter criteria or no rooms have been created yet."
                      />
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedRooms.map((room) => {
                    const roomTypeObj = typeof room.roomType === "object" ? room.roomType : roomTypes.find((t) => t._id === room.roomType);
                    const effectivePrice = room.customPricePerNight || roomTypeObj?.basePrice || room.basePrice || 0;
                    const seating = room.seatingCapacity || roomTypeObj?.capacity?.adults || 2;
                    const roomAmenities = Array.isArray(room.amenities) && room.amenities.length > 0
                      ? room.amenities
                      : (roomTypeObj?.amenities || []);

                    return (
                      <TableRow
                        key={room._id || room.roomNumber}
                        hover
                        sx={{
                          transition: "all 0.2s ease",
                          "&:hover": { bgcolor: "rgba(11, 142, 224, 0.04)" },
                        }}
                      >
                        {/* Room Number & Floor */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                            <Avatar
                              sx={{
                                width: 40,
                                height: 40,
                                borderRadius: "10px",
                                bgcolor: themeConfig.primary,
                                color: "#FFFFFF",
                                fontWeight: 900,
                                fontSize: "0.95rem",
                                boxShadow: `0 4px 10px ${themeConfig.primaryGlow}`,
                              }}
                            >
                              {room.roomNumber}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                                Room {room.roomNumber}
                              </Typography>
                              <Chip
                                label={`Floor ${room.floor || 1}`}
                                size="small"
                                sx={{
                                  fontSize: "0.68rem",
                                  fontWeight: 800,
                                  height: "18px",
                                  bgcolor: themeConfig.champagne,
                                  color: themeConfig.primaryDark,
                                  mt: 0.3,
                                }}
                              />
                            </Box>
                          </Box>
                        </TableCell>

                        {/* Room Category */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primaryDark }}>
                            {roomTypeObj?.name || "Standard Room"}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                            {roomTypeObj?.description?.slice(0, 32) || "Standard suite"}...
                          </Typography>
                        </TableCell>

                        {/* Capacity, Bed & Tariff */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                            ₹{effectivePrice.toLocaleString("en-IN")}
                            <Typography component="span" variant="caption" sx={{ color: themeConfig.textMuted, ml: 0.5 }}>
                              / night
                            </Typography>
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMain, fontWeight: 800, display: "block" }}>
                            👥 {seating} Guests • 🛏️ {room.bedType || `${room.bedCount || 1} Bed`}
                          </Typography>
                        </TableCell>

                        {/* Room Amenities */}
                        <TableCell sx={{ maxWidth: 300 }}>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5 }}>
                            {roomAmenities.slice(0, 3).map((am, i) => (
                              <Chip
                                key={i}
                                icon={getAmenityIcon(am, 12)}
                                label={am}
                                size="small"
                                sx={{
                                  height: 22,
                                  fontSize: "0.65rem",
                                  fontWeight: 700,
                                  bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "#F3F4F6",
                                  color: themeConfig.textMain,
                                  border: `1px solid ${themeConfig.border}`,
                                  "& .MuiChip-icon": {
                                    color: `${themeConfig.primary} !important`,
                                  },
                                }}
                              />
                            ))}
                            {roomAmenities.length > 3 && (
                              <Tooltip title={roomAmenities.slice(3).join(", ")}>
                                <Chip
                                  label={`+${roomAmenities.length - 3}`}
                                  size="small"
                                  sx={{
                                    height: 20,
                                    fontSize: "0.65rem",
                                    fontWeight: 800,
                                    bgcolor: themeConfig.champagne,
                                    color: themeConfig.primaryDark,
                                  }}
                                />
                              </Tooltip>
                            )}
                          </Box>
                        </TableCell>

                        {/* Status */}
                        <TableCell sx={{ whiteSpace: "nowrap" }}>
                          <StatusChip status={room.status || "AVAILABLE"} size="small" />
                        </TableCell>

                        {/* Actions */}
                        <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                            <Tooltip title="Edit Room Details & Amenities">
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
                                      amenities: room.amenities || roomTypeObj?.amenities || [],
                                    },
                                  })
                                }
                                sx={{
                                  color: themeConfig.info,
                                  bgcolor: themeConfig.infoBg,
                                  borderRadius: "10px",
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip>

                            <Tooltip title="Delete Room">
                              <IconButton
                                size="small"
                                onClick={() => onDeleteRoom && onDeleteRoom(room)}
                                sx={{
                                  color: themeConfig.danger,
                                  bgcolor: themeConfig.dangerBg,
                                  borderRadius: "10px",
                                }}
                              >
                                <Delete fontSize="small" />
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
            {filteredRooms.length > 0 && (
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                component="div"
                count={filteredRooms.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
                sx={{
                  borderTop: `1px solid ${themeConfig.border}`,
                  bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                  borderRadius: "0 0 20px 20px",
                  "& .MuiTablePagination-toolbar": {
                    flexWrap: "wrap",
                    px: { xs: 1, sm: 2 },
                    justifyContent: { xs: "center", sm: "flex-end" },
                    gap: 1,
                  },
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontWeight: 700,
                    color: themeConfig.textMuted,
                    fontSize: { xs: "0.75rem", sm: "0.875rem" },
                    m: 0,
                  },
                }}
              />
            )}
          </TableContainer>
        </Box>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ROOM CATEGORIES & AMENITIES MASTER                                */}
      {/* ========================================================================= */}
      {activeTab === 2 && (
        <Box>
          {roomTypes.length === 0 ? (
            <Card
              className="card-3d"
              sx={{
                p: 4,
                borderRadius: "20px",
                border: `1px solid ${themeConfig.border}`,
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                boxShadow: isDarkMode ? "0 10px 25px -5px rgba(0,0,0,0.4)" : "0 10px 25px -5px rgba(12, 39, 59, 0.08)",
              }}
            >
              <EmptyState
                title="No Room Categories Defined"
                description="No room types have been configured yet. Click 'Add Category' to create your first category."
              />
            </Card>
          ) : (
            <Grid container spacing={3}>
              {roomTypes.map((rt) => {
                const categoryRooms = rooms.filter((r) => {
                  const typeId = typeof r.roomType === "object" ? r.roomType?._id : r.roomType;
                  return typeId === rt._id;
                });
                const linkedRoomsCount = categoryRooms.length;
                const availableRoomsCount = categoryRooms.filter((r) => r.status === "AVAILABLE").length;
                const catAmenities = Array.isArray(rt.amenities) && rt.amenities.length > 0
                  ? rt.amenities
                  : ["Free WiFi", "Air Conditioner (AC)", "Smart TV", "Attached Bathroom"];

                return (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={rt._id}>
                    <Card
                      className="card-3d"
                      sx={{
                        borderRadius: "22px",
                        border: `1px solid ${themeConfig.border}`,
                        boxShadow: isDarkMode ? "0 10px 25px -5px rgba(0,0,0,0.4)" : "0 10px 25px -5px rgba(12, 39, 59, 0.08), inset 0 1px 1px #FFFFFF",
                        background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #F9FBFC 100%)",
                        height: "100%",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          boxShadow: isDarkMode ? "0 16px 32px -6px rgba(0,0,0,0.55)" : "0 16px 32px -6px rgba(12, 39, 59, 0.12)",
                        },
                      }}
                    >
                      <CardContent sx={{ p: 3 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                          <Box>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                              {rt.name}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                              Max {rt.capacity?.adults || 2} Adults, {rt.capacity?.children || 1} Children • 🛏️ {rt.bedType || `${rt.bedCount || 1} Bed(s)`}
                            </Typography>
                          </Box>
                          <Chip
                            label={`₹${rt.basePrice}/night`}
                            sx={{
                              background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                              color: "#FFFFFF",
                              fontWeight: 900,
                              borderRadius: "10px",
                              boxShadow: `0 2px 8px ${themeConfig.primaryGlow}`,
                            }}
                          />
                        </Box>

                        <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 2, lineHeight: 1.5, minHeight: 44 }}>
                          {rt.description || "Premium comfortable room with attached bathroom and modern hotel amenities."}
                        </Typography>

                        {/* Amenities Chips in Category Card */}
                        <Box sx={{ mb: 2 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, display: "block", mb: 0.6 }}>
                            CONFIGURED AMENITIES:
                          </Typography>
                          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6 }}>
                            {catAmenities.map((am, i) => (
                              <Chip
                                key={i}
                                label={am}
                                size="small"
                                sx={{
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  bgcolor: themeConfig.bgMain,
                                  color: themeConfig.textMain,
                                  border: `1px solid ${themeConfig.border}`,
                                }}
                              />
                            ))}
                          </Box>
                        </Box>

                        <Box sx={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 2 }}>
                          <Chip
                            label={`🏨 ${linkedRoomsCount} Rooms Assigned`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              bgcolor: themeConfig.champagne,
                              color: themeConfig.primaryDark,
                              border: `1px solid ${themeConfig.border}`,
                            }}
                          />
                          <Chip
                            label={`✅ ${availableRoomsCount} Available`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              bgcolor: availableRoomsCount > 0 ? (isDarkMode ? "rgba(16,185,129,0.2)" : "#E6F4EA") : (isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6"),
                              color: availableRoomsCount > 0 ? (isDarkMode ? "#34D399" : "#137333") : themeConfig.textMuted,
                              border: `1px solid ${availableRoomsCount > 0 ? "rgba(16,185,129,0.3)" : themeConfig.border}`,
                            }}
                          />
                          <Chip
                            label={`🛏️ ${rt.bedType || "1 King Bed"}`}
                            size="small"
                            sx={{
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F3F4F6",
                              color: themeConfig.textMain,
                            }}
                          />
                        </Box>

                        <Divider sx={{ my: 1.5, borderColor: themeConfig.border }} />

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<Edit />}
                            onClick={() =>
                              setTypeModal({
                                open: true,
                                mode: "EDIT",
                                data: {
                                  _id: rt._id,
                                  name: rt.name,
                                  basePrice: rt.basePrice,
                                  maxAdults: rt.capacity?.adults || 2,
                                  maxChildren: rt.capacity?.children || 1,
                                  bedCount: rt.bedCount || 1,
                                  bedType: rt.bedType || "1 King Size Bed",
                                  description: rt.description || "",
                                  amenities: rt.amenities || [],
                                  gstEnabled: rt.gstEnabled !== false,
                                  gstRate: rt.gstRate ?? 18,
                                  cgstRate: rt.cgstRate ?? (rt.gstRate ? rt.gstRate / 2 : 9),
                                  sgstRate: rt.sgstRate ?? (rt.gstRate ? rt.gstRate / 2 : 9),
                                  taxInclusive: Boolean(rt.taxInclusive),
                                },
                              })
                            }
                            sx={{
                              borderRadius: "10px",
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                              flexGrow: { xs: 1, sm: 0 },
                            }}
                          >
                            Edit Category
                          </Button>

                          <Button
                            size="small"
                            variant="outlined"
                            color="error"
                            startIcon={<Delete />}
                            onClick={() => onDeleteRoomType && onDeleteRoomType(rt)}
                            sx={{
                              borderRadius: "10px",
                              fontSize: "0.75rem",
                              fontWeight: 800,
                              whiteSpace: "nowrap",
                              flexGrow: { xs: 1, sm: 0 },
                              borderColor: "rgba(220, 38, 38, 0.3)",
                              color: themeConfig.danger,
                              "&:hover": { borderColor: themeConfig.danger, bgcolor: "rgba(220, 38, 38, 0.08)" },
                            }}
                          >
                            Delete Category
                          </Button>
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}

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
        <form onSubmit={onSaveRoom}>
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
                  required
                  value={roomModal.data?.roomType || (roomTypes[0]?._id || "")}
                  onChange={(e) => {
                    const selectedCatId = e.target.value;
                    const catObj = roomTypes.find((t) => t._id === selectedCatId);
                    setRoomModal({
                      ...roomModal,
                      data: {
                        ...roomModal.data,
                        roomType: selectedCatId,
                        seatingCapacity: catObj?.capacity?.adults || roomModal.data?.seatingCapacity || 2,
                        amenities: catObj?.amenities?.length ? [...catObj.amenities] : (roomModal.data?.amenities || []),
                      },
                    });
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                >
                  {roomTypes.map((rt) => (
                    <MenuItem key={rt._id} value={rt._id}>
                      {rt.name}{rt.basePrice > 0 ? ` (Price: ₹${rt.basePrice})` : ""}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              {/* Room Number */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  Room Number *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  value={roomModal.data?.roomNumber || ""}
                  onChange={(e) => setRoomModal({ ...roomModal, data: { ...roomModal.data, roomNumber: e.target.value } })}
                  placeholder="e.g. 101, 204, Suite-A"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
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
                  required
                  value={roomModal.data?.floor ?? 1}
                  onChange={(e) => setRoomModal({ ...roomModal, data: { ...roomModal.data, floor: e.target.value } })}
                  placeholder="e.g. 1, 2, Ground, 3"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
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
                  value={roomModal.data?.bedType || "1 King Size Bed"}
                  onChange={(e) => {
                    const selectedBed = e.target.value;
                    const preset = BED_OPTIONS.find((b) => b.label === selectedBed);
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
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                >
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
                  required
                  value={roomModal.data?.bedCount ?? 1}
                  onChange={(e) => {
                    const bCount = e.target.value;
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
                  placeholder="e.g. 1, 2, 3"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
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
                  required
                  value={roomModal.data?.seatingCapacity ?? 2}
                  onChange={(e) => setRoomModal({ ...roomModal, data: { ...roomModal.data, seatingCapacity: e.target.value } })}
                  placeholder="e.g. 2, 3, 4"
                  helperText="Auto-calculated from beds"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
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
                  onChange={(e) => setRoomModal({ ...roomModal, data: { ...roomModal.data, customPricePerNight: e.target.value } })}
                  placeholder="Leave blank for category base price"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
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

              {/* GST Configuration Section (Requirement #1 & #2) */}
              <Grid size={{ xs: 12 }}>
                <RoomGstFields
                  formData={roomModal.data || {}}
                  setFormData={setRoomModal}
                  basePrice={
                    Number(roomModal.data?.customPricePerNight) ||
                    Number(roomTypes.find((t) => t._id === roomModal.data?.roomType)?.basePrice) ||
                    0
                  }
                  themeConfig={themeConfig}
                  isDarkMode={isDarkMode}
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
        <form onSubmit={onSaveRoomType}>
          <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Box>
              <Typography component="div" variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                {typeModal.mode === "EDIT" ? `Edit Category "${typeModal.data?.name}"` : "Create New Room Category"}
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                Set category base tariff, capacity limits, and configure default amenities.
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
                  label="Room Category Name *"
                  required
                  fullWidth
                  size="small"
                  value={typeModal.data.name}
                  onChange={(e) => setTypeModal({ ...typeModal, data: { ...typeModal.data, name: e.target.value } })}
                  placeholder="e.g. Deluxe Room, Executive Suite, Family Room"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Category Description"
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  value={typeModal.data.description}
                  onChange={(e) => setTypeModal({ ...typeModal, data: { ...typeModal.data, description: e.target.value } })}
                  placeholder="King bed, sea view balcony, jacuzzi, complimentary buffet breakfast..."
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>

              {/* Base Tariff (₹) */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Category Base Price (₹ / night) *"
                  type="number"
                  required
                  fullWidth
                  size="small"
                  value={typeModal.data.basePrice ?? ""}
                  onChange={(e) => setTypeModal({ ...typeModal, data: { ...typeModal.data, basePrice: e.target.value } })}
                  placeholder="e.g. 3000"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>

              {/* Category Default GST Configuration */}
              <Grid size={{ xs: 12 }}>
                <RoomGstFields
                  formData={typeModal.data || {}}
                  setFormData={setTypeModal}
                  basePrice={Number(typeModal.data.basePrice) || 0}
                  themeConfig={themeConfig}
                  isDarkMode={isDarkMode}
                />
              </Grid>

              {/* Category Default Amenities Selector */}
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: themeConfig.bgMain,
                    border: `1px solid ${themeConfig.border}`,
                  }}
                >
                  <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 1 }}>
                    ✨ Category Default Amenities ({typeModal.data.amenities?.length || 0} Selected)
                  </Typography>

                  {/* Selected Amenities */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mb: 1.5 }}>
                    {Array.isArray(typeModal.data.amenities) && typeModal.data.amenities.length > 0 ? (
                      typeModal.data.amenities.map((am, i) => (
                        <Chip
                          key={i}
                          label={am}
                          onDelete={() => toggleTypeAmenity(am)}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: themeConfig.primaryDark,
                            color: "#FFFFFF",
                            borderRadius: "8px",
                            "& .MuiChip-deleteIcon": { color: "rgba(255,255,255,0.8)", "&:hover": { color: "#FFFFFF" } },
                          }}
                        />
                      ))
                    ) : (
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontStyle: "italic" }}>
                        No default amenities chosen yet.
                      </Typography>
                    )}
                  </Box>

                  {/* Preset Pills */}
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8, mb: 1.5 }}>
                    {POPULAR_AMENITIES.map((am, i) => {
                      const isSelected = Array.isArray(typeModal.data.amenities) && typeModal.data.amenities.includes(am.label);
                      return (
                        <Chip
                          key={i}
                          icon={isSelected ? <Check sx={{ fontSize: "16px !important", color: "#FFFFFF !important" }} /> : React.cloneElement(am.icon, { sx: { fontSize: "16px !important", color: isDarkMode ? "#14B8A6 !important" : "inherit" } })}
                          label={am.label}
                          clickable
                          onClick={() => toggleTypeAmenity(am.label)}
                          size="small"
                          sx={{
                            borderRadius: "8px",
                            fontWeight: 700,
                            fontSize: "0.72rem",
                            bgcolor: isSelected ? (themeConfig.primary || "#0F766E") : (isDarkMode ? "rgba(255,255,255,0.06)" : "#FFFFFF"),
                            color: isSelected ? "#FFFFFF" : themeConfig.textMain,
                            border: `1px solid ${isSelected ? themeConfig.primaryLight || themeConfig.primary : themeConfig.border}`,
                            transition: "all 0.15s ease",
                            "&:hover": {
                              bgcolor: isSelected ? themeConfig.primary : (isDarkMode ? "rgba(255,255,255,0.12)" : themeConfig.champagne),
                            },
                          }}
                        />
                      );
                    })}
                  </Box>

                  {/* Add Custom Amenity to Category */}
                  <Box sx={{ display: "flex", gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Add custom category amenity..."
                      value={customTypeAmenityInput}
                      onChange={(e) => setCustomTypeAmenityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomTypeAmenity();
                        }
                      }}
                      sx={{ flexGrow: 1, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF" } }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddCustomTypeAmenity}
                      disabled={!customTypeAmenityInput.trim()}
                      sx={{
                        borderRadius: "10px",
                        fontWeight: 800,
                        bgcolor: themeConfig.primary,
                        color: "#FFFFFF",
                      }}
                    >
                      + Add
                    </Button>
                  </Box>
                </Box>
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
                onTabChange(5);
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
