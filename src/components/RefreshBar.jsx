/**
 * Thin indeterminate progress bar pinned to the top of the viewport.
 *
 * Shown while a background request is in flight. Unlike a full-page spinner it does not unmount the
 * content underneath, so the page stays readable and interactive while it updates.
 *
 */
const RefreshBar = ({ active }) => {
  if (!active) return null;

  return (
    <div className="fixed top-0 left-0 right-0 h-1 z-50 overflow-hidden bg-blue-100" aria-hidden="true">
      <div className="h-full w-1/3 bg-blue-600 animate-loading" />
    </div>
  );
};

export default RefreshBar;