// Shared application constants

export const BACKEND_ORIGIN = 'http://localhost:8080';
export const BACKEND_API_URL = `${BACKEND_ORIGIN}/api`;

export const MAX_ATTACHMENT_SIZE_MB = 20;
export const MAX_ATTACHMENT_SIZE_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;
export const ACCEPTED_ATTACHMENT_EXTENSIONS = '.pdf,.jpg,.jpeg,.png,.doc,.docx';

export const COMPLAINT_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'IN_PROGRESS', label: 'In Progress' },
  { value: 'REPLIED', label: 'Replied' },
  { value: 'CLOSED', label: 'Closed' },
];

export const COMPLAINT_SORT_OPTIONS = [
  { value: 'NEWEST', label: 'Newest First' },
  { value: 'OLDEST', label: 'Oldest First' },
];
