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
  TableRow,
} from "@mui/material";
import { AppDialogHeader, AppDialogFooter, dialogPaperSx, dialogCancelButtonSx, dialogPrimaryButtonSx } from "@/shared/components/AppDialog";
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
  Remove,
  Close,
} from "@/shared/icons";

const CATEGORY_STATUSES = [
  { key: "available", label: "Available", tone: "success" },
  { key: "booked", label: "Booked", tone: "warning" },
  { key: "cleaning", label: "Cleaning", tone: "danger" },
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
import { TablePager } from "@/shared/components/DataTable";
import InfiniteScrollSentinel from "@/shared/components/InfiniteScrollSentinel";
import { useInfiniteList } from "@/shared/hooks/useInfiniteList";
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

export const AVAILABLE_BED_TYPES = [
  { label: "King Bed", capacity: 2 },
  { label: "Queen Bed", capacity: 2 },
  { label: "Double Bed", capacity: 2 },
  { label: "Single Bed", capacity: 1 },
  { label: "Twin Bed", capacity: 1 },
  { label: "Bunk Bed", capacity: 2 },
  { label: "Sofa Bed", capacity: 1 },
];

export function bedsFromRoom(room) {
  const raw = room?.beds ?? room?.beds_config ?? room?.bedsConfig;
  let list = raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      list = JSON.parse(raw);
    } catch {
      list = null;
    }
  }
  if (Array.isArray(list) && list.length) {
    return list.map((bed) => {
      const typeName = String(bed.bed_type || bed.bedType || bed.type || "").trim();
      const matched = AVAILABLE_BED_TYPES.find((opt) => {
        const short = opt.label.toLowerCase().replace(" bed", "");
        const incoming = typeName.toLowerCase();
        return incoming === opt.label.toLowerCase() || incoming === short || incoming.includes(short);
      });
      const count = Number(bed.bed_count || bed.bedCount || bed.count) || 1;
      return {
        type: matched ? matched.label : (typeName ? (typeName.toLowerCase().includes("bed") ? typeName : `${typeName} Bed`) : "King Bed"),
        count,
        capacity: matched?.capacity || 2,
      };
    });
  }
  return parseExistingBeds(room?.bedType || room?.bed_type, room?.bedCount || room?.bed_count, room?.seatingCapacity || room?.seating_capacity);
}

function amenitiesFromRoom(room) {
  const raw = room?.amenities;
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return raw.split(",").map((item) => item.trim()).filter(Boolean);
    }
  }
  return [];
}

export function parseExistingBeds(bedTypeStr, fallbackCount, fallbackCapacity) {
  if (!bedTypeStr || typeof bedTypeStr !== "string") {
    return [];
  }
  const parts = bedTypeStr.split(/\+|\band\b|,/i).map((s) => s.trim()).filter(Boolean);
  const parsed = [];
  parts.forEach((part) => {
    const match = part.match(/^(\d+)\s*(?:x|\*|\s)?\s*(.+)$/i);
    let count = 1;
    let rawType = part;
    if (match) {
      count = parseInt(match[1], 10) || 1;
      rawType = match[2].trim();
    }
    const matchedOption = AVAILABLE_BED_TYPES.find(
      (opt) =>
        opt.label.toLowerCase() === rawType.toLowerCase() ||
        opt.label.toLowerCase().includes(rawType.toLowerCase().replace(/s$/, "").replace("size", "").trim()) ||
        rawType.toLowerCase().includes(opt.label.toLowerCase().replace(" bed", ""))
    );
    const cleanType = matchedOption ? matchedOption.label : rawType;
    const cap = matchedOption?.capacity || (cleanType.toLowerCase().includes("single") || cleanType.toLowerCase().includes("twin") || cleanType.toLowerCase().includes("sofa") ? 1 : 2);
    parsed.push({ type: cleanType, count, capacity: cap });
  });
  return parsed.length > 0 ? parsed : [{ type: "King Bed", count: Number(fallbackCount) || 1, capacity: Number(fallbackCapacity) || 2 }];
}

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
  resetToken = 0,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();


  // Custom Amenity Input state for Room Modal & Type Modal
  const [customAmenityInput, setCustomAmenityInput] = useState("");
  const [trialLimitModalOpen, setTrialLimitModalOpen] = useState(false);
  const [roomErrors, setRoomErrors] = useState({});
  const [typeErrors, setTypeErrors] = useState({});
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  // Rooms table uses the standard pager (same as the other tables)
  const [roomPage, setRoomPage] = useState(0);
  const [roomRowsPerPage, setRoomRowsPerPage] = useState(10);

  // Clicking "Rooms & Tariffs" in the sidebar always lands on the category list, not an opened category
  useEffect(() => {
    if (!resetToken) return;
    setSelectedCategoryId(null);
    setRoomPage(0);
  }, [resetToken]);
  const [serverRooms, setServerRooms] = useState(null);
  const [liveTick, setLiveTick] = useState(0);

  // Bed Setup Box local state
  const [selectedBedType, setSelectedBedType] = useState("");
  const [bedQuantity, setBedQuantity] = useState(1);

  const updateBedsConfig = (newBedsList) => {
    const bedCount = newBedsList.reduce((sum, b) => sum + (Number(b.count) || 0), 0);
    const seatingCapacity = newBedsList.reduce((sum, b) => sum + ((Number(b.count) || 0) * (Number(b.capacity) || 1)), 0);
    const bedType = newBedsList.map((b) => `${b.count} ${b.type}`).join(" + ");

    setRoomErrors((prev) => ({ ...prev, beds: "" }));
    setRoomModal((prev) => ({
      ...prev,
      data: {
        ...prev.data,
        bedsConfig: newBedsList,
        bedCount,
        seatingCapacity,
        bedType: bedType || "",
      },
    }));
  };

  const handleAddBedToConfig = () => {
    if (!selectedBedType) return;
    const currentList = Array.isArray(roomModal.data?.bedsConfig) ? [...roomModal.data.bedsConfig] : [];
    const opt = AVAILABLE_BED_TYPES.find((b) => b.label === selectedBedType);
    const cap = opt ? opt.capacity : 2;

    const existingIdx = currentList.findIndex((b) => b.type.toLowerCase() === selectedBedType.toLowerCase());
    if (existingIdx > -1) {
      currentList[existingIdx] = {
        ...currentList[existingIdx],
        count: currentList[existingIdx].count + bedQuantity,
      };
    } else {
      currentList.push({
        type: selectedBedType,
        count: bedQuantity,
        capacity: cap,
      });
    }

    updateBedsConfig(currentList);
    setBedQuantity(1);
  };

  const handleRemoveBedFromConfig = (index) => {
    const currentList = Array.isArray(roomModal.data?.bedsConfig)
      ? [...roomModal.data.bedsConfig]
      : parseExistingBeds(roomModal.data?.bedType, roomModal.data?.bedCount, roomModal.data?.seatingCapacity);
    currentList.splice(index, 1);
    updateBedsConfig(currentList);
  };
  useSocket(
    ["ROOM_UPDATED", "room:category_counts", "BOOKING_CREATED", "BOOKING_UPDATED", "GUEST_CHECKED_OUT", "PAYMENT_RECORDED"],
    () => setLiveTick((tick) => tick + 1)
  );

  const fieldLabelSx = { fontWeight: 600, color: themeConfig.textMuted, mb: 0.6, display: "block", fontSize: "0.78rem" };
  const RequiredMark = () => <Box component="span" sx={{ color: themeConfig.tones.danger.color }}> *</Box>;
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

    const bedsList = Array.isArray(data.bedsConfig) && data.bedsConfig.length > 0
      ? data.bedsConfig
      : parseExistingBeds(data.bedType, data.bedCount, data.seatingCapacity);

    if (!bedsList || bedsList.length === 0 || Number(data.bedCount || bedsList.reduce((s, b) => s + b.count, 0)) < 1) {
      errors.beds = "Please add at least one bed.";
    }

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

  const openEditRoom = async (room) => {
    let detail = room || {};
    const id = room?.id || room?._id;
    if (id) {
      try {
        const res = await apiRequest(
          (typeof API_ENDPOINTS.ROOMS?.BY_ID === "function" && API_ENDPOINTS.ROOMS.BY_ID(id)) || `${API_ENDPOINTS.ROOMS.ALL}/${id}`,
          { forceRefresh: true }
        );
        const fetched = res?.data?.room || res?.data?.data || res?.data;
        if (fetched && typeof fetched === "object" && !Array.isArray(fetched)) detail = { ...room, ...fetched };
      } catch {
        detail = room;
      }
    }
    const existingBeds = bedsFromRoom(detail);
    const bedCount = existingBeds.reduce((sum, bed) => sum + (Number(bed.count) || 0), 0);
    const seatingCapacity = existingBeds.reduce((sum, bed) => sum + (Number(bed.count) || 0) * (Number(bed.capacity) || 1), 0);
    const roomTypeId =
      detail.room_type_id ||
      detail.roomTypeId ||
      (typeof detail.roomType === "object" ? (detail.roomType?._id || detail.roomType?.id) : detail.roomType) ||
      selectedCategory?._id ||
      selectedCategory?.id ||
      "";
    setSelectedBedType("");
    setRoomModal({
      open: true,
      mode: "EDIT",
      data: {
        _id: detail._id || detail.id,
        roomNumber: detail.roomNumber || detail.room_number || "",
        roomType: roomTypeId,
        floor: detail.floor ?? "",
        bedsConfig: existingBeds,
        bedCount,
        bedType: existingBeds.map((bed) => `${bed.count} ${bed.type}`).join(" + "),
        seatingCapacity,
        customPricePerNight: detail.customPricePerNight ?? detail.custom_price_per_night ?? "",
        status: detail.status || "AVAILABLE",
        notes: detail.notes || "",
        amenities: amenitiesFromRoom(detail),
        cleaningDurationMinutes: detail.cleaningDurationMinutes ?? detail.cleaning_duration_minutes ?? 15,
        is_active: detail.is_active !== false && detail.isActive !== false,
      },
    });
  };

  const handleOpenAddRoomForCategory = (category) => {
    if (!category && roomTypes.length === 0) return;
    if (isTrial && rooms.length >= 5) {
      setTrialLimitModalOpen(true);
      return;
    }

    const catId = category?._id || category?.id || "";
    setSelectedBedType("");
    setBedQuantity(1);

    setRoomModal({
      open: true,
      mode: "ADD",
      data: {
        _id: "",
        roomNumber: "",
        roomType: catId,
        floor: "",
        bedsConfig: [],
        bedCount: 0,
        bedType: "",
        seatingCapacity: 0,
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
  const totalCategoryRooms = serverRooms ? serverRooms.total : selectedRooms.length;
  const showCategoryGridOnly = !selectedCategory && roomTypes.length > 0;

  // Lazy loading: category cards load in batches while scrolling
  const {
    visibleItems: pagedCategories,
    visibleCount: visibleCategoryCount,
    hasMore: hasMoreCategories,
    loadMore: loadMoreCategories,
  } = useInfiniteList(roomTypes, { pageSize: 12 });

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%", overflowX: "hidden", px: { xs: 1.5, sm: 2.5, md: 3 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 } }}>
      <Box
        sx={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, minWidth: 0 }}>
          {[
            { label: "Total rooms", value: totalRoomsCount, icon: <MeetingRoom sx={{ fontSize: 20 }} /> },
            { label: "Categories", value: roomTypes.length, icon: <Category sx={{ fontSize: 20 }} /> },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                height: 56,
                pl: 1.25,
                pr: 2.5,
                borderRadius: "12px",
                border: `1px solid ${themeConfig.border}`,
                bgcolor: themeConfig.bgCard || (themeConfig.bgCard),
                boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(32, 41, 35, 0.04)",
              }}
            >
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  flexShrink: 0,
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: themeConfig.primary,
                  bgcolor: themeConfig.champagne || "#EAF6F3",
                }}
              >
                {item.icon}
              </Box>
              <Box>
                <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.7rem", fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase", lineHeight: 1.2 }}>
                  {item.label}
                </Typography>
                <Typography sx={{ color: themeConfig.textMain, fontWeight: 800, fontSize: "1.2rem", lineHeight: 1.3 }}>
                  {item.value}
                </Typography>
              </Box>
            </Box>
          ))}
        </Box>

        <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.25 }}>
          {roomTypes.length > 0 && (
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => handleOpenAddRoomForCategory(null)}
              sx={{
                height: 40,
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 700,
                px: 2,
                color: themeConfig.accent,
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

      <Card
        elevation={0}
        sx={{
          // Category grid sits directly on the page; the card background is only used for an opened category / empty state
          ...(showCategoryGridOnly
            ? { border: "none", bgcolor: "transparent", borderRadius: 0, overflow: "visible", "&:hover": { boxShadow: "none" } }
            : { borderRadius: "20px", border: `1.5px solid ${themeConfig.border}`, bgcolor: themeConfig.bgCard }),
          boxShadow: "none",
        }}
      >
        <CardContent sx={showCategoryGridOnly ? { p: 0, "&:last-child": { pb: 0 } } : { p: { xs: 2, sm: 3 }, "&:last-child": { pb: { xs: 2, sm: 3 } } }}>
          {selectedCategory ? <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1.5 }}>
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
            ) : null}
          </Box> : null}

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
                <>
                <TableContainer sx={{ overflowX: "auto" }}>
                  <Table size="medium" sx={{ width: "100%", minWidth: 640 }}>
                    <TableHead>
                      <TableRow>
                        {["Room", "Floor", "Nightly rate", "Status"].map((heading) => (
                          <TableCell key={heading}>
                            {heading}
                          </TableCell>
                        ))}
                        <TableCell align="right">
                          Actions
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pagedRooms.map((room) => {
                        const tariff = Number(room.customPricePerNight || selectedCategory.basePrice || room.basePrice || 0);
                        const statusKey = String(room.status || "AVAILABLE").toUpperCase();
                        const statusMeta = {
                          AVAILABLE: { label: "Available", color: themeConfig.tones.success.color, bg: themeConfig.tones.success.bg },
                          OCCUPIED: { label: "Occupied", color: themeConfig.tones.warning.color, bg: themeConfig.tones.warning.bg },
                          RESERVED: { label: "Reserved", color: themeConfig.tones.warning.color, bg: themeConfig.tones.warning.bg },
                          CLEANING: { label: "Cleaning", color: themeConfig.tones.danger.color, bg: themeConfig.tones.danger.bg },
                          MAINTENANCE: { label: "Maintenance", color: themeConfig.tones.danger.color, bg: themeConfig.tones.danger.bg },
                          BLOCKED: { label: "Blocked", color: themeConfig.textMuted, bg: themeConfig.bgSubtle },
                        }[statusKey] || { label: statusKey, color: themeConfig.textMuted, bg: themeConfig.bgSubtle };
                        const actionSx = {
                          width: 32,
                          height: 32,
                          borderRadius: "8px",
                          color: themeConfig.textMuted,
                          "&:hover": { bgcolor: themeConfig.bgMain, color: themeConfig.textMain },
                        };
                        return (
                          <TableRow key={room._id || room.roomNumber}>
                            <TableCell>
                              <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.92rem" }}>
                                Room {room.roomNumber}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 600, color: themeConfig.textMain, fontSize: "0.9rem" }}>
                                Floor {room.floor || 1}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography sx={{ fontWeight: 700, color: themeConfig.accent, fontSize: "0.9rem", whiteSpace: "nowrap" }}>
                                ₹{tariff.toLocaleString("en-IN")} / night
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={statusMeta.label}
                                size="small"
                                sx={{ fontWeight: 600, borderRadius: "999px", bgcolor: statusMeta.bg, color: statusMeta.color }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 0.25 }}>
                                <Tooltip title="Edit">
                                  <IconButton
                                    size="small"
                                    onClick={() => openEditRoom(room)}
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
                </TableContainer>
                <TablePager
                  count={totalCategoryRooms}
                  page={roomPage}
                  onPageChange={(e, next) => setRoomPage(next)}
                  rowsPerPage={roomRowsPerPage}
                  onRowsPerPageChange={(e) => {
                    setRoomRowsPerPage(parseInt(e.target.value, 10));
                    setRoomPage(0);
                  }}
                />
                </>
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
                      bgcolor: themeConfig.bgCard || (themeConfig.bgCard),
                      boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(32, 41, 35, 0.05), 0 10px 24px rgba(32, 41, 35, 0.08)",
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      transition: "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
                      "&:hover": {
                        borderColor: "#99D5C9",
                        transform: "translateY(-2px)",
                        boxShadow: isDarkMode ? "none" : "0 2px 6px rgba(32, 41, 35, 0.06), 0 16px 32px rgba(32, 41, 35, 0.1)",
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
                          <Box key={item.key} sx={{ width: `${(statusCounts[item.key] / (available + booked + cleaning || 1)) * 100}%`, bgcolor: themeConfig.tones[item.tone].color, opacity: 0.85 }} />
                        ) : null
                      )}
                    </Box>

                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
                      {CATEGORY_STATUSES.map((item) => {
                        const tone = themeConfig.tones[item.tone];
                        return (
                        <Box
                          key={item.key}
                          sx={{
                            borderRadius: "12px",
                            bgcolor: tone.bg,
                            border: `1px solid ${tone.border}`,
                            boxShadow: isDarkMode ? "none" : "0 2px 8px rgba(32, 41, 35, 0.05)",
                            py: 1.1,
                            px: 0.5,
                            textAlign: "center",
                          }}
                        >
                          <Typography sx={{ fontWeight: 700, color: tone.color, fontSize: "0.95rem", lineHeight: 1 }}>{statusCounts[item.key]}</Typography>
                          <Typography sx={{ color: tone.color, fontSize: "0.62rem", fontWeight: 600, mt: 0.6, lineHeight: 1.2 }}>{item.label}</Typography>
                        </Box>
                        );
                      })}
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>
      {!selectedCategory && roomTypes.length > 0 && (
        <InfiniteScrollSentinel
          hasMore={hasMoreCategories}
          onLoadMore={loadMoreCategories}
          loadedCount={visibleCategoryCount}
          endLabel={roomTypes.length > 12 ? `Showing all ${roomTypes.length} categories` : undefined}
        />
      )}

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

              {/* Nightly Rate */}
              <Grid size={{ xs: 12, sm: 6 }}>
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

              {/* ========================================================================= */}
              {/* BED SETUP BOX (TYPE SELECTOR + QUANTITY COUNTER + ADD BUTTON + LIST)      */}
              {/* ========================================================================= */}
              <Grid size={{ xs: 12 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#F8FAFC",
                    border: `1px solid ${roomErrors.beds ? "#DC2626" : (isDarkMode ? themeConfig.border : "#E2E8F0")}`,
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5, flexWrap: "wrap", gap: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <KingBed sx={{ fontSize: 18, color: themeConfig.primary }} />
                      <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: themeConfig.textMain }}>
                        Bed setup<RequiredMark />
                      </Typography>
                    </Box>
                    {/* Live Badge for total beds & guests capacity */}
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Chip
                        size="small"
                        label={`${roomModal.data?.bedCount || 0} Beds`}
                        sx={{ fontWeight: 700, bgcolor: themeConfig.champagne, color: themeConfig.accent, borderRadius: "6px" }}
                      />
                      <Chip
                        size="small"
                        label={`${roomModal.data?.seatingCapacity || 0} Guests capacity`}
                        sx={{ fontWeight: 700, bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.2)" : "#DBEAFE", color: "#1D4ED8", borderRadius: "6px" }}
                      />
                    </Box>
                  </Box>

                  {/* Bed selector row: Dropdown + Counter + Add button */}
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, flexWrap: "wrap", mb: 1.5 }}>
                    <TextField
                      select
                      size="small"
                      value={selectedBedType}
                      onChange={(e) => setSelectedBedType(e.target.value)}
                      slotProps={{ select: { displayEmpty: true } }}
                      sx={{
                        flex: { xs: "1 1 100%", sm: "1 1 auto" },
                        minWidth: 180,
                        "& .MuiOutlinedInput-root": {
                          height: 40,
                          borderRadius: "10px",
                          bgcolor: themeConfig.bgCard,
                        },
                      }}
                    >
                      <MenuItem value="" disabled>
                        Select bed
                      </MenuItem>
                      {AVAILABLE_BED_TYPES.map((b) => (
                        <MenuItem key={b.label} value={b.label}>
                          {b.label} ({b.capacity} {b.capacity === 1 ? "guest" : "guests"}/bed)
                        </MenuItem>
                      ))}
                    </TextField>

                    {/* Counter [- qty +] */}
                    <Box
                      sx={{
                        display: "inline-flex",
                        alignItems: "center",
                        border: `1px solid ${isDarkMode ? themeConfig.border : "#CBD5E1"}`,
                        borderRadius: "10px",
                        height: 40,
                        px: 0.5,
                        bgcolor: themeConfig.bgCard,
                      }}
                    >
                      <IconButton
                        size="small"
                        onClick={() => setBedQuantity((q) => Math.max(1, q - 1))}
                        disabled={bedQuantity <= 1}
                        sx={{ width: 28, height: 28, color: themeConfig.textMain }}
                      >
                        <Remove sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Typography
                        sx={{
                          minWidth: 28,
                          textAlign: "center",
                          fontWeight: 700,
                          fontSize: "0.88rem",
                          color: themeConfig.textMain,
                          userSelect: "none",
                        }}
                      >
                        {bedQuantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => setBedQuantity((q) => Math.min(10, q + 1))}
                        sx={{ width: 28, height: 28, color: themeConfig.textMain }}
                      >
                        <Add sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Box>

                    {/* Add Bed Button */}
                    <Button
                      variant="contained"
                      startIcon={<Add sx={{ fontSize: 18 }} />}
                      onClick={handleAddBedToConfig}
                      disabled={!selectedBedType}
                      sx={{
                        height: 40,
                        borderRadius: "10px",
                        fontWeight: 700,
                        bgcolor: themeConfig.primary,
                        color: themeConfig.onPrimary,
                        px: 2,
                        textTransform: "none",
                        boxShadow: "none",
                        "&:hover": { bgcolor: themeConfig.primaryDark, boxShadow: "none" },
                      }}
                    >
                      Add bed
                    </Button>
                  </Box>

                  {/* Configured beds tag list */}
                  {(() => {
                    const bedsList = Array.isArray(roomModal.data?.bedsConfig)
                      ? roomModal.data.bedsConfig
                      : parseExistingBeds(roomModal.data?.bedType, roomModal.data?.bedCount, roomModal.data?.seatingCapacity);

                    if (bedsList.length === 0) {
                      return (
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontStyle: "italic" }}>
                          No beds added yet. Select a bed type and click "Add bed".
                        </Typography>
                      );
                    }

                    return (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {bedsList.map((item, idx) => (
                          <Box
                            key={idx}
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                              px: 1.5,
                              py: 0.75,
                              borderRadius: "10px",
                              bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "#FFFFFF",
                              border: `1px solid ${isDarkMode ? themeConfig.border : "#E2E8F0"}`,
                              boxShadow: isDarkMode ? "none" : "0 1px 3px rgba(0,0,0,0.04)",
                            }}
                          >
                            <KingBed sx={{ fontSize: 16, color: themeConfig.primary }} />
                            <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: themeConfig.textMain }}>
                              {item.count} × {item.type}
                            </Typography>
                            <Typography sx={{ fontSize: "0.74rem", color: themeConfig.textMuted }}>
                              ({item.count * item.capacity} guests)
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleRemoveBedFromConfig(idx)}
                              sx={{
                                width: 20,
                                height: 20,
                                ml: 0.5,
                                color: themeConfig.textMuted,
                                "&:hover": { color: "#EF4444", bgcolor: "rgba(239,68,68,0.1)" },
                              }}
                            >
                              <Close sx={{ fontSize: 14 }} />
                            </IconButton>
                          </Box>
                        ))}
                      </Box>
                    );
                  })()}

                  {roomErrors.beds && (
                    <Typography variant="caption" sx={{ color: "#DC2626", fontWeight: 700, display: "block", mt: 1 }}>
                      {roomErrors.beds}
                    </Typography>
                  )}
                </Box>
              </Grid>

              {/* Notes (room status is not edited here: new rooms start as Available, existing rooms keep theirs) */}
              <Grid size={{ xs: 12 }}>
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
                      sx={{ fontSize: "0.78rem", fontWeight: 700, textTransform: "none", color: themeConfig.accent, minWidth: 0 }}
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
                            bgcolor: themeConfig.champagne,
                            color: themeConfig.accent,
                            borderRadius: "8px",
                            "& .MuiChip-deleteIcon": { color: themeConfig.accent },
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
                          icon={isSelected ? <Check sx={{ fontSize: "16px !important", color: `${themeConfig.onPrimary} !important` }} /> : React.cloneElement(am.icon, { sx: { fontSize: "16px !important", color: isDarkMode ? `${themeConfig.accent} !important` : "inherit" } })}
                          label={am.label}
                          clickable
                          onClick={() => toggleRoomAmenity(am.label)}
                          size="small"
                          sx={{
                            borderRadius: "8px",
                            fontWeight: 600,
                            fontSize: "0.75rem",
                            bgcolor: isSelected ? (themeConfig.primaryDark || "#115E59") : (themeConfig.bgCard),
                            color: isSelected ? themeConfig.onPrimary : themeConfig.textMain,
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
                        color: themeConfig.onPrimary,
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
