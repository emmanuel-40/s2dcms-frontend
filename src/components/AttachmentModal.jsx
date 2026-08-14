import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { ApiError, logError, parseErrorBody } from '../utils/errors';

const AttachmentModal = ({ isOpen, onClose, attachmentUrl, fileName }) => {
  const [downloadError, setDownloadError] = useState('');

  if (!isOpen || !attachmentUrl) return null;

  const fullUrl = `http://localhost:8080${attachmentUrl}`;

  const handleDownload = async () => {
    setDownloadError('');
    try {
      const response = await fetch(fullUrl);

      // A failed request still resolves, so without this check the browser
      // would happily download the error page as the attachment
      if (!response.ok) {
        const { message } = await parseErrorBody(response);
        throw new ApiError(message || `Download failed (${response.status})`, {
          status: response.status,
        });
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName || 'attachment';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      logError('Attachment download failed', error);
      // Fallback to opening in a new tab; tell the user if that is blocked too
      const opened = window.open(fullUrl, '_blank');
      if (!opened) {
        setDownloadError('The attachment could not be downloaded. Please try again.');
      }
    }
  };

  const isImage = attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  const isPdf = attachmentUrl.match(/\.pdf$/i);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] mx-4 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-4 flex justify-between items-center">
          <h2 className="text-lg font-bold text-white">Attachment Preview</h2>
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

        {downloadError && (
          <div className="bg-red-50 border-b border-red-200 text-red-600 px-4 py-3 text-sm">
            {downloadError}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
          {isImage ? (
            <img
              src={fullUrl}
              alt="Attachment"
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          ) : isPdf ? (
            <iframe
              src={fullUrl}
              className="w-full h-full min-h-[500px] rounded-lg"
              title="PDF Preview"
            />
          ) : (
            <div className="text-center">
              <p className="text-gray-600 mb-4">Preview not available for this file type.</p>
              <button
                onClick={handleDownload}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
              >
                <Download className="w-4 h-4" />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttachmentModal;
