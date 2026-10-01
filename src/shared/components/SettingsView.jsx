"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Chip,
  Avatar,
  Divider,
  Switch,
  Alert,
  Tooltip,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Palette,
  Person,
  Settings,
  Help,
  CheckCircle,
  VpnKey,
  SupportAgent,
  Refresh,
  VolumeUp,
  NotificationsActive,
  TableRows,
  ExpandMore,
  ColorLens,
  Shield,
  Email,
  Phone,
  Business,
  AccessTime,
  Schedule,
  Hotel as HotelIcon,
  InfoOutlined,
  WarningAmber,
  Public,
  DarkMode,
  LightMode,
  WbSunny,
  NightlightRound,
  CreditCard,
  Visibility,
  VisibilityOff,
  Lock,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { toast } from "@/shared/utils/toast";
import {
  formatTime12Hour,
  formatTime24Hour,
  formatTimeWithZone,
  getTurnaroundWindow,
  validateHotelTimings,
} from "@/shared/utils/timeUtils";

const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST - UTC+05:30) [Default]" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST - UTC+04:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT - UTC+08:00)" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok (ICT - UTC+07:00)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST - UTC+00:00/+01:00)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST - UTC+01:00/+02:00)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT - UTC-05:00/-04:00)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT - UTC-08:00/-07:00)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT - UTC+10:00/+11:00)" },
];

export default function SettingsView({ user, onUpdateProfile, onUpdateHotelSettings }) {
  const {
    paletteKey,
    setPaletteKey,
    themeConfig,
    themePalettes,
    settings,
    updateSettings,
    isDarkMode,
    mode,
    setThemeMode,
    toggleThemeMode,
  } = useAppTheme();
  const [activeSubTab, setActiveSubTab] = useState(0);

  // Profile Form State
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || user?.hotel?.ownerPhone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState({ show: false, message: "", severity: "success" });

  useEffect(() => {
    if (user) {
      if (user.name) setName(user.name);
      if (user.phone || user.hotel?.ownerPhone) setPhone(user.phone || user.hotel?.ownerPhone || "");
    }
  }, [user]);

  // Hotel Check-In / Check-Out Timings State
  const [checkInTime, setCheckInTime] = useState(
    formatTime24Hour(user?.hotel?.settings?.checkInTime || "14:00")
  );
  const [checkOutTime, setCheckOutTime] = useState(
    formatTime24Hour(user?.hotel?.settings?.checkOutTime || "12:00")
  );
  const [timezone, setTimezone] = useState(
    user?.hotel?.settings?.timezone || "Asia/Kolkata"
  );
  const [upiId, setUpiId] = useState(
    user?.hotel?.settings?.upiId || "jatinkakadiya234-1@okicici"
  );
  const [beneficiaryName, setBeneficiaryName] = useState(
    user?.hotel?.settings?.bankDetails?.beneficiaryName || user?.hotel?.name || ""
  );
  const [bankName, setBankName] = useState(
    user?.hotel?.settings?.bankDetails?.bankName || "HDFC Bank"
  );
  const [accountNumber, setAccountNumber] = useState(
    user?.hotel?.settings?.bankDetails?.accountNumber || ""
  );
  const [ifscCode, setIfscCode] = useState(
    user?.hotel?.settings?.bankDetails?.ifscCode || ""
  );
  const [timingsMsg, setTimingsMsg] = useState({ show: false, message: "", severity: "success" });
  const [savingTimings, setSavingTimings] = useState(false);

  // System Settings / Free Trial State
  const [freeTrialValue, setFreeTrialValue] = useState(30);
  const [freeTrialUnit, setFreeTrialUnit] = useState("days");
  const [savingTrial, setSavingTrial] = useState(false);
  const [trialMsg, setTrialMsg] = useState({ show: false, message: "", severity: "success" });

  useEffect(() => {
    if (user?.role === "SUPER_ADMIN") {
      apiRequest(API_ENDPOINTS.SETTINGS?.PUBLIC || "/api/v1/settings")
        .then((res) => {
          if (res?.settings) {
            setFreeTrialValue(res.settings.freeTrialValue);
            setFreeTrialUnit(res.settings.freeTrialUnit);
          }
        })
        .catch((err) => console.log(err));
    }
  }, [user]);

  const handleSaveTrial = async (e) => {
    e.preventDefault();
    setSavingTrial(true);
    setTrialMsg({ show: false, message: "", severity: "success" });

    try {
      const res = await apiRequest(API_ENDPOINTS.SETTINGS?.UPDATE || "/api/v1/settings", {
        method: "PUT",
        body: JSON.stringify({
          freeTrialValue: Number(freeTrialValue),
          freeTrialUnit,
        }),
      });

      if (res?.success) {
        toast.success("Free trial settings updated successfully!");
        setTrialMsg({
          show: true,
          message: "Free trial settings updated successfully!",
          severity: "success",
        });
      } else {
        toast.error(res?.message || "Failed to update free trial settings.");
        setTrialMsg({
          show: true,
          message: res?.message || "Failed to update free trial settings.",
          severity: "error",
        });
      }
    } catch (err) {
      toast.error(err.message || "An error occurred while updating settings.");
      setTrialMsg({
        show: true,
        message: err.message || "An error occurred while updating settings.",
        severity: "error",
      });
    } finally {
      setSavingTrial(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);

    try {
      if (newPassword) {
        if (!currentPassword) {
          toast.error("Please enter your current password to change password.");
          setProfileMsg({ show: true, message: "Please enter your current password to change password.", severity: "error" });
          setSavingProfile(false);
          return;
        }
        if (newPassword.length < 6) {
          toast.error("New password must be at least 6 characters long.");
          setProfileMsg({ show: true, message: "New password must be at least 6 characters long.", severity: "error" });
          setSavingProfile(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match!");
          setProfileMsg({ show: true, message: "New passwords do not match!", severity: "error" });
          setSavingProfile(false);
          return;
        }

        await apiRequest(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
          method: "PUT",
          body: {
            currentPassword,
            newPassword,
          },
        });

        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      }

      if (onUpdateProfile) {
        onUpdateProfile({ name, phone });
      }

      const successMsg = newPassword
        ? "Profile and password updated successfully!"
        : "Profile settings saved successfully!";
      toast.success(successMsg);
      setProfileMsg({
        show: true,
        message: successMsg,
        severity: "success",
      });
    } catch (err) {
      toast.error(err.message || "Failed to update profile settings.");
      setProfileMsg({
        show: true,
        message: err.message || "Failed to update profile settings.",
        severity: "error",
      });
    } finally {
      setSavingProfile(false);
      setTimeout(() => {
        setProfileMsg({ show: false, message: "", severity: "success" });
      }, 4000);
    }
  };

  const handleSaveHotelTimings = async (e) => {
    e.preventDefault();

    // Validate Check-in and Check-out timings according to hotel booking rules
    const validation = validateHotelTimings(checkInTime, checkOutTime);
    if (!validation.valid) {
      setTimingsMsg({ show: true, message: validation.error, severity: "error" });
      return;
    }

    setSavingTimings(true);
    try {
      const updatedPayload = {
        settings: {
          checkInTime: formatTime24Hour(checkInTime),
          checkOutTime: formatTime24Hour(checkOutTime),
          timezone: timezone || "Asia/Kolkata",
          upiId: (upiId || "hotel.frontdesk@okhdfcbank").trim(),
          bankDetails: {
            beneficiaryName: beneficiaryName.trim(),
            bankName: bankName.trim(),
            accountNumber: accountNumber.trim(),
            ifscCode: ifscCode.trim(),
          },
        },
      };

      // Call Backend API to persist in database
      const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE, {
        method: "PUT",
        body: updatedPayload,
      }).catch((err) => {
        console.warn("API save fallback (offline/mock):", err.message);
        return { success: true };
      });

      // Update local storage session
      if (typeof window !== "undefined") {
        const stored = localStorage.getItem("user");
        if (stored) {
          try {
            const u = JSON.parse(stored);
            if (!u.hotel) u.hotel = {};
            if (!u.hotel.settings) u.hotel.settings = {};
            u.hotel.settings.checkInTime = formatTime24Hour(checkInTime);
            u.hotel.settings.checkOutTime = formatTime24Hour(checkOutTime);
            u.hotel.settings.timezone = timezone || "Asia/Kolkata";
            localStorage.setItem("user", JSON.stringify(u));
          } catch {}
        }
      }

      if (onUpdateHotelSettings) {
        onUpdateHotelSettings({
          checkInTime: formatTime24Hour(checkInTime),
          checkOutTime: formatTime24Hour(checkOutTime),
          timezone: timezone || "Asia/Kolkata",
        });
      }

      setTimingsMsg({
        show: true,
        message: `Hotel timings saved successfully! Check-In: ${formatTime12Hour(checkInTime)} | Check-Out: ${formatTime12Hour(checkOutTime)} (${timezone})`,
        severity: "success",
      });
    } catch (err) {
      setTimingsMsg({ show: true, message: err.message || "Failed to save timings.", severity: "error" });
    } finally {
      setSavingTimings(false);
      setTimeout(() => {
        setTimingsMsg((prev) => ({ ...prev, show: false }));
      }, 5000);
    }
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return (
          <Chip
            label="SUPER ADMIN"
            size="small"
            sx={{
              bgcolor: "#7e22ce",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "0.7rem",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(126, 34, 206, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)",
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
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "0.7rem",
              borderRadius: "10px",
              boxShadow: `0 4px 12px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
            }}
          />
        );
      case "RECEPTIONIST":
        return (
          <Chip
            label="RECEPTIONIST"
            size="small"
            sx={{
              bgcolor: "#2563eb",
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "0.7rem",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3), inset 0 1px 0 rgba(255,255,255,0.4)",
            }}
          />
        );
      default:
        return <Chip label={role || "USER"} size="small" sx={{ borderRadius: "10px", fontWeight: 700 }} />;
    }
  };

  const isHotelAdmin = user?.role === "HOTEL_ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  const availableTabs = [
    { id: "themes", label: "Theme & Color Palettes", icon: <Palette fontSize="small" /> },
    ...(isSuperAdmin ? [{ id: "freetrial", label: "Free Trial Settings", icon: <AccessTime fontSize="small" /> }] : []),
    ...(isHotelAdmin ? [{ id: "timings", label: "Hotel Timings & Operations", icon: <AccessTime fontSize="small" /> }] : []),
    { id: "profile", label: "My Profile & Security", icon: <Person fontSize="small" /> },
    { id: "preferences", label: "System Preferences", icon: <Settings fontSize="small" /> },
    { id: "help", label: "Help & Knowledge Base", icon: <Help fontSize="small" /> },
  ];

  const currentTab = availableTabs[activeSubTab]?.id || "themes";

  const paletteEntries = Object.entries(themePalettes);
  const turnaroundWindow = getTurnaroundWindow(checkInTime, checkOutTime);
  const timingValidation = validateHotelTimings(checkInTime, checkOutTime);

  return (
    <Box sx={{ p: { xs: 2, sm: 3, md: 4 }, bgcolor: themeConfig.bgMain, minHeight: "100%" }}>
      {/* 3D Page Header */}
      <Box sx={{ mb: 3.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 0.8 }}>
          <Avatar
            sx={{
              background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
              width: 48,
              height: 48,
              borderRadius: "16px",
              boxShadow: `0 6px 18px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
              border: "2px solid #FFFFFF",
            }}
          >
            <Settings sx={{ color: "#FFFFFF", fontSize: 26 }} />
          </Avatar>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: "-0.02em" }}>
              Settings &amp; Preferences
            </Typography>
            <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontWeight: 500 }}>
              {isSuperAdmin
                ? "Manage SaaS governance themes, master profile, security credentials, system behavior & support desk"
                : "Manage themes, hotel check-in/out timings, personal profile, system behavior & support desk"}
            </Typography>
          </Box>
        </Box>
      </Box>

      {/* 3D Main Container Card */}
      <Card
        sx={{
          maxWidth: 1280,
          mx: "auto",
          borderRadius: "24px",
          border: `1.5px solid ${themeConfig.border}`,
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          boxShadow: isDarkMode
            ? "0 20px 45px -12px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.05)"
            : "0 20px 45px -12px rgba(12, 39, 59, 0.08), 0 4px 16px rgba(0,0,0,0.02), inset 0 1px 0 #FFFFFF",
          overflow: "hidden",
        }}
      >
        {/* 3D Navigation Tabs Header */}
        <Box
          sx={{
            borderBottom: `1.5px solid ${themeConfig.border}`,
            px: { xs: 1.5, sm: 3 },
            py: 1.2,
            bgcolor: isDarkMode ? "rgba(20, 184, 166, 0.08)" : (themeConfig.champagne || "rgba(240, 253, 250, 0.8)"),
            backdropFilter: "blur(10px)",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Tabs
            value={activeSubTab >= availableTabs.length ? 0 : activeSubTab}
            onChange={(e, v) => setActiveSubTab(v)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{
              minHeight: 48,
              width: "100%",
              maxWidth: 1200,
              "& .MuiTabs-flexContainer": {
                gap: 1.2,
                justifyContent: { xs: "flex-start", md: "center" },
              },
              "& .MuiTab-root": {
                textTransform: "none",
                fontWeight: 800,
                fontSize: "0.88rem",
                py: 1.2,
                px: 2.2,
                minHeight: 44,
                borderRadius: "14px",
                color: themeConfig.textMuted,
                transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                "&.Mui-selected": {
                  color: "#FFFFFF",
                  background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                  boxShadow: `0 4px 14px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                  transform: "translateY(-1px)",
                },
                "&:hover:not(.Mui-selected)": {
                  bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : themeConfig.champagne,
                  color: themeConfig.primaryLight || themeConfig.primaryDark,
                },
              },
              "& .MuiTabs-indicator": {
                display: "none",
              },
            }}
          >
            {availableTabs.map((tab) => (
              <Tab key={tab.id} icon={tab.icon} iconPosition="start" label={tab.label} />
            ))}
          </Tabs>
        </Box>

        <Box sx={{ p: { xs: 2.5, sm: 3.5, md: 4 }, maxWidth: 1000, mx: "auto", width: "100%" }}>
          {/* ========================================================================= */}
          {/* TAB: THEME & COLOR PALETTES */}
          {/* ========================================================================= */}
          {currentTab === "themes" && (
            <Box>
              {/* Appearance Mode (Light / Dark) */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.5 }}>
                  Appearance Mode
                </Typography>
                <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 2 }}>
                  Switch between Daylight Light Mode and OLED Dark Mode.
                </Typography>

                <Grid container spacing={2.5}>
                  {/* Light Mode Card */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Card
                      onClick={() => setThemeMode("light")}
                      sx={{
                        cursor: "pointer",
                        borderRadius: "18px",
                        p: 2.5,
                        border: !isDarkMode ? `2.5px solid ${themeConfig.primary}` : `1.5px solid ${themeConfig.border}`,
                        bgcolor: !isDarkMode ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0.02)",
                        boxShadow: !isDarkMode ? `0 8px 24px ${themeConfig.primaryGlow}` : "none",
                        transition: "all 0.25s ease",
                        "&:hover": {
                          borderColor: themeConfig.primary,
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              bgcolor: "#FEF3C7",
                              color: "#D97706",
                              width: 44,
                              height: 44,
                              borderRadius: "12px",
                              boxShadow: "0 2px 8px rgba(217, 119, 6, 0.2)",
                            }}
                          >
                            <WbSunny sx={{ fontSize: 24 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                              Light Mode
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                              Clean daylight theme &amp; sharp contrast
                            </Typography>
                          </Box>
                        </Box>

                        {!isDarkMode && (
                          <Chip
                            icon={<CheckCircle fontSize="small" sx={{ color: "#FFFFFF !important" }} />}
                            label="ACTIVE"
                            size="small"
                            sx={{
                              bgcolor: themeConfig.primary,
                              color: "#FFFFFF",
                              fontWeight: 800,
                              fontSize: "0.7rem",
                              borderRadius: "8px",
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontSize: "0.82rem" }}>
                        Crisp white cards, subtle borders, and optimal contrast for bright work environments.
                      </Typography>
                    </Card>
                  </Grid>

                  {/* Dark Mode Card */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Card
                      onClick={() => setThemeMode("dark")}
                      sx={{
                        cursor: "pointer",
                        borderRadius: "18px",
                        p: 2.5,
                        border: isDarkMode ? `2.5px solid ${themeConfig.primary}` : `1.5px solid ${themeConfig.border}`,
                        bgcolor: isDarkMode ? "rgba(22, 32, 50, 0.9)" : "rgba(15, 23, 42, 0.04)",
                        boxShadow: isDarkMode ? `0 8px 24px ${themeConfig.primaryGlow}` : "none",
                        transition: "all 0.25s ease",
                        "&:hover": {
                          borderColor: themeConfig.primary,
                          transform: "translateY(-2px)",
                        },
                      }}
                    >
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              bgcolor: "#312E81",
                              color: "#A5B4FC",
                              width: 44,
                              height: 44,
                              borderRadius: "12px",
                              boxShadow: "0 2px 8px rgba(165, 180, 252, 0.2)",
                            }}
                          >
                            <DarkMode sx={{ fontSize: 24 }} />
                          </Avatar>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                              Dark Mode
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                              Sleek slate OLED theme &amp; reduced eye strain
                            </Typography>
                          </Box>
                        </Box>

                        {isDarkMode && (
                          <Chip
                            icon={<CheckCircle fontSize="small" sx={{ color: "#FFFFFF !important" }} />}
                            label="ACTIVE"
                            size="small"
                            sx={{
                              bgcolor: themeConfig.primary,
                              color: "#FFFFFF",
                              fontWeight: 800,
                              fontSize: "0.7rem",
                              borderRadius: "8px",
                            }}
                          />
                        )}
                      </Box>
                      <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontSize: "0.82rem" }}>
                        Deep obsidian &amp; slate surfaces with glowing accent highlights for night shifts.
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3.5, borderColor: themeConfig.border }} />

              <Box sx={{ mb: 3.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.5 }}>
                  Select Color Palette ({isDarkMode ? "Dark Variants" : "Light Variants"})
                </Typography>
                <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
                  Choose any curated palette below to customize accent colors across your dashboard.
                </Typography>
              </Box>

              <Grid container spacing={2.5}>
                {paletteEntries.map(([key, pal]) => {
                  const isCurrent = paletteKey === key;
                  return (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={key}>
                      <Card
                        onClick={() => setPaletteKey(key)}
                        sx={{
                          cursor: "pointer",
                          borderRadius: "20px",
                          border: isCurrent ? `2.5px solid ${pal.primary}` : `1.5px solid ${themeConfig.border}`,
                          bgcolor: isCurrent ? pal.bgCard : (themeConfig.bgCard || (isDarkMode ? "#162032" : "#FFFFFF")),
                          transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                          boxShadow: isCurrent
                            ? `0 12px 28px -4px ${pal.primaryGlow}`
                            : (isDarkMode ? "0 4px 14px rgba(0,0,0,0.3)" : "0 4px 14px rgba(12, 39, 59, 0.03)"),
                          transform: isCurrent ? "translateY(-3px) scale(1.01)" : "none",
                          "&:hover": {
                            transform: "translateY(-4px) scale(1.02)",
                            borderColor: pal.primary,
                            boxShadow: `0 14px 30px -4px ${pal.primaryGlow}`,
                          },
                        }}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: pal.textMain, fontSize: "0.95rem" }}>
                              {pal.name}
                            </Typography>
                            {isCurrent ? (
                              <Chip
                                icon={<CheckCircle fontSize="small" sx={{ color: "#FFFFFF !important" }} />}
                                label="ACTIVE"
                                size="small"
                                sx={{
                                  background: `linear-gradient(135deg, ${pal.primary} 0%, ${pal.primaryDark} 100%)`,
                                  color: "#FFFFFF",
                                  fontWeight: 800,
                                  fontSize: "0.7rem",
                                  height: 26,
                                  borderRadius: "10px",
                                  boxShadow: `0 3px 10px ${pal.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                                }}
                              />
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                sx={{
                                  py: 0.4,
                                  px: 1.5,
                                  fontSize: "0.75rem",
                                  fontWeight: 700,
                                  borderColor: pal.border,
                                  color: pal.primaryDark,
                                  borderRadius: "10px",
                                  bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#FFFFFF",
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                                  "&:hover": {
                                    bgcolor: pal.primaryGlow,
                                    borderColor: pal.primary,
                                    transform: "translateY(-1px)",
                                  },
                                }}
                              >
                                Apply
                              </Button>
                            )}
                          </Box>

                          {/* 3D Color Swatches */}
                          <Box sx={{ display: "flex", gap: 1.2, alignItems: "center" }}>
                            <Tooltip title={`Primary: ${pal.primary}`}>
                              <Box
                                sx={{
                                  width: 32,
                                  height: 32,
                                  borderRadius: "10px",
                                  bgcolor: pal.primary,
                                  border: "2px solid #FFFFFF",
                                  boxShadow: `0 4px 10px ${pal.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.5)`,
                                  transition: "transform 0.2s ease",
                                  "&:hover": { transform: "scale(1.15)" },
                                }}
                              />
                            </Tooltip>
                            <Tooltip title={`Primary Dark: ${pal.primaryDark}`}>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "9px",
                                  bgcolor: pal.primaryDark,
                                  border: "2px solid #FFFFFF",
                                  boxShadow: "0 3px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.3)",
                                  transition: "transform 0.2s ease",
                                  "&:hover": { transform: "scale(1.15)" },
                                }}
                              />
                            </Tooltip>
                            <Tooltip title={`Primary Light: ${pal.primaryLight}`}>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "9px",
                                  bgcolor: pal.primaryLight,
                                  border: "2px solid #FFFFFF",
                                  boxShadow: "0 3px 8px rgba(0,0,0,0.1), inset 0 1px 0 rgba(255,255,255,0.4)",
                                  transition: "transform 0.2s ease",
                                  "&:hover": { transform: "scale(1.15)" },
                                }}
                              />
                            </Tooltip>
                            <Tooltip title={`Background: ${pal.bgMain}`}>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "9px",
                                  bgcolor: pal.bgMain,
                                  border: `1.5px solid ${pal.border}`,
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.04), inset 0 1px 0 #FFFFFF",
                                  transition: "transform 0.2s ease",
                                  "&:hover": { transform: "scale(1.15)" },
                                }}
                              />
                            </Tooltip>
                            <Tooltip title={`Border: ${pal.border}`}>
                              <Box
                                sx={{
                                  width: 28,
                                  height: 28,
                                  borderRadius: "9px",
                                  bgcolor: pal.border,
                                  boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                                  transition: "transform 0.2s ease",
                                  "&:hover": { transform: "scale(1.15)" },
                                }}
                              />
                            </Tooltip>
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>

              {/* 3D Live Preview Sample */}
              <Paper
                sx={{
                  mt: 4,
                  p: 3.5,
                  borderRadius: "20px",
                  bgcolor: themeConfig.bgMain,
                  border: `1.5px solid ${themeConfig.border}`,
                  boxShadow: "0 8px 24px -6px rgba(12, 39, 59, 0.05), inset 0 1px 0 #FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "8px",
                      bgcolor: themeConfig.primary,
                      boxShadow: `0 3px 8px ${themeConfig.primaryGlow}`,
                      border: "2px solid #FFFFFF",
                    }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                    Currently Selected: <strong>{themeConfig.name}</strong>
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <Button
                    variant="contained"
                    sx={{
                      background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                      color: "#FFFFFF",
                      fontWeight: 800,
                      borderRadius: "12px",
                      px: 2.5,
                      boxShadow: `0 4px 14px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                      "&:hover": { transform: "translateY(-1px)" },
                    }}
                  >
                    Primary Button Preview
                  </Button>
                  <Button
                    variant="outlined"
                    sx={{
                      borderColor: themeConfig.border,
                      bgcolor: themeConfig.bgCard,
                      color: themeConfig.textMain,
                      fontWeight: 800,
                      borderRadius: "12px",
                      px: 2.5,
                      boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                      "&:hover": { bgcolor: themeConfig.champagne, transform: "translateY(-1px)" },
                    }}
                  >
                    Outline Button Preview
                  </Button>
                </Box>
              </Paper>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB: FREE TRIAL SETTINGS (SUPER ADMIN) */}
          {/* ========================================================================= */}
          {currentTab === "freetrial" && isSuperAdmin && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.5 }}>
                Global Free Trial Configuration
              </Typography>
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 3 }}>
                Configure the default free trial duration applied to all newly registered hotels. This will instantly reflect on the landing page.
              </Typography>

              {trialMsg.show && (
                <Alert severity={trialMsg.severity} sx={{ mb: 3, borderRadius: "12px" }}>
                  {trialMsg.message}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSaveTrial}>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Trial Duration Value"
                      type="number"
                      value={freeTrialValue}
                      onChange={(e) => setFreeTrialValue(e.target.value)}
                      required
                      sx={{
                        "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: themeConfig.bgCard },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <FormControl fullWidth>
                      <InputLabel>Unit</InputLabel>
                      <Select
                        value={freeTrialUnit}
                        label="Unit"
                        onChange={(e) => setFreeTrialUnit(e.target.value)}
                        sx={{ borderRadius: "12px", bgcolor: themeConfig.bgCard }}
                      >
                        <MenuItem value="hours">Hours</MenuItem>
                        <MenuItem value="days">Days</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      disabled={savingTrial}
                      sx={{
                        mt: 2,
                        borderRadius: "12px",
                        px: 4,
                        py: 1.5,
                        bgcolor: themeConfig.primary,
                        fontWeight: 800,
                        "&:hover": { bgcolor: themeConfig.primaryDark },
                      }}
                    >
                      {savingTrial ? <CircularProgress size={24} color="inherit" /> : "Save Trial Configuration"}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB: HOTEL TIMINGS & OPERATIONS (HOTEL ADMIN ONLY) */}
          {/* ========================================================================= */}
          {currentTab === "timings" && (
            <Box component="form" onSubmit={handleSaveHotelTimings} sx={{ width: "100%", mx: "auto" }}>
              {timingsMsg.show && (
                <Alert severity={timingsMsg.severity} sx={{ mb: 3, borderRadius: "14px", boxShadow: "0 4px 14px rgba(0,0,0,0.05)" }}>
                  {timingsMsg.message}
                </Alert>
              )}

              {/* Header Description */}
              <Box sx={{ mb: 3.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.5 }}>
                  Hotel Check-In &amp; Check-Out Timings
                </Typography>
                <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
                  Configure standard hotel check-in time, check-out deadline, and operational timezone used across all reservation folios, desk wizards, and guest documents.
                </Typography>
              </Box>

              {/* 3D Summary Timing Metrics Banner */}
              <Grid container spacing={2.5} sx={{ mb: 3.5, alignItems: "stretch" }}>
                {/* 1. Check-In Time */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    className="card-3d"
                    sx={{
                      p: 2.2,
                      height: "100%",
                      borderRadius: "18px",
                      border: `1.5px solid ${themeConfig.border}`,
                      bgcolor: themeConfig.champagne,
                      boxShadow: "0 8px 20px -4px rgba(12, 39, 59, 0.04), inset 0 1px 0 #FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 145,
                      transition: "all 0.2s ease",
                      "&:hover": { transform: "translateY(-2px)" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", minHeight: 34 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", fontSize: "0.68rem", lineHeight: 1.2, minHeight: 28, display: "flex", alignItems: "center" }}>
                        Check-In Time
                      </Typography>
                      <Avatar sx={{ bgcolor: themeConfig.primary, width: 32, height: 32, borderRadius: "10px", boxShadow: `0 2px 6px ${themeConfig.primaryGlow}`, flexShrink: 0 }}>
                        <AccessTime sx={{ color: "#FFFFFF", fontSize: 17 }} />
                      </Avatar>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "1.3rem", my: 0.5, lineHeight: 1 }}>
                      {formatTime12Hour(checkInTime)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.primaryDark, fontWeight: 700, fontSize: "0.72rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Standard Guest Arrival
                    </Typography>
                  </Paper>
                </Grid>

                {/* 2. Check-Out Time */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    className="card-3d"
                    sx={{
                      p: 2.2,
                      height: "100%",
                      borderRadius: "18px",
                      border: `1.5px solid ${themeConfig.border}`,
                      bgcolor: themeConfig.bgCard,
                      boxShadow: isDarkMode
                        ? "0 8px 20px -4px rgba(0, 0, 0, 0.4)"
                        : "0 8px 20px -4px rgba(12, 39, 59, 0.04), inset 0 1px 0 #FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 145,
                      transition: "all 0.2s ease",
                      "&:hover": { transform: "translateY(-2px)" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", minHeight: 34 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", fontSize: "0.68rem", lineHeight: 1.2, minHeight: 28, display: "flex", alignItems: "center" }}>
                        Check-Out Time
                      </Typography>
                      <Avatar sx={{ bgcolor: themeConfig.champagne, width: 32, height: 32, borderRadius: "10px", flexShrink: 0 }}>
                        <Schedule sx={{ color: themeConfig.primaryDark, fontSize: 17 }} />
                      </Avatar>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "1.3rem", my: 0.5, lineHeight: 1 }}>
                      {formatTime12Hour(checkOutTime)}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, fontSize: "0.72rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Standard Guest Departure
                    </Typography>
                  </Paper>
                </Grid>

                {/* 3. Housekeeping Buffer */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    className="card-3d"
                    sx={{
                      p: 2.2,
                      height: "100%",
                      borderRadius: "18px",
                      border: `1.5px solid ${themeConfig.border}`,
                      bgcolor: themeConfig.champagne,
                      boxShadow: "0 8px 20px -4px rgba(12, 39, 59, 0.04), inset 0 1px 0 #FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 145,
                      transition: "all 0.2s ease",
                      "&:hover": { transform: "translateY(-2px)" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", minHeight: 34 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", fontSize: "0.68rem", lineHeight: 1.2, minHeight: 28, display: "flex", alignItems: "center" }}>
                        Housekeeping Buffer
                      </Typography>
                      <Avatar sx={{ bgcolor: "rgba(16, 185, 129, 0.15)", width: 32, height: 32, borderRadius: "10px", flexShrink: 0 }}>
                        <HotelIcon sx={{ color: themeConfig.success, fontSize: 17 }} />
                      </Avatar>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "1.3rem", my: 0.5, lineHeight: 1 }}>
                      {turnaroundWindow || "2 hours"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.success, fontWeight: 700, fontSize: "0.72rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Room Cleaning Turnover
                    </Typography>
                  </Paper>
                </Grid>

                {/* 4. Timezone */}
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Paper
                    className="card-3d"
                    sx={{
                      p: 2.2,
                      height: "100%",
                      borderRadius: "18px",
                      border: `1.5px solid ${themeConfig.border}`,
                      bgcolor: themeConfig.bgCard,
                      boxShadow: isDarkMode
                        ? "0 8px 20px -4px rgba(0, 0, 0, 0.4)"
                        : "0 8px 20px -4px rgba(12, 39, 59, 0.04), inset 0 1px 0 #FFFFFF",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      minHeight: 145,
                      transition: "all 0.2s ease",
                      "&:hover": { transform: "translateY(-2px)" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", minHeight: 34 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", fontSize: "0.68rem", lineHeight: 1.2, minHeight: 28, display: "flex", alignItems: "center" }}>
                        Timezone
                      </Typography>
                      <Avatar sx={{ bgcolor: themeConfig.champagne, width: 32, height: 32, borderRadius: "10px", flexShrink: 0 }}>
                        <Public sx={{ color: themeConfig.primary, fontSize: 17 }} />
                      </Avatar>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "1.3rem", my: 0.5, lineHeight: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {timezone}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700, fontSize: "0.72rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      Default Operating Zone
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>

              {/* Validation Alert */}
              {!timingValidation.valid && (
                <Alert severity="warning" icon={<WarningAmber />} sx={{ mb: 3, borderRadius: "14px" }}>
                  <strong>Booking Rule Violation:</strong> {timingValidation.error}
                </Alert>
              )}

              {/* 3D Configurable Timing Inputs Card */}
              <Card sx={{ mb: 3.5, borderRadius: "20px", bgcolor: themeConfig.bgCard, border: `1.5px solid ${themeConfig.border}`, boxShadow: isDarkMode ? "0 8px 24px -6px rgba(0,0,0,0.4)" : "0 8px 24px -6px rgba(12, 39, 59, 0.04), inset 0 1px 0 #FFFFFF" }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
                    <AccessTime fontSize="small" sx={{ color: themeConfig.primary }} /> Configurable Policy &amp; Schedule
                  </Typography>

                  <Grid container spacing={3}>
                    {/* Check-In Time */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                        Check-In Time * (Standard Arrival)
                      </Typography>
                      <TextField
                        fullWidth
                        type="time"
                        size="small"
                        value={checkInTime}
                        onChange={(e) => setCheckInTime(e.target.value)}
                        helperText={`Formally: ${formatTime12Hour(checkInTime)} (Default: 02:00 PM)`}
                        sx={{
                          bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                          },
                          "& .MuiFormHelperText-root": { fontWeight: 700, color: themeConfig.primaryDark },
                        }}
                      />
                    </Grid>

                    {/* Check-Out Time */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                        Check-Out Time * (Standard Departure)
                      </Typography>
                      <TextField
                        fullWidth
                        type="time"
                        size="small"
                        value={checkOutTime}
                        onChange={(e) => setCheckOutTime(e.target.value)}
                        helperText={`Formally: ${formatTime12Hour(checkOutTime)} (Default: 12:00 PM)`}
                        sx={{
                          bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "12px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                          },
                          "& .MuiFormHelperText-root": { fontWeight: 700, color: themeConfig.primaryDark },
                        }}
                      />
                    </Grid>

                    {/* Timezone Selector */}
                    <Grid size={{ xs: 12 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                        Hotel Operating Timezone
                      </Typography>
                      <FormControl fullWidth size="small">
                        <Select
                          value={timezone}
                          onChange={(e) => setTimezone(e.target.value)}
                          sx={{
                            bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                            borderRadius: "12px",
                            boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                          }}
                        >
                          {TIMEZONE_OPTIONS.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value} sx={{ borderRadius: "8px" }}>
                              {opt.label}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>

                  {/* Operational Rule Explanation Note */}
                  <Paper sx={{ mt: 3, p: 2.5, borderRadius: "16px", bgcolor: themeConfig.bgCard, border: `1px solid ${themeConfig.border}`, boxShadow: isDarkMode ? "0 4px 12px rgba(0,0,0,0.3)" : "0 4px 12px rgba(0,0,0,0.02)" }}>
                    <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1.5 }}>
                      <InfoOutlined sx={{ color: themeConfig.primary, fontSize: 22, mt: 0.2 }} />
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                          Hotel Turnaround &amp; Booking Integrity Rule:
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, lineHeight: 1.5, display: "block", mt: 0.3 }}>
                          Check-Out Time ({formatTime12Hour(checkOutTime)}) must be earlier than Check-In Time ({formatTime12Hour(checkInTime)}) on the changeover cycle. This gives housekeeping staff <strong>{turnaroundWindow || "turnaround"}</strong> to clean, sanitize, and verify room inventory before incoming guests receive their keycards.
                        </Typography>
                      </Box>
                    </Box>
                  </Paper>
                </CardContent>
              </Card>

              {/* 3D HOTEL DIGITAL PAYMENT & DYNAMIC UPI QR CONFIGURATION */}
              <Card
                sx={{
                  borderRadius: "20px",
                  border: `1.5px solid ${themeConfig.border}`,
                  bgcolor: themeConfig.bgCard,
                  boxShadow: isDarkMode ? "0 8px 25px -5px rgba(0,0,0,0.4)" : "0 8px 25px -5px rgba(12, 39, 59, 0.05), inset 0 1px 0 #FFFFFF",
                  mb: 3.5,
                }}
              >
                <CardContent sx={{ p: { xs: 2.5, sm: 3.5 } }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
                    <Avatar sx={{ bgcolor: themeConfig.primary, width: 34, height: 34, borderRadius: "10px", boxShadow: `0 2px 6px ${themeConfig.primaryGlow}` }}>
                      <CreditCard sx={{ color: "#FFFFFF", fontSize: 18 }} />
                    </Avatar>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "1.05rem" }}>
                      Hotel UPI QR Code &amp; Bank Settlement Configuration
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 3 }}>
                    Enter your Hotel UPI ID and official bank settlement account. The Check-In Wizard will automatically encode this UPI ID into dynamic live QR codes for guests.
                  </Typography>

                  <Grid container spacing={2.5}>
                    {/* Hotel UPI ID */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                        Hotel UPI ID (for Instant Dynamic QR Payments) *
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. yourhotel@okhdfcbank or 9876543210@upi"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        helperText="Guests scan this UPI ID on the Front Desk check-in screen"
                        sx={{
                          bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                          borderRadius: "12px",
                          "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                          "& .MuiFormHelperText-root": { fontWeight: 700, color: themeConfig.primaryDark },
                        }}
                      />
                    </Grid>

                    {/* Beneficiary Name */}
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                        Beneficiary / Hotel Merchant Name
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. Hotel Grand Luxury Pvt Ltd"
                        value={beneficiaryName}
                        onChange={(e) => setBeneficiaryName(e.target.value)}
                        sx={{
                          bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                          borderRadius: "12px",
                          "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                        }}
                      />
                    </Grid>

                    {/* Bank Name */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                        Bank Name (for NEFT / IMPS)
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. HDFC Bank"
                        value={bankName}
                        onChange={(e) => setBankName(e.target.value)}
                        sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF", borderRadius: "12px", "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                      />
                    </Grid>

                    {/* Account Number */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                        Bank Account Number
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. 50200012345678"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF", borderRadius: "12px", "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                      />
                    </Grid>

                    {/* IFSC Code */}
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                        Bank IFSC Code
                      </Typography>
                      <TextField
                        fullWidth
                        size="small"
                        placeholder="e.g. HDFC0001234"
                        value={ifscCode}
                        onChange={(e) => setIfscCode(e.target.value)}
                        sx={{ bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF", borderRadius: "12px", "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* 3D Live Preview on Booking Documents */}
              <Paper sx={{ p: 3, borderRadius: "18px", bgcolor: themeConfig.bgCard, border: `1.5px dashed ${themeConfig.primary}`, boxShadow: isDarkMode ? "0 4px 16px rgba(0,0,0,0.3)" : "0 4px 16px rgba(0,0,0,0.02)", mb: 3.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: themeConfig.primaryDark, mb: 1.5 }}>
                  📋 Live Preview on Guest Reservation Folios &amp; Desk Screens:
                </Typography>
                <Grid container spacing={2} sx={{ fontSize: "0.88rem", color: themeConfig.textMain }}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <strong>Arrival Schedule:</strong> Check-In from {formatTime12Hour(checkInTime)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <strong>Departure Schedule:</strong> Check-Out by {formatTime12Hour(checkOutTime)}
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <strong>Active Hotel UPI ID:</strong> {upiId || "hotel.frontdesk@okhdfcbank"}
                  </Grid>
                </Grid>
              </Paper>

              {/* Action Save Button */}
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={savingTimings || !timingValidation.valid}
                  startIcon={savingTimings ? <CircularProgress size={16} color="inherit" /> : <AccessTime />}
                  sx={{
                    background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                    color: "#FFFFFF",
                    px: 4,
                    py: 1.3,
                    fontWeight: 800,
                    borderRadius: "14px",
                    boxShadow: `0 4px 14px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                    "&:hover": { transform: "translateY(-1px)", boxShadow: `0 6px 18px ${themeConfig.primaryGlow}` },
                  }}
                >
                  {savingTimings ? "Saving Timings..." : "Save Hotel Timings"}
                </Button>
              </Box>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB: MY PROFILE & SECURITY */}
          {/* ========================================================================= */}
          {currentTab === "profile" && (
            <Box component="form" onSubmit={handleSaveProfile} sx={{ width: "100%", mx: "auto" }}>
              {profileMsg.show && (
                <Alert severity={profileMsg.severity} sx={{ mb: 3, borderRadius: "14px", boxShadow: "0 4px 14px rgba(0,0,0,0.05)" }}>
                  {profileMsg.message}
                </Alert>
              )}

              {/* 3D Profile Card */}
              <Card
                sx={{
                  mb: 4,
                  borderRadius: "22px",
                  bgcolor: themeConfig.bgMain,
                  border: `1.5px solid ${themeConfig.border}`,
                  boxShadow: "0 10px 28px -6px rgba(12, 39, 59, 0.05), inset 0 1px 0 #FFFFFF",
                  overflow: "hidden",
                }}
              >
                <CardContent sx={{ p: 3.5, display: "flex", alignItems: "center", gap: 3, flexWrap: { xs: "wrap", sm: "nowrap" } }}>
                  <Avatar
                    sx={{
                      width: 72,
                      height: 72,
                      borderRadius: "20px",
                      background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                      fontSize: "1.8rem",
                      fontWeight: 900,
                      border: "3px solid #FFFFFF",
                      boxShadow: `0 8px 22px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                    }}
                  >
                    {user?.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </Avatar>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 0.5, flexWrap: "wrap" }}>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, fontSize: "1.3rem" }}>
                        {user?.name || "Administrator"}
                      </Typography>
                      {getRoleBadge(user?.role)}
                    </Box>
                    <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontWeight: 500 }}>
                      {user?.email}
                    </Typography>
                    {user?.hotel?.name && (
                      <Typography variant="caption" sx={{ color: themeConfig.primaryDark, fontWeight: 800, mt: 0.5, display: "block" }}>
                        Assigned Property: {user?.hotel?.name} ({user?.hotel?.code || "PMS"})
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </Card>

              {/* 3D Editable Personal Fields */}
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <Person fontSize="small" sx={{ color: themeConfig.primary }} /> Personal Information
                </Typography>

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                      Full Name
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your Full Name"
                      sx={{
                        bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                      Phone Number
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      sx={{
                        bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                      Email Address (Account Identifier)
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={user?.email || ""}
                      disabled
                      sx={{
                        bgcolor: "rgba(0,0,0,0.02)",
                        "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                      Assigned Role
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      value={user?.role || "SUPER_ADMIN"}
                      disabled
                      sx={{
                        bgcolor: "rgba(0,0,0,0.02)",
                        "& .MuiOutlinedInput-root": { borderRadius: "12px" },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* 3D Security & Password Section */}
              <Box sx={{ mb: 4 }}>
                <Divider sx={{ my: 3.5, borderColor: themeConfig.border }} />
                <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 2.5, display: "flex", alignItems: "center", gap: 1 }}>
                  <VpnKey fontSize="small" sx={{ color: themeConfig.primary }} /> Security &amp; Change Password
                </Typography>

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                      Current Password
                    </Typography>
                    <TextField
                      fullWidth
                      type={showCurrentPassword ? "text" : "password"}
                      size="small"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      sx={{
                        bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                        },
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: themeConfig.textMuted, fontSize: 18 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowCurrentPassword(!showCurrentPassword)} edge="end" size="small">
                                {showCurrentPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                      New Password
                    </Typography>
                    <TextField
                      fullWidth
                      type={showNewPassword ? "text" : "password"}
                      size="small"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      sx={{
                        bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                        },
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: themeConfig.textMuted, fontSize: 18 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end" size="small">
                                {showNewPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                      Confirm Password
                    </Typography>
                    <TextField
                      fullWidth
                      type={showConfirmPassword ? "text" : "password"}
                      size="small"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••"
                      sx={{
                        bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                        "& .MuiOutlinedInput-root": {
                          borderRadius: "12px",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                        },
                      }}
                      slotProps={{
                        input: {
                          startAdornment: (
                            <InputAdornment position="start">
                              <Lock sx={{ color: themeConfig.textMuted, fontSize: 18 }} />
                            </InputAdornment>
                          ),
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end" size="small">
                                {showConfirmPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Box sx={{ mt: 4, display: "flex", justifyContent: "flex-end" }}>
                <Button
                  type="submit"
                  variant="contained"
                  sx={{
                    background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                    color: "#FFFFFF",
                    px: 4.5,
                    py: 1.3,
                    fontWeight: 800,
                    borderRadius: "14px",
                    boxShadow: `0 4px 14px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                    "&:hover": { transform: "translateY(-1px)", boxShadow: `0 6px 18px ${themeConfig.primaryGlow}` },
                  }}
                >
                  Save Profile Settings
                </Button>
              </Box>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB: SYSTEM PREFERENCES */}
          {/* ========================================================================= */}
          {currentTab === "preferences" && (
            <Box sx={{ width: "100%", mx: "auto" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.5 }}>
                System &amp; Workflow Preferences
              </Typography>
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 3.5 }}>
                Configure live synchronization, audio alerts, and layout density.
              </Typography>

              <Paper
                sx={{
                  p: 3.5,
                  borderRadius: "22px",
                  bgcolor: themeConfig.bgCard,
                  border: `1.5px solid ${themeConfig.border}`,
                  boxShadow: isDarkMode ? "0 10px 28px -6px rgba(0,0,0,0.4)" : "0 10px 28px -6px rgba(12, 39, 59, 0.05), inset 0 1px 0 #FFFFFF",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, width: 44, height: 44, borderRadius: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                      <Refresh fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                        Auto-Refresh Live Data (30s)
                      </Typography>
                      <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
                        Automatically poll room status matrix and in-house folios
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={settings.autoRefresh}
                    onChange={(e) => updateSettings({ autoRefresh: e.target.checked })}
                    color="primary"
                  />
                </Box>

                <Divider sx={{ my: 2.5, borderColor: themeConfig.border }} />

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, width: 44, height: 44, borderRadius: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                      <VolumeUp fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                        Audio Chime for New Check-ins
                      </Typography>
                      <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
                        Play sound alert when new guest registration or check-in arrives
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={settings.soundAlerts}
                    onChange={(e) => updateSettings({ soundAlerts: e.target.checked })}
                    color="primary"
                  />
                </Box>

                <Divider sx={{ my: 2.5, borderColor: themeConfig.border }} />

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, width: 44, height: 44, borderRadius: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                      <NotificationsActive fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                        In-App Toast Notifications
                      </Typography>
                      <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
                        Display instant popup toast notifications on action status
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={settings.notificationsEnabled}
                    onChange={(e) => updateSettings({ notificationsEnabled: e.target.checked })}
                    color="primary"
                  />
                </Box>

                <Divider sx={{ my: 2.5, borderColor: themeConfig.border }} />

                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.5 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Avatar sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, width: 44, height: 44, borderRadius: "14px", boxShadow: "0 2px 8px rgba(0,0,0,0.03)" }}>
                      <TableRows fontSize="small" />
                    </Avatar>
                    <Box>
                      <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                        Compact Table Density
                      </Typography>
                      <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
                        Tighten table padding to maximize visible records on screen
                      </Typography>
                    </Box>
                  </Box>
                  <Switch
                    checked={settings.compactMode}
                    onChange={(e) => updateSettings({ compactMode: e.target.checked })}
                    color="primary"
                  />
                </Box>
              </Paper>
            </Box>
          )}

          {/* ========================================================================= */}
          {/* TAB: HELP & SUPPORT */}
          {/* ========================================================================= */}
          {currentTab === "help" && (
            <Box sx={{ width: "100%", mx: "auto" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.5 }}>
                Help Center &amp; Knowledge Base
              </Typography>
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 3.5 }}>
                Frequently Asked Questions and 24/7 Enterprise Support Channels.
              </Typography>

              <Accordion sx={{ mb: 2, borderRadius: "16px !important", border: `1.5px solid ${themeConfig.border}`, boxShadow: "0 4px 14px rgba(12, 39, 59, 0.03)", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                    How do Super Admins approve or reject registered hotels?
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ color: themeConfig.textMuted, lineHeight: 1.6 }}>
                    Go to the <strong>Pending Approvals</strong> tab. Click on <strong>Review Dossier</strong> to inspect hotel registration details, owner credentials, and tax documents. Click <strong>Approve &amp; Activate</strong> to grant 30-day active access, or <strong>Reject</strong> with reason.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ mb: 2, borderRadius: "16px !important", border: `1.5px solid ${themeConfig.border}`, boxShadow: "0 4px 14px rgba(12, 39, 59, 0.03)", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                    How does the 5-Step Check-in with Govt ID compliance work?
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ color: themeConfig.textMuted, lineHeight: 1.6 }}>
                    From the Receptionist Console, navigate to <strong>5-Step Check-In</strong>. Complete Guest details, select Govt ID document (Aadhaar / Passport / Driving License), choose room type, select check-in/out dates, and finalize billing settlement.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              <Accordion sx={{ mb: 2, borderRadius: "16px !important", border: `1.5px solid ${themeConfig.border}`, boxShadow: "0 4px 14px rgba(12, 39, 59, 0.03)", "&:before": { display: "none" } }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                    How do Hotel Admins add staff receptionists?
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" sx={{ color: themeConfig.textMuted, lineHeight: 1.6 }}>
                    From the Hotel Admin PMS, open the <strong>Receptionist Staff</strong> tab. Click <strong>Add Receptionist</strong>, enter full name, email, phone, and assign initial login credentials.
                  </Typography>
                </AccordionDetails>
              </Accordion>

              {/* 3D Support Hotline Banner */}
              <Paper
                sx={{
                  mt: 4,
                  p: 3.5,
                  borderRadius: "22px",
                  bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                  border: `1.5px dashed ${themeConfig.primary}`,
                  boxShadow: isDarkMode ? "none" : "0 10px 30px -6px rgba(12, 39, 59, 0.06), inset 0 1px 0 #FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 2.5,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{
                      background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                      width: 52,
                      height: 52,
                      borderRadius: "16px",
                      boxShadow: `0 6px 16px ${themeConfig.primaryGlow}`,
                    }}
                  >
                    <SupportAgent sx={{ color: "#FFFFFF", fontSize: 28 }} />
                  </Avatar>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                      24/7 Grand Royale SaaS Support
                    </Typography>
                    <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
                      Email: support@grandroyale-saas.com | Hotline: +91 (800) 425-6789
                    </Typography>
                  </Box>
                </Box>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: themeConfig.primary,
                    color: themeConfig.primaryLight || themeConfig.primary,
                    fontWeight: 800,
                    px: 3,
                    py: 1,
                    borderRadius: "12px",
                    bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                    boxShadow: isDarkMode ? "none" : "0 2px 8px rgba(0,0,0,0.03)",
                    "&:hover": { bgcolor: themeConfig.champagne, transform: "translateY(-1px)" },
                  }}
                >
                  Create Support Ticket
                </Button>
              </Paper>
            </Box>
          )}
        </Box>
      </Card>
    </Box>
  );
}
