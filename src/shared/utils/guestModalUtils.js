/**
 * 🛡️ guestModalUtils.js
 * Safe serialization & modal payload extraction for Guest Details Modal.
 * Eliminates circular reference errors ("Converting circular structure to JSON").
 */

/**
 * Strips circular references from any object or array using a WeakSet.
 */
export function removeCircularReferences(obj, seen = new WeakSet()) {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }
  if (seen.has(obj)) {
    return undefined; // circular reference detected and dropped
  }
  seen.add(obj);

  if (Array.isArray(obj)) {
    return obj
      .map((item) => removeCircularReferences(item, seen))
      .filter((item) => item !== undefined);
  }

  const result = {};
  for (const key of Object.keys(obj)) {
    const val = obj[key];
    if (val === null || val === undefined) {
      result[key] = val;
      continue;
    }
    if (typeof val === "object") {
      if (seen.has(val)) {
        // Drop circular reference
        continue;
      }
      const cleaned = removeCircularReferences(val, seen);
      if (cleaned !== undefined) {
        result[key] = cleaned;
      }
    } else {
      result[key] = val;
    }
  }
  return result;
}

/**
 * Creates completely decoupled, safe guest and booking snapshots for GuestDetailsModal.
 * Ensures cleanGuest does not reference cleanBooking, and cleanBooking does not reference cleanGuest.
 */
export function createSafeGuestModalData(raw) {
  if (!raw || typeof raw !== "object") return null;

  // 1. Identify raw guest and raw booking sources
  const rawGuestObj =
    raw.guest && typeof raw.guest === "object" && raw.guest !== raw ? raw.guest : null;
  const rawBookingObj =
    raw.booking && typeof raw.booking === "object" && raw.booking !== raw
      ? raw.booking
      : raw.activeBooking && typeof raw.activeBooking === "object" && raw.activeBooking !== raw
      ? raw.activeBooking
      : null;

  // 2. Clone raw properties into clean shallow copies
  const cleanGuest = { ...(rawGuestObj || raw) };
  delete cleanGuest.guest;
  delete cleanGuest.booking;
  delete cleanGuest.activeBooking;

  const cleanBooking = { ...(rawBookingObj || raw) };
  delete cleanBooking.guest;
  delete cleanBooking.booking;
  delete cleanBooking.activeBooking;

  // 3. Resolve key guest attributes
  const name =
    raw.name ||
    raw.fullName ||
    rawGuestObj?.fullName ||
    rawGuestObj?.name ||
    rawBookingObj?.guestName ||
    rawBookingObj?.primary_guest_name ||
    "Guest";

  const phone =
    raw.phone ||
    raw.mobileNumber ||
    rawGuestObj?.phone ||
    rawGuestObj?.mobileNumber ||
    rawBookingObj?.guestPhone ||
    rawBookingObj?.mobile_number ||
    "N/A";

  const email =
    raw.email ||
    rawGuestObj?.email ||
    rawBookingObj?.email ||
    rawBookingObj?.guestEmail ||
    "";

  const roomAssigned =
    raw.roomAssigned ||
    raw.roomNumber ||
    rawGuestObj?.roomAssigned ||
    cleanBooking.roomNumber ||
    (Array.isArray(cleanBooking.roomNumbers) && cleanBooking.roomNumbers.length > 0
      ? cleanBooking.roomNumbers.join(", ")
      : "101");

  const idProofType =
    raw.idProofType ||
    rawGuestObj?.idProofType ||
    rawGuestObj?.govtIdType ||
    "AADHAAR";

  const idProofNumber =
    raw.idProofNumber ||
    rawGuestObj?.idProofNumber ||
    rawGuestObj?.govtIdNumber ||
    "Verified";

  const frontImage =
    raw.frontImage ||
    rawGuestObj?.frontImage ||
    raw.idProof?.frontImage ||
    rawGuestObj?.idProof?.frontImage ||
    raw.front_image ||
    cleanBooking.frontImage ||
    cleanBooking.front_image;

  const backImage =
    raw.backImage ||
    rawGuestObj?.backImage ||
    raw.idProof?.backImage ||
    rawGuestObj?.idProof?.backImage ||
    raw.back_image ||
    cleanBooking.backImage ||
    cleanBooking.back_image;

  const signature =
    raw.signature ||
    rawGuestObj?.signature ||
    raw.signatureImage ||
    rawGuestObj?.signatureImage ||
    cleanBooking.signature;

  const photo =
    raw.photo ||
    rawGuestObj?.photo ||
    raw.livePhoto ||
    rawGuestObj?.livePhoto ||
    cleanBooking.photo;

  // Enrich cleanGuest with canonical fields
  cleanGuest.name = name;
  cleanGuest.fullName = name;
  cleanGuest.phone = phone;
  cleanGuest.mobileNumber = phone;
  cleanGuest.email = email;
  cleanGuest.roomAssigned = roomAssigned;
  cleanGuest.idProofType = idProofType;
  cleanGuest.idProofNumber = idProofNumber;
  if (frontImage) cleanGuest.frontImage = frontImage;
  if (backImage) cleanGuest.backImage = backImage;
  if (signature) cleanGuest.signature = signature;
  if (photo) cleanGuest.photo = photo;

  // Enrich cleanBooking with canonical fields
  cleanBooking.guestName = name;
  cleanBooking.primary_guest_name = name;
  cleanBooking.guestPhone = phone;
  cleanBooking.mobile_number = phone;
  cleanBooking.roomAssigned = roomAssigned;
  cleanBooking.roomNumber = roomAssigned;

  const targetId =
    raw._id ||
    raw.id ||
    cleanGuest._id ||
    cleanBooking._id ||
    raw.guestId ||
    raw.bookingId ||
    rawBookingObj?._id ||
    rawGuestObj?._id;

  const checkInDate =
    raw.checkInDate ||
    raw.check_in_date ||
    raw.checkIn ||
    raw.check_in ||
    rawBookingObj?.checkInDate ||
    rawBookingObj?.check_in_date ||
    rawGuestObj?.checkInDate ||
    raw.createdAt ||
    new Date().toISOString();

  let checkOutDate =
    raw.checkOutDate ||
    raw.check_out_date ||
    raw.checkOut ||
    raw.check_out ||
    rawBookingObj?.checkOutDate ||
    rawBookingObj?.check_out_date ||
    rawGuestObj?.checkOutDate;

  if (!checkOutDate && checkInDate) {
    const d = new Date(checkInDate);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + 1);
      checkOutDate = d.toISOString();
    }
  }

  const modalData = {
    ...cleanBooking,
    ...cleanGuest,
    _id: targetId,
    id: targetId,
    guestId: cleanGuest._id || targetId,
    bookingId: cleanBooking._id || targetId,
    name,
    fullName: name,
    phone,
    mobileNumber: phone,
    email,
    roomAssigned,
    roomNumber: roomAssigned,
    checkInDate,
    checkOutDate,
    frontImage,
    backImage,
    signature,
    photo,
    guest: cleanGuest,
    booking: cleanBooking,
    activeBooking: cleanBooking,
  };

  // Run final circular reference pass to guarantee 100% circular safety
  return removeCircularReferences(modalData);
}
