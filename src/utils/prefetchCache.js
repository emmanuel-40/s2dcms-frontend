/**
 * Tiny in-memory cache used to pre-warm the page a user is about to land on.
 *
 * WHY: sending a reply or a complaint navigates immediately, and the destination page has to fetch
 * before it can render. That fetch is what produces the skeleton - so on a fast connection the
 * skeleton appears for a fraction of a second and the user sees a full-screen blink as the old
 * page is replaced by a placeholder and then by content. Warming the destination BEFORE the
 * navigate call means it mounts with data already in hand and paints the real content on the
 * first frame.
 */

const store = new Map();

// Bounded so a long session browsing many complaints cannot grow the store without limit. Small
// relative to typical heap sizes, and comfortably above anything one user visits.
const MAX_ENTRIES = 24;

const evictOldest = () => {
  while (store.size > MAX_ENTRIES) {
    const oldestKey = store.keys().next().value;
    store.delete(oldestKey);
  }
};

export const cacheKeys = {
  complaint: (id) => `complaint:${id}`,

  // The list is keyed by its full query shape. A seeded row set is only correct for the exact
  // filters it was fetched with, so every parameter belongs in the key - omitting one would show
  // the wrong rows for the wrong filter, which is worse than showing a skeleton.
  complaintList: ({ status = 'ALL', sort = 'NEWEST', page = 0, size = 10 } = {}) =>
    `list:${status}:${sort}:${page}:${size}`,

  // The view NewComplaint navigates into, and the view both complaint lists open on. Naming it
  // keeps the prefetch and the consuming page reading from one definition.
  defaultList: () => cacheKeys.complaintList({ status: 'ALL', sort: 'NEWEST', page: 0, size: 10 }),
};

export const prefetchCache = {
  get(key) {
    return store.get(key);
  },

  set(key, value) {
    // Delete before re-setting: Map preserves insertion order, so this makes eviction drop the
    // least recently stored entry rather than whatever happened to be written first.
    store.delete(key);
    store.set(key, value);
    evictOldest();
  },

  /**
   * Fetch and store unless already warm. Resolves to the cached or freshly fetched value.
   *
   * Rejects if the fetch fails - callers on a submit path should catch, because a failed warm must
   * never stand between the user and the page they asked for.
   */
  async warm(key, fetcher) {
    if (store.has(key)) {
      return store.get(key);
    }

    const data = await fetcher();
    this.set(key, data);

    return data;
  },

  clear() {
    store.clear();
  },
};