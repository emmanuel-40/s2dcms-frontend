import React from 'react';

const RateLimitWarning = ({ message }) => {
  if (!message) return null;

  return (
    <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 p-3 rounded mb-4">
      <div className="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export default RateLimitWarning;
