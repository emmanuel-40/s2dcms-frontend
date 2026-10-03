// Student Dashboard Page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { Eye, EyeOff } from 'lucide-react';
import PageSkeleton from '../components/PageSkeleton';
import { assetUrl } from '../config';

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
        studentService.getProfile(),
        studentService.getComplaints({ page: 0, size: 5 }),
      ]);

      if (profileResult.status === 'fulfilled') {
        setProfile(profileResult.value);
      } else {
        setError(profileResult.reason?.message || 'Failed to load profile');
      }

      if (complaintsResult.status === 'fulfilled') {
        setComplaints(complaintsResult.value?.content || []);
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
    return <PageSkeleton />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white p-4 shadow-md flex flex-col md:flex-row justify-between items-center gap-4">
        <h1 className="text-xl md:text-2xl font-bold text-gray-800">Student Dashboard</h1>
        <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 w-full md:w-auto">
          <span className="text-gray-600 text-sm md:text-base">Welcome, {profile?.name || user?.email}</span>
          <button 
            onClick={handleLogout}
            className="bg-red-600 text-white px-3 py-2 md:px-4 rounded-lg hover:bg-red-700 transition-colors text-sm md:text-base w-full md:w-auto"
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
        <section className="bg-white p-4 md:p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">My Profile</h2>
          {profile && (
            <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-center sm:items-start">
              {profile.profilePicturePath && (
                <img
                  src={assetUrl(profile.profilePicturePath)}
                  alt="Profile"
                  className="w-16 h-16 md:w-20 md:h-20 rounded-full object-cover border-2 border-gray-300 shadow-sm"
                />
              )}
              <div className="flex-1 text-center sm:text-left">
                <p className="mb-1 text-sm md:text-base"><strong>Name:</strong> {profile.name}</p>
                <p className="mb-1 text-sm md:text-base"><strong>Registration No:</strong> {profile.regNo}</p>
                <p className="mb-3 text-sm md:text-base"><strong>Department:</strong> {profile.departmentName}</p>
                <button
                  onClick={() => navigate('/student/profile')}
                  className="bg-blue-600 text-white px-3 py-2 md:px-4 rounded-lg hover:bg-blue-700 transition-colors text-sm md:text-base w-full sm:w-auto"
                >
                  View/Edit Profile
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="bg-white p-4 md:p-6 rounded-lg shadow-md border-2 border-blue-100">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Recent Complaints</h2>
            <button
              onClick={() => navigate('/student/complaints/new')}
              className="bg-blue-600 text-white px-3 py-2 md:px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm md:text-base w-full sm:w-auto"
            >
              New Complaint
            </button>
          </div>

          {complaints.length === 0 ? (
            <div className="text-center py-8 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-gray-600 text-sm md:text-base">No complaints yet. Submit your first complaint!</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {complaints.map((complaint) => (
                <div key={complaint.id} className="bg-white p-3 md:p-4 rounded-lg border-2 border-blue-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all">
                  <div className="flex justify-between items-start mb-3">
                    <span className={`${getStatusColor(complaint.status)} text-white px-2 py-1 md:px-3 rounded-full text-xs md:text-sm font-medium shadow-sm`}>
                      {complaint.status}
                    </span>
                    <div className="flex items-center gap-1 md:gap-2">
                      {complaint.seenByDepartment ? (
                        <div className="flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full">
                          <Eye className="w-3 h-3" />
                          <span className="hidden sm:inline">Seen by Dept</span>
                          <span className="sm:hidden">Seen</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-yellow-600 text-xs bg-yellow-50 px-2 py-1 rounded-full">
                          <EyeOff className="w-3 h-3" />
                          <span className="hidden sm:inline">Unseen by Dept</span>
                          <span className="sm:hidden">Unseen</span>
                        </div>
                      )}
                      {!complaint.seenByStudent && complaint.status === 'REPLIED' && (
                        <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">New Reply</span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 mb-2 font-medium text-sm md:text-base">{complaint.snippet}</p>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-gray-500 text-xs md:text-sm">
                      {new Date(complaint.sentAt).toLocaleDateString()}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/student/complaints/${complaint.id}`)}
                    className="bg-blue-600 text-white px-3 py-2 md:px-4 rounded-lg hover:bg-blue-700 transition-colors shadow-sm text-sm md:text-base w-full sm:w-auto"
                  >
                    View Details
                  </button>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => navigate('/student/complaints')}
            className="mt-4 w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            View All Complaints
          </button>
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;
