"use client";

import { useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Box, Typography } from "@mui/material";
import { TouchApp } from "@/shared/icons";

/**
 * Universal Native HTML5 Canvas Signature Pad
 * Full dual support: Native TouchEvents (iOS Safari & Android) + PointerEvents
 */
const SignaturePad = forwardRef(function SignaturePad(
  {
    height = 260,
    color = "#0F172A",
    placeholder = "Sign here using finger or mouse",
    onSignChange,
  },
  ref
) {
  const canvasRef = useRef(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  useImperativeHandle(ref, () => ({
    clear: () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      isDrawingRef.current = false;
      hasDrawnRef.current = false;
      if (onSignChange) onSignChange(false);
    },
    toDataURL: (type = "image/png") => {
      const canvas = canvasRef.current;
      if (!canvas || !hasDrawnRef.current) return null;
      return canvas.toDataURL(type);
    },
    hasSignature: () => hasDrawnRef.current,
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    const setupResolution = () => {
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const dpr = Math.max(window.devicePixelRatio || 1, 1);

      // Save drawing if resizing
      let prevImg = null;
      if (canvas.width > 0 && canvas.height > 0 && hasDrawnRef.current) {
        prevImg = canvas.toDataURL("image/png");
      }

      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);

      ctx.lineWidth = 3.5 * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      if (prevImg) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        };
        img.src = prevImg;
      }
    };

    setupResolution();
    const timer = setTimeout(setupResolution, 100);

    const getCoords = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;

      let clientX = e.clientX;
      let clientY = e.clientY;

      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if (e.changedTouches && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      }

      return {
        x: (clientX - rect.left) * scaleX,
        y: (clientY - rect.top) * scaleY,
      };
    };

    // START DRAWING (Touch / Pointer / Mouse)
    const handleStart = (e) => {
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      try {
        if (e.pointerId !== undefined && canvas.setPointerCapture) {
          canvas.setPointerCapture(e.pointerId);
        }
      } catch (err) {}

      isDrawingRef.current = true;
      const pos = getCoords(e);
      lastPosRef.current = pos;

      const dpr = Math.max(window.devicePixelRatio || 1, 1);
      ctx.lineWidth = 3.5 * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;
      ctx.fillStyle = color;

      // Draw initial touch point
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 1.8 * dpr, 0, Math.PI * 2);
      ctx.fill();

      hasDrawnRef.current = true;
      if (onSignChange) onSignChange(true, canvas.toDataURL("image/png"));
    };

    // MOVE DRAWING (Touch / Pointer / Mouse)
    const handleMove = (e) => {
      if (!isDrawingRef.current) return;
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();

      const pos = getCoords(e);
      const last = lastPosRef.current;
      const dpr = Math.max(window.devicePixelRatio || 1, 1);

      ctx.lineWidth = 3.5 * dpr;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.strokeStyle = color;

      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.stroke();

      lastPosRef.current = pos;
      hasDrawnRef.current = true;
    };

    // END DRAWING
    const handleEnd = (e) => {
      if (isDrawingRef.current) {
        isDrawingRef.current = false;
        try {
          if (e && e.pointerId !== undefined && canvas.releasePointerCapture) {
            canvas.releasePointerCapture(e.pointerId);
          }
        } catch (err) {}
        if (hasDrawnRef.current && onSignChange) {
          onSignChange(true, canvas.toDataURL("image/png"));
        }
      }
    };

    // 1. Direct Native Touch Listeners with { passive: false } for iOS Safari
    canvas.addEventListener("touchstart", handleStart, { passive: false });
    canvas.addEventListener("touchmove", handleMove, { passive: false });
    canvas.addEventListener("touchend", handleEnd, { passive: false });
    canvas.addEventListener("touchcancel", handleEnd, { passive: false });

    // 2. Pointer Events for Android Chrome & Touchscreen laptops
    canvas.addEventListener("pointerdown", handleStart, { passive: false });
    canvas.addEventListener("pointermove", handleMove, { passive: false });
    canvas.addEventListener("pointerup", handleEnd, { passive: false });
    canvas.addEventListener("pointercancel", handleEnd, { passive: false });

    // 3. Desktop Mouse fallback
    canvas.addEventListener("mousedown", handleStart);
    window.addEventListener("mousemove", handleMove);
    window.addEventListener("mouseup", handleEnd);

    window.addEventListener("resize", setupResolution);

    return () => {
      clearTimeout(timer);
      canvas.removeEventListener("touchstart", handleStart);
      canvas.removeEventListener("touchmove", handleMove);
      canvas.removeEventListener("touchend", handleEnd);
      canvas.removeEventListener("touchcancel", handleEnd);

      canvas.removeEventListener("pointerdown", handleStart);
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerup", handleEnd);
      canvas.removeEventListener("pointercancel", handleEnd);

      canvas.removeEventListener("mousedown", handleStart);
      window.removeEventListener("mousemove", handleMove);
      window.removeEventListener("mouseup", handleEnd);

      window.removeEventListener("resize", setupResolution);
    };
  }, [color, onSignChange]);

  return (
    <Box
      sx={{
        position: "relative",
        width: "100%",
        height,
        flex: height === "100%" ? 1 : "none",
        minHeight: height === "100%" ? 200 : height,
        bgcolor: "#F8FAFC",
        borderRadius: "16px",
        border: "2px dashed #CBD5E1",
        overflow: "hidden",
        touchAction: "none !important",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        cursor: "crosshair",
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          display: "block",
          touchAction: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          WebkitTouchCallout: "none",
          cursor: "crosshair",
          zIndex: 10,
        }}
      />

      {/* Watermark placeholder (strictly pointer-events: none) */}
      <Box
        sx={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none !important",
          userSelect: "none",
          opacity: 0.45,
          zIndex: 1,
        }}
      >
        <TouchApp sx={{ fontSize: 36, color: "#94A3B8", mb: 0.5, pointerEvents: "none" }} />
        <Typography variant="body2" sx={{ color: "#64748B", fontWeight: 800, pointerEvents: "none" }}>
          {placeholder}
        </Typography>
      </Box>

      <Box
        sx={{
          position: "absolute",
          bottom: 30,
          left: 20,
          right: 20,
          borderBottom: "1.5px dashed #CBD5E1",
          pointerEvents: "none !important",
          zIndex: 1,
        }}
      />
      <Typography
        variant="caption"
        sx={{
          position: "absolute",
          bottom: 8,
          right: 16,
          fontSize: "0.75rem",
          color: "#94A3B8",
          fontWeight: 800,
          pointerEvents: "none !important",
          zIndex: 1,
        }}
      >
        Sign Here ✍️
      </Typography>
    </Box>
  );
});

export default SignaturePad;
