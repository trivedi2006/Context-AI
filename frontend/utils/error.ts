/**
 * Safely extracts a human-readable error string from any backend API response or exception.
 * Handles FastAPI string details, Pydantic validation error arrays, Axios network errors, and fallback strings.
 */
export const extractErrorMessage = (err: any, fallbackMessage: string = 'An error occurred'): string => {
  if (!err) return fallbackMessage;

  // 1. FastAPI / Axios Response Error
  if (err.response?.data?.detail) {
    const detail = err.response.data.detail;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item: any) => {
          if (typeof item === 'string') return item;
          if (item?.msg) return item.msg;
          return JSON.stringify(item);
        })
        .join(', ');
    }
    if (typeof detail === 'object') {
      return JSON.stringify(detail);
    }
  }

  // 2. Axios Response Message (e.g. custom error response format)
  if (err.response?.data?.message && typeof err.response.data.message === 'string') {
    return err.response.data.message;
  }

  // 3. Axios or Network Error Message
  if (err.message && typeof err.message === 'string') {
    if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
      return 'Unable to connect to the backend server. Please verify the API is running at http://127.0.0.1:8000.';
    }
    return err.message;
  }

  return fallbackMessage;
};
