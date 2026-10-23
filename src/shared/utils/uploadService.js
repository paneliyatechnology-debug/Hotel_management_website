/**
 * Convert File/Blob to base64 Data URI safely
 */
function fileToBase64(fileOrBlob) {
  return new Promise((resolve) => {
    if (typeof fileOrBlob === 'string') return resolve(fileOrBlob);
    if (typeof window === 'undefined' || !(fileOrBlob instanceof Blob)) return resolve('');
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(fileOrBlob);
  });
}

/**
 * Prepare a file for the booking upload. Remote URLs are returned as-is.
 * Files become a base64 data URI, which api.js turns into a binary blob.
 */
export async function uploadToCloudinaryServer(fileOrBase64) {
  if (!fileOrBase64) return '';

  if (typeof fileOrBase64 === 'string' && (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://'))) {
    return fileOrBase64;
  }

  return await fileToBase64(fileOrBase64);
}

/**
 * Prepare several files the same way as uploadToCloudinaryServer.
 */
export async function uploadMultipleToCloudinaryServer(files) {
  if (!files || !Array.isArray(files) || files.length === 0) return [];
  return Promise.all(files.map((file) => fileToBase64(file)));
}
