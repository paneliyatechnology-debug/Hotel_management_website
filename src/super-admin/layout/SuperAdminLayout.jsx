"use client";

import DashboardLayout from "@/shared/layout/DashboardLayout";
import { ROLE_NAV_PATHS } from "@/shared/utils/roleRoutes";
import {
  Dashboard as DashboardIcon,
  Hotel as HotelIcon,
  Stars,
  Settings,
  Receipt,
  People,
} from "@/shared/icons";

// Page order/paths come from roleRoutes so the sidebar, URLs and dashboard tabs can never drift apart
const PAGES = ROLE_NAV_PATHS.SUPER_ADMIN;

export const SUPER_ADMIN_NAV = [
  { label: "Business Overview", shortLabel: "Overview", path: PAGES[0], icon: <DashboardIcon fontSize="small" /> },
  { label: "Hotels Registry", shortLabel: "Hotels", path: PAGES[1], icon: <HotelIcon fontSize="small" /> },
  { label: "Subscription Plans", shortLabel: "Plans", path: PAGES[2], icon: <Stars fontSize="small" /> },
  { label: "Settings", shortLabel: "Settings", path: PAGES[3], icon: <Settings fontSize="small" /> },
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
