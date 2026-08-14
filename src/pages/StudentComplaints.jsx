// Student Complaints List Page
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/studentService';
import { Clock } from 'lucide-react';
import Alert from '../components/Alert';
import ComplaintFilters from '../components/ComplaintFilters';
import LoadingState from '../components/LoadingState';
import Pagination from '../components/Pagination';
import SeenBadge from '../components/SeenBadge';
import StatusBadge from '../components/StatusBadge';
import { useComplaintList } from '../hooks/useComplaintList';
import { formatDate } from '../utils/format';

const StudentComplaints = () => {
  const navigate = useNavigate();
  const {
    complaints,
    loading,
    error,
    status,
    sort,
    page,
    totalPages,
    changeStatus,
    changeSort,
    setPage,
  } = useComplaintList(studentService.getComplaints);

  if (loading) {
    return <LoadingState message="Loading complaints..." />;
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

      <ComplaintFilters
        status={status}
        onStatusChange={changeStatus}
        sort={sort}
        onSortChange={changeSort}
      >
        <button 
          onClick={() => navigate('/student/complaints/new')}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          New Complaint
        </button>
      </ComplaintFilters>

      {error && <Alert>{error}</Alert>}

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
                  <StatusBadge status={complaint.status} />
                </div>
                <p className="text-gray-600 mb-2">{complaint.snippet}</p>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(complaint.sentAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <SeenBadge
                      seen={complaint.seenByDepartment}
                      seenLabel="Seen by Dept"
                      unseenLabel="Unseen by Dept"
                    />
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

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
};

export default StudentComplaints;
