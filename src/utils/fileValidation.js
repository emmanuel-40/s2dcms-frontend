// Client-side upload validation (the backend remains the authoritative check)

export const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;

const ATTACHMENT_TYPES = {
  'application/pdf': ['pdf'],
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
};

const IMAGE_TYPES = {
  'image/jpeg': ['jpg', 'jpeg'],
  'image/png': ['png'],
  'image/webp': ['webp'],
};

const extensionOf = (name) => (name.includes('.') ? name.split('.').pop().toLowerCase() : '');

const validate = (file, allowed, label) => {
  if (!file) return 'No file selected';

  if (file.size > MAX_UPLOAD_BYTES) {
    return `File size exceeds ${MAX_UPLOAD_BYTES / 1024 / 1024}MB limit`;
  }

  const extensions = allowed[file.type];
  if (!extensions || !extensions.includes(extensionOf(file.name))) {
    return `Unsupported file type. Allowed formats: ${label}`;
  }

  return null;
};

// Returns an error message, or null when the file is acceptable.
export const validateAttachment = (file) => validate(file, ATTACHMENT_TYPES, 'PDF, JPG, PNG, DOC, DOCX');

export const validateProfileImage = (file) => validate(file, IMAGE_TYPES, 'JPG, PNG, WEBP');
