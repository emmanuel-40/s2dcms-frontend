import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const ToastContext = createContext(null);

const SUCCESS_DURATION = 4000;
// Failures get longer on screen than successes. A success is a glance; an error the user has to
// re-read and act on, and auto-dismissing a message like "could not reach the server" after 4s
// just makes them submit again and fail again.
const ERROR_DURATION = 7000;

/**
 * Transient confirmations for actions that end by navigating away.
 *
 * WHY A PROVIDER RATHER THAN PER-PAGE STATE: sending a reply calls navigate() the moment the
 * request resolves, which unmounts the page that triggered it. Any toast owned by that page would
 * be torn down in the same tick it appeared - telling the user "reply sent" and swallowing the
 * message before they could read it. Holding toasts here, above the router in App.jsx, means the
 * container outlives the route and survives the change.
 *
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const timers = useRef(new Map());
  const nextId = useRef(1);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));

    // Clear the timer too, or a manually dismissed toast would still fire later and call
    // setState for an id that no longer exists.
    const timer = timers.current.get(id);
    if (timer !== undefined) {
      clearTimeout(timer);
      timers.current.delete(id);
    }
  }, []);

  const show = useCallback(
    (message, { type = 'success', duration } = {}) => {
      const id = nextId.current++;
      const ttl = duration ?? (type === 'error' ? ERROR_DURATION : SUCCESS_DURATION);

      setToasts((prev) => [...prev, { id, message, type }]);

      timers.current.set(
        id,
        setTimeout(() => dismiss(id), ttl)
      );

      return id;
    },
    [dismiss]
  );

  // Timers outlive the component that created them, so cancel them on unmount instead of letting
  // a pending callback fire setState against a tree that is gone.
  useEffect(() => {
    const pending = timers.current;

    return () => {
      pending.forEach((timer) => clearTimeout(timer));
      pending.clear();
    };
  }, []);

  const value = useMemo(
    () => ({
      toasts,
      show,
      dismiss,
      success: (message, options) => show(message, { ...options, type: 'success' }),
      error: (message, options) => show(message, { ...options, type: 'error' }),
    }),
    [toasts, show, dismiss]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = useContext(ToastContext);

  // Throwing beats handing back undefined: a page using useToast outside the provider would
  // otherwise fail later as "show is not a function", far from the actual mistake.
  if (context === null) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}