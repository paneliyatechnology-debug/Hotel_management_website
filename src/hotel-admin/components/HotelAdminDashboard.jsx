"use client";

import { useState, useEffect, useRef } from "react";
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
  let list = [];
  if (Array.isArray(payload)) list = payload;
  else if (Array.isArray(payload?.bookings)) list = payload.bookings;
  else if (Array.isArray(payload?.guests)) list = payload.guests;
  else if (Array.isArray(payload?.data)) list = payload.data;
  else if (Array.isArray(payload?.data?.bookings)) list = payload.data.bookings;
  const rawTotal = payload?.total ?? payload?.pagination?.total ?? payload?.pagination?.totalRecords ?? payload?.pagination?.total_records;
  if (Number.isFinite(Number(rawTotal))) list.total = Number(rawTotal);
  return list;
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

const STAFF_ROLES = ["RECEPTIONIST", "MANAGER", "HOUSEKEEPING", "ACCOUNTANT"];

function normalizeStaffList(res) {
  const payload = res?.data !== undefined ? res.data : res;
  const list = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.users)
      ? payload.users
      : Array.isArray(payload?.records)
        ? payload.records
        : Array.isArray(payload?.data)
          ? payload.data
          : [];

  return list
    .filter((member) => {
      const role = String(member?.role || "").toUpperCase();
      return STAFF_ROLES.some((name) => role.includes(name));
    })
    .map((member) => {
      const inactive =
        member?.is_active === false ||
        member?.isActive === false ||
        member?.is_disabled === true ||
        member?.isDisabled === true ||
        String(member?.status || member?.account_status || "ACTIVE").toUpperCase() === "INACTIVE";
      return {
        ...member,
        _id: member?._id || member?.id,
        id: member?.id || member?._id,
        name: member?.name || member?.full_name || member?.fullName || "",
        email: member?.email || "",
        phone: String(member?.phone || member?.mobile || member?.mobile_number || member?.phone_number || ""),
        role: String(member?.role || "RECEPTIONIST").toUpperCase(),
        shift: member?.shift || "",
        status: inactive ? "INACTIVE" : "ACTIVE",
      };
    });
}

function normalizeRoomTypes(res) {
  const raw = res?.data ?? res;
  const list = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.room_categories)
      ? raw.room_categories
      : Array.isArray(raw?.roomCategories)
        ? raw.roomCategories
        : Array.isArray(raw?.room_types)
          ? raw.room_types
          : Array.isArray(raw?.roomTypes)
            ? raw.roomTypes
            : [];
  const mapped = list.map((cat) => {
    const name =
      readLabel(cat?.name) ||
      readLabel(cat?.title) ||
      readLabel(cat?.type_name) ||
      readLabel(cat?.category_name) ||
      readLabel(cat?.room_type_name);
    return { ...cat, _id: cat?._id || cat?.id, id: cat?.id || cat?._id, name };
  });
  mapped.summary = raw?.room_status_summary || raw?.roomStatusSummary || null;
  mapped.total = Number(raw?.total ?? mapped.length);
  return mapped;
}

function mergeCategoryCounts(current, payload) {
  const incoming = payload?.room_categories || payload?.roomCategories || [];
  const byId = new Map(incoming.map((cat) => [String(cat?.id || cat?._id), cat]));
  const next = (Array.isArray(current) ? current : []).map((cat) => {
    const update = byId.get(String(cat?.id || cat?._id));
    if (!update) return cat;
    const counts = update.room_status_counts || update.roomStatusCounts;
    return counts ? { ...cat, room_status_counts: counts, roomStatusCounts: counts } : cat;
  });
  incoming.forEach((cat) => {
    const id = String(cat?.id || cat?._id || "");
    if (!id || next.some((item) => String(item?.id || item?._id) === id)) return;
    next.push({ ...cat, _id: cat?._id || cat?.id, id: cat?.id || cat?._id, name: cat?.name || "" });
  });
  next.summary = payload?.room_status_summary || payload?.roomStatusSummary || current?.summary || null;
  next.total = current?.total ?? next.length;
  return next;
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
const StaffTeamPage = dynamic(() => import("../pages/StaffTeamPage"), { loading: () => <ComponentSpinner /> });
const RoomTypesPage = dynamic(() => import("../pages/RoomTypesPage"), { loading: () => <ComponentSpinner /> });
const SubscriptionPage = dynamic(() => import("../pages/SubscriptionPage"), { loading: () => <ComponentSpinner /> });

function adaptHotelDashboard(data) {
  if (!data || typeof data !== "object") return data;
  const kpis = data.kpis || {};
  const pulse = data.today_pulse || data.todayPulse || {};
  const weekly = data.weekly_revenue_graph || data.weeklyRevenueGraph || [];
  const methods = data.revenue_by_payment_method || data.revenueByPaymentMethod || {};
  const quota = data.subscription_quota || data.subscriptionQuota || {};
  const weekTotal = Array.isArray(weekly) ? weekly.reduce((sum, day) => sum + Number(day.revenue || 0), 0) : 0;
  const todayRevenue = Number(kpis.today_revenue ?? kpis.todayRevenue ?? 0);
  const monthRevenue = Number(kpis.month_revenue ?? kpis.monthRevenue ?? 0);

  return {
    ...data,
    financials: {
      ...(data.financials || {}),
      todayRevenue,
      monthlyRevenue: monthRevenue,
      weeklyRevenue: weekTotal,
      outstandingDue: Number(kpis.total_outstanding_due ?? kpis.totalOutstandingDue ?? 0),
    },
    weeklyRevenue: {
      totalThisWeek: weekTotal,
      totalCash: Number(methods.CASH ?? methods.cash ?? 0),
      totalUpi: Number(methods.UPI ?? methods.upi ?? 0),
      breakdown: (Array.isArray(weekly) ? weekly : []).map((day) => ({
        date: day.date,
        day: day.day,
        dayName: day.day,
        amount: Number(day.revenue || 0),
        cashAmount: 0,
        upiAmount: 0,
      })),
    },
    operationsSummary: {
      ...(data.operationsSummary || {}),
      currentGuests: Number(pulse.current_in_house_guests ?? pulse.currentInHouseGuests ?? 0),
      checkedInToday: Number(pulse.actual_checked_in_today ?? pulse.actualCheckedInToday ?? 0),
      checkedOutToday: Number(pulse.actual_checked_out_today ?? pulse.actualCheckedOutToday ?? 0),
      occupancyRate: Number(kpis.occupancy_rate_percentage ?? kpis.occupancyRatePercentage ?? 0),
      totalRooms: Number(kpis.total_physical_rooms ?? kpis.totalPhysicalRooms ?? 0),
      activeStaff: Number(kpis.active_staff_count ?? kpis.activeStaffCount ?? 0),
    },
    subscription: data.subscription || (quota.plan_name || quota.planName
      ? {
          plan: quota.plan_name || quota.planName,
          planId: quota.plan_id || quota.planId,
          maxRooms: quota.max_rooms_allowed ?? quota.maxRoomsAllowed,
          roomsConfigured: quota.rooms_configured ?? quota.roomsConfigured,
          status: "ACTIVE",
        }
      : data.subscription),
  };
}

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
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DASHBOARD).then((res) => res?.data && setDashboardData(adaptHotelDashboard(res.data))),
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS).then((res) => setRooms(asRoomList(res))),
          apiRequest(API_ENDPOINTS.RECEPTIONIST.BOOKINGS).then((res) => setBookings(extractRecords(res))),
          apiRequest(API_ENDPOINTS.RECEPTIONIST.GUESTS).then((res) => setGuests(extractRecords(res))),
          apiRequest(`${API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES}?page=1&limit=100`).then((res) => setRoomTypes(normalizeRoomTypes(res))),
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE).then((res) => res?.data?.settings && setHotelSettings(res.data.settings)),
          reloadStaffList()
        );
      } else {
        // Route 0: OVERVIEW / DASHBOARD
        if (tabIndex === 0) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DASHBOARD).then((res) => res?.data && setDashboardData(adaptHotelDashboard(res.data))),
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS).then((res) => setRooms(asRoomList(res))),
            apiRequest(`${API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES}?page=1&limit=100`).then((res) => setRoomTypes(normalizeRoomTypes(res))),
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
        // Route 2: STAFF TEAM
        else if (tabIndex === 2) {
          endpointsToFetch.push(reloadStaffList());
        }
        // Route 3: ROOMS & CATEGORIES
        else if (tabIndex === 3) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DASHBOARD).then((res) => res?.data && setDashboardData(adaptHotelDashboard(res.data))),
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS).then((res) => setRooms(asRoomList(res))),
            apiRequest(`${API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES}?page=1&limit=100`).then((res) => setRoomTypes(normalizeRoomTypes(res)))
          );
        }
        // Route 4: SUBSCRIPTION
        else if (tabIndex === 4) {
          endpointsToFetch.push(
            apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DASHBOARD).then((res) => res?.data && setDashboardData(adaptHotelDashboard(res.data))),
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
        // Route 5: SETTINGS
        else if (tabIndex === 5) {
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
      apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS, { forceRefresh: true, skipDeduplication: true }),
      apiRequest(`${API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES}?page=1&limit=100`, { forceRefresh: true, skipDeduplication: true }),
    ]);
    setRooms(asRoomList(roomsRes));
    setRoomTypes(normalizeRoomTypes(typesRes));
  };

  const reloadStaffList = async () => {
    const res = await apiRequest(`${API_ENDPOINTS.USERS.ALL}?page=1&limit=100`, { forceRefresh: true, skipDeduplication: true });
    setStaffList(normalizeStaffList(res));
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

  useSocket(["room:category_counts"], (payload) => {
    const activeHotelId = getActiveHotelId();
    const eventHotelId = payload?.hotel_id || payload?.hotelId;
    if (eventHotelId && activeHotelId && String(eventHotelId) !== String(activeHotelId)) return;
    setRoomTypes((current) => mergeCategoryCounts(current, payload));
  });

  const showToast = (message, severity = "success") => {
    toast.show(message, severity);
  };

  const staffSaveLock = useRef(false);

  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (staffSaveLock.current) return;

    const name = String(staffModal.data?.name || "").trim();
    const email = String(staffModal.data?.email || "").trim().toLowerCase();
    const cleanPhone = String(staffModal.data?.phone || "").replace(/\D/g, "");
    const role = String(staffModal.data?.role || "").trim().toUpperCase();

    if (name.length < 2) {
      showToast("Enter the staff member’s full name.", "error");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showToast("Enter a valid email address.", "error");
      return;
    }
    if (cleanPhone.length !== 10) {
      showToast("Mobile number must be exactly 10 digits.", "error");
      return;
    }
    if (!STAFF_ROLES.includes(role)) {
      showToast("Select a role.", "error");
      return;
    }

    const staffId = staffModal.data?._id || staffModal.data?.id;
    staffSaveLock.current = true;
    try {
      const effectiveHotelId =
        user?.hotel_id ||
        user?.hotelId ||
        user?.hotel?.id ||
        getActiveHotelId();

      const payload = {
        hotel_id: effectiveHotelId ? Number(effectiveHotelId) : undefined,
        name,
        email,
        phone: cleanPhone,
        role,
        is_active: staffModal.data?.status !== "INACTIVE",
      };

      if (staffModal.mode === "EDIT" && staffId) {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_RECEPTIONIST(staffId), {
          method: "PUT",
          body: payload,
        });
        showToast(res?.message || "Staff member updated.");
      } else {
        const res = await apiRequest(API_ENDPOINTS.USERS.ALL, {
          method: "POST",
          body: {
            ...payload,
            must_change_password: true,
            password: staffModal.data?.password || "StaffPassword@123",
          },
        });
        showToast(res?.message || "Staff member added.");
      }
      await reloadStaffList();
      setStaffModal({ open: false, mode: "ADD", data: getInitialStaffForm() });
    } catch (err) {
      showToast(err.message || "Failed to save staff member.", "error");
    } finally {
      staffSaveLock.current = false;
    }
  };

  const handleToggleStaffStatus = async (staff) => {
    const staffId = staff?._id || staff?.id;
    if (!staffId) return;
    const nextStatus = staff.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    const isActive = nextStatus === "ACTIVE";
    try {
      await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_RECEPTIONIST_STATUS(staffId), {
        method: "PATCH",
        body: { is_active: isActive, is_disabled: !isActive },
      });
      await reloadStaffList();
      showToast(`${staff.name} is now ${nextStatus === "ACTIVE" ? "active" : "inactive"}.`);
    } catch (err) {
      showToast(err.message || "Failed to update staff status.", "error");
    }
  };

  const handleDeleteStaff = (staff) => {
    const staffId = staff?._id || staff?.id;
    setConfirmDelete({
      open: true,
      isDanger: true,
      section: "Staff",
      confirmLabel: "Remove",
      title: "Remove staff member",
      message: `${staff.name} will be removed from the staff directory. Their login will stop working immediately.`,
      onConfirm: async () => {
        try {
          await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DELETE_RECEPTIONIST(staffId), {
            method: "DELETE",
          });
          await reloadStaffList();
          showToast("Staff member removed.");
        } catch (err) {
          showToast(err.message || "Failed to remove staff member.", "error");
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
      if (!Number.isFinite(selectedRoomTypeId) || selectedRoomTypeId <= 0) {
        showToast("Select a room category.", "error");
        return;
      }

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
        await reloadRoomsList();
        showToast(res?.message || `Room ${payload.room_number} updated.`);
        setRoomModal({ open: false, mode: "ADD", data: getInitialRoomForm() });
        return;
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
          await reloadRoomsList();
          showToast(
            createdRooms.length === 1
              ? `Room ${createdRooms[0].roomNumber || createdRooms[0].room_number} created.`
              : `${createdRooms.length} rooms created.`
          );
        }
        if (errors.length > 0) {
          showToast(errors.join(" | "), "error");
          return;
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
      isDanger: true,
      section: "Rooms",
      confirmLabel: "Remove room",
      title: "Remove room",
      message: `Room ${room.roomNumber} on floor ${room.floor || "—"} will be permanently removed.`,
      onConfirm: async () => {
        try {
          await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DELETE_ROOM(room._id || room.id), {
            method: "DELETE",
          });
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
      await reloadRoomsList();
      showToast(`Room ${room.roomNumber} is now ${newStatus}.`);
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
      showToast(`A room category named '${inputName}' already exists.`, "error");
      return;
    }
    const basePrice = Number(typeModal.data.basePrice || typeModal.data.base_price || 0);
    if (!Number.isFinite(basePrice) || basePrice < 0) {
      showToast("Enter a valid base price.", "error");
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
        base_price: basePrice,
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
        showToast(res?.message || "Room category updated.");
      } else {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES, {
          method: "POST",
          body: payload,
        });
        showToast(res?.message || "Room category created.");
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

    const confirmMsg = occupiedRooms.length > 0
      ? `${roomType.name} and its ${linkedRooms.length} room(s) will be deleted. ${occupiedRooms.length} occupied room(s) will be checked out first. Guest records will be kept.`
      : `${roomType.name} and its ${linkedRooms.length} room(s) will be permanently deleted.`;

    setConfirmDelete({
      open: true,
      isDanger: true,
      section: "Room categories",
      confirmLabel: "Delete category",
      title: `Delete ${roomType.name}`,
      message: confirmMsg,
      onConfirm: async () => {
        try {
          const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DELETE_ROOM_TYPE(roomType._id || roomType.id), {
            method: "DELETE",
          });
          await reloadRoomsList();
          showToast(res?.message || "Room category removed.");
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
        section={confirmDelete.section || "Confirmation"}
        message={confirmDelete.message}
        isDanger={confirmDelete.isDanger !== false}
        confirmLabel={confirmDelete.confirmLabel || "Remove"}
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

      {/* ROUTE 2: STAFF TEAM */}
      {activeNav === 2 && (
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
      {activeNav === 3 && (
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
      {activeNav === 4 && (
        <SubscriptionPage
          user={user}
          subscription={dashboardData?.subscription || user?.hotel?.subscription}
          onRefresh={fetchAllData}
        />
      )}

      {/* ROUTE 6: SETTINGS & THEMES */}
      {activeNav === 5 && (
        <SettingsView
          user={{ ...user, hotel: { ...user?.hotel, settings: hotelSettings } }}
          onUpdateHotelSettings={(newSettings) => setHotelSettings(newSettings)}
        />
      )}
    </Box>
  );
}
