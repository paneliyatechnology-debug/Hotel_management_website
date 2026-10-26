"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { useSocket } from "@/shared/context/SocketContext";
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  TextField,
  InputAdornment,
  LinearProgress,
  MenuItem,
} from "@mui/material";
import { toast } from "@/shared/utils/toast";
import CheckoutDialog from "@/receptionist/components/CheckoutDialog";
import PeriodRangeFilter from "@/shared/components/PeriodRangeFilter";
import {
  HowToReg,
  CleaningServices,
  Build,
  CheckCircle,
  ArrowForward,
  People,
  MeetingRoom,
  KingBed,
  Hotel,
  Favorite,
  FamilyRestroom,
  Diamond,
  Villa,
  SingleBed,
  Work,
  Close,
  Phone,
  WhatsApp,
  CurrencyRupee,
  Receipt,
  TrendingUp,
  Search,
  Logout,
  Print,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import { TableCard, TableToolbar, TablePager, tableFieldSx } from "@/shared/components/DataTable";
import dynamic from "next/dynamic";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { sendCheckInWhatsApp, sendCheckoutBillWhatsApp } from "@/shared/utils/whatsappUtils";
import { createSafeGuestModalData } from "@/shared/utils/guestModalUtils";
import GuestDetailsModal from "@/shared/components/GuestDetailsModal";
import FolioPdfButton from "@/shared/components/FolioPdfButton";
import RoomNumberChips from "@/shared/components/RoomNumberChips";
import { downloadBookingBill } from "@/shared/utils/bookingPdf";
import { resolveBookingGuestNames } from "@/shared/utils/guestUtils";
import {
  buildListQuery,
  extractRoomTypesFromResponse,
  extractRoomsFromResponse,
} from "@/shared/utils/listQuery";
import { normalizeBooking } from "@/shared/utils/liveSync";
import {
  useHotelPaymentMethods,
  buildPaymentCollectionSourceRows,
} from "@/shared/hooks/useHotelPaymentMethods";

function readCount(source, snakeKey, camelKey) {
  const value = source?.[snakeKey] ?? source?.[camelKey];
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

/** Prefer room-type API status counts — no rooms list required on the dashboard */
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

export default function ReceptionistOverviewPage({
  user,
  hotelSettings = { checkInTime: "14:00", checkOutTime: "12:00", timezone: "Asia/Kolkata" },
  onNavigateTab,
  onSelectRoomForCheckIn,
  onCheckOut,
  onRequestCheckout,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const { methods: hotelPaymentMethods } = useHotelPaymentMethods();
  const [daySummary, setDaySummary] = useState(null);
  const [summaryTick, setSummaryTick] = useState(0);
  const [summaryRange, setSummaryRange] = useState("TODAY");
  const [summaryStart, setSummaryStart] = useState("");
  const [summaryEnd, setSummaryEnd] = useState("");

  // Dashboard-owned data (no parent rooms/bookings dump)
  const [roomTypes, setRoomTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [bookingsTotal, setBookingsTotal] = useState(0);
  const [bookingsTick, setBookingsTick] = useState(0);
  const [roomTypesTick, setRoomTypesTick] = useState(0);
  const [roomsTick, setRoomsTick] = useState(0);
  const [rooms, setRooms] = useState([]); // only filled when a Rooms telemetry modal opens
  const [guests] = useState([]);

  // Pagination for Recent Check-Ins Table — must match API page/limit
  const [guestPage, setGuestPage] = useState(0);
  const [guestRowsPerPage, setGuestRowsPerPage] = useState(5);
  const [billBusyId, setBillBusyId] = useState("");
  const [recentFilter, setRecentFilter] = useState("ALL");

  // Live updates: refresh only the matching dataset (never all four APIs at once)
  useSocket(["PAYMENT_RECORDED", "DASHBOARD_SYNC"], () => {
    setSummaryTick((tick) => tick + 1);
  });
  useSocket(["ROOM_UPDATED"], () => {
    setRoomTypesTick((tick) => tick + 1);
    setRoomsTick((tick) => tick + 1);
  });
  useSocket(["BOOKING_CREATED", "BOOKING_UPDATED", "GUEST_CHECKED_OUT", "GUEST_UPDATED"], () => {
    setBookingsTick((tick) => tick + 1);
    setSummaryTick((tick) => tick + 1);
    setRoomsTick((tick) => tick + 1);
  });

  // 1) Summary KPIs / sources
  useEffect(() => {
    const now = new Date();
    const ymd = (date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
    let start = ymd(now);
    let end = ymd(now);
    if (summaryRange === "THIS_WEEK" || summaryRange === "LAST_WEEK") {
      const monday = new Date(now);
      monday.setDate(now.getDate() - (now.getDay() === 0 ? 6 : now.getDay() - 1) - (summaryRange === "LAST_WEEK" ? 7 : 0));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      start = ymd(monday);
      end = ymd(sunday);
    } else if (summaryRange === "THIS_MONTH" || summaryRange === "LAST_MONTH") {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - (summaryRange === "LAST_MONTH" ? 1 : 0), 1);
      const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0);
      start = ymd(monthStart);
      end = ymd(monthEnd);
    } else if (summaryRange === "CUSTOM") {
      if (!summaryStart || !summaryEnd) return undefined;
      start = summaryStart;
      end = summaryEnd;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.SUMMARY(start, end));
        const payload = res?.data && !Array.isArray(res.data) ? res.data : res;
        if (!cancelled && payload && typeof payload === "object") setDaySummary(payload);
      } catch {
        if (!cancelled) setDaySummary(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [summaryTick, summaryRange, summaryStart, summaryEnd]);

  // 2) Room categories + inventory chips (from room-types counts — not rooms list)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const q = buildListQuery({ page: 1, limit: 12 });
        const res = await apiRequest(`${API_ENDPOINTS.RECEPTIONIST.ROOM_TYPES}?${q}`);
        if (!cancelled) setRoomTypes(extractRoomTypesFromResponse(res).roomTypes);
      } catch {
        if (!cancelled) setRoomTypes([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [roomTypesTick]);

  // 3) Guest table — API pagination matches rows-per-page (default 5)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const status =
          recentFilter === "CHECK_IN" || recentFilter === "IN_HOUSE" || recentFilter === "TODAY_CHECKIN"
            ? "CHECKED_IN"
            : recentFilter === "CHECK_OUT" || recentFilter === "TODAY_CHECKOUT"
              ? "CHECKED_OUT"
              : undefined;
        const q = buildListQuery({
          page: guestPage + 1,
          limit: guestRowsPerPage,
          status,
        });
        const res = await apiRequest(`${API_ENDPOINTS.RECEPTIONIST.BOOKINGS}?${q}`);
        const raw =
          res?.data?.bookings ||
          res?.bookings ||
          (Array.isArray(res?.data) ? res.data : null) ||
          (Array.isArray(res) ? res : []) ||
          [];
        const list = (Array.isArray(raw) ? raw : []).map((b) => normalizeBooking(b) || b);
        const total = Number(res?.data?.total ?? res?.total ?? list.length) || list.length;
        if (!cancelled) {
          setBookings(list);
          setBookingsTotal(total);
        }
      } catch {
        if (!cancelled) {
          setBookings([]);
          setBookingsTotal(0);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [guestPage, guestRowsPerPage, recentFilter, bookingsTick]);

  const apiDateLabel = (value) => {
    if (!value) return "—";
    const text = String(value).trim();
    const wall = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (wall && !/[zZ]$/.test(text)) return `${wall[3]}-${wall[2]}-${wall[1]}`;
    const parsed = new Date(text);
    if (Number.isNaN(parsed.getTime())) return "—";
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).formatToParts(parsed);
    const get = (type) => parts.find((part) => part.type === type)?.value || "";
    return `${get("day")}-${get("month")}-${get("year")}`;
  };

  // Selected Guest Modal State
  const [selectedGuestModal, setSelectedGuestModal] = useState({
    open: false,
    guest: null,
    guestId: null,
  });

  // Check-out (shared check-out dialog)
  const [checkoutItem, setCheckoutItem] = useState(null);
  const handleOpenCheckoutModal = (item) => setCheckoutItem(item);

  const formatDDMMYYYY = (val) => {
    if (!val || val === "N/A") return "N/A";
    if (typeof val === "string" && /^\d{2}-\d{2}-\d{4}$/.test(val)) return val;
    if (typeof val === "string" && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
      const [y, m, d] = val.split("-");
      return `${d}-${m}-${y}`;
    }
    if (typeof val === "string" && val.includes("/")) {
      const parts = val.split("/");
      if (parts.length === 3) {
        const m = parts[0].padStart(2, "0");
        const d = parts[1].padStart(2, "0");
        const y = parts[2];
        return `${d}-${m}-${y}`;
      }
    }
    const dateObj = new Date(val);
    if (isNaN(dateObj.getTime())) return String(val);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
  };

  // Telemetry Detail Modal State (Available, Occupied, Cleaning, Maintenance, In-House Guests)
  const [telemetryModal, setTelemetryModal] = useState({
    open: false,
    type: null, // "AVAILABLE" | "OCCUPIED" | "CLEANING" | "MAINTENANCE" | "IN_HOUSE_GUESTS"
  });
  const [telemetrySearch, setTelemetrySearch] = useState("");

  // Load rooms list only when a room-status modal needs row details (roomsTick keeps it live)
  useEffect(() => {
    if (!telemetryModal.open) return undefined;
    const type = telemetryModal.type;
    if (!type || type === "IN_HOUSE_GUESTS" || type === "TOTAL_GUESTS") return undefined;
    let cancelled = false;
    (async () => {
      try {
        const status =
          type === "OCCUPIED"
            ? "OCCUPIED"
            : type === "CLEANING"
              ? "CLEANING"
              : type === "MAINTENANCE"
                ? "MAINTENANCE"
                : "AVAILABLE";
        const q = buildListQuery({ page: 1, limit: 12, status });
        const res = await apiRequest(`${API_ENDPOINTS.RECEPTIONIST.ROOMS}?${q}`, { forceRefresh: true });
        if (!cancelled) setRooms(extractRoomsFromResponse(res).rooms);
      } catch {
        if (!cancelled) setRooms([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [telemetryModal.open, telemetryModal.type, roomsTick]);

  // Live Current Clock for Operational Banner & Housekeeping Countdown
  const [liveCurrentTime, setLiveCurrentTime] = useState(new Date());
  const resolvedCleaningRoomIds = useRef(new Set());

  const handleQuickRoomStatusChange = async (room, nextStatus = "AVAILABLE") => {
    if (!room?._id) return;
    try {
      await apiRequest(API_ENDPOINTS.RECEPTIONIST.UPDATE_ROOM_STATUS(room._id || room.id), {
        method: "PATCH",
        body: { status: nextStatus },
      });
      toast.success(`Room ${room.roomNumber} updated to ${nextStatus}!`);
      setRooms((prev) =>
        prev.map((r) =>
          String(r._id || r.id) === String(room._id || room.id) ? { ...r, status: nextStatus } : r
        )
      );
      setRoomTypesTick((t) => t + 1);
    } catch (err) {
      toast.error(err.message || "Failed to update room status");
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setLiveCurrentTime(now);

      // Auto-transition 100% completed cleaning rooms to AVAILABLE
      if (Array.isArray(rooms) && rooms.length > 0) {
        const nowMs = now.getTime();
        rooms.forEach((r) => {
          if (r.status === "CLEANING") {
            const startedAt = r.cleaningStartedAt
              ? new Date(r.cleaningStartedAt).getTime()
              : new Date(r.updatedAt || nowMs).getTime();
            const durationSec = (r.cleaningDurationMinutes || 15) * 60;
            const elapsedSec = Math.floor((nowMs - startedAt) / 1000);
            if (elapsedSec >= durationSec && !resolvedCleaningRoomIds.current.has(r._id)) {
              resolvedCleaningRoomIds.current.add(r._id);
              handleQuickRoomStatusChange(r, "AVAILABLE");
            }
          }
        });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [rooms]);

  // Helper to calculate remaining cleaning time & status
  const getCleaningTimerData = (room) => {
    if (room.status !== "CLEANING") return null;
    const startedAt = room.cleaningStartedAt
      ? new Date(room.cleaningStartedAt).getTime()
      : new Date(room.updatedAt || Date.now()).getTime();
    const durationSec = (room.cleaningDurationMinutes || 15) * 60;
    const elapsedSec = Math.floor((liveCurrentTime.getTime() - startedAt) / 1000);
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

  // Overall inventory chips — summed from room-types API counts (no rooms list)
  const inventoryTotals = useMemo(() => {
    return (roomTypes || []).reduce(
      (acc, rt) => {
        const c = categoryStatusCounts(rt);
        acc.available += c.available;
        acc.occupied += c.occupied;
        acc.cleaning += c.cleaning;
        acc.maintenance += c.maintenance;
        acc.total += c.totalRooms;
        return acc;
      },
      { available: 0, occupied: 0, cleaning: 0, maintenance: 0, total: 0 }
    );
  }, [roomTypes]);
  const totalOccupied = inventoryTotals.occupied;
  const totalAvailable = inventoryTotals.available;
  const totalCleaning = inventoryTotals.cleaning;
  const totalMaintenance = inventoryTotals.maintenance;

  // Compile all hotel guests (from guests directory + bookings)
  const totalGuestsList = useMemo(() => {
    const list = [];
    const seenGuestIds = new Set();
    const seenPhones = new Set();

    // 1. From guests array (Primary directory)
    guests.forEach((g) => {
      const gId = String(g._id || g.id);
      const gPhone = g.mobileNumber || g.phone || "";
      if (gId) seenGuestIds.add(gId);
      if (gPhone) seenPhones.add(gPhone);

      // Find active or latest booking for this guest
      const b = bookings.find((bk) => {
        const bGuestId = String(bk.guest?._id || bk.guest || bk.guestId || "");
        const bPhone = bk.guest?.mobileNumber || bk.guest?.phone || bk.guestPhone || "";
        return (bGuestId && bGuestId === gId) || (gPhone && bPhone && bPhone === gPhone);
      });

      const isCheckedIn = (g.status === "IN-HOUSE" || g.status === "CHECKED_IN") || (b && b.status === "CHECKED_IN");
      const roomNum =
        g.roomAssigned ||
        g.roomNumber ||
        (b ? (
          (Array.isArray(b.roomNumbers) && b.roomNumbers.length > 0)
            ? b.roomNumbers.join(", ")
            : (Array.isArray(b.rooms) && b.rooms.length > 0 && typeof b.rooms[0] === "object" && b.rooms[0]?.roomNumber)
              ? b.rooms.map((r) => r.roomNumber).join(", ")
              : b.roomNumber || (b.room?.roomNumber ? String(b.room.roomNumber) : "")
        ) : "") || "Not Assigned";

      const rawIn =
        g.actual_check_in ||
        g.actualCheckIn ||
        g.check_in_date ||
        g.checkInDate ||
        (b ? (b.actual_check_in || b.actualCheckIn || b.check_in_date || b.checkInDate) : null);

      const checkInDateStr = rawIn ? apiDateLabel(rawIn) : "—";

      const rawOut =
        g.actual_check_out ||
        g.actualCheckOut ||
        g.check_out_date ||
        g.checkOutDate ||
        (b ? (b.actual_check_out || b.actualCheckOut || b.check_out_date || b.checkOutDate) : null);

      const checkOutDateStr = rawOut ? apiDateLabel(rawOut) : "—";

      const bTotal = Number(b?.totalAmount ?? b?.total_amount ?? b?.total ?? b?.grandTotal ?? 0);
      const bPaid = Number(b?.paidAmount ?? b?.paid_amount ?? b?.advancePaymentAmount ?? b?.advance_paid ?? 0);
      const bDue = Number(b?.dueAmount ?? b?.due_amount ?? b?.due ?? Math.max(0, bTotal - bPaid));
      const bNights = Math.max(1, Number(b?.numberOfNights || b?.nights || 1));
      const bBase = Number(b?.baseAmount ?? b?.base_amount ?? (bTotal > 0 ? Math.round((bTotal / 1.18) * 100) / 100 : 0));
      const bGst = Number(b?.gstAmount ?? b?.gst_amount ?? (bTotal > bBase ? Math.round((bTotal - bBase) * 100) / 100 : Math.round(((bBase * 0.18)) * 100) / 100));
      const bPrice = Number(b?.pricePerNight || b?.price_per_night || b?.price || b?.customPricePerNight || b?.room?.customPricePerNight || (bBase > 0 ? Math.round((bBase / bNights) * 100) / 100 : 3500));
      const bRoomType = b?.roomType || b?.roomTypeName || b?.room?.roomType?.name || "Standard Room";

      const cleanB = b ? { ...b } : null;
      if (cleanB) {
        delete cleanB.guest;
        delete cleanB.booking;
        delete cleanB.activeBooking;
      }
      const cleanG = { ...g, roomAssigned: roomNum, checkInDate: checkInDateStr, checkOutDate: checkOutDateStr };
      delete cleanG.guest;
      delete cleanG.booking;
      delete cleanG.activeBooking;

      list.push({
        _id: g._id || g.id,
        ...(cleanB || {}),
        name: g.fullName || g.name || "Guest",
        phone: g.mobileNumber || g.phone || "N/A",
        email: g.email || "",
        status: isCheckedIn ? "IN-HOUSE" : (g.status || (b ? b.status : "REGISTERED")),
        roomAssigned: roomNum,
        totalVisits: g.totalVisits || (b ? 1 : 1),
        idProofType: g.idProofType || g.govtIdType || "AADHAAR",
        idProofNumber: g.idProofNumber || g.govtIdNumber || "Verified",
        verificationStatus: g.verificationStatus || "VERIFIED",
        checkInDate: checkInDateStr,
        checkOutDate: checkOutDateStr,
        accompanyingGuests: g.accompanyingGuests || b?.accompanyingGuests || [],
        totalAmount: bTotal > 0 ? bTotal : (bPaid + bDue),
        paidAmount: bPaid,
        dueAmount: bDue,
        baseAmount: bBase,
        gstAmount: bGst,
        gstRate: Number(b?.gstRate ?? b?.gst_rate ?? 18),
        pricePerNight: bPrice,
        numberOfNights: bNights,
        roomType: bRoomType,
        booking: cleanB,
        activeBooking: cleanB,
        guest: cleanG,
      });
    });

    // 2. From bookings if any guest was not in guests array
    bookings.forEach((b) => {
      const gObj = typeof b.guest === "object" && b.guest ? b.guest : {};
      const realBookingId = b.id || b._id || b.bookingId;
      const bNumber = b.booking_number || b.bookingNumber;
      const gId = String(gObj.id || gObj._id || b.guest || b.guestId || realBookingId || bNumber || "");
      const gPhone = gObj.mobileNumber || gObj.phone || b.guestPhone || b.mobile_number || b.phone || "";

      if (!seenGuestIds.has(gId) && (!gPhone || !seenPhones.has(gPhone))) {
        seenGuestIds.add(gId);
        if (gPhone) seenPhones.add(gPhone);

        const roomNum =
          (Array.isArray(b.roomNumbers) && b.roomNumbers.length > 0)
            ? b.roomNumbers.join(", ")
            : (Array.isArray(b.rooms) && b.rooms.length > 0 && typeof b.rooms[0] === "object" && b.rooms[0]?.roomNumber)
              ? b.rooms.map((r) => r.roomNumber).join(", ")
              : b.roomNumber || (b.room?.roomNumber ? String(b.room.roomNumber) : "Not Assigned");

        const rawIn =
          b.actual_check_in ||
          b.actualCheckIn ||
          b.check_in_date ||
          b.checkInDate;

        const checkInDateStr = rawIn ? apiDateLabel(rawIn) : "—";

        const rawOut =
          b.actual_check_out ||
          b.actualCheckOut ||
          b.check_out_date ||
          b.checkOutDate;

        const checkOutDateStr = rawOut ? apiDateLabel(rawOut) : "—";

        const bTotal = Number(b?.totalAmount ?? b?.total_amount ?? b?.total ?? b?.grandTotal ?? 0);
        const bPaid = Number(b?.paidAmount ?? b?.paid_amount ?? b?.advancePaymentAmount ?? b?.advance_paid ?? 0);
        const bDue = Number(b?.dueAmount ?? b?.due_amount ?? b?.due ?? Math.max(0, bTotal - bPaid));
        const bNights = Math.max(1, Number(b?.numberOfNights || b?.nights || 1));
        const bBase = Number(b?.baseAmount ?? b?.base_amount ?? (bTotal > 0 ? Math.round((bTotal / 1.18) * 100) / 100 : 0));
        const bGst = Number(b?.gstAmount ?? b?.gst_amount ?? (bTotal > bBase ? Math.round((bTotal - bBase) * 100) / 100 : Math.round(((bBase * 0.18)) * 100) / 100));
        const bPrice = Number(b?.pricePerNight || b?.price_per_night || b?.price || b?.customPricePerNight || b?.room?.customPricePerNight || (bBase > 0 ? Math.round((bBase / bNights) * 100) / 100 : 3500));
        const bRoomType = b?.roomType || b?.roomTypeName || b?.room?.roomType?.name || "Standard Room";

        const cleanB = { ...b };
        delete cleanB.guest;
        delete cleanB.booking;
        delete cleanB.activeBooking;

        const cleanG = { ...gObj, roomAssigned: roomNum, checkInDate: checkInDateStr, checkOutDate: checkOutDateStr };
        delete cleanG.guest;
        delete cleanG.booking;
        delete cleanG.activeBooking;

        list.push({
          _id: realBookingId || gObj.id || gObj._id || gId,
          id: realBookingId || gObj.id || gObj._id,
          bookingId: realBookingId,
          booking_number: bNumber,
          bookingNumber: bNumber,
          ...cleanB,
          name: resolveBookingGuestNames(cleanB).primaryGuestName || "Guest",
          phone: gPhone || "N/A",
          email: gObj.email || b.guestEmail || "",
          status: b.status === "CHECKED_IN" ? "IN-HOUSE" : b.status,
          roomAssigned: roomNum,
          totalVisits: 1,
          idProofType: gObj.govtIdType || gObj.idProofType || "AADHAAR",
          idProofNumber: gObj.govtIdNumber || gObj.idProofNumber || "Verified",
          verificationStatus: gObj.verificationStatus || "VERIFIED",
          checkInDate: checkInDateStr,
          checkOutDate: checkOutDateStr,
          accompanyingGuests: resolveBookingGuestNames(cleanB).additionalGuests,
          totalAmount: bTotal > 0 ? bTotal : (bPaid + bDue),
          paidAmount: bPaid,
          dueAmount: bDue,
          baseAmount: bBase,
          gstAmount: bGst,
          gstRate: Number(b?.gstRate ?? b?.gst_rate ?? 18),
          pricePerNight: bPrice,
          numberOfNights: bNights,
          roomType: bRoomType,
          booking: cleanB,
          activeBooking: cleanB,
          guest: cleanG,
        });
      }
    });

    return list;
  }, [guests, bookings]);

  const totalGuestsCount = totalGuestsList.length;

  // Compile all active in-house guests (from checked-in bookings + in-house guest records)
  const inHouseGuestsList = useMemo(() => {
    return totalGuestsList.filter((g) => {
      const s = (g.status || "").toUpperCase();
      return s === "IN-HOUSE" || s === "CHECKED_IN" || (g.booking && g.booking.status === "CHECKED_IN");
    });
  }, [totalGuestsList]);

  // Total in-house heads (including primary + accompanying members)
  const inHouseGuestsCount = useMemo(() => {
    if (inHouseGuestsList.length === 0) return 0;
    return inHouseGuestsList.reduce((acc, item) => {
      const coGuests = Array.isArray(item.accompanyingGuests) ? item.accompanyingGuests.length : 0;
      return acc + 1 + coGuests;
    }, 0);
  }, [inHouseGuestsList]);

  // Dynamic Category Icon helper
  const getCategoryIcon = (name = "") => {
    const n = name.toLowerCase();
    if (n.includes("coupl") || n.includes("copol") || n.includes("copul") || n.includes("honey") || n.includes("romant") || n.includes("love"))
      return <Favorite sx={{ fontSize: 22, color: "#E11D48" }} />;
    if (n.includes("fam") || n.includes("group") || n.includes("quad"))
      return <FamilyRestroom sx={{ fontSize: 22, color: "#059669" }} />;
    if (n.includes("villa") || n.includes("cottage") || n.includes("penthouse") || n.includes("resort") || n.includes("bungalow"))
      return <Villa sx={{ fontSize: 22, color: "#0891B2" }} />;
    if (n.includes("sweet") || n.includes("suite") || n.includes("deluxe") || n.includes("super") || n.includes("luxury") || n.includes("vip") || n.includes("presid"))
      return <Diamond sx={{ fontSize: 22, color: "#D97706" }} />;
    if (n.includes("single") || n.includes("solo"))
      return <SingleBed sx={{ fontSize: 22, color: "#6366F1" }} />;
    if (n.includes("business") || n.includes("exec") || n.includes("corporate"))
      return <Work sx={{ fontSize: 22, color: "#2563EB" }} />;
    if (n.includes("king") || n.includes("double") || n.includes("queen"))
      return <KingBed sx={{ fontSize: 22, color: "#10B981" }} />;
    return <Hotel sx={{ fontSize: 22 }} />;
  };

  // Categories from room-types API counts (backend already aggregates — no rooms list query)
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
          bedCount: rt.bedCount || 1,
          bedType: rt.bedType || "1 King Bed",
          capacity: rt.capacity || { adults: 2, children: 1 },
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
      .filter((cat) => cat && cat.totalRooms > 0);
  }, [roomTypes]);

  // All formatted bookings for recent table
  // Helper to determine if a date is Today
  const isTodayDate = (dateVal) => {
    if (!dateVal || dateVal === "N/A") return false;
    const now = new Date();
    const todayY = now.getFullYear();
    const todayM = now.getMonth();
    const todayD = now.getDate();

    if (typeof dateVal === "string" && /^\d{4}-\d{2}-\d{2}/.test(dateVal)) {
      const [y, m, d] = dateVal.split("T")[0].split("-").map(Number);
      if (y === todayY && m - 1 === todayM && d === todayD) return true;
    }
    if (typeof dateVal === "string" && /^\d{2}-\d{2}-\d{4}$/.test(dateVal)) {
      const [d, m, y] = dateVal.split("-").map(Number);
      if (y === todayY && m - 1 === todayM && d === todayD) return true;
    }
    const dObj = new Date(dateVal);
    if (!isNaN(dObj.getTime())) {
      return (
        dObj.getDate() === todayD &&
        dObj.getMonth() === todayM &&
        dObj.getFullYear() === todayY
      );
    }
    return false;
  };

  // All formatted bookings for recent table
  const allFormattedBookings = useMemo(() => {
    if (!bookings || bookings.length === 0) return [];
    return bookings.map((b) => {
      const g = typeof b.guest === "object" && b.guest ? b.guest : {};
      const roomsList = Array.isArray(b.roomNumbers) && b.roomNumbers.length > 0
        ? b.roomNumbers.map(String)
        : Array.isArray(b.rooms) && b.rooms.length > 0 && typeof b.rooms[0] === "object" && (b.rooms[0]?.roomNumber || b.rooms[0]?.room_number)
          ? b.rooms.map((r) => String(r.roomNumber || r.room_number || ""))
          : b.roomNumber || b.room_number
            ? String(b.roomNumber || b.room_number).split(",").map((s) => s.trim()).filter(Boolean)
            : [b.room?.roomNumber || b.room?.room_number || "101"];

      const rawCheckIn =
        b.actual_check_in ||
        b.actualCheckIn ||
        b.check_in_date ||
        b.checkInDate ||
        null;

      const rawCheckOut =
        b.actual_check_out ||
        b.actualCheckOut ||
        b.check_out_date ||
        b.checkOutDate ||
        null;

      const rawBStatus = String(b.booking_status || b.status || "").toUpperCase();
      const statusNormalized = (rawBStatus === "CHECKED_IN" || rawBStatus === "IN-HOUSE")
        ? "IN-HOUSE"
        : (rawBStatus === "CHECKED_OUT" || rawBStatus === "DEPARTED" || rawBStatus === "COMPLETED")
          ? "CHECKED_OUT"
          : (rawBStatus || "CONFIRMED");

      const bTotal = Number(b.totalAmount ?? b.total_amount ?? b.total ?? b.grandTotal ?? 0);
      const bPaid = Number(b.paidAmount ?? b.paid_amount ?? b.advancePaymentAmount ?? b.advance_paid ?? 0);
      const bDue = Number(b.dueAmount ?? b.due_amount ?? b.due ?? Math.max(0, bTotal - bPaid));
      const bNights = Math.max(1, Number(b.numberOfNights || b.nights || 1));
      const bBase = Number(b.baseAmount ?? b.base_amount ?? (bTotal > 0 ? Math.round((bTotal / 1.18) * 100) / 100 : 0));
      const bGst = Number(b.gstAmount ?? b.gst_amount ?? (bTotal > bBase ? Math.round((bTotal - bBase) * 100) / 100 : Math.round(((bBase * 0.18)) * 100) / 100));
      const bPrice = Number(b.pricePerNight || b.price_per_night || b.price || b.customPricePerNight || b.room?.customPricePerNight || (bBase > 0 ? Math.round((bBase / bNights) * 100) / 100 : 3500));
      const bRoomType = b.roomType || b.roomTypeName || b.room?.roomType?.name || "Standard Room";

      const realBId = b.id || b._id || b.bookingId;
      const bNum = b.booking_number || b.bookingNumber;

      return {
        _id: realBId,
        id: realBId,
        bookingId: realBId,
        booking_number: bNum,
        bookingNumber: bNum,
        ...b,
        booking: b,
        activeBooking: b,
        guest: g,
        guestId: g?.id || g?._id || b.guest?.id || b.guest?._id || (typeof b.guest === "string" ? b.guest : realBId),
        name: resolveBookingGuestNames(b).primaryGuestName || "Resident Guest",
        email: g?.email || b.email || "guest@hotel.com",
        phone: g?.mobileNumber || g?.phone || b.mobileNumber || b.mobile_number || b.phone || b.guestPhone || "N/A",
        roomAssigned: roomsList.length > 1 ? roomsList.join(", ") : roomsList[0],
        roomNumbers: roomsList,
        checkInDateRaw: rawCheckIn,
        checkInDate: rawCheckIn ? apiDateLabel(rawCheckIn) : "—",
        checkOutDateRaw: rawCheckOut,
        checkOutDate: rawCheckOut ? apiDateLabel(rawCheckOut) : "—",
        totalAmount: bTotal > 0 ? bTotal : (bPaid + bDue),
        paidAmount: bPaid,
        dueAmount: bDue,
        baseAmount: bBase,
        gstAmount: bGst,
        gstRate: Number(b.gstRate ?? b.gst_rate ?? 18),
        pricePerNight: bPrice,
        numberOfNights: bNights,
        roomType: bRoomType,
        status: statusNormalized,
        rawStatus: rawBStatus,
      };
    });
  }, [bookings]);

  // API already returns the current page for the selected filter — no client re-query/slice
  const activeRecentBookings = allFormattedBookings;
  const countAll = bookingsTotal;
  const summaryMethods =
    daySummary?.collection_by_payment_method || daySummary?.collectionByPaymentMethod || [];
  const money = (value) => `₹${Number(value || 0).toLocaleString("en-IN")}`;
  const todayCollected = Number(daySummary?.total_collected_amount ?? daySummary?.totalCollectedAmount ?? 0);
  const todayBookings = Number(daySummary?.total_booking_count ?? daySummary?.totalBookingCount ?? 0);
  const avgTicket = todayBookings > 0 ? Math.round(todayCollected / todayBookings) : 0;
  const SOURCE_COLORS = [themeConfig.primary, "#8B5CF6", "#F59E0B", "#10B981", "#EF4444", "#06B6D4"];
  const sourceBoxes = buildPaymentCollectionSourceRows(summaryMethods, hotelPaymentMethods).map(
    (row, index) => ({
      label: row.label,
      amount: row.amount,
      color: SOURCE_COLORS[index % SOURCE_COLORS.length],
    })
  );
  const shareBase = sourceBoxes.reduce((sum, row) => sum + (Number(row.amount) || 0), 0) || todayCollected;
  const sharePercent = (amount) => (shareBase > 0 ? Math.min(100, Math.round((Number(amount) || 0) / shareBase * 100)) : 0);

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 } }}>
      <PeriodRangeFilter
        value={summaryRange}
        onChange={setSummaryRange}
        start={summaryStart}
        end={summaryEnd}
        onApplyCustom={(from, to) => {
          setSummaryStart(from);
          setSummaryEnd(to);
          setSummaryRange("CUSTOM");
        }}
        sx={{ mb: 2 }}
      />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", md: "repeat(3, minmax(0, 1fr))" }, gap: 2, mb: 2 }}>
        {[
          { label: "Revenue", value: money(todayCollected), color: "#10B981", note: "Collected", icon: <CurrencyRupee sx={{ fontSize: 22 }} /> },
          { label: "Transactions", value: String(todayBookings), color: themeConfig.textMain, note: "In range", icon: <Receipt sx={{ fontSize: 22 }} /> },
          { label: "Avg ticket", value: money(avgTicket), color: themeConfig.primary, note: "Per booking", icon: <TrendingUp sx={{ fontSize: 22 }} /> },
        ].map((card) => (
          <Paper key={card.label} elevation={0} sx={{ p: 2, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: themeConfig.bgCard || "#FFFFFF", minWidth: 0 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
              <Box sx={{ minWidth: 0 }}>
                <Typography noWrap sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 800, textTransform: "uppercase" }}>{card.label}</Typography>
                <Typography noWrap sx={{ fontWeight: 900, color: card.color, fontSize: { xs: "1.35rem", sm: "1.7rem" }, mt: 0.4 }}>{card.value}</Typography>
              </Box>
              <Box sx={{ width: 36, height: 36, borderRadius: "10px", display: "grid", placeItems: "center", bgcolor: themeConfig.bgSoft, color: card.color, flexShrink: 0 }}>
                {card.icon}
              </Box>
            </Box>
            <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 700, mt: 0.8 }}>{card.note}</Typography>
          </Paper>
        ))}
      </Box>

      <Paper elevation={0} sx={{ mb: 3, p: { xs: 1.25, sm: 1.5 }, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: themeConfig.bgCard || "#FFFFFF" }}>
        <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.85rem", mb: 1.25 }}>Sources</Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr 1fr",
              md: `repeat(${Math.min(Math.max(sourceBoxes.length, 2), 6)}, minmax(0, 1fr))`,
            },
            gap: 1,
          }}
        >
          {sourceBoxes.map((item) => (
            <Box key={item.label} sx={{ minWidth: 0, p: 1.1, borderRadius: "12px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC" }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5, mb: 0.35 }}>
                <Typography noWrap sx={{ fontSize: "0.72rem", fontWeight: 800, color: themeConfig.textMuted }}>{item.label}</Typography>
                <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: item.color, flexShrink: 0 }}>{sharePercent(item.amount)}%</Typography>
              </Box>
              <Typography noWrap sx={{ fontWeight: 800, fontSize: "0.95rem", color: themeConfig.textMain }}>{money(item.amount)}</Typography>
              <LinearProgress
                variant="determinate"
                value={sharePercent(item.amount)}
                sx={{ mt: 0.65, height: 4, borderRadius: 3, bgcolor: themeConfig.tones.neutral.bg, "& .MuiLinearProgress-bar": { bgcolor: item.color, borderRadius: 3 } }}
              />
            </Box>
          ))}
        </Box>
      </Paper>
      {/* ========================================================================= */}
      {/* SECTION 2: LIVE TELEMETRY STAT CARDS                                       */}
      {/* ========================================================================= */}
      <Paper elevation={0} sx={{ mb: 3, p: { xs: 1.25, sm: 1.5 }, borderRadius: "16px", border: `1px solid ${themeConfig.border}`, bgcolor: themeConfig.bgCard || "#FFFFFF" }}>
        <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.85rem", mb: 1.25 }}>Rooms</Typography>
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" }, gap: 1 }}>
          {[
            { label: "Available", value: totalAvailable, color: "#10B981", icon: <CheckCircle sx={{ fontSize: 16, color: "#10B981" }} />, type: "AVAILABLE" },
            { label: "Occupied", value: totalOccupied, color: "#0B8EE0", icon: <HowToReg sx={{ fontSize: 16, color: "#0B8EE0" }} />, type: "OCCUPIED" },
            { label: "Cleaning", value: totalCleaning, color: "#D97706", icon: <CleaningServices sx={{ fontSize: 16, color: "#D97706" }} />, type: "CLEANING" },
            { label: "Blocked", value: totalMaintenance, color: "#EF4444", icon: <Build sx={{ fontSize: 16, color: "#EF4444" }} />, type: "MAINTENANCE" },
          ].map((item) => {
            const roomTotal = Math.max(inventoryTotals.total, 1);
            const percent = Math.min(100, Math.round((Number(item.value) || 0) / roomTotal * 100));
            return (
              <Box
                key={item.label}
                onClick={() => {
                  setTelemetrySearch("");
                  setTelemetryModal({ open: true, type: item.type });
                }}
                sx={{ minWidth: 0, p: 1.1, borderRadius: "12px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC", cursor: "pointer" }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 0.5, mb: 0.4 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, minWidth: 0 }}>
                    {item.icon}
                    <Typography noWrap sx={{ fontSize: "0.72rem", fontWeight: 800, color: themeConfig.textMuted }}>{item.label}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: "0.68rem", fontWeight: 800, color: item.color }}>{percent}%</Typography>
                </Box>
                <Typography noWrap sx={{ fontWeight: 800, fontSize: "0.95rem", color: themeConfig.textMain }}>{item.value}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={percent}
                  sx={{ mt: 0.7, height: 4, borderRadius: 3, bgcolor: themeConfig.tones.neutral.bg, "& .MuiLinearProgress-bar": { bgcolor: item.color, borderRadius: 3 } }}
                />
              </Box>
            );
          })}
        </Box>
      </Paper>

      {/* ========================================================================= */}
      {/* SECTION 3: ROOM CATEGORIES LIVE INVENTORY CARDS                           */}
      {/* ========================================================================= */}
      <Card
        className="card-3d"
        sx={{
          borderRadius: "22px",
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "none" : "0 10px 30px -5px rgba(32, 41, 35, 0.08), inset 0 1px 1px #FFFFFF",
          bgcolor: themeConfig.bgCard || (themeConfig.bgCard),
          background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #F9FBFC 100%)",
          mb: 4,
        }}
      >
        <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, flexWrap: "wrap", gap: 2 }}>
            <div>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5, fontSize: { xs: "1.15rem", sm: "1.45rem" }, lineHeight: 1.3 }}>
                Room categories
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
                bgcolor: themeConfig.bgCard || (themeConfig.bgCard),
                color: themeConfig.textMain,
                width: { xs: "100%", sm: "auto" },
                whiteSpace: "nowrap",
                "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
              }}
            >
              Open Rooms List ({inventoryTotals.total})
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
                  sm: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(auto-fit, minmax(310px, 1fr))",
                  xl: "repeat(3, 1fr)",
                },
                gap: { xs: 2, sm: 2.5 },
              }}
            >
              {categoryStats.map((cat) => {
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
                    key={cat._id || cat.id}
                    onClick={() => onNavigateTab && onNavigateTab(1, cat._id || cat.id || cat.name)}
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
                      minWidth: 0,
                      "&:hover": { borderColor: "#99D5C9", transform: "translateY(-2px)" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1, minWidth: 0 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, minWidth: 0 }}>
                          <MeetingRoom sx={{ fontSize: 18, flexShrink: 0, color: themeConfig.primary }} />
                          <Typography noWrap sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "1.05rem" }}>{cat.name}</Typography>
                        </Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mt: 0.5 }}>
                          <KingBed sx={{ fontSize: 14, color: themeConfig.textMuted }} />
                          <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 600 }}>
                            {cat.totalRooms} {cat.totalRooms === 1 ? "room" : "rooms"}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ flexShrink: 0, px: 1, py: 0.25, borderRadius: 999, fontSize: "0.65rem", fontWeight: 700, color: statePill.color, bgcolor: statePill.bg, border: `1px solid ${statePill.border}` }}>
                        {statePill.label}
                      </Box>
                    </Box>
                    <Box sx={{ display: "flex", height: 4, borderRadius: 999, overflow: "hidden", bgcolor: themeConfig.tones.neutral.bg }}>
                      {barTotal > 0 && statusBoxes.map((item) => (
                        item.value > 0 ? <Box key={item.label} sx={{ width: `${(item.value / barTotal) * 100}%`, bgcolor: item.color }} /> : null
                      ))}
                    </Box>
                    <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 1 }}>
                      {statusBoxes.map((item) => (
                        <Box key={item.label} sx={{ borderRadius: "12px", bgcolor: item.bg, border: `1px solid ${item.border}`, py: 1.1, px: 0.5, textAlign: "center", opacity: isEmptyCategory ? 0.55 : 1 }}>
                          <Typography sx={{ fontWeight: 700, color: item.color, fontSize: "0.95rem", lineHeight: 1 }}>{item.value}</Typography>
                          <Typography sx={{ color: item.color, fontSize: "0.62rem", fontWeight: 600, mt: 0.6 }}>{item.label}</Typography>
                        </Box>
                      ))}
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
      <TableCard>
        <TableToolbar>
          <TextField
            select
            size="small"
            value={recentFilter}
            onChange={(e) => { setRecentFilter(e.target.value); setGuestPage(0); }}
            sx={tableFieldSx(themeConfig, 220)}
          >
            <MenuItem value="ALL">All{recentFilter === "ALL" ? ` (${countAll})` : ""}</MenuItem>
            <MenuItem value="CHECK_IN">Check-in{recentFilter === "CHECK_IN" ? ` (${countAll})` : ""}</MenuItem>
            <MenuItem value="CHECK_OUT">Check-out{recentFilter === "CHECK_OUT" ? ` (${countAll})` : ""}</MenuItem>
          </TextField>
        </TableToolbar>

          <TableContainer sx={{ overflowX: "auto" }}>
            <Table size="medium" sx={{ minWidth: 980 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Guest Name</TableCell>
                  <TableCell>Assigned Room</TableCell>
                  <TableCell>Contact</TableCell>
                  <TableCell align="right">Total Amount</TableCell>
                  <TableCell align="right">Paid Amount</TableCell>
                  <TableCell align="right">Due Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeRecentBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 3.5, color: themeConfig.textMuted, fontWeight: 700 }}>
                      {recentFilter === "TODAY_ALL"
                        ? "No check-ins, check-outs, or active in-house guests for today."
                        : recentFilter === "TODAY_CHECKOUT"
                          ? "No guests scheduled for check-out today."
                          : recentFilter === "IN_HOUSE"
                            ? "No active in-house guests currently staying in the hotel."
                            : recentFilter === "TODAY_CHECKIN"
                              ? "No check-ins recorded for today."
                              : "No guest check-ins or folios found."}
                    </TableCell>
                  </TableRow>
                ) : (
                  activeRecentBookings.map((g) => (
                      <TableRow
                        key={g.id || g._id || g.name}
                        onClick={() => {
                          const resolvedId = g.id || g.bookingId || g._id || g.guestId || (typeof g.guest === "string" ? g.guest : g.guest?.id || g.guest?._id);
                          setSelectedGuestModal({
                            open: true,
                            guest: createSafeGuestModalData(g),
                            guestId: resolvedId,
                          });
                        }}
                        sx={{
                          cursor: "pointer",
                          "&:hover": { bgcolor: `${themeConfig.primaryGlow} !important` },
                        }}
                      >
                        <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                          <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                            <Avatar sx={{ width: 30, height: 30, fontSize: "0.75rem", fontWeight: 800, bgcolor: themeConfig.primary, color: themeConfig.onPrimary }}>
                              {(g.name || "G").charAt(0).toUpperCase()}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                {g.name}
                              </Typography>
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                                {/* {g.email} */}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <RoomNumberChips rooms={g.roomNumbers?.length ? g.roomNumbers : g.roomAssigned} />
                        </TableCell>
                        <TableCell sx={{ color: themeConfig.textMuted }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                            {g.phone}
                          </Typography>
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>
                          ₹{Number(g.totalAmount || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#10B981", whiteSpace: "nowrap" }}>
                          ₹{Number(g.paidAmount || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: Number(g.dueAmount || 0) > 0 ? "#DC2626" : "#10B981", whiteSpace: "nowrap" }}>
                          ₹{Number(g.dueAmount || 0).toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell>
                          <StatusChip status={g.status || "IN-HOUSE"} size="small" />
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75 }}>
                            <Tooltip title={billBusyId === String(g.id || g._id || "") ? "Preparing bill" : "Bill"}>
                              <span>
                                <IconButton
                                  size="small"
                                  aria-label="Bill"
                                  disabled={billBusyId === String(g.id || g._id || "")}
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const id = g.id || g._id || g.bookingId || g.booking_id;
                                    if (!id) return;
                                    try {
                                      setBillBusyId(String(id));
                                      const label = String(g.bookingNumber || g.booking_number || g.name || `bill-${id}`).replace(/\s+/g, "-");
                                      await downloadBookingBill(id, label);
                                      toast.show("Bill ready", "success");
                                    } catch (err) {
                                      toast.show(err?.message || "Could not generate the bill", "error");
                                    } finally {
                                      setBillBusyId("");
                                    }
                                  }}
                                  sx={{
                                    width: 34,
                                    height: 34,
                                    borderRadius: "50%",
                                    bgcolor: "rgba(2, 132, 199, 0.12)",
                                    color: "#0284C7",
                                    "&:hover": { bgcolor: "rgba(2, 132, 199, 0.2)" },
                                  }}
                                >
                                  <Print sx={{ fontSize: 16 }} />
                                </IconButton>
                              </span>
                            </Tooltip>
                            <FolioPdfButton booking={g} iconOnly />
                            {(g.status === "IN-HOUSE" || g.status === "CHECKED_IN") ? (
                            <Tooltip title="Check-Out">
                              <IconButton
                                size="small"
                                aria-label="Check-Out"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onRequestCheckout) onRequestCheckout(g);
                                  else handleOpenCheckoutModal(g);
                                }}
                                sx={{
                                  width: 34,
                                  height: 34,
                                  borderRadius: "50%",
                                  bgcolor: "rgba(239, 68, 68, 0.12)",
                                  color: "#EF4444",
                                  "&:hover": { bgcolor: "rgba(239, 68, 68, 0.2)" },
                                }}
                              >
                                <Logout sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          ) : null}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        {bookingsTotal > 0 && (
          <TablePager
            rowsPerPageOptions={[5, 10, 25]}
            count={bookingsTotal}
            rowsPerPage={guestRowsPerPage}
            page={guestPage}
            onPageChange={(e, newPage) => setGuestPage(newPage)}
            onRowsPerPageChange={(e) => {
              setGuestRowsPerPage(parseInt(e.target.value, 10));
              setGuestPage(0);
            }}
          />
        )}
      </TableCard>

      {/* Guest Details Modal */}
      <GuestDetailsModal
        open={selectedGuestModal.open}
        onClose={() => setSelectedGuestModal({ open: false, guest: null, guestId: null })}
        guestId={selectedGuestModal.guestId}
        guestData={selectedGuestModal.guest}
        hotelSettings={hotelSettings}
      />

      {/* ========================================================================= */}
      {/* SECTION 4: TELEMETRY 5 KPI DETAIL MODALS (AVAILABLE, OCCUPIED, CLEANING, etc.) */}
      {/* ========================================================================= */}
      {telemetryModal.open && (
        <Dialog
          open={telemetryModal.open}
          onClose={() => setTelemetryModal({ open: false, type: null })}
          maxWidth="lg"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: "22px",
                bgcolor: themeConfig.bgCard || (themeConfig.bgCard),
                border: `1.5px solid ${themeConfig.border}`,
                boxShadow: isDarkMode ? "0 20px 60px rgba(0,0,0,0.6)" : "0 20px 60px rgba(12,39,59,0.15)",
                overflow: "hidden",
                maxHeight: "90vh",
              },
            },
          }}
        >
          {/* Modal Header with Dynamic Context Title & Search */}
          <DialogTitle
            component="div"
            sx={{
              p: 2.5,
              bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "rgba(238, 245, 240, 0.7)",
              borderBottom: `1px solid ${themeConfig.border}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <Avatar
                sx={{
                  bgcolor:
                    telemetryModal.type === "AVAILABLE"
                      ? "#10B981"
                      : telemetryModal.type === "OCCUPIED"
                        ? "#0B8EE0"
                        : telemetryModal.type === "CLEANING"
                          ? "#D97706"
                          : telemetryModal.type === "MAINTENANCE"
                            ? "#EF4444"
                            : "#8E24AA",
                  color: "#FFFFFF",
                  width: 42,
                  height: 42,
                  borderRadius: "12px",
                }}
              >
                {telemetryModal.type === "AVAILABLE" && <CheckCircle sx={{ fontSize: 24 }} />}
                {telemetryModal.type === "OCCUPIED" && <HowToReg sx={{ fontSize: 24 }} />}
                {telemetryModal.type === "CLEANING" && <CleaningServices sx={{ fontSize: 24 }} />}
                {telemetryModal.type === "MAINTENANCE" && <Build sx={{ fontSize: 24 }} />}
                {(telemetryModal.type === "TOTAL_GUESTS" || telemetryModal.type === "IN_HOUSE_GUESTS") && <People sx={{ fontSize: 24 }} />}
              </Avatar>
              <Box>
                <Typography variant="h6" component="div" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                  {telemetryModal.type === "AVAILABLE" && `Available Vacant Rooms (${totalAvailable})`}
                  {telemetryModal.type === "OCCUPIED" && `Occupied & Booked Rooms (${totalOccupied})`}
                  {telemetryModal.type === "CLEANING" && `Housekeeping Queue (${totalCleaning})`}
                  {telemetryModal.type === "MAINTENANCE" && `Maintenance & Blocked Rooms (${totalMaintenance})`}
                  {(telemetryModal.type === "TOTAL_GUESTS" || telemetryModal.type === "IN_HOUSE_GUESTS") && `Total Guests Directory (${totalGuestsCount})`}
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  {telemetryModal.type === "AVAILABLE" && "Rooms clean, sanitized, and ready for instant check-in"}
                  {telemetryModal.type === "OCCUPIED" && "Active resident guest stays and room assignments"}
                  {telemetryModal.type === "CLEANING" && "Rooms requiring maid sanitation before being marked ready"}
                  {telemetryModal.type === "MAINTENANCE" && "Out of service rooms under repairs or maintenance"}
                  {(telemetryModal.type === "TOTAL_GUESTS" || telemetryModal.type === "IN_HOUSE_GUESTS") && "Comprehensive list of all registered, in-house, and previous guests in hotel database"}
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
              <TextField
                size="small"
                placeholder="Search Room / Guest..."
                value={telemetrySearch}
                onChange={(e) => setTelemetrySearch(e.target.value)}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: 18, color: themeConfig.textMuted }} />
                      </InputAdornment>
                    ),
                  },
                }}
                sx={{ width: { xs: "100%", sm: 240 }, "& .MuiOutlinedInput-root": { height: 40, borderRadius: "10px", bgcolor: themeConfig.bgMain } }}
              />
              <IconButton onClick={() => setTelemetryModal({ open: false, type: null })} size="small">
                <Close />
              </IconButton>
            </Box>
          </DialogTitle>

          {/* Modal Body Content */}
          <DialogContent sx={{ p: { xs: 1.5, sm: 2.5 }, overflowX: "auto" }}>
            {/* 1. AVAILABLE VACANT ROOMS */}
            {telemetryModal.type === "AVAILABLE" && (() => {
              const q = telemetrySearch.toLowerCase().trim();
              const availRooms = rooms
                .filter((r) => r.status === "AVAILABLE")
                .filter((r) => {
                  if (!q) return true;
                  const cat = (r.category || r.type || r.roomType?.name || "").toLowerCase();
                  return String(r.roomNumber).includes(q) || cat.includes(q);
                });

              return availRooms.length === 0 ? (
                <EmptyState
                  title="No Vacant Rooms Found"
                  description={telemetrySearch ? "No available rooms match your search query." : "All rooms are currently occupied or in housekeeping."}
                />
              ) : (
                <TableContainer sx={{ borderRadius: "14px", border: `1px solid ${themeConfig.border}`, overflowX: "auto", width: "100%" }}>
                  <Table size="medium" sx={{ minWidth: 680 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Room #</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Category / Type</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Floor</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Tariff / Night</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Status</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: "right", whiteSpace: "nowrap" }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {availRooms.map((r) => {
                        const cat = r.roomType?.name || r.category || r.type || "Standard Room";
                        const price = r.customPricePerNight || r.roomType?.basePrice || r.basePrice || 0;
                        return (
                          <TableRow
                            key={r._id}
                            hover
                            onClick={() => {
                              setTelemetryModal({ open: false, type: null });
                              if (onSelectRoomForCheckIn) {
                                onSelectRoomForCheckIn(r);
                              }
                            }}
                            sx={{ cursor: "pointer" }}
                          >
                            <TableCell sx={{ fontWeight: 900, color: themeConfig.accent, whiteSpace: "nowrap" }}>
                              <Chip
                                icon={<MeetingRoom sx={{ fontSize: "14px !important" }} />}
                                label={`Room ${r.roomNumber}`}
                                size="small"
                                sx={{ fontWeight: 800, bgcolor: themeConfig.champagne, color: themeConfig.accent, cursor: "pointer" }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain, whiteSpace: "nowrap" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                {getCategoryIcon(cat)}
                                {cat}
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: themeConfig.textMuted, whiteSpace: "nowrap" }}>
                              Floor {r.floor || 1}
                            </TableCell>
                            <TableCell sx={{ fontWeight: 800, color: "#10B981", whiteSpace: "nowrap" }}>
                              ₹{price.toLocaleString()} / night
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              <Chip label="Ready & Clean" size="small" color="success" sx={{ fontWeight: 800, fontSize: "0.7rem" }} />
                            </TableCell>
                            <TableCell sx={{ textAlign: "right", whiteSpace: "nowrap" }}>
                              <Button
                                variant="contained"
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setTelemetryModal({ open: false, type: null });
                                  if (onSelectRoomForCheckIn) {
                                    onSelectRoomForCheckIn(r);
                                  }
                                }}
                                sx={{
                                  borderRadius: "8px",
                                  fontWeight: 800,
                                  fontSize: "0.75rem",
                                  bgcolor: themeConfig.primary,
                                  "&:hover": { bgcolor: themeConfig.primaryDark },
                                }}
                              >
                                Express Check-In
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}

            {/* 2. OCCUPIED / BOOKED ROOMS */}
            {telemetryModal.type === "OCCUPIED" && (() => {
              const q = telemetrySearch.toLowerCase().trim();
              const occRooms = rooms
                .filter((r) => r.status === "OCCUPIED")
                .map((r) => {
                  const b = bookings.find(
                    (bk) =>
                      bk.status === "CHECKED_IN" &&
                      (String(bk.room?._id || bk.roomId || bk.room) === String(r._id) ||
                        (Array.isArray(bk.roomNumbers) && bk.roomNumbers.includes(String(r.roomNumber))) ||
                        String(bk.roomNumber) === String(r.roomNumber))
                  );
                  const g =
                    b?.guest ||
                    guests.find(
                      (gst) =>
                        (gst.roomAssigned && String(gst.roomAssigned).includes(String(r.roomNumber))) ||
                        String(gst.roomNumber) === String(r.roomNumber)
                    );
                  return { room: r, booking: b, guest: g };
                })
                .filter((item) => {
                  if (!q) return true;
                  const gName = (item.guest?.name || item.guest?.fullName || item.booking?.guestName || "").toLowerCase();
                  const gPhone = (item.guest?.phone || item.guest?.mobileNumber || item.booking?.guestPhone || "").toLowerCase();
                  return String(item.room.roomNumber).includes(q) || gName.includes(q) || gPhone.includes(q);
                });

              return occRooms.length === 0 ? (
                <EmptyState
                  title="No Occupied Rooms"
                  description={telemetrySearch ? "No booked rooms match your search query." : "There are currently no active room stays."}
                />
              ) : (
                <TableContainer sx={{ borderRadius: "14px", border: `1px solid ${themeConfig.border}`, overflowX: "auto", width: "100%" }}>
                  <Table size="medium" sx={{ minWidth: 780 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Room #</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Resident Guest</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Booking ID</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Stay Dates</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Folio Balance</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: "right", whiteSpace: "nowrap" }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {occRooms.map(({ room, booking, guest }) => {
                        const gName = guest?.name || guest?.fullName || booking?.guestName || "Resident Guest";
                        const gPhone = guest?.phone || guest?.mobileNumber || booking?.guestPhone || "";
                        const bRef = booking?.bookingNumber || "Active Stay";
                        const due = booking ? Math.max(0, (booking.totalAmount || 0) - (booking.paidAmount || 0)) : 0;
                        return (
                          <TableRow key={room._id} hover>
                            <TableCell sx={{ fontWeight: 900, color: themeConfig.accent, whiteSpace: "nowrap" }}>
                              <Chip
                                icon={<MeetingRoom sx={{ fontSize: "14px !important" }} />}
                                label={`Room ${room.roomNumber}`}
                                size="small"
                                sx={{ fontWeight: 800, bgcolor: themeConfig.champagne, color: themeConfig.accent }}
                              />
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Avatar sx={{ width: 30, height: 30, fontSize: "0.75rem", bgcolor: themeConfig.primary }}>
                                  {gName.charAt(0).toUpperCase()}
                                </Avatar>
                                <div>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                    {gName}
                                  </Typography>
                                  {gPhone && (
                                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "flex", alignItems: "center", gap: 0.3 }}>
                                      <Phone sx={{ fontSize: 11 }} /> {gPhone}
                                    </Typography>
                                  )}
                                </div>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, fontFamily: "monospace", color: themeConfig.primary, whiteSpace: "nowrap" }}>
                              #{bRef}
                            </TableCell>
                            <TableCell sx={{ fontSize: "0.8rem", color: themeConfig.textMuted, whiteSpace: "nowrap" }}>
                              <div>In: {booking?.checkInDate || "Today"}</div>
                              <div>Out: {booking?.checkOutDate || "Tomorrow"}</div>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {due > 0 ? (
                                <Chip label={`₹${due.toLocaleString()} Due`} size="small" color="error" sx={{ fontWeight: 800, fontSize: "0.7rem" }} />
                              ) : (
                                <Chip label="Settled" size="small" color="success" sx={{ fontWeight: 800, fontSize: "0.7rem" }} />
                              )}
                            </TableCell>
                            <TableCell sx={{ textAlign: "right", whiteSpace: "nowrap" }}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                                <Tooltip title="Send WhatsApp">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      sendCheckInWhatsApp({
                                        booking: booking || { guestName: gName, roomNumber: room.roomNumber },
                                        guest: guest || { name: gName, mobileNumber: gPhone },
                                        hotel: hotelSettings?.hotel || {},
                                        onShowToast: (msg, sev) => toast.show(msg, sev),
                                      });
                                    }}
                                    sx={{
                                      color: "#25D366",
                                      bgcolor: "rgba(37, 211, 102, 0.12)",
                                      borderRadius: "8px",
                                      "&:hover": { bgcolor: "#25D366", color: "#FFFFFF" },
                                    }}
                                  >
                                    <WhatsApp sx={{ fontSize: 16 }} />
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
              );
            })()}

            {/* 3. HOUSEKEEPING QUEUE */}
            {telemetryModal.type === "CLEANING" && (() => {
              const q = telemetrySearch.toLowerCase().trim();
              const cleaningRooms = rooms
                .filter((r) => r.status === "CLEANING")
                .filter((r) => {
                  if (!q) return true;
                  const cat = (r.category || r.type || r.roomType?.name || "").toLowerCase();
                  return String(r.roomNumber).includes(q) || cat.includes(q);
                });

              return cleaningRooms.length === 0 ? (
                <EmptyState
                  title="No Rooms in Cleaning"
                  description="All rooms are clean and available, or currently occupied by guests."
                />
              ) : (
                <TableContainer sx={{ borderRadius: "14px", border: `1px solid ${themeConfig.border}`, overflowX: "auto", width: "100%" }}>
                  <Table size="medium" sx={{ minWidth: 680 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Room #</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Floor</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Housekeeping Status</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: "right", whiteSpace: "nowrap" }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {cleaningRooms.map((r) => {
                        const cat = r.roomType?.name || r.category || r.type || "Standard Room";
                        const timerData = getCleaningTimerData(r);
                        const isDone = timerData?.isComplete;
                        return (
                          <TableRow key={r._id} hover>
                            <TableCell sx={{ fontWeight: 900, color: themeConfig.accent, whiteSpace: "nowrap" }}>
                              <Chip
                                icon={<CleaningServices sx={{ fontSize: "14px !important" }} />}
                                label={`Room ${r.roomNumber}`}
                                size="small"
                                sx={{ fontWeight: 800, bgcolor: "rgba(217, 119, 6, 0.12)", color: "#D97706" }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain, whiteSpace: "nowrap" }}>{cat}</TableCell>
                            <TableCell sx={{ color: themeConfig.textMuted, fontWeight: 700, whiteSpace: "nowrap" }}>Floor {r.floor || 1}</TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              <Chip
                                label={isDone ? "✨ Cleaning Done (100%)" : `🧹 ${timerData?.formatted || "12:00"} (${timerData?.progressPercent || 50}%)`}
                                size="small"
                                sx={{
                                  bgcolor: isDone ? "rgba(16, 185, 129, 0.15)" : "rgba(139, 92, 246, 0.15)",
                                  color: isDone ? "#10B981" : "#8B5CF6",
                                  fontWeight: 800,
                                  fontSize: "0.7rem",
                                }}
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: "right", whiteSpace: "nowrap" }}>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<CheckCircle />}
                                onClick={() => handleQuickRoomStatusChange(r, "AVAILABLE")}
                                sx={{
                                  borderRadius: "8px",
                                  fontWeight: 800,
                                  fontSize: "0.75rem",
                                  bgcolor: "#10B981",
                                  "&:hover": { bgcolor: "#059669" },
                                }}
                              >
                                {isDone ? "Set Available Now" : "Mark Clean & Ready"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}

            {/* 4. MAINTENANCE & BLOCKED */}
            {telemetryModal.type === "MAINTENANCE" && (() => {
              const q = telemetrySearch.toLowerCase().trim();
              const maintRooms = rooms
                .filter((r) => r.status === "MAINTENANCE" || r.status === "BLOCKED")
                .filter((r) => {
                  if (!q) return true;
                  const cat = (r.category || r.type || r.roomType?.name || "").toLowerCase();
                  return String(r.roomNumber).includes(q) || cat.includes(q);
                });

              return maintRooms.length === 0 ? (
                <EmptyState
                  title="No Rooms Under Maintenance"
                  description="All rooms are in working order and available for guest stays."
                />
              ) : (
                <TableContainer sx={{ borderRadius: "14px", border: `1px solid ${themeConfig.border}`, overflowX: "auto", width: "100%" }}>
                  <Table size="medium" sx={{ minWidth: 680 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Room #</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Category</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Floor</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Reason / Note</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: "right", whiteSpace: "nowrap" }}>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {maintRooms.map((r) => {
                        const cat = r.roomType?.name || r.category || r.type || "Standard Room";
                        return (
                          <TableRow key={r._id} hover>
                            <TableCell sx={{ fontWeight: 900, color: "#DC2626", whiteSpace: "nowrap" }}>
                              <Chip
                                icon={<Build sx={{ fontSize: "14px !important" }} />}
                                label={`Room ${r.roomNumber}`}
                                size="small"
                                sx={{ fontWeight: 800, bgcolor: "rgba(239, 68, 68, 0.12)", color: "#DC2626" }}
                              />
                            </TableCell>
                            <TableCell sx={{ fontWeight: 700, color: themeConfig.textMain, whiteSpace: "nowrap" }}>{cat}</TableCell>
                            <TableCell sx={{ color: themeConfig.textMuted, fontWeight: 700, whiteSpace: "nowrap" }}>Floor {r.floor || 1}</TableCell>
                            <TableCell sx={{ color: themeConfig.textMuted, fontSize: "0.8rem" }}>
                              {r.maintenanceNote || "Technical repairs / Painting"}
                            </TableCell>
                            <TableCell sx={{ textAlign: "right", whiteSpace: "nowrap" }}>
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<CheckCircle />}
                                onClick={() => handleQuickRoomStatusChange(r, "AVAILABLE")}
                                sx={{
                                  borderRadius: "8px",
                                  fontWeight: 800,
                                  fontSize: "0.75rem",
                                  bgcolor: themeConfig.primary,
                                  "&:hover": { bgcolor: themeConfig.primaryDark },
                                }}
                              >
                                Release to Available
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              );
            })()}

            {/* 5. TOTAL GUESTS DIRECTORY & IN-HOUSE GUESTS */}
            {(telemetryModal.type === "TOTAL_GUESTS" || telemetryModal.type === "IN_HOUSE_GUESTS") && (() => {
              const q = telemetrySearch.toLowerCase().trim();
              const displayList = (telemetryModal.type === "IN_HOUSE_GUESTS" ? inHouseGuestsList : totalGuestsList).filter((g) => {
                if (!q) return true;
                const name = (g.name || g.fullName || "").toLowerCase();
                const phone = (g.phone || g.mobileNumber || "").toLowerCase();
                const email = (g.email || "").toLowerCase();
                const room = String(g.roomAssigned || g.roomNumber || "").toLowerCase();
                const status = (g.status || "").toLowerCase();
                return name.includes(q) || phone.includes(q) || email.includes(q) || room.includes(q) || status.includes(q);
              });

              return displayList.length === 0 ? (
                <EmptyState
                  title="No Guests Found"
                  description={telemetrySearch ? "No guests match your search query." : "No registered guests found in the directory."}
                />
              ) : (
                <TableContainer
                  sx={{
                    borderRadius: "14px",
                    border: `1px solid ${themeConfig.border}`,
                    overflowX: "auto",
                    width: "100%",
                    "&::-webkit-scrollbar": { height: 8 },
                    "&::-webkit-scrollbar-thumb": { bgcolor: "rgba(142, 36, 170, 0.3)", borderRadius: 4 },
                  }}
                >
                  <Table size="medium" sx={{ minWidth: 840 }}>
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Guest Profile</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Room / Stay</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Stay Status</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Visits / Co-Guests</TableCell>
                        <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>ID Proof</TableCell>
                        <TableCell sx={{ fontWeight: 800, textAlign: "right", whiteSpace: "nowrap", minWidth: 150 }}>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {displayList.map((g, idx) => {
                        const name = g.name || g.fullName || "Guest";
                        const phone = g.phone || g.mobileNumber || "N/A";
                        const room = g.roomAssigned || g.roomNumber || "Not Assigned";
                        const coGuestsCount = Array.isArray(g.accompanyingGuests) ? g.accompanyingGuests.length : 0;
                        const status = (g.status || "REGISTERED").toUpperCase();

                        return (
                          <TableRow
                            key={g._id || idx}
                            hover
                            sx={{
                              transition: "background 0.2s ease",
                              "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(142, 36, 170, 0.04)" },
                            }}
                          >
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                                <Avatar sx={{ width: 34, height: 34, fontSize: "0.82rem", bgcolor: "#8E24AA", color: "#FFFFFF", fontWeight: 800 }}>
                                  {name.charAt(0).toUpperCase()}
                                </Avatar>
                                <div>
                                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                                    {name}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "flex", alignItems: "center", gap: 0.3 }}>
                                    <Phone sx={{ fontSize: 11 }} /> {phone}
                                  </Typography>
                                </div>
                              </Box>
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {room && room !== "Not Assigned" && room !== "N/A" ? (
                                <RoomNumberChips rooms={g.roomNumbers?.length ? g.roomNumbers : room} />
                              ) : (
                                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                                  Not Checked-In
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              <StatusChip status={status} size="small" />
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {coGuestsCount > 0 ? (
                                <Chip
                                  label={`${1 + coGuestsCount} Guests (+${coGuestsCount} Co-Guests)`}
                                  size="small"
                                  sx={{ fontWeight: 800, fontSize: "0.7rem", bgcolor: "rgba(142, 36, 170, 0.12)", color: "#8E24AA" }}
                                />
                              ) : (
                                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                                  {g.totalVisits ? `${g.totalVisits} Stay${g.totalVisits === 1 ? "" : "s"}` : "1 Stay"}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              <Chip
                                label={`${g.idProofType || "AADHAAR"}: ${g.idProofNumber || "Verified"}`}
                                size="small"
                                variant="outlined"
                                sx={{ fontWeight: 700, fontSize: "0.7rem", borderColor: themeConfig.border }}
                              />
                            </TableCell>
                            <TableCell sx={{ textAlign: "right", whiteSpace: "nowrap" }} onClick={(e) => e.stopPropagation()}>
                              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                                <Tooltip title="Send WhatsApp">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      sendCheckInWhatsApp({
                                        booking: g.booking || { guestName: name, roomNumber: room },
                                        guest: g.guest || g,
                                        hotel: hotelSettings?.hotel || {},
                                        onShowToast: (msg, sev) => toast.show(msg, sev),
                                      });
                                    }}
                                    sx={{
                                      color: "#25D366",
                                      bgcolor: "rgba(37, 211, 102, 0.12)",
                                      borderRadius: "8px",
                                      "&:hover": { bgcolor: "#25D366", color: "#FFFFFF" },
                                    }}
                                  >
                                    <WhatsApp sx={{ fontSize: 16 }} />
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
              );
            })()}
          </DialogContent>

          <DialogActions sx={{ p: 2, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC", borderTop: `1px solid ${themeConfig.border}` }}>
            <Button
              onClick={() => setTelemetryModal({ open: false, type: null })}
              variant="contained"
              sx={{ borderRadius: "10px", fontWeight: 800, bgcolor: themeConfig.primary, width: { xs: "100%", sm: "auto" } }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Check-out */}
      <CheckoutDialog
        open={Boolean(checkoutItem)}
        booking={checkoutItem ? checkoutItem.booking || checkoutItem : null}
        roomNumber={checkoutItem?.roomAssigned || ""}
        hotelSettings={hotelSettings}
        onClose={() => setCheckoutItem(null)}
        onCheckOut={onCheckOut}
        onDone={() => {
          setCheckoutItem(null);
          setBookingsTick((t) => t + 1);
          setRoomTypesTick((t) => t + 1);
          setRoomsTick((t) => t + 1);
          setSummaryTick((t) => t + 1);
        }}
      />
    </Box>
  );
}

