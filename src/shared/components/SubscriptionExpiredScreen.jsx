"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  Button,
  Chip,
  Avatar,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
  CircularProgress,
} from "@mui/material";
import {
  Phone,
  Email,
  WhatsApp,
  SupportAgent,
  CheckCircle,
  Logout,
  Close,
  Lock,
  HourglassBottom,
  Send,
  AutoAwesome,
  Star,
  Check,
  Hotel as HotelIcon,
  Apartment,
  CorporateFare,
  WorkspacePremium,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { useSocket } from "@/shared/context/SocketContext";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { toast } from "@/shared/utils/toast";

export default function SubscriptionExpiredScreen({
  user,
  onLogout,
  reason = "",
  type = "EXPIRED", // "EXPIRED" | "DISABLED" | "SUSPENDED"
}) {
  const { themeConfig, isDarkMode } = useAppTheme();

  // Listen for real-time trial approval or status changes
  useSocket(["TRIAL_REQUEST_APPROVED", "HOTEL_STATUS_UPDATED"], (payload, evt) => {
    if (evt === "TRIAL_REQUEST_APPROVED") {
      toast.success("⚡ Trial Extension Approved by Super Admin! Unlocking portal...", { toastId: "trial_approved_toast" });
    } else if (evt === "HOTEL_STATUS_UPDATED") {
      toast.info("⚡ Hotel status updated in real-time by Super Admin!", { toastId: "hotel_status_toast" });
    }
  });
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [billingCycle, setBillingCycle] = useState("MONTHLY");
  const [helpDialogOpen, setHelpDialogOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [ticketSent, setTicketSent] = useState(false);
  const [helpForm, setHelpForm] = useState({
    name: user?.name || "",
    phone: user?.phone || user?.hotel?.ownerPhone || "",
    message: "Hello Super Admin, please help us renew and activate our hotel subscription plan.",
  });

  const hotel = user?.hotel || {};
  const subscription = hotel.subscription || {};
  const supportContact = hotel.supportContact || {
    phone: "+91 98765 43210",
    email: "support@cloudhotelier.com",
    whatsapp: "+919876543210",
  };

  const isSuspended = type === "DISABLED" || type === "SUSPENDED" || hotel.status === "DISABLED" || hotel.status === "SUSPENDED";
  const isReceptionist = user?.role === "RECEPTIONIST";

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
      console.warn("Could not load real plans:", err);
    } finally {
      setLoadingPlans(false);
    }
  };

  const trialEndDateStr = subscription.trialEndDate
    ? new Date(subscription.trialEndDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Recently";

  const handleOpenUpgrade = (plan) => {
    setSelectedPlan(plan);
    const planTitle = typeof plan === "object" ? `${plan.name} (${plan.billingCycle || billingCycle}) - ₹${plan.price?.toLocaleString("en-IN")}` : plan;
    setHelpForm({
      name: user?.name || "",
      phone: user?.phone || user?.hotel?.ownerPhone || "",
      message: `Hello Super Admin, I want to activate/renew the '${planTitle}' plan for hotel '${hotel.name || "Our Hotel"}'. Please assist with invoice and immediate activation.`,
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

  const displayedPlans = plans.filter((p) => (p.billingCycle || "MONTHLY").toUpperCase() === billingCycle.toUpperCase());

  const getPlanIcon = (idx) => {
    if (idx === 0) return <HotelIcon sx={{ fontSize: 24, color: themeConfig.primary }} />;
    if (idx === 1) return <Apartment sx={{ fontSize: 24, color: themeConfig.accent || "#D97706" }} />;
    return <CorporateFare sx={{ fontSize: 24, color: themeConfig.primaryDark }} />;
  };

  // Free Trial Extension Request State (Hotel Admin)
  const [trialDialogOpen, setTrialDialogOpen] = useState(false);
  const [trialForm, setTrialForm] = useState({ requestedDays: 30, reason: "" });
  const [trialSubmitting, setTrialSubmitting] = useState(false);
  const [trialSuccessMsg, setTrialSuccessMsg] = useState("");

  const handleSendTrialRequest = async (e) => {
    e.preventDefault();
    if (!trialForm.reason.trim()) return;
    setTrialSubmitting(true);
    try {
      const res = await apiRequest(API_ENDPOINTS.TRIAL_REQUESTS.SUBMIT, {
        method: "POST",
        body: trialForm,
      });
      setTrialSuccessMsg(res?.message || "Trial extension request submitted! Super Admin has been notified in real-time.");
      setTimeout(() => {
        setTrialDialogOpen(false);
        setTrialSuccessMsg("");
      }, 3000);
    } catch (err) {
      alert(err.message || "Failed to submit trial extension request");
    } finally {
      setTrialSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: themeConfig.bgMain || "#F8FAFC",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        p: { xs: 2, sm: 4 },
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Trial Request Dialog */}
      <Dialog
        open={trialDialogOpen}
        onClose={() => setTrialDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "22px",
              p: 1.5,
              border: `1px solid ${themeConfig.border}`,
            },
          },
        }}
      >
        {trialSuccessMsg ? (
          <Box sx={{ p: 4, textAlign: "center" }}>
            <Avatar sx={{ width: 60, height: 60, bgcolor: themeConfig.successBg, color: themeConfig.success, mx: "auto", mb: 2 }}>
              <CheckCircle sx={{ fontSize: 36 }} />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 1 }}>
              Request Sent to Super Admin! ⚡
            </Typography>
            <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
              {trialSuccessMsg}
            </Typography>
          </Box>
        ) : (
          <form onSubmit={handleSendTrialRequest}>
            <DialogTitle component="div" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
              Request Free Trial Extension
              <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                Submit a request directly to Super Admin for complimentary trial days.
              </Typography>
            </DialogTitle>

            <DialogContent sx={{ pt: 1, display: "flex", flexDirection: "column", gap: 2 }}>
              <TextField
                label="Requested Extension Days"
                type="number"
                size="small"
                fullWidth
                value={trialForm.requestedDays}
                onChange={(e) => setTrialForm({ ...trialForm, requestedDays: e.target.value })}
                helperText="Standard trial extensions are 15, 30, 45, or 60 days."
              />

              <TextField
                label="Reason for Trial Extension *"
                required
                multiline
                rows={3}
                size="small"
                fullWidth
                placeholder="e.g. We require additional evaluation time before deciding on an annual plan..."
                value={trialForm.reason}
                onChange={(e) => setTrialForm({ ...trialForm, reason: e.target.value })}
              />
            </DialogContent>

            <DialogActions sx={{ p: 2, px: 3 }}>
              <Button onClick={() => setTrialDialogOpen(false)} sx={{ fontWeight: 700, color: themeConfig.textMuted }}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                disabled={trialSubmitting || !trialForm.reason.trim()}
                className="btn-3d"
                sx={{
                  bgcolor: themeConfig.primary,
                  color: "#FFFFFF",
                  fontWeight: 800,
                  borderRadius: "10px",
                  px: 3,
                }}
              >
                {trialSubmitting ? "Submitting..." : "Send Request to Super Admin ⚡"}
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>

      {/* Background Decorative Ambient Radial Glows */}
      <Box
        sx={{
          position: "absolute",
          top: "-10%",
          left: "50%",
          transform: "translateX(-50%)",
          width: "700px",
          height: "700px",
          background: isSuspended
            ? "radial-gradient(circle, rgba(220, 38, 38, 0.08) 0%, rgba(220, 38, 38, 0) 70%)"
            : "radial-gradient(circle, rgba(11, 142, 224, 0.12) 0%, rgba(11, 142, 224, 0) 70%)",
          pointerEvents: "none",
        }}
      />

      <Card
        className="card-3d"
        sx={{
          maxWidth: 960,
          width: "100%",
          borderRadius: "28px",
          border: `1.5px solid ${themeConfig.border || "#E2E8F0"}`,
          boxShadow: "0 24px 60px -12px rgba(12, 39, 59, 0.15), inset 0 1px 1px #FFFFFF",
          background: "#FFFFFF",
          overflow: "hidden",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* Top 3D Header Ribbon */}
        <Box
          sx={{
            p: { xs: 3, sm: 4 },
            background: isSuspended
              ? "linear-gradient(135deg, #7F1D1D 0%, #DC2626 100%)"
              : `linear-gradient(135deg, ${themeConfig.primaryDark || "#0C273B"} 0%, ${themeConfig.primary || "#0B8EE0"} 100%)`,
            color: "#FFFFFF",
            position: "relative",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 2 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
              <Avatar
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  width: 58,
                  height: 58,
                  borderRadius: "18px",
                  boxShadow: "0 8px 20px rgba(0,0,0,0.25)",
                  backdropFilter: "blur(8px)",
                }}
              >
                {isSuspended ? <Lock sx={{ fontSize: 32 }} /> : <HourglassBottom sx={{ fontSize: 32 }} />}
              </Avatar>

              <Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
                  <Chip
                    label={isSuspended ? "ACCOUNT ACCESS SUSPENDED" : "30-DAY FREE TRIAL ENDED"}
                    size="small"
                    sx={{
                      bgcolor: "rgba(255,255,255,0.2)",
                      color: "#FFFFFF",
                      fontWeight: 900,
                      fontSize: "0.72rem",
                      letterSpacing: 0.8,
                      border: "1px solid rgba(255,255,255,0.3)",
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)", fontWeight: 700 }}>
                    {hotel.name || "Your Hotel"}
                  </Typography>
                </Box>

                <Typography variant="h5" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: -0.5 }}>
                  {isSuspended
                    ? "Hotel Account Temporarily Suspended"
                    : "Your 30-Day Free Trial Has Expired"}
                </Typography>
              </Box>
            </Box>

            <Button
              variant="outlined"
              size="small"
              startIcon={<Logout />}
              onClick={onLogout}
              sx={{
                color: "#FFFFFF",
                borderColor: "rgba(255,255,255,0.4)",
                borderRadius: "12px",
                fontWeight: 700,
                fontSize: "0.78rem",
                "&:hover": {
                  borderColor: "#FFFFFF",
                  bgcolor: "rgba(255,255,255,0.15)",
                },
              }}
            >
              Sign Out
            </Button>
          </Box>
        </Box>

        {/* Content Body */}
        <Box sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Main Notice */}
          <Alert
            severity={isSuspended ? "error" : "warning"}
            sx={{
              borderRadius: "16px",
              mb: 3.5,
              fontWeight: 600,
              fontSize: "0.92rem",
              border: `1px solid ${isSuspended ? "#FECACA" : "#FDE68A"}`,
              bgcolor: isSuspended ? "#FEF2F2" : "#FFFBEB",
            }}
          >
            {isSuspended ? (
              <Box>
                <strong>Administrative Notice: </strong>
                {reason || hotel.statusReason || "This hotel account and all associated portals (Frontdesk, Room Matrix, Billing) have been suspended by Super Admin policy."}
              </Box>
            ) : isReceptionist ? (
              <Box>
                <strong>Frontdesk Access Notice: </strong>
                Your hotel&apos;s 30-day evaluation trial concluded on <strong>{trialEndDateStr}</strong>. Operational check-in and folio services are paused. Please notify your Hotel General Manager or Owner to renew the plan.
              </Box>
            ) : (
              <Box>
                <strong>Plan Renewal Required: </strong>
                Your 30-day free trial concluded on <strong>{trialEndDateStr}</strong>. To re-activate PMS Front Desk, Guest Folios, Room Matrix, and Staff Portals, please renew your plan or contact support.
              </Box>
            )}
          </Alert>

          {/* Real-time Trial Status Summary Card */}
          <Card
            className="card-3d"
            sx={{
              p: 2.5,
              borderRadius: "18px",
              bgcolor: themeConfig.champagne || "#F8FAFC",
              border: `1px solid ${themeConfig.border}`,
              mb: 3.5,
            }}
          >
            <Grid container spacing={2} sx={{ alignItems: "center" }}>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  Trial Status
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: isSuspended ? themeConfig.danger : themeConfig.warning }}>
                  {isSuspended ? "SUSPENDED" : "EVALUATION EXPIRED"}
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  Trial Duration
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                  30 Days (100% Completed)
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                  Concluded On
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 800, color: themeConfig.primaryDark }}>
                  {trialEndDateStr}
                </Typography>
              </Grid>
            </Grid>
          </Card>

          {/* REAL SUBSCRIPTION PLANS (If Hotel Admin) */}
          {!isReceptionist && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5, flexWrap: "wrap", gap: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                    Select Plan to Re-activate Access
                  </Typography>
                  <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
                    Choose a commercial plan to restore complete hotel operations:
                  </Typography>
                </Box>

                <ToggleButtonGroup
                  value={billingCycle}
                  exclusive
                  onChange={(e, val) => val && setBillingCycle(val)}
                  size="small"
                  sx={{
                    bgcolor: themeConfig.bgMain,
                    p: 0.5,
                    borderRadius: "12px",
                    border: `1px solid ${themeConfig.border}`,
                    "& .MuiToggleButton-root": {
                      border: "none",
                      borderRadius: "8px !important",
                      px: 1.5,
                      py: 0.4,
                      fontWeight: 800,
                      fontSize: "0.75rem",
                      color: themeConfig.textMuted,
                      "&.Mui-selected": {
                        bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                        color: themeConfig.primaryDark,
                        boxShadow: isDarkMode ? "none" : "0 2px 6px rgba(0,0,0,0.08)",
                      },
                    },
                  }}
                >
                  <ToggleButton value="MONTHLY">Monthly</ToggleButton>
                  <ToggleButton value="ANNUAL">
                    Annual &nbsp;
                    <Chip label="SAVE 20%" size="small" sx={{ bgcolor: themeConfig.successBg, color: themeConfig.success, fontWeight: 900, height: 16, fontSize: "0.58rem" }} />
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>

              {loadingPlans ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress sx={{ color: themeConfig.primary }} />
                </Box>
              ) : (
                <Grid container spacing={2.5}>
                  {displayedPlans.map((plan, idx) => {
                    const isPopular = Boolean(plan.isPopular || plan.badge === "MOST POPULAR");

                    return (
                      <Grid size={{ xs: 12, md: 4 }} key={plan._id || idx}>
                        <Card
                          className="card-3d"
                          sx={{
                            p: 2.5,
                            borderRadius: "18px",
                            border: isPopular ? `2px solid ${themeConfig.primary}` : `1px solid ${themeConfig.border}`,
                            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                            position: "relative",
                            boxShadow: isPopular ? `0 12px 28px -4px ${themeConfig.primaryGlow}` : (isDarkMode ? "none" : "0 4px 16px rgba(0,0,0,0.04)"),
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            height: "100%",
                          }}
                        >
                          {isPopular && (
                            <Chip
                              icon={<Star sx={{ fontSize: 13, color: "#FFFFFF !important" }} />}
                              label="RECOMMENDED"
                              size="small"
                              sx={{
                                position: "absolute",
                                top: -10,
                                right: 16,
                                bgcolor: themeConfig.primary,
                                color: "#FFFFFF",
                                fontWeight: 900,
                                fontSize: "0.62rem",
                                boxShadow: `0 4px 10px ${themeConfig.primaryGlow}`,
                              }}
                            />
                          )}

                          <Box>
                            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                              <Avatar sx={{ bgcolor: themeConfig.champagne, width: 38, height: 38, borderRadius: "10px" }}>
                                {getPlanIcon(idx)}
                              </Avatar>
                              <Chip
                                label={plan.maxRooms === 0 || plan.maxRooms >= 999 ? "Unlimited Rooms" : `Up to ${plan.maxRooms} Rooms`}
                                size="small"
                                sx={{
                                  fontWeight: 800,
                                  borderRadius: "6px",
                                  bgcolor: themeConfig.bgMain,
                                  color: themeConfig.textMain,
                                  fontSize: "0.68rem",
                                }}
                              />
                            </Box>

                            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                              {plan.name}
                            </Typography>

                            <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.5, my: 1 }}>
                              <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.primaryDark }}>
                                ₹{plan.price?.toLocaleString("en-IN")}
                              </Typography>
                              <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                                / {billingCycle === "ANNUAL" ? "year" : "mo"}
                              </Typography>
                            </Box>

                            <Box sx={{ mt: 1.5, mb: 2 }}>
                              {(plan.features || []).slice(0, 4).map((feat, fIdx) => (
                                <Box key={fIdx} sx={{ display: "flex", alignItems: "center", gap: 0.8, mb: 0.8 }}>
                                  <Check sx={{ fontSize: 14, color: themeConfig.success }} />
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
                            size="small"
                            className={isPopular ? "btn-3d" : ""}
                            onClick={() => handleOpenUpgrade(plan)}
                            sx={{
                              borderRadius: "10px",
                              fontWeight: 800,
                              py: 0.9,
                              fontSize: "0.78rem",
                              ...(isPopular
                                ? {
                                    background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                                    color: "#FFFFFF",
                                  }
                                : {
                                    borderColor: themeConfig.border,
                                    color: themeConfig.primaryDark,
                                  }),
                            }}
                          >
                            Select {plan.name}
                          </Button>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          )}

          {/* HELP & SUPPORT / SUPER ADMIN CONTACT SECTION */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1.5 }}>
              <SupportAgent sx={{ color: themeConfig.primary, fontSize: 24 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                Super Admin Support & Instant Activation
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 2.5 }}>
              Contact our 24/7 Super Admin Support desk to renew your subscription plan, extend your trial, or resolve account suspension immediately:
            </Typography>

            <Grid container spacing={2}>
              {/* Call Support */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card
                  className="card-3d"
                  sx={{
                    p: 2.2,
                    borderRadius: "16px",
                    border: `1px solid ${themeConfig.border}`,
                    bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    "&:hover": { transform: "translateY(-3px)", borderColor: themeConfig.primary },
                  }}
                >
                  <Avatar sx={{ bgcolor: themeConfig.champagne, color: themeConfig.primary, mx: "auto", mb: 1.2, width: 44, height: 44 }}>
                    <Phone fontSize="small" />
                  </Avatar>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                    Direct Support Helpline
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 1.5 }}>
                    {supportContact.phone}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    href={`tel:${supportContact.phone}`}
                    sx={{ borderRadius: "10px", fontWeight: 700, fontSize: "0.75rem" }}
                  >
                    Call Now
                  </Button>
                </Card>
              </Grid>

              {/* WhatsApp Support */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card
                  className="card-3d"
                  sx={{
                    p: 2.2,
                    borderRadius: "16px",
                    border: `1px solid ${themeConfig.border}`,
                    bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    "&:hover": { transform: "translateY(-3px)", borderColor: "#25D366" },
                  }}
                >
                  <Avatar sx={{ bgcolor: "rgba(37, 211, 102, 0.12)", color: "#25D366", mx: "auto", mb: 1.2, width: 44, height: 44 }}>
                    <WhatsApp fontSize="small" />
                  </Avatar>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                    WhatsApp Live Chat
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 1.5 }}>
                    Instant Activation Chat
                  </Typography>
                  <Button
                    variant="contained"
                    size="small"
                    fullWidth
                    href={`https://wa.me/${supportContact.whatsapp?.replace(/[^0-9]/g, "") || "919876543210"}?text=${encodeURIComponent(
                      `Hello Super Admin, I want to activate/renew subscription for hotel: ${hotel.name || "Our Hotel"}`
                    )}`}
                    target="_blank"
                    sx={{
                      borderRadius: "10px",
                      fontWeight: 800,
                      fontSize: "0.75rem",
                      bgcolor: "#25D366",
                      color: "#FFFFFF",
                      "&:hover": { bgcolor: "#1EBE5D" },
                    }}
                  >
                    Chat on WhatsApp
                  </Button>
                </Card>
              </Grid>

              {/* Email Support */}
              <Grid size={{ xs: 12, sm: 4 }}>
                <Card
                  className="card-3d"
                  sx={{
                    p: 2.2,
                    borderRadius: "16px",
                    border: `1px solid ${themeConfig.border}`,
                    bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                    textAlign: "center",
                    transition: "all 0.2s ease",
                    "&:hover": { transform: "translateY(-3px)", borderColor: themeConfig.info },
                  }}
                >
                  <Avatar sx={{ bgcolor: themeConfig.infoBg, color: themeConfig.info, mx: "auto", mb: 1.2, width: 44, height: 44 }}>
                    <Email fontSize="small" />
                  </Avatar>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                    Official Billing Email
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 1.5 }}>
                    {supportContact.email}
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    fullWidth
                    href={`mailto:${supportContact.email}?subject=${encodeURIComponent(
                      `Subscription Renewal Request - ${hotel.name || "Hotel"}`
                    )}`}
                    sx={{ borderRadius: "10px", fontWeight: 700, fontSize: "0.75rem" }}
                  >
                    Send Email
                  </Button>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Quick Action Buttons */}
          <Box sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
            <Button
              variant="contained"
              className="btn-3d"
              startIcon={<HourglassBottom />}
              onClick={() => setTrialDialogOpen(true)}
              sx={{
                background: `linear-gradient(135deg, ${themeConfig.accent || "#D97706"} 0%, #B45309 100%)`,
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "0.88rem",
                px: 3.5,
                py: 1.2,
                borderRadius: "14px",
                boxShadow: "0 6px 18px rgba(217, 119, 6, 0.3)",
              }}
            >
              Request Free Trial Extension ⚡
            </Button>

            <Button
              variant="contained"
              className="btn-3d"
              startIcon={<WorkspacePremium />}
              onClick={() => handleOpenUpgrade("Priority Commercial Plan")}
              sx={{
                background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                color: "#FFFFFF",
                fontWeight: 800,
                fontSize: "0.88rem",
                px: 3.5,
                py: 1.2,
                borderRadius: "14px",
                boxShadow: `0 6px 18px ${themeConfig.primaryGlow}`,
              }}
            >
              Request Instant Callback & Plan Activation
            </Button>
          </Box>
        </Box>
      </Card>

      {/* QUICK ASSISTANCE MODAL */}
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
              Support Request Dispatched!
            </Typography>
            <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
              Our Super Admin operations team has received your urgent request for <strong>{typeof selectedPlan === "object" ? selectedPlan?.name : selectedPlan}</strong>. We will contact you shortly on <strong>{helpForm.phone}</strong>.
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
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 2.5 }}>
                Submit your contact details and our team will get your hotel back online immediately.
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.6, display: "block" }}>
                    Hotel Name
                  </Typography>
                  <TextField fullWidth size="small" value={hotel.name || "My Hotel"} disabled sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }} />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.6, display: "block" }}>
                    Contact Person *
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
                    Requirement / Message
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
                Submit Request
              </Button>
            </DialogActions>
          </form>
        )}
      </Dialog>
    </Box>
  );
}
