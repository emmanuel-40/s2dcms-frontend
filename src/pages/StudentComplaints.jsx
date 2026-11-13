// Student Complaints List Page
import React, { useEffect, useRef, useLayoutEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Clock } from 'lucide-react';
import PageSkeleton from '../components/PageSkeleton';
import { useComplaintsList } from '../hooks/queries';

const SCROLL_KEY = 'studentComplaintsScroll';
const RETURN_KEY = 'studentComplaintsReturn';

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
  return { status, sort, page };
};

const buildParams = ({ status, sort, page }) => {
  const p = {};
  if (status && status !== 'ALL') p.status = status;
  if (sort && sort !== 'NEWEST') p.sort = sort;
  if (page && page > 1) p.page = String(page);
  return p;
};

const StudentComplaints = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { status: statusFilter, sort: sortOrder, page: pageNum } = parseParams(searchParams);
  const page = pageNum - 1; // 0-based for API/UI

  const shouldRestore = useRef(sessionStorage.getItem(RETURN_KEY) === '1');
  const consumedReturn = useRef(false);
  const restoredRef = useRef(false);

  const { data, isPending, error } = useComplaintsList('student', {
    status: statusFilter,
    sort: sortOrder,
    page,
    size: 10,
  });

  const complaints = data?.content ?? [];
  const totalPages = data?.totalPages ?? data?.pageable?.totalPages ?? 0;
  const navigate = useNavigate();

  // Clamp out-of-range page once totals are known (avoids stale/empty deep pages).
  useEffect(() => {
    if (!isPending && totalPages > 0 && page >= totalPages) {
      setSearchParams(
        buildParams({ status: statusFilter, sort: sortOrder, page: totalPages }),
        { replace: true }
      );
    }
  }, [isPending, totalPages, page, statusFilter, sortOrder, setSearchParams]);

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
  }, [isPending, complaints.length, page, statusFilter, sortOrder]);

  const openComplaint = (id) => {
    sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
    sessionStorage.setItem(RETURN_KEY, '1');
    navigate(`/student/complaints/${id}`);
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
            onChange={(e) => setSearchParams(buildParams({ status: e.target.value, sort: sortOrder, page: 1 }), { replace: true })}
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
            onChange={(e) => setSearchParams(buildParams({ status: statusFilter, sort: e.target.value, page: 1 }), { replace: true })}
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
                  onClick={() => openComplaint(complaint.id)}
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
                onClick={() => setSearchParams(buildParams({ status: statusFilter, sort: sortOrder, page: Math.max(1, pageNum - 1) }), { replace: true })}
                disabled={pageNum <= 1}
                className="min-h-[44px] px-5 sm:px-6 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <span className="order-last w-full sm:order-none sm:w-auto text-center text-sm sm:text-base text-gray-600">
                Page {pageNum} of {totalPages}
              </span>

              <button
                onClick={() => setSearchParams(buildParams({ status: statusFilter, sort: sortOrder, page: Math.min(totalPages, pageNum + 1) }), { replace: true })}
                disabled={pageNum >= totalPages}
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
