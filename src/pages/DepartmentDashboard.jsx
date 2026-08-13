// Department Dashboard
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { departmentService } from '../services/departmentService';
import ProfileModal from '../components/ProfileModal';

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
  const { logout, getUser } = useAuth();
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
    return <div className="flex justify-center items-center min-h-[200px] text-xl text-gray-600">Loading dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-4">
          {profile?.departmentProfile && (
            <img
              src={`http://localhost:8080${profile.departmentProfile}`}
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

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 mx-4 mt-4 rounded">
          {error}
        </div>
      )}

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
                    <span className="text-gray-500 text-sm">
                      {new Date(complaint.sentAt).toLocaleDateString()}
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
