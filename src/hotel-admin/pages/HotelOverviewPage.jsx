"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  TextField,
  MenuItem,
  Chip,
  Avatar,
  Paper,
  Divider,
  InputAdornment,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Pagination,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tooltip,
  ButtonGroup,
} from "@mui/material";
import {
  MeetingRoom,
  TrendingUp,
  Person,
  CheckCircle,
  Refresh,
  CleaningServices,
  Build,
  CurrencyRupee,
  AccountBalanceWallet,
  AccessTime,
  Schedule,
  Hotel as HotelIcon,
  AutoAwesome,
  Search,
  ArrowForward,
  People,
  Receipt,
  ReceiptLong,
  CalendarMonth,
  LocationOn,
  Security,
  Payments,
  WhatsApp,
  RoomService,
  WarningAmber,
  NotificationsActive,
  Speed,
  Close,
  Send,
  CreditCard,
  Check,
  Bolt,
  Favorite,
  FamilyRestroom,
  Diamond,
  Bed,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import StatCard from "@/shared/components/StatCard";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import GuestDetailsModal from "@/shared/components/GuestDetailsModal";
import { createSafeGuestModalData } from "@/shared/utils/guestModalUtils";
import RevenueDetailsPage from "./RevenueDetailsPage";
import { formatTime12Hour, getTurnaroundWindow } from "@/shared/utils/timeUtils";
import {
  OccupancyDonutChart,
  RevenueWaveChart,
} from "@/hotel-admin/components/DashboardCharts";

export default function HotelOverviewPage({
  user,
  dashboardData,
  rooms = [],
  roomTypes = [],
  guests = [],
  bookings = [],
  hotelSettings = { checkInTime: "14:00", checkOutTime: "12:00", timezone: "Asia/Kolkata" },
  selectedFloor = "ALL",
  setSelectedFloor,
  selectedStatus = "ALL",
  setSelectedStatus,
  onRefresh,
  onTabChange,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [localRooms, setLocalRooms] = useState(rooms);
  const [showRevenueDetailsView, setShowRevenueDetailsView] = useState(false);
  const [revenueFilterMode, setRevenueFilterMode] = useState("THIS_WEEK");

  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [roomSearch, setRoomSearch] = useState("");
  const [nowTime, setNowTime] = useState(Date.now());
  const [guestPage, setGuestPage] = useState(0);
  const [guestRowsPerPage, setGuestRowsPerPage] = useState(5);
  const [stayById, setStayById] = useState({});
  const [selectedGuestModal, setSelectedGuestModal] = useState({
    open: false,
    guest: null,
    guestId: null,
  });

  // Sync localRooms with incoming prop
  useEffect(() => {
    setLocalRooms(rooms);
  }, [rooms]);

  // Room Matrix Pagination (8 rooms per page)
  const [roomPage, setRoomPage] = useState(1);
  const roomsPerPage = 8;

  // View Mode: "box" (Cards) or "table" (List)
  const [roomViewMode, setRoomViewMode] = useState("box");

  const [notification, setNotification] = useState({ show: false, message: "", severity: "success" });

  const resolvedCleaningRoomIds = useRef(new Set());

  // Quick Room Status Handler (e.g. Mark Cleaned / AVAILABLE)
  const handleQuickRoomStatusChange = async (room, nextStatus = "AVAILABLE") => {
    if (!room?._id) return;
    try {
      // 1. Instant optimistic update in local state
      setLocalRooms((prev) =>
        prev.map((r) =>
          r._id === room._id
            ? { ...r, status: nextStatus, cleaningStartedAt: null, cleaningDurationMinutes: undefined }
            : r
        )
      );

      // 2. Persist to Backend API
      await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_ROOM_STATUS(room._id || room.id), {
        method: "PATCH",
        body: { status: nextStatus },
      });

      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Failed to update room status:", err);
      if (onRefresh) onRefresh();
    }
  };

  // 1-second interval ticker for live housekeeping cleaning countdown & auto-transition
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setNowTime(now);

      // 🧹 Auto-transition 100% completed cleaning rooms to AVAILABLE
      if (Array.isArray(localRooms) && localRooms.length > 0) {
        localRooms.forEach((r) => {
          if (r.status === "CLEANING") {
            const startedAt = r.cleaningStartedAt
              ? new Date(r.cleaningStartedAt).getTime()
              : new Date(r.updatedAt || now).getTime();
            const durationSec = (r.cleaningDurationMinutes || 15) * 60;
            const elapsedSec = Math.floor((now - startedAt) / 1000);
            if (elapsedSec >= durationSec && !resolvedCleaningRoomIds.current.has(r._id)) {
              resolvedCleaningRoomIds.current.add(r._id);
              handleQuickRoomStatusChange(r, "AVAILABLE");
            }
          }
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [localRooms]);

  // Helper to calculate remaining cleaning time & status
  const getCleaningTimerData = (room) => {
    if (room.status !== "CLEANING") return null;
    const startedAt = room.cleaningStartedAt
      ? new Date(room.cleaningStartedAt).getTime()
      : new Date(room.updatedAt || Date.now()).getTime();
    const durationSec = (room.cleaningDurationMinutes || 15) * 60;
    const elapsedSec = Math.floor((nowTime - startedAt) / 1000);
    const remainingSec = Math.max(0, durationSec - elapsedSec);

    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;
    const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    const progressPercent = Math.min(100, Math.max(0, Math.round(((durationSec - remainingSec) / durationSec) * 100)));
    const isComplete = remainingSec <= 0;

    return {
      isComplete,
      remainingSec,
      formatted,
      progressPercent,
    };
  };

  const enrichedRooms = useMemo(() => {
    return localRooms.map((room) => {
      const matchedBooking = bookings.find((b) => {
        const bStatus = b.status === "CHECKED_IN" || b.status === "IN-HOUSE";
        if (!bStatus) return false;
        const rNum = String(room.roomNumber);
        const rId = String(room._id || room.id);
        const bRoomId = String(b.room?._id || b.room || "");
        const bRoomNum = String(b.roomNumber || b.room?.roomNumber || "");
        const bRoomsList = Array.isArray(b.roomNumbers) ? b.roomNumbers.map(String) : [];
        const bRoomIdsList = Array.isArray(b.rooms) ? b.rooms.map((r) => String(typeof r === "object" ? r._id || r.id : r)) : [];
        return bRoomNum === rNum || bRoomId === rId || bRoomsList.includes(rNum) || bRoomIdsList.includes(rId);
      });

      const guestName =
        matchedBooking?.guest?.fullName ||
        matchedBooking?.guest?.name ||
        matchedBooking?.guestName ||
        room.guestName ||
        (room.status === "OCCUPIED" ? "Resident Guest" : null);

      const guestPhone =
        matchedBooking?.guest?.mobileNumber ||
        matchedBooking?.guest?.phone ||
        matchedBooking?.guestPhone ||
        matchedBooking?.mobileNumber ||
        "";

      const totalBill =
        matchedBooking?.totalAmount !== undefined
          ? Number(matchedBooking.totalAmount)
          : Number(room.customPricePerNight || room.pricePerNight || 0);

      const advancePaid =
        matchedBooking?.paidAmount !== undefined
          ? Number(matchedBooking.paidAmount)
          : matchedBooking?.advancePaymentAmount !== undefined
          ? Number(matchedBooking.advancePaymentAmount)
          : matchedBooking?.advancePaid !== undefined
          ? Number(matchedBooking.advancePaid)
          : 0;

      const duesAmount = matchedBooking?.dueAmount !== undefined
        ? Number(matchedBooking.dueAmount)
        : Math.max(0, totalBill - advancePaid);

      return {
        ...room,
        matchedBooking,
        guestName,
        guestPhone,
        totalBill,
        advancePaid,
        duesAmount,
      };
    });
  }, [localRooms, bookings]);

  // Dynamic Category Icon helper matching Receptionist UI
  const getCategoryIcon = (name = "") => {
    const n = (name || "").toLowerCase();
    if (n.includes("coupl") || n.includes("copol") || n.includes("copul") || n.includes("honey") || n.includes("romant") || n.includes("love"))
      return <Favorite sx={{ fontSize: 22, color: "#E11D48" }} />;
    if (n.includes("fam") || n.includes("group") || n.includes("quad"))
      return <FamilyRestroom sx={{ fontSize: 22, color: "#059669" }} />;
    if (n.includes("sweet") || n.includes("suite") || n.includes("deluxe") || n.includes("super") || n.includes("luxury") || n.includes("vip") || n.includes("presid"))
      return <Diamond sx={{ fontSize: 22, color: "#D97706" }} />;
    return <HotelIcon sx={{ fontSize: 22, color: themeConfig.primary }} />;
  };

  const categoryBreakdown = useMemo(() => {
    const map = {};
    enrichedRooms.forEach((r) => {
      const rtObj = typeof r.roomType === "object" ? r.roomType : (roomTypes.find((t) => String(t._id || t.id) === String(r.roomType || r.room_type_id || r.roomTypeId)) || null);
      let typeName =
        r.room_type_name ||
        r.roomTypeName ||
        rtObj?.name ||
        (typeof r.roomType === "string" ? r.roomType : undefined) ||
        (Number(r.room_type_id || r.roomTypeId || r.roomType) === 15 ? "Family Room" : undefined) ||
        (Number(r.room_type_id || r.roomTypeId || r.roomType) === 16 ? "Premium Suite" : undefined) ||
        "Family Room";

      if (typeName.toLowerCase().includes("cuppol") || typeName.toLowerCase().includes("copol")) {
        typeName = "Couple Room";
      }

      const basePrice = Number(r.custom_price_per_night || r.customPricePerNight || rtObj?.basePrice || rtObj?.base_price || r.pricePerNight || r.price || (typeName.includes("Sweet") || typeName.includes("Premium") ? 5200 : typeName.includes("Family") ? 4500 : 3500));
      const bedType = r.bed_type || r.bedType || rtObj?.bedType || rtObj?.bed_type || (typeName.includes("Sweet") || typeName.includes("Premium") ? "1 King Size Bed" : "1 King Bed");
      const bedCount = Number(r.bed_count || r.bedCount || rtObj?.bedCount || rtObj?.bed_count || 1);
      const adults = Number(r.seating_capacity || r.seatingCapacity || rtObj?.capacity?.adults || rtObj?.max_adults || (typeName.includes("Family") ? 4 : 2));
      const children = Number(rtObj?.capacity?.children !== undefined ? rtObj.capacity.children : rtObj?.max_children !== undefined ? rtObj.max_children : 1);

      if (!map[typeName]) {
        map[typeName] = {
          _id: rtObj?._id || rtObj?.id || (typeName.includes("Family") ? 15 : typeName.includes("Premium") ? 16 : typeName),
          name: typeName,
          basePrice: basePrice,
          bedCount: bedCount,
          bedType: bedType,
          capacity: { adults, children },
          totalRooms: 0,
          total: 0,
          available: 0,
          occupied: 0,
          reserved: 0,
          cleaning: 0,
          maintenance: 0,
          rooms: [],
          availableRooms: [],
          occupiedRooms: [],
          reservedRooms: [],
          cleaningRooms: [],
          maintenanceRooms: [],
        };
      }
      map[typeName].total++;
      map[typeName].totalRooms++;
      map[typeName].rooms.push(r);
      if (basePrice > 0 && !map[typeName].basePrice) map[typeName].basePrice = basePrice;

      if (r.status === "AVAILABLE") {
        map[typeName].available++;
        map[typeName].availableRooms.push(r);
      } else if (r.status === "OCCUPIED") {
        map[typeName].occupied++;
        map[typeName].occupiedRooms.push(r);
      } else if (r.status === "RESERVED") {
        map[typeName].reserved++;
        map[typeName].reservedRooms.push(r);
      } else if (r.status === "CLEANING") {
        map[typeName].cleaning++;
        map[typeName].cleaningRooms.push(r);
      } else if (r.status === "MAINTENANCE" || r.status === "BLOCKED") {
        map[typeName].maintenance++;
        map[typeName].maintenanceRooms.push(r);
      }
    });

    const sortFn = (a, b) => {
      const numA = parseInt(String(a.roomNumber).replace(/\D/g, ""), 10) || 0;
      const numB = parseInt(String(b.roomNumber).replace(/\D/g, ""), 10) || 0;
      if (numA !== numB) return numA - numB;
      return (a.floor || 1) - (b.floor || 1);
    };

    const list = Object.values(map);
    list.forEach((cat) => {
      cat.rooms.sort(sortFn);
      cat.availableRooms.sort(sortFn);
      cat.occupiedRooms.sort(sortFn);
      cat.cleaningRooms.sort(sortFn);
      cat.maintenanceRooms.sort(sortFn);
      cat.reservedRooms.sort(sortFn);
    });

    // Sort order matching user's image: Couple Room, Family Room, Sweet Room / Premium Suite
    list.sort((a, b) => {
      const order = { "couple room": 1, "family room": 2, "sweet room": 3, "premium suite": 3 };
      const rankA = order[a.name.toLowerCase()] || 99;
      const rankB = order[b.name.toLowerCase()] || 99;
      return rankA - rankB;
    });

    return list;
  }, [enrichedRooms]);

  const filteredCategoryBreakdown = useMemo(() => {
    return categoryBreakdown
      .filter((cat) => {
        if (selectedCategory !== "ALL" && cat.name !== selectedCategory) return false;
        return true;
      })
      .map((cat) => {
        const matchesRoom = (r) => {
          if (selectedFloor !== "ALL" && r.floor !== Number(selectedFloor)) return false;
          if (selectedStatus !== "ALL" && r.status !== selectedStatus) return false;
          if (roomSearch.trim()) {
            const q = roomSearch.toLowerCase();
            const matchNum = String(r.roomNumber).toLowerCase().includes(q);
            const matchGuest = r.guestName?.toLowerCase().includes(q);
            return matchNum || matchGuest;
          }
          return true;
        };

        const filteredAvail = cat.availableRooms.filter(matchesRoom);
        const filteredOcc = cat.occupiedRooms.filter(matchesRoom);
        const filteredClean = cat.cleaningRooms.filter(matchesRoom);
        const filteredMaint = cat.maintenanceRooms.filter(matchesRoom);
        const filteredRes = cat.reservedRooms.filter(matchesRoom);

        return {
          ...cat,
          filteredAvail,
          filteredOcc,
          filteredClean,
          filteredMaint,
          filteredRes,
          visibleCount: filteredAvail.length + filteredOcc.length + filteredClean.length + filteredMaint.length + filteredRes.length,
        };
      })
      .filter((cat) => {
        if (roomSearch.trim() || selectedFloor !== "ALL" || selectedStatus !== "ALL") {
          return cat.visibleCount > 0;
        }
        return true;
      });
  }, [categoryBreakdown, selectedCategory, selectedFloor, selectedStatus, roomSearch]);

  const filteredRooms = useMemo(() => {
    return localRooms.filter((r) => {
      if (selectedFloor !== "ALL" && r.floor !== Number(selectedFloor)) return false;
      if (selectedStatus !== "ALL" && r.status !== selectedStatus) return false;
      if (selectedCategory !== "ALL") {
        const typeName = r.roomType?.name || (typeof r.roomType === "string" ? r.roomType : "Standard Room");
        if (typeName !== selectedCategory) return false;
      }
      if (roomSearch.trim()) {
        const q = roomSearch.toLowerCase();
        const matchNum = r.roomNumber?.toString().toLowerCase().includes(q);
        const matchType = r.roomType?.name?.toLowerCase().includes(q);
        const matchGuest = r.guestName?.toLowerCase().includes(q);
        return matchNum || matchType || matchGuest;
      }
      return true;
    });
  }, [localRooms, selectedFloor, selectedStatus, selectedCategory, roomSearch]);

  // Reset room page when filters change
  useEffect(() => {
    setRoomPage(1);
  }, [roomSearch, selectedFloor, selectedStatus, selectedCategory]);

  // Paginated rooms (8 per page)
  const totalRoomPages = Math.ceil(filteredRooms.length / roomsPerPage) || 1;
  const paginatedRooms = filteredRooms.slice((roomPage - 1) * roomsPerPage, roomPage * roomsPerPage);

  const totalOccupied = localRooms.filter((r) => r.status === "OCCUPIED").length;
  const totalAvailable = localRooms.filter((r) => r.status === "AVAILABLE").length;
  const totalCleaning = localRooms.filter((r) => r.status === "CLEANING").length;
  const totalMaintenance = localRooms.filter((r) => r.status === "MAINTENANCE" || r.status === "BLOCKED").length;
  const totalReserved = localRooms.filter((r) => r.status === "RESERVED").length;

  // Live occupied rooms stay tariff sum
  const occupiedTariffSum = useMemo(() => {
    return localRooms
      .filter((r) => r.status === "OCCUPIED")
      .reduce((acc, r) => acc + (Number(r.pricePerNight) || Number(r.price) || 0), 0);
  }, [localRooms]);

  // Real live calculated data from backend & database (100% matched with Revenue Details screen)
  const fin = dashboardData?.financials || {};
  const ops = dashboardData?.operationsSummary || {};

  const liveTodayRevNum = Number(fin.todayRevenue ?? dashboardData?.todayRevenue ?? 0);
  const liveWeeklyRevNum = Number(
    fin.weeklyRevenue ??
    fin.weekRevenue ??
    dashboardData?.weeklyRevenue?.totalThisWeek ??
    dashboardData?.weeklyRevenue ??
    0
  );
  const liveMonthRevNum = Number(fin.monthlyRevenue ?? dashboardData?.monthlyRevenue ?? 0);
  const listedGuestTotal = Number(guests.total ?? bookings.total);
  const liveTotalGuests = Number.isFinite(listedGuestTotal) && listedGuestTotal >= 0
    ? listedGuestTotal
    : (guests.length || bookings.length || 0);
  const liveInHouseGuests = Number(ops.currentGuests ?? guests.filter((g) => {
    const status = String(g.status || g.booking_status || "").toUpperCase();
    return status === "IN-HOUSE" || status === "CHECKED_IN" || status === "OCCUPIED";
  }).length) || 0;

  const todayRevenue = `₹${liveTodayRevNum.toLocaleString("en-IN")}`;
  const weeklyEarnings = `₹${liveWeeklyRevNum.toLocaleString("en-IN")}`;
  const monthlyRevenue = `₹${liveMonthRevNum.toLocaleString("en-IN")}`;
  const dayGrowthPercentage = fin.dayGrowthRate != null ? fin.dayGrowthRate : (liveTodayRevNum > 0 ? 100 : 0);
  const cleaningPercentage = rooms.length > 0 ? Math.round((totalCleaning / rooms.length) * 100) : 0;
  const maintenancePercentage = rooms.length > 0 ? Math.round((totalMaintenance / rooms.length) * 100) : 0;

  // Average Daily Rate (ADR) & RevPAR calculation
  const adrNum = totalOccupied > 0
    ? Math.round(liveTodayRevNum / totalOccupied)
    : (Number(rooms[0]?.customPricePerNight || rooms[0]?.pricePerNight || rooms[0]?.roomType?.basePrice || 0));
  const revParNum = rooms.length > 0 ? Math.round(liveTodayRevNum / rooms.length) : 0;

  const inTimeFormatted = formatTime12Hour(hotelSettings?.checkInTime || "14:00");
  const outTimeFormatted = formatTime12Hour(hotelSettings?.checkOutTime || "12:00");
  const timezoneStr = hotelSettings?.timezone || "Asia/Kolkata";
  const turnaroundStr = getTurnaroundWindow(hotelSettings?.checkInTime, hotelSettings?.checkOutTime);

  // Helper for current date
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const parseToIsoDate = (dateVal) => {
    if (!dateVal) return "";
    if (typeof dateVal === "string") {
      if (dateVal.includes("/")) {
        const parts = dateVal.split("/");
        if (parts.length === 3) {
          const day = parts[0].padStart(2, "0");
          const month = parts[1].padStart(2, "0");
          const year = parts[2];
          return `${year}-${month}-${day}`;
        }
      }
      return dateVal.split("T")[0];
    }
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return "";
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    } catch {
      return "";
    }
  };

  // Find active in-house guests for table and quick actions
  const activeRecentGuests = useMemo(() => {
    if (bookings && bookings.length > 0) {
      return bookings.map((b) => {
          const g = typeof b.guest === "object" ? b.guest : {};
          const paidAmt = b.paidAmount !== undefined ? Number(b.paidAmount) : (b.advancePaymentAmount !== undefined ? Number(b.advancePaymentAmount) : (b.advancePaid !== undefined ? Number(b.advancePaid) : (b.advancePayment || 0)));
          const totalAmt = Number(b.totalAmount || b.room?.customPricePerNight || b.room?.pricePerNight || 0);
          const dueAmt = b.dueAmount !== undefined ? Number(b.dueAmount) : Math.max(0, totalAmt - paidAmt);
          const detail = stayById[String(b.id || b._id)] || {};
          const staySource = {
            ...b,
            ...Object.fromEntries(Object.entries(detail).filter(([, value]) => value != null && value !== "")),
          };
          const assignedRoom = staySource.room_number || staySource.roomNumber || staySource.room?.room_number || staySource.room?.roomNumber || "-";
          return {
            ...b,
            booking: b,
            activeBooking: b,
            _id: b.id || b._id,
            id: b.id || b._id,
            bookingId: b.id || b._id,
            booking_number: b.booking_number || b.bookingNumber,
            guestId: b.id || b._id || g?.id || g?._id || b.guest,
            name: g?.fullName || g?.name || b.primary_guest_name || b.guestName || "Resident Guest",
            email: g?.email || b.email || "",
            phone: g?.mobileNumber || g?.phone || b.mobile_number || b.mobileNumber || b.guestPhone || "N/A",
            roomAssigned: assignedRoom,
            checkInDate: formatStayLabel(staySource, "in"),
            checkOutDate: formatStayLabel(staySource, "out"),
            totalAmount: totalAmt,
            advancePayment: paidAmt,
            pendingDues: dueAmt,
            status: b.status === "CHECKED_IN" ? "IN-HOUSE" : b.status === "CHECKED_OUT" ? "DEPARTED" : b.status || "IN-HOUSE",
          };
        });
    }

    return (guests || []).map((g) => {
      const paidAmt = g.paidAmount !== undefined ? Number(g.paidAmount) : (g.advancePayment || 0);
      const totalAmt = Number(g.totalAmount || 0);
      const dueAmt = g.dueAmount !== undefined ? Number(g.dueAmount) : Math.max(0, totalAmt - paidAmt);
      const assignedRoom = g.roomNumber || g.roomAssigned || (Array.isArray(g.roomNumbers) && g.roomNumbers.length > 0 ? g.roomNumbers.join(", ") : "-");
      return {
        _id: g._id,
        guestId: g._id,
        name: g.fullName || g.name || "Guest",
        email: g.email || "",
        phone: g.mobileNumber || g.phone || "N/A",
        roomAssigned: assignedRoom,
        checkInDate: formatStayLabel(g, "in"),
        checkOutDate: formatStayLabel(g, "out"),
        totalAmount: totalAmt,
        advancePayment: paidAmt,
        pendingDues: dueAmt,
        status: g.status || "IN-HOUSE",
      };
    });
  }, [bookings, guests, stayById, todayStr]);

  useEffect(() => {
    const missing = (bookings || []).filter((booking) => {
      const id = String(booking?.id || booking?._id || "");
      return id && !stayById[id] && (formatStayLabel(booking, "in") === "—" || formatStayLabel(booking, "out") === "—");
    });
    if (!missing.length) return undefined;
    let cancelled = false;
    (async () => {
      const loaded = {};
      await Promise.all(missing.slice(0, 20).map(async (booking) => {
        const id = String(booking.id || booking._id);
        try {
          const res = await apiRequest(API_ENDPOINTS.BOOKINGS.BY_ID(id), { forceRefresh: true });
          const body = res?.data?.booking || res?.data?.data || res?.data || res?.booking || {};
          loaded[id] = body && typeof body === "object" ? body : {};
        } catch {
          loaded[id] = {};
        }
      }));
      if (!cancelled) setStayById((prev) => ({ ...prev, ...loaded }));
    })();
    return () => { cancelled = true; };
  }, [bookings, stayById]);

  function formatStayLabel(record, kind) {
    if (!record || typeof record !== "object") return "—";
    const names = kind === "in"
      ? ["actual_check_in", "actualCheckIn", "check_in_date", "checkInDate", "check_in", "checkIn"]
      : ["actual_check_out", "actualCheckOut", "check_out_date", "checkOutDate", "check_out", "checkOut"];
    const sources = [record, record.booking, record.activeBooking, record.data].filter((item) => item && typeof item === "object");
    let raw = "";
    for (const source of sources) {
      for (const name of names) {
        const value = source[name];
        if (value == null || value === "") continue;
        raw = value instanceof Date ? value.toISOString() : value;
        break;
      }
      if (raw) break;
    }
    if (!raw) return "—";
    const text = String(raw).trim();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const clock = (hours, minutes) => {
      const hour = Number(hours);
      return `${hour % 12 || 12}:${String(minutes).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;
    };
    const wall = text.match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
    if (wall && !text.endsWith("Z")) {
      return `${Number(wall[3])} ${months[Number(wall[2]) - 1]} ${wall[1]}, ${clock(wall[4], wall[5])}`;
    }
    const dateOnly = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnly || /T00:00:00/.test(text)) {
      const part = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
      return part ? `${Number(part[3])} ${months[Number(part[2]) - 1]} ${part[1]}` : "—";
    }
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return "—";
    return new Intl.DateTimeFormat("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(parsed);
  }

  // 1-Click WhatsApp Direct Message Dispatcher
  const handleSendWhatsAppInvoice = (guest) => {
    const hotelName = user?.hotel?.name || "MYOWNPMS";
    const phoneClean = (guest.phone || "").replace(/[^0-9]/g, "");
    const targetPhone = phoneClean.length === 10 ? `91${phoneClean}` : phoneClean;
    const msgText = encodeURIComponent(
      `🏨 *${hotelName}* - Official Guest Folio & Invoice\n\n` +
      `Namaste *${guest.name}*,\n` +
      `Thank you for staying with us in *Room #${guest.roomAssigned}*.\n` +
      `• Check-In: ${guest.checkInDate}\n` +
      `• Total Amount: ₹${guest.totalAmount?.toLocaleString("en-IN")}\n` +
      `• Status: ${guest.status === "IN-HOUSE" ? "Active Stay" : "Settled / Checked-Out"}\n\n` +
      `For any assistance or room service, please contact Front Desk: ${user?.hotel?.phone || "+91 98765 43210"}.\n` +
      `Wish you a pleasant stay!`
    );
    window.open(`https://wa.me/${targetPhone}?text=${msgText}`, "_blank");
  };

  // Greeting according to local time
  const currentHour = new Date(nowTime).getHours();
  const timeGreeting = currentHour < 12 ? "Good Morning" : currentHour < 17 ? "Good Afternoon" : "Good Evening";
  const liveClockString = new Date(nowTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  // Show Full Dedicated Revenue Details Page when requested
  if (showRevenueDetailsView) {
    return (
      <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
        <RevenueDetailsPage
          onBackToDashboard={() => setShowRevenueDetailsView(false)}
          hotelSettings={hotelSettings}
          initialFilter={revenueFilterMode}
          dashboardData={dashboardData}
        />
      </Box>
    );
  }

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 } }}>
      {/* ========================================================================= */}
      {/* 1. HERO COMMAND RIBBON with LIVE CLOCK & SAAS TELEMETRY                   */}
      {/* ========================================================================= */}
      <Box
        sx={{
          mb: 3,
          p: { xs: 2, sm: 2.5, md: 3 },
          borderRadius: { xs: "18px", sm: "24px" },
          background: `linear-gradient(135deg, ${themeConfig.primaryDark || "#0C273B"} 0%, ${themeConfig.primary || "#0B8EE0"} 100%)`,
          color: "#FFFFFF",
          boxShadow: `0 16px 36px -10px ${themeConfig.primaryGlow || "rgba(11, 142, 224, 0.4)"}, inset 0 1px 1px rgba(255,255,255,0.4)`,
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

        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 2, position: "relative", zIndex: 1 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8, flexWrap: "wrap" }}>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 1,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: { xs: "0.65rem", sm: "0.72rem" },
                }}
              >
                {timeGreeting} &bull; Live Operations Center
              </Typography>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: -0.5, fontSize: { xs: "1.25rem", sm: "1.8rem" } }}>
              {dashboardData?.hotel?.name || user?.hotel?.name || "MYOWNPMS"}
            </Typography>
            {user?.hotel?.city ? (
              <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 0.5, fontSize: { xs: "0.78rem", sm: "0.85rem" }, display: "flex", alignItems: "center", gap: 0.6 }}>
                <LocationOn sx={{ fontSize: 15 }} />
                <span>{user.hotel.city}</span>
              </Typography>
            ) : null}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "space-between", sm: "flex-end" } }}>
            {/* Live Clock Badge */}
            <Box
              sx={{
                px: 2,
                py: 0.9,
                borderRadius: "14px",
                bgcolor: "rgba(0,0,0,0.25)",
                backdropFilter: "blur(8px)",
                border: "1px solid rgba(255,255,255,0.15)",
                display: "flex",
                alignItems: "center",
                gap: 1,
              }}
            >
              <Box className="live-pulse-3d" />
              <Typography variant="caption" sx={{ fontWeight: 800, color: "#FFFFFF", fontSize: "0.82rem", letterSpacing: 0.5 }}>
                {liveClockString}
              </Typography>
            </Box>

            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={onRefresh}
              className="btn-3d"
              sx={{
                width: { xs: "100%", sm: "auto" },
                justifyContent: "center",
                whiteSpace: "nowrap",
                borderRadius: "14px",
                bgcolor: isDarkMode ? "rgba(255,255,255,0.12)" : "#FFFFFF",
                color: isDarkMode ? "#FFFFFF" : (themeConfig.primaryDark || "#0C273B"),
                fontWeight: 800,
                fontSize: { xs: "0.78rem", sm: "0.82rem" },
                px: { xs: 2, sm: 2.5 },
                py: 1,
                border: isDarkMode ? `1px solid ${themeConfig.border}` : "none",
                boxShadow: "0 6px 16px rgba(0,0,0,0.15)",
                "&:hover": {
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.2)" : "#F8FAFC",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Sync Live Status
            </Button>
          </Box>
        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* 4. FINANCIAL & REVENUE TELEMETRY (4 STAT CARDS - PHOTO 2 DESIGN)          */}
      {/* ========================================================================= */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.15)", color: "#10B981", width: 32, height: 32, borderRadius: "8px" }}>
              <CurrencyRupee sx={{ fontSize: 18 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: { xs: "0.95rem", sm: "1.05rem" } }}>
              Financial &amp; Revenue Telemetry
            </Typography>
          </Box>
          <Chip
            label="Live Real-time Audit"
            size="small"
            sx={{
              fontWeight: 800,
              fontSize: "0.72rem",
              borderRadius: "8px",
              bgcolor: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              maxWidth: "100%",
            }}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" },
            gap: 2.5,
          }}
        >
          {/* Card 1: Today's Revenue */}
          <StatCard
            title="TODAY'S REVENUE"
            value={todayRevenue}
            subtitle={liveTodayRevNum > 0 ? "Verified collections today" : "No new billing transactions today"}
            icon={<CurrencyRupee />}
            color="#10B981"
            trend="Live Counter"
            trendType="up"
            badgeText="Counter"
            onClick={() => {
              setRevenueFilterMode("TODAY");
              setShowRevenueDetailsView(true);
            }}
          />

          {/* Card 2: Weekly Total Earnings */}
          <StatCard
            title="WEEKLY TOTAL EARNINGS"
            value={weeklyEarnings}
            subtitle="7-day rolling revenue aggregate"
            icon={<TrendingUp />}
            color="#0B8EE0"
            trend="Last 7 Days"
            trendType="up"
            badgeText="Weekly Total"
            onClick={() => {
              setRevenueFilterMode("THIS_WEEK");
              setShowRevenueDetailsView(true);
            }}
          />

          {/* Card 3: Total Guests */}
          <StatCard
            title="TOTAL GUESTS"
            value={`${liveTotalGuests} Guests`}
            subtitle={`${liveInHouseGuests} in-house • ${ops.checkedInToday || 0} checked in today • ${ops.checkedOutToday || 0} checked out`}
            icon={<Person />}
            color="#8B5CF6"
            badgeText="Total"
          />

          {/* Card 4: Monthly Revenue */}
          <StatCard
            title="MONTHLY REVENUE"
            value={monthlyRevenue}
            subtitle="Current billing cycle"
            icon={<AccountBalanceWallet />}
            color="#F59E0B"
            badgeText="Monthly Total"
            onClick={() => {
              setRevenueFilterMode("THIS_MONTH");
              setShowRevenueDetailsView(true);
            }}
          />
        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* 4.5 📊 EXECUTIVE VISUAL ANALYTICS & INTELLIGENCE SUITE                    */}
      {/* ========================================================================= */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" }, justifyContent: "space-between", gap: 1.5, mb: 2, flexWrap: "wrap" }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
            <Avatar sx={{ bgcolor: "rgba(67, 97, 238, 0.12)", color: themeConfig.primary, width: 32, height: 32, borderRadius: "8px" }}>
              <TrendingUp sx={{ fontSize: 18 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: { xs: "0.95rem", sm: "1.05rem" } }}>
              Visual Revenue &amp; Occupancy Analytics
            </Typography>
          </Box>
          <Chip
            icon={<TrendingUp sx={{ fontSize: "14px !important", color: themeConfig.primary }} />}
            label="Live Realtime Telemetry"
            size="small"
            sx={{ fontWeight: 800, fontSize: "0.7rem", borderRadius: "8px", bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, maxWidth: "100%" }}
          />
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(12, 1fr)" },
            gap: 2.5,
          }}
        >
          {/* 1. Circular Occupancy Donut */}
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 12", lg: "span 5", xl: "span 4" }, display: "flex", flexDirection: "column" }}>
            <OccupancyDonutChart
              rooms={rooms}
              statuses={(dashboardData?.room_status_graph || dashboardData?.roomStatusGraph)?.statuses}
              occupancyRate={dashboardData?.operationsSummary?.occupancyRate}
            />
          </Box>

          {/* 2. 7-Day Revenue Curve Wave */}
          <Box sx={{ gridColumn: { xs: "span 12", md: "span 12", lg: "span 7", xl: "span 8" }, display: "flex", flexDirection: "column" }}>
            <RevenueWaveChart dashboardData={dashboardData} isDarkMode={isDarkMode} />
          </Box>

        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* 5. 🏨 ROOM CATEGORIES & LIVE INVENTORY (hidden on overview)             */}
      {/* ========================================================================= */}
      {false && (
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
          {/* Header (Exact Match to User Image) */}
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <div>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5, fontSize: { xs: "1.15rem", sm: "1.45rem" }, lineHeight: 1.3, display: "flex", alignItems: "center", gap: 1 }}>
                🏨 Room Categories &amp; Live Inventory
              </Typography>
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontSize: { xs: "0.78rem", sm: "0.85rem" }, mt: 0.3 }}>
                Live vacant/booked telemetry and room inventory status across all categories.
              </Typography>
            </div>

            <Button
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => onTabChange && onTabChange("rooms")}
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
              Open Rooms List ({rooms.length})
            </Button>
          </Box>

          {/* Category Cards (Exact Match to User Image) */}
          {categoryBreakdown.length === 0 ? (
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
                  sm: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(auto-fit, minmax(310px, 1fr))",
                  xl: "repeat(3, 1fr)",
                },
                gap: { xs: 2, sm: 2.5 },
              }}
            >
              {categoryBreakdown.map((cat) => {
                const isSelected = selectedCategory === cat.name;
                const hasAvailable = cat.available > 0;
                const isAllBooked = cat.available === 0 && cat.totalRooms > 0;
                const adultsCount = cat.capacity?.adults || 2;
                const kidsCount = cat.capacity?.children || 1;

                return (
                  <Card
                    key={cat._id || cat.name}
                    className="card-3d"
                    sx={{
                      p: { xs: 2, sm: 2.2, md: 2.5 },
                      borderRadius: "20px",
                      border: isSelected
                        ? "2px solid #0D9488"
                        : `2px solid ${hasAvailable ? "rgba(13, 148, 136, 0.25)" : themeConfig.border}`,
                      bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                      background: isDarkMode
                        ? (themeConfig.bgCard || "#0E312C")
                        : (hasAvailable
                          ? "linear-gradient(135deg, #FFFFFF 0%, #F4F9FD 100%)"
                          : "linear-gradient(135deg, #FFFFFF 0%, #FAFAFA 100%)"),
                      boxShadow: isSelected
                        ? "0 12px 28px -6px rgba(13, 148, 136, 0.25), inset 0 1px 1px #FFFFFF"
                        : (isDarkMode ? "none" : "0 8px 24px rgba(12, 39, 59, 0.06), inset 0 1px 1px #FFFFFF"),
                      cursor: "default",
                      userSelect: "none",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      gap: 2,
                    }}
                  >
                    <div>
                      {/* Top Row: Avatar + Category Name on left, Price on right */}
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
                            sx={{
                              fontWeight: 900,
                              color: themeConfig.textMain,
                              lineHeight: 1.2,
                              fontSize: { xs: "1rem", sm: "1.05rem" },
                            }}
                          >
                            {cat.name}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: "right", flexShrink: 0, whiteSpace: "nowrap" }}>
                          <Typography variant="h6" sx={{ fontWeight: 900, color: "#0F766E", lineHeight: 1, fontSize: { xs: "1.15rem", sm: "1.25rem" } }}>
                            ₹{Number(cat.basePrice || 0).toLocaleString("en-IN")}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "block", mt: 0.3, fontSize: "0.72rem" }}>
                            / night
                          </Typography>
                        </Box>
                      </Box>

                      {/* Specs Row: Guests & Bed across full card width */}
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          flexWrap: "wrap",
                          gap: 0.8,
                          mb: 1.5,
                          px: 0.2,
                        }}
                      >
                        <Typography
                          variant="caption"
                          sx={{
                            color: themeConfig.textMuted,
                            fontWeight: 800,
                            fontSize: "0.75rem",
                            display: "flex",
                            alignItems: "center",
                            gap: 0.5,
                            whiteSpace: "nowrap",
                          }}
                        >
                          👥 Max {adultsCount} Guests {kidsCount > 0 ? `(+ ${kidsCount} Kids)` : ""}
                        </Typography>

                        <Chip
                          icon={<Bed sx={{ fontSize: 13, color: "#0F766E !important" }} />}
                          label={
                            cat.bedType
                              ? String(cat.bedType).toLowerCase().includes("bed")
                                ? cat.bedType
                                : `${cat.bedType} Bed`
                              : `${cat.bedCount} Bed`
                          }
                          size="small"
                          sx={{
                            bgcolor: "rgba(20, 184, 166, 0.12)",
                            color: "#0F766E",
                            fontWeight: 800,
                            fontSize: "0.7rem",
                            height: 23,
                            border: "none",
                            flexShrink: 0,
                            "& .MuiChip-label": { px: 0.8, whiteSpace: "nowrap" },
                          }}
                        />
                      </Box>

                      {/* 3 Status Units (Available, Booked, Cleaning) */}
                      <Box
                        sx={{
                          display: "grid",
                          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
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
                            {cat.available}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: "center", p: 0.8, borderRadius: "10px", bgcolor: "rgba(11, 142, 224, 0.08)" }}>
                          <Typography variant="caption" sx={{ color: "#0284C7", fontWeight: 800, display: "block", fontSize: "0.65rem" }}>
                            🔵 Booked
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: "#0B8EE0", fontSize: "1.15rem", lineHeight: 1.2, mt: 0.2 }}>
                            {cat.occupied + cat.reserved}
                          </Typography>
                        </Box>

                        <Box sx={{ textAlign: "center", p: 0.8, borderRadius: "10px", bgcolor: "rgba(217, 119, 6, 0.08)" }}>
                          <Typography variant="caption" sx={{ color: "#D97706", fontWeight: 800, display: "block", fontSize: "0.65rem" }}>
                            🟡 Cleaning
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 900, color: "#D97706", fontSize: "1.15rem", lineHeight: 1.2, mt: 0.2 }}>
                            {cat.cleaning}
                          </Typography>
                        </Box>
                      </Box>
                    </div>

                    {/* Card Footer */}
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
                          fontSize: "0.72rem",
                          bgcolor: isAllBooked ? "rgba(239, 68, 68, 0.1)" : hasAvailable ? "rgba(16, 185, 129, 0.12)" : "rgba(0,0,0,0.05)",
                          color: isAllBooked ? "#EF4444" : hasAvailable ? "#059669" : themeConfig.textMuted,
                          borderRadius: "8px",
                          border: "none",
                        }}
                      />

                      <Typography
                        variant="caption"
                        sx={{
                          fontWeight: 800,
                          color: "#0F766E",
                          fontSize: "0.8rem",
                          cursor: "default",
                          userSelect: "none",
                        }}
                      >
                        Total {cat.totalRooms} {cat.totalRooms === 1 ? "Room" : "Rooms"}
                      </Typography>
                    </Box>
                  </Card>
                );
              })}
            </Box>
          )}

          </CardContent>
      </Card>
      )}

      {/* 6. 👥 LIVE IN-HOUSE GUESTS & 1-CLICK WHATSAPP INVOICE DISPATCHER           */}
      {/* ========================================================================= */}
      <Card
        className="card-3d"
        sx={{
          borderRadius: "22px",
          border: `1px solid ${themeConfig.border}`,
          boxShadow: "0 10px 30px -5px rgba(12, 39, 59, 0.08)",
          background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #F9FBFC 100%)",
        }}
      >
        <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, gap: 1.5, mb: 2.5 }}>
            <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
              <Avatar sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, width: { xs: 26, sm: 32 }, height: { xs: 26, sm: 32 }, borderRadius: "8px", mt: 0.2 }}>
                <People sx={{ fontSize: { xs: 15, sm: 18 } }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: { xs: "0.82rem", sm: "0.98rem", md: "1.05rem" }, letterSpacing: -0.2, lineHeight: 1.25 }}>
                  Active In-House Guests &amp; Direct WhatsApp Folio
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: { xs: "0.7rem", sm: "0.8rem" }, display: "block", mt: 0.3, lineHeight: 1.25 }}>
                  Live billing balances, stay timelines, and 1-click WhatsApp tax invoice
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              size="small"
              endIcon={<ArrowForward />}
              onClick={() => onTabChange && onTabChange("guests")}
              sx={{
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.82rem",
                textTransform: "none",
                borderColor: themeConfig.border,
                color: themeConfig.textMain,
                bgcolor: themeConfig.bgCard,
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
              }}
            >
              Full Guest Directory
            </Button>
          </Box>

          <TableContainer
            component={Paper}
            sx={{
              borderRadius: "16px",
              border: `1px solid ${themeConfig.border}`,
              boxShadow: "none",
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: { xs: "52vh", md: "420px" },
            }}
          >
            <Table size="small" stickyHeader sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, bgcolor: themeConfig.champagne }}>Guest Name</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, bgcolor: themeConfig.champagne }}>Room</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, bgcolor: themeConfig.champagne }}>Stay Dates</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, bgcolor: themeConfig.champagne }}>Balance Dues</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, bgcolor: themeConfig.champagne }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: themeConfig.textMain, bgcolor: themeConfig.champagne }}>1-Click WhatsApp</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeRecentGuests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 3, color: themeConfig.textMuted, fontWeight: 700 }}>
                      No active in-house guests currently checked in.
                    </TableCell>
                  </TableRow>
                ) : (
                  activeRecentGuests
                    .slice(guestPage * guestRowsPerPage, guestPage * guestRowsPerPage + guestRowsPerPage)
                    .map((g) => (
                      <TableRow
                        key={g._id || g.name}
                        hover
                        onClick={() => {
                          const resolvedId = g.id || g.bookingId || g._id || g.guestId;
                          setSelectedGuestModal({
                            open: true,
                            guest: createSafeGuestModalData(g),
                            guestId: resolvedId,
                          });
                        }}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "rgba(16, 185, 129, 0.05)" },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <Avatar sx={{ width: 32, height: 32, fontSize: "0.8rem", fontWeight: 800, bgcolor: themeConfig.primary, color: "#FFFFFF" }}>
                              {(g.name || "G").charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                {g.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem" }}>
                                {g.phone}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={`Room #${g.roomAssigned}`}
                            size="small"
                            sx={{ fontWeight: 800, borderRadius: "6px", bgcolor: themeConfig.champagne, color: themeConfig.primaryDark }}
                          />
                        </TableCell>
                        <TableCell sx={{ color: themeConfig.textMuted, fontSize: "0.82rem" }}>
                          <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1.35 }}>
                            <span>In: {g.checkInDate || "—"}</span>
                            <span>Out: {g.checkOutDate || "—"}</span>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontWeight: 800, color: g.pendingDues > 0 ? "#EF4444" : "#10B981" }}>
                          {g.pendingDues > 0 ? `₹${g.pendingDues.toLocaleString("en-IN")}` : "✓ Paid"}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={g.status} size="small" />
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Tooltip title="Send Folio & Invoice on WhatsApp">
                            <IconButton
                              size="small"
                              onClick={() => handleSendWhatsAppInvoice(g)}
                              sx={{
                                bgcolor: "rgba(37, 211, 102, 0.15)",
                                color: "#25D366",
                                "&:hover": { bgcolor: "#25D366", color: "#FFFFFF" },
                              }}
                            >
                              <WhatsApp fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Table Pagination */}
          {activeRecentGuests.length > 0 && (
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={activeRecentGuests.length}
              rowsPerPage={guestRowsPerPage}
              page={guestPage}
              onPageChange={(e, newPage) => setGuestPage(newPage)}
              onRowsPerPageChange={(e) => {
                setGuestRowsPerPage(parseInt(e.target.value, 10));
                setGuestPage(0);
              }}
              sx={{ borderTop: `1px solid ${themeConfig.border}`, mt: 1 }}
            />
          )}
        </CardContent>
      </Card>

      <GuestDetailsModal
        open={selectedGuestModal.open}
        onClose={() => setSelectedGuestModal({ open: false, guest: null, guestId: null })}
        guestId={selectedGuestModal.guestId}
        guestData={selectedGuestModal.guest}
        hotelSettings={hotelSettings}
      />

    </Box>
  );
}
