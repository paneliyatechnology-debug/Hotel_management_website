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
  CircularProgress,
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
  CalendarMonth,
  Visibility,
} from "@/shared/icons";
import dynamic from "next/dynamic";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { formatTime12Hour, formatTime24Hour } from "@/shared/utils/timeUtils";
import { getAmenityIcon } from "@/shared/utils/amenityUtils";
import { apiRequest, API_ENDPOINTS } from "@/config/api";
import { paymentMethodLabel, useHotelPaymentMethods } from "@/shared/hooks/useHotelPaymentMethods";

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
  isCheckInSubmitting = false,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const { methods: hotelPaymentMethods, defaultName: defaultPaymentMethod } = useHotelPaymentMethods();

  // Keep the selected method on the hotel list so booking sends a valid payment_method name
  useEffect(() => {
    if (!hotelPaymentMethods.length) return;
    setCheckInData((prev) => {
      const current = String(prev.paymentMethod || "").trim();
      const match = hotelPaymentMethods.find((item) => item.name.toLowerCase() === current.toLowerCase());
      const next = match?.name || defaultPaymentMethod;
      return next === prev.paymentMethod ? prev : { ...prev, paymentMethod: next };
    });
  }, [hotelPaymentMethods, defaultPaymentMethod, setCheckInData]);
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
      // Exclude occupied, maintenance, blocked, inactive, or unavailable rooms
      if (
        r.status === "OCCUPIED" ||
        r.status === "MAINTENANCE" ||
        r.status === "BLOCKED" ||
        r.status === "OUT_OF_ORDER" ||
        r.isActive === false ||
        r.isAvailable === false ||
        r.isAvailableForDates === false
      ) {
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

  // Unified list of primary guest ID documents
  const mainGuestDocs = useMemo(() => {
    if (Array.isArray(checkInData.idImages) && checkInData.idImages.length > 0) {
      return checkInData.idImages;
    }
    const fallback = [];
    if (checkInData.frontImage) fallback.push(checkInData.frontImage);
    if (checkInData.backImage && !fallback.includes(checkInData.backImage)) fallback.push(checkInData.backImage);
    return fallback;
  }, [checkInData.idImages, checkInData.frontImage, checkInData.backImage]);

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
      const typeKey = room.roomTypeId || room.room_type_id || room.roomType;
      const found = roomTypes.find(
        (t) => String(t._id) === String(typeKey) || String(t.id) === String(typeKey)
      );
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

  // Helper to extract room nightly tariff (per room — never the combined multi-room rate)
  const getRoomTariff = (room) => {
    if (!room) return 0;
    const rt = getRoomTypeObj(room);
    const raw =
      room.customPricePerNight ??
      room.custom_price_per_night ??
      rt?.basePrice ??
      rt?.base_price ??
      room.basePrice ??
      room.base_price ??
      room.pricePerNight ??
      room.price_per_night ??
      0;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? n : 0;
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

  const roomMatchesId = (room, id) => {
    const target = String(id);
    return String(room?._id) === target || String(room?.id) === target;
  };

  const selectedRoomsList = (() => {
    // 1. Match by selected roomIds (prefer live rooms list so tariffs stay current)
    if (selectedRoomIds.length > 0) {
      const matched = rooms.filter((r) => selectedRoomIds.some((id) => roomMatchesId(r, id)));
      if (matched.length === selectedRoomIds.length) return matched;
      // Fall back to selectedRooms objects when some ids are not in the live list yet
      if (Array.isArray(checkInData.selectedRooms) && checkInData.selectedRooms.length > 0) {
        const fromSelection = selectedRoomIds
          .map((id) =>
            rooms.find((r) => roomMatchesId(r, id)) ||
            checkInData.selectedRooms.find((r) => roomMatchesId(r, id) || String(r) === id)
          )
          .filter(Boolean);
        if (fromSelection.length > 0) return fromSelection;
      }
      if (matched.length > 0) return matched;
    }

    // 2. Match by selectedRooms array
    if (Array.isArray(checkInData.selectedRooms) && checkInData.selectedRooms.length > 0) {
      const matched = checkInData.selectedRooms
        .map((sr) => rooms.find((r) => roomMatchesId(r, sr._id || sr.id)) || sr)
        .filter(Boolean);
      if (matched.length > 0) return matched;
    }

    // 3. Match by room number strings (filtered by target category if specified)
    const rawNumbers = checkInData.selectedRoomNumbers || (checkInData.roomNumber ? String(checkInData.roomNumber).split(",").map((s) => s.trim()) : []);
    if (rawNumbers.length > 0) {
      const reqCategory = checkInData.roomTypeId || checkInData.roomType;
      let matched = rooms.filter((r) => {
        const numMatch = rawNumbers.includes(String(r.roomNumber));
        if (!numMatch) return false;
        if (!reqCategory) return true;
        const rt = getRoomTypeObj(r);
        return (
          String(r.roomType) === String(reqCategory) ||
          String(rt?._id) === String(reqCategory) ||
          (rt?.name && rt.name.toLowerCase() === String(reqCategory).toLowerCase()) ||
          (r.category && r.category.toLowerCase() === String(reqCategory).toLowerCase())
        );
      });
      // Prefer AVAILABLE rooms over OCCUPIED rooms when multiple rooms share same number across categories
      if (matched.length > 1) {
        const availMatched = matched.filter((r) => r.status === "AVAILABLE");
        if (availMatched.length > 0) matched = availMatched;
      }
      if (matched.length > 0) return matched;
    }

    // 4. Match by selected category (roomType / roomTypeId)
    const reqCategory = checkInData.roomTypeId || checkInData.roomType;
    if (reqCategory) {
      const categoryRooms = availableRooms.filter((r) => {
        const rt = getRoomTypeObj(r);
        return (
          String(r.roomType) === String(reqCategory) ||
          String(rt?._id) === String(reqCategory) ||
          (rt?.name && rt.name.toLowerCase() === String(reqCategory).toLowerCase()) ||
          (r.category && r.category.toLowerCase() === String(reqCategory).toLowerCase())
        );
      });
      if (categoryRooms.length > 0) return [categoryRooms[0]];
    }

    // 5. Fallback only if no specific room or category matched
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
    const baseCap = explicitCap > 0 ? explicitCap : (calculateRoomCapacity(room).standardCapacity || 2);
    // Allow extra guest buffer (+2 per room, minimum 4 guests per room) so 2+ accompanying members can be added
    return Math.max(baseCap + 2, 4);
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
    const catObj = getRoomTypeObj(targetRoom);
    const catId = catObj?._id || (typeof targetRoom.roomType === "string" ? targetRoom.roomType : "");
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
      roomTypeId: catId,
      floor: targetRoom.floor || 1,
      rate: tariff,
      discountAmount: disc,
      total: netTot,
    }));
    setStepError("");
  };

  // Combined nightly tariff = sum of each selected room's own price (not rate × room count)
  const combinedNightlyRate = selectedRoomsList.length > 0
    ? selectedRoomsList.reduce((sum, r) => sum + getRoomTariff(r), 0)
    : Number(checkInData.rate) || 0;

  // Centralized GST: each room uses its own nightly price × nights, then amounts are summed
  const gstBookingResult = calculateMultiRoomBookingGST({
    rooms: (selectedRoomsList.length > 0
      ? selectedRoomsList
      : [{ pricePerNight: Number(checkInData.rate) || 0, gstEnabled: true, gstRate: 18 }]
    ).map((r) => {
      const rt = getRoomTypeObj(r);
      // Always use this room's tariff — never the combined checkInData.rate
      const price = getRoomTariff(r) || Number(r.pricePerNight) || 0;
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

  const vipDiscountAmount = isVipGuest ? Math.round(baseTariffTotal * 0.10) : (Number(checkInData.discountAmount) || 0);
  const discountApplied = Math.min(baseTariffTotal, Math.max(0, vipDiscountAmount));
  const priceAfterDiscount = Math.max(0, baseTariffTotal - discountApplied);
  const taxRatio = baseTariffTotal > 0 ? priceAfterDiscount / baseTariffTotal : 0;
  const displayCgst = Math.round(totalCgstAmount * taxRatio);
  const displaySgst = Math.round(totalSgstAmount * taxRatio);
  const displayIgst = Math.round(totalIgstAmount * taxRatio);
  const securityDepositAmount = checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0;
  const calculatedGrandTotal = priceAfterDiscount + displayCgst + displaySgst + displayIgst + securityDepositAmount;

  // Keep total, rate, and balance due in sync with selected rooms × nights
  // Billing flow: base (sum of room×nights) -> discount -> GST on discounted amount -> extras (deposit)
  const effectiveGstRate = Number(gstBookingResult.roomBreakdowns?.[0]?.gstRate ?? 18) || 0;
  useEffect(() => {
    setCheckInData((prev) => {
      // Advance stays 0 unless the receptionist types an amount
      const advance = prev.isPaidManuallyEdited ? Number(prev.paid) || 0 : 0;
      const due = Math.max(0, calculatedGrandTotal - advance);
      if (
        prev.paid === advance &&
        prev.total === calculatedGrandTotal &&
        prev.due === due &&
        prev.baseAmount === baseTariffTotal &&
        prev.appliedDiscount === discountApplied &&
        prev.gstRate === effectiveGstRate &&
        Number(prev.rate) === Number(combinedNightlyRate)
      ) {
        return prev;
      }
      return {
        ...prev,
        paid: advance,
        total: calculatedGrandTotal,
        due,
        baseAmount: baseTariffTotal,
        appliedDiscount: discountApplied,
        gstRate: effectiveGstRate,
        // rate = sum of each room's nightly price (used by nights/date handlers as rate × nights)
        rate: combinedNightlyRate,
      };
    });
  }, [calculatedGrandTotal, checkInData.isPaidManuallyEdited, baseTariffTotal, discountApplied, effectiveGstRate, combinedNightlyRate]);

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
      name: "",
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

  // Primary Guest Multi-Document Upload Handler (Supports Multi-Select)
  const handleMainGuestMultiUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Fast local previews
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
      const current = prev.idImages || (prev.frontImage ? [prev.frontImage, ...(prev.backImage ? [prev.backImage] : [])] : []);
      const merged = [...current, ...newPreviews];
      return {
        ...prev,
        idImages: merged,
        images: merged,
        frontImage: merged[0] || "",
        backImage: merged[1] || "",
      };
    });

    setStepError("");
    setFieldErrors((prev) => ({ ...prev, frontImage: false }));

    // Keep high-fidelity base64 previews in idImages so backend Multer receives native Blobs
    files.forEach(async (file) => {
      try {
        await uploadToCloudinaryServer(file, "hotel_guest_documents/main");
      } catch (err) {
        // Fallback silently
      }
    });

    if (e.target) e.target.value = "";
  };

  const handleRemoveMainGuestDoc = (idxToRemove) => {
    setCheckInData((prev) => {
      const current = prev.idImages || (prev.frontImage ? [prev.frontImage, ...(prev.backImage ? [prev.backImage] : [])] : []);
      const updated = current.filter((_, i) => i !== idxToRemove);
      return {
        ...prev,
        idImages: updated,
        images: updated,
        frontImage: updated[0] || "",
        backImage: updated[1] || "",
      };
    });
  };

  // Date and Time Check-in / Checkout Handlers
  const handleCheckInDateChange = (inDateVal, inTimeVal) => {
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
      ...(inTimeVal ? { checkInTime: inTimeVal, isCustomCheckInTime: true } : {}),
      checkOutDate: outDateStr,
      checkOutTime: prev.checkOutTime || hotelSettings?.checkOutTime || "12:00",
      numberOfNights: n,
      discountAmount: disc,
      total: netTot,
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
    }));
  };

  const handleCheckOutDateChange = (outDateVal, outTimeVal) => {
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
      checkOutTime: outTimeVal || prev.checkOutTime || hotelSettings?.checkOutTime || "12:00",
      numberOfNights: n,
      discountAmount: disc,
      total: netTot,
    }));
  };

  // Mobile number change handler (auto-fill of past guest data disabled)
  const handlePhoneChange = (val) => {
    setCheckInData((prev) => ({ ...prev, mobile: val }));
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

    const primaryRoomTypeObj = primaryRoom ? getRoomTypeObj(primaryRoom) : null;
    const primaryRoomTypeId = primaryRoomTypeObj?._id || (typeof primaryRoom?.roomType === 'string' ? primaryRoom.roomType : "");

    setCheckInData((prev) => ({
      ...prev,
      roomId: primaryRoom ? String(primaryRoom._id) : "",
      roomNumber: newRoomNumbers.join(", "),
      roomIds: newIds,
      selectedRooms: newSelectedRooms,
      selectedRoomNumbers: newRoomNumbers,
      roomType: primaryCat,
      roomTypeId: primaryRoomTypeId,
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
    const primaryRoomTypeObj = primaryRoom ? getRoomTypeObj(primaryRoom) : null;
    const primaryRoomTypeId = primaryRoomTypeObj?._id || (typeof primaryRoom?.roomType === 'string' ? primaryRoom.roomType : "");

    const combinedRate = newSelectedRooms.reduce((sum, r) => sum + getRoomTariff(r), 0);

    setCheckInData((prev) => ({
      ...prev,
      roomId: primaryRoom ? String(primaryRoom._id) : "",
      roomNumber: newRoomNumbers.join(", "),
      roomIds: newIds,
      selectedRooms: newSelectedRooms,
      selectedRoomNumbers: newRoomNumbers,
      roomType: primaryCat,
      roomTypeId: primaryRoomTypeId,
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
    const primaryRoomTypeObj = primaryRoom ? getRoomTypeObj(primaryRoom) : null;
    const primaryRoomTypeId = primaryRoomTypeObj?._id || (typeof primaryRoom?.roomType === 'string' ? primaryRoom.roomType : "");

    const combinedRate = newSelectedRooms.reduce((sum, r) => sum + getRoomTariff(r), 0);

    setCheckInData((prev) => ({
      ...prev,
      roomId: primaryRoom ? String(primaryRoom._id) : "",
      roomNumber: newRoomNumbers.join(", "),
      roomIds: selectedIds,
      selectedRooms: newSelectedRooms,
      selectedRoomNumbers: newRoomNumbers,
      roomType: primaryCat,
      roomTypeId: primaryRoomTypeId,
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

  // Step 1 field validation (returns { field: message })
  const validatePrimaryGuest = (data = checkInData) => {
    const errors = {};
    const name = String(data.fullName || "").trim();
    if (!name) errors.fullName = "Main guest name is required";
    else if (name.length < 2 || !/^[\p{L}][\p{L} .'-]*$/u.test(name)) errors.fullName = "Enter a valid name using letters only";

    const mobile = String(data.mobile || "").replace(/\D/g, "");
    if (!mobile) errors.mobile = "Mobile number is required";
    else if (!/^[6-9]\d{9}$/.test(mobile)) errors.mobile = "Enter a valid 10-digit mobile number";

    const email = String(data.email || "").trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) errors.email = "Enter a valid email address";

    if (!data.frontImage && mainGuestDocs.length === 0) errors.frontImage = "Upload at least one ID document";

    const sig = data.signature;
    if (!sig || (typeof sig === "string" && !sig.trim())) errors.signature = "Guest signature is required";
    return errors;
  };

  const validateField = (key) => {
    const message = validatePrimaryGuest()[key];
    setFieldErrors((prev) => ({ ...prev, [key]: message || false }));
  };

  const clearFieldError = (key) => {
    setFieldErrors((prev) => (prev[key] ? { ...prev, [key]: false } : prev));
  };

  // Section header: title with a thin line underneath
  const renderSectionHeader = (title, required = false) => (
    <Box sx={{ flex: 1, minWidth: 0, pb: 1.25, mb: 2.5, borderBottom: `1px solid ${themeConfig.border}` }}>
      <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "1rem", lineHeight: 1.3 }}>
        {title}
        {required && <span style={{ color: "#DC2626", marginLeft: 4 }}>*</span>}
      </Typography>
    </Box>
  );

  const stayNightsCount = Number(checkInData.numberOfNights) || nights || 1;
  const grossRoomCharge = (Number(checkInData.rate) || 0) * stayNightsCount * (selectedRoomsList.length || 1);
  const rateError = Number(checkInData.rate) > 0 ? "" : "Enter a rate greater than 0";
  const discountError = Number(checkInData.discountAmount) > grossRoomCharge ? "Discount cannot exceed the room charges" : "";
  const advancePaid = Number(checkInData.paid) || 0;
  const balanceDue = Math.max(0, calculatedGrandTotal - advancePaid);
  const paidError = advancePaid > calculatedGrandTotal ? "Advance cannot exceed the total amount" : "";
  const selectedPaymentMethod = checkInData.paymentMethod || defaultPaymentMethod;
  const selectedPaymentLabel = paymentMethodLabel(selectedPaymentMethod);

  const renderReviewTile = (title, children) => (
    <Box sx={{ height: "100%", p: 2, borderRadius: "12px", border: `1px solid ${themeConfig.border}`, bgcolor: themeConfig.bgCard || "#FFFFFF" }}>
      <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.4, mb: 0.75 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );

  const handleNext = () => {
    setStepError("");
    setFieldErrors({});

    // Step 1 (Index 0): Primary guest, ID document and signature validation
    if (activeStep === 0) {
      const errors = validatePrimaryGuest();
      const order = [
        ["fullName", "field-primary-fullname"],
        ["mobile", "field-primary-mobile"],
        ["email", "field-primary-email"],
        ["frontImage", "main-guest-id-section"],
        ["signature", "guest-signature-section"],
      ];
      const firstInvalid = order.find(([key]) => errors[key]);
      if (firstInvalid) {
        setFieldErrors(errors);
        showErrorAlert(errors[firstInvalid[0]]);
        scrollToElement(firstInvalid[1]);
        return;
      }
    }

    // Step 2 (Index 1): Stay & Room Allocation Validation
    if (activeStep === 1) {
      const checkInAt = new Date(`${checkInData.checkInDate || ""}T${String(checkInData.checkInTime || "00:00").slice(0, 5)}:00`);
      const checkOutAt = new Date(`${checkInData.checkOutDate || ""}T${String(checkInData.checkOutTime || hotelSettings?.checkOutTime || "12:00").slice(0, 5)}:00`);
      if (Number.isNaN(checkInAt.getTime()) || Number.isNaN(checkOutAt.getTime()) || checkOutAt <= checkInAt) {
        showErrorAlert("Check-out date and time must be later than check-in date and time.");
        return;
      }

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
      if (rateError || discountError || paidError) {
        showErrorAlert(rateError || discountError || paidError);
        scrollToElement("payment-advance-section");
        return;
      }
    }

    setActiveStep((prev) => Math.min(prev + 1, CHECKIN_STEPS.length - 1));
    scrollToElement("checkin-wizard-top");
  };

  const handleBack = () => {
    setStepError("");
    setActiveStep((prev) => Math.max(prev - 1, 0));
    scrollToElement("checkin-wizard-top");
  };

  const handleTriggerFinalCheckIn = () => {
    if (isCheckInSubmitting) return;
    const isSignatureMissing = !checkInData.signature || (typeof checkInData.signature === "string" && !checkInData.signature.trim());
    if (isSignatureMissing) {
      setFieldErrors((prev) => ({ ...prev, signature: true }));
      showErrorAlert("⚠️ Signature Required: Primary Guest digital signature is mandatory before finalizing check-in.");
      setActiveStep(0);
      setTimeout(() => scrollToElement("guest-signature-section"), 150);
      return;
    }
    if (onFinalCheckIn) onFinalCheckIn();
  };

  return (
    <Box id="checkin-wizard-top" sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      <Card
        sx={{
          p: { xs: 2.5, sm: 4 },
          borderRadius: "16px",
          bgcolor: themeConfig.bgCard || (themeConfig.bgCard),
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(32, 41, 35, 0.05), 0 10px 24px rgba(32, 41, 35, 0.08)",
          maxWidth: 1020,
          mx: "auto",
        }}
      >
        {/* Page header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: { xs: "flex-start", sm: "center" },
            flexWrap: "wrap",
            gap: 2,
            mb: 3,
            pb: 2.5,
            borderBottom: `1px solid ${themeConfig.border}`,
          }}
        >
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap" }}>
              <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: { xs: "1.1rem", sm: "1.25rem" }, lineHeight: 1.3 }}>
                Express check-in
              </Typography>
              {isVipGuest && (
                <Chip
                  icon={<Star sx={{ "&&": { color: "#F59E0B" } }} />}
                  label="Returning guest · 10% discount"
                  size="small"
                  sx={{
                    bgcolor: themeConfig.tones.warning.bg,
                    color: themeConfig.tones.warning.color,
                    fontWeight: 700,
                    fontSize: "0.72rem",
                    border: `1px solid ${themeConfig.tones.warning.border}`,
                  }}
                />
              )}
            </Box>
            <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.82rem", mt: 0.5 }}>
              Add guest details, choose the stay and complete check-in.
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            <Button
              variant="text"
              onClick={handleClearFormDraft}
              startIcon={<Refresh sx={{ fontSize: 16 }} />}
              sx={{
                minHeight: 40,
                borderRadius: "10px",
                fontWeight: 600,
                fontSize: "0.82rem",
                color: themeConfig.textMuted,
                textTransform: "none",
                whiteSpace: "nowrap",
                "&:hover": { color: themeConfig.tones.danger.color, bgcolor: themeConfig.tones.danger.bg },
              }}
            >
              Reset form
            </Button>
            {onBackToRooms && (
              <Button
                variant="outlined"
                startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
                onClick={onBackToRooms}
                sx={{
                  minHeight: 40,
                  borderRadius: "10px",
                  fontWeight: 700,
                  fontSize: "0.82rem",
                  borderColor: themeConfig.border,
                  color: themeConfig.textMain,
                  bgcolor: themeConfig.bgCard || (themeConfig.bgCard),
                  whiteSpace: "nowrap",
                  textTransform: "none",
                  boxShadow: "none",
                  "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary, boxShadow: "none" },
                }}
              >
                Back to rooms
              </Button>
            )}
          </Box>
        </Box>

        {/* ========================================================================= */}
        {/* STEP INDICATOR                                                         */}
        {/* ========================================================================= */}
        <Box sx={{ mb: 4, px: { xs: 0, sm: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", position: "relative", width: "100%" }}>
            {/* Track */}
            <Box
              sx={{
                position: "absolute",
                top: 18,
                left: "12.5%",
                right: "12.5%",
                height: 2,
                bgcolor: isDarkMode ? "rgba(255,255,255,0.12)" : "#E2E8F0",
                borderRadius: "10px",
                transform: "translateY(-50%)",
                zIndex: 0,
              }}
            >
              <Box
                sx={{
                  height: "100%",
                  width: `${(activeStep / (CHECKIN_STEPS.length - 1)) * 100}%`,
                  bgcolor: themeConfig.primary,
                  borderRadius: "10px",
                  transition: "width 0.35s ease",
                }}
              />
            </Box>

            {CHECKIN_STEPS.map((label, index) => {
              const isCompleted = activeStep > index;
              const isCurrent = activeStep === index;
              const stepIcons = [
                <Person key="p" sx={{ fontSize: 18 }} />,
                <AccessTime key="t" sx={{ fontSize: 18 }} />,
                <CreditCard key="c" sx={{ fontSize: 18 }} />,
                <VerifiedUser key="v" sx={{ fontSize: 18 }} />,
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
                  <Box
                    sx={{
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      mb: 1,
                      bgcolor: isCompleted ? themeConfig.primary : (themeConfig.bgCard),
                      color: isCompleted ? themeConfig.onPrimary : isCurrent ? themeConfig.primary : themeConfig.textMuted,
                      border: `2px solid ${isCompleted || isCurrent ? themeConfig.primary : (themeConfig.border)}`,
                      boxShadow: isCurrent ? `0 0 0 4px ${themeConfig.primaryGlow}` : "none",
                      transition: "all 0.25s ease",
                    }}
                  >
                    {isCompleted ? <Check sx={{ fontSize: 18 }} /> : stepIcons[index]}
                  </Box>
                  <Typography sx={{ fontSize: "0.65rem", fontWeight: 600, color: themeConfig.textMuted, lineHeight: 1.2 }}>
                    Step {index + 1}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: { xs: "0.72rem", sm: "0.8rem" },
                      fontWeight: isCurrent ? 700 : 600,
                      color: isCurrent || isCompleted ? themeConfig.textMain : themeConfig.textMuted,
                      textAlign: "center",
                      lineHeight: 1.3,
                      mt: 0.25,
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
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            {/* GUEST DETAILS */}
            <Box>
              {renderSectionHeader("Guest details")}

              <Grid container spacing={2}>
                <Grid id="field-primary-fullname" size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    autoComplete="off"
                    label="Main guest name"
                    placeholder="Name as on ID proof"
                    value={checkInData.fullName || ""}
                    onChange={(e) => {
                      setCheckInData({ ...checkInData, fullName: e.target.value });
                      clearFieldError("fullName");
                    }}
                    onBlur={() => validateField("fullName")}
                    error={Boolean(fieldErrors.fullName)}
                    helperText={typeof fieldErrors.fullName === "string" ? fieldErrors.fullName : ""}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    autoComplete="off"
                    label="Guest name"
                    placeholder="Only if different from main guest"
                    value={checkInData.guestName || ""}
                    onChange={(e) => setCheckInData({ ...checkInData, guestName: e.target.value })}
                  />
                </Grid>

                <Grid id="field-primary-mobile" size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    autoComplete="off"
                    label="WhatsApp number"
                    placeholder="10-digit mobile number"
                    value={checkInData.mobile || ""}
                    onChange={(e) => {
                      const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
                      handlePhoneChange(digits);
                      clearFieldError("mobile");
                    }}
                    onBlur={() => validateField("mobile")}
                    error={Boolean(fieldErrors.mobile)}
                    helperText={typeof fieldErrors.mobile === "string" ? fieldErrors.mobile : ""}
                    slotProps={{
                      htmlInput: { inputMode: "numeric", maxLength: 10 },
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <WhatsApp sx={{ color: "#25D366", fontSize: 18, mr: 0.5 }} />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                              +91
                            </Typography>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Grid>

                <Grid id="field-primary-email" size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    type="email"
                    autoComplete="off"
                    label="Email address"
                    placeholder="name@example.com"
                    value={checkInData.email || ""}
                    onChange={(e) => {
                      setCheckInData({ ...checkInData, email: e.target.value });
                      clearFieldError("email");
                    }}
                    onBlur={() => validateField("email")}
                    error={Boolean(fieldErrors.email)}
                    helperText={typeof fieldErrors.email === "string" ? fieldErrors.email : ""}
                  />
                </Grid>

                <Grid id="field-primary-address" size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    multiline
                    minRows={2}
                    autoComplete="off"
                    label="Address"
                    placeholder="Guest residential address"
                    value={checkInData.address || ""}
                    onChange={(e) => setCheckInData({ ...checkInData, address: e.target.value })}
                  />
                </Grid>
              </Grid>
            </Box>

            {/* ID DOCUMENTS */}
            <Box id="main-guest-id-section">
              {renderSectionHeader("ID documents", true)}

              {mainGuestDocs.length === 0 ? (
                <Box
                  component="label"
                  sx={{
                    p: 3,
                    borderRadius: "14px",
                    border: `1.5px dashed ${fieldErrors.frontImage ? "#DC2626" : themeConfig.border}`,
                    bgcolor: fieldErrors.frontImage ? "rgba(220, 38, 38, 0.03)" : isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                    textAlign: "center",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 0.75,
                    cursor: "pointer",
                    transition: "border-color 0.15s ease, background-color 0.15s ease",
                    "&:hover": { borderColor: themeConfig.primary, bgcolor: themeConfig.bgSoft },
                  }}
                >
                  <input type="file" hidden multiple accept="image/*" onChange={handleMainGuestMultiUpload} />
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: themeConfig.champagne,
                      color: themeConfig.primary,
                    }}
                  >
                    <CloudUpload sx={{ fontSize: 22 }} />
                  </Box>
                  <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.9rem" }}>Upload ID documents</Typography>
                  <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.75rem" }}>
                    Click to choose photos. Front and back, JPG or PNG
                  </Typography>
                </Box>
              ) : (
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
                    gap: 1.5,
                  }}
                >
                  {mainGuestDocs.map((imgSrc, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        position: "relative",
                        height: 130,
                        borderRadius: "12px",
                        overflow: "hidden",
                        border: `1px solid ${themeConfig.border}`,
                        bgcolor: "#0F172A",
                      }}
                    >
                      <Box
                        component="img"
                        src={imgSrc}
                        alt={`Guest document ${idx + 1}`}
                        onClick={() => setPreviewImageSrc(imgSrc)}
                        sx={{ width: "100%", height: "100%", objectFit: "cover", cursor: "pointer", transition: "transform 0.2s ease", "&:hover": { transform: "scale(1.04)" } }}
                      />
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMainGuestDoc(idx);
                        }}
                        sx={{ position: "absolute", top: 6, right: 6, bgcolor: "rgba(255,255,255,0.92)", color: themeConfig.tones.danger.color, width: 26, height: 26, "&:hover": { bgcolor: "#FEE2E2" } }}
                      >
                        <Close sx={{ fontSize: 15 }} />
                      </IconButton>
                      <IconButton
                        size="small"
                        onClick={() => setPreviewImageSrc(imgSrc)}
                        sx={{ position: "absolute", top: 6, left: 6, bgcolor: "rgba(255,255,255,0.92)", color: themeConfig.textMain, width: 26, height: 26, "&:hover": { bgcolor: "#FFFFFF" } }}
                      >
                        <Visibility sx={{ fontSize: 15 }} />
                      </IconButton>
                      <Box
                        sx={{
                          position: "absolute",
                          bottom: 6,
                          left: 6,
                          px: 1,
                          py: 0.2,
                          borderRadius: 999,
                          fontSize: "0.66rem",
                          fontWeight: 700,
                          color: "#FFFFFF",
                          bgcolor: idx === 0 ? themeConfig.primary : "rgba(32, 41, 35, 0.8)",
                        }}
                      >
                        {idx === 0 ? "Primary ID" : `Document ${idx + 1}`}
                      </Box>
                    </Box>
                  ))}
                  <Box
                    component="label"
                    sx={{
                      height: 130,
                      borderRadius: "12px",
                      border: `1.5px dashed ${themeConfig.border}`,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 0.5,
                      cursor: "pointer",
                      color: themeConfig.primary,
                      transition: "border-color 0.15s ease, background-color 0.15s ease",
                      "&:hover": { borderColor: themeConfig.primary, bgcolor: themeConfig.champagne },
                    }}
                  >
                    <input type="file" hidden multiple accept="image/*" onChange={handleMainGuestMultiUpload} />
                    <CloudUpload sx={{ fontSize: 22 }} />
                    <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>Add more</Typography>
                  </Box>
                </Box>
              )}
              {typeof fieldErrors.frontImage === "string" && (
                <Typography sx={{ mt: 0.75, color: "#DC2626", fontSize: "0.75rem", fontWeight: 600 }}>{fieldErrors.frontImage}</Typography>
              )}
            </Box>

            {/* SIGNATURE */}
            <Box id="guest-signature-section">
              {renderSectionHeader("Guest signature", true)}
              <DigitalSignaturePad
                required
                error={Boolean(fieldErrors.signature)}
                helperText={typeof fieldErrors.signature === "string" ? fieldErrors.signature : ""}
                signerName={checkInData.fullName || "Primary guest"}
                value={checkInData.signature}
                signature={checkInData.signature}
                onChange={(sig) => {
                  setCheckInData((prev) => ({ ...prev, signature: sig }));
                  if (sig) clearFieldError("signature");
                }}
                onSave={(sig) => {
                  setCheckInData((prev) => ({ ...prev, signature: sig }));
                  if (sig) clearFieldError("signature");
                }}
                onClear={() => {
                  setCheckInData((prev) => ({ ...prev, signature: "" }));
                }}
              />
            </Box>
          </Box>
        )}

        {/* ========================================================================= */}
        {/* STEP 2 (Index 1): STAY DURATION & TIMINGS SCHEDULE                        */}
        {/* ========================================================================= */}
        {activeStep === 1 && (
          <Box>
            {renderSectionHeader("Stay schedule")}

            {allExistingBookingsForSelectedRooms.length > 0 && (
              <Box sx={{ p: 1.5, mb: 2.5, borderRadius: "12px", bgcolor: themeConfig.tones.warning.bg, border: `1px solid ${themeConfig.tones.warning.border}` }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                  <EventBusy sx={{ color: themeConfig.tones.warning.color, fontSize: 18 }} />
                  <Typography sx={{ fontWeight: 700, color: themeConfig.tones.warning.color, fontSize: "0.8rem" }}>
                    Already booked for the selected room(s)
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
                        label={`Room ${eb.roomNumber}: ${formatDisplayDate(eb.checkInDate)} to ${formatDisplayDate(eb.checkOutDate)}`}
                        sx={{
                          fontWeight: 600,
                          fontSize: "0.72rem",
                          bgcolor: isConflict ? themeConfig.tones.danger.bg : themeConfig.bgCard,
                          color: isConflict ? themeConfig.tones.danger.color : themeConfig.tones.warning.color,
                          border: `1px solid ${isConflict ? themeConfig.tones.danger.border : themeConfig.tones.warning.border}`,
                        }}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Check-in date & time"
                  type="datetime-local"
                  value={`${checkInData.checkInDate || getTodayLocalDate()}T${String((checkInData.isCustomCheckInTime ? checkInData.checkInTime : liveTime) || "00:00").slice(0, 5)}`}
                  onChange={(e) => {
                    const [datePart, timePart] = String(e.target.value || "").split("T");
                    handleCheckInDateChange(datePart, timePart);
                  }}
                  slotProps={{ inputLabel: { shrink: true } }}
                  error={conflictingRooms.length > 0}
                  helperText={conflictingRooms.length > 0 ? "Room is already booked for these dates" : ""}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Number of nights"
                  type="number"
                  placeholder="1"
                  slotProps={{ htmlInput: { min: 1, step: 1 } }}
                  value={checkInData.numberOfNights ?? 1}
                  onChange={(e) => handleNightsChange(e.target.value)}
                  error={Number(checkInData.numberOfNights ?? 1) < 1}
                  helperText={Number(checkInData.numberOfNights ?? 1) < 1 ? "Enter at least 1 night" : ""}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Check-out date & time"
                  type="datetime-local"
                  error={conflictingRooms.length > 0}
                  value={`${checkInData.checkOutDate || ""}T${String(checkInData.checkOutTime || hotelSettings?.checkOutTime || "12:00").slice(0, 5)}`.replace(/^T.*/, "")}
                  onChange={(e) => {
                    const [datePart, timePart] = String(e.target.value || "").split("T");
                    handleCheckOutDateChange(datePart, timePart);
                  }}
                  slotProps={{
                    inputLabel: { shrink: true },
                    htmlInput: {
                      min: `${checkInData.checkInDate || getTodayLocalDate()}T${String(checkInData.checkInTime || "00:00").slice(0, 5)}`,
                    },
                  }}
                  helperText={conflictingRooms.length > 0 ? "Overlaps with an existing booking" : ""}
                />
              </Grid>
            </Grid>
          </Box>
        )}

        {/* ========================================================================= */}
        {/* STEP 3 (Index 2): BILLING & PAYMENT SETTLEMENT                            */}
        {/* ========================================================================= */}
        {activeStep === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            <Box id="payment-advance-section">
              {renderSectionHeader("Billing and payment")}

              {/* Adjustments & Inputs */}
              <Grid container spacing={2}>
                {/* Custom Discount */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    autoComplete="off"
                    label="Discount (₹)"
                    placeholder="0"
                    value={checkInData.discountAmount ? checkInData.discountAmount : ""}
                    error={Boolean(discountError)}
                    helperText={discountError}
                    slotProps={{ htmlInput: { inputMode: "numeric" } }}
                    onChange={(e) => {
                      const disc = Number(e.target.value.replace(/\D/g, "").slice(0, 7)) || 0;
                      setCheckInData({
                        ...checkInData,
                        discountAmount: disc,
                        isPaidManuallyEdited: false,
                      });
                    }}
                  />
                </Grid>

                {/* Payment Method */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Payment method"
                    value={hotelPaymentMethods.some((item) => item.name === selectedPaymentMethod) ? selectedPaymentMethod : (hotelPaymentMethods[0]?.name || "")}
                    onChange={(e) => setCheckInData({ ...checkInData, paymentMethod: e.target.value })}
                  >
                    {hotelPaymentMethods.map((item) => (
                      <MenuItem key={item.id || item.name} value={item.name}>
                        {paymentMethodLabel(item.name)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>

                {/* Advance payment (sent as paid_amount) */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    autoComplete="off"
                    label="Advance paid (₹)"
                    placeholder="0"
                    value={checkInData.paid ? checkInData.paid : ""}
                    error={Boolean(paidError)}
                    helperText={paidError}
                    slotProps={{ htmlInput: { inputMode: "numeric" } }}
                    onChange={(e) => {
                      const amount = Number(e.target.value.replace(/\D/g, "").slice(0, 7)) || 0;
                      setCheckInData({ ...checkInData, paid: amount, isPaidManuallyEdited: true });
                    }}
                  />
                </Grid>

                {String(selectedPaymentMethod).toUpperCase() !== "CASH" && (
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <TextField
                      fullWidth
                      size="small"
                      autoComplete="off"
                      label="Reference number"
                      placeholder="Transaction or reference no."
                      value={checkInData.transactionId || ""}
                      onChange={(e) => setCheckInData({ ...checkInData, transactionId: e.target.value })}
                    />
                  </Grid>
                )}
              </Grid>

              {/* Bill summary */}
              <Box sx={{ mt: 3, p: 2.5, borderRadius: "12px", border: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "#FFFFFF" }}>
                <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.85rem", mb: 1.5 }}>
                  Bill summary
                </Typography>
                {[
                  {
                    label: `Room charges (${selectedRoomsList.map((r) => `#${r.roomNumber}`).join(", ") || checkInData.roomNumber})`,
                    hint: selectedRoomsList.length > 1
                      ? selectedRoomsList
                          .map((r) => `#${r.roomNumber} ₹${getRoomTariff(r).toLocaleString("en-IN")}`)
                          .join(" + ") +
                        ` × ${checkInData.numberOfNights || nights || 1} ${(checkInData.numberOfNights || nights || 1) === 1 ? "night" : "nights"}`
                      : `₹${(combinedNightlyRate || Number(checkInData.rate) || 0).toLocaleString("en-IN")} × ${checkInData.numberOfNights || nights || 1} ${(checkInData.numberOfNights || nights || 1) === 1 ? "night" : "nights"}`,
                    value: `₹${(priceAfterDiscount + discountApplied).toLocaleString("en-IN")}`,
                    show: true,
                  },
                  {
                    label: "Discount",
                    value: `-₹${discountApplied.toLocaleString("en-IN")}`,
                    color: themeConfig.tones.success.color,
                    show: discountApplied > 0,
                  },
                  {
                    label: "Taxable amount",
                    hint: "After discount",
                    value: `₹${priceAfterDiscount.toLocaleString("en-IN")}`,
                    show: discountApplied > 0,
                  },
                  { label: "CGST", hint: `${effectiveGstRate / 2}%`, value: `₹${displayCgst.toLocaleString("en-IN")}`, show: displayIgst === 0 },
                  { label: "SGST", hint: `${effectiveGstRate / 2}%`, value: `₹${displaySgst.toLocaleString("en-IN")}`, show: displayIgst === 0 },
                  { label: "IGST", hint: `${effectiveGstRate}%`, value: `₹${displayIgst.toLocaleString("en-IN")}`, show: displayIgst > 0 },
                  {
                    label: "Security deposit",
                    hint: "Refundable at check-out",
                    value: `₹${(Number(checkInData.securityDepositAmount) || 1000).toLocaleString("en-IN")}`,
                    show: Boolean(checkInData.collectSecurityDeposit),
                  },
                ]
                  .filter((row) => row.show)
                  .map((row) => (
                    <Box key={row.label} sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2, py: 0.9 }}>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography component="span" sx={{ color: themeConfig.textMain, fontSize: "0.88rem", fontWeight: 500 }}>
                          {row.label}
                        </Typography>
                        {row.hint ? (
                          <Typography component="span" sx={{ color: themeConfig.textMuted, fontSize: "0.78rem", ml: 1 }}>
                            {row.hint}
                          </Typography>
                        ) : null}
                      </Box>
                      <Typography sx={{ color: row.color || themeConfig.textMain, fontSize: "0.88rem", fontWeight: 600, whiteSpace: "nowrap" }}>
                        {row.value}
                      </Typography>
                    </Box>
                  ))}
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 1, pt: 1.5, borderTop: `1px solid ${themeConfig.border}` }}>
                  <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.95rem" }}>Total (incl. GST)</Typography>
                  <Typography sx={{ fontWeight: 700, color: themeConfig.primary, fontSize: "1.25rem" }}>
                    ₹{calculatedGrandTotal.toLocaleString("en-IN")}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 2, pt: 1.25 }}>
                  <Typography sx={{ color: themeConfig.textMain, fontSize: "0.88rem", fontWeight: 500 }}>
                    Advance paid
                    <Typography component="span" sx={{ color: themeConfig.textMuted, fontSize: "0.78rem", ml: 1 }}>
                      {selectedPaymentLabel}
                    </Typography>
                  </Typography>
                  <Typography sx={{ color: isDarkMode ? "#6EE7B7" : themeConfig.tones.success.color, fontSize: "0.88rem", fontWeight: 600 }}>
                    -₹{advancePaid.toLocaleString("en-IN")}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 1.25,
                    px: 1.5,
                    py: 1,
                    borderRadius: "10px",
                    bgcolor: balanceDue > 0
                      ? (isDarkMode ? "rgba(239, 68, 68, 0.16)" : "#FEF2F2")
                      : (isDarkMode ? "rgba(16, 185, 129, 0.16)" : "#ECFDF5"),
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: "0.9rem", color: balanceDue > 0 ? "#FCA5A5" : (isDarkMode ? "#6EE7B7" : themeConfig.tones.success.color) }}>
                    Balance due
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "1.05rem", color: balanceDue > 0 ? "#FCA5A5" : (isDarkMode ? "#6EE7B7" : themeConfig.tones.success.color) }}>
                    ₹{balanceDue.toLocaleString("en-IN")}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </Box>
        )}

        {/* ========================================================================= */}
        {/* STEP 4 (Index 3): PREVIEW & FINAL CHECK-IN CONFIRMATION                   */}
        {/* ========================================================================= */}
        {activeStep === 3 && (
          <Box>
            {renderSectionHeader("Review and confirm")}

            <Grid container spacing={2} sx={{ mb: 2.5 }}>
              <Grid size={{ xs: 12, md: 4 }}>
                {renderReviewTile(
                  "Guest",
                  <>
                    <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.95rem" }}>
                      {checkInData.fullName || "Not added"}
                    </Typography>
                    <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.8rem", mt: 0.25 }}>
                      {checkInData.mobile ? `+91 ${checkInData.mobile}` : "No mobile number"}
                    </Typography>
                    {checkInData.email ? (
                      <Typography noWrap sx={{ color: themeConfig.textMuted, fontSize: "0.8rem" }}>{checkInData.email}</Typography>
                    ) : null}
                    <Box sx={{ mt: 1, display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
                      {checkInData.signature ? (
                        <>
                          <Chip
                            icon={<CheckCircle sx={{ fontSize: "14px !important", color: "#047857 !important" }} />}
                            label="Signed"
                            size="small"
                            sx={{ bgcolor: isDarkMode ? "rgba(16, 185, 129, 0.16)" : "#ECFDF5", color: isDarkMode ? "#6EE7B7" : themeConfig.tones.success.color, fontWeight: 700, fontSize: "0.72rem", border: `1px solid ${themeConfig.tones.success.border}` }}
                          />
                          <Chip
                            label="View signature"
                            size="small"
                            clickable
                            onClick={() => setPreviewImageSrc(checkInData.signature)}
                            sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", color: themeConfig.textMain, fontWeight: 600, fontSize: "0.72rem", border: `1px solid ${themeConfig.border}` }}
                          />
                        </>
                      ) : (
                        <Chip
                          label="Signature missing"
                          size="small"
                          clickable
                          onClick={() => {
                            setActiveStep(0);
                            setTimeout(() => scrollToElement("guest-signature-section"), 150);
                          }}
                          sx={{ bgcolor: themeConfig.tones.danger.bg, color: themeConfig.tones.danger.color, fontWeight: 700, fontSize: "0.72rem", border: `1px solid ${themeConfig.tones.danger.border}` }}
                        />
                      )}
                    </Box>
                  </>
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                {renderReviewTile(
                  "Stay",
                  <>
                    <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.95rem" }}>
                      {checkInData.numberOfNights || nights || 1} {(checkInData.numberOfNights || nights || 1) === 1 ? "night" : "nights"}
                    </Typography>
                    <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.8rem", mt: 0.25 }}>
                      In: {formatDDMMYYYY(checkInData.checkInDate || getTodayLocalDate())}, {formatTime12Hour(checkInData.checkInTime || liveTime)}
                    </Typography>
                    <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.8rem" }}>
                      Out: {formatDDMMYYYY(checkInData.checkOutDate)}, {formatTime12Hour(checkInData.checkOutTime || hotelSettings?.checkOutTime || "12:00")}
                    </Typography>
                  </>
                )}
              </Grid>

              <Grid size={{ xs: 12, md: 4 }}>
                {renderReviewTile(
                  "Room",
                  <>
                    <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.95rem" }}>
                      Room {selectedRoomsList.map((r) => r.roomNumber).join(", ") || checkInData.roomNumber}
                    </Typography>
                    <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.8rem", mt: 0.25 }}>
                      {selectedRoomsList.map((r) => getRoomCategoryName(r)).join(", ") || checkInData.roomType || "Standard room"}
                    </Typography>
                    <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.8rem" }}>
                      {totalPartySize} {totalPartySize === 1 ? "guest" : "guests"}
                    </Typography>
                  </>
                )}
              </Grid>
            </Grid>

            {checkInData.accompanyingGuests && checkInData.accompanyingGuests.length > 0 && (
              <Box sx={{ mb: 2.5, p: 2, borderRadius: "12px", border: `1px solid ${themeConfig.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
                <Typography sx={{ fontWeight: 600, color: themeConfig.textMain, fontSize: "0.85rem" }}>
                  Member documents ({checkInData.accompanyingGuests.length})
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                  {checkInData.accompanyingGuests.map((m, idx) => {
                    const imgSrc = m.frontImage || (m.images && m.images[0]) || "";
                    return (
                      <Chip
                        key={m.id || idx}
                        icon={<Visibility sx={{ fontSize: "14px !important" }} />}
                        label={`Document ${idx + 1}`}
                        size="small"
                        clickable
                        onClick={() => setPreviewImageSrc(imgSrc)}
                        sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F8FAFC", color: themeConfig.textMain, fontWeight: 600, fontSize: "0.72rem", border: `1px solid ${themeConfig.border}` }}
                      />
                    );
                  })}
                </Box>
              </Box>
            )}

            {/* Payment summary */}
            <Box sx={{ p: 2, borderRadius: "12px", bgcolor: themeConfig.bgSoft, border: `1px solid ${themeConfig.border}` }}>
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                <Box>
                  <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 600 }}>Total amount</Typography>
                  <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "1.2rem" }}>
                    ₹{calculatedGrandTotal.toLocaleString("en-IN")}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 600 }}>
                    Advance paid ({selectedPaymentLabel})
                  </Typography>
                  <Typography sx={{ fontWeight: 700, color: isDarkMode ? "#6EE7B7" : themeConfig.tones.success.color, fontSize: "1.2rem" }}>
                    ₹{advancePaid.toLocaleString("en-IN")}
                  </Typography>
                </Box>
                <Box>
                  <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 600 }}>Balance due</Typography>
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "1.2rem",
                      color: balanceDue > 0 ? (isDarkMode ? "#FCA5A5" : themeConfig.tones.danger.color) : (isDarkMode ? "#6EE7B7" : themeConfig.tones.success.color),
                    }}
                  >
                    ₹{balanceDue.toLocaleString("en-IN")}
                  </Typography>
                </Box>
              </Box>
              <Typography sx={{ mt: 1.5, color: themeConfig.textMuted, fontSize: "0.75rem" }}>
                Total includes CGST {totalCgstAmount > 0 ? "9%" : "0%"} and SGST {totalSgstAmount > 0 ? "9%" : "0%"}.
              </Typography>
            </Box>
          </Box>
        )}

        {/* Wizard Footer Navigation Controls */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexDirection: { xs: "column-reverse", sm: "row" },
            gap: 1.5,
            mt: 4,
            pt: 2.5,
            borderTop: `1px solid ${themeConfig.border}`,
          }}
        >
          <Button
            variant="outlined"
            disabled={activeStep === 0}
            onClick={handleBack}
            startIcon={<ArrowBack sx={{ fontSize: 18 }} />}
            sx={{
              minHeight: 40,
              borderRadius: "10px",
              fontWeight: 700,
              fontSize: "0.85rem",
              textTransform: "none",
              boxShadow: "none",
              px: 2.5,
              borderColor: themeConfig.border,
              color: themeConfig.textMain,
              width: { xs: "100%", sm: "auto" },
              "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.border, boxShadow: "none" },
            }}
          >
            Back
          </Button>

          {activeStep < CHECKIN_STEPS.length - 1 ? (
            <Button
              variant="contained"
              onClick={handleNext}
              endIcon={<ArrowForward sx={{ fontSize: 18 }} />}
              sx={{
                minHeight: 40,
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.85rem",
                textTransform: "none",
                boxShadow: "none",
                px: 3,
                bgcolor: themeConfig.primary,
                color: themeConfig.onPrimary,
                width: { xs: "100%", sm: "auto" },
                "&:hover": { bgcolor: themeConfig.primaryDark, boxShadow: "none" },
              }}
            >
              Continue
            </Button>
          ) : (
            <Button
              variant="contained"
              onClick={handleTriggerFinalCheckIn}
              disabled={isCheckInSubmitting}
              startIcon={isCheckInSubmitting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : <CheckCircle sx={{ fontSize: 18 }} />}
              sx={{
                minHeight: 40,
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.85rem",
                textTransform: "none",
                boxShadow: "none",
                px: 3,
                bgcolor: themeConfig.primary,
                color: themeConfig.onPrimary,
                width: { xs: "100%", sm: "auto" },
                "&:hover": { bgcolor: themeConfig.primaryDark, boxShadow: "none" },
              }}
            >
              {isCheckInSubmitting ? "Creating booking..." : "Confirm check-in"}
            </Button>
          )}
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
