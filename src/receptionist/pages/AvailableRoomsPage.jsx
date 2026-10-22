
"use client";

import { useState, useMemo, useEffect, Fragment } from "react";
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
  TablePagination,
  Checkbox,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  Divider,
} from "@mui/material";
import {
  CleaningServices,
  CheckCircle,
  Close,
  MeetingRoom,
  KingBed,
  Apartment,
  Groups,
  Hotel,
  Bed,
  HowToReg,
  ArrowBack,
  ArrowForward,
  Search,
  Visibility,
  Favorite,
  FamilyRestroom,
  Diamond,
  Villa,
  SingleBed,
  Work,
  Bolt,
  Build,
  Edit,
  KeyboardArrowDown,
  KeyboardArrowRight,
  ExpandMore,
  ExpandLess,
  Receipt,
  Logout,
  CurrencyRupee,
  Schedule,
  Warning,
  ContentCopy,
  CreditCard,
  AccountBalance,
  QrCode2,
  Check,
  Phone,
  InfoOutlined,
  Person,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import EmptyState from "@/shared/components/EmptyState";
import CheckoutDialog from "@/receptionist/components/CheckoutDialog";

export default function AvailableRoomsPage({
  user,
  rooms = [],
  roomTypes = [],
  bookings = [],
  guests = [],
  dashboardData,
  hotelSettings = {
    checkInTime: "14:00",
    checkOutTime: "12:00",
    timezone: "Asia/Kolkata",
    upiId: "jatinkakadiya234-1@okicici",
  },
  onRefresh,
  onRoomStatusChange,
  onCheckOut,
  onSelectRoomForCheckIn,
  initialSelectedCategory = null,
  onClearInitialCategory,
  onNavigateTab,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();

  // Helper to reliably resolve guest name ONLY for currently occupied/reserved/booked rooms
  const getRoomGuestName = (room) => {
    const st = String(room?.status || "").toUpperCase();
    if (!room || (st !== "OCCUPIED" && st !== "RESERVED" && st !== "BOOKED")) {
      return "";
    }
    if (room?.guestName && room.guestName.trim()) return room.guestName;
    const rId = String(room?._id || room?.id || "");
    const rNum = String(room?.roomNumber || "");

    const activeBooking = bookings.find((b) => {
      const bSt = String(b.status || "").toUpperCase();
      const isLive = bSt === "CHECKED_IN" || bSt === "OCCUPIED" || bSt === "IN-HOUSE" || bSt === "CONFIRMED" || bSt === "BOOKED";
      if (!isLive) return false;

      const bRoomId = String(b.room?._id || b.room?.id || b.room || b.room_id || b.roomId || "");
      const bRtId = String(b.roomType?._id || b.roomType?.id || b.roomType || b.room_type_id || "");
      const rRtId = String(room?.roomType?._id || room?.roomType?.id || room?.roomType || room?.room_type_id || "");

      if (bRoomId && rId && bRoomId === rId) return true;
      if (Array.isArray(b.rooms) && b.rooms.some((id) => String(id?._id || id?.id || id) === rId)) return true;

      if (!bRoomId && String(b.roomNumber || b.room_number || "") === rNum && (!bRtId || !rRtId || bRtId === rRtId)) return true;
      if (!bRoomId && Array.isArray(b.roomNumbers) && b.roomNumbers.some((num) => String(num) === rNum)) return true;

      return false;
    });

    if (activeBooking) {
      return (
        activeBooking.primary_guest_name ||
        activeBooking.guest_name ||
        activeBooking.guest?.fullName ||
        activeBooking.guest?.name ||
        activeBooking.fullName ||
        activeBooking.name ||
        ""
      );
    }
    return "";
  };

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
      setPage(0);
      if (onClearInitialCategory) onClearInitialCategory();
    }
  }, [initialSelectedCategory]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (selectedCategory) sessionStorage.setItem("receptionist.rooms.category", String(selectedCategory));
  }, [selectedCategory]);

  // Filters for Table View & Category Drilldown
  const [roomSearch, setRoomSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [selectedFloor, setSelectedFloor] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Category card pagination
  const [cardPage, setCardPage] = useState(0);
  const [cardRowsPerPage, setCardRowsPerPage] = useState(10);
  const [categorySearch, setCategorySearch] = useState("");

  // Table Pagination
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

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
    let totalAdultCapacity = 0;
    selectedRoomsList.forEach((r) => {
      const rtObj = typeof r.roomType === "object" ? r.roomType : null;
      const rate = r.customPricePerNight || rtObj?.basePrice || r.basePrice || 0;
      const cap = r.seatingCapacity || rtObj?.capacity?.adults || 2;
      totalRate += rate;
      totalAdultCapacity += cap;
    });
    return {
      count: selectedRoomsList.length,
      totalRate,
      totalAdultCapacity,
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

  // Grouped Categories with Live Counts & Room Lists
  const categoryStats = useMemo(() => {
    const catMap = new Map();

    // 1. Add all configured roomTypes
    roomTypes.forEach((rt) => {
      const id = String(rt._id || rt.id || "");
      if (!id) return;
      catMap.set(id, {
        _id: id,
        id: id,
        name: rt.name,
        description: rt.description || "",
        basePrice: rt.basePrice || rt.price || 0,
        bedCount: rt.bedCount || rt.beds || 1,
        bedType: rt.bedType || "1 King Bed",
        capacity: rt.capacity || { adults: rt.max_adults || rt.adults || 2, children: rt.max_children || rt.children || 1 },
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

    // 2. Count rooms into each category
    rooms.forEach((r) => {
      const rtObj = typeof r.roomType === "object" ? r.roomType : (typeof r.room_type === "object" ? r.room_type : null);
      const rtId = String(
        rtObj?._id || rtObj?.id || r.roomType || r.room_type || r.room_type_id || r.roomTypeId || ""
      );
      const rtName = rtObj?.name || r.type || r.room_type_name || "Standard Room";

      // Match category by ID first, then fallback to name match
      let item = null;
      if (rtId && catMap.has(rtId)) {
        item = catMap.get(rtId);
      } else {
        for (const cat of catMap.values()) {
          if (cat.name && rtName && cat.name.trim().toLowerCase() === rtName.trim().toLowerCase()) {
            item = cat;
            break;
          }
        }
      }

      if (!item) {
        const fallbackId = rtId || rtName || `CAT_${catMap.size + 1}`;
        item = {
          _id: fallbackId,
          id: fallbackId,
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
        };
        catMap.set(fallbackId, item);
      }

      item.totalRooms += 1;
      item.rooms.push(r);

      const effectiveRoomPrice = r.customPricePerNight || rtObj?.basePrice || r.basePrice || 0;
      if (effectiveRoomPrice > 0 && (!item.basePrice || r.customPricePerNight)) {
        item.basePrice = effectiveRoomPrice;
      }

      const st = String(r.status || "").toUpperCase();
      if (st === "AVAILABLE") item.available += 1;
      else if (st === "OCCUPIED" || st === "BOOKED") item.occupied += 1;
      else if (st === "CLEANING") item.cleaning += 1;
      else if (st === "RESERVED") item.reserved += 1;
      else if (st === "MAINTENANCE" || st === "BLOCKED") item.maintenance += 1;
      else item.available += 1;
    });

    // Sort room lists inside each category numerically by room number
    catMap.forEach((cat) => {
      cat.rooms.sort((a, b) => {
        const numA = parseInt(a.roomNumber, 10) || 0;
        const numB = parseInt(b.roomNumber, 10) || 0;
        return numA - numB;
      });
    });

    // Return all categories (including those where all rooms are booked or categories configured in system)
    return Array.from(catMap.values());
  }, [rooms, roomTypes]);

  const filteredCategories = useMemo(() => {
    const query = categorySearch.trim().toLowerCase();
    if (!query) return categoryStats;
    return categoryStats.filter((cat) => String(cat.name || "").toLowerCase().includes(query));
  }, [categoryStats, categorySearch]);

  const overviewTotals = useMemo(
    () =>
      categoryStats.reduce(
        (acc, cat) => ({ total: acc.total + cat.totalRooms, available: acc.available + cat.available }),
        { total: 0, available: 0 }
      ),
    [categoryStats]
  );

  // Overall Global Room Stats
  const globalStats = useMemo(() => {
    let total = rooms.length;
    let available = 0;
    let occupied = 0;
    let cleaning = 0;
    let maintenance = 0;

    rooms.forEach((r) => {
      const st = String(r.status || "").toUpperCase();
      if (st === "AVAILABLE") available++;
      else if (st === "OCCUPIED" || st === "BOOKED" || st === "RESERVED") occupied++;
      else if (st === "CLEANING") cleaning++;
      else if (st === "MAINTENANCE" || st === "BLOCKED") maintenance++;
      else available++;
    });

    return { total, available, occupied, cleaning, maintenance };
  }, [rooms]);

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

  useEffect(() => {
    if (selectedCategory || categoryStats.length !== 1) return;
    if (typeof window !== "undefined" && sessionStorage.getItem("receptionist.rooms.category") === "none") return;
    const only = categoryStats[0];
    setSelectedCategory(only?._id || only?.id || only?.name || null);
  }, [categoryStats, selectedCategory]);

  // Distinct floors across all rooms
  const distinctFloors = useMemo(() => {
    const list = selectedCategory && activeCategory ? activeCategory.rooms : rooms;
    return Array.from(new Set(list.map((r) => r.floor || 1))).sort((a, b) => a - b);
  }, [rooms, selectedCategory, activeCategory]);

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
  }, [rooms, categoryStats, selectedCategoryFilter, selectedFloor, selectedStatus, roomSearch, bookings]);

  // Filtered rooms inside active category (for Category drill-down)
  const filteredCategoryRooms = useMemo(() => {
    if (!activeCategory) return [];
    return activeCategory.rooms.filter((r) => {
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
  }, [activeCategory, selectedFloor, selectedStatus, roomSearch, bookings]);

  // Expanded Category IDs state for Table View (Category Grouped Accordion)
  const [expandedCategoryIds, setExpandedCategoryIds] = useState([]);

  // Auto-expand all categories by default so user sees everything organized
  useEffect(() => {
    if (categoryStats.length > 0 && expandedCategoryIds.length === 0) {
      setExpandedCategoryIds(categoryStats.map((c) => c._id));
    }
  }, [categoryStats]);

  const toggleCategoryExpand = (catId, e) => {
    if (e && typeof e.stopPropagation === "function") e.stopPropagation();
    setExpandedCategoryIds((prev) =>
      prev.includes(catId) ? prev.filter((id) => id !== catId) : [...prev, catId]
    );
  };

  const handleExpandAll = () => {
    setExpandedCategoryIds(categoryStats.map((c) => c._id));
  };

  const handleCollapseAll = () => {
    setExpandedCategoryIds([]);
  };

  // Filtered categories for Single Master Table View
  const filteredCategoriesForTable = useMemo(() => {
    return categoryStats.filter((cat) => {
      if (selectedCategoryFilter !== "ALL" && cat._id !== selectedCategoryFilter) {
        return false;
      }
      if (selectedFloor !== "ALL") {
        const hasFloor = cat.rooms.some((r) => String(r.floor || 1) === String(selectedFloor));
        if (!hasFloor) return false;
      }
      if (selectedStatus !== "ALL") {
        if (selectedStatus === "AVAILABLE" && cat.available === 0) return false;
        if (selectedStatus === "OCCUPIED" && cat.occupied === 0 && cat.reserved === 0) return false;
        if (selectedStatus === "CLEANING" && cat.cleaning === 0) return false;
        if (selectedStatus === "MAINTENANCE" && cat.maintenance === 0) return false;
      }
      if (roomSearch.trim()) {
        const q = roomSearch.toLowerCase();
        const matchCat = (cat.name || "").toLowerCase().includes(q);
        const matchBed = (cat.bedType || "").toLowerCase().includes(q);
        const matchRoomNum = cat.rooms.some((r) => r.roomNumber?.toString().toLowerCase().includes(q));
        const matchGuest = cat.rooms.some((r) => getRoomGuestName(r).toLowerCase().includes(q));
        return matchCat || matchBed || matchRoomNum || matchGuest;
      }
      return true;
    });
  }, [categoryStats, selectedCategoryFilter, selectedFloor, selectedStatus, roomSearch, bookings]);

  // Open the check-out dialog for an occupied room
  const handleOpenStatusDialog = (room) => {
    const rId = String(room?._id || "");
    const rNum = String(room?.roomNumber || "");

    const matchedBooking = bookings.find((b) => {
      const bSt = String(b.status || "").toUpperCase();
      const isLive = bSt === "CHECKED_IN" || bSt === "IN-HOUSE" || bSt === "OCCUPIED" || bSt === "CONFIRMED" || bSt === "BOOKED";
      if (!isLive) return false;

      const bRoomId = String(b.room?._id || b.room?.id || b.room || b.room_id || b.roomId || "");
      const bRtId = String(b.roomType?._id || b.roomType?.id || b.roomType || b.room_type_id || "");
      const rRtId = String(room?.roomType?._id || room?.roomType?.id || room?.roomType || room?.room_type_id || "");

      if (bRoomId && rId && bRoomId === rId) return true;
      if (Array.isArray(b.rooms) && b.rooms.some((id) => String(id?._id || id?.id || id) === rId)) return true;
      if (!bRoomId && String(b.roomNumber || b.room_number || "") === rNum && (!bRtId || !rRtId || bRtId === rRtId)) return true;
      if (!bRoomId && Array.isArray(b.roomNumbers) && b.roomNumbers.some((num) => String(num) === rNum)) return true;

      return false;
    });

    if (!matchedBooking) {
      setActionError("No active booking found for this room");
      return;
    }
    setActionError("");
    setCheckoutTarget({ booking: matchedBooking, room });
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
      if (onRefresh) await onRefresh();
    } catch (err) {
      setActionError(err?.message || "Failed to mark room available");
    } finally {
      setBusyRoomId("");
    }
  };

  return (
    <Box sx={{ width: "100%", minWidth: 0, maxWidth: "100%", overflowX: "hidden", px: { xs: 1.5, sm: 2.5, md: 3 }, py: { xs: 2, sm: 2.5 }, pb: { xs: 12, md: 4 } }}>
      {actionError ? (
        <Typography sx={{ mb: 1.5, color: "#DC2626", fontWeight: 700, fontSize: "0.85rem" }}>{actionError}</Typography>
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
                  color: themeConfig.primaryDark,
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
                setCardPage(0);
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
              <Chip label={`${overviewTotals.available} available`} size="small" sx={{ bgcolor: "#ECFDF5", color: "#047857", fontWeight: 700, fontSize: "0.72rem", border: "1px solid #A7F3D0" }} />
            </Box>
          </Box>
        )}

        {/* Right Side: Status Badges (when Category selected) & Refresh Button */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", justifyContent: { xs: "space-between", sm: "flex-end" } }}>
          {selectedCategory !== null && activeCategory && (
            <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap", alignItems: "center" }}>
              <Chip label={`${activeCategory?.available || 0} available`} size="small" sx={{ bgcolor: "#ECFDF5", color: "#047857", fontWeight: 700, fontSize: "0.75rem", border: "1px solid #A7F3D0" }} />
              <Chip label={`${(activeCategory?.occupied || 0) + (activeCategory?.reserved || 0)} booked`} size="small" sx={{ bgcolor: "#FFFBEB", color: "#B45309", fontWeight: 700, fontSize: "0.75rem", border: "1px solid #FDE68A" }} />
              <Chip label={`${activeCategory?.cleaning || 0} cleaning`} size="small" sx={{ bgcolor: "#FEF2F2", color: "#B42318", fontWeight: 700, fontSize: "0.75rem", border: "1px solid #FECACA" }} />
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
                {filteredCategories.slice(cardPage * cardRowsPerPage, cardPage * cardRowsPerPage + cardRowsPerPage).map((cat) => {
                  const statusBoxes = [
                    { label: "Available", value: cat.available, color: "#0F766E", bg: "#ECFDF5", border: "#A7F3D0" },
                    { label: "Booked", value: cat.occupied + cat.reserved, color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" },
                    { label: "Cleaning", value: cat.cleaning, color: "#B42318", bg: "#FEF2F2", border: "#FECACA" },
                  ];
                  const barTotal = statusBoxes.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
                  const isEmptyCategory = cat.totalRooms === 0;
                  const statePill = isEmptyCategory
                    ? { label: "No rooms", color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0" }
                    : cat.available > 0
                      ? { label: "Available", color: "#047857", bg: "#ECFDF5", border: "#A7F3D0" }
                      : { label: "Unavailable", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" };

                  return (
                    <Card
                      key={cat._id}
                      onClick={() => {
                        setSelectedCategory(cat._id);
                        setPage(0);
                      }}
                      sx={{
                        p: 2.25,
                        borderRadius: "16px",
                        border: `1px solid ${themeConfig.border}`,
                        bgcolor: themeConfig.bgCard || "#FFFFFF",
                        boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(15, 23, 42, 0.05), 0 10px 24px rgba(15, 23, 42, 0.08)",
                        cursor: "pointer",
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
                              boxShadow: isDarkMode || isEmptyCategory ? "none" : "0 2px 8px rgba(15, 23, 42, 0.05)",
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
              <TablePagination
                component="div"
                count={filteredCategories.length}
                page={Math.min(cardPage, Math.max(0, Math.ceil(filteredCategories.length / cardRowsPerPage) - 1))}
                onPageChange={(_, next) => setCardPage(next)}
                rowsPerPage={cardRowsPerPage}
                onRowsPerPageChange={(e) => {
                  setCardRowsPerPage(parseInt(e.target.value, 10));
                  setCardPage(0);
                }}
                rowsPerPageOptions={[5, 10, 15, 20, 25]}
                labelRowsPerPage="Categories per page"
                sx={{
                  mt: 2,
                  bgcolor: "transparent",
                  backgroundColor: "transparent",
                  borderTop: "none",
                  "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                    fontWeight: 600,
                    color: themeConfig.textMuted,
                    fontSize: "0.8rem",
                  },
                }}
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
                setPage(0);
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
                setPage(0);
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
                setPage(0);
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
                {filteredCategoryRooms.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((room) => {
                  const isAvail = room.status === "AVAILABLE";
                  const isOcc = room.status === "OCCUPIED" || room.status === "RESERVED";
                  const isCln = room.status === "CLEANING";
                  const isSelected = selectedRoomIds.includes(room._id);
                  const tariff = room.customPricePerNight || activeCategory?.basePrice || room.basePrice || 0;
                  const bookedGuestName = getRoomGuestName(room);

                  const statusMeta = isAvail
                    ? { label: "Available", color: "#047857", bg: "#ECFDF5", border: "#A7F3D0" }
                    : isOcc
                      ? { label: room.status === "RESERVED" ? "Reserved" : "Booked", color: "#B45309", bg: "#FFFBEB", border: "#FDE68A" }
                      : isCln
                        ? { label: "Cleaning", color: "#B42318", bg: "#FEF2F2", border: "#FECACA" }
                        : { label: room.status === "BLOCKED" ? "Blocked" : "Maintenance", color: "#64748B", bg: "#F1F5F9", border: "#E2E8F0" };

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
                          ? (isDarkMode ? "rgba(15, 118, 110, 0.18)" : "#F0FDFA")
                          : (themeConfig.bgCard || "#FFFFFF"),
                        boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(15, 23, 42, 0.05), 0 10px 24px rgba(15, 23, 42, 0.08)",
                        display: "flex",
                        flexDirection: "column",
                        gap: 2,
                        cursor: isAvail ? "pointer" : "default",
                        transition: "border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease",
                        "&:hover": {
                          borderColor: isSelected ? themeConfig.primary : "#99D5C9",
                          transform: "translateY(-2px)",
                          boxShadow: isDarkMode ? "none" : "0 2px 6px rgba(15, 23, 42, 0.06), 0 16px 32px rgba(15, 23, 42, 0.1)",
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
                                color: "#FFFFFF",
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
            <TablePagination
              component="div"
              count={filteredCategoryRooms.length}
              page={page}
              onPageChange={(_, newPage) => setPage(newPage)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[5, 10, 15, 20, 25]}
              labelRowsPerPage="Rooms per page"
              sx={{
                mt: 2,
                bgcolor: "transparent",
                backgroundColor: "transparent",
                borderTop: "none",
                "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                  fontWeight: 600,
                  color: themeConfig.textMuted,
                  fontSize: "0.8rem",
                },
              }}
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
          if (onRefresh) await onRefresh();
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
            bgcolor: isDarkMode ? "rgba(15, 23, 42, 0.96)" : "#FFFFFF",
            border: `1px solid ${isDarkMode ? themeConfig.border : "#99D5C9"}`,
            boxShadow: isDarkMode
              ? "0 16px 40px rgba(0, 0, 0, 0.6)"
              : "0 2px 6px rgba(15, 23, 42, 0.06), 0 18px 40px rgba(15, 23, 42, 0.14)",
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
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F0FDFA",
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

              <Box sx={{ display: "flex", alignItems: "center", gap: 2.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Groups sx={{ fontSize: 16, color: themeConfig.textMuted }} />
                  <Box>
                    <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.62rem", fontWeight: 600, lineHeight: 1.2 }}>Capacity</Typography>
                    <Typography sx={{ color: themeConfig.textMain, fontSize: "0.82rem", fontWeight: 700, lineHeight: 1.3 }}>
                      {selectedStats.totalAdultCapacity} guests
                    </Typography>
                  </Box>
                </Box>
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
                  color: "#FFFFFF",
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
