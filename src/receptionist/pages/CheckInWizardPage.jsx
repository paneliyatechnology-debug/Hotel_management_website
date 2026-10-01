"use client";

import { useState, useEffect } from "react";
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
  Snackbar,
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
} from "@mui/material";
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
} from "@/shared/icons";
import DigitalSignaturePad from "@/shared/components/DigitalSignaturePad";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { formatTime12Hour } from "@/shared/utils/timeUtils";
import { getAmenityIcon } from "@/shared/utils/amenityUtils";
import { apiRequest, API_ENDPOINTS } from "@/config/api";

const CHECKIN_STEPS = [
  "Guest & Member Profile",
  "Stay & Room Allocation",
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

  // Filter clean and ready available rooms
  const availableRooms = rooms.filter((r) => r.status === "AVAILABLE");

  // Continuous Live Clock for check-in time
  const [liveTime, setLiveTime] = useState(getCurrentLocalTime());
  const [liveDate, setLiveDate] = useState(getTodayLocalDate());

  // Form validation feedback & Toast state
  const [stepError, setStepError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", severity: "warning" });

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
    ? checkInData.roomIds
    : checkInData.roomId
      ? [checkInData.roomId]
      : [];

  const selectedRoomsList = (() => {
    const rawNumbers = checkInData.selectedRoomNumbers || (checkInData.roomNumber ? String(checkInData.roomNumber).split(",").map((s) => s.trim()) : []);
    const matched = rooms.filter((r) =>
      selectedRoomIds.includes(r._id) ||
      rawNumbers.includes(String(r.roomNumber))
    );
    if (matched.length > 0) return matched;
    if (checkInData.selectedRooms && checkInData.selectedRooms.length > 0) return checkInData.selectedRooms;
    return [];
  })();

  const totalPartySize = 1 + (checkInData.accompanyingGuests?.length || 0);

  // Total sleeping capacity across all currently selected rooms
  const totalStandardCapacity = selectedRoomsList.reduce((sum, r) => sum + calculateRoomCapacity(r).standardCapacity, 0);
  const totalMaxCapacity = selectedRoomsList.reduce((sum, r) => sum + calculateRoomCapacity(r).maxCapacityWithBuffer, 0);

  const isCapacityExceeded = totalPartySize > totalMaxCapacity;
  const isBufferUsed = totalPartySize > totalStandardCapacity && totalPartySize <= totalMaxCapacity;
  const guestDeficit = Math.max(0, totalPartySize - totalStandardCapacity);

  // VIP Returning Guest 10% Discount calculation
  const isVipGuest = Boolean(checkInData.isRepeatGuest || (checkInData.totalVisits && checkInData.totalVisits >= 2));
  const baseTariffTotal = (checkInData.rate ?? 0) * (checkInData.numberOfNights || nights || 1);
  const vipDiscountAmount = isVipGuest ? Math.round(baseTariffTotal * 0.10) : (checkInData.discountAmount || 0);
  const securityDepositAmount = checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0;
  const calculatedGrandTotal = Math.max(0, baseTariffTotal - vipDiscountAmount) + securityDepositAmount;

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

  // Accompanying Members Handlers (Step 1)
  const handleAddMember = () => {
    const newMember = {
      id: Date.now(),
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
    };
    const updatedMembers = [...(checkInData.accompanyingGuests || []), newMember];
    setCheckInData((prev) => ({
      ...prev,
      accompanyingGuests: updatedMembers,
      adults: 1 + updatedMembers.length,
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

  const handleMemberImageUpload = (e, id, target = "front") => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const b64 = event.target.result;
      handleUpdateMember(id, target === "front" ? "frontImage" : "backImage", b64);
    };
    reader.readAsDataURL(file);
  };

  // Main Guest Image Upload
  const handleMainGuestImageUpload = (e, target) => {
    const file = e.target.files?.[0];
    if (!file) return;
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
  };

  // Date and Time Check-in / Checkout Handlers
  const handleCheckInDateChange = (inDateVal) => {
    const d1 = new Date(inDateVal);
    const n = checkInData.numberOfNights || nights || 1;
    const d2 = new Date(d1.getTime() + n * 86400000);
    const outDateStr = d2.toISOString().split("T")[0];

    const currentRate = checkInData.rate ?? 0;
    const baseTot = currentRate * n;
    const disc = isVipGuest ? Math.round(baseTot * 0.10) : (checkInData.discountAmount || 0);
    const netTot = Math.max(0, baseTot - disc) + (checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0);

    setCheckInData((prev) => ({
      ...prev,
      checkInDate: inDateVal,
      checkOutDate: outDateStr,
      checkOutTime: "12:00",
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
    const d1 = new Date(inDateStr);
    const d2 = new Date(d1.getTime() + Math.max(1, n) * 86400000);
    const outDateStr = d2.toISOString().split("T")[0];

    const currentRate = checkInData.rate ?? 0;
    const baseTot = currentRate * (n === 0 ? 0 : n);
    const disc = isVipGuest ? Math.round(baseTot * 0.10) : (checkInData.discountAmount || 0);
    const netTot = Math.max(0, baseTot - disc) + (checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0);

    setCheckInData((prev) => ({
      ...prev,
      numberOfNights: n,
      checkOutDate: outDateStr,
      checkOutTime: "12:00",
      discountAmount: disc,
      total: netTot,
      paid: netTot,
      due: 0,
    }));
  };

  const handleCheckOutDateChange = (outDateVal) => {
    const d1 = new Date(checkInData.checkInDate || getTodayLocalDate());
    const d2 = new Date(outDateVal);
    const diffDays = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
    const n = Math.max(1, isNaN(diffDays) ? 1 : diffDays);

    const currentRate = checkInData.rate ?? 0;
    const baseTot = currentRate * n;
    const disc = isVipGuest ? Math.round(baseTot * 0.10) : (checkInData.discountAmount || 0);
    const netTot = Math.max(0, baseTot - disc) + (checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0);

    setCheckInData((prev) => ({
      ...prev,
      checkOutDate: outDateVal,
      checkOutTime: "12:00",
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
        govtIdType: guest.govtIdType || guest.idType || guest.idProof?.idType || prev.govtIdType || "AADHAAR",
        govtIdNumber: idNum || prev.govtIdNumber,
        isRepeatGuest: true,
        totalVisits: Math.max(totalVisits, 2),
        hasVerifiedId: isIdVerified,
        discountAmount: disc,
        total: netTot,
        paid: netTot,
        due: 0,
      };
    });
  };

  // Add a specific room to the selection (for Quick Suggester)
  const handleAddAdditionalRoom = (roomIdToAdd) => {
    if (selectedRoomIds.includes(roomIdToAdd)) return;
    const newIds = [...selectedRoomIds, roomIdToAdd];
    const newSelectedRooms = rooms.filter((r) => newIds.includes(r._id));
    const newRoomNumbers = newSelectedRooms.map((r) => String(r.roomNumber));
    const primaryRoom = newSelectedRooms[0];
    const primaryCat = getRoomCategoryName(primaryRoom);

    const combinedRate = newSelectedRooms.reduce((sum, r) => sum + getRoomTariff(r), 0);
    const baseTot = combinedRate * (checkInData.numberOfNights || 1);
    const disc = isVipGuest ? Math.round(baseTot * 0.10) : (checkInData.discountAmount || 0);
    const netTot = Math.max(0, baseTot - disc) + (checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0);

    setCheckInData((prev) => ({
      ...prev,
      roomId: primaryRoom?._id || "",
      roomNumber: newRoomNumbers.join(", "),
      roomIds: newIds,
      selectedRooms: newSelectedRooms,
      selectedRoomNumbers: newRoomNumbers,
      roomType: primaryCat,
      floor: primaryRoom?.floor || 1,
      rate: combinedRate,
      discountAmount: disc,
      total: netTot,
      paid: netTot,
      due: 0,
    }));
  };

  // Remove a room from selection
  const handleRemoveSelectedRoom = (roomIdToRemove) => {
    if (selectedRoomIds.length <= 1) {
      showErrorAlert("At least one room must remain allocated.", "warning");
      return;
    }
    const newIds = selectedRoomIds.filter((id) => id !== roomIdToRemove);
    const newSelectedRooms = rooms.filter((r) => newIds.includes(r._id));
    const newRoomNumbers = newSelectedRooms.map((r) => String(r.roomNumber));
    const primaryRoom = newSelectedRooms[0];
    const primaryCat = getRoomCategoryName(primaryRoom);

    const combinedRate = newSelectedRooms.reduce((sum, r) => sum + getRoomTariff(r), 0);
    const baseTot = combinedRate * (checkInData.numberOfNights || 1);
    const disc = isVipGuest ? Math.round(baseTot * 0.10) : (checkInData.discountAmount || 0);
    const netTot = Math.max(0, baseTot - disc) + (checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0);

    setCheckInData((prev) => ({
      ...prev,
      roomId: primaryRoom?._id || "",
      roomNumber: newRoomNumbers.join(", "),
      roomIds: newIds,
      selectedRooms: newSelectedRooms,
      selectedRoomNumbers: newRoomNumbers,
      roomType: primaryCat,
      floor: primaryRoom?.floor || 1,
      rate: combinedRate,
      discountAmount: disc,
      total: netTot,
      paid: netTot,
      due: 0,
    }));
  };

  // Multi-Room Dropdown Change Handler
  const handleDropdownRoomChange = (event) => {
    const selectedIds = typeof event.target.value === "string" ? event.target.value.split(",") : event.target.value;
    if (selectedIds.length === 0) return;

    const newSelectedRooms = rooms.filter((r) => selectedIds.includes(r._id));
    const newRoomNumbers = newSelectedRooms.map((r) => String(r.roomNumber));
    const primaryRoom = newSelectedRooms[0];
    const primaryCat = getRoomCategoryName(primaryRoom);

    const combinedRate = newSelectedRooms.reduce((sum, r) => sum + getRoomTariff(r), 0);
    const baseTot = combinedRate * (checkInData.numberOfNights || 1);
    const disc = isVipGuest ? Math.round(baseTot * 0.10) : (checkInData.discountAmount || 0);
    const netTot = Math.max(0, baseTot - disc) + (checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0);

    setCheckInData((prev) => ({
      ...prev,
      roomId: primaryRoom?._id || "",
      roomNumber: newRoomNumbers.join(", "),
      roomIds: selectedIds,
      selectedRooms: newSelectedRooms,
      selectedRoomNumbers: newRoomNumbers,
      roomType: primaryCat,
      floor: primaryRoom?.floor || 1,
      rate: combinedRate,
      discountAmount: disc,
      total: netTot,
      paid: netTot,
      due: 0,
    }));
  };

  // Step Validation Helpers & Error Alerts (Toast Notification System)
  const showErrorAlert = (msg, severity = "warning") => {
    setStepError(msg);
    setToast({ open: true, message: msg, severity });
  };

  const handleNext = () => {
    setStepError("");

    if (activeStep === 0) {
      if (!checkInData.fullName?.trim()) {
        showErrorAlert("⚠️ Name Required: Krupya Main Guest nu Full Name lakho (Please enter the Main Guest's Full Name).");
        return;
      }
      if (!checkInData.mobile?.trim()) {
        showErrorAlert("⚠️ Mobile Number Required: Krupya Main Guest nu Mobile Number lakho (Please enter the Main Guest's Mobile Number).");
        return;
      }

      // Mandatory ID Proof Upload Validation
      if (!checkInData.frontImage) {
        showErrorAlert("⚠️ ID Upload Required: ID upload karvu farjiyat che (Front Photo). ID upload karya vagar aganu Step 2 sharu nahi thay (Please upload ID proof before proceeding).");
        if (typeof document !== "undefined") {
          const el = document.getElementById("main-guest-id-section");
          if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
        return;
      }

      // Aadhaar 12-Digit Validation if Aadhaar is chosen
      if (checkInData.govtIdType === "AADHAAR") {
        const aadhaarValidation = validateAadhaar(checkInData.govtIdNumber);
        if (!aadhaarValidation.isValid) {
          showErrorAlert(`⚠️ Main Guest Aadhaar Error: Krupya valid 12-digit Aadhaar Number lakho (${aadhaarValidation.message}).`);
          return;
        }
      }

      // Accompanying Members Validation
      if (checkInData.accompanyingGuests && checkInData.accompanyingGuests.length > 0) {
        for (let i = 0; i < checkInData.accompanyingGuests.length; i++) {
          const m = checkInData.accompanyingGuests[i];
          if (!m.name?.trim()) {
            showErrorAlert(`⚠️ Member Name Required: Krupya Member #${i + 1}'s Full Name lakho.`);
            return;
          }
          if (m.idType === "AADHAAR" && m.idNumber) {
            const memberAadhaarVal = validateAadhaar(m.idNumber);
            if (!memberAadhaarVal.isValid) {
              showErrorAlert(`⚠️ Member Aadhaar Error: Member #${i + 1} (${m.name}): ${memberAadhaarVal.message}.`);
              return;
            }
          }
        }
      }
    }

    if (activeStep === 1) {
      if (!checkInData.roomId && (!checkInData.roomIds || checkInData.roomIds.length === 0)) {
        showErrorAlert("⚠️ Room Required: Krupya at least 1 Room assign karo (Please assign at least one room).");
        return;
      }

      // Strict Room Capacity Enforcement
      if (isCapacityExceeded) {
        showErrorAlert(`⚠️ Room Capacity Exceeded: Total ${totalPartySize} Guests cannot fit in the selected room(s) (Maximum Capacity: ${totalMaxCapacity} Guests). Please allocate additional room(s) for the remaining ${totalPartySize - totalStandardCapacity} guest(s).`);
        return;
      }
    }

    setActiveStep((prev) => Math.min(prev + 1, CHECKIN_STEPS.length - 1));
  };

  const handleBack = () => {
    setStepError("");
    setActiveStep((prev) => Math.max(prev - 1, 0));
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      {/* Sleek Top Floating Toast Notification */}
      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
        sx={{ zIndex: 99999 }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity || "warning"}
          variant="filled"
          sx={{
            width: "100%",
            fontWeight: 800,
            fontSize: "0.92rem",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25)",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
          }}
        >
          {toast.message}
        </Alert>
      </Snackbar>

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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 2, mb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
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
                  "&:hover": { bgcolor: themeConfig.champagne, borderColor: themeConfig.primary },
                }}
              >
                Back to Rooms
              </Button>
            )}
            <div>
              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 0.2, letterSpacing: -0.5 }}>
                Express Check-In & Guest Allocation
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                Fill guest details, check-in duration, and complete allocation.
              </Typography>
            </div>
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
        {/* LUXURY STEP-BY-STEP CONNECTED HORIZONTAL STEPPER (AADI LINE COLOR FILL)   */}
        {/* ========================================================================= */}
        <Box sx={{ mb: 4, mt: 1.5 }}>
          {/* Horizontal Nodes & Connecting Segment Lines Chain */}
          <Box
            sx={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              px: { xs: 0.5, sm: 2 },
            }}
          >
            {CHECKIN_STEPS.map((label, index) => {
              const isCompleted = activeStep > index;
              const isCurrent = activeStep === index;
              const isUpcoming = activeStep < index;
              const isLineFilled = activeStep > index; // Connecting line to next node fills when this step is passed

              const stepIcons = [
                <Person key="p" sx={{ fontSize: 20 }} />,
                <KingBed key="k" sx={{ fontSize: 20 }} />,
                <CreditCard key="c" sx={{ fontSize: 20 }} />,
                <VerifiedUser key="v" sx={{ fontSize: 20 }} />,
              ];

              return (
                <Box
                  key={label}
                  sx={{
                    display: "flex",
                    alignItems: "flex-start",
                    flex: index < CHECKIN_STEPS.length - 1 ? 1 : 0,
                  }}
                >
                  {/* Step Node Circle Badge & Label */}
                  <Box
                    onClick={() => {
                      if (index < activeStep) setActiveStep(index);
                    }}
                    sx={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      cursor: index < activeStep ? "pointer" : "default",
                      minWidth: { xs: 65, sm: 120 },
                    }}
                  >
                    <Avatar
                      sx={{
                        width: { xs: 38, sm: 46 },
                        height: { xs: 38, sm: 46 },
                        fontSize: { xs: "0.85rem", sm: "0.95rem" },
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
                      {isCompleted ? <Check sx={{ fontSize: { xs: 20, sm: 24 }, fontWeight: 900 }} /> : stepIcons[index]}
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
                        fontSize: { xs: "0.72rem", sm: "0.78rem" },
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
                        fontSize: { xs: "0.68rem", sm: "0.74rem" },
                        textAlign: "center",
                        lineHeight: 1.2,
                        mt: 0.2,
                        display: { xs: isCurrent ? "block" : "none", sm: "block" },
                      }}
                    >
                      {label}
                    </Typography>
                  </Box>

                  {/* Horizontal Connecting Line (Aadi Line filling color step-by-step) */}
                  {index < CHECKIN_STEPS.length - 1 && (
                    <Box
                      sx={{
                        flex: 1,
                        mt: { xs: 2.2, sm: 2.6 },
                        mx: { xs: 0.5, sm: 1.5 },
                        height: 5,
                        bgcolor: "#E2E8F0",
                        borderRadius: "10px",
                        position: "relative",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          height: "100%",
                          width: isLineFilled ? "100%" : "0%",
                          background: "linear-gradient(90deg, #10B981 0%, #0B8EE0 100%)",
                          boxShadow: "0 0 8px rgba(16, 185, 129, 0.6)",
                          borderRadius: "10px",
                          transition: "width 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
                        }}
                      />
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>
        </Box>



        {/* ========================================================================= */}
        {/* STEP 1: GUEST & ACCOMPANYING MEMBERS PROFILE + ID VERIFICATION            */}
        {/* ========================================================================= */}
        {activeStep === 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            {/* PART A: MAIN / PRIMARY GUEST DETAILS */}
            <Paper
              className="card-3d"
              sx={{
                p: 3,
                borderRadius: "20px",
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                border: `1.5px solid ${themeConfig.border}`,
                boxShadow: isDarkMode ? "none" : "0 6px 20px rgba(0,0,0,0.03)",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 2.5 }}>
                <Avatar sx={{ bgcolor: themeConfig.primary, color: "#FFFFFF", width: 34, height: 34 }}>
                  <Person sx={{ fontSize: 20 }} />
                </Avatar>
                <div>
                  <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                    Primary / Main Guest Information
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                    Primary folio holder responsible for booking & check-in
                  </Typography>
                </div>
              </Box>

              <Grid container spacing={2}>
                {/* Full Name */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Primary Guest Full Name"
                    placeholder="e.g. Rahul Sharma"
                    value={checkInData.fullName}
                    onChange={(e) => setCheckInData({ ...checkInData, fullName: e.target.value })}
                    required
                  />
                </Grid>

                {/* Mobile Phone */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Mobile Phone Number"
                    placeholder="e.g. 9876543210"
                    value={checkInData.mobile}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    required
                    helperText="Type 10 digits for instant VIP / returning guest auto-fill"
                  />
                </Grid>

                {/* Email Address */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Email Address"
                    placeholder="e.g. rahul.sharma@example.com"
                    value={checkInData.email}
                    onChange={(e) => setCheckInData({ ...checkInData, email: e.target.value })}
                    helperText="Booking confirmation, room amenities & instructions will be emailed here"
                  />
                </Grid>

                {/* Gender */}
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Gender"
                    value={checkInData.gender || "Male"}
                    onChange={(e) => setCheckInData({ ...checkInData, gender: e.target.value })}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </TextField>
                </Grid>

                {/* Nationality */}
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nationality"
                    placeholder="e.g. Indian"
                    value={checkInData.nationality || "Indian"}
                    onChange={(e) => setCheckInData({ ...checkInData, nationality: e.target.value })}
                  />
                </Grid>

                {/* Address */}
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Residential Address / City"
                    placeholder="e.g. 402, Crystal Heights, SG Highway, Ahmedabad"
                    value={checkInData.address}
                    onChange={(e) => setCheckInData({ ...checkInData, address: e.target.value })}
                  />
                </Grid>
              </Grid>

              {/* Main Guest ID Proof Verification Section */}
              <Box
                id="main-guest-id-section"
                sx={{
                  mt: 3,
                  pt: 2.5,
                  p: stepError && !checkInData.frontImage ? 2 : 0,
                  borderRadius: "16px",
                  borderTop: stepError && !checkInData.frontImage ? "none" : `1px solid ${themeConfig.border}`,
                  border: stepError && !checkInData.frontImage ? "2px solid #EF4444" : undefined,
                  bgcolor: stepError && !checkInData.frontImage ? "rgba(239, 68, 68, 0.04)" : "transparent",
                  transition: "all 0.3s ease",
                }}
              >
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.primaryDark, mb: 1.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <Shield sx={{ fontSize: 18, color: themeConfig.primary }} />
                  Government ID Proof & KYC Verification
                </Typography>

                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 5 }}>
                    <TextField
                      select
                      fullWidth
                      size="small"
                      label="Govt ID Type"
                      value={checkInData.govtIdType || "AADHAAR"}
                      onChange={(e) => setCheckInData({ ...checkInData, govtIdType: e.target.value })}
                    >
                      {ID_PROOF_TYPES.map((t) => (
                        <MenuItem key={t.value} value={t.value}>
                          {t.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>

                  <Grid size={{ xs: 12, sm: 7 }}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Govt ID Number / Document"
                      placeholder={checkInData.govtIdType === "AADHAAR" ? "e.g. 1234 5678 9012" : "e.g. DL-0420110012345"}
                      value={checkInData.govtIdNumber || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const formatted = checkInData.govtIdType === "AADHAAR" ? formatAadhaarNumber(val) : val;
                        setCheckInData({ ...checkInData, govtIdNumber: formatted });
                      }}
                      helperText={
                        checkInData.govtIdType === "AADHAAR" ? (
                          <Typography
                            component="span"
                            variant="caption"
                            sx={{
                              fontWeight: 800,
                              color: validateAadhaar(checkInData.govtIdNumber).isValid ? "#10B981" : "#F59E0B",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 0.5,
                              mt: 0.3,
                            }}
                          >
                            {validateAadhaar(checkInData.govtIdNumber).isValid ? "Valid 12-Digit Aadhaar Number" : validateAadhaar(checkInData.govtIdNumber).message}
                          </Typography>
                        ) : "Official document serial number"
                      }
                    />
                  </Grid>
                </Grid>

                {/* ID Photo Upload Buttons */}
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 2, alignItems: "center" }}>
                  <Button
                    variant={!checkInData.frontImage ? "contained" : "outlined"}
                    component="label"
                    startIcon={checkInData.frontImage ? <Refresh /> : <CloudUpload />}
                    size="small"
                    sx={{
                      borderRadius: "10px",
                      fontWeight: 800,
                      borderColor: !checkInData.frontImage ? "transparent" : themeConfig.border,
                      bgcolor: !checkInData.frontImage ? themeConfig.primary : "transparent",
                      color: !checkInData.frontImage ? "#FFFFFF" : themeConfig.textMain,
                      boxShadow: !checkInData.frontImage ? `0 4px 12px ${themeConfig.primaryGlow}` : "none",
                      "&:hover": {
                        bgcolor: !checkInData.frontImage ? themeConfig.primaryDark : "rgba(0,0,0,0.04)",
                      },
                    }}
                  >
                    {checkInData.frontImage ? "Change Front Photo" : "Upload ID Front Photo"}
                    <input type="file" hidden accept="image/*" onChange={(e) => handleMainGuestImageUpload(e, "front")} />
                  </Button>

                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={checkInData.backImage ? <Refresh /> : <CloudUpload />}
                    size="small"
                    sx={{ borderRadius: "10px", fontWeight: 700, borderColor: themeConfig.border }}
                  >
                    {checkInData.backImage ? "Change Back Photo" : "Upload ID Back Photo"}
                    <input type="file" hidden accept="image/*" onChange={(e) => handleMainGuestImageUpload(e, "back")} />
                  </Button>

                  {/* ID Upload Status / Mandatory Badge */}
                  {!checkInData.frontImage ? (
                    <Chip
                      label="ID Front Photo Required to unlock Step 2"
                      size="small"
                      sx={{
                        fontWeight: 800,
                        bgcolor: "#FEF2F2",
                        color: "#DC2626",
                        border: "1px solid #FCA5A5",
                        fontSize: "0.72rem",
                        height: 24,
                      }}
                    />
                  ) : (
                    <Chip
                      label="ID Proof Attached (Ready for Step 2)"
                      size="small"
                      sx={{
                        fontWeight: 800,
                        bgcolor: "#ECFDF5",
                        color: "#059669",
                        border: "1px solid #A7F3D0",
                        fontSize: "0.72rem",
                        height: 24,
                      }}
                    />
                  )}
                </Box>

                {/* ID Image Preview Cards (Medium Width & Height) */}
                {(checkInData.frontImage || checkInData.backImage) && (
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2.5, mt: 2 }}>
                    {checkInData.frontImage && (
                      <Card
                        sx={{
                          width: { xs: "100%", sm: 220 },
                          height: 140,
                          borderRadius: "14px",
                          border: `1.5px solid ${themeConfig.primary}`,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                          position: "relative",
                          overflow: "hidden",
                          bgcolor: "#F8FAFC",
                        }}
                      >
                        <Box
                          component="img"
                          src={checkInData.frontImage}
                          alt="Main Guest Front ID"
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <Chip
                          label="Front ID"
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            fontWeight: 800,
                            bgcolor: "rgba(0,0,0,0.65)",
                            color: "#FFFFFF",
                            fontSize: "0.68rem",
                            height: 22,
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => setCheckInData((prev) => ({ ...prev, frontImage: "" }))}
                          sx={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            bgcolor: "rgba(239, 68, 68, 0.9)",
                            color: "#FFFFFF",
                            p: 0.4,
                            "&:hover": { bgcolor: "#DC2626" },
                          }}
                        >
                          <Close sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Card>
                    )}

                    {checkInData.backImage && (
                      <Card
                        sx={{
                          width: { xs: "100%", sm: 220 },
                          height: 140,
                          borderRadius: "14px",
                          border: `1.5px solid ${themeConfig.primary}`,
                          boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                          position: "relative",
                          overflow: "hidden",
                          bgcolor: "#F8FAFC",
                        }}
                      >
                        <Box
                          component="img"
                          src={checkInData.backImage}
                          alt="Main Guest Back ID"
                          sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <Chip
                          label="Back ID"
                          size="small"
                          sx={{
                            position: "absolute",
                            top: 8,
                            left: 8,
                            fontWeight: 800,
                            bgcolor: "rgba(0,0,0,0.65)",
                            color: "#FFFFFF",
                            fontSize: "0.68rem",
                            height: 22,
                          }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => setCheckInData((prev) => ({ ...prev, backImage: "" }))}
                          sx={{
                            position: "absolute",
                            top: 6,
                            right: 6,
                            bgcolor: "rgba(239, 68, 68, 0.9)",
                            color: "#FFFFFF",
                            p: 0.4,
                            "&:hover": { bgcolor: "#DC2626" },
                          }}
                        >
                          <Close sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Card>
                    )}
                  </Box>
                )}

                {/* Main Guest Digital E-Signature Pad */}
                <Box sx={{ mt: 3, pt: 2.5, borderTop: `1px dashed ${themeConfig.border}` }}>
                  <DigitalSignaturePad
                    title="Main Guest Digital Signature"
                    signerName={checkInData.fullName || "Primary Guest"}
                    signerRole="Primary Guest"
                    value={checkInData.guestSignature}
                    onChange={(sig) => setCheckInData((prev) => ({ ...prev, guestSignature: sig }))}
                    themeConfig={themeConfig}
                  />
                </Box>
              </Box>
            </Paper>

            {/* PART B: ACCOMPANYING MEMBERS / CO-GUESTS (Couples / Families / Group) */}
            <Paper
              className="card-3d"
              sx={{
                p: 3,
                borderRadius: "20px",
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                border: `1.5px solid ${themeConfig.border}`,
                boxShadow: isDarkMode ? "none" : "0 6px 20px rgba(0,0,0,0.03)",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Avatar sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, width: 34, height: 34 }}>
                    <People sx={{ fontSize: 20 }} />
                  </Avatar>
                  <div>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                      Accompanying Guests & Members ({checkInData.accompanyingGuests?.length || 0})
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                      Add spouse, children, family members, or friends staying together
                    </Typography>
                  </div>
                </Box>

                <Button
                  variant="contained"
                  startIcon={<Add />}
                  size="small"
                  onClick={handleAddMember}
                  className="btn-3d"
                  sx={{
                    background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                    color: "#FFFFFF",
                    fontWeight: 800,
                    borderRadius: "10px",
                    px: 2,
                  }}
                >
                  Add Member / Co-Guest
                </Button>
              </Box>

              {(!checkInData.accompanyingGuests || checkInData.accompanyingGuests.length === 0) ? (
                <Box sx={{ py: 3, textAlign: "center", bgcolor: "rgba(0,0,0,0.02)", borderRadius: "14px", border: `1px dashed ${themeConfig.border}` }}>
                  <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                    No accompanying members added. (Single Guest Stay)
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                    If checking in as a couple, family, or group, click <strong>"Add Member / Co-Guest"</strong> above.
                  </Typography>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {checkInData.accompanyingGuests.map((member, index) => (
                    <Card
                      key={member.id}
                      sx={{
                        p: 2.5,
                        borderRadius: "16px",
                        border: `1.5px solid ${themeConfig.border}`,
                        bgcolor: "#F9FBFC",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Chip
                          label={`Member #${index + 1} (${member.relationship || "Accompanying Guest"})`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: themeConfig.champagne,
                            color: themeConfig.primaryDark,
                          }}
                        />

                        <IconButton
                          size="small"
                          onClick={() => handleRemoveMember(member.id)}
                          sx={{ color: themeConfig.danger, "&:hover": { bgcolor: "rgba(239, 68, 68, 0.1)" } }}
                        >
                          <Delete sx={{ fontSize: 18 }} />
                        </IconButton>
                      </Box>

                      <Grid container spacing={2}>
                        {/* Member Full Name */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Member Full Name"
                            placeholder="e.g. Priya Sharma"
                            value={member.name}
                            onChange={(e) => handleUpdateMember(member.id, "name", e.target.value)}
                            required
                          />
                        </Grid>

                        {/* Relationship */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Relationship to Main Guest"
                            value={member.relationship}
                            onChange={(e) => handleUpdateMember(member.id, "relationship", e.target.value)}
                          >
                            {RELATIONSHIP_OPTIONS.map((rel) => (
                              <MenuItem key={rel} value={rel}>
                                {rel}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        {/* Age & Gender */}
                        <Grid size={{ xs: 6, sm: 2 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Age"
                            placeholder="e.g. 28"
                            value={member.age}
                            onChange={(e) => handleUpdateMember(member.id, "age", e.target.value)}
                          />
                        </Grid>

                        <Grid size={{ xs: 6, sm: 2 }}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="Gender"
                            value={member.gender || "Female"}
                            onChange={(e) => handleUpdateMember(member.id, "gender", e.target.value)}
                          >
                            <MenuItem value="Female">Female</MenuItem>
                            <MenuItem value="Male">Male</MenuItem>
                            <MenuItem value="Other">Other</MenuItem>
                          </TextField>
                        </Grid>

                        {/* Member Contact Phone */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Contact Phone (Optional)"
                            placeholder="e.g. 9876500000"
                            value={member.mobileNumber}
                            onChange={(e) => handleUpdateMember(member.id, "mobileNumber", e.target.value)}
                          />
                        </Grid>

                        {/* Member Email */}
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="Email Address (Optional)"
                            placeholder="e.g. member@example.com"
                            value={member.email}
                            onChange={(e) => handleUpdateMember(member.id, "email", e.target.value)}
                          />
                        </Grid>

                        {/* Member ID Proof Type */}
                        <Grid size={{ xs: 6, sm: 2 }}>
                          <TextField
                            select
                            fullWidth
                            size="small"
                            label="ID Proof Type"
                            value={member.idType || "AADHAAR"}
                            onChange={(e) => handleUpdateMember(member.id, "idType", e.target.value)}
                          >
                            {ID_PROOF_TYPES.map((t) => (
                              <MenuItem key={t.value} value={t.value}>
                                {t.label}
                              </MenuItem>
                            ))}
                          </TextField>
                        </Grid>

                        {/* Member ID Number */}
                        <Grid size={{ xs: 6, sm: 2 }}>
                          <TextField
                            fullWidth
                            size="small"
                            label="ID Proof Number"
                            placeholder={member.idType === "AADHAAR" ? "1234 5678 9012" : "Document #"}
                            value={member.idNumber || ""}
                            onChange={(e) => {
                              const val = e.target.value;
                              const formatted = member.idType === "AADHAAR" ? formatAadhaarNumber(val) : val;
                              handleUpdateMember(member.id, "idNumber", formatted);
                            }}
                            helperText={
                              member.idType === "AADHAAR" ? (
                                <Typography
                                  component="span"
                                  variant="caption"
                                  sx={{
                                    fontSize: "0.68rem",
                                    fontWeight: 800,
                                    color: validateAadhaar(member.idNumber).isValid ? "#10B981" : "#F59E0B",
                                    display: "block",
                                  }}
                                >
                                  {validateAadhaar(member.idNumber).isValid ? "Valid (12-Digit)" : validateAadhaar(member.idNumber).message}
                                </Typography>
                              ) : null
                            }
                          />
                        </Grid>
                      </Grid>

                      {/* Member Photo Attachment Buttons */}
                      <Box sx={{ mt: 2, display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5 }}>
                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={member.frontImage ? <Refresh /> : <CloudUpload />}
                          size="small"
                          sx={{ borderRadius: "8px", fontSize: "0.72rem", fontWeight: 700, borderColor: themeConfig.border }}
                        >
                          {member.frontImage ? "Change Front Photo" : "Upload Member Front ID"}
                          <input type="file" hidden accept="image/*" onChange={(e) => handleMemberImageUpload(e, member.id, "front")} />
                        </Button>

                        <Button
                          variant="outlined"
                          component="label"
                          startIcon={member.backImage ? <Refresh /> : <CloudUpload />}
                          size="small"
                          sx={{ borderRadius: "8px", fontSize: "0.72rem", fontWeight: 700, borderColor: themeConfig.border }}
                        >
                          {member.backImage ? "Change Back Photo" : "Upload Member Back ID"}
                          <input type="file" hidden accept="image/*" onChange={(e) => handleMemberImageUpload(e, member.id, "back")} />
                        </Button>
                      </Box>

                      {/* Member Photo Previews */}
                      {(member.frontImage || member.backImage) && (
                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mt: 1.5 }}>
                          {member.frontImage && (
                            <Card
                              sx={{
                                width: { xs: "100%", sm: 190 },
                                height: 125,
                                borderRadius: "12px",
                                border: `1.5px solid ${themeConfig.primary}`,
                                boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
                                position: "relative",
                                overflow: "hidden",
                                bgcolor: "#F8FAFC",
                              }}
                            >
                              <Box
                                component="img"
                                src={member.frontImage}
                                alt={`Member ${index + 1} Front ID`}
                                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                              <Chip
                                label="Front ID"
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 6,
                                  left: 6,
                                  fontWeight: 800,
                                  bgcolor: "rgba(0,0,0,0.65)",
                                  color: "#FFFFFF",
                                  fontSize: "0.62rem",
                                  height: 20,
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateMember(member.id, "frontImage", "")}
                                sx={{
                                  position: "absolute",
                                  top: 5,
                                  right: 5,
                                  bgcolor: "rgba(239, 68, 68, 0.9)",
                                  color: "#FFFFFF",
                                  p: 0.3,
                                  "&:hover": { bgcolor: "#DC2626" },
                                }}
                              >
                                <Close sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Card>
                          )}

                          {member.backImage && (
                            <Card
                              sx={{
                                width: { xs: "100%", sm: 190 },
                                height: 125,
                                borderRadius: "12px",
                                border: `1.5px solid ${themeConfig.primary}`,
                                boxShadow: "0 3px 10px rgba(0,0,0,0.05)",
                                position: "relative",
                                overflow: "hidden",
                                bgcolor: "#F8FAFC",
                              }}
                            >
                              <Box
                                component="img"
                                src={member.backImage}
                                alt={`Member ${index + 1} Back ID`}
                                sx={{ width: "100%", height: "100%", objectFit: "cover" }}
                              />
                              <Chip
                                label="Back ID"
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 6,
                                  left: 6,
                                  fontWeight: 800,
                                  bgcolor: "rgba(0,0,0,0.65)",
                                  color: "#FFFFFF",
                                  fontSize: "0.62rem",
                                  height: 20,
                                }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => handleUpdateMember(member.id, "backImage", "")}
                                sx={{
                                  position: "absolute",
                                  top: 5,
                                  right: 5,
                                  bgcolor: "rgba(239, 68, 68, 0.9)",
                                  color: "#FFFFFF",
                                  p: 0.3,
                                  "&:hover": { bgcolor: "#DC2626" },
                                }}
                              >
                                <Close sx={{ fontSize: 14 }} />
                              </IconButton>
                            </Card>
                          )}
                        </Box>
                      )}

                      {/* Member Digital E-Signature Pad */}
                      <Box sx={{ mt: 2, pt: 1.8, borderTop: `1px dashed ${themeConfig.border}` }}>
                        <DigitalSignaturePad
                          title={`Member #${index + 1} Signature`}
                          signerName={member.name || `Member #${index + 1}`}
                          signerRole={member.relationship ? `Member (${member.relationship})` : "Co-Guest"}
                          value={member.signature || (checkInData.memberSignatures && checkInData.memberSignatures[member.id])}
                          onChange={(sig) => {
                            handleUpdateMember(member.id, "signature", sig);
                            setCheckInData((prev) => ({
                              ...prev,
                              memberSignature: sig,
                              memberSignatures: {
                                ...(prev.memberSignatures || {}),
                                [member.id]: sig,
                              },
                            }));
                          }}
                          themeConfig={themeConfig}
                        />
                      </Box>
                    </Card>
                  ))}
                </Box>
              )}
            </Paper>
          </Box>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: STAY SCHEDULE & ROOM ALLOCATION                                   */}
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
                      Standard Check-Out is 12:00 PM (Noon)
                    </Typography>
                  </div>
                </Box>

                <Chip
                  label={`Stay: ${checkInData.numberOfNights || nights || 1} Night(s)`}
                  size="small"
                  sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, fontWeight: 800 }}
                />
              </Box>

              <Grid container spacing={2}>
                {/* Check-In Date */}
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Check-In Date"
                    type="date"
                    value={checkInData.checkInDate || getTodayLocalDate()}
                    onChange={(e) => handleCheckInDateChange(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                </Grid>

                {/* Check-In Time */}
                <Grid size={{ xs: 12, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label={checkInData.isCustomCheckInTime ? "Check-In Time (Manual)" : "Check-In Time (Live Real-Time)"}
                    type="time"
                    value={checkInData.isCustomCheckInTime ? checkInData.checkInTime : liveTime}
                    onChange={(e) => setCheckInData({ ...checkInData, checkInTime: e.target.value, isCustomCheckInTime: true })}
                    slotProps={{
                      inputLabel: { shrink: true },
                      input: {
                        endAdornment: (
                          <InputAdornment position="end">
                            <Tooltip title="Reset to live ticking clock">
                              <IconButton
                                size="small"
                                onClick={() => setCheckInData({ ...checkInData, checkInTime: getCurrentLocalTime(), isCustomCheckInTime: false })}
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
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Nights Count"
                    type="number"
                    slotProps={{ htmlInput: { min: 0 } }}
                    placeholder="0"
                    value={checkInData.numberOfNights ?? ""}
                    onChange={(e) => handleNightsChange(e.target.value)}
                  />
                </Grid>

                {/* Check-Out Date */}
                <Grid size={{ xs: 6, sm: 3 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Check-Out Date"
                    type="date"
                    value={checkInData.checkOutDate}
                    onChange={(e) => handleCheckOutDateChange(e.target.value)}
                    slotProps={{ inputLabel: { shrink: true } }}
                    helperText="Fixed 12:00 PM Check-Out"
                  />
                </Grid>
              </Grid>
            </Paper>

            {/* Section 2: Room Assignment & Capacity Check */}
            <Paper
              className="card-3d"
              sx={{
                p: 3,
                borderRadius: "20px",
                bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                border: `1.5px solid ${isCapacityExceeded ? themeConfig.danger : themeConfig.border}`,
                boxShadow: isCapacityExceeded ? "0 0 20px rgba(239, 68, 68, 0.15)" : "none",
              }}
            >
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 1.5 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                  <Avatar sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, width: 34, height: 34 }}>
                    <KingBed sx={{ fontSize: 20 }} />
                  </Avatar>
                  <div>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                      Room Allocation ({selectedRoomsList.length} Room(s) Selected)
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                      Total Party Size: <strong>{totalPartySize} Guest(s)</strong> (1 Primary + {checkInData.accompanyingGuests?.length || 0} Members)
                    </Typography>
                  </div>
                </Box>

                {/* Capacity Status Badge */}
                <Chip
                  label={
                    isCapacityExceeded
                      ? `Capacity Exceeded (${totalPartySize} Guests / ${totalStandardCapacity} Bed Capacity)`
                      : isBufferUsed
                        ? `Extra Bedding Buffer Used (${totalPartySize} Guests / ${totalStandardCapacity} Beds)`
                        : `Capacity Match (${totalPartySize} Guests / ${totalStandardCapacity} Bed Capacity)`
                  }
                  sx={{
                    fontWeight: 900,
                    bgcolor: isCapacityExceeded ? "rgba(239, 68, 68, 0.12)" : isBufferUsed ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                    color: isCapacityExceeded ? "#DC2626" : isBufferUsed ? "#B45309" : "#059669",
                    border: `1px solid ${isCapacityExceeded ? "#EF4444" : isBufferUsed ? "#F59E0B" : "#10B981"}`,
                  }}
                />
              </Box>

              {/* Multi-Room Assignment & Selection */}
              <Box sx={{ mb: 2.5 }}>
                <FormControl fullWidth size="small">
                  <InputLabel id="select-rooms-label" sx={{ fontWeight: 700 }}>Select / Add Room(s)</InputLabel>
                  <Select
                    labelId="select-rooms-label"
                    multiple
                    value={selectedRoomIds}
                    onChange={handleDropdownRoomChange}
                    input={<OutlinedInput label="Select / Add Room(s)" sx={{ borderRadius: "12px" }} />}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                        {selected.map((val) => {
                          const r = rooms.find((x) => x._id === val);
                          return (
                            <Chip
                              key={val}
                              label={`Room #${r?.roomNumber || val} (${getRoomCategoryName(r)})`}
                              size="small"
                              sx={{
                                fontWeight: 800,
                                bgcolor: themeConfig.champagne,
                                color: themeConfig.primaryDark,
                                borderRadius: "8px",
                                height: 24,
                              }}
                            />
                          );
                        })}
                      </Box>
                    )}
                  >
                    {availableRooms.map((r) => {
                      const tariff = getRoomTariff(r);
                      const cap = calculateRoomCapacity(r);
                      return (
                        <MenuItem key={r._id} value={r._id} sx={{ py: 1 }}>
                          <Box sx={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                              Room #{r.roomNumber} &bull; {getRoomCategoryName(r)} (Floor {r.floor || 1})
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 900, color: "#059669" }}>
                              ₹{tariff}/night &bull; 👥 {cap.standardCapacity} Guests
                            </Typography>
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </Select>
                </FormControl>
              </Box>

              {/* Allocated Rooms Summary List */}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" }, gap: 1.5 }}>
                {selectedRoomsList.map((room) => {
                  const tariff = getRoomTariff(room);
                  const cap = calculateRoomCapacity(room);
                  const iconCfg = getRoomCategoryIconConfig(room, 20);

                  return (
                    <Card
                      key={room._id}
                      sx={{
                        p: 1.8,
                        borderRadius: "14px",
                        border: `1.5px solid ${themeConfig.border}`,
                        bgcolor: themeConfig.bgCard || "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, minWidth: 0 }}>
                        <Avatar sx={{ bgcolor: iconCfg.bg, color: iconCfg.color, width: 34, height: 34, borderRadius: "8px", flexShrink: 0 }}>
                          {iconCfg.icon}
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain, lineHeight: 1.2 }}>
                            Room #{room.roomNumber}
                          </Typography>
                          <Typography variant="caption" sx={{ fontWeight: 800, color: iconCfg.color, fontSize: "0.72rem", display: "block" }}>
                            {getRoomCategoryName(room)} &bull; Fl {room.floor || 1}
                          </Typography>
                          <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.7rem", fontWeight: 700 }}>
                            👥 {cap.standardCapacity} Guests &bull; <strong style={{ color: "#059669" }}>₹{Number(tariff).toLocaleString()}</strong>/n
                          </Typography>
                        </Box>
                      </Box>

                      {selectedRoomsList.length > 1 && (
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveSelectedRoom(room._id)}
                          title="Remove Room"
                          sx={{
                            color: themeConfig.danger,
                            p: 0.5,
                            borderRadius: "8px",
                            bgcolor: "rgba(239, 68, 68, 0.06)",
                            "&:hover": { bgcolor: "rgba(239, 68, 68, 0.15)" },
                          }}
                        >
                          <Close sx={{ fontSize: 16 }} />
                        </IconButton>
                      )}
                    </Card>
                  );
                })}
              </Box>
            </Paper>
          </Box>
        )}

        {/* ========================================================================= */}
        {/* STEP 3: BILLING & PAYMENT SETTLEMENT                                      */}
        {/* ========================================================================= */}
        {activeStep === 2 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 3.5 }}>
            <Paper
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
              <TableContainer sx={{ mb: 3, borderRadius: "14px", border: `1px solid ${themeConfig.border}` }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Details</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>
                        Room Tariff ({selectedRoomsList.map((r) => `#${r.roomNumber}`).join(", ") || checkInData.roomNumber})
                      </TableCell>
                      <TableCell align="right">
                        ₹{checkInData.rate ?? 0}/night &times; {checkInData.numberOfNights || nights || 1} Night(s)
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        ₹{baseTariffTotal.toLocaleString()}
                      </TableCell>
                    </TableRow>

                    {isVipGuest && (
                      <TableRow sx={{ bgcolor: "rgba(245, 158, 11, 0.08)" }}>
                        <TableCell sx={{ fontWeight: 800, color: "#B45309" }}>
                          ⭐ VIP Returning Guest Loyalty Discount (10%)
                        </TableCell>
                        <TableCell align="right" sx={{ color: "#B45309", fontWeight: 700 }}>
                          10% Off
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#B45309" }}>
                          -₹{vipDiscountAmount.toLocaleString()}
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
                          +₹{(Number(checkInData.securityDepositAmount) || 1000).toLocaleString()}
                        </TableCell>
                      </TableRow>
                    )}

                    <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                      <TableCell sx={{ fontWeight: 900, fontSize: "1rem" }}>
                        Net Payable Total
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        All Included
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, fontSize: "1.1rem", color: themeConfig.primary }}>
                        ₹{calculatedGrandTotal.toLocaleString()}
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
                      const baseTot = newRate * (checkInData.numberOfNights || 1);
                      const disc = isVipGuest ? Math.round(baseTot * 0.10) : (checkInData.discountAmount || 0);
                      const netTot = Math.max(0, baseTot - disc) + (checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0);
                      setCheckInData({
                        ...checkInData,
                        rate: newRate,
                        total: netTot,
                        paid: netTot,
                        due: 0,
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
                      const netTot = Math.max(0, baseTariffTotal - disc) + (checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0);
                      setCheckInData({
                        ...checkInData,
                        discountAmount: disc,
                        total: netTot,
                        paid: netTot,
                        due: 0,
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

                {/* Amount Paid Advance */}
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Advance Amount Paid (₹)"
                    placeholder="e.g. 3000"
                    value={checkInData.paid ?? calculatedGrandTotal}
                    onChange={(e) => {
                      const p = Number(e.target.value) || 0;
                      setCheckInData({
                        ...checkInData,
                        paid: p,
                        due: Math.max(0, calculatedGrandTotal - p),
                      });
                    }}
                    helperText={`Balance Outstanding: ₹${Math.max(0, calculatedGrandTotal - (checkInData.paid ?? calculatedGrandTotal)).toLocaleString()}`}
                  />
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
        {/* STEP 4: PREVIEW & FINAL CHECK-IN CONFIRMATION                             */}
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
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3, pb: 2, borderBottom: `2px solid ${themeConfig.primary}` }}>
                <div>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                    Folio Pre-Checkin Summary & Registry Review
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                    Verify guest, member, schedule, room, and settlement details before completing check-in
                  </Typography>
                </div>
                <Chip
                  label="Ready for Keycard Allocation"
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
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Full Name:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                      {checkInData.fullName || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>Contact Number:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                      {checkInData.mobile || "N/A"}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>ID Proof:</Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary }}>
                      {checkInData.govtIdType || "AADHAAR"}: {checkInData.govtIdNumber || "On Record"}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>

              {/* 2. Accompanying Members List */}
              {checkInData.accompanyingGuests && checkInData.accompanyingGuests.length > 0 && (
                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.textMain, mb: 1.5 }}>
                    Accompanying Members & Co-Guests ({checkInData.accompanyingGuests.length}):
                  </Typography>
                  <TableContainer sx={{ borderRadius: "12px", border: `1px solid ${themeConfig.border}` }}>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 800 }}>#</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Member Name</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Relationship</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>Age / Gender</TableCell>
                          <TableCell sx={{ fontWeight: 800 }}>ID Proof</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {checkInData.accompanyingGuests.map((m, i) => (
                          <TableRow key={m.id || i}>
                            <TableCell sx={{ fontWeight: 700 }}>{i + 1}</TableCell>
                            <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>{m.name || "Member"}</TableCell>
                            <TableCell>{m.relationship || "Guest"}</TableCell>
                            <TableCell>{m.age ? `${m.age} yrs` : "N/A"} &bull; {m.gender || "Male"}</TableCell>
                            <TableCell>{m.idType || "AADHAAR"}: {m.idNumber || "Attached"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}

              {/* 3. Stay & Room Allocation Details */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Paper sx={{ p: 2, borderRadius: "14px", border: `1px solid ${themeConfig.border}` }}>
                    <Typography variant="caption" sx={{ fontWeight: 900, color: themeConfig.primaryDark, textTransform: "uppercase", display: "block", mb: 0.8 }}>
                      Stay Schedule:
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      In: {checkInData.checkInDate} &bull; {checkInData.checkInTime || liveTime}
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 800 }}>
                      Out: {checkInData.checkOutDate} &bull; 12:00 PM (Noon)
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
                      Party: {totalPartySize} Guest(s) (1 Main + {checkInData.accompanyingGuests?.length || 0} Members)
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* 4. Payment Settlement Summary */}
              <Box sx={{ p: 2, borderRadius: "14px", bgcolor: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.3)" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
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
              </Box>

              {/* 5. DIGITAL E-SIGNATURE VERIFICATION SECTION */}
              <Box sx={{ mt: 3.5, pt: 3, borderTop: `1.5px dashed ${themeConfig.border}` }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, flexWrap: "wrap", gap: 1 }}>
                  <div>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", alignItems: "center", gap: 1 }}>
                      <Draw sx={{ color: themeConfig.primary, fontSize: 22 }} />
                      Digital E-Signature Verification
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                      Collect digital sign-off from Primary Guest and accompanying members for check-in declaration.
                    </Typography>
                  </div>
                  <Chip
                    icon={<Fingerprint style={{ fontSize: 16, color: "#059669" }} />}
                    label="Touchscreen / Mouse E-Sign"
                    size="small"
                    sx={{ bgcolor: "rgba(16, 185, 129, 0.12)", color: "#059669", fontWeight: 800 }}
                  />
                </Box>

                <Grid container spacing={2.5} sx={{ justifyContent: "center" }}>
                  {/* Primary Guest Signature Pad */}
                  <Grid size={{ xs: 12, md: checkInData.accompanyingGuests && checkInData.accompanyingGuests.length > 0 ? 6 : 7, lg: 6 }}>
                    <DigitalSignaturePad
                      title="Primary Guest Signature"
                      signerName={checkInData.fullName || "Main Guest"}
                      signerRole="Primary Guest"
                      value={checkInData.guestSignature}
                      onChange={(sig) => setCheckInData((prev) => ({ ...prev, guestSignature: sig }))}
                      themeConfig={themeConfig}
                    />
                  </Grid>

                  {/* Accompanying Member Signature (Shown if accompanying members exist) */}
                  {checkInData.accompanyingGuests && checkInData.accompanyingGuests.length > 0 && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <DigitalSignaturePad
                        title={`Accompanying Member Signature`}
                        signerName={checkInData.accompanyingGuests[0]?.name || "Co-Guest / Member"}
                        signerRole={checkInData.accompanyingGuests[0]?.relationship ? `Member (${checkInData.accompanyingGuests[0].relationship})` : "Co-Guest"}
                        value={checkInData.memberSignature}
                        onChange={(sig) => setCheckInData((prev) => ({ ...prev, memberSignature: sig }))}
                        themeConfig={themeConfig}
                      />
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Paper>
          </Box>
        )}

        {/* Wizard Footer Navigation Controls */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
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
            Back
          </Button>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: { xs: "100%", sm: "auto" }, justifyContent: { xs: "stretch", sm: "flex-end" } }}>
            {activeStep === 0 && !checkInData.frontImage && (
              <Chip
                label="ID Upload Required"
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
                Continue to Step {activeStep + 2}
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
    </Box>
  );
}
