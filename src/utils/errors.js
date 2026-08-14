// Message extraction for axios errors, whose body may be a string or an object

export const getApiErrorMessage = (err, fallback) => {
  const data = err?.response?.data;

  if (typeof data === 'string' && data) {
    return data;
  }

  if (data && typeof data === 'object') {
    return data.error || data.message || fallback;
  }

  return fallback;
};
