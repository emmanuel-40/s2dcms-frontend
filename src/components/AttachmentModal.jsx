import React, { useEffect, useState } from 'react';
import { X, Download, FileText, ExternalLink, ImageOff } from 'lucide-react';
import { assetUrl } from '../config';

// Uploaded files are served by the backend at /uploads/** (see WebConfig.java),
// NOT under /api - so they must be resolved with assetUrl(), never API_BASE_URL.
const UUID_PREFIX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}_/i;

// FileStorageService stores files as "<uuid>_<originalName>" - strip the uuid for display.
const displayNameFromPath = (path) => {
  const raw = String(path || '').split(/[?#]/)[0];
  let name = raw.substring(raw.lastIndexOf('/') + 1);
  try {
    name = decodeURIComponent(name);
  } catch {
    // keep the raw segment if it is not valid percent-encoding
  }
  if (!name) return 'attachment';
  return name.replace(UUID_PREFIX, '') || name;
};

// `visible` / `file` are the prop names older call sites used. They are still accepted so a
// renamed prop can never silently swallow a "View Attachment" click again.
const AttachmentModal = ({
  isOpen: isOpenProp,
  visible,
  attachmentUrl: attachmentUrlProp,
  file,
  fileName,
  onClose,
}) => {
  const isOpen = isOpenProp ?? visible;
  const rawAttachment = attachmentUrlProp ?? file;
  // Only a string path ("/uploads/attachments/<uuid>_name.pdf") can be rendered.
  const attachmentUrl = typeof rawAttachment === 'string' ? rawAttachment : null;
  const fullUrl = assetUrl(attachmentUrl);
  const downloadName = fileName || displayNameFromPath(attachmentUrl);
  const [previewFailed, setPreviewFailed] = useState(false);

  // Reset the error state whenever a new attachment is opened (the component stays mounted).
  useEffect(() => {
    setPreviewFailed(false);
  }, [attachmentUrl, isOpen]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Opened, but the stored path cannot be turned into a file URL. Show why instead of
  // rendering nothing - an invisible modal is indistinguishable from a dead button.
  if (!fullUrl) {
    return (
      <div
        className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onClose?.();
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Attachment unavailable"
          className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
        >
          <div className="bg-gradient-to-r from-red-600 to-rose-600 p-4 flex justify-between items-center gap-2">
            <h2 className="text-lg font-bold text-white">Attachment unavailable</h2>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="p-6 text-center">
            <ImageOff className="w-16 h-16 text-gray-400 mx-auto" />
            <p className="text-gray-600 mt-4">
              This attachment has no usable file path
              {attachmentUrl ? `: ${attachmentUrl}` : ' and cannot be opened.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const cleanPath = attachmentUrl.split(/[?#]/)[0];

  const handleDownload = async () => {
    try {
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error(`Unable to fetch file (${response.status})`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = downloadName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch {
      // Fallback to opening in new tab if fetch fails
      window.open(fullUrl, '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(fullUrl, '_blank');
  };

  const isImage = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(cleanPath);
  const isPdf = /\.pdf$/i.test(cleanPath);
  const isWordDoc = /\.(doc|docx)$/i.test(cleanPath);
  const getFileIcon = () => {
    if (isPdf) return <FileText className="w-16 h-16 text-red-500" />;
    if (isWordDoc) return <FileText className="w-16 h-16 text-blue-500" />;
    return <FileText className="w-16 h-16 text-gray-500" />;
  };
  const getFileType = () => {
    if (isPdf) return 'PDF Document';
    if (isWordDoc) return 'Word Document';
    return 'Document file';
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => {
        // Close when the backdrop itself (not the dialog) is clicked
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Attachment preview"
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center gap-2">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-white">
              {isImage ? 'Image Preview' : 'Attachment Preview'}
            </h2>
            <p className="text-sm text-blue-100 truncate" title={downloadName}>
              {downloadName}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
          {isImage && !previewFailed ? (
            <img
              src={fullUrl}
              alt={downloadName}
              onError={() => setPreviewFailed(true)}
              className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-lg bg-white"
            />
          ) : (
            <div className="text-center p-8">
              {isImage && previewFailed ? (
                <ImageOff className="w-16 h-16 text-gray-400 mx-auto" />
              ) : (
                getFileIcon()
              )}
              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2 break-all">
                {downloadName}
              </h3>
              <p className="text-gray-600 mb-6">
                {isImage && previewFailed
                  ? 'Preview unavailable - the file could not be loaded.'
                  : getFileType()}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
                {(isPdf || (isImage && previewFailed)) && (
                  <button
                    onClick={handleOpenInNewTab}
                    className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 justify-center"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open in New Tab
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentModal;
