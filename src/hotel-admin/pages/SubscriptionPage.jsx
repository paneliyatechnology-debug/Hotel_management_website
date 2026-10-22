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
  DialogContent,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from "@mui/material";
import {
  Check,
  Phone,
  WhatsApp,
  Email,
  SupportAgent,
  CheckCircle,
  Send,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { AppDialogHeader, AppDialogFooter, dialogPaperSx, dialogCancelButtonSx, dialogPrimaryButtonSx } from "@/shared/components/AppDialog";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { useSocket } from "@/shared/context/SocketContext";
import { useLiveCountdown } from "@/shared/utils/countdown";
import { toast } from "@/shared/utils/toast";

// The plans API sends snake_case flags; the client also adds camelCase copies
const flagOf = (plan, snake, camel) => Boolean(plan?.[snake] ?? plan?.[camel]);
const isCurrentPlan = (plan) => flagOf(plan, "is_current_plan", "isCurrentPlan");
const isTrialPlan = (plan) => String(plan?.code || "").toUpperCase() === "TRIAL" || Number(plan?.price) === 0;

export default function SubscriptionPage({ user, subscription: initialSub, onRefresh }) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [ticketSent, setTicketSent] = useState(false);
  const [purchasingId, setPurchasingId] = useState(null);
  const [trialUsed, setTrialUsed] = useState(false);
  const [helpForm, setHelpForm] = useState({
    name: user?.name || "",
    phone: user?.phone || user?.hotel?.ownerPhone || "",
    message: "Hello Super Admin, I want to upgrade/renew our hotel subscription plan.",
  });

  const hotel = user?.hotel || {};
  const [liveSub, setLiveSub] = useState(null);
  const sub = liveSub || initialSub || hotel.subscription || {};
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
    fetchSubscription();
  }, []);

  useSocket(
    ["SUBSCRIPTION_UPDATED", "HOTEL_UPDATED", "TRIAL_REQUEST_APPROVED", "TRIAL_REQUEST_REJECTED", "DASHBOARD_SYNC"],
    () => {
      fetchSubscription();
      fetchPlans();
    }
  );

  const fetchPlans = async () => {
    try {
      setLoadingPlans(true);
      const res = await apiRequest(API_ENDPOINTS.SUBSCRIPTION_PLANS.PUBLIC);
      const list = res?.data?.all || res?.data?.plans || (Array.isArray(res?.data) ? res.data : []);
      if (Array.isArray(list)) {
        setPlans(list);
        setTrialUsed(Boolean(res?.data?.is_trial_used) || list.some((p) => flagOf(p, "is_trial_used", "isTrialUsed")));
      }
    } catch (err) {
      console.warn("Could not load real plans from API:", err);
      toast.error(err?.message || "Could not load subscription plans.");
    } finally {
      setLoadingPlans(false);
    }
  };

  const fetchSubscription = async () => {
    try {
      const res = await apiRequest(API_ENDPOINTS.HOTEL_ADMIN.PROFILE);
      const profile = res?.data || res;
      const nextSub = profile?.subscription || profile?.hotel?.subscription;
      if (nextSub) setLiveSub(nextSub);
    } catch (err) {
      console.warn("Could not load subscription:", err);
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

  const handlePurchasePlan = async (plan) => {
    const planId = plan?._id || plan?.id || plan?.planId || plan?.plan_id;
    if (!planId) {
      toast.error("This plan cannot be purchased yet.");
      return;
    }
    if (isCurrentPlan(plan)) return;
    if (isTrialPlan(plan) && trialUsed) {
      toast.error("The free trial has already been used.");
      return;
    }
    try {
      setPurchasingId(planId);
      // POST /api/v1/subscription-plans/:id/purchase (no body; the plan id is in the URL)
      const res = await apiRequest(API_ENDPOINTS.SUBSCRIPTION_PLANS.PURCHASE(planId), { method: "POST" });
      const redirectUrl = res?.data?.paymentUrl || res?.data?.payment_url || res?.data?.checkoutUrl || res?.data?.checkout_url || res?.data?.url;
      if (redirectUrl) {
        window.location.assign(redirectUrl);
        return;
      }
      toast.success(res?.message || `${plan.name} purchased successfully.`);
      await Promise.all([fetchPlans(), fetchSubscription()]);
      if (typeof onRefresh === "function") onRefresh();
    } catch (err) {
      toast.error(err?.message || "Plan purchase failed.");
    } finally {
      setPurchasingId(null);
    }
  };

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

  // Plan this hotel is on now (any billing cycle), and the plan the Upgrade button should offer
  const currentPlan = plans.find(isCurrentPlan) || null;
  const showTrialStatus = !currentPlan || isTrialPlan(currentPlan);
  // Details of a paid plan: price, room limit and the current billing period
  const readDate = (value) => (value ? new Date(value) : null);
  const periodStart = readDate(sub.startDate || sub.start_date);
  const periodEnd = readDate(sub.endDate || sub.end_date);
  const daysLeft = periodEnd ? Math.ceil((periodEnd.getTime() - now.getTime()) / 86400000) : null;
  const planExpired = daysLeft !== null && daysLeft < 0;
  const formatDate = (date) => date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  const autoRenew = sub.autoRenew ?? sub.auto_renew;
  const planDetails = currentPlan && !showTrialStatus
    ? [
        {
          label: "Price",
          value: `₹${Number(currentPlan.price || 0).toLocaleString("en-IN")} / ${String(currentPlan.billingCycle || currentPlan.billing_cycle || "MONTHLY").toUpperCase() === "ANNUAL" ? "year" : "month"}`,
        },
        {
          label: "Room limit",
          value: !currentPlan.maxRooms || currentPlan.maxRooms >= 999 ? "Unlimited" : `${currentPlan.maxRooms} rooms`,
        },
        periodStart && { label: "Started on", value: formatDate(periodStart) },
        periodEnd && {
          label: planExpired ? "Expired on" : "Valid until",
          value: formatDate(periodEnd),
          note: planExpired ? "Renew to keep access" : `${daysLeft} ${daysLeft === 1 ? "day" : "days"} left`,
          noteColor: planExpired ? themeConfig.danger : daysLeft <= 7 ? "#B45309" : themeConfig.textMuted,
        },
        autoRenew !== undefined && autoRenew !== null && { label: "Auto-renew", value: autoRenew ? "On" : "Off" },
      ].filter(Boolean)
    : [];
  const isPlanLocked = (plan) => isCurrentPlan(plan) || (isTrialPlan(plan) && trialUsed);
  const upgradeTarget =
    displayedPlans.find((p) => !isPlanLocked(p) && (p.isPopular || p.badge === "MOST POPULAR")) ||
    displayedPlans.find((p) => !isPlanLocked(p));

  const cardSx = {
    borderRadius: "14px",
    border: `1px solid ${themeConfig.border}`,
    bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
    boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(15, 23, 42, 0.04)",
  };

  const sectionTitleSx = { fontWeight: 800, color: themeConfig.textMain, fontSize: "1.05rem" };

  const supportButtonSx = {
    borderRadius: "10px",
    textTransform: "none",
    fontWeight: 700,
    color: themeConfig.primaryDark,
    borderColor: themeConfig.border,
    "&:hover": { borderColor: themeConfig.primary, bgcolor: themeConfig.champagne || "#F4F7F6" },
  };

  return (
    <Box sx={{ width: "100%", minWidth: 0, px: { xs: 1.5, sm: 2.5, md: 3 }, py: { xs: 1, sm: 1.5 } }}>
      {/* Current plan */}
      <Card sx={{ ...cardSx, mb: 2.5 }}>
        <CardContent sx={{ p: { xs: 2, sm: 2.5 }, "&:last-child": { pb: { xs: 2, sm: 2.5 } } }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 2 }}>
            <Box>
              <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 700, letterSpacing: 0.5, textTransform: "uppercase" }}>
                Current plan
              </Typography>
              <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "1.15rem", mt: 0.4 }}>
                {currentPlan ? currentPlan.name : isExpired ? "Free trial ended" : "Free trial"}
              </Typography>
              {showTrialStatus && (
                <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.84rem", mt: 0.5 }}>
                  {isExpired ? "Ended on" : "Ends on"} {trialEndFormatted}
                </Typography>
              )}
            </Box>

            <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: "auto" }}>
              <Chip
                size="small"
                label={showTrialStatus ? (isExpired ? "Expired" : `${countdown.formatted} left`) : planExpired ? "Expired" : "Active"}
                sx={{
                  height: 26,
                  fontWeight: 700,
                  fontSize: "0.76rem",
                  bgcolor: (showTrialStatus ? isExpired : planExpired) ? themeConfig.dangerBg : themeConfig.successBg,
                  color: (showTrialStatus ? isExpired : planExpired) ? themeConfig.danger : themeConfig.success,
                }}
              />
              {showTrialStatus && upgradeTarget && (
                <Button
                  variant="contained"
                  onClick={() => handlePurchasePlan(upgradeTarget)}
                  sx={{
                    height: 40,
                    px: 2.5,
                    borderRadius: "10px",
                    textTransform: "none",
                    fontWeight: 700,
                    boxShadow: "none",
                    bgcolor: themeConfig.primary,
                    "&:hover": { bgcolor: themeConfig.primaryDark, boxShadow: "none" },
                  }}
                >
                  Upgrade plan
                </Button>
              )}
            </Box>
          </Box>

          {!showTrialStatus && planDetails.length > 0 && (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "repeat(2, minmax(0, 1fr))", md: `repeat(${Math.min(planDetails.length, 5)}, minmax(0, 1fr))` },
                gap: 2,
                mt: 2,
                pt: 2,
                borderTop: `1px solid ${themeConfig.border}`,
              }}
            >
              {planDetails.map((item) => (
                <Box key={item.label} sx={{ minWidth: 0 }}>
                  <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 700, letterSpacing: 0.4, textTransform: "uppercase" }}>
                    {item.label}
                  </Typography>
                  <Typography sx={{ color: themeConfig.textMain, fontSize: "0.95rem", fontWeight: 700, mt: 0.3 }}>{item.value}</Typography>
                  {item.note && (
                    <Typography sx={{ color: item.noteColor || themeConfig.textMuted, fontSize: "0.76rem", mt: 0.1 }}>{item.note}</Typography>
                  )}
                </Box>
              ))}
            </Box>
          )}

          {showTrialStatus && (
            <Box sx={{ mt: 2.5 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.78rem", fontWeight: 600 }}>
                  Day {elapsedDays} of {totalDays}
                </Typography>
                <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.78rem", fontWeight: 600 }}>
                  {elapsedPercentage}% used
                </Typography>
              </Box>
              <LinearProgress
                variant="determinate"
                value={elapsedPercentage}
                sx={{
                  height: 6,
                  borderRadius: "6px",
                  bgcolor: themeConfig.champagne || "#F1F5F9",
                  "& .MuiLinearProgress-bar": {
                    borderRadius: "6px",
                    bgcolor: isExpired ? themeConfig.danger : themeConfig.primary,
                  },
                }}
              />
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Plans */}
      <Box sx={{ mb: 2.5 }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
            pb: 1.25,
            mb: 2,
            borderBottom: `1px solid ${themeConfig.border}`,
          }}
        >
          <Typography sx={sectionTitleSx}>Available plans</Typography>

          <ToggleButtonGroup
            value={billingCycle}
            exclusive
            size="small"
            onChange={(e, val) => val && setBillingCycle(val)}
            sx={{
              p: "3px",
              gap: "2px",
              borderRadius: "10px",
              border: `1px solid ${themeConfig.border}`,
              bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC",
              "& .MuiToggleButtonGroup-grouped": {
                border: 0,
                borderRadius: "7px !important",
                m: 0,
              },
              "& .MuiToggleButton-root": {
                textTransform: "none",
                minWidth: 84,
                px: 2,
                py: 0.45,
                fontWeight: 700,
                fontSize: "0.8rem",
                lineHeight: 1.4,
                color: themeConfig.textMuted,
                "&:hover": { bgcolor: "transparent", color: themeConfig.textMain },
                "&.Mui-selected": {
                  color: "#FFFFFF",
                  bgcolor: themeConfig.primary,
                  "&:hover": { bgcolor: themeConfig.primaryDark },
                },
              },
            }}
          >
            <ToggleButton value="MONTHLY">Monthly</ToggleButton>
            <ToggleButton value="ANNUAL">Annual</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {loadingPlans ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
            <CircularProgress size={28} sx={{ color: themeConfig.primary }} />
          </Box>
        ) : displayedPlans.length === 0 ? (
          <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.9rem", py: 4, textAlign: "center" }}>
            No {billingCycle === "ANNUAL" ? "annual" : "monthly"} plans are available right now.
          </Typography>
        ) : (
          <Grid container spacing={2} sx={{ alignItems: "stretch" }}>
            {displayedPlans.map((plan, idx) => {
              const isPopular = Boolean(plan.isPopular || plan.badge === "MOST POPULAR");
              const planId = plan._id || plan.id;
              const isBusy = purchasingId === planId;
              const isCurrent = isCurrentPlan(plan);
              const trialLocked = isTrialPlan(plan) && trialUsed && !isCurrent;
              const isLocked = isCurrent || trialLocked;
              const roomsLabel = plan.maxRooms === 0 || plan.maxRooms >= 999 ? "Unlimited rooms" : `Up to ${plan.maxRooms} rooms`;

              return (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={planId || idx} sx={{ display: "flex" }}>
                  <Card
                    sx={{
                      ...cardSx,
                      width: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: `1px solid ${isCurrent ? themeConfig.primary : themeConfig.border}`,
                      ...(isCurrent ? { boxShadow: `0 0 0 1px ${themeConfig.primary}` } : {}),
                    }}
                  >
                    <CardContent sx={{ p: 2, display: "flex", flexDirection: "column", flexGrow: 1, "&:last-child": { pb: 2 } }}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                        <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "1.1rem" }}>{plan.name}</Typography>
                        {(isCurrent || trialLocked || isPopular) && (
                          <Chip
                            size="small"
                            label={isCurrent ? "Current plan" : trialLocked ? "Used" : "Popular"}
                            sx={{
                              height: 22,
                              fontWeight: 700,
                              fontSize: "0.7rem",
                              ...(isCurrent
                                ? { color: themeConfig.success, bgcolor: themeConfig.successBg }
                                : trialLocked
                                  ? { color: themeConfig.textMuted, bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9" }
                                  : { color: themeConfig.primaryDark, bgcolor: themeConfig.champagne || "#EAF6F3" }),
                            }}
                          />
                        )}
                      </Box>
                      <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.82rem", mt: 0.4 }}>{roomsLabel}</Typography>

                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, mt: 1.5, pb: 1.5, borderBottom: `1px solid ${themeConfig.border}` }}>
                        <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "1.9rem", lineHeight: 1.1 }}>
                          ₹{plan.price?.toLocaleString("en-IN")}
                        </Typography>
                        <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.85rem" }}>
                          / {billingCycle === "ANNUAL" ? "year" : "month"}
                        </Typography>
                      </Box>

                      <Box component="ul" sx={{ listStyle: "none", m: 0, p: 0, mt: 1.5, mb: 2, display: "flex", flexDirection: "column", gap: 0.9, flexGrow: 1 }}>
                        {(plan.features || []).map((feat, fIdx) => (
                          <Box component="li" key={fIdx} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                            <Check sx={{ fontSize: 16, mt: 0.2, color: themeConfig.primary, flexShrink: 0 }} />
                            <Typography sx={{ color: themeConfig.textMain, fontSize: "0.84rem", lineHeight: 1.45 }}>{feat}</Typography>
                          </Box>
                        ))}
                      </Box>

                      <Button
                        fullWidth
                        variant={isLocked ? "outlined" : "contained"}
                        onClick={() => handlePurchasePlan(plan)}
                        disabled={isBusy || isLocked}
                        startIcon={isCurrent ? <Check /> : undefined}
                        sx={{
                          height: 40,
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 700,
                          boxShadow: "none",
                          ...(!isLocked
                            ? { bgcolor: themeConfig.primary, "&:hover": { bgcolor: themeConfig.primaryDark, boxShadow: "none" } }
                            : {
                                color: themeConfig.primaryDark,
                                borderColor: themeConfig.border,
                                "&:hover": { borderColor: themeConfig.primary, bgcolor: themeConfig.champagne || "#F4F7F6" },
                              }),
                        }}
                      >
                        {isBusy ? "Processing..." : isCurrent ? "Current plan" : trialLocked ? "Trial already used" : "Choose plan"}
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Box>

      {/* Support */}
      <Card sx={cardSx}>
        <CardContent
          sx={{
            p: { xs: 2, sm: 2.5 },
            "&:last-child": { pb: { xs: 2, sm: 2.5 } },
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 2,
          }}
        >
          <Box>
            <Typography sx={{ fontWeight: 800, color: themeConfig.textMain, fontSize: "0.98rem" }}>Need help choosing a plan?</Typography>
            <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.84rem", mt: 0.3 }}>
              Contact our support team for pricing, invoices or a trial extension.
            </Typography>
          </Box>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.25 }}>
            <Button variant="outlined" startIcon={<Phone />} href={`tel:${supportContact.phone}`} sx={supportButtonSx}>
              Call
            </Button>
            <Button
              variant="outlined"
              startIcon={<WhatsApp />}
              href={`https://wa.me/${supportContact.whatsapp?.replace(/[^0-9]/g, "") || "919876543210"}?text=${encodeURIComponent(
                `Hello Super Admin, I want to upgrade subscription for hotel: ${hotel.name || "Our Hotel"}`
              )}`}
              target="_blank"
              sx={supportButtonSx}
            >
              WhatsApp
            </Button>
            <Button
              variant="outlined"
              startIcon={<Email />}
              href={`mailto:${supportContact.email}?subject=${encodeURIComponent(`Plan Upgrade Request - ${hotel.name || "Hotel"}`)}`}
              sx={supportButtonSx}
            >
              Email
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* QUICK PLAN ACTIVATION MODAL */}
      <Dialog
        open={helpDialogOpen}
        onClose={() => setHelpDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: dialogPaperSx(themeConfig, isDarkMode) } }}
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
            <AppDialogHeader
              eyebrow="Subscription"
              title={`Request ${typeof selectedPlan === "object" ? selectedPlan?.name : selectedPlan || "plan activation"}`}
              icon={<SupportAgent sx={{ fontSize: 20 }} />}
              onClose={() => setHelpDialogOpen(false)}
            />

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

            <AppDialogFooter>
              <Button onClick={() => setHelpDialogOpen(false)} variant="outlined" sx={dialogCancelButtonSx(themeConfig, isDarkMode)}>
                Cancel
              </Button>
              <Button type="submit" variant="contained" startIcon={<Send />} sx={dialogPrimaryButtonSx(themeConfig)}>
                Submit request
              </Button>
            </AppDialogFooter>
          </form>
        )}
      </Dialog>
    </Box>
  );
}
