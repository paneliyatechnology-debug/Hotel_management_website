"use client";

import DashboardLayout from "@/shared/layout/DashboardLayout";
import {
  DashboardOutlined,
  Bed,
  HowToReg,
  MoreHoriz,
} from "@/shared/icons";

export const RECEPTIONIST_NAV = [
  { label: "Dashboard", shortLabel: "Overview", path: "dashboard", icon: <DashboardOutlined fontSize="small" /> },
  { label: "Rooms", shortLabel: "Rooms", path: "rooms", icon: <Bed fontSize="small" /> },
  { label: "In-House Folios", shortLabel: "Folios", path: "folios", icon: <HowToReg fontSize="small" /> },
  { label: "More", shortLabel: "More", path: "more", icon: <MoreHoriz fontSize="small" /> },
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
