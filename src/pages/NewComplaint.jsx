// New Complaint Page with File Upload
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/studentService';

const NewComplaint = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [attachment, setAttachment] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 20MB as per backend config)
      if (file.size > 20 * 1024 * 1024) {
        setError('File size exceeds 20MB limit');
        return;
      }
      setAttachment(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const formDataObj = new FormData();
      formDataObj.append('title', formData.title);
      formDataObj.append('content', formData.content);
      if (attachment) {
        formDataObj.append('attachment', attachment);
      }

      await studentService.sendComplaint(formDataObj);
      navigate('/student/complaints');
    } catch (err) {
      setError(err.message || 'Failed to submit complaint');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Submit New Complaint</h1>
        <button 
          onClick={() => navigate('/student/complaints')}
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

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md">
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            placeholder="Brief title of your complaint"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        <div className="mb-4">
          <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            required
            rows="10"
            placeholder="Detailed description of your complaint"
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
            onClick={() => navigate('/student/complaints')}
            className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading}
            className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Submitting...' : 'Submit Complaint'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NewComplaint;
