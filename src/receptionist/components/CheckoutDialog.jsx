"use client";

import { useEffect, useState } from "react";
import {
  Avatar,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { Check, Close, ContentCopy, Logout, MeetingRoom } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { loadBookingDetail } from "@/shared/utils/folioMoney";
import { computeCheckoutBill } from "@/shared/utils/billingUtils";
import FolioPdfButton from "@/shared/components/FolioPdfButton";

const sanitizeAmount = (value) => {
  const cleaned = String(value || "").replace(/[^\d.]/g, "");
  const [whole, ...rest] = cleaned.split(".");
  return rest.length ? `${whole.slice(0, 7)}.${rest.join("").slice(0, 2)}` : whole.slice(0, 7);
};

const inr = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;

const EMPTY = {
  detail: null,
  lateFee: 0,
  lateHours: 0,
  extraCharges: 0,
  discount: 0,
  notes: "",
  paymentMethod: "CASH",
  amount: 0,
  transactionId: "",
};

/**
 * Single check-out screen used everywhere in the receptionist app.
 *
 * Props:
 *  - open / onClose
 *  - booking: booking (summary or detail) to check out
 *  - roomNumber: optional room label for the title
 *  - hotelSettings
 *  - onCheckOut(booking, payload): performs the check-out (may throw)
 *  - onDone(): called after a successful check-out
 */
export default function CheckoutDialog({ open, onClose, booking, roomNumber, hotelSettings, onCheckOut, onDone }) {
  const { themeConfig } = useAppTheme();
  const [state, setState] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copiedUpi, setCopiedUpi] = useState(false);

  useEffect(() => {
    if (!open || !booking) return undefined;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      setState(EMPTY);
      try {
        const detail = await loadBookingDetail(booking);
        if (cancelled) return;
        const posTotal = (detail.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
        // Keep charges already saved on the booking (e.g. deposit); otherwise start from POS charges
        const extraCharges = Number(detail.extra_charges_total ?? detail.extraChargesTotal) || posTotal;
        const discount = Number(detail.discount_amount ?? detail.discountAmount) || 0;
        // Late check-out charges are entered by the receptionist (no automatic counting)
        const due = computeCheckoutBill(detail, extraCharges, 0, discount).due;
        setState({
          ...EMPTY,
          detail,
          extraCharges,
          discount,
          amount: due,
        });
      } catch (err) {
        if (!cancelled) setError(err?.message || "Could not load booking details");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, booking?._id, booking?.id]);

  const update = (patch) => setState((prev) => ({ ...prev, ...patch }));

  // Update a charge field and recalculate the balance to collect (unless the amount itself was edited)
  const updateCharges = (patch) =>
    setState((prev) => {
      const next = { ...prev, ...patch };
      next.amount = computeCheckoutBill(next.detail, next.extraCharges, next.lateFee, next.discount).due;
      return next;
    });

  const detail = state.detail;
  const guestObj = detail?.guest || {};
  const guestName =
    guestObj.fullName || guestObj.name || detail?.guestName || detail?.primary_guest_name || "Guest";
  const guestPhone = guestObj.phoneNumber || guestObj.phone || detail?.guestPhone || detail?.mobile_number || "";
  const bookingNumber = detail?.bookingNumber || detail?.booking_number || "Active";

  const bill = computeCheckoutBill(detail, state.extraCharges, state.lateFee, state.discount);
  const collectNow = Number(state.amount) || 0;
  const collectError = collectNow > bill.due + 0.001 ? "Cannot exceed the balance due" : "";
  const remainingAfter = Math.max(0, bill.due - collectNow);
  const lateHoursValue = Number(state.lateHours) || 0;

  const hotelUpi = hotelSettings?.upiId || "jatinkakadiya234-1@okicici";
  const upiPayee = encodeURIComponent(hotelSettings?.hotelName || "Hotel");
  const upiNote = encodeURIComponent(`Room ${roomNumber || ""} Checkout Settlement`);
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `upi://pay?pa=${hotelUpi}&pn=${upiPayee}&am=${collectNow}&cu=INR&tn=${upiNote}`
  )}`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(hotelUpi);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleConfirm = async () => {
    if (!detail || !onCheckOut) return;
    try {
      setSubmitting(true);
      setError("");
      await onCheckOut(detail, {
        paymentMethod: state.paymentMethod,
        extraCharges: Number(state.extraCharges) || 0,
        discount: Number(state.discount) || 0,
        notes: state.notes || "",
        settlementPaymentAmount: collectNow,
        lateCheckoutFee: Number(state.lateFee) || 0,
        lateCheckoutType: Number(state.lateFee) > 0 ? "manual" : "none",
        lateCheckoutHours: lateHoursValue,
        transactionId: state.transactionId,
        paymentReference: "",
      });
      if (onDone) await onDone();
      onClose();
    } catch (err) {
      setError(err?.message || "Failed to check out");
    } finally {
      setSubmitting(false);
    }
  };

  const sectionTitle = (title) => (
    <Typography
      sx={{
        fontWeight: 700,
        fontSize: "0.85rem",
        color: themeConfig.textMain,
        pb: 1,
        mb: 1.5,
        borderBottom: `1px solid ${themeConfig.border}`,
      }}
    >
      {title}
    </Typography>
  );

  const billRow = (label, value, opts = {}) => (
    <Box
      key={label}
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "baseline",
        gap: 2,
        py: 0.7,
        ...(opts.strong ? { mt: 0.5, pt: 1.25, borderTop: `1px solid ${themeConfig.border}` } : {}),
      }}
    >
      <Box sx={{ minWidth: 0 }}>
        <Typography
          component="span"
          sx={{ color: themeConfig.textMain, fontSize: opts.strong ? "0.92rem" : "0.86rem", fontWeight: opts.strong ? 700 : 500 }}
        >
          {label}
        </Typography>
        {opts.hint ? (
          <Typography component="span" sx={{ color: themeConfig.textMuted, fontSize: "0.76rem", ml: 1 }}>
            {opts.hint}
          </Typography>
        ) : null}
      </Box>
      <Typography
        sx={{
          color: opts.color || themeConfig.textMain,
          fontSize: opts.strong ? "0.98rem" : "0.86rem",
          fontWeight: opts.strong ? 700 : 600,
          whiteSpace: "nowrap",
        }}
      >
        {value}
      </Typography>
    </Box>
  );

  return (
    <Dialog
      open={open}
      onClose={() => !submitting && onClose()}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: "16px",
            border: `1px solid ${themeConfig.border}`,
            bgcolor: themeConfig.bgCard || "#FFFFFF",
            overflow: "hidden",
            maxHeight: "90vh",
          },
        },
      }}
    >
      <DialogTitle component="div" sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", pb: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.2 }}>
          <Avatar sx={{ bgcolor: themeConfig.primary, width: 36, height: 36, color: "#FFF", fontWeight: 900 }}>
            <MeetingRoom sx={{ fontSize: 20 }} />
          </Avatar>
          <div>
            <Typography component="div" variant="h6" sx={{ fontWeight: 900, color: themeConfig.textMain, lineHeight: 1.2 }}>
              {roomNumber ? `Check-out · Room #${roomNumber}` : "Check-out"}
            </Typography>
            <Typography variant="caption" sx={{ color: themeConfig.textMuted, fontWeight: 700 }}>
              Review the bill, collect payment and release the room
            </Typography>
          </div>
        </Box>
        <IconButton onClick={onClose} disabled={submitting} sx={{ borderRadius: "10px" }}>
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers sx={{ borderColor: themeConfig.border, display: "flex", flexDirection: "column", gap: 3 }}>
        {loading || !detail ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 6 }}>
            {error ? (
              <Typography sx={{ color: themeConfig.tones.danger.color, fontWeight: 600, fontSize: "0.9rem" }}>{error}</Typography>
            ) : (
              <CircularProgress size={28} />
            )}
          </Box>
        ) : (
          <>
            {/* Guest */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1.5,
                p: 1.75,
                borderRadius: "12px",
                border: `1px solid ${themeConfig.border}`,
                bgcolor: themeConfig.bgSubtle,
              }}
            >
              <Avatar sx={{ bgcolor: themeConfig.primary, width: 40, height: 40, fontWeight: 700, fontSize: "1rem" }}>
                {guestName.charAt(0).toUpperCase()}
              </Avatar>
              <Box sx={{ minWidth: 0, flex: 1 }}>
                <Typography noWrap sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.95rem" }}>
                  {guestName}
                </Typography>
                <Typography noWrap sx={{ color: themeConfig.textMuted, fontSize: "0.8rem" }}>
                  {[guestPhone, `Folio #${bookingNumber}`].filter(Boolean).join("  ·  ")}
                </Typography>
              </Box>
            </Box>

            {/* Additional charges */}
            <Box>
              {sectionTitle("Additional charges")}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }, gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  autoComplete="off"
                  label="Extra charges (₹)"
                  placeholder="0"
                  value={Number(state.extraCharges) ? state.extraCharges : ""}
                  onChange={(e) => updateCharges({ extraCharges: sanitizeAmount(e.target.value) })}
                  slotProps={{ htmlInput: { inputMode: "decimal" } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  autoComplete="off"
                  label="Discount (₹)"
                  placeholder="0"
                  value={Number(state.discount) ? state.discount : ""}
                  onChange={(e) => updateCharges({ discount: sanitizeAmount(e.target.value) })}
                  slotProps={{ htmlInput: { inputMode: "decimal" } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  autoComplete="off"
                  label="Late check-out hours"
                  placeholder="0"
                  value={Number(state.lateHours) ? state.lateHours : ""}
                  onChange={(e) => update({ lateHours: sanitizeAmount(e.target.value).split(".")[0] })}
                  slotProps={{ htmlInput: { inputMode: "numeric" } }}
                />
                <TextField
                  fullWidth
                  size="small"
                  autoComplete="off"
                  label="Late check-out charge (₹)"
                  placeholder="0"
                  value={Number(state.lateFee) ? state.lateFee : ""}
                  onChange={(e) => updateCharges({ lateFee: sanitizeAmount(e.target.value) })}
                  slotProps={{ htmlInput: { inputMode: "decimal" } }}
                />
              </Box>
            </Box>

            {/* Bill calculation */}
            <Box>
              {sectionTitle("Bill calculation")}
              <Box sx={{ p: 2, borderRadius: "12px", border: `1px solid ${themeConfig.border}`, bgcolor: themeConfig.bgCard || "#FFFFFF" }}>
                {billRow("Room charges", inr(bill.base), { hint: "Before tax" })}
                {billRow("Discount", bill.discount > 0 ? `-${inr(bill.discount)}` : inr(0), {
                  color: bill.discount > 0 ? themeConfig.tones.success.color : undefined,
                })}
                {billRow("Extra charges", bill.extra > 0 ? `+${inr(bill.extra)}` : inr(0))}
                {billRow("Late check-out charges", bill.late > 0 ? `+${inr(bill.late)}` : inr(0), {
                  hint: lateHoursValue ? `${lateHoursValue}h` : "",
                })}
                {billRow("Taxable amount", inr(bill.taxable), { strong: true })}
                {billRow(`CGST (${bill.gstRate / 2}%)`, `+${inr(bill.cgst)}`)}
                {billRow(`SGST (${bill.gstRate / 2}%)`, `+${inr(bill.sgst)}`)}
                {billRow("Total bill", inr(bill.billTotal), { strong: true, hint: "Taxable amount + GST" })}
                {billRow("Advance paid", `-${inr(bill.paid)}`, { color: themeConfig.tones.success.color })}
                {billRow("Balance due", inr(bill.due), {
                  strong: true,
                  hint: `${inr(bill.billTotal)} - ${inr(bill.paid)}`,
                  color: bill.due > 0 ? themeConfig.tones.danger.color : themeConfig.tones.success.color,
                })}
                {collectNow > 0 && billRow("Collecting now", `-${inr(collectNow)}`, { color: themeConfig.tones.success.color })}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    mt: 1,
                    px: 1.5,
                    py: 1,
                    borderRadius: "10px",
                    bgcolor: remainingAfter > 0 ? themeConfig.tones.danger.bg : themeConfig.tones.success.bg,
                  }}
                >
                  <Typography sx={{ fontWeight: 700, fontSize: "0.88rem", color: remainingAfter > 0 ? themeConfig.tones.danger.color : themeConfig.tones.success.color }}>
                    {remainingAfter > 0 ? "Remaining after check-out" : "Fully settled"}
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: "1rem", color: remainingAfter > 0 ? themeConfig.tones.danger.color : themeConfig.tones.success.color }}>
                    {inr(remainingAfter)}
                  </Typography>
                </Box>
                <Typography sx={{ mt: 1.5, color: themeConfig.textMuted, fontSize: "0.76rem", lineHeight: 1.6 }}>
                  {`${inr(bill.base)} - ${inr(bill.discount)} discount + ${inr(bill.extra)} extra + ${inr(bill.late)} late = ${inr(bill.taxable)}; + ${bill.gstRate}% GST ${inr(bill.gstAmount)} = ${inr(bill.billTotal)}; - ${inr(bill.paid)} advance = ${inr(bill.due)} due`}
                </Typography>
              </Box>
            </Box>

            {/* Payment */}
            <Box>
              {sectionTitle("Payment")}
              <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Payment method"
                  value={state.paymentMethod || "CASH"}
                  onChange={(e) => update({ paymentMethod: e.target.value })}
                >
                  <MenuItem value="CASH">Cash</MenuItem>
                  <MenuItem value="UPI">UPI</MenuItem>
                  <MenuItem value="CARD">Card</MenuItem>
                  <MenuItem value="ONLINE">Online</MenuItem>
                  <MenuItem value="BANK_TRANSFER">Bank transfer</MenuItem>
                </TextField>
                <TextField
                  fullWidth
                  size="small"
                  autoComplete="off"
                  label="Amount collected (₹)"
                  placeholder="0"
                  value={Number(state.amount) ? state.amount : ""}
                  error={Boolean(collectError)}
                  helperText={collectError}
                  onChange={(e) => update({ amount: sanitizeAmount(e.target.value) })}
                  slotProps={{ htmlInput: { inputMode: "decimal" } }}
                />
                {state.paymentMethod !== "CASH" && (
                  <TextField
                    fullWidth
                    size="small"
                    autoComplete="off"
                    label="Reference number"
                    placeholder="Transaction or reference no."
                    value={state.transactionId || ""}
                    onChange={(e) => update({ transactionId: e.target.value })}
                  />
                )}
                <Box sx={{ gridColumn: { sm: "1 / -1" } }}>
                  <TextField
                    fullWidth
                    size="small"
                    autoComplete="off"
                    label="Notes"
                    placeholder="e.g. Collected remaining balance at the desk"
                    value={state.notes || ""}
                    onChange={(e) => update({ notes: e.target.value })}
                  />
                </Box>
              </Box>

              {state.paymentMethod === "UPI" && collectNow > 0 && (
                <Box
                  sx={{
                    mt: 2,
                    p: 1.5,
                    borderRadius: "12px",
                    border: `1px solid ${themeConfig.border}`,
                    bgcolor: themeConfig.bgSubtle,
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    flexWrap: "wrap",
                  }}
                >
                  <Box
                    component="img"
                    src={qrCodeUrl}
                    alt="UPI payment QR code"
                    sx={{ width: 96, height: 96, borderRadius: "8px", border: `1px solid ${themeConfig.border}`, bgcolor: "#FFFFFF", p: 0.5 }}
                  />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.85rem" }}>
                      Scan to pay {inr(collectNow)}
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                      <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.78rem" }}>UPI ID: {hotelUpi}</Typography>
                      <Tooltip title={copiedUpi ? "Copied" : "Copy UPI ID"}>
                        <IconButton size="small" onClick={handleCopyUpi} sx={{ p: 0.4, color: themeConfig.primary }}>
                          {copiedUpi ? <Check sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Box>
                </Box>
              )}
            </Box>

            {error ? (
              <Typography sx={{ color: themeConfig.tones.danger.color, fontWeight: 600, fontSize: "0.85rem" }}>{error}</Typography>
            ) : null}
          </>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} disabled={submitting} sx={{ borderRadius: "10px", fontWeight: 700 }}>
          Cancel
        </Button>
        <FolioPdfButton booking={state.detail || booking} label="Generate Folio" />
        <Button
          variant="contained"
          disabled={submitting || loading || !detail || Boolean(collectError)}
          onClick={handleConfirm}
          startIcon={<Logout sx={{ fontSize: 16 }} />}
          sx={{
            bgcolor: themeConfig.primary,
            color: "#FFFFFF",
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "10px",
            px: 3,
            height: 40,
            boxShadow: "none",
            "&:hover": { bgcolor: themeConfig.primaryDark, boxShadow: "none" },
          }}
        >
          {submitting ? "Processing..." : collectNow > 0 ? `Collect ${inr(collectNow)} & check out` : "Complete check-out"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
