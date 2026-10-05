/**
 * Hotel Timings & Timezone Utility Helpers
 */

/**
 * Converts 24-hour time "HH:mm" (e.g. "14:00") into 12-hour format "hh:mm AM/PM" (e.g. "02:00 PM")
 */
export function formatTime12Hour(time24) {
  if (!time24) return "12:00 PM";
  const str = String(time24).trim();
  
  // If already in 12-hour AM/PM format
  if (/AM|PM/i.test(str)) {
    return str.toUpperCase();
  }

  const parts = str.split(":");
  if (parts.length < 2) return str;

  let hours = parseInt(parts[0], 10);
  const minutes = parts[1].padStart(2, "0");
  if (isNaN(hours)) return str;

  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12; // '0' should be '12'
  const formattedHours = hours.toString().padStart(2, "0");

  return `${formattedHours}:${minutes} ${ampm}`;
}

/**
 * Converts 12-hour format "hh:mm AM/PM" (e.g. "02:00 PM") to 24-hour "HH:mm" (e.g. "14:00")
 */
export function formatTime24Hour(time12) {
  if (!time12) return "14:00";
  const str = String(time12).trim();

  const match = str.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return str;

  let hours = parseInt(match[1], 10);
  const minutes = match[2].padStart(2, "0");
  const period = match[3] ? match[3].toUpperCase() : null;

  if (period === "PM" && hours < 12) hours += 12;
  if (period === "AM" && hours === 12) hours = 0;

  return `${hours.toString().padStart(2, "0")}:${minutes}`;
}

/**
 * Formats time with timezone label
 * e.g. "02:00 PM (Asia/Kolkata)"
 */
export function formatTimeWithZone(time, timezone = "Asia/Kolkata") {
  const formattedTime = formatTime12Hour(time);
  return `${formattedTime} (${timezone})`;
}

/**
 * Calculates turnover / turnaround window between check-out and check-in
 */
export function getTurnaroundWindow(checkInTime = "14:00", checkOutTime = "12:00") {
  const tIn = formatTime24Hour(checkInTime);
  const tOut = formatTime24Hour(checkOutTime);

  const [inH, inM] = tIn.split(":").map(Number);
  const [outH, outM] = tOut.split(":").map(Number);

  if (isNaN(inH) || isNaN(outH)) return null;

  const inMinutes = inH * 60 + (inM || 0);
  const outMinutes = outH * 60 + (outM || 0);

  let diffMinutes = inMinutes - outMinutes;
  if (diffMinutes < 0) {
    diffMinutes += 24 * 60;
  }

  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;

  if (mins === 0) {
    return `${hours} hour${hours > 1 ? "s" : ""}`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Validates check-in and check-out timings according to hotel booking rules
 */
export function validateHotelTimings(checkInTime, checkOutTime) {
  if (!checkInTime || !checkOutTime) {
    return { valid: false, error: "Both Check-in Time and Check-out Time are required." };
  }

  const tIn = formatTime24Hour(checkInTime);
  const tOut = formatTime24Hour(checkOutTime);

  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(tIn)) {
    return { valid: false, error: "Invalid Check-in Time format." };
  }
  if (!timeRegex.test(tOut)) {
    return { valid: false, error: "Invalid Check-out Time format." };
  }

  if (tIn === tOut) {
    return { valid: false, error: "Check-in Time and Check-out Time cannot be identical." };
  }

  const [inH, inM] = tIn.split(":").map(Number);
  const [outH, outM] = tOut.split(":").map(Number);
  const inMinutes = inH * 60 + inM;
  const outMinutes = outH * 60 + outM;

  // In standard hotel PMS operations, checkOut is before checkIn on turnaround day
  if (outMinutes > inMinutes && outMinutes - inMinutes < 720) {
    return {
      valid: false,
      error: "Check-out Time must be earlier than Check-in Time to allow housekeeping room turnover before incoming guests arrive.",
    };
  }

  return { valid: true };
}

/**
 * Automatically calculates late check-out / overstay billing tariff.
 * - Grace Period: 5-10 minutes (default 10 minutes from hotelSettings). Within grace period => ₹0 extra charge.
 * - Beyond Grace Period:
 *     Hourly Rate = Daily Room Rent / 12 (Strict 12 hours/day formula)
 *     Hourly Charge = Hourly Rate * Chargeable Late Hours
 *     Full Day Charge = Daily Room Rent * Math.max(1, Math.ceil(Chargeable Late Hours / 24))
 * - Supports user option selection: 'hourly' vs 'full_day'
 */
export function calculateOverstayFee(booking, hotelSettings = {}, options = {}) {
  if (!booking || (booking.status && booking.status !== "CHECKED_IN" && booking.status !== "CONFIRMED")) {
    return {
      isOverstay: false,
      isLate: false,
      isWithinGracePeriod: false,
      gracePeriodMinutes: 10,
      overdueMinutes: 0,
      overdueHours: 0,
      chargeableHours: 0,
      dailyRate: 0,
      hourlyRate: 0,
      fullDayCharge: 0,
      hourlyCharge: 0,
      lateFee: 0,
      lateCheckoutType: "none",
      description: "",
    };
  }

  const outDateStr = booking.checkOutDate ? String(booking.checkOutDate).split("T")[0] : null;
  if (!outDateStr) {
    return {
      isOverstay: false,
      isLate: false,
      isWithinGracePeriod: false,
      gracePeriodMinutes: 10,
      overdueMinutes: 0,
      overdueHours: 0,
      chargeableHours: 0,
      dailyRate: 0,
      hourlyRate: 0,
      fullDayCharge: 0,
      hourlyCharge: 0,
      lateFee: 0,
      lateCheckoutType: "none",
      description: "",
    };
  }

  const rawOutTime = booking.checkOutTime || hotelSettings?.checkOutTime || "12:00";
  const outTime24 = formatTime24Hour(rawOutTime);
  const [outH, outM] = outTime24.split(":").map(Number);

  // Parse scheduled check-out date & time
  const [year, month, day] = outDateStr.split("-").map(Number);
  const scheduledOutDate = new Date(year, (month || 1) - 1, day || 1, isNaN(outH) ? 12 : outH, isNaN(outM) ? 0 : outM, 0);

  const now = options.checkoutTime ? new Date(options.checkoutTime) : new Date();
  const diffMs = now.getTime() - scheduledOutDate.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  // Configurable Grace Period (default 10 minutes, allowed 5-10 mins)
  const graceMinutes = typeof hotelSettings?.lateCheckoutGraceMinutes === "number"
    ? hotelSettings.lateCheckoutGraceMinutes
    : 10;

  // Calculate daily room rate from booking
  let originalNights = 1;
  if (booking.numberOfNights && booking.numberOfNights > 0) {
    originalNights = Number(booking.numberOfNights);
  } else if (booking.checkInDate && booking.checkOutDate) {
    const inD = new Date(String(booking.checkInDate).split("T")[0]);
    const outD = new Date(outDateStr);
    const diffDays = Math.round((outD - inD) / (1000 * 60 * 60 * 24));
    if (diffDays > 0) originalNights = diffDays;
  }

  const posChargesTotal = (booking.posCharges || []).reduce((s, c) => s + (c.amount || 0), 0);
  const baseRoomTariff = (booking.totalAmount || 0) > posChargesTotal ? (booking.totalAmount - posChargesTotal) : (booking.totalAmount || 0);

  const dailyRate = booking.dailyRoomRate || (baseRoomTariff > 0
    ? Math.round(baseRoomTariff / originalNights)
    : (booking.room?.customPricePerNight || booking.roomType?.basePrice || 3000));

  // Hourly Rate formula: Daily Room Rent / 12
  const hourlyRate = booking.hourlyRate || Math.round(dailyRate / 12);

  // Case 1: Within Grace Period (<= 10 mins late or checked out early/on-time)
  if (diffMinutes <= graceMinutes) {
    return {
      isOverstay: false,
      isLate: false,
      isWithinGracePeriod: diffMinutes > 0 && diffMinutes <= graceMinutes,
      gracePeriodMinutes: graceMinutes,
      overdueMinutes: Math.max(0, diffMinutes),
      overdueHours: 0,
      chargeableHours: 0,
      dailyRate,
      hourlyRate,
      fullDayCharge: dailyRate,
      hourlyCharge: 0,
      lateFee: 0,
      lateCheckoutType: "none",
      scheduledCheckOutTime: outTime24,
      scheduledCheckOutDate: outDateStr,
      actualCheckOutTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      description: diffMinutes > 0 ? `Late Checkout within ${graceMinutes}-min grace period (${diffMinutes} min late) &bull; No Extra Charge` : "",
    };
  }

  // Case 2: Past Grace Period (> 10 mins late)
  const chargeableHours = Math.max(1, Math.ceil(diffMinutes / 60));
  const hourlyCharge = hourlyRate * chargeableHours;
  const extraDays = Math.max(1, Math.ceil(chargeableHours / 24));
  const fullDayCharge = dailyRate * extraDays;

  // Selected Option: 'hourly' or 'full_day' (defaults to 'hourly' or booking snapshot)
  const selectedType = options.selectedOption || booking.lateCheckoutType || "hourly";
  const lateFee = selectedType === "full_day" ? fullDayCharge : hourlyCharge;

  return {
    isOverstay: true,
    isLate: true,
    isWithinGracePeriod: false,
    gracePeriodMinutes: graceMinutes,
    overdueMinutes: diffMinutes,
    overdueHours: Number((diffMinutes / 60).toFixed(1)),
    chargeableHours,
    dailyRate,
    hourlyRate,
    fullDayCharge,
    hourlyCharge,
    lateFee,
    lateCheckoutType: selectedType,
    scheduledCheckOutTime: outTime24,
    scheduledCheckOutDate: outDateStr,
    actualCheckOutTime: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
    description: `Late Check-Out (+${chargeableHours}h past ${formatTime12Hour(outTime24)}) &bull; ${selectedType === "full_day" ? `Full Day Charge (₹${fullDayCharge.toLocaleString("en-IN")})` : `${chargeableHours}h @ ₹${hourlyRate}/hr (₹${hourlyCharge.toLocaleString("en-IN")})`}`,
  };
}

