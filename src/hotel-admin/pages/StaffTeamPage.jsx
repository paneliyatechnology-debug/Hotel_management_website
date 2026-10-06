"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Avatar,
  IconButton,
  Tooltip,
  MenuItem,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Divider,
  Card,
  CardContent,
  Switch,
} from "@mui/material";
import {
  Search,
  Add,
  Edit,
  Delete,
  Visibility,
  Phone,
  Badge as IdBadge,
  Close,
  People,
  AutoAwesome,
  Security,
  Work,
  AccessTime,
  CurrencyRupee,
  Email,
  Lock,
  AdminPanelSettings,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { usePresence } from "@/shared/context/SocketContext";
import PresenceBadge from "@/shared/components/PresenceBadge";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";

export const HOTEL_STAFF_ROLES = [
  { value: "RECEPTIONIST", label: "Front Desk Receptionist (RECEPTIONIST)", shortLabel: "Receptionist", color: "#0B8EE0", bg: "rgba(11, 142, 224, 0.12)", border: "rgba(11, 142, 224, 0.3)" },
  { value: "MANAGER", label: "Hotel / Duty Manager (MANAGER)", shortLabel: "Manager", color: "#8E24AA", bg: "rgba(142, 36, 170, 0.12)", border: "rgba(142, 36, 170, 0.3)" },
  { value: "HOUSEKEEPING", label: "Housekeeping Staff / Lead (HOUSEKEEPING)", shortLabel: "Housekeeping", color: "#D97706", bg: "rgba(217, 119, 6, 0.12)", border: "rgba(217, 119, 6, 0.3)" },
  { value: "ACCOUNTANT", label: "Hotel Accountant / Cashier (ACCOUNTANT)", shortLabel: "Accountant", color: "#059669", bg: "rgba(5, 150, 105, 0.12)", border: "rgba(5, 150, 105, 0.3)" },
];

export function getRoleMeta(roleName) {
  const normalized = (roleName || "").toString().trim().toUpperCase();
  const found = HOTEL_STAFF_ROLES.find((r) => r.value === normalized || normalized.includes(r.value));
  if (found) return found;
  return {
    value: normalized || "RECEPTIONIST",
    label: roleName || "Receptionist",
    shortLabel: roleName || "Receptionist",
    color: "#0B8EE0",
    bg: "rgba(11, 142, 224, 0.12)",
    border: "rgba(11, 142, 224, 0.3)",
  };
}

export default function StaffTeamPage({
  staffList = [],
  staffSearch = "",
  setStaffSearch,
  staffRoleFilter = "ALL",
  setStaffRoleFilter,
  staffModal,
  setStaffModal,
  viewStaffModal,
  setViewStaffModal,
  onSaveStaff,
  onDeleteStaff,
  onToggleStaffStatus,
  getInitialStaffForm,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const { isUserOnline } = usePresence();

  const totalReceptionists = staffList.filter((s) => (s.role || "").toUpperCase().includes("RECEPTIONIST")).length;
  const totalManagers = staffList.filter((s) => (s.role || "").toUpperCase().includes("MANAGER")).length;
  const totalHousekeeping = staffList.filter((s) => (s.role || "").toUpperCase().includes("HOUSEKEEPING")).length;
  const totalAccountants = staffList.filter((s) => (s.role || "").toUpperCase().includes("ACCOUNTANT")).length;
  const totalActive = staffList.filter((s) => s.status === "ACTIVE" || !s.status).length;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const filteredStaff = staffList.filter((s) => {
    const q = (staffSearch || "").toLowerCase();
    const matchSearch =
      (s.name || "").toLowerCase().includes(q) ||
      (s.phone || "").includes(q) ||
      (s.email || "").toLowerCase().includes(q) ||
      (s.role || "").toLowerCase().includes(q) ||
      (s.shift || "").toLowerCase().includes(q);

    if (staffRoleFilter === "ALL") return matchSearch;
    return matchSearch && (s.role || "").toUpperCase().includes(staffRoleFilter.toUpperCase());
  });

  const paginatedStaff = filteredStaff.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 } }}>
      {/* ========================================================================= */}
      {/* 3D MASTER COMMAND RIBBON (Hero 3D Aesthetics with Glow & Stats)          */}
      {/* ========================================================================= */}
      <Box
        sx={{
          mb: 4,
          p: { xs: 2.5, md: 3 },
          borderRadius: "24px",
          background: `linear-gradient(135deg, ${themeConfig.primaryDark || "#0C273B"} 0%, ${themeConfig.primary || "#0B8EE0"} 100%)`,
          color: "#FFFFFF",
          boxShadow: `0 16px 36px -10px ${themeConfig.primaryGlow || "rgba(11, 142, 224, 0.4)"}, inset 0 1px 1px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.2)`,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* 3D Radial Background Glow */}
        <Box
          sx={{
            position: "absolute",
            top: "-50%",
            right: "-15%",
            width: "450px",
            height: "450px",
            background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 70%)",
            pointerEvents: "none",
          }}
        />

        <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 2, position: "relative", zIndex: 1 }}>
          <Box>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.8 }}>
              <Avatar
                sx={{
                  bgcolor: "rgba(255,255,255,0.2)",
                  color: "#FFFFFF",
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                }}
              >
                <People fontSize="small" />
              </Avatar>
              <Typography
                variant="caption"
                sx={{
                  fontWeight: 800,
                  letterSpacing: 1.2,
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.9)",
                  fontSize: "0.72rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 0.6,
                }}
              >
                <People sx={{ fontSize: 14 }} />
                Staff Hierarchy &bull; Shift Schedules &bull; Role Access
              </Typography>
            </Box>

            <Typography variant="h4" sx={{ fontWeight: 900, color: "#FFFFFF", letterSpacing: -0.5, fontSize: { xs: "1.4rem", sm: "1.8rem" } }}>
              Staff Management &amp; Team Roster
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.8)", mt: 0.5, fontSize: "0.85rem" }}>
              Onboard front desk managers, receptionists, housekeeping, and maintenance staff with shift schedules.
            </Typography>
          </Box>

          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setStaffModal({ open: true, mode: "ADD", data: getInitialStaffForm ? getInitialStaffForm() : { name: "", email: "", phone: "", role: "RECEPTIONIST", shift: "Morning (07:00 - 15:00)", status: "ACTIVE" } })}
            className="btn-3d"
            sx={{
              width: { xs: "100%", sm: "auto" },
              borderRadius: "14px",
              bgcolor: isDarkMode ? "rgba(255,255,255,0.12)" : "#FFFFFF",
              color: isDarkMode ? "#FFFFFF" : (themeConfig.primaryDark || "#0C273B"),
              fontWeight: 800,
              fontSize: "0.82rem",
              px: 2.5,
              py: 1.1,
              justifyContent: "center",
              whiteSpace: "nowrap",
              border: isDarkMode ? `1px solid ${themeConfig.border}` : "none",
              boxShadow: isDarkMode
                ? "0 6px 16px rgba(0,0,0,0.3)"
                : "0 6px 16px rgba(0,0,0,0.15), inset 0 1px 0 #FFFFFF",
              "&:hover": {
                bgcolor: isDarkMode ? "rgba(255,255,255,0.2)" : "#F8FAFC",
                transform: "translateY(-2px)",
              },
            }}
          >
            Add Staff Member
          </Button>
        </Box>
      </Box>

      {/* ========================================================================= */}
      {/* 3D SEARCH & ROLE FILTER TOOLBAR                                          */}
      {/* ========================================================================= */}
      <Paper
        className="card-3d"
        sx={{
          p: 2,
          mb: 3.5,
          borderRadius: "18px",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          border: `1.5px solid ${themeConfig.border}`,
          boxShadow: isDarkMode
            ? "0 8px 24px -4px rgba(0, 0, 0, 0.4)"
            : "0 8px 24px -4px rgba(12, 39, 59, 0.04), inset 0 1px 0 #FFFFFF",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
        }}
      >
        <TextField
          size="small"
          placeholder="Search by Staff Name, Role, Email, Shift, or Phone..."
          value={staffSearch}
          onChange={(e) => setStaffSearch(e.target.value)}
          sx={{
            width: "100%",
            minWidth: { xs: "100%", sm: 260 },
            "& .MuiOutlinedInput-root": {
              borderRadius: "12px",
              bgcolor: themeConfig.bgMain,
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.05)",
            },
          }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Search fontSize="small" sx={{ color: themeConfig.textMuted }} />
                </InputAdornment>
              ),
            },
          }}
        />

        <Box
          sx={{
            display: "flex",
            gap: 1,
            flexWrap: "nowrap",
            alignItems: "center",
            overflowX: "auto",
            WebkitOverflowScrolling: "touch",
            py: 0.5,
            width: "100%",
            maxWidth: "100%",
            "&::-webkit-scrollbar": { display: "none" },
            msOverflowStyle: "none",
            scrollbarWidth: "none",
          }}
        >
          {[
            { id: "ALL", label: `All Staff (${staffList.length})` },
            { id: "RECEPTIONIST", label: `Receptionists (${totalReceptionists})` },
            { id: "MANAGER", label: `Managers (${totalManagers})` },
            { id: "HOUSEKEEPING", label: `Housekeeping (${totalHousekeeping})` },
            { id: "ACCOUNTANT", label: `Accountants (${totalAccountants})` },
          ].map((role) => {
            const isSelected = staffRoleFilter === role.id;
            return (
              <Chip
                key={role.id}
                label={role.label}
                clickable
                onClick={() => setStaffRoleFilter(role.id)}
                sx={{
                  fontWeight: 800,
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                  px: 1.2,
                  height: 32,
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  bgcolor: isSelected ? themeConfig.primary : themeConfig.champagne,
                  color: isSelected ? "#FFFFFF" : themeConfig.primaryDark,
                  border: `1px solid ${isSelected ? themeConfig.primary : themeConfig.border}`,
                  boxShadow: isSelected ? `0 4px 10px ${themeConfig.primaryGlow}` : "none",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    bgcolor: themeConfig.primary,
                    color: "#FFFFFF",
                    transform: "translateY(-1px)",
                  },
                }}
              />
            );
          })}
        </Box>
      </Paper>

      {/* ========================================================================= */}
      {/* 3D STAFF TEAM MASTER TABLE                                               */}
      {/* ========================================================================= */}
      <TableContainer
        component={Paper}
        className="card-3d"
        sx={{
          borderRadius: "20px",
          border: `1px solid ${themeConfig.border}`,
          boxShadow: "0 10px 30px -5px rgba(12, 39, 59, 0.08), inset 0 1px 1px #FFFFFF",
          overflowX: "auto",
          overflowY: "auto",
          maxHeight: { xs: "520px", md: "calc(100vh - 280px)" },
          mb: 4,
          "&::-webkit-scrollbar": { height: "8px", width: "8px" },
          "&::-webkit-scrollbar-track": { background: "rgba(0,0,0,0.02)", borderRadius: "8px" },
          "&::-webkit-scrollbar-thumb": { background: themeConfig.border, borderRadius: "8px" },
          "&::-webkit-scrollbar-thumb:hover": { background: themeConfig.primary },
        }}
      >
        <Table stickyHeader sx={{ minWidth: 980 }}>
          <TableHead>
            <TableRow sx={{ bgcolor: themeConfig.champagne }}>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, py: 1.6, whiteSpace: "nowrap" }}>Staff Profile</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Role / Position</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Contact Phone</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Govt ID Proof</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Shift Schedule</TableCell>
              <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain, whiteSpace: "nowrap" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStaff.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ py: 6, textAlign: "center" }}>
                  <EmptyState
                    title="No Staff Members Found"
                    description={staffList.length === 0 ? "No staff profiles created yet. Click '+ Add Staff Member' to onboard your first team member." : "No staff members match your filter criteria."}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedStaff.map((staff) => (
                <TableRow
                  key={staff._id || staff.name}
                  sx={{
                    transition: "all 0.2s ease",
                    "&:hover": {
                      bgcolor: `${themeConfig.primaryGlow} !important`,
                      transform: "scale(1.001)",
                    },
                  }}
                >
                  {/* Profile & Name */}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.8 }}>
                      <Avatar
                        sx={{
                          background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                          color: "#FFFFFF",
                          fontWeight: 800,
                          width: 42,
                          height: 42,
                          borderRadius: "12px",
                          boxShadow: `0 4px 10px ${themeConfig.primaryGlow}, inset 0 1px 0 rgba(255,255,255,0.4)`,
                        }}
                      >
                        {(staff.name || "S").charAt(0).toUpperCase()}
                      </Avatar>
                      <Box>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                            {staff.name}
                          </Typography>
                          <PresenceBadge isOnline={isUserOnline(staff._id || staff.id)} size="small" />
                        </Box>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "flex", alignItems: "center", gap: 0.5 }}>
                          <Email sx={{ fontSize: 12, color: themeConfig.primary }} />
                          {staff.email}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Role Chip */}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {(() => {
                      const meta = getRoleMeta(staff.role);
                      return (
                        <Chip
                          label={meta.shortLabel || staff.role || "Receptionist"}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            borderRadius: "8px",
                            bgcolor: meta.bg || themeConfig.champagne,
                            color: meta.color || themeConfig.primaryDark,
                            border: `1px solid ${meta.border || themeConfig.border}`,
                            boxShadow: "0 2px 6px rgba(0,0,0,0.04)",
                          }}
                        />
                      );
                    })()}
                  </TableCell>

                  {/* Contact Phone */}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Phone fontSize="small" sx={{ color: themeConfig.primaryDark, fontSize: 16 }} />
                      <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                        {staff.phone}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Govt ID */}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <Security fontSize="small" sx={{ color: themeConfig.primary }} />
                      <Box>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMain, display: "block" }}>
                          {staff.idType || "Aadhaar Card"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontSize: "0.72rem" }}>
                          {staff.idNumber || "XXXX-XXXX-4512"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* Shift */}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.8 }}>
                      <AccessTime fontSize="small" sx={{ color: themeConfig.primaryDark, fontSize: 15 }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                        {staff.shift || "Morning (07:00 - 15:00)"}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* Status & Active Toggle */}
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <StatusChip status={staff.status || "ACTIVE"} size="small" />
                      {onToggleStaffStatus && (
                        <Tooltip title={staff.status === "ACTIVE" || !staff.status ? "Deactivate Staff Member" : "Activate Staff Member"}>
                          <Switch
                            size="small"
                            checked={staff.status === "ACTIVE" || !staff.status}
                            onChange={() => onToggleStaffStatus(staff)}
                            sx={{
                              "& .MuiSwitch-switchBase.Mui-checked": {
                                color: "#059669",
                              },
                              "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                                backgroundColor: "#059669",
                              },
                            }}
                          />
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>

                  {/* Actions */}
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
                      <Tooltip title="View Staff Dossier">
                        <IconButton
                          size="small"
                          onClick={() => setViewStaffModal({ open: true, staff })}
                          sx={{
                            width: 32,
                            height: 32,
                            color: themeConfig.primaryDark,
                            bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : themeConfig.champagne,
                            borderRadius: "10px",
                            border: `1px solid ${themeConfig.border}`,
                            "&:hover": {
                              borderColor: themeConfig.primary,
                              bgcolor: isDarkMode ? "rgba(255,255,255,0.12)" : "rgba(11, 142, 224, 0.12)",
                            },
                          }}
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Edit Staff Member">
                        <IconButton
                          size="small"
                          onClick={() => setStaffModal({ open: true, mode: "EDIT", data: { ...staff } })}
                          sx={{
                            width: 32,
                            height: 32,
                            color: themeConfig.info,
                            bgcolor: themeConfig.infoBg,
                            borderRadius: "10px",
                            border: `1px solid ${themeConfig.info}30`,
                            "&:hover": { bgcolor: "rgba(51, 104, 160, 0.2)" },
                          }}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>

                      <Tooltip title="Delete Staff Member">
                        <IconButton
                          size="small"
                          onClick={() => onDeleteStaff(staff)}
                          sx={{
                            width: 32,
                            height: 32,
                            color: themeConfig.danger,
                            bgcolor: themeConfig.dangerBg,
                            borderRadius: "10px",
                            border: `1px solid ${themeConfig.danger}30`,
                            "&:hover": { bgcolor: "rgba(220, 38, 38, 0.2)" },
                          }}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {filteredStaff.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredStaff.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              borderTop: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              borderRadius: "0 0 20px 20px",
              "& .MuiTablePagination-toolbar": {
                flexWrap: "wrap",
                px: { xs: 1, sm: 2 },
                justifyContent: { xs: "center", sm: "flex-end" },
                gap: 1,
              },
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
                fontWeight: 700,
                color: themeConfig.textMuted,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                m: 0,
              },
            }}
          />
        )}
      </TableContainer>

      {/* ========================================================================= */}
      {/* 3D MODAL: ADD / EDIT STAFF MEMBER                                        */}
      {/* ========================================================================= */}
      <Dialog
        open={staffModal.open}
        onClose={() => setStaffModal({ ...staffModal, open: false })}
        maxWidth="md"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "24px",
              p: 1.5,
              border: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              boxShadow: isDarkMode ? "0 20px 50px rgba(0,0,0,0.6)" : "0 20px 50px rgba(0,0,0,0.18)",
            },
          },
        }}
      >
        <form onSubmit={onSaveStaff}>
          <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography component="div" variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
              {staffModal.mode === "ADD" ? "Onboard New Staff Member" : `Edit Staff: ${staffModal.data?.name}`}
            </Typography>
            <IconButton onClick={() => setStaffModal({ ...staffModal, open: false })} sx={{ borderRadius: "10px" }}>
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ borderColor: themeConfig.border }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  Staff Full Name *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  value={staffModal.data?.name || ""}
                  onChange={(e) => setStaffModal({ ...staffModal, data: { ...staffModal.data, name: e.target.value } })}
                  placeholder="e.g. Ramesh Patel"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  Login Email *
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  type="email"
                  value={staffModal.data?.email || ""}
                  onChange={(e) => setStaffModal({ ...staffModal, data: { ...staffModal.data, email: e.target.value } })}
                  placeholder="staff@grandroyale.com"
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  Contact Phone Number * (10 Digits)
                </Typography>
                <TextField
                  fullWidth
                  size="small"
                  required
                  value={staffModal.data?.phone || ""}
                  onChange={(e) => {
                    const numericVal = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setStaffModal({ ...staffModal, data: { ...staffModal.data, phone: numericVal } });
                  }}
                  error={Boolean(staffModal.data?.phone && staffModal.data.phone.length !== 10)}
                  helperText={
                    staffModal.data?.phone && staffModal.data.phone.length !== 10
                      ? `Phone number must be exactly 10 digits (${staffModal.data.phone.length}/10)`
                      : "Enter 10-digit mobile number (e.g. 9820155667)"
                  }
                  placeholder="9820155667"
                  slotProps={{
                    htmlInput: {
                      inputMode: "numeric",
                      pattern: "[0-9]{10}",
                      maxLength: 10,
                    },
                  }}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  Assigned Operational Role *
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={staffModal.data?.role ? staffModal.data.role.toUpperCase() : "RECEPTIONIST"}
                  onChange={(e) => setStaffModal({ ...staffModal, data: { ...staffModal.data, role: e.target.value } })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                >
                  {HOTEL_STAFF_ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: r.color, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {r.label}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 0.8, display: "block" }}>
                  Duty Shift Roster
                </Typography>
                <TextField
                  select
                  fullWidth
                  size="small"
                  value={staffModal.data?.shift || "Morning (07:00 - 15:00)"}
                  onChange={(e) => setStaffModal({ ...staffModal, data: { ...staffModal.data, shift: e.target.value } })}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px" } }}
                >
                  <MenuItem value="Morning (07:00 - 15:00)">Morning Shift (07:00 AM - 03:00 PM)</MenuItem>
                  <MenuItem value="Evening (15:00 - 23:00)">Evening Shift (03:00 PM - 11:00 PM)</MenuItem>
                  <MenuItem value="Night (23:00 - 07:00)">Night Shift (11:00 PM - 07:00 AM)</MenuItem>
                  <MenuItem value="General (09:00 - 18:00)">General Shift (09:00 AM - 06:00 PM)</MenuItem>
                </TextField>
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 2.5, flexDirection: { xs: "column-reverse", sm: "row" }, gap: 1.5 }}>
            <Button onClick={() => setStaffModal({ ...staffModal, open: false })} sx={{ width: { xs: "100%", sm: "auto" }, borderRadius: "10px", fontWeight: 700 }}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              className="btn-3d"
              sx={{
                width: { xs: "100%", sm: "auto" },
                background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                color: "#FFFFFF",
                fontWeight: 800,
                borderRadius: "12px",
                px: 3,
                justifyContent: "center",
                boxShadow: `0 4px 14px ${themeConfig.primaryGlow}`,
              }}
            >
              {staffModal.mode === "ADD" ? "Onboard Staff" : "Save Changes"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* ========================================================================= */}
      {/* 3D MODAL: VIEW STAFF DOSSIER & SECURITY PROFILE                          */}
      {/* ========================================================================= */}
      <Dialog
        open={viewStaffModal.open}
        onClose={() => setViewStaffModal({ open: false, staff: null })}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "24px",
              p: 0,
              border: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              boxShadow: isDarkMode ? "0 20px 50px rgba(0,0,0,0.6)" : "0 20px 50px rgba(0,0,0,0.18)",
              overflow: "hidden",
            },
          },
        }}
      >
        {viewStaffModal.staff && (
          <Box>
            {/* Dossier Header */}
            <Box
              sx={{
                p: 3,
                background: `linear-gradient(135deg, ${themeConfig.primaryDark || "#0C273B"} 0%, ${themeConfig.primary || "#0B8EE0"} 100%)`,
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                <Avatar
                  sx={{
                    width: 52,
                    height: 52,
                    borderRadius: "14px",
                    bgcolor: isDarkMode ? "rgba(255,255,255,0.15)" : "#FFFFFF",
                    color: isDarkMode ? "#FFFFFF" : themeConfig.primaryDark,
                    fontWeight: 900,
                    fontSize: "1.3rem",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
                  }}
                >
                  {(viewStaffModal.staff.name || "S").charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#FFFFFF", lineHeight: 1.2 }}>
                    {viewStaffModal.staff.name}
                  </Typography>
                  <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.85)" }}>
                    {getRoleMeta(viewStaffModal.staff.role).label} &bull; Employee #{viewStaffModal.staff._id?.slice(-6) || viewStaffModal.staff.employeeId || "EMP-01"}
                  </Typography>
                </Box>
              </Box>
              <IconButton onClick={() => setViewStaffModal({ open: false, staff: null })} sx={{ color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.3)" } }}>
                <Close fontSize="small" />
              </IconButton>
            </Box>

            <Box sx={{ p: 3 }}>
              <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>PHONE NUMBER</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>{viewStaffModal.staff.phone}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>LOGIN EMAIL</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>{viewStaffModal.staff.email}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>GOVT ID DOCUMENT</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary }}>{viewStaffModal.staff.idType || "Aadhaar Card"}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>DOCUMENT NUMBER</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>{viewStaffModal.staff.idNumber || "XXXX-XXXX-4512"}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>ASSIGNED SHIFT</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primaryDark }}>{viewStaffModal.staff.shift || "Morning Shift"}</Typography>
                </Grid>
                <Grid size={{ xs: 6 }}>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>MONTHLY REMUNERATION</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.primary }}>₹{(viewStaffModal.staff.salary || 28000).toLocaleString("en-IN")}</Typography>
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>ACCOUNT STATUS</Typography>
                    <StatusChip status={viewStaffModal.staff.status || "ACTIVE"} size="small" />
                  </Box>
                </Grid>
              </Grid>
            </Box>

            <DialogActions sx={{ p: 2.5, bgcolor: themeConfig.bgMain }}>
              <Button onClick={() => setViewStaffModal({ open: false, staff: null })} variant="contained" className="btn-3d" sx={{ borderRadius: "10px", fontWeight: 700 }}>
                Close Dossier
              </Button>
            </DialogActions>
          </Box>
        )}
      </Dialog>
    </Box>
  );
}
