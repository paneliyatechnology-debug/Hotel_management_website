"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  IconButton,
  InputAdornment,
  Alert,
  CircularProgress,
  Chip,
} from "@mui/material";
import {
  Lock as LockIcon,
  Visibility,
  VisibilityOff,
  CheckCircle as CheckCircleIcon,
  ArrowBack as ArrowBackIcon,
  Key as KeyIcon,
  VpnKey as VpnKeyIcon,
} from "@mui/icons-material";
import { API_ENDPOINTS, apiRequest } from "@/config/api";
import { toast } from "react-toastify";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    // 1. Try searchParams ?token=...
    const qToken = searchParams?.get("token") || searchParams?.get("resetToken");
    if (qToken) {
      setToken(qToken);
      return;
    }

    // 2. Fallback: Parse from window.location if SSR hydration missed it
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const urlToken = urlParams.get("token") || urlParams.get("resetToken");
      if (urlToken) {
        setToken(urlToken);
        return;
      }

      // 3. Fallback: Check pathname e.g. /reset-password/<token>
      const pathParts = window.location.pathname.split("/").filter(Boolean);
      if (pathParts.length >= 2 && pathParts[0] === "reset-password") {
        setToken(pathParts[1]);
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMsg("");

    const trimmedToken = (token || "").trim();
    if (!trimmedToken) {
      setError("Reset token is missing. Please open the link received in your email or paste the token.");
      return;
    }

    if (!password || password.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    try {
      // User payload requirement:
      // { "token": "{{resetToken}}", "password": "..." }
      const res = await apiRequest(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        method: "POST",
        body: {
          token: trimmedToken,
          password: password,
        },
      });

      const successText = res?.message || "Password reset successfully! Redirecting to login...";
      toast.success(successText);
      setSuccessMsg(successText);

      // Redirect to login page after brief pause
      setTimeout(() => {
        router.push("/login");
      }, 1500);
    } catch (err) {
      const errMsg = err?.message || "Failed to reset password. The link may have expired.";
      toast.error(errMsg);
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0A1F1C 0%, #0F2F2B 50%, #061714 100%)",
        p: { xs: 2, sm: 3 },
      }}
    >
      <Card
        sx={{
          maxWidth: 440,
          width: "100%",
          borderRadius: "24px",
          bgcolor: "#FFFFFF",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.1)",
          overflow: "hidden",
        }}
      >
        {/* Top Accent Gradient Bar */}
        <Box sx={{ height: 6, background: "linear-gradient(90deg, #0F766E, #14B8A6, #C5A059)" }} />

        <CardContent sx={{ p: { xs: 3, sm: 4.5 } }}>
          {/* Header Icon */}
          <Box
            sx={{
              width: 56,
              height: 56,
              borderRadius: "16px",
              bgcolor: "rgba(15, 118, 110, 0.1)",
              color: "#0F766E",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              mx: "auto",
              mb: 2,
            }}
          >
            <KeyIcon sx={{ fontSize: 30 }} />
          </Box>

          <Typography
            variant="h5"
            sx={{
              fontWeight: 900,
              textAlign: "center",
              color: "#0F172A",
              fontFamily: "var(--font-playfair), serif",
              mb: 0.8,
            }}
          >
            Set New Password
          </Typography>

          <Typography variant="body2" sx={{ textAlign: "center", color: "#64748B", fontSize: "0.85rem", mb: 3 }}>
            Create your new permanent password below to restore access to your account.
          </Typography>

          {/* Token Indicator */}
          {token ? (
            <Box sx={{ display: "flex", justifyContent: "center", mb: 2.5 }}>
              <Chip
                icon={<CheckCircleIcon sx={{ fontSize: "16px !important", color: "#059669 !important" }} />}
                label="Reset Token Verified"
                size="small"
                sx={{
                  bgcolor: "rgba(16, 185, 129, 0.12)",
                  color: "#059669",
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  borderRadius: "8px",
                  px: 0.5,
                }}
              />
            </Box>
          ) : (
            <Alert severity="warning" sx={{ mb: 2.5, borderRadius: "12px", fontSize: "0.8rem" }}>
              No reset token detected in the link. Please paste the token manually or click the link in your email.
            </Alert>
          )}

          {/* Success Message */}
          {successMsg && (
            <Alert
              severity="success"
              icon={<CheckCircleIcon fontSize="inherit" />}
              sx={{ mb: 2.5, borderRadius: "12px", fontWeight: 700 }}
            >
              {successMsg}
            </Alert>
          )}

          {/* Error Message */}
          {error && (
            <Alert severity="error" sx={{ mb: 2.5, borderRadius: "12px", fontSize: "0.82rem" }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            {/* Manual token input only if token was missing from URL */}
            {!searchParams?.get("token") && !token && (
              <TextField
                label="Reset Token"
                fullWidth
                required
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="Paste token from email"
                sx={{ mb: 2 }}
                slotProps={{
                  input: {
                    startAdornment: (
                      <InputAdornment position="start">
                        <VpnKeyIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            )}

            {/* New Password */}
            <TextField
              label="New Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 characters"
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
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                        {showPassword ? <VisibilityOff sx={{ fontSize: 18 }} /> : <Visibility sx={{ fontSize: 18 }} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />

            {/* Confirm New Password */}
            <TextField
              label="Confirm New Password"
              type={showConfirmPassword ? "text" : "password"}
              fullWidth
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter new password"
              sx={{ mb: 2.5 }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LockIcon sx={{ color: "#94a3b8", fontSize: 20 }} />
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

            {/* Submit Button */}
            <Button
              type="submit"
              variant="contained"
              fullWidth
              disabled={loading || Boolean(successMsg)}
              sx={{
                py: 1.4,
                borderRadius: "12px",
                fontWeight: 900,
                fontSize: "0.92rem",
                bgcolor: "#0F766E",
                "&:hover": { bgcolor: "#115E59" },
                textTransform: "none",
                boxShadow: "0 4px 14px rgba(15, 118, 110, 0.35)",
              }}
            >
              {loading ? <CircularProgress size={22} color="inherit" /> : "Reset Password"}
            </Button>

            {/* Back to Login Link */}
            <Box sx={{ textAlign: "center", mt: 3 }}>
              <Link
                href="/login"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  color: "#64748B",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  textDecoration: "none",
                }}
              >
                <ArrowBackIcon sx={{ fontSize: 16 }} /> Back to Sign In
              </Link>
            </Box>
          </form>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "#0A1F1C",
          }}
        >
          <CircularProgress sx={{ color: "#0F766E" }} />
        </Box>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
