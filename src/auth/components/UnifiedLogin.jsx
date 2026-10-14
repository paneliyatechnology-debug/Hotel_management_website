"use client";

import { useState, useRef, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  Chip,
  InputAdornment,
  IconButton,
} from "@mui/material";
import {
  Hotel as HotelIcon,
  Email as EmailIcon,
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  Key as KeyIcon,
} from "@/shared/icons";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { toast } from "@/shared/utils/toast";
import { setAuthCookies, clearAuthCookies } from "@/shared/utils/cookieAuth";

export default function UnifiedLogin({ onLoginSuccess }) {
  const { themeConfig } = useAppTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Forgot Password Dialog State (3-Step Flow: Email -> 6-Box OTP -> New Password)
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotStep, setForgotStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotOtp, setForgotOtp] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const otpInputRefs = useRef([]);
  const [forgotNewPassword, setForgotNewPassword] = useState("");
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState("");
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [showForgotConfirmPass, setShowForgotConfirmPass] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMsg, setForgotMsg] = useState("");
  const [forgotError, setForgotError] = useState("");

  // OTP 6-box Handlers with Copy-Paste & Navigation
  const handleOtpDigitChange = (index, value) => {
    const cleanVal = value.replace(/\D/g, "");
    const newDigits = [...otpDigits];

    if (cleanVal.length > 1) {
      const pasted = cleanVal.slice(0, 6).split("");
      pasted.forEach((d, i) => {
        if (i < 6) newDigits[i] = d;
      });
      setOtpDigits(newDigits);
      setForgotOtp(newDigits.join(""));
      const nextIdx = Math.min(pasted.length, 5);
      otpInputRefs.current[nextIdx]?.focus();
      return;
    }

    newDigits[index] = cleanVal;
    setOtpDigits(newDigits);
    setForgotOtp(newDigits.join(""));

    if (cleanVal && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpDigits[index] && index > 0) {
        const newDigits = [...otpDigits];
        newDigits[index - 1] = "";
        setOtpDigits(newDigits);
        setForgotOtp(newDigits.join(""));
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === "ArrowLeft" && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const clipboardText = (e.clipboardData || window.clipboardData)?.getData("text") || "";
    const pastedData = clipboardText.replace(/\D/g, "").slice(0, 6);
    if (!pastedData) return;

    const newDigits = ["", "", "", "", "", ""];
    pastedData.split("").forEach((digit, i) => {
      if (i < 6) newDigits[i] = digit;
    });
    setOtpDigits(newDigits);
    setForgotOtp(newDigits.join(""));

    const nextFocus = Math.min(pastedData.length, 5);
    otpInputRefs.current[nextFocus]?.focus();
  };

  // Auto-focus first OTP box when entering Step 2
  useEffect(() => {
    if (forgotStep === 2) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 150);
    }
  }, [forgotStep]);

  // Force Change Password Dialog State (for mustChangePassword)
  const [changePassOpen, setChangePassOpen] = useState(false);
  const [tempUser, setTempUser] = useState(null);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [changeLoading, setChangeLoading] = useState(false);
  const [changeError, setChangeError] = useState("");
  const [loginSuccessMsg, setLoginSuccessMsg] = useState("");

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setError("");
    setLoginSuccessMsg("");

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiRequest(API_ENDPOINTS.AUTH.LOGIN, {
        method: "POST",
        body: { email, password },
      });

      if (res.success && res.data) {
        const token = res.accessToken || res.token || res.data?.accessToken || res.data?.token;
        const refreshToken = res.refreshToken || res.data?.refreshToken;
        const user = res.data?.user || (res.data?.role ? res.data : null);

        if (token) {
          localStorage.setItem("token", token);
        }

        if (refreshToken) {
          localStorage.setItem("refreshToken", refreshToken);
        }

        if (user) {
          if (user.role === "SUPER_ADMIN") {
            localStorage.removeItem("token");
            localStorage.removeItem("refreshToken");
            localStorage.removeItem("user");
            clearAuthCookies();
            const errStr = "Access Denied. Super Admin accounts must log in through the Super Admin Portal.";
            toast.error(errStr);
            setError(errStr);
            setLoading(false);
            return;
          }

          localStorage.setItem("user", JSON.stringify(user));
          setAuthCookies({ accessToken: token, refreshToken, user });

          if (user.mustChangePassword) {
            setTempUser(user);
            setChangePassOpen(true);
          } else {
            toast.success(`Welcome back, ${user.name || "User"}!`);
            onLoginSuccess(user);
          }
        } else {
          throw new Error("Unable to read user profile from server response.");
        }
      } else {
        throw new Error(res.message || "Invalid credentials.");
      }
    } catch (err) {
      toast.error(err.message || "Invalid credentials or account suspended.");
      setError(err.message || "Invalid credentials or account suspended.");
    } finally {
      setLoading(false);
    }
  };

  // Request Password Reset Link via Email
  const handleSendOtp = async () => {
    setForgotError("");
    setForgotMsg("");

    const emailTrimmed = (forgotEmail || "").trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailTrimmed || !emailRegex.test(emailTrimmed)) {
      setForgotError("Please enter a valid registered email address format (e.g. name@example.com).");
      return;
    }

    setForgotLoading(true);

    try {
      const res = await apiRequest(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: "POST",
        body: { email: emailTrimmed },
      });

      const msg = res?.message || "A password reset link has been sent to your email. Please check your inbox or spam folder.";
      toast.success(msg);
      setLoginSuccessMsg(msg);
      setForgotOpen(false);
      setForgotEmail("");
      setForgotError("");
      setForgotMsg("");
      setForgotStep(1);
    } catch (err) {
      toast.error(err.message || "Could not process password reset request.");
      setForgotError(err.message || "Could not process password reset request.");
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 2: Verify 6-digit OTP
  const handleVerifyOtp = async () => {
    setForgotError("");
    setForgotMsg("");

    const otpTrimmed = (forgotOtp || "").trim();
    if (!otpTrimmed || otpTrimmed.length !== 6) {
      setForgotError("Please enter the complete 6-digit OTP code received in your email.");
      return;
    }

    setForgotLoading(true);

    try {
      const res = await apiRequest(API_ENDPOINTS.AUTH.VERIFY_OTP, {
        method: "POST",
        body: {
          email: (forgotEmail || "").trim().toLowerCase(),
          otp: otpTrimmed,
        },
      });

      setForgotMsg(res?.message || "OTP verified successfully! Now create your new password.");
      setForgotStep(3);
    } catch (err) {
      const is404 =
        err?.status === 404 ||
        (err?.message &&
          (err.message.includes("404") ||
            err.message.includes("Cannot POST") ||
            err.message.includes("Not Found") ||
            err.message.includes("not found")));

      if (is404) {
        // Fallback: Proceed directly to Step 3 where reset-password validates OTP & sets password
        setForgotMsg("OTP code received. Please set your new permanent password below:");
        setForgotStep(3);
      } else {
        setForgotError(err?.message || "Invalid or expired OTP code. Please check or request a new OTP.");
      }
    } finally {
      setForgotLoading(false);
    }
  };

  // Step 3: Set New Password & Submit
  const handleResetWithOtp = async () => {
    setForgotError("");
    setForgotMsg("");

    if (!forgotNewPassword || forgotNewPassword.length < 6) {
      setForgotError("New password must be at least 6 characters long.");
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setForgotError("New passwords do not match. Please re-enter.");
      return;
    }

    setForgotLoading(true);

    try {
      const res = await apiRequest(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        method: "POST",
        body: {
          email: (forgotEmail || "").trim().toLowerCase(),
          otp: (forgotOtp || "").trim(),
          newPassword: forgotNewPassword,
        },
      });

      setForgotMsg(res.message || "Password reset successfully!");
      setLoginSuccessMsg("Password reset successfully! You can now sign in with your new password.");
      setEmail(forgotEmail);
      setPassword(forgotNewPassword);

      setTimeout(() => {
        setForgotOpen(false);
        setForgotStep(1);
        setForgotOtp("");
        setForgotNewPassword("");
        setForgotConfirmPassword("");
      }, 1500);
    } catch (err) {
      setForgotError(err.message || "Failed to update password. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setChangeError("");

    if (!newPassword || newPassword.length < 6) {
      setChangeError("New password must be at least 6 characters long.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setChangeError("Passwords do not match.");
      return;
    }

    setChangeLoading(true);

    try {
      await apiRequest(API_ENDPOINTS.AUTH.CHANGE_PASSWORD, {
        method: "PUT",
        body: {
          currentPassword: password,
          newPassword,
        },
      });

      setChangePassOpen(false);
      const updatedUser = { ...tempUser, mustChangePassword: false };
      localStorage.setItem("user", JSON.stringify(updatedUser));
      onLoginSuccess(updatedUser);
    } catch (err) {
      setChangeError(err.message || "Failed to update password.");
    } finally {
      setChangeLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: themeConfig.bgMain,
        p: 3,
      }}
    >
      <Card
        sx={{
          maxWidth: 460,
          width: "100%",
          p: 1,
          borderRadius: 0,
          bgcolor: themeConfig.bgCard || "#ffffff",
          borderColor: themeConfig.border,
          boxShadow: "0 10px 30px rgba(0,0,0,0.06)",
        }}
      >
        <CardContent sx={{ p: { xs: 3, sm: 4 } }}>
          {/* Header */}
          <Box sx={{ textAlign: "center", mb: 4 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="MYOWNPMS Logo"
              sx={{
                width: 64,
                height: 64,
                objectFit: "contain",
                borderRadius: "14px",
                mb: 1.5,
                boxShadow: "0 6px 16px rgba(0,0,0,0.08)",
              }}
            />
            <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5 }}>
              MYOWNPMS Portal
            </Typography>
            <Typography variant="body2" sx={{ color: themeConfig.textMuted, mt: 0.5 }}>
              Universal Sign-In for Super Admin, Hotel Admin & Receptionists
            </Typography>
          </Box>

          {/* Success Banner */}
          {loginSuccessMsg && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 0 }}>
              {loginSuccessMsg}
            </Alert>
          )}

          {/* Error Banner */}
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 0 }}>
              {error}
            </Alert>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin}>
            <TextField
              label="Enter your email"
              placeholder="Enter your email"
              type="email"
              fullWidth
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{ mb: 2.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Enter your password"
              placeholder="Enter your password"
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{ mb: 1.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Forgot Password Link */}
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 3 }}>
              <Button
                variant="text"
                size="small"
                onClick={() => {
                  setForgotEmail(email);
                  setForgotStep(1);
                  setForgotOtp("");
                  setForgotNewPassword("");
                  setForgotConfirmPassword("");
                  setForgotMsg("");
                  setForgotError("");
                  setForgotOpen(true);
                }}
                sx={{ color: themeConfig.primary, fontSize: "0.8rem", p: 0 }}
              >
                Forgot Password?
              </Button>
            </Box>

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={loading}
              sx={{
                bgcolor: themeConfig.primary,
                "&:hover": { bgcolor: themeConfig.primaryDark },
                py: 1.4,
                fontSize: "0.95rem",
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Sign In to Dashboard"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Forgot Password Dialog */}
      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle component="div" sx={{ fontWeight: 800, display: "flex", alignItems: "center", gap: 1 }}>
          <KeyIcon sx={{ color: themeConfig.primary }} />
          Reset Password
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 2 }}>
              Enter your registered email address. We will send a password reset link directly to your email inbox.
            </Typography>

            {forgotError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {forgotError}
              </Alert>
            )}

            <TextField
              autoFocus
              label="Registered Email Address"
              type="email"
              fullWidth
              required
              value={forgotEmail}
              onChange={(e) => setForgotEmail(e.target.value)}
              placeholder="e.g. admin@grandroyale.com"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <EmailIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2.5, pt: 1 }}>
          <Button onClick={() => setForgotOpen(false)} color="inherit" sx={{ fontWeight: 700 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSendOtp}
            variant="contained"
            disabled={forgotLoading}
            sx={{ bgcolor: themeConfig.primary, "&:hover": { bgcolor: themeConfig.primaryDark }, fontWeight: 800, textTransform: "none", px: 2.5 }}
          >
            {forgotLoading ? <CircularProgress size={20} color="inherit" /> : "Send Reset Link"}
          </Button>
        </DialogActions>
      </Dialog>


      {/* Force Change Password Dialog for First-Time Login */}
      <Dialog
        open={changePassOpen}
        onClose={(event, reason) => {
          if (reason !== "backdropClick" && reason !== "escapeKeyDown") {
            setChangePassOpen(false);
          }
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle component="div" sx={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 1 }}>
          <KeyIcon sx={{ color: themeConfig.primary }} />
          First-Time Password Update
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 2 }}>
            For account security, please create a new permanent password before accessing your dashboard.
          </Typography>

          {changeError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {changeError}
            </Alert>
          )}

          <TextField
            label="New Password"
            type={showNewPassword ? "text" : "password"}
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            sx={{ mb: 2 }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <TextField
            label="Confirm New Password"
            type={showConfirmPassword ? "text" : "password"}
            fullWidth
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)} edge="end">
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            fullWidth
            disabled={changeLoading}
            sx={{ bgcolor: themeConfig.primary, "&:hover": { bgcolor: themeConfig.primaryDark } }}
          >
            {changeLoading ? <CircularProgress size={20} color="inherit" /> : "Save New Password"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
