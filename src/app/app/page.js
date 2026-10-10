"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Button, Chip } from "@mui/material";
import { AppThemeProvider, useAppTheme } from "@/shared/context/ThemeContext";
import { SocketProvider, useSocket } from "@/shared/context/SocketContext";
import dynamic from "next/dynamic";
import UnifiedLogin from "@/auth/components/UnifiedLogin";
import HotelAdminLayout from "@/hotel-admin/layout/HotelAdminLayout";
import ReceptionistLayout from "@/receptionist/layout/ReceptionistLayout";
import SuperAdminLayout from "@/super-admin/layout/SuperAdminLayout";
import { API_ENDPOINTS, apiRequest } from "@/config/api";

const DashboardLoadingFallback = () => (
  <div className="flex items-center justify-center min-h-[400px] text-slate-500 text-xs animate-pulse font-sans">
    <div className="flex flex-col items-center gap-3">
      <div className="w-10 h-10 border-4 border-teal-200 border-t-[#00D0B4] rounded-full animate-spin"></div>
      <span className="font-semibold text-slate-700">Loading module dynamically...</span>
    </div>
  </div>
);

const HotelAdminDashboard = dynamic(() => import("@/hotel-admin/components/HotelAdminDashboard"), {
  loading: DashboardLoadingFallback,
  ssr: false,
});

const ReceptionistDashboard = dynamic(() => import("@/receptionist/components/ReceptionistDashboard"), {
  loading: DashboardLoadingFallback,
  ssr: false,
});

const SuperAdminDashboard = dynamic(() => import("@/super-admin/components/SuperAdminDashboard"), {
  loading: DashboardLoadingFallback,
  ssr: false,
});

const SubscriptionExpiredScreen = dynamic(() => import("@/shared/components/SubscriptionExpiredScreen"), {
  ssr: false,
});

function HotelWebAppContent() {
  const { themeConfig } = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Mode override for Hotel Admin to view Frontdesk Receptionist UI
  const [activePortalRole, setActivePortalRole] = useState(null);

  const [user, setUser] = useState(() => {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      return stored && token ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const computeLockout = (userData) => {
    if (!userData || userData.role === "SUPER_ADMIN") {
      return { locked: false, type: "EXPIRED", reason: "" };
    }

    if (userData.status === "INACTIVE" || userData.status === "BLOCKED" || userData.status === "DELETED") {
      return {
        locked: true,
        type: "DISABLED",
        reason: "Your staff account has been deactivated by Hotel Administration. All portal access is suspended.",
      };
    }

    const hotel = userData.hotel;
    if (!hotel) return { locked: false, type: "EXPIRED", reason: "" };

    if (hotel.status === "DISABLED" || hotel.status === "SUSPENDED") {
      return {
        locked: true,
        type: hotel.status,
        reason: hotel.statusReason || `Hotel account has been ${hotel.status.toLowerCase()} by Super Admin policy.`,
      };
    }

    const sub = hotel.subscription;
    if (sub) {
      const now = new Date();
      const trialEndDate = sub.trialEndDate ? new Date(sub.trialEndDate) : null;

      if (trialEndDate && trialEndDate > now && (hotel.status === "ACTIVE" || !hotel.status)) {
        return { locked: false, type: "EXPIRED", reason: "" };
      }

      const isExpiredByDate = trialEndDate ? trialEndDate <= now : false;
      const isExpiredByStatus = sub.status === "EXPIRED" || sub.isExpired === true;

      if ((isExpiredByDate || isExpiredByStatus) && sub.status !== "ACTIVE" && (sub.plan === "TRIAL" || !sub.plan)) {
        return {
          locked: true,
          type: "EXPIRED",
          reason: "Your free trial or hotel subscription plan evaluation period has ended.",
        };
      }
    }

    return { locked: false, type: "EXPIRED", reason: "" };
  };

  const [lockout, setLockout] = useState(() => {
    if (typeof window === "undefined") return { locked: false, type: "EXPIRED", reason: "" };
    try {
      const stored = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      const u = stored && token ? JSON.parse(stored) : null;
      return computeLockout(u);
    } catch {
      return { locked: false, type: "EXPIRED", reason: "" };
    }
  });

  // ⚡ Realtime Socket.IO Sync: Auto-show / Auto-hide Subscription Expired & Staff Lockout Popup
  useSocket(
    [
      "HOTEL_UPDATED",
      "SUBSCRIPTION_UPDATED",
      "HOTEL_STATUS_UPDATED",
      "STAFF_STATUS_UPDATED",
      "USER_UPDATED",
      "TRIAL_REQUEST_APPROVED",
      "TRIAL_REQUEST_REJECTED",
      "DASHBOARD_SYNC",
    ],
    (payload, eventName) => {
      // 1. Staff Status Live Lockout Handler
      if (eventName === "STAFF_STATUS_UPDATED" || eventName === "USER_UPDATED") {
        const targetUserId = String(payload?.userId || payload?.staffId || payload?.user?._id || payload?.user?.id || "");
        
        let storedUserId = "";
        try {
          const stored = localStorage.getItem("user");
          if (stored) {
            const parsed = JSON.parse(stored);
            storedUserId = String(parsed?._id || parsed?.id || "");
          }
        } catch {}

        const currentUserId = String(user?._id || user?.id || storedUserId);

        if (targetUserId && currentUserId && targetUserId === currentUserId) {
          const nextStatus = payload?.status || payload?.user?.status;

          if (nextStatus === "INACTIVE" || nextStatus === "BLOCKED" || nextStatus === "DELETED") {
            setLockout({
              locked: true,
              type: "DISABLED",
              reason: "Your staff account has been deactivated by Hotel Administration. All operational access is suspended.",
            });
            setUser((prev) => {
              if (!prev) return prev;
              const updated = { ...prev, status: nextStatus };
              try { localStorage.setItem("user", JSON.stringify(updated)); } catch {}
              return updated;
            });
          } else if (nextStatus === "ACTIVE") {
            setLockout({ locked: false, type: "EXPIRED", reason: "" });
            setUser((prev) => {
              if (!prev) return prev;
              const updated = { ...prev, status: "ACTIVE" };
              try { localStorage.setItem("user", JSON.stringify(updated)); } catch {}
              return updated;
            });
          }
        }
      }

      // 2. Hotel Subscription / Status Live Handler
      const updatedHotel = payload?.hotel;
      if (updatedHotel && user?.role !== "SUPER_ADMIN") {
        const userHotelId = String(user?.hotel?._id || user?.hotel || user?.hotelId || "");
        const targetHotelId = String(updatedHotel._id || updatedHotel.id || "");
        if (userHotelId && targetHotelId && userHotelId === targetHotelId) {
          if (updatedHotel.status === "DISABLED" || updatedHotel.status === "SUSPENDED" || updatedHotel.status === "EXPIRED") {
            setLockout({
              locked: true,
              type: updatedHotel.status,
              reason: updatedHotel.statusReason || `Your hotel account has been ${updatedHotel.status.toLowerCase()} by Super Admin policy.`,
            });
          } else if (updatedHotel.status === "ACTIVE") {
            setLockout({ locked: false, type: "EXPIRED", reason: "" });
          }
        }
      }
    }
  );

  const getNavListForUser = (currentUser, activeRole) => {
    if (!currentUser) return [];
    const effectiveRole = activeRole || currentUser.role;
    if (effectiveRole === "SUPER_ADMIN") {
      return ["overview", "hotels", "plans", "settings"];
    }
    if (effectiveRole === "HOTEL_ADMIN") {
      return ["overview", "daily-collections", "guests", "staff", "rooms", "subscriptions", "settings"];
    }
    if (effectiveRole === "RECEPTIONIST") {
      return ["dashboard", "rooms", "folios", "guests", "more"];
    }
    return [];
  };

  const getActiveTabFromPath = (currentUser, currentPath, activeRole) => {
    if (!currentUser) return 0;
    const navList = getNavListForUser(currentUser, activeRole);
    const rawPath = (currentPath || (typeof window !== "undefined" ? window.location.pathname : "")).replace(/^\/+/, "");
    const parts = rawPath.split("/").filter(Boolean);

    let cleanPath = "overview";
    if (parts[0] === "admin" || parts[0] === "receptionist" || parts[0] === "app") {
      cleanPath = parts[1] || "overview";
    } else if (parts[0]) {
      cleanPath = parts[0];
    }

    if (cleanPath) {
      const idx = navList.indexOf(cleanPath);
      if (idx !== -1) return idx;

      const effectiveRole = activeRole || currentUser.role;
      if (effectiveRole === "RECEPTIONIST") {
        if (cleanPath === "dashboard" || cleanPath === "overview") return 0;
        if (cleanPath === "rooms" || cleanPath === "checkin" || cleanPath === "check-in" || cleanPath === "booking") return 1;
        if (cleanPath === "folios" || cleanPath === "in-house" || cleanPath === "inhouse") return 2;
        if (cleanPath === "guests" || cleanPath === "guest-directory" || cleanPath === "directory") return 3;
        if (cleanPath === "more" || cleanPath === "settings" || cleanPath === "operations") return 4;
      }
      if (effectiveRole === "HOTEL_ADMIN") {
        if (cleanPath === "collections" || cleanPath === "daily-collections" || cleanPath === "payments" || cleanPath === "billing") return 1;
        if (cleanPath === "folios" || cleanPath === "guests" || cleanPath === "guest-directory") return 2;
        if (cleanPath === "team" || cleanPath === "staff") return 3;
        if (cleanPath === "plans" || cleanPath === "pricing" || cleanPath === "subscriptions") return 5;
      }
    }
    return 0;
  };

  const currentEffectiveRole = activePortalRole || user?.role || "HOTEL_ADMIN";

  const [activeTab, setActiveTab] = useState(() => {
    if (typeof window === "undefined") return 0;
    try {
      const stored = localStorage.getItem("user");
      const token = localStorage.getItem("token");
      const u = stored && token ? JSON.parse(stored) : null;
      return getActiveTabFromPath(u, pathname, u?.role);
    } catch {
      return 0;
    }
  });

  const checkUserLockout = (userData) => {
    const res = computeLockout(userData);
    setLockout(res);
    return res.locked;
  };

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
    } catch {}
    setUser(null);
    setLockout({ locked: false, type: "EXPIRED", reason: "" });
    setActiveTab(0);
    setActivePortalRole(null);
    router.push("/login");
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      apiRequest(API_ENDPOINTS.AUTH.ME)
        .then((res) => {
          if (res?.data) {
            setUser(res.data);
            localStorage.setItem("user", JSON.stringify(res.data));
            checkUserLockout(res.data);
          }
        })
        .catch(() => {});
    }

    const handleLockoutEvent = (e) => {
      const detail = e.detail || {};
      setLockout({
        locked: true,
        type: detail.hotelStatus || (detail.errorCode === "SUBSCRIPTION_EXPIRED" ? "EXPIRED" : "DISABLED"),
        reason: detail.message || "Hotel account access is restricted.",
      });
    };

    const handleUnauthorizedEvent = () => {
      console.warn("🔒 [Hotel Auth] Session expired. Auto-logging out...");
      handleLogout();
    };

    const handleStorageEvent = (e) => {
      if ((e.key === "token" || e.key === "user") && !e.newValue) {
        handleLogout();
      }
    };

    window.addEventListener("hotel-status-lockout", handleLockoutEvent);
    window.addEventListener("auth-unauthorized", handleUnauthorizedEvent);
    window.addEventListener("storage", handleStorageEvent);

    return () => {
      window.removeEventListener("hotel-status-lockout", handleLockoutEvent);
      window.removeEventListener("auth-unauthorized", handleUnauthorizedEvent);
      window.removeEventListener("storage", handleStorageEvent);
    };
  }, []);

  useEffect(() => {
    if (user) {
      const tabIdx = getActiveTabFromPath(user, pathname, currentEffectiveRole);
      setActiveTab(tabIdx);
    }
  }, [pathname, user, currentEffectiveRole]);

  const handleTabChange = (tabIndex) => {
    setActiveTab(tabIndex);
    if (user) {
      const effectiveRole = activePortalRole || user.role;
      const prefix = effectiveRole === "HOTEL_ADMIN" ? "/admin" : "/receptionist";
      const navList = getNavListForUser(user, effectiveRole);
      if (navList[tabIndex] !== undefined) {
        const targetPath = `${prefix}/${navList[tabIndex]}`;
        if (typeof window !== "undefined") {
          window.history.pushState(null, "", targetPath);
        }
      }
    }
  };

  return (
    <>
      {!user ? (
        <UnifiedLogin
          onLoginSuccess={(loggedInUser) => {
            setUser(loggedInUser);
            setActivePortalRole(loggedInUser.role);
            setActiveTab(0);
            checkUserLockout(loggedInUser);
          }}
        />
      ) : lockout.locked && user.role !== "SUPER_ADMIN" ? (
        <SubscriptionExpiredScreen
          user={user}
          type={lockout.type}
          reason={lockout.reason}
          onLogout={handleLogout}
        />
      ) : (
        <>

          {currentEffectiveRole === "SUPER_ADMIN" && (
            <SuperAdminLayout
              user={user}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onLogout={handleLogout}
            >
              <SuperAdminDashboard
                user={user}
                activeNav={activeTab}
                onTabChange={handleTabChange}
              />
            </SuperAdminLayout>
          )}

          {currentEffectiveRole === "HOTEL_ADMIN" && (
            <HotelAdminLayout
              user={user}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onLogout={handleLogout}
            >
              <HotelAdminDashboard
                user={user}
                activeNav={activeTab}
                onTabChange={handleTabChange}
              />
            </HotelAdminLayout>
          )}

          {currentEffectiveRole === "RECEPTIONIST" && (
            <ReceptionistLayout
              user={user}
              activeTab={activeTab}
              onTabChange={handleTabChange}
              onLogout={handleLogout}
            >
              <ReceptionistDashboard
                user={user}
                activeNav={activeTab}
                onTabChange={handleTabChange}
                onLogout={handleLogout}
              />
            </ReceptionistLayout>
          )}
        </>
      )}
    </>
  );
}

export default function Page() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <AppThemeProvider>
      <SocketProvider>
        <HotelWebAppContent />
      </SocketProvider>
    </AppThemeProvider>
  );
}
