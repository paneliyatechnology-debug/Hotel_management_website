"use client";

import { useState } from "react";
import { Button, CircularProgress, IconButton, Tooltip } from "@mui/material";
import { Description } from "@/shared/icons";
import { downloadBookingPdf } from "@/shared/utils/bookingPdf";
import { toast } from "@/shared/utils/toast";

export default function FolioPdfButton({ booking, label = "Generate Folio", iconOnly = false, size = "small", sx }) {
  const [busy, setBusy] = useState(false);
  const id = booking?.id || booking?._id || booking?.bookingId || booking?.booking_id;
  const fileLabel = String(booking?.bookingNumber || booking?.booking_number || booking?.guestName || booking?.name || `folio-${id || "guest"}`).replace(/\s+/g, "-");

  const generate = async (event) => {
    event?.stopPropagation?.();
    if (!id || busy) return;
    try {
      setBusy(true);
      await downloadBookingPdf(id, fileLabel);
      toast.show("Folio ready", "success");
    } catch (err) {
      toast.show(err?.message || "Could not generate the folio", "error");
    } finally {
      setBusy(false);
    }
  };

  if (iconOnly) {
    return (
      <Tooltip title={busy ? "Preparing folio" : "Generate Folio"}>
        <span>
          <IconButton
            size={size}
            disabled={!id || busy}
            onClick={generate}
            aria-label="Generate Folio"
            sx={{
              width: 34,
              height: 34,
              borderRadius: "50%",
              bgcolor: "rgba(15, 118, 110, 0.12)",
              color: "#0F766E",
              "&:hover": { bgcolor: "rgba(15, 118, 110, 0.2)" },
              ...sx,
            }}
          >
            {busy ? <CircularProgress size={16} /> : <Description fontSize="small" />}
          </IconButton>
        </span>
      </Tooltip>
    );
  }

  return (
    <Button
      size={size}
      variant="outlined"
      disabled={!id || busy}
      onClick={generate}
      startIcon={busy ? <CircularProgress size={14} color="inherit" /> : <Description sx={{ fontSize: 18 }} />}
      sx={{ borderRadius: "10px", textTransform: "none", fontWeight: 700, ...sx }}
    >
      {busy ? "Preparing..." : label}
    </Button>
  );
}
