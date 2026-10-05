/**
 * Free Manual WhatsApp Flow Utility (Click-to-Chat / wa.me redirection)
 * 
 * Rules:
 * - NO WhatsApp Cloud API
 * - NO Meta API
 * - NO Paid Providers (Twilio, MSG91, WATI, Interakt, etc.)
 * - NO Backend auto-sending
 * - Opens https://wa.me/{{phone}}?text={{encoded_message}} in a new tab/window
 */

/**
 * Normalizes phone number to international WhatsApp format
 * Standard Indian 10-digit mobile numbers are prepended with '91'
 */
export function normalizeWhatsAppNumber(phone) {
  if (!phone) return { valid: false, reason: "missing" };
  const cleaned = String(phone).replace(/\D/g, "");
  if (!cleaned) return { valid: false, reason: "missing" };

  let normalized = cleaned;

  // 10 digits (Standard Indian mobile) -> add 91
  if (normalized.length === 10) {
    normalized = `91${normalized}`;
  } 
  // 11 digits starting with 0 -> replace 0 with 91
  else if (normalized.length === 11 && normalized.startsWith("0")) {
    normalized = `91${normalized.slice(1)}`;
  } 
  // 12 digits starting with 91 -> keep as is
  else if (normalized.length === 12 && normalized.startsWith("91")) {
    // Valid Indian number
  } 
  // Standard international phone numbers (10 to 15 digits)
  else if (normalized.length < 10 || normalized.length > 15) {
    return { valid: false, reason: "invalid" };
  }

  return { valid: true, number: normalized };
}

/**
 * Opens WhatsApp Click-to-Chat in a new tab
 */
export function openWhatsAppChat(phone, message) {
  const norm = normalizeWhatsAppNumber(phone);
  if (!norm.valid) {
    const errorMsg =
      norm.reason === "missing"
        ? "Guest mobile number is not available. Please update the guest's mobile number first."
        : "Invalid WhatsApp number.";
    return { success: false, error: errorMsg };
  }

  const encoded = encodeURIComponent(message);
  const url = `https://wa.me/${norm.number}?text=${encoded}`;

  if (typeof window !== "undefined") {
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return { success: true, url };
}

/**
 * Formats and triggers the Check-In WhatsApp Message
 */
export function sendCheckInWhatsApp({ booking = {}, guest = {}, hotel = {}, onShowToast = null }) {
  const phone =
    guest?.mobile ||
    guest?.phone ||
    guest?.mobileNumber ||
    booking?.guestMobile ||
    booking?.guestPhone ||
    booking?.guest?.phone ||
    booking?.guest?.mobileNumber ||
    booking?.mobile ||
    booking?.phone;

  const hotelName = hotel?.name || "MYOWNPMS Hotel";
  const guestName =
    guest?.fullName ||
    guest?.name ||
    booking?.guestName ||
    booking?.guest?.name ||
    booking?.guest?.fullName ||
    "Guest";

  const bookingId =
    booking?.bookingNumber ||
    booking?._id ||
    booking?.id ||
    "N/A";

  const roomNumber =
    booking?.roomNumber ||
    booking?.roomNumbers?.join(", ") ||
    booking?.room?.roomNumber ||
    "N/A";

  const checkinDate =
    booking?.checkInDate ? String(booking.checkInDate).split("T")[0] : new Date().toISOString().split("T")[0];

  const checkoutDate =
    booking?.checkOutDate ? String(booking.checkOutDate).split("T")[0] : "Scheduled";

  const guestCount =
    booking?.adults || booking?.guestCount
      ? `${booking?.adults || 1} Adult${(booking?.adults || 1) > 1 ? "s" : ""}${booking?.children ? `, ${booking.children} Child${booking.children > 1 ? "ren" : ""}` : ""}`
      : "1 Guest";

  const message = `🏨 ${hotelName}

Dear ${guestName},

Your check-in has been successfully completed.

🧾 Booking: ${bookingId}
🛏️ Room: ${roomNumber}
📅 Check-in: ${checkinDate}
📅 Check-out: ${checkoutDate}
👥 Guests: ${guestCount}

Thank you for choosing us.
We wish you a pleasant stay! 🙏`;

  const res = openWhatsAppChat(phone, message);
  if (!res.success && onShowToast) {
    onShowToast(res.error, "error");
  } else if (res.success && onShowToast) {
    onShowToast("Opening WhatsApp with pre-filled check-in message...", "success");
  }
  return res;
}

/**
 * Formats and triggers the Checkout & Final Bill WhatsApp Message
 */
export function sendCheckoutBillWhatsApp({
  booking = {},
  guest = {},
  hotel = {},
  settlementData = {},
  onShowToast = null,
}) {
  const phone =
    guest?.mobile ||
    guest?.phone ||
    guest?.mobileNumber ||
    booking?.guestMobile ||
    booking?.guestPhone ||
    booking?.guest?.phone ||
    booking?.guest?.mobileNumber ||
    booking?.mobile ||
    booking?.phone;

  const hotelName = hotel?.name || "MYOWNPMS Hotel";
  const guestName =
    guest?.fullName ||
    guest?.name ||
    booking?.guestName ||
    booking?.guest?.name ||
    booking?.guest?.fullName ||
    "Guest";

  const bookingId =
    booking?.bookingNumber ||
    booking?._id ||
    booking?.id ||
    "N/A";

  const roomNumber =
    booking?.roomNumber ||
    booking?.roomNumbers?.join(", ") ||
    booking?.room?.roomNumber ||
    "N/A";

  // Calculate nights
  let nights = booking?.numberOfNights || 1;
  if (!booking?.numberOfNights && booking?.checkInDate && booking?.checkOutDate) {
    const d1 = new Date(booking.checkInDate);
    const d2 = new Date(booking.checkOutDate);
    const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
    nights = diff > 0 ? diff : 1;
  }

  // Tariff & Taxes Calculations
  const lateFee = settlementData?.lateCheckoutFee || booking?.lateCheckoutCharge || 0;
  const lateHours = settlementData?.lateCheckoutHours || booking?.lateCheckoutHours || 0;
  const isLate = lateFee > 0;

  const totalBookingAmount = booking?.totalAmount || booking?.tariffAmount || 3000;
  const roomAmount = isLate && totalBookingAmount > lateFee ? totalBookingAmount - lateFee : totalBookingAmount;
  const posTotal = (booking?.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
  const grandTotal = totalBookingAmount + (isLate && totalBookingAmount === roomAmount ? lateFee : 0) + posTotal;

  const advancePaid = isLate && (booking?.paidAmount || 0) > lateFee ? (booking.paidAmount - lateFee) : (booking?.paidAmount || roomAmount);
  const paidAmount =
    settlementData?.settlementPaymentAmount !== undefined
      ? (booking?.paidAmount || 0) + (Number(settlementData?.settlementPaymentAmount) || 0)
      : (booking?.paidAmount || grandTotal);
  const balanceDue = Math.max(0, grandTotal - paidAmount);

  const message = `🏨 ${hotelName}

Dear ${guestName},

Thank you for staying with us.

🧾 Booking: #${bookingId}
🛏️ Room: #${roomNumber}
🌙 Nights: ${nights}

💰 Room Charge: ₹${roomAmount.toLocaleString()}
💳 Advance Paid: ₹${advancePaid.toLocaleString()}${isLate ? `\n⏰ Late Checkout (${lateHours}h): +₹${lateFee.toLocaleString()}` : ""}${posTotal > 0 ? `\n🛎️ Ancillary Services: +₹${posTotal.toLocaleString()}` : ""}
💳 Total Paid: ₹${paidAmount.toLocaleString()}
${balanceDue > 0 ? `⚠️ Balance Due: ₹${balanceDue.toLocaleString()}` : "✅ Balance: ₹0 (Fully Settled)"}

*Final Total: ₹${grandTotal.toLocaleString()}*

Thank you for choosing ${hotelName}.
We hope to welcome you again soon! 🙏`;

  const res = openWhatsAppChat(phone, message);
  if (!res.success && onShowToast) {
    onShowToast(res.error, "error");
  } else if (res.success && onShowToast) {
    onShowToast("Opening WhatsApp with pre-filled checkout bill...", "success");
  }
  return res;
}
