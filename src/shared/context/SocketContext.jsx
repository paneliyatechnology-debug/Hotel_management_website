"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { getApiBaseUrl } from "@/config/api";

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  lastEvent: null,
  joinRoom: () => {},
});

export function SocketProvider({ children }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const socketRef = useRef(null);

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

    const hotelId = user?.hotel?._id || user?.hotel || user?.hotelId;
    console.log("📡 [Socket.io Client] Joining room for user:", { role: user?.role, hotelId });

    if (user?.role === "SUPER_ADMIN") {
      sock.emit("join_super_admin");
    } else if (hotelId) {
      sock.emit("join_hotel", { hotelId, token });
    }
  }, []);

  useEffect(() => {
    // Only run on client side
    if (typeof window === "undefined") return;

    // Prevent recreating connection if socket is already connected
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
    ];

    realTimeEvents.forEach((evtName) => {
      socket.off(evtName);
      socket.on(evtName, (payload) => {
        console.log(`⚡ [Socket.io Client] Received Event '${evtName}':`, payload);
        setLastEvent({ name: evtName, payload, timestamp: Date.now() });
        // Dispatch CustomEvent on window for seamless subscription
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

    // Listen for auth changes to re-join room
    const handleAuthChange = () => {
      joinRoom();
    };
    window.addEventListener("auth-state-changed", handleAuthChange);
    window.addEventListener("storage", handleAuthChange);

    return () => {
      window.removeEventListener("auth-state-changed", handleAuthChange);
      window.removeEventListener("storage", handleAuthChange);
    };
  }, []);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, lastEvent, joinRoom }}>
      {children}
    </SocketContext.Provider>
  );
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
