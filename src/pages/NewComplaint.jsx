// New Complaint Page with File Upload
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { authService } from '../services/authService';
import { validateAttachment } from '../utils/fileValidation';

const NewComplaint = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [attachment, setAttachment] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiSituation, setAiSituation] = useState('');
  const [aiGeneratedComplaint, setAiGeneratedComplaint] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleGenerateComplaint = async () => {
    setAiLoading(true);
    try {
      const token = authService.getAccessToken();
      const response = await fetch('/api/ai/write-complaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ situation: aiSituation })
      });

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 503) {
          setError('AI service is currently unavailable. Please try again later or contact the administrator.');
        } else {
          setError('Failed to generate complaint: ' + errorText);
        }
        return;
      }

      const data = await response.text();
      setAiGeneratedComplaint(data);
    } catch (err) {
      setError('Failed to generate complaint. Please check your connection and try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUseGeneratedComplaint = () => {
    setFormData({
      ...formData,
      content: aiGeneratedComplaint,
      title: aiGeneratedComplaint.split('\n')[0].substring(0, 50) + '...'
    });
    setShowAiModal(false);
    setAiSituation('');
    setAiGeneratedComplaint('');
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

      {/* Floating AI Button */}
      <button
        onClick={() => setShowAiModal(true)}
        className="fixed bottom-8 right-8 bg-purple-600 text-white p-4 rounded-full shadow-lg hover:bg-purple-700 transition-colors z-40"
        title="AI Writing Assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      </button>

      {/* AI Writing Assistant Modal */}
      {showAiModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">AI Writing Assistant</h2>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <label htmlFor="aiSituation" className="block text-sm font-medium text-gray-700 mb-2">
                Describe your situation
              </label>
              <textarea
                id="aiSituation"
                value={aiSituation}
                onChange={(e) => setAiSituation(e.target.value)}
                rows="4"
                placeholder="E.g., My professor didn't show up for class for 3 consecutive weeks and hasn't responded to emails..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-y"
              />
            </div>

            <button
              onClick={handleGenerateComplaint}
              disabled={aiLoading || !aiSituation.trim()}
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed mb-4"
            >
              {aiLoading ? 'Generating...' : 'Generate Complaint'}
            </button>

            {aiGeneratedComplaint && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generated Complaint
                </label>
                <textarea
                  value={aiGeneratedComplaint}
                  readOnly
                  rows="8"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 outline-none resize-y"
                />
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={handleUseGeneratedComplaint}
                    className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    Use This Complaint
                  </button>
                  <button
                    onClick={() => {
                      setAiGeneratedComplaint('');
                      setAiSituation('');
                    }}
                    className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    Clear
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NewComplaint;
