// File upload validation utilities

const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.doc', '.docx'];

/**
 * Must stay in step with the server: FileStorageService validates against `file.max-size` (5MB)
 * and both controllers reject anything larger.
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Derived from MAX_FILE_SIZE .
 */
const MAX_FILE_SIZE_MB = Math.round(MAX_FILE_SIZE / (1024 * 1024));

export const validateFile = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: `File size exceeds ${MAX_FILE_SIZE_MB}MB limit` };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return { valid: false, error: 'Invalid file type. Allowed: PDF, JPG, PNG, DOC, DOCX' };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return { valid: false, error: 'Invalid file extension. Allowed: .pdf, .jpg, .jpeg, .png, .doc, .docx' };
  }

  return { valid: true };
};

export const validateImage = (file) => {
  if (!file) {
    return { valid: false, error: 'No file provided' };
  }

  // Check file size (smaller limit for profile pictures - 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'Image size exceeds 5MB limit' };
  }

  // Check MIME type (images only)
  const imageMimeTypes = ['image/jpeg', 'image/jpg', 'image/png'];
  if (!imageMimeTypes.includes(file.type)) {
    return { valid: false, error: 'Invalid image type. Allowed: JPG, PNG' };
  }

  // Check file extension
  const fileName = file.name.toLowerCase();
  const imageExtensions = ['.jpg', '.jpeg', '.png'];
  const hasValidExtension = imageExtensions.some(ext => fileName.endsWith(ext));
  if (!hasValidExtension) {
    return { valid: false, error: 'Invalid image extension. Allowed: .jpg, .jpeg, .png' };
  }

  return { valid: true };
};
