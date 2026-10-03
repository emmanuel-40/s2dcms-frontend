/**
 * Placeholder layout shown while a page's first load is in flight.
 *
 * WHY NOT A FULL-PAGE SPINNER: pages used to `return <LoadingSpinner/>` until their data arrived,
 * which unmounted the entire view and replaced it with a lone spinner on a blank background. Every
 * navigation - dashboard -> complaints -> detail - therefore blinked from "nothing" to "content",
 * and on a slow connection that blank state is most of what the user sees. It reads as a broken or
 * half-loaded site rather than as loading.
 *
 * Genuinely indeterminate states - "checking your authentication", "checking your reset link" -
 * still use LoadingSpinner, because there is no page layout to reveal yet.
 */
const PageSkeleton = ({ rows = 4, cards = 4 }) => (
  <div
    className="max-w-6xl mx-auto p-4"
    aria-busy="true"
    aria-label="Loading content"
  >
    <div className="animate-pulse space-y-6">
      {/* Heading */}
      <div className="h-8 w-56 rounded bg-gray-200" aria-hidden="true" />

      {/* Summary tiles */}
      {cards > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: cards }, (_, i) => (
            <div key={i} className="h-24 rounded-lg bg-gray-200" aria-hidden="true" />
          ))}
        </div>
      )}

      {/* Content rows */}
      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="h-16 rounded-lg bg-gray-200" aria-hidden="true" />
        ))}
      </div>
    </div>
  </div>
);

export default PageSkeleton;