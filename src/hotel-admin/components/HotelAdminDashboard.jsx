"use client";

import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { toast } from "@/shared/utils/toast";
import { getActiveHotelId } from "@/shared/utils/cookieAuth";
import dynamic from "next/dynamic";
import { CircularProgress } from "@mui/material";
import { useSocket } from "@/shared/context/SocketContext";

function extractRecords(res) {
  const payload = res?.data !== undefined ? res.data : res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.bookings)) return payload.bookings;
  if (Array.isArray(payload?.guests)) return payload.guests;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.data?.bookings)) return payload.data.bookings;
  return [];
}

function asRoomList(res) {
  const payload = res?.data !== undefined ? res.data : res;
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.rooms)) return payload.rooms;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function readLabel(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (typeof value === "object") return readLabel(value.name || value.title || value.en || value.label);
  return "";
}

function normalizeRoomTypes(res) {
  const raw = res?.data ?? res;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.room_types)
      ? raw.room_types
      : Array.isArray(raw?.roomTypes)
        ? raw.roomTypes
        : [];
  return list.map((cat) => {
    const name =
      readLabel(cat?.name) ||
      readLabel(cat?.title) ||
      readLabel(cat?.type_name) ||
      readLabel(cat?.category_name) ||
      readLabel(cat?.room_type_name);
    return { ...cat, _id: cat?._id || cat?.id, id: cat?.id || cat?._id, name };
  });
}

const ComponentSpinner = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
    <CircularProgress size={36} />
  </Box>
);

const SettingsView = dynamic(() => import("@/shared/components/SettingsView"), { loading: () => <ComponentSpinner /> });
const ConfirmDialog = dynamic(() => import("@/shared/components/ConfirmDialog"));

const HotelOverviewPage = dynamic(() => import("../pages/HotelOverviewPage"), { loading: () => <ComponentSpinner /> });
const GuestListPage = dynamic(() => import("../pages/GuestListPage"), { loading: () => <ComponentSpinner /> });
const DailyCollectionsPage = dynamic(() => import("../pages/DailyCollectionsPage"), { loading: () => <ComponentSpinner /> });
const StaffTeamPage = dynamic(() => import("../pages/StaffTeamPage"), { loading: () => <ComponentSpinner /> });
const RoomTypesPage = dynamic(() => import("../pages/RoomTypesPage"), { loading: () => <ComponentSpinner /> });
const SubscriptionPage = dynamic(() => import("../pages/SubscriptionPage"), { loading: () => <ComponentSpinner /> });

export default function HotelAdminDashboard({ user, activeNav = 0, onTabChange }) {
  const { themeConfig } = useAppTheme();

  const [hotelSettings, setHotelSettings] = useState(
    user?.hotel?.settings || { checkInTime: "14:00", checkOutTime: "12:00", timezone: "Asia/Kolkata" }
  );
  const [dashboardData, setDashboardData] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [guests, setGuests] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchedTabs, setFetchedTabs] = useState({});

  // Filters & Searches
  const [staffSearch, setStaffSearch] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("ALL");
  const [selectedFloor, setSelectedFloor] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modals & Drawers
  const [staffModal, setStaffModal] = useState({ open: false, mode: "ADD", data: getInitialStaffForm() });
  const [viewStaffModal, setViewStaffModal] = useState({ open: false, staff: null });
  const [roomModal, setRoomModal] = useState({ open: false, mode: "ADD", data: getInitialRoomForm() });
  const [typeModal, setTypeModal] = useState({ open: false, mode: "ADD", data: getInitialTypeForm() });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, title: "", message: "", onConfirm: null });

  function getInitialRoomForm(prefillCategory = null) {
    const defaultCat = prefillCategory || roomTypes[0];
    return {
      _id: "",
      roomNumber: "",
      roomType: defaultCat?._id || "",
      floor: "",
      seatingCapacity: "",
      bedCount: "",
      bedType: "",
      customPricePerNight: "",
      status: "AVAILABLE",
      notes: "",
      amenities: [],
    };
  }

  function getInitialTypeForm() {
    return {
      _id: "",
      name: "",
      basePrice: "",
      maxAdults: "",
      maxChildren: "",
      bedCount: "",
      bedType: "",
      description: "",
      amenities: [],
    };
  }

  function getInitialStaffForm() {
    return {
      _id: "",
      name: "",
      email: "",
      phone: "",
      role: "RECEPTIONIST",
      shift: "Morning (07:00 - 15:00)",
      status: "ACTIVE",
    };
  }

  // On-Demand Tab-Specific Data Loading
  const loadTabData = async (tabIndex, forceRefresh = false) => {
    if (!forceRefresh && fetchedTabs[tabIndex]) return;
    if (!dashboardData && !rooms.length && !forceRefresh) {
      setLoading(true);
    }
    try {
      const endpointsToFetch = [];

      if (forceRefresh) {
        endpointsToFetch.push(
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DASHBOARD).then((res) => res?.data && setDashboardData(res.data)),
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS).then((res) => setRooms(asRoomList(res))),
          apiRequest(API_ENDPOINTS.RECEPTIONIST.BOOKINGS).then((res) => setBookings(extractRecords(res))),
          apiRequest(API_ENDPOINTS.RECEPTIONIST.GUESTS).then((res) => setGuests(extractRecords(res))),
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES).then((res) => setRoomTypes(normalizeRoomTypes(res))),
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE).then((res) => res?.data?.settings && setHotelSettings(res.data.settings))
        );
      } else {
        // Route 0: OVERVIEW / DASHBOARD
        if (tabIndex === 0) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DASHBOARD).then((res) => res?.data && setDashboardData(res.data)),
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS).then((res) => setRooms(asRoomList(res))),
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES).then((res) => setRoomTypes(normalizeRoomTypes(res))),
            apiRequest(API_ENDPOINTS.RECEPTIONIST.BOOKINGS).then((res) => setBookings(extractRecords(res))),
            apiRequest(API_ENDPOINTS.RECEPTIONIST.GUESTS).then((res) => setGuests(extractRecords(res))),
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE).then((res) => res?.data?.settings && setHotelSettings(res.data.settings))
          );
        }
        // Route 1: GUEST DIRECTORY & PROFILES
        else if (tabIndex === 1) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.RECEPTIONIST.BOOKINGS).then((res) => setBookings(extractRecords(res))),
            apiRequest(API_ENDPOINTS.RECEPTIONIST.GUESTS).then((res) => setGuests(extractRecords(res))),
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS).then((res) => setRooms(asRoomList(res))),
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE).then((res) => res?.data?.settings && setHotelSettings(res.data.settings))
          );
        }
        // Route 2: DAILY COLLECTIONS
        else if (tabIndex === 2) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE).then((res) => res?.data?.settings && setHotelSettings(res.data.settings))
          );
        }
        // Route 3: STAFF TEAM
        else if (tabIndex === 3) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.RECEPTIONISTS).then((res) => (res?.data || Array.isArray(res)) && setStaffList(res.data || res || []))
          );
        }
        // Route 4: ROOMS & CATEGORIES MASTER
        else if (tabIndex === 4) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DASHBOARD).then((res) => res?.data && setDashboardData(res.data)),
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS).then((res) => setRooms(asRoomList(res))),
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES).then((res) => setRoomTypes(normalizeRoomTypes(res)))
          );
        }
        // Route 5: SUBSCRIPTION
        else if (tabIndex === 5) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DASHBOARD).then((res) => res?.data && setDashboardData(res.data)),
            apiRequest(API_ENDPOINTS.SUBSCRIPTION_PLANS.PUBLIC),
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE).then((res) => {
              const profile = res?.data || res;
              const nextSub = profile?.subscription || profile?.hotel?.subscription;
              if (nextSub) {
                setDashboardData((prev) => ({ ...(prev || {}), subscription: nextSub }));
              }
            })
          );
        }
        // Route 6: SETTINGS
        else if (tabIndex === 6) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE).then((res) => res?.data?.settings && setHotelSettings(res.data.settings))
          );
        }
      }

      await Promise.allSettled(endpointsToFetch);
      if (forceRefresh) {
        setFetchedTabs({ 0: true, 1: true, 2: true, 3: true, 4: true, 5: true, 6: true });
      } else {
        setFetchedTabs((prev) => ({ ...prev, [tabIndex]: true }));
      }
    } catch (err) {
      console.error("Tab data fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTabData(activeNav);
  }, [activeNav]);

  const fetchAllData = async () => {
    await loadTabData(activeNav, true);
  };

  const reloadRoomsList = async () => {
    const [roomsRes, typesRes] = await Promise.all([
      apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS),
      apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES),
    ]);
    setRooms(asRoomList(roomsRes));
    setRoomTypes(normalizeRoomTypes(typesRes));
  };

  // Real-Time Socket Auto-Sync across all operational mutations & subscription changes
  useSocket(
    [
      "ROOM_UPDATED",
      "BOOKING_CREATED",
      "BOOKING_UPDATED",
      "GUEST_CHECKED_OUT",
      "PAYMENT_RECORDED",
      "GUEST_UPDATED",
      "DASHBOARD_SYNC",
      "HANDOVER_SETTLED",
      "HOTEL_STATUS_UPDATED",
      "SUBSCRIPTION_UPDATED",
      "HOTEL_UPDATED",
    ],
    (payload) => {
      if (payload?.subscription || payload?.hotel?.subscription) {
        const newSub = payload.subscription || payload.hotel.subscription;
        setDashboardData((prev) => ({
          ...prev,
          subscription: newSub,
        }));
      }
      fetchAllData();
      reloadRoomsList();
    }
  );

  const showToast = (message, severity = "success") => {
    toast.show(message, severity);
  };

  // Staff CRUD Handlers
  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!staffModal.data.name || !staffModal.data.email || !staffModal.data.phone) {
      showToast("Name, Email, and Phone are required for staff", "error");
      return;
    }

    const cleanPhone = staffModal.data.phone.toString().replace(/\D/g, "");
    if (cleanPhone.length !== 10) {
      showToast("Phone number must contain exactly 10 numeric digits", "error");
      return;
    }

    try {
      const effectiveHotelId =
        user?.hotel_id ||
        user?.hotelId ||
        user?.hotel?.id ||
        getActiveHotelId();

      const payload = {
        hotel_id: effectiveHotelId ? Number(effectiveHotelId) : undefined,
        name: staffModal.data.name,
        email: staffModal.data.email,
        phone: cleanPhone,
        role: staffModal.data.role || "RECEPTIONIST",
        is_active: true,
        must_change_password: true,
        password: staffModal.data.password || "StaffPassword@123",
      };

      if (staffModal.mode === "EDIT" && staffModal.data._id) {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_RECEPTIONIST(staffModal.data._id), {
          method: "PUT",
          body: payload,
        });

        if (res.data) {
          showToast(res.message || "Staff member details updated successfully!");
        }
      } else {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.RECEPTIONISTS, {
          method: "POST",
          body: payload,
        });

        if (res.data) {
          showToast(res.message || "New staff member onboarded and credentials emailed!");
        }
      }
      await fetchAllData();
      setStaffModal({ open: false, mode: "ADD", data: getInitialStaffForm() });
    } catch (err) {
      showToast(err.message || "Failed to save staff account", "error");
    }
  };

  const handleToggleStaffStatus = async (staff) => {
    const nextStatus = staff.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const isActive = nextStatus === "ACTIVE";
    try {
      await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_RECEPTIONIST_STATUS(staff._id || staff.id), {
        method: "PATCH",
        body: { is_active: isActive, is_disabled: !isActive },
      });
      setStaffList(staffList.map((s) => ((s._id === staff._id || s.id === staff.id) ? { ...s, status: nextStatus, is_active: isActive, is_disabled: !isActive } : s)));
      showToast(`Staff member '${staff.name}' is now ${nextStatus}.`);
    } catch (err) {
      showToast(err.message || "Failed to update staff status", "error");
    }
  };

  const handleDeleteStaff = (staff) => {
    setConfirmDelete({
      open: true,
      title: "Remove Staff Member",
      message: `Are you sure you want to remove "${staff.name}" (${staff.role || "Receptionist"}) from the hotel staff directory?`,
      onConfirm: async () => {
        try {
          await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DELETE_RECEPTIONIST(staff._id), {
            method: "DELETE",
          });
          setStaffList(staffList.filter((s) => s._id !== staff._id));
          showToast("Staff member removed from database.");
        } catch (err) {
          showToast(err.message || "Failed to remove staff member", "error");
        } finally {
          setConfirmDelete({ open: false, title: "", message: "", onConfirm: null });
        }
      },
    });
  };

  // Individual Rooms CRUD Handlers
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    if (!roomModal.data.roomNumber || !roomModal.data.roomType) {
      showToast("Room number and room category are required", "error");
      return;
    }

    if (roomModal.mode !== "EDIT") {
      const planUpper = (dashboardData?.subscription?.plan || user?.hotel?.subscription?.plan || "TRIAL").toString().toUpperCase();
      const isTrial = planUpper === "TRIAL" || planUpper === "FREE" || dashboardData?.subscription?.status === "TRIAL" || user?.hotel?.subscription?.status === "TRIAL";
      if (isTrial && rooms.length >= 5) {
        showToast("Trial Plan allows a maximum of 5 rooms. Upgrade to Premium Plan for unlimited rooms.", "warning");
        return;
      }
    }

    try {
      const rawInput = String(roomModal.data.roomNumber).trim();
      let roomNumbersList = [];

      if (rawInput.includes(",")) {
        roomNumbersList = rawInput.split(",").map((s) => s.trim()).filter(Boolean);
      } else if (rawInput.includes("-")) {
        const parts = rawInput.split("-").map((s) => parseInt(s.trim(), 10));
        if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1]) && parts[1] >= parts[0]) {
          for (let num = parts[0]; num <= parts[1]; num++) {
            roomNumbersList.push(String(num));
          }
        } else {
          roomNumbersList = [rawInput];
        }
      } else {
        roomNumbersList = [rawInput];
      }

      const selectedRoomTypeId = Number(
        typeof roomModal.data.roomType === "object"
          ? (roomModal.data.roomType._id || roomModal.data.roomType.id)
          : (roomModal.data.roomType || roomModal.data.room_type_id)
      );

      if (roomModal.mode === "EDIT" && roomModal.data._id) {
        const payload = {
          room_number: roomNumbersList[0] || rawInput,
          room_type_id: selectedRoomTypeId,
          floor: Number(roomModal.data.floor) || 1,
          seating_capacity: Number(roomModal.data.seatingCapacity || roomModal.data.seating_capacity) || 2,
          bed_count: Number(roomModal.data.bedCount || roomModal.data.bed_count) || 1,
          bed_type: roomModal.data.bedType || roomModal.data.bed_type || "1 King Size Bed",
          custom_price_per_night: roomModal.data.customPricePerNight ? Number(roomModal.data.customPricePerNight) : undefined,
          status: roomModal.data.status || "AVAILABLE",
          notes: roomModal.data.notes || "",
          amenities: Array.isArray(roomModal.data.amenities) ? roomModal.data.amenities.join(", ") : (roomModal.data.amenities || ""),
          gst_enabled: false,
          gst_rate: 0,
          cgst_rate: 0,
          sgst_rate: 0,
          tax_inclusive: false,
          is_active: true,
        };
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_ROOM(roomModal.data._id), {
          method: "PUT",
          body: payload,
        });
        if (res.data) {
          setRooms(rooms.map((r) => (r._id === roomModal.data._id ? res.data : r)));
          showToast(`Room ${res.data.room_number || res.data.roomNumber} updated successfully!`);
        }
      } else {
        const createdRooms = [];
        const errors = [];

        const effectiveHotelId =
          user?.hotel_id ||
          user?.hotelId ||
          user?.hotel?.id ||
          getActiveHotelId();

        for (const numStr of roomNumbersList) {
          const payload = {
            hotel_id: effectiveHotelId ? Number(effectiveHotelId) : undefined,
            room_number: String(numStr),
            room_type_id: selectedRoomTypeId,
            floor: Number(roomModal.data.floor) || 1,
            seating_capacity: Number(roomModal.data.seatingCapacity || roomModal.data.seating_capacity) || 2,
            bed_count: Number(roomModal.data.bedCount || roomModal.data.bed_count) || 1,
            bed_type: roomModal.data.bedType || roomModal.data.bed_type || "1 King Size Bed",
            custom_price_per_night: roomModal.data.customPricePerNight ? Number(roomModal.data.customPricePerNight) : undefined,
            status: roomModal.data.status || "AVAILABLE",
            notes: roomModal.data.notes || "",
            amenities: Array.isArray(roomModal.data.amenities) ? roomModal.data.amenities.join(", ") : (roomModal.data.amenities || ""),
            gst_enabled: false,
            gst_rate: 0,
            cgst_rate: 0,
            sgst_rate: 0,
            tax_inclusive: false,
            is_active: true,
          };

          try {
            const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS, {
              method: "POST",
              body: payload,
            });
            if (res.data) {
              createdRooms.push(res.data);
            }
          } catch (err) {
            errors.push(`Room ${numStr}: ${err.message || "Failed"}`);
          }
        }

        if (createdRooms.length > 0) {
          if (createdRooms.length === 1) {
            showToast(`Room ${createdRooms[0].roomNumber || createdRooms[0].room_number} created successfully!`);
          } else {
            showToast(`Successfully created ${createdRooms.length} rooms.`);
          }
          await reloadRoomsList();
        }
        if (errors.length > 0) {
          showToast(errors.join(" | "), "error");
        }
      }
      setRoomModal({ open: false, mode: "ADD", data: getInitialRoomForm() });
    } catch (err) {
      showToast(err.message || "Failed to save room", "error");
    }
  };

  const handleDeleteRoom = (room) => {
    // 🔒 STRICT CHECK: Room must be in AVAILABLE status
    if (room.status !== "AVAILABLE") {
      let statusDesc = room.status;
      if (room.status === "OCCUPIED") statusDesc = "OCCUPIED (Guest is in-house)";
      else if (room.status === "RESERVED") statusDesc = "RESERVED (Booking confirmed)";
      else if (room.status === "CLEANING") statusDesc = "CLEANING (Housekeeping in progress)";
      else if (room.status === "MAINTENANCE") statusDesc = "MAINTENANCE (Repair work in progress)";
      else if (room.status === "BLOCKED") statusDesc = "BLOCKED (Locked by admin)";

      showToast(
        `Cannot delete Room ${room.roomNumber}. It is currently '${statusDesc}'. Rooms must be 'AVAILABLE' to be deleted.`,
        "error"
      );
      return;
    }

    setConfirmDelete({
      open: true,
      title: "Remove Room",
      message: `Are you sure you want to remove Room "${room.roomNumber}" (Floor ${room.floor})? Only AVAILABLE rooms can be removed.`,
      onConfirm: async () => {
        try {
          await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DELETE_ROOM(room._id), {
            method: "DELETE",
          });
          setRooms((prev) => prev.filter((r) => r._id !== room._id && r.id !== room._id));
          await reloadRoomsList();
          showToast(`Room ${room.roomNumber} removed.`);
        } catch (err) {
          showToast(err.message || "Failed to delete room", "error");
        } finally {
          setConfirmDelete({ open: false, title: "", message: "", onConfirm: null });
        }
      },
    });
  };

  const handleUpdateRoomStatus = async (room, newStatus) => {
    try {
      await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_ROOM_STATUS(room._id || room.id), {
        method: "PATCH",
        body: { status: newStatus },
      });
      setRooms(rooms.map((r) => ((r._id === room._id || r.id === room.id) ? { ...r, status: newStatus } : r)));
      showToast(`Room ${room.roomNumber} status set to ${newStatus}.`);
    } catch (err) {
      showToast(err.message || "Failed to update room status", "error");
    }
  };

  // Room Type CRUD Handlers
  const handleSaveRoomType = async (e) => {
    e.preventDefault();
    const inputName = (typeModal.data.name || "").trim();
    if (!inputName) {
      showToast("Category name is required", "error");
      return;
    }

    // Client-side duplicate name check
    const isDuplicate = roomTypes.some(
      (rt) =>
        (rt.name || "").trim().toLowerCase() === inputName.toLowerCase() &&
        (typeModal.mode !== "EDIT" || rt._id !== typeModal.data._id)
    );

    if (isDuplicate) {
      showToast(`A room category named '${inputName}' already exists. Please enter a unique name.`, "error");
      return;
    }

    try {
      const effectiveHotelId =
        user?.hotel_id ||
        user?.hotelId ||
        user?.hotel?.id ||
        getActiveHotelId();

      const payload = {
        hotel_id: effectiveHotelId ? Number(effectiveHotelId) : undefined,
        name: inputName,
        title: inputName,
        description: typeModal.data.description || "",
        base_price: Number(typeModal.data.basePrice || typeModal.data.base_price) || 0,
        max_adults: Number(typeModal.data.maxAdults || typeModal.data.max_adults) || 2,
        max_children: Number(typeModal.data.maxChildren || typeModal.data.max_children) || 0,
        bed_count: Number(typeModal.data.bedCount || typeModal.data.bed_count) || 1,
        bed_type: typeModal.data.bedType || typeModal.data.bed_type || "1 King Size Bed",
        amenities: typeModal.data.amenities || [],
        gst_enabled: false,
        gst_rate: 0,
        cgst_rate: 0,
        sgst_rate: 0,
        tax_inclusive: false,
      };

      if (typeModal.mode === "EDIT" && typeModal.data._id) {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_ROOM_TYPE(typeModal.data._id), {
          method: "PUT",
          body: payload,
        });
        if (res.data) {
          showToast("Room category updated successfully!");
        }
      } else {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES, {
          method: "POST",
          body: payload,
        });
        const created = normalizeRoomTypes({ data: [res?.data || {}] })[0] || {};
        setRoomTypes((prev) => {
          const id = created._id || created.id;
          const next = { ...created, name: created.name || inputName };
          return [next, ...prev.filter((item) => String(item._id || item.id) !== String(id))];
        });
        showToast("Room category created successfully!");
      }
      await reloadRoomsList();
      setTypeModal({ open: false, mode: "ADD", data: getInitialTypeForm() });
    } catch (err) {
      showToast(err.message || "Failed to save room category", "error");
    }
  };

  const handleDeleteRoomType = (roomType) => {
    const linkedRooms = rooms.filter((r) => {
      const typeId = typeof r.roomType === "object" ? r.roomType?._id : r.roomType;
      return typeId === roomType._id;
    });
    const occupiedRooms = linkedRooms.filter((r) => r.status === "OCCUPIED" || r.status === "RESERVED");

    let confirmMsg = `Are you sure you want to delete Room Category "${roomType.name}"? This will delete all ${linkedRooms.length} room(s) assigned to this category.`;
    if (occupiedRooms.length > 0) {
      confirmMsg += ` ${occupiedRooms.length} room(s) currently have resident guests — they will be automatically checked out, and guest profiles and folio records will remain safely preserved.`;
    }

    setConfirmDelete({
      open: true,
      title: `Delete Category "${roomType.name}"`,
      message: confirmMsg,
      onConfirm: async () => {
        try {
          const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DELETE_ROOM_TYPE(roomType._id), {
            method: "DELETE",
          });
          setRoomTypes((prev) => prev.filter((rt) => rt._id !== roomType._id));
          setRooms((prev) =>
            prev.filter((r) => {
              const typeId = typeof r.roomType === "object" ? r.roomType?._id : r.roomType;
              return typeId !== roomType._id;
            })
          );
          showToast(res.message || "Room category and associated rooms deleted successfully.");
          // Refresh background data to sync dashboard metrics & guest directory
          fetchAllData();
        } catch (err) {
          showToast(err.message || "Failed to delete room category", "error");
        } finally {
          setConfirmDelete({ open: false, title: "", message: "", onConfirm: null });
        }
      },
    });
  };

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: themeConfig.bgMain, minHeight: "100%" }}>
      {/* Confirmation Dialog */}
      <ConfirmDialog
        open={confirmDelete.open}
        title={confirmDelete.title}
        message={confirmDelete.message}
        onConfirm={confirmDelete.onConfirm}
        onClose={() => setConfirmDelete({ open: false, title: "", message: "", onConfirm: null })}
      />

      {/* ROUTE 0: OVERVIEW & DASHBOARD */}
      {activeNav === 0 && (
        <HotelOverviewPage
          user={user}
          dashboardData={dashboardData}
          rooms={rooms}
          roomTypes={roomTypes}
          guests={guests}
          bookings={bookings}
          hotelSettings={hotelSettings}
          selectedFloor={selectedFloor}
          setSelectedFloor={setSelectedFloor}
          selectedStatus={selectedStatus}
          setSelectedStatus={setSelectedStatus}
          onRefresh={fetchAllData}
          onTabChange={onTabChange}
        />
      )}

      {/* ROUTE 1: GUEST DIRECTORY & PROFILES */}
      {activeNav === 1 && (
        <GuestListPage
          guests={guests}
          bookings={bookings}
          rooms={rooms}
          hotelSettings={hotelSettings}
          onRefresh={fetchAllData}
        />
      )}

      {/* ROUTE 2: DAILY COLLECTIONS & CASH DRAWER HANDOVER */}
      {activeNav === 2 && (
        <DailyCollectionsPage
          user={user}
          hotelSettings={hotelSettings}
          onRefreshOverview={fetchAllData}
        />
      )}

      {/* ROUTE 3: STAFF TEAM */}
      {activeNav === 3 && (
        <StaffTeamPage
          staffList={staffList}
          staffSearch={staffSearch}
          setStaffSearch={setStaffSearch}
          staffRoleFilter={staffRoleFilter}
          setStaffRoleFilter={setStaffRoleFilter}
          staffModal={staffModal}
          setStaffModal={setStaffModal}
          viewStaffModal={viewStaffModal}
          setViewStaffModal={setViewStaffModal}
          onSaveStaff={handleSaveStaff}
          onDeleteStaff={handleDeleteStaff}
          onToggleStaffStatus={handleToggleStaffStatus}
          getInitialStaffForm={getInitialStaffForm}
        />
      )}

      {/* ROUTE 4: ROOMS & CATEGORIES MASTER */}
      {activeNav === 4 && (
        <RoomTypesPage
          rooms={rooms}
          roomTypes={roomTypes}
          roomModal={roomModal}
          setRoomModal={setRoomModal}
          typeModal={typeModal}
          setTypeModal={setTypeModal}
          onSaveRoom={handleSaveRoom}
          onDeleteRoom={handleDeleteRoom}
          onUpdateRoomStatus={handleUpdateRoomStatus}
          onSaveRoomType={handleSaveRoomType}
          onDeleteRoomType={handleDeleteRoomType}
          getInitialRoomForm={getInitialRoomForm}
          subscription={dashboardData?.subscription || user?.hotel?.subscription}
          onTabChange={onTabChange}
        />
      )}

      {/* ROUTE 5: SUBSCRIPTION & 30-DAY TRIAL */}
      {activeNav === 5 && (
        <SubscriptionPage
          user={user}
          subscription={dashboardData?.subscription || user?.hotel?.subscription}
          onRefresh={fetchAllData}
        />
      )}

      {/* ROUTE 6: SETTINGS & THEMES */}
      {activeNav === 6 && (
        <SettingsView
          user={{ ...user, hotel: { ...user?.hotel, settings: hotelSettings } }}
          onUpdateHotelSettings={(newSettings) => setHotelSettings(newSettings)}
        />
      )}
    </Box>
  );
}
