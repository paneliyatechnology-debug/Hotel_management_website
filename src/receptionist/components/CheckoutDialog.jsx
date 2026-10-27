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
import { Check, Close, Logout, MeetingRoom } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { loadBookingDetail } from "@/shared/utils/folioMoney";
import { computeCheckoutBill } from "@/shared/utils/billingUtils";
import FolioPdfButton from "@/shared/components/FolioPdfButton";
import { paymentMethodLabel, useHotelPaymentMethods } from "@/shared/hooks/useHotelPaymentMethods";
import { resolveBookingGuestNames } from "@/shared/utils/guestUtils";

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
  const { methods: hotelPaymentMethods, defaultName: defaultPaymentMethod } = useHotelPaymentMethods({
    enabled: Boolean(open),
  });
  const [state, setState] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

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
        const initialDiscount = Number(detail.discount_amount ?? detail.discountAmount) || 0;
        // Late check-out charges are entered by the receptionist (no automatic counting)
        const billInitial = computeCheckoutBill(detail, extraCharges, 0, initialDiscount);
        const safeDiscount = Math.min(initialDiscount, billInitial.maxDiscount);
        setState({
          ...EMPTY,
          detail,
          extraCharges,
          discount: safeDiscount,
          amount: billInitial.due,
          paymentMethod: defaultPaymentMethod,
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

  useEffect(() => {
    if (!hotelPaymentMethods.length) return;
    setState((prev) => {
      const current = String(prev.paymentMethod || "").trim();
      const match = hotelPaymentMethods.find((item) => item.name.toLowerCase() === current.toLowerCase());
      const next = match?.name || defaultPaymentMethod;
      return next === prev.paymentMethod ? prev : { ...prev, paymentMethod: next };
    });
  }, [hotelPaymentMethods, defaultPaymentMethod]);

  const update = (patch) => setState((prev) => ({ ...prev, ...patch }));

  // Charge edits always reset collected amount to the exact balance due
  const updateCharges = (patch) =>
    setState((prev) => {
      const next = { ...prev, ...patch };
      const rawDiscount = next.discount === "" ? 0 : Number(next.discount) || 0;
      next.amount = computeCheckoutBill(next.detail, next.extraCharges, next.lateFee, rawDiscount).due;
      return next;
    });

  const detail = state.detail;
  const guestObj = detail?.guest || {};
  const guestName =
    resolveBookingGuestNames(detail).primaryGuestName || guestObj.fullName || guestObj.name || detail?.guestName || "Guest";
  const guestPhone = guestObj.phoneNumber || guestObj.phone || detail?.guestPhone || detail?.mobile_number || "";
  const bookingNumber = detail?.bookingNumber || detail?.booking_number || "Active";

  const bill = computeCheckoutBill(detail, state.extraCharges, state.lateFee, state.discount);
  // Always collect exactly the balance due — no more, no less (sent to API, not shown in UI)
  const collectNow = bill.due;
  const enteredDiscount = state.discount === "" ? 0 : Number(state.discount) || 0;
  let discountError = "";
  if (enteredDiscount > bill.base + 0.001) {
    discountError = `Discount cannot exceed room charges (${inr(bill.base)})`;
  } else if (bill.paid > 0 && bill.maxDiscount <= 0.001 && enteredDiscount > 0.001) {
    discountError = `No discount allowed (Booking is already fully covered by advance paid of ${inr(bill.paid)})`;
  } else if (bill.paid > 0 && enteredDiscount > bill.maxDiscount + 0.001) {
    discountError = `Discount cannot exceed ${inr(bill.maxDiscount)} (Total bill cannot be less than advance paid of ${inr(bill.paid)})`;
  }
  const remainingAfter = 0;
  const lateHoursValue = Number(state.lateHours) || 0;
  const lateHoursError =
    lateHoursValue > 24
      ? "Late check-out hours cannot be more than 24"
      : "";

  // Keep stored amount locked to due whenever charges change
  useEffect(() => {
    if (!detail) return;
    setState((prev) => {
      if (Math.abs((Number(prev.amount) || 0) - bill.due) < 0.009) return prev;
      return { ...prev, amount: bill.due };
    });
  }, [detail, bill.due]);



  const handleConfirm = async () => {
    if (!detail || !onCheckOut) return;
    const currentBill = computeCheckoutBill(detail, state.extraCharges, state.lateFee, state.discount);
    if (discountError) {
      setError(discountError);
      return;
    }
    if (currentBill.isOverpaid || currentBill.billTotal < currentBill.paid - 0.009) {
      setError(
        `Discount cannot exceed ${inr(currentBill.maxDiscount)} (Total bill of ${inr(currentBill.billTotal)} cannot be less than advance paid of ${inr(currentBill.paid)})`
      );
      return;
    }
    if (lateHoursValue > 24) {
      setError("Late check-out hours cannot be more than 24");
      return;
    }
    try {
      setSubmitting(true);
      setError("");
      await onCheckOut(detail, {
        paymentMethod: state.paymentMethod,
        extraCharges: Number(state.extraCharges) || 0,
        discount: Math.min(Number(state.discount) || 0, currentBill.maxDiscount),
        notes: state.notes || "",
        settlementPaymentAmount: currentBill.due,
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
      onClose={(_, reason) => {
        if (submitting) return;
        if (reason === "backdropClick" || reason === "escapeKeyDown") return;
        onClose();
      }}
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
          <Avatar sx={{ bgcolor: themeConfig.primary, width: 36, height: 36, color: themeConfig.onPrimary, fontWeight: 900 }}>
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
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
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

                {/* Temporarily hidden: Discount field
                <TextField
                  fullWidth
                  size="small"
                  autoComplete="off"
                  label="Discount (₹)"
                  placeholder="0"
                  value={Number(state.discount) ? state.discount : (state.discount === "0" ? "0" : "")}
                  error={Boolean(discountError)}
                  helperText={
                    discountError ||
                    (bill.maxDiscount <= 0
                      ? `Max ₹0 (Already fully paid with ${inr(bill.paid)})`
                      : `Max ${inr(bill.maxDiscount)}`)
                  }
                  onChange={(e) => {
                    const raw = sanitizeAmount(e.target.value);
                    updateCharges({ discount: raw });
                  }}
                  slotProps={{ htmlInput: { inputMode: "decimal" } }}
                />
                */}

                <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" }, gap: 2 }}>
                  <TextField
                    fullWidth
                    size="small"
                    autoComplete="off"
                    label="Late check-out hours"
                    placeholder="0"
                    value={Number(state.lateHours) ? state.lateHours : ""}
                    error={Boolean(lateHoursError)}
                    helperText={lateHoursError || "Maximum 24 hours"}
                    onChange={(e) => {
                      const hours = sanitizeAmount(e.target.value).split(".")[0];
                      update({ lateHours: hours });
                    }}
                    slotProps={{ htmlInput: { inputMode: "numeric", max: 24 } }}
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
            </Box>

            {/* Payment method + notes above; bill calculation below */}
            <Box>
              {sectionTitle("Payment")}
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Payment method"
                  value={hotelPaymentMethods.some((item) => item.name === state.paymentMethod) ? state.paymentMethod : (hotelPaymentMethods[0]?.name || "")}
                  onChange={(e) => update({ paymentMethod: e.target.value })}
                >
                  {hotelPaymentMethods.map((item) => (
                    <MenuItem key={item.id || item.name} value={item.name}>
                      {paymentMethodLabel(item.name)}
                    </MenuItem>
                  ))}
                </TextField>
                {String(state.paymentMethod || "").toUpperCase() !== "CASH" && (
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

            <Box>
              {sectionTitle("Bill calculation")}
              <Box sx={{ p: 2, borderRadius: "12px", border: `1px solid ${themeConfig.border}`, bgcolor: themeConfig.bgCard || "#FFFFFF" }}>
                {billRow("Room charges", inr(bill.base), { hint: "Before tax" })}
                {billRow("Discount", bill.discount > 0 ? `-${inr(bill.discount)}` : inr(0), {
                  color: bill.discount > 0 ? (discountError ? themeConfig.tones.danger.color : themeConfig.tones.success.color) : undefined,
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
                {bill.isOverpaid ? (
                  billRow("Balance due", inr(0), {
                    strong: true,
                    hint: `${inr(bill.billTotal)} - ${inr(bill.paid)} (Overpaid by ${inr(bill.overpaidAmount)})`,
                    color: themeConfig.tones.danger.color,
                  })
                ) : (
                  billRow("Balance due", inr(bill.due), {
                    strong: true,
                    hint: `${inr(bill.billTotal)} - ${inr(bill.paid)}`,
                    color: bill.due > 0 ? themeConfig.tones.danger.color : themeConfig.tones.success.color,
                  })
                )}
                {collectNow > 0 && billRow("Collecting now", `-${inr(collectNow)}`, { color: themeConfig.tones.success.color })}
                {bill.isOverpaid ? (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      mt: 1,
                      px: 1.5,
                      py: 1,
                      borderRadius: "10px",
                      bgcolor: themeConfig.tones.danger.bg,
                    }}
                  >
                    <Typography sx={{ fontWeight: 700, fontSize: "0.85rem", color: themeConfig.tones.danger.color }}>
                      Discount exceeds allowable limit (Bill less than advance)
                    </Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: "0.95rem", color: themeConfig.tones.danger.color }}>
                      -{inr(bill.overpaidAmount)}
                    </Typography>
                  </Box>
                ) : (
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
                )}
                <Typography sx={{ mt: 1.5, color: bill.isOverpaid ? themeConfig.tones.danger.color : themeConfig.textMuted, fontSize: "0.76rem", lineHeight: 1.6 }}>
                  {bill.isOverpaid
                    ? `${inr(bill.base)} - ${inr(bill.discount)} discount + ${inr(bill.extra)} extra + ${inr(bill.late)} late = ${inr(bill.taxable)}; + ${bill.gstRate}% GST ${inr(bill.gstAmount)} = ${inr(bill.billTotal)}; - ${inr(bill.paid)} advance = -${inr(bill.overpaidAmount)} (Advance exceeds total bill by ${inr(bill.overpaidAmount)})`
                    : `${inr(bill.base)} - ${inr(bill.discount)} discount + ${inr(bill.extra)} extra + ${inr(bill.late)} late = ${inr(bill.taxable)}; + ${bill.gstRate}% GST ${inr(bill.gstAmount)} = ${inr(bill.billTotal)}; - ${inr(bill.paid)} advance = ${inr(bill.due)} due`}
                </Typography>
              </Box>
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
          disabled={submitting || loading || !detail || Boolean(discountError) || Boolean(lateHoursError) || bill.isOverpaid}
          onClick={handleConfirm}
          startIcon={<Logout sx={{ fontSize: 16 }} />}
          sx={{
            bgcolor: themeConfig.primary,
            color: themeConfig.onPrimary,
            fontWeight: 600,
            textTransform: "none",
            borderRadius: "10px",
            px: 3,
            height: 40,
            boxShadow: "none",
            "&:hover": { bgcolor: themeConfig.primaryDark, boxShadow: "none" },
          }}
        >
          {submitting
            ? "Processing..."
            : bill.isOverpaid
              ? "Reduce discount to proceed"
              : collectNow > 0
                ? `Collect ${inr(collectNow)} & check out`
                : "Complete check-out"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
