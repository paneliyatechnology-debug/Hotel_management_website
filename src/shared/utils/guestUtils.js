/**
 * 👥 guestUtils.js
 * Centralized, robust helper to resolve primary guest name and additional guests
 * from any booking or guest record across the application.
 */

export function resolveBookingGuestNames(booking = {}) {
  if (!booking || typeof booking !== "object") {
    return {
      primaryGuestName: "Guest",
      additionalGuests: [],
      additionalGuestsCount: 0,
      additionalGuestsLabel: "",
      allGuestNames: ["Guest"],
    };
  }

  // Handle nested wraps (e.g., { raw: ... }, { booking: ... }, { guest: ... })
  const b = booking.raw || booking.booking || booking;
  const g = b.guest || b.guestData || booking.guest || {};

  // 1. Collect all raw guests sources
  const rawGuests =
    Array.isArray(b.guests) && b.guests.length > 0
      ? b.guests
      : Array.isArray(g.guests) && g.guests.length > 0
        ? g.guests
        : Array.isArray(b.accompanyingGuests) && b.accompanyingGuests.length > 0
          ? b.accompanyingGuests
          : Array.isArray(b.accompanying_guests) && b.accompanying_guests.length > 0
            ? b.accompanying_guests
            : Array.isArray(g.accompanyingGuests) && g.accompanyingGuests.length > 0
              ? g.accompanyingGuests
              : [];

  // 2. Normalize each guest entry: { id, name, display_order }
  const normalizedGuests = rawGuests
    .map((item, idx) => {
      if (!item) return null;
      if (typeof item === "string") {
        const name = item.trim();
        return name ? { id: null, name, display_order: idx + 1 } : null;
      }
      if (typeof item === "object") {
        const name = String(
          item.name ||
          item.fullName ||
          item.guest_name ||
          item.guestName ||
          item.full_name ||
          ""
        ).trim();
        if (!name) return null;
        const order = Number(item.display_order ?? item.displayOrder);
        return {
          id: item.id || item._id || null,
          name,
          display_order: Number.isFinite(order) ? order : idx + 1,
        };
      }
      return null;
    })
    .filter(Boolean);

  // 3. Resolve primary guest name
  // Priority:
  // a) Explicit primary_guest_name on booking or guest
  // b) First guest from normalized guests (display_order === 1 or index 0)
  // c) Generic guest name fields (guestName, fullName, name, etc.)
  // d) Fallback to "Guest"
  const explicitPrimary = String(
    b.primary_guest_name ||
    g.primary_guest_name ||
    b.primaryGuestName ||
    g.primaryGuestName ||
    ""
  ).trim();

  const firstGuestFromList =
    normalizedGuests.find((p) => p.display_order === 1)?.name ||
    normalizedGuests[0]?.name ||
    "";

  const genericName = String(
    b.guestName ||
    b.guest_name ||
    g.fullName ||
    g.name ||
    b.customer_name ||
    b.fullName ||
    b.name ||
    ""
  ).trim();

  const primaryGuestName = explicitPrimary || firstGuestFromList || genericName || "Guest";

  // 4. Resolve additional guests
  // Exclude primary guest (matching name case-insensitively)
  const additionalGuestsRaw = normalizedGuests
    .filter((p) => p.name.toLowerCase() !== primaryGuestName.toLowerCase())
    .map((p) => p.name);

  // Deduplicate and filter empty
  const additionalGuests = [
    ...new Set(
      additionalGuestsRaw.filter(
        (name) => Boolean(name) && name.toLowerCase() !== primaryGuestName.toLowerCase()
      )
    ),
  ];

  // Complete list of all guests with primary guest first
  const allGuestNames = [
    primaryGuestName,
    ...additionalGuests,
  ].filter(Boolean);

  return {
    primaryGuestName,
    additionalGuests,
    additionalGuestsCount: additionalGuests.length,
    additionalGuestsLabel: additionalGuests.join(", "),
    allGuestNames,
  };
}
