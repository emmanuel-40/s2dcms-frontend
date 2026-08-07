// Complaint Detail Page (Shared for Student and Department)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { departmentService } from '../services/departmentService';

const ComplaintDetail = ({ userType }) => {
  const { id } = useParams();
  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [closing, setClosing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadComplaint();
  }, [id, userType]);

  const loadComplaint = async () => {
    try {
      setLoading(true);
      const service = userType === 'student' ? studentService : departmentService;
      const data = await service.getComplaint(id);
      setComplaint(data);
    } catch (err) {
      setError(err.message || 'Failed to load complaint');
    } finally {
      setLoading(false);
    }
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
      loadComplaint(); // Reload to show updated status
    } catch (err) {
      setError(err.message || 'Failed to close complaint');
    } finally {
      setClosing(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-[200px] text-xl text-gray-600">Loading complaint details...</div>;
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
        <h1 className="text-2xl font-bold text-gray-800">Complaint #{complaint.id}</h1>
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
          
          {complaint.attachmentPath && (
            <div className="mt-4 p-3 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Attachment:</h4>
              <a 
                href={`http://localhost:8080${complaint.attachmentPath}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800"
              >
                View Attachment
              </a>
            </div>
          )}
        </div>

        {complaint.reply && (
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-600 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-2">Department Response</h3>
            <p className="text-gray-600 leading-relaxed">{complaint.reply}</p>
            
            {complaint.replyAttachmentPath && (
              <div className="mt-4 p-3 bg-white rounded-lg">
                <h4 className="font-medium text-gray-700 mb-2">Reply Attachment:</h4>
                <a 
                  href={`http://localhost:8080${complaint.replyAttachmentPath}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800"
                >
                  View Attachment
                </a>
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
    </div>
  );
};

export default ComplaintDetail;
