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
    raw.primary_guest_name ||
    raw.name ||
    raw.fullName ||
    rawGuestObj?.fullName ||
    rawGuestObj?.name ||
    rawGuestObj?.primary_guest_name ||
    rawBookingObj?.primary_guest_name ||
    rawBookingObj?.guestName ||
    "Guest";

  const phone =
    raw.mobile_number ||
    raw.phone ||
    raw.mobileNumber ||
    rawGuestObj?.phone ||
    rawGuestObj?.mobileNumber ||
    rawGuestObj?.mobile_number ||
    rawBookingObj?.mobile_number ||
    rawBookingObj?.guestPhone ||
    "N/A";

  const email =
    raw.email ||
    rawGuestObj?.email ||
    rawBookingObj?.email ||
    rawBookingObj?.guestEmail ||
    "";

  const address =
    raw.address ||
    rawGuestObj?.address ||
    rawBookingObj?.address ||
    "";

  const roomAssigned =
    raw.roomAssigned ||
    raw.roomNumber ||
    (Array.isArray(raw.rooms) && raw.rooms.length > 0
      ? raw.rooms.map((r) => r.room_number || r.roomNumber).filter(Boolean).join(", ")
      : null) ||
    rawGuestObj?.roomAssigned ||
    cleanBooking.roomNumber ||
    (Array.isArray(cleanBooking.roomNumbers) && cleanBooking.roomNumbers.length > 0
      ? cleanBooking.roomNumbers.join(", ")
      : "101");

  const parseJsonSafe = (val) => {
    if (!val || typeof val !== "string") return val;
    const t = val.trim();
    if ((t.startsWith("[") && t.endsWith("]")) || (t.startsWith("{") && t.endsWith("}"))) {
      try { return JSON.parse(t); } catch { return val; }
    }
    return val;
  };

  const extractImg = (val, index = 0) => {
    if (!val) return null;
    const parsed = parseJsonSafe(val);
    if (Array.isArray(parsed)) {
      if (parsed.length <= index) return null;
      return extractImg(parsed[index], 0);
    }
    if (typeof parsed === "object") {
      const target = index === 1 ? (parsed.backImage || parsed.back_image || parsed.backImageUrl) : null;
      if (target) return extractImg(target, 0);
      return (
        parsed.url ||
        parsed.secure_url ||
        parsed.path ||
        parsed.src ||
        parsed.fileUrl ||
        parsed.location ||
        parsed.frontImage ||
        parsed.front_image ||
        parsed.image ||
        parsed.signature ||
        parsed.data ||
        null
      );
    }
    if (typeof parsed === "string") {
      const trimmed = parsed.trim();
      return trimmed && trimmed !== "null" && trimmed !== "undefined" && trimmed !== "[object Object]" ? trimmed : null;
    }
    return null;
  };

  const idProofType =
    raw.idProofType ||
    raw.id_proof_type ||
    raw.govtIdType ||
    raw.govt_id_type ||
    rawGuestObj?.idProofType ||
    rawGuestObj?.id_proof_type ||
    rawGuestObj?.govtIdType ||
    rawGuestObj?.govt_id_type ||
    rawBookingObj?.govt_id_type ||
    rawBookingObj?.id_type ||
    "AADHAAR";

  const idProofNumber =
    raw.idProofNumber ||
    raw.id_proof_number ||
    raw.govtIdNumber ||
    raw.govt_id_number ||
    rawGuestObj?.idProofNumber ||
    rawGuestObj?.id_proof_number ||
    rawGuestObj?.govtIdNumber ||
    rawGuestObj?.govt_id_number ||
    rawBookingObj?.govt_id_number ||
    rawBookingObj?.id_number ||
    "Verified";

  const frontImage =
    extractImg(raw.frontImage) ||
    extractImg(raw.front_image) ||
    extractImg(raw.frontImageUrl) ||
    extractImg(raw.front_image_url) ||
    extractImg(rawGuestObj?.frontImage) ||
    extractImg(rawGuestObj?.front_image) ||
    extractImg(rawGuestObj?.frontImageUrl) ||
    extractImg(rawGuestObj?.front_image_url) ||
    extractImg(raw.idProof?.frontImage) ||
    extractImg(raw.idProof?.front_image) ||
    extractImg(raw.idProof?.frontImageUrl) ||
    extractImg(raw.idProof?.url) ||
    extractImg(raw.idProof?.path) ||
    extractImg(raw.idProof?.image) ||
    extractImg(rawGuestObj?.idProof?.frontImage) ||
    extractImg(rawGuestObj?.idProof?.front_image) ||
    extractImg(rawGuestObj?.idProof?.frontImageUrl) ||
    extractImg(rawGuestObj?.idProof?.url) ||
    extractImg(rawGuestObj?.idProof?.path) ||
    extractImg(rawGuestObj?.idProof?.image) ||
    extractImg(rawBookingObj?.idProof?.frontImage) ||
    extractImg(rawBookingObj?.idProof?.front_image) ||
    extractImg(rawBookingObj?.idProof?.url) ||
    extractImg(raw.id_proof_front) ||
    extractImg(raw.idProofFront) ||
    extractImg(raw.id_proof_front_image) ||
    extractImg(raw.id_proof_image) ||
    extractImg(raw.idProofImage) ||
    extractImg(raw.id_proof_url) ||
    extractImg(raw.idProofUrl) ||
    extractImg(raw.id_card_front) ||
    extractImg(raw.govt_id_front) ||
    extractImg(raw.govt_id_image) ||
    extractImg(raw.govt_id_url) ||
    extractImg(raw.govt_id_photo) ||
    extractImg(cleanBooking.frontImage) ||
    extractImg(cleanBooking.front_image) ||
    extractImg(cleanBooking.id_proof_image) ||
    extractImg(cleanBooking.id_proof_url) ||
    extractImg(raw.images, 0) ||
    extractImg(rawGuestObj?.images, 0) ||
    extractImg(rawBookingObj?.images, 0) ||
    extractImg(raw.documents, 0) ||
    extractImg(rawGuestObj?.documents, 0) ||
    extractImg(rawBookingObj?.documents, 0) ||
    extractImg(raw.id_proof) ||
    extractImg(raw.idProof) ||
    extractImg(rawGuestObj?.id_proof) ||
    extractImg(rawGuestObj?.idProof) ||
    null;

  const backImage =
    extractImg(raw.backImage) ||
    extractImg(raw.back_image) ||
    extractImg(raw.backImageUrl) ||
    extractImg(raw.back_image_url) ||
    extractImg(rawGuestObj?.backImage) ||
    extractImg(rawGuestObj?.back_image) ||
    extractImg(rawGuestObj?.backImageUrl) ||
    extractImg(rawGuestObj?.back_image_url) ||
    extractImg(raw.idProof?.backImage) ||
    extractImg(raw.idProof?.back_image) ||
    extractImg(raw.idProof?.backImageUrl) ||
    extractImg(rawGuestObj?.idProof?.backImage) ||
    extractImg(rawGuestObj?.idProof?.back_image) ||
    extractImg(rawGuestObj?.idProof?.backImageUrl) ||
    extractImg(rawBookingObj?.idProof?.backImage) ||
    extractImg(rawBookingObj?.idProof?.back_image) ||
    extractImg(raw.id_proof_back) ||
    extractImg(raw.idProofBack) ||
    extractImg(raw.id_proof_back_image) ||
    extractImg(raw.idProofBackImage) ||
    extractImg(raw.id_proof_back_url) ||
    extractImg(raw.idProofBackUrl) ||
    extractImg(raw.id_card_back) ||
    extractImg(raw.govt_id_back) ||
    extractImg(raw.govt_id_photo_back) ||
    extractImg(cleanBooking.backImage) ||
    extractImg(cleanBooking.back_image) ||
    extractImg(cleanBooking.id_proof_back_image) ||
    extractImg(raw.images, 1) ||
    extractImg(rawGuestObj?.images, 1) ||
    extractImg(rawBookingObj?.images, 1) ||
    extractImg(raw.documents, 1) ||
    extractImg(rawGuestObj?.documents, 1) ||
    extractImg(rawBookingObj?.documents, 1) ||
    null;

  const signature =
    extractImg(raw.signature) ||
    extractImg(raw.signature_url) ||
    extractImg(raw.signatureUrl) ||
    extractImg(raw.signatureImage) ||
    extractImg(raw.signature_image) ||
    extractImg(raw.guest_signature) ||
    extractImg(raw.guestSignature) ||
    extractImg(raw.guest_signature_url) ||
    extractImg(raw.digital_signature) ||
    extractImg(raw.digitalSignature) ||
    extractImg(raw.e_signature) ||
    extractImg(raw.eSignature) ||
    extractImg(rawGuestObj?.signature) ||
    extractImg(rawGuestObj?.guest_signature) ||
    extractImg(rawGuestObj?.guestSignature) ||
    extractImg(rawGuestObj?.signatureImage) ||
    extractImg(rawBookingObj?.signature) ||
    extractImg(rawBookingObj?.guest_signature) ||
    extractImg(rawBookingObj?.guestSignature) ||
    extractImg(raw.signatures, 0) ||
    extractImg(rawGuestObj?.signatures, 0) ||
    extractImg(rawBookingObj?.signatures, 0) ||
    extractImg(raw.idProof?.signature) ||
    extractImg(rawGuestObj?.idProof?.signature) ||
    extractImg(cleanBooking.signature) ||
    extractImg(cleanBooking.guest_signature) ||
    null;

  const photo =
    extractImg(raw.photo) ||
    extractImg(rawGuestObj?.photo) ||
    extractImg(raw.livePhoto) ||
    extractImg(rawGuestObj?.livePhoto) ||
    extractImg(cleanBooking.photo) ||
    null;

  // Enrich cleanGuest with canonical fields
  cleanGuest.name = name;
  cleanGuest.fullName = name;
  cleanGuest.phone = phone;
  cleanGuest.mobileNumber = phone;
  cleanGuest.email = email;
  cleanGuest.roomAssigned = roomAssigned;
  cleanGuest.idProofType = idProofType;
  cleanGuest.idProofNumber = idProofNumber;
  if (frontImage) {
    cleanGuest.frontImage = frontImage;
    cleanGuest.front_image = frontImage;
  }
  if (backImage) {
    cleanGuest.backImage = backImage;
    cleanGuest.back_image = backImage;
  }
  if (signature) {
    cleanGuest.signature = signature;
    cleanGuest.guest_signature = signature;
  }
  if (photo) cleanGuest.photo = photo;

  // Enrich cleanBooking with canonical fields
  cleanBooking.guestName = name;
  cleanBooking.primary_guest_name = name;
  cleanBooking.guestPhone = phone;
  cleanBooking.mobile_number = phone;
  cleanBooking.roomAssigned = roomAssigned;
  cleanBooking.roomNumber = roomAssigned;
  if (frontImage) {
    cleanBooking.frontImage = frontImage;
    cleanBooking.front_image = frontImage;
  }
  if (backImage) {
    cleanBooking.backImage = backImage;
    cleanBooking.back_image = backImage;
  }
  if (signature) {
    cleanBooking.signature = signature;
    cleanBooking.guest_signature = signature;
  }
  if (photo) cleanBooking.photo = photo;

  const cleanIdVal = (v) => {
    if (!v) return null;
    const s = String(v).trim();
    if (s === "null" || s === "undefined" || s === "" || s === "b-undefined") return null;
    return v;
  };

  const targetId =
    cleanIdVal(raw.id) ||
    cleanIdVal(raw._id) ||
    cleanIdVal(raw.bookingId) ||
    cleanIdVal(raw.booking_id) ||
    cleanIdVal(cleanBooking.id) ||
    cleanIdVal(cleanBooking._id) ||
    cleanIdVal(rawGuestObj?.id) ||
    cleanIdVal(rawGuestObj?._id) ||
    cleanIdVal(raw.guestId);

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
    booking_number: raw.booking_number || raw.bookingNumber || rawBookingObj?.booking_number || cleanBooking.booking_number,
    bookingNumber: raw.booking_number || raw.bookingNumber || rawBookingObj?.booking_number || cleanBooking.bookingNumber,
    booking_status: raw.booking_status || raw.bookingStatus || raw.status || cleanBooking.booking_status,
    bookingStatus: raw.booking_status || raw.bookingStatus || raw.status || cleanBooking.bookingStatus,
    payment_status: raw.payment_status || raw.paymentStatus || cleanBooking.payment_status,
    paymentStatus: raw.payment_status || raw.paymentStatus || cleanBooking.paymentStatus,
    name,
    fullName: name,
    primary_guest_name: name,
    phone,
    mobileNumber: phone,
    mobile_number: phone,
    email,
    address,
    roomAssigned,
    roomNumber: roomAssigned,
    rooms: Array.isArray(raw.rooms) && raw.rooms.length > 0 ? raw.rooms : (cleanBooking.rooms || []),
    roomsDetail: Array.isArray(raw.rooms) && raw.rooms.length > 0
      ? raw.rooms.map((r, i) => ({
          id: r.id || i,
          roomNumber: r.room_number || r.roomNumber,
          floor: r.floor !== undefined ? r.floor : (parseInt(r.room_number || "101", 10) >= 100 ? Math.floor(parseInt(r.room_number, 10) / 100) : 1),
          roomType: r.room_type_name || r.roomType || "Standard Room",
          pricePerNight: raw.base_amount ? Math.round((Number(raw.base_amount) / Math.max(1, Number(raw.number_of_nights || 1))) * 100) / 100 : 0,
          numberOfNights: Number(raw.number_of_nights || 1),
          roomTotal: Number(raw.base_amount || 0),
          status: raw.booking_status || "OCCUPIED",
        }))
      : (cleanBooking.roomsDetail || []),
    checkInDate,
    check_in_date: checkInDate,
    checkOutDate,
    check_out_date: checkOutDate,
    actualCheckIn: raw.actual_check_in || raw.actualCheckIn || null,
    actual_check_in: raw.actual_check_in || raw.actualCheckIn || null,
    actualCheckOut: raw.actual_check_out || raw.actualCheckOut || null,
    actual_check_out: raw.actual_check_out || raw.actualCheckOut || null,
    numberOfNights: Number(raw.number_of_nights ?? raw.numberOfNights ?? 1),
    number_of_nights: Number(raw.number_of_nights ?? raw.numberOfNights ?? 1),
    adults: Number(raw.adults ?? 1),
    children: Number(raw.children ?? 0),
    baseAmount: Number(raw.base_amount ?? raw.baseAmount ?? 0),
    base_amount: Number(raw.base_amount ?? raw.baseAmount ?? 0),
    taxAmount: Number(raw.tax_amount ?? raw.taxAmount ?? raw.gst_amount ?? 0),
    tax_amount: Number(raw.tax_amount ?? raw.taxAmount ?? raw.gst_amount ?? 0),
    gstAmount: Number(raw.gst_amount ?? raw.gstAmount ?? raw.tax_amount ?? 0),
    gst_amount: Number(raw.gst_amount ?? raw.gstAmount ?? raw.tax_amount ?? 0),
    cgstAmount: Number(raw.cgst_amount ?? raw.cgstAmount ?? 0),
    cgst_amount: Number(raw.cgst_amount ?? raw.cgstAmount ?? 0),
    sgstAmount: Number(raw.sgst_amount ?? raw.sgstAmount ?? 0),
    sgst_amount: Number(raw.sgst_amount ?? raw.sgstAmount ?? 0),
    gstRate: Number(raw.gst_rate ?? raw.gstRate ?? 18),
    gst_rate: Number(raw.gst_rate ?? raw.gstRate ?? 18),
    totalAmount: Number(raw.total_amount ?? raw.totalAmount ?? 0),
    total_amount: Number(raw.total_amount ?? raw.totalAmount ?? 0),
    paidAmount: Number(raw.paid_amount ?? raw.paidAmount ?? 0),
    paid_amount: Number(raw.paid_amount ?? raw.paidAmount ?? 0),
    dueAmount: Number(raw.due_amount ?? raw.dueAmount ?? 0),
    due_amount: Number(raw.due_amount ?? raw.dueAmount ?? 0),
    notes: raw.notes || raw.bookingNotes || "",
    creator: raw.creator || rawBookingObj?.creator || null,
    hotel: raw.hotel || rawBookingObj?.hotel || null,
    payment_history: Array.isArray(raw.payment_history) ? raw.payment_history : (raw.paymentHistory || []),
    paymentHistory: Array.isArray(raw.payment_history) ? raw.payment_history : (raw.paymentHistory || []),
    frontImage,
    backImage,
    signature,
    photo,
    front_image: frontImage,
    back_image: backImage,
    guest_signature: signature,
    guestSignature: signature,
    idProof: raw.idProof || rawGuestObj?.idProof || rawBookingObj?.idProof || { frontImage, backImage, signature },
    id_proof: raw.id_proof || rawGuestObj?.id_proof || rawBookingObj?.id_proof,
    id_proof_front: frontImage,
    id_proof_back: backImage,
    id_proof_image: frontImage,
    id_proof_url: frontImage,
    images: (Array.isArray(raw.images) && raw.images.length > 0)
      ? raw.images
      : (typeof raw.images === "string" && raw.images.trim())
        ? [raw.images.trim()]
        : (Array.isArray(rawGuestObj?.images) && rawGuestObj.images.length > 0)
          ? rawGuestObj.images
          : (Array.isArray(rawBookingObj?.images) && rawBookingObj.images.length > 0)
            ? rawBookingObj.images
            : (frontImage ? [frontImage, ...(backImage ? [backImage] : [])] : []),
    signatures: (Array.isArray(raw.signatures) && raw.signatures.length > 0)
      ? raw.signatures
      : (typeof raw.signatures === "string" && raw.signatures.trim())
        ? [raw.signatures.trim()]
        : (Array.isArray(rawGuestObj?.signatures) && rawGuestObj.signatures.length > 0)
          ? rawGuestObj.signatures
          : (Array.isArray(rawBookingObj?.signatures) && rawBookingObj.signatures.length > 0)
            ? rawBookingObj.signatures
            : (signature ? [signature] : []),
    documents: raw.documents,
    guest: cleanGuest,
    booking: cleanBooking,
    activeBooking: cleanBooking,
  };

  // Run final circular reference pass to guarantee 100% circular safety
  return removeCircularReferences(modalData);
}
