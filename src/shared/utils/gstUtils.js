/**
 * Centralized Enterprise GST Calculation Engine (Frontend)
 * Mirrors backend/src/utils/gstUtils.ts for consistent tax calculations.
 */

/**
 * Calculates GST for a single room item based on base price, tax configuration, and night count.
 */
export function calculateSingleRoomGST({
  basePrice = 0,
  gstEnabled = true,
  gstRate = 18,
  taxInclusive = false,
  nights = 1,
  isInterstate = false,
}) {
  const numericPrice = Math.max(0, Number(basePrice) || 0);
  const numNights = Math.max(1, Number(nights) || 1);

  if (!gstEnabled || gstRate <= 0 || numericPrice === 0) {
    const totalBase = Math.round(numericPrice * numNights * 100) / 100;
    return {
      gstEnabled: false,
      gstRate: 0,
      cgstRate: 0,
      sgstRate: 0,
      igstRate: 0,
      taxInclusive: Boolean(taxInclusive),
      basePricePerNight: numericPrice,
      totalBaseAmount: totalBase,
      taxableAmount: totalBase,
      gstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      totalTax: 0,
      finalAmount: totalBase,
      finalAmountPerNight: numericPrice,
    };
  }

  const effectiveGstRate = Number(gstRate) || 0;
  const halfRate = Math.round((effectiveGstRate / 2) * 100) / 100;
  const cgstRate = isInterstate ? 0 : halfRate;
  const sgstRate = isInterstate ? 0 : halfRate;
  const igstRate = isInterstate ? effectiveGstRate : 0;

  let baseAmountForNights = 0;
  let totalGstAmount = 0;
  let grandTotal = 0;

  if (taxInclusive) {
    // Total price is inclusive of GST. Total = Base * (1 + GST/100)
    // Therefore Base = Total / (1 + GST/100)
    const totalPriceForNights = numericPrice * numNights;
    baseAmountForNights = Math.round((totalPriceForNights / (1 + effectiveGstRate / 100)) * 100) / 100;
    totalGstAmount = Math.round((totalPriceForNights - baseAmountForNights) * 100) / 100;
    grandTotal = Math.round(totalPriceForNights * 100) / 100;
  } else {
    // Total price is exclusive of GST. Total = Base + GST
    baseAmountForNights = Math.round(numericPrice * numNights * 100) / 100;
    totalGstAmount = Math.round(((baseAmountForNights * effectiveGstRate) / 100) * 100) / 100;
    grandTotal = Math.round((baseAmountForNights + totalGstAmount) * 100) / 100;
  }

  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  if (isInterstate) {
    igstAmount = totalGstAmount;
  } else {
    cgstAmount = Math.round((totalGstAmount / 2) * 100) / 100;
    // Ensure CGST + SGST = totalGstAmount exactly without rounding drift
    sgstAmount = Math.round((totalGstAmount - cgstAmount) * 100) / 100;
  }

  const finalPerNight = Math.round((grandTotal / numNights) * 100) / 100;

  return {
    gstEnabled: true,
    gstRate: effectiveGstRate,
    cgstRate,
    sgstRate,
    igstRate,
    taxInclusive: Boolean(taxInclusive),
    basePricePerNight: numericPrice,
    totalBaseAmount: baseAmountForNights,
    taxableAmount: baseAmountForNights,
    gstAmount: totalGstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    totalTax: totalGstAmount,
    finalAmount: grandTotal,
    finalAmountPerNight: finalPerNight,
  };
}

/**
 * Calculates GST across multiple selected rooms for a booking.
 * GST is calculated separately for each room before aggregating.
 */
export function calculateMultiRoomBookingGST({
  rooms = [],
  nights = 1,
  isInterstate = false,
}) {
  const numNights = Math.max(1, Number(nights) || 1);

  if (!Array.isArray(rooms) || rooms.length === 0) {
    return {
      taxableAmount: 0,
      gstAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
      grandTotal: 0,
      roomBreakdowns: [],
    };
  }

  let aggregateTaxable = 0;
  let aggregateGst = 0;
  let aggregateCgst = 0;
  let aggregateSgst = 0;
  let aggregateIgst = 0;
  let aggregateGrandTotal = 0;

  const roomBreakdowns = rooms.map((r, index) => {
    const basePrice = Number(r.pricePerNight) || Number(r.customPricePerNight) || Number(r.basePrice) || 0;
    const gstEnabled = r.gstEnabled !== false;
    const gstRate = Number(r.gstRate) ?? 18;
    const taxInclusive = Boolean(r.taxInclusive);

    const calc = calculateSingleRoomGST({
      basePrice,
      gstEnabled,
      gstRate,
      taxInclusive,
      nights: numNights,
      isInterstate,
    });

    aggregateTaxable += calc.taxableAmount;
    aggregateGst += calc.gstAmount;
    aggregateCgst += calc.cgstAmount;
    aggregateSgst += calc.sgstAmount;
    aggregateIgst += calc.igstAmount;
    aggregateGrandTotal += calc.finalAmount;

    return {
      roomId: r._id || r.id || `room-${index}`,
      roomNumber: r.roomNumber || `Room #${index + 1}`,
      roomTypeName: r.roomTypeName || r.roomType?.name || r.name || "Room",
      basePrice,
      nights: numNights,
      ...calc,
    };
  });

  return {
    taxableAmount: Math.round(aggregateTaxable * 100) / 100,
    gstAmount: Math.round(aggregateGst * 100) / 100,
    cgstAmount: Math.round(aggregateCgst * 100) / 100,
    sgstAmount: Math.round(aggregateSgst * 100) / 100,
    igstAmount: Math.round(aggregateIgst * 100) / 100,
    grandTotal: Math.round(aggregateGrandTotal * 100) / 100,
    roomBreakdowns,
  };
}
