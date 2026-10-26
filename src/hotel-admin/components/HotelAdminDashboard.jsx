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
import { mergeCategoryCounts } from "@/shared/utils/liveSync";
import { amountFromPaymentCollections } from "@/shared/hooks/useHotelPaymentMethods";

function readLabel(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number") return String(value).trim();
  if (typeof value === "object") return readLabel(value.name || value.title || value.en || value.label);
  return "";
}

const STAFF_ROLES = ["RECEPTIONIST", "MANAGER", "HOUSEKEEPING", "ACCOUNTANT"];

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

const ComponentSpinner = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
    <CircularProgress size={36} />
  </Box>
);

const GstReportPage = dynamic(() => import("@/hotel-admin/pages/GstReportPage"), { loading: () => <ComponentSpinner /> });
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
  const methods =
    data.collection_by_payment_method ||
    data.collectionByPaymentMethod ||
    data.revenue_by_payment_method ||
    data.revenueByPaymentMethod ||
    [];
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
      totalCash: amountFromPaymentCollections(methods, "CASH"),
      totalUpi: amountFromPaymentCollections(methods, "UPI"),
      breakdown: (Array.isArray(weekly) ? weekly : []).map((day) => ({
        date: day.date,
        day: day.day,
        dayName: day.day,
        amount: Number(day.revenue || 0),
        cashAmount: Number(day.cash || 0),
        upiAmount: Number(day.upi || 0),
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

export default function HotelAdminDashboard({ user, activeNav = 0, navClick = null, onTabChange }) {
  const { themeConfig } = useAppTheme();

  const [hotelSettings, setHotelSettings] = useState(
    user?.hotel?.settings || { checkInTime: "14:00", checkOutTime: "12:00", timezone: "Asia/Kolkata" }
  );
  const [dashboardData, setDashboardData] = useState(null);
  const [roomTypes, setRoomTypes] = useState([]);
  const [roomsRefreshToken, setRoomsRefreshToken] = useState(0);
  const [staffRefreshToken, setStaffRefreshToken] = useState(0);
  const [loading, setLoading] = useState(true);
  const [fetchedTabs, setFetchedTabs] = useState({});
  const dashboardFromApi = useRef(false);
  // Re-fetch /dashboard only when KPIs changed (socket), not on every Overview visit
  const dashboardStale = useRef(true);

  const loadDashboard = () =>
    apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DASHBOARD)
      .then((res) => {
        if (res?.data) {
          dashboardFromApi.current = true;
          dashboardStale.current = false;
          setDashboardData(adaptHotelDashboard(res.data));
        }
      })
      .catch(() => {
        dashboardFromApi.current = false;
      });

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
      bedsConfig: [],
      bedCount: 0,
      bedType: "",
      seatingCapacity: 0,
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
      status: "ACTIVE",
    };
  }

  // Page-scoped loading — never dump every list into overview.
  // Overview keeps cached KPIs unless a live event marked dashboardStale.
  const loadTabData = async (tabIndex, forceRefresh = false) => {
    if (!forceRefresh && fetchedTabs[tabIndex]) {
      // Returning to Overview: only hit /dashboard when data actually changed
      if (tabIndex !== 0 || !dashboardStale.current) return;
    }
    if (tabIndex === 0 && !dashboardData) setLoading(true);
    else if (tabIndex !== 0 && tabIndex !== 1 && tabIndex !== 2 && tabIndex !== 4 && tabIndex !== 5) setLoading(true);
    try {
      const endpointsToFetch = [];

      if (tabIndex === 0) {
        // Guest table is owned by HotelOverviewPage; KPIs only when missing/stale
        if (forceRefresh || !dashboardData || dashboardStale.current) {
          endpointsToFetch.push(loadDashboard());
        }
      } else if (tabIndex === 1) {
        // GuestListPage owns bookings pagination
      } else if (tabIndex === 2) {
        // StaffTeamPage owns users list pagination + search
      } else if (tabIndex === 3) {
        // Categories list uses room-types (+ status counts). Rooms load inside RoomTypesPage when a category opens.
        endpointsToFetch.push(
          apiRequest(`${API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES}?page=1&limit=12`).then((res) =>
            setRoomTypes(normalizeRoomTypes(res))
          )
        );
      } else if (tabIndex === 5) {
        // SubscriptionPage owns subscription-plans fetch; current plan comes from user/dashboard props
      } else if (tabIndex === 6) {
        endpointsToFetch.push(
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE).then(
            (res) => res?.data?.settings && setHotelSettings(res.data.settings)
          )
        );
      }

      await Promise.allSettled(endpointsToFetch);
      setFetchedTabs((prev) => ({ ...prev, [tabIndex]: true }));
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
    // Only refresh the active tab’s needed APIs — never every list at once
    setFetchedTabs((prev) => ({ ...prev, [activeNav]: false }));
    await loadTabData(activeNav, true);
  };

  const reloadRoomsList = async () => {
    if (activeNav !== 3) return;
    const typesRes = await apiRequest(`${API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES}?page=1&limit=12`);
    setRoomTypes(normalizeRoomTypes(typesRes));
    setRoomsRefreshToken((n) => n + 1);
  };

  const reloadStaffList = async () => {
    setStaffRefreshToken((n) => n + 1);
  };

  // Staff list live refresh is owned by StaffTeamPage

  useSocket(
    ["SUBSCRIPTION_UPDATED", "HOTEL_UPDATED", "TRIAL_REQUEST_APPROVED", "TRIAL_REQUEST_REJECTED", "HOTEL_STATUS_UPDATED"],
    () => {
      dashboardStale.current = true;
      if (activeNav === 0) loadDashboard();
    }
  );

  // Keep category badge counts fresh even when Rooms tab is not open
  useSocket(["room:category_counts"], (payload) => {
    const activeHotelId = getActiveHotelId();
    const eventHotelId = payload?.hotel_id || payload?.hotelId;
    if (eventHotelId && activeHotelId && String(eventHotelId) !== String(activeHotelId)) return;
    setRoomTypes((current) => mergeCategoryCounts(current, payload));
  });

  // KPI changes: patch from socket payload when present, otherwise mark stale / refetch
  useSocket(
    ["dashboard:updated", "PAYMENT_RECORDED", "GUEST_CHECKED_OUT", "BOOKING_CREATED", "DASHBOARD_SYNC"],
    (payload, eventName) => {
      if (eventName === "dashboard:updated" && payload?.data && typeof payload.data === "object") {
        dashboardFromApi.current = true;
        dashboardStale.current = false;
        setDashboardData((prev) => {
          const next = adaptHotelDashboard(payload.data);
          return prev?.subscription && !payload.data.subscription ? { ...next, subscription: prev.subscription } : next;
        });
        return;
      }
      dashboardStale.current = true;
      if (activeNav === 0) loadDashboard();
    }
  );

  // Parent rooms dump is unused; Rooms page owns its list. Still bump refresh so open category reloads.
  useSocket(["room:status", "GUEST_CHECKED_OUT"], () => {
    setRoomsRefreshToken((n) => n + 1);
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
      const configuredRooms = Number(
        dashboardData?.operationsSummary?.totalRooms ??
          dashboardData?.subscription?.roomsConfigured ??
          roomTypes?.summary?.total_room_count ??
          roomTypes?.summary?.totalRoomCount ??
          0
      );
      if (isTrial && configuredRooms >= 5) {
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

      const bedsSource = Array.isArray(roomModal.data.bedsConfig) && roomModal.data.bedsConfig.length
        ? roomModal.data.bedsConfig
        : [{ type: roomModal.data.bedType || "King Bed", count: Number(roomModal.data.bedCount) || 1 }];
      const roomPayload = (roomNumber) => ({
        room_number: String(roomNumber),
        room_type_id: selectedRoomTypeId,
        floor: Number(roomModal.data.floor) || 1,
        beds: bedsSource.map((bed) => ({
          bed_type: bed.type || bed.bed_type || bed.bedType || "King",
          bed_count: Number(bed.count || bed.bed_count || bed.bedCount) || 1,
        })),
        custom_price_per_night: Number(roomModal.data.customPricePerNight || roomModal.data.custom_price_per_night) || 0,
        notes: roomModal.data.notes || "",
        amenities: Array.isArray(roomModal.data.amenities) ? roomModal.data.amenities : [],
        cleaning_duration_minutes: Number(roomModal.data.cleaningDurationMinutes || roomModal.data.cleaning_duration_minutes) || 15,
        is_active: roomModal.data.is_active !== false && roomModal.data.isActive !== false,
      });

      if (roomModal.mode === "EDIT" && roomModal.data._id) {
        const payload = roomPayload(roomNumbersList[0] || rawInput);
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

        for (const numStr of roomNumbersList) {
          const payload = roomPayload(numStr);

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
      const num = room.roomNumber || room.room_number || "";
      const label =
        newStatus === "AVAILABLE" ? "Available" :
        newStatus === "CLEANING" ? "Cleaning" :
        newStatus === "MAINTENANCE" ? "Maintenance" :
        newStatus === "BLOCKED" ? "Blocked" : newStatus;
      showToast(`Room ${num} is now ${label}.`);
    } catch (err) {
      showToast(err.message || "Failed to update room status", "error");
      throw err;
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
    const counts = roomType?.room_status_counts || roomType?.roomStatusCounts || {};
    const linkedCount = Number(
      counts.total_room_count ?? counts.totalRoomCount ?? roomType?.total_rooms ?? roomType?.totalRooms ?? 0
    ) || 0;
    const occupiedCount =
      Number(counts.occupied_count ?? counts.occupiedCount ?? 0) +
      Number(counts.reserved_count ?? counts.reservedCount ?? 0);

    const confirmMsg = occupiedCount > 0
      ? `${roomType.name} and its ${linkedCount} room(s) will be deleted. ${occupiedCount} occupied room(s) will be checked out first. Guest records will be kept.`
      : linkedCount > 0
        ? `${roomType.name} and its ${linkedCount} room(s) will be permanently deleted.`
        : `${roomType.name} will be permanently deleted.`;

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
          hotelSettings={hotelSettings}
          onRefresh={() => loadDashboard()}
          onTabChange={onTabChange}
        />
      )}

      {/* ROUTE 1: GUEST DIRECTORY & PROFILES */}
      {activeNav === 1 && (
        <GuestListPage
          hotelSettings={hotelSettings}
          defaultRowsPerPage={10}
        />
      )}

      {/* ROUTE 2: STAFF TEAM */}
      {activeNav === 2 && (
        <StaffTeamPage
          staffRefreshToken={staffRefreshToken}
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
          resetToken={navClick?.tab === 3 ? navClick.id : 0}
          roomsRefreshToken={roomsRefreshToken}
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
          hotelSettings={hotelSettings}
        />
      )}

      {/* ROUTE 4: GST REPORT */}
      {activeNav === 4 && <GstReportPage hotelSettings={hotelSettings} />}

      {/* ROUTE 5: SUBSCRIPTION & 30-DAY TRIAL */}
      {activeNav === 5 && (
        <SubscriptionPage
          user={user}
          subscription={dashboardData?.subscription || user?.hotel?.subscription}
        />
      )}

      {/* ROUTE 6: SETTINGS */}
      {activeNav === 6 && (
        <SettingsView
          user={{ ...user, hotel: { ...user?.hotel, settings: hotelSettings } }}
          onUpdateHotelSettings={(newSettings) => setHotelSettings(newSettings)}
        />
      )}
    </Box>
  );
}
