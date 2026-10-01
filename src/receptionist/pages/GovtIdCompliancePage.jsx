"use client";

import { useState, useMemo } from "react";
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Avatar,
  TablePagination,
} from "@mui/material";
import {
  VerifiedUser,
  Search,
  Download,
  Security,
  ContentCopy,
  Check,
  Close,
  Visibility,
  Warning,
  Person,
  CheckCircle,
  Badge as BadgeIcon,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import StatusChip from "@/shared/components/StatusChip";
import EmptyState from "@/shared/components/EmptyState";
import { downloadGovtIdReportPDF } from "@/shared/utils/pdfGenerator";

export default function GovtIdCompliancePage({
  guests = [],
  hotelSettings = {},
  onVerifyGuestId,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [dossierModal, setDossierModal] = useState({ open: false, guest: null });
  const [copiedId, setCopiedId] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Metrics Calculation
  const totalCount = guests.length;
  const verifiedCount = guests.filter((g) => g.idVerified).length;
  const pendingCount = totalCount - verifiedCount;
  const complianceRate = totalCount > 0 ? Math.round((verifiedCount / totalCount) * 100) : 100;

  // Filtered List
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      // Status Filter
      if (selectedStatus === "VERIFIED" && !g.idVerified) return false;
      if (selectedStatus === "PENDING" && g.idVerified) return false;

      // Type Filter
      if (selectedType !== "ALL") {
        const idType = (g.govtIdType || "AADHAAR").toUpperCase();
        if (idType !== selectedType) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = (g.name || g.fullName || "").toLowerCase().includes(q);
        const matchPhone = (g.phone || g.phoneNumber || "").toLowerCase().includes(q);
        const matchEmail = (g.email || "").toLowerCase().includes(q);
        const matchId = (g.govtIdNumber || "").toLowerCase().includes(q);
        return matchName || matchPhone || matchEmail || matchId;
      }

      return true;
    });
  }, [guests, searchQuery, selectedType, selectedStatus]);

  // Copy ID helper
  const handleCopy = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // CSV Export helper
  const handleExportCSV = () => {
    const headers = ["Guest Name", "Phone", "Email", "Govt ID Type", "Document Number", "Compliance Status", "Stamping Date"];
    const rows = filteredGuests.map((g) => [
      `"${g.name || g.fullName || ""}"`,
      `"${g.phone || ""}"`,
      `"${g.email || ""}"`,
      `"${g.govtIdType || "AADHAAR"}"`,
      `"${g.govtIdNumber || "N/A"}"`,
      `"${g.idVerified ? "VERIFIED" : "PENDING"}"`,
      `"${g.updatedAt ? new Date(g.updatedAt).toLocaleDateString() : new Date().toLocaleDateString()}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Govt_ID_Compliance_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Get color for ID Type
  const getIdTypeBadge = (type = "AADHAAR") => {
    const t = type.toUpperCase();
    if (t === "PASSPORT") {
      return { label: "PASSPORT", bgcolor: "rgba(37, 99, 235, 0.1)", color: "#2563EB", border: "rgba(37, 99, 235, 0.3)" };
    }
    if (t === "DRIVING_LICENSE") {
      return { label: "DRIVING LICENSE", bgcolor: "rgba(217, 119, 6, 0.1)", color: "#D97706", border: "rgba(217, 119, 6, 0.3)" };
    }
    if (t === "VOTER_ID") {
      return { label: "VOTER ID", bgcolor: "rgba(16, 185, 129, 0.1)", color: "#059669", border: "rgba(16, 185, 129, 0.3)" };
    }
    return { label: "AADHAAR", bgcolor: themeConfig.champagne, color: themeConfig.primaryDark, border: themeConfig.border };
  };

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 3.5 }, py: { xs: 2, sm: 3.5 }, display: "flex", flexDirection: "column", gap: 3.5 }}>
      {/* Header & Export Row */}
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          justifyContent: "space-between",
          alignItems: { xs: "flex-start", sm: "center" },
          gap: 2,
        }}
      >
        <div>
          <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain, letterSpacing: -0.5 }}>
            Regulatory Guest Identity & Compliance Hub
          </Typography>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted }}>
            Mandatory local police / tourism department compliance records for Aadhaar, Passport & Government ID verification.
          </Typography>
        </div>

        <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportCSV}
            className="btn-3d"
            sx={{
              borderRadius: "12px",
              borderColor: themeConfig.border,
              bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
              color: themeConfig.textMain,
              fontWeight: 700,
              textTransform: "none",
              px: 2,
            }}
          >
            Export CSV
          </Button>

          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={() => downloadGovtIdReportPDF(filteredGuests, hotelSettings)}
            className="btn-3d"
            sx={{
              borderRadius: "12px",
              background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
              color: "#FFFFFF",
              fontWeight: 800,
              textTransform: "none",
              px: 2.5,
              boxShadow: `0 6px 16px ${themeConfig.primaryGlow}`,
            }}
          >
            Download Police Manifest (PDF)
          </Button>
        </Box>
      </Box>

      {/* 4 Telemetry Metric Cards */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            md: "repeat(4, 1fr)",
          },
          gap: 2,
        }}
      >
        {/* Card 1: Total Records */}
        <Paper
          className="card-3d"
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            border: `1px solid ${themeConfig.border}`,
            background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #FAFBFD 100%)",
            boxShadow: isDarkMode ? "none" : "0 6px 16px rgba(12, 39, 59, 0.04), inset 0 1px 1px #FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase" }}>
              Total Records
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: themeConfig.champagne, color: themeConfig.primary }}>
              <Person sx={{ fontSize: 18 }} />
            </Box>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
            {totalCount}
          </Typography>
          <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
            Registered guest profiles
          </Typography>
        </Paper>

        {/* Card 2: Verified & Stamped */}
        <Paper
          className="card-3d"
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            border: `1px solid ${themeConfig.border}`,
            background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #F0FDF4 100%)",
            boxShadow: isDarkMode ? "none" : "0 6px 16px rgba(12, 39, 59, 0.04), inset 0 1px 1px #FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isDarkMode ? "#34D399" : "#059669", textTransform: "uppercase" }}>
              Verified & Stamped
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: isDarkMode ? "rgba(52, 211, 153, 0.15)" : "#ECFDF5", color: isDarkMode ? "#34D399" : "#059669" }}>
              <CheckCircle sx={{ fontSize: 18 }} />
            </Box>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: isDarkMode ? "#34D399" : "#059669" }}>
            {verifiedCount}
          </Typography>
          <Typography variant="caption" sx={{ color: isDarkMode ? "#34D399" : "#059669", fontWeight: 700 }}>
            Police & tourism stamped
          </Typography>
        </Paper>

        {/* Card 3: Pending Verification */}
        <Paper
          className="card-3d"
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            border: `1px solid ${themeConfig.border}`,
            background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #FFFBEB 100%)",
            boxShadow: isDarkMode ? "none" : "0 6px 16px rgba(12, 39, 59, 0.04), inset 0 1px 1px #FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isDarkMode ? "#FBBF24" : "#D97706", textTransform: "uppercase" }}>
              Pending Verification
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: isDarkMode ? "rgba(251, 191, 36, 0.15)" : "#FEF3C7", color: isDarkMode ? "#FBBF24" : "#D97706" }}>
              <Warning sx={{ fontSize: 18 }} />
            </Box>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: pendingCount > 0 ? (isDarkMode ? "#FBBF24" : "#D97706") : themeConfig.textMain }}>
            {pendingCount}
          </Typography>
          <Typography variant="caption" sx={{ color: pendingCount > 0 ? (isDarkMode ? "#FBBF24" : "#D97706") : themeConfig.textMuted, fontWeight: pendingCount > 0 ? 700 : 400 }}>
            {pendingCount > 0 ? "Requires ID stamp" : "All guests stamped"}
          </Typography>
        </Paper>

        {/* Card 4: Audit Readiness */}
        <Paper
          className="card-3d"
          sx={{
            p: 2.2,
            borderRadius: "16px",
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            border: `1px solid ${themeConfig.border}`,
            background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #FAF5FF 100%)",
            boxShadow: isDarkMode ? "none" : "0 6px 16px rgba(12, 39, 59, 0.04), inset 0 1px 1px #FFFFFF",
          }}
        >
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
            <Typography variant="caption" sx={{ fontWeight: 800, color: isDarkMode ? "#A78BFA" : "#7C3AED", textTransform: "uppercase" }}>
              Audit Compliance
            </Typography>
            <Box sx={{ p: 0.8, borderRadius: "8px", bgcolor: isDarkMode ? "rgba(167, 139, 250, 0.15)" : "#F5F3FF", color: isDarkMode ? "#A78BFA" : "#7C3AED" }}>
              <Security sx={{ fontSize: 18 }} />
            </Box>
          </Box>
          <Typography variant="h5" sx={{ fontWeight: 900, color: isDarkMode ? "#A78BFA" : "#7C3AED" }}>
            {complianceRate}%
          </Typography>
          <Typography variant="caption" sx={{ color: isDarkMode ? "#A78BFA" : "#7C3AED", fontWeight: 700 }}>
            Regulatory audit ready
          </Typography>
        </Paper>
      </Box>

      {/* Filter Toolbar */}
      <Card
        className="card-3d"
        sx={{
          p: 2,
          borderRadius: "18px",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "none" : "0 8px 20px rgba(12, 39, 59, 0.04), inset 0 1px 1px #FFFFFF",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            gap: 2,
            alignItems: { xs: "stretch", md: "center" },
            justifyContent: "space-between",
          }}
        >
          <TextField
            size="small"
            placeholder="Search by Guest Name, Phone, Email, or Document #..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(0);
            }}
            sx={{
              flex: { xs: "1 1 auto", md: "1 1 360px" },
              minWidth: { xs: "100%", sm: "260px" },
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                bgcolor: isDarkMode ? "rgba(255, 255, 255, 0.04)" : themeConfig.champagne,
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: themeConfig.textMuted, fontSize: 20 }} />
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>ID Document</InputLabel>
              <Select
                value={selectedType}
                label="ID Document"
                onChange={(e) => {
                  setSelectedType(e.target.value);
                  setPage(0);
                }}
                sx={{ borderRadius: "12px", bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF") }}
              >
                <MenuItem value="ALL">All ID Types</MenuItem>
                <MenuItem value="AADHAAR">🪪 Aadhaar</MenuItem>
                <MenuItem value="PASSPORT">🛂 Passport</MenuItem>
                <MenuItem value="DRIVING_LICENSE">🚗 Driving License</MenuItem>
                <MenuItem value="VOTER_ID">🗳️ Voter ID</MenuItem>
                <MenuItem value="PAN">💳 PAN Card</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Compliance Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Compliance Status"
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(0);
                }}
                sx={{ borderRadius: "12px", bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF") }}
              >
                <MenuItem value="ALL">All Records</MenuItem>
                <MenuItem value="VERIFIED">🟢 Verified Only</MenuItem>
                <MenuItem value="PENDING">🟠 Pending Only</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>
      </Card>

      {/* Main Compliance Ledger Table */}
      <Card
        className="card-3d"
        sx={{
          borderRadius: "20px",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "none" : "0 10px 30px rgba(12, 39, 59, 0.06), inset 0 1px 1px #FFFFFF",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5, display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${themeConfig.border}` }}>
          <div>
            <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
              Guest Identity Compliance Roster ({filteredGuests.length})
            </Typography>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
              Chronological regulatory records stamped for tourist / local authorities
            </Typography>
          </div>
        </Box>

        {filteredGuests.length === 0 ? (
          <Box sx={{ py: 8 }}>
            <EmptyState
              title={searchQuery || selectedType !== "ALL" || selectedStatus !== "ALL" ? "No Matching Identity Records" : "No Guest Records Found"}
              description={searchQuery || selectedType !== "ALL" || selectedStatus !== "ALL" ? "Try adjusting your filter options or search keywords." : "Guest compliance logs will automatically appear here once guests register at check-in."}
            />
          </Box>
        ) : (
          <TableContainer>
            <Table size="medium">
              <TableHead sx={{ bgcolor: themeConfig.champagne }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Guest Name</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Contact Details</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Govt ID Type</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Document # / Hash</TableCell>
                  <TableCell sx={{ fontWeight: 800, color: themeConfig.textMain }}>Compliance Stamp</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 800, color: themeConfig.textMain }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredGuests
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((g) => {
                  const idBadge = getIdTypeBadge(g.govtIdType);

                  return (
                    <TableRow
                      key={g._id}
                      hover
                      sx={{
                        "&:hover": { bgcolor: "rgba(12, 39, 59, 0.02)" },
                        transition: "background-color 0.2s ease",
                      }}
                    >
                      {/* Guest Name & Avatar */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 36,
                              height: 36,
                              fontSize: "0.9rem",
                              fontWeight: 800,
                              bgcolor: g.idVerified ? themeConfig.primary : themeConfig.warning,
                              color: "#FFFFFF",
                              boxShadow: `0 4px 10px ${g.idVerified ? themeConfig.primaryGlow : "rgba(217, 119, 6, 0.3)"}`,
                            }}
                          >
                            {(g.name || g.fullName || "G").charAt(0).toUpperCase()}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain }}>
                              {g.name || g.fullName}
                            </Typography>
                            <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                              Guest ID: #{String(g._id).slice(-6)}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>

                      {/* Contact Details */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain }}>
                          {g.phone || g.phoneNumber || "No phone"}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                          {g.email || "No email"}
                        </Typography>
                      </TableCell>

                      {/* Govt ID Type Badge */}
                      <TableCell>
                        <Chip
                          icon={idBadge.icon}
                          label={idBadge.label}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            bgcolor: idBadge.bg,
                            color: idBadge.color,
                            fontSize: "0.75rem",
                            borderRadius: "8px",
                          }}
                        />
                      </TableCell>

                      {/* Document # / Hash */}
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <Typography variant="body2" sx={{ fontFamily: "monospace", fontWeight: 800, color: themeConfig.textMain }}>
                            {g.govtIdNumber || "N/A"}
                          </Typography>
                          {g.govtIdNumber && (
                            <Tooltip title={copiedId === g._id ? "Copied!" : "Copy Document #"}>
                              <IconButton
                                size="small"
                                onClick={() => handleCopy(g.govtIdNumber, g._id)}
                                sx={{ p: 0.3 }}
                              >
                                {copiedId === g._id ? (
                                  <Check sx={{ fontSize: 14, color: themeConfig.success }} />
                                ) : (
                                  <ContentCopy sx={{ fontSize: 14, color: themeConfig.textMuted }} />
                                )}
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>

                      {/* Compliance Stamp */}
                      <TableCell>
                        {g.idVerified ? (
                          <StatusChip status="VERIFIED" size="small" />
                        ) : (
                          <Chip
                            label="PENDING STAMP"
                            size="small"
                            sx={{
                              bgcolor: themeConfig.warningBg,
                              color: themeConfig.warning,
                              fontWeight: 800,
                              fontSize: "0.7rem",
                              borderRadius: "8px",
                              border: "1px solid rgba(217, 119, 6, 0.3)",
                            }}
                          />
                        )}
                      </TableCell>

                      {/* Action */}
                      <TableCell align="right">
                        <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end", alignItems: "center" }}>
                          {!g.idVerified ? (
                            <Button
                              size="small"
                              variant="contained"
                              startIcon={<VerifiedUser sx={{ fontSize: 16 }} />}
                              onClick={() => onVerifyGuestId(g._id)}
                              className="btn-3d"
                              sx={{
                                background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                                borderRadius: "10px",
                                fontSize: "0.75rem",
                                fontWeight: 800,
                                textTransform: "none",
                                boxShadow: `0 4px 12px ${themeConfig.primaryGlow}`,
                                whiteSpace: "nowrap",
                              }}
                            >
                              Verify & Stamp
                            </Button>
                          ) : (
                            <Tooltip title="View Guest Dossier">
                              <IconButton
                                size="small"
                                onClick={() => setDossierModal({ open: true, guest: g })}
                                sx={{
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
                                <Visibility sx={{ fontSize: 16, color: themeConfig.primaryDark }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Table Pagination */}
        {filteredGuests.length > 0 && (
          <TablePagination
            rowsPerPageOptions={[5, 10, 25, 50]}
            component="div"
            count={filteredGuests.length}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            sx={{
              borderTop: `1px solid ${themeConfig.border}`,
              bgcolor: themeConfig.bgCard,
              color: themeConfig.textMain,
            }}
          />
        )}
      </Card>

      {/* Guest Compliance Dossier Modal */}
      <Dialog
        open={dossierModal.open}
        onClose={() => setDossierModal({ open: false, guest: null })}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              boxShadow: themeConfig.shadowModal,
              p: 1,
            },
          },
        }}
      >
        <DialogTitle component="div" sx={{ fontWeight: 900, color: themeConfig.textMain, display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <BadgeIcon sx={{ color: themeConfig.primary }} />
            <span>Official Regulatory Guest Dossier</span>
          </Box>
          <IconButton size="small" onClick={() => setDossierModal({ open: false, guest: null })}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {dossierModal.guest && (
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2.5, pt: 1 }}>
              <Paper
                sx={{
                  p: 2.5,
                  borderRadius: "16px",
                  bgcolor: themeConfig.champagne,
                  border: `1px solid ${themeConfig.border}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      bgcolor: themeConfig.primary,
                      color: "#FFFFFF",
                      fontWeight: 900,
                      fontSize: "1.1rem",
                    }}
                  >
                    {(dossierModal.guest.name || dossierModal.guest.fullName || "G").charAt(0).toUpperCase()}
                  </Avatar>
                  <div>
                    <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                      {dossierModal.guest.name || dossierModal.guest.fullName}
                    </Typography>
                    <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                      Guest ID: #{dossierModal.guest._id?.slice(-8).toUpperCase()}
                    </Typography>
                  </div>
                </Box>
                <StatusChip status={dossierModal.guest.idVerified ? "VERIFIED" : "PENDING"} size="small" />
              </Paper>

              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                <Paper sx={{ p: 2, borderRadius: "12px", border: `1px solid ${themeConfig.border}` }}>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                    Government ID Document
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900, color: themeConfig.textMain, mt: 0.5 }}>
                    {dossierModal.guest.govtIdType || "AADHAAR"}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, borderRadius: "12px", border: `1px solid ${themeConfig.border}` }}>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                    Document # / Verified Hash
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 900, fontFamily: "monospace", color: themeConfig.primaryDark, mt: 0.5 }}>
                    {dossierModal.guest.govtIdNumber || "N/A"}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, borderRadius: "12px", border: `1px solid ${themeConfig.border}` }}>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                    Phone Number
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.5 }}>
                    {dossierModal.guest.phone || "-"}
                  </Typography>
                </Paper>

                <Paper sx={{ p: 2, borderRadius: "12px", border: `1px solid ${themeConfig.border}` }}>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                    Email Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 800, color: themeConfig.textMain, mt: 0.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {dossierModal.guest.email || "N/A"}
                  </Typography>
                </Paper>
              </Box>

              {dossierModal.guest.address && (
                <Paper sx={{ p: 2, borderRadius: "12px", border: `1px solid ${themeConfig.border}` }}>
                  <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
                    Permanent Residential Address
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 700, color: themeConfig.textMain, mt: 0.5 }}>
                    {dossierModal.guest.address}
                  </Typography>
                </Paper>
              )}

              <Box sx={{ p: 2, borderRadius: "12px", bgcolor: "#F0FDF4", border: "1px solid #A7F3D0" }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <CheckCircle sx={{ color: "#059669", fontSize: 18 }} />
                  <Typography variant="caption" sx={{ fontWeight: 800, color: "#059669" }}>
                    Official Tourism / Police Compliance Seal Stamped
                  </Typography>
                </Box>
                <Typography variant="caption" sx={{ color: "#047857", display: "block", mt: 0.5 }}>
                  This guest record has been verified against government-issued credentials and stamped for local hotel compliance audits.
                </Typography>
              </Box>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2 }}>
          <Button
            variant="contained"
            onClick={() => setDossierModal({ open: false, guest: null })}
            className="btn-3d"
            sx={{
              background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
              borderRadius: "10px",
              fontWeight: 800,
              px: 3,
            }}
          >
            Close Dossier
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
