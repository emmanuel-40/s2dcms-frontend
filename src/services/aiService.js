// AI Service - AI assisted writing/summarising endpoints
// Routed through apiClient so 401s trigger a token refresh and error bodies
// are turned into ApiError instances instead of raw text.
import { apiClient } from './apiClient';
import { getErrorMessage } from '../utils/errors';

// The AI endpoints depend on an external provider, so 503 gets its own message
export const describeAiError = (error, fallback) => {
  if (error?.status === 503) {
    return 'AI service is currently unavailable. Please try again later or contact the administrator.';
  }
  return getErrorMessage(error, fallback);
};

export const aiService = {
  writeComplaint: async (situation) => {
    return await apiClient.post('/ai/write-complaint', { situation });
  },

  summarize: async (text) => {
    return await apiClient.post('/ai/summarize', { text });
  },

  suggestReply: async (complaintText) => {
    return await apiClient.post('/ai/suggest-reply', { complaintText });
  },
};
