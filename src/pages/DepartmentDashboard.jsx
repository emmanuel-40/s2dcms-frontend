// Department Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { departmentService } from '../services/departmentService';
import ProfileModal from '../components/ProfileModal';
import LoadingSpinner from '../components/LoadingSpinner';
import { API_BASE_URL, assetUrl } from '../config';

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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);
  const { logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [profileResult, complaintsResult] = await Promise.allSettled([
        departmentService.getProfile(),
        departmentService.getComplaints({ page: 0, size: 10 }),
      ]);

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value);
      } else {
        setError(profileResult.reason?.message || 'Failed to load profile');
      }

      if (complaintsResult.status === 'fulfilled') {
        const allComplaints = complaintsResult.value?.content || [];
        setComplaints(allComplaints);
        setStats({
          total: allComplaints.length,
          pending: allComplaints.filter(c => c.status === 'PENDING').length,
          inProgress: allComplaints.filter(c => c.status === 'IN_PROGRESS').length,
          replied: allComplaints.filter(c => c.status === 'REPLIED').length,
          closed: allComplaints.filter(c => c.status === 'CLOSED').length,
        });
      } else if (profileResult.status === 'fulfilled') {
        setError(complaintsResult.reason?.message || 'Failed to load complaints');
      }
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
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
    return <LoadingSpinner text="Loading dashboard..." size="lg" />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white p-4 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-4 w-full md:w-auto">
          {profile?.departmentProfile && (
            <img
              src={assetUrl(profile.departmentProfile)}
              alt="Department Profile"
              className="w-10 h-10 md:w-12 md:h-12 rounded-full object-cover border-2 border-gray-300 shadow-sm"
            />
          )}
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Department Dashboard</h1>
        </div>
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto">
          <span className="text-gray-600 text-sm md:text-base">{profile?.departmentName || user?.email}</span>
          <div className="flex gap-2 w-full md:w-auto">
            <button 
              onClick={() => navigate('/department/profile')}
              className="bg-blue-600 text-white px-3 py-2 md:px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base flex-1 md:flex-none"
            >
              Profile
            </button>
            <button 
              onClick={handleLogout}
              className="bg-red-600 text-white px-3 py-2 md:px-4 rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base flex-1 md:flex-none"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 mx-4 mt-4 rounded">
          {error}
        </div>
      )}

      <div className="p-4 max-w-6xl mx-auto">
        <section className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Overview</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mt-4">
            <div className="bg-gray-50 p-4 md:p-6 rounded-lg text-center">
              <h3 className="text-xs md:text-sm text-gray-600 mb-2">Total</h3>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.total}</p>
            </div>
            <div className="bg-yellow-100 p-4 md:p-6 rounded-lg text-center">
              <h3 className="text-xs md:text-sm text-gray-600 mb-2">Pending</h3>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.pending}</p>
            </div>
            <div className="bg-cyan-100 p-4 md:p-6 rounded-lg text-center">
              <h3 className="text-xs md:text-sm text-gray-600 mb-2">In Progress</h3>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.inProgress}</p>
            </div>
            <div className="bg-green-100 p-4 md:p-6 rounded-lg text-center">
              <h3 className="text-xs md:text-sm text-gray-600 mb-2">Replied</h3>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.replied}</p>
            </div>
            <div className="bg-gray-200 p-4 md:p-6 rounded-lg text-center">
              <h3 className="text-xs md:text-sm text-gray-600 mb-2">Closed</h3>
              <p className="text-2xl md:text-3xl font-bold text-gray-800">{stats.closed}</p>
            </div>
          </div>
        </section>

        <section className="bg-white p-4 md:p-6 rounded-lg shadow-md">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Recent Complaints</h2>
            <button 
              onClick={() => navigate('/department/complaints')}
              className="bg-blue-600 text-white px-3 py-2 md:px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base"
            >
              View All
            </button>
          </div>
          
          {complaints.length === 0 ? (
            <p className="text-gray-600">No complaints received yet.</p>
          ) : (
            <div className="grid gap-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="bg-gray-50 p-3 md:p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                  <div className="flex flex-col sm:flex-row items-start gap-3 mb-2">
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                      {complaint.profilePicturePath && (
                        <img
                          src={assetUrl(complaint.profilePicturePath)}
                          alt="Student Profile"
                          className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover border-2 border-gray-300 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => {
                            setSelectedProfile({ name: complaint.studentName, email: complaint.studentEmail, regNo: complaint.studentRegNumber, departmentName: complaint.departmentName, profilePicturePath: complaint.profilePicturePath });
                            setProfileType('student');
                            setShowProfileModal(true);
                          }}
                        />
                      )}
                      <div className="flex flex-col">
                        <span className="font-medium text-gray-800 text-xs md:text-sm">{complaint.studentName}</span>
                        <span className="text-gray-500 text-xs">{complaint.studentRegNumber}</span>
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="flex justify-between items-start sm:items-center mb-2">
                        <span className={`${getStatusColor(complaint.status)} text-white px-2 py-1 md:px-3 rounded-full text-xs md:text-sm`}>
                          {complaint.status}
                        </span>
                        {!complaint.seenByDepartment && (
                          <span className="bg-red-600 text-white px-2 py-1 rounded text-xs">New</span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2 text-sm">{complaint.snippet}</p>
                      <span className="text-gray-500 text-xs">
                        {new Date(complaint.sentAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate(`/department/complaints/${complaint.id}`)}
                    className="bg-blue-600 text-white px-3 py-2 md:px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base w-full sm:w-auto"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>

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
    </div>
  );
};

export default DepartmentDashboard;
