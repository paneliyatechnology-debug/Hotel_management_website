"use client";

import { Dialog, Typography, Button, TextField, Box } from "@mui/material";
import { WarningAmber } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import { AppDialogHeader, AppDialogFooter, dialogPaperSx, dialogCancelButtonSx, dialogPrimaryButtonSx } from "@/shared/components/AppDialog";

export default function ConfirmDialog({
  open,
  section = "Confirmation",
  title = "Confirm action",
  message = "Review the details below before you continue.",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  isDanger = false,
  requireReason = false,
  reasonValue = "",
  onReasonChange,
  reasonPlaceholder = "Add a reason",
  loading = false,
  onConfirm,
  onClose,
}) {
  const { themeConfig, isDarkMode } = useAppTheme();
  const accent = isDanger ? themeConfig.danger || "#DC2626" : themeConfig.primary;

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="xs"
      fullWidth
      slotProps={{ paper: { sx: dialogPaperSx(themeConfig, isDarkMode) } }}
    >
      <AppDialogHeader
        eyebrow={section}
        title={title}
        icon={<WarningAmber sx={{ fontSize: 20 }} />}
        onClose={onClose}
        closeDisabled={loading}
      />

      <Box sx={{ px: 3, py: 2.75 }}>
        <Typography sx={{ color: themeConfig.textMain, fontSize: "0.95rem", lineHeight: 1.6 }}>
          {message}
        </Typography>
        {requireReason && (
          <TextField
            fullWidth
            multiline
            minRows={3}
            label="Reason"
            placeholder={reasonPlaceholder}
            value={reasonValue}
            onChange={(e) => onReasonChange && onReasonChange(e.target.value)}
            sx={{ mt: 2, "& .MuiOutlinedInput-root": { borderRadius: "10px" } }}
          />
        )}
      </Box>

      <AppDialogFooter>
        <Button onClick={onClose} disabled={loading} variant="outlined" sx={dialogCancelButtonSx(themeConfig, isDarkMode)}>
          {cancelLabel}
        </Button>
        <Button
          variant="contained"
          disabled={loading || (requireReason && !reasonValue?.trim())}
          onClick={onConfirm}
          sx={dialogPrimaryButtonSx(themeConfig, accent, isDanger ? "#B91C1C" : themeConfig.primaryDark)}
        >
          {loading ? "Please wait…" : confirmLabel}
        </Button>
      </AppDialogFooter>
    </Dialog>
  );
}
