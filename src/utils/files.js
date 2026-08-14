// File and attachment helpers

import {
  BACKEND_ORIGIN,
  MAX_ATTACHMENT_SIZE_BYTES,
  MAX_ATTACHMENT_SIZE_MB,
} from './constants';

// Resolve a backend-relative file path (profile picture, attachment) to a full URL
export const fileUrl = (path) => (path ? `${BACKEND_ORIGIN}${path}` : null);

export const formatFileSize = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

// Returns an error message when the file is not an acceptable attachment, null otherwise
export const validateAttachment = (file) =>
  file.size > MAX_ATTACHMENT_SIZE_BYTES
    ? `File size exceeds ${MAX_ATTACHMENT_SIZE_MB}MB limit`
    : null;

export const isImagePath = (path) => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(path);

export const isPdfPath = (path) => /\.pdf$/i.test(path);

// Read a local file as a data URL, for previewing before upload
export const readFileAsDataUrl = (file) =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(file);
  });
