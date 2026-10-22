"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { Box, Typography, Button, TextField } from "@mui/material";
import { Refresh, CheckCircle, Create, TextFields, CloudUpload } from "@/shared/icons";
import { useAppTheme } from "@/shared/context/ThemeContext";
import SignaturePad from "@/shared/components/SignaturePad";

/**
 * Clean & Modern Digital E-Signature Pad
 * Supports:
 * 1. Upload a signature image
 * 2. Screen / Mouse Drawing
 * 3. Typed Cursive Signature
 */
export default function DigitalSignaturePad({
  title = "Guest Signature",
  signerName = "",
  signerRole = "Guest",
  value = null,
  signature = null,
  onChange,
  onSave,
  onClear,
  themeConfig: propThemeConfig,
  required = false,
  error = false,
  helperText = "",
}) {
  const { themeConfig: appThemeConfig, isDarkMode } = useAppTheme();
  const themeConfig = propThemeConfig || appThemeConfig;

  const activeSig = value || signature || null;
  const sigPadRef = useRef(null);
  const fileInputRef = useRef(null);
  const [hasSignature, setHasSignature] = useState(Boolean(activeSig));
  const [mode, setMode] = useState("UPLOAD");
  const [typedName, setTypedName] = useState(signerName || "");
  const [uploadError, setUploadError] = useState("");

  // Update signature status when activeSig prop updates
  useEffect(() => {
    setHasSignature(Boolean(activeSig));
  }, [activeSig]);

  const handleSignatureUpdate = useCallback((dataUrl) => {
    setHasSignature(Boolean(dataUrl));
    if (onChange) onChange(dataUrl);
    if (onSave) onSave(dataUrl);
  }, [onChange, onSave]);

  const handleClear = () => {
    if (sigPadRef.current) {
      sigPadRef.current.clear();
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setHasSignature(false);
    setTypedName("");
    setUploadError("");
    if (onChange) onChange(null);
    if (onSave) onSave(null);
    if (onClear) onClear();
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be under 5 MB.");
      return;
    }
    setUploadError("");
    const reader = new FileReader();
    reader.onload = () => {
      handleSignatureUpdate(typeof reader.result === "string" ? reader.result : null);
    };
    reader.readAsDataURL(file);
  };

  const handleTypedChange = (e) => {
    const text = e.target.value;
    setTypedName(text);
    if (text.trim()) {
      const canvas = document.createElement("canvas");
      canvas.width = 400;
      canvas.height = 140;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, 400, 140);
      ctx.font = "italic 36px 'Brush Script MT', 'Caveat', 'Dancing Script', cursive, sans-serif";
      ctx.fillStyle = "#0F172A";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, 200, 70);

      const dataUrl = canvas.toDataURL("image/png");
      handleSignatureUpdate(dataUrl);
    } else {
      handleSignatureUpdate(null);
    }
  };

  const modes = [
    { value: "UPLOAD", label: "Upload", icon: <CloudUpload sx={{ fontSize: 16 }} /> },
    { value: "DRAW", label: "Draw", icon: <Create sx={{ fontSize: 16 }} /> },
    { value: "TYPE", label: "Type", icon: <TextFields sx={{ fontSize: 16 }} /> },
  ];

  const showError = error && !hasSignature;
  const areaBorder = showError ? "#DC2626" : hasSignature ? themeConfig.primary : themeConfig.border || "#CCFBF1";

  return (
    <Box>
      {/* Mode switch + status */}
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
                  color: active ? themeConfig.accent || themeConfig.primary : themeConfig.textMuted,
                  bgcolor: active ? (isDarkMode ? themeConfig.primary : "#FFFFFF") : "transparent",
                  "&:hover": { bgcolor: active ? undefined : "rgba(15, 23, 42, 0.04)", boxShadow: "none" },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        {hasSignature && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, color: themeConfig.tones.success.color, fontSize: "0.8rem", fontWeight: 700 }}>
              <CheckCircle sx={{ fontSize: 16 }} />
              Signed
            </Box>
            <Button
              size="small"
              startIcon={<Refresh sx={{ fontSize: 14 }} />}
              onClick={handleClear}
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
              Clear
            </Button>
          </Box>
        )}
      </Box>

      {mode === "UPLOAD" && (
        <Box
          sx={{
            p: { xs: 2, sm: 3 },
            borderRadius: "14px",
            bgcolor: showError ? "rgba(220, 38, 38, 0.03)" : isDarkMode ? "rgba(255,255,255,0.02)" : "#F8FAFC",
            border: `1.5px dashed ${areaBorder}`,
            textAlign: "center",
          }}
        >
          <input ref={fileInputRef} type="file" accept="image/*" hidden onChange={handleImageUpload} />
          {activeSig ? (
            <Box
              sx={{
                p: 1,
                bgcolor: "#FFFFFF",
                borderRadius: "10px",
                border: `1px solid ${themeConfig.border || "#E2E8F0"}`,
                display: "inline-block",
                maxWidth: 320,
                width: "100%",
              }}
            >
              <img src={activeSig} alt="Signature" style={{ width: "100%", maxHeight: 140, objectFit: "contain", display: "block" }} />
            </Box>
          ) : (
            <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  bgcolor: themeConfig.champagne || "#F0FDFA",
                  color: themeConfig.primary,
                }}
              >
                <CloudUpload sx={{ fontSize: 22 }} />
              </Box>
              <Typography sx={{ fontWeight: 700, color: themeConfig.textMain, fontSize: "0.9rem" }}>Upload signature image</Typography>
              <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.75rem" }}>JPG or PNG, up to 5 MB</Typography>
              <Button
                variant="outlined"
                onClick={() => fileInputRef.current?.click()}
                sx={{
                  mt: 0.75,
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
                Choose image
              </Button>
              {uploadError && (
                <Typography sx={{ color: "#DC2626", fontSize: "0.75rem", fontWeight: 600 }}>{uploadError}</Typography>
              )}
            </Box>
          )}
        </Box>
      )}

      {mode === "DRAW" && (
        <Box sx={{ borderRadius: "14px", border: `1.5px dashed ${areaBorder}`, overflow: "hidden" }}>
          <SignaturePad
            ref={sigPadRef}
            height={180}
            color={isDarkMode ? "#38BDF8" : themeConfig.textMain || "#0F172A"}
            placeholder="Sign here using a finger, stylus or mouse"
            onSignChange={(signed, dataUrl) => {
              if (signed) {
                const imgUrl = dataUrl || sigPadRef.current?.toDataURL();
                handleSignatureUpdate(imgUrl);
              } else {
                handleSignatureUpdate(null);
              }
            }}
          />
        </Box>
      )}

      {mode === "TYPE" && (
        <Box>
          <TextField
            fullWidth
            size="small"
            label="Name"
            placeholder="Type the guest's full name"
            value={typedName}
            onChange={handleTypedChange}
            sx={{ mb: 1.5 }}
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
            {typedName ? (
              <Typography
                sx={{
                  fontFamily: "'Brush Script MT', 'Caveat', 'Dancing Script', cursive, sans-serif",
                  fontSize: { xs: "1.6rem", sm: "1.9rem" },
                  color: isDarkMode ? "#38BDF8" : "#0F172A",
                  lineHeight: 1.2,
                }}
              >
                {typedName}
              </Typography>
            ) : (
              <Typography sx={{ color: themeConfig.textMuted, fontSize: "0.8rem" }}>Your signature preview appears here</Typography>
            )}
          </Box>
        </Box>
      )}

      {showError && (
        <Typography sx={{ mt: 0.75, color: "#DC2626", fontSize: "0.75rem", fontWeight: 600 }}>
          {helperText || "Guest signature is required"}
        </Typography>
      )}
    </Box>
  );
}
