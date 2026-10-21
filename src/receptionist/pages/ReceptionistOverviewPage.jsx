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
  Divider,
  InputAdornment,
  MenuItem,
} from "@mui/material";
import { toast } from "@/shared/utils/toast";
import { folioMoney, loadBookingDetail } from "@/shared/utils/folioMoney";
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
  Close,
  Visibility,
  Phone,
  WhatsApp,
  CurrencyRupee,
  Search,
  Logout,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import StatCard from "@/shared/components/StatCard";
import dynamic from "next/dynamic";
import { formatTime12Hour, getTurnaroundWindow } from "@/shared/utils/timeUtils";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { sendCheckInWhatsApp, sendCheckoutBillWhatsApp } from "@/shared/utils/whatsappUtils";
import { createSafeGuestModalData } from "@/shared/utils/guestModalUtils";
import GuestDetailsModal from "@/shared/components/GuestDetailsModal";

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
  onCheckOut,
  onRequestCheckout,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();

  // Real-Time Socket Auto-Sync
  useSocket(
    [
      "ROOM_UPDATED",
      "BOOKING_CREATED",
      "BOOKING_UPDATED",
      "GUEST_CHECKED_OUT",
      "PAYMENT_RECORDED",
      "GUEST_UPDATED",
      "DASHBOARD_SYNC",
    ],
    () => {
      if (onRefresh) onRefresh();
    }
  );

  // Pagination for Recent Check-Ins Table
  const [guestPage, setGuestPage] = useState(0);
  const [guestRowsPerPage, setGuestRowsPerPage] = useState(5);
  // Filter for Recent Front Desk Table: "TODAY_ALL" (Default: In & Out) | "TODAY_CHECKIN" | "TODAY_CHECKOUT" | "IN_HOUSE" | "ALL"
  const [recentFilter, setRecentFilter] = useState("TODAY_ALL");

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

  // Quick Check-Out Modal State
  const [checkoutModal, setCheckoutModal] = useState({
    open: false,
    item: null,
    paymentMethod: "CASH",
    settlementAmount: 0,
    isSubmitting: false,
  });

  const handleOpenCheckoutModal = async (item) => {
    const seed = folioMoney(item.booking || item);
    setCheckoutModal({
      open: true,
      item: {
        ...item,
        totalAmount: seed.total,
        paidAmount: seed.paid,
        dueAmount: seed.due,
      },
      paymentMethod: seed.due > 0 ? "UPI" : "CASH",
      settlementAmount: seed.due,
      isSubmitting: false,
    });
    try {
      const source = await loadBookingDetail(item.booking || item);
      const money = folioMoney(source);
      setCheckoutModal((prev) => ({
        ...prev,
        open: true,
        item: {
          ...item,
          booking: source,
          totalAmount: money.total,
          paidAmount: money.paid,
          dueAmount: money.due,
        },
        paymentMethod: money.due > 0 ? "UPI" : "CASH",
        settlementAmount: money.due,
      }));
    } catch (err) {
      toast.error(err?.message || "Could not load booking amount");
    }
  };

  const handleConfirmCheckoutModal = async () => {
    if (!checkoutModal.item) return;
    const item = checkoutModal.item;
    const bookingId = item.booking?._id || item.booking?.id || item._id;
    const rawTotal = Number(item.totalAmount ?? item.total_amount ?? item.booking?.totalAmount ?? item.booking?.total_amount ?? 0);
    const rawPaid = Number(item.paidAmount ?? item.paid_amount ?? item.booking?.paidAmount ?? item.booking?.paid_amount ?? 0);
    const itemDue = Number(item.dueAmount ?? item.due_amount ?? item.booking?.dueAmount ?? item.booking?.due_amount ?? Math.max(0, rawTotal - rawPaid));
    const settleAmt = checkoutModal.settlementAmount !== undefined && checkoutModal.settlementAmount !== ""
      ? Number(checkoutModal.settlementAmount)
      : itemDue;
    const finalAmount = (!settleAmt && itemDue > 0) ? itemDue : settleAmt;

    setCheckoutModal((prev) => ({ ...prev, isSubmitting: true }));
    try {
      if (onCheckOut) {
        await onCheckOut(item.booking || item, {
          paymentMethod: checkoutModal.paymentMethod,
          settlementPaymentAmount: finalAmount,
        });
      } else {
        await apiRequest(API_ENDPOINTS.RECEPTIONIST.CHECKOUT(bookingId), {
          method: "POST",
          body: {
            paid_amount: finalAmount,
            due_amount: itemDue,
            settlement_payment_amount: finalAmount,
            notes: `Checked out via ${checkoutModal.paymentMethod}`,
          },
        });
        toast.success("Guest checked out successfully! Room marked for cleaning.");
        if (onRefresh) await onRefresh();
      }
      setCheckoutModal({ open: false, item: null, paymentMethod: "CASH", settlementAmount: 0, isSubmitting: false });
    } catch (err) {
      toast.error(err.message || "Failed to check out guest");
      setCheckoutModal((prev) => ({ ...prev, isSubmitting: false }));
    }
  };

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
      if (onRefresh) await onRefresh();
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

  const liveCurrentTimeFormatted = liveCurrentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

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

  // Overall Global Counts
  const totalOccupied = rooms.filter((r) => r.status === "OCCUPIED").length;
  const totalAvailable = rooms.filter((r) => r.status === "AVAILABLE").length;
  const totalCleaning = rooms.filter((r) => r.status === "CLEANING").length;
  const totalMaintenance = rooms.filter((r) => r.status === "MAINTENANCE" || r.status === "BLOCKED").length;

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
          name: gObj.fullName || gObj.name || b.guestName || b.primary_guest_name || "Guest",
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
          accompanyingGuests: b.accompanyingGuests || gObj.accompanyingGuests || [],
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

  // Grouped Categories with Live Counts
  const categoryStats = useMemo(() => {
    const catMap = new Map();

    (roomTypes || []).forEach((rt) => {
      const id = String(rt._id || rt.id || "");
      if (!id) return;
      catMap.set(id, {
        _id: id,
        id: id,
        name: rt.name,
        description: rt.description || "",
        basePrice: rt.basePrice || rt.price || 0,
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

    (rooms || []).forEach((r) => {
      const rtObj = typeof r.roomType === "object" ? r.roomType : (typeof r.room_type === "object" ? r.room_type : null);
      const rtId = String(
        rtObj?._id || rtObj?.id || r.roomTypeId || r.room_type_id || r.roomType || r.room_type || ""
      );
      const rtName = rtObj?.name || r.roomTypeName || r.room_type_name || r.type || "Standard Room";

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

    catMap.forEach((cat) => {
      cat.rooms.sort((a, b) => {
        const numA = parseInt(a.roomNumber || a.room_number, 10) || 0;
        const numB = parseInt(b.roomNumber || b.room_number, 10) || 0;
        return numA - numB;
      });
    });

    // Only return categories that have rooms allotted (totalRooms > 0)
    return Array.from(catMap.values()).filter((cat) => cat.totalRooms > 0);
  }, [rooms, roomTypes]);

  const inTimeFormatted = formatTime12Hour(hotelSettings?.checkInTime || "14:00");
  const outTimeFormatted = formatTime12Hour(hotelSettings?.checkOutTime || "12:00");
  const timezoneStr = hotelSettings?.timezone || "Asia/Kolkata";
  const turnaroundStr = getTurnaroundWindow(hotelSettings?.checkInTime, hotelSettings?.checkOutTime);

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
        : (rawBStatus === "CHECKED_OUT" || rawBStatus === "COMPLETED")
          ? "DEPARTED"
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
        name: g?.fullName || g?.name || b.guestName || b.primary_guest_name || b.guest_name || b.primaryGuestName || "Resident Guest",
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

  // Active bookings filtered by selected mode ("TODAY_ALL" | "TODAY_CHECKIN" | "TODAY_CHECKOUT" | "IN_HOUSE" | "ALL")
  const activeRecentBookings = useMemo(() => {
    if (recentFilter === "TODAY_ALL") {
      const todayFromBookings = allFormattedBookings.filter((b) => {
        return (
          isTodayDate(b.checkInDateRaw) ||
          isTodayDate(b.checkInDate) ||
          isTodayDate(b.checkOutDateRaw) ||
          isTodayDate(b.checkOutDate) ||
          b.status === "IN-HOUSE" ||
          b.rawStatus === "CHECKED_IN"
        );
      });
      const seenBookingIds = new Set(todayFromBookings.map((b) => String(b.id || b._id)));

      const extraTodayGuests = (inHouseGuestsList || [])
        .filter(
          (g) => !seenBookingIds.has(String(g.id || g._id || g.booking?.id || g.booking?._id))
        )
        .map((g) => {
          const cleanB = (g.booking && g.booking !== g) ? { ...g.booking } : null;
          if (cleanB) { delete cleanB.guest; delete cleanB.booking; delete cleanB.activeBooking; }
          const cleanG = (g.guest && g.guest !== g) ? { ...g.guest } : null;
          if (cleanG) { delete cleanG.guest; delete cleanG.booking; delete cleanG.activeBooking; }
          const realId = g.id || g._id || cleanB?.id || cleanB?._id;
          const bNum = g.booking_number || g.bookingNumber || cleanB?.booking_number || cleanB?.bookingNumber;
          const rawIn = g.actual_check_in || g.actualCheckIn || g.check_in_date || g.checkInDate || g.checkInDateRaw || "";
          const rawOut = g.actual_check_out || g.actualCheckOut || g.check_out_date || g.checkOutDate || g.checkOutDateRaw || "";
          return {
            _id: realId,
            id: realId,
            bookingId: realId,
            booking_number: bNum,
            bookingNumber: bNum,
            ...(cleanB || {}),
            ...g,
            booking: cleanB,
            activeBooking: cleanB,
            guest: cleanG,
            guestId: realId,
            name: g.name || g.fullName || cleanB?.primary_guest_name || "Guest",
            email: g.email || "",
            phone: g.phone || g.mobileNumber || cleanB?.mobile_number || "N/A",
            roomAssigned: g.roomAssigned || "101",
            roomNumbers: [g.roomAssigned || "101"],
            checkInDateRaw: rawIn,
            checkInDate: rawIn ? apiDateLabel(rawIn) : "—",
            checkOutDateRaw: rawOut,
            checkOutDate: rawOut ? apiDateLabel(rawOut) : "—",
            totalAmount: Number(g.totalAmount ?? g.total_amount ?? cleanB?.totalAmount ?? cleanB?.total_amount ?? 0),
            paidAmount: Number(g.paidAmount ?? g.paid_amount ?? cleanB?.paidAmount ?? cleanB?.paid_amount ?? 0),
            baseAmount: Number(g.baseAmount ?? g.base_amount ?? cleanB?.baseAmount ?? cleanB?.base_amount ?? 0),
            gstAmount: Number(g.gstAmount ?? g.gst_amount ?? cleanB?.gstAmount ?? cleanB?.gst_amount ?? 0),
            pricePerNight: Number(g.pricePerNight ?? g.price_per_night ?? cleanB?.pricePerNight ?? cleanB?.price ?? 0),
            numberOfNights: Number(g.numberOfNights ?? g.nights ?? cleanB?.numberOfNights ?? cleanB?.nights ?? 1),
            roomType: g.roomType || cleanB?.roomType || cleanB?.roomTypeName || "Standard Room",
            dueAmount: Number(g.dueAmount ?? g.due_amount ?? cleanB?.dueAmount ?? cleanB?.due_amount ?? Math.max(0, Number(g.totalAmount ?? cleanB?.totalAmount ?? 0) - Number(g.paidAmount ?? cleanB?.paidAmount ?? 0))),
            status: "IN-HOUSE",
            rawStatus: "CHECKED_IN",
          };
        });

      return [...todayFromBookings, ...extraTodayGuests];
    }

    if (recentFilter === "IN_HOUSE") {
      const inHouseFromBookings = allFormattedBookings.filter(
        (b) => b.status === "IN-HOUSE" || b.rawStatus === "CHECKED_IN"
      );
      const seenBookingIds = new Set(inHouseFromBookings.map((b) => String(b.id || b._id)));

      const extraInHouse = (inHouseGuestsList || [])
        .filter((g) => !seenBookingIds.has(String(g.id || g._id || g.booking?.id || g.booking?._id || "")))
        .map((g) => {
          const cleanB = (g.booking && g.booking !== g) ? { ...g.booking } : null;
          if (cleanB) { delete cleanB.guest; delete cleanB.booking; delete cleanB.activeBooking; }
          const cleanG = (g.guest && g.guest !== g) ? { ...g.guest } : null;
          if (cleanG) { delete cleanG.guest; delete cleanG.booking; delete cleanG.activeBooking; }
          const rawIn = g.actual_check_in || g.actualCheckIn || g.check_in_date || g.checkInDate || g.checkInDateRaw || "";
          const rawOut = g.actual_check_out || g.actualCheckOut || g.check_out_date || g.checkOutDate || g.checkOutDateRaw || "";
          return {
            _id: g._id,
            ...(cleanB || {}),
            ...g,
            booking: cleanB,
            activeBooking: cleanB,
            guest: cleanG,
            guestId: g._id,
            name: g.name || g.fullName || cleanB?.primary_guest_name || "Guest",
            email: g.email || "",
            phone: g.phone || g.mobileNumber || cleanB?.mobile_number || "N/A",
            roomAssigned: g.roomAssigned || "101",
            roomNumbers: [g.roomAssigned || "101"],
            checkInDateRaw: rawIn,
            checkInDate: rawIn ? apiDateLabel(rawIn) : "—",
            checkOutDateRaw: rawOut,
            checkOutDate: rawOut ? apiDateLabel(rawOut) : "—",
            totalAmount: Number(g.totalAmount ?? g.total_amount ?? cleanB?.totalAmount ?? cleanB?.total_amount ?? 0),
            paidAmount: Number(g.paidAmount ?? g.paid_amount ?? cleanB?.paidAmount ?? cleanB?.paid_amount ?? 0),
            baseAmount: Number(g.baseAmount ?? g.base_amount ?? cleanB?.baseAmount ?? cleanB?.base_amount ?? 0),
            gstAmount: Number(g.gstAmount ?? g.gst_amount ?? cleanB?.gstAmount ?? cleanB?.gst_amount ?? 0),
            pricePerNight: Number(g.pricePerNight ?? g.price_per_night ?? cleanB?.pricePerNight ?? cleanB?.price ?? 0),
            numberOfNights: Number(g.numberOfNights ?? g.nights ?? cleanB?.numberOfNights ?? cleanB?.nights ?? 1),
            roomType: g.roomType || cleanB?.roomType || cleanB?.roomTypeName || "Standard Room",
            dueAmount: Number(g.dueAmount ?? g.due_amount ?? cleanB?.dueAmount ?? cleanB?.due_amount ?? Math.max(0, Number(g.totalAmount ?? cleanB?.totalAmount ?? 0) - Number(g.paidAmount ?? cleanB?.paidAmount ?? 0))),
            status: "IN-HOUSE",
            rawStatus: "CHECKED_IN",
          };
        });

      return [...inHouseFromBookings, ...extraInHouse];
    }

    if (recentFilter === "TODAY_CHECKIN") {
      return allFormattedBookings.filter((b) => isTodayDate(b.checkInDateRaw) || isTodayDate(b.checkInDate));
    }

    // "ALL"
    return allFormattedBookings;
  }, [allFormattedBookings, inHouseGuestsList, recentFilter]);

  const countTodayAll = useMemo(() => {
    const fromBookings = allFormattedBookings.filter(
      (b) =>
        isTodayDate(b.checkInDateRaw) ||
        isTodayDate(b.checkInDate) ||
        isTodayDate(b.checkOutDateRaw) ||
        isTodayDate(b.checkOutDate) ||
        b.status === "IN-HOUSE" ||
        b.rawStatus === "CHECKED_IN"
    );
    const seenBookingIds = new Set(fromBookings.map((b) => String(b._id)));
    const extraTodayGuests = (inHouseGuestsList || []).filter(
      (g) => !seenBookingIds.has(String(g.booking?._id || g._id))
    );
    return fromBookings.length + extraTodayGuests.length;
  }, [allFormattedBookings, inHouseGuestsList]);

  const countTodayCheckout = useMemo(() => {
    const fromBookings = allFormattedBookings.filter(
      (b) => isTodayDate(b.checkOutDateRaw) || isTodayDate(b.checkOutDate)
    ).length;
    const fromGuests = (inHouseGuestsList || []).filter(
      (g) => isTodayDate(g.checkOutDate) || isTodayDate(g.guest?.checkOutDate)
    ).length;
    return Math.max(fromBookings, fromGuests);
  }, [allFormattedBookings, inHouseGuestsList]);

  const countInHouse = useMemo(() => {
    const fromBookings = allFormattedBookings.filter(
      (b) => b.status === "IN-HOUSE" || b.rawStatus === "CHECKED_IN"
    );
    const seen = new Set(fromBookings.map((b) => String(b.id || b._id)));
    const extra = (inHouseGuestsList || []).filter((g) => {
      const gid = String(g.id || g._id || g.booking?.id || g.booking?._id || "");
      return gid && !seen.has(gid);
    });
    return fromBookings.length + extra.length;
  }, [allFormattedBookings, inHouseGuestsList]);

  const countTodayCheckIn = useMemo(() => {
    return allFormattedBookings.filter((b) => isTodayDate(b.checkInDateRaw) || isTodayDate(b.checkInDate)).length;
  }, [allFormattedBookings]);

  const countAll = allFormattedBookings.length;

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 } }}>
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
            <Typography variant="h4" sx={{ fontWeight: 900, letterSpacing: -0.8, color: "#FFFFFF", lineHeight: 1.2, fontSize: { xs: "1.5rem", sm: "2.1rem" } }}>
              Front Desk & Room Inventory
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.85)", mt: 0.5, maxWidth: "600px", fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
              Live room inventory, category tracker, operational timings, and 1-click express check-in.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", gap: 1.2, flexWrap: "wrap", alignItems: "center", width: { xs: "100%", sm: "auto" } }}>
            <Button
              variant="contained"
              startIcon={<Bolt />}
              onClick={() => onNavigateTab && onNavigateTab(2)}
              className="btn-3d"
              sx={{
                background: "linear-gradient(135deg, #FFFFFF 0%, #E6EFF8 100%)",
                color: themeConfig.primaryDark,
                fontWeight: 900,
                borderRadius: "14px",
                px: 2.8,
                py: 1.2,
                fontSize: "0.88rem",
                width: { xs: "100%", sm: "auto" },
                whiteSpace: "nowrap",
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
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, whiteSpace: "nowrap" }}>
            <AccessTime sx={{ fontSize: 16, color: "rgba(255,255,255,0.9)" }} />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.95)", fontWeight: 700 }}>
              Check-In Opens: <strong>{inTimeFormatted}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, whiteSpace: "nowrap" }}>
            <Schedule sx={{ fontSize: 16, color: "rgba(255,255,255,0.9)" }} />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.95)", fontWeight: 700 }}>
              Check-Out Deadline: <strong>{outTimeFormatted}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, whiteSpace: "nowrap" }}>
            <AccessTime sx={{ fontSize: 16, color: "rgba(255,255,255,0.9)" }} />
            <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.95)", fontWeight: 700 }}>
              Current Time: <strong>{liveCurrentTimeFormatted}</strong>
            </Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, whiteSpace: "nowrap" }}>
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
            lg: "repeat(auto-fit, minmax(210px, 1fr))",
            xl: "repeat(5, 1fr)",
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
          onClick={() => {
            setTelemetrySearch("");
            setTelemetryModal({ open: true, type: "AVAILABLE" });
          }}
        />

        <StatCard
          title="Occupied / Booked"
          value={totalOccupied}
          subtitle="Active guest stay"
          icon={<HowToReg />}
          color="#0B8EE0"
          badgeText="In-House"
          onClick={() => {
            setTelemetrySearch("");
            setTelemetryModal({ open: true, type: "OCCUPIED" });
          }}
        />

        <StatCard
          title="Housekeeping Queue"
          value={totalCleaning}
          subtitle="Sanitation in progress"
          icon={<CleaningServices />}
          color="#D97706"
          badgeText="Cleaning"
          onClick={() => {
            setTelemetrySearch("");
            setTelemetryModal({ open: true, type: "CLEANING" });
          }}
        />

        <StatCard
          title="Maintenance / Blocked"
          value={totalMaintenance}
          subtitle="Out of service repairs"
          icon={<Build />}
          color="#EF4444"
          badgeText={totalMaintenance > 0 ? "Under Fix" : "All Clear"}
          onClick={() => {
            setTelemetrySearch("");
            setTelemetryModal({ open: true, type: "MAINTENANCE" });
          }}
        />

        <StatCard
          title="Total Guests"
          value={totalGuestsCount}
          subtitle={`${inHouseGuestsCount} In-House • ${totalGuestsCount} Registered`}
          icon={<People />}
          color="#8E24AA"
          badgeText={totalGuestsCount > 0 ? `${totalGuestsCount} Guests` : "Guests"}
          onClick={() => {
            setTelemetrySearch("");
            setTelemetryModal({ open: true, type: "TOTAL_GUESTS" });
          }}
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
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5, fontSize: { xs: "1.15rem", sm: "1.45rem" }, lineHeight: 1.3 }}>
                🏨 Room Categories & Live Inventory
              </Typography>
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontSize: { xs: "0.78rem", sm: "0.85rem" }, mt: 0.3 }}>
                Live vacant/booked telemetry and room inventory status across all categories.
              </Typography>
            </div>

            <Button
              variant="outlined"
              endIcon={<ArrowForward />}
              onClick={() => onNavigateTab && onNavigateTab(2)}
              sx={{
                borderRadius: "12px",
                fontWeight: 800,
                fontSize: "0.82rem",
                borderColor: themeConfig.border,
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                color: themeConfig.textMain,
                width: { xs: "100%", sm: "auto" },
                whiteSpace: "nowrap",
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
                  sm: "1fr",
                  md: "repeat(2, 1fr)",
                  lg: "repeat(auto-fit, minmax(310px, 1fr))",
                  xl: "repeat(3, 1fr)",
                },
                gap: { xs: 2, sm: 2.5 },
              }}
            >
              {categoryStats.map((cat) => {
                const hasAvailable = cat.available > 0;
                const isAllBooked = cat.available === 0 && cat.totalRooms > 0;
                return (
                  <Card
                    key={cat._id || cat.id}
                    className="card-3d"
                    onClick={() => onNavigateTab && onNavigateTab(2, cat._id || cat.id || cat.name)}
                    sx={{
                      p: { xs: 2, sm: 2.2, md: 2.5 },
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
                      {/* Top Row: Avatar + Category Name on left, Price on right */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 1.2, mb: 1.2 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
                          <Avatar
                            sx={{
                              bgcolor: themeConfig.champagne,
                              color: themeConfig.primaryDark,
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
                <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: { xs: "0.95rem", sm: "1.05rem" }, lineHeight: 1.3 }}>
                  Recent Front Desk Check-Ins & In-House Folios
                </Typography>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: { xs: "0.75rem", sm: "0.8rem" } }}>
                  Live guest registry, allocated room numbers & stay status
                </Typography>
              </div>
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, flexWrap: "wrap", width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "flex-start", sm: "flex-end" } }}>
              {/* Quick Filter Pill Group */}
              <Box
                sx={{
                  display: "inline-flex",
                  p: 0.5,
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                  borderRadius: "12px",
                  border: `1px solid ${themeConfig.border}`,
                  gap: 0.5,
                }}
              >
                <Button
                  size="small"
                  onClick={() => {
                    setRecentFilter("TODAY_ALL");
                    setGuestPage(0);
                  }}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    borderRadius: "9px",
                    px: 1.4,
                    py: 0.35,
                    textTransform: "none",
                    bgcolor: recentFilter === "TODAY_ALL" ? `${themeConfig.primary} !important` : "transparent",
                    color: recentFilter === "TODAY_ALL" ? "#FFFFFF !important" : themeConfig.textMuted,
                    boxShadow: recentFilter === "TODAY_ALL" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                    "&:hover": { bgcolor: recentFilter === "TODAY_ALL" ? themeConfig.primary : "rgba(0,0,0,0.04)" },
                  }}
                >
                  Today & In-House ({countTodayAll})
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setRecentFilter("IN_HOUSE");
                    setGuestPage(0);
                  }}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    borderRadius: "9px",
                    px: 1.4,
                    py: 0.35,
                    textTransform: "none",
                    bgcolor: recentFilter === "IN_HOUSE" ? `${themeConfig.primary} !important` : "transparent",
                    color: recentFilter === "IN_HOUSE" ? "#FFFFFF !important" : themeConfig.textMuted,
                    boxShadow: recentFilter === "IN_HOUSE" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                    "&:hover": { bgcolor: recentFilter === "IN_HOUSE" ? themeConfig.primary : "rgba(0,0,0,0.04)" },
                  }}
                >
                  Active In-House ({countInHouse})
                </Button>
                <Button
                  size="small"
                  onClick={() => {
                    setRecentFilter("ALL");
                    setGuestPage(0);
                  }}
                  sx={{
                    fontWeight: 800,
                    fontSize: "0.75rem",
                    borderRadius: "9px",
                    px: 1.4,
                    py: 0.35,
                    textTransform: "none",
                    bgcolor: recentFilter === "ALL" ? `${themeConfig.primary} !important` : "transparent",
                    color: recentFilter === "ALL" ? "#FFFFFF !important" : themeConfig.textMuted,
                    boxShadow: recentFilter === "ALL" ? "0 2px 8px rgba(0,0,0,0.15)" : "none",
                    "&:hover": { bgcolor: recentFilter === "ALL" ? themeConfig.primary : "rgba(0,0,0,0.04)" },
                  }}
                >
                  All ({countAll})
                </Button>
              </Box>

              <Button
                size="small"
                endIcon={<ArrowForward fontSize="small" />}
                onClick={() => onNavigateTab && onNavigateTab(3)}
                sx={{
                  fontWeight: 800,
                  fontSize: "0.8rem",
                  borderRadius: "10px",
                  color: themeConfig.primaryDark,
                  width: { xs: "100%", sm: "auto" },
                  whiteSpace: "nowrap",
                  "&:hover": { bgcolor: themeConfig.champagne },
                }}
              >
                View In-House Folios
              </Button>
            </Box>
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
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.2, whiteSpace: "nowrap" }}>Guest Name</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Assigned Room</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Contact</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeRecentBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3.5, color: themeConfig.textMuted, fontWeight: 700 }}>
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
                  activeRecentBookings
                    .slice(guestPage * guestRowsPerPage, guestPage * guestRowsPerPage + guestRowsPerPage)
                    .map((g) => (
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
                            <Avatar sx={{ width: 30, height: 30, fontSize: "0.75rem", fontWeight: 800, bgcolor: themeConfig.primary, color: "#FFFFFF" }}>
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
                        <TableCell>
                          <StatusChip status={g.status || "IN-HOUSE"} size="small" />
                        </TableCell>
                        <TableCell align="center" onClick={(e) => e.stopPropagation()}>
                          {(g.status === "IN-HOUSE" || g.status === "CHECKED_IN") ? (
                            <Button
                              variant="contained"
                              color="error"
                              size="small"
                              startIcon={<Logout sx={{ fontSize: 15 }} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onRequestCheckout) onRequestCheckout(g);
                                else handleOpenCheckoutModal(g);
                              }}
                              sx={{
                                fontWeight: 800,
                                fontSize: "0.78rem",
                                borderRadius: "8px",
                                textTransform: "none",
                                bgcolor: "#EF4444",
                                color: "#FFFFFF",
                                minWidth: "105px",
                                "&:hover": { bgcolor: "#DC2626" },
                                boxShadow: "0 2px 6px rgba(239, 68, 68, 0.3)",
                                py: 0.5,
                                px: 1.5,
                                whiteSpace: "nowrap",
                              }}
                            >
                              Check-Out
                            </Button>
                          ) : (
                            <Chip label={g.status || "DEPARTED"} size="small" variant="outlined" sx={{ fontSize: "0.7rem", fontWeight: 700 }} />
                          )}
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
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
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
                sx={{ width: { xs: "100%", sm: 220 }, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
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
                  <Table size="small" sx={{ minWidth: 680 }}>
                    <TableHead sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC" }}>
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
                            <TableCell sx={{ fontWeight: 900, color: themeConfig.primaryDark, whiteSpace: "nowrap" }}>
                              <Chip
                                icon={<MeetingRoom sx={{ fontSize: "14px !important" }} />}
                                label={`Room ${r.roomNumber}`}
                                size="small"
                                sx={{ fontWeight: 800, bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, cursor: "pointer" }}
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
                  <Table size="small" sx={{ minWidth: 780 }}>
                    <TableHead sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC" }}>
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
                            <TableCell sx={{ fontWeight: 900, color: themeConfig.primaryDark, whiteSpace: "nowrap" }}>
                              <Chip
                                icon={<MeetingRoom sx={{ fontSize: "14px !important" }} />}
                                label={`Room ${room.roomNumber}`}
                                size="small"
                                sx={{ fontWeight: 800, bgcolor: themeConfig.champagne, color: themeConfig.primaryDark }}
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
                  <Table size="small" sx={{ minWidth: 680 }}>
                    <TableHead sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC" }}>
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
                            <TableCell sx={{ fontWeight: 900, color: themeConfig.primaryDark, whiteSpace: "nowrap" }}>
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
                  <Table size="small" sx={{ minWidth: 680 }}>
                    <TableHead sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC" }}>
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
                  <Table size="small" sx={{ minWidth: 840 }}>
                    <TableHead sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC" }}>
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
                                <Chip
                                  icon={<MeetingRoom sx={{ fontSize: "14px !important" }} />}
                                  label={`Room ${room}`}
                                  size="small"
                                  sx={{ fontWeight: 800, bgcolor: themeConfig.champagne, color: themeConfig.primaryDark }}
                                />
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

      {/* Quick Check-Out Confirmation Modal */}
      <Dialog
        open={checkoutModal.open}
        onClose={() => !checkoutModal.isSubmitting && setCheckoutModal({ open: false, item: null, paymentMethod: "CASH", settlementAmount: 0, isSubmitting: false })}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", overflow: "hidden" } } }}
      >
        <DialogTitle sx={{ fontWeight: 900, pb: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
              Room #{checkoutModal.item?.roomAssigned || ""} Status
            </Typography>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
              Active In-House Guest Settlement & Checkout
            </Typography>
          </Box>
          <IconButton size="small" onClick={() => setCheckoutModal({ open: false, item: null, paymentMethod: "CASH", settlementAmount: 0, isSubmitting: false })}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {checkoutModal.item && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 0.5 }}>
              <Paper sx={{ p: 1.6, borderRadius: "16px", bgcolor: isDarkMode ? "rgba(11,142,224,0.08)" : "rgba(11,142,224,0.05)", border: `1px solid ${themeConfig.border}`, display: "flex", alignItems: "center", gap: 1.5 }}>
                <Avatar sx={{ bgcolor: themeConfig.primary, fontWeight: 900 }}>{(checkoutModal.item.name || "G").charAt(0)}</Avatar>
                <Box>
                  <Typography sx={{ fontWeight: 900, color: themeConfig.textMain, lineHeight: 1.2 }}>{checkoutModal.item.name}</Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>{checkoutModal.item.phone}</Typography>
                  <Chip label={`Folio #${checkoutModal.item.bookingNumber || checkoutModal.item.booking?.bookingNumber || "Active"}`} size="small" sx={{ ml: 1, height: 20, fontWeight: 800, fontSize: "0.68rem" }} />
                </Box>
              </Paper>

              <Paper sx={{ p: 1.5, borderRadius: "16px", border: `1px solid ${themeConfig.border}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 900, mb: 1 }}>Folio Billing & Dues Verification</Typography>
                <TableContainer sx={{ borderRadius: "10px", border: `1px solid ${themeConfig.border}` }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 800 }}>Item / Description</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>Amount</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      <TableRow>
                        <TableCell>Room Tariff (Room Stay)</TableCell>
                        <TableCell align="right">₹{Number(checkoutModal.item.totalAmount || 0).toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                      <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                        <TableCell sx={{ fontWeight: 900 }}>Total Folio Charges</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900 }}>₹{Number(checkoutModal.item.totalAmount || 0).toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ color: "#059669" }}>Advance Paid at Check-In</TableCell>
                        <TableCell align="right" sx={{ color: "#059669", fontWeight: 800 }}>-₹{Number(checkoutModal.item.paidAmount || 0).toLocaleString("en-IN")}</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 900, color: checkoutModal.item.dueAmount > 0 ? "#DC2626" : "#059669" }}>Folio Settlement Status:</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: checkoutModal.item.dueAmount > 0 ? "#DC2626" : "#059669" }}>
                          {checkoutModal.item.dueAmount > 0 ? `₹${Number(checkoutModal.item.dueAmount).toLocaleString("en-IN")} Due` : "✓ ₹0 Due (Fully Cleared)"}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>

              {checkoutModal.item.dueAmount > 0 ? (
                <TextField
                  select
                  label="Payment Method"
                  size="small"
                  fullWidth
                  value={checkoutModal.paymentMethod}
                  onChange={(e) => setCheckoutModal((prev) => ({ ...prev, paymentMethod: e.target.value }))}
                >
                  <MenuItem value="CASH">Cash Payment</MenuItem>
                  <MenuItem value="UPI">UPI / QR Code</MenuItem>
                  <MenuItem value="CARD">Debit / Credit Card</MenuItem>
                </TextField>
              ) : (
                <Paper sx={{ p: 1.6, borderRadius: "14px", bgcolor: "rgba(16,185,129,0.08)", border: "1px solid rgba(16,185,129,0.25)" }}>
                  <Typography sx={{ fontWeight: 900, color: "#059669" }}>✓ Account Fully Cleared</Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>No pending balance for this room. Ready for checkout.</Typography>
                </Paper>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, pt: 1.5 }}>
          <Button
            onClick={() => setCheckoutModal({ open: false, item: null, paymentMethod: "CASH", settlementAmount: 0, isSubmitting: false })}
            disabled={checkoutModal.isSubmitting}
            sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleConfirmCheckoutModal}
            disabled={checkoutModal.isSubmitting}
            startIcon={<Logout />}
            sx={{
              borderRadius: "12px",
              fontWeight: 800,
              textTransform: "none",
              bgcolor: "#0F766E",
              "&:hover": { bgcolor: "#115E59" },
              px: 2.5,
            }}
          >
            {checkoutModal.isSubmitting ? "Processing..." : "Complete Check-Out & Release Room"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

