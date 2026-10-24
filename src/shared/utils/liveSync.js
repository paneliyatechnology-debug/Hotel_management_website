/**
 * Helpers that apply backend socket payloads (room:status, booking:updated) straight to screen state,
 * so the UI changes the moment the event arrives. A debounced reload (see SocketContext aliases)
 * follows to pick up anything the payload does not carry.
 */

const sameId = (a, b) => a !== undefined && a !== null && b !== undefined && b !== null && String(a) === String(b);

/** Apply a `room:status` payload to a rooms list. Unknown rooms are left to the follow-up reload. */
export function applyRoomStatusEvent(rooms, payload) {
  const list = Array.isArray(rooms) ? rooms : [];
  const id = payload?.id ?? payload?._id;
  if (id === undefined || id === null) return list;

  const index = list.findIndex((room) => sameId(room?.id ?? room?._id, id));
  if (index < 0) return list;

  // Deleted room
  if (payload.deleted_at) return list.filter((_, i) => i !== index);

  const current = list[index];
  const next = { ...current };
  if (payload.status) next.status = String(payload.status).toUpperCase();
  if (payload.is_active !== undefined) {
    next.is_active = payload.is_active;
    next.isActive = payload.is_active;
  }
  if (payload.floor !== undefined && payload.floor !== null) next.floor = payload.floor;
  if (payload.room_number !== undefined && payload.room_number !== null) {
    next.room_number = String(payload.room_number);
    next.roomNumber = String(payload.room_number);
  }
  if (payload.updated_at) next.updated_at = payload.updated_at;

  // Live booking link for checkout from the Rooms grid (no bookings list needed)
  if (payload.current_booking_id !== undefined || payload.currentBookingId !== undefined) {
    const bookingId = payload.current_booking_id ?? payload.currentBookingId;
    next.current_booking_id = bookingId;
    next.currentBookingId = bookingId;
  }
  if (
    payload.guest_name !== undefined ||
    payload.guestName !== undefined ||
    payload.primary_guest_name !== undefined ||
    payload.current_guest_name !== undefined
  ) {
    const guestName =
      payload.guest_name ??
      payload.guestName ??
      payload.primary_guest_name ??
      payload.current_guest_name ??
      "";
    next.guestName = guestName || undefined;
    next.guest_name = guestName || undefined;
  }

  const copy = list.slice();
  copy[index] = next;
  return copy;
}

/**
 * Normalizes a booking payload from the backend socket event or REST API
 * into a comprehensive object with consistent camelCase and snake_case properties.
 */
export function normalizeBooking(booking) {
  if (!booking || typeof booking !== "object") return booking;

  const id = booking.id ?? booking._id;
  if (id === undefined || id === null) return booking;

  // Extract clean room numbers string from rooms array, room_number, etc.
  let roomNumbersStr = "";
  if (Array.isArray(booking.rooms) && booking.rooms.length > 0) {
    const nums = booking.rooms
      .map((r) => r.room_number || r.roomNumber || (typeof r === "object" ? r.id || r._id : r))
      .filter(Boolean)
      .map(String);
    if (nums.length > 0) roomNumbersStr = nums.join(", ");
  } else if (Array.isArray(booking.room_numbers) && booking.room_numbers.length > 0) {
    roomNumbersStr = booking.room_numbers.filter(Boolean).map(String).join(", ");
  } else if (Array.isArray(booking.roomNumbers) && booking.roomNumbers.length > 0) {
    roomNumbersStr = booking.roomNumbers.filter(Boolean).map(String).join(", ");
  } else if (booking.room_number || booking.roomNumber) {
    roomNumbersStr = String(booking.room_number || booking.roomNumber);
  } else if (booking.room?.room_number || booking.room?.roomNumber) {
    roomNumbersStr = String(booking.room.room_number || booking.room.roomNumber);
  } else if (booking.roomAssigned) {
    roomNumbersStr = String(booking.roomAssigned);
  }

  roomNumbersStr = roomNumbersStr.replace(/^Room\s*#?\s*/i, "").trim() || "-";

  // Financial amounts
  const totalAmount = Number(
    booking.total_amount ??
    booking.totalAmount ??
    booking.grand_total ??
    booking.grandTotal ??
    booking.bill_amount ??
    booking.invoice_total ??
    0
  );

  const paidAmount = Number(
    booking.paid_amount ??
    booking.paidAmount ??
    booking.advance_paid ??
    booking.advancePaid ??
    booking.advance_payment_amount ??
    booking.advancePaymentAmount ??
    booking.advancePayment ??
    0
  );

  const dueAmount = (booking.due_amount !== undefined && booking.due_amount !== null && booking.due_amount !== "")
    ? Number(booking.due_amount)
    : (booking.dueAmount !== undefined && booking.dueAmount !== null && booking.dueAmount !== "")
      ? Number(booking.dueAmount)
      : Math.max(0, totalAmount - paidAmount);

  // Statuses (booking_status is the source of truth from the API / socket payload)
  const rawStatus = String(
    booking.booking_status ||
    booking.bookingStatus ||
    booking.status ||
    "CONFIRMED"
  ).toUpperCase();
  const normalizedStatus = (rawStatus === "CHECKED_IN" || rawStatus === "IN-HOUSE" || rawStatus === "IN_HOUSE")
    ? "CHECKED_IN"
    : (rawStatus === "CHECKED_OUT" || rawStatus === "DEPARTED" || rawStatus === "CHECKOUT" || rawStatus === "CHECK_OUT")
      ? "CHECKED_OUT"
      : rawStatus;

  const rawPaymentStatus = String(booking.payment_status || booking.paymentStatus || "").toUpperCase();
  const paymentStatus = rawPaymentStatus === "PARTIALLY_PAID" || rawPaymentStatus === "PARTIAL"
    ? "PARTIAL"
    : rawPaymentStatus === "PAID" || rawPaymentStatus === "FULLY_PAID"
      ? "PAID"
      : rawPaymentStatus === "UNPAID" || rawPaymentStatus === "PENDING"
        ? "UNPAID"
        : (paidAmount >= totalAmount && totalAmount > 0)
          ? "PAID"
          : paidAmount > 0
            ? "PARTIAL"
            : "UNPAID";

  // Guest details
  const guestName =
    booking.primary_guest_name ||
    booking.guestName ||
    booking.guest_name ||
    booking.fullName ||
    booking.name ||
    booking.guest?.name ||
    booking.guest?.fullName ||
    "Resident Guest";

  const guestPhone =
    booking.mobile_number ||
    booking.mobileNumber ||
    booking.phone ||
    booking.mobile ||
    booking.guestPhone ||
    booking.guest?.mobileNumber ||
    booking.guest?.phone ||
    "N/A";

  const guestEmail = booking.email || booking.guest?.email || "";

  // Dates
  const checkInDate =
    booking.check_in_date ||
    booking.checkInDate ||
    booking.actual_check_in ||
    booking.actualCheckIn ||
    booking.check_in ||
    booking.checkIn ||
    "";

  const checkOutDate =
    booking.check_out_date ||
    booking.checkOutDate ||
    booking.actual_check_out ||
    booking.actualCheckOut ||
    booking.check_out ||
    booking.checkOut ||
    "";

  const actualCheckIn = booking.actual_check_in || booking.actualCheckIn || checkInDate;
  const actualCheckOut = booking.actual_check_out || booking.actualCheckOut || checkOutDate;

  return {
    ...booking,
    id,
    _id: id,
    booking_number: booking.booking_number || booking.bookingNumber || `BK-${id}`,
    bookingNumber: booking.booking_number || booking.bookingNumber || `BK-${id}`,
    primary_guest_name: guestName,
    guestName,
    name: guestName,
    fullName: guestName,
    mobile_number: guestPhone,
    mobileNumber: guestPhone,
    phone: guestPhone,
    guestPhone,
    email: guestEmail,
    guest: {
      id: booking.guest?.id || booking.guest?._id || id,
      name: guestName,
      fullName: guestName,
      phone: guestPhone,
      mobileNumber: guestPhone,
      email: guestEmail,
    },
    rooms: Array.isArray(booking.rooms) ? booking.rooms : [],
    room_number: roomNumbersStr,
    roomNumber: roomNumbersStr,
    roomAssigned: roomNumbersStr,
    total_amount: totalAmount,
    totalAmount,
    paid_amount: paidAmount,
    paidAmount,
    advancePayment: paidAmount,
    advancePaid: paidAmount,
    advancePaymentAmount: paidAmount,
    due_amount: dueAmount,
    dueAmount,
    pendingDues: dueAmount,
    booking_status: normalizedStatus,
    status: normalizedStatus,
    payment_status: paymentStatus,
    paymentStatus,
    check_in_date: checkInDate,
    checkInDate,
    check_in: checkInDate,
    checkIn: checkInDate,
    check_out_date: checkOutDate,
    checkOutDate,
    check_out: checkOutDate,
    checkOut: checkOutDate,
    actual_check_in: actualCheckIn,
    actualCheckIn,
    actual_check_out: actualCheckOut,
    actualCheckOut,
    updated_at: booking.updated_at || booking.updatedAt || new Date().toISOString(),
    updatedAt: booking.updated_at || booking.updatedAt || new Date().toISOString(),
  };
}

/**
 * Merge a `booking:updated` payload (full booking) into a list of bookings.
 * `normalize` converts the raw booking to the shape the screen stores (optional).
 * New bookings are added to the top, deleted ones removed.
 */
export function mergeBookingEvent(list, booking, normalize) {
  const current = Array.isArray(list) ? list : [];
  const id = booking?.id ?? booking?._id;
  if (id === undefined || id === null) return current;

  const index = current.findIndex((item) => sameId(item?.id ?? item?._id, id));

  if (booking.deleted_at) {
    if (index < 0) return current;
    return current.filter((_, i) => i !== index);
  }

  const incoming = normalize ? normalize(booking) : normalizeBooking(booking);
  if (!incoming) return current;

  if (index >= 0) {
    const copy = current.slice();
    // Socket payload wins for status / money / checkout fields
    copy[index] = {
      ...current[index],
      ...incoming,
      booking_status: incoming.booking_status || incoming.status,
      status: incoming.status || incoming.booking_status,
      updated_at: incoming.updated_at || incoming.updatedAt || new Date().toISOString(),
      updatedAt: incoming.updatedAt || incoming.updated_at || new Date().toISOString(),
    };
    return copy;
  }

  return [incoming, ...current];
}

/** Prefer a later stay status when merging two copies of the same booking */
export function preferBookingStatus(a, b) {
  const rank = (status) => {
    const s = String(status || "").toUpperCase();
    if (s === "CANCELLED") return 5;
    if (s === "CHECKED_OUT" || s === "DEPARTED" || s === "CHECKOUT" || s === "CHECK_OUT") return 4;
    if (s === "CHECKED_IN" || s === "IN-HOUSE" || s === "IN_HOUSE") return 3;
    if (s === "CONFIRMED" || s === "BOOKED" || s === "RESERVED") return 2;
    if (s === "PENDING") return 1;
    return 0;
  };
  return rank(b) >= rank(a) ? b : a;
}

/**
 * Merge a freshly fetched bookings list with the current in-memory list.
 * Keeps socket-inserted rows that a slightly stale GET response may still omit.
 */
export function mergeFetchedBookings(fetched, previous, { retainMs = 30000 } = {}) {
  const next = Array.isArray(fetched) ? fetched.slice() : [];
  const prev = Array.isArray(previous) ? previous : [];
  const nextIds = new Set(next.map((item) => String(item?.id ?? item?._id ?? "")).filter(Boolean));
  const now = Date.now();

  prev.forEach((item) => {
    const id = item?.id ?? item?._id;
    if (id === undefined || id === null) return;
    const key = String(id);
    if (nextIds.has(key)) return;
    const updated = new Date(item.updated_at || item.updatedAt || item.created_at || item.createdAt || 0).getTime();
    if (Number.isFinite(updated) && now - updated <= retainMs) {
      next.unshift(item);
      nextIds.add(key);
    }
  });

  return next;
}

/** Newest stay first for dashboard / guest tables */
export function sortBookingsNewestFirst(list) {
  return (Array.isArray(list) ? list.slice() : []).sort((a, b) => {
    const ta = new Date(a?.created_at || a?.createdAt || a?.actual_check_in || a?.check_in_date || a?.updated_at || 0).getTime();
    const tb = new Date(b?.created_at || b?.createdAt || b?.actual_check_in || b?.check_in_date || b?.updated_at || 0).getTime();
    if (tb !== ta) return tb - ta;
    return Number(b?.id || b?._id || 0) - Number(a?.id || a?._id || 0);
  });
}
