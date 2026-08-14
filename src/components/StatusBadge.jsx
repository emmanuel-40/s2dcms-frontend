import React from 'react';
import { getStatusColor } from '../utils/status';

const StatusBadge = ({ status, className = '' }) => (
  <span className={`${getStatusColor(status)} text-white px-3 py-1 rounded-full text-sm ${className}`}>
    {status}
  </span>
);

export default StatusBadge;
