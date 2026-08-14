// Shared error helpers: keeps API failures typed, logged and renderable as text.

// Error thrown by the API layer. Carries the HTTP status and parsed body so
// callers can branch on the status instead of matching on message strings.
export class ApiError extends Error {
  constructor(message, { status = null, body = null, cause = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
    if (cause) {
      this.cause = cause;
    }
  }
}

export class NetworkError extends ApiError {
  constructor(message = 'Unable to reach the server. Please check your connection.', options = {}) {
    super(message, options);
    this.name = 'NetworkError';
  }
}

// Turn anything thrown (Error, axios error, string, backend JSON body) into a
// string safe to put in component state and render.
export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  if (!error) {
    return fallback;
  }

  if (typeof error === 'string') {
    return error.trim() || fallback;
  }

  // axios-style error: the backend payload lives on response.data
  const data = error.response?.data;
  if (typeof data === 'string' && data.trim()) {
    return data.trim();
  }
  if (data && typeof data === 'object') {
    const message = data.error || data.message;
    if (typeof message === 'string' && message.trim()) {
      return message.trim();
    }
  }

  if (typeof error.message === 'string' && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
};

// Log an error that is handled (and therefore not propagated) so it stays
// visible in the console instead of disappearing.
export const logError = (context, error) => {
  console.error(`[s2dcms] ${context}:`, error);
};

// Read the response body of a failed request without throwing on non-JSON or
// empty payloads.
export const parseErrorBody = async (response) => {
  const text = await response.text().catch(() => '');
  if (!text) {
    return { message: null, body: null };
  }

  try {
    const body = JSON.parse(text);
    const message = typeof body === 'string' ? body : body?.error || body?.message || null;
    return { message: message || null, body };
  } catch {
    return { message: text, body: text };
  }
};
