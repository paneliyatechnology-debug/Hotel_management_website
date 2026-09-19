"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";
import { getApiBaseUrl } from "@/config/api";

const SocketContext = createContext({
  socket: null,
  isConnected: false,
  lastEvent: null,
});

export function SocketProvider({ children, hotelId }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const socketUrl = getApiBaseUrl() || "http://localhost:5000";

    const socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setIsConnected(true);
      if (hotelId) {
        socket.emit("join_public_hotel", { hotelId });
      }
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    const realTimeEvents = ["ROOM_UPDATED", "HOTEL_STATUS_UPDATED"];

    realTimeEvents.forEach((evtName) => {
      socket.on(evtName, (payload) => {
        setLastEvent({ name: evtName, payload, timestamp: Date.now() });
        window.dispatchEvent(
          new CustomEvent(`socket:${evtName}`, {
            detail: payload,
          })
        );
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [hotelId]);

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, isConnected, lastEvent }}>
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
