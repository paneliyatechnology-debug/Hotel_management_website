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
  Avatar,
  Alert,
  MenuItem,
  FormControl,
  Select,
  CircularProgress,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  AccessTime,
  AccountBalance,
  Business,
  Description,
  Lock,
  ReceiptLong,
  Schedule,
  Visibility,
  VisibilityOff,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { toast } from "@/shared/utils/toast";
import {
  formatTime12Hour,
  formatTime24Hour,
  getTurnaroundWindow,
  validateHotelTimings,
} from "@/shared/utils/timeUtils";

const TIMEZONE_OPTIONS = [
  { value: "Asia/Kolkata", label: "Asia/Kolkata (IST, UTC+05:30)" },
  { value: "Asia/Dubai", label: "Asia/Dubai (GST, UTC+04:00)" },
  { value: "Asia/Singapore", label: "Asia/Singapore (SGT, UTC+08:00)" },
  { value: "Asia/Bangkok", label: "Asia/Bangkok (ICT, UTC+07:00)" },
  { value: "Europe/London", label: "Europe/London (GMT/BST)" },
  { value: "Europe/Paris", label: "Europe/Paris (CET/CEST)" },
  { value: "America/New_York", label: "America/New_York (EST/EDT)" },
  { value: "America/Los_Angeles", label: "America/Los_Angeles (PST/PDT)" },
  { value: "Australia/Sydney", label: "Australia/Sydney (AEST/AEDT)" },
];

const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/i;
const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]$/i;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/i;
const UPI_REGEX = /^[\w.\-]{2,}@[\w.\-]{2,}$/;
const MAX_LOGO_BYTES = 10 * 1024 * 1024;

const EMPTY_HOTEL_FORM = {
  name: "",
  hotel_type: "",
  website: "",
  address: "",
  city: "",
  state: "",
  country: "",
  pincode: "",
  check_in_time: "14:00",
  check_out_time: "12:00",
  timezone: "Asia/Kolkata",
  currency: "INR",
  late_checkout_grace_minutes: "10",
  gst_number: "",
  tax_percentage: "18",
  pan_number: "",
  bank_name: "",
  bank_account_holder: "",
  bank_account_number: "",
  bank_ifsc_code: "",
  bank_branch: "",
  upi_id: "",
  amenities: "",
  policies: "",
};

// The API answers in snake_case and camelCase. Read whichever is present.
const pick = (obj, snakeKey) => {
  if (!obj) return undefined;
  const camelKey = snakeKey.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
  return obj[snakeKey] ?? obj[camelKey];
};

const asText = (value, fallback = "") => (value === undefined || value === null ? fallback : String(value));

const listToLines = (value) => {
  let list = value;
  if (typeof value === "string") {
    try {
      list = JSON.parse(value);
    } catch {
      list = value.split(",");
    }
  }
  return Array.isArray(list) ? list.map((item) => String(item).trim()).filter(Boolean).join("\n") : "";
};

const linesToList = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const hotelToForm = (hotel) => {
  const settings = hotel?.settings || {};
  return {
    name: asText(pick(hotel, "name")),
    hotel_type: asText(pick(hotel, "hotel_type")),
    website: asText(pick(hotel, "website")),
    address: asText(pick(hotel, "address")),
    city: asText(pick(hotel, "city")),
    state: asText(pick(hotel, "state")),
    country: asText(pick(hotel, "country")),
    pincode: asText(pick(hotel, "pincode")),
    check_in_time: formatTime24Hour(asText(pick(settings, "check_in_time"), "14:00")),
    check_out_time: formatTime24Hour(asText(pick(settings, "check_out_time"), "12:00")),
    timezone: asText(pick(settings, "timezone"), "Asia/Kolkata"),
    currency: asText(pick(settings, "currency"), "INR"),
    late_checkout_grace_minutes: asText(pick(settings, "late_checkout_grace_minutes"), "10"),
    gst_number: asText(pick(hotel, "gst_number")),
    tax_percentage: asText(pick(settings, "tax_percentage"), "18"),
    pan_number: asText(pick(hotel, "pan_number")),
    bank_name: asText(pick(hotel, "bank_name")),
    bank_account_holder: asText(pick(hotel, "bank_account_holder")),
    bank_account_number: asText(pick(hotel, "bank_account_number")),
    bank_ifsc_code: asText(pick(hotel, "bank_ifsc_code")),
    bank_branch: asText(pick(hotel, "bank_branch")),
    upi_id: asText(pick(settings, "upi_id")),
    amenities: listToLines(settings.amenities),
    policies: listToLines(settings.policies),
  };
};

export default function SettingsView({ user, onUpdateHotelSettings }) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [activeSubTab, setActiveSubTab] = useState(0);

  const isHotelAdmin = user?.role === "HOTEL_ADMIN";
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  // Hotel settings (hotel admin)
  const [hotelForm, setHotelForm] = useState(EMPTY_HOTEL_FORM);
  const [owner, setOwner] = useState({ name: "", email: "", phone: "" });
  const [logoUrl, setLogoUrl] = useState("");
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState("");
  const [loadingHotel, setLoadingHotel] = useState(isHotelAdmin);
  const [savingHotel, setSavingHotel] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [hotelMsg, setHotelMsg] = useState({ show: false, message: "", severity: "success" });

  // Free trial (super admin)
  const [freeTrialValue, setFreeTrialValue] = useState(30);
  const [freeTrialUnit, setFreeTrialUnit] = useState("days");
  const [savingTrial, setSavingTrial] = useState(false);
  const [trialMsg, setTrialMsg] = useState({ show: false, message: "", severity: "success" });

  const applyHotelProfile = (profile) => {
    const hotel = profile?.hotel;
    if (!hotel) return;
    const ownerInfo = hotel.owner || {};
    setHotelForm(hotelToForm(hotel));
    setOwner({
      name: asText(pick(ownerInfo, "name"), profile?.name || ""),
      email: asText(pick(ownerInfo, "email"), profile?.email || ""),
      phone: asText(pick(ownerInfo, "phone"), profile?.phone || ""),
    });
    setLogoUrl(asText(hotel.logo || hotel.logoUrl || hotel.logo_url));
  };

  useEffect(() => {
    if (!isHotelAdmin) return undefined;
    let cancelled = false;
    apiRequest(API_ENDPOINTS.AUTH.ME)
      .then((res) => {
        if (!cancelled) applyHotelProfile(res?.data || res);
      })
      .catch(() => {
        if (!cancelled) setHotelMsg({ show: true, message: "Could not load hotel details.", severity: "error" });
      })
      .finally(() => {
        if (!cancelled) setLoadingHotel(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isHotelAdmin]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    apiRequest(API_ENDPOINTS.SETTINGS?.PUBLIC || "/api/v1/settings")
      .then((res) => {
        if (res?.settings) {
          setFreeTrialValue(res.settings.freeTrialValue);
          setFreeTrialUnit(res.settings.freeTrialUnit);
        }
      })
      .catch(() => {});
  }, [isSuperAdmin]);

  const setHotel = (key, value) => setHotelForm((prev) => ({ ...prev, [key]: value }));

  const handleLogoChange = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image file.");
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Logo must be 10 MB or smaller.");
      return;
    }
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoPreview(URL.createObjectURL(file));
    setLogoFile(file);
  };

  const handleSaveTrial = async (e) => {
    e.preventDefault();
    setSavingTrial(true);
    setTrialMsg({ show: false, message: "", severity: "success" });

    try {
      const res = await apiRequest(API_ENDPOINTS.SETTINGS?.UPDATE || "/api/v1/settings", {
        method: "PUT",
        body: JSON.stringify({ freeTrialValue: Number(freeTrialValue), freeTrialUnit }),
      });

      if (res?.success) {
        toast.success("Free trial settings updated successfully!");
        setTrialMsg({ show: true, message: "Free trial settings updated successfully!", severity: "success" });
      } else {
        const message = res?.message || "Failed to update free trial settings.";
        toast.error(message);
        setTrialMsg({ show: true, message, severity: "error" });
      }
    } catch (err) {
      const message = err.message || "An error occurred while updating settings.";
      toast.error(message);
      setTrialMsg({ show: true, message, severity: "error" });
    } finally {
      setSavingTrial(false);
    }
  };

  const validateHotelForm = () => {
    const f = hotelForm;
    if (!f.name.trim()) return "Hotel name is required.";
    if (!f.address.trim()) return "Address is required.";
    if (!f.city.trim()) return "City is required.";
    if (!f.state.trim()) return "State is required.";
    if (!/^\d{6}$/.test(f.pincode.trim())) return "Enter a valid 6-digit pincode.";
    if (f.website.trim()) {
      try {
        new URL(/^https?:\/\//i.test(f.website.trim()) ? f.website.trim() : `https://${f.website.trim()}`);
      } catch {
        return "Enter a valid website URL.";
      }
    }
    const timings = validateHotelTimings(f.check_in_time, f.check_out_time);
    if (!timings.valid) return timings.error;
    const currency = f.currency.trim();
    if (currency.length < 3 || currency.length > 10) return "Currency must be 3 to 10 characters, such as INR.";
    const grace = Number(f.late_checkout_grace_minutes);
    if (!Number.isInteger(grace) || grace < 0 || grace > 1440) return "Late checkout grace must be 0 to 1440 minutes.";
    const tax = Number(f.tax_percentage);
    if (Number.isNaN(tax) || tax < 0 || tax > 100) return "GST percentage must be between 0 and 100.";
    if (f.gst_number.trim() && !GSTIN_REGEX.test(f.gst_number.trim())) return "Enter a valid 15-character GST number.";
    if (f.pan_number.trim() && !PAN_REGEX.test(f.pan_number.trim())) return "Enter a valid 10-character PAN number.";
    if (f.bank_account_number.trim() && !/^\d{9,18}$/.test(f.bank_account_number.trim())) return "Account number must be 9 to 18 digits.";
    if (f.bank_ifsc_code.trim() && !IFSC_REGEX.test(f.bank_ifsc_code.trim())) return "Enter a valid 11-character IFSC code.";
    if (f.upi_id.trim() && !UPI_REGEX.test(f.upi_id.trim())) return "Enter a valid UPI ID, such as name@bank.";
    return "";
  };

  const handleSaveHotel = async (e) => {
    e.preventDefault();

    const problem = validateHotelForm();
    if (problem) {
      setHotelMsg({ show: true, message: problem, severity: "error" });
      return;
    }

    const f = hotelForm;
    const payload = {
      name: f.name.trim(),
      hotel_type: f.hotel_type.trim(),
      website: f.website.trim(),
      address: f.address.trim(),
      city: f.city.trim(),
      state: f.state.trim(),
      country: f.country.trim(),
      pincode: f.pincode.trim(),
      check_in_time: formatTime24Hour(f.check_in_time),
      check_out_time: formatTime24Hour(f.check_out_time),
      timezone: f.timezone || "Asia/Kolkata",
      currency: f.currency.trim().toUpperCase(),
      late_checkout_grace_minutes: Number(f.late_checkout_grace_minutes),
      gst_enabled: Boolean(f.gst_number.trim()),
      gst_number: f.gst_number.trim().toUpperCase(),
      tax_percentage: Number(f.tax_percentage),
      pan_number: f.pan_number.trim().toUpperCase(),
      bank_name: f.bank_name.trim(),
      bank_account_holder: f.bank_account_holder.trim(),
      bank_account_number: f.bank_account_number.trim(),
      bank_ifsc_code: f.bank_ifsc_code.trim().toUpperCase(),
      bank_branch: f.bank_branch.trim(),
      upi_id: f.upi_id.trim(),
      amenities: linesToList(f.amenities),
      policies: linesToList(f.policies),
    };

    setSavingHotel(true);
    try {
      let body = payload;
      if (logoFile) {
        body = new FormData();
        Object.entries(payload).forEach(([key, value]) => {
          body.append(key, Array.isArray(value) ? JSON.stringify(value) : String(value));
        });
        body.append("logo", logoFile);
      }

      await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.UPDATE_HOTEL, { method: "PUT", body });

      // Refresh from the server so the logo URL and saved values are exact
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      setLogoFile(null);
      setLogoPreview("");
      try {
        const res = await apiRequest(API_ENDPOINTS.AUTH.ME);
        applyHotelProfile(res?.data || res);
      } catch {}

      const settings = {
        hotelName: payload.name,
        checkInTime: payload.check_in_time,
        checkOutTime: payload.check_out_time,
        timezone: payload.timezone,
        currency: payload.currency,
        lateCheckoutGraceMinutes: payload.late_checkout_grace_minutes,
        gstEnabled: payload.gst_enabled,
        taxPercentage: payload.tax_percentage,
        upiId: payload.upi_id,
        bankDetails: {
          bank_name: payload.bank_name,
          bank_account_holder: payload.bank_account_holder,
          bank_account_number: payload.bank_account_number,
          bank_ifsc_code: payload.bank_ifsc_code,
          bank_branch: payload.bank_branch,
        },
      };
      if (onUpdateHotelSettings) onUpdateHotelSettings(settings);

      toast.success("Hotel settings saved successfully!");
      setHotelMsg({ show: true, message: "Hotel settings saved successfully.", severity: "success" });
    } catch (err) {
      setHotelMsg({ show: true, message: err.message || "Failed to save hotel settings.", severity: "error" });
    } finally {
      setSavingHotel(false);
      setTimeout(() => setHotelMsg((prev) => ({ ...prev, show: false })), 5000);
    }
  };

  // One settings area per role (the theme switch lives in the sidebar)
  const availableTabs = [
    ...(isHotelAdmin ? [{ id: "hotel", label: "Hotel settings" }] : []),
    ...(isSuperAdmin ? [{ id: "platform", label: "Platform settings" }] : []),
  ];
  const currentTab = availableTabs[activeSubTab]?.id || "";

  const turnaroundWindow = getTurnaroundWindow(hotelForm.check_in_time, hotelForm.check_out_time);
  const timingValidation = validateHotelTimings(hotelForm.check_in_time, hotelForm.check_out_time);

  // Shared styles, matching the other pages
  const cardSx = {
    borderRadius: "14px",
    border: `1px solid ${themeConfig.border}`,
    bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
    boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(15, 23, 42, 0.04)",
  };
  const cardContentSx = { p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } };
  const inputSx = {
    "& .MuiOutlinedInput-root": {
      borderRadius: "10px",
      bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#FFFFFF",
    },
  };
  const primaryButtonSx = {
    height: 40,
    px: 3,
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 700,
    boxShadow: "none",
    bgcolor: themeConfig.primary,
    "&:hover": { bgcolor: themeConfig.primaryDark, boxShadow: "none" },
  };

  const fieldLabel = (text, required = false) => (
    <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.8rem", mb: 0.6 }}>
      {text}
      {required && <span style={{ color: themeConfig.danger }}> *</span>}
    </Typography>
  );

  const sectionIcons = {
    "Hotel details": Business,
    "Amenities & policies": Description,
    "Operating timings": AccessTime,
    "Tax & GST invoicing": ReceiptLong,
    "Bank & payment details": AccountBalance,
    "Free trial period": Schedule,
  };

  const sectionHeading = (title, description) => {
    const Icon = sectionIcons[title];
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pb: 1.75, mb: 2.5, borderBottom: `1px solid ${themeConfig.border}` }}>
        {Icon && (
          <Box
            sx={{
              width: 36,
              height: 36,
              flexShrink: 0,
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: themeConfig.primary,
              bgcolor: themeConfig.champagne || "#EAF6F3",
            }}
          >
            <Icon sx={{ fontSize: 20 }} />
          </Box>
        )}
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "1rem", lineHeight: 1.3 }}>{title}</Typography>
          {description && (
            <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.8rem", mt: 0.25 }}>{description}</Typography>
          )}
        </Box>
      </Box>
    );
  };
  // Text input bound to the hotel form
  const hotelField = (key, label, { required = false, size = 6, transform, ...inputProps } = {}) => (
    <Grid size={{ xs: 12, sm: size }}>
      {fieldLabel(label, required)}
      <TextField
        fullWidth
        size="small"
        value={hotelForm[key]}
        onChange={(e) => setHotel(key, transform ? transform(e.target.value) : e.target.value)}
        sx={inputSx}
        {...inputProps}
      />
    </Grid>
  );

  // Read-only value (owner details cannot be changed here)
  const lockedField = (label, value, size = 6) => (
    <Grid size={{ xs: 12, sm: size }}>
      {fieldLabel(label)}
      <TextField
        fullWidth
        size="small"
        value={value || ""}
        disabled
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end">
                <Lock sx={{ fontSize: 16, color: themeConfig.textMuted }} />
              </InputAdornment>
            ),
          },
        }}
        sx={inputSx}
      />
    </Grid>
  );

  const renderCard = (title, description, children) => (
    <Card sx={cardSx}>
      <CardContent sx={cardContentSx}>
        {sectionHeading(title, description)}
        {children}
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ width: "100%", minWidth: 0, px: { xs: 1.5, sm: 2.5, md: 3 }, py: { xs: 1, sm: 1.5 }, pb: { xs: 10, sm: 4 } }}>
      {availableTabs.length > 1 && (
        <Tabs
          value={activeSubTab >= availableTabs.length ? 0 : activeSubTab}
          onChange={(e, v) => setActiveSubTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{
            minHeight: 44,
            mb: 2.5,
            borderBottom: `1px solid ${themeConfig.border}`,
            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 700,
              fontSize: "0.9rem",
              minHeight: 44,
              px: 2,
              color: themeConfig.textMuted,
              "&.Mui-selected": { color: themeConfig.primaryDark },
            },
            "& .MuiTabs-indicator": { height: 2, borderRadius: "2px", bgcolor: themeConfig.primary },
          }}
        >
          {availableTabs.map((tab) => (
            <Tab key={tab.id} label={tab.label} />
          ))}
        </Tabs>
      )}

      {/* Hotel settings (hotel admin) */}
      {currentTab === "hotel" && isHotelAdmin && (
        loadingHotel ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
            <CircularProgress size={28} sx={{ color: themeConfig.primary }} />
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSaveHotel} noValidate>
            {hotelMsg.show && (
              <Alert severity={hotelMsg.severity} sx={{ mb: 2.5, borderRadius: "10px" }}>
                {hotelMsg.message}
              </Alert>
            )}

            <Grid container spacing={2.5} alignItems="flex-start">
              {/* Left column: identity and guest information */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {renderCard(
                    "Hotel details",
                    "Basic information about your property. Owner details are locked.",
                    <>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 2.5 }}>
                        <Avatar
                          variant="rounded"
                          src={logoPreview || logoUrl || undefined}
                          sx={{ width: 64, height: 64, borderRadius: "14px", color: themeConfig.primary, bgcolor: themeConfig.champagne || "#EAF6F3" }}
                        >
                          <Business sx={{ fontSize: 30 }} />
                        </Avatar>
                        <Box sx={{ minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.9rem" }}>Hotel logo</Typography>
                          <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.78rem", mb: 0.75 }}>
                            {logoFile ? logoFile.name : "PNG, JPG or WebP, up to 10 MB"}
                          </Typography>
                          <Button
                            component="label"
                            variant="outlined"
                            size="small"
                            sx={{
                              height: 32,
                              borderRadius: "8px",
                              textTransform: "none",
                              fontWeight: 700,
                              color: themeConfig.primaryDark,
                              borderColor: themeConfig.border,
                              "&:hover": { borderColor: themeConfig.primary, bgcolor: "transparent" },
                            }}
                          >
                            Change logo
                            <input type="file" hidden accept="image/*" onChange={handleLogoChange} />
                          </Button>
                        </Box>
                      </Box>

                      <Grid container spacing={2}>
                        {hotelField("name", "Hotel name", { required: true, size: 12, placeholder: "Hotel name" })}
                        {lockedField("Owner name", owner.name)}
                        {lockedField("Mobile number", owner.phone)}
                        {lockedField("Hotel email", owner.email, 12)}
                        {hotelField("hotel_type", "Hotel type", { placeholder: "Boutique hotel, resort, lodge" })}
                        {hotelField("website", "Website", { placeholder: "https://yourhotel.com" })}
                        {hotelField("address", "Address", { required: true, size: 12, placeholder: "Street address" })}
                        {hotelField("city", "City", { required: true, placeholder: "City" })}
                        {hotelField("state", "State", { required: true, placeholder: "State" })}
                        {hotelField("country", "Country", { placeholder: "Country" })}
                        {hotelField("pincode", "Pincode", {
                          required: true,
                          placeholder: "6-digit pincode",
                          transform: (v) => v.replace(/\D/g, "").slice(0, 6),
                        })}
                      </Grid>
                    </>
                  )}

                  {renderCard(
                    "Amenities & policies",
                    "Shown to guests. Add one item per line.",
                    <Grid container spacing={2}>
                      {hotelField("amenities", "Amenities", {
                        size: 12,
                        multiline: true,
                        minRows: 4,
                        placeholder: "Free WiFi\nAir conditioning\n24/7 room service",
                      })}
                      {hotelField("policies", "Policies", {
                        size: 12,
                        multiline: true,
                        minRows: 4,
                        placeholder: "Valid government ID required at check-in\nNo smoking in rooms",
                      })}
                    </Grid>
                  )}
                </Box>
              </Grid>

              {/* Right column: operations and billing */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                  {renderCard(
                    "Operating timings",
                    turnaroundWindow
                      ? `Rooms get ${turnaroundWindow} for housekeeping between a check-out and the next check-in.`
                      : "Standard timings applied to every booking.",
                    <>
                      {!timingValidation.valid && (
                        <Alert severity="warning" icon={false} sx={{ mb: 2, borderRadius: "10px" }}>
                          {timingValidation.error}
                        </Alert>
                      )}
                      <Grid container spacing={2}>
                        {hotelField("check_in_time", "Check-in time", {
                          required: true,
                          type: "time",
                          helperText: formatTime12Hour(hotelForm.check_in_time),
                        })}
                        {hotelField("check_out_time", "Check-out time", {
                          required: true,
                          type: "time",
                          helperText: formatTime12Hour(hotelForm.check_out_time),
                        })}
                        <Grid size={{ xs: 12 }}>
                          {fieldLabel("Timezone")}
                          <FormControl fullWidth size="small">
                            <Select value={hotelForm.timezone} onChange={(e) => setHotel("timezone", e.target.value)} sx={{ borderRadius: "10px" }}>
                              {TIMEZONE_OPTIONS.map((opt) => (
                                <MenuItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        </Grid>
                        {hotelField("currency", "Currency", {
                          placeholder: "INR",
                          transform: (v) => v.toUpperCase().slice(0, 10),
                        })}
                        {hotelField("late_checkout_grace_minutes", "Late checkout grace (minutes)", {
                          type: "number",
                          slotProps: { htmlInput: { min: 0, max: 1440 } },
                        })}
                      </Grid>
                    </>
                  )}

                  {renderCard(
                    "Tax & GST invoicing",
                    "Shown on bills and invoices. GST is added to guest bills once a GST number is saved.",
                    <>
                      <Grid container spacing={2}>
                        {hotelField("gst_number", "GST number", {
                          size: 12,
                          placeholder: "15-character GSTIN",
                          transform: (v) => v.toUpperCase().replace(/\s/g, "").slice(0, 15),
                        })}
                        {hotelField("tax_percentage", "GST percentage", {
                          type: "number",
                          slotProps: { htmlInput: { min: 0, max: 100, step: "any" } },
                        })}
                        {hotelField("pan_number", "PAN number", {
                          placeholder: "10-character PAN",
                          transform: (v) => v.toUpperCase().replace(/\s/g, "").slice(0, 10),
                        })}
                      </Grid>
                    </>
                  )}

                  {renderCard(
                    "Bank & payment details",
                    "Printed on bills and used for the UPI QR code at check-in.",
                    <Grid container spacing={2}>
                      {hotelField("bank_name", "Bank name", { placeholder: "Bank name" })}
                      {hotelField("bank_account_holder", "Account holder name", { placeholder: "Name on the bank account" })}
                      <Grid size={{ xs: 12, sm: 6 }}>
                        {fieldLabel("Account number")}
                        <TextField
                          fullWidth
                          size="small"
                          placeholder="9 to 18 digits"
                          value={hotelForm.bank_account_number}
                          type={showAccount ? "text" : "password"}
                          onChange={(e) => setHotel("bank_account_number", e.target.value.replace(/\D/g, "").slice(0, 18))}
                          slotProps={{
                            input: {
                              endAdornment: (
                                <InputAdornment position="end">
                                  <IconButton size="small" onClick={() => setShowAccount((v) => !v)} edge="end" aria-label="Show or hide account number">
                                    {showAccount ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                                  </IconButton>
                                </InputAdornment>
                              ),
                            },
                          }}
                          sx={inputSx}
                        />
                      </Grid>
                      {hotelField("bank_ifsc_code", "IFSC code", {
                        placeholder: "11-character IFSC",
                        transform: (v) => v.toUpperCase().replace(/\s/g, "").slice(0, 11),
                      })}
                      {hotelField("bank_branch", "Branch", { placeholder: "Branch name" })}
                      {hotelField("upi_id", "UPI ID", {
                        placeholder: "name@bank",
                        transform: (v) => v.trim(),
                      })}
                    </Grid>
                  )}
                </Box>
              </Grid>
            </Grid>

            <Box
              sx={{
                position: "sticky",
                bottom: 0,
                zIndex: 5,
                display: "flex",
                justifyContent: { xs: "stretch", sm: "flex-end" },
                mt: 2.5,
                py: 1.5,
                bgcolor: themeConfig.bgMain || "background.default",
                borderTop: `1px solid ${themeConfig.border}`,
              }}
            >
              <Button
                type="submit"
                variant="contained"
                disabled={savingHotel || !timingValidation.valid}
                sx={{ ...primaryButtonSx, width: { xs: "100%", sm: "auto" } }}
              >
                {savingHotel ? <CircularProgress size={20} color="inherit" /> : "Save hotel settings"}
              </Button>
            </Box>
          </Box>
        )
      )}

      {/* Platform settings (super admin) */}
      {currentTab === "platform" && isSuperAdmin && (
        renderCard(
          "Free trial period",
          "Default trial length given to every newly registered hotel.",
          <>
            {trialMsg.show && (
              <Alert severity={trialMsg.severity} sx={{ mb: 2.5, borderRadius: "10px" }}>
                {trialMsg.message}
              </Alert>
            )}
            <Box component="form" onSubmit={handleSaveTrial}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {fieldLabel("Duration", true)}
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    value={freeTrialValue}
                    onChange={(e) => setFreeTrialValue(e.target.value)}
                    required
                    sx={inputSx}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  {fieldLabel("Unit", true)}
                  <FormControl fullWidth size="small">
                    <Select value={freeTrialUnit} onChange={(e) => setFreeTrialUnit(e.target.value)} sx={{ borderRadius: "10px" }}>
                      <MenuItem value="hours">Hours</MenuItem>
                      <MenuItem value="days">Days</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2.5 }}>
                <Button type="submit" variant="contained" disabled={savingTrial} sx={primaryButtonSx}>
                  {savingTrial ? <CircularProgress size={20} color="inherit" /> : "Save changes"}
                </Button>
              </Box>
            </Box>
          </>
        )
      )}
    </Box>
  );
}
