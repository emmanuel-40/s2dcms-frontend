// Reply to Complaint Page with File Upload
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { departmentService } from '../services/departmentService';
import { validateFile } from '../utils/fileValidation';
import { prepareAttachmentFile } from '../utils/imageResize';
import { formatBytes } from '../utils/formatBytes';
import PageSkeleton from '../components/PageSkeleton';
import { Download } from 'lucide-react';
import AttachmentModal from '../components/AttachmentModal';

const ReplyComplaint = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [reply, setReply] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [chosenFile, setChosenFile] = useState(null); // { name, size } of what the user picked
  const [preparing, setPreparing] = useState(false);
  const fileInputRef = useRef(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadComplaint();
  }, [id]);

  const loadComplaint = async () => {
    try {
      setInitialLoading(true);
      const data = await departmentService.getComplaint(id);
      setComplaint(data);
      if (data.reply) {
        setReply(data.reply);
      }
    } catch (err) {
      setError(err.message || 'Failed to load complaint');
    } finally {
      setInitialLoading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      setAttachment(null);
      setChosenFile(null);
      return;
    }

    setError('');

    // Record what the user actually chose BEFORE any optimisation. Images are downscaled before
    // upload, so the transmitted File is smaller than the selection - showing that size would
    // misreport what the user picked. The original name and size drive the display; only the
    // optimised bytes are sent.
    setChosenFile({ name: file.name, size: file.size });
    setPreparing(true);

    try {
      // Documents pass through untouched; images are downscaled.
      const { file: prepared } = await prepareAttachmentFile(file);
      setAttachment(prepared);
    } catch {
      // Optimisation is best-effort: the original is still a valid upload.
      setAttachment(file);
    } finally {
      setPreparing(false);
    }
  };

  const clearAttachment = () => {
    setAttachment(null);
    setChosenFile(null);
    setError('');
    // Clear the native input so picking the same file again fires a change event.
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('messageId', id);
      formDataObj.append('reply', reply);
      if (attachment) {
        formDataObj.append('attachment', attachment);
      }

      await departmentService.replyToComplaint(formDataObj);
      navigate(`/department/complaints/${id}`);
    } catch (err) {
      setError(err.message || 'Failed to submit reply');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return <PageSkeleton cards={0} rows={5} />;
  }

  if (error && !complaint) {
    return <div className="max-w-2xl mx-auto mt-8 text-center">
      <div className="bg-red-50 border border-red-200 text-red-600 p-3 mb-4 rounded">{error}</div>
      <button 
        onClick={() => navigate('/department/complaints')}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Back to List
      </button>
    </div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Reply to Complaint #{id}</h1>
        <button 
          onClick={() => navigate(`/department/complaints/${id}`)}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Cancel
        </button>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 mb-4 rounded">
          {error}
        </div>
      )}

      {complaint && (
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Original Complaint</h3>
          <p className="mb-2"><strong>Title:</strong> {complaint.title}</p>
          <p className="mb-2"><strong>From:</strong> {complaint.studentName} ({complaint.studentRegNumber})</p>
          <p className="mb-2"><strong>Submitted:</strong> {new Date(complaint.sentAt).toLocaleString()}</p>
          <p className="mb-2"><strong>Description:</strong></p>
          <p className="bg-gray-50 p-4 rounded-lg mb-4 leading-relaxed">{complaint.content}</p>
          
          {complaint.attachmentPath && (
            <div className="p-3 bg-gray-50 rounded-lg flex flex-wrap items-center gap-3">
              <strong className="text-gray-700">Attachment:</strong>
              <button
                type="button"
                onClick={() => {
                  setSelectedAttachment(complaint.attachmentPath);
                  setShowAttachmentModal(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                View Attachment
              </button>
            </div>
          )}

          {complaint.reply && (
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600 mt-4">
              <h4 className="font-bold text-gray-800 mb-2">Previous Reply:</h4>
              <p className="leading-relaxed">{complaint.reply}</p>
              {complaint.replyAttachmentPath && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAttachment(complaint.replyAttachmentPath);
                    setShowAttachmentModal(true);
                  }}
                  className="mt-2 inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  View Previous Attachment
                </button>
              )}
            </div>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="reply" className="block text-sm font-medium text-gray-700 mb-2">Your Response *</label>
          <textarea
            id="reply"
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            required
            rows="10"
            placeholder="Type your response to the student's complaint..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none resize-y"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="attachment" className="block text-sm font-medium text-gray-700 mb-2">Attachment (optional)</label>
          <input
            type="file"
            id="attachment"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <small className="text-gray-600">Max file size: 5MB. Accepted formats: PDF, JPG, PNG, DOC, DOCX</small>

          {/* Shows the file the user actually picked - not the optimised copy that will be
              transmitted - and offers a way to drop it again. */}
          {chosenFile && (
            <div className="mt-2 flex items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              <div className="min-w-0">
                <p className="text-sm text-blue-900 font-medium truncate">{chosenFile.name}</p>
                <p className="text-xs text-blue-700">
                  {formatBytes(chosenFile.size)}
                  {preparing ? ' · preparing…' : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={clearAttachment}
                disabled={preparing}
                className="shrink-0 text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-4 mt-6">
          <button 
            type="button" 
            onClick={() => navigate(`/department/complaints/${id}`)}
            className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading || preparing}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Reply'}
          </button>
        </div>
      </form>

      <AttachmentModal
        isOpen={showAttachmentModal}
        onClose={() => {
          setShowAttachmentModal(false);
          setSelectedAttachment(null);
        }}
        attachmentUrl={selectedAttachment}
      />
    </div>
  );
};

export default ReplyComplaint;
