import React from 'react';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const VARIANTS = {
  success: { icon: CheckCircle2, bar: 'bg-green-500', iconClass: 'text-green-600' },
  error: { icon: AlertCircle, bar: 'bg-red-500', iconClass: 'text-red-600' },
};

/**
 * Renders the active toasts. Mounted above the router in App.jsx so notifications outlive the
 * route that raised them.
 *
 * Positioned bottom-right on desktop. On phones it spans the width with side margins instead,
 * because a fixed right-hand column would clip against a 375px viewport.
 */
const ToastViewport = () => {
  const { toasts, dismiss } = useToast();

  // Nothing to announce, so render no live region at all - an empty container still occupies an
  // aria-live slot and can interrupt whatever the screen reader is currently saying.
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="fixed z-50 bottom-4 left-4 right-4 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map(({ id, message, type }) => {
        // Unknown types fall back to success styling rather than crashing on a destructure.
        const { icon: Icon, bar, iconClass } = VARIANTS[type] ?? VARIANTS.success;

        return (
          <div
            key={id}
            // Errors interrupt; confirmations wait for a pause. Both are announced either way.
            role={type === 'error' ? 'alert' : 'status'}
            className="pointer-events-auto relative flex items-start gap-3 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
          >
            <span className={`absolute left-0 top-0 bottom-0 w-1 ${bar}`} />

            <Icon className={`w-5 h-5 shrink-0 mt-3.5 ml-4 ${iconClass}`} aria-hidden="true" />

            <p className="flex-1 text-sm text-gray-800 py-3">{message}</p>

            <button
              type="button"
              onClick={() => dismiss(id)}
              className="shrink-0 mr-2 mt-2.5 p-1.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X className="w-4 h-4" aria-hidden="true" />
              <span className="sr-only">Dismiss notification</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastViewport;