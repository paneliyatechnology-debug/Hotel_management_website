/**
 * Build list API query strings and normalize common list payloads.
 * Prefer server page/limit over loading a large first page and slicing in the UI.
 */

export function buildListQuery({ page = 1, limit = 20, ...filters } = {}) {
  const params = new URLSearchParams();
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.min(100, Math.max(1, Number(limit) || 20));
  params.set("page", String(safePage));
  params.set("limit", String(safeLimit));

  Object.entries(filters).forEach(([key, value]) => {
    if (value === undefined || value === null || value === "" || value === "ALL") return;
    params.set(key, String(value));
  });

  return params.toString();
}

export function readListMeta(res) {
  const data = res?.data;
  const total = Number(data?.total ?? data?.pagination?.total ?? res?.total);
  const page = Number(data?.page ?? data?.pagination?.page ?? res?.page) || 1;
  const limit = Number(data?.limit ?? data?.pagination?.limit ?? res?.limit) || 20;
  const totalPages =
    Number(data?.totalPages ?? data?.total_pages ?? data?.pagination?.total_pages ?? res?.totalPages) ||
    (Number.isFinite(total) && limit > 0 ? Math.max(1, Math.ceil(total / limit)) : 1);
  return {
    total: Number.isFinite(total) ? total : undefined,
    page,
    limit,
    totalPages,
  };
}

export function normalizeRoomRecord(r) {
  if (!r || typeof r !== "object") return null;
  const id = r.id || r._id;
  if (id === undefined || id === null) return null;
  const roomNumber = r.room_number || r.roomNumber || "";
  const roomTypeId =
    r.room_type_id ||
    r.roomTypeId ||
    (typeof r.roomType === "object" ? r.roomType?.id || r.roomType?._id : r.roomType);
  const roomTypeName =
    r.room_type_name || (typeof r.roomType === "object" ? r.roomType?.name : r.type || "");
  const customPrice = Number(r.custom_price_per_night ?? r.customPricePerNight ?? r.basePrice ?? 0);
  const status = String(r.status || "AVAILABLE").toUpperCase();
  const floor = r.floor !== undefined ? r.floor : 1;
  const currentBookingId = r.current_booking_id ?? r.currentBookingId ?? null;
  const guestName =
    r.guest_name ||
    r.guestName ||
    r.primary_guest_name ||
    r.current_guest_name ||
    r.currentGuestName ||
    "";
  return {
    ...r,
    _id: String(id),
    id,
    roomNumber: String(roomNumber),
    room_number: String(roomNumber),
    roomTypeId: String(roomTypeId || ""),
    room_type_id: roomTypeId,
    roomTypeName,
    room_type_name: roomTypeName,
    type: roomTypeName,
    customPricePerNight: customPrice,
    custom_price_per_night: customPrice,
    floor,
    status,
    current_booking_id: currentBookingId,
    currentBookingId: currentBookingId,
    guestName: guestName || undefined,
    guest_name: guestName || undefined,
  };
}

export function extractRoomsFromResponse(res) {
  const raw = res?.data?.rooms || res?.rooms || res?.data || res || [];
  const list = Array.isArray(raw) ? raw : [];
  const rooms = list.map(normalizeRoomRecord).filter(Boolean);
  return { rooms, ...readListMeta(res) };
}

export function extractRoomTypesFromResponse(res) {
  const raw =
    res?.data?.room_categories ||
    res?.data?.roomCategories ||
    res?.data?.roomTypes ||
    res?.data?.room_types ||
    res?.room_categories ||
    res?.roomTypes ||
    res?.data ||
    res ||
    [];
  const list = Array.isArray(raw) ? raw : [];
  const roomTypes = list.map((rt) => {
    const id = String(rt.id || rt._id || "");
    return {
      ...rt,
      _id: id,
      id: rt.id || rt._id,
      name: rt.name || "Standard Room",
      basePrice: Number(rt.basePrice || rt.price || rt.custom_price_per_night || 0),
    };
  });
  return { roomTypes, ...readListMeta(res) };
}

export function mergeById(existing, incoming) {
  const map = new Map();
  [...(existing || []), ...(incoming || [])].forEach((item) => {
    const key = String(item?.id ?? item?._id ?? "");
    if (!key) return;
    map.set(key, { ...(map.get(key) || {}), ...item });
  });
  return Array.from(map.values());
}
