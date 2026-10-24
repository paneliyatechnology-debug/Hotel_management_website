
"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  Button,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
} from "@mui/material";
import {
  Close,
  MeetingRoom,
  KingBed,
  Apartment,
  Hotel,
  Bed,
  ArrowBack,
  ArrowForward,
  Search,
  Favorite,
  FamilyRestroom,
  Diamond,
  Villa,
  SingleBed,
  Work,
  Bolt,
  KeyboardArrowDown,
  KeyboardArrowRight,
  CurrencyRupee,
  Check,
  Person,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import EmptyState from "@/shared/components/EmptyState";
import InfiniteScrollSentinel from "@/shared/components/InfiniteScrollSentinel";
import CheckoutDialog from "@/receptionist/components/CheckoutDialog";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { useSocket } from "@/shared/context/SocketContext";
import { applyRoomStatusEvent, mergeCategoryCounts } from "@/shared/utils/liveSync";
import {
  buildListQuery,
  extractRoomsFromResponse,
  extractRoomTypesFromResponse,
  mergeById,
} from "@/shared/utils/listQuery";

/** Match on-screen load batches (category cards + room cards) */
const CATEGORY_PAGE_SIZE = 12;
const ROOMS_PAGE_SIZE = 12;

// Survive React Strict Mode remount so page-1 is not fired twice for the same key
let lastRoomTypesFetchKey = "";
let lastRoomTypesFetchAt = 0;

function readCount(source, snakeKey, camelKey) {
  const value = source?.[snakeKey] ?? source?.[camelKey];
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

/** Inventory chips on category cards come from room-types API — no rooms list needed */
function categoryStatusCounts(category) {
  const counts = category?.room_status_counts || category?.roomStatusCounts || category?.summary || {};
  const available = readCount(counts, "available_count", "availableCount");
  const occupied = readCount(counts, "occupied_count", "occupiedCount");
  const reserved = readCount(counts, "reserved_count", "reservedCount");
  const cleaning = readCount(counts, "cleaning_count", "cleaningCount");
  const maintenance =
    readCount(counts, "maintenance_count", "maintenanceCount") +
    readCount(counts, "blocked_count", "blockedCount");
  const statedTotal = readCount(counts, "total_room_count", "totalRoomCount");
  const booked = occupied + reserved;
  return {
    available,
    occupied: booked,
    reserved: 0,
    cleaning,
    maintenance,
    totalRooms: statedTotal || available + booked + cleaning + maintenance,
  };
}

export default function AvailableRoomsPage({
  user,
  hotelSettings = {
    checkInTime: "14:00",
    checkOutTime: "12:00",
    timezone: "Asia/Kolkata",
    upiId: "jatinkakadiya234-1@okicici",
  },
  onRoomStatusChange,
  onCheckOut,
  onSelectRoomForCheckIn,
  initialSelectedCategory = null,
  onClearInitialCategory,
  onNavigateTab,
  resetToken = 0,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();

  // Category list → room-types only. Room rows load only after opening a category.
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [typesPage, setTypesPage] = useState(1);
  const [typesHasMore, setTypesHasMore] = useState(false);
  const [typesLoading, setTypesLoading] = useState(true);
  const [typesLoadingMore, setTypesLoadingMore] = useState(false);
  const [roomsPage, setRoomsPage] = useState(1);
  const [roomsHasMore, setRoomsHasMore] = useState(false);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsLoadingMore, setRoomsLoadingMore] = useState(false);
  const [roomsError, setRoomsError] = useState("");

  // Guest name comes from the room payload (rooms API / room:status) — no bookings list lookup
  const getRoomGuestName = (room) => {
    const st = String(room?.status || "").toUpperCase();
    if (!room || (st !== "OCCUPIED" && st !== "RESERVED" && st !== "BOOKED")) {
      return "";
    }
    return (
      room.primary_guest_name ||
      room.guestName ||
      room.guest_name ||
      room.current_guest_name ||
      room.currentGuestName ||
      ""
    ).trim();
  };

  const getRoomBookingId = (room) =>
    room?.current_booking_id ?? room?.currentBookingId ?? null;

  // Box View Navigation: null = Categories Overview, string (categoryId) = Category Drilldown
  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (typeof window === "undefined") return null;
    const stored = sessionStorage.getItem("receptionist.rooms.category");
    return stored && stored !== "none" ? stored : null;
  });

  // Track if user navigated here from another route (e.g. Dashboard)
  const [cameFromExternalRoute, setCameFromExternalRoute] = useState(false);

  // Auto-select category when navigated from Dashboard
  useEffect(() => {
    if (initialSelectedCategory) {
      setSelectedCategory(initialSelectedCategory);
      setCameFromExternalRoute(true);
      if (onClearInitialCategory) onClearInitialCategory();
    }
  }, [initialSelectedCategory]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedCategory) sessionStorage.setItem("receptionist.rooms.category", String(selectedCategory));
  }, [selectedCategory]);

  // Clicking "Rooms" in the sidebar always lands on the category list, never on a previously opened category.
  // ("none" also stops the single-category auto-select below from re-opening it.)
  useEffect(() => {
    if (!resetToken) return;
    if (typeof window !== "undefined") sessionStorage.setItem("receptionist.rooms.category", "none");
    setSelectedCategory(null);
    setCameFromExternalRoute(false);
  }, [resetToken]);

  // Filters for Table View & Category Drilldown
  const [roomSearch, setRoomSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [selectedFloor, setSelectedFloor] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [debouncedRoomSearch, setDebouncedRoomSearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedRoomSearch(roomSearch.trim()), 300);
    return () => clearTimeout(t);
  }, [roomSearch]);

  // Category card search (API)
  const [categorySearch, setCategorySearch] = useState("");
  const [debouncedCategorySearch, setDebouncedCategorySearch] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedCategorySearch(categorySearch.trim()), 300);
    return () => clearTimeout(t);
  }, [categorySearch]);

  const typesInFlightRef = useRef(false);

  const fetchRoomTypesPage = async (pageNum, { append = false } = {}) => {
    if (typesInFlightRef.current) return;
    typesInFlightRef.current = true;
    if (append) setTypesLoadingMore(true);
    else setTypesLoading(true);
    try {
      const q = buildListQuery({
        page: pageNum,
        limit: CATEGORY_PAGE_SIZE,
        search: debouncedCategorySearch || undefined,
      });
      const res = await apiRequest(`${API_ENDPOINTS.RECEPTIONIST.ROOM_TYPES}?${q}`);
      const { roomTypes: pageTypes, page, totalPages } = extractRoomTypesFromResponse(res);
      setRoomTypes((prev) => (append ? mergeById(prev, pageTypes) : pageTypes));
      setTypesPage(page || pageNum);
      // No more pages if this batch was short — avoids empty page-2 on short category lists
      const fullPage = pageTypes.length >= CATEGORY_PAGE_SIZE;
      setTypesHasMore(fullPage && (page || pageNum) < (totalPages || 1));
      setRoomsError("");
    } catch (err) {
      if (!append) setRoomTypes([]);
      setRoomsError(err?.message || "Could not load room types");
      setTypesHasMore(false);
    } finally {
      typesInFlightRef.current = false;
      setTypesLoading(false);
      setTypesLoadingMore(false);
    }
  };

  const roomsInFlightRef = useRef(false);

  const fetchRoomsPage = async (pageNum, { append = false } = {}) => {
    if (!selectedCategory) {
      setRooms([]);
      setRoomsHasMore(false);
      setRoomsLoading(false);
      return;
    }
    if (roomsInFlightRef.current) return;
    roomsInFlightRef.current = true;
    if (append) setRoomsLoadingMore(true);
    else setRoomsLoading(true);
    try {
      const statusParam = selectedStatus === "ALL" ? undefined : selectedStatus;
      const q = buildListQuery({
        page: pageNum,
        limit: ROOMS_PAGE_SIZE,
        room_type_id: selectedCategory,
        floor: selectedFloor !== "ALL" ? selectedFloor : undefined,
        status: statusParam,
        search: debouncedRoomSearch || undefined,
      });
      const res = await apiRequest(`${API_ENDPOINTS.RECEPTIONIST.ROOMS}?${q}`);
      const { rooms: pageRooms, page, totalPages } = extractRoomsFromResponse(res);
      setRooms((prev) => (append ? mergeById(prev, pageRooms) : pageRooms));
      setRoomsPage(page || pageNum);
      const fullPage = pageRooms.length >= ROOMS_PAGE_SIZE;
      setRoomsHasMore(fullPage && (page || pageNum) < (totalPages || 1));
      setRoomsError("");
    } catch (err) {
      if (!append) setRooms([]);
      setRoomsError(err?.message || "Could not load rooms");
      setRoomsHasMore(false);
    } finally {
      roomsInFlightRef.current = false;
      setRoomsLoading(false);
      setRoomsLoadingMore(false);
    }
  };

  // Category list: room-types with the same page size as the card grid (once per key)
  useEffect(() => {
    if (selectedCategory) return;
    const key = `types:1:${resetToken}:${debouncedCategorySearch}`;
    const now = Date.now();
    // Block Strict Mode double-mount; allow a real revisit after a short gap
    if (lastRoomTypesFetchKey === key && now - lastRoomTypesFetchAt < 1000) return;
    lastRoomTypesFetchKey = key;
    lastRoomTypesFetchAt = now;
    fetchRoomTypesPage(1, { append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, resetToken, debouncedCategorySearch]);

  // Room cards: only after a category is opened
  useEffect(() => {
    if (!selectedCategory) {
      setRooms([]);
      setRoomsHasMore(false);
      setRoomsLoading(false);
      return;
    }
    fetchRoomsPage(1, { append: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, selectedFloor, selectedStatus, debouncedRoomSearch]);

  const loadMoreCategoriesFromApi = () => {
    if (selectedCategory || !typesHasMore || typesLoadingMore || typesLoading) return;
    fetchRoomTypesPage(typesPage + 1, { append: true });
  };

  const loadMoreRoomsFromApi = () => {
    if (!selectedCategory || !roomsHasMore || roomsLoadingMore || roomsLoading) return;
    fetchRoomsPage(roomsPage + 1, { append: true });
  };

  // Live patch room cards; category badge counts stay current on the grid view
  useSocket(["room:status"], (payload) => {
    setRooms((prev) => applyRoomStatusEvent(prev, payload));
  });
  useSocket(["room:category_counts"], (payload) => {
    setRoomTypes((prev) => mergeCategoryCounts(prev, payload));
  });
  useSocket(["GUEST_CHECKED_OUT", "BOOKING_CREATED", "BOOKING_UPDATED"], () => {
    if (!selectedCategory) {
      fetchRoomTypesPage(1, { append: false });
    }
  });

  // Multi-Room Selection State for Quick Bulk Booking & Check-In
  const [selectedRoomIds, setSelectedRoomIds] = useState([]);

  // Toggle room selection for multi-room check-in
  const handleToggleRoomSelection = (roomId, e) => {
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    setSelectedRoomIds((prev) => {
      if (prev.includes(roomId)) {
        return prev.filter((id) => id !== roomId);
      } else {
        return [...prev, roomId];
      }
    });
  };

  // Selected room objects list
  const selectedRoomsList = useMemo(() => {
    return rooms.filter((r) => selectedRoomIds.map(String).includes(String(r._id)));
  }, [rooms, selectedRoomIds]);

  // Combined stats for selected rooms
  const selectedStats = useMemo(() => {
    let totalRate = 0;
    selectedRoomsList.forEach((r) => {
      const rtObj = typeof r.roomType === "object" ? r.roomType : null;
      const rate = r.customPricePerNight || rtObj?.basePrice || r.basePrice || 0;
      totalRate += rate;
    });
    return {
      count: selectedRoomsList.length,
      totalRate,
      roomNumbers: selectedRoomsList.map((r) => `#${r.roomNumber}`).join(", "),
    };
  }, [selectedRoomsList]);

  // Bulk select / deselect available rooms in current view
  const handleSelectAllAvailable = (roomList = []) => {
    const availIds = roomList.filter((r) => r.status === "AVAILABLE").map((r) => r._id);
    if (availIds.length === 0) return;
    setSelectedRoomIds((prev) => {
      const allSelected = availIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !availIds.includes(id));
      } else {
        return Array.from(new Set([...prev, ...availIds]));
      }
    });
  };

  // Auto-clear selection or remove non-AVAILABLE rooms if room statuses change after check-in/booking
  useEffect(() => {
    if (selectedRoomIds.length > 0) {
      const stillAvailableIds = selectedRoomIds.filter((id) => {
        const found = rooms.find((r) => String(r._id) === String(id));
        return found && found.status === "AVAILABLE";
      });
      if (stillAvailableIds.length !== selectedRoomIds.length) {
        setSelectedRoomIds(stillAvailableIds);
      }
    }
  }, [rooms, selectedRoomIds]);

  const handleClearSelection = () => {
    setSelectedRoomIds([]);
  };

  const handleProceedWithSelectedRooms = () => {
    if (selectedRoomsList.length === 0) return;
    if (onSelectRoomForCheckIn) {
      onSelectRoomForCheckIn(selectedRoomsList);
    }
    setSelectedRoomIds([]);
  };

  // Check-out dialog target (room + its active booking)
  const [checkoutTarget, setCheckoutTarget] = useState(null);

  // Dynamic Category Icon helper
  const getCategoryIcon = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("coupl") || n.includes("copol") || n.includes("copul") || n.includes("honey") || n.includes("romant") || n.includes("love"))
      return <Favorite sx={{ fontSize: 20, color: "#E11D48" }} />;
    if (n.includes("fam") || n.includes("group") || n.includes("quad"))
      return <FamilyRestroom sx={{ fontSize: 20, color: "#059669" }} />;
    if (n.includes("villa") || n.includes("cottage") || n.includes("penthouse") || n.includes("resort") || n.includes("bungalow"))
      return <Villa sx={{ fontSize: 20, color: "#0891B2" }} />;
    if (n.includes("sweet") || n.includes("suite") || n.includes("deluxe") || n.includes("super") || n.includes("luxury") || n.includes("vip") || n.includes("presid"))
      return <Diamond sx={{ fontSize: 20, color: "#D97706" }} />;
    if (n.includes("single") || n.includes("solo"))
      return <SingleBed sx={{ fontSize: 20, color: "#6366F1" }} />;
    if (n.includes("business") || n.includes("exec") || n.includes("corporate"))
      return <Work sx={{ fontSize: 20, color: "#2563EB" }} />;
    if (n.includes("king") || n.includes("double") || n.includes("queen"))
      return <KingBed sx={{ fontSize: 20, color: "#10B981" }} />;
    return <Hotel sx={{ fontSize: 20 }} />;
  };

  // Categories from room-types API counts only (rooms list is unused on this screen)
  const categoryStats = useMemo(() => {
    return (roomTypes || [])
      .map((rt) => {
        const id = String(rt._id || rt.id || "");
        if (!id) return null;
        const counts = categoryStatusCounts(rt);
        return {
          _id: id,
          id,
          name: rt.name,
          description: rt.description || "",
          basePrice: rt.basePrice || rt.price || 0,
          bedCount: rt.bedCount || rt.beds || 1,
          bedType: rt.bedType || "1 King Bed",
          capacity: rt.capacity || { adults: rt.max_adults || rt.adults || 2, children: rt.max_children || rt.children || 1 },
          amenities: rt.amenities || [],
          totalRooms: counts.totalRooms,
          available: counts.available,
          occupied: counts.occupied,
          cleaning: counts.cleaning,
          maintenance: counts.maintenance,
          reserved: counts.reserved,
          rooms: [],
        };
      })
      .filter((cat) => cat && (cat.totalRooms > 0 || cat.available > 0 || cat.occupied > 0 || cat.cleaning > 0));
  }, [roomTypes]);

  // API already returns the current pages — search is sent as query param
  const filteredCategories = categoryStats;
  const visibleCategories = filteredCategories;
  const visibleCategoryCount = visibleCategories.length;
  const hasMoreCategories = typesHasMore;
  const loadMoreCategories = loadMoreCategoriesFromApi;

  const overviewTotals = useMemo(
    () =>
      categoryStats.reduce(
        (acc, cat) => ({ total: acc.total + cat.totalRooms, available: acc.available + cat.available }),
        { total: 0, available: 0 }
      ),
    [categoryStats]
  );

  // Overall inventory from room-types counts (same source as category cards)
  const globalStats = useMemo(
    () =>
      categoryStats.reduce(
        (acc, cat) => ({
          total: acc.total + cat.totalRooms,
          available: acc.available + cat.available,
          occupied: acc.occupied + cat.occupied + cat.reserved,
          cleaning: acc.cleaning + cat.cleaning,
          maintenance: acc.maintenance + cat.maintenance,
        }),
        { total: 0, available: 0, occupied: 0, cleaning: 0, maintenance: 0 }
      ),
    [categoryStats]
  );

  // Current selected category object (for Box drill-down)
  const activeCategory = useMemo(() => {
    if (!selectedCategory) return null;
    const sel = String(selectedCategory).trim().toLowerCase();
    return (
      categoryStats.find(
        (c) =>
          String(c._id || c.id || "").trim().toLowerCase() === sel ||
          (c.name && c.name.trim().toLowerCase() === sel)
      ) || null
    );
  }, [selectedCategory, categoryStats]);

  // Auto-reset invalid selectedCategory so user is never stuck in an empty state
  useEffect(() => {
    if (selectedCategory && categoryStats.length > 0 && !activeCategory) {
      setSelectedCategory(null);
    }
  }, [selectedCategory, activeCategory, categoryStats]);

  // Floors for filters (only meaningful after a category is opened)
  const distinctFloors = useMemo(() => {
    return Array.from(new Set(rooms.map((r) => r.floor || 1))).sort((a, b) => a - b);
  }, [rooms]);

  // Filtered rooms for Table View
  const filteredAllRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (selectedCategoryFilter !== "ALL") {
        const rtObj = typeof r.roomType === "object" ? r.roomType : (typeof r.room_type === "object" ? r.room_type : null);
        const rtId = String(rtObj?._id || rtObj?.id || r.roomType || r.room_type || r.room_type_id || "");
        const rtName = rtObj?.name || r.type || r.room_type_name || "";
        const targetCat = categoryStats.find(
          (c) => String(c._id) === String(selectedCategoryFilter) || String(c.id) === String(selectedCategoryFilter)
        );
        if (targetCat) {
          const matchId = String(targetCat._id) === rtId || String(targetCat.id) === rtId;
          const matchName = targetCat.name && rtName && targetCat.name.trim().toLowerCase() === rtName.trim().toLowerCase();
          if (!matchId && !matchName) return false;
        } else if (rtId !== selectedCategoryFilter) {
          return false;
        }
      }
      if (selectedFloor !== "ALL" && String(r.floor || 1) !== String(selectedFloor)) {
        return false;
      }
      if (selectedStatus !== "ALL") {
        const st = String(r.status || "").toUpperCase();
        if (selectedStatus === "OCCUPIED") {
          if (st !== "OCCUPIED" && st !== "BOOKED" && st !== "RESERVED") return false;
        } else if (st !== selectedStatus) {
          return false;
        }
      }
      if (roomSearch.trim()) {
        const q = roomSearch.toLowerCase();
        const matchNum = r.roomNumber?.toString().toLowerCase().includes(q);
        const gName = getRoomGuestName(r);
        const matchGuest = gName.toLowerCase().includes(q);
        const rtObj = typeof r.roomType === "object" ? r.roomType : (typeof r.room_type === "object" ? r.room_type : null);
        const matchCat = (rtObj?.name || r.type || r.room_type_name || "").toLowerCase().includes(q);
        return matchNum || matchGuest || matchCat;
      }
      return true;
    }).sort((a, b) => {
      const numA = parseInt(a.roomNumber, 10) || 0;
      const numB = parseInt(b.roomNumber, 10) || 0;
      return numA - numB;
    });
  }, [rooms, categoryStats, selectedCategoryFilter, selectedFloor, selectedStatus, roomSearch]);

  // Drill-down room cards come from rooms API for the selected category
  const filteredCategoryRooms = useMemo(() => {
    if (!activeCategory) return [];
    return rooms.filter((r) => {
      if (selectedFloor !== "ALL" && String(r.floor || 1) !== String(selectedFloor)) {
        return false;
      }
      if (selectedStatus !== "ALL") {
        const st = String(r.status || "").toUpperCase();
        if (selectedStatus === "OCCUPIED") {
          if (st !== "OCCUPIED" && st !== "BOOKED" && st !== "RESERVED") return false;
        } else if (st !== selectedStatus) {
          return false;
        }
      }
      if (roomSearch.trim()) {
        const q = roomSearch.toLowerCase();
        const matchNum = r.roomNumber?.toString().toLowerCase().includes(q);
        const gName = getRoomGuestName(r);
        const matchGuest = gName.toLowerCase().includes(q);
        return matchNum || matchGuest;
      }
      return true;
    });
  }, [activeCategory, rooms, selectedFloor, selectedStatus, roomSearch]);

  // Server pages are already the visible set — scroll loads the next API page
  const visibleRooms = filteredCategoryRooms;
  const visibleRoomCount = visibleRooms.length;
  const hasMoreRooms = roomsHasMore;
  const loadMoreRooms = loadMoreRoomsFromApi;

  // Open check-out using current_booking_id from the rooms API (not bookings list)
  const handleOpenStatusDialog = (room) => {
    const bookingId = getRoomBookingId(room);
    if (!bookingId) {
      setActionError("No active booking found for this room");
      return;
    }
    setActionError("");
    setCheckoutTarget({
      booking: {
        id: bookingId,
        _id: bookingId,
        guestName: getRoomGuestName(room) || undefined,
      },
      room,
    });
  };

  const [busyRoomId, setBusyRoomId] = useState("");
  const [actionError, setActionError] = useState("");

  const handleMarkAvailable = async (room) => {
    if (!onRoomStatusChange) return;
    const id = String(room?._id || room?.id || "");
    try {
      setActionError("");
      setBusyRoomId(id);
      await onRoomStatusChange(room, "AVAILABLE");
      setRooms((prev) =>
        prev.map((r) =>
          String(r._id || r.id) === id ? { ...r, status: "AVAILABLE", current_booking_id: null, currentBookingId: null } : r
        )
      );
    } catch (err) {
      setActionError(err?.message || "Failed to mark room available");
    } finally {
      setBusyRoomId("");
    }
  };

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%", overflowX: "hidden", px: { xs: 1.5, sm: 2.5, md: 3 }, py: { xs: 2, sm: 2.5 }, pb: { xs: 12, md: 4 } }}>
      {actionError || roomsError ? (
        <Typography sx={{ mb: 1.5, color: "#DC2626", fontWeight: 700, fontSize: "0.85rem" }}>
          {actionError || roomsError}
        </Typography>
      ) : null}
      {(typesLoading && roomTypes.length === 0) || (selectedCategory && roomsLoading && rooms.length === 0) ? (
        <Typography sx={{ mb: 1.5, color: themeConfig.textMuted, fontWeight: 600, fontSize: "0.85rem" }}>
          {selectedCategory ? "Loading rooms…" : "Loading categories…"}
        </Typography>
      ) : null}
      {/* Top Header Control Bar: Dynamic Category Title & Status Badges */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "center" },
          flexDirection: { xs: "column", sm: "row" },
          mb: 2.5,
          gap: 1.8,
        }}
      >
        {selectedCategory !== null && activeCategory ? (
          /* When Category is Selected: Display Selected Category Name & Subtitle */
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
            <Tooltip title="All categories">
              <IconButton
              onClick={() => {
                  if (typeof window !== "undefined") sessionStorage.setItem("receptionist.rooms.category", "none");
                if (cameFromExternalRoute && onNavigateTab) {
                  setCameFromExternalRoute(false);
                  setSelectedCategory(null);
                  onNavigateTab(0);
                } else {
                  setSelectedCategory(null);
                }
              }}
              sx={{
                  width: 36,
                  height: 36,
                borderRadius: "10px",
                  border: `1px solid ${themeConfig.border}`,
                bgcolor: themeConfig.bgCard || "#FFFFFF",
                  color: themeConfig.textMain,
                "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
              }}
            >
                <ArrowBack sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              <Avatar
                sx={{
                  bgcolor: themeConfig.champagne,
                  color: themeConfig.accent,
                  width: 38,
                  height: 38,
                  borderRadius: "10px",
                }}
              >
                {getCategoryIcon(activeCategory?.name || "")}
              </Avatar>
              <div>
                <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "1.05rem", lineHeight: 1.3 }}>
                  {activeCategory?.name || "Category"}
                </Typography>
                <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.78rem" }}>
                  {activeCategory?.totalRooms || 0} {(activeCategory?.totalRooms || 0) === 1 ? "room" : "rooms"}
                </Typography>
              </div>
            </Box>
          </Box>
        ) : (
          /* Categories overview: search + quick summary */
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", flex: 1, minWidth: 0 }}>
            <TextField
                size="small"
              value={categorySearch}
              onChange={(e) => {
                setCategorySearch(e.target.value);
              }}
              placeholder="Search category"
              autoComplete="off"
                sx={{
                width: { xs: "100%", sm: 280 },
                "& .MuiOutlinedInput-root": {
                  borderRadius: "12px",
                  bgcolor: themeConfig.bgCard || "#FFFFFF",
                  fontSize: "0.875rem",
                },
              }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: themeConfig.textMuted }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", alignItems: "center" }}>
              <Chip label={`${categoryStats.length} ${categoryStats.length === 1 ? "category" : "categories"}`} size="small" sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9", color: themeConfig.textMuted, fontWeight: 700, fontSize: "0.72rem" }} />
              <Chip label={`${overviewTotals.total} rooms`} size="small" sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9", color: themeConfig.textMuted, fontWeight: 700, fontSize: "0.72rem" }} />
              <Chip label={`${overviewTotals.available} available`} size="small" sx={{ bgcolor: themeConfig.tones.success.bg, color: themeConfig.tones.success.color, fontWeight: 700, fontSize: "0.72rem", border: `1px solid ${themeConfig.tones.success.border}` }} />
            </Box>
          </Box>
        )}

        {/* Right Side: Status Badges (when Category selected) & Refresh Button */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", justifyContent: { xs: "space-between", sm: "flex-end" } }}>
          {selectedCategory !== null && activeCategory && (
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", alignItems: "center" }}>
              <Chip label={`${activeCategory?.available || 0} available`} size="small" sx={{ bgcolor: themeConfig.tones.success.bg, color: themeConfig.tones.success.color, fontWeight: 700, fontSize: "0.75rem", border: `1px solid ${themeConfig.tones.success.border}` }} />
              <Chip label={`${(activeCategory?.occupied || 0) + (activeCategory?.reserved || 0)} booked`} size="small" sx={{ bgcolor: themeConfig.tones.warning.bg, color: themeConfig.tones.warning.color, fontWeight: 700, fontSize: "0.75rem", border: `1px solid ${themeConfig.tones.warning.border}` }} />
              <Chip label={`${activeCategory?.cleaning || 0} cleaning`} size="small" sx={{ bgcolor: themeConfig.tones.danger.bg, color: themeConfig.tones.danger.color, fontWeight: 700, fontSize: "0.75rem", border: `1px solid ${themeConfig.tones.danger.border}` }} />
            </Box>
          )}
        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* INVENTORY VIEWS: CATEGORIES OVERVIEW vs CATEGORY ROOMS DRILLDOWN         */}
      {/* ========================================================================= */}
      {selectedCategory === null || !activeCategory ? (
        <>
          {/* 1. BOX VIEW (Grid of Category Cards) */}
          {(
            /* Category Overview Cards */
            categoryStats.length === 0 ? (
              <Box sx={{ py: 8 }}>
                <EmptyState
                  title="No Room Categories Found"
                  description="Please configure room categories and rooms in Hotel Admin to manage inventory."
                />
              </Box>
            ) : filteredCategories.length === 0 ? (
              <Box sx={{ py: 8 }}>
                <EmptyState
                  title="No matching category"
                  description="Try a different name or clear the search."
                />
              </Box>
            ) : (
              <Box>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(2, minmax(0, 1fr))",
                    lg: "repeat(3, minmax(0, 1fr))",
                  },
                  gap: 2,
                  minWidth: 0,
                  width: "100%",
                }}
              >
                {visibleCategories.map((cat) => {
                  const statusBoxes = [
                    { label: "Available", value: cat.available, ...themeConfig.tones.success },
                    { label: "Booked", value: cat.occupied + cat.reserved, ...themeConfig.tones.warning },
                    { label: "Cleaning", value: cat.cleaning, ...themeConfig.tones.danger },
                  ];
                  const barTotal = statusBoxes.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
                  const isEmptyCategory = cat.totalRooms === 0;
                  const statePill = isEmptyCategory
                    ? { label: "No rooms", ...themeConfig.tones.neutral }
                    : cat.available > 0
                      ? { label: "Available", ...themeConfig.tones.success }
                      : { label: "Unavailable", ...themeConfig.tones.warning };

                  return (
                    <Card
                      key={cat._id}
                      onClick={() => {
                        setSelectedCategory(cat._id);
                      }}
                      sx={{
                        p: 2.25,
                        borderRadius: "16px",
                        border: `1px solid ${themeConfig.border}`,
                        bgcolor: themeConfig.bgCard || "#FFFFFF",
                        boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(32, 41, 35, 0.05), 0 10px 24px rgba(32, 41, 35, 0.08)",
                        cursor: "pointer",
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
                              <Typography noWrap sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "1.05rem", lineHeight: 1.3 }}>
                            {cat.name}
                          </Typography>
                            </Tooltip>
                        </Box>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                            <KingBed sx={{ fontSize: 14, flexShrink: 0, color: themeConfig.textMuted }} />
                            <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 600 }}>
                              {cat.totalRooms} {cat.totalRooms === 1 ? "room" : "rooms"}
                            </Typography>
                          </Box>
                          </Box>
                      <Box
                        sx={{
                            flexShrink: 0,
                            px: 1,
                            py: 0.25,
                            borderRadius: 999,
                            fontSize: "0.65rem",
                            fontWeight: 700,
                            lineHeight: 1.5,
                            color: statePill.color,
                            bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : statePill.bg,
                            border: `1px solid ${statePill.border}`,
                          }}
                        >
                          {statePill.label}
                      </Box>
              </Box>

                <Box
                  sx={{
                          display: "flex",
                          height: 4,
                          borderRadius: 999,
                      overflow: "hidden",
                          bgcolor: isDarkMode ? "rgba(255,255,255,0.08)" : "#EEF2F6",
                        }}
                      >
                        {barTotal > 0 &&
                          statusBoxes.map((item) =>
                            item.value > 0 ? (
                              <Box key={item.label} sx={{ width: `${(item.value / barTotal) * 100}%`, bgcolor: item.color, opacity: 0.85 }} />
                            ) : null
                          )}
                                      </Box>

                      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
                        {statusBoxes.map((item) => (
                          <Box
                            key={item.label}
                                        sx={{
                              borderRadius: "12px",
                              bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : item.bg,
                              border: `1px solid ${item.border}`,
                              boxShadow: isDarkMode || isEmptyCategory ? "none" : "0 2px 8px rgba(32, 41, 35, 0.05)",
                              py: 1.1,
                              px: 0.5,
                              textAlign: "center",
                              opacity: isEmptyCategory ? 0.55 : 1,
                            }}
                          >
                            <Typography sx={{ fontWeight: 700, color: item.color, fontSize: "0.95rem", lineHeight: 1 }}>{item.value}</Typography>
                            <Typography sx={{ color: item.color, fontSize: "0.62rem", fontWeight: 600, mt: 0.6, lineHeight: 1.2 }}>{item.label}</Typography>
                                      </Box>
                        ))}
                                    </Box>
                    </Card>
                              );
                            })}
                  </Box>
              <InfiniteScrollSentinel
                hasMore={hasMoreCategories}
                onLoadMore={loadMoreCategories}
                loadedCount={visibleCategoryCount}
                endLabel={filteredCategories.length > 12 ? `Showing all ${filteredCategories.length} categories` : undefined}
              />
                                    </Box>
            )
          )}
        </>
      ) : (
        /* Category Rooms Drilldown */
        <Box>

          {/* Filters */}
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 160px 160px" },
              gap: 1.5,
              alignItems: "center",
              mb: 2.5,
            }}
          >
              <TextField
                fullWidth
                size="small"
              placeholder="Search room or guest"
              autoComplete="off"
                value={roomSearch}
                onChange={(e) => {
                  setRoomSearch(e.target.value);
                }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: themeConfig.bgCard || "#FFFFFF", fontSize: "0.875rem" } }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                      <Search sx={{ fontSize: 18, color: themeConfig.textMuted }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />

              <TextField
                select
                fullWidth
                size="small"
                value={selectedFloor}
                onChange={(e) => {
                  setSelectedFloor(e.target.value);
                }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: themeConfig.bgCard || "#FFFFFF", fontSize: "0.875rem", fontWeight: 600 } }}
              >
              <MenuItem value="ALL">All floors</MenuItem>
                {distinctFloors.map((fl) => (
                  <MenuItem key={fl} value={String(fl)}>
                    Floor {fl}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                size="small"
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
              }}
              sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: themeConfig.bgCard || "#FFFFFF", fontSize: "0.875rem", fontWeight: 600 } }}
            >
              <MenuItem value="ALL">All status</MenuItem>
              <MenuItem value="AVAILABLE">Available</MenuItem>
              <MenuItem value="OCCUPIED">Booked</MenuItem>
              <MenuItem value="CLEANING">Cleaning</MenuItem>
              <MenuItem value="MAINTENANCE">Maintenance</MenuItem>
              <MenuItem value="BLOCKED">Blocked</MenuItem>
              </TextField>
            </Box>

          {/* Room cards */}
          {(
            filteredCategoryRooms.length === 0 ? (
              <Box sx={{ py: 6 }}>
                <EmptyState
                  title="No Rooms Found"
                  description="No rooms match the current search or filter criteria in this category."
                  action={
                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<ArrowBack />}
                      onClick={() => {
                        if (typeof window !== "undefined") sessionStorage.setItem("receptionist.rooms.category", "none");
                        setSelectedFloor("ALL");
                        setSelectedStatus("ALL");
                        setRoomSearch("");
                        setSelectedCategory(null);
                        if (cameFromExternalRoute && onNavigateTab) {
                          setCameFromExternalRoute(false);
                          onNavigateTab(0);
                        }
                      }}
                      sx={{ mt: 2, borderRadius: "10px", fontWeight: 700 }}
                    >
                      View All Categories
                    </Button>
                  }
                />
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(3, minmax(0, 1fr))" },
                  alignContent: "start",
                  gap: 2,
                  minWidth: 0,
                  width: "100%",
                }}
              >
                {visibleRooms.map((room) => {
                  const isAvail = room.status === "AVAILABLE";
                  const isOcc = room.status === "OCCUPIED" || room.status === "RESERVED";
                  const isCln = room.status === "CLEANING";
                  const isSelected = selectedRoomIds.includes(room._id);
                  const tariff = room.customPricePerNight || activeCategory?.basePrice || room.basePrice || 0;
                  const bookedGuestName = getRoomGuestName(room);

                  const statusMeta = isAvail
                    ? { label: "Available", ...themeConfig.tones.success }
                    : isOcc
                      ? { label: room.status === "RESERVED" ? "Reserved" : "Booked", ...themeConfig.tones.warning }
                      : isCln
                        ? { label: "Cleaning", ...themeConfig.tones.danger }
                        : { label: room.status === "BLOCKED" ? "Blocked" : "Maintenance", ...themeConfig.tones.neutral };

                  const actionButtonSx = {
                    minHeight: 38,
                    borderRadius: "10px",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    textTransform: "none",
                    boxShadow: "none",
                    "&:hover": { boxShadow: "none" },
                  };

                  return (
                    <Card
                      key={room._id || room.roomNumber}
                      onClick={() => {
                        if (isAvail) handleToggleRoomSelection(room._id);
                      }}
                      sx={{
                        p: 2.25,
                        borderRadius: "16px",
                        border: `1px solid ${isSelected ? themeConfig.primary : themeConfig.border}`,
                        bgcolor: isSelected
                          ? (themeConfig.bgSoft)
                          : (themeConfig.bgCard || "#FFFFFF"),
                        boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(32, 41, 35, 0.05), 0 10px 24px rgba(32, 41, 35, 0.08)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        cursor: isAvail ? "pointer" : "default",
                        transition: "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
                        "&:hover": {
                          borderColor: isSelected ? themeConfig.primary : "#99D5C9",
                          transform: "translateY(-2px)",
                          boxShadow: isDarkMode ? "none" : "0 2px 6px rgba(32, 41, 35, 0.06), 0 16px 32px rgba(32, 41, 35, 0.1)",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "flex-start", gap: 0.75, minWidth: 0 }}>
                            {isAvail && (
                              <Checkbox
                                size="small"
                                checked={isSelected}
                                onChange={(e) => handleToggleRoomSelection(room._id, e)}
                                onClick={(e) => e.stopPropagation()}
                              sx={{ p: 0, mt: 0.25, color: themeConfig.border, "&.Mui-checked": { color: themeConfig.primary } }}
                            />
                          )}
                          <Box sx={{ minWidth: 0 }}>
                            <Typography noWrap sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "1.05rem", lineHeight: 1.3 }}>
                                Room {room.roomNumber}
                              </Typography>
                            <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                              <Apartment sx={{ fontSize: 14, flexShrink: 0, color: themeConfig.textMuted }} />
                              <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 600 }}>
                                Floor {room.floor || 1}
                              </Typography>
                          </Box>
                          </Box>
                        </Box>
                        <Box
                                sx={{
                            flexShrink: 0,
                            px: 1,
                            py: 0.25,
                            borderRadius: 999,
                                  fontSize: "0.65rem",
                            fontWeight: 700,
                            lineHeight: 1.5,
                            color: statusMeta.color,
                            bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : statusMeta.bg,
                            border: `1px solid ${statusMeta.border}`,
                          }}
                        >
                          {statusMeta.label}
                          </Box>
                        </Box>

                      <Box sx={{ minHeight: 44 }}>
                        <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5 }}>
                          <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "1.1rem", lineHeight: 1.2 }}>
                          ₹{Number(tariff).toLocaleString("en-IN")}
                        </Typography>
                          <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.7rem", fontWeight: 600 }}>/ night</Typography>
                        </Box>
                        {bookedGuestName ? (
                          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.75, minWidth: 0 }}>
                            <Person sx={{ fontSize: 14, flexShrink: 0, color: themeConfig.textMuted }} />
                            <Typography noWrap sx={{ color: themeConfig.textMuted, fontSize: "0.75rem", fontWeight: 600 }}>
                            {bookedGuestName}
                          </Typography>
                          </Box>
                        ) : null}
                      </Box>

                      {(isAvail && onSelectRoomForCheckIn) || isOcc || isCln ? (
                        <Box>
                        {isAvail && onSelectRoomForCheckIn && (
                          <Button
                            fullWidth
                            variant="contained"
                            startIcon={<Bolt sx={{ fontSize: 16 }} />}
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectRoomForCheckIn(room);
                            }}
                            sx={{
                                ...actionButtonSx,
                                bgcolor: themeConfig.primary,
                                color: themeConfig.onPrimary,
                                "&:hover": { bgcolor: themeConfig.primaryDark || themeConfig.primary, boxShadow: "none" },
                              }}
                            >
                              Check-in
                          </Button>
                        )}
                        {isOcc && (
                          <Button
                            fullWidth
                              variant="outlined"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStatusDialog(room);
                            }}
                              sx={{
                                ...actionButtonSx,
                                color: themeConfig.primary,
                                borderColor: themeConfig.primary,
                                "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary, boxShadow: "none" },
                              }}
                            >
                              Check-out
                          </Button>
                        )}
                        {isCln && (
                          <Button
                            fullWidth
                              variant="outlined"
                            disabled={busyRoomId === String(room._id || room.id)}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAvailable(room);
                            }}
                              sx={{
                                ...actionButtonSx,
                                color: themeConfig.primary,
                                borderColor: themeConfig.primary,
                                "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary, boxShadow: "none" },
                              }}
                            >
                              {busyRoomId === String(room._id || room.id) ? "Saving..." : "Mark available"}
                          </Button>
                        )}
                      </Box>
                      ) : null}
                    </Card>
                  );
                })}
              </Box>
            )
          )}
          {filteredCategoryRooms.length > 0 && (
            <InfiniteScrollSentinel
              hasMore={hasMoreRooms}
              onLoadMore={loadMoreRooms}
              loadedCount={visibleRoomCount}
              endLabel={filteredCategoryRooms.length > 12 ? `Showing all ${filteredCategoryRooms.length} rooms` : undefined}
            />
          )}
              </Box>
      )}


      <CheckoutDialog
        open={Boolean(checkoutTarget)}
        booking={checkoutTarget?.booking}
        roomNumber={checkoutTarget?.room?.roomNumber}
        hotelSettings={hotelSettings}
        onClose={() => setCheckoutTarget(null)}
        onCheckOut={onCheckOut}
        onDone={async () => {
          if (selectedCategory) await fetchRoomsPage(1, { append: false });
          else await fetchRoomTypesPage(1, { append: false });
        }}
      />

      {/* ========================================================================= */}
      {/* FLOATING MULTI-ROOM SELECTION ACTION DOCK                                 */}
      {/* ========================================================================= */}
      {selectedRoomIds.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            position: "fixed",
            bottom: { xs: 72, sm: 24 },
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: 820,
            zIndex: 1300,
            p: { xs: 1.75, sm: 2 },
            borderRadius: "16px",
            bgcolor: isDarkMode ? "rgba(32, 41, 35, 0.96)" : "#FFFFFF",
            border: `1px solid ${isDarkMode ? themeConfig.border : "#99D5C9"}`,
            boxShadow: isDarkMode
              ? "0 16px 40px rgba(0, 0, 0, 0.6)"
              : "0 2px 6px rgba(32, 41, 35, 0.06), 0 18px 40px rgba(32, 41, 35, 0.14)",
            animation: "slideUpDock 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
            "@keyframes slideUpDock": {
              "0%": { transform: "translate(-50%, 30px)", opacity: 0 },
              "100%": { transform: "translate(-50%, 0)", opacity: 1 },
            },
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: { xs: "stretch", md: "center" },
              justifyContent: "space-between",
              flexDirection: { xs: "column", md: "row" },
              gap: 2,
            }}
          >
            {/* Left: selection summary */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap", minWidth: 0 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
                <Box
                sx={{
                    width: 36,
                    height: 36,
                    flexShrink: 0,
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: themeConfig.bgSoft,
                    border: `1px solid ${themeConfig.border}`,
                    color: themeConfig.primary,
                    fontWeight: 700,
                    fontSize: "0.95rem",
                  }}
                >
                  {selectedRoomsList.length}
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.9rem", lineHeight: 1.3 }}>
                    {selectedRoomsList.length === 1 ? "Room selected" : "Rooms selected"}
                  </Typography>
                  <Typography noWrap sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 600, mt: 0.25 }}>
                  {selectedStats.roomNumbers}
                </Typography>
                </Box>
              </Box>

              <Box sx={{ display: { xs: "none", sm: "block" }, width: "1px", alignSelf: "stretch", bgcolor: themeConfig.border }} />

              <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                <CurrencyRupee sx={{ fontSize: 16, color: themeConfig.textMuted }} />
                <Box>
                  <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.62rem", fontWeight: 600, lineHeight: 1.2 }}>Total per night</Typography>
                  <Typography sx={{ color: themeConfig.textMain, fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.3 }}>
                    ₹{selectedStats.totalRate.toLocaleString("en-IN")}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Right: actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, justifyContent: "flex-end", flexShrink: 0 }}>
              <Button
                variant="outlined"
                onClick={handleClearSelection}
                sx={{
                  minHeight: 40,
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  textTransform: "none",
                  boxShadow: "none",
                  borderColor: themeConfig.border,
                  color: themeConfig.textMuted,
                  px: 2,
                  "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.border, color: themeConfig.textMain, boxShadow: "none" },
                }}
              >
                Clear
              </Button>

              <Button
                variant="contained"
                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                onClick={handleProceedWithSelectedRooms}
                sx={{
                  minHeight: 40,
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  whiteSpace: "nowrap",
                  flexGrow: { xs: 1, md: 0 },
                  textTransform: "none",
                  bgcolor: themeConfig.primary,
                  color: themeConfig.onPrimary,
                  px: 2.5,
                  boxShadow: "none",
                  "&:hover": { bgcolor: themeConfig.primaryDark || themeConfig.primary, boxShadow: "none" },
                }}
              >
                Proceed to check-in
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
