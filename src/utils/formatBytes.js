/**
 * Human-readable file size.
 *
 * Used to show the size of the file the user actually picked. Images are downscaled before upload,
 * so the File being sent is smaller than what the user chose - reporting the transmitted size
 * instead would misstate what they selected.
 */
export const formatBytes = (bytes) => {
  if (!bytes && bytes !== 0) return '';

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;

  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};