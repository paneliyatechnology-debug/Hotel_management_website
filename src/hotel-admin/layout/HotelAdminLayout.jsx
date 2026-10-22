"use client";

import DashboardLayout from "@/shared/layout/DashboardLayout";
import { ROLE_NAV_PATHS } from "@/shared/utils/roleRoutes";
import {
  Dashboard as DashboardIcon,
  People,
  Layers,
  Stars,
  Settings,
  Person,
  ReceiptLong,
} from "@/shared/icons";

// Page order/paths come from roleRoutes so the sidebar, URLs and dashboard tabs can never drift apart
const PAGES = ROLE_NAV_PATHS.HOTEL_ADMIN;

export const HOTEL_ADMIN_NAV = [
  { label: "Dashboard", shortLabel: "Overview", path: PAGES[0], icon: <DashboardIcon fontSize="small" /> },
  { label: "Guest Directory", shortLabel: "Guests", path: PAGES[1], icon: <Person fontSize="small" /> },
  { label: "Staff", shortLabel: "Staff", path: PAGES[2], icon: <People fontSize="small" /> },
  { label: "Rooms & Tariffs", shortLabel: "Rooms", path: PAGES[3], icon: <Layers fontSize="small" /> },
  { label: "GST Report", shortLabel: "GST", path: PAGES[4], icon: <ReceiptLong fontSize="small" /> },
  { label: "Subscription Plan", shortLabel: "Plans", path: PAGES[5], icon: <Stars fontSize="small" /> },
  { label: "Settings", shortLabel: "Settings", path: PAGES[6], icon: <Settings fontSize="small" /> },
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
