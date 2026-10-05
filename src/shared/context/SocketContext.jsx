"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { getApiBaseUrl } from "@/config/api";

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

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const [onlineUserIds, setOnlineUserIds] = useState([]);
  const [onlineHotelIds, setOnlineHotelIds] = useState([]);
  const socketRef = useRef(null);

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
    const sock = socketRef.current;
    if (!sock || !sock.connected) return;

    if (typeof window === "undefined") return;

    const token = localStorage.getItem("token");
    let user = null;
    try {
      const stored = localStorage.getItem("user");
      if (stored) user = JSON.parse(stored);
    } catch {}

    const hotelId = user?.hotel?._id || user?.hotel?.id || user?.hotel || user?.hotelId;
    console.log("📡 [Socket.io Client] Emitting join & presence:", { role: user?.role, hotelId });

    if (user?.role === "SUPER_ADMIN") {
      sock.emit("join_super_admin", { user, token });
    } else if (hotelId) {
      sock.emit("join_hotel", { hotelId: String(hotelId), token, user });
    }

    if (user) {
      sock.emit("user_presence", {
        userId: user._id || user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        hotelId: hotelId ? String(hotelId) : null,
        token,
      });
    }

    // Always fetch latest presence list
    sock.emit("get_presence");
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (socketRef.current && socketRef.current.connected) {
      joinRoom();
      return;
    }

    const socketUrl = getApiBaseUrl() || "http://localhost:5000";
    console.log(`🔌 [Socket.io Client] Connecting to: ${socketUrl}`);

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log(`✅ [Socket.io Client] Connected with ID: ${socket.id}`);
      setIsConnected(true);
      joinRoom();
    });

    socket.on("joined_room", (data) => {
      console.log(`🏨 [Socket.io Client] Confirmed joined room:`, data);
    });

    socket.on("disconnect", (reason) => {
      console.log(`❌ [Socket.io Client] Disconnected:`, reason);
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

    // Real-Time Event Dispatchers to Window
    const realTimeEvents = [
      "ROOM_UPDATED",
      "BOOKING_CREATED",
      "BOOKING_UPDATED",
      "GUEST_CHECKED_OUT",
      "PAYMENT_RECORDED",
      "GUEST_UPDATED",
      "DASHBOARD_SYNC",
      "HANDOVER_SETTLED",
      "HOTEL_STATUS_UPDATED",
      "SIGNATURE_SUBMITTED",
      "HOTEL_UPDATED",
      "SUBSCRIPTION_UPDATED",
      "TRIAL_REQUEST_APPROVED",
      "TRIAL_REQUEST_REJECTED",
      "NEW_TRIAL_REQUEST",
      "HOTEL_REGISTERED",
      "HOTEL_ONLINE",
      "HOTEL_OFFLINE",
      "USER_ONLINE",
      "USER_OFFLINE",
      "PRESENCE_SYNC",
    ];

    realTimeEvents.forEach((evtName) => {
      socket.off(evtName);
      socket.on(evtName, (payload) => {
        setLastEvent({ name: evtName, payload, timestamp: Date.now() });
        window.dispatchEvent(
          new CustomEvent(`socket:${evtName}`, {
            detail: payload,
          })
        );
        window.dispatchEvent(
          new CustomEvent("socket:any", {
            detail: { name: evtName, payload },
          })
        );
      });
    });

    // Listen for auth changes or window focus to re-join room & announce presence
    const handleAuthChange = () => {
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
    onlineUserIds: context.onlineUserIds,
    onlineHotelIds: context.onlineHotelIds,
    isUserOnline: context.isUserOnline,
    isHotelOnline: context.isHotelOnline,
    isConnected: context.isConnected,
  };
}

export function useSocket(eventSubscriptions = [], callback) {
  const context = useContext(SocketContext);

  useEffect(() => {
    if (!callback || eventSubscriptions.length === 0 || typeof window === "undefined") return;

    const handlers = eventSubscriptions.map((evtName) => {
      const handler = (e) => callback(e.detail, evtName);
      window.addEventListener(`socket:${evtName}`, handler);
      return { evtName, handler };
    });

    return () => {
      handlers.forEach(({ evtName, handler }) => {
        window.removeEventListener(`socket:${evtName}`, handler);
      });
    };
  }, [eventSubscriptions, callback]);

  return context;
}
