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

  // Real-time dynamic trial calculations
  const trialEnd = sub.trialEndDate ? new Date(sub.trialEndDate) : new Date(Date.now() + 24 * 86400000);
  const trialStart = sub.trialStartDate ? new Date(sub.trialStartDate) : new Date(trialEnd.getTime() - 30 * 86400000);

  const daysLeft = countdown.isExpired ? 0 : countdown.days;
  const totalDays = sub.totalDays || 30;
  const elapsedDays = Math.max(0, Math.min(totalDays, totalDays - daysLeft));
  const elapsedPercentage = Math.min(100, Math.max(0, Math.round((elapsedDays / totalDays) * 100)));

  const isExpired = countdown.isExpired || sub.isExpired || sub.status === "EXPIRED";

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
    if (idx === 0) return <Hotel sx={{ fontSize: 24, color: themeConfig.primary }} />;
    if (idx === 1) return <Apartment sx={{ fontSize: 24, color: themeConfig.accent || "#D97706" }} />;
    return <CorporateFare sx={{ fontSize: 24, color: themeConfig.primaryDark }} />;
  };

  return (
    <Box sx={{ maxWidth: 1060, mx: "auto", px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3.5 }}>
        <Typography variant="h4" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5 }}>
          Enterprise Subscription &amp; 30-Day Trial
        </Typography>
        <Typography variant="body2" sx={{ color: themeConfig.textMuted, mt: 0.5 }}>
          Monitor your 30-day evaluation trial, active cloud modules, and commercial tier licensing.
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
                {isExpired ? "30-Day Free Trial Concluded" : "30-Day Evaluation License Active"}
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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 2 }}>
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
          <Grid container spacing={3}>
            {displayedPlans.map((plan, idx) => {
              const isPopular = Boolean(plan.isPopular || plan.badge === "MOST POPULAR");

              return (
                <Grid size={{ xs: 12, md: 4 }} key={plan._id || idx}>
                  <Card
                    className="card-3d"
                    sx={{
                      p: 3,
                      borderRadius: "22px",
                      border: isPopular ? `2px solid ${themeConfig.primary}` : `1px solid ${themeConfig.border}`,
                      bgcolor: themeConfig.bgCard,
                      position: "relative",
                      boxShadow: isPopular
                        ? `0 14px 32px -4px ${themeConfig.primaryGlow}`
                        : isDarkMode
                          ? "0 8px 24px rgba(0,0,0,0.4)"
                          : "0 6px 20px rgba(0,0,0,0.04)",
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                      height: "100%",
                      transition: "all 0.22s ease",
                      "&:hover": {
                        transform: "translateY(-4px)",
                        borderColor: themeConfig.primary,
                      },
                    }}
                  >
                    {isPopular && (
                      <Chip
                        icon={<Star sx={{ fontSize: 14, color: "#FFFFFF !important" }} />}
                        label="MOST POPULAR"
                        size="small"
                        sx={{
                          position: "absolute",
                          top: -12,
                          right: 20,
                          bgcolor: themeConfig.primary,
                          color: "#FFFFFF",
                          fontWeight: 900,
                          fontSize: "0.68rem",
                          boxShadow: `0 4px 10px ${themeConfig.primaryGlow}`,
                        }}
                      />
                    )}

                    <Box>
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1.5 }}>
                        <Avatar sx={{ bgcolor: themeConfig.champagne, width: 44, height: 44, borderRadius: "12px" }}>
                          {getPlanIcon(idx)}
                        </Avatar>
                        <Chip
                          label={plan.maxRooms === 0 || plan.maxRooms >= 999 ? "Unlimited Rooms" : `Up to ${plan.maxRooms} Rooms`}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            borderRadius: "8px",
                            bgcolor: themeConfig.bgMain,
                            color: themeConfig.textMain,
                            border: `1px solid ${themeConfig.border}`,
                            fontSize: "0.72rem",
                          }}
                        />
                      </Box>

                      <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                        {plan.name}
                      </Typography>
                      {plan.tagline && (
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block", mb: 1 }}>
                          {plan.tagline}
                        </Typography>
                      )}

                      <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, my: 1.5 }}>
                        <Typography variant="h4" sx={{ fontWeight: 900, color: isDarkMode ? themeConfig.primary : themeConfig.primaryDark }}>
                          ₹{plan.price?.toLocaleString("en-IN")}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                          / {billingCycle === "ANNUAL" ? "year" : "month"}
                        </Typography>
                      </Box>

                      <Box sx={{ mt: 2.5, mb: 3 }}>
                        {(plan.features || []).map((feat, fIdx) => (
                          <Box key={fIdx} sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.2 }}>
                            <Check sx={{ fontSize: 16, color: themeConfig.success }} />
                            <Typography variant="caption" sx={{ color: themeConfig.textMain, fontWeight: 600 }}>
                              {feat}
                            </Typography>
                          </Box>
                        ))}
                      </Box>
                    </Box>

                    <Button
                      variant={isPopular ? "contained" : "outlined"}
                      fullWidth
                      className={isPopular ? "btn-3d" : ""}
                      onClick={() => handleOpenUpgrade(plan)}
                      sx={{
                        borderRadius: "12px",
                        fontWeight: 800,
                        py: 1.1,
                        fontSize: "0.82rem",
                        ...(isPopular
                          ? {
                              background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                              color: "#FFFFFF",
                            }
                          : {
                              borderColor: themeConfig.border,
                              color: isDarkMode ? themeConfig.primary : themeConfig.primaryDark,
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
