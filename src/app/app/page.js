"use client";

import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Box, Button, Chip } from "@mui/material";
import { AppThemeProvider, useAppTheme } from "@/shared/context/ThemeContext";
import { SocketProvider, useSocket } from "@/shared/context/SocketContext";
import UnifiedLogin from "@/auth/components/UnifiedLogin";
import HotelAdminLayout from "@/hotel-admin/layout/HotelAdminLayout";
import ReceptionistLayout from "@/receptionist/layout/ReceptionistLayout";
import HotelAdminDashboard from "@/hotel-admin/components/HotelAdminDashboard";
import ReceptionistDashboard from "@/receptionist/components/ReceptionistDashboard";
import SubscriptionExpiredScreen from "@/shared/components/SubscriptionExpiredScreen";
import { API_ENDPOINTS, apiRequest } from "@/config/api";

function HotelWebAppContent() {
  const { themeConfig } = useAppTheme();
  const pathname = usePathname();
  const router = useRouter();

  // Mode override for Hotel Admin to view Frontdesk Receptionist UI
  const [activePortalRole, setActivePortalRole] = useState(null);

  // ⚡ Realtime Socket.IO Sync: Auto-show / Auto-hide Subscription Expired & Lockout Popup
  useSocket(
    ["HOTEL_UPDATED", "SUBSCRIPTION_UPDATED", "HOTEL_STATUS_UPDATED", "TRIAL_REQUEST_APPROVED", "TRIAL_REQUEST_REJECTED", "DASHBOARD_SYNC"],
    (payload, eventName) => {
      const updatedHotel = payload?.hotel;
      if (updatedHotel && user?.role !== "SUPER_ADMIN") {
        const userHotelId = user?.hotel?._id || user?.hotel || user?.hotelId;
        const targetHotelId = updatedHotel._id || updatedHotel.id;
        if (userHotelId && targetHotelId && String(userHotelId) === String(targetHotelId)) {
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

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
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
    }
  );

  const getNavListForUser = (currentUser, activeRole) => {
    if (!currentUser) return [];
    const effectiveRole = activeRole || currentUser.role;
    if (effectiveRole === "HOTEL_ADMIN") {
      return ["overview", "daily-collections", "guests", "staff", "rooms", "subscriptions", "settings"];
    }
    if (effectiveRole === "RECEPTIONIST") {
      return ["overview", "rooms", "folios", "settings"];
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
        if (cleanPath === "checkin" || cleanPath === "check-in" || cleanPath === "booking") return 1;
        if (cleanPath === "id" || cleanPath === "kyc" || cleanPath === "compliance") return 2;
        if (cleanPath === "pos" || cleanPath === "billing") return 3;
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
