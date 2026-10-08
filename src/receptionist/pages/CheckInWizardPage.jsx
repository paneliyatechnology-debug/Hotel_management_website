"use client";

import { useState, useEffect, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  Paper,
  Button,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Stepper,
  Step,
  StepLabel,
  Grid,
  Divider,
  Chip,
  Avatar,
  RadioGroup,
  FormControlLabel,
  Radio,
  Alert,
  IconButton,
  Checkbox,
  InputAdornment,
  OutlinedInput,
  Tooltip,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
  Dialog,
} from "@mui/material";
import { calculateMultiRoomBookingGST } from "@/shared/utils/gstUtils";
import { uploadToCloudinaryServer } from "@/shared/utils/uploadService";
import { toast } from "@/shared/utils/toast";
import {
  CheckCircle,
  VerifiedUser,
  Star,
  MeetingRoom,
  Phone,
  Person,
  Home,
  ArrowForward,
  ArrowBack,
  CloudUpload,
  DocumentScanner,
  FlashOn,
  Delete,
  Refresh,
  Group,
  People,
  Lightbulb,
  Warning,
  EventBusy,
  Add,
  Remove,
  Check,
  Shield,
  LocalOffer,
  AccessTime,
  KingBed,
  CreditCard,
  Receipt,
  Description,
  Close,
  Favorite,
  FamilyRestroom,
  SingleBed,
  Diamond,
  Villa,
  Work,
  Draw,
  Fingerprint,
  WhatsApp,
  Visibility,
} from "@/shared/icons";
import dynamic from "next/dynamic";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { formatTime12Hour, formatTime24Hour } from "@/shared/utils/timeUtils";
import { getAmenityIcon } from "@/shared/utils/amenityUtils";
import { apiRequest, API_ENDPOINTS } from "@/config/api";

const DigitalSignaturePad = dynamic(() => import("@/shared/components/DigitalSignaturePad"), { ssr: false });

const CHECKIN_STEPS = [
  "Guest Profile & ID",
  "Stay Schedule",
  "Billing & Settlement",
  "Review & Check-In",
];

const RELATIONSHIP_OPTIONS = [
  "Spouse / Partner",
  "Child / Son / Daughter",
  "Parent / Father / Mother",
  "Friend",
  "Colleague / Business Partner",
  "Brother / Sister / Sibling",
  "Relative / Family Member",
  "Other",
];

const ID_PROOF_TYPES = [
  { value: "AADHAAR", label: "Aadhaar Card" },
  { value: "PASSPORT", label: "Passport" },
  { value: "DRIVING_LICENSE", label: "Driving License" },
  { value: "VOTER_ID", label: "Voter ID Card" },
  { value: "PAN", label: "PAN Card" },
];

// Helper to get exact current local date in YYYY-MM-DD format
const getTodayLocalDate = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// Helper to get exact current local time in HH:MM format
const getCurrentLocalTime = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
};

export default function CheckInWizardPage({
  activeStep,
  setActiveStep,
  checkInData,
  setCheckInData,
  hotelSettings = { checkInTime: "14:00", checkOutTime: "12:00", timezone: "Asia/Kolkata" },
  rooms = [],
  roomTypes = [],
  guests = [],
  bookings = [],
  onFinalCheckIn,
  onBackToRooms,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const checkInTimeFormatted = formatTime12Hour(hotelSettings?.checkInTime || "14:00");
  const checkOutTimeFormatted = formatTime12Hour(hotelSettings?.checkOutTime || "12:00");
  const timezoneStr = hotelSettings?.timezone || "Asia/Kolkata";

  // Helper to format ISO Date (YYYY-MM-DD)
  const toDateStr = (val) => {
    if (!val) return "";
    if (typeof val === "string") {
      const match = val.trim().match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
    }
    const d = new Date(val);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  // Helper to format ISO Date (YYYY-MM-DD) to DD-MM-YYYY format
  const formatDDMMYYYY = (val) => {
    if (!val) return "";
    const s = toDateStr(val);
    if (!s) return "";
    const parts = s.split("-");
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return s;
  };

  // Helper to check night-based date overlap: (existIn < reqOut) && (existOut > reqIn)
  const isStayOverlapping = (reqIn, reqOut, existIn, existOut) => {
    const rIn = toDateStr(reqIn);
    const rOut = toDateStr(reqOut);
    const eIn = toDateStr(existIn);
    const eOut = toDateStr(existOut);
    if (!rIn || !rOut || !eIn || !eOut) return false;
    return eIn < rOut && eOut > rIn;
  };

  // Date-wise available rooms dynamically calculated for selected stay period
  const availableRooms = useMemo(() => {
    const reqIn = checkInData.checkInDate || getTodayLocalDate();
    let reqOut = checkInData.checkOutDate;
    if (!reqOut || reqOut <= reqIn) {
      const d = new Date(reqIn);
      d.setDate(d.getDate() + 1);
      reqOut = toDateStr(d);
    }

    return rooms.filter((r) => {
      // Exclude rooms under maintenance or blocked
      if (r.status === "MAINTENANCE" || r.status === "BLOCKED" || r.status === "OUT_OF_ORDER" || r.isActive === false) {
        return false;
      }

      const rId = String(r._id || "");
      const rNum = String(r.roomNumber || "");

      // Check active overlapping bookings for this room
      const hasOverlap = (bookings || []).some((b) => {
        const isActive = !["CANCELLED", "CHECKED_OUT", "NO_SHOW", "VOID", "REFUNDED"].includes(b.status);
        if (!isActive) return false;

        const bRoomId = String(b.room?._id || b.room || "");
        const bRtId = String(b.roomType?._id || b.roomType || "");
        const rRtId = String(r.roomType?._id || r.roomType || "");

        let isThisRoom = false;
        if (bRoomId && rId && bRoomId === rId) isThisRoom = true;
        else if (Array.isArray(b.rooms) && b.rooms.some((id) => String(id?._id || id) === rId)) isThisRoom = true;
        else if (!bRoomId && String(b.roomNumber || "") === rNum && (!bRtId || !rRtId || bRtId === rRtId)) isThisRoom = true;
        else if (!bRoomId && Array.isArray(b.roomNumbers) && b.roomNumbers.some((num) => String(num) === rNum && (!bRtId || !rRtId || bRtId === rRtId))) isThisRoom = true;

        if (!isThisRoom) return false;

        return isStayOverlapping(reqIn, reqOut, b.checkInDate, b.checkOutDate);
      });

      return !hasOverlap;
    });
  }, [rooms, bookings, checkInData.checkInDate, checkInData.checkOutDate]);

  // Continuous Live Clock for check-in time
  const [liveTime, setLiveTime] = useState(getCurrentLocalTime());
  const [liveDate, setLiveDate] = useState(getTodayLocalDate());

  // Form validation feedback
  const [stepError, setStepError] = useState("");
  const [previewImageSrc, setPreviewImageSrc] = useState(null);

  useEffect(() => {
    const initialTime = getCurrentLocalTime();
    const initialDate = getTodayLocalDate();
    setLiveTime(initialTime);
    setLiveDate(initialDate);

    const timer = setInterval(() => {
      const curTime = getCurrentLocalTime();
      const curDate = getTodayLocalDate();
      setLiveTime(curTime);
      setLiveDate(curDate);

      setCheckInData((prev) => {
        if (prev.isCustomCheckInTime) return prev;
        if (prev.checkInTime === curTime && prev.checkInDate === curDate) return prev;
        return {
          ...prev,
          checkInTime: curTime,
          checkInDate: prev.checkInDate || curDate,
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Sync initial checkout date if missing
  useEffect(() => {
    setCheckInData((prev) => {
      if (!prev.checkOutDate) {
        const d = new Date();
        d.setDate(d.getDate() + (prev.numberOfNights || 1));
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return { ...prev, checkOutDate: `${y}-${m}-${day}` };
      }
      return prev;
    });
  }, []);

  // Calculate stay duration (nights)
  const calculateNights = (inDate, outDate) => {
    try {
      const d1 = new Date(inDate);
      const d2 = new Date(outDate);
      const diffDays = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      return Math.max(1, isNaN(diffDays) ? 1 : diffDays);
    } catch {
      return 1;
    }
  };

  const nights = calculateNights(checkInData.checkInDate, checkInData.checkOutDate);

  // Helper to safely extract roomType object whether it's an object or ObjectId string
  const getRoomTypeObj = (room) => {
    if (!room) return null;
    if (typeof room.roomType === "object" && room.roomType !== null) return room.roomType;
    if (roomTypes && roomTypes.length > 0) {
      const found = roomTypes.find((t) => String(t._id) === String(room.roomType));
      if (found) return found;
    }
    return null;
  };

  const getRoomCategoryName = (room) => {
    if (!room) return "Standard Room";
    const rt = getRoomTypeObj(room);
    return rt?.name || room.category || room.type || `Room ${room.roomNumber}`;
  };

  // Dynamic Room Category Icon & Theme Config
  const getRoomCategoryIconConfig = (room, customSize = 22) => {
    const catName = (getRoomCategoryName(room) || "").toLowerCase();

    // Couple / Copol / Honeymoon / Romantic
    if (
      catName.includes("coupl") ||
      catName.includes("copol") ||
      catName.includes("honey") ||
      catName.includes("romant") ||
      catName.includes("love")
    ) {
      return {
        icon: <Favorite sx={{ fontSize: customSize }} />,
        color: "#E11D48",
        bg: "rgba(225, 29, 72, 0.12)",
        label: "Couple / Romantic",
      };
    }
    // Family Room
    if (
      catName.includes("fam") ||
      catName.includes("family") ||
      catName.includes("famaliy") ||
      catName.includes("group") ||
      catName.includes("quad")
    ) {
      return {
        icon: <FamilyRestroom sx={{ fontSize: customSize }} />,
        color: "#059669",
        bg: "rgba(5, 150, 105, 0.12)",
        label: "Family Suite",
      };
    }
    // Super Deluxe / Deluxe / Luxury / Suite / VIP / Presidential
    if (
      catName.includes("super") ||
      catName.includes("deluxe") ||
      catName.includes("lux") ||
      catName.includes("suite") ||
      catName.includes("vip") ||
      catName.includes("presid") ||
      catName.includes("royal") ||
      catName.includes("prem")
    ) {
      return {
        icon: <Diamond sx={{ fontSize: customSize }} />,
        color: "#D97706",
        bg: "rgba(217, 119, 6, 0.12)",
        label: "Premium Luxury",
      };
    }
    // Villa / Cottage / Penthouse / Resort
    if (
      catName.includes("villa") ||
      catName.includes("cottage") ||
      catName.includes("penthouse") ||
      catName.includes("resort") ||
      catName.includes("bungalow")
    ) {
      return {
        icon: <Villa sx={{ fontSize: customSize }} />,
        color: "#0891B2",
        bg: "rgba(8, 145, 178, 0.12)",
        label: "Villa / Resort",
      };
    }
    // Single / Solo
    if (catName.includes("single") || catName.includes("solo") || catName.includes("one bed")) {
      return {
        icon: <SingleBed sx={{ fontSize: customSize }} />,
        color: "#6366F1",
        bg: "rgba(99, 102, 241, 0.12)",
        label: "Single Bed",
      };
    }
    // Business / Corporate / Executive
    if (catName.includes("business") || catName.includes("exec") || catName.includes("corporate")) {
      return {
        icon: <Work sx={{ fontSize: customSize }} />,
        color: "#2563EB",
        bg: "rgba(37, 99, 235, 0.12)",
        label: "Business Class",
      };
    }
    // Default / Standard Room
    return {
      icon: <KingBed sx={{ fontSize: customSize }} />,
      color: "#059669",
      bg: "rgba(16, 185, 129, 0.12)",
      label: "Standard Room",
    };
  };

  // Helper to extract room nightly tariff
  const getRoomTariff = (room) => {
    if (!room) return 0;
    const rt = getRoomTypeObj(room);
    return room.customPricePerNight || rt?.basePrice || room.basePrice || 0;
  };

  // Helper to extract exact room capacity based on seatingCapacity & bed configuration
  const calculateRoomCapacity = (room) => {
    if (!room) return { standardCapacity: 2, maxCapacityWithBuffer: 3, bedType: "1 King Bed", bedCount: 1 };
    const rt = getRoomTypeObj(room);
    const bedType = room.bedType || rt?.bedType || "1 King Bed";
    const bedCount = Number(room.bedCount) || Number(rt?.bedCount) || 1;
    const explicitSeating = Number(room.seatingCapacity) || Number(rt?.capacity?.adults) || 0;

    let bedPersons = 2;
    if (bedType.includes("2 Double")) bedPersons = 4;
    else if (bedType.includes("Family Bunk")) bedPersons = 4;
    else if (bedType.includes("3 Single")) bedPersons = 3;
    else if (bedType.includes("Sofa Bed")) bedPersons = 3;
    else if (bedType.includes("2 Single")) bedPersons = 2;
    else if (bedType.includes("1 Single")) bedPersons = 1;
    else if (bedType.includes("Queen")) bedPersons = 2;
    else if (bedType.includes("King")) bedPersons = 2;
    else if (bedType.includes("Bunk")) bedPersons = 2;
    else bedPersons = bedCount * 2;

    const standardCapacity = Math.max(explicitSeating, bedPersons, 1);
    // 1-2 persons extra buffer adjustment with extra mattress
    const maxCapacityWithBuffer = standardCapacity + (standardCapacity >= 4 ? 2 : 1);

    return {
      standardCapacity,
      maxCapacityWithBuffer,
      bedType,
      bedCount,
    };
  };

  // Helper to extract room amenities list
  const getRoomAmenitiesList = (r) => {
    if (Array.isArray(r?.amenities) && r.amenities.length > 0) {
      return r.amenities;
    }
    if (Array.isArray(r?.roomType?.amenities) && r.roomType.amenities.length > 0) {
      return r.roomType.amenities;
    }
    if (typeof r?.amenities === "string" && r.amenities.trim()) {
      return r.amenities.split(",").map((s) => s.trim());
    }
    return ["AC", "Free Wi-Fi", "Smart TV", "Attached Bath"];
  };

  // Selected Rooms List calculation
  const selectedRoomIds = (checkInData.roomIds && checkInData.roomIds.length > 0)
    ? checkInData.roomIds.map(String)
    : checkInData.roomId
      ? [String(checkInData.roomId)]
      : [];

  const selectedRoomsList = (() => {
    // 1. Match by selected roomIds
    if (selectedRoomIds.length > 0) {
      const matched = rooms.filter((r) => selectedRoomIds.includes(String(r._id)));
      if (matched.length > 0) return matched;
    }

    // 2. Match by selectedRooms array
    if (Array.isArray(checkInData.selectedRooms) && checkInData.selectedRooms.length > 0) {
      const matched = checkInData.selectedRooms
        .map((sr) => rooms.find((r) => String(r._id) === String(sr._id || sr.id)) || sr)
        .filter(Boolean);
      if (matched.length > 0) return matched;
    }

    // 3. Match by room number strings
    const rawNumbers = checkInData.selectedRoomNumbers || (checkInData.roomNumber ? String(checkInData.roomNumber).split(",").map((s) => s.trim()) : []);
    if (rawNumbers.length > 0) {
      const matched = rooms.filter((r) => rawNumbers.includes(String(r.roomNumber)));
      if (matched.length > 0) return matched;
    }

    // 4. Fallback only if no room was selected
    if (availableRooms.length > 0) return [availableRooms[0]];
    if (rooms.length > 0) return [rooms[0]];
    return [];
  })();

  // Helper to extract room max capacity based on room.seatingCapacity, room.maxCapacity, roomType capacity & bed configuration
  const getRoomMaxCapacity = (room) => {
    if (!room) return 0;
    const rt = getRoomTypeObj(room);
    const explicitCap = Number(room.seatingCapacity) ||
      Number(room.maxCapacity) ||
      Number(room.capacity?.adults) ||
      Number(room.maxGuests) ||
      Number(rt?.capacity?.adults) ||
      Number(rt?.maxCapacity) ||
      0;
    if (explicitCap > 0) return explicitCap;
    return calculateRoomCapacity(room).standardCapacity || 2;
  };

  // Current active / targeted room among selected rooms (identified by unique _id)
  const activeRoomId = checkInData.activeRoomId
    ? String(checkInData.activeRoomId)
    : checkInData.roomId
      ? String(checkInData.roomId)
      : (selectedRoomsList[0]?._id ? String(selectedRoomsList[0]._id) : "");
  const activeRoom = selectedRoomsList.find((r) => String(r._id) === String(activeRoomId)) || selectedRoomsList[0] || null;

  // Total sleeping capacity across all currently selected rooms
  const totalRoomCapacity = selectedRoomsList.reduce((sum, r) => sum + getRoomMaxCapacity(r), 0);
  const maxTotalGuests = totalRoomCapacity;
  const maxAdditionalMembers = Math.max(0, maxTotalGuests - 1);
  const totalPartySize = 1 + (checkInData.accompanyingGuests?.length || 0);
  const currentMembersCount = checkInData.accompanyingGuests?.length || 0;

  const isOverCapacity = totalRoomCapacity > 0 && totalPartySize > totalRoomCapacity;
  const isCapacityExceeded = isOverCapacity;
  const isBufferUsed = false;
  const guestDeficit = Math.max(0, totalPartySize - (totalRoomCapacity || 2));

  // Helper to format ISO Date to readable "22 Oct"
  const formatDisplayDate = (dVal) => {
    if (!dVal) return "";
    const s = toDateStr(dVal);
    if (!s) return "";
    const [y, m, d] = s.split("-").map(Number);
    const obj = new Date(y, m - 1, d);
    return obj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  // Helper to find all active bookings for a room
  const getRoomBookings = (room) => {
    if (!room) return [];
    const rId = String(room._id || "");
    const rNum = String(room.roomNumber || "");
    return (bookings || []).filter((b) => {
      const isActive = b.status !== "CANCELLED" && b.status !== "CHECKED_OUT" && b.status !== "NO_SHOW" && b.status !== "VOID" && b.status !== "REFUNDED";
      if (!isActive) return false;
      const bRoomId = String(b.room?._id || b.room || "");
      const bRtId = String(b.roomType?._id || b.roomType || "");
      const rRtId = String(room.roomType?._id || room.roomType || "");

      let isThisRoom = false;
      if (bRoomId && rId && bRoomId === rId) isThisRoom = true;
      else if (Array.isArray(b.rooms) && b.rooms.some((id) => String(id?._id || id) === rId)) isThisRoom = true;
      else if (!bRoomId && String(b.roomNumber || "") === rNum && (!bRtId || !rRtId || bRtId === rRtId)) isThisRoom = true;
      else if (!bRoomId && Array.isArray(b.roomNumbers) && b.roomNumbers.some((num) => String(num) === rNum && (!bRtId || !rRtId || bRtId === rRtId))) isThisRoom = true;
      return isThisRoom;
    });
  };

  // Helper to find overlapping conflict for requested stay period
  const getRoomConflict = (room) => {
    if (!room) return null;
    const reqIn = checkInData.checkInDate || getTodayLocalDate();
    let reqOut = checkInData.checkOutDate;
    if (!reqOut || reqOut <= reqIn) {
      const d = new Date(reqIn);
      d.setDate(d.getDate() + 1);
      reqOut = toDateStr(d);
    }
    const rBookings = getRoomBookings(room);
    return rBookings.find((b) => isStayOverlapping(reqIn, reqOut, b.checkInDate, b.checkOutDate)) || null;
  };

  const conflictingRooms = useMemo(() => {
    return selectedRoomsList.filter((r) => Boolean(getRoomConflict(r)));
  }, [selectedRoomsList, bookings, checkInData.checkInDate, checkInData.checkOutDate]);

  // Collect all upcoming/active bookings for the currently selected room(s)
  const allExistingBookingsForSelectedRooms = useMemo(() => {
    const list = [];
    selectedRoomsList.forEach((r) => {
      const rBookings = getRoomBookings(r);
      rBookings.forEach((b) => {
        list.push({
          roomId: String(r._id || ""),
          roomNumber: r.roomNumber,
          checkInDate: b.checkInDate,
          checkOutDate: b.checkOutDate,
          guestName: b.guest?.fullName || b.guestName || "Guest",
          bookingNumber: b.bookingNumber,
        });
      });
    });
    return list.sort((a, b) => toDateStr(a.checkInDate).localeCompare(toDateStr(b.checkInDate)));
  }, [selectedRoomsList, bookings]);

  // Helper to quickly switch the selected room to an available alternative
  const handleSwitchSingleRoom = (roomIdToSet) => {
    const targetRoom = rooms.find((r) => String(r._id) === String(roomIdToSet));
    if (!targetRoom) return;
    const catName = getRoomCategoryName(targetRoom);
    const tariff = getRoomTariff(targetRoom);
    const n = checkInData.numberOfNights || 1;
    const baseTot = tariff * n;
    const disc = isVipGuest ? Math.round(baseTot * 0.10) : (checkInData.discountAmount || 0);
    const netTot = Math.max(0, baseTot - disc) + (checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0);

    setCheckInData((prev) => ({
      ...prev,
      roomId: String(targetRoom._id),
      roomNumber: String(targetRoom.roomNumber),
      roomIds: [String(targetRoom._id)],
      selectedRooms: [targetRoom],
      selectedRoomNumbers: [String(targetRoom.roomNumber)],
      activeRoomId: String(targetRoom._id),
      roomType: catName,
      floor: targetRoom.floor || 1,
      rate: tariff,
      discountAmount: disc,
      total: netTot,
      paid: netTot,
      due: 0,
    }));
    setStepError("");
  };

  // Centralized GST calculation across selected rooms (Requirements #4 & #5)
  const gstBookingResult = calculateMultiRoomBookingGST({
    rooms: (selectedRoomsList.length > 0 ? selectedRoomsList : [{ pricePerNight: checkInData.rate ?? 3000, gstEnabled: true, gstRate: 18 }]).map((r) => {
      const rt = getRoomTypeObj(r);
      const price = getRoomTariff(r) || Number(checkInData.rate) || 0;
      return {
        ...r,
        pricePerNight: price,
        basePrice: price,
        gstEnabled: r.gstEnabled !== undefined ? r.gstEnabled : (rt?.gstEnabled ?? true),
        gstRate: r.gstRate !== undefined ? r.gstRate : (rt?.gstRate ?? 18),
        taxInclusive: r.taxInclusive !== undefined ? r.taxInclusive : (rt?.taxInclusive ?? false),
      };
    }),
    nights: checkInData.numberOfNights || nights || 1,
    isInterstate: Boolean(checkInData.isInterstate),
  });

  const isVipGuest = Boolean(checkInData.isRepeatGuest || (checkInData.totalVisits && checkInData.totalVisits >= 2));
  const baseTariffTotal = gstBookingResult.taxableAmount;
  const totalGstAmount = gstBookingResult.gstAmount;
  const totalCgstAmount = gstBookingResult.cgstAmount;
  const totalSgstAmount = gstBookingResult.sgstAmount;
  const totalIgstAmount = gstBookingResult.igstAmount;

  const vipDiscountAmount = isVipGuest ? Math.round(baseTariffTotal * 0.10) : (checkInData.discountAmount || 0);
  const securityDepositAmount = checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0;
  const calculatedGrandTotal = Math.max(0, gstBookingResult.grandTotal - vipDiscountAmount) + securityDepositAmount;

  // Auto-fill Advance Amount Paid with full Total including GST (Base + CGST 9% + SGST 9%)
  useEffect(() => {
    if (!checkInData.isPaidManuallyEdited) {
      setCheckInData((prev) => {
        if (prev.paid === calculatedGrandTotal && prev.total === calculatedGrandTotal) return prev;
        return {
          ...prev,
          total: calculatedGrandTotal,
          paid: calculatedGrandTotal,
          due: 0,
        };
      });
    }
  }, [calculatedGrandTotal, checkInData.isPaidManuallyEdited]);

  // Aadhaar 12-Digit Format & Validation Helpers
  const formatAadhaarNumber = (val) => {
    const cleaned = String(val || "").replace(/\D/g, "").slice(0, 12);
    const parts = cleaned.match(/[\s\S]{1,4}/g) || [];
    return parts.join(" ");
  };

  const validateAadhaar = (val) => {
    const digitsOnly = String(val || "").replace(/\D/g, "");
    if (digitsOnly.length === 12) {
      return { isValid: true, message: "Valid 12-Digit Aadhaar", digits: digitsOnly };
    }
    if (digitsOnly.length === 0) {
      return { isValid: false, message: "12-digit Aadhaar number required", digits: digitsOnly };
    }
    return { isValid: false, message: `12 digits required (${digitsOnly.length}/12 entered)`, digits: digitsOnly };
  };

  // Dynamic Total Guests Count Handler
  const handleTotalGuestsChange = (newCount) => {
    const count = Math.max(1, parseInt(newCount) || 1);
    if (totalRoomCapacity > 0 && count > totalRoomCapacity) {
      showErrorAlert(`⚠️ Maximum guest capacity reached (${totalRoomCapacity} guest(s) max for selected rooms).`);
      return;
    }
    if (totalRoomCapacity === 0 && selectedRoomsList.length === 0 && count > 1) {
      showErrorAlert("⚠️ Please select room(s) first to set the guest capacity limit.");
      return;
    }
    const currentAccompanying = checkInData.accompanyingGuests || [];
    const targetAccompanyingCount = count - 1;

    let updatedAccompanying = [...currentAccompanying];
    if (targetAccompanyingCount > currentAccompanying.length) {
      const diff = targetAccompanyingCount - currentAccompanying.length;
      for (let i = 0; i < diff; i++) {
        updatedAccompanying.push({
          id: Date.now() + Math.random(),
          name: "",
          age: "",
          gender: "Male",
          relationship: "Spouse / Partner",
          email: "",
          mobileNumber: "",
          idType: "AADHAAR",
          idNumber: "",
          frontImage: "",
          backImage: "",
        });
      }
    } else if (targetAccompanyingCount < currentAccompanying.length) {
      updatedAccompanying = updatedAccompanying.slice(0, targetAccompanyingCount);
    }

    setCheckInData((prev) => ({
      ...prev,
      adults: count,
      accompanyingGuests: updatedAccompanying,
    }));
  };

  // Accompanying Members Handlers (Step 1)
  const handleAddMember = () => {
    const newMember = {
      id: Date.now() + Math.random(),
      name: "",
      frontImage: "",
      backImage: "",
      images: [],
    };
    const updatedMembers = [...(checkInData.accompanyingGuests || []), newMember];
    setCheckInData((prev) => ({
      ...prev,
      accompanyingGuests: updatedMembers,
      adults: 1 + updatedMembers.length,
    }));
  };

  // Direct File Picker Handler for "+ Upload Member Documents" Button (Unlimited Image Uploads Allowed)
  const handleAddNewMemberWithFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Local Base64 previews for instant feedback
    const newPreviews = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (evt) => resolve(evt.target.result);
            reader.readAsDataURL(file);
          })
      )
    );

    const newDocItems = newPreviews.map((imgSrc, idx) => ({
      id: Date.now() + Math.random() + idx,
      name: `Document #${(checkInData.accompanyingGuests?.length || 0) + idx + 1}`,
      frontImage: imgSrc,
      backImage: "",
      images: [imgSrc],
    }));

    setCheckInData((prev) => {
      const updatedMembers = [...(prev.accompanyingGuests || []), ...newDocItems];
      return {
        ...prev,
        accompanyingGuests: updatedMembers,
        adults: 1 + updatedMembers.length,
      };
    });

    // Cloudinary background uploads
    files.forEach(async (file, idx) => {
      try {
        const liveCloudUrl = await uploadToCloudinaryServer(file, "hotel_guest_documents/members");
        if (liveCloudUrl && (liveCloudUrl.startsWith("http://") || liveCloudUrl.startsWith("https://"))) {
          const targetId = newDocItems[idx].id;
          setCheckInData((prev) => {
            const updatedMembers = (prev.accompanyingGuests || []).map((m) => {
              if (m.id === targetId) {
                return {
                  ...m,
                  frontImage: liveCloudUrl,
                  images: [liveCloudUrl],
                };
              }
              return m;
            });
            return { ...prev, accompanyingGuests: updatedMembers };
          });
        }
      } catch (err) {
        console.warn("Cloudinary upload fallback to preview:", err);
      }
    });

    if (e.target) e.target.value = "";
  };

  const handleRemoveSingleMemberDoc = (docId) => {
    setCheckInData((prev) => {
      const updatedMembers = (prev.accompanyingGuests || []).filter((m) => m.id !== docId);
      return {
        ...prev,
        accompanyingGuests: updatedMembers,
        adults: 1 + updatedMembers.length,
      };
    });
  };

  const handleClearAllMemberDocs = () => {
    setCheckInData((prev) => ({
      ...prev,
      accompanyingGuests: [],
      adults: 1,
    }));
  };

  const handleUpdateMember = (id, field, val) => {
    const updatedMembers = (checkInData.accompanyingGuests || []).map((m) =>
      m.id === id ? { ...m, [field]: val } : m
    );
    setCheckInData((prev) => ({
      ...prev,
      accompanyingGuests: updatedMembers,
    }));
  };

  const handleRemoveMember = (id) => {
    const updatedMembers = (checkInData.accompanyingGuests || []).filter((m) => m.id !== id);
    setCheckInData((prev) => ({
      ...prev,
      accompanyingGuests: updatedMembers,
      adults: 1 + updatedMembers.length,
    }));
  };

  // Multi-Image Upload for Accompanying Members
  const handleMemberMultipleImageUpload = async (e, id) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Local Base64 previews for instant feedback
    const newPreviews = await Promise.all(
      files.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (evt) => resolve(evt.target.result);
            reader.readAsDataURL(file);
          })
      )
    );

    setCheckInData((prev) => {
      const updatedMembers = (prev.accompanyingGuests || []).map((m) => {
        if (m.id === id) {
          const existingImages = m.images || (m.frontImage ? [m.frontImage, ...(m.backImage ? [m.backImage] : [])] : []);
          const merged = [...existingImages, ...newPreviews];
          return {
            ...m,
            images: merged,
            frontImage: merged[0] || "",
            backImage: merged[1] || "",
          };
        }
        return m;
      });
      return { ...prev, accompanyingGuests: updatedMembers };
    });

    // Cloudinary background uploads
    files.forEach(async (file, idx) => {
      try {
        const liveCloudUrl = await uploadToCloudinaryServer(file, "hotel_guest_documents/members");
        if (liveCloudUrl && (liveCloudUrl.startsWith("http://") || liveCloudUrl.startsWith("https://"))) {
          setCheckInData((prev) => {
            const updatedMembers = (prev.accompanyingGuests || []).map((m) => {
              if (m.id === id) {
                const currentImages = [...(m.images || [])];
                const replaceIdx = currentImages.indexOf(newPreviews[idx]);
                if (replaceIdx !== -1) {
                  currentImages[replaceIdx] = liveCloudUrl;
                } else {
                  currentImages.push(liveCloudUrl);
                }
                return {
                  ...m,
                  images: currentImages,
                  frontImage: currentImages[0] || "",
                  backImage: currentImages[1] || "",
                };
              }
              return m;
            });
            return { ...prev, accompanyingGuests: updatedMembers };
          });
        }
      } catch (err) {
        console.warn("Cloudinary upload fallback to preview:", err);
      }
    });
  };

  const handleRemoveMemberImage = (memberId, imageIdxToRemove) => {
    setCheckInData((prev) => {
      const updatedMembers = (prev.accompanyingGuests || []).map((m) => {
        if (m.id === memberId) {
          const currentImages = (m.images || []).filter((_, idx) => idx !== imageIdxToRemove);
          return {
            ...m,
            images: currentImages,
            frontImage: currentImages[0] || "",
            backImage: currentImages[1] || "",
          };
        }
        return m;
      });
      return { ...prev, accompanyingGuests: updatedMembers };
    });
  };

  // Main Guest Image Upload
  const handleMainGuestImageUpload = async (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fast local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target.result;
      setCheckInData((prev) => ({
        ...prev,
        [target === "front" ? "frontImage" : "backImage"]: b64,
      }));
      if (target === "front") {
        setStepError("");
      }
    };
    reader.readAsDataURL(file);

    // Direct background upload via Multer to Cloudinary
    try {
      const liveCloudUrl = await uploadToCloudinaryServer(file, "hotel_guest_documents/main");
      if (liveCloudUrl && (liveCloudUrl.startsWith("http://") || liveCloudUrl.startsWith("https://"))) {
        setCheckInData((prev) => ({
          ...prev,
          [target === "front" ? "frontImage" : "backImage"]: liveCloudUrl,
        }));
      }
    } catch (err) {
      console.warn("Cloudinary upload fallback to local preview:", err);
    }
  };

  // Date and Time Check-in / Checkout Handlers
  const handleCheckInDateChange = (inDateVal) => {
    if (!inDateVal) return;
    const [y, m, d] = inDateVal.split("-").map(Number);
    const d1 = new Date(y, m - 1, d);
    const n = checkInData.numberOfNights || nights || 1;
    const d2 = new Date(d1);
    d2.setDate(d2.getDate() + n);
    const outDateStr = toDateStr(d2);

    const currentRate = checkInData.rate ?? 0;
    const baseTot = currentRate * n;
    const disc = isVipGuest ? Math.round(baseTot * 0.10) : (checkInData.discountAmount || 0);
    const netTot = Math.max(0, baseTot - disc) + (checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0);

    setCheckInData((prev) => ({
      ...prev,
      checkInDate: inDateVal,
      checkOutDate: outDateStr,
      checkOutTime: prev.checkOutTime || hotelSettings?.checkOutTime || "12:00",
      numberOfNights: n,
      discountAmount: disc,
      total: netTot,
      paid: netTot,
      due: 0,
    }));
  };

  const handleNightsChange = (nightsCount) => {
    if (nightsCount === "" || nightsCount === null || nightsCount === undefined) {
      setCheckInData((prev) => ({
        ...prev,
        numberOfNights: "",
      }));
      return;
    }

    const parsed = parseInt(nightsCount, 10);
    const n = isNaN(parsed) ? 0 : Math.max(0, parsed);
    const inDateStr = checkInData.checkInDate || getTodayLocalDate();
    const [y, m, d] = inDateStr.split("-").map(Number);
    const d1 = new Date(y, m - 1, d);
    const d2 = new Date(d1);
    d2.setDate(d2.getDate() + Math.max(1, n));
    const outDateStr = toDateStr(d2);

    const currentRate = checkInData.rate ?? 0;
    const baseTot = currentRate * (n === 0 ? 0 : n);
    const disc = isVipGuest ? Math.round(baseTot * 0.10) : (checkInData.discountAmount || 0);
    const netTot = Math.max(0, baseTot - disc) + (checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0);

    setCheckInData((prev) => ({
      ...prev,
      numberOfNights: n,
      checkOutDate: outDateStr,
      checkOutTime: prev.checkOutTime || hotelSettings?.checkOutTime || "12:00",
      discountAmount: disc,
      total: netTot,
      paid: netTot,
      due: 0,
    }));
  };

  const handleCheckOutDateChange = (outDateVal) => {
    if (!outDateVal) return;
    const inDateStr = checkInData.checkInDate || getTodayLocalDate();
    const [y1, m1, d1] = inDateStr.split("-").map(Number);
    const [y2, m2, d2] = outDateVal.split("-").map(Number);
    const date1 = new Date(y1, m1 - 1, d1);
    const date2 = new Date(y2, m2 - 1, d2);
    const diffDays = Math.ceil((date2 - date1) / (1000 * 60 * 60 * 24));
    const n = Math.max(1, isNaN(diffDays) ? 1 : diffDays);

    const currentRate = checkInData.rate ?? 0;
    const baseTot = currentRate * n;
    const disc = isVipGuest ? Math.round(baseTot * 0.10) : (checkInData.discountAmount || 0);
    const netTot = Math.max(0, baseTot - disc) + (checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0);

    setCheckInData((prev) => ({
      ...prev,
      checkOutDate: outDateVal,
      checkOutTime: prev.checkOutTime || hotelSettings?.checkOutTime || "12:00",
      numberOfNights: n,
      discountAmount: disc,
      total: netTot,
      paid: netTot,
      due: 0,
    }));
  };

  // Phone lookup & repeat guest logic
  const handlePhoneChange = async (val) => {
    const rawVal = val.trim();
    const queryDigits = rawVal.replace(/\D/g, "");
    setCheckInData((prev) => ({ ...prev, mobile: val }));

    if (queryDigits.length === 10) {
      const matched = guests.find((g) => {
        const p = (g.phone || g.mobileNumber || "").replace(/\D/g, "");
        return p === queryDigits;
      });

      if (matched) {
        applyGuestData(matched);
        return;
      }

      try {
        const res = await apiRequest(API_ENDPOINTS.RECEPTIONIST.GUEST_LOOKUP(queryDigits));
        if (res?.data) {
          applyGuestData(res.data);
        }
      } catch {
        // New guest
      }
    }
  };

  const applyGuestData = (guest) => {
    const totalVisits = guest.totalVisits || (bookings.filter((b) => (b.guest?._id || b.guest) === guest._id).length || 1);
    const idNum = guest.govtIdNumber || guest.idNumber || guest.idProof?.idNumber || "";
    const isIdVerified = guest.idVerified || guest.idProof?.verificationStatus === "VERIFIED" || Boolean(idNum && idNum !== "PENDING");

    setCheckInData((prev) => {
      const currentRate = prev.rate ?? 0;
      const baseTot = currentRate * (prev.numberOfNights || 1);
      const disc = Math.round(baseTot * 0.10); // 10% VIP Loyalty Discount
      const netTot = Math.max(0, baseTot - disc) + (prev.collectSecurityDeposit ? (Number(prev.securityDepositAmount) || 1000) : 0);

      return {
        ...prev,
        guestId: guest._id,
        fullName: guest.name || guest.fullName || prev.fullName,
        email: guest.email || prev.email,
        address: guest.address || prev.address,
        city: guest.city || prev.city,
        state: guest.state || prev.state,
        nationality: guest.nationality || prev.nationality || "Indian",
        gender: guest.gender || prev.gender || "Male",
        govtIdType: guest.govtIdType || guest.idType || guest.idProof?.idType || prev.govtIdType || "AADHAAR",
        govtIdNumber: idNum || prev.govtIdNumber,
        gstin: guest.gstin || guest.gstNumber || guest.taxId || prev.gstin || "",
        companyName: guest.companyName || prev.companyName || "",
        isRepeatGuest: true,
        totalVisits: Math.max(totalVisits, 2),
        hasVerifiedId: isIdVerified,
        discountAmount: disc,
        isPaidManuallyEdited: false,
      };
    });
  };

  // Add a specific room to the selection (for Quick Suggester)
  const handleAddAdditionalRoom = (roomIdToAdd) => {
    const strIdToAdd = String(roomIdToAdd);
    if (selectedRoomIds.map(String).includes(strIdToAdd)) return;
    const newIds = [...selectedRoomIds.map(String), strIdToAdd];
    const newSelectedRooms = rooms.filter((r) => newIds.includes(String(r._id)));
    const newRoomNumbers = newSelectedRooms.map((r) => String(r.roomNumber));
    const primaryRoom = newSelectedRooms[0];
    const primaryCat = getRoomCategoryName(primaryRoom);

    const combinedRate = newSelectedRooms.reduce((sum, r) => sum + getRoomTariff(r), 0);

    setCheckInData((prev) => ({
      ...prev,
      roomId: primaryRoom ? String(primaryRoom._id) : "",
      roomNumber: newRoomNumbers.join(", "),
      roomIds: newIds,
      selectedRooms: newSelectedRooms,
      selectedRoomNumbers: newRoomNumbers,
      roomType: primaryCat,
      floor: primaryRoom?.floor || 1,
      rate: combinedRate,
      isPaidManuallyEdited: false,
    }));
  };

  // Remove a room from selection
  const handleRemoveSelectedRoom = (roomIdToRemove) => {
    const strIdToRemove = String(roomIdToRemove);
    if (selectedRoomIds.length <= 1) {
      showErrorAlert("At least one room must remain allocated.", "warning");
      return;
    }
    const newIds = selectedRoomIds.map(String).filter((id) => id !== strIdToRemove);
    const newSelectedRooms = rooms.filter((r) => newIds.includes(String(r._id)));
    const newRoomNumbers = newSelectedRooms.map((r) => String(r.roomNumber));
    const primaryRoom = newSelectedRooms[0];
    const primaryCat = getRoomCategoryName(primaryRoom);

    const combinedRate = newSelectedRooms.reduce((sum, r) => sum + getRoomTariff(r), 0);

    setCheckInData((prev) => ({
      ...prev,
      roomId: primaryRoom ? String(primaryRoom._id) : "",
      roomNumber: newRoomNumbers.join(", "),
      roomIds: newIds,
      selectedRooms: newSelectedRooms,
      selectedRoomNumbers: newRoomNumbers,
      roomType: primaryCat,
      floor: primaryRoom?.floor || 1,
      rate: combinedRate,
      isPaidManuallyEdited: false,
    }));
  };

  // Multi-Room Dropdown Change Handler
  const handleDropdownRoomChange = (event) => {
    const rawVal = event.target.value;
    const selectedIds = (typeof rawVal === "string" ? rawVal.split(",") : rawVal).map(String);
    if (selectedIds.length === 0) return;

    const newSelectedRooms = rooms.filter((r) => selectedIds.includes(String(r._id)));
    const newRoomNumbers = newSelectedRooms.map((r) => String(r.roomNumber));
    const primaryRoom = newSelectedRooms[0];
    const primaryCat = getRoomCategoryName(primaryRoom);

    const combinedRate = newSelectedRooms.reduce((sum, r) => sum + getRoomTariff(r), 0);

    setCheckInData((prev) => ({
      ...prev,
      roomId: primaryRoom ? String(primaryRoom._id) : "",
      roomNumber: newRoomNumbers.join(", "),
      roomIds: selectedIds,
      selectedRooms: newSelectedRooms,
      selectedRoomNumbers: newRoomNumbers,
      roomType: primaryCat,
      floor: primaryRoom?.floor || 1,
      rate: combinedRate,
      isPaidManuallyEdited: false,
    }));
  };



  // Form Validation Field Error State for Red Input Highlight
  const [fieldErrors, setFieldErrors] = useState({});

  // Ensure clean state on mount & wipe any old cached draft data completely
  useEffect(() => {
    if (typeof localStorage !== "undefined") {
      try {
        localStorage.removeItem("hotel_checkin_wizard_draft_v1");
      } catch (e) {}
    }
  }, []);

  // Clear & reset form data when user clicks "Reset Form"
  const handleClearFormDraft = () => {
    if (typeof localStorage !== "undefined") {
      try { localStorage.removeItem("hotel_checkin_wizard_draft_v1"); } catch (e) {}
    }
    setCheckInData({
      fullName: "",
      mobile: "",
      email: "",
      address: "",
      govtIdType: "AADHAAR",
      govtIdNumber: "",
      roomType: "",
      roomNumber: "",
      roomId: "",
      roomIds: [],
      selectedRooms: [],
      selectedRoomNumbers: [],
      checkInDate: getTodayLocalDate(),
      checkInTime: getCurrentLocalTime(),
      checkOutDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      })(),
      checkOutTime: hotelSettings?.checkOutTime || "12:00",
      numberOfNights: 1,
      rate: 0,
      paid: 0,
      total: 0,
      accompanyingGuests: [],
    });
    setFieldErrors({});
    setStepError("");
    toast.show("🧹 Old form data cleared. Ready for new check-in!", "info");
  };

  // Smooth Scroll Helper to auto-scroll to missing/unfilled fields or top of wizard
  const scrollToElement = (id) => {
    if (typeof document !== "undefined") {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        const input = el.querySelector("input, select, textarea") || el;
        if (input && typeof input.focus === "function") {
          try { input.focus(); } catch {}
        }
        return;
      }
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // Step Validation Helpers & Error Alerts (Toast Notification System)
  const showErrorAlert = (msg, severity = "warning") => {
    setStepError(msg);
    toast.show(msg, severity);
  };

  const handleNext = () => {
    setStepError("");
    setFieldErrors({});

    // Step 1 (Index 0): Primary Guest & Member Photos Validation
    if (activeStep === 0) {
      const isNameMissing = !checkInData.fullName?.trim();
      const isMobileMissing = !checkInData.mobile?.trim();
      const isFrontIdMissing = !checkInData.frontImage;

      if (isNameMissing || isMobileMissing || isFrontIdMissing) {
        const newErrors = {};
        if (isNameMissing) newErrors.fullName = true;
        if (isMobileMissing) newErrors.mobile = true;
        if (isFrontIdMissing) newErrors.frontImage = true;
        setFieldErrors(newErrors);

        if (isNameMissing) {
          showErrorAlert("⚠️ Name Required: Please enter the Primary Guest's Full Name.");
          scrollToElement("field-primary-fullname");
          return;
        }
        if (isMobileMissing) {
          showErrorAlert("⚠️ Mobile Number Required: Please enter the Primary Guest's Mobile Number.");
          scrollToElement("field-primary-mobile");
          return;
        }
        if (isFrontIdMissing) {
          showErrorAlert("⚠️ ID Upload Required: Primary Guest ID photo (Front) is required before proceeding.");
          scrollToElement("main-guest-id-section");
          return;
        }
      }
    }

    // Step 2 (Index 1): Stay & Room Allocation Validation
    if (activeStep === 1) {
      if (!checkInData.roomId && (!checkInData.roomIds || checkInData.roomIds.length === 0)) {
        setFieldErrors({ roomId: true });
        showErrorAlert("⚠️ Room Required: Please assign at least one room before continuing.");
        scrollToElement("room-selection-section");
        return;
      }

      if (conflictingRooms.length > 0) {
        setFieldErrors({ roomId: true });
        const firstConflict = conflictingRooms[0];
        const conflictDetails = getRoomConflict(firstConflict);
        const cIn = formatDisplayDate(conflictDetails?.checkInDate);
        const cOut = formatDisplayDate(conflictDetails?.checkOutDate);
        const gName = conflictDetails?.guest?.fullName || conflictDetails?.guestName || "another guest";
        showErrorAlert(
          `⚠️ Room Conflict: Room #${firstConflict.roomNumber} is ALREADY BOOKED from ${cIn} to ${cOut} (${gName}). Please choose different stay dates or switch to an available room!`
        );
        scrollToElement("room-selection-section");
        return;
      }
    }

    // Step 3 (Index 2): Billing & Settlement (100% Auto Advance Settlement)
    if (activeStep === 2) {
      setCheckInData((prev) => ({
        ...prev,
        paid: calculatedGrandTotal,
        due: 0,
      }));
    }

    setActiveStep((prev) => Math.min(prev + 1, CHECKIN_STEPS.length - 1));
    scrollToElement("checkin-wizard-top");
  };

  const handleBack = () => {
    setStepError("");
    setActiveStep((prev) => Math.max(prev - 1, 0));
    scrollToElement("checkin-wizard-top");
  };

  return (
    <Box id="checkin-wizard-top" sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      <Card
        className="card-3d"
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: "24px",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "none" : "0 12px 30px -5px rgba(12, 39, 59, 0.08), inset 0 1px 1px #FFFFFF",
          maxWidth: 1020,
          mx: "auto",
        }}
      >
        {/* Wizard Header Banner */}
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.5, mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.5, width: "100%" }}>
            {onBackToRooms && (
              <Button
                variant="outlined"
                startIcon={<ArrowBack />}
                onClick={onBackToRooms}
                sx={{
                  borderRadius: "12px",
                  fontWeight: 800,
                  fontSize: "0.82rem",
                  borderColor: themeConfig.border,
                  color: themeConfig.textMain,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                  height: "fit-content",
                  "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
                }}
              >
                Back to Rooms
              </Button>
            )}

            <Button
              variant="text"
              size="small"
              onClick={handleClearFormDraft}
              startIcon={<Refresh sx={{ fontSize: 16 }} />}
              sx={{
                borderRadius: "10px",
                fontWeight: 800,
                fontSize: "0.75rem",
                color: themeConfig.textMuted,
                textTransform: "none",
                whiteSpace: "nowrap",
                flexShrink: 0,
                "&:hover": { color: "#EF4444", bgcolor: "rgba(239, 68, 68, 0.08)" },
              }}
            >
              Reset Form
            </Button>
            <Box sx={{ width: "100%" }}>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 0.2, letterSpacing: -0.5, fontSize: { xs: "1.15rem", sm: "1.45rem" }, lineHeight: 1.25 }}>
                Express Check-In & Guest Allocation
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                Fill guest details, add accompanying members, configure stay duration, and complete allocation.
              </Typography>
            </Box>
          </Box>

          {isVipGuest && (
            <Chip
              icon={<Star sx={{ "&&": { color: "#F59E0B" } }} />}
              label={`VIP Returning Guest (10% Loyalty Discount Applied)`}
              sx={{
                bgcolor: "rgba(245, 158, 11, 0.12)",
                color: "#B45309",
                fontWeight: 800,
                fontSize: "0.78rem",
                border: "1px solid rgba(245, 158, 11, 0.3)",
              }}
            />
          )}
        </Box>

        {/* ========================================================================= */}
        {/* LUXURY STEP-BY-STEP CONNECTED HORIZONTAL STEPPER (EQUAL SEGMENTS & TRACK) */}
        {/* ========================================================================= */}
        <Box sx={{ mb: 2, mt: 0.9, px: { xs: 0.5, sm: 2 }, overflowX: "auto", pb: 1, "&::-webkit-scrollbar": { height: 4 } }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              position: "relative",
              width: "100%",
              minWidth: { xs: 580, sm: "auto" },
            }}
          >
            {/* Background Base Track Line */}
            <Box
              sx={{
                position: "absolute",
                top: { xs: 18, sm: 22 },
                left: { xs: "12%", sm: "12%" },
                right: { xs: "12%", sm: "12%" },
                height: 4,
                bgcolor: "#E2E8F0",
                borderRadius: "10px",
                transform: "translateY(-50%)",
                zIndex: 0,
              }}
            >
              {/* Active Filled Progress Line */}
              <Box
                sx={{
                  height: "100%",
                  width: `${(activeStep / (CHECKIN_STEPS.length - 1)) * 100}%`,
                  background: "linear-gradient(90deg, #10B981 0%, #0B8EE0 100%)",
                  boxShadow: "0 0 10px rgba(16, 185, 129, 0.6)",
                  borderRadius: "10px",
                  transition: "width 0.45s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
              />
            </Box>

            {/* 4 Step Nodes (Equally Spaced with zIndex: 1) */}
            {CHECKIN_STEPS.map((label, index) => {
              const isCompleted = activeStep > index;
              const isCurrent = activeStep === index;

              const stepIcons = [
                <Person key="p" sx={{ fontSize: 20 }} />,
                <AccessTime key="t" sx={{ fontSize: 20 }} />,
                <CreditCard key="c" sx={{ fontSize: 20 }} />,
                <VerifiedUser key="v" sx={{ fontSize: 20 }} />,
              ];

              return (
                <Box
                  key={label}
                  onClick={() => {
                    if (index < activeStep) setActiveStep(index);
                  }}
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    cursor: index < activeStep ? "pointer" : "default",
                    position: "relative",
                    zIndex: 1,
                  }}
                >
                  <Avatar
                    sx={{
                      width: { xs: 36, sm: 44 },
                      height: { xs: 36, sm: 44 },
                      fontSize: { xs: "0.82rem", sm: "0.92rem" },
                      fontWeight: 900,
                      bgcolor: isCompleted
                        ? "#10B981"
                        : isCurrent
                          ? themeConfig.primary
                          : "#FFFFFF",
                      color: isCompleted || isCurrent ? "#FFFFFF" : "#94A3B8",
                      border: isCurrent
                        ? `3px solid #FFFFFF`
                        : isCompleted
                          ? "3px solid #FFFFFF"
                          : "3px solid #E2E8F0",
                      boxShadow: isCurrent
                        ? `0 0 0 4px ${themeConfig.primaryGlow}, 0 6px 16px rgba(11, 142, 224, 0.35)`
                        : isCompleted
                          ? "0 0 0 4px rgba(16, 185, 129, 0.2), 0 4px 12px rgba(16, 185, 129, 0.25)"
                          : "0 2px 6px rgba(0,0,0,0.04)",
                      transition: "all 0.35s cubic-bezier(0.16, 1, 0.3, 1)",
                      transform: isCurrent ? "scale(1.1)" : "scale(1)",
                      mb: 1,
                    }}
                  >
                    {isCompleted ? <Check sx={{ fontSize: { xs: 18, sm: 22 }, fontWeight: 900 }} /> : stepIcons[index]}
                  </Avatar>

                  {/* Step Title & Status */}
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isCurrent ? 900 : isCompleted ? 800 : 700,
                      color: isCurrent
                        ? themeConfig.primary
                        : isCompleted
                          ? "#065F46"
                          : themeConfig.textMuted,
                      fontSize: { xs: "0.70rem", sm: "0.76rem" },
                      textAlign: "center",
                      lineHeight: 1.2,
                      whiteSpace: { xs: "normal", sm: "nowrap" },
                    }}
                  >
                    Step {index + 1}
                  </Typography>

                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: isCurrent ? 800 : 600,
                      color: isCurrent
                        ? themeConfig.textMain
                        : isCompleted
                          ? themeConfig.textMain
                          : themeConfig.textMuted,
                      fontSize: { xs: "0.65rem", sm: "0.72rem" },
                      textAlign: "center",
                      lineHeight: 1.25,
                      mt: 0.3,
                      maxWidth: { xs: 70, sm: 130, md: 150 },
                      display: { xs: isCurrent ? "block" : "none", sm: "block" },
                      wordBreak: "break-word",
                    }}
                  >
                    {label}
                  </Typography>
                </Box>
              );
            })}
          </Box>
        </Box>

        {/* ========================================================================= */}
        {/* STEP 1 (Index 0): PRIMARY GUEST PROFILE, MEMBER PHOTOS & SIGNATURE        */}
        {/* ========================================================================= */}
        {activeStep === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
            {/* GUEST PROFILE CARD */}
            <Paper
              className="card-3d"
              sx={{
                p: { xs: 2, sm: 3 },
                borderRadius: "16px",
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                border: `1.5px solid ${themeConfig.border}`,
                boxShadow: isDarkMode ? "none" : "0 6px 20px rgba(0,0,0,0.03)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2 }}>
                <Avatar sx={{ bgcolor: themeConfig.primary, color: "#FFFFFF", width: 34, height: 34, fontWeight: 900 }}>
                  1
                </Avatar>
                <div>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                    Step 1 — Primary Guest & Check-In Details
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                    Primary guest information, room tariff rate, ID photos, accompanying member photos, and digital signature
                  </Typography>
                </div>
              </Box>

              <Grid container spacing={2}>
                {/* 1. Primary Guest Full Name */}
                <Grid id="field-primary-fullname" size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Primary Guest Full Name *"
                    placeholder="e.g. Rahul Sharma"
                    value={checkInData.fullName || ""}
                    onChange={(e) => {
                      setCheckInData({ ...checkInData, fullName: e.target.value });
                      if (e.target.value.trim()) setFieldErrors((prev) => ({ ...prev, fullName: false }));
                    }}
                    required
                    error={Boolean(fieldErrors.fullName)}
                    helperText={fieldErrors.fullName ? "⚠️ Primary Guest Full Name is required" : ""}
                  />
                </Grid>

                {/* 2. Guest Name (Optional) */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Guest Name (Optional)"
                    placeholder="e.g. Priya Sharma"
                    value={checkInData.guestName || ""}
                    onChange={(e) => setCheckInData({ ...checkInData, guestName: e.target.value })}
                  />
                </Grid>

                {/* 3. WhatsApp Mobile Number */}
                <Grid id="field-primary-mobile" size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="WhatsApp Mobile Number *"
                    placeholder="9876543210"
                    value={checkInData.mobile || ""}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      handlePhoneChange(digits);
                      if (digits.trim()) setFieldErrors((prev) => ({ ...prev, mobile: false }));
                    }}
                    required
                    error={Boolean(fieldErrors.mobile)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <WhatsApp sx={{ color: "#25D366", fontSize: 18, mr: 0.5 }} />
                            <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, mr: 0.5 }}>
                              +91
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                    }}
                    helperText={
                      fieldErrors.mobile ? (
                        <Typography component="span" variant="caption" sx={{ fontSize: "0.68rem", color: "#EF4444", fontWeight: 800 }}>
                          ⚠️ 10-digit WhatsApp Mobile Number is required
                        </Typography>
                      ) : (
                        <Typography component="span" variant="caption" sx={{ fontSize: "0.68rem", color: themeConfig.textMuted }}>
                          📱 Auto-lookup on 10 digits
                        </Typography>
                      )
                    }
                  />
                </Grid>

                {/* 4. Email Address */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Email Address"
                    placeholder="e.g. rahul.sharma@example.com"
                    value={checkInData.email || ""}
                    onChange={(e) => setCheckInData({ ...checkInData, email: e.target.value })}
                  />
                </Grid>
              </Grid>

              {/* MAIN GUEST FRONT & BACK ID PHOTO UPLOAD */}
              <Box
                id="main-guest-id-section"
                sx={{
                  mt: 2.5,
                  pt: 2,
                  p: (fieldErrors.frontImage || (stepError && !checkInData.frontImage)) ? 1.5 : 0,
                  borderRadius: "14px",
                  borderTop: (fieldErrors.frontImage || (stepError && !checkInData.frontImage)) ? "none" : `1px dashed ${themeConfig.border}`,
                  border: (fieldErrors.frontImage || (stepError && !checkInData.frontImage)) ? "2px solid #EF4444" : undefined,
                  bgcolor: (fieldErrors.frontImage || (stepError && !checkInData.frontImage)) ? "rgba(239, 68, 68, 0.04)" : "transparent",
                  transition: "all 0.3s ease",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <CloudUpload sx={{ fontSize: 18, color: themeConfig.primary }} />
                  Primary Guest — ID Card Upload (Front & Back Photo)
                </Typography>

                <Grid container spacing={1.5}>
                  {/* Front ID Upload Box */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "14px",
                        border: `1.5px dashed ${checkInData.frontImage ? "#10B981" : themeConfig.border}`,
                        bgcolor: checkInData.frontImage ? "rgba(16, 185, 129, 0.04)" : "#F8FAFC",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                        📄 Front ID / Aadhaar Photo *
                      </Typography>

                      {checkInData.frontImage ? (
                        <Box sx={{ position: "relative", width: "100%", height: 140, borderRadius: "10px", overflow: "hidden", border: "1px solid #10B981" }}>
                          <Box component="img" src={checkInData.frontImage} alt="Primary Guest Front ID" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <IconButton
                            size="small"
                            onClick={() => setCheckInData((prev) => ({ ...prev, frontImage: "" }))}
                            sx={{ position: "absolute", top: 6, right: 6, bgcolor: "rgba(239,68,68,0.9)", color: "#FFF", "&:hover": { bgcolor: "#DC2626" } }}
                          >
                            <Close sx={{ fontSize: 16 }} />
                          </IconButton>
                          <Chip label="Front Photo Uploaded" size="small" sx={{ position: "absolute", bottom: 6, left: 6, bgcolor: "#10B981", color: "#FFF", fontWeight: 800, fontSize: "0.68rem" }} />
                        </Box>
                      ) : (
                        <Button
                          variant="contained"
                          component="label"
                          startIcon={<CloudUpload />}
                          size="small"
                          sx={{ borderRadius: "10px", fontWeight: 800, bgcolor: themeConfig.primary }}
                        >
                          Upload Front ID
                          <input type="file" hidden accept="image/*" onChange={(e) => handleMainGuestImageUpload(e, "front")} />
                        </Button>
                      )}
                    </Box>
                  </Grid>

                  {/* Back ID Upload Box */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: "14px",
                        border: `1.5px dashed ${checkInData.backImage ? "#10B981" : themeConfig.border}`,
                        bgcolor: checkInData.backImage ? "rgba(16, 185, 129, 0.04)" : "#F8FAFC",
                        textAlign: "center",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                        📄 Back ID / Aadhaar Photo (Optional)
                      </Typography>

                      {checkInData.backImage ? (
                        <Box sx={{ position: "relative", width: "100%", height: 140, borderRadius: "10px", overflow: "hidden", border: "1px solid #10B981" }}>
                          <Box component="img" src={checkInData.backImage} alt="Primary Guest Back ID" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <IconButton
                            size="small"
                            onClick={() => setCheckInData((prev) => ({ ...prev, backImage: "" }))}
                            sx={{ position: "absolute", top: 6, right: 6, bgcolor: "rgba(239,68,68,0.9)", color: "#FFF", "&:hover": { bgcolor: "#DC2626" } }}
                          >
                            <Close sx={{ fontSize: 16 }} />
                          </IconButton>
                          <Chip label="Back Photo Uploaded" size="small" sx={{ position: "absolute", bottom: 6, left: 6, bgcolor: "#10B981", color: "#FFF", fontWeight: 800, fontSize: "0.68rem" }} />
                        </Box>
                      ) : (
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={<CloudUpload />}
                          size="small"
                          sx={{ borderRadius: "10px", fontWeight: 800, borderColor: themeConfig.border }}
                        >
                          Upload Back ID
                          <input type="file" hidden accept="image/*" onChange={(e) => handleMainGuestImageUpload(e, "back")} />
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </Box>

              {/* ACCOMPANYING MEMBER PHOTOS SECTION */}
              <Box sx={{ mt: 3, pt: 2.5, borderTop: `1.5px dashed ${themeConfig.border}` }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                    <Avatar sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, width: 34, height: 34, fontWeight: 900 }}>
                      <Group sx={{ fontSize: 20 }} />
                    </Avatar>
                    <div>
                      <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                        Accompanying Member Documents ({checkInData.accompanyingGuests?.length || 0})
                      </Typography>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                        Upload ID photos for additional accompanying guests
                      </Typography>
                    </div>
                  </Box>

                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    {checkInData.accompanyingGuests && checkInData.accompanyingGuests.length > 0 && (
                      <Button
                        variant="text"
                        size="small"
                        onClick={handleClearAllMemberDocs}
                        sx={{ color: "#EF4444", fontWeight: 800, fontSize: "0.75rem", textTransform: "none" }}
                      >
                        Clear All ({checkInData.accompanyingGuests.length})
                      </Button>
                    )}

                    <Button
                      variant="contained"
                      component="label"
                      startIcon={<CloudUpload />}
                      size="small"
                      sx={{
                        borderRadius: "10px",
                        fontWeight: 800,
                        bgcolor: themeConfig.primary,
                        color: "#FFFFFF",
                        px: 2,
                        py: 0.8,
                        boxShadow: `0 4px 12px ${themeConfig.primaryGlow}`,
                        "&:hover": { bgcolor: themeConfig.primaryDark },
                      }}
                    >
                      + Upload Member Documents
                      <input
                        type="file"
                        hidden
                        multiple
                        accept="image/*"
                        onChange={handleAddNewMemberWithFiles}
                      />
                    </Button>
                  </Box>
                </Box>

                {/* Direct Image Gallery Grid (Without Outer Member Card Boxes) */}
                {checkInData.accompanyingGuests && checkInData.accompanyingGuests.length > 0 ? (
                  <Grid container spacing={1.5}>
                    {checkInData.accompanyingGuests.map((member, index) => {
                      const imgSrc = member.frontImage || (member.images && member.images[0]) || "";
                      return (
                        <Grid key={member.id || index} size={{ xs: 6, sm: 4, md: 3 }}>
                          <Paper
                            className="card-3d"
                            sx={{
                              position: "relative",
                              borderRadius: "12px",
                              overflow: "hidden",
                              border: "1.5px solid #10B981",
                              bgcolor: "#FFFFFF",
                              boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                              transition: "all 0.25s ease",
                              "&:hover": { transform: "translateY(-2px)", boxShadow: "0 6px 16px rgba(16, 185, 129, 0.2)" },
                            }}
                          >
                            {/* Image Preview */}
                            <Box sx={{ width: "100%", height: 110, bgcolor: "#F8FAFC", position: "relative" }}>
                              {imgSrc ? (
                                <Box
                                  component="img"
                                  src={imgSrc}
                                  alt={`Member Document #${index + 1}`}
                                  sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />
                              ) : (
                                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                                  <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>No Preview</Typography>
                                </Box>
                              )}

                              {/* Delete Button at top right */}
                              <IconButton
                                size="small"
                                onClick={() => handleRemoveSingleMemberDoc(member.id)}
                                sx={{
                                  position: "absolute",
                                  top: 5,
                                  right: 5,
                                  bgcolor: "rgba(239, 68, 68, 0.92)",
                                  color: "#FFFFFF",
                                  p: 0.4,
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.25)",
                                  "&:hover": { bgcolor: "#DC2626", transform: "scale(1.1)" },
                                }}
                              >
                                <Close sx={{ fontSize: 15 }} />
                              </IconButton>

                              {/* Document Badge at bottom left */}
                              <Chip
                                label={`Doc #${index + 1}`}
                                size="small"
                                sx={{
                                  position: "absolute",
                                  bottom: 6,
                                  left: 6,
                                  bgcolor: "rgba(16, 185, 129, 0.92)",
                                  color: "#FFFFFF",
                                  fontWeight: 900,
                                  fontSize: "0.68rem",
                                  height: 20,
                                  px: 0.5,
                                  boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
                                }}
                              />
                            </Box>
                          </Paper>
                        </Grid>
                      );
                    })}
                  </Grid>
                ) : (
                  <Box
                    sx={{
                      p: 2.5,
                      textAlign: "center",
                      borderRadius: "14px",
                      border: `1.5px dashed ${themeConfig.border}`,
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                    }}
                  >
                    <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      📁 No member documents uploaded yet.
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", mt: 0.5 }}>
                      Click <strong>"+ Upload Member Documents"</strong> above to select multiple photos at once.
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* DIGITAL SIGNATURE PAD SECTION */}
              <Box sx={{ mt: 3, pt: 2.5, borderTop: `1.5px dashed ${themeConfig.border}` }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <Draw sx={{ fontSize: 18, color: themeConfig.primary }} />
                  Guest Digital Signature
                </Typography>
                <DigitalSignaturePad
                  signature={checkInData.signature}
                  onSave={(sig) => setCheckInData((prev) => ({ ...prev, signature: sig }))}
                  onClear={() => setCheckInData((prev) => ({ ...prev, signature: "" }))}
                />
              </Box>
            </Paper>
          </Box>
        )}

        {/* ========================================================================= */}
        {/* STEP 2 (Index 1): STAY DURATION & TIMINGS SCHEDULE                        */}
        {/* ========================================================================= */}
        {activeStep === 1 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            {/* Section 1: Stay Timings & Schedule */}
            <Paper
              className="card-3d"
              sx={{
                p: 3,
                borderRadius: "20px",
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                border: `1.5px solid ${themeConfig.border}`,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Avatar sx={{ bgcolor: themeConfig.primary, color: "#FFFFFF", width: 34, height: 34 }}>
                    <AccessTime sx={{ fontSize: 20 }} />
                  </Avatar>
                  <div>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                      Stay Duration & Timings Schedule
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                      Check-Out Time: {formatTime12Hour(checkInData.checkOutTime || hotelSettings?.checkOutTime || "12:00")}
                    </Typography>
                  </div>
                </Box>

                <Chip
                  label={`Stay: ${checkInData.numberOfNights || nights || 1} Night(s)`}
                  size="small"
                  sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, fontWeight: 800 }}
                />
              </Box>

              {/* 📅 Clear view of already reserved dates for the selected room(s) */}
              {allExistingBookingsForSelectedRooms.length > 0 && (
                <Box
                  sx={{
                    p: 1.5,
                    mb: 2.5,
                    borderRadius: "12px",
                    bgcolor: isDarkMode ? "rgba(217, 119, 6, 0.12)" : "rgba(245, 158, 11, 0.1)",
                    border: "1.5px solid rgba(217, 119, 6, 0.35)",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8 }}>
                    <EventBusy sx={{ color: "#D97706", fontSize: 18 }} />
                    <Typography variant="caption" sx={{ fontWeight: 900, color: "#D97706", textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Existing Reservations for Selected Room(s):
                    </Typography>
                  </Box>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                    {allExistingBookingsForSelectedRooms.map((eb, idx) => {
                      const isConflict = isStayOverlapping(
                        checkInData.checkInDate || getTodayLocalDate(),
                        checkInData.checkOutDate,
                        eb.checkInDate,
                        eb.checkOutDate
                      );
                      return (
                        <Chip
                          key={idx}
                          size="small"
                          label={`Room #${eb.roomNumber}: ${formatDisplayDate(eb.checkInDate)} to ${formatDisplayDate(eb.checkOutDate)} (${eb.guestName})`}
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.74rem",
                            bgcolor: isConflict ? "#DC2626" : "rgba(217, 119, 6, 0.18)",
                            color: isConflict ? "#FFFFFF" : "#B45309",
                            border: `1px solid ${isConflict ? "#B91C1C" : "rgba(217, 119, 6, 0.4)"}`,
                          }}
                        />
                      );
                    })}
                  </Box>
                </Box>
              )}

              <Grid container spacing={2}>
                {/* Check-In Date (Today - DD-MM-YYYY) */}
                <Grid size={{ xs: 12, sm: 2.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Check-In Date (Today)"
                    value={formatDDMMYYYY(getTodayLocalDate())}
                    slotProps={{
                      input: {
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarMonth sx={{ fontSize: 18, color: themeConfig.primary }} />
                          </InputAdornment>
                        ),
                      },
                      inputLabel: { shrink: true },
                    }}
                    error={conflictingRooms.length > 0}
                    helperText={conflictingRooms.length > 0 ? "⚠️ Room is already occupied!" : "Instant Check-In Today"}
                  />
                </Grid>

                {/* Check-In Time (12-Hour AM/PM) */}
                <Grid size={{ xs: 12, sm: 2.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={checkInData.isCustomCheckInTime ? "Check-In Time (12h)" : "Check-In Time (Live 12h)"}
                    value={formatTime12Hour(checkInData.isCustomCheckInTime ? checkInData.checkInTime : liveTime)}
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        readOnly: true,
                        startAdornment: (
                          <InputAdornment position="start">
                            <AccessTime sx={{ fontSize: 18, color: themeConfig.primary }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Reset to live ticking clock">
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCheckInData({ ...checkInData, checkInTime: getCurrentLocalTime(), isCustomCheckInTime: false });
                                }}
                              >
                                <Refresh sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                {/* Number of Nights */}
                <Grid size={{ xs: 6, sm: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nights Count"
                    type="number"
                    slotProps={{ htmlInput: { min: 1 } }}
                    placeholder="1"
                    value={checkInData.numberOfNights ?? 1}
                    onChange={(e) => handleNightsChange(e.target.value)}
                  />
                </Grid>

                {/* Check-Out Date */}
                <Grid size={{ xs: 6, sm: 2.5 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Check-Out Date"
                    type="date"
                    error={conflictingRooms.length > 0}
                    value={checkInData.checkOutDate || ""}
                    onChange={(e) => handleCheckOutDateChange(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    helperText={
                      conflictingRooms.length > 0
                        ? "⚠️ Overlaps with booked stay"
                        : `Out: ${formatDDMMYYYY(checkInData.checkOutDate)} (${formatTime12Hour(checkInData.checkOutTime || hotelSettings?.checkOutTime || "12:00")})`
                    }
                  />
                </Grid>

                {/* Check-Out Time (12-Hour Select) */}
                <Grid size={{ xs: 12, sm: 2.5 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel shrink>Check-Out Time (12h)</InputLabel>
                    <Select
                      value={formatTime12Hour(checkInData.checkOutTime || hotelSettings?.checkOutTime || "12:00")}
                      onChange={(e) => {
                        const time24 = formatTime24Hour(e.target.value);
                        setCheckInData({ ...checkInData, checkOutTime: time24 });
                      }}
                      label="Check-Out Time (12h)"
                      notched
                      startAdornment={
                        <InputAdornment position="start" sx={{ ml: 0.5 }}>
                          <AccessTime sx={{ fontSize: 18, color: themeConfig.primary }} />
                        </InputAdornment>
                      }
                    >
                      {[
                        "08:00 AM", "09:00 AM", "10:00 AM", "11:00 AM", "11:30 AM",
                        "12:00 PM", "12:30 PM", "01:00 PM", "01:30 PM", "02:00 PM",
                        "02:30 PM", "03:00 PM", "03:30 PM", "04:00 PM", "05:00 PM",
                        "06:00 PM", "07:00 PM", "08:00 PM", "09:00 PM", "10:00 PM", "11:00 PM"
                      ].map((t12) => (
                        <MenuItem key={t12} value={t12}>
                          {t12}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </Paper>

            {/* Section 2: Room Allocation Overview & Date Conflict Guard */}
            <Paper
              id="room-selection-section"
              className="card-3d"
              sx={{
                p: 3,
                borderRadius: "20px",
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                border: `1.5px solid ${conflictingRooms.length > 0 ? "#EF4444" : themeConfig.border}`,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Avatar sx={{ bgcolor: conflictingRooms.length > 0 ? "#DC2626" : themeConfig.primary, color: "#FFFFFF", width: 34, height: 34 }}>
                    <MeetingRoom sx={{ fontSize: 20 }} />
                  </Avatar>
                  <div>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: conflictingRooms.length > 0 ? "#DC2626" : themeConfig.textMain }}>
                      Allocated Room(s) & Availability Status
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                      Stay Period: <strong>{formatDisplayDate(checkInData.checkInDate || getTodayLocalDate())}</strong> to <strong>{formatDisplayDate(checkInData.checkOutDate)}</strong> &bull; Total Selected Capacity: {totalRoomCapacity} Guests
                    </Typography>
                  </div>
                </Box>
              </Box>

              {/* ⚠️ Prominent Warning if Room is Already Reserved for Selected Dates */}
              {conflictingRooms.length > 0 && (
                <Paper
                  sx={{
                    p: 2,
                    mb: 2.5,
                    borderRadius: "14px",
                    bgcolor: "rgba(239, 68, 68, 0.08)",
                    border: "1.5px solid #EF4444",
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                    <Warning sx={{ color: "#DC2626", fontSize: 26, mt: 0.2 }} />
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 900, color: "#DC2626", fontSize: "0.95rem" }}>
                        ⚠️ Room Date Conflict Detected!
                      </Typography>
                      {conflictingRooms.map((cr, idx) => {
                        const conflict = getRoomConflict(cr);
                        return (
                          <Typography key={idx} variant="body2" sx={{ color: themeConfig.textMain, mt: 0.5, fontWeight: 700 }}>
                            &bull; <strong>Room #{cr.roomNumber}</strong> is already booked from{" "}
                            <span style={{ color: "#DC2626", fontWeight: 900 }}>
                              {formatDisplayDate(conflict?.checkInDate)} to {formatDisplayDate(conflict?.checkOutDate)}
                            </span>{" "}
                            by <strong>{conflict?.guest?.fullName || conflict?.guestName || "another guest"}</strong> (Booking #{conflict?.bookingNumber}).
                          </Typography>
                        );
                      })}
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", mt: 1, fontWeight: 600 }}>
                        Please select alternative stay dates or click below to switch to an available room:
                      </Typography>

                      {/* 1-Click Available Room Alternatives */}
                      <Box sx={{ mt: 1.5, display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
                        {availableRooms.length > 0 ? (
                          availableRooms.map((ar) => (
                            <Button
                              key={ar._id}
                              size="small"
                              variant="contained"
                              onClick={() => handleSwitchSingleRoom(ar._id)}
                              sx={{
                                borderRadius: "10px",
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                bgcolor: "#10B981",
                                color: "#FFFFFF",
                                "&:hover": { bgcolor: "#059669" },
                              }}
                            >
                              ✓ Switch to Room #{ar.roomNumber} ({getRoomCategoryName(ar)})
                            </Button>
                          ))
                        ) : (
                          <Typography variant="caption" sx={{ color: "#DC2626", fontWeight: 800 }}>
                            No other rooms available for these exact dates. Please modify stay dates.
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  </Box>
                </Paper>
              )}

              <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
                {selectedRoomsList.map((r) => {
                  const cap = getRoomMaxCapacity(r);
                  const catName = getRoomCategoryName(r);
                  const isActive = String(r._id) === String(activeRoomId);
                  const conflict = getRoomConflict(r);
                  const isConflict = Boolean(conflict);

                  return (
                    <Chip
                      key={String(r._id || r.roomNumber)}
                      clickable
                      onClick={() => {
                        setCheckInData((prev) => ({
                          ...prev,
                          activeRoomId: String(r._id),
                        }));
                      }}
                      icon={
                        <MeetingRoom
                          sx={{
                            fontSize: "16px !important",
                            color: isConflict ? "#DC2626 !important" : isActive ? "#FFFFFF !important" : "inherit",
                          }}
                        />
                      }
                      label={
                        isConflict
                          ? `Room #${r.roomNumber} • 🔴 Booked (${formatDisplayDate(conflict.checkInDate)} - ${formatDisplayDate(conflict.checkOutDate)})`
                          : `Room #${r.roomNumber} (${catName}) • Capacity: ${cap} Guest(s)${isActive ? " (Active)" : ""}`
                      }
                      sx={{
                        fontWeight: 800,
                        fontSize: "0.82rem",
                        p: 1.5,
                        bgcolor: isConflict
                          ? "rgba(239, 68, 68, 0.12)"
                          : isActive
                            ? themeConfig.primary
                            : (isDarkMode ? "rgba(255,255,255,0.08)" : "#F1F5F9"),
                        color: isConflict ? "#DC2626" : isActive ? "#FFFFFF" : themeConfig.textMain,
                        borderRadius: "12px",
                        border: `1.5px solid ${isConflict ? "#EF4444" : isActive ? themeConfig.primary : themeConfig.border}`,
                      }}
                    />
                  );
                })}
              </Box>
            </Paper>
          </Box>
        )}

        {/* ========================================================================= */}
        {/* STEP 3 (Index 2): BILLING & PAYMENT SETTLEMENT                            */}
        {/* ========================================================================= */}
        {activeStep === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            <Paper
              id="payment-advance-section"
              className="card-3d"
              sx={{
                p: 3,
                borderRadius: "20px",
                bgcolor: "#FFFFFF",
                border: `1.5px solid ${themeConfig.border}`,
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2.5 }}>
                <Avatar sx={{ bgcolor: themeConfig.primary, color: "#FFFFFF", width: 34, height: 34 }}>
                  <CreditCard sx={{ fontSize: 20 }} />
                </Avatar>
                <div>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                    Tariff Calculation & Advance Settlement
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                    Set nightly room rate, apply discounts, security deposit, and record initial payment
                  </Typography>
                </div>
              </Box>

              {/* Billing Breakdown Table */}
              <TableContainer sx={{ mb: 3, borderRadius: "14px", border: `1px solid ${themeConfig.border}`, overflowX: "auto" }}>
                <Table size="small" sx={{ minWidth: 550 }}>
                  <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Description</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Details</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, whiteSpace: "nowrap" }}>Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Base Taxable Room Tariff ({selectedRoomsList.map((r) => `#${r.roomNumber}`).join(", ") || checkInData.roomNumber})
                      </TableCell>
                      <TableCell align="right">
                        {checkInData.numberOfNights || nights || 1} Night(s) Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        ₹{baseTariffTotal.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>

                    {gstBookingResult.roomBreakdowns && gstBookingResult.roomBreakdowns.map((rb, idx) => (
                      <TableRow key={idx} sx={{ bgcolor: "rgba(15, 118, 110, 0.03)" }}>
                        <TableCell sx={{ pl: 3 }}>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.primary }}>
                            🏨 Room #{rb.roomNumber} ({rb.roomTypeName})
                          </Typography>
                        </TableCell>
                        <TableCell align="right">
                          <Chip
                            label={`Base ₹${rb.taxableAmount.toLocaleString("en-IN")} + GST ${rb.gstRate}% (CGST ${rb.cgstRate}% + SGST ${rb.sgstRate}%)`}
                            size="small"
                            sx={{ height: "auto", py: 0.3, px: 0.5, fontSize: "0.68rem", fontWeight: 800, "& .MuiChip-label": { whiteSpace: "normal", wordBreak: "break-word" } }}
                          />
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#D97706" }}>
                          +₹{rb.gstAmount.toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    ))}

                    {totalGstAmount > 0 && (
                      <TableRow sx={{ bgcolor: "rgba(217, 119, 6, 0.06)" }}>
                        <TableCell sx={{ fontWeight: 800, color: "#D97706" }}>
                          Total Applicable Tax (CGST + SGST)
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, color: "#D97706" }}>
                          CGST ₹{totalCgstAmount.toLocaleString("en-IN")} + SGST ₹{totalSgstAmount.toLocaleString("en-IN")}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 900, color: "#D97706" }}>
                          +₹{totalGstAmount.toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    )}

                    {isVipGuest && (
                      <TableRow sx={{ bgcolor: "rgba(245, 158, 11, 0.08)" }}>
                        <TableCell sx={{ fontWeight: 800, color: "#B45309" }}>
                          ⭐ VIP Returning Guest Loyalty Discount (10%)
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#B45309", fontWeight: 700 }}>
                          10% Off
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#B45309" }}>
                          -₹{vipDiscountAmount.toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    )}

                    {checkInData.collectSecurityDeposit && (
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Refundable Security Deposit
                        </TableCell>
                        <TableCell align="right">Refunded at Checkout</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800 }}>
                          +₹{(Number(checkInData.securityDepositAmount) || 1000).toLocaleString("en-IN")}
                        </TableCell>
                      </TableRow>
                    )}

                    <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                      <TableCell sx={{ fontWeight: 900, fontSize: "1rem" }}>
                        Net Payable Total (Base + Tax)
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        All Taxes & Fees Included
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, fontSize: "1.1rem", color: themeConfig.primary }}>
                        ₹{calculatedGrandTotal.toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Adjustments & Inputs */}
              <Grid container spacing={2}>
                {/* Custom Nightly Rate Override */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nightly Tariff Rate (₹)"
                    placeholder="e.g. 3500"
                    value={checkInData.rate ?? 3000}
                    onChange={(e) => {
                      const newRate = Number(e.target.value) || 0;
                      setCheckInData({
                        ...checkInData,
                        rate: newRate,
                        isPaidManuallyEdited: false,
                      });
                    }}
                  />
                </Grid>

                {/* Custom Discount */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Special Discount (₹)"
                    placeholder="e.g. 500"
                    value={checkInData.discountAmount ?? 0}
                    onChange={(e) => {
                      const disc = Number(e.target.value) || 0;
                      setCheckInData({
                        ...checkInData,
                        discountAmount: disc,
                        isPaidManuallyEdited: false,
                      });
                    }}
                  />
                </Grid>

                {/* Payment Method */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Payment Method"
                    value={checkInData.paymentMethod || "UPI"}
                    onChange={(e) => setCheckInData({ ...checkInData, paymentMethod: e.target.value })}
                  >
                    <MenuItem value="UPI">UPI / QR Code (PhonePe/GPay)</MenuItem>
                    <MenuItem value="CASH">Cash at Front Desk</MenuItem>
                    <MenuItem value="CARD">Credit / Debit Card (POS)</MenuItem>
                    <MenuItem value="NET_BANKING">Net Banking / NEFT</MenuItem>
                  </TextField>
                </Grid>

                {/* Transaction Reference / Note */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Transaction ID / Payment Note"
                    placeholder="e.g. UPI Ref #402918482"
                    value={checkInData.transactionId || ""}
                    onChange={(e) => setCheckInData({ ...checkInData, transactionId: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Paper>
          </Box>
        )}

        {/* ========================================================================= */}
        {/* STEP 4 (Index 3): PREVIEW & FINAL CHECK-IN CONFIRMATION                   */}
        {/* ========================================================================= */}
        {activeStep === 3 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            <Paper
              className="card-3d"
              sx={{
                p: 3.5,
                borderRadius: "20px",
                bgcolor: "#FFFFFF",
                border: `1.5px solid ${themeConfig.border}`,
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: { xs: "flex-start", sm: "center" }, flexDirection: { xs: "column", sm: "row" }, gap: 1.5, mb: 3, pb: 2, borderBottom: `2px solid ${themeConfig.primary}` }}>
                <div>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                    Folio Pre-Checkin Summary & Registry Review
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                    Verify primary guest, accompanying members, stay schedule, room allocation, and settlement details
                  </Typography>
                </div>
                <Chip
                  label="Ready for Check-In"
                  color="success"
                  sx={{ fontWeight: 900 }}
                />
              </Box>

              {/* 1. Primary Guest Details */}
              <Box sx={{ mb: 3, p: 2, borderRadius: "14px", bgcolor: themeConfig.champagne }}>
                <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.primaryDark, textTransform: "uppercase", display: "block", mb: 1 }}>
                  Primary / Main Guest Folio Holder:
                </Typography>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Full Name:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                      {checkInData.fullName || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>WhatsApp Number:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 0.5 }}>
                      <WhatsApp sx={{ color: "#25D366", fontSize: 16 }} />
                      {checkInData.mobile ? `+91 ${checkInData.mobile}` : "N/A"}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* 2. Uploaded Document Verification */}
              {checkInData.accompanyingGuests && checkInData.accompanyingGuests.length > 0 && (
                <Paper sx={{ mb: 3, p: 2, borderRadius: "14px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.02)" : "#FFFFFF" }}>
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                      <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.15)", color: "#10B981", width: 38, height: 38 }}>
                        <CheckCircle sx={{ fontSize: 22 }} />
                      </Avatar>
                      <div>
                        <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                          Uploaded Member Documents & ID Verification
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                          {checkInData.accompanyingGuests.length} Document Photo(s) Attached & Verified
                        </Typography>
                      </div>
                    </Box>

                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      {checkInData.accompanyingGuests.map((m, idx) => {
                        const imgSrc = m.frontImage || (m.images && m.images[0]) || "";
                        return (
                          <Chip
                            key={m.id || idx}
                            icon={<Visibility sx={{ fontSize: "14px !important" }} />}
                            label={`Doc #${idx + 1}`}
                            size="small"
                            clickable
                            onClick={() => setPreviewImageSrc(imgSrc)}
                            sx={{
                              bgcolor: "rgba(11, 142, 224, 0.12)",
                              color: "#0B8EE0",
                              fontWeight: 800,
                              fontSize: "0.72rem",
                              height: 26,
                              "&:hover": { bgcolor: "rgba(11, 142, 224, 0.22)" },
                            }}
                          />
                        );
                      })}
                      <Chip
                        icon={<CheckCircle sx={{ fontSize: "14px !important", color: "#10B981 !important" }} />}
                        label="Verified"
                        size="small"
                        sx={{ bgcolor: "rgba(16, 185, 129, 0.15)", color: "#10B981", fontWeight: 900, fontSize: "0.72rem", height: 26 }}
                      />
                    </Box>
                  </Box>
                </Paper>
              )}

              {/* 3. Stay & Room Allocation Details */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper sx={{ p: 2, borderRadius: "14px", border: `1px solid ${themeConfig.border}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.primaryDark, textTransform: "uppercase", display: "block", mb: 0.8 }}>
                      Stay Schedule:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      In: {formatDDMMYYYY(checkInData.checkInDate || getTodayLocalDate())} &bull; {formatTime12Hour(checkInData.checkInTime || liveTime)}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      Out: {formatDDMMYYYY(checkInData.checkOutDate)} &bull; {formatTime12Hour(checkInData.checkOutTime || hotelSettings?.checkOutTime || "12:00")}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Duration: {checkInData.numberOfNights || nights || 1} Night(s)
                    </Typography>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper sx={{ p: 2, borderRadius: "14px", border: `1px solid ${themeConfig.border}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.primaryDark, textTransform: "uppercase", display: "block", mb: 0.8 }}>
                      Room Allocation:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                      Room {selectedRoomsList.map((r) => `#${r.roomNumber}`).join(", ") || checkInData.roomNumber}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, display: "block" }}>
                      Category: {selectedRoomsList.map((r) => getRoomCategoryName(r)).join(", ") || checkInData.roomType || "Standard Room"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Party: {totalPartySize} Guest(s) (1 Primary + {currentMembersCount} Member{currentMembersCount !== 1 ? "s" : ""})
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* 4. Payment Settlement Summary */}
              <Box sx={{ p: 2, borderRadius: "14px", bgcolor: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
                  <div>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 800, textTransform: "uppercase" }}>
                      Total Amount (Grand Total):
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.primaryDark }}>
                      ₹{calculatedGrandTotal.toLocaleString()}
                    </Typography>
                  </div>

                  <div>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 800, textTransform: "uppercase" }}>
                      Amount Paid ({checkInData.paymentMethod || "UPI"}):
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: "#10B981" }}>
                      ₹{(checkInData.paid ?? calculatedGrandTotal).toLocaleString()}
                    </Typography>
                  </div>

                  <div>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 800, textTransform: "uppercase" }}>
                      Balance Due:
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: Math.max(0, calculatedGrandTotal - (checkInData.paid ?? calculatedGrandTotal)) > 0 ? themeConfig.danger : "#10B981" }}>
                      ₹{Math.max(0, calculatedGrandTotal - (checkInData.paid ?? calculatedGrandTotal)).toLocaleString()}
                    </Typography>
                  </div>
                </Box>

                {/* Auto-filled 100% Advance Settlement & GST breakdown alert as requested */}
                <Box sx={{ p: 1.2, borderRadius: "10px", bgcolor: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.35)", display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircle sx={{ color: "#10B981", fontSize: 18, flexShrink: 0 }} />
                  <Typography variant="caption" sx={{ fontWeight: 900, color: "#065F46" }}>
                    ✅ Paid in Full — 100% Advance Settlement Auto-Filled (Includes CGST {totalCgstAmount > 0 ? "9%" : "0%"} + SGST {totalSgstAmount > 0 ? "9%" : "0%"} GST Tax)
                  </Typography>
                </Box>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Wizard Footer Navigation Controls */}
        <Box
          sx={{
            display: "flex",
            justify: "space-between",
            alignItems: "center",
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: 2,
            mt: 4,
            pt: 3,
            borderTop: `1px solid ${themeConfig.border}`,
          }}
        >
          <Button
            fullWidth={false}
            variant="outlined"
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack />}
            sx={{
              borderRadius: "12px",
              fontWeight: 800,
              px: 3,
              py: 1,
              borderColor: themeConfig.border,
              color: themeConfig.textMain,
              width: { xs: "100%", sm: "auto" },
            }}
          >
            {activeStep === 1
              ? "Back to Guest Profile & ID"
              : activeStep === 2
                ? "Back to Stay Schedule"
                : activeStep === 3
                  ? "Back to Billing & Settlement"
                  : "Back"}
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "stretch", sm: "flex-end" } }}>
            {activeStep === 0 && !checkInData.frontImage && (
              <Chip
                label="Primary ID Upload Required"
                size="small"
                sx={{
                  bgcolor: "#FEF2F2",
                  color: "#DC2626",
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  border: "1px solid #FCA5A5",
                  display: { xs: "none", sm: "inline-flex" },
                }}
              />
            )}

            {activeStep < CHECKIN_STEPS.length - 1 ? (
              <Button
                fullWidth
                variant="contained"
                onClick={handleNext}
                endIcon={<ArrowForward />}
                className="btn-3d"
                sx={{
                  background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                  color: "#FFFFFF",
                  fontWeight: 900,
                  borderRadius: "12px",
                  px: { xs: 2.5, sm: 3.5 },
                  py: 1.1,
                  boxShadow: `0 6px 16px ${themeConfig.primaryGlow}`,
                  width: { xs: "100%", sm: "auto" },
                }}
              >
                {activeStep === 0
                  ? "Continue to Stay Schedule"
                  : activeStep === 1
                    ? "Continue to Billing & Settlement"
                    : "Continue to Review & Check-In"}
              </Button>
            ) : (
              <Button
                fullWidth
                variant="contained"
                onClick={onFinalCheckIn}
                startIcon={<CheckCircle />}
                className="btn-3d"
                sx={{
                  background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
                  color: "#FFFFFF",
                  fontWeight: 900,
                  borderRadius: "12px",
                  px: { xs: 3, sm: 4 },
                  py: 1.2,
                  fontSize: "0.95rem",
                  boxShadow: "0 8px 24px rgba(16, 185, 129, 0.35)",
                  width: { xs: "100%", sm: "auto" },
                  "&:hover": {
                    background: "linear-gradient(135deg, #059669 0%, #047857 100%)",
                  },
                }}
              >
                Confirm & Complete Check-In
              </Button>
            )}
          </Box>
        </Box>
      </Card>

      {/* Image Preview Modal */}
      <Dialog open={Boolean(previewImageSrc)} onClose={() => setPreviewImageSrc(null)} maxWidth="md">
        <Box sx={{ position: "relative", p: 2, bgcolor: "#000", textAlign: "center", minWidth: 320 }}>
          <IconButton
            onClick={() => setPreviewImageSrc(null)}
            sx={{ position: "absolute", top: 8, right: 8, color: "#FFF", bgcolor: "rgba(255,255,255,0.25)", "&:hover": { bgcolor: "rgba(255,255,255,0.4)" } }}
          >
            <Close />
          </IconButton>
          {previewImageSrc && (
            <Box
              component="img"
              src={previewImageSrc}
              alt="Document Preview"
              sx={{ maxWidth: "100%", maxHeight: "80vh", objectFit: "contain", borderRadius: "8px", mt: 3 }}
            />
          )}
        </Box>
      </Dialog>
    </Box>
  );
}
