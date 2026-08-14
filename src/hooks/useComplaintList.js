import { useEffect, useRef, useState } from 'react';

// Paginated, filterable complaint list state shared by the student and
// department list pages. `fetchComplaints` receives { status, sort, page, size }.
export const useComplaintList = (fetchComplaints, { size = 10 } = {}) => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sort, setSort] = useState('NEWEST');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchRef = useRef(fetchComplaints);
  fetchRef.current = fetchComplaints;

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchRef.current({ status, sort, page, size });
        setComplaints(data.content || []);
        setTotalPages(data.pageable?.totalPages || 0);
      } catch (err) {
        setError(err.message || 'Failed to load complaints');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [status, sort, page, size]);

  const changeStatus = (value) => {
    setStatus(value);
    setPage(0);
  };

  const changeSort = (value) => {
    setSort(value);
    setPage(0);
  };

  return {
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
  };
};
