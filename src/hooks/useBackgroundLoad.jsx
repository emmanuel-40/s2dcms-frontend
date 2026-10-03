import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Loading state that blanks the page at most once.
 *
 * WHY: pages used to set `loading = true` on every fetch and begin with
 * `if (loading) return <PageSkeleton/>`. That is correct for the FIRST load - there is nothing on
 * screen yet - but wrong for everything after. Changing a filter, paging, or refetching after an
 * action replaced the whole view with the skeleton again, throwing away the content the user was
 * looking at and making a fast app feel slower than it is.
 *
 */
export function useBackgroundLoad() {
  const [loading, setLoading] = useState(true);

  // Refs, not state: flipping these must not itself schedule a render.
  const hasLoadedOnce = useRef(false);
  const mounted = useRef(true);

  /*
   * Re-arm `mounted` on every mount, not just the first.
   *
   * React 18 StrictMode (main.jsx) deliberately runs mount -> unmount -> mount in development to
   * surface unsafe effects. This cleanup sets mounted.current = false on the simulated unmount, and
   * if it were never set back, `run()`'s finally block would silently skip every setState
   * afterwards and the skeleton would never go away. Setting it to true as the effect runs again
   * keeps the guard correct under StrictMode while still ignoring genuinely late responses from an
   * unmounted component.
   */
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (loader) => {
    // Only the first run shows the skeleton. Later fetches leave the content alone.
    if (!hasLoadedOnce.current) {
      setLoading(true);
    }

    try {
      return await loader();
    } finally {
      // Ignore state updates from a response that arrived after unmount.
      if (mounted.current) {
        setLoading(false);
        hasLoadedOnce.current = true;
      }
    }
  }, []);

  return { loading, run };
}