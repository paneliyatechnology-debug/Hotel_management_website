"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Dialog,
  DialogContent,
  TextField,
  Grid,
  IconButton,
  MenuItem,
  Tooltip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";
import { AppDialogHeader, AppDialogFooter, dialogPaperSx, dialogCancelButtonSx, dialogPrimaryButtonSx } from "@/shared/components/AppDialog";
import StatCard from "@/shared/components/StatCard";
import {
  Add,
  ArrowBack,
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
} from "@/shared/icons";

const CATEGORY_STATUSES = [
  { key: "available", label: "Available", color: "#0F766E", bg: "#ECFDF5", border: "#A7F3D0" },
  { key: "booked", label: "Booked", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
  { key: "cleaning", label: "Cleaning", color: "#B42318", bg: "#FEF2F2", border: "#FECACA" },
];

function countFromRooms(roomList) {
  const available = roomList.filter((room) => (room.status || "AVAILABLE") === "AVAILABLE").length;
  const booked = roomList.filter((room) => room.status === "OCCUPIED" || room.status === "RESERVED").length;
  const cleaning = roomList.filter((room) => room.status === "CLEANING" || room.status === "MAINTENANCE" || room.status === "BLOCKED").length;
  return { available, booked, cleaning, total: roomList.length, fromApi: false };
}

function readCount(source, snakeKey, camelKey) {
  const value = source?.[snakeKey] ?? source?.[camelKey];
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function categoryStatusCounts(category, fallbackRooms = []) {
  const counts = category?.room_status_counts || category?.roomStatusCounts || category?.summary;
  const hasCounts = counts && (
    counts.available_count !== undefined ||
    counts.availableCount !== undefined ||
    counts.total_room_count !== undefined ||
    counts.totalRoomCount !== undefined
  );
  if (!hasCounts) return countFromRooms(fallbackRooms);
  const available = readCount(counts, "available_count", "availableCount");
  const booked = readCount(counts, "reserved_count", "reservedCount") + readCount(counts, "occupied_count", "occupiedCount");
  const cleaning = readCount(counts, "cleaning_count", "cleaningCount") + readCount(counts, "maintenance_count", "maintenanceCount") + readCount(counts, "blocked_count", "blockedCount");
  const statedTotal = readCount(counts, "total_room_count", "totalRoomCount");
  return { available, booked, cleaning, total: statedTotal || available + booked + cleaning, fromApi: true };
}
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { useSocket } from "@/shared/context/SocketContext";
import EmptyState from "@/shared/components/EmptyState";

// Standard hotel amenities with icons and labels
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
  const [trialLimitModalOpen, setTrialLimitModalOpen] = useState(false);
  const [roomErrors, setRoomErrors] = useState({});
  const [typeErrors, setTypeErrors] = useState({});
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [categoryPage, setCategoryPage] = useState(0);
  const [categoryRowsPerPage, setCategoryRowsPerPage] = useState(10);
  const [roomPage, setRoomPage] = useState(0);
  const [roomRowsPerPage, setRoomRowsPerPage] = useState(5);
  const [serverRooms, setServerRooms] = useState(null);
  const [liveTick, setLiveTick] = useState(0);
  useSocket(
    ["ROOM_UPDATED", "room:category_counts", "BOOKING_CREATED", "BOOKING_UPDATED", "GUEST_CHECKED_OUT", "PAYMENT_RECORDED"],
    () => setLiveTick((tick) => tick + 1)
  );

  const fieldLabelSx = { fontWeight: 600, color: themeConfig.textMuted, mb: 0.6, display: "block", fontSize: "0.78rem" };
  const RequiredMark = () => <Box component="span" sx={{ color: "#B42318" }}> *</Box>;
  const fieldSx = (invalid) => ({
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      height: 40,
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
    if (blank(data.roomType)) errors.roomType = "Select a category.";
    if (blank(data.roomNumber)) errors.roomNumber = "Room number is required.";
    if (blank(data.floor)) errors.floor = "Floor is required.";
    if (blank(data.bedType)) errors.bedType = "Bed type is required.";
    if (blank(data.bedCount)) errors.bedCount = "Beds are required.";
    if (blank(data.seatingCapacity)) errors.seatingCapacity = "Guest capacity is required.";
    if (blank(data.customPricePerNight)) errors.customPricePerNight = "Nightly rate is required.";
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
      : planSource?.name || planSource?.title || planSource?.plan_name || "Trial"
  ).toString();
  const normalizedPlan = planName.trim().toUpperCase();
  const isTrial = normalizedPlan === "TRIAL" || normalizedPlan === "FREE" || String(subscription?.status || "").toUpperCase() === "TRIAL";

  // Summary Metrics — prefer the category API totals, then the loaded room list.
  const summaryCounts = categoryStatusCounts(roomTypes.summary ? { room_status_counts: roomTypes.summary } : null, rooms);
  const totalRoomsCount = summaryCounts.total;
  const planLabel = isTrial
    ? `Trial · ${totalRoomsCount} of 5 rooms`
    : `${planName.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())} · ${totalRoomsCount} ${totalRoomsCount === 1 ? "room" : "rooms"}`;


  // Helper to open Add Room modal with preselected Category
  const openAddCategory = () => {
    setTypeErrors({});
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
    });
  };

  const handleOpenAddRoomForCategory = (category) => {
    if (!category && roomTypes.length === 0) return;
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

  const selectedCategory = roomTypes.find((cat) => String(cat._id || cat.id) === String(selectedCategoryId)) || null;
  const selectedRooms = selectedCategory
    ? rooms.filter((r) => {
        const typeId = typeof r.roomType === "object" ? (r.roomType?._id || r.roomType?.id) : (r.roomType || r.room_type_id || r.roomTypeId);
        return String(typeId) === String(selectedCategory._id || selectedCategory.id) || (selectedCategory.name && (r.room_type_name || r.roomTypeName) === selectedCategory.name);
      })
    : [];
  const selectedCategoryCounts = categoryStatusCounts(selectedCategory, selectedRooms);
  useEffect(() => {
    if (!selectedCategory) {
      setServerRooms(null);
      return;
    }
    let cancelled = false;
    (async () => {
      const params = new URLSearchParams({
        page: String(roomPage + 1),
        limit: String(roomRowsPerPage),
        room_type_id: String(selectedCategory._id || selectedCategory.id),
      });
      try {
        const res = await apiRequest(`${API_ENDPOINTS.ROOMS.ALL}?${params.toString()}`, { forceRefresh: true });
        const list = Array.isArray(res?.data) ? res.data : [];
        const rawTotal = res?.data?.total ?? res?.data?.pagination?.total ?? res?.data?.pagination?.totalRecords;
        if (!cancelled && Number.isFinite(Number(rawTotal))) setServerRooms({ list, total: Number(rawTotal) });
        else if (!cancelled) setServerRooms(null);
      } catch {
        if (!cancelled) setServerRooms(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedCategory, roomPage, roomRowsPerPage, liveTick]);

  const pagedRooms = serverRooms ? serverRooms.list : selectedRooms.slice(roomPage * roomRowsPerPage, roomPage * roomRowsPerPage + roomRowsPerPage);
  const pagedCategories = roomTypes.slice(categoryPage * categoryRowsPerPage, categoryPage * categoryRowsPerPage + categoryRowsPerPage);

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%", overflowX: "hidden", px: { xs: 1.5, sm: 2.5, md: 3 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 } }}>
      <Box sx={{ mb: 2.5 }}>
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 1.5, mb: 2 }}>
          <Box>
            <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "1rem" }}>
              Add a category, then add rooms.
            </Typography>
            <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.82rem", mt: 0.4 }}>
              {planLabel}
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
            {roomTypes.length > 0 && (
              <Button
                variant="outlined"
                startIcon={<Add />}
                onClick={() => handleOpenAddRoomForCategory(roomTypes[0])}
                sx={{
                  height: 40,
                  borderRadius: "10px",
                  textTransform: "none",
                  fontWeight: 700,
                  px: 2,
                  color: themeConfig.primaryDark,
                  borderColor: themeConfig.border,
                  bgcolor: isDarkMode ? "transparent" : "#FFFFFF",
                  "&:hover": { borderColor: themeConfig.primary, bgcolor: themeConfig.champagne || "#F4F7F6" },
                }}
              >
                Add room
              </Button>
            )}
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={openAddCategory}
              sx={{
                height: 40,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                px: 2,
                boxShadow: "none",
                bgcolor: themeConfig.primary,
                "&:hover": { bgcolor: themeConfig.primaryDark, boxShadow: "none" },
              }}
            >
              Add category
            </Button>
          </Box>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
            gap: 2,
            width: "100%",
            minWidth: 0,
            maxWidth: { sm: 560 },
            "& > *": { minWidth: 0, maxWidth: "100%" },
          }}
        >
          <StatCard hideFooter title="Total rooms" value={totalRoomsCount} icon={<MeetingRoom />} color="#0F766E" />
          <StatCard hideFooter title="Categories" value={roomTypes.length} icon={<Category />} color="#0F766E" />
        </Box>
      </Box>


      <Card
        sx={{
          borderRadius: "16px",
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(15, 23, 42, 0.04)",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1.5 }}>
            {selectedCategory ? (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                <Tooltip title="All categories" arrow>
                  <IconButton
                    onClick={() => { setSelectedCategoryId(null); setRoomPage(0); }}
                    aria-label="All categories"
                    sx={{ color: themeConfig.textMain, borderRadius: "10px", border: `1px solid ${themeConfig.border}` }}
                  >
                    <ArrowBack fontSize="small" />
                  </IconButton>
                </Tooltip>
                <Box sx={{ minWidth: 0 }}>
                  <Typography noWrap sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "1.05rem", lineHeight: 1.3 }}>
                    {selectedCategory.name}
                  </Typography>
                  <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.78rem" }}>
                    {selectedCategoryCounts.total} {selectedCategoryCounts.total === 1 ? "room" : "rooms"}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box>
                <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "1.05rem", lineHeight: 1.3 }}>
                  Categories
                </Typography>
                <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.8rem", mt: 0.25 }}>
                  Select a category to view its rooms.
                </Typography>
              </Box>
            )}
          </Box>

          {roomTypes.length === 0 ? (
            <Box sx={{ py: 6 }}>
              <EmptyState
                title="No categories yet"
                description="Add a category before you add rooms."
                actionLabel="Add category"
                onAction={openAddCategory}
              />
            </Box>
          ) : selectedCategory ? (
            <Box>
              {(serverRooms ? serverRooms.total : selectedRooms.length) === 0 ? (
                <EmptyState embedded title="No rooms in this category" description={`${selectedCategory.name} does not have any rooms yet.`} />
              ) : (
                <TableContainer sx={{ mx: { xs: -1.5, sm: -2 }, mb: { xs: -1.5, sm: -2 }, width: "auto", overflowX: "auto", borderRadius: 0, border: "none", boxShadow: "none", bgcolor: "transparent" }}>
                  <Table size="medium" sx={{ width: "100%", minWidth: 640 }}>
                    <TableHead>
                      <TableRow>
                        {["Room", "Floor", "Nightly rate", "Status"].map((heading, index) => (
                          <TableCell key={heading} sx={{ fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase", color: themeConfig.primaryDark, py: 1.75, px: 2.5, pl: index === 0 ? 3 : 2.5, borderRadius: 0, borderBottom: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : themeConfig.champagne || "#F4F7F6", whiteSpace: "nowrap" }}>
                            {heading}
                          </TableCell>
                        ))}
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.06em", textTransform: "uppercase", color: themeConfig.primaryDark, py: 1.75, px: 2.5, pr: 3, borderRadius: 0, borderBottom: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : themeConfig.champagne || "#F4F7F6", whiteSpace: "nowrap" }}>
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedRooms.map((room) => {
                        const tariff = Number(room.customPricePerNight || selectedCategory.basePrice || room.basePrice || 0);
                        const statusKey = String(room.status || "AVAILABLE").toUpperCase();
                        const statusMeta = {
                          AVAILABLE: { label: "Available", color: "#047857", bg: "#ECFDF5" },
                          OCCUPIED: { label: "Occupied", color: "#B45309", bg: "#FFF6E8" },
                          RESERVED: { label: "Reserved", color: "#B45309", bg: "#FFF6E8" },
                          CLEANING: { label: "Cleaning", color: "#B42318", bg: "#FDECEC" },
                          MAINTENANCE: { label: "Maintenance", color: "#B42318", bg: "#FDECEC" },
                          BLOCKED: { label: "Blocked", color: themeConfig.textMuted, bg: "#F4F7F6" },
                        }[statusKey] || { label: statusKey, color: themeConfig.textMuted, bg: "#F4F7F6" };
                        const actionSx = {
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          color: themeConfig.textMuted,
                          "&:hover": { bgcolor: themeConfig.bgMain, color: themeConfig.textMain },
                        };
                        return (
                          <TableRow
                            key={room._id || room.roomNumber}
                            sx={{
                              "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC" },
                              "& td": { borderBottom: `1px solid ${themeConfig.border}` },
                            }}
                          >
                            <TableCell sx={{ py: 1.75, pl: 3, pr: 2.5 }}>
                              <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.92rem" }}>
                                Room {room.roomNumber}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.75, px: 2.5 }}>
                              <Typography sx={{ fontWeight: 600, color: themeConfig.textMain, fontSize: "0.9rem" }}>
                                Floor {room.floor || 1}
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.75, px: 2.5 }}>
                              <Typography sx={{ fontWeight: 700, color: "#0F766E", fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                                ₹{tariff.toLocaleString("en-IN")} / night
                              </Typography>
                            </TableCell>
                            <TableCell sx={{ py: 1.75, px: 2.5 }}>
                              <Chip
                                label={statusMeta.label}
                                size="small"
                                sx={{ fontWeight: 600, borderRadius: "999px", bgcolor: statusMeta.bg, color: statusMeta.color }}
                              />
                            </TableCell>
                            <TableCell align="right" sx={{ py: 1.75, pl: 2.5, pr: 2.5 }}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.25 }}>
                                <Tooltip title="Edit">
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
                                    sx={actionSx}
                                  >
                                    <Edit fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Remove">
                                  <IconButton
                                    size="small"
                                    onClick={() => onDeleteRoom && onDeleteRoom(room)}
                                    sx={{ ...actionSx, "&:hover": { bgcolor: themeConfig.dangerBg, color: themeConfig.danger } }}
                                  >
                                    <Delete fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                  <TablePagination
                    component="div"
                    count={serverRooms ? serverRooms.total : selectedRooms.length}
                    page={roomPage}
                    onPageChange={(e, next) => setRoomPage(next)}
                    rowsPerPage={roomRowsPerPage}
                    onRowsPerPageChange={(e) => {
                      setRoomRowsPerPage(parseInt(e.target.value, 10));
                      setRoomPage(0);
                    }}
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    sx={{
                      borderTop: `1px solid ${themeConfig.border}`,
                      bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                      "& .MuiTablePagination-toolbar": { px: { xs: 1, sm: 2 }, minHeight: 52 },
                      "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                        fontWeight: 600,
                        color: themeConfig.textMuted,
                        fontSize: "0.8rem",
                      },
                    }}
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
                  sm: "repeat(2, minmax(0, 1fr))",
                  lg: "repeat(3, minmax(0, 1fr))",
                },
                gap: 1.5,
                minWidth: 0,
                width: "100%",
              }}
            >
              {pagedCategories.map((cat) => {
                const catRooms = rooms.filter((r) => {
                  const typeId = typeof r.roomType === "object" ? (r.roomType?._id || r.roomType?.id) : (r.roomType || r.room_type_id || r.roomTypeId);
                  return String(typeId) === String(cat._id || cat.id) || (cat.name && (r.room_type_name || r.roomTypeName) === cat.name);
                });
                const statusCounts = categoryStatusCounts(cat, catRooms);
                const { available, booked, cleaning } = statusCounts;
                const totalRooms = statusCounts.total;
                const adultsCount = Number(cat.capacity?.adults || cat.maxAdults || cat.max_adults || 2);
                const kidsCount = Number(cat.capacity?.children ?? cat.maxChildren ?? cat.max_children ?? 1);
                const bedType = cat.bedType || cat.bed_type || "";
                const bedCount = cat.bedCount || cat.bed_count || 1;

                return (
                  <Card
                    key={cat._id || cat.id || cat.name}
                    onClick={() => { setSelectedCategoryId(cat._id || cat.id); setRoomPage(0); }}
                    sx={{
                      p: 2.25,
                      borderRadius: "16px",
                      minWidth: 0,
                      width: "100%",
                      overflow: "hidden",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                      boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(15, 23, 42, 0.05), 0 10px 24px rgba(15, 23, 42, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      transition: "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
                      "&:hover": {
                        borderColor: "#99D5C9",
                        transform: "translateY(-2px)",
                        boxShadow: isDarkMode ? "none" : "0 2px 6px rgba(15, 23, 42, 0.06), 0 16px 32px rgba(15, 23, 42, 0.1)",
                      },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, minWidth: 0 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                          <MeetingRoom sx={{ fontSize: 18, flexShrink: 0, color: themeConfig.primary }} />
                          <Tooltip title={cat.name} arrow>
                            <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "1.05rem", lineHeight: 1.3, overflowWrap: "anywhere" }}>
                              {cat.name}
                            </Typography>
                          </Tooltip>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                          <KingBed sx={{ fontSize: 14, flexShrink: 0, color: themeConfig.textMuted }} />
                          <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 600 }}>
                            {totalRooms} {totalRooms === 1 ? "room" : "rooms"}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.25, flexShrink: 0, mt: -0.5, mr: -0.5 }}>
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
                            sx={{ width: 32, height: 32, borderRadius: "8px", color: themeConfig.textMuted, "&:hover": { bgcolor: themeConfig.bgMain, color: themeConfig.textMain } }}
                          >
                            <Edit sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Remove category">
                          <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDeleteRoomType && onDeleteRoomType(cat); }} sx={{ width: 32, height: 32, borderRadius: "8px", color: themeConfig.textMuted, "&:hover": { bgcolor: themeConfig.dangerBg, color: themeConfig.danger } }}>
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    <Box
                      sx={{
                        display: "flex",
                        height: 2,
                        borderRadius: 999,
                        overflow: "hidden",
                        bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "#F1F5F9",
                      }}
                    >
                      {CATEGORY_STATUSES.map((item) =>
                        statusCounts[item.key] > 0 && totalRooms > 0 ? (
                          <Box key={item.key} sx={{ width: `${(statusCounts[item.key] / (available + booked + cleaning || 1)) * 100}%`, bgcolor: item.color, opacity: 0.85 }} />
                        ) : null
                      )}
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
                      {CATEGORY_STATUSES.map((item) => (
                        <Box
                          key={item.key}
                          sx={{
                            borderRadius: "12px",
                            bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : item.bg,
                            border: `1px solid ${isDarkMode ? themeConfig.border : item.border}`,
                            boxShadow: isDarkMode ? "none" : "0 2px 8px rgba(15, 23, 42, 0.05)",
                            py: 1.1,
                            px: 0.5,
                            textAlign: "center",
                          }}
                        >
                          <Typography sx={{ fontWeight: 700, color: item.color, fontSize: "0.95rem", lineHeight: 1 }}>{statusCounts[item.key]}</Typography>
                          <Typography sx={{ color: item.color, fontSize: "0.62rem", fontWeight: 600, mt: 0.6, lineHeight: 1.2 }}>{item.label}</Typography>
                        </Box>
                      ))}
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
              rowsPerPageOptions={[5, 10, 15, 20, 25]}
              labelRowsPerPage="Categories per page"
              sx={{ mt: 1.5, borderTop: `1px solid ${themeConfig.border}` }}
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
        slotProps={{ paper: { sx: dialogPaperSx(themeConfig, isDarkMode) } }}
      >
        <form noValidate onSubmit={submitRoom}>
          <AppDialogHeader
            eyebrow={roomModal.mode === "ADD" ? "New room" : "Room details"}
            title={roomModal.mode === "ADD" ? "Add room" : `Edit room ${roomModal.data?.roomNumber || ""}`}
            icon={<MeetingRoom sx={{ fontSize: 20 }} />}
            onClose={() => setRoomModal({ ...roomModal, open: false })}
          />

          <DialogContent>
            <Grid container spacing={2}>
              {/* Room Category Selection */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={fieldLabelSx}>
                  Category<RequiredMark />
                </Typography>
                <TextField
                  select
                  required
                  fullWidth
                  size="small"
                  value={roomModal.data?.roomType ? (Number(roomModal.data.roomType) || roomModal.data.roomType) : ""}
                  slotProps={{
                    select: {
                      displayEmpty: true,
                      renderValue: (selected) => {
                        if (!selected) return <Box component="span" sx={{ color: themeConfig.textMuted }}>Select a category</Box>;
                        const match = roomTypes.find((rt) => String(rt._id || rt.id) === String(selected));
                        return match?.name || selected;
                      },
                    },
                  }}
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
                  <MenuItem value="" disabled>Select a category</MenuItem>
                  {roomTypes.map((rt) => {
                    const optVal = Number(rt._id || rt.id) || rt._id;
                    return (
                      <MenuItem key={rt._id || rt.id} value={optVal}>
                        {rt.name}{(rt.basePrice > 0 || rt.base_price > 0) ? ` · ₹${Number(rt.basePrice || rt.base_price).toLocaleString("en-IN")} / night` : ""}
                      </MenuItem>
                    );
                  })}
                </TextField>
                {roomErrors.roomType && <Typography variant="caption" sx={{ color: "#EF4444", fontWeight: 700 }}>{roomErrors.roomType}</Typography>}
              </Grid>

              {/* Room Number */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={fieldLabelSx}>
                  Room number<RequiredMark />
                </Typography>
                <TextField
                  required
                  fullWidth
                  size="small"
                  value={roomModal.data?.roomNumber || ""}
                  onChange={(e) => {
                    setRoomErrors((prev) => ({ ...prev, roomNumber: "" }));
                    setRoomModal({ ...roomModal, data: { ...roomModal.data, roomNumber: e.target.value } });
                  }}
                  placeholder="Enter the room number"
                  error={Boolean(roomErrors.roomNumber)}
                  helperText={roomErrors.roomNumber || ""}
                  sx={fieldSx(Boolean(roomErrors.roomNumber))}
                />
              </Grid>

              {/* Floor Level */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={fieldLabelSx}>
                  Floor<RequiredMark />
                </Typography>
                <TextField
                  required
                  fullWidth
                  size="small"
                  value={roomModal.data?.floor ?? ""}
                  onChange={(e) => {
                    setRoomErrors((prev) => ({ ...prev, floor: "" }));
                    setRoomModal({ ...roomModal, data: { ...roomModal.data, floor: e.target.value } });
                  }}
                  placeholder="Enter the floor"
                  error={Boolean(roomErrors.floor)}
                  helperText={roomErrors.floor || ""}
                  sx={fieldSx(Boolean(roomErrors.floor))}
                />
              </Grid>

              {/* Bed Configuration / Type */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={fieldLabelSx}>
                  Bed type<RequiredMark />
                </Typography>
                <TextField
                  select
                  required
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
                  <MenuItem value="">Select a bed type</MenuItem>
                  {BED_OPTIONS.map((opt, i) => (
                    <MenuItem key={i} value={opt.label}>
                      {opt.label} · {opt.capacity} guests
                    </MenuItem>
                  ))}
                  <MenuItem value="Custom Setup">Custom bed type</MenuItem>
                </TextField>
              </Grid>

              {/* Number of Beds in Room */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={fieldLabelSx}>
                  Beds<RequiredMark />
                </Typography>
                <TextField
                  required
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
                  placeholder="Enter the number of beds"
                  helperText={roomErrors.bedCount || ""}
                  sx={fieldSx(Boolean(roomErrors.bedCount))}
                />
              </Grid>

              {/* Seating / Guest Capacity (Bed-based) */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={fieldLabelSx}>
                  Guest capacity<RequiredMark />
                </Typography>
                <TextField
                  required
                  fullWidth
                  size="small"
                  value={roomModal.data?.seatingCapacity ?? ""}
                  onChange={(e) => {
                    setRoomErrors((prev) => ({ ...prev, seatingCapacity: "" }));
                    setRoomModal({ ...roomModal, data: { ...roomModal.data, seatingCapacity: e.target.value } });
                  }}
                  placeholder="Enter the guest capacity"
                  error={Boolean(roomErrors.seatingCapacity)}
                  helperText={roomErrors.seatingCapacity || ""}
                  sx={fieldSx(Boolean(roomErrors.seatingCapacity))}
                />
              </Grid>

              {/* Custom Price */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={fieldLabelSx}>
                  Nightly rate (₹)<RequiredMark />
                </Typography>
                <TextField
                  required
                  fullWidth
                  size="small"
                  value={roomModal.data?.customPricePerNight ?? ""}
                  onChange={(e) => {
                    setRoomErrors((prev) => ({ ...prev, customPricePerNight: "" }));
                    setRoomModal({ ...roomModal, data: { ...roomModal.data, customPricePerNight: e.target.value } });
                  }}
                  placeholder="Enter the nightly rate"
                  error={Boolean(roomErrors.customPricePerNight)}
                  helperText={roomErrors.customPricePerNight || ""}
                  sx={fieldSx(Boolean(roomErrors.customPricePerNight))}
                />
              </Grid>

              {/* Initial Status */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={fieldLabelSx}>
                  Status
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={roomModal.data?.status || "AVAILABLE"}
                  onChange={(e) => setRoomModal({ ...roomModal, data: { ...roomModal.data, status: e.target.value } })}
                  sx={fieldSx(false)}
                >
                  <MenuItem value="AVAILABLE">Available</MenuItem>
                  <MenuItem value="CLEANING">Cleaning</MenuItem>
                  <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
                  <MenuItem value="OCCUPIED">Occupied</MenuItem>
                  <MenuItem value="BLOCKED">Blocked</MenuItem>
                </TextField>
              </Grid>

              {/* Notes */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={fieldLabelSx}>
                  Notes
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  value={roomModal.data?.notes || ""}
                  onChange={(e) => setRoomModal({ ...roomModal, data: { ...roomModal.data, notes: e.target.value } })}
                  placeholder="Add a short note"
                  sx={fieldSx(false)}
                />
              </Grid>

              

              {/* =================================================== */}
              {/* INTERACTIVE AMENITIES BUILDER SECTION               */}
              {/* =================================================== */}
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    p: 1.5,
                    borderRadius: "12px",
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F7FBFA",
                    border: `1px solid ${themeConfig.border}`,
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.25, gap: 1 }}>
                    <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.9rem" }}>
                      Amenities ({roomModal.data?.amenities?.length || 0})
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => handleResetToCategoryAmenities(roomModal.data?.roomType)}
                      sx={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "none", color: themeConfig.primaryDark, minWidth: 0 }}
                    >
                      Use category amenities
                    </Button>
                  </Box>

                  {Array.isArray(roomModal.data?.amenities) && roomModal.data.amenities.length > 0 && (
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.25 }}>
                      {roomModal.data.amenities.map((am, i) => (
                        <Chip
                          key={i}
                          label={am}
                          onDelete={() => toggleRoomAmenity(am)}
                          size="small"
                          sx={{
                            fontWeight: 600,
                            bgcolor: "#E7F6F2",
                            color: "#0F766E",
                            borderRadius: "8px",
                            "& .MuiChip-deleteIcon": { color: "#0F766E" },
                          }}
                        />
                      ))}
                    </Box>
                  )}

                  <Typography sx={{ ...fieldLabelSx, mb: 0.75 }}>
                    Suggested
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, mb: 1.25 }}>
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
                            fontWeight: 600,
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
                      placeholder="Enter an amenity"
                      value={customAmenityInput}
                      onChange={(e) => setCustomAmenityInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddCustomRoomAmenity();
                        }
                      }}
                      sx={{ flexGrow: 1, "& .MuiOutlinedInput-root": { height: 40, borderRadius: "10px", bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#FFFFFF" } }}
                    />
                    <Button
                      variant="contained"
                      onClick={handleAddCustomRoomAmenity}
                      disabled={!customAmenityInput.trim()}
                      sx={{
                        height: 40,
                        borderRadius: "10px",
                        fontWeight: 700,
                        bgcolor: themeConfig.primary,
                        color: "#FFFFFF",
                        px: 2,
                        boxShadow: "none",
                        textTransform: "none",
                        "&:hover": { bgcolor: themeConfig.primaryDark, boxShadow: "none" },
                      }}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>

          <AppDialogFooter>
            <Button onClick={() => setRoomModal({ ...roomModal, open: false })} variant="outlined" sx={dialogCancelButtonSx(themeConfig, isDarkMode)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={dialogPrimaryButtonSx(themeConfig)}>
              {roomModal.mode === "ADD" ? "Save room" : "Update room"}
            </Button>
          </AppDialogFooter>
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
        slotProps={{ paper: { sx: dialogPaperSx(themeConfig, isDarkMode) } }}
      >
        <form noValidate onSubmit={submitCategory}>
          <AppDialogHeader
            eyebrow={typeModal.mode === "EDIT" ? "Category details" : "New category"}
            title={typeModal.mode === "EDIT" ? "Edit category" : "Add category"}
            icon={<MeetingRoom sx={{ fontSize: 20 }} />}
            onClose={() => setTypeModal({ ...typeModal, open: false })}
          />

          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Category name"
                  required
                  fullWidth
                  size="small"
                  value={typeModal.data.name}
                  onChange={(e) => {
                    setTypeErrors((prev) => ({ ...prev, name: "" }));
                    setTypeModal({ ...typeModal, data: { ...typeModal.data, name: e.target.value } });
                  }}
                  placeholder="Deluxe room"
                  error={Boolean(typeErrors.name)}
                  helperText={typeErrors.name || ""}
                  sx={fieldSx(Boolean(typeErrors.name))}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Description"
                  multiline
                  rows={2}
                  fullWidth
                  size="small"
                  value={typeModal.data.description || ""}
                  onChange={(e) => setTypeModal({ ...typeModal, data: { ...typeModal.data, description: e.target.value } })}
                  placeholder="King bed with a balcony"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <AppDialogFooter>
            <Button onClick={() => setTypeModal({ ...typeModal, open: false })} variant="outlined" sx={dialogCancelButtonSx(themeConfig, isDarkMode)}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" sx={dialogPrimaryButtonSx(themeConfig)}>
              {typeModal.mode === "EDIT" ? "Update category" : "Save category"}
            </Button>
          </AppDialogFooter>
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
        slotProps={{ paper: { sx: dialogPaperSx(themeConfig, isDarkMode) } }}
      >
        <AppDialogHeader
          eyebrow="Rooms"
          title="Trial limit reached"
          icon={<Lock sx={{ fontSize: 20 }} />}
          onClose={() => setTrialLimitModalOpen(false)}
        />
        <DialogContent>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted, lineHeight: 1.6 }}>
            The trial plan includes up to 5 rooms. This hotel already has 5 rooms.
          </Typography>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted, mt: 1.5, fontWeight: 600 }}>
            Upgrade the plan to add more rooms.
          </Typography>
        </DialogContent>
        <AppDialogFooter>
          <Button onClick={() => setTrialLimitModalOpen(false)} variant="outlined" sx={dialogCancelButtonSx(themeConfig, isDarkMode)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              setTrialLimitModalOpen(false);
              if (typeof onTabChange === "function") onTabChange("subscriptions");
            }}
            variant="contained"
            sx={dialogPrimaryButtonSx(themeConfig)}
          >
            View plans
          </Button>
        </AppDialogFooter>
      </Dialog>
    </Box>
  );
}
