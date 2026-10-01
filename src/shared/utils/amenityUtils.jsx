"use client";

import React from "react";
import {
  Wifi,
  AcUnit,
  Tv,
  Bathtub,
  Kitchen,
  Balcony,
  LocalCafe,
  Lock,
  KingBed,
  SingleBed,
  HotTub,
  RoomService,
  Pool,
  LocalParking,
  FreeBreakfast,
  Bolt,
  CleaningServices,
  Security,
  AutoAwesome,
  Fastfood,
  LocalDining,
} from "@/shared/icons";

/**
 * Returns a matching Material-UI Icon component for any given amenity string
 */
export function getAmenityIcon(amenityName = "", fontSize = 14) {
  const a = String(amenityName || "").toLowerCase().trim();
  const iconProps = { sx: { "&&": { fontSize, verticalAlign: "middle" } } };

  // 1. WiFi / Internet
  if (a.includes("wifi") || a.includes("wi-fi") || a.includes("internet") || a.includes("broadband")) {
    return <Wifi {...iconProps} />;
  }

  // 2. Air Conditioner / AC / Climate
  if (
    a.includes("ac") ||
    a.includes("air condition") ||
    a.includes("air-condition") ||
    a.includes("cooler") ||
    a.includes("hvac") ||
    a.includes("climate")
  ) {
    return <AcUnit {...iconProps} />;
  }

  // 3. Smart TV / LED TV / Cable / Television
  if (
    a.includes("tv") ||
    a.includes("television") ||
    a.includes("led") ||
    a.includes("screen") ||
    a.includes("cable") ||
    a.includes("smart 4k") ||
    a.includes("ott") ||
    a.includes("netflix")
  ) {
    return <Tv {...iconProps} />;
  }

  // 4. Attached Bathroom & Geyser / Shower / Water Heater
  if (
    a.includes("bath") ||
    a.includes("geyser") ||
    a.includes("shower") ||
    a.includes("washroom") ||
    a.includes("toilet") ||
    a.includes("hot water") ||
    a.includes("heater")
  ) {
    return <Bathtub {...iconProps} />;
  }

  // 5. Jacuzzi / Spa / Hot Tub / Sauna
  if (a.includes("jacuzzi") || a.includes("spa") || a.includes("tub") || a.includes("sauna")) {
    return <HotTub {...iconProps} />;
  }

  // 6. Mini Fridge / Minibar / Bar / Refrigerator / Microwave
  if (
    a.includes("fridge") ||
    a.includes("refrigerator") ||
    a.includes("mini bar") ||
    a.includes("minibar") ||
    a.includes("bar") ||
    a.includes("kitchen") ||
    a.includes("microwave")
  ) {
    return <Kitchen {...iconProps} />;
  }

  // 7. Tea / Coffee Maker / Kettle
  if (a.includes("tea") || a.includes("coffee") || a.includes("kettle") || a.includes("cafe")) {
    return <LocalCafe {...iconProps} />;
  }

  // 8. Electronic Room Safe / Lock / Keycard
  if (a.includes("safe") || a.includes("lock") || a.includes("locker") || a.includes("vault")) {
    return <Lock {...iconProps} />;
  }

  // 9. Balcony / Scenic View / Terrace / Deck
  if (a.includes("balcony") || a.includes("view") || a.includes("terrace") || a.includes("deck") || a.includes("patio")) {
    return <Balcony {...iconProps} />;
  }

  // 10. Swimming Pool Access
  if (a.includes("pool") || a.includes("swim")) {
    return <Pool {...iconProps} />;
  }

  // 11. Valet Parking / Car Parking / Garage
  if (a.includes("park") || a.includes("valet") || a.includes("garage") || a.includes("car")) {
    return <LocalParking {...iconProps} />;
  }

  // 12. Complimentary Breakfast / Food / Dining
  if (a.includes("breakfast") || a.includes("buffet") || a.includes("snack") || a.includes("complimentary")) {
    return <FreeBreakfast {...iconProps} />;
  }

  // 13. 24/7 Room Service / Dining
  if (a.includes("room service") || a.includes("dining") || a.includes("restaurant") || a.includes("meal")) {
    return <RoomService {...iconProps} />;
  }

  // 14. Housekeeping / Cleaning / Laundry / Iron
  if (a.includes("clean") || a.includes("housekeep") || a.includes("laundry") || a.includes("iron") || a.includes("linen")) {
    return <CleaningServices {...iconProps} />;
  }

  // 15. Power Backup / Generator / Charging Socket
  if (a.includes("power") || a.includes("backup") || a.includes("generator") || a.includes("charge") || a.includes("socket")) {
    return <Bolt {...iconProps} />;
  }

  // 16. Security / CCTV / Guard
  if (a.includes("security") || a.includes("cctv") || a.includes("guard") || a.includes("surveillance")) {
    return <Security {...iconProps} />;
  }

  // 17. Bed Types
  if (a.includes("king") || a.includes("queen") || a.includes("double bed")) {
    return <KingBed {...iconProps} />;
  }
  if (a.includes("single bed") || a.includes("twin") || a.includes("bunk")) {
    return <SingleBed {...iconProps} />;
  }

  // Default Sparkle / Feature Icon
  return <AutoAwesome {...iconProps} />;
}
