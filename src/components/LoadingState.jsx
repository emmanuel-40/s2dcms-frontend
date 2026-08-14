import React from 'react';

const LoadingState = ({ message = 'Loading...' }) => (
  <div className="flex justify-center items-center min-h-[200px] text-xl text-gray-600">
    {message}
  </div>
);

export default LoadingState;
