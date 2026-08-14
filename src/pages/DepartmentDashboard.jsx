// Department Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { departmentService } from '../services/departmentService';
import Alert from '../components/Alert';
import ComplaintStudentInfo from '../components/ComplaintStudentInfo';
import LoadingState from '../components/LoadingState';
import ProfileModal from '../components/ProfileModal';
import StatusBadge from '../components/StatusBadge';
import { useLogout } from '../hooks/useLogout';
import { useProfileModal } from '../hooks/useProfileModal';
import { fileUrl } from '../utils/files';
import { formatDate } from '../utils/format';

const DepartmentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inProgress: 0,
    replied: 0,
    closed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getUser } = useAuth();
  const handleLogout = useLogout();
  const { openProfile, profileModalProps } = useProfileModal();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [profileData, complaintsData] = await Promise.all([
        departmentService.getProfile(),
        departmentService.getComplaints({ page: 0, size: 10 }),
      ]);
      setProfile(profileData);
      setComplaints(complaintsData.content || []);
      
      // Calculate stats
      const allComplaints = complaintsData.content || [];
      setStats({
        total: allComplaints.length,
        pending: allComplaints.filter(c => c.status === 'PENDING').length,
        inProgress: allComplaints.filter(c => c.status === 'IN_PROGRESS').length,
        replied: allComplaints.filter(c => c.status === 'REPLIED').length,
        closed: allComplaints.filter(c => c.status === 'CLOSED').length,
      });
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-4">
          {profile?.departmentProfile && (
            <img
              src={fileUrl(profile.departmentProfile)}
              alt="Department Profile"
              className="w-12 h-12 rounded-full object-cover border-2 border-gray-300 shadow-sm"
            />
          )}
          <h1 className="text-2xl font-bold text-gray-800">Department Dashboard</h1>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-gray-600">{profile?.departmentName || getUser()?.email}</span>
          <button 
            onClick={() => navigate('/department/profile')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Profile
          </button>
          <button 
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {error && <Alert className="mx-4 mt-4">{error}</Alert>}

      <div className="p-4 max-w-6xl mx-auto">
        <section className="bg-white p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Overview</h2>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4">
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <h3 className="text-sm text-gray-600 mb-2">Total</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-yellow-100 p-6 rounded-lg text-center">
              <h3 className="text-sm text-gray-600 mb-2">Pending</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.pending}</p>
            </div>
            <div className="bg-cyan-100 p-6 rounded-lg text-center">
              <h3 className="text-sm text-gray-600 mb-2">In Progress</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.inProgress}</p>
            </div>
            <div className="bg-green-100 p-6 rounded-lg text-center">
              <h3 className="text-sm text-gray-600 mb-2">Replied</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.replied}</p>
            </div>
            <div className="bg-gray-200 p-6 rounded-lg text-center">
              <h3 className="text-sm text-gray-600 mb-2">Closed</h3>
              <p className="text-3xl font-bold text-gray-800">{stats.closed}</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">Recent Complaints</h2>
            <button 
              onClick={() => navigate('/department/complaints')}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              View All
            </button>
          </div>
          
          {complaints.length === 0 ? (
            <p className="text-gray-600">No complaints received yet.</p>
          ) : (
            <div className="grid gap-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="bg-gray-50 p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-2">
                    <ComplaintStudentInfo complaint={complaint} onOpenProfile={openProfile} />
                    <div className="flex-1">
                      <div className="flex justify-end items-center mb-2">
                        <StatusBadge status={complaint.status} />
                      </div>
                      <p className="text-gray-600 mb-2">{complaint.snippet}</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-500 text-sm">
                      {formatDate(complaint.sentAt)}
                    </span>
                    {!complaint.seenByDepartment && (
                      <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">New</span>
                    )}
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
          )}
        </section>

        <ProfileModal {...profileModalProps} />
      </div>
    </div>
  );
};

export default DepartmentDashboard;
