"use client";

import { useState, useEffect, useMemo } from "react";
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
  AccessTime,
  Email,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import { formatTime12Hour } from "@/shared/utils/timeUtils";

export const DEFAULT_SHIFTS = [
  { value: "Morning (07:00 - 15:00)", label: "Morning · 7:00 AM – 3:00 PM" },
  { value: "Evening (15:00 - 23:00)", label: "Evening · 3:00 PM – 11:00 PM" },
  { value: "Night (23:00 - 07:00)", label: "Night · 11:00 PM – 7:00 AM" },
  { value: "General (09:00 - 18:00)", label: "General · 9:00 AM – 6:00 PM" },
];

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
  const totalReceptionists = staffList.filter((s) => (s.role || "").toUpperCase().includes("RECEPTIONIST")).length;
  const totalManagers = staffList.filter((s) => (s.role || "").toUpperCase().includes("MANAGER")).length;
  const totalHousekeeping = staffList.filter((s) => (s.role || "").toUpperCase().includes("HOUSEKEEPING")).length;
  const totalAccountants = staffList.filter((s) => (s.role || "").toUpperCase().includes("ACCOUNTANT")).length;
  const totalActive = staffList.filter((s) => s.status === "ACTIVE" || !s.status).length;

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    setPage(0);
  }, [staffSearch, staffRoleFilter]);

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

  const [customShifts, setCustomShifts] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("grand_royale_hotel_shifts");
        if (saved) return JSON.parse(saved);
      } catch (e) { }
    }
    return [];
  });

  const [isCustomShiftOpen, setIsCustomShiftOpen] = useState(false);
  const [customShiftName, setCustomShiftName] = useState("");
  const [customShiftStart, setCustomShiftStart] = useState("09:00");
  const [customShiftEnd, setCustomShiftEnd] = useState("17:00");

  const allShifts = useMemo(() => {
    const list = [...DEFAULT_SHIFTS];

    customShifts.forEach((cs) => {
      if (!list.some((s) => s.value === cs.value)) {
        list.push({ ...cs, isCustom: true });
      }
    });

    (staffList || []).forEach((staff) => {
      if (staff.shift && !list.some((s) => s.value === staff.shift)) {
        list.push({ value: staff.shift, label: staff.shift, isCustom: true });
      }
    });

    if (staffModal?.data?.shift && !list.some((s) => s.value === staffModal.data.shift)) {
      list.push({ value: staffModal.data.shift, label: staffModal.data.shift, isCustom: true });
    }

    return list;
  }, [customShifts, staffList, staffModal?.data?.shift]);

  const handleApplyCustomShift = () => {
    const title = customShiftName.trim() || "Custom Shift";
    const start12 = formatTime12Hour(customShiftStart);
    const end12 = formatTime12Hour(customShiftEnd);
    const shiftValue = `${title} (${customShiftStart} - ${customShiftEnd})`;
    const shiftLabel = `${title} (${start12} - ${end12})`;

    const newShiftObj = { value: shiftValue, label: shiftLabel, isCustom: true };
    const updated = [...customShifts.filter((s) => s.value !== shiftValue), newShiftObj];
    setCustomShifts(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("grand_royale_hotel_shifts", JSON.stringify(updated));
      } catch (e) { }
    }

    setStaffModal((prev) => ({
      ...prev,
      data: { ...prev.data, shift: shiftValue },
    }));
    setIsCustomShiftOpen(false);
    setCustomShiftName("");
  };

  const handleDeleteCustomShift = (val) => {
    const updated = customShifts.filter((s) => s.value !== val);
    setCustomShifts(updated);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("grand_royale_hotel_shifts", JSON.stringify(updated));
      } catch (e) { }
    }
    if (staffModal?.data?.shift === val) {
      setStaffModal((prev) => ({
        ...prev,
        data: { ...prev.data, shift: "Morning (07:00 - 15:00)" },
      }));
    }
  };

  const paginatedStaff = filteredStaff.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  const staffCount = filteredStaff.length;
  const emailValue = String(staffModal?.data?.email || "").trim();
  const emailInvalid = Boolean(emailValue) && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  const fieldSx = {
    "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: themeConfig.bgCard || "#FFFFFF" },
    "& .MuiInputLabel-root": { fontWeight: 600 },
    "& .MuiFormHelperText-root": { mx: 0.5 },
  };

  return (
    <Box sx={{ px: { xs: 1.5, sm: 3 }, py: { xs: 2, sm: 3 }, pb: { xs: 10, sm: 4 } }}>
      <Box
        sx={{
          mb: 2.5,
          px: { xs: 2.25, md: 3 },
          py: { xs: 2.25, md: 2.75 },
          borderRadius: "16px",
          color: "#FFFFFF",
          position: "relative",
          overflow: "hidden",
          background: `linear-gradient(120deg, ${themeConfig.primaryDark || "#0C273B"} 0%, ${themeConfig.primary || "#0F766E"} 100%)`,
          boxShadow: `0 10px 24px -12px ${themeConfig.primaryGlow || "rgba(15, 118, 110, 0.45)"}`,
        }}
      >
        <Box
          sx={{
            position: "absolute",
            top: -80,
            right: -40,
            width: 220,
            height: 220,
            borderRadius: "50%",
            bgcolor: "rgba(255,255,255,0.08)",
            pointerEvents: "none",
          }}
        />
        <Box sx={{ position: "relative", display: "flex", flexDirection: { xs: "column", sm: "row" }, justifyContent: "space-between", alignItems: { xs: "stretch", sm: "center" }, gap: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.75 }}>
            <Box
              sx={{
                width: 46,
                height: 46,
                borderRadius: "12px",
                display: "grid",
                placeItems: "center",
                flexShrink: 0,
                bgcolor: "rgba(255,255,255,0.14)",
                border: "1px solid rgba(255,255,255,0.18)",
              }}
            >
              <People sx={{ fontSize: 22, color: "#FFFFFF" }} />
            </Box>
            <Box>
              <Typography sx={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: 1.1, textTransform: "uppercase", color: "rgba(255,255,255,0.78)" }}>
                Staff directory
              </Typography>
              <Typography sx={{ fontWeight: 700, fontSize: { xs: "1.35rem", sm: "1.55rem" }, lineHeight: 1.2, letterSpacing: -0.3, color: "#FFFFFF" }}>
                Staff
              </Typography>
              <Typography sx={{ mt: 0.45, fontSize: "0.88rem", color: "rgba(255,255,255,0.86)" }}>
                {staffList.length} {staffList.length === 1 ? "member" : "members"} · {totalActive} active
              </Typography>
            </Box>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setStaffModal({ open: true, mode: "ADD", data: getInitialStaffForm ? getInitialStaffForm() : { name: "", email: "", phone: "", role: "RECEPTIONIST", shift: "Morning (07:00 - 15:00)", status: "ACTIVE" } })}
            sx={{
              width: { xs: "100%", sm: "auto" },
              borderRadius: "10px",
              textTransform: "none",
              fontWeight: 700,
              px: 2.25,
              py: 1.05,
              color: themeConfig.primaryDark || "#0C273B",
              bgcolor: "#FFFFFF",
              boxShadow: "none",
              "&:hover": { bgcolor: "#F8FAFC", boxShadow: "none" },
            }}
          >
            Add staff
          </Button>
        </Box>
      </Box>

      <Paper
        sx={{
          borderRadius: "16px",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "none" : "0 1px 2px rgba(15, 23, 42, 0.04)",
          overflow: "hidden",
          mb: 4,
        }}
      >
        <Box
          sx={{
            p: 2,
            display: "flex",
            flexDirection: { xs: "column", lg: "row" },
            alignItems: { xs: "stretch", lg: "center" },
            justifyContent: "space-between",
            gap: 1.5,
            borderBottom: `1px solid ${themeConfig.border}`,
          }}
        >
        <TextField
          size="small"
          placeholder="Search by name, role, email, or phone"
          value={staffSearch}
          onChange={(e) => setStaffSearch(e.target.value)}
          sx={{
            width: "100%",
            flex: { lg: "1 1 280px" },
            minWidth: 0,
            maxWidth: { lg: 420 },
            "& .MuiOutlinedInput-root": {
              borderRadius: "10px",
              bgcolor: themeConfig.bgMain,
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
            flexWrap: "wrap",
            alignItems: "center",
            justifyContent: { xs: "flex-start", lg: "flex-end" },
            py: 0.5,
            width: "100%",
            minWidth: 0,
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
                  fontWeight: 600,
                  borderRadius: "999px",
                  fontSize: "0.78rem",
                  height: 32,
                  flexShrink: 0,
                  bgcolor: isSelected ? themeConfig.primary : "transparent",
                  color: isSelected ? "#FFFFFF" : themeConfig.textMain,
                  border: `1px solid ${isSelected ? themeConfig.primary : themeConfig.border}`,
                  "&:hover": {
                    bgcolor: isSelected ? themeConfig.primaryDark : themeConfig.bgMain,
                  },
                }}
              />
            );
          })}
        </Box>
        </Box>

        <TableContainer sx={{ width: "100%", overflowX: "auto" }}>
        <Table size="medium" sx={{ width: "100%", minWidth: 720 }}>
          <TableHead>
            <TableRow>
              {["Name", "Role", "Phone", "Status"].map((heading) => (
                <TableCell key={heading} sx={{ fontWeight: 700, fontSize: "0.72rem", letterSpacing: 0.7, textTransform: "uppercase", color: themeConfig.primaryDark, py: 1.6, borderBottom: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : themeConfig.champagne || "#F4F7F6" }}>
                  {heading}
                </TableCell>
              ))}
              <TableCell align="right" sx={{ fontWeight: 700, fontSize: "0.72rem", letterSpacing: 0.7, textTransform: "uppercase", color: themeConfig.primaryDark, py: 1.6, borderBottom: `1px solid ${themeConfig.border}`, bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : themeConfig.champagne || "#F4F7F6" }}>
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {staffCount === 0 ? (
              <TableRow>
                <TableCell colSpan={5} sx={{ py: 6, textAlign: "center" }}>
                  <EmptyState
                    title="No staff members"
                    description={staffList.length === 0 ? "Add a staff member to start building your team." : "No staff members match this search."}
                  />
                </TableCell>
              </TableRow>
            ) : (
              paginatedStaff.map((staff) => {
                const meta = getRoleMeta(staff.role);
                const isActive = staff.status === "ACTIVE" || !staff.status;
                const actionSx = {
                  width: 32,
                  height: 32,
                  borderRadius: "8px",
                  color: themeConfig.textMuted,
                  "&:hover": { bgcolor: themeConfig.bgMain, color: themeConfig.textMain },
                };
                return (
                <TableRow
                  key={staff._id || staff.id || staff.email}
                  sx={{
                    "&:hover": { bgcolor: isDarkMode ? "rgba(255,255,255,0.03)" : "#F8FAFC" },
                    "& td": { borderBottom: `1px solid ${themeConfig.border}` },
                  }}
                >
                  <TableCell sx={{ py: 1.6 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                      <Avatar
                        sx={{
                          bgcolor: meta.bg || themeConfig.champagne,
                          color: meta.color || themeConfig.primaryDark,
                          fontWeight: 700,
                          width: 40,
                          height: 40,
                          fontSize: "0.95rem",
                        }}
                      >
                        {(staff.name || "S").charAt(0).toUpperCase()}
                      </Avatar>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.92rem" }}>
                          {staff.name}
                        </Typography>
                        <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.78rem" }} noWrap>
                          {staff.email || "No email"}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={meta.shortLabel || staff.role || "Receptionist"}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        borderRadius: "999px",
                        bgcolor: meta.bg || themeConfig.champagne,
                        color: meta.color || themeConfig.primaryDark,
                        border: `1px solid ${meta.border || themeConfig.border}`,
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <Typography sx={{ fontWeight: 600, color: themeConfig.textMain, fontSize: "0.9rem" }}>
                      {staff.phone || "—"}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      {onToggleStaffStatus && (
                        <Switch
                          size="small"
                          checked={isActive}
                          onChange={() => onToggleStaffStatus(staff)}
                          slotProps={{ input: { "aria-label": isActive ? "Mark inactive" : "Mark active" } }}
                          sx={{
                            "& .MuiSwitch-switchBase.Mui-checked": { color: "#059669" },
                            "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { backgroundColor: "#059669" },
                          }}
                        />
                      )}
                      <Typography sx={{ fontSize: "0.8rem", fontWeight: 600, color: isActive ? "#047857" : themeConfig.textMuted }}>
                        {isActive ? "Active" : "Inactive"}
                      </Typography>
                    </Box>
                  </TableCell>

                  <TableCell align="right">
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                      <Tooltip title="View profile">
                        <IconButton size="small" onClick={() => setViewStaffModal({ open: true, staff })} sx={actionSx}>
                          <Visibility fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => setStaffModal({ open: true, mode: "EDIT", data: { ...staff } })} sx={actionSx}>
                          <Edit fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Remove">
                        <IconButton size="small" onClick={() => onDeleteStaff(staff)} sx={{ ...actionSx, "&:hover": { bgcolor: themeConfig.dangerBg, color: themeConfig.danger } }}>
                          <Delete fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {staffCount > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={staffCount}
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
              borderRadius: 0,
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
      </Paper>

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
          <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", pb: 1 }}>
            <Box>
              <Typography component="div" variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, letterSpacing: -0.2 }}>
                {staffModal.mode === "ADD" ? "Add Staff Member" : "Edit Staff Member"}
              </Typography>
              <Typography variant="body2" sx={{ color: themeConfig.textMuted, mt: 0.4 }}>
                {staffModal.mode === "ADD"
                  ? "Create a login and assign a role and shift."
                  : staffModal.data?.name || "Update this staff member’s details."}
              </Typography>
            </Box>
            <IconButton onClick={() => setStaffModal({ ...staffModal, open: false })} aria-label="Close" sx={{ borderRadius: "10px", mt: -0.5 }}>
              <Close />
            </IconButton>
          </DialogTitle>

          <DialogContent dividers sx={{ borderColor: themeConfig.border, pt: 2.5 }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Full Name"
                  value={staffModal.data?.name || ""}
                  onChange={(e) => setStaffModal({ ...staffModal, data: { ...staffModal.data, name: e.target.value } })}
                  placeholder="Full name"
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <IdBadge sx={{ fontSize: 18, color: themeConfig.textMuted }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={fieldSx}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  type="email"
                  label="Email Address"
                  value={staffModal.data?.email || ""}
                  onChange={(e) => setStaffModal({ ...staffModal, data: { ...staffModal.data, email: e.target.value } })}
                  placeholder="Email address"
                  error={emailInvalid}
                  helperText={emailInvalid ? "Enter a valid email address" : "Used for staff login"}
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Email sx={{ fontSize: 18, color: themeConfig.textMuted }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                  sx={fieldSx}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  size="small"
                  required
                  label="Mobile Number"
                  value={staffModal.data?.phone || ""}
                  onChange={(e) => {
                    const numericVal = e.target.value.replace(/\D/g, "").slice(0, 10);
                    setStaffModal({ ...staffModal, data: { ...staffModal.data, phone: numericVal } });
                  }}
                  error={Boolean(staffModal.data?.phone && staffModal.data.phone.length !== 10)}
                  helperText={
                    staffModal.data?.phone && staffModal.data.phone.length !== 10
                      ? `${staffModal.data.phone.length} of 10 digits entered`
                      : "10-digit mobile number"
                  }
                  placeholder="10-digit mobile number"
                  slotProps={{
                    inputLabel: { shrink: true },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <Phone sx={{ fontSize: 18, color: themeConfig.textMuted }} />
                        </InputAdornment>
                      ),
                    },
                    htmlInput: {
                      inputMode: "numeric",
                      pattern: "[0-9]{10}",
                      maxLength: 10,
                    },
                  }}
                  sx={fieldSx}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  required
                  label="Role"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={staffModal.data?.role ? staffModal.data.role.toUpperCase() : "RECEPTIONIST"}
                  onChange={(e) => setStaffModal({ ...staffModal, data: { ...staffModal.data, role: e.target.value } })}
                  sx={fieldSx}
                >
                  {HOTEL_STAFF_ROLES.map((r) => (
                    <MenuItem key={r.value} value={r.value}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: r.color, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {r.label}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 0.6 }}>
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => setIsCustomShiftOpen((prev) => !prev)}
                    startIcon={<Add sx={{ fontSize: 16 }} />}
                    sx={{
                      fontSize: "0.8rem",
                      fontWeight: 700,
                      textTransform: "none",
                      color: themeConfig.primary,
                      "&:hover": { bgcolor: "transparent", textDecoration: "underline" },
                    }}
                  >
                    {isCustomShiftOpen ? "Hide custom shift" : "Add custom shift"}
                  </Button>
                </Box>
                <TextField
                  select
                  fullWidth
                  size="small"
                  required
                  label="Shift"
                  slotProps={{ inputLabel: { shrink: true } }}
                  value={staffModal.data?.shift || "Morning (07:00 - 15:00)"}
                  onChange={(e) => {
                    if (e.target.value === "__NEW_CUSTOM__") {
                      setIsCustomShiftOpen(true);
                    } else {
                      setStaffModal({ ...staffModal, data: { ...staffModal.data, shift: e.target.value } });
                    }
                  }}
                  sx={fieldSx}
                >
                  {allShifts.map((s) => (
                    <MenuItem key={s.value} value={s.value}>
                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%", gap: 1 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <AccessTime sx={{ fontSize: 16, color: themeConfig.primary }} />
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {s.label}
                          </Typography>
                        </Box>
                        {s.isCustom && (
                          <IconButton
                            size="small"
                            aria-label="Remove custom shift"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCustomShift(s.value);
                            }}
                            sx={{ p: 0.2, color: "#EF4444", "&:hover": { bgcolor: "rgba(239,68,68,0.1)" } }}
                          >
                            <Delete sx={{ fontSize: 16 }} />
                          </IconButton>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                  <MenuItem value="__NEW_CUSTOM__" sx={{ color: themeConfig.primary, fontWeight: 700, borderTop: `1px solid ${themeConfig.border}` }}>
                    <Add sx={{ fontSize: 16, mr: 1 }} /> Create custom shift
                  </MenuItem>
                </TextField>

                {isCustomShiftOpen && (
                  <Paper
                    elevation={0}
                    sx={{
                      mt: 1.5,
                      p: 2,
                      borderRadius: "14px",
                      bgcolor: isDarkMode ? "rgba(255,255,255,0.04)" : themeConfig.champagne,
                      border: `1px solid ${themeConfig.border}`,
                    }}
                  >
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: themeConfig.textMain, mb: 1.5 }}>
                      Custom Shift
                    </Typography>
                    <Grid container spacing={1.5} sx={{ alignItems: "center" }}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <TextField
                          size="small"
                          fullWidth
                          label="Shift Name"
                          placeholder="Shift name"
                          value={customShiftName}
                          onChange={(e) => setCustomShiftName(e.target.value)}
                          sx={fieldSx}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField
                          type="time"
                          size="small"
                          fullWidth
                          label="Start Time"
                          slotProps={{ inputLabel: { shrink: true } }}
                          value={customShiftStart}
                          onChange={(e) => setCustomShiftStart(e.target.value)}
                          sx={fieldSx}
                        />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 4 }}>
                        <TextField
                          type="time"
                          size="small"
                          fullWidth
                          label="End Time"
                          slotProps={{ inputLabel: { shrink: true } }}
                          value={customShiftEnd}
                          onChange={(e) => setCustomShiftEnd(e.target.value)}
                          sx={fieldSx}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Button
                          size="small"
                          variant="contained"
                          onClick={handleApplyCustomShift}
                          sx={{
                            borderRadius: "10px",
                            fontWeight: 700,
                            px: 2.5,
                            py: 0.9,
                            textTransform: "none",
                            bgcolor: themeConfig.primary,
                            color: "#FFFFFF",
                            "&:hover": { bgcolor: themeConfig.primaryDark },
                          }}
                        >
                          Use this shift
                        </Button>
                      </Grid>
                    </Grid>
                  </Paper>
                )}
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
              {staffModal.mode === "ADD" ? "Add Staff Member" : "Save Changes"}
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
        {viewStaffModal.staff && (() => {
          const profile = viewStaffModal.staff;
          const roleMeta = getRoleMeta(profile.role);
          const staffId = profile.employeeId || profile.employee_id || profile.id || profile._id;
          const details = [
            { label: "Phone", value: profile.phone, icon: <Phone sx={{ fontSize: 18 }} /> },
            { label: "Email", value: profile.email, icon: <Email sx={{ fontSize: 18 }} /> },
            { label: "Role", value: roleMeta.label, icon: <IdBadge sx={{ fontSize: 18 }} /> },
            { label: "Shift", value: profile.shift, icon: <AccessTime sx={{ fontSize: 18 }} /> },
          ].filter((item) => String(item.value || "").trim());

          return (
            <Box>
              <Box
                sx={{
                  px: 3,
                  py: 2.5,
                  background: `linear-gradient(135deg, ${themeConfig.primaryDark || "#0C273B"} 0%, ${themeConfig.primary || "#0B8EE0"} 100%)`,
                  color: "#FFFFFF",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 2,
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2, minWidth: 0 }}>
                  <Avatar
                    sx={{
                      width: 56,
                      height: 56,
                      borderRadius: "16px",
                      bgcolor: "#FFFFFF",
                      color: themeConfig.primaryDark,
                      fontWeight: 800,
                      fontSize: "1.25rem",
                      flexShrink: 0,
                    }}
                  >
                    {(profile.name || "S").charAt(0).toUpperCase()}
                  </Avatar>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 800, fontSize: "1.15rem", lineHeight: 1.25, color: "#FFFFFF" }} noWrap>
                      {profile.name}
                    </Typography>
                    <Typography sx={{ mt: 0.4, color: "rgba(255,255,255,0.88)", fontSize: "0.82rem" }}>
                      {roleMeta.shortLabel || roleMeta.label}
                      {staffId ? ` · Staff ID ${staffId}` : ""}
                    </Typography>
                  </Box>
                </Box>
                <IconButton
                  onClick={() => setViewStaffModal({ open: false, staff: null })}
                  aria-label="Close"
                  sx={{ color: "#FFFFFF", bgcolor: "rgba(255,255,255,0.16)", "&:hover": { bgcolor: "rgba(255,255,255,0.28)" } }}
                >
                  <Close fontSize="small" />
                </IconButton>
              </Box>

              <Box sx={{ px: 3, py: 1 }}>
                {details.map((item) => (
                  <Box
                    key={item.label}
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      py: 1.6,
                      borderBottom: `1px solid ${themeConfig.border}`,
                    }}
                  >
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        display: "grid",
                        placeItems: "center",
                        flexShrink: 0,
                        color: themeConfig.primaryDark,
                        bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : themeConfig.champagne,
                      }}
                    >
                      {item.icon}
                    </Box>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 700, letterSpacing: 0.2 }}>
                        {item.label}
                      </Typography>
                      <Typography sx={{ color: themeConfig.textMain, fontWeight: 700, fontSize: "0.92rem", wordBreak: "break-word" }}>
                        {item.value}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", py: 1.8 }}>
                  <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.72rem", fontWeight: 700 }}>
                    Status
                  </Typography>
                  <StatusChip status={profile.status || "ACTIVE"} size="small" />
                </Box>
              </Box>

              <DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${themeConfig.border}` }}>
                <Button
                  onClick={() => setViewStaffModal({ open: false, staff: null })}
                  variant="contained"
                  sx={{
                    borderRadius: "10px",
                    fontWeight: 700,
                    textTransform: "none",
                    px: 2.5,
                    bgcolor: themeConfig.primary,
                    "&:hover": { bgcolor: themeConfig.primaryDark },
                  }}
                >
                  Close
                </Button>
              </DialogActions>
            </Box>
          );
        })()}
      </Dialog>
    </Box>
  );
}
