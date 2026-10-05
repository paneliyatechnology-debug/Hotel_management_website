"use client";

import DashboardLayout from "@/shared/layout/DashboardLayout";
import {
  Dashboard as DashboardIcon,
  Hotel as HotelIcon,
  Stars,
  Settings,
  Receipt,
  People,
} from "@/shared/icons";

export const SUPER_ADMIN_NAV = [
  { label: "Business Overview", shortLabel: "Overview", path: "overview", icon: <DashboardIcon fontSize="small" /> },
  { label: "Hotels Registry", shortLabel: "Hotels", path: "hotels", icon: <HotelIcon fontSize="small" /> },
  { label: "Subscription Plans", shortLabel: "Plans", path: "plans", icon: <Stars fontSize="small" /> },
  { label: "Settings", shortLabel: "Settings", path: "settings", icon: <Settings fontSize="small" /> },
];

export default function SuperAdminLayout({ user, activeTab, onTabChange, onLogout, children }) {
  return (
    <DashboardLayout
      user={user}
      navItems={SUPER_ADMIN_NAV}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onLogout={onLogout}
    >
      {children}
    </DashboardLayout>
  );
}
