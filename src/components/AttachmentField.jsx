import React from 'react';
import {
  ACCEPTED_ATTACHMENT_EXTENSIONS,
  MAX_ATTACHMENT_SIZE_MB,
} from '../utils/constants';
import { formatFileSize } from '../utils/files';

const AttachmentField = ({ file, onChange, id = 'attachment' }) => (
  <div className="mb-4">
    <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-2">
      Attachment (optional)
    </label>
    <input
      type="file"
      id={id}
      onChange={onChange}
      accept={ACCEPTED_ATTACHMENT_EXTENSIONS}
      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
    />
    <small className="text-gray-600">
      Max file size: {MAX_ATTACHMENT_SIZE_MB}MB. Accepted formats: PDF, JPG, PNG, DOC, DOCX
    </small>
    {file && (
      <div className="mt-2 text-blue-600 text-sm">
        Selected: {file.name} ({formatFileSize(file.size)})
      </div>
    )}
  </div>
);

export default AttachmentField;
