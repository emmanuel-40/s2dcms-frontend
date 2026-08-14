import React from 'react';

const VARIANT_CLASSES = {
  error: 'bg-red-50 border-red-200 text-red-600',
  success: 'bg-green-50 border-green-200 text-green-600',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-700',
};

const Alert = ({ variant = 'error', className = 'mb-4', children }) => (
  <div className={`border p-3 rounded ${VARIANT_CLASSES[variant]} ${className}`}>
    {children}
  </div>
);

export default Alert;
