import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Two-phase loading state, so a page never blanks itself once it has content.
 *
 * So: blank the page only when there is genuinely nothing to show; afterwards keep the content and
 * surface `refreshing` as a thin progress bar instead.
 */
export function useBackgroundLoad() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Refs, not state: flipping these must not itself schedule a render.
  const hasLoadedOnce = useRef(false);
  const mounted = useRef(true);

  /*
   * Re-arm `mounted` on every mount, not just the first.
   *
   * React 18 StrictMode (main.jsx) deliberately runs mount -> unmount -> mount in development to
   * surface unsafe effects. This cleanup sets mounted.current = false on the simulated unmount,
   * and it is never set back, so `run()`'s finally block silently skipped every setState
   * afterwards and the page spun forever. Setting it to true as the effect runs again makes the
   * guard correct under StrictMode while still ignoring genuinely late responses from an
   * unmounted component.
   */
  useEffect(() => {
    mounted.current = true;

    return () => {
      mounted.current = false;
    };
  }, []);

  const run = useCallback(async (loader) => {
    if (hasLoadedOnce.current) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      return await loader();
    } finally {
      // Ignore state updates from a response that arrived after unmount.
      if (mounted.current) {
        setLoading(false);
        setRefreshing(false);
        hasLoadedOnce.current = true;
      }
    }
  }, []);

  return { loading, refreshing, run };
}