"use client";

import { useState, useEffect } from "react";
import { Box } from "@mui/material";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { toast } from "@/shared/utils/toast";
import dynamic from "next/dynamic";
import { CircularProgress } from "@mui/material";
import { useSocket } from "@/shared/context/SocketContext";

const ComponentSpinner = () => (
  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 8 }}>
    <CircularProgress size={36} />
  </Box>
);

const SettingsView = dynamic(() => import("@/shared/components/SettingsView"), { loading: () => <ComponentSpinner /> });
const ConfirmDialog = dynamic(() => import("@/shared/components/ConfirmDialog"));

const HotelOverviewPage = dynamic(() => import("../pages/HotelOverviewPage"), { loading: () => <ComponentSpinner /> });
const DailyCollectionsPage = dynamic(() => import("../pages/DailyCollectionsPage"), { loading: () => <ComponentSpinner /> });
const GuestDirectoryPage = dynamic(() => import("../pages/GuestDirectoryPage"), { loading: () => <ComponentSpinner /> });
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
  const [guestSearch, setGuestSearch] = useState("");
  const [guestFilter, setGuestFilter] = useState("ALL");
  const [staffSearch, setStaffSearch] = useState("");
  const [staffRoleFilter, setStaffRoleFilter] = useState("ALL");
  const [selectedFloor, setSelectedFloor] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Modals & Drawers
  const [guestModal, setGuestModal] = useState({ open: false, mode: "ADD", data: getInitialGuestForm() });
  const [viewGuestModal, setViewGuestModal] = useState({ open: false, guest: null });
  const [staffModal, setStaffModal] = useState({ open: false, mode: "ADD", data: getInitialStaffForm() });
  const [viewStaffModal, setViewStaffModal] = useState({ open: false, staff: null });
  const [roomModal, setRoomModal] = useState({ open: false, mode: "ADD", data: getInitialRoomForm() });
  const [typeModal, setTypeModal] = useState({ open: false, mode: "ADD", data: getInitialTypeForm() });
  const [confirmDelete, setConfirmDelete] = useState({ open: false, title: "", message: "", onConfirm: null });

  function getInitialRoomForm(prefillCategory = null) {
    const defaultCat = prefillCategory || roomTypes[0];
    const catGstRate = defaultCat?.gstRate ?? 18;
    return {
      _id: "",
      roomNumber: "",
      roomType: defaultCat?._id || "",
      floor: 1,
      seatingCapacity: defaultCat?.capacity?.adults || 2,
      bedCount: defaultCat?.bedCount || 1,
      bedType: defaultCat?.bedType || "1 King Size Bed",
      customPricePerNight: "",
      status: "AVAILABLE",
      notes: "",
      amenities: defaultCat?.amenities?.length ? [...defaultCat.amenities] : ["Free WiFi", "Air Conditioner (AC)", "Smart LED TV", "Attached Bathroom"],
      gstEnabled: defaultCat?.gstEnabled !== false,
      gstRate: catGstRate,
      cgstRate: defaultCat?.cgstRate ?? catGstRate / 2,
      sgstRate: defaultCat?.sgstRate ?? catGstRate / 2,
      taxInclusive: Boolean(defaultCat?.taxInclusive),
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
      gstEnabled: true,
      gstRate: 18,
      cgstRate: 9,
      sgstRate: 9,
      taxInclusive: false,
    };
  }

  function getInitialGuestForm() {
    const availableRoom = rooms.find((r) => r.status === "AVAILABLE") || rooms[0];
    const defaultPrice = availableRoom?.customPricePerNight || (typeof availableRoom?.roomType === "object" ? availableRoom?.roomType?.basePrice : 0) || availableRoom?.basePrice || 0;
    return {
      _id: "",
      name: "",
      email: "",
      phone: "",
      idType: "AADHAAR",
      idNumber: "",
      address: "",
      roomAssigned: availableRoom ? String(availableRoom.roomNumber) : "",
      checkInDate: new Date().toISOString().split("T")[0],
      checkOutDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
      totalAmount: defaultPrice,
      status: "IN-HOUSE",
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
    if (!dashboardData && !rooms.length) {
      setLoading(true);
    }
    try {
      const endpointsToFetch = [];

      // Route 0: OVERVIEW / DASHBOARD
      if (tabIndex === 0) {
        endpointsToFetch.push(
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DASHBOARD).then((res) => res?.data && setDashboardData(res.data)),
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS).then((res) => (res?.data || Array.isArray(res)) && setRooms(res.data || res || [])),
          apiRequest(API_ENDPOINTS.RECEPTIONIST.BOOKINGS).then((res) => (res?.data || Array.isArray(res)) && setBookings(res.data || res || [])),
          apiRequest(API_ENDPOINTS.RECEPTIONIST.GUESTS).then((res) => (res?.data || Array.isArray(res)) && setGuests(res.data || res || [])),
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE).then((res) => res?.data?.settings && setHotelSettings(res.data.settings))
        );
      }
      // Route 1: DAILY COLLECTIONS
      else if (tabIndex === 1) {
        endpointsToFetch.push(
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE).then((res) => res?.data?.settings && setHotelSettings(res.data.settings))
        );
      }
      // Route 2: GUEST DIRECTORY
      else if (tabIndex === 2) {
        endpointsToFetch.push(
          apiRequest(API_ENDPOINTS.RECEPTIONIST.GUESTS).then((res) => (res?.data || Array.isArray(res)) && setGuests(res.data || res || [])),
          apiRequest(API_ENDPOINTS.RECEPTIONIST.BOOKINGS).then((res) => (res?.data || Array.isArray(res)) && setBookings(res.data || res || [])),
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS).then((res) => (res?.data || Array.isArray(res)) && setRooms(res.data || res || []))
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
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS).then((res) => (res?.data || Array.isArray(res)) && setRooms(res.data || res || [])),
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES).then((res) => (res?.data || Array.isArray(res)) && setRoomTypes(res.data || res || []))
        );
      }
      // Route 5: SUBSCRIPTION
      else if (tabIndex === 5) {
        endpointsToFetch.push(
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DASHBOARD).then((res) => res?.data && setDashboardData(res.data))
        );
      }
      // Route 6: SETTINGS
      else if (tabIndex === 6) {
        endpointsToFetch.push(
          apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE).then((res) => res?.data?.settings && setHotelSettings(res.data.settings))
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
      "HANDOVER_SETTLED",
    ],
    () => {
      fetchAllData(true);
    }
  );

  const showToast = (message, severity = "success") => {
    toast.show(message, severity);
  };

  // Guest CRUD Handlers
  const handleSaveGuest = async (e) => {
    e.preventDefault();
    const guestName = guestModal.data.name || guestModal.data.fullName;
    const guestPhone = guestModal.data.phone || guestModal.data.mobileNumber;
    if (!guestName || !guestPhone) {
      showToast("Guest name and phone number are required", "error");
      return;
    }

    try {
      const selectedRoomList = guestModal.data.selectedRooms || [];
      const combinedRoomNumbers = selectedRoomList.length > 0
        ? selectedRoomList.map((r) => r.roomNumber).join(", ")
        : guestModal.data.roomAssigned || "";

      const payload = {
        fullName: guestName,
        mobileNumber: guestPhone,
        email: guestModal.data.email || "",
        address: guestModal.data.address || "",
        idType: guestModal.data.idType || "AADHAAR",
        idNumber: guestModal.data.idNumber || "PENDING",
        roomAssigned: combinedRoomNumbers,
        roomIds: selectedRoomList.map((r) => r._id || r).filter(Boolean),
        selectedRooms: selectedRoomList,
        roomNumbers: selectedRoomList.map((r) => String(r.roomNumber)).filter(Boolean),
        checkInDate: guestModal.data.checkInDate || "",
        checkOutDate: guestModal.data.checkOutDate || "",
        status: guestModal.data.status || "IN-HOUSE",
        totalAmount: Number(guestModal.data.totalAmount) || 0,
        advancePaid: Number(guestModal.data.advancePaid) || 0,
        accompanyingGuests: guestModal.data.accompanyingGuests || [],
      };

      const res = await apiRequest(API_ENDPOINTS.RECEPTIONIST.GUESTS, {
        method: "POST",
        body: payload,
      });

      if (res.data) {
        await fetchAllData();
        showToast(
          guestModal.mode === "EDIT"
            ? "Guest profile updated successfully!"
            : `New guest registered & ${selectedRoomList.length || 1} room(s) allocated successfully!`
        );
      }
      setGuestModal({ open: false, mode: "ADD", data: getInitialGuestForm() });
    } catch (err) {
      showToast(err.message || "Failed to save guest record", "error");
    }
  };

  const handleDeleteGuest = (guest) => {
    setConfirmDelete({
      open: true,
      title: "Delete Guest Record",
      message: `Are you sure you want to delete guest record for "${guest.name || guest.fullName}"? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await apiRequest(API_ENDPOINTS.RECEPTIONIST.DELETE_GUEST(guest._id), {
            method: "DELETE",
          });
          await fetchAllData();
          showToast("Guest record deleted from database.");
        } catch (err) {
          showToast(err.message || "Failed to delete guest", "error");
        } finally {
          setConfirmDelete({ open: false, title: "", message: "", onConfirm: null });
        }
      },
    });
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
      const payload = {
        name: staffModal.data.name,
        email: staffModal.data.email,
        phone: cleanPhone,
        role: staffModal.data.role || "RECEPTIONIST",
        shift: staffModal.data.shift || "Morning (07:00 - 15:00)",
      };

      if (staffModal.mode === "EDIT" && staffModal.data._id) {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_RECEPTIONIST(staffModal.data._id), {
          method: "PUT",
          body: payload,
        });

        if (res.data) {
          setStaffList(staffList.map((s) => (s._id === staffModal.data._id ? { ...s, ...res.data } : s)));
          showToast(res.message || "Staff member details updated successfully!");
        }
      } else {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.RECEPTIONISTS, {
          method: "POST",
          body: payload,
        });

        if (res.data) {
          setStaffList([res.data, ...staffList]);
          showToast(res.message || "New staff member onboarded and credentials emailed!");
        }
      }
      setStaffModal({ open: false, mode: "ADD", data: getInitialStaffForm() });
    } catch (err) {
      showToast(err.message || "Failed to save staff account", "error");
    }
  };

  const handleToggleStaffStatus = async (staff) => {
    const nextStatus = staff.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
    try {
      await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_RECEPTIONIST_STATUS(staff._id), {
        method: "PUT",
        body: { status: nextStatus },
      });
      setStaffList(staffList.map((s) => (s._id === staff._id ? { ...s, status: nextStatus } : s)));
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

    // 🔓 Unlimited Rooms Allowed in Free Trial

    try {
      const payload = {
        roomNumber: roomModal.data.roomNumber,
        roomType: roomModal.data.roomType,
        floor: Number(roomModal.data.floor) || 1,
        seatingCapacity: Number(roomModal.data.seatingCapacity) || 2,
        bedCount: Number(roomModal.data.bedCount) || 1,
        bedType: roomModal.data.bedType || "1 King Size Bed",
        customPricePerNight: roomModal.data.customPricePerNight ? Number(roomModal.data.customPricePerNight) : undefined,
        status: roomModal.data.status || "AVAILABLE",
        notes: roomModal.data.notes || "",
        amenities: roomModal.data.amenities || [],
        gstEnabled: roomModal.data.gstEnabled !== false,
        gstRate: Number(roomModal.data.gstRate) || 0,
        cgstRate: Number(roomModal.data.cgstRate) || (Number(roomModal.data.gstRate) || 0) / 2,
        sgstRate: Number(roomModal.data.sgstRate) || (Number(roomModal.data.gstRate) || 0) / 2,
        taxInclusive: Boolean(roomModal.data.taxInclusive),
      };

      if (roomModal.mode === "EDIT" && roomModal.data._id) {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_ROOM(roomModal.data._id), {
          method: "PUT",
          body: payload,
        });
        if (res.data) {
          setRooms(rooms.map((r) => (r._id === roomModal.data._id ? res.data : r)));
          showToast(`Room ${res.data.roomNumber} updated successfully!`);
        }
      } else {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS, {
          method: "POST",
          body: payload,
        });
        if (res.data) {
          setRooms([res.data, ...rooms]);
          showToast(`Room ${res.data.roomNumber} created successfully!`);
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
          await fetchAllData();
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
      await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_ROOM_STATUS(room._id), {
        method: "PUT",
        body: { status: newStatus },
      });
      setRooms(rooms.map((r) => (r._id === room._id ? { ...r, status: newStatus } : r)));
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
        rt.name.trim().toLowerCase() === inputName.toLowerCase() &&
        (typeModal.mode !== "EDIT" || rt._id !== typeModal.data._id)
    );

    if (isDuplicate) {
      showToast(`A room category named '${inputName}' already exists. Please enter a unique name.`, "error");
      return;
    }

    try {
      const payload = {
        name: inputName,
        description: typeModal.data.description || "",
        basePrice: Number(typeModal.data.basePrice) || 0,
        capacity: {
          adults: Number(typeModal.data.maxAdults) || 2,
          children: Number(typeModal.data.maxChildren) || 0,
        },
        bedCount: Number(typeModal.data.bedCount) || 1,
        bedType: typeModal.data.bedType || "1 King Size Bed",
        amenities: typeModal.data.amenities || [],
        gstEnabled: typeModal.data.gstEnabled !== false,
        gstRate: Number(typeModal.data.gstRate) || 0,
        cgstRate: Number(typeModal.data.cgstRate) || (Number(typeModal.data.gstRate) || 0) / 2,
        sgstRate: Number(typeModal.data.sgstRate) || (Number(typeModal.data.gstRate) || 0) / 2,
        taxInclusive: Boolean(typeModal.data.taxInclusive),
      };

      if (typeModal.mode === "EDIT" && typeModal.data._id) {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_ROOM_TYPE(typeModal.data._id), {
          method: "PUT",
          body: payload,
        });
        if (res.data) {
          setRoomTypes(roomTypes.map((rt) => (rt._id === typeModal.data._id ? res.data : rt)));
          showToast("Room category updated successfully!");
        }
      } else {
        const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES, {
          method: "POST",
          body: payload,
        });
        if (res.data) {
          setRoomTypes([res.data, ...roomTypes]);
          showToast("Room category created successfully!");
        }
      }
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

      {/* ROUTE 1: DAILY COLLECTIONS & CASH DRAWER HANDOVER */}
      {activeNav === 1 && (
        <DailyCollectionsPage
          user={user}
          hotelSettings={hotelSettings}
          onRefreshOverview={fetchAllData}
        />
      )}

      {/* ROUTE 2: GUEST DIRECTORY */}
      {activeNav === 2 && (
        <GuestDirectoryPage
          guests={guests}
          bookings={bookings}
          rooms={rooms}
          guestSearch={guestSearch}
          setGuestSearch={setGuestSearch}
          guestFilter={guestFilter}
          setGuestFilter={setGuestFilter}
          viewGuestModal={viewGuestModal}
          setViewGuestModal={setViewGuestModal}
          hotelSettings={hotelSettings}
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
