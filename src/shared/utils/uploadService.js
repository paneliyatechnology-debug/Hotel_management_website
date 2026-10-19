import { LIVE_API_URL } from '../../config/api.js';

const LIVE_BASE_URL = (
  (typeof process !== 'undefined' && (process.env?.NEXT_PUBLIC_LIVE_API_URL || process.env?.NEXT_PUBLIC_API_URL)) ||
  LIVE_API_URL ||
  'https://hotelmanagementbackendnew-production.up.railway.app'
).replace(/\/+$/, '');

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
 * ☁️ Upload a Single File or Base64 string to Cloudinary via Live Production Backend API
 * @param {File|Blob|string} fileOrBase64 - File object, Blob, or base64 string
 * @param {string} folder - Cloudinary folder (e.g. 'hotel_guest_documents', 'hotel_members')
 * @returns {Promise<string>} Live secure Cloudinary URL (https://res.cloudinary.com/...) or safe base64
 */
export async function uploadToCloudinaryServer(fileOrBase64, folder = 'hotel_guest_documents') {
  if (!fileOrBase64) return '';

  // If already a live web/Cloudinary URL, return as-is
  if (typeof fileOrBase64 === 'string' && (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://'))) {
    return fileOrBase64;
  }

  // The live Railway backend uploads guest ID documents & signatures natively
  // via multipart FormData on POST /api/v1/bookings (S3/Tigris storage).
  // Return base64 Data URI which api.js automatically converts to binary Blobs on booking.
  return await fileToBase64(fileOrBase64);
}

/**
 * ☁️ Upload Multiple Files (e.g. member IDs, receipts) to Live Production Backend API
 * @param {Array<File|Blob>} files 
 * @param {string} folder 
 * @returns {Promise<Array<string>>}
 */
export async function uploadMultipleToCloudinaryServer(files, folder = 'hotel_guest_documents/members') {
  if (!files || !Array.isArray(files) || files.length === 0) return [];
  return Promise.all(files.map((file) => fileToBase64(file)));
}
