"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from "react";
import { io } from "socket.io-client";
import { getApiBaseUrl } from "@/config/api";
import { getActiveHotelId, getCookie } from "@/shared/utils/cookieAuth";

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

const SOCKET_URL = getApiBaseUrl();

export const SOCKET_ENABLED = true;
// Logs connection problems and live events in the browser console (development only)
const DEBUG_SOCKET = process.env.NODE_ENV !== "production";

// Backend socket events (channel hotel:<hotel_id>), see the backend socket guide:
//   room:status            one room changed            -> room object
//   room:status_breakdown  hotel-wide status counts    -> { hotel_id, room_status_breakdown }
//   room:category_counts   per-category counts         -> { hotel_id, room_categories, room_status_summary }
//   booking:updated        full booking (GET /bookings/:id shape)
//   dashboard:updated      { hotel_id, date_range, data } (GET /dashboard shape for the user's role)
const LIVE_EVENTS = [
  "room:status",
  "room:status_breakdown",
  "room:category_counts",
  "booking:updated",
  "dashboard:updated",
];

// Screens written before these events existed listen for the legacy names below.
// Every live event also fires the matching legacy events (flagged as `isLiveAlias`) so those screens
// refresh without changes. useSocket() merges a burst of them into one callback.
const LIVE_ALIASES = {
  "room:status": ["ROOM_UPDATED"],
  "room:status_breakdown": ["ROOM_UPDATED"],
  "room:category_counts": ["ROOM_UPDATED"],
  "booking:updated": ["BOOKING_CREATED", "BOOKING_UPDATED", "GUEST_UPDATED", "PAYMENT_RECORDED", "GUEST_CHECKED_OUT"],
  "dashboard:updated": ["DASHBOARD_SYNC"],
};

const HOTEL_ADMIN_EVENTS = [
  ...LIVE_EVENTS,
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
  ...LIVE_EVENTS,
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
  ...LIVE_EVENTS, // a super admin connected to one hotel receives that hotel's live events
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
  const token =
    localStorage.getItem("token") ||
    localStorage.getItem("accessToken") ||
    getCookie("accessToken") ||
    getCookie("token") ||
    "";
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    user = null;
  }
  if (!user && typeof document !== "undefined") {
    const cu = getCookie("user");
    if (cu && typeof cu === "object") user = cu;
  }
  const hotelId =
    getActiveHotelId() ||
    user?.hotel?._id ||
    user?.hotel?.id ||
    user?.hotel ||
    user?.hotelId ||
    user?.hotel_id ||
    "";
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
      sock.emit("join_super_admin", { user, token, hotelId });
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
    sock.emit("dashboard:subscribe", { date_range: role === "RECEPTIONIST" ? "today" : "this_month" });
  }, []);

  useEffect(() => {
    // Sockets are temporarily commented out / disabled
    if (!SOCKET_ENABLED) {
      return;
    }

    if (typeof window === "undefined") return;

    const { token: sessionToken } = readSession();
    if (!sessionToken) return;

    const socketUrl = getApiBaseUrl() || SOCKET_URL;
    const existing = socketRef.current && socketRef.current !== dummySocket ? socketRef.current : null;
    let socket = existing;

    if (!socket) {
    const { token } = readSession();
    socket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      withCredentials: true,
      extraHeaders: token ? { Authorization: `Bearer ${token}` } : {},
      // Evaluated on every (re)connect so a refreshed token or a switched hotel is always used.
      // The backend joins the client to hotel:<hotel_id> from the token; a SUPER_ADMIN must send hotel_id.
      auth: (cb) => {
        const session = readSession();
        const payload = { token: session.token };
        const activeHotel = getActiveHotelId() || session.hotelId;
        if (activeHotel) {
          payload.hotel_id = activeHotel;
          payload.hotelId = activeHotel;
        }
        cb(payload);
      },
      query: token ? { token } : {},
    });

    socketRef.current = socket;
    }

    if (existing) socket.removeAllListeners();

    socket.on("connect", () => {
      setIsConnected(true);
      if (DEBUG_SOCKET) console.info("[socket] connected to", socketUrl);
      joinRoom();
    });

    socket.on("connect_error", (err) => {
      // The backend refuses the connection when the token is missing/expired or the user has no hotel
      if (DEBUG_SOCKET) console.warn("[socket] connection refused:", err?.message || err, "->", socketUrl);
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
      [...new Set(eventsForRole(readSession().role))].forEach((evtName) => {
        socket.on(evtName, (payload) => {
          const { role, hotelId } = readSession();
          const accepted = role === "SUPER_ADMIN" || isForThisHotel(payload, hotelId);
          if (DEBUG_SOCKET && LIVE_EVENTS.includes(evtName)) {
            console.info(`[socket] ${evtName}`, accepted ? "" : `(ignored: hotel ${payload?.hotel_id} is not ${hotelId})`, payload);
          }
          if (!accepted) return;
          setLastEvent({ name: evtName, payload, timestamp: Date.now() });
          window.dispatchEvent(new CustomEvent(`socket:${evtName}`, { detail: payload }));
          window.dispatchEvent(new CustomEvent("socket:any", { detail: { name: evtName, payload } }));

          // Also wake the screens that still listen for the legacy event names
          (LIVE_ALIASES[evtName] || []).forEach((legacyName) => {
            const aliasEvent = new CustomEvent(`socket:${legacyName}`, { detail: payload });
            aliasEvent.isLiveAlias = true;
            window.dispatchEvent(aliasEvent);
          });
        });
      });
    };
    bindRoleEvents();

    // Token or hotel changed (login, logout, hotel switch): reconnect so the backend re-joins the right hotel channel
    let connectedKey = `${readSession().token}|${getActiveHotelId() || ""}`;
    const handleAuthChange = () => {
      bindRoleEvents();
      const nextKey = `${readSession().token}|${getActiveHotelId() || ""}`;
      if (nextKey !== connectedKey) {
        connectedKey = nextKey;
        socket.disconnect();
        socket.connect();
        return;
      }
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

    // One backend action fires several live events at once (room:status x N, booking:updated, dashboard:updated...).
    // The alias events they raise for legacy listeners are merged into a single callback.
    let aliasTimer = null;
    const handlers = events.map((evtName) => {
      const handler = (e) => {
        if (!callbackRef.current) return;
        if (e.isLiveAlias) {
          clearTimeout(aliasTimer);
          aliasTimer = setTimeout(() => {
            if (callbackRef.current) callbackRef.current(e.detail, evtName);
          }, 300);
          return;
        }
        callbackRef.current(e.detail, evtName);
      };
      window.addEventListener(`socket:${evtName}`, handler);
      return { evtName, handler };
    });

    return () => {
      clearTimeout(aliasTimer);
      handlers.forEach(({ evtName, handler }) => {
        window.removeEventListener(`socket:${evtName}`, handler);
      });
    };
  }, [eventsKey]);

  return context;
}
