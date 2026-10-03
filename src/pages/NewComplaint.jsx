// New Complaint Page with File Upload
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { authService } from '../services/authService';
import { apiClient } from '../services/apiClient';
import { validateFile } from '../utils/fileValidation';
import { prepareAttachmentFile } from '../utils/imageResize';
import { formatBytes } from '../utils/formatBytes';

const NewComplaint = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [attachment, setAttachment] = useState(null);
  const [chosenFile, setChosenFile] = useState(null); // { name, size } of what the user picked
  const [preparing, setPreparing] = useState(false);
  const fileInputRef = useRef(null);
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
      const data = await studentService.writeComplaint(aiSituation);
      setAiGeneratedComplaint(data);
    } catch (err) {
      // The backend already words AI failures for end users (rate limit, outage, rejected
      // text) and never leaks provider detail, so show it as-is and only fall back locally.
      setError(err.message || 'Failed to generate complaint. Please try again.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleUseGeneratedComplaint = () => {
    // Parse the AI response to extract title and content
    const lines = aiGeneratedComplaint.split('\n');
    let title = '';
    let content = '';

    // Find TITLE line and extract title
    const titleLineIndex = lines.findIndex(line => line.trim().startsWith('TITLE:'));
    if (titleLineIndex !== -1) {
      title = lines[titleLineIndex].replace('TITLE:', '').trim();
    }

    // Find CONTENT line and extract content (everything after CONTENT:)
    const contentLineIndex = lines.findIndex(line => line.trim().startsWith('CONTENT:'));
    if (contentLineIndex !== -1) {
      // Get everything after "CONTENT:" on the same line
      const contentLine = lines[contentLineIndex].split('CONTENT:')[1]?.trim() || '';
      // Add all lines after the CONTENT line
      const remainingLines = lines.slice(contentLineIndex + 1).join('\n').trim();
      content = contentLine + (remainingLines ? '\n' + remainingLines : '');
    }

    setFormData({
      ...formData,
      title: title || 'Complaint',
      content: content || aiGeneratedComplaint
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
            onClick={() => navigate('/student/complaints')}
            className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || preparing}
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
