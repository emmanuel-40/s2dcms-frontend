// Student Complaints List Page
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Clock } from 'lucide-react';
import PageSkeleton from '../components/PageSkeleton';
import { useComplaintsList } from '../hooks/queries';

const StudentComplaints = () => {
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortOrder, setSortOrder] = useState('NEWEST');
  const [page, setPage] = useState(0);

  /*
   * Filter, sort and page all live in the query key, so changing any of them selects a different
   * query. keepPreviousData inside the hook holds the current rows on screen while the new one
   * loads, which is why isPending below stays false during a page change and the list never blinks.
   */
  const { data, isPending, error } = useComplaintsList('student', {
    status: statusFilter,
    sort: sortOrder,
    page,
    size: 10,
  });

  const complaints = data?.content ?? [];
  const totalPages = data?.pageable?.totalPages ?? 0;
  const navigate = useNavigate();

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-500';
      case 'IN_PROGRESS': return 'bg-cyan-500';
      case 'REPLIED': return 'bg-green-500';
      case 'CLOSED': return 'bg-gray-500';
      default: return 'bg-blue-500';
    }
  };

  // True only on a genuine first load with nothing cached. A page or filter change is covered by
  // keepPreviousData, so rows stay visible instead of being swapped for a placeholder.
  if (isPending) {
    return <PageSkeleton />;
  }

  return (
    <div className="max-w-6xl mx-auto p-4">
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
          {error.message || 'Failed to load complaints'}
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

          {/*
            Responsive pagination. The label moves below the buttons on narrow screens
            (order-last + w-full) because "Page 1 of 12" competing for width with two
            buttons mid-phrase is what made this wrap badly on a phone. Buttons keep a
            44px min-height, the accessibility floor for a touch target.
          */}
          {totalPages > 1 && (
            <nav
              aria-label="Complaint list pages"
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8"
            >
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="min-h-[44px] px-5 sm:px-6 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="order-last w-full sm:order-none sm:w-auto text-center text-sm sm:text-base text-gray-600">
                Page {page + 1} of {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page === totalPages - 1}
                className="min-h-[44px] px-5 sm:px-6 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
};

export default StudentComplaints;
