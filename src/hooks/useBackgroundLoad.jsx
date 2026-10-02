import React, { useEffect, useRef, useState } from 'react';

/**
 * Keeps rendered content on screen while a background request is in flight.
 *
 * WHY: pages used to set `loading = true` on every fetch, and the component's first statement was
 * `if (loading) return <LoadingSpinner/>`. That is right for the FIRST load - there is nothing to
 * show yet - but wrong for everything after: changing a filter, paging, or refetching after an
 * action replaced the whole page with a spinner and threw away the layout the user was looking at,
 * making a fast app feel slower than it is.
 *
 * So the rule is: blank the page only when there is genuinely nothing to show. After that, the
 * existing content stays put and `refreshing` drives a thin top progress bar instead.
 *
 * Usage:
 *   const { loading, refreshing, run } = useBackgroundLoad(loadComplaints);
 *   if (loading) return <LoadingSpinner/>;              // first paint only
 *   return <RefreshBar active={refreshing}>...         // everything else
 */
export function useBackgroundLoad(loader) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  // A ref, not state: flipping this must not itself trigger a render.
  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (hasLoadedOnce.current) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await loader();
        if (active) setError('');
        return result;
      } catch (err) {
        if (active) setError(err.message || 'Something went wrong');
        return null;
      } finally {
        if (active) {
          setLoading(false);
          setRefreshing(false);
          hasLoadedOnce.current = true;
        }
      }
    };

    run();

    // Ignore a response that arrives after unmount (or after a newer request superseded it).
    return () => {
      active = false;
    };
  }, [loader]);

  return { loading, refreshing, error, setError, run };
}

/**
 * Thin indeterminate bar pinned to the top of a page. Non-blocking, so the content underneath
 * stays interactive while it runs.
 */
export function RefreshBar({ active }) {
  if (!active) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-blue-100"
      role="status"
      aria-label="Refreshing"
    >
      <div className="h-full w-1/3 bg-blue-600 animate-loading" />
    </div>
  );
}