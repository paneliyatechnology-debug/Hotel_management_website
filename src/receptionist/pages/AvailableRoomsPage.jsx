"use client";

import { useState, useMemo, useEffect } from "react";
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
  Refresh,
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
  ViewModule,
  TableRows,
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
import StatusChip from "@/shared/components/StatusChip";
import { formatTime12Hour, calculateOverstayFee } from "@/shared/utils/timeUtils";

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

  // Helper to reliably resolve guest name ONLY for currently occupied/reserved rooms
  const getRoomGuestName = (room) => {
    if (!room || (room.status !== "OCCUPIED" && room.status !== "RESERVED")) {
      return "";
    }
    if (room?.guestName && room.guestName.trim()) return room.guestName;
    const rId = String(room?._id || "");
    const rNum = String(room?.roomNumber || "");

    const activeBooking = bookings.find((b) => {
      const isLive = b.status === "CHECKED_IN" || b.status === "OCCUPIED";
      if (!isLive) return false;

      const bRoomId = String(b.room?._id || b.room || "");
      const bRtId = String(b.roomType?._id || b.roomType || "");
      const rRtId = String(room?.roomType?._id || room?.roomType || "");

      if (bRoomId && rId && bRoomId === rId) return true;
      if (Array.isArray(b.rooms) && b.rooms.some((id) => String(id?._id || id) === rId)) return true;

      if (!bRoomId && String(b.roomNumber || "") === rNum && (!bRtId || !rRtId || bRtId === rRtId)) return true;
      if (!bRoomId && Array.isArray(b.roomNumbers) && b.roomNumbers.some((num) => String(num) === rNum && (!bRtId || !rRtId || bRtId === rRtId))) return true;

      return false;
    });

    if (activeBooking) {
      return activeBooking.guest?.fullName || activeBooking.guest?.name || "";
    }
    return "";
  };

  // Primary Global View Mode: "BOX" (Categories Box Grid) or "TABLE" (All Rooms Table)
  const [viewMode, setViewMode] = useState("BOX");

  // Box View Navigation: null = Categories Overview, string (categoryId) = Category Drilldown
  const [selectedCategory, setSelectedCategory] = useState(null);

  // Category Drilldown Sub View Mode: "BOX" (Room Cards) or "TABLE" (Category Rooms Table)
  const [categorySubViewMode, setCategorySubViewMode] = useState("BOX");

  // Track if user navigated here from another route (e.g. Dashboard)
  const [cameFromExternalRoute, setCameFromExternalRoute] = useState(false);

  // Auto-select category when navigated from Dashboard
  useEffect(() => {
    if (initialSelectedCategory) {
      setSelectedCategory(initialSelectedCategory);
      setCategorySubViewMode("BOX");
      setCameFromExternalRoute(true);
      setPage(0);
      if (onClearInitialCategory) onClearInitialCategory();
    }
  }, [initialSelectedCategory]);

  // Filters for Table View & Category Drilldown
  const [roomSearch, setRoomSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [selectedFloor, setSelectedFloor] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

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

  // Room Status & Checkout Settlement Modal State
  const [statusDialog, setStatusDialog] = useState({
    open: false,
    room: null,
    newStatus: "AVAILABLE",
    booking: null,
    overstay: null,
    lateOption: "hourly",
    lateFee: 0,
    paymentMethod: "CASH",
    amount: 0,
    transactionId: "",
    paymentReference: "",
  });
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Dynamic Category Icon helper
  const getCategoryIcon = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("coupl") || n.includes("copol") || n.includes("honey") || n.includes("romant") || n.includes("love"))
      return <Favorite sx={{ fontSize: 20, color: "#E11D48" }} />;
    if (n.includes("fam") || n.includes("group") || n.includes("quad"))
      return <FamilyRestroom sx={{ fontSize: 20, color: "#059669" }} />;
    if (n.includes("villa") || n.includes("cottage") || n.includes("penthouse") || n.includes("resort") || n.includes("bungalow"))
      return <Villa sx={{ fontSize: 20, color: "#0891B2" }} />;
    if (n.includes("deluxe") || n.includes("super") || n.includes("luxury") || n.includes("suite") || n.includes("vip") || n.includes("presid"))
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

    // 2. Count rooms into each category
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

    // Sort room lists inside each category numerically by room number
    catMap.forEach((cat) => {
      cat.rooms.sort((a, b) => {
        const numA = parseInt(a.roomNumber, 10) || 0;
        const numB = parseInt(b.roomNumber, 10) || 0;
        return numA - numB;
      });
    });

    return Array.from(catMap.values());
  }, [rooms, roomTypes]);

  // Overall Global Room Stats
  const globalStats = useMemo(() => {
    let total = rooms.length;
    let available = 0;
    let occupied = 0;
    let cleaning = 0;
    let maintenance = 0;

    rooms.forEach((r) => {
      if (r.status === "AVAILABLE") available++;
      else if (r.status === "OCCUPIED" || r.status === "RESERVED") occupied++;
      else if (r.status === "CLEANING") cleaning++;
      else if (r.status === "MAINTENANCE" || r.status === "BLOCKED") maintenance++;
    });

    return { total, available, occupied, cleaning, maintenance };
  }, [rooms]);

  // Current selected category object (for Box drill-down)
  const activeCategory = useMemo(() => {
    if (!selectedCategory) return null;
    return categoryStats.find((c) => c._id === selectedCategory) || null;
  }, [selectedCategory, categoryStats]);

  // Distinct floors across all rooms
  const distinctFloors = useMemo(() => {
    const list = selectedCategory && activeCategory ? activeCategory.rooms : rooms;
    return Array.from(new Set(list.map((r) => r.floor || 1))).sort((a, b) => a - b);
  }, [rooms, selectedCategory, activeCategory]);

  // Filtered rooms for Table View
  const filteredAllRooms = useMemo(() => {
    return rooms.filter((r) => {
      if (selectedCategoryFilter !== "ALL") {
        const rtObj = typeof r.roomType === "object" ? r.roomType : null;
        const rtId = rtObj?._id || r.roomType || "UNCATEGORIZED";
        if (rtId !== selectedCategoryFilter) return false;
      }
      if (selectedFloor !== "ALL" && String(r.floor || 1) !== String(selectedFloor)) {
        return false;
      }
      if (selectedStatus !== "ALL" && r.status !== selectedStatus) {
        return false;
      }
      if (roomSearch.trim()) {
        const q = roomSearch.toLowerCase();
        const matchNum = r.roomNumber?.toString().toLowerCase().includes(q);
        const gName = getRoomGuestName(r);
        const matchGuest = gName.toLowerCase().includes(q);
        const rtObj = typeof r.roomType === "object" ? r.roomType : null;
        const matchCat = (rtObj?.name || r.type || "").toLowerCase().includes(q);
        return matchNum || matchGuest || matchCat;
      }
      return true;
    }).sort((a, b) => {
      const numA = parseInt(a.roomNumber, 10) || 0;
      const numB = parseInt(b.roomNumber, 10) || 0;
      return numA - numB;
    });
  }, [rooms, selectedCategoryFilter, selectedFloor, selectedStatus, roomSearch, bookings]);

  // Filtered rooms inside active category (for Category drill-down)
  const filteredCategoryRooms = useMemo(() => {
    if (!activeCategory) return [];
    return activeCategory.rooms.filter((r) => {
      if (selectedFloor !== "ALL" && String(r.floor || 1) !== String(selectedFloor)) {
        return false;
      }
      if (selectedStatus !== "ALL" && r.status !== selectedStatus) {
        return false;
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
  }, [categoryStats, selectedCategoryFilter, selectedStatus, roomSearch, bookings]);

  // Open Room Status Change / Checkout Settlement Dialog
  const handleOpenStatusDialog = (room) => {
    const rId = String(room?._id || "");
    const rNum = String(room?.roomNumber || "");

    const matchedBooking = bookings.find((b) => {
      const isLive = b.status === "CHECKED_IN" || b.status === "IN-HOUSE" || b.status === "OCCUPIED";
      if (!isLive) return false;

      const bRoomId = String(b.room?._id || b.room || "");
      const bRtId = String(b.roomType?._id || b.roomType || "");
      const rRtId = String(room?.roomType?._id || room?.roomType || "");

      if (bRoomId && rId && bRoomId === rId) return true;
      if (Array.isArray(b.rooms) && b.rooms.some((id) => String(id?._id || id) === rId)) return true;

      if (!bRoomId && String(b.roomNumber || "") === rNum && (!bRtId || !rRtId || bRtId === rRtId)) return true;
      if (!bRoomId && Array.isArray(b.roomNumbers) && b.roomNumbers.some((num) => String(num) === rNum && (!bRtId || !rRtId || bRtId === rRtId))) return true;

      return false;
    });

    let overstay = null;
    let due = 0;
    let grandTotal = 0;
    let lateFee = 0;

    if (matchedBooking) {
      overstay = calculateOverstayFee(matchedBooking, hotelSettings, { selectedOption: "hourly" });
      const posChargesTotal = (matchedBooking.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
      lateFee = overstay?.lateFee || 0;
      grandTotal = (matchedBooking.totalAmount || 0) + posChargesTotal + lateFee;
      const paidTotal = matchedBooking.paidAmount || 0;
      due = Math.max(0, grandTotal - paidTotal);
    }

    setStatusDialog({
      open: true,
      room,
      newStatus: room.status === "OCCUPIED" ? "CLEANING" : (room.status || "AVAILABLE"),
      booking: matchedBooking || null,
      overstay,
      lateOption: "hourly",
      lateFee,
      paymentMethod: due > 0 ? "UPI" : "CASH",
      amount: due,
      transactionId: "",
      paymentReference: "",
    });
  };

  const handleDialogLateOptionChange = (newOption) => {
    if (!statusDialog.booking) return;
    const overstay = calculateOverstayFee(statusDialog.booking, hotelSettings, { selectedOption: newOption });
    const posChargesTotal = (statusDialog.booking.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
    const lateFee = overstay?.lateFee || 0;
    const grandTotal = (statusDialog.booking.totalAmount || 0) + posChargesTotal + lateFee;
    const paidTotal = statusDialog.booking.paidAmount || 0;
    const due = Math.max(0, grandTotal - paidTotal);

    setStatusDialog((prev) => ({
      ...prev,
      overstay,
      lateOption: newOption,
      lateFee,
      amount: due,
      paymentMethod: due > 0 ? prev.paymentMethod || "UPI" : "CASH",
    }));
  };

  const handleCopyUpiId = () => {
    const hotelUpi = hotelSettings?.upiId || "jatinkakadiya234-1@okicici";
    navigator.clipboard.writeText(hotelUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleConfirmStatusChange = async () => {
    if (!statusDialog.room) return;
    try {
      setIsSubmitting(true);
      const isOccupied = statusDialog.room.status === "OCCUPIED";
      const isVacating = statusDialog.newStatus === "AVAILABLE" || statusDialog.newStatus === "CLEANING" || statusDialog.newStatus === "MAINTENANCE" || statusDialog.newStatus === "BLOCKED";

      // If room was occupied with an active booking and is now being checked out / released:
      if (statusDialog.booking && isOccupied && isVacating && onCheckOut) {
        await onCheckOut(statusDialog.booking, {
          paymentMethod: statusDialog.paymentMethod,
          settlementPaymentAmount: Number(statusDialog.amount) || 0,
          lateCheckoutFee: Number(statusDialog.lateFee) || 0,
          lateCheckoutType: statusDialog.overstay?.lateCheckoutType || statusDialog.lateOption || "none",
          lateCheckoutHours: statusDialog.overstay?.chargeableHours || 0,
          lateCheckoutMinutes: statusDialog.overstay?.overdueMinutes || 0,
          hourlyRate: statusDialog.overstay?.hourlyRate || 0,
          dailyRoomRate: statusDialog.overstay?.dailyRate || 0,
          gracePeriodMinutes: statusDialog.overstay?.gracePeriodMinutes || 10,
          overstayData: statusDialog.overstay,
          transactionId: statusDialog.transactionId,
          paymentReference: statusDialog.paymentReference,
        });
      }

      // If chosen status is not CLEANING (onCheckOut sets room to CLEANING), or if there was no active booking:
      if (onRoomStatusChange && (!statusDialog.booking || statusDialog.newStatus !== "CLEANING")) {
        await onRoomStatusChange(statusDialog.room, statusDialog.newStatus);
      }

      if (onRefresh) {
        await onRefresh();
      }

      setStatusDialog({
        open: false,
        room: null,
        newStatus: "AVAILABLE",
        booking: null,
        overstay: null,
        lateOption: "hourly",
        lateFee: 0,
        paymentMethod: "CASH",
        amount: 0,
        transactionId: "",
        paymentReference: "",
      });
    } catch (err) {
      console.error("Error updating room status:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 2.5 }, pb: { xs: 12, md: 4 } }}>
      {/* Top Header Control Bar with Box / Table View Switcher */}
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
        <div>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}>
            <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5, fontSize: { xs: "1.25rem", sm: "1.45rem" } }}>
              🏨 Room Inventory
            </Typography>
            <Chip
              label={`${globalStats.total} Total Rooms`}
              size="small"
              sx={{
                bgcolor: themeConfig.champagne,
                color: themeConfig.primaryDark,
                fontWeight: 800,
                fontSize: "0.72rem",
                border: `1px solid ${themeConfig.border}`,
                height: 24,
              }}
            />
          </Box>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontSize: { xs: "0.78rem", sm: "0.85rem" }, mt: 0.3 }}>
            Monitor real-time room availability, housekeeping, and tariffs in Box or Table layout.
          </Typography>
        </div>

        {/* Global View Mode Toggle: Box View & Table View */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1, width: { xs: "100%", sm: "auto" }, flexShrink: 0 }}>
          <Box
            sx={{
              display: "inline-flex",
              bgcolor: themeConfig.bgCard || "#FFFFFF",
              p: 0.5,
              borderRadius: "14px",
              border: `1px solid ${themeConfig.border}`,
              boxShadow: isDarkMode ? "0 4px 14px rgba(0,0,0,0.35)" : "0 2px 8px rgba(12, 39, 59, 0.04)",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <Button
              size="small"
              onClick={() => {
                setViewMode("BOX");
                setPage(0);
              }}
              startIcon={<ViewModule sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: "10px",
                px: { xs: 1.5, sm: 2.2 },
                py: 0.7,
                fontWeight: 800,
                fontSize: "0.82rem",
                textTransform: "none",
                whiteSpace: "nowrap",
                minWidth: "max-content",
                bgcolor: viewMode === "BOX" ? themeConfig.primary : "transparent",
                color: viewMode === "BOX" ? "#FFFFFF !important" : themeConfig.textMain,
                boxShadow: viewMode === "BOX" ? `0 4px 12px ${themeConfig.primaryGlow}` : "none",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: viewMode === "BOX" ? themeConfig.primaryDark : "rgba(0,0,0,0.04)",
                },
              }}
            >
              Box View
            </Button>
            <Button
              size="small"
              onClick={() => {
                setViewMode("TABLE");
                setSelectedCategory(null);
                setPage(0);
              }}
              startIcon={<TableRows sx={{ fontSize: 18 }} />}
              sx={{
                borderRadius: "10px",
                px: { xs: 1.5, sm: 2.2 },
                py: 0.7,
                fontWeight: 800,
                fontSize: "0.82rem",
                textTransform: "none",
                whiteSpace: "nowrap",
                minWidth: "max-content",
                bgcolor: viewMode === "TABLE" ? themeConfig.primary : "transparent",
                color: viewMode === "TABLE" ? "#FFFFFF !important" : themeConfig.textMain,
                boxShadow: viewMode === "TABLE" ? `0 4px 12px ${themeConfig.primaryGlow}` : "none",
                transition: "all 0.2s ease",
                "&:hover": {
                  bgcolor: viewMode === "TABLE" ? themeConfig.primaryDark : "rgba(0,0,0,0.04)",
                },
              }}
            >
              Table View
            </Button>
          </Box>

          {onRefresh && (
            <Tooltip title="Refresh Rooms Data">
              <IconButton
                onClick={onRefresh}
                sx={{
                  bgcolor: themeConfig.bgCard || "#FFFFFF",
                  border: `1px solid ${themeConfig.border}`,
                  borderRadius: "12px",
                  p: 0.9,
                  boxShadow: isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 2px 6px rgba(0,0,0,0.04)",
                  "&:hover": { bgcolor: themeConfig.champagne },
                }}
              >
                <Refresh fontSize="small" sx={{ color: themeConfig.primary }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* INVENTORY VIEWS: CATEGORIES OVERVIEW vs CATEGORY ROOMS DRILLDOWN         */}
      {/* ========================================================================= */}
      {selectedCategory === null ? (
        <>
          {/* 1. BOX VIEW (Grid of Category Cards) */}
          {viewMode === "BOX" && (
            /* Category Overview Cards */
            categoryStats.length === 0 ? (
              <Box sx={{ py: 8 }}>
                <EmptyState
                  title="No Room Categories Found"
                  description="Please configure room categories and rooms in Hotel Admin to manage inventory."
                />
              </Box>
            ) : (
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" },
                  gap: 2.5,
                }}
              >
                {categoryStats.map((cat) => {
                  const hasAvailable = cat.available > 0;
                  const isAllBooked = cat.totalRooms > 0 && cat.available === 0;

                  return (
                    <Card
                      key={cat._id}
                      className="card-3d"
                      onClick={() => {
                        setSelectedCategory(cat._id);
                        setCategorySubViewMode("BOX");
                        setPage(0);
                      }}
                      sx={{
                        p: 2.5,
                        borderRadius: "22px",
                        border: `1px solid ${themeConfig.border}`,
                        background: isDarkMode
                          ? `linear-gradient(135deg, ${themeConfig.bgCard} 0%, rgba(255, 255, 255, 0.02) 100%)`
                          : "linear-gradient(135deg, #FFFFFF 0%, #F9FBFC 100%)",
                        bgcolor: themeConfig.bgCard,
                        boxShadow: isDarkMode
                          ? "0 10px 28px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.05)"
                          : "0 8px 24px rgba(12, 39, 59, 0.05), inset 0 1px 1px #FFFFFF",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                        "&:hover": {
                          transform: "translateY(-4px)",
                          borderColor: themeConfig.primary,
                          boxShadow: isDarkMode
                            ? `0 16px 36px rgba(0, 0, 0, 0.6), 0 0 0 1px ${themeConfig.primary}`
                            : `0 16px 36px rgba(12, 39, 59, 0.1), 0 0 0 1px ${themeConfig.primary}`,
                        },
                      }}
                    >
                      <div>
                        {/* Header: Icon, Name & Tariff */}
                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 1.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <Avatar
                              sx={{
                                bgcolor: themeConfig.champagne,
                                color: themeConfig.primaryDark,
                                width: 44,
                                height: 44,
                                borderRadius: "14px",
                                border: `1px solid ${themeConfig.border}`,
                                boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                              }}
                            >
                              {getCategoryIcon(cat.name)}
                            </Avatar>
                            <div>
                              <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.3, fontSize: "1.05rem" }}>
                                {cat.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                                {cat.bedCount} Bed ({cat.bedType}) &bull; Max {cat.capacity.adults} Guests
                              </Typography>
                            </div>
                          </Box>

                          <Box sx={{ textAlign: "right" }}>
                            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.primary, fontSize: "1.15rem", letterSpacing: -0.5 }}>
                              ₹{Number(cat.basePrice || 0).toLocaleString()}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 800, display: "block", fontSize: "0.7rem" }}>
                              / night
                            </Typography>
                          </Box>
                        </Box>

                        {/* Status Units Counter (Available, Booked, Cleaning) */}
                        <Box
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "repeat(3, 1fr)",
                            gap: 1,
                            mt: 2,
                            p: 1,
                            borderRadius: "14px",
                            bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.025)",
                            border: `1px solid ${themeConfig.border}`,
                          }}
                        >
                          {/* Available */}
                          <Box sx={{ textAlign: "center", p: 0.8, borderRadius: "10px", bgcolor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                            <Typography variant="caption" sx={{ color: "#059669", fontWeight: 800, display: "block", fontSize: "0.62rem", textTransform: "uppercase" }}>
                              🟢 Available
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 900, color: "#10B981", mt: 0.1, fontSize: "0.95rem" }}>
                              {cat.available}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.6rem", fontWeight: 700 }}>
                              Units
                            </Typography>
                          </Box>

                          {/* Booked */}
                          <Box sx={{ textAlign: "center", p: 0.8, borderRadius: "10px", bgcolor: "rgba(11, 142, 224, 0.08)", border: "1px solid rgba(11, 142, 224, 0.2)" }}>
                            <Typography variant="caption" sx={{ color: "#0284C7", fontWeight: 800, display: "block", fontSize: "0.62rem", textTransform: "uppercase" }}>
                              🔵 Booked
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 900, color: "#0B8EE0", mt: 0.1, fontSize: "0.95rem" }}>
                              {cat.occupied + cat.reserved}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.6rem", fontWeight: 700 }}>
                              Units
                            </Typography>
                          </Box>

                          {/* Cleaning */}
                          <Box sx={{ textAlign: "center", p: 0.8, borderRadius: "10px", bgcolor: "rgba(217, 119, 6, 0.08)", border: "1px solid rgba(217, 119, 6, 0.2)" }}>
                            <Typography variant="caption" sx={{ color: "#D97706", fontWeight: 800, display: "block", fontSize: "0.62rem", textTransform: "uppercase" }}>
                              🟡 Cleaning
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 900, color: "#D97706", mt: 0.1, fontSize: "0.95rem" }}>
                              {cat.cleaning}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.6rem", fontWeight: 700 }}>
                              Units
                            </Typography>
                          </Box>
                        </Box>

                        {/* Room Numbers List Chips */}
                        <Box sx={{ mt: 2 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.8 }}>
                            <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.72rem", textTransform: "uppercase" }}>
                              Room Numbers ({cat.rooms.length})
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.65rem" }}>
                              Click to view
                            </Typography>
                          </Box>

                          {cat.rooms.length === 0 ? (
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontStyle: "italic", display: "block", py: 0.5 }}>
                              No rooms added yet.
                            </Typography>
                          ) : (
                            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.6, maxHeight: "100px", overflowY: "auto", pr: 0.5 }}>
                              {cat.rooms.map((room) => {
                                const isAvail = room.status === "AVAILABLE";
                                const isOcc = room.status === "OCCUPIED" || room.status === "RESERVED";
                                const isCln = room.status === "CLEANING";
                                const isSelected = selectedRoomIds.includes(room._id);

                                let badgeBg = isSelected
                                  ? "rgba(16, 185, 129, 0.25)"
                                  : isAvail
                                    ? "rgba(16, 185, 129, 0.12)"
                                    : isOcc
                                      ? "rgba(11, 142, 224, 0.12)"
                                      : isCln
                                        ? "rgba(217, 119, 6, 0.12)"
                                        : "rgba(239, 68, 68, 0.12)";

                                let badgeColor = isSelected
                                  ? "#047857"
                                  : isAvail
                                    ? "#059669"
                                    : isOcc
                                      ? "#0284C7"
                                      : isCln
                                        ? "#D97706"
                                        : "#DC2626";

                                let dotSymbol = isSelected ? "✓" : isAvail ? "🟢" : isOcc ? "🔵" : isCln ? "🟡" : "🔴";

                                return (
                                  <Chip
                                    key={room._id || room.roomNumber}
                                    label={`${dotSymbol} #${room.roomNumber}`}
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (isAvail) {
                                        handleToggleRoomSelection(room._id, e);
                                      } else {
                                        handleOpenStatusDialog(room);
                                      }
                                    }}
                                    sx={{
                                      fontWeight: isSelected ? 900 : 800,
                                      fontSize: "0.7rem",
                                      bgcolor: badgeBg,
                                      color: badgeColor,
                                      borderRadius: "8px",
                                      cursor: "pointer",
                                      border: isSelected ? "1.5px solid #10B981" : "1px solid transparent",
                                      boxShadow: isSelected ? "0 0 0 2px rgba(16, 185, 129, 0.25)" : "none",
                                      transition: "all 0.15s ease",
                                      "&:hover": {
                                        transform: "scale(1.08)",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.12)",
                                      },
                                    }}
                                  />
                                );
                              })}
                            </Box>
                          )}
                        </Box>
                      </div>

                      {/* Card Action Footer */}
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          pt: 1.5,
                          mt: 1.8,
                          borderTop: `1px solid ${themeConfig.border}`,
                        }}
                      >
                        <Chip
                          label={
                            isAllBooked
                              ? "🔴 100% Booked"
                              : cat.available > 0
                                ? `🟢 ${cat.available} Ready`
                                : "⚪ No Rooms"
                          }
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.68rem",
                            bgcolor: isAllBooked
                              ? "rgba(239, 68, 68, 0.1)"
                              : hasAvailable
                                ? "rgba(16, 185, 129, 0.12)"
                                : "rgba(0,0,0,0.05)",
                            color: isAllBooked ? "#EF4444" : hasAvailable ? "#059669" : themeConfig.textMuted,
                          }}
                        />

                        <Button
                          size="small"
                          endIcon={<ArrowForward fontSize="small" />}
                          sx={{
                            fontWeight: 900,
                            fontSize: "0.78rem",
                            color: themeConfig.primary,
                            borderRadius: "8px",
                            px: 1.2,
                            "&:hover": { bgcolor: themeConfig.champagne },
                          }}
                        >
                          View {cat.totalRooms} Rooms
                        </Button>
                      </Box>
                    </Card>
                  );
                })}
              </Box>
            )
          )}

          {/* 2. TABLE VIEW: ALL ROOMS MASTER TABLE */}
          {viewMode === "TABLE" && (
            <Box>
              {/* Table Filters & Stats Bar */}
              <Card
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  mb: 2.5,
                  borderRadius: "16px",
                  border: `1px solid ${themeConfig.border}`,
                  bgcolor: themeConfig.bgCard || "#FFFFFF",
                  boxShadow: isDarkMode ? "0 8px 24px rgba(0,0,0,0.35)" : "0 4px 14px rgba(12, 39, 59, 0.04)",
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "2fr 1fr 1fr 1fr" },
                    gap: 1.5,
                    mb: 1.5,
                  }}
                >
                  {/* Search Room / Guest / Category */}
                  <TextField
                    size="small"
                    placeholder="Search room #, guest, category..."
                    value={roomSearch}
                    onChange={(e) => {
                      setRoomSearch(e.target.value);
                      setPage(0);
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
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
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={selectedCategoryFilter}
                    onChange={(e) => {
                      setSelectedCategoryFilter(e.target.value);
                      setPage(0);
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontWeight: 700 } }}
                  >
                    <MenuItem value="ALL">All Categories</MenuItem>
                    {categoryStats.map((cat) => (
                      <MenuItem key={cat._id} value={cat._id}>
                        {cat.name} ({cat.totalRooms})
                      </MenuItem>
                    ))}
                  </TextField>

                  {/* Floor Filter */}
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={selectedFloor}
                    onChange={(e) => {
                      setSelectedFloor(e.target.value);
                      setPage(0);
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontWeight: 700 } }}
                  >
                    <MenuItem value="ALL">All Floors</MenuItem>
                    {distinctFloors.map((fl) => (
                      <MenuItem key={fl} value={String(fl)}>
                        Floor {fl}
                      </MenuItem>
                    ))}
                  </TextField>

                  {/* Status Filter */}
                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={selectedStatus}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setPage(0);
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontWeight: 700 } }}
                  >
                    <MenuItem value="ALL">All Status</MenuItem>
                    <MenuItem value="AVAILABLE">🟢 Available ({globalStats.available})</MenuItem>
                    <MenuItem value="OCCUPIED">🔵 Occupied ({globalStats.occupied})</MenuItem>
                    <MenuItem value="CLEANING">🟡 Cleaning ({globalStats.cleaning})</MenuItem>
                    <MenuItem value="MAINTENANCE">🔴 Maintenance ({globalStats.maintenance})</MenuItem>
                    <MenuItem value="BLOCKED">⚪ Blocked</MenuItem>
                  </TextField>
                </Box>

                {/* Summary Stats Badges */}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, pt: 1, borderTop: `1px solid ${themeConfig.border}` }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Chip
                      label={`🚪 ${filteredAllRooms.length} of ${rooms.length} Rooms`}
                      size="small"
                      sx={{ fontWeight: 800, bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, fontSize: "0.75rem" }}
                    />
                    <Chip
                      label={`🟢 ${filteredAllRooms.filter((r) => r.status === "AVAILABLE").length} Available`}
                      size="small"
                      sx={{ fontWeight: 800, bgcolor: "rgba(16, 185, 129, 0.12)", color: "#059669", fontSize: "0.75rem" }}
                    />
                    <Chip
                      label={`🔵 ${filteredAllRooms.filter((r) => r.status === "OCCUPIED" || r.status === "RESERVED").length} Occupied`}
                      size="small"
                      sx={{ fontWeight: 800, bgcolor: "rgba(11, 142, 224, 0.12)", color: "#0284C7", fontSize: "0.75rem" }}
                    />
                    {filteredAllRooms.filter((r) => r.status === "CLEANING").length > 0 && (
                      <Chip
                        label={`🟡 ${filteredAllRooms.filter((r) => r.status === "CLEANING").length} Cleaning`}
                        size="small"
                        sx={{ fontWeight: 800, bgcolor: "rgba(217, 119, 6, 0.12)", color: "#D97706", fontSize: "0.75rem" }}
                      />
                    )}
                  </Box>

                  {(roomSearch || selectedCategoryFilter !== "ALL" || selectedFloor !== "ALL" || selectedStatus !== "ALL") && (
                    <Button
                      size="small"
                      onClick={() => {
                        setRoomSearch("");
                        setSelectedCategoryFilter("ALL");
                        setSelectedFloor("ALL");
                        setSelectedStatus("ALL");
                        setPage(0);
                      }}
                      sx={{ fontWeight: 800, color: "#EF4444", fontSize: "0.75rem", textTransform: "none" }}
                    >
                      Clear All Filters
                    </Button>
                  )}
                </Box>
              </Card>

              {/* All Rooms Master Table */}
              {filteredAllRooms.length === 0 ? (
                <Box sx={{ py: 6 }}>
                  <EmptyState
                    title="No Rooms Found"
                    description="No rooms match the selected filter criteria."
                  />
                </Box>
              ) : (
                <Paper
                  sx={{
                    borderRadius: "18px",
                    border: `1px solid ${themeConfig.border}`,
                    boxShadow: isDarkMode ? "0 8px 24px rgba(0,0,0,0.35)" : "0 4px 16px rgba(12, 39, 59, 0.05)",
                    overflow: "hidden",
                    bgcolor: themeConfig.bgCard || "#FFFFFF",
                  }}
                >
                  <TableContainer sx={{ maxHeight: { xs: 520, md: 680 }, overflowX: "auto" }}>
                    <Table stickyHeader size="small" sx={{ minWidth: 740 }}>
                      <TableHead>
                        <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                          <TableCell padding="checkbox" sx={{ pl: 2, bgcolor: themeConfig.champagne }}>
                            <Checkbox
                              size="small"
                              color="success"
                              checked={
                                filteredAllRooms.filter((r) => r.status === "AVAILABLE").length > 0 &&
                                filteredAllRooms.filter((r) => r.status === "AVAILABLE").every((r) => selectedRoomIds.includes(r._id))
                              }
                              indeterminate={
                                filteredAllRooms.some((r) => r.status === "AVAILABLE" && selectedRoomIds.includes(r._id)) &&
                                !filteredAllRooms.filter((r) => r.status === "AVAILABLE").every((r) => selectedRoomIds.includes(r._id))
                              }
                              onChange={() => handleSelectAllAvailable(filteredAllRooms)}
                            />
                          </TableCell>
                          <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, py: 1.5, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                            Room Number
                          </TableCell>
                          <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                            Category / Room Type
                          </TableCell>
                          <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                            Floor
                          </TableCell>
                          <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                            Rate / Tariff
                          </TableCell>
                          <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                            Live Status
                          </TableCell>
                          <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                            Guest / Occupant
                          </TableCell>
                          <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, textAlign: "right", pr: 2.5, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                            Action
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {filteredAllRooms
                          .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((room) => {
                            const rtObj = typeof room.roomType === "object" ? room.roomType : roomTypes.find((t) => String(t._id) === String(room.roomType));
                            const catName = rtObj?.name || room.category || room.type || "Room";
                            const tariff = room.customPricePerNight || rtObj?.basePrice || room.basePrice || 0;
                            const isAvail = room.status === "AVAILABLE";
                            const isOcc = room.status === "OCCUPIED" || room.status === "RESERVED";
                            const isCln = room.status === "CLEANING";
                            const isSelected = selectedRoomIds.includes(room._id);
                            const roomGuestName = getRoomGuestName(room);

                            return (
                              <TableRow
                                key={room._id || room.roomNumber}
                                hover
                                onClick={() => {
                                  if (isAvail) {
                                    handleToggleRoomSelection(room._id);
                                  } else {
                                    handleOpenStatusDialog(room);
                                  }
                                }}
                                sx={{
                                  cursor: "pointer",
                                  bgcolor: isSelected
                                    ? (isDarkMode ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.06)")
                                    : "transparent",
                                  "&:hover": {
                                    bgcolor: isSelected
                                      ? (isDarkMode ? "rgba(16, 185, 129, 0.18)" : "rgba(16, 185, 129, 0.1)")
                                      : "rgba(11, 142, 224, 0.04)",
                                  },
                                  transition: "background 0.15s ease",
                                }}
                              >
                                {/* Multi-select Checkbox */}
                                <TableCell padding="checkbox" sx={{ pl: 2 }} onClick={(e) => {
                                  if (isAvail) handleToggleRoomSelection(room._id, e);
                                }}>
                                  {isAvail ? (
                                    <Checkbox
                                      size="small"
                                      color="success"
                                      checked={isSelected}
                                      onChange={(e) => handleToggleRoomSelection(room._id, e)}
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <Box sx={{ width: 24, height: 24 }} />
                                  )}
                                </TableCell>

                                {/* Room Number */}
                                <TableCell sx={{ py: 1.2, whiteSpace: "nowrap" }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                                    <Avatar
                                      sx={{
                                        bgcolor: isAvail
                                          ? "rgba(16, 185, 129, 0.15)"
                                          : isOcc
                                            ? "rgba(11, 142, 224, 0.15)"
                                            : isCln
                                              ? "rgba(217, 119, 6, 0.15)"
                                              : "rgba(239, 68, 68, 0.15)",
                                        color: isAvail
                                          ? "#10B981"
                                          : isOcc
                                            ? "#0B8EE0"
                                            : isCln
                                              ? "#D97706"
                                              : "#EF4444",
                                        width: 32,
                                        height: 32,
                                        fontSize: "0.8rem",
                                        fontWeight: 900,
                                        borderRadius: "9px",
                                      }}
                                    >
                                      {room.roomNumber}
                                    </Avatar>
                                    <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                                      Room #{room.roomNumber}
                                    </Typography>
                                  </Box>
                                </TableCell>

                                {/* Category */}
                                <TableCell sx={{ whiteSpace: "nowrap" }}>
                                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                    {getCategoryIcon(catName)}
                                    <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.82rem" }}>
                                      {catName}
                                    </Typography>
                                  </Box>
                                </TableCell>

                                {/* Floor */}
                                <TableCell sx={{ whiteSpace: "nowrap" }}>
                                  <Chip
                                    label={`Floor ${room.floor || 1}`}
                                    size="small"
                                    sx={{
                                      fontWeight: 800,
                                      fontSize: "0.72rem",
                                      bgcolor: themeConfig.champagne,
                                      color: themeConfig.primaryDark,
                                      height: 22,
                                    }}
                                  />
                                </TableCell>

                                {/* Rate */}
                                <TableCell sx={{ whiteSpace: "nowrap" }}>
                                  <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.85rem" }}>
                                    ₹{Number(tariff).toLocaleString()}
                                    <Typography component="span" variant="caption" sx={{ color: themeConfig.textMuted, ml: 0.4, fontSize: "0.7rem" }}>
                                      / night
                                    </Typography>
                                  </Typography>
                                </TableCell>

                                {/* Live Status */}
                                <TableCell sx={{ whiteSpace: "nowrap" }}>
                                  <StatusChip status={room.status} size="small" />
                                </TableCell>

                                {/* Guest / Occupant */}
                                <TableCell sx={{ whiteSpace: "nowrap" }}>
                                  {roomGuestName ? (
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                      <Avatar sx={{ width: 22, height: 22, fontSize: "0.68rem", fontWeight: 900, bgcolor: themeConfig.primary }}>
                                        {roomGuestName.charAt(0).toUpperCase()}
                                      </Avatar>
                                      <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.82rem" }}>
                                        {roomGuestName}
                                      </Typography>
                                    </Box>
                                  ) : room.advanceBookingSummary ? (
                                    <Typography variant="caption" sx={{ color: "#D97706", fontWeight: 800, fontSize: "0.75rem" }}>
                                      📅 {room.advanceBookingSummary}
                                    </Typography>
                                  ) : (
                                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontStyle: "italic" }}>
                                      — Vacant —
                                    </Typography>
                                  )}
                                </TableCell>

                                {/* Action */}
                                <TableCell sx={{ textAlign: "right", pr: 2.5, whiteSpace: "nowrap" }}>
                                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 0.8 }} onClick={(e) => e.stopPropagation()}>
                                    {isAvail && onSelectRoomForCheckIn && (
                                      <Button
                                        size="small"
                                        variant="contained"
                                        startIcon={<Bolt sx={{ fontSize: 13 }} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          onSelectRoomForCheckIn(room);
                                        }}
                                        sx={{
                                          borderRadius: "8px",
                                          fontWeight: 900,
                                          fontSize: "0.7rem",
                                          textTransform: "none",
                                          background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                          color: "#FFFFFF",
                                          boxShadow: "0 2px 6px rgba(16, 185, 129, 0.3)",
                                          px: 1.4,
                                          py: 0.4,
                                        }}
                                      >
                                        Check-In
                                      </Button>
                                    )}

                                    <Button
                                      size="small"
                                      variant="outlined"
                                      startIcon={<Edit sx={{ fontSize: 12 }} />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenStatusDialog(room);
                                      }}
                                      sx={{
                                        borderRadius: "8px",
                                        fontWeight: 800,
                                        fontSize: "0.7rem",
                                        borderColor: themeConfig.border,
                                        color: themeConfig.textMain,
                                        "&:hover": { borderColor: themeConfig.primary, bgcolor: themeConfig.champagne },
                                      }}
                                    >
                                      Status
                                    </Button>
                                  </Box>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Table Pagination */}
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25, 50]}
                    component="div"
                    count={filteredAllRooms.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={(e, newPage) => setPage(newPage)}
                    onRowsPerPageChange={(e) => {
                      setRowsPerPage(parseInt(e.target.value, 10));
                      setPage(0);
                    }}
                    sx={{
                      borderTop: `1px solid ${themeConfig.border}`,
                      bgcolor: themeConfig.bgCard || "#FFFFFF",
                    }}
                  />
                </Paper>
              )}
            </Box>
          )}
        </>
      ) : (
        /* Category Rooms Drilldown (With Box and Table View inside Category!) */
            <Box>
              {/* Drilldown Header with Back Button and Category Box/Table Switcher */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: { xs: "stretch", sm: "center" },
                  flexDirection: { xs: "column", sm: "row" },
                  mb: 2.5,
                  gap: 1.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap" }}>
                  <Button
                    variant="outlined"
                    startIcon={<ArrowBack />}
                    onClick={() => {
                      if (cameFromExternalRoute && onNavigateTab) {
                        setCameFromExternalRoute(false);
                        setSelectedCategory(null);
                        onNavigateTab(0);
                      } else {
                        setSelectedCategory(null);
                      }
                    }}
                    sx={{
                      borderRadius: "10px",
                      fontWeight: 800,
                      fontSize: "0.78rem",
                      borderColor: themeConfig.border,
                      color: themeConfig.textMain,
                      bgcolor: themeConfig.bgCard || "#FFFFFF",
                      "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
                    }}
                  >
                    Back
                  </Button>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Avatar
                      sx={{
                        bgcolor: themeConfig.champagne,
                        color: themeConfig.primaryDark,
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                      }}
                    >
                      {getCategoryIcon(activeCategory?.name || "")}
                    </Avatar>
                    <div>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5, fontSize: "1.1rem" }}>
                        {activeCategory?.name || "Category"} ({activeCategory?.totalRooms || 0} Rooms)
                      </Typography>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.75rem" }}>
                        ₹{Number(activeCategory?.basePrice || 0).toLocaleString()} / night &bull; {activeCategory?.bedCount} Bed ({activeCategory?.bedType})
                      </Typography>
                    </div>
                  </Box>
                </Box>

                {/* Right Side: Status Pills & Category Sub-View Toggle (Box / Table) */}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center", justifyContent: { xs: "space-between", sm: "flex-end" } }}>
                  <Box sx={{ display: "flex", gap: 0.8, flexWrap: "wrap" }}>
                    <Chip
                      label={`🟢 ${activeCategory?.available || 0} Avail`}
                      size="small"
                      sx={{ bgcolor: "rgba(16, 185, 129, 0.12)", color: "#059669", fontWeight: 800, fontSize: "0.72rem" }}
                    />
                    <Chip
                      label={`🔵 ${(activeCategory?.occupied || 0) + (activeCategory?.reserved || 0)} Booked`}
                      size="small"
                      sx={{ bgcolor: "rgba(11, 142, 224, 0.12)", color: "#0284C7", fontWeight: 800, fontSize: "0.72rem" }}
                    />
                  </Box>

                  {/* Personal Box vs Table Toggle for this category */}
                  <Box
                    sx={{
                      display: "flex",
                      bgcolor: themeConfig.bgCard || "#FFFFFF",
                      p: 0.4,
                      borderRadius: "12px",
                      border: `1px solid ${themeConfig.border}`,
                      boxShadow: isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 2px 6px rgba(12, 39, 59, 0.03)",
                    }}
                  >
                    <Button
                      size="small"
                      onClick={() => setCategorySubViewMode("BOX")}
                      startIcon={<ViewModule sx={{ fontSize: 16 }} />}
                      sx={{
                        borderRadius: "8px",
                        px: 1.2,
                        py: 0.4,
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        textTransform: "none",
                        bgcolor: categorySubViewMode === "BOX" ? themeConfig.primary : "transparent",
                        color: categorySubViewMode === "BOX" ? "#FFFFFF !important" : themeConfig.textMain,
                        boxShadow: categorySubViewMode === "BOX" ? `0 2px 8px ${themeConfig.primaryGlow}` : "none",
                      }}
                    >
                      Box
                    </Button>
                    <Button
                      size="small"
                      onClick={() => setCategorySubViewMode("TABLE")}
                      startIcon={<TableRows sx={{ fontSize: 16 }} />}
                      sx={{
                        borderRadius: "8px",
                        px: 1.2,
                        py: 0.4,
                        fontWeight: 800,
                        fontSize: "0.75rem",
                        textTransform: "none",
                        bgcolor: categorySubViewMode === "TABLE" ? themeConfig.primary : "transparent",
                        color: categorySubViewMode === "TABLE" ? "#FFFFFF !important" : themeConfig.textMain,
                        boxShadow: categorySubViewMode === "TABLE" ? `0 2px 8px ${themeConfig.primaryGlow}` : "none",
                      }}
                    >
                      Table
                    </Button>
                  </Box>
                </Box>
              </Box>

              {/* Filters Bar */}
              <Card
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  mb: 2.5,
                  borderRadius: "16px",
                  border: `1px solid ${themeConfig.border}`,
                  bgcolor: themeConfig.bgCard || "#FFFFFF",
                  boxShadow: isDarkMode ? "0 8px 24px rgba(0,0,0,0.35)" : "0 4px 14px rgba(12, 39, 59, 0.04)",
                }}
              >
                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5, alignItems: "center" }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Search room #, guest..."
                    value={roomSearch}
                    onChange={(e) => {
                      setRoomSearch(e.target.value);
                      setPage(0);
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
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

                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={selectedFloor}
                    onChange={(e) => {
                      setSelectedFloor(e.target.value);
                      setPage(0);
                    }}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontWeight: 700 } }}
                  >
                    <MenuItem value="ALL">All Floors</MenuItem>
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
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "10px", fontWeight: 700 } }}
                  >
                    <MenuItem value="ALL">All Status</MenuItem>
                    <MenuItem value="AVAILABLE">🟢 Available</MenuItem>
                    <MenuItem value="OCCUPIED">🔵 Occupied</MenuItem>
                    <MenuItem value="CLEANING">🟡 Cleaning</MenuItem>
                    <MenuItem value="MAINTENANCE">🔴 Maintenance</MenuItem>
                    <MenuItem value="BLOCKED">⚪ Blocked</MenuItem>
                  </TextField>
                </Box>
              </Card>

              {/* 1A. Category Rooms Box View (Cards Grid) */}
              {categorySubViewMode === "BOX" && (
                filteredCategoryRooms.length === 0 ? (
                  <Box sx={{ py: 6 }}>
                    <EmptyState
                      title="No Rooms Found"
                      description="No rooms match the current search or filter criteria in this category."
                    />
                  </Box>
                ) : (
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)", lg: "repeat(4, 1fr)" },
                      gap: 2,
                    }}
                  >
                    {filteredCategoryRooms.map((room) => {
                      const isAvail = room.status === "AVAILABLE";
                      const isOcc = room.status === "OCCUPIED" || room.status === "RESERVED";
                      const isCln = room.status === "CLEANING";
                      const isSelected = selectedRoomIds.includes(room._id);
                      const tariff = room.customPricePerNight || activeCategory?.basePrice || 0;
                      const roomGuestName = getRoomGuestName(room);

                      let borderAccent = isSelected ? "#10B981" : isAvail ? "#10B981" : isOcc ? "#0B8EE0" : isCln ? "#D97706" : "#EF4444";

                      return (
                        <Card
                          key={room._id || room.roomNumber}
                          className="card-3d"
                          onClick={() => {
                            if (isAvail) handleToggleRoomSelection(room._id);
                          }}
                          sx={{
                            p: 2,
                            borderRadius: "18px",
                            border: isSelected ? "2px solid #10B981" : `1px solid ${themeConfig.border}`,
                            borderTop: isSelected ? "5px solid #10B981" : `4px solid ${borderAccent}`,
                            background: isSelected
                              ? (isDarkMode ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.05)")
                              : themeConfig.bgCard,
                            bgcolor: isSelected
                              ? (isDarkMode ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.05)")
                              : themeConfig.bgCard,
                            boxShadow: isSelected
                              ? "0 0 0 2px rgba(16, 185, 129, 0.25), 0 8px 24px rgba(16, 185, 129, 0.18)"
                              : isDarkMode
                                ? "0 8px 24px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)"
                                : "0 6px 20px rgba(12, 39, 59, 0.04)",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            cursor: isAvail ? "pointer" : "default",
                            transition: "all 0.2s ease",
                            "&:hover": {
                              transform: "translateY(-3px)",
                              boxShadow: isSelected
                                ? "0 0 0 2px rgba(16, 185, 129, 0.35), 0 12px 28px rgba(16, 185, 129, 0.25)"
                                : isDarkMode
                                  ? "0 14px 32px rgba(0, 0, 0, 0.6)"
                                  : "0 12px 28px rgba(12, 39, 59, 0.08)",
                            },
                          }}
                        >
                          <div>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.2 }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                {isAvail && (
                                  <Checkbox
                                    size="small"
                                    color="success"
                                    checked={isSelected}
                                    onChange={(e) => handleToggleRoomSelection(room._id, e)}
                                    onClick={(e) => e.stopPropagation()}
                                    sx={{ p: 0.2, ml: -0.5 }}
                                  />
                                )}
                                <Avatar
                                  sx={{
                                    bgcolor: isSelected
                                      ? "rgba(16, 185, 129, 0.25)"
                                      : isAvail
                                        ? "rgba(16, 185, 129, 0.15)"
                                        : isOcc
                                          ? "rgba(11, 142, 224, 0.15)"
                                          : isCln
                                            ? "rgba(217, 119, 6, 0.15)"
                                            : "rgba(239, 68, 68, 0.15)",
                                    color: borderAccent,
                                    width: 36,
                                    height: 36,
                                    fontSize: "0.85rem",
                                    fontWeight: 900,
                                    borderRadius: "10px",
                                  }}
                                >
                                  {room.roomNumber}
                                </Avatar>
                                <div>
                                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain, lineHeight: 1.2 }}>
                                    Room {room.roomNumber}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                                    Floor {room.floor || 1}
                                  </Typography>
                                </div>
                              </Box>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                                {isSelected && (
                                  <Chip
                                    label="✓ Selected"
                                    size="small"
                                    sx={{
                                      fontWeight: 900,
                                      fontSize: "0.65rem",
                                      bgcolor: "#10B981",
                                      color: "#FFFFFF",
                                      height: 20,
                                    }}
                                  />
                                )}
                                <StatusChip status={room.status} size="small" />
                              </Box>
                            </Box>

                            <Box sx={{ p: 1, borderRadius: "10px", bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC", border: `1px solid ${themeConfig.border}`, mb: 1.2 }}>
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", fontWeight: 700, fontSize: "0.68rem" }}>
                                Rate / Tariff
                              </Typography>
                              <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                                ₹{Number(tariff).toLocaleString()} <span style={{ fontSize: "0.72rem", color: themeConfig.textMuted, fontWeight: 600 }}>/ night</span>
                              </Typography>
                              {roomGuestName ? (
                                <Typography variant="caption" sx={{ color: themeConfig.textMain, fontWeight: 800, mt: 0.3, display: "block" }}>
                                  👤 {roomGuestName}
                                </Typography>
                              ) : room.advanceBookingSummary ? (
                                <Typography variant="caption" sx={{ color: "#D97706", fontWeight: 800, mt: 0.3, display: "block", fontSize: "0.7rem" }}>
                                  📅 {room.advanceBookingSummary}
                                </Typography>
                              ) : null}
                            </Box>
                          </div>

                          <Box sx={{ display: "flex", gap: 0.8, pt: 1, borderTop: `1px solid ${themeConfig.border}` }}>
                            {isAvail && onSelectRoomForCheckIn && (
                              <Button
                                fullWidth
                                size="small"
                                variant="contained"
                                startIcon={<Bolt sx={{ fontSize: 13 }} />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectRoomForCheckIn(room);
                                }}
                                sx={{
                                  borderRadius: "8px",
                                  fontWeight: 900,
                                  fontSize: "0.72rem",
                                  whiteSpace: "nowrap",
                                  textTransform: "none",
                                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                                  color: "#FFFFFF",
                                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                                }}
                              >
                                Check-In
                              </Button>
                            )}
                            <Button
                              fullWidth={!isAvail}
                              size="small"
                              variant="outlined"
                              startIcon={<Edit sx={{ fontSize: 12 }} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenStatusDialog(room);
                              }}
                              sx={{
                                borderRadius: "8px",
                                fontWeight: 800,
                                fontSize: "0.72rem",
                                textTransform: "none",
                                whiteSpace: "nowrap",
                                borderColor: themeConfig.border,
                                color: themeConfig.textMain,
                                "&:hover": { borderColor: themeConfig.primary, bgcolor: themeConfig.champagne },
                              }}
                            >
                              Status
                            </Button>
                          </Box>
                        </Card>
                      );
                    })}
                  </Box>
                )
              )}

              {/* 1B. Category Rooms Table View */}
              {categorySubViewMode === "TABLE" && (
                filteredCategoryRooms.length === 0 ? (
                  <Box sx={{ py: 6 }}>
                    <EmptyState
                      title="No Rooms Found"
                      description="No rooms match the current search or filter criteria in this category."
                    />
                  </Box>
                ) : (
                  <Paper
                    sx={{
                      borderRadius: "18px",
                      border: `1px solid ${themeConfig.border}`,
                      boxShadow: "0 8px 24px rgba(12, 39, 59, 0.05)",
                      overflow: "hidden",
                    }}
                  >
                    <TableContainer
                      sx={{
                        maxHeight: { xs: 450, md: 540 },
                        overflowX: "auto",
                        "&::-webkit-scrollbar": { height: "6px", width: "6px" },
                        "&::-webkit-scrollbar-track": { background: isDarkMode ? "rgba(255,255,255,0.02)" : "rgba(0,0,0,0.02)" },
                        "&::-webkit-scrollbar-thumb": { background: themeConfig.border, borderRadius: "6px" },
                      }}
                    >
                      <Table stickyHeader size="small" sx={{ minWidth: 680 }}>
                        <TableHead>
                          <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                            <TableCell padding="checkbox" sx={{ pl: 2, bgcolor: themeConfig.champagne }}>
                              <Checkbox
                                size="small"
                                color="success"
                                checked={
                                  filteredCategoryRooms.filter((r) => r.status === "AVAILABLE").length > 0 &&
                                  filteredCategoryRooms.filter((r) => r.status === "AVAILABLE").every((r) => selectedRoomIds.includes(r._id))
                                }
                                indeterminate={
                                  filteredCategoryRooms.some((r) => r.status === "AVAILABLE" && selectedRoomIds.includes(r._id)) &&
                                  !filteredCategoryRooms.filter((r) => r.status === "AVAILABLE").every((r) => selectedRoomIds.includes(r._id))
                                }
                                onChange={() => handleSelectAllAvailable(filteredCategoryRooms)}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, py: 1.2, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                              Room Number
                            </TableCell>
                            <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                              Floor
                            </TableCell>
                            <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                              Rate / Tariff
                            </TableCell>
                            <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                              Live Status
                            </TableCell>
                            <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                              Guest / Occupant
                            </TableCell>
                            <TableCell sx={{ fontWeight: 900, color: themeConfig.textMain, textAlign: "right", pr: 2.5, fontSize: "0.82rem", whiteSpace: "nowrap" }}>
                              Action
                            </TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {filteredCategoryRooms
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((room) => {
                              const isAvail = room.status === "AVAILABLE";
                              const isOcc = room.status === "OCCUPIED" || room.status === "RESERVED";
                              const isCln = room.status === "CLEANING";
                              const isSelected = selectedRoomIds.includes(room._id);
                              const tariff = room.customPricePerNight || activeCategory?.basePrice || 0;
                              const roomGuestName = getRoomGuestName(room);

                              return (
                                <TableRow
                                  key={room._id || room.roomNumber}
                                  hover
                                  onClick={() => {
                                    if (isAvail) {
                                      handleToggleRoomSelection(room._id);
                                    } else {
                                      handleOpenStatusDialog(room);
                                    }
                                  }}
                                  sx={{
                                    cursor: "pointer",
                                    bgcolor: isSelected
                                      ? (isDarkMode ? "rgba(16, 185, 129, 0.12)" : "rgba(16, 185, 129, 0.06)")
                                      : "transparent",
                                    "&:hover": {
                                      bgcolor: isSelected
                                        ? (isDarkMode ? "rgba(16, 185, 129, 0.18)" : "rgba(16, 185, 129, 0.1)")
                                        : "rgba(11, 142, 224, 0.04)",
                                    },
                                    transition: "background 0.15s ease",
                                  }}
                                >
                                  {/* Multi-select Checkbox */}
                                  <TableCell padding="checkbox" sx={{ pl: 2 }} onClick={(e) => {
                                    if (isAvail) handleToggleRoomSelection(room._id, e);
                                  }}>
                                    {isAvail ? (
                                      <Checkbox
                                        size="small"
                                        color="success"
                                        checked={isSelected}
                                        onChange={(e) => handleToggleRoomSelection(room._id, e)}
                                        onClick={(e) => e.stopPropagation()}
                                      />
                                    ) : (
                                      <Box sx={{ width: 24, height: 24 }} />
                                    )}
                                  </TableCell>
                                  {/* Room Number */}
                                  <TableCell sx={{ py: 1.2, pl: 2.5, whiteSpace: "nowrap" }}>
                                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                                      <Avatar
                                        sx={{
                                          bgcolor: isAvail
                                            ? "rgba(16, 185, 129, 0.15)"
                                            : isOcc
                                              ? "rgba(11, 142, 224, 0.15)"
                                              : isCln
                                                ? "rgba(217, 119, 6, 0.15)"
                                                : "rgba(239, 68, 68, 0.15)",
                                          color: isAvail
                                            ? "#10B981"
                                            : isOcc
                                              ? "#0B8EE0"
                                              : isCln
                                                ? "#D97706"
                                                : "#EF4444",
                                          width: 32,
                                          height: 32,
                                          fontSize: "0.8rem",
                                          fontWeight: 900,
                                          borderRadius: "8px",
                                        }}
                                      >
                                        {room.roomNumber}
                                      </Avatar>
                                      <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.9rem" }}>
                                        Room #{room.roomNumber}
                                      </Typography>
                                    </Box>
                                  </TableCell>

                                  {/* Floor */}
                                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                                    <Chip
                                      label={`Floor ${room.floor || 1}`}
                                      size="small"
                                      sx={{
                                        fontWeight: 800,
                                        fontSize: "0.7rem",
                                        bgcolor: themeConfig.champagne,
                                        color: themeConfig.primaryDark,
                                        borderRadius: "6px",
                                        height: 22,
                                      }}
                                    />
                                  </TableCell>

                                  {/* Rate */}
                                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                                    <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                                      ₹{Number(tariff).toLocaleString()}
                                      <Typography component="span" variant="caption" sx={{ color: themeConfig.textMuted, ml: 0.5 }}>
                                        / night
                                      </Typography>
                                    </Typography>
                                  </TableCell>

                                  {/* Status */}
                                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                                    <StatusChip status={room.status} size="small" />
                                  </TableCell>

                                  {/* Guest */}
                                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                                    {roomGuestName ? (
                                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                                        <Avatar sx={{ width: 22, height: 22, fontSize: "0.65rem", bgcolor: themeConfig.primary }}>
                                          {roomGuestName.charAt(0).toUpperCase()}
                                        </Avatar>
                                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.82rem" }}>
                                          {roomGuestName}
                                        </Typography>
                                      </Box>
                                    ) : room.advanceBookingSummary ? (
                                      <Typography variant="caption" sx={{ color: "#D97706", fontWeight: 700, display: "flex", alignItems: "center", gap: 0.5 }}>
                                        📅 {room.advanceBookingSummary}
                                      </Typography>
                                    ) : (
                                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontStyle: "italic" }}>
                                        &mdash; Vacant &mdash;
                                      </Typography>
                                    )}
                                  </TableCell>

                                  {/* Action */}
                                  <TableCell sx={{ textAlign: "right", pr: 2.5, whiteSpace: "nowrap" }}>
                                    <Box sx={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 0.8 }}>
                                      {isAvail && (
                                        <Button
                                          size="small"
                                          variant="contained"
                                          startIcon={<Bolt sx={{ fontSize: 13 }} />}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (onSelectRoomForCheckIn) onSelectRoomForCheckIn(room);
                                          }}
                                          sx={{
                                            borderRadius: "8px",
                                            fontWeight: 900,
                                            fontSize: "0.72rem",
                                            background: `linear-gradient(135deg, #10B981 0%, #059669 100%)`,
                                            color: "#FFFFFF",
                                            boxShadow: "0 2px 8px rgba(16, 185, 129, 0.3)",
                                            px: 1.4,
                                            py: 0.3,
                                            "&:hover": { background: "#059669" },
                                          }}
                                        >
                                          Check-In
                                        </Button>
                                      )}

                                      <Button
                                        size="small"
                                        variant="outlined"
                                        startIcon={<Edit sx={{ fontSize: 12 }} />}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenStatusDialog(room);
                                        }}
                                        sx={{
                                          borderRadius: "8px",
                                          fontWeight: 800,
                                          fontSize: "0.7rem",
                                          borderColor: themeConfig.border,
                                          color: themeConfig.textMain,
                                          "&:hover": { borderColor: themeConfig.primary, bgcolor: themeConfig.champagne },
                                        }}
                                      >
                                        Status
                                      </Button>
                                    </Box>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                        </TableBody>
                      </Table>
                    </TableContainer>

                    {/* Table Pagination */}
                    <TablePagination
                      rowsPerPageOptions={[5, 10, 25, 50]}
                      component="div"
                      count={filteredCategoryRooms.length}
                      rowsPerPage={rowsPerPage}
                      page={page}
                      onPageChange={(e, newPage) => setPage(newPage)}
                      onRowsPerPageChange={(e) => {
                        setRowsPerPage(parseInt(e.target.value, 10));
                        setPage(0);
                      }}
                      sx={{
                        borderTop: `1px solid ${themeConfig.border}`,
                        bgcolor: themeConfig.bgCard || "#FFFFFF",
                      }}
                    />
                  </Paper>
                )
              )}
            </Box>
          )}


      {/* ========================================================================= */}
      {/* DIALOG: QUICK ROOM STATUS & IN-HOUSE CHECKOUT SETTLEMENT CONTROL          */}
      {/* ========================================================================= */}
      {(() => {
        const isOccupiedWithBooking = statusDialog.room?.status === "OCCUPIED" && Boolean(statusDialog.booking);
        const guestObj = statusDialog.booking?.guest || {};
        const guestName = guestObj.fullName || guestObj.name || statusDialog.booking?.guestName || "Guest";
        const guestPhone = guestObj.phoneNumber || guestObj.phone || statusDialog.booking?.guestPhone || "";
        const hotelUpi = hotelSettings?.upiId || "jatinkakadiya234-1@okicici";
        const upiAmount = Number(statusDialog.amount) || 0;
        const upiPayee = encodeURIComponent(hotelSettings?.hotelName || "Hotel Merigold");
        const upiNote = encodeURIComponent(`Room ${statusDialog.room?.roomNumber || ""} Checkout Settlement`);
        const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
          `upi://pay?pa=${hotelUpi}&pn=${upiPayee}&am=${upiAmount}&cu=INR&tn=${upiNote}`
        )}`;
        const posChargesTotal = (statusDialog.booking?.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
        const folioGrandTotal = (statusDialog.booking?.totalAmount || 0) + posChargesTotal + (statusDialog.lateFee || 0);
        const paidAmount = statusDialog.booking?.paidAmount || 0;

        return (
          <Dialog
            open={statusDialog.open}
            onClose={() =>
              setStatusDialog({
                open: false,
                room: null,
                newStatus: "AVAILABLE",
                booking: null,
                overstay: null,
                lateOption: "hourly",
                lateFee: 0,
                paymentMethod: "CASH",
                amount: 0,
                transactionId: "",
                paymentReference: "",
              })
            }
            maxWidth={isOccupiedWithBooking ? "sm" : "xs"}
            fullWidth
            slotProps={{
              paper: {
                sx: {
                  borderRadius: "22px",
                  p: { xs: 1.5, sm: 2 },
                  border: `1px solid ${themeConfig.border}`,
                  bgcolor: themeConfig.bgCard || "#FFFFFF",
                  boxShadow: "0 24px 48px rgba(0,0,0,0.22)",
                  maxHeight: "90vh",
                },
              },
            }}
          >
            <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1.5 }}>
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                <Avatar sx={{ bgcolor: themeConfig.primary, width: 36, height: 36, color: "#FFF", fontWeight: 900 }}>
                  <MeetingRoom sx={{ fontSize: 20 }} />
                </Avatar>
                <div>
                  <Typography component="div" variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, lineHeight: 1.2 }}>
                    Room #{statusDialog.room?.roomNumber} Status
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                    {isOccupiedWithBooking ? "Active In-House Guest Settlement & Checkout" : "Operational Status Control"}
                  </Typography>
                </div>
              </Box>
              <IconButton
                onClick={() =>
                  setStatusDialog({
                    open: false,
                    room: null,
                    newStatus: "AVAILABLE",
                    booking: null,
                    overstay: null,
                    lateOption: "hourly",
                    lateFee: 0,
                    paymentMethod: "CASH",
                    amount: 0,
                    transactionId: "",
                    paymentReference: "",
                  })
                }
                sx={{ borderRadius: "10px" }}
              >
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: themeConfig.border, display: "flex", flexDirection: "column", gap: 2.2 }}>
              {/* SCENARIO 1: IN-HOUSE OCCUPIED ROOM WITH ACTIVE BOOKING */}
              {isOccupiedWithBooking ? (
                <>
                  {/* Guest Dossier Info Banner */}
                  <Paper
                    sx={{
                      p: 1.8,
                      borderRadius: "16px",
                      bgcolor: isDarkMode ? "rgba(11, 142, 224, 0.08)" : "rgba(11, 142, 224, 0.05)",
                      border: `1.5px solid ${themeConfig.primary}33`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 1.5,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar sx={{ bgcolor: themeConfig.primary, width: 44, height: 44, fontWeight: 900, fontSize: "1.1rem" }}>
                        {guestName.charAt(0).toUpperCase()}
                      </Avatar>
                      <div>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain, lineHeight: 1.2 }}>
                          {guestName}
                        </Typography>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.3, flexWrap: "wrap" }}>
                          {guestPhone && (
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "flex", alignItems: "center", gap: 0.4 }}>
                              <Phone sx={{ fontSize: 13 }} /> {guestPhone}
                            </Typography>
                          )}
                          <Chip
                            label={`Folio #${statusDialog.booking?.bookingNumber || "Active"}`}
                            size="small"
                            sx={{ fontWeight: 800, fontSize: "0.68rem", height: 20, bgcolor: themeConfig.champagne, color: themeConfig.primary }}
                          />
                        </Box>
                      </div>
                    </Box>

                    <Box sx={{ textAlign: { xs: "left", sm: "right" } }}>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "block" }}>
                        Check-in: {statusDialog.booking?.checkInDate || "Active"}
                      </Typography>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "block" }}>
                        Exp. Checkout: {statusDialog.booking?.checkOutDate || "Today"} ({formatTime12Hour(hotelSettings?.checkOutTime || "12:00")})
                      </Typography>
                    </Box>
                  </Paper>

                  {/* Overstay / Late Checkout Warning Card */}
                  {statusDialog.overstay?.isLate && (
                    <Paper
                      sx={{
                        p: 1.8,
                        borderRadius: "16px",
                        bgcolor: "rgba(239, 68, 68, 0.06)",
                        border: "1.5px solid rgba(239, 68, 68, 0.35)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                        <Avatar sx={{ bgcolor: "#DC2626", color: "#FFF", width: 28, height: 28 }}>
                          <Schedule sx={{ fontSize: 16 }} />
                        </Avatar>
                        <div>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#DC2626", lineHeight: 1.2 }}>
                            Late Check-Out (+{statusDialog.overstay?.chargeableHours}h overdue)
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                            Standard check-out was {formatTime12Hour(statusDialog.overstay?.scheduledCheckOutTime || "12:00")}. Grace period: {statusDialog.overstay?.gracePeriodMinutes}m.
                          </Typography>
                        </div>
                      </Box>

                      <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1, mt: 1.2 }}>
                        <Paper
                          onClick={() => handleDialogLateOptionChange("hourly")}
                          sx={{
                            p: 1.2,
                            borderRadius: "10px",
                            cursor: "pointer",
                            border: `2px solid ${statusDialog.lateOption === "hourly" ? "#059669" : "rgba(5, 150, 105, 0.25)"}`,
                            bgcolor: statusDialog.lateOption === "hourly" ? "#F0FDF4" : "#FFFFFF",
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 900, color: statusDialog.lateOption === "hourly" ? "#059669" : themeConfig.textMain, display: "block" }}>
                            Hourly Charge ({statusDialog.overstay?.chargeableHours}h)
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#059669" }}>
                            ₹{statusDialog.overstay?.hourlyCharge?.toLocaleString()}
                          </Typography>
                        </Paper>

                        <Paper
                          onClick={() => handleDialogLateOptionChange("full_day")}
                          sx={{
                            p: 1.2,
                            borderRadius: "10px",
                            cursor: "pointer",
                            border: `2px solid ${statusDialog.lateOption === "full_day" ? "#DC2626" : "rgba(239, 68, 68, 0.25)"}`,
                            bgcolor: statusDialog.lateOption === "full_day" ? "#FEF2F2" : "#FFFFFF",
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 900, color: statusDialog.lateOption === "full_day" ? "#DC2626" : themeConfig.textMain, display: "block" }}>
                            Full Day Charge
                          </Typography>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#DC2626" }}>
                            ₹{statusDialog.overstay?.fullDayCharge?.toLocaleString()}
                          </Typography>
                        </Paper>
                      </Box>
                    </Paper>
                  )}

                  {/* Itemized Folio Billing Breakdown Table */}
                  <Paper
                    sx={{
                      p: 1.5,
                      borderRadius: "16px",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF",
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 1, display: "flex", alignItems: "center", gap: 0.8, fontSize: "0.82rem" }}>
                      <Receipt sx={{ fontSize: 16, color: themeConfig.primary }} />
                      Folio Billing & Dues Verification
                    </Typography>

                    <TableContainer sx={{ borderRadius: "10px", border: `1px solid ${themeConfig.border}` }}>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 800, fontSize: "0.75rem", py: 0.8 }}>Item / Description</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, fontSize: "0.75rem", py: 0.8 }}>Amount</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          <TableRow>
                            <TableCell sx={{ fontSize: "0.8rem", color: themeConfig.textMain, py: 0.8 }}>
                              Room Tariff ({statusDialog.booking?.roomType?.name || "Room Stay"})
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem", py: 0.8 }}>
                              ₹{(statusDialog.booking?.totalAmount || 0).toLocaleString()}
                            </TableCell>
                          </TableRow>

                          {statusDialog.lateFee > 0 && (
                            <TableRow sx={{ bgcolor: "rgba(239, 68, 68, 0.04)" }}>
                              <TableCell sx={{ fontSize: "0.8rem", color: "#DC2626", py: 0.8 }}>
                                ⏰ Late Check-Out Charge ({statusDialog.lateOption === "full_day" ? "Full Day" : `${statusDialog.overstay?.chargeableHours || 0}h`})
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 800, color: "#DC2626", fontSize: "0.8rem", py: 0.8 }}>
                                +₹{Number(statusDialog.lateFee).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          )}

                          {(statusDialog.booking?.posCharges || []).map((c, i) => (
                            <TableRow key={i}>
                              <TableCell sx={{ fontSize: "0.8rem", color: themeConfig.textMain, py: 0.8 }}>
                                {c.description || c.item || "Extra POS / Food Charge"}
                              </TableCell>
                              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.8rem", py: 0.8 }}>
                                +₹{(c.amount || 0).toLocaleString()}
                              </TableCell>
                            </TableRow>
                          ))}

                          <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                            <TableCell sx={{ fontWeight: 900, fontSize: "0.82rem", color: themeConfig.textMain, py: 0.8 }}>
                              Total Folio Charges
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, fontSize: "0.88rem", color: themeConfig.textMain, py: 0.8 }}>
                              ₹{folioGrandTotal.toLocaleString()}
                            </TableCell>
                          </TableRow>

                          <TableRow>
                            <TableCell sx={{ fontSize: "0.8rem", color: "#059669", py: 0.8 }}>
                              Advance Paid at Check-In
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800, color: "#059669", fontSize: "0.8rem", py: 0.8 }}>
                              -₹{paidAmount.toLocaleString()}
                            </TableCell>
                          </TableRow>

                          <TableRow sx={{ bgcolor: statusDialog.amount > 0 ? "rgba(239, 68, 68, 0.08)" : "rgba(16, 185, 129, 0.08)" }}>
                            <TableCell sx={{ fontWeight: 900, fontSize: "0.85rem", color: statusDialog.amount > 0 ? "#DC2626" : "#059669", py: 1 }}>
                              {statusDialog.amount > 0 ? "⚠️ Remaining Dues to Collect:" : "Folio Settlement Status:"}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 900, fontSize: "0.98rem", color: statusDialog.amount > 0 ? "#DC2626" : "#059669", py: 1 }}>
                              {statusDialog.amount > 0 ? `₹${statusDialog.amount.toLocaleString()}` : "✓ ₹0 Due (Fully Cleared)"}
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>

                  {/* Target Operational Status */}
                  <Box>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "block", mb: 0.8, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Room Status After Check-Out:
                    </Typography>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      value={statusDialog.newStatus}
                      onChange={(e) => setStatusDialog({ ...statusDialog, newStatus: e.target.value })}
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", fontWeight: 700 } }}
                    >
                      <MenuItem value="CLEANING">🟡 CLEANING (Housekeeping in Progress - Recommended)</MenuItem>
                      <MenuItem value="AVAILABLE">🟢 AVAILABLE (Clean & Ready Instantly)</MenuItem>
                      <MenuItem value="MAINTENANCE">🔴 MAINTENANCE (Needs Service/Repairs)</MenuItem>
                      <MenuItem value="BLOCKED">⚪ BLOCKED (Hold/Locked)</MenuItem>
                    </TextField>
                  </Box>

                  {/* Dues Collection & Payment Mode (if amount > 0) */}
                  {statusDialog.amount > 0 ? (
                    <Box sx={{ p: 1.8, borderRadius: "16px", bgcolor: "rgba(239, 68, 68, 0.04)", border: "1.5px solid rgba(239, 68, 68, 0.25)" }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                        <div>
                          <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#DC2626" }}>
                            Collect Dues: ₹{statusDialog.amount.toLocaleString()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                            Select payment method to settle outstanding balance before release:
                          </Typography>
                        </div>
                        <Chip
                          label={`₹${statusDialog.amount.toLocaleString()} PENDING`}
                          size="small"
                          sx={{ bgcolor: "#DC2626", color: "#FFF", fontWeight: 900, fontSize: "0.72rem" }}
                        />
                      </Box>

                      <FormControl fullWidth size="small" sx={{ mb: 1.5 }}>
                        <InputLabel>Settlement Payment Method</InputLabel>
                        <Select
                          value={statusDialog.paymentMethod}
                          label="Settlement Payment Method"
                          onChange={(e) => setStatusDialog({ ...statusDialog, paymentMethod: e.target.value })}
                          sx={{ borderRadius: "12px", fontWeight: 700 }}
                        >
                          <MenuItem value="UPI">📱 UPI / QR Code (Instant Scan)</MenuItem>
                          <MenuItem value="CARD">💳 Credit / Debit Card (POS)</MenuItem>
                          <MenuItem value="CASH">💵 Cash at Front Desk</MenuItem>
                          <MenuItem value="BANK_TRANSFER">🏦 Bank Transfer (NEFT / IMPS)</MenuItem>
                        </Select>
                      </FormControl>

                      {/* UPI QR Payment UI */}
                      {statusDialog.paymentMethod === "UPI" && (
                        <Paper
                          sx={{
                            p: 1.5,
                            borderRadius: "14px",
                            bgcolor: themeConfig.bgCard,
                            border: `1.5px solid ${themeConfig.primary}`,
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            gap: 1.2,
                            boxShadow: "0 4px 12px rgba(11, 142, 224, 0.1)",
                          }}
                        >
                          <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.primary, textTransform: "uppercase" }}>
                            Scan UPI QR to Settle ₹{statusDialog.amount.toLocaleString()}
                          </Typography>

                          <Box
                            component="img"
                            src={qrCodeUrl}
                            alt="UPI Payment QR Code"
                            sx={{
                              width: 140,
                              height: 140,
                              borderRadius: "12px",
                              border: `2px solid ${themeConfig.border}`,
                              p: 0.5,
                              bgcolor: "#FFFFFF",
                            }}
                          />

                          <Box sx={{ display: "flex", alignItems: "center", gap: 1, bgcolor: themeConfig.champagne, px: 1.5, py: 0.6, borderRadius: "8px" }}>
                            <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.75rem" }}>
                              UPI ID: <strong>{hotelUpi}</strong>
                            </Typography>
                            <Tooltip title={copiedUpi ? "Copied!" : "Copy UPI ID"}>
                              <IconButton size="small" onClick={handleCopyUpiId} sx={{ p: 0.4, color: themeConfig.primary }}>
                                {copiedUpi ? <Check sx={{ fontSize: 14, color: "#10B981" }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </Paper>
                      )}

                      <TextField
                        fullWidth
                        size="small"
                        placeholder="Reference / Transaction / UTR No. (Optional)"
                        value={statusDialog.transactionId}
                        onChange={(e) => setStatusDialog({ ...statusDialog, transactionId: e.target.value })}
                        sx={{ mt: 1.5, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
                      />
                    </Box>
                  ) : (
                    <Paper
                      sx={{
                        p: 1.5,
                        borderRadius: "14px",
                        bgcolor: "rgba(16, 185, 129, 0.08)",
                        border: "1.5px solid rgba(16, 185, 129, 0.3)",
                        display: "flex",
                        alignItems: "center",
                        gap: 1.2,
                      }}
                    >
                      <CheckCircle sx={{ color: "#059669", fontSize: 24 }} />
                      <div>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#059669" }}>
                          ✓ Account Fully Cleared
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                          No pending balance or extra fees for this room. Ready for instant checkout.
                        </Typography>
                      </div>
                    </Paper>
                  )}
                </>
              ) : (
                /* SCENARIO 2: NON-OCCUPIED ROOM REGULAR STATUS CHANGE */
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
                    Update operational or housekeeping status for Room #{statusDialog.room?.roomNumber}:
                  </Typography>

                  <TextField
                    select
                    fullWidth
                    size="small"
                    value={statusDialog.newStatus}
                    onChange={(e) => setStatusDialog({ ...statusDialog, newStatus: e.target.value })}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", fontWeight: 700 } }}
                  >
                    <MenuItem value="AVAILABLE">🟢 AVAILABLE (Clean & Ready)</MenuItem>
                    <MenuItem value="CLEANING">🟡 CLEANING (Housekeeping in Progress)</MenuItem>
                    <MenuItem value="OCCUPIED">🔵 OCCUPIED (Manual Override)</MenuItem>
                    <MenuItem value="MAINTENANCE">🔴 MAINTENANCE (Out of Service)</MenuItem>
                    <MenuItem value="BLOCKED">⚪ BLOCKED (Locked by Admin)</MenuItem>
                  </TextField>
                </Box>
              )}
            </DialogContent>

            <DialogActions sx={{ p: 2, gap: 1 }}>
              <Button
                onClick={() =>
                  setStatusDialog({
                    open: false,
                    room: null,
                    newStatus: "AVAILABLE",
                    booking: null,
                    overstay: null,
                    lateOption: "hourly",
                    lateFee: 0,
                    paymentMethod: "CASH",
                    amount: 0,
                    transactionId: "",
                    paymentReference: "",
                  })
                }
                sx={{ borderRadius: "10px", fontWeight: 700 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                disabled={isSubmitting}
                onClick={handleConfirmStatusChange}
                startIcon={isOccupiedWithBooking ? <Logout sx={{ fontSize: 16 }} /> : null}
                sx={{
                  background: isOccupiedWithBooking && statusDialog.amount > 0
                    ? "linear-gradient(135deg, #DC2626 0%, #B91C1C 100%)"
                    : isOccupiedWithBooking
                    ? "linear-gradient(135deg, #059669 0%, #047857 100%)"
                    : `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                  color: "#FFFFFF",
                  fontWeight: 900,
                  borderRadius: "10px",
                  px: 3,
                  boxShadow: "0 4px 14px rgba(0,0,0,0.18)",
                }}
              >
                {isSubmitting
                  ? "Processing..."
                  : isOccupiedWithBooking
                  ? statusDialog.amount > 0
                    ? `Collect ₹${statusDialog.amount.toLocaleString()} & Check Out`
                    : "Complete Check-Out & Release Room"
                  : "Update Status"}
              </Button>
            </DialogActions>
          </Dialog>
        );
      })()}

      {/* ========================================================================= */}
      {/* FLOATING MULTI-ROOM SELECTION ACTION DOCK                                 */}
      {/* ========================================================================= */}
      {selectedRoomIds.length > 0 && (
        <Paper
          elevation={12}
          sx={{
            position: "fixed",
            bottom: { xs: 72, sm: 24 },
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 32px)",
            maxWidth: 880,
            zIndex: 1300,
            p: { xs: 1.5, sm: 2 },
            borderRadius: "22px",
            background: isDarkMode ? "rgba(15, 23, 42, 0.95)" : "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(20px)",
            border: "2px solid #10B981",
            boxShadow: isDarkMode
              ? "0 20px 48px rgba(0, 0, 0, 0.7), 0 0 24px rgba(16, 185, 129, 0.35)"
              : "0 16px 40px rgba(12, 39, 59, 0.18), 0 0 20px rgba(16, 185, 129, 0.25)",
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
              alignItems: "center",
              justifyContent: "space-between",
              flexDirection: { xs: "column", md: "row" },
              gap: 1.5,
            }}
          >
            {/* Left: Selection details & summary */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", width: { xs: "100%", md: "auto" } }}>
              <Chip
                label={`⚡ ${selectedRoomsList.length} Room${selectedRoomsList.length > 1 ? "s" : ""} Selected`}
                sx={{
                  fontWeight: 900,
                  fontSize: "0.82rem",
                  bgcolor: "#10B981",
                  color: "#FFFFFF",
                  height: 32,
                  px: 0.5,
                  boxShadow: "0 2px 8px rgba(16, 185, 129, 0.4)",
                }}
              />
              <div>
                <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "0.9rem", lineHeight: 1.2 }}>
                  {selectedStats.roomNumbers}
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, fontSize: "0.75rem" }}>
                  👥 Capacity: ~{selectedStats.totalAdultCapacity} Guests &bull; 💰 Total: <strong>₹{selectedStats.totalRate.toLocaleString()} / night</strong>
                </Typography>
              </div>
            </Box>

            {/* Right: Actions */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, width: { xs: "100%", md: "auto" }, justifyContent: { xs: "flex-end", md: "flex-end" } }}>
              <Button
                variant="outlined"
                size="small"
                onClick={handleClearSelection}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "0.78rem",
                  borderColor: themeConfig.border,
                  color: themeConfig.textMain,
                  px: 1.8,
                  py: 0.8,
                  "&:hover": { bgcolor: "rgba(239, 68, 68, 0.08)", borderColor: "#EF4444", color: "#DC2626" },
                }}
              >
                Clear
              </Button>

              <Button
                variant="contained"
                size="small"
                startIcon={<Bolt sx={{ fontSize: 16 }} />}
                endIcon={<ArrowForward sx={{ fontSize: 16 }} />}
                onClick={handleProceedWithSelectedRooms}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 900,
                  fontSize: { xs: "0.78rem", sm: "0.85rem" },
                  whiteSpace: "nowrap",
                  flexGrow: { xs: 1, sm: 0 },
                  textTransform: "none",
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  color: "#FFFFFF",
                  px: 2.5,
                  py: 0.8,
                  boxShadow: "0 4px 16px rgba(16, 185, 129, 0.45)",
                  "&:hover": {
                    background: "#059669",
                    boxShadow: "0 6px 20px rgba(16, 185, 129, 0.6)",
                  },
                }}
              >
                Proceed to Check-In ({selectedRoomsList.length} Rooms)
              </Button>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
