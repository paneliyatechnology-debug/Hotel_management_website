"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Avatar,
  LinearProgress,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
  Divider,
} from "@mui/material";
import {
  WorkspacePremium,
  AutoAwesome,
  Check,
  Phone,
  WhatsApp,
  Email,
  SupportAgent,
  CheckCircle,
  Close,
  Send,
  Star,
  Hotel,
  Apartment,
  CorporateFare,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { useLiveCountdown } from "@/shared/utils/countdown";

export default function SubscriptionPage({ user, subscription: initialSub, onRefresh }) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [ticketSent, setTicketSent] = useState(false);
  const [helpForm, setHelpForm] = useState({
    name: user?.name || "",
    phone: user?.phone || user?.hotel?.ownerPhone || "",
    message: "Hello Super Admin, I want to upgrade/renew our hotel subscription plan.",
  });

  const hotel = user?.hotel || {};
  const sub = initialSub || hotel.subscription || {};
  const supportContact = hotel.supportContact || {
    phone: "+91 98765 43210",
    email: "support@grandroyale-saas.com",
    whatsapp: "+919876543210",
  };

  // ⏱️ Live Ticking Countdown Hook (Updates every 1 second)
  const countdown = useLiveCountdown(sub.trialEndDate);

  // Fetch real subscription plans from database
  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await apiRequest(API_ENDPOINTS.SUBSCRIPTION_PLANS.PUBLIC);
      if (res?.data?.all) {
        setPlans(res.data.all);
      } else if (Array.isArray(res?.data)) {
        setPlans(res.data);
      }
    } catch (err) {
      console.warn("Could not load real plans from API:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  // Real-time dynamic trial calculations (strictly from Admin configured trial dates)
  const now = new Date();
  const trialEnd = sub.trialEndDate ? new Date(sub.trialEndDate) : new Date(now.getTime() + 5 * 86400000);
  const trialStart = sub.trialStartDate ? new Date(sub.trialStartDate) : new Date(trialEnd.getTime() - 5 * 86400000);

  // Total trial duration configured in system
  const totalTrialMs = Math.max(86400000, trialEnd.getTime() - trialStart.getTime());
  const totalDays = Number(sub.totalDays) > 0 ? Number(sub.totalDays) : Math.max(1, Math.round(totalTrialMs / (1000 * 60 * 60 * 24)));

  // Current elapsed day from trialStartDate to now (1-indexed)
  const diffFromStartMs = Math.max(0, now.getTime() - trialStart.getTime());
  const rawElapsed = Math.floor(diffFromStartMs / (1000 * 60 * 60 * 24)) + 1;
  const isExpired = countdown.isExpired || sub.isExpired || sub.status === "EXPIRED" || (trialEnd.getTime() <= now.getTime());
  const elapsedDays = isExpired ? totalDays : Math.max(1, Math.min(totalDays - (countdown.days > 0 ? 0 : 0), rawElapsed));

  // Time-based proportional percentage (accurate ~80-90% when 1 day remaining, 100% only on expiry)
  const rawPercentage = Math.round((diffFromStartMs / totalTrialMs) * 100);
  const elapsedPercentage = isExpired ? 100 : Math.min(95, Math.max(1, rawPercentage));

  const trialEndFormatted = trialEnd.toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handleOpenUpgrade = (plan) => {
    setSelectedPlan(plan);
    const planTitle = typeof plan === "object" ? `${plan.name} (${plan.billingCycle || billingCycle}) - ₹${plan.price?.toLocaleString("en-IN")}` : plan;
    setHelpForm({
      name: user?.name || "",
      phone: user?.phone || user?.hotel?.ownerPhone || "",
      message: `Hello Super Admin, I want to upgrade to the '${planTitle}' plan for hotel '${hotel.name || "Our Hotel"}'. Please assist with invoice and instant activation.`,
    });
    setHelpDialogOpen(true);
  };

  const handleSendTicket = (e) => {
    e.preventDefault();
    setTicketSent(true);
    setTimeout(() => {
      setTicketSent(false);
      setHelpDialogOpen(false);
    }, 2500);
  };

  // Filter real plans by selected billing cycle
  const displayedPlans = plans.filter((p) => (p.billingCycle || "MONTHLY").toUpperCase() === billingCycle.toUpperCase());

  const getPlanIcon = (idx) => {
    if (idx === 0) return <Hotel sx={{ fontSize: 26, color: "#0D9488" }} />;
    if (idx === 1) return <Apartment sx={{ fontSize: 26, color: "#059669" }} />;
    return <CorporateFare sx={{ fontSize: 26, color: "#4F46E5" }} />;
  };

  return (
    <Box sx={{ maxWidth: 1080, mx: "auto", px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5 }}>
          Enterprise Subscription &amp; {totalDays}-Day Trial
        </Typography>
        <Typography variant="body2" sx={{ color: themeConfig.textMuted, mt: 0.5 }}>
          Monitor your {totalDays}-day evaluation trial, active cloud modules, and commercial tier licensing.
        </Typography>
      </Box>

      {/* Hero 3D Card: Real-time Trial Status */}
      <Card
        className="card-3d"
        sx={{
          borderRadius: "24px",
          border: `1.5px solid ${themeConfig.border}`,
          boxShadow: isDarkMode
            ? "0 16px 36px -8px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
            : "0 16px 36px -8px rgba(12, 39, 59, 0.08), inset 0 1px 1px #FFFFFF",
          background: isDarkMode
            ? `linear-gradient(135deg, ${themeConfig.bgCard} 0%, rgba(255, 255, 255, 0.02) 100%)`
            : "linear-gradient(135deg, #FFFFFF 0%, #F9FBFC 100%)",
          bgcolor: themeConfig.bgCard,
          p: { xs: 2.5, sm: 3.5 },
          mb: 4,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2.5, flexWrap: "wrap", gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Avatar
              sx={{
                background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                width: 54,
                height: 54,
                borderRadius: "16px",
                boxShadow: `0 6px 16px -2px ${themeConfig.primaryGlow}`,
              }}
            >
              <WorkspacePremium sx={{ color: "#FFFFFF", fontSize: 30 }} />
            </Avatar>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, letterSpacing: -0.3 }}>
                {isExpired ? `${totalDays}-Day Free Trial Concluded` : `${totalDays}-Day Evaluation License Active`}
              </Typography>
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.82rem" }}>
                Full unmetered access to PMS Front Desk, Cash Ledger, Room Matrix &amp; ID Compliance
              </Typography>
            </Box>
          </Box>

          <Chip
            label={isExpired ? "TRIAL EXPIRED" : `⏳ ${countdown.formatted}`}
            sx={{
              bgcolor: isExpired ? themeConfig.dangerBg : themeConfig.successBg,
              color: isExpired ? themeConfig.danger : themeConfig.success,
              fontWeight: 900,
              borderRadius: "12px",
              border: `1px solid ${isExpired ? themeConfig.danger + "40" : themeConfig.success + "40"}`,
              boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
              px: 1.5,
              py: 0.5,
              height: 32,
              fontSize: "0.82rem",
            }}
          />
        </Box>

        {/* Real-time Progress Bar */}
        <Box sx={{ my: 3 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMuted }}>
              Trial Timeline (Day {elapsedDays} of {totalDays})
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.primaryDark }}>
              {elapsedPercentage}% Elapsed
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={elapsedPercentage}
            sx={{
              height: 12,
              borderRadius: "10px",
              bgcolor: themeConfig.champagne || "#F1F5F9",
              "& .MuiLinearProgress-bar": {
                background: isExpired
                  ? "linear-gradient(90deg, #DC2626 0%, #EF4444 100%)"
                  : `linear-gradient(90deg, ${themeConfig.primary} 0%, ${themeConfig.primaryLight || themeConfig.primary} 100%)`,
                borderRadius: "10px",
              },
            }}
          />
        </Box>

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 3, pt: 2.5, borderTop: `1px dashed ${themeConfig.border}`, flexWrap: "wrap", gap: 2 }}>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
            Trial evaluation {isExpired ? "ended on" : "expires on"}{" "}
            <strong style={{ color: themeConfig.textMain }}>{trialEndFormatted}</strong>.
          </Typography>
          <Button
            variant="contained"
            className="btn-3d"
            startIcon={<WorkspacePremium />}
            onClick={() => handleOpenUpgrade("Professional Tier")}
            sx={{
              background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
              color: "#FFFFFF",
              fontWeight: 800,
              px: 3,
              py: 1.1,
              borderRadius: "12px",
              boxShadow: `0 6px 18px ${themeConfig.primaryGlow}`,
              "&:hover": { transform: "translateY(-2px)" },
            }}
          >
            Upgrade to Commercial Tier
          </Button>
        </Box>
      </Card>

      {/* REAL SUBSCRIPTION PLANS LIST (From Database) */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3.5, flexWrap: "wrap", gap: 2 }}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
              Available Subscription Plans
            </Typography>
            <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
              Select the optimal commercial plan tailored for your hotel size and operational requirements:
            </Typography>
          </Box>

          {/* Billing Cycle Toggle */}
          <ToggleButtonGroup
            value={billingCycle}
            exclusive
            onChange={(e, val) => val && setBillingCycle(val)}
            sx={{
              bgcolor: themeConfig.bgMain,
              p: 0.5,
              borderRadius: "14px",
              border: `1px solid ${themeConfig.border}`,
              "& .MuiToggleButton-root": {
                border: "none",
                borderRadius: "10px !important",
                px: 2,
                py: 0.6,
                fontWeight: 800,
                fontSize: "0.78rem",
                color: themeConfig.textMuted,
                "&.Mui-selected": {
                  bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                  color: isDarkMode ? "#5EEAD4" : themeConfig.primaryDark,
                  boxShadow: isDarkMode ? "0 2px 8px rgba(0,0,0,0.4)" : "0 2px 8px rgba(0,0,0,0.08)",
                },
              },
            }}
          >
            <ToggleButton value="MONTHLY">Monthly Billing</ToggleButton>
            <ToggleButton value="ANNUAL">
              Annual Billing &nbsp;
              <Chip label="SAVE 20%" size="small" sx={{ bgcolor: themeConfig.successBg, color: themeConfig.success, fontWeight: 900, height: 18, fontSize: "0.62rem" }} />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loadingPlans ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress sx={{ color: themeConfig.primary }} />
          </Box>
        ) : (
          <Grid container spacing={3} sx={{ pt: 1.5, alignItems: "stretch" }}>
            {displayedPlans.map((plan, idx) => {
              const isPopular = Boolean(plan.isPopular || plan.badge === "MOST POPULAR" || idx === 1);
              const iconColors = [
                { bg: isDarkMode ? "rgba(13, 148, 136, 0.18)" : "#CCFBF1", color: "#0D9488" },
                { bg: isDarkMode ? "rgba(16, 185, 129, 0.2)" : "#D1FAE5", color: "#059669" },
                { bg: isDarkMode ? "rgba(99, 102, 241, 0.18)" : "#E0E7FF", color: "#4F46E5" },
              ][idx % 3];

              return (
                <Grid size={{ xs: 12, md: 4 }} key={plan._id || idx} sx={{ display: "flex" }}>
                  <Card
                    className="card-3d"
                    sx={{
                      p: { xs: 2.5, sm: 3.5 },
                      borderRadius: "24px",
                      border: isPopular
                        ? `2px solid ${themeConfig.primary}`
                        : `1px solid ${themeConfig.border}`,
                      bgcolor: themeConfig.bgCard,
                      background: isPopular
                        ? (isDarkMode
                            ? "linear-gradient(180deg, rgba(13, 148, 136, 0.12) 0%, rgba(14, 49, 44, 0.95) 100%)"
                            : "linear-gradient(180deg, #F0FDFA 0%, #FFFFFF 100%)")
                        : (isDarkMode ? themeConfig.bgCard : "#FFFFFF"),
                      position: "relative",
                      overflow: "visible !important",
                      boxShadow: isPopular
                        ? (isDarkMode
                            ? `0 20px 40px -8px rgba(0,0,0,0.6), 0 0 0 1px ${themeConfig.primary}`
                            : `0 20px 40px -8px ${themeConfig.primaryGlow}, 0 0 0 1px ${themeConfig.primary}`)
                        : (isDarkMode
                            ? "0 10px 30px rgba(0,0,0,0.35)"
                            : "0 10px 30px -5px rgba(12, 39, 59, 0.06), inset 0 1px 1px #FFFFFF"),
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      width: "100%",
                      height: "100%",
                      transition: "all 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        borderColor: themeConfig.primary,
                        boxShadow: `0 20px 40px -6px ${themeConfig.primaryGlow}`,
                      },
                    }}
                  >
                    {/* Floating Most Popular Badge with Guaranteed Visibility */}
                    {isPopular && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: -14,
                          left: "50%",
                          transform: "translateX(-50%)",
                          zIndex: 10,
                          background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                          color: "#FFFFFF",
                          fontWeight: 900,
                          fontSize: "0.72rem",
                          letterSpacing: "0.8px",
                          textTransform: "uppercase",
                          px: 2,
                          py: 0.55,
                          borderRadius: "999px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.6,
                          boxShadow: `0 6px 18px ${themeConfig.primaryGlow}`,
                          border: `2px solid ${isDarkMode ? "#0E312C" : "#FFFFFF"}`,
                          whiteSpace: "nowrap",
                        }}
                      >
                        <Star sx={{ fontSize: 13, color: "#FDE047 !important" }} />
                        Most Popular
                      </Box>
                    )}

                    <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1 }}>
                      {/* Top Row: Icon & Capacity */}
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                        <Avatar
                          sx={{
                            bgcolor: iconColors.bg,
                            width: 48,
                            height: 48,
                            borderRadius: "14px",
                            border: `1px solid ${iconColors.color}30`,
                          }}
                        >
                          {getPlanIcon(idx)}
                        </Avatar>
                        <Chip
                          label={plan.maxRooms === 0 || plan.maxRooms >= 999 ? "Unlimited Rooms" : `Up to ${plan.maxRooms} Rooms`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            borderRadius: "10px",
                            bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                            color: themeConfig.textMain,
                            border: `1px solid ${themeConfig.border}`,
                            fontSize: "0.74rem",
                            px: 0.5,
                            py: 0.3,
                          }}
                        />
                      </Box>

                      {/* Plan Title & Tagline */}
                      <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.3, mb: 0.5 }}>
                        {plan.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.8rem", lineHeight: 1.4, minHeight: 20 }}>
                        {plan.tagline || "Complete property management & guest automation"}
                      </Typography>

                      {/* Price Display */}
                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.8, my: 2.5 }}>
                        <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 900,
                            fontSize: { xs: "2.1rem", sm: "2.5rem" },
                            color: isPopular ? (isDarkMode ? "#5EEAD4" : themeConfig.primaryDark) : themeConfig.textMain,
                            letterSpacing: -0.8,
                            lineHeight: 1,
                          }}
                        >
                          ₹{plan.price?.toLocaleString("en-IN")}
                        </Typography>
                        <Typography variant="body2" sx={{ color: themeConfig.textMuted, fontWeight: 700, fontSize: "0.85rem" }}>
                          / {billingCycle === "ANNUAL" ? "year" : "month"}
                        </Typography>
                      </Box>

                      <Divider sx={{ mb: 2.5, borderColor: themeConfig.border }} />

                      {/* Features List with consistent height alignment */}
                      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: 1.4, mb: 3.5, minHeight: 180 }}>
                        {(plan.features || []).map((feat, fIdx) => (
                          <Box key={fIdx} sx={{ display: "flex", alignItems: "flex-start", gap: 1.2 }}>
                            <Box
                              sx={{
                                width: 20,
                                height: 20,
                                borderRadius: "50%",
                                bgcolor: "rgba(16, 185, 129, 0.15)",
                                color: "#10B981",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                flexShrink: 0,
                                mt: 0.2,
                              }}
                            >
                              <Check sx={{ fontSize: 13, strokeWidth: 2.5 }} />
                            </Box>
                            <Typography variant="body2" sx={{ color: themeConfig.textMain, fontWeight: 600, fontSize: "0.83rem", lineHeight: 1.4 }}>
                              {feat}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    {/* Action Button */}
                    <Button
                      variant={isPopular ? "contained" : "outlined"}
                      fullWidth
                      className={isPopular ? "btn-3d" : ""}
                      onClick={() => handleOpenUpgrade(plan)}
                      sx={{
                        borderRadius: "14px",
                        fontWeight: 900,
                        py: 1.3,
                        fontSize: "0.86rem",
                        transition: "all 0.2s ease",
                        ...(isPopular
                          ? {
                              background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                              color: "#FFFFFF",
                              boxShadow: `0 8px 24px ${themeConfig.primaryGlow}`,
                              "&:hover": {
                                transform: "translateY(-2px)",
                                boxShadow: `0 12px 28px ${themeConfig.primaryGlow}`,
                              },
                            }
                          : {
                              bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : "#F8FAFC",
                              borderColor: themeConfig.border,
                              color: themeConfig.textMain,
                              "&:hover": {
                                bgcolor: themeConfig.champagne,
                                borderColor: themeConfig.primary,
                                color: themeConfig.primaryDark,
                                transform: "translateY(-2px)",
                              },
                            }),
                      }}
                    >
                      Choose {plan.name}
                    </Button>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* SUPER ADMIN 24/7 SUPPORT CONTACT */}
      <Card
        className="card-3d"
        sx={{
          borderRadius: "22px",
          border: `1px solid ${themeConfig.border}`,
          bgcolor: themeConfig.bgCard,
          p: 3,
          boxShadow: isDarkMode ? "0 8px 24px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.04)",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, mb: 1 }}>
          <SupportAgent sx={{ color: themeConfig.primary, fontSize: 26 }} />
          <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
            Super Admin Support Desk
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 2.5 }}>
          Need custom pricing, invoice assistance, or instant trial extension? Contact our dedicated Super Admin team:
        </Typography>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Phone />}
              href={`tel:${supportContact.phone}`}
              sx={{ borderRadius: "12px", fontWeight: 700, py: 1.1 }}
            >
              Call {supportContact.phone}
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<WhatsApp />}
              href={`https://wa.me/${supportContact.whatsapp?.replace(/[^0-9]/g, "") || "919876543210"}?text=${encodeURIComponent(
                `Hello Super Admin, I want to upgrade subscription for hotel: ${hotel.name || "Our Hotel"}`
              )}`}
              target="_blank"
              sx={{
                borderRadius: "12px",
                fontWeight: 800,
                py: 1.1,
                bgcolor: "#25D366",
                color: "#FFFFFF",
                "&:hover": { bgcolor: "#1EBE5D" },
              }}
            >
              WhatsApp Support
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Email />}
              href={`mailto:${supportContact.email}?subject=${encodeURIComponent(`Plan Upgrade Request - ${hotel.name || "Hotel"}`)}`}
              sx={{ borderRadius: "12px", fontWeight: 700, py: 1.1 }}
            >
              Email Support
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* QUICK PLAN ACTIVATION MODAL */}
      <Dialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "24px",
              p: 1.5,
              border: `1px solid ${themeConfig.border}`,
              boxShadow: "0 24px 50px rgba(0,0,0,0.18)",
            },
          },
        }}
      >
        {ticketSent ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Avatar sx={{ width: 64, height: 64, bgcolor: themeConfig.successBg, color: themeConfig.success, mx: "auto", mb: 2 }}>
              <CheckCircle sx={{ fontSize: 36 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 1 }}>
              Upgrade Request Received!
            </Typography>
            <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
              Our billing desk has received your request for <strong>{typeof selectedPlan === "object" ? selectedPlan?.name : selectedPlan}</strong>. We will connect with you on <strong>{helpForm.phone}</strong> shortly.
            </Typography>
          </Box>
        ) : (
          <form onSubmit={handleSendTicket}>
            <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                Request {typeof selectedPlan === "object" ? selectedPlan?.name : selectedPlan || "Plan Activation"}
              </Typography>
              <IconButton onClick={() => setHelpDialogOpen(false)} sx={{ borderRadius: "10px" }}>
                <Close />
              </IconButton>
            </DialogTitle>

            <DialogContent dividers sx={{ borderColor: themeConfig.border }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.6, display: "block" }}>
                    Hotel Name
                  </Typography>
                  <TextField fullWidth size="small" value={hotel.name || "My Hotel"} disabled sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }} />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.6, display: "block" }}>
                    Contact Name *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    value={helpForm.name}
                    onChange={(e) => setHelpForm({ ...helpForm, name: e.target.value })}
                    placeholder="Your Full Name"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.6, display: "block" }}>
                    Callback Phone Number *
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    required
                    value={helpForm.phone}
                    onChange={(e) => setHelpForm({ ...helpForm, phone: e.target.value })}
                    placeholder="+91 98200 11223"
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.6, display: "block" }}>
                    Notes / Requirements
                  </Typography>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    value={helpForm.message}
                    onChange={(e) => setHelpForm({ ...helpForm, message: e.target.value })}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                  />
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions sx={{ p: 2.5 }}>
              <Button onClick={() => setHelpDialogOpen(false)} sx={{ borderRadius: "10px", fontWeight: 700 }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                className="btn-3d"
                startIcon={<Send />}
                sx={{
                  background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                  color: "#FFFFFF",
                  fontWeight: 800,
                  borderRadius: "12px",
                  px: 3,
                  boxShadow: `0 4px 14px ${themeConfig.primaryGlow}`,
                }}
              >
                Submit Upgrade Request
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </Box>
  );
}
