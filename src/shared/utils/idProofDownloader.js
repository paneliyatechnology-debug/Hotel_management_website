import JSZip from "jszip";

/**
 * Direct ID Image Download Utility with JSZip Bundling
 * Bundles all ID proof images (Front & Back) for Primary Guest and all Accompanying Members
 * strictly named with each person's respective name (e.g. Jay_Front_ID.jpg, Jay_Back_ID.jpg, Member_1_Front_ID.jpg)
 * into a single unified .ZIP archive!
 */

export function sanitizeFilename(name) {
  return (name || "Guest")
    .trim()
    .replace(/[^a-zA-Z0-9_\- ]/g, "")
    .replace(/\s+/g, "_");
}

export function getExtensionFromUrl(url) {
  if (!url) return "jpg";
  if (url.startsWith("data:image/png")) return "png";
  if (url.startsWith("data:image/jpeg") || url.startsWith("data:image/jpg")) return "jpg";
  if (url.startsWith("data:image/webp")) return "webp";
  const match = url.match(/\.([a-zA-Z0-9]+)(?:\?|#|$)/);
  if (match && ["jpg", "jpeg", "png", "webp", "pdf"].includes(match[1].toLowerCase())) {
    return match[1].toLowerCase();
  }
  return "jpg";
}

async function fetchImageBlob(url) {
  if (!url) return null;

  // Handle Base64 Data URI
  if (url.startsWith("data:")) {
    try {
      const parts = url.split(",");
      const mime = parts[0].match(/:(.*?);/)?.[1] || "image/jpeg";
      const byteCharacters = atob(parts[1]);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      return new Blob([byteArray], { type: mime });
    } catch (e) {
      console.error("Failed to parse base64 image data:", e);
      return null;
    }
  }

  // Handle Blob URI
  if (url.startsWith("blob:")) {
    try {
      const res = await fetch(url);
      return await res.blob();
    } catch (e) {
      console.error("Failed to fetch blob URI:", e);
      return null;
    }
  }

  // Handle HTTP / HTTPS / Relative URL
  try {
    const res = await fetch(url, { mode: "cors" });
    if (res.ok) {
      return await res.blob();
    }
  } catch (e) {
    console.warn("Direct fetch failed, attempting canvas conversion fallback:", e);
  }

  // Fallback: load into HTML Image element and extract via Canvas to bypass standard CORS limitations
  try {
    const blob = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = img.naturalWidth || img.width || 800;
          canvas.height = img.naturalHeight || img.height || 600;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0);
          canvas.toBlob((b) => resolve(b), "image/jpeg", 0.95);
        } catch (err) {
          reject(err);
        }
      };
      img.onerror = reject;
      img.src = url;
    });
    return blob;
  } catch (canvasErr) {
    console.error("Canvas image extraction failed:", canvasErr);
    return null;
  }
}

export async function downloadSingleImage(url, filename) {
  if (!url) return;
  try {
    const blob = await fetchImageBlob(url);
    const ext = getExtensionFromUrl(url);
    const finalFilename = filename.includes(".") ? filename : `${filename}.${ext}`;

    if (blob) {
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = finalFilename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1500);
      return;
    }

    const a = document.createElement("a");
    a.href = url;
    a.target = "_blank";
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (error) {
    console.error("Error downloading single image:", error);
  }
}

/**
 * Downloads all ID proof images for the primary guest and accompanying members
 * bundled inside a single .ZIP file!
 */
export async function downloadAllGuestIdImages({ guest = {}, activeBooking = null, accompanyingGuests = [] }, onToast = null) {
  const imagesToDownload = [];

  const primaryName = sanitizeFilename(guest.fullName || guest.name || activeBooking?.guestName || "Primary_Guest");
  const primaryFront =
    guest.idProof?.frontImage ||
    guest.idProof?.frontImageUrl ||
    guest.frontImage ||
    guest.frontImageUrl ||
    guest.idProofImage ||
    activeBooking?.idProof?.frontImage ||
    activeBooking?.frontImage;

  const primaryBack =
    guest.idProof?.backImage ||
    guest.idProof?.backImageUrl ||
    guest.backImage ||
    guest.backImageUrl ||
    guest.idProofBackImage ||
    activeBooking?.idProof?.backImage ||
    activeBooking?.backImage;

  if (primaryFront) {
    imagesToDownload.push({
      url: primaryFront,
      filename: `${primaryName}_Front_ID`,
      person: primaryName,
      type: "Front ID",
    });
  }

  if (primaryBack) {
    imagesToDownload.push({
      url: primaryBack,
      filename: `${primaryName}_Back_ID`,
      person: primaryName,
      type: "Back ID",
    });
  }

  const members = accompanyingGuests || activeBooking?.accompanyingGuests || guest.accompanyingGuests || [];
  members.forEach((m, idx) => {
    const memberName = sanitizeFilename(m.name || m.fullName || `Member_${idx + 1}`);
    const mFront =
      m.frontImage ||
      m.frontImageUrl ||
      m.idProofImage ||
      m.idProof?.frontImage ||
      m.idProof?.frontImageUrl;
    const mBack =
      m.backImage ||
      m.backImageUrl ||
      m.idProofBackImage ||
      m.idProof?.backImage ||
      m.idProof?.backImageUrl;

    if (mFront) {
      imagesToDownload.push({
        url: mFront,
        filename: `${memberName}_Front_ID`,
        person: memberName,
        type: "Front ID",
      });
    }
    if (mBack) {
      imagesToDownload.push({
        url: mBack,
        filename: `${memberName}_Back_ID`,
        person: memberName,
        type: "Back ID",
      });
    }
  });

  if (imagesToDownload.length === 0) {
    if (onToast) {
      onToast("No ID proof images found to download for this guest.", "warning");
    } else {
      alert("No ID proof images found to download for this guest.");
    }
    return;
  }

  if (onToast) {
    onToast(`Preparing ZIP archive with ${imagesToDownload.length} ID image(s)...`, "info");
  }

  try {
    const zip = new JSZip();
    let addedCount = 0;

    for (let i = 0; i < imagesToDownload.length; i++) {
      const item = imagesToDownload[i];
      try {
        const blob = await fetchImageBlob(item.url);
        if (blob) {
          const ext = getExtensionFromUrl(item.url);
          const fileName = `${item.filename}.${ext}`;
          zip.file(fileName, blob);
          addedCount++;
        }
      } catch (itemErr) {
        console.warn(`Could not add ${item.filename} to zip:`, itemErr);
      }
    }

    if (addedCount === 0) {
      // Fallback: try individual downloads if zip creation had no blobs
      for (const item of imagesToDownload) {
        await downloadSingleImage(item.url, item.filename);
      }
      if (onToast) {
        onToast(`Downloaded ${imagesToDownload.length} image(s) individually.`, "info");
      }
      return;
    }

    const zipBlob = await zip.generateAsync({
      type: "blob",
      compression: "DEFLATE",
      compressionOptions: { level: 6 },
    });

    const zipUrl = window.URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = zipUrl;
    a.download = `${primaryName}_Govt_ID_Proofs.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => window.URL.revokeObjectURL(zipUrl), 2000);

    if (onToast) {
      onToast(`Successfully downloaded ${addedCount} ID Proof image(s) in a single ZIP file!`, "success");
    }
  } catch (err) {
    console.error("ZIP Generation error:", err);
    // Fallback: sequential download if JSZip throws
    for (const item of imagesToDownload) {
      await downloadSingleImage(item.url, item.filename);
      await new Promise((r) => setTimeout(r, 300));
    }
    if (onToast) {
      onToast(`Downloaded ${imagesToDownload.length} ID images individually.`, "info");
    }
  }
}
