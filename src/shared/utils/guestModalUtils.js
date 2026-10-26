import { resolveBookingGuestNames } from "./guestUtils";

export { resolveBookingGuestNames };

export function createSafeGuestModalData(data) {
  if (!data) return null;
  try {
    const raw = typeof data === "object" ? data : {};
    const { primaryGuestName } = resolveBookingGuestNames(raw);
    return {
      _id: raw._id || raw.id || raw.bookingId || "",
      id: raw.id || raw._id || raw.bookingId || "",
      name: primaryGuestName,
      fullName: primaryGuestName,
      phone: raw.phone || raw.mobile || raw.mobileNumber || raw.mobile_number || raw.guest?.phone || raw.guest?.mobileNumber || "",
      mobileNumber: raw.mobileNumber || raw.mobile_number || raw.mobile || raw.phone || raw.guest?.phone || raw.guest?.mobileNumber || "",
      email: raw.email || raw.guest?.email || "",
      roomAssigned: (() => {
        const fromRooms = Array.isArray(raw.rooms)
          ? raw.rooms.map((r) => (typeof r === "object" ? r.room_number || r.roomNumber : r)).filter(Boolean).map(String)
          : [];
        const fromNumbers = Array.isArray(raw.roomNumbers)
          ? raw.roomNumbers.map(String).filter(Boolean)
          : Array.isArray(raw.room_numbers)
            ? raw.room_numbers.map(String).filter(Boolean)
            : [];
        const list = fromRooms.length ? fromRooms : fromNumbers;
        if (list.length) return [...new Set(list)].join(", ");
        return raw.roomAssigned || raw.roomNumber || raw.room_number || raw.room?.room_number || raw.room?.roomNumber || "";
      })(),
      roomNumbers: (() => {
        const fromRooms = Array.isArray(raw.rooms)
          ? raw.rooms.map((r) => (typeof r === "object" ? r.room_number || r.roomNumber : r)).filter(Boolean).map(String)
          : [];
        if (fromRooms.length) return [...new Set(fromRooms)];
        if (Array.isArray(raw.roomNumbers) && raw.roomNumbers.length) return raw.roomNumbers.map(String);
        if (raw.roomAssigned) return String(raw.roomAssigned).split(",").map((s) => s.trim()).filter(Boolean);
        const single = raw.roomNumber || raw.room_number || raw.room?.room_number || raw.room?.roomNumber;
        return single ? [String(single)] : [];
      })(),
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
