// Reply to Complaint Page with File Upload
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { departmentService } from '../services/departmentService';
import { assetUrl } from '../config';
import { validateAttachment } from '../utils/fileValidation';

const ReplyComplaint = () => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [reply, setReply] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validationError = validateAttachment(file);
    if (validationError) {
      setError(validationError);
      e.target.value = '';
      setAttachment(null);
      return;
    }

    setError('');
    setAttachment(file);
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
    return <div className="flex justify-center items-center min-h-[200px] text-xl text-gray-600">Loading complaint...</div>;
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
            <div className="p-3 bg-gray-50 rounded-lg">
              <strong className="text-gray-700">Attachment:</strong>
              <a 
                href={assetUrl(complaint.attachmentPath)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 ml-2"
              >
                View Attachment
              </a>
            </div>
          )}

          {complaint.reply && (
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600 mt-4">
              <h4 className="font-bold text-gray-800 mb-2">Previous Reply:</h4>
              <p className="leading-relaxed">{complaint.reply}</p>
              {complaint.replyAttachmentPath && (
                <a 
                  href={assetUrl(complaint.replyAttachmentPath)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Previous Attachment
                </a>
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
            onChange={handleFileChange}
            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
          <small className="text-gray-600">Max file size: 20MB. Accepted formats: PDF, JPG, PNG, DOC, DOCX</small>
          {attachment && (
            <div className="mt-2 text-blue-600 text-sm">
              Selected: {attachment.name} ({(attachment.size / 1024 / 1024).toFixed(2)} MB)
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
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Reply'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReplyComplaint;
