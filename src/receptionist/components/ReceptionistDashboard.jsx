"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Typography,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";
import { Download, Print, WhatsApp, CheckCircle, FileDownload } from "@/shared/icons";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { toast } from "@/shared/utils/toast";
import { sendCheckInWhatsApp, sendCheckoutBillWhatsApp } from "@/shared/utils/whatsappUtils";
import { calculateOverstayFee, formatTime12Hour } from "@/shared/utils/timeUtils";
import SettingsView from "@/shared/components/SettingsView";
import dynamic from "next/dynamic";
import { CircularProgress } from "@mui/material";
import { useSocket } from "@/shared/context/SocketContext";

const ComponentSpinner = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
    <CircularProgress size={36} />
  </Box>
);

const ReceptionistOverviewPage = dynamic(() => import("../pages/ReceptionistOverviewPage"), { loading: () => <ComponentSpinner /> });
const AvailableRoomsPage = dynamic(() => import("../pages/AvailableRoomsPage"), { loading: () => <ComponentSpinner /> });
const InHouseFoliosPage = dynamic(() => import("../pages/InHouseFoliosPage"), { loading: () => <ComponentSpinner /> });
const GuestDirectoryPage = dynamic(() => import("../pages/GuestDirectoryPage"), { loading: () => <ComponentSpinner /> });
const CheckInWizardPage = dynamic(() => import("../pages/CheckInWizardPage"), { loading: () => <ComponentSpinner /> });
const MoreOperationsPage = dynamic(() => import("../pages/MoreOperationsPage"), { loading: () => <ComponentSpinner /> });

export default function ReceptionistDashboard({ user, activeNav = 0, onTabChange, onLogout }) {
  const { themeConfig } = useAppTheme();

  const [hotelSettings, setHotelSettings] = useState(
    user?.hotel?.settings || { checkInTime: "14:00", checkOutTime: "12:00", timezone: "Asia/Kolkata" }
  );
  const [dashboardData, setDashboardData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({ show: false, message: "", severity: "success" });
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [initialSelectedCategory, setInitialSelectedCategory] = useState(null);
  const [checkInSuccessModal, setCheckInSuccessModal] = useState({ open: false, booking: null, guest: null });
  const [fetchedTabs, setFetchedTabs] = useState({});

  // Reset Express Check-In wizard when changing navigation tabs
  useEffect(() => {
    setIsCheckInOpen(false);
  }, [activeNav]);

  // Helper for current local date in YYYY-MM-DD
  const getTodayLocalDate = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Helper for current time in HH:MM
  const getCurrentLocalTime = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  };

  // 4-Step Check-in Stepper State
  const [activeStep, setActiveStep] = useState(0);
  const [checkInData, setCheckInData] = useState({
    fullName: "",
    mobile: "",
    email: "",
    gender: "Male",
    dob: "",
    nationality: "Indian",
    address: "",
    city: "",
    state: "",
    country: "India",
    emergencyContact: "",
    govtIdType: "AADHAAR",
    govtIdNumber: "",
    frontImage: "",
    backImage: "",
    idStatus: "Verified",
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
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    })(),
    checkOutTime: hotelSettings?.checkOutTime || "12:00",
    numberOfNights: 1,
    adults: 1,
    children: 0,
    accompanyingGuests: [],
    rate: 0,
    discountAmount: 0,
    collectSecurityDeposit: false,
    securityDepositAmount: 1000,
    total: 0,
    paid: 0,
    due: 0,
    paymentMethod: "UPI",
    guestSignature: null,
    memberSignature: null,
    memberSignatures: {},
  });

  // Clear any old stale session data on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        sessionStorage.removeItem("saved_checkInData");
      } catch (e) { }
    }
  }, []);

  // Dialogs
  const [posChargeDialog, setPosChargeDialog] = useState({ open: false, booking: null, serviceType: "ROOM_SERVICE", amount: 650, description: "Breakfast & Sparkling Water" });
  const [invoiceModal, setInvoiceModal] = useState({ open: false, booking: null });

  // On-Demand Tab-Specific Data Loading
  const loadTabData = async (tabIndex, forceRefresh = false) => {
    if (!forceRefresh && fetchedTabs[tabIndex]) return;
    if (!dashboardData && !rooms.length && !forceRefresh) {
      setLoading(true);
    }
    try {
      const endpointsToFetch = [];
      const skipCache = { skipCache: true };

      if (forceRefresh) {
        // When forceRefresh is true (e.g. check-in, check-out, socket events),
        // fetch ALL key datasets at once so every view/tab stays 100% live in real-time!
        endpointsToFetch.push(
          apiRequest(API_ENDPOINTS.RECEPTIONIST.DASHBOARD, skipCache).then((res) => res?.data && setDashboardData(res.data)),
          apiRequest(API_ENDPOINTS.RECEPTIONIST.ROOMS, skipCache).then((res) => (res?.data || Array.isArray(res)) && setRooms(res.data || res || [])),
          apiRequest(API_ENDPOINTS.RECEPTIONIST.ROOM_TYPES, skipCache).then((res) => (res?.data || Array.isArray(res)) && setRoomTypes(res.data || res || [])),
          apiRequest(API_ENDPOINTS.RECEPTIONIST.BOOKINGS, skipCache).then((res) => (res?.data || Array.isArray(res)) && setBookings(res.data || res || [])),
          apiRequest(API_ENDPOINTS.RECEPTIONIST.GUESTS, skipCache).then((res) => (res?.data || Array.isArray(res)) && setGuests(res.data || res || []))
        );
      } else {
        // Route 0: OVERVIEW & DASHBOARD
        if (tabIndex === 0) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.RECEPTIONIST.DASHBOARD, skipCache).then((res) => res?.data && setDashboardData(res.data)),
            apiRequest(API_ENDPOINTS.RECEPTIONIST.ROOMS, skipCache).then((res) => (res?.data || Array.isArray(res)) && setRooms(res.data || res || [])),
            apiRequest(API_ENDPOINTS.RECEPTIONIST.ROOM_TYPES, skipCache).then((res) => (res?.data || Array.isArray(res)) && setRoomTypes(res.data || res || [])),
            apiRequest(API_ENDPOINTS.RECEPTIONIST.BOOKINGS, skipCache).then((res) => (res?.data || Array.isArray(res)) && setBookings(res.data || res || [])),
            apiRequest(API_ENDPOINTS.RECEPTIONIST.GUESTS, skipCache).then((res) => (res?.data || Array.isArray(res)) && setGuests(res.data || res || []))
          );
        }
        // Route 1: AVAILABLE ROOMS & CATEGORIES (Receptionist Booking Page)
        else if (tabIndex === 1) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.RECEPTIONIST.ROOMS, skipCache).then((res) => (res?.data || Array.isArray(res)) && setRooms(res.data || res || [])),
            apiRequest(API_ENDPOINTS.RECEPTIONIST.ROOM_TYPES, skipCache).then((res) => (res?.data || Array.isArray(res)) && setRoomTypes(res.data || res || [])),
            apiRequest(API_ENDPOINTS.RECEPTIONIST.BOOKINGS, skipCache).then((res) => (res?.data || Array.isArray(res)) && setBookings(res.data || res || []))
          );
        }
        // Route 2: IN-HOUSE FOLIOS & GUEST DIRECTORY
        else if (tabIndex === 2) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.RECEPTIONIST.BOOKINGS, skipCache).then((res) => (res?.data || Array.isArray(res)) && setBookings(res.data || res || [])),
            apiRequest(API_ENDPOINTS.RECEPTIONIST.GUESTS, skipCache).then((res) => (res?.data || Array.isArray(res)) && setGuests(res.data || res || [])),
            apiRequest(API_ENDPOINTS.RECEPTIONIST.ROOMS, skipCache).then((res) => (res?.data || Array.isArray(res)) && setRooms(res.data || res || []))
          );
        }
        // Route 3: MORE OPERATIONS
        else if (tabIndex === 3) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.RECEPTIONIST.DASHBOARD, skipCache).then((res) => res?.data && setDashboardData(res.data))
          );
        }
      }

      await Promise.allSettled(endpointsToFetch);
      if (forceRefresh) {
        setFetchedTabs({ 0: true, 1: true, 2: true, 3: true });
      } else {
        setFetchedTabs((prev) => ({ ...prev, [tabIndex]: true }));
      }
    } catch (err) {
      console.error("Front desk error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Re-fetch when activeNav changes OR when user is first resolved (page refresh fix)
  useEffect(() => {
    if (!user) return; // Wait for user auth to resolve before fetching
    // Reset fetchedTabs for current tab so data always reloads fresh on tab switch / user change
    setFetchedTabs((prev) => ({ ...prev, [activeNav]: false }));
    loadTabData(activeNav);
  }, [activeNav, user?.id || user?._id || user?.email]);

  // Re-fetch when page becomes visible again (tab switch / window focus after refresh)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && user) {
        loadTabData(activeNav, true);
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [activeNav, user]);

  const fetchFrontDeskData = async (isSilent = false) => {
    await loadTabData(activeNav, true);
  };

  // Real-Time Socket Auto-Sync across all operational mutations
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
      fetchFrontDeskData(true);
    }
  );

  const showToast = (message, severity = "success") => {
    toast.show(message, severity);
  };

  const handleFinalCheckIn = async () => {
    try {
      // Validation: Primary Guest digital signature is strictly mandatory
      if (!checkInData.signature || (typeof checkInData.signature === "string" && !checkInData.signature.trim())) {
        showToast("⚠️ Guest Digital Signature is required before completing check-in.", "error");
        setIsCheckInOpen(true);
        setActiveStep(0);
        return;
      }

      const resolvedRoomIds = (checkInData.roomIds && checkInData.roomIds.length > 0)
        ? checkInData.roomIds.map(String)
        : checkInData.roomId
          ? [String(checkInData.roomId)]
          : (checkInData.selectedRooms && checkInData.selectedRooms.length > 0)
            ? checkInData.selectedRooms.map((r) => String(r._id || r.id || r))
            : [];

      const resolvedRoomNumbers = (checkInData.selectedRooms && checkInData.selectedRooms.length > 0)
        ? checkInData.selectedRooms.map((r) => String(r.roomNumber)).join(", ")
        : (checkInData.selectedRoomNumbers && checkInData.selectedRoomNumbers.length > 0)
          ? checkInData.selectedRoomNumbers.join(", ")
          : checkInData.roomNumber;

      const secDepAmt = checkInData.collectSecurityDeposit ? (Number(checkInData.securityDepositAmount) || 1000) : 0;

      // Single-step Check-In Booking Creation with binary FormData documents & signature
      const effectiveHotelId =
        user?.hotel_id ||
        user?.hotelId ||
        user?.hotel?.id ||
        getActiveHotelId();

      let bookingRoomId = Number(checkInData.roomId || resolvedRoomIds[0] || 0);
      if (!bookingRoomId || bookingRoomId <= 0) {
        const fallbackRoom = rooms?.find((r) => r.status === "AVAILABLE") || rooms?.[0];
        bookingRoomId = Number(fallbackRoom?.id || fallbackRoom?._id || 10);
      }

      const payload = {
        hotel_id: effectiveHotelId ? Number(effectiveHotelId) : undefined,
        room_id: bookingRoomId,
        primary_guest_name: checkInData.fullName || checkInData.guestName || "Walk-in Guest",
        secondary_guest_name: (checkInData.accompanyingGuests && checkInData.accompanyingGuests[0]?.name) || null,
        mobile_number: checkInData.mobile || checkInData.mobileNumber || checkInData.phone || "",
        email: checkInData.email || "",
        address: checkInData.address || "Local Address",
        city: checkInData.city || "",
        state: checkInData.state || "",
        country: checkInData.country || "India",
        gender: checkInData.gender || "Male",
        date_of_birth: checkInData.dateOfBirth || checkInData.dob || "",
        nationality: checkInData.nationality || "Indian",
        id_type: checkInData.govtIdType || "AADHAAR",
        govt_id_type: checkInData.govtIdType || "AADHAAR",
        id_number: checkInData.govtIdNumber || "PENDING",
        govt_id_number: checkInData.govtIdNumber || "PENDING",
        check_in_date: new Date(checkInData.checkInDate || Date.now()).toISOString(),
        check_out_date: new Date(checkInData.checkOutDate || (Date.now() + 86400000)).toISOString(),
        actual_check_in: new Date().toISOString(),
        adults: Number(checkInData.adults) || (1 + (checkInData.accompanyingGuests?.length || 0)),
        children: Number(checkInData.children) || 0,
        base_amount: Number(checkInData.baseAmount || checkInData.total || 0),
        discount_amount: Number(checkInData.discountAmount) || 0,
        extra_charges_total: Number(secDepAmt) || 0,
        gst_rate: Number(checkInData.gstRate) || 18,
        paid_amount: Number(checkInData.paid !== undefined ? checkInData.paid : checkInData.total || 0),
        notes: checkInData.paymentNote || `${checkInData.paymentMethod || "CASH"} settlement at check-in`,
        // Document & Signature photos (converted to binary Blobs and sent via FormData)
        front_image: checkInData.frontImage || checkInData.idProofImage || "",
        back_image: checkInData.backImage || checkInData.idProofBackImage || "",
        signature: checkInData.signature || checkInData.guestSignature || "",
        // Dual-access properties for local UI rendering
        guestId: checkInData.guestId,
        fullName: checkInData.fullName || checkInData.guestName || "Walk-in Guest",
        mobileNumber: checkInData.mobile || checkInData.mobileNumber || checkInData.phone || "",
        checkInDate: checkInData.checkInDate,
        checkOutDate: checkInData.checkOutDate,
        roomId: String(bookingRoomId),
        roomNumber: resolvedRoomNumbers,
        isInstantCheckIn: true,
      };

      const res = await apiRequest(API_ENDPOINTS.RECEPTIONIST.BOOKINGS, {
        method: "POST",
        body: payload,
      });

      const confirmedBooking = res?.data?.booking || res?.data || payload;
      const createdBookingId = confirmedBooking?.id || confirmedBooking?._id || res?.data?.id;

      // Update physical room status to OCCUPIED on server
      try {
        await apiRequest(API_ENDPOINTS.ROOMS.BY_ID(bookingRoomId), {
          method: "PUT",
          body: { status: "OCCUPIED" },
        });
      } catch (e) {
        console.warn("Could not mark room status to OCCUPIED via API:", e);
      }

      // If backend created booking without actual_check_in, ensure it is set
      if (createdBookingId) {
        try {
          await apiRequest(API_ENDPOINTS.BOOKINGS.BY_ID(createdBookingId), {
            method: "PUT",
            body: { actual_check_in: new Date().toISOString() },
          });
        } catch (e) {
          console.warn("Could not update actual_check_in via API:", e);
        }
      }

      // Optimistically update rooms in local state so room turns OCCUPIED instantly
      setRooms((prev) =>
        prev.map((r) =>
          (r.id === bookingRoomId || r._id === bookingRoomId)
            ? { ...r, status: "OCCUPIED", is_available: false }
            : r
        )
      );

      const successMsg = payload.isInstantCheckIn
        ? `Guest ${checkInData.fullName} successfully checked in to Room ${payload.roomNumber}!`
        : `Advance reservation confirmed for ${checkInData.fullName} in Room ${payload.roomNumber} (${payload.checkInDate} to ${payload.checkOutDate})!`;
      showToast(res.message || successMsg);
      setCheckInSuccessModal({
        open: true,
        booking: {
          ...confirmedBooking,
          status: "CHECKED_IN",
          bookingNumber: confirmedBooking.bookingNumber || res?.data?.bookingNumber || `BK-${Date.now().toString().slice(-6)}`,
          roomNumber: payload.roomNumber,
          checkInDate: payload.checkInDate,
          checkOutDate: payload.checkOutDate,
          adults: payload.adults,
          children: payload.children,
          totalAmount: checkInData.total || 0,
          paidAmount: payload.advancePaymentAmount || payload.paid_amount || 0,
        },
        guest: {
          fullName: checkInData.fullName,
          mobile: checkInData.mobile,
          email: checkInData.email,
        },
      });
      await fetchFrontDeskData();
      setActiveStep(0);
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
        adults: 1,
        children: 0,
        accompanyingGuests: [],
        rate: 0,
        discountAmount: 0,
        collectSecurityDeposit: false,
        securityDepositAmount: 1000,
        total: 0,
        paid: 0,
        due: 0,
        paymentMethod: "UPI",
      });
      if (typeof window !== "undefined") {
        try {
          sessionStorage.removeItem("saved_checkInData");
        } catch (e) { }
      }
      setIsCheckInOpen(false);
      if (onTabChange) onTabChange(1);
    } catch (err) {
      showToast(err.message || "Failed to process check-in", "error");
    }
  };

  const handleVerifyGuestId = async (guestId) => {
    try {
      await apiRequest(API_ENDPOINTS.RECEPTIONIST.VERIFY_GUEST_ID(guestId), {
        method: "PUT",
        body: { status: "VERIFIED" },
      });
      setGuests(guests.map((g) => (g._id === guestId ? { ...g, idVerified: true } : g)));
      showToast("Regulatory ID stamped and verified in police ledger!");
    } catch (err) {
      showToast(err.message || "Failed to verify guest ID", "error");
    }
  };

  const handleRoomStatusToggle = async (room, explicitStatus = null) => {
    try {
      const nextStatus =
        explicitStatus ||
        (room.status === "AVAILABLE"
          ? "OCCUPIED"
          : room.status === "OCCUPIED"
            ? "CLEANING"
            : room.status === "CLEANING"
              ? "AVAILABLE"
              : "AVAILABLE");

      await apiRequest(API_ENDPOINTS.RECEPTIONIST.UPDATE_ROOM_STATUS(room._id || room.id), {
        method: "PATCH",
        body: { status: nextStatus },
      });

      setRooms(rooms.map((r) => ((r._id === room._id || r.id === room.id) ? { ...r, status: nextStatus } : r)));
      showToast(`Room ${room.roomNumber} status updated to ${nextStatus}`);
      await fetchFrontDeskData();
    } catch (err) {
      showToast(err.message || "Failed to update room status", "error");
    }
  };

  const handleCheckOut = async (bookingOrId, settlementData = {}) => {
    try {
      const bookingId = typeof bookingOrId === "string" ? bookingOrId : (bookingOrId?._id || bookingOrId?.id);
      const amount = settlementData.settlementPaymentAmount !== undefined
        ? settlementData.settlementPaymentAmount
        : (typeof bookingOrId === "object" ? (bookingOrId.dueAmount || 0) : 0);
      const method = settlementData.paymentMethod || "CASH";

      const res = await apiRequest(API_ENDPOINTS.RECEPTIONIST.CHECKOUT(bookingId), {
        method: "POST",
        body: {
          paid_amount: Number(amount) || 0,
          late_checkout_charge: Number(settlementData.lateCheckoutFee) || 0,
          late_checkout_hours: Number(settlementData.lateCheckoutHours) || 0,
          notes: `Checked out and settled via ${method}${settlementData.transactionId ? ` (Ref: ${settlementData.transactionId})` : ""}`,
        },
      });
      showToast(res.message || "Booking checked out successfully! Room marked for cleaning.");
      await fetchFrontDeskData();
    } catch (err) {
      showToast(err.message || "Failed to process checkout", "error");
    }
  };

  const handleSelectRoomForCheckIn = (roomOrRooms) => {
    if (!roomOrRooms) return;
    let roomsArr = Array.isArray(roomOrRooms) ? roomOrRooms : [roomOrRooms];
    if (roomsArr.length === 0) return;

    // Filter out any rooms that are already occupied, cleaning, or under maintenance
    const trulyAvailable = roomsArr.filter((r) => r && (r.status === "AVAILABLE" || !r.status));
    if (trulyAvailable.length > 0) {
      roomsArr = trulyAvailable;
    }

    const firstRoom = roomsArr[0];
    const totalTariff = roomsArr.reduce((sum, r) => {
      const rt = typeof r.roomType === "object" && r.roomType !== null
        ? r.roomType
        : roomTypes.find((t) => String(t._id) === String(r.roomType));
      return sum + (r.customPricePerNight || rt?.basePrice || r.basePrice || 0);
    }, 0);

    const roomNumbersStr = roomsArr.map((r) => String(r.roomNumber)).join(", ");
    const categoryNames = Array.from(
      new Set(
        roomsArr.map((r) => {
          const rt = typeof r.roomType === "object" && r.roomType !== null
            ? r.roomType
            : roomTypes.find((t) => String(t._id) === String(r.roomType));
          return rt?.name || r.category || r.type || `Room ${r.roomNumber}`;
        })
      )
    ).join(", ");

    // Always start with fresh blank guest data for a new room check-in session
    setCheckInData({
      fullName: "",
      mobile: "",
      email: "",
      address: "",
      city: "",
      state: "",
      country: "India",
      nationality: "Indian",
      gender: "Male",
      govtIdType: "AADHAAR",
      govtIdNumber: "",
      frontImage: "",
      backImage: "",
      signature: "",
      guestSignature: "",
      accompanyingGuests: [],
      activeRoomId: String(firstRoom._id),
      roomId: String(firstRoom._id),
      roomIds: roomsArr.map((r) => String(r._id)),
      roomNumber: roomNumbersStr,
      selectedRooms: roomsArr,
      selectedRoomNumbers: roomsArr.map((r) => String(r.roomNumber)),
      roomType: categoryNames,
      floor: firstRoom.floor || 1,
      rate: totalTariff,
      numberOfNights: 1,
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
      discountAmount: 0,
      total: totalTariff,
      paid: totalTariff,
      due: 0,
    });
    setActiveStep(0);
    setIsCheckInOpen(true);
    if (onTabChange) {
      onTabChange(1);
    }
  };

  const handleDeleteRoom = async (room) => {
    if (!room) return;
    if (room.status !== "AVAILABLE") {
      showToast(`Cannot delete Room ${room.roomNumber} because it is '${room.status}'. Only AVAILABLE rooms can be deleted.`, "error");
      return;
    }
    try {
      const res = await apiRequest(API_ENDPOINTS.RECEPTIONIST.DELETE_ROOM(room._id), {
        method: "DELETE",
      });
      showToast(res.message || `Room ${room.roomNumber} deleted successfully!`);
      await fetchFrontDeskData();
      return res;
    } catch (err) {
      showToast(err.message || "Failed to delete room", "error");
      throw err;
    }
  };

  const handleAddPosCharge = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!posChargeDialog.booking) return;

    const cleanDesc = (posChargeDialog.description || "").trim();
    if (!cleanDesc) {
      showToast("Item or service description is required", "error");
      return;
    }

    const cleanAmount = Number(posChargeDialog.amount);
    if (!posChargeDialog.amount || isNaN(cleanAmount) || cleanAmount < 1) {
      showToast("Charge amount must be a valid positive number (minimum ₹1)", "error");
      return;
    }

    try {
      const res = await apiRequest(API_ENDPOINTS.RECEPTIONIST.ADD_CHARGE(posChargeDialog.booking._id), {
        method: "POST",
        body: {
          type: posChargeDialog.serviceType || "ROOM_SERVICE",
          title: cleanDesc,
          amount: Math.round(cleanAmount),
        },
      });
      showToast(res.message || "POS charge added to guest folio!");
      setPosChargeDialog({ open: false, booking: null, serviceType: "ROOM_SERVICE", amount: "", description: "" });
      await fetchFrontDeskData();
    } catch (err) {
      showToast(err.message || "Failed to add charge", "error");
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: themeConfig.bgMain, pb: 8 }}>
      {/* Toast Notification */}
      {notification.show && (
        <Alert
          severity={notification.severity}
          sx={{
            position: "fixed",
            top: 24,
            right: 24,
            zIndex: 9999,
            boxShadow: themeConfig.shadowModal,
            borderRadius: 0,
            bgcolor: notification.severity === "success" ? "#FAF9F6" : "#FFF5F5",
            border: `1px solid ${notification.severity === "success" ? themeConfig.success : themeConfig.danger}`,
          }}
        >
          {notification.message}
        </Alert>
      )}

      {/* ROUTE 0: MAIN DASHBOARD HOME (Hero Banner, 5 Stat Cards, Category Summary & Recent Guests) */}
      {activeNav === 0 && (
        <ReceptionistOverviewPage
          user={user}
          rooms={rooms}
          roomTypes={roomTypes}
          guests={guests}
          bookings={bookings}
          dashboardData={dashboardData}
          hotelSettings={hotelSettings}
          onRefresh={fetchFrontDeskData}
          onNavigateTab={(tab, categoryId) => {
            if (categoryId) setInitialSelectedCategory(categoryId);
            onTabChange && onTabChange(tab);
          }}
          onSelectRoomForCheckIn={handleSelectRoomForCheckIn}
          onCheckOut={handleCheckOut}
        />
      )}

      {/* ROUTE 1: ROOM CATEGORIES & ROOMS TABLE (Or Express Check-In Wizard) */}
      {activeNav === 1 && (
        <>
          {isCheckInOpen && (
            <CheckInWizardPage
              activeStep={activeStep}
              setActiveStep={setActiveStep}
              checkInData={checkInData}
              setCheckInData={setCheckInData}
              hotelSettings={hotelSettings}
              rooms={rooms}
              roomTypes={roomTypes}
              guests={guests}
              bookings={bookings}
              onFinalCheckIn={handleFinalCheckIn}
              onBackToRooms={() => {
                if (typeof localStorage !== "undefined") {
                  localStorage.removeItem("hotel_checkin_wizard_draft_v1");
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
                setActiveStep(0);
                setIsCheckInOpen(false);
              }}
            />
          )}
          <Box sx={{ display: isCheckInOpen ? 'none' : 'block' }}>
            <AvailableRoomsPage
              user={user}
              initialSelectedCategory={initialSelectedCategory}
              onClearInitialCategory={() => setInitialSelectedCategory(null)}
              rooms={rooms}
              roomTypes={roomTypes}
              guests={guests}
              bookings={bookings}
              dashboardData={dashboardData}
              hotelSettings={hotelSettings}
              onRefresh={fetchFrontDeskData}
              onNavigateTab={(tab) => onTabChange && onTabChange(tab)}
              onRoomStatusChange={handleRoomStatusToggle}
              onCheckOut={handleCheckOut}
              onSelectRoomForCheckIn={handleSelectRoomForCheckIn}
              onDeleteRoom={handleDeleteRoom}
            />
          </Box>
        </>
      )}

      {/* ROUTE 2: IN-HOUSE FOLIOS */}
      {activeNav === 2 && (
        <InHouseFoliosPage
          bookings={bookings}
          hotelSettings={hotelSettings}
          onRefresh={fetchFrontDeskData}
          onCheckOut={handleCheckOut}
          onOpenInvoice={(b) => setInvoiceModal({ open: true, booking: b })}
          onOpenPosCharge={(b) => setPosChargeDialog({ open: true, booking: b, serviceType: "ROOM_SERVICE", amount: 850, description: "Dinner Service" })}
        />
      )}

      {/* ROUTE 3: GUEST DIRECTORY & DOSSIER */}
      {activeNav === 3 && (
        <GuestDirectoryPage
          hotelSettings={hotelSettings}
          onRefresh={fetchFrontDeskData}
        />
      )}

      {/* ROUTE 4: MORE OPERATIONS HUB (User Profile & Session) */}
      {activeNav === 4 && (
        <MoreOperationsPage
          user={{ ...user, hotel: { ...user?.hotel, settings: hotelSettings } }}
          hotelSettings={hotelSettings}
          onLogout={onLogout}
        />
      )}

      {/* POS Charge Modal */}
      <Dialog
        open={posChargeDialog.open}
        onClose={() => setPosChargeDialog({ ...posChargeDialog, open: false })}
        slotProps={{ paper: { sx: { borderRadius: "20px", p: 1, border: `1px solid ${themeConfig.border}`, maxWidth: 480, width: "100%" } } }}
      >
        <form onSubmit={handleAddPosCharge}>
          <DialogTitle component="div" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
            Post Ancillary Charge (Room {posChargeDialog.booking?.roomNumber || posChargeDialog.booking?.room?.roomNumber})
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Charge Category *</InputLabel>
                <Select
                  value={posChargeDialog.serviceType || "ROOM_SERVICE"}
                  label="Charge Category *"
                  onChange={(e) => setPosChargeDialog({ ...posChargeDialog, serviceType: e.target.value })}
                >
                  <MenuItem value="ROOM_SERVICE">🍽️ In-Room Dining / Restaurant</MenuItem>
                  <MenuItem value="LAUNDRY">👔 Express Laundry &amp; Dry Cleaning</MenuItem>
                  <MenuItem value="SPA">💆 Spa &amp; Wellness Therapy</MenuItem>
                  <MenuItem value="MINI_BAR">🥤 Mini Bar Refreshment</MenuItem>
                  <MenuItem value="TRANSPORT">🚕 Airport Shuttle &amp; Cab</MenuItem>
                </Select>
              </FormControl>
              <TextField
                size="small"
                required
                label="Item / Service Description *"
                placeholder="e.g. Dinner Buffet for 2, Dry Cleaning 3 Shirts"
                value={posChargeDialog.description || ""}
                onChange={(e) => setPosChargeDialog({ ...posChargeDialog, description: e.target.value })}
                slotProps={{ htmlInput: { minLength: 2, maxLength: 100 } }}
                fullWidth
              />
              <TextField
                size="small"
                required
                type="number"
                label="Amount (₹) *"
                placeholder="e.g. 1500"
                value={posChargeDialog.amount ?? ""}
                onChange={(e) => setPosChargeDialog({ ...posChargeDialog, amount: e.target.value })}
                slotProps={{
                  htmlInput: { min: "1", step: "1" },
                }}
                error={Boolean(posChargeDialog.amount !== "" && posChargeDialog.amount !== undefined && (isNaN(Number(posChargeDialog.amount)) || Number(posChargeDialog.amount) < 1))}
                helperText={posChargeDialog.amount !== "" && posChargeDialog.amount !== undefined && (isNaN(Number(posChargeDialog.amount)) || Number(posChargeDialog.amount) < 1) ? "Amount must be a positive number (min ₹1)" : "Minimum ₹1 required"}
                fullWidth
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, gap: 1 }}>
            <Button onClick={() => setPosChargeDialog({ ...posChargeDialog, open: false })} sx={{ borderRadius: "10px" }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={!posChargeDialog.description?.trim() || !posChargeDialog.amount || Number(posChargeDialog.amount) < 1}
              className="btn-3d"
              sx={{
                background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                borderRadius: "10px",
                fontWeight: 800,
                color: "#FFFFFF",
              }}
            >
              Post to Folio
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Printable GST Tax Receipt & Invoice Modal */}
      <Dialog
        open={invoiceModal.open}
        onClose={() => setInvoiceModal({ open: false, booking: null })}
        slotProps={{ paper: { sx: { borderRadius: "20px", p: 3, maxWidth: 680, border: `1px solid ${themeConfig.border}` } } }}
      >
        {invoiceModal.booking && (() => {
          const b = invoiceModal.booking;
          const overstay = calculateOverstayFee(b, hotelSettings);
          const posTotal = (b.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
          const taxableSubtotal = (b.totalAmount || 0) + posTotal + (overstay.lateFee || 0);
          const gstAmount = Math.round(taxableSubtotal * 0.12);
          const grandTotalWithGst = taxableSubtotal + gstAmount;
          const paidTotal = b.paidAmount || 0;
          const balanceDue = Math.max(0, taxableSubtotal - paidTotal);

          return (
            <Box sx={{ p: 1 }} id="printable-invoice">
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", pb: 2, borderBottom: `2px solid ${themeConfig.primary}` }}>
                <div>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                    {user?.hotel?.name || "MYOWNPMS"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                    {user?.hotel?.address || "Front Desk Operations Center"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                    GSTIN: {user?.hotel?.gstNumber || "24AAACG1234F1Z5"} &bull; UPI: {hotelSettings?.upiId || "jatinkakadiya234-1@okicici"}
                  </Typography>
                </div>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                    OFFICIAL TAX INVOICE
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                    Folio: #{b.bookingNumber}
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                    Date: {new Date().toLocaleDateString("en-IN")}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ my: 2.5, display: "flex", justifyContent: "space-between", fontSize: "0.85rem", bgcolor: themeConfig.champagne, p: 2, borderRadius: "12px" }}>
                <div>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase" }}>Billed To:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                    {b.guest?.name || b.guest?.fullName || "Resident Guest"}
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                    Phone: {b.guest?.phone || b.guest?.mobileNumber || "N/A"}
                  </Typography>
                </div>
                <Box sx={{ textAlign: "right" }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase" }}>Room Allocation:</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                    Room {b.roomNumber || b.room?.roomNumber}
                  </Typography>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                    In: {b.checkInDate} &bull; Out: {(() => {
                      if (b.actualCheckOut) {
                        const d = new Date(b.actualCheckOut);
                        if (!isNaN(d.getTime())) {
                          const y = d.getFullYear();
                          const m = String(d.getMonth() + 1).padStart(2, "0");
                          const day = String(d.getDate()).padStart(2, "0");
                          return `${y}-${m}-${day}`;
                        }
                      }
                      return b.checkOutDate;
                    })()} ({(() => {
                      if (b.actualCheckOut) {
                        const d = new Date(b.actualCheckOut);
                        if (!isNaN(d.getTime())) {
                          const h = String(d.getHours()).padStart(2, "0");
                          const m = String(d.getMinutes()).padStart(2, "0");
                          return formatTime12Hour(`${h}:${m}`);
                        }
                      }
                      return formatTime12Hour(b.checkOutTime || hotelSettings?.checkOutTime || "12:00");
                    })()})
                  </Typography>
                </Box>
              </Box>

              {overstay.isOverstay && (
                <Box sx={{ mb: 2, p: 1.5, borderRadius: "10px", bgcolor: "rgba(239, 68, 68, 0.08)", border: "1px dashed rgba(239, 68, 68, 0.35)", display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#DC2626" }}>
                    ⏰ Automatic Late Check-Out: Stayed +{overstay.overdueHours}h past scheduled check-out deadline. {overstay.extraDays} Extra Day Room Tariff (+₹{overstay.lateFee.toLocaleString()}) applied.
                  </Typography>
                </Box>
              )}

              <TableContainer sx={{ mb: 2, borderRadius: "12px", border: `1px solid ${themeConfig.border}` }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800 }}>Description</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>Amount (₹)</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Room Accommodation Tariff</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>₹{(b.totalAmount || 0).toLocaleString()}</TableCell>
                    </TableRow>
                    {overstay.isOverstay && (
                      <TableRow sx={{ bgcolor: "rgba(239, 68, 68, 0.04)" }}>
                        <TableCell sx={{ fontWeight: 700, color: "#DC2626" }}>
                          ⏰ Late Check-Out Tariff ({overstay.extraDays} Extra Day past {formatTime12Hour(overstay.scheduledCheckOutTime || "12:00")})
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 800, color: "#DC2626" }}>+₹{overstay.lateFee.toLocaleString()}</TableCell>
                      </TableRow>
                    )}
                    {(b.posCharges || []).map((c, i) => (
                      <TableRow key={i}>
                        <TableCell>POS: {c.item || c.title || c.type || "Ancillary Service"}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700 }}>₹{(c.amount || 0).toLocaleString()}</TableCell>
                      </TableRow>
                    ))}
                    <TableRow sx={{ bgcolor: themeConfig.champagne }}>
                      <TableCell sx={{ fontWeight: 800 }}>CGST (6%) + SGST (6%)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800 }}>
                        ₹{gstAmount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900, fontSize: "1rem" }}>Grand Total (Incl. GST)</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, fontSize: "1.1rem", color: themeConfig.primary }}>
                        ₹{grandTotalWithGst.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: themeConfig.textMuted }}>Amount Paid</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: "#059669" }}>
                        ₹{paidTotal.toLocaleString()}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 900, color: themeConfig.danger }}>Balance Outstanding</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 900, color: themeConfig.danger }}>
                        ₹{balanceDue.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>

              <DialogActions sx={{ p: 0, pt: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: `1px solid ${themeConfig.border}`, mt: 2 }}>
                <Button
                  onClick={() => setInvoiceModal({ open: false, booking: null })}
                  sx={{
                    borderRadius: "10px",
                    fontWeight: 700,
                    color: themeConfig.textMuted,
                    px: 2,
                    "&:hover": { bgcolor: "rgba(0,0,0,0.04)" },
                  }}
                >
                  Close
                </Button>
                <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "nowrap" }}>
                  <Button
                    variant="contained"
                    startIcon={<WhatsApp sx={{ color: "#FFFFFF !important" }} />}
                    onClick={() => {
                      sendCheckoutBillWhatsApp({
                        booking: b,
                        guest: b.guest || { name: b.guestName, mobileNumber: b.guestPhone },
                        hotel: { ...hotelSettings, ...(user?.hotel || {}) },
                        onShowToast: (msg, sev) => showToast(msg, sev),
                      });
                    }}
                    sx={{
                      borderRadius: "10px",
                      fontWeight: 800,
                      fontSize: "0.82rem",
                      bgcolor: "#25D366",
                      color: "#FFFFFF",
                      boxShadow: "0 4px 12px rgba(37, 211, 102, 0.25)",
                      whiteSpace: "nowrap",
                      px: 1.8,
                      "&:hover": { bgcolor: "#1EBE5D" },
                    }}
                  >
                    Send WhatsApp
                  </Button>

                  <Button
                    variant="contained"
                    startIcon={<Print sx={{ fontSize: 18 }} />}
                    onClick={() => {
                      window.print();
                    }}
                    className="btn-3d"
                    sx={{
                      background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                      borderRadius: "10px",
                      fontWeight: 800,
                      fontSize: "0.82rem",
                      whiteSpace: "nowrap",
                      px: 1.8,
                      boxShadow: `0 4px 12px ${themeConfig.primaryGlow}`,
                    }}
                  >
                    Print Invoice
                  </Button>
                </Box>
              </DialogActions>
            </Box>
          );
        })()}
      </Dialog>

      {/* Check-In Success Confirmation & WhatsApp Action Modal */}
      {checkInSuccessModal.open && checkInSuccessModal.booking && (
        <Dialog
          open={checkInSuccessModal.open}
          onClose={() => setCheckInSuccessModal({ open: false, booking: null, guest: null })}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: "20px",
                p: 2.5,
                bgcolor: themeConfig.bgCard,
                border: `1.5px solid ${themeConfig.border}`,
              },
            },
          }}
        >
          <DialogTitle component="div" sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1 }}>
            <CheckCircle sx={{ color: "#10B981", fontSize: 28 }} />
            <Box>
              <Typography variant="h6" component="div" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                Check-In Completed Successfully!
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                Guest has been assigned to Room {checkInSuccessModal.booking?.roomNumber}
              </Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers sx={{ borderColor: themeConfig.border }}>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, py: 1 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Guest Name:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                  {checkInSuccessModal.guest?.fullName || checkInSuccessModal.booking?.guestName || "Resident Guest"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Mobile Number:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary }}>
                  {checkInSuccessModal.guest?.mobile || checkInSuccessModal.booking?.guestPhone || "N/A"}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Booking Ref #:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 800, fontFamily: "monospace" }}>
                  #{checkInSuccessModal.booking?.bookingNumber}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Room Allocation:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.primaryDark }}>
                  Room {checkInSuccessModal.booking?.roomNumber}
                </Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>Check-in & Check-out:</Typography>
                <Typography variant="body2" sx={{ fontWeight: 700 }}>
                  {checkInSuccessModal.booking?.checkInDate} to {checkInSuccessModal.booking?.checkOutDate}
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2, display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 1 }}>
            <Button
              variant="outlined"
              onClick={() => setCheckInSuccessModal({ open: false, booking: null, guest: null })}
              sx={{ borderRadius: "10px", fontWeight: 700, borderColor: themeConfig.border, color: themeConfig.textMain }}
            >
              Close
            </Button>
            <Box sx={{ display: "flex", gap: 1 }}>
              <Button
                variant="contained"
                startIcon={<WhatsApp sx={{ color: "#FFFFFF" }} />}
                onClick={() => {
                  sendCheckInWhatsApp({
                    booking: checkInSuccessModal.booking,
                    guest: checkInSuccessModal.guest,
                    hotel: user?.hotel || {},
                    onShowToast: (msg, sev) => showToast(msg, sev),
                  });
                }}
                sx={{
                  borderRadius: "10px",
                  fontWeight: 800,
                  bgcolor: "#25D366",
                  color: "#FFFFFF",
                  boxShadow: "0 4px 12px rgba(37, 211, 102, 0.35)",
                  "&:hover": { bgcolor: "#1EBE5D" },
                }}
              >
                Send WhatsApp
              </Button>
              <Button
                onClick={() => setCheckInSuccessModal({ open: false, booking: null, guest: null })}
                variant="outlined"
                sx={{ borderRadius: "10px", fontWeight: 700 }}
              >
                Done
              </Button>
            </Box>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
}
