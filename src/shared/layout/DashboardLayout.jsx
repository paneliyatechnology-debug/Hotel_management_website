"use client";

import { useState } from "react";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Chip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Divider,
  Badge,
  useMediaQuery,
  useTheme,
  Button,
  Paper,
  Tooltip,
} from "@mui/material";
import {
  Hotel as HotelIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  NotificationsOutlined,
  Person,
  Lock,
  SupportAgent,
  CheckCircle,
  Palette,
  Settings as SettingsIcon,
  Help as HelpIcon,
  DarkMode,
  LightMode,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { usePresence } from "@/shared/context/SocketContext";
import PresenceBadge from "@/shared/components/PresenceBadge";

const DRAWER_WIDTH = 270;
const HEADER_HEIGHT = 64;

export default function DashboardLayout({
  user,
  navItems = [],
  activeTab = 0,
  onTabChange,
  onLogout,
  children,
}) {
  const { themeConfig, paletteKey, setPaletteKey, themePalettes, isDarkMode, toggleThemeMode } = useAppTheme();
  const { isConnected } = usePresence();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [paletteMenuAnchor, setPaletteMenuAnchor] = useState(null);

  // The Settings / More tab index is always the last item in navItems
  const settingsTabIndex = navItems.length - 1;

  const navigateToSettings = () => {
    if (isMobile) setSidebarOpen(false);
    if (onTabChange) onTabChange(settingsTabIndex);
  };


  const getRoleChip = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <Chip
            label="SUPER ADMIN"
            size="small"
            sx={{
              bgcolor: "#7e22ce",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.7rem",
              height: 26,
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(126, 34, 206, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          />
        );
      case "HOTEL_ADMIN":
        return (
          <Chip
            label="HOTEL ADMIN"
            size="small"
            sx={{
              bgcolor: themeConfig.primary,
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.7rem",
              height: 26,
              borderRadius: "8px",
              boxShadow: `0 2px 8px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.3)`,
            }}
          />
        );
      case "RECEPTIONIST":
        return (
          <Chip
            label="FRONT DESK"
            size="small"
            sx={{
              bgcolor: "#2563eb",
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "0.7rem",
              height: 26,
              borderRadius: "8px",
              boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3), inset 0 1px 0 rgba(255,255,255,0.3)",
            }}
          />
        );
      default:
        return <Chip label={role} size="small" sx={{ height: 26, borderRadius: "8px" }} />;
    }
  };

  // Check if Hotel is Disabled
  const isHotelDisabled =
    user?.role !== "SUPER_ADMIN" &&
    (user?.hotel?.status === "DISABLED" || user?.hotel?.status === "SUSPENDED");

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: themeConfig.bgMain }}>
      {/* Sidebar Navigation */}
      <Drawer
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? sidebarOpen : true}
        onClose={() => setSidebarOpen(false)}
        sx={{
          width: { xs: 0, md: DRAWER_WIDTH },
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            borderRadius: 0,
            boxSizing: "border-box",
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0F172A" : "#FFFFFF"),
            borderRight: `1px solid ${themeConfig.border}`,
            borderTop: "none",
            borderBottom: "none",
            borderLeft: "none",
            boxShadow: isDarkMode ? "4px 0 24px rgba(0, 0, 0, 0.4)" : "4px 0 24px rgba(12, 39, 59, 0.04)",
            display: "flex",
            flexDirection: "column",
            top: 0,
          },
        }}
      >
        {/* Brand Crest Header - Exactly 64px to match AppBar */}
        <Box
          sx={{
            height: HEADER_HEIGHT,
            minHeight: HEADER_HEIGHT,
            maxHeight: HEADER_HEIGHT,
            px: 2.5,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: `1px solid ${themeConfig.border}`,
            bgcolor: themeConfig.bgHeader || (isDarkMode ? "#0F172A" : "#FFFFFF"),
            boxSizing: "border-box",
            borderRadius: 0,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
            <Avatar
              src="/logo.png"
              alt="MYOWNPMS Logo"
              sx={{
                width: 38,
                height: 38,
                borderRadius: "10px",
                bgcolor: "transparent",
              }}
            />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 900, lineHeight: 1.1, color: themeConfig.textMain, fontSize: "0.95rem", letterSpacing: "0.02em" }}>
                MYOWNPMS
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.primaryDark, fontWeight: 700, letterSpacing: "0.05em", fontSize: "0.68rem" }}>
                {user?.role === "SUPER_ADMIN"
                  ? "SaaS Master Panel"
                  : user?.role === "HOTEL_ADMIN"
                    ? "Hotel Admin PMS"
                    : "Front Desk Console"}
              </Typography>
            </Box>
          </Box>

          {isMobile && (
            <IconButton size="small" onClick={() => setSidebarOpen(false)}>
              <ChevronLeftIcon />
            </IconButton>
          )}
        </Box>

        {/* Navigation Items */}
        <Box sx={{ flex: 1, py: 2, px: 1.5, overflowY: "auto" }}>
          <Typography variant="caption" sx={{ px: 1.5, mb: 1, display: "block", color: themeConfig.textMuted, fontWeight: 800, letterSpacing: "0.08em", fontSize: "0.68rem" }}>
            MAIN NAVIGATION
          </Typography>
          <List disablePadding>
            {navItems.map((item, index) => {
              const isSelected = activeTab === index;
              return (
                <ListItem key={item.label} disablePadding sx={{ mb: 0.6 }}>
                  <ListItemButton
                    onClick={() => {
                      if (onTabChange) onTabChange(index);
                      if (isMobile) setSidebarOpen(false);
                    }}
                    sx={{
                      borderRadius: "12px",
                      bgcolor: isSelected ? themeConfig.champagne : "transparent",
                      color: isSelected ? themeConfig.primaryDark : themeConfig.textMain,
                      border: `1px solid ${isSelected ? themeConfig.border : "transparent"}`,
                      boxShadow: isSelected
                        ? (isDarkMode ? `0 4px 12px ${themeConfig.primaryGlow}` : `0 4px 12px ${themeConfig.primaryGlow}, inset 0 1px 0 #FFFFFF`)
                        : "none",
                      py: 1,
                      px: 1.5,
                      transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                      "&:hover": {
                        bgcolor: themeConfig.champagne,
                        transform: "translateX(3px)",
                      },
                    }}
                  >
                    <ListItemIcon sx={{ color: isSelected ? themeConfig.primary : themeConfig.textMuted, minWidth: 36 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography sx={{ fontSize: "0.85rem", fontWeight: isSelected ? 800 : 600, color: isSelected ? themeConfig.primaryDark : themeConfig.textMain }}>
                          {item.label}
                        </Typography>
                      }
                    />
                    {item.badge && (
                      <Chip
                        label={item.badge}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          fontWeight: 800,
                          borderRadius: "6px",
                          bgcolor: isSelected ? themeConfig.primary : themeConfig.champagne,
                          color: isSelected ? "#ffffff" : themeConfig.primaryDark,
                          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                        }}
                      />
                    )}
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        </Box>

        <Divider sx={{ borderColor: themeConfig.border }} />

        {/* User Mini Profile Card at Bottom (Clean - 3D Inset Surface) */}
        <Box sx={{ p: 2, bgcolor: themeConfig.bgMain }}>
          <Box
            onClick={navigateToSettings}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 1.5,
              p: 1.2,
              borderRadius: "14px",
              border: `1px solid ${themeConfig.border}`,
              background: isDarkMode
                ? "linear-gradient(135deg, #162032 0%, #1E293B 100%)"
                : "linear-gradient(135deg, #FFFFFF 0%, #F9FBFC 100%)",
              boxShadow: isDarkMode
                ? "0 4px 14px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)"
                : "0 4px 14px rgba(12, 39, 59, 0.04), inset 0 1px 0 #FFFFFF",
              cursor: "pointer",
              transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
              "&:hover": {
                bgcolor: themeConfig.champagne,
                transform: "translateY(-2px)",
                boxShadow: isDarkMode
                  ? "0 6px 18px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
                  : "0 6px 18px rgba(12, 39, 59, 0.08), inset 0 1px 0 #FFFFFF",
              },
            }}
          >
            <Avatar
              sx={{
                background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                width: 38,
                height: 38,
                fontSize: "0.9rem",
                fontWeight: 800,
                borderRadius: "10px",
                boxShadow: `0 2px 8px ${themeConfig.primaryGlow}`,
              }}
            >
              {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
            </Avatar>
            <Box sx={{ overflow: "hidden", flex: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", fontSize: "0.85rem" }}>
                {user?.name || "Administrator"}
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", fontSize: "0.75rem" }}>
                {user?.email}
              </Typography>
            </Box>
          </Box>

          <Button
            fullWidth
            size="small"
            variant="outlined"
            onClick={onLogout}
            startIcon={<LogoutIcon fontSize="small" />}
            sx={{
              borderRadius: "12px",
              fontSize: "0.8rem",
              py: 0.8,
              borderColor: "rgba(220, 38, 38, 0.25)",
              color: themeConfig.danger,
              fontWeight: 700,
              boxShadow: "0 2px 6px rgba(220, 38, 38, 0.05)",
              "&:hover": { borderColor: themeConfig.danger, bgcolor: "rgba(220, 38, 38, 0.08)", transform: "translateY(-1px)" },
            }}
          >
            Sign Out
          </Button>
        </Box>
      </Drawer>

      {/* Main Layout Area */}
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Top AppBar - Exactly 64px matching the sidebar line */}
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            height: HEADER_HEIGHT,
            minHeight: HEADER_HEIGHT,
            maxHeight: HEADER_HEIGHT,
            bgcolor: isDarkMode ? "rgba(15, 23, 42, 0.92)" : "rgba(255, 255, 255, 0.96)",
            backdropFilter: "blur(14px)",
            borderBottom: `1px solid ${themeConfig.border}`,
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            borderRadius: 0,
            boxShadow: isDarkMode ? "0 2px 14px rgba(0, 0, 0, 0.3)" : "0 2px 14px rgba(12, 39, 59, 0.04)",
            color: themeConfig.textMain,
            boxSizing: "border-box",
            justifyContent: "center",
            top: 0,
            zIndex: 1100,
          }}
        >
          <Toolbar sx={{ justifyContent: "space-between", px: { xs: 1.5, sm: 3 }, minHeight: `${HEADER_HEIGHT}px !important`, height: HEADER_HEIGHT }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, minWidth: 0, overflow: "hidden" }}>
              {isMobile && (
                <IconButton color="inherit" edge="start" onClick={() => setSidebarOpen(!sidebarOpen)} sx={{ mr: 0.5, borderRadius: "50%" }}>
                  <MenuIcon />
                </IconButton>
              )}

              <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: { xs: "0.85rem", sm: "0.95rem" }, textTransform: "capitalize", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {user?.role === "SUPER_ADMIN"
                  ? "MYOWNPMS"
                  : user?.hotel?.name || "Hotel Management Portal"}
              </Typography>
            </Box>

            {/* Right Tools */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
              {getRoleChip(user?.role)}
            </Box>
          </Toolbar>
        </AppBar>

        {/* Content Body or Disabled Lock Screen */}
        <Box sx={{ flex: 1, pb: { xs: 10, md: 3 } }}>
          {isHotelDisabled ? (
            <Box sx={{ p: 4, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
              <Paper
                sx={{
                  p: 5,
                  maxWidth: 520,
                  textAlign: "center",
                  borderRadius: "20px",
                  bgcolor: themeConfig.bgCard,
                  border: `1.5px solid ${themeConfig.danger}`,
                  boxShadow: isDarkMode
                    ? "0 20px 45px -10px rgba(0, 0, 0, 0.6), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
                    : "0 20px 45px -10px rgba(220, 38, 38, 0.15), inset 0 1px 0 #FFFFFF",
                }}
              >
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: "16px",
                    bgcolor: "rgba(220, 38, 38, 0.12)",
                    color: themeConfig.danger,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 20px auto",
                    boxShadow: "0 4px 12px rgba(220, 38, 38, 0.2)",
                  }}
                >
                  <Lock sx={{ fontSize: 36 }} />
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 1 }}>
                  Account Deactivated
                </Typography>
                <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 3, lineHeight: 1.6 }}>
                  Your hotel enterprise license has been suspended or deactivated by SaaS Super Administration. Live reservations, check-ins, and bill settlements are currently locked.
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<SupportAgent />}
                  onClick={navigateToSettings}
                  sx={{
                    bgcolor: themeConfig.primary,
                    color: "#FFFFFF",
                    fontWeight: 700,
                    px: 3,
                    py: 1.2,
                    borderRadius: "12px",
                    boxShadow: `0 4px 14px ${themeConfig.primaryGlow}`,
                    "&:hover": { bgcolor: themeConfig.primaryDark },
                  }}
                >
                  Contact Super Admin
                </Button>
              </Paper>
            </Box>
          ) : (
            children
          )}
        </Box>

        {/* Mobile-Only Floating Bottom Tab Bar */}
        {isMobile && (
          <Paper
            elevation={8}
            sx={{
              position: "fixed",
              bottom: { xs: 8, sm: 12 },
              left: { xs: 6, sm: 14 },
              right: { xs: 6, sm: 14 },
              zIndex: 1200,
              borderRadius: "18px",
              bgcolor: "rgba(255, 255, 255, 0.96)",
              backdropFilter: "blur(20px)",
              WebkitBackdropFilter: "blur(20px)",
              border: `1.5px solid ${themeConfig.border}`,
              boxShadow: "0 14px 35px -6px rgba(12, 39, 59, 0.22), 0 4px 12px rgba(0,0,0,0.06), inset 0 1px 1px #FFFFFF",
              px: 0.4,
              py: 0.4,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-around",
              gap: 0.2,
              transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
            }}
          >
            {navItems.map((item, index) => {
              const isSelected = activeTab === index;
              const displayLabel =
                item.shortLabel ||
                item.label
                  .replace("Dashboard & ", "")
                  .replace("Pending ", "")
                  .replace(" & Audit Logs", "")
                  .replace(" & Operations", "")
                  .replace(" & Settings", "")
                  .replace(" & Management", "")
                  .split("&")[0]
                  .split("/")[0]
                  .trim();

              return (
                <Box
                  key={item.label}
                  onClick={() => {
                    if (onTabChange) onTabChange(index);
                    if (isMobile) setSidebarOpen(false);
                  }}
                  sx={{
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    py: 0.45,
                    px: 0.2,
                    borderRadius: "12px",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                    background: isSelected
                      ? `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`
                      : "transparent",
                    color: isSelected ? "#FFFFFF" : themeConfig.textMuted,
                    boxShadow: isSelected
                      ? `0 3px 10px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.4)`
                      : "none",
                    transform: isSelected ? "translateY(-1px)" : "none",
                    "&:hover": {
                      bgcolor: isSelected ? undefined : themeConfig.champagne,
                      color: isSelected ? "#FFFFFF" : themeConfig.primaryDark,
                    },
                    "&:active": {
                      transform: "scale(0.96)",
                    },
                  }}
                >
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isSelected ? "#FFFFFF" : themeConfig.textMuted,
                      "& svg": {
                        fontSize: 18,
                      },
                    }}
                  >
                    {item.icon}
                  </Box>
                  <Typography
                    variant="caption"
                    sx={{
                      fontSize: "0.62rem",
                      fontWeight: isSelected ? 800 : 700,
                      color: isSelected ? "#FFFFFF" : "inherit",
                      mt: 0.2,
                      lineHeight: 1.1,
                      whiteSpace: "nowrap",
                      textAlign: "center",
                      letterSpacing: "-0.015em",
                    }}
                  >
                    {displayLabel}
                  </Typography>

                  {item.badge && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 2,
                        right: "20%",
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        bgcolor: themeConfig.danger,
                        border: "1.5px solid #FFFFFF",
                      }}
                    />
                  )}
                </Box>
              );
            })}
          </Paper>
        )}
      </Box>
    </Box>
  );
}
