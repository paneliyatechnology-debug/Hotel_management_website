"use client";

import DashboardLayout from "@/shared/layout/DashboardLayout";
import { ROLE_NAV_PATHS } from "@/shared/utils/roleRoutes";
import {
  DashboardOutlined,
  Bed,
  MoreHoriz,
  Person,
} from "@/shared/icons";

// Page order/paths come from roleRoutes so the sidebar, URLs and dashboard tabs can never drift apart
const PAGES = ROLE_NAV_PATHS.RECEPTIONIST;

export const RECEPTIONIST_NAV = [
  { label: "Dashboard", shortLabel: "Overview", path: PAGES[0], icon: <DashboardOutlined fontSize="small" /> },
  { label: "Rooms", shortLabel: "Rooms", path: PAGES[1], icon: <Bed fontSize="small" /> },
  { label: "Guest Directory", shortLabel: "Guests", path: PAGES[2], icon: <Person fontSize="small" /> },
  { label: "More", shortLabel: "More", path: PAGES[3], icon: <MoreHoriz fontSize="small" /> },
];

export default function ReceptionistLayout({ user, activeTab, onTabChange, onLogout, children }) {
  return (
    <DashboardLayout
      user={user}
      navItems={RECEPTIONIST_NAV}
      activeTab={activeTab}
      onTabChange={onTabChange}
      onLogout={onLogout}
    >
      {children}
    </DashboardLayout>
  );
}
