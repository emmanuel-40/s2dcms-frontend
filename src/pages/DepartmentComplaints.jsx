// Department Complaints List Page
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Clock, Search } from 'lucide-react';
import ProfileModal from '../components/ProfileModal';
import PageSkeleton from '../components/PageSkeleton';
import { useComplaintsList } from '../hooks/queries';
import { assetUrl } from '../config';

const SCROLL_KEY = 'departmentComplaintsScroll';
const RETURN_KEY = 'departmentComplaintsReturn';
const QUERY_KEY = 'departmentComplaintsQuery';

// Take control of scroll restoration (browser default fights manual restore).
if (typeof window !== 'undefined' && 'scrollRestoration' in window.history) {
  window.history.scrollRestoration = 'manual';
}

const VALID_STATUS = new Set(['ALL', 'PENDING', 'IN_PROGRESS', 'REPLIED', 'CLOSED']);
const VALID_SORT = new Set(['NEWEST', 'OLDEST']);

const parseParams = (searchParams) => {
  const status = VALID_STATUS.has(searchParams.get('status')) ? searchParams.get('status') : 'ALL';
  const sort = VALID_SORT.has(searchParams.get('sort')) ? searchParams.get('sort') : 'NEWEST';
  const raw = parseInt(searchParams.get('page'), 10);
  const page = Number.isFinite(raw) && raw >= 1 ? raw : 1; // 1-based in URL
  const search = searchParams.get('search') || '';
  return { status, sort, page, search };
};

const buildParams = ({ status, sort, page, search }) => {
  const p = {};
  if (status && status !== 'ALL') p.status = status;
  if (sort && sort !== 'NEWEST') p.sort = sort;
  if (search && search.trim()) p.search = search.trim();
  if (page && page > 1) p.page = String(page);
  return p;
};

const DepartmentComplaints = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { status: statusFilter, sort: sortOrder, page: pageNum, search: searchQuery } = parseParams(searchParams);
  const page = pageNum - 1; // 0-based for API/UI

  const shouldRestore = useRef(sessionStorage.getItem(RETURN_KEY) === '1');
  const consumedReturn = useRef(false);
  const restoredRef = useRef(false);
  const prevPageRef = useRef(pageNum);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [profileType, setProfileType] = useState(null);

  const { data, isPending, error } = useComplaintsList('department', {
    status: statusFilter,
    sort: sortOrder,
    page,
    size: 10,
    search: searchQuery,
  });

  const complaints = data?.content ?? [];
  const totalPages = data?.totalPages ?? data?.pageable?.totalPages ?? 0;
  const navigate = useNavigate();

  // Clamp out-of-range page once totals are known.
  useEffect(() => {
    if (!isPending && totalPages > 0 && page >= totalPages) {
      setSearchParams(
        buildParams({ status: statusFilter, sort: sortOrder, page: totalPages, search: searchQuery }),
        { replace: true }
      );
    }
  }, [isPending, totalPages, page, statusFilter, sortOrder, searchQuery, setSearchParams]);

  // Scroll to top on page/filter changes (not on return-from-detail restore).
  useLayoutEffect(() => {
    // Consume return intent once per mount (StrictMode-safe).
    if (!consumedReturn.current) {
      consumedReturn.current = true;
      if (shouldRestore.current) sessionStorage.removeItem(RETURN_KEY);
    }

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    if (!shouldRestore.current) {
      // Fresh visit, hard refresh, push, or replace: keep URL state, land at top of page.
      sessionStorage.removeItem(SCROLL_KEY);
      const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      toTop();
      requestAnimationFrame(toTop);
      requestAnimationFrame(() => requestAnimationFrame(toTop));
      [0, 50, 150, 300].forEach((ms) => setTimeout(toTop, ms));
      return;
    }

    // Return from detail (back): restore saved scroll after content is ready.
    if (restoredRef.current || isPending) return;
    const y = Number(sessionStorage.getItem(SCROLL_KEY));
    if (!Number.isFinite(y) || y < 0) return;
    restoredRef.current = true;
    const restore = () => window.scrollTo({ top: y, left: 0, behavior: 'auto' });
    restore();
    requestAnimationFrame(restore);
    requestAnimationFrame(() => requestAnimationFrame(restore));
    [0, 50, 120, 250, 400, 700, 1000].forEach((ms) => setTimeout(restore, ms));
  }, [isPending, complaints.length, page, statusFilter, sortOrder, searchQuery]);

  // Scroll to top when user navigates pages via Next/Previous or changes filters.
  useEffect(() => {
    if (prevPageRef.current !== pageNum) {
      prevPageRef.current = pageNum;
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }
  }, [pageNum]);

  const openComplaint = (id) => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    sessionStorage.setItem(RETURN_KEY, '1');
    sessionStorage.setItem(QUERY_KEY, window.location.search || '');
    navigate(`/department/complaints/${id}`);
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

  // True only on a genuine first load with nothing cached; keepPreviousData covers page and filter
  // changes, so rows stay visible instead of being swapped for a placeholder.
  if (isPending) {
    return <PageSkeleton />;
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
            onChange={(e) => setSearchParams(buildParams({ status: e.target.value, sort: sortOrder, page: 1, search: searchQuery }), { replace: true })}
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
            onChange={(e) => setSearchParams(buildParams({ status: statusFilter, sort: e.target.value, page: 1, search: searchQuery }), { replace: true })}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          >
            <option value="NEWEST">Newest First</option>
            <option value="OLDEST">Oldest First</option>
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="font-medium text-gray-700">Search:</label>
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search title or content..."
              value={searchQuery}
              onChange={(e) => setSearchParams(buildParams({ status: statusFilter, sort: sortOrder, page: 1, search: e.target.value }), { replace: true })}
              className="pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none w-64"
            />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 p-3 mb-4 rounded">
          {error.message || 'Failed to load complaints'}
        </div>
      )}

      {complaints.length === 0 ? (
        <div className="text-center py-12 text-gray-600">
          <p>No complaints found.</p>
          {searchQuery ? (
            <button 
              onClick={() => setSearchParams(buildParams({ status: statusFilter, sort: sortOrder, page: 1, search: '' }), { replace: true })}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Clear search
            </button>
          ) : (
            <button 
              onClick={() => navigate('/department/dashboard')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Back to Dashboard
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-4">
            {searchQuery && (
              <button 
                onClick={() => setSearchParams(buildParams({ status: statusFilter, sort: sortOrder, page: 1, search: '' }), { replace: true })}
                className="text-sm text-blue-600 hover:underline"
              >
                Clear search
              </button>
            )}
          </div>

          <div className="grid gap-4">
            {complaints.map((complaint) => (
              <div key={complaint.id} className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow">
                <div className="flex items-start gap-3 mb-2">
                  <div className="flex items-center gap-2">
                    {complaint.profilePicturePath && (
                      <img
                        src={assetUrl(complaint.profilePicturePath)}
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
                  onClick={() => openComplaint(complaint.id)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  View Details
                </button>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              aria-label="Complaint list pages"
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 mt-8"
            >
              <button
                onClick={() => setSearchParams(buildParams({ status: statusFilter, sort: sortOrder, page: Math.max(1, pageNum - 1), search: searchQuery }), { replace: true })}
                disabled={pageNum <= 1}
                className="min-h-[44px] px-5 sm:px-6 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="order-last w-full sm:order-none sm:w-auto text-center text-sm sm:text-base text-gray-600">
                Page {pageNum} of {totalPages}
              </span>

              {/* Jump to page input */}
              <div className="flex items-center gap-1">
                <label className="text-sm text-gray-600 whitespace-nowrap">Go to page:</label>
                <input
                  type="number"
                  min="1"
                  max={totalPages}
                  defaultValue=""
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = parseInt(e.target.value, 10);
                      if (Number.isFinite(val) && val >= 1 && val <= totalPages) {
                        setSearchParams(
                          buildParams({ status: statusFilter, sort: sortOrder, page: val, search: searchQuery }),
                          { replace: true }
                        );
                        e.target.blur();
                      }
                    }
                  }}
                  className="w-16 px-2 py-2 text-center border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  placeholder={`${totalPages}`}
                />
              </div>

              <button
                onClick={() => setSearchParams(buildParams({ status: statusFilter, sort: sortOrder, page: Math.min(totalPages, pageNum + 1), search: searchQuery }), { replace: true })}
                disabled={pageNum >= totalPages}
                className="min-h-[44px] px-5 sm:px-6 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </nav>
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
