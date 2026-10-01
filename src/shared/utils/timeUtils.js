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
 * If a guest stays past standard check-out time (e.g. 12:00 PM) + 30-min grace period (2-3+ hours late or next day),
 * this automatically charges the extra day(s) room tariff to the guest folio ledger.
 */
export function calculateOverstayFee(booking, hotelSettings = {}) {
  if (!booking || (booking.status && booking.status !== "CHECKED_IN")) {
    return {
      isOverstay: false,
      overdueHours: 0,
      extraDays: 0,
      dailyRate: 0,
      lateFee: 0,
      description: "",
    };
  }

  const outDateStr = booking.checkOutDate ? String(booking.checkOutDate).split("T")[0] : null;
  if (!outDateStr) {
    return {
      isOverstay: false,
      overdueHours: 0,
      extraDays: 0,
      dailyRate: 0,
      lateFee: 0,
      description: "",
    };
  }

  const rawOutTime = booking.checkOutTime || hotelSettings?.checkOutTime || "12:00";
  const outTime24 = formatTime24Hour(rawOutTime);
  const [outH, outM] = outTime24.split(":").map(Number);

  // Parse scheduled check-out date & time
  const [year, month, day] = outDateStr.split("-").map(Number);
  const scheduledOutDate = new Date(year, (month || 1) - 1, day || 1, isNaN(outH) ? 12 : outH, isNaN(outM) ? 0 : outM, 0);

  const now = new Date();
  const diffMs = now.getTime() - scheduledOutDate.getTime();
  const overdueHours = diffMs / (1000 * 60 * 60);

  // Grace period: 30 minutes (0.5 hours). Beyond 30 mins overstay (e.g., 2-3 hours late), charge extra day
  if (overdueHours > 0.5) {
    // Number of additional days: minimum 1 day for any overstay > 30 mins up to 24 hours, then ceil for subsequent days
    const extraDays = Math.max(1, Math.ceil(overdueHours / 24));

    // Calculate original daily room rate
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

    const calculatedDailyRate = baseRoomTariff > 0
      ? Math.round(baseRoomTariff / originalNights)
      : (booking.room?.customPricePerNight || booking.roomType?.basePrice || 2500);

    const lateFee = calculatedDailyRate * extraDays;

    return {
      isOverstay: true,
      overdueHours: Number(overdueHours.toFixed(1)),
      extraDays,
      dailyRate: calculatedDailyRate,
      lateFee,
      scheduledCheckOutTime: outTime24,
      scheduledCheckOutDate: outDateStr,
      description: `Late Check-Out Overstay (+${overdueHours.toFixed(1)} hrs past ${formatTime12Hour(outTime24)}) &bull; ${extraDays} Extra Day Room Tariff`,
    };
  }

  return {
    isOverstay: false,
    overdueHours: 0,
    extraDays: 0,
    dailyRate: 0,
    lateFee: 0,
    description: "",
  };
}

