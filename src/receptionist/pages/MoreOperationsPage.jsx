"use client";

import {
  Box,
  Card,
  Typography,
  Avatar,
  Chip,
  Divider,
} from "@mui/material";
import {
  Person,
  Email,
  Phone,
  Business,
  Badge,
  Schedule,
  CheckCircle,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";

export default function MoreOperationsPage({ user, hotelSettings, onLogout }) {
  const { themeConfig, isDarkMode } = useAppTheme();


  const userName = user?.fullName || user?.name || "Front Desk Receptionist";
  const userEmail = user?.email || "reception@hotel.com";
  const userPhone = user?.phone || user?.mobile || "+91 (Not Provided)";
  const userRole = user?.role || "RECEPTIONIST";
  const hotelName = user?.hotel?.name || "Premium Hotel Property";
  const hotelAddress = user?.hotel?.address || "Front Desk Operations";
  const checkInTime = hotelSettings?.checkInTime || user?.hotel?.settings?.checkInTime || "14:00";
  const checkOutTime = hotelSettings?.checkOutTime || user?.hotel?.settings?.checkOutTime || "12:00";

  const roleLabel = String(userRole).replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2.5, sm: 3.5 }, maxWidth: 980, mx: "auto", display: "flex", flexDirection: "column", gap: 3 }}>

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
                label={roleLabel}
                size="small"
                sx={{
                  bgcolor: themeConfig.champagne,
                  color: isDarkMode ? "#FFFFFF" : themeConfig.primaryDark,
                  fontWeight: 800,
                  fontSize: "0.75rem",
                  border: `1px solid ${themeConfig.border}`,
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
            gap: 2.5,
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
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 0.6 }}>
              <Chip label={`Check-in ${checkInTime}`} size="small" sx={{ fontWeight: 800, bgcolor: "rgba(16,185,129,0.12)", color: "#059669" }} />
              <Chip label={`Check-out ${checkOutTime}`} size="small" sx={{ fontWeight: 800, bgcolor: "rgba(11,142,224,0.12)", color: "#0284C7" }} />
            </Box>
          </Box>
        </Box>
      </Card>


    </Box>
  );
}
