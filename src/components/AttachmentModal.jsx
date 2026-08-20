import React from 'react';
import { X, Download, FileText, ExternalLink } from 'lucide-react';

const AttachmentModal = ({ isOpen, onClose, attachmentUrl, fileName }) => {
  if (!isOpen || !attachmentUrl) return null;

  const fullUrl = `http://localhost:8080${attachmentUrl}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(fullUrl);
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
      console.error('Download failed:', error);
      // Fallback to opening in new tab if fetch fails
      window.open(fullUrl, '_blank');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(fullUrl, '_blank');
  };

  const isImage = attachmentUrl.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i);
  const isPdf = attachmentUrl.match(/\.pdf$/i);
  const isWordDoc = attachmentUrl.match(/\.(doc|docx)$/i);
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

        {/* Content */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4 flex items-center justify-center">
          {isImage ? (
            <img
              src={fullUrl}
              alt="Attachment"
              className="max-w-full max-h-full object-contain rounded-lg shadow-lg"
            />
          ) : (
            <div className="text-center p-8">
              {getFileIcon()}
              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">
                {fileName || 'Document'}
              </h3>
              <p className="text-gray-600 mb-6">
                {getFileType()}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 justify-center"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
                {isPdf && (
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
