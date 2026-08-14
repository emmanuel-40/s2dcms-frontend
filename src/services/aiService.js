// AI Service - text generation endpoints, which return plain text
import { authService } from './authService';

const AI_UNAVAILABLE_MESSAGE =
  'AI service is currently unavailable. Please try again later or contact the administrator.';

const requestAiText = async (path, body) => {
  let response;
  try {
    response = await fetch(`/api/ai/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getAccessToken()}`,
      },
      body: JSON.stringify(body),
    });
  } catch (err) {
    const networkError = new Error(err.message);
    networkError.isNetworkError = true;
    throw networkError;
  }

  if (!response.ok) {
    const error = new Error(await response.text());
    error.status = response.status;
    error.isUnavailable = response.status === 503;
    throw error;
  }

  return await response.text();
};

// Builds the message shown to the user, e.g. actionLabel 'Failed to suggest reply'
export const aiErrorMessage = (err, actionLabel) => {
  if (err.isUnavailable) return AI_UNAVAILABLE_MESSAGE;
  if (err.isNetworkError) return `${actionLabel}. Please check your connection and try again.`;
  return `${actionLabel}: ${err.message}`;
};

export const aiService = {
  summarize: (text) => requestAiText('summarize', { text }),
  suggestReply: (complaintText) => requestAiText('suggest-reply', { complaintText }),
  writeComplaint: (situation) => requestAiText('write-complaint', { situation }),
};
