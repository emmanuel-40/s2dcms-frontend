// Department Complaints List Page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { departmentService } from '../services/departmentService';
import { getErrorMessage, logError } from '../utils/errors';
import { Eye, EyeOff, Clock } from 'lucide-react';
import ProfileModal from '../components/ProfileModal';

const DepartmentComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('NEWEST');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, sortOrder, page]);

  const loadComplaints = async () => {
    try {
      setLoading(true);
      const data = await departmentService.getComplaints({
        status: statusFilter,
        sort: sortOrder,
        page,
        size: 10,
      });
      setComplaints(data.content || []);
      setTotalPages(data.pageable?.totalPages || 0);
    } catch (err) {
      logError('Loading department complaints failed', err);
      setError(getErrorMessage(err, 'Failed to load complaints'));
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

  if (loading) {
    return <div className="flex justify-center items-center min-h-[200px] text-xl text-gray-600">Loading complaints...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">Department Complaints</h1>
        <button 
          onClick={() => navigate('/department/dashboard')}
          className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          Back to Dashboard
        </button>
      </header>

      <div className="flex gap-4 mb-6 flex-wrap">
        <div className="flex items-center gap-2">
          <label className="font-medium text-gray-700">Status:</label>
          <select 
            value={statusFilter} 
            onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="ALL">All</option>
            <option value="PENDING">Pending</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="REPLIED">Replied</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
        
        <div className="flex items-center gap-2">
          <label className="font-medium text-gray-700">Sort:</label>
          <select 
            value={sortOrder} 
            onChange={(e) => { setSortOrder(e.target.value); setPage(0); }}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 mb-4 rounded">
          {error}
        </div>
      )}

      {complaints.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p>No complaints found.</p>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {complaint.profilePicturePath && (
                      <img
                        src={`http://localhost:8080${complaint.profilePicturePath}`}
                        alt="Student Profile"
                        className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                        onClick={() => {
                          setSelectedProfile({ name: complaint.studentName, email: complaint.studentEmail, regNo: complaint.studentRegNumber, departmentName: complaint.departmentName, profilePicturePath: complaint.profilePicturePath });
                          setProfileType('student');
                          setShowProfileModal(true);
                        }}
                      />
                    )}
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-800 text-sm">{complaint.studentName}</span>
                      <span className="text-gray-500 text-xs">{complaint.studentRegNumber}</span>
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-end items-center mb-2">
                      <span className={`${getStatusColor(complaint.status)} text-white px-3 py-1 rounded-full text-sm`}>
                        {complaint.status}
                      </span>
                    </div>
                    <p className="text-gray-600 mb-2">{complaint.snippet}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(complaint.sentAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    {complaint.seenByDepartment ? (
                      <div className="flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full">
                        <Eye className="w-3 h-3" />
                        <span>Seen</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-red-600 text-xs bg-red-50 px-2 py-1 rounded-full font-medium">
                        <EyeOff className="w-3 h-3" />
                        <span>New</span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/department/complaints/${complaint.id}`)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-4 mt-8">
              <button 
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span className="text-gray-600">Page {page + 1} of {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
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
    </div>
  );
};

export default DepartmentComplaints;
