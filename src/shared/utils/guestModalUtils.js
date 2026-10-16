/**
 * 🛡️ guestModalUtils.js
 * Utility helper for preparing safe guest & booking payload data for GuestDetailsModal
 */

export function createSafeGuestModalData(data) {
  if (!data) return null;
  try {
    const raw = typeof data === "object" ? data : {};
    return {
      _id: raw._id || raw.id || raw.bookingId || "",
      id: raw.id || raw._id || raw.bookingId || "",
      name: raw.name || raw.fullName || raw.guestName || raw.primary_guest_name || raw.guest?.name || raw.guest?.fullName || "Guest",
      fullName: raw.fullName || raw.name || raw.guestName || raw.primary_guest_name || raw.guest?.name || raw.guest?.fullName || "Guest",
      phone: raw.phone || raw.mobile || raw.mobileNumber || raw.mobile_number || raw.guest?.phone || raw.guest?.mobileNumber || "",
      mobileNumber: raw.mobileNumber || raw.mobile_number || raw.mobile || raw.phone || raw.guest?.phone || raw.guest?.mobileNumber || "",
      email: raw.email || raw.guest?.email || "",
      roomAssigned: raw.roomAssigned || raw.roomNumber || raw.room?.roomNumber || (Array.isArray(raw.rooms) ? raw.rooms.map((r) => r.room_number || r.roomNumber).filter(Boolean).join(", ") : "") || (Array.isArray(raw.roomNumbers) ? raw.roomNumbers.join(", ") : ""),
      roomNumbers: Array.isArray(raw.roomNumbers) ? raw.roomNumbers : raw.roomAssigned ? [raw.roomAssigned] : [],
      status: raw.status || raw.booking_status || "IN-HOUSE",
      checkInDate: raw.checkInDate || raw.check_in_date || "",
      checkOutDate: raw.checkOutDate || raw.check_out_date || "",
      totalAmount: raw.totalAmount || raw.total_amount || 0,
      paidAmount: raw.paidAmount || raw.paid_amount || 0,
      dueAmount: raw.dueAmount || raw.due_amount || 0,
      guest: raw.guest || null,
      booking: raw.booking || raw,
      raw: raw,
    };
  } catch (e) {
    console.error("Error creating safe guest modal data:", e);
    return data;
  }
}

export function removeCircularReferences(obj, seen = new WeakSet()) {
  if (obj === null || typeof obj !== "object") return obj;
  if (seen.has(obj)) return "[Circular]";
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj.map((item) => removeCircularReferences(item, seen));
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = removeCircularReferences(value, seen);
  }
  return result;
}
