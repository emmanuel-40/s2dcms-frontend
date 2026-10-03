// Complaint Detail Page with AI Features
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { departmentService } from '../services/departmentService';
import { studentService } from '../services/studentService';
import { authService } from '../services/authService';
import { Eye, EyeOff, Copy, Check } from 'lucide-react';
import ProfileModal from '../components/ProfileModal';
import AttachmentModal from '../components/AttachmentModal';
import PageSkeleton from '../components/PageSkeleton';
import { useBackgroundLoad } from '../hooks/useBackgroundLoad';
import { useToast } from '../context/ToastContext';
import { prefetchCache, cacheKeys } from '../utils/prefetchCache';
import { assetUrl } from '../config';

const ComplaintDetail = ({ userType }) => {
  const { id } = useParams();

  /*
   * Seed from the prefetch cache on the FIRST render.
   */
  const seededComplaint = prefetchCache.get(cacheKeys.complaint(id));

  const [complaint, setComplaint] = useState(seededComplaint ?? null);
  const [error, setError] = useState('');
  const { loading, run } = useBackgroundLoad();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState(null);
  const [aiSummary, setAiSummary] = useState('');
  const [aiSuggestedReply, setAiSuggestedReply] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showSuggestedReply, setShowSuggestedReply] = useState(false);
  const [copied, setCopied] = useState(false);
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Re-seed on id change. useState applies its initialiser only on mount, so without this a
    // direct complaint -> complaint navigation would keep painting the previous complaint's
    // content while the new one was still loading - stale rows for the wrong record.
    setComplaint(prefetchCache.get(cacheKeys.complaint(id)) ?? null);

    loadComplaint();
  }, [id, userType]);

  const loadComplaint = async () => {
    await run(async () => {
      try {
        const service = userType === 'student' ? studentService : departmentService;
        const data = await service.getComplaint(id);
        setComplaint(data);
        setError('');
      } catch (err) {
        setError(err.message || 'Failed to load complaint');
      }
    });
  };
  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'IN_PROGRESS': return 'bg-cyan-500';
      case 'REPLIED': return 'bg-green-500';
      case 'CLOSED': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  const handleCloseComplaint = async () => {
    setClosing(true);
    try {
      await departmentService.closeComplaint(id);
      setShowCloseModal(false);

      
      toast.success('Complaint closed.');

      loadComplaint(); // Reload to show updated status
    } catch (err) {
      setError(err.message || 'Failed to close complaint');
    } finally {
      setClosing(false);
    }
  };

  const handleSummarize = async () => {
  setAiLoading(true);

  try {
    const data = await departmentService.summarizeComplaint(
      complaint.content
    );

    setAiSummary(data);
    setShowSummary(true);
  } catch (err) {
    setError(
      err.message || 'Failed to summarize complaint. Please try again.'
    );
  } finally {
    setAiLoading(false);
  }
};

  const handleSuggestReply = async () => {
  setAiLoading(true);

  try {
    const data = await departmentService.suggestReply(
      complaint.content
    );

    setAiSuggestedReply(data);
    setShowSuggestedReply(true);
  } catch (err) {
    setError(
      err.message || 'Failed to suggest reply. Please try again.'
    );
  } finally {
    setAiLoading(false);
  }
};

  const handleCopyReply = () => {
    navigator.clipboard.writeText(aiSuggestedReply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // `&& !complaint` is what removes the skeleton from a warmed navigation. `loading` is still true
  // while the background refetch runs, but there is already real content on screen, and replacing
  // it with a placeholder would be the very blink this seeding exists to prevent. With no seed -
  // a cold entry, or someone opening the URL directly - there is genuinely nothing to show and the
  // skeleton stays correct.
  if (loading && !complaint) {
    return <PageSkeleton cards={0} rows={6} />;
  }

  if (error) {
    return <div className="max-w-2xl mx-auto mt-8 text-center">
      <div className="bg-red-50 border border-red-200 text-red-600 p-3 mb-4 rounded">{error}</div>
      <button 
        onClick={() => navigate(userType === 'student' ? '/student/complaints' : '/department/complaints')}
        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Back to List
      </button>
    </div>;
  }

  if (!complaint) {
    return <div className="max-w-2xl mx-auto mt-8 text-center">Complaint not found</div>;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Complaint Details</h1>
        <button 
          onClick={() => navigate(userType === 'student' ? '/student/complaints' : '/department/complaints')}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to List
        </button>
      </header>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-800">{complaint.title}</h2>
          <span className={`${getStatusColor(complaint.status)} text-white px-3 py-1 rounded-full text-sm`}>
            {complaint.status}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div>
            <h3 className="text-sm text-gray-600 mb-1">Submitted</h3>
            <p>{new Date(complaint.sentAt).toLocaleString()}</p>
          </div>

          {userType === 'department' && complaint.studentName && (
            <div>
              <h3 className="text-sm text-gray-600 mb-1">Student</h3>
              <p><strong>Name:</strong> {complaint.studentName}</p>
              <p><strong>Reg No:</strong> {complaint.studentRegNumber}</p>
            </div>
          )}

          {userType === 'student' && complaint.departmentName && (
            <div>
              <h3 className="text-sm text-gray-600 mb-1">Department</h3>
              <p>{complaint.departmentName}</p>
            </div>
          )}

          {complaint.repliedAt && (
            <div>
              <h3 className="text-sm text-gray-600 mb-1">Replied</h3>
              <p>{new Date(complaint.repliedAt).toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-800 mb-2">Complaint Description</h3>
          <p className="text-gray-600 leading-relaxed">{complaint.content}</p>

          {userType === 'department' && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-3">AI Assistant</h4>
              <div className="flex gap-3">
                <button
                  onClick={handleSummarize}
                  disabled={aiLoading}
                  className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors disabled:bg-purple-300 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  {aiLoading ? 'Processing...' : 'Summarize'}
                </button>
                <button
                  onClick={handleSuggestReply}
                  disabled={aiLoading}
                  className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-indigo-300 disabled:cursor-not-allowed"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  {aiLoading ? 'Processing...' : 'Suggest Reply'}
                </button>
              </div>
            </div>
          )}

          {showSummary && aiSummary && (
            <div className="mt-4 p-4 bg-green-50 rounded-lg border-l-4 border-green-600">
              <h4 className="font-medium text-green-800 mb-2">AI Summary</h4>
              <p className="text-gray-700 leading-relaxed">{aiSummary}</p>
              <button
                onClick={() => setShowSummary(false)}
                className="mt-3 text-sm text-green-600 hover:text-green-800 underline"
              >
                Hide Summary
              </button>
            </div>
          )}

          {showSuggestedReply && aiSuggestedReply && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg border-l-4 border-blue-600">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium text-blue-800">Suggested Reply</h4>
                <button
                  onClick={handleCopyReply}
                  className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
                  title="Copy to clipboard"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">{aiSuggestedReply}</p>
              <button
                onClick={() => setShowSuggestedReply(false)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Hide Suggestion
              </button>
            </div>
          )}
          
          {complaint.attachmentPath && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Attachment:</h4>
              <button
                onClick={() => {
                  setSelectedAttachment(complaint.attachmentPath);
                  setShowAttachmentModal(true);
                }}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Attachment
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {complaint.reply && (
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600 mb-6">
            <div className="flex justify-between items-start mb-2">
              <div className="flex items-center gap-3">
                {complaint.departmentProfile && (
                  <img
                    src={assetUrl(complaint.departmentProfile)}
                    alt="Department Profile"
                    className="w-10 h-10 rounded-full object-cover border-2 border-blue-300 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => {
                      setSelectedProfile({ departmentName: complaint.departmentName, email: complaint.departmentEmail, departmentProfile: complaint.departmentProfile });
                      setProfileType('department');
                      setShowProfileModal(true);
                    }}
                  />
                )}
                <h3 className="text-lg font-bold text-gray-800">Department Response</h3>
              </div>
              {userType === 'department' && (
                <div className="flex items-center gap-1 text-xs">
                  {complaint.seenByStudent ? (
                    <div className="flex items-center gap-1 text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      <Eye className="w-3 h-3" />
                      <span>Seen</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">
                      <EyeOff className="w-3 h-3" />
                      <span>Not yet seen</span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <p className="text-gray-600 leading-relaxed">{complaint.reply}</p>
            
            {complaint.replyAttachmentPath && (
              <div className="mt-4 p-3 bg-white rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Reply Attachment:</h4>
                <button
                  onClick={() => {
                    setSelectedAttachment(complaint.replyAttachmentPath);
                    setShowAttachmentModal(true);
                  }}
                  className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Attachment
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        )}

        {userType === 'department' && complaint.status !== 'CLOSED' && (
          <div className="flex gap-4 mt-6">
            <button 
              onClick={() => navigate(`/department/complaints/${id}/reply`)}
              className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              {complaint.reply ? 'Update Reply' : 'Reply to Complaint'}
            </button>
            <button 
              onClick={() => setShowCloseModal(true)}
              className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Close Complaint
            </button>
          </div>
        )}
      </div>

      {/* Close Confirmation Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-gray-800 mb-2">Close Complaint</h2>
            <p className="text-gray-600 mb-6">Are you sure you want to close this complaint? This action cannot be undone.</p>
            
            <div className="flex gap-4">
              <button 
                onClick={() => setShowCloseModal(false)}
                disabled={closing}
                className="flex-1 bg-gray-300 text-gray-800 py-2 rounded-lg hover:bg-gray-400 transition-colors disabled:bg-gray-200 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button 
                onClick={handleCloseComplaint}
                disabled={closing}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg hover:bg-red-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {closing ? 'Closing...' : 'Close Complaint'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Profile Modal */}
      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => {
          setShowProfileModal(false);
          setSelectedProfile(null);
          setProfileType(null);
        }}
        profile={selectedProfile}
        type={profileType}
      />

      {/* Attachment Modal */}
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

export default ComplaintDetail;
