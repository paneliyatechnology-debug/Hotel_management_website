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

  const copy = list.slice();
  copy[index] = next;
  return copy;
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

  const incoming = normalize ? normalize(booking) : booking;
  if (!incoming) return current;

  if (index >= 0) {
    const copy = current.slice();
    copy[index] = { ...current[index], ...incoming };
    return copy;
  }

  return [incoming, ...current];
}
