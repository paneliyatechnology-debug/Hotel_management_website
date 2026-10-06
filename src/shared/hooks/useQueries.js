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

export function useSuperAdminHotels(options = {}) {
  return useQuery({
    queryKey: ["super-admin", "hotels"],
    queryFn: async () => {
      const res = await apiRequest(API_ENDPOINTS.SUPER_ADMIN.HOTELS);
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

export function useHotelAdminRooms(options = {}) {
  return useQuery({
    queryKey: ["hotel-admin", "rooms"],
    queryFn: async () => {
      const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.ROOMS);
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

export function useReceptionistRooms(options = {}) {
  return useQuery({
    queryKey: ["receptionist", "rooms"],
    queryFn: async () => {
      const res = await apiRequest(API_ENDPOINTS.RECEPTIONIST.AVAILABLE_ROOMS);
      return res?.data || res || [];
    },
    staleTime: 20 * 1000, // Frequent status updates
    ...options,
  });
}

export function useReceptionistBookings(options = {}) {
  return useQuery({
    queryKey: ["receptionist", "bookings"],
    queryFn: async () => {
      const res = await apiRequest(API_ENDPOINTS.RECEPTIONIST.BOOKINGS);
      return res?.data || res || [];
    },
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useReceptionistGuests(options = {}) {
  return useQuery({
    queryKey: ["receptionist", "guests"],
    queryFn: async () => {
      const res = await apiRequest(API_ENDPOINTS.RECEPTIONIST.GUESTS);
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
