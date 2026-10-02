// Student Complaints List Page
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { Eye, EyeOff, Clock } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import { RefreshBar } from '../hooks/useBackgroundLoad';

const StudentComplaints = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('NEWEST');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    loadComplaints();
  }, [statusFilter, sortOrder, page]);

  const isFirstLoad = useRef(true);

  const loadComplaints = async () => {
    // Only the very first fetch blanks the page. Changing a filter, sort or page keeps the rows
    // already on screen and shows a thin progress bar instead, so the list never flashes empty.
    if (isFirstLoad.current) {
      setLoading(true);
    } else {
      setRefreshing(true);
    }

    try {
      const data = await studentService.getComplaints({
        status: statusFilter,
        sort: sortOrder,
        page,
        size: 10,
      });
      setComplaints(data.content || []);
      setTotalPages(data.pageable?.totalPages || 0);
      setError('');
    } catch (err) {
      setError(err.message || 'Failed to load complaints');
    } finally {
      setLoading(false);
      setRefreshing(false);
      isFirstLoad.current = false;
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
    return <LoadingSpinner text="Loading complaints..." size="lg" />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
      <RefreshBar active={refreshing} />
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-800">My Complaints</h1>
        <button 
          onClick={() => navigate('/student/dashboard')}
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
        
        <button 
          onClick={() => navigate('/student/complaints/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Complaint
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 mb-4 rounded">
          {error}
        </div>
      )}

      {complaints.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p>No complaints found.</p>
          <button 
            onClick={() => navigate('/student/complaints/new')}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Submit Your First Complaint
          </button>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex justify-between items-center mb-2">
                  <span className={`${getStatusColor(complaint.status)} text-white px-3 py-1 rounded-full text-sm`}>
                    {complaint.status}
                  </span>
                </div>
                <p className="text-gray-600 mb-2">{complaint.snippet}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {new Date(complaint.sentAt).toLocaleDateString()}
                  </span>
                  <div className="flex items-center gap-2">
                    {complaint.seenByDepartment ? (
                      <div className="flex items-center gap-1 text-green-600 text-xs bg-green-50 px-2 py-1 rounded-full">
                        <Eye className="w-3 h-3" />
                        <span>Seen by Dept</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-yellow-600 text-xs bg-yellow-50 px-2 py-1 rounded-full">
                        <EyeOff className="w-3 h-3" />
                        <span>Unseen by Dept</span>
                      </div>
                    )}
                    {!complaint.seenByStudent && complaint.status === 'REPLIED' && (
                      <span className="bg-red-600 text-white px-2 py-1 rounded text-xs font-medium">New Reply</span>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => navigate(`/student/complaints/${complaint.id}`)}
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
    </div>
  );
};

export default StudentComplaints;
