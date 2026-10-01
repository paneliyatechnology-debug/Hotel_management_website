"use client";

import DashboardLayout from "@/shared/layout/DashboardLayout";
import {
  Dashboard as DashboardIcon,
  Person,
  People,
  Layers,
  Stars,
  Settings,
  Payments,
} from "@/shared/icons";

export const HOTEL_ADMIN_NAV = [
  { label: "Dashboard", shortLabel: "Dashboard", path: "overview", icon: <DashboardIcon fontSize="small" /> },
  { label: "Daily Collections", shortLabel: "Collections", path: "daily-collections", icon: <Payments fontSize="small" /> },
  { label: "Guest Directory", shortLabel: "Guests", path: "guests", icon: <Person fontSize="small" /> },
  { label: "Staff Management", shortLabel: "Staff", path: "staff", icon: <People fontSize="small" /> },
  { label: "Rooms & Tariffs", shortLabel: "Rooms", path: "rooms", icon: <Layers fontSize="small" /> },
  { label: "Subscription Plan", shortLabel: "Subscription", path: "subscriptions", icon: <Stars fontSize="small" /> },
  { label: "Settings", shortLabel: "Settings", path: "settings", icon: <Settings fontSize="small" /> },
];

export default function HotelAdminLayout({ user, activeTab, onTabChange, onLogout, children }) {
  return (
    <DashboardLayout
      user={user}
      navItems={HOTEL_ADMIN_NAV}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onLogout={onLogout}
    >
      {children}
    </DashboardLayout>
  );
}
