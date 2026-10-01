"use client";

import { useState } from "react";
import {
  Box,
  Typography,
  Card,
  Paper,
  Divider,
  Button,
  Tabs,
  Tab,
} from "@mui/material";
import { Fastfood, Receipt, Payments, LocalDining } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { API_ENDPOINTS } from "@/config/api";
import EmptyState from "@/shared/components/EmptyState";
import PaymentLedgerView from "@/shared/components/PaymentLedgerView";

export default function PosSettlementPage({
  user,
  hotelSettings,
  bookings = [],
  onOpenPosCharge,
  onOpenInvoice,
  onRefresh,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const [activeSubTab, setActiveSubTab] = useState(0);

  const checkedInBookings = bookings.filter((b) => b.status === "CHECKED_IN");

  return (
    <Box sx={{ px: { xs: 2, sm: 3, md: 3.5 }, py: { xs: 2, sm: 3.5 }, display: "flex", flexDirection: "column", gap: 3.5 }}>
      {/* Sub Navigation Bar */}
      <Card
        className="card-3d"
        sx={{
          p: 1.2,
          borderRadius: "18px",
          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
          border: `1px solid ${themeConfig.border}`,
          boxShadow: isDarkMode ? "none" : "0 6px 18px rgba(12, 39, 59, 0.04), inset 0 1px 1px #FFFFFF",
          mb: 0.5,
        }}
      >
        <Tabs
          value={activeSubTab}
          onChange={(e, val) => setActiveSubTab(val)}
          sx={{
            minHeight: "44px",
            "& .MuiTab-root": {
              borderRadius: "12px",
              fontWeight: 800,
              textTransform: "none",
              fontSize: "0.95rem",
              minHeight: "44px",
              px: 2.5,
              transition: "all 0.2s ease",
            },
            "& .Mui-selected": {
              bgcolor: themeConfig.champagne,
              color: `${themeConfig.primary} !important`,
            },
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: 3,
              bgcolor: themeConfig.primary,
            },
          }}
        >
          <Tab icon={<Payments sx={{ fontSize: 18 }} />} iconPosition="start" label="Collections & Cash Drawer Ledger" sx={{ whiteSpace: "nowrap" }} />
          <Tab icon={<LocalDining sx={{ fontSize: 18 }} />} iconPosition="start" label={`Room POS & Ancillary Charges (${checkedInBookings.length})`} sx={{ whiteSpace: "nowrap" }} />
        </Tabs>
      </Card>

      {/* TAB 0: Comprehensive Payment Collections & Cash Drawer Ledger */}
      {activeSubTab === 0 && (
        <PaymentLedgerView
          user={user}
          hotelSettings={hotelSettings}
          bookings={bookings}
          apiEndpoint={API_ENDPOINTS.RECEPTIONIST.PAYMENTS}
          recordPaymentEndpoint={API_ENDPOINTS.RECEPTIONIST.RECORD_PAYMENT}
          onPaymentSuccess={onRefresh}
        />
      )}

      {/* TAB 1: Room POS Charges & Folio Add-ons */}
      {activeSubTab === 1 && (
        <Card
          className="card-3d"
          sx={{
            p: 3,
            borderRadius: "20px",
            bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
            border: `1px solid ${themeConfig.border}`,
            boxShadow: isDarkMode ? "none" : "0 10px 25px -5px rgba(12, 39, 59, 0.08), inset 0 1px 1px #FFFFFF",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 800, color: themeConfig.textMain, mb: 0.5 }}>
            Room POS Ancillary Charges & Bill Posting
          </Typography>
          <Typography variant="body2" sx={{ color: themeConfig.textMuted, mb: 3 }}>
            Post direct ancillary charges (in-room dining, laundry, airport shuttle, spa) directly to active resident folios.
          </Typography>

          {checkedInBookings.length === 0 ? (
            <Box sx={{ py: 6 }}>
              <EmptyState
                title="No Checked-In Guests"
                description="There are currently no active in-house guests to post POS charges or generate folios for."
              />
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "repeat(2, 1fr)",
                },
                gap: 3,
              }}
            >
              {checkedInBookings.map((b) => (
                <Box key={b._id}>
                  <Paper
                    className="card-3d"
                    sx={{
                      p: 3,
                      borderRadius: "16px",
                      border: `1px solid ${themeConfig.border}`,
                      bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                      background: isDarkMode ? (themeConfig.bgCard || "#0E312C") : "linear-gradient(135deg, #FFFFFF 0%, #F9FBFC 100%)",
                      boxShadow: isDarkMode ? "none" : "0 6px 18px rgba(12, 39, 59, 0.05), inset 0 1px 1px #FFFFFF",
                    }}
                  >
                    <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
                      <div>
                        <Typography variant="subtitle1" sx={{ fontWeight: 900, color: themeConfig.textMain }}>
                          {(() => {
                            const roomsList = Array.isArray(b.roomNumbers) && b.roomNumbers.length > 0
                              ? b.roomNumbers.map(String)
                              : b.roomNumber
                              ? String(b.roomNumber).split(",").map((s) => s.trim()).filter(Boolean)
                              : [b.room?.roomNumber || "N/A"];
                            return roomsList.length > 1 ? `Rooms ${roomsList.join(", ")}` : `Room ${roomsList[0]}`;
                          })()} - {b.guest?.name || b.guest?.fullName}
                        </Typography>
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted }}>
                          Folio: #{b.bookingNumber} &bull; Due: <strong style={{ color: themeConfig.danger }}>₹{(b.dueAmount || 0).toLocaleString()}</strong>
                        </Typography>
                      </div>
                      <Typography variant="h6" sx={{ fontWeight: 900, color: themeConfig.primary }}>
                        ₹{((b.totalAmount || 0) + (b.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0)).toLocaleString()}
                      </Typography>
                    </Box>

                    <Divider sx={{ my: 1.5, borderColor: themeConfig.border }} />

                    <Typography variant="caption" sx={{ fontWeight: 800, color: themeConfig.textMuted, textTransform: "uppercase", letterSpacing: 0.5 }}>
                      Itemized POS Charges:
                    </Typography>
                    <Box sx={{ my: 1.5, display: "flex", flexDirection: "column", gap: 0.8 }}>
                      {(b.posCharges || []).length === 0 ? (
                        <Typography variant="caption" sx={{ color: themeConfig.textMuted, display: "block" }}>
                          No add-on charges posted yet.
                        </Typography>
                      ) : (
                        b.posCharges.map((c, i) => (
                          <Box key={i} sx={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", color: themeConfig.textMain, bgcolor: themeConfig.champagne, p: 0.8, borderRadius: "8px" }}>
                            <span>• {c.item || c.title || c.type || "Service"}</span>
                            <strong>₹{(c.amount || 0).toLocaleString()}</strong>
                          </Box>
                        ))
                      )}
                    </Box>

                    <Box sx={{ display: "flex", gap: 1.5, mt: 2.5 }}>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<Fastfood />}
                        onClick={() => onOpenPosCharge(b)}
                        className="btn-3d"
                        sx={{
                          borderRadius: "10px",
                          borderColor: themeConfig.border,
                          bgcolor: themeConfig.bgCard || (isDarkMode ? "#0E312C" : "#FFFFFF"),
                          color: themeConfig.textMain,
                          fontWeight: 700,
                          boxShadow: isDarkMode ? "none" : "0 2px 4px rgba(0,0,0,0.03)",
                        }}
                      >
                        + Add Charge
                      </Button>
                      <Button
                        fullWidth
                        variant="contained"
                        startIcon={<Receipt />}
                        onClick={() => onOpenInvoice(b)}
                        className="btn-3d"
                        sx={{
                          background: `linear-gradient(135deg, ${themeConfig.primary} 0%, ${themeConfig.primaryDark} 100%)`,
                          color: "#FFFFFF",
                          borderRadius: "10px",
                          fontWeight: 800,
                          boxShadow: `0 4px 12px ${themeConfig.primaryGlow}`,
                        }}
                      >
                        Tax Invoice
                      </Button>
                    </Box>
                  </Paper>
                </Box>
              ))}
            </Box>
          )}
        </Card>
      )}
    </Box>
  );
}
