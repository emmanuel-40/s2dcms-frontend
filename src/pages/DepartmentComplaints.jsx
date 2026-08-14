// Department Complaints List Page
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { departmentService } from '../services/departmentService';
import { Clock } from 'lucide-react';
import Alert from '../components/Alert';
import ComplaintFilters from '../components/ComplaintFilters';
import ComplaintStudentInfo from '../components/ComplaintStudentInfo';
import LoadingState from '../components/LoadingState';
import Pagination from '../components/Pagination';
import ProfileModal from '../components/ProfileModal';
import SeenBadge from '../components/SeenBadge';
import StatusBadge from '../components/StatusBadge';
import { useComplaintList } from '../hooks/useComplaintList';
import { useProfileModal } from '../hooks/useProfileModal';
import { formatDate } from '../utils/format';

const DepartmentComplaints = () => {
  const navigate = useNavigate();
  const { openProfile, profileModalProps } = useProfileModal();
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
  } = useComplaintList(departmentService.getComplaints);

  if (loading) {
    return <LoadingState message="Loading complaints..." />;
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

      <ComplaintFilters
        status={status}
        onStatusChange={changeStatus}
        sort={sort}
        onSortChange={changeSort}
      />

      {error && <Alert>{error}</Alert>}

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
                  <ComplaintStudentInfo complaint={complaint} onOpenProfile={openProfile} />
                  <div className="flex-1">
                    <div className="flex justify-end items-center mb-2">
                      <StatusBadge status={complaint.status} />
                    </div>
                    <p className="text-gray-600 mb-2">{complaint.snippet}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-gray-500 text-sm flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {formatDate(complaint.sentAt)}
                  </span>
                  <div className="flex items-center gap-2">
                    <SeenBadge
                      seen={complaint.seenByDepartment}
                      unseenLabel="New"
                      unseenColor="red"
                    />
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

          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}

      <ProfileModal {...profileModalProps} />
    </div>
  );
};

export default DepartmentComplaints;
