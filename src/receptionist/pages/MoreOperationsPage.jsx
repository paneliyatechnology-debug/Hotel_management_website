"use client";

import { useState } from "react";
import {
  Box,
  Card,
  Typography,
  Avatar,
  Chip,
  Button,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from "@mui/material";
import {
  Person,
  Email,
  Phone,
  Business,
  Badge,
  Schedule,
  Security,
  Logout,
  CheckCircle,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";

export default function MoreOperationsPage({ user, hotelSettings, onLogout }) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const handleConfirmLogout = () => {
    setLogoutDialogOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch (e) {
        console.error(e);
      }
      window.location.href = "/";
    }
  };

  const userName = user?.fullName || user?.name || "Front Desk Receptionist";
  const userEmail = user?.email || "reception@hotel.com";
  const userPhone = user?.phone || user?.mobile || "+91 (Not Provided)";
  const userRole = user?.role || "RECEPTIONIST";
  const hotelName = user?.hotel?.name || "Premium Hotel Property";
  const hotelAddress = user?.hotel?.address || "Front Desk Operations";
  const checkInTime = hotelSettings?.checkInTime || user?.hotel?.settings?.checkInTime || "14:00";
  const checkOutTime = hotelSettings?.checkOutTime || user?.hotel?.settings?.checkOutTime || "12:00";

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, maxWidth: 900, mx: "auto" }}>
      {/* Profile Overview Hero Card */}
      <Card
        className="card-3d"
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: "24px",
          border: `1px solid ${themeConfig.border}`,
          background: isDarkMode
            ? `linear-gradient(135deg, ${themeConfig.bgCard} 0%, rgba(255, 255, 255, 0.02) 100%)`
            : "linear-gradient(135deg, #FFFFFF 0%, #F9FBFC 100%)",
          bgcolor: themeConfig.bgCard,
          boxShadow: isDarkMode
            ? "0 10px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
            : "0 10px 30px rgba(12, 39, 59, 0.06), inset 0 1px 1px #FFFFFF",
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            alignItems: { xs: "center", sm: "flex-start" },
            textAlign: { xs: "center", sm: "left" },
            gap: 2.5,
          }}
        >
          {/* Avatar with gradient border */}
          <Box
            sx={{
              p: 0.5,
              borderRadius: "50%",
              background: `linear-gradient(135deg, ${themeConfig.primary}, ${themeConfig.champagne})`,
              boxShadow: `0 6px 20px ${themeConfig.primaryGlow}`,
            }}
          >
            <Avatar
              sx={{
                width: { xs: 76, sm: 84 },
                height: { xs: 76, sm: 84 },
                bgcolor: themeConfig.primary,
                color: "#FFFFFF",
                fontSize: "2rem",
                fontWeight: 900,
              }}
            >
              {userName.charAt(0).toUpperCase()}
            </Avatar>
          </Box>

          {/* User Details */}
          <Box sx={{ flex: 1 }}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "center", sm: "flex-start" },
                gap: 1.2,
                flexWrap: "wrap",
                mb: 0.5,
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 900,
                  color: themeConfig.textMain,
                  letterSpacing: -0.5,
                }}
              >
                {userName}
              </Typography>
              <Chip
                icon={<CheckCircle sx={{ fontSize: "14px !important", color: "#10B981 !important" }} />}
                label="Active Shift"
                size="small"
                sx={{
                  bgcolor: isDarkMode ? "rgba(16, 185, 129, 0.16)" : "#ECFDF5",
                  color: isDarkMode ? "#34D399" : "#065F46",
                  fontWeight: 800,
                  fontSize: "0.72rem",
                  border: isDarkMode ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid #A7F3D0",
                  height: 24,
                }}
              />
            </Box>

            <Typography
              variant="body2"
              sx={{
                color: themeConfig.textMuted,
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                justifyContent: { xs: "center", sm: "flex-start" },
                gap: 0.8,
                mb: 1.5,
              }}
            >
              <Business sx={{ fontSize: 16, color: themeConfig.primary }} />
              {hotelName}
            </Typography>

            <Box
              sx={{
                display: "flex",
                flexWrap: "wrap",
                gap: 1,
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
            >
              <Chip
                icon={<Badge sx={{ fontSize: "14px !important", color: `${themeConfig.primary} !important` }} />}
                label={`Role: ${userRole}`}
                size="small"
                sx={{
                  bgcolor: themeConfig.champagne,
                  color: isDarkMode ? "#FFFFFF" : themeConfig.primaryDark,
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  border: `1px solid ${themeConfig.border}`,
                }}
              />
              <Chip
                icon={<Security sx={{ fontSize: "14px !important", color: isDarkMode ? "#60A5FA !important" : "#2563EB !important" }} />}
                label="Front Desk Verified"
                size="small"
                sx={{
                  bgcolor: isDarkMode ? "rgba(59, 130, 246, 0.16)" : "#EFF6FF",
                  color: isDarkMode ? "#60A5FA" : "#1E40AF",
                  fontWeight: 700,
                  fontSize: "0.75rem",
                  border: isDarkMode ? "1px solid rgba(96, 165, 250, 0.3)" : "1px solid #BFDBFE",
                }}
              />
            </Box>
          </Box>
        </Box>
      </Card>

      {/* Profile Details Information Grid */}
      <Card
        className="card-3d"
        sx={{
          p: { xs: 2.5, sm: 3.5 },
          borderRadius: "24px",
          border: `1px solid ${themeConfig.border}`,
          background: themeConfig.bgCard,
          bgcolor: themeConfig.bgCard,
          boxShadow: isDarkMode
            ? "0 10px 30px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.05)"
            : "0 8px 24px rgba(12, 39, 59, 0.05)",
          mb: 3,
        }}
      >
        <Typography
          variant="subtitle1"
          sx={{
            fontWeight: 800,
            color: themeConfig.textMain,
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <Person sx={{ fontSize: 20, color: themeConfig.primary }} />
          Account & Hotel Information
        </Typography>

        <Divider sx={{ mb: 2.5, borderColor: themeConfig.border }} />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
            gap: 2,
          }}
        >
          {/* Email */}
          <Box
            sx={{
              p: 2,
              borderRadius: "14px",
              bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#F8FAFC",
              border: `1px solid ${themeConfig.border}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: themeConfig.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                mb: 0.5,
              }}
            >
              <Email sx={{ fontSize: 15, color: themeConfig.primary }} />
              Email Address
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
              {userEmail}
            </Typography>
          </Box>

          {/* Phone */}
          <Box
            sx={{
              p: 2,
              borderRadius: "14px",
              bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#F8FAFC",
              border: `1px solid ${themeConfig.border}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: themeConfig.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                mb: 0.5,
              }}
            >
              <Phone sx={{ fontSize: 15, color: themeConfig.primary }} />
              Contact Phone
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
              {userPhone}
            </Typography>
          </Box>

          {/* Hotel Location */}
          <Box
            sx={{
              p: 2,
              borderRadius: "14px",
              bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#F8FAFC",
              border: `1px solid ${themeConfig.border}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: themeConfig.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                mb: 0.5,
              }}
            >
              <Business sx={{ fontSize: 15, color: themeConfig.primary }} />
              Hotel Property
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
              {hotelName}
            </Typography>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
              {hotelAddress}
            </Typography>
          </Box>

          {/* Operating Hours */}
          <Box
            sx={{
              p: 2,
              borderRadius: "14px",
              bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.03)" : "#F8FAFC",
              border: `1px solid ${themeConfig.border}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                fontWeight: 700,
                color: themeConfig.textMuted,
                display: "flex",
                alignItems: "center",
                gap: 0.8,
                mb: 0.5,
              }}
            >
              <Schedule sx={{ fontSize: 15, color: themeConfig.primary }} />
              Check-In / Out Policy
            </Typography>
            <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
              Check-In: {checkInTime} | Check-Out: {checkOutTime}
            </Typography>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
              Standard property front desk schedule
            </Typography>
          </Box>
        </Box>
      </Card>

      {/* Logout Action Section */}
      <Card
        className="card-3d"
        sx={{
          p: { xs: 2.5, sm: 3 },
          borderRadius: "24px",
          border: isDarkMode ? "1px solid rgba(239, 68, 68, 0.35)" : "1px solid rgba(239, 68, 68, 0.2)",
          background: isDarkMode
            ? "linear-gradient(135deg, rgba(239, 68, 68, 0.15) 0%, rgba(239, 68, 68, 0.04) 100%)"
            : "linear-gradient(135deg, #FFF5F5 0%, #FFFFFF 100%)",
          bgcolor: themeConfig.bgCard,
          boxShadow: isDarkMode
            ? "0 10px 30px rgba(0, 0, 0, 0.45)"
            : "0 8px 24px rgba(239, 68, 68, 0.05)",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 800,
              color: "#DC2626",
              display: "flex",
              alignItems: "center",
              gap: 1,
            }}
          >
            <Logout sx={{ fontSize: 20, color: "#DC2626" }} />
            Account Session & Sign Out
          </Typography>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted, mt: 0.3 }}>
            End your current receptionist session safely and log out of the system.
          </Typography>
        </Box>

        <Button
          variant="contained"
          color="error"
          onClick={() => setLogoutDialogOpen(true)}
          startIcon={<Logout />}
          sx={{
            fontWeight: 800,
            textTransform: "none",
            borderRadius: "12px",
            px: 3,
            py: 1.2,
            boxShadow: "0 4px 14px rgba(220, 38, 38, 0.25)",
            "&:hover": {
              bgcolor: "#B91C1C",
              boxShadow: "0 6px 20px rgba(220, 38, 38, 0.35)",
            },
          }}
        >
          Sign Out / Logout
        </Button>
      </Card>

      {/* Confirmation Dialog */}
      <Dialog
        open={logoutDialogOpen}
        onClose={() => setLogoutDialogOpen(false)}
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              p: 1.5,
              border: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard,
              maxWidth: 420,
            },
          },
        }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 900, color: themeConfig.textMain, pb: 1 }}>
          Confirm Sign Out
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ color: themeConfig.textMuted, fontSize: "0.95rem" }}>
            Are you sure you want to end your receptionist session and sign out from{" "}
            <strong style={{ color: themeConfig.textMain }}>{hotelName}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, pt: 1, gap: 1 }}>
          <Button
            onClick={() => setLogoutDialogOpen(false)}
            sx={{
              fontWeight: 700,
              color: themeConfig.textMuted,
              textTransform: "none",
              borderRadius: "10px",
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleConfirmLogout}
            sx={{
              fontWeight: 800,
              textTransform: "none",
              borderRadius: "10px",
              px: 2.5,
            }}
          >
            Yes, Log Out
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
