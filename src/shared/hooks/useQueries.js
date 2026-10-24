"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { API_ENDPOINTS, apiRequest } from "@/config/api";

// ============================================================================
// 1. SUPER ADMIN QUERIES
// ============================================================================

export function useSuperAdminDashboard(options = {}) {
  return useQuery({
    queryKey: ["super-admin", "dashboard"],
    queryFn: async () => {
      const res = await apiRequest(API_ENDPOINTS.SUPER_ADMIN.DASHBOARD);
      return res?.data || null;
    },
    staleTime: 60 * 1000,
    ...options,
  });
}

export function useSuperAdminHotels({ page = 1, limit = 20, search, status, ...options } = {}) {
  return useQuery({
    queryKey: ["super-admin", "hotels", page, limit, search, status],
    queryFn: async () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", String(search));
      if (status && status !== "ALL") params.set("status", String(status));
      const res = await apiRequest(`${API_ENDPOINTS.SUPER_ADMIN.HOTELS}?${params.toString()}`);
      return res?.data || [];
    },
    staleTime: 60 * 1000,
    ...options,
  });
}

// ============================================================================
// 2. HOTEL ADMIN QUERIES
// ============================================================================

export function useHotelAdminDashboard(options = {}) {
  return useQuery({
    queryKey: ["hotel-admin", "dashboard"],
    queryFn: async () => {
      const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.DASHBOARD);
      return res?.data || null;
    },
    staleTime: 45 * 1000,
    ...options,
  });
}

export function useHotelAdminRooms({ page = 1, limit = 20, ...options } = {}) {
  return useQuery({
    queryKey: ["hotel-admin", "rooms", page, limit],
    queryFn: async () => {
      const res = await apiRequest(`${API_ENDPOINTS.HOTEL_ADMIN.ROOMS}?page=${page}&limit=${limit}`);
      return res?.data || res || [];
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useHotelAdminRoomTypes(options = {}) {
  return useQuery({
    queryKey: ["hotel-admin", "room-types"],
    queryFn: async () => {
      const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOM_TYPES);
      return res?.data || res || [];
    },
    staleTime: 5 * 60 * 1000, // Relatively static master data
    ...options,
  });
}

export function useHotelAdminStaff(options = {}) {
  return useQuery({
    queryKey: ["hotel-admin", "staff"],
    queryFn: async () => {
      const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.RECEPTIONISTS);
      return res?.data || res || [];
    },
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}

export function useHotelAdminProfile(options = {}) {
  return useQuery({
    queryKey: ["hotel-admin", "profile"],
    queryFn: async () => {
      const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE);
      return res?.data || null;
    },
    staleTime: 5 * 60 * 1000,
    ...options,
  });
}

// ============================================================================
// 3. RECEPTIONIST QUERIES
// ============================================================================

export function useReceptionistDashboard(options = {}) {
  return useQuery({
    queryKey: ["receptionist", "dashboard"],
    queryFn: async () => {
      const res = await apiRequest(API_ENDPOINTS.RECEPTIONIST.DASHBOARD);
      return res?.data || null;
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useReceptionistRooms({ page = 1, limit = 20, ...options } = {}) {
  return useQuery({
    queryKey: ["receptionist", "rooms", page, limit],
    queryFn: async () => {
      const res = await apiRequest(`${API_ENDPOINTS.RECEPTIONIST.ROOMS}?page=${page}&limit=${limit}`);
      return res?.data || res || [];
    },
    staleTime: 20 * 1000, // Frequent status updates
    ...options,
  });
}

export function useBookingRoomOptions(params = {}, options = {}) {
  return useQuery({
    queryKey: ["receptionist", "booking-room-options", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params.checkInDate || params.checkIn || params.check_in_date) {
        searchParams.append("check_in_date", params.check_in_date || params.checkInDate || params.checkIn);
      }
      if (params.checkOutDate || params.checkOut || params.check_out_date) {
        searchParams.append("check_out_date", params.check_out_date || params.checkOutDate || params.checkOut);
      }
      if (params.roomType || params.room_type || params.room_type_id) {
        searchParams.append("room_type_id", params.room_type_id || params.roomType || params.room_type);
      }
      const queryStr = searchParams.toString();

      const availEndpoint = `${API_ENDPOINTS.RECEPTIONIST.ROOMS}?status=AVAILABLE${queryStr ? "&" + queryStr : ""}`;
      const typesEndpoint = API_ENDPOINTS.RECEPTIONIST.ROOM_TYPES;

      const [roomsRes, typesRes] = await Promise.all([
        apiRequest(availEndpoint),
        apiRequest(typesEndpoint),
      ]);

      const availableRooms = roomsRes?.data || (Array.isArray(roomsRes) ? roomsRes : []);
      const roomTypes = typesRes?.data || (Array.isArray(typesRes) ? typesRes : []);

      return {
        roomTypes,
        availableRooms,
        rooms: availableRooms,
      };
    },
    staleTime: 20 * 1000,
    ...options,
  });
}

export function useReceptionistBookings({ page = 1, limit = 20, ...options } = {}) {
  return useQuery({
    queryKey: ["receptionist", "bookings", page, limit],
    queryFn: async () => {
      const res = await apiRequest(`${API_ENDPOINTS.RECEPTIONIST.BOOKINGS}?page=${page}&limit=${limit}`);
      return res?.data || res || [];
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useReceptionistGuests({ page = 1, limit = 20, ...options } = {}) {
  return useQuery({
    queryKey: ["receptionist", "guests", page, limit],
    queryFn: async () => {
      const res = await apiRequest(`${API_ENDPOINTS.RECEPTIONIST.GUESTS}?page=${page}&limit=${limit}`);
      return res?.data || res || [];
    },
    staleTime: 45 * 1000,
    ...options,
  });
}

export function useGuestDetails(guestId, options = {}) {
  return useQuery({
    queryKey: ["receptionist", "guest", guestId],
    queryFn: async () => {
      if (!guestId) return null;
      const res = await apiRequest(API_ENDPOINTS.RECEPTIONIST.GUEST_BY_ID(guestId));
      return res?.data || res || null;
    },
    enabled: Boolean(guestId) && (options.enabled !== false),
    staleTime: 2 * 60 * 1000,
    ...options,
  });
}
