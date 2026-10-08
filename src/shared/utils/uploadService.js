import { API_ENDPOINTS, getApiBaseUrl } from '../../config/api';

/**
 * ☁️ Upload a Single File or Base64 string to Cloudinary via Backend Multer API
 * @param {File|Blob|string} fileOrBase64 - File object, Blob, or base64 string
 * @param {string} folder - Cloudinary folder (e.g. 'hotel_guest_documents', 'hotel_members')
 * @returns {Promise<string>} Live secure Cloudinary URL (https://res.cloudinary.com/...)
 */
export async function uploadToCloudinaryServer(fileOrBase64, folder = 'hotel_guest_documents') {
  if (!fileOrBase64) return '';

  // If already a live web/Cloudinary URL, return as-is
  if (typeof fileOrBase64 === 'string' && (fileOrBase64.startsWith('http://') || fileOrBase64.startsWith('https://'))) {
    return fileOrBase64;
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const uploadUrl = `${baseUrl}/api/v1/upload`;

  try {
    let response;

    if (fileOrBase64 instanceof File || fileOrBase64 instanceof Blob) {
      // Multipart FormData Upload with Multer
      const formData = new FormData();
      formData.append('file', fileOrBase64);
      formData.append('folder', folder);

      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: formData,
      });
    } else if (typeof fileOrBase64 === 'string' && fileOrBase64.startsWith('data:')) {
      // Base64 Data URI Upload
      const headers = {
        'Content-Type': 'application/json',
      };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      response = await fetch(uploadUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base64: fileOrBase64,
          folder,
        }),
      });
    } else {
      return fileOrBase64;
    }

    const data = await response.json();
    if (response.ok && data?.url) {
      return data.url;
    } else {
      console.warn('⚠️ Cloudinary upload response warning:', data);
      return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
    }
  } catch (error) {
    console.error('❌ Upload to Cloudinary failed:', error);
    return typeof fileOrBase64 === 'string' ? fileOrBase64 : '';
  }
}

/**
 * ☁️ Upload Multiple Files (e.g. member IDs, receipts)
 * @param {Array<File|Blob>} files 
 * @param {string} folder 
 * @returns {Promise<Array<string>>}
 */
export async function uploadMultipleToCloudinaryServer(files, folder = 'hotel_guest_documents/members') {
  if (!files || files.length === 0) return [];

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const baseUrl = getApiBaseUrl().replace(/\/+$/, '');
  const uploadUrl = `${baseUrl}/api/v1/upload/multiple`;

  try {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('folder', folder);

    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();
    if (response.ok && Array.isArray(data?.urls)) {
      return data.urls;
    }
    return [];
  } catch (error) {
    console.error('❌ Multiple upload to Cloudinary failed:', error);
    return [];
  }
}
