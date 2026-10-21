"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { getApiBaseUrl, LIVE_API_URL } from "@/config/api";

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  lastEvent: null,
  onlineUserIds: [],
  onlineHotelIds: [],
  isUserOnline: () => false,
  isHotelOnline: () => false,
  joinRoom: () => {},
});

// Live Railway host. Localhost pages proxy HTTP, but Socket.IO must reach the API directly.
const SOCKET_URL = (LIVE_API_URL || "https://hotelmanagementbackendnew-production.up.railway.app").replace(/\/+$/, "");

export const SOCKET_ENABLED = true;

const HOTEL_ADMIN_EVENTS = [
  "ROOM_UPDATED",
  "room:category_counts",
  "BOOKING_CREATED",
  "BOOKING_UPDATED",
  "GUEST_CHECKED_OUT",
  "PAYMENT_RECORDED",
  "GUEST_UPDATED",
  "DASHBOARD_SYNC",
  "HANDOVER_SETTLED",
  "STAFF_STATUS_UPDATED",
  "USER_UPDATED",
  "STAFF_CREATED",
  "STAFF_UPDATED",
  "STAFF_DELETED",
  "HOTEL_STATUS_UPDATED",
  "SIGNATURE_SUBMITTED",
  "HOTEL_UPDATED",
  "SUBSCRIPTION_UPDATED",
  "TRIAL_REQUEST_APPROVED",
  "TRIAL_REQUEST_REJECTED",
];

const RECEPTION_EVENTS = [
  "ROOM_UPDATED",
  "room:category_counts",
  "BOOKING_CREATED",
  "BOOKING_UPDATED",
  "GUEST_CHECKED_OUT",
  "PAYMENT_RECORDED",
  "GUEST_UPDATED",
  "DASHBOARD_SYNC",
  "SIGNATURE_SUBMITTED",
  "STAFF_STATUS_UPDATED",
  "USER_UPDATED",
  "SUBSCRIPTION_UPDATED",
  "HOTEL_UPDATED",
  "HOTEL_STATUS_UPDATED",
];

const SUPER_ADMIN_EVENTS = [
  "HOTEL_REGISTERED",
  "NEW_TRIAL_REQUEST",
  "TRIAL_REQUEST_APPROVED",
  "TRIAL_REQUEST_REJECTED",
  "HOTEL_STATUS_UPDATED",
  "HOTEL_UPDATED",
  "SUBSCRIPTION_UPDATED",
  "DASHBOARD_SYNC",
  "HOTEL_ONLINE",
  "HOTEL_OFFLINE",
  "USER_ONLINE",
  "USER_OFFLINE",
  "PRESENCE_SYNC",
  "ONLINE_PRESENCE_STATE",
];

function readSession() {
  if (typeof window === "undefined") return { token: "", user: null, hotelId: "", role: "" };
  const token = localStorage.getItem("token") || "";
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }
  const hotelId = user?.hotel?._id || user?.hotel?.id || user?.hotel || user?.hotelId || user?.hotel_id || "";
  return {
    token,
    user,
    hotelId: hotelId ? String(hotelId) : "",
    role: String(user?.role || "").toUpperCase(),
  };
}

function eventsForRole(role) {
  if (role === "SUPER_ADMIN") return SUPER_ADMIN_EVENTS;
  if (role === "RECEPTIONIST") return RECEPTION_EVENTS;
  return HOTEL_ADMIN_EVENTS;
}

function isForThisHotel(payload, hotelId) {
  if (!hotelId || !payload || typeof payload !== "object") return true;
  const eventHotel = payload.hotel_id || payload.hotelId || payload.hotel?._id || payload.hotel?.id;
  if (!eventHotel) return true;
  return String(eventHotel) === String(hotelId);
}

const dummySocket = {
  connected: false,
  emit: () => {},
  on: () => {},
  off: () => {},
  disconnect: () => {},
};

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [onlineHotelIds, setOnlineHotelIds] = useState([]);
  const socketRef = useRef(dummySocket);

  const isUserOnline = useCallback(
    (userId) => {
      if (!userId) return false;
      const idStr = String(userId._id || userId.id || userId).trim();
      return onlineUserIds.some((id) => String(id).trim() === idStr);
    },
    [onlineUserIds]
  );

  const isHotelOnline = useCallback(
    (hotelId) => {
      if (!hotelId) return false;
      const idStr = String(hotelId._id || hotelId.id || hotelId).trim();
      return onlineHotelIds.some((id) => String(id).trim() === idStr);
    },
    [onlineHotelIds]
  );

  const joinRoom = useCallback(() => {
    if (!SOCKET_ENABLED) return;
    const sock = socketRef.current;
    if (!sock || !sock.connected) return;

    const { token, user, hotelId, role } = readSession();

    if (role === "SUPER_ADMIN") {
      sock.emit("join_super_admin", { user, token });
    } else if (hotelId) {
      sock.emit("join_hotel", { hotelId, token, user });
    }

    if (user) {
      sock.emit("user_presence", {
        userId: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hotelId: hotelId || null,
        token,
      });
    }

    sock.emit("get_presence");
  }, []);

  useEffect(() => {
    // Sockets are temporarily commented out / disabled
    if (!SOCKET_ENABLED) {
      return;
    }

    if (typeof window === "undefined") return;

    if (socketRef.current && socketRef.current.connected) {
      joinRoom();
      return;
    }

    const apiBase = getApiBaseUrl();
    const socketUrl = apiBase && /localhost:5000|127\.0\.0\.1:5000/.test(apiBase) ? apiBase : SOCKET_URL;

    const { token } = readSession();
    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      auth: { token },
      query: token ? { token } : {},
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      joinRoom();
    });

    socket.on("joined_room", (data) => {
    });

    socket.on("disconnect", (reason) => {
      setIsConnected(false);
    });

    // Real-Time Instant Presence Handlers (Zero Refresh)
    socket.on("ONLINE_PRESENCE_STATE", (data) => {
      if (Array.isArray(data?.onlineUserIds)) setOnlineUserIds(data.onlineUserIds.map(String));
      if (Array.isArray(data?.onlineHotelIds)) setOnlineHotelIds(data.onlineHotelIds.map(String));
    });

    socket.on("HOTEL_ONLINE", (data) => {
      if (data?.hotelId) {
        setOnlineHotelIds((prev) => Array.from(new Set([...prev, String(data.hotelId)])));
      }
      if (Array.isArray(data?.onlineHotelIds)) {
        setOnlineHotelIds(data.onlineHotelIds.map(String));
      }
    });

    socket.on("HOTEL_OFFLINE", (data) => {
      if (Array.isArray(data?.onlineHotelIds)) {
        setOnlineHotelIds(data.onlineHotelIds.map(String));
      } else if (data?.hotelId) {
        setOnlineHotelIds((prev) => prev.filter((id) => id !== String(data.hotelId)));
      }
    });

    socket.on("USER_ONLINE", (data) => {
      if (data?.userId) {
        setOnlineUserIds((prev) => Array.from(new Set([...prev, String(data.userId)])));
      }
      if (data?.hotelId) {
        setOnlineHotelIds((prev) => Array.from(new Set([...prev, String(data.hotelId)])));
      }
      if (Array.isArray(data?.onlineHotelIds)) {
        setOnlineHotelIds(data.onlineHotelIds.map(String));
      }
    });

    socket.on("USER_OFFLINE", (data) => {
      if (data?.userId) {
        setOnlineUserIds((prev) => prev.filter((id) => id !== String(data.userId)));
      }
      if (Array.isArray(data?.onlineHotelIds)) {
        setOnlineHotelIds(data.onlineHotelIds.map(String));
      } else if (Array.isArray(data?.onlineUserIds)) {
        setOnlineUserIds(data.onlineUserIds.map(String));
      }
    });

    socket.on("PRESENCE_SYNC", (data) => {
      if (Array.isArray(data?.onlineHotelIds)) setOnlineHotelIds(data.onlineHotelIds.map(String));
      if (Array.isArray(data?.onlineUserIds)) setOnlineUserIds(data.onlineUserIds.map(String));
    });

    // Real-Time Event Dispatchers to Window — only the events for this login
    const ALL_EVENTS = [...new Set([...HOTEL_ADMIN_EVENTS, ...RECEPTION_EVENTS, ...SUPER_ADMIN_EVENTS])];
    const bindRoleEvents = () => {
      ALL_EVENTS.forEach((evtName) => socket.off(evtName));
      eventsForRole(readSession().role).forEach((evtName) => {
        socket.on(evtName, (payload) => {
          const { role, hotelId } = readSession();
          if (role !== "SUPER_ADMIN" && !isForThisHotel(payload, hotelId)) return;
          setLastEvent({ name: evtName, payload, timestamp: Date.now() });
          window.dispatchEvent(new CustomEvent(`socket:${evtName}`, { detail: payload }));
          window.dispatchEvent(new CustomEvent("socket:any", { detail: { name: evtName, payload } }));
        });
      });
    };
    bindRoleEvents();

    const handleAuthChange = () => {
      bindRoleEvents();
      joinRoom();
    };
    const handleWindowFocus = () => {
      if (socketRef.current?.connected) {
        socketRef.current.emit("get_presence");
      }
      joinRoom();
    };

    window.addEventListener("auth-state-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);
    window.addEventListener("focus", handleWindowFocus);
    window.addEventListener("visibilitychange", handleWindowFocus);

    return () => {
      window.removeEventListener("auth-state-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
      window.removeEventListener("focus", handleWindowFocus);
      window.removeEventListener("visibilitychange", handleWindowFocus);
      socket.disconnect();
      socketRef.current = dummySocket;
    };
  }, [joinRoom]);

  return (
    <SocketContext.Provider
      value={{
        socket: socketRef.current,
        isConnected,
        lastEvent,
        onlineUserIds,
        onlineHotelIds,
        isUserOnline,
        isHotelOnline,
        joinRoom,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
}

export function usePresence() {
  const context = useContext(SocketContext);
  return {
    onlineUserIds: context.onlineUserIds || [],
    onlineHotelIds: context.onlineHotelIds || [],
    isUserOnline: context.isUserOnline || (() => false),
    isHotelOnline: context.isHotelOnline || (() => false),
    isConnected: Boolean(context.isConnected),
  };
}

export function useSocket(eventSubscriptions = [], callback) {
  const context = useContext(SocketContext);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const eventsKey = Array.isArray(eventSubscriptions) ? eventSubscriptions.join(",") : "";

  useEffect(() => {
    if (!SOCKET_ENABLED) return;
    if (!eventsKey || typeof window === "undefined") return;
    const events = eventsKey.split(",").filter(Boolean);

    const handlers = events.map((evtName) => {
      const handler = (e) => {
        if (callbackRef.current) {
          callbackRef.current(e.detail, evtName);
        }
      };
      window.addEventListener(`socket:${evtName}`, handler);
      return { evtName, handler };
    });

    return () => {
      handlers.forEach(({ evtName, handler }) => {
        window.removeEventListener(`socket:${evtName}`, handler);
      });
    };
  }, [eventsKey]);

  return context;
}
