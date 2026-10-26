"use client";

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import {
  Refresh,
  CheckCircle,
  Create,
  TextFields,
  CloudUpload,
  Close,
  Visibility,
  Add,
} from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import SignaturePad from "@/shared/components/SignaturePad";

/**
 * Universal Digital E-Signature Pad
 * Supports:
 * 1. Uploading single or multiple signature images (JPG/PNG)
 * 2. Drawing multiple signatures on screen/mouse canvas
 * 3. Typed cursive signatures
 * Displays captured signatures as a visual thumbnail grid matching the ID documents gallery.
 */
export default function DigitalSignaturePad({
  title = "Guest Signature",
  signerName = "",
  signerRole = "Guest",
  value = null,
  signature = null,
  signatures = null,
  onChange,
  onSave,
  onClear,
  onPreview,
  themeConfig: propThemeConfig,
  required = false,
  error = false,
  helperText = "",
}) {
  const { themeConfig: appThemeConfig, isDarkMode } = useAppTheme();
  const themeConfig = propThemeConfig || appThemeConfig;

  const [mode, setMode] = useState("UPLOAD");
  const [typedName, setTypedName] = useState(signerName || "");
  const [uploadError, setUploadError] = useState("");
  const [canSaveDrawing, setCanSaveDrawing] = useState(false);
  const [localPreviewSrc, setLocalPreviewSrc] = useState(null);

  const sigPadRef = useRef(null);
  const fileInputRef = useRef(null);

  // Normalize signatures into a clean array
  const signaturesList = useMemo(() => {
    if (Array.isArray(signatures) && signatures.length > 0) {
      return signatures.filter(Boolean);
    }
    if (Array.isArray(value) && value.length > 0) {
      return value.filter(Boolean);
    }
    if (Array.isArray(signature) && signature.length > 0) {
      return signature.filter(Boolean);
    }
    const single = value || signature;
    if (typeof single === "string" && single.trim()) {
      return [single.trim()];
    }
    return [];
  }, [signatures, value, signature]);

  const hasSignatures = signaturesList.length > 0;

  const notifyUpdate = useCallback(
    (newList) => {
      const cleaned = newList.filter(Boolean);
      const primary = cleaned[0] || "";
      if (onChange) onChange(primary, cleaned);
      if (onSave) onSave(primary, cleaned);
    },
    [onChange, onSave]
  );

  const handleAddSignature = useCallback(
    (newSig) => {
      if (!newSig) return;
      const updated = [...signaturesList, newSig];
      notifyUpdate(updated);
    },
    [signaturesList, notifyUpdate]
  );

  const handleRemoveSignature = useCallback(
    (indexToRemove) => {
      const updated = signaturesList.filter((_, idx) => idx !== indexToRemove);
      notifyUpdate(updated);
      if (updated.length === 0 && onClear) {
        onClear();
      }
    },
    [signaturesList, notifyUpdate, onClear]
  );

  const handleClearAll = useCallback(() => {
    if (sigPadRef.current) sigPadRef.current.clear();
    if (fileInputRef.current) fileInputRef.current.value = "";
    setTypedName("");
    setCanSaveDrawing(false);
    setUploadError("");
    notifyUpdate([]);
    if (onClear) onClear();
  }, [notifyUpdate, onClear]);

  // Handle uploading 1 or multiple signature files
  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setUploadError("");

    const validFiles = files.filter((f) => {
      if (!f.type.startsWith("image/")) {
        setUploadError("Please upload image files only (JPG or PNG).");
        return false;
      }
      if (f.size > 5 * 1024 * 1024) {
        setUploadError("Each signature image must be under 5 MB.");
        return false;
      }
      return true;
    });

    if (validFiles.length === 0) return;

    Promise.all(
      validFiles.map(
        (file) =>
          new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.readAsDataURL(file);
          })
      )
    ).then((dataUrls) => {
      const validUrls = dataUrls.filter(Boolean);
      if (validUrls.length > 0) {
        notifyUpdate([...signaturesList, ...validUrls]);
      }
      if (event.target) event.target.value = "";
    });
  };

  // Handle saving current drawn signature
  const handleSaveDrawnSignature = () => {
    if (!sigPadRef.current) return;
    const dataUrl = sigPadRef.current.toDataURL("image/png");
    if (dataUrl) {
      handleAddSignature(dataUrl);
      sigPadRef.current.clear();
      setCanSaveDrawing(false);
    }
  };

  // Handle saving typed signature
  const handleSaveTypedSignature = () => {
    const text = typedName.trim();
    if (!text) return;
    const canvas = document.createElement("canvas");
    canvas.width = 460;
    canvas.height = 140;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, 460, 140);
    ctx.font = "italic 36px 'Brush Script MT', 'Caveat', 'Dancing Script', cursive, sans-serif";
    ctx.fillStyle = "#0F172A";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 230, 70);

    const dataUrl = canvas.toDataURL("image/png");
    if (dataUrl) {
      handleAddSignature(dataUrl);
      setTypedName("");
    }
  };

  const modes = [
    { value: "UPLOAD", label: "Upload", icon: <CloudUpload sx={{ fontSize: 16 }} /> },
    { value: "DRAW", label: "Draw", icon: <Create sx={{ fontSize: 16 }} /> },
    { value: "TYPE", label: "Type", icon: <TextFields sx={{ fontSize: 16 }} /> },
  ];

  const showError = error && !hasSignatures;
  const areaBorder = showError
    ? "#DC2626"
    : hasSignatures
      ? themeConfig.primary
      : themeConfig.border || "#CCFBF1";

  const handleOpenPreview = (src) => {
    if (onPreview) {
      onPreview(src);
    } else {
      setLocalPreviewSrc(src);
    }
  };

  return (
    <Box>
      {/* Mode switch + status & clear buttons */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 1.5 }}>
        <Box
          sx={{
            display: "inline-flex",
            p: 0.5,
            gap: 0.5,
            borderRadius: "12px",
            bgcolor: isDarkMode ? "rgba(255,255,255,0.06)" : "#F1F5F9",
            border: `1px solid ${themeConfig.border || "#E2E8F0"}`,
          }}
        >
          {modes.map((item) => {
            const active = mode === item.value;
            return (
              <Button
                key={item.value}
                size="small"
                startIcon={item.icon}
                onClick={() => setMode(item.value)}
                sx={{
                  minHeight: 32,
                  px: 1.75,
                  borderRadius: "9px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  textTransform: "none",
                  boxShadow: "none",
                  color: active ? (isDarkMode ? "#FFFFFF" : themeConfig.primary) : themeConfig.textMuted,
                  bgcolor: active ? (isDarkMode ? themeConfig.primary : "#FFFFFF") : "transparent",
                  "&:hover": { bgcolor: active ? undefined : "rgba(32, 41, 35, 0.04)", boxShadow: "none" },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        {hasSignatures && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: themeConfig.tones.success.color, fontSize: "0.8rem", fontWeight: 700 }}>
              <CheckCircle sx={{ fontSize: 16 }} />
              {signaturesList.length === 1 ? "Signed (1 signature)" : `Signed (${signaturesList.length} signatures)`}
            </Box>
            <Button
              size="small"
              startIcon={<Refresh sx={{ fontSize: 14 }} />}
              onClick={handleClearAll}
              sx={{
                minHeight: 32,
                px: 1.25,
                borderRadius: "9px",
                fontSize: "0.8rem",
                fontWeight: 700,
                textTransform: "none",
                color: themeConfig.tones.danger.color,
                "&:hover": { bgcolor: themeConfig.tones.danger.bg },
              }}
            >
              Clear all
            </Button>
          </Box>
        )}
      </Box>

      {/* GALLERY OF CAPTURED SIGNATURES (MATCHES ID DOCUMENTS FORMAT) */}
      {hasSignatures && (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)", md: "repeat(4, 1fr)" },
            gap: 1.5,
            mb: 2,
          }}
        >
          {signaturesList.map((sigSrc, idx) => (
            <Box
              key={idx}
              sx={{
                position: "relative",
                height: 130,
                borderRadius: "12px",
                overflow: "hidden",
                border: `1px solid ${themeConfig.border || "#E2E8F0"}`,
                bgcolor: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                p: 1.5,
                boxShadow: isDarkMode ? "none" : "0 1px 3px rgba(0,0,0,0.06)",
              }}
            >
              <Box
                component="img"
                src={sigSrc}
                alt={`Signature ${idx + 1}`}
                onClick={() => handleOpenPreview(sigSrc)}
                sx={{
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                  cursor: "pointer",
                  transition: "transform 0.2s ease",
                  "&:hover": { transform: "scale(1.05)" },
                }}
              />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemoveSignature(idx);
                }}
                sx={{
                  position: "absolute",
                  top: 6,
                  right: 6,
                  bgcolor: "rgba(255,255,255,0.95)",
                  color: themeConfig.tones.danger.color,
                  width: 26,
                  height: 26,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                  "&:hover": { bgcolor: "#FEE2E2" },
                }}
              >
                <Close sx={{ fontSize: 15 }} />
              </IconButton>
              <IconButton
                size="small"
                onClick={() => handleOpenPreview(sigSrc)}
                sx={{
                  position: "absolute",
                  top: 6,
                  left: 6,
                  bgcolor: "rgba(255,255,255,0.95)",
                  color: themeConfig.textMain,
                  width: 26,
                  height: 26,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.12)",
                  "&:hover": { bgcolor: "#FFFFFF" },
                }}
              >
                <Visibility sx={{ fontSize: 15 }} />
              </IconButton>
              <Box
                sx={{
                  position: "absolute",
                  bottom: 6,
                  left: 6,
                  px: 1,
                  py: 0.2,
                  borderRadius: 999,
                  fontSize: "0.66rem",
                  fontWeight: 700,
                  color: "#FFFFFF",
                  bgcolor: idx === 0 ? themeConfig.primary : "rgba(32, 41, 35, 0.8)",
                }}
              >
                {idx === 0 ? "Primary Signature" : `Signature ${idx + 1}`}
              </Box>
            </Box>
          ))}

          {/* In UPLOAD mode, display '+ Add more' upload card directly in the gallery grid */}
          {mode === "UPLOAD" && (
            <Box
              component="label"
              sx={{
                height: 130,
                borderRadius: "12px",
                border: `1.5px dashed ${themeConfig.border}`,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 0.5,
                cursor: "pointer",
                color: themeConfig.primary,
                transition: "border-color 0.15s ease, background-color 0.15s ease",
                "&:hover": { borderColor: themeConfig.primary, bgcolor: themeConfig.champagne },
              }}
            >
              <input type="file" hidden multiple accept="image/*" onChange={handleImageUpload} />
              <CloudUpload sx={{ fontSize: 22 }} />
              <Typography sx={{ fontSize: "0.78rem", fontWeight: 700 }}>Add more</Typography>
            </Box>
          )}
        </Box>
      )}

      {/* UPLOAD MODE (When no signatures yet) */}
      {mode === "UPLOAD" && !hasSignatures && (
        <Box
          sx={{
            p: { xs: 2.5, sm: 3.5 },
            borderRadius: "14px",
            bgcolor: showError ? "rgba(220, 38, 38, 0.03)" : isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC",
            border: `1.5px dashed ${areaBorder}`,
            textAlign: "center",
          }}
        >
          <input ref={fileInputRef} type="file" multiple accept="image/*" hidden onChange={handleImageUpload} />
          <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: themeConfig.champagne || "#F0FDFA",
                color: themeConfig.primary,
              }}
            >
              <CloudUpload sx={{ fontSize: 24 }} />
            </Box>
            <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.95rem" }}>
              Upload signature image(s)
            </Typography>
            <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.75rem" }}>
              Click to choose one or multiple photos. JPG or PNG, up to 5 MB
            </Typography>
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              sx={{
                mt: 1,
                minHeight: 36,
                px: 2.5,
                borderRadius: "10px",
                fontWeight: 700,
                fontSize: "0.82rem",
                textTransform: "none",
                boxShadow: "none",
                borderColor: themeConfig.primary,
                color: themeConfig.primary,
                "&:hover": { bgcolor: themeConfig.champagne || "#F0FDFA", borderColor: themeConfig.primary, boxShadow: "none" },
              }}
            >
              Choose image(s)
            </Button>
            {uploadError && (
              <Typography sx={{ color: "#DC2626", fontSize: "0.75rem", fontWeight: 600, mt: 0.5 }}>{uploadError}</Typography>
            )}
          </Box>
        </Box>
      )}

      {/* DRAW MODE */}
      {mode === "DRAW" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {hasSignatures && (
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: themeConfig.textMuted }}>
              Draw another signature:
            </Typography>
          )}
          <Box sx={{ borderRadius: "14px", border: `1.5px dashed ${areaBorder}`, overflow: "hidden" }}>
            <SignaturePad
              ref={sigPadRef}
              height={170}
              color={isDarkMode ? "#38BDF8" : themeConfig.textMain || "#0F172A"}
              placeholder="Sign here using a finger, stylus or mouse"
              onSignChange={(signed) => setCanSaveDrawing(signed)}
            />
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
            <Button
              size="small"
              onClick={() => {
                if (sigPadRef.current) sigPadRef.current.clear();
                setCanSaveDrawing(false);
              }}
              sx={{
                minHeight: 34,
                px: 1.75,
                borderRadius: "9px",
                fontWeight: 600,
                fontSize: "0.8rem",
                textTransform: "none",
                color: themeConfig.textMuted,
              }}
            >
              Clear Canvas
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add sx={{ fontSize: 16 }} />}
              disabled={!canSaveDrawing}
              onClick={handleSaveDrawnSignature}
              sx={{
                minHeight: 34,
                px: 2,
                borderRadius: "9px",
                fontWeight: 700,
                fontSize: "0.82rem",
                textTransform: "none",
                bgcolor: themeConfig.primary,
                color: themeConfig.onPrimary,
                "&:hover": { bgcolor: themeConfig.primaryDark || themeConfig.primary },
                "&.Mui-disabled": { opacity: 0.5 },
              }}
            >
              Add Signature
            </Button>
          </Box>
        </Box>
      )}

      {/* TYPE MODE */}
      {mode === "TYPE" && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
          {hasSignatures && (
            <Typography sx={{ fontSize: "0.8rem", fontWeight: 700, color: themeConfig.textMuted }}>
              Type another signature:
            </Typography>
          )}
          <TextField
            fullWidth
            size="small"
            label="Signer Name"
            placeholder="Type full name for digital signature"
            value={typedName}
            onChange={(e) => setTypedName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && typedName.trim()) {
                e.preventDefault();
                handleSaveTypedSignature();
              }
            }}
          />
          <Box
            sx={{
              p: 2,
              minHeight: 84,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "14px",
              bgcolor: showError ? "rgba(220, 38, 38, 0.03)" : isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC",
              border: `1.5px dashed ${areaBorder}`,
              textAlign: "center",
            }}
          >
            {typedName.trim() ? (
              <Typography
                sx={{
                  fontFamily: "'Brush Script MT', 'Caveat', 'Dancing Script', cursive, sans-serif",
                  fontSize: { xs: "1.7rem", sm: "2rem" },
                  color: isDarkMode ? "#38BDF8" : "#0F172A",
                  lineHeight: 1.2,
                }}
              >
                {typedName}
              </Typography>
            ) : (
              <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.8rem" }}>
                Your cursive signature preview will appear here
              </Typography>
            )}
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 1 }}>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add sx={{ fontSize: 16 }} />}
              disabled={!typedName.trim()}
              onClick={handleSaveTypedSignature}
              sx={{
                minHeight: 34,
                px: 2,
                borderRadius: "9px",
                fontWeight: 700,
                fontSize: "0.82rem",
                textTransform: "none",
                bgcolor: themeConfig.primary,
                color: themeConfig.onPrimary,
                "&:hover": { bgcolor: themeConfig.primaryDark || themeConfig.primary },
                "&.Mui-disabled": { opacity: 0.5 },
              }}
            >
              Add Signature
            </Button>
          </Box>
        </Box>
      )}

      {showError && (
        <Typography sx={{ mt: 0.75, color: "#DC2626", fontSize: "0.75rem", fontWeight: 600 }}>
          {helperText || "Guest signature is required"}
        </Typography>
      )}

      {/* Fallback Preview Modal (when onPreview is not passed from parent) */}
      <Dialog
        open={Boolean(localPreviewSrc)}
        onClose={() => setLocalPreviewSrc(null)}
        maxWidth="sm"
        fullWidth
        slotProps={{ paper: { sx: { borderRadius: "16px", p: 1 } } }}
      >
        <DialogTitle sx={{ fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          Signature Preview
          <IconButton size="small" onClick={() => setLocalPreviewSrc(null)}>
            <Close sx={{ fontSize: 18 }} />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ display: "flex", justifyContent: "center", alignItems: "center", bgcolor: "#FFFFFF", borderRadius: "10px", m: 2, p: 3, border: `1px solid ${themeConfig.border}` }}>
          {localPreviewSrc && (
            <Box
              component="img"
              src={localPreviewSrc}
              alt="Signature preview"
              sx={{ maxWidth: "100%", maxHeight: 300, objectFit: "contain" }}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLocalPreviewSrc(null)} sx={{ fontWeight: 700 }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
