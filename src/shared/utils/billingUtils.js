import { folioMoney } from "@/shared/utils/folioMoney";

/**
 * Booking bill calculation shared by booking detail screens.
 *
 * Flow: base_amount - discount_amount + extra_charges_total + late_checkout_charge = taxable amount
 *       taxable amount + GST (gst_rate % of taxable amount) = total bill
 */
const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};
const round2 = (n) => Math.round(n * 100) / 100;
const has = (value) => value !== undefined && value !== null && value !== "";

export function computeBookingBill(booking = {}) {
  const b = booking || {};
  const base = toNumber(b.base_amount ?? b.baseAmount);
  const discount = toNumber(b.discount_amount ?? b.discountAmount);
  const extraList = Array.isArray(b.additional_charges) ? b.additional_charges : [];
  const extraFromList = extraList.reduce((sum, c) => sum + toNumber(c?.amount), 0);
  const extra = toNumber(b.extra_charges_total ?? b.extraChargesTotal ?? b.extra_charges ?? b.extraCharges) || extraFromList;
  const late = toNumber(b.late_checkout_charge ?? b.lateCheckoutCharge ?? b.late_checkout_fee ?? b.lateCheckoutFee);
  const lateHours = toNumber(b.late_checkout_hours ?? b.lateCheckoutHours);
  const paid = toNumber(b.paid_amount ?? b.paidAmount);
  const apiTotal = toNumber(b.total_amount ?? b.totalAmount);
  const hasBase = has(b.base_amount ?? b.baseAmount);

  const taxable = hasBase ? Math.max(0, round2(base - discount + extra + late)) : toNumber(b.taxable_amount);

  let gstRate = toNumber(b.gst_rate ?? b.gstRate);
  let gstAmount;
  if (hasBase && gstRate > 0) {
    gstAmount = round2((taxable * gstRate) / 100);
  } else {
    gstAmount = toNumber(b.gst_amount ?? b.tax_amount ?? b.gstAmount);
    if (!gstRate && taxable > 0 && gstAmount > 0) gstRate = round2((gstAmount / taxable) * 100);
  }

  const interstate = toNumber(b.igst_amount) > 0;
  const halfGst = round2(gstAmount / 2);
  const cgst = interstate ? 0 : halfGst;
  const sgst = interstate ? 0 : round2(gstAmount - halfGst);
  const igst = interstate ? gstAmount : 0;

  const total = hasBase ? round2(taxable + gstAmount) : apiTotal;
  const due = Math.max(0, round2(total - paid));

  return { base, discount, extra, late, lateHours, taxable, gstRate, gstAmount, cgst, sgst, igst, total, paid, due, hasBase };
}

/**
 * Check-out bill:
 *   base_amount - discount + extra charges + late check-out = taxable amount
 *   taxable amount + GST (gst_rate %) = total bill  ->  - advance paid = balance due
 * GST therefore applies on the room charge (after discount) and on extra / late charges.
 */
export const computeCheckoutBill = (booking, extraCharges = 0, lateCharge = 0) => {
  const money = folioMoney(booking);
  const rawRate = Number(booking?.gstRate ?? booking?.gst_rate);
  const gstRate = Number.isFinite(rawRate) && rawRate > 0 ? rawRate : 18;
  const extra = Number(extraCharges) || 0;
  const late = Number(lateCharge) || 0;
  const paid = money.paid || 0;

  // Room charge before tax. Older bookings without base_amount: back out GST from the stored room total.
  const storedBase = Number(booking?.base_amount ?? booking?.baseAmount);
  const storedDiscount = Number(booking?.discount_amount ?? booking?.discountAmount) || 0;
  const roomGross = Math.max(money.total, (money.base || 0) + (money.gst || 0));
  const hasBase = Number.isFinite(storedBase) && storedBase > 0;
  const base = hasBase ? storedBase : round2(roomGross / (1 + gstRate / 100));
  const discount = hasBase ? Math.min(storedDiscount, base) : 0;

  const roomTaxable = Math.max(0, round2(base - discount));
  const taxable = round2(roomTaxable + extra + late);
  const gstAmount = round2((taxable * gstRate) / 100);
  const cgst = round2(gstAmount / 2);
  const sgst = round2(gstAmount - cgst);
  const billTotal = round2(taxable + gstAmount);

  return {
    base,
    discount,
    extra,
    late,
    taxable,
    gstRate,
    gstAmount,
    cgst,
    sgst,
    billTotal,
    paid,
    due: Math.max(0, round2(billTotal - paid)),
    // kept for screens that show the room tariff with GST and the GST on extras separately
    roomTotal: round2(roomTaxable + (roomTaxable * gstRate) / 100),
    gstOnAdditional: round2(((extra + late) * gstRate) / 100),
  };
};
