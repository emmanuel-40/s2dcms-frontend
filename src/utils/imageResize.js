// Client-side image downscaling for profile pictures.
// Downscaling first removes ~95% of the upload and makes the save feel instant, at no
// infrastructure cost. A 512px longest side is still ~3.5x the rendered size, so it stays sharp on
// high-DPI screens.

const DEFAULT_MAX_DIMENSION = 512;
const JPEG_QUALITY = 0.85;

/**
 * Files at or below this size are already cheap to upload, so they are returned untouched rather
 * than re-encoded. Re-encoding a small JPEG costs quality for no bandwidth gain.
 */
const SKIP_BELOW_BYTES = 200 * 1024;

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      // Always release the object URL, otherwise a failed decode leaks it for the page's lifetime.
      URL.revokeObjectURL(url);
      reject(new Error('Could not read that image'));
    };
    img.src = url;
  });

/**
 * Scales an image down so its longest edge is at most maxDimension and returns a JPEG Blob.
 *
 * @param {File} file
 * @param {number} maxDimension
 * @returns {Promise<Blob>} the compressed image
 */
export async function compressImage(file, maxDimension = DEFAULT_MAX_DIMENSION) {
  const img = await loadImage(file);

  const longestSide = Math.max(img.naturalWidth, img.naturalHeight);

  // Scale down only - never up, or a small image would be enlarged and re-encoded for nothing.
  const scale = longestSide > maxDimension ? maxDimension / longestSide : 1;

  const width = Math.round(img.naturalWidth * scale);
  const height = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');

  // JPEG has no alpha channel; without this a transparent PNG turns black where it was clear.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // "high" keeps the downscale crisp. A portrait avatar is judged on sharpness, so this matters
  // more than the few KB an exact resample would cost.
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, 0, 0, width, height);

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', JPEG_QUALITY)
  );

  if (!blob) {
    throw new Error('Could not compress that image');
  }

  return blob;
}

/**
 * Runs an image through compressImage and repackages it as a File, returning the original whenever
 * that would not actually help.
 *
 * @param {File} file
 * @param {number} maxDimension
 * @returns {Promise<{file: File, originalBytes: number, bytes: number}>}
 */
async function prepareImage(file, maxDimension) {
  if (file.size <= SKIP_BELOW_BYTES) {
    return { file, originalBytes: file.size, bytes: file.size };
  }

  try {
    const blob = await compressImage(file, maxDimension);

    // If compression somehow produced something larger (already-optimised input), keep the
    // original rather than making the upload worse.
    if (blob.size >= file.size) {
      return { file, originalBytes: file.size, bytes: file.size };
    }

    const name = file.name.replace(/\.[^.]+$/, '') || 'image';

    return {
      file: new File([blob], `${name}.jpg`, { type: 'image/jpeg' }),
      originalBytes: file.size,
      bytes: blob.size,
    };
  } catch {
    // A codec failure must not block the upload - the original is still a valid image.
    return { file, originalBytes: file.size, bytes: file.size };
  }
}

/**
 * Profile picture: rendered inside a 144px circle, so 512px is already ~3.5x the display size.
 */
export async function prepareProfileImage(file) {
  return prepareImage(file, DEFAULT_MAX_DIMENSION);
}

const ATTACHMENT_MAX_DIMENSION = 1600;

/** MIME types that must never be re-encoded: the bytes ARE the document. */
const DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

/**
 * Complaint attachment.
 *
 * Images are downscaled to 1600px on the longest edge - large enough to stay readable as evidence
 * when opened full-screen or zoomed, including on a high-DPI phone.
 *
 * PDFs and Word documents are returned BYTE-FOR-BYTE untouched. Re-encoding a document would
 * corrupt it, and there is no canvas that can legitimately "compress" a PDF's contents. Their
 * upload time is simply the cost of the file.
 */
export async function prepareAttachmentFile(file) {
  if (DOCUMENT_MIME_TYPES.includes(file.type)) {
    return { file, originalBytes: file.size, bytes: file.size };
  }

  return prepareImage(file, ATTACHMENT_MAX_DIMENSION);
}