import React from 'react';
import { COMPLAINT_SORT_OPTIONS, COMPLAINT_STATUS_OPTIONS } from '../utils/constants';

const SELECT_CLASSES =
  'px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none';

const ComplaintFilters = ({ status, onStatusChange, sort, onSortChange, children }) => (
  <div className="flex gap-4 mb-6 flex-wrap">
    <div className="flex items-center gap-2">
      <label className="font-medium text-gray-700">Status:</label>
      <select value={status} onChange={(e) => onStatusChange(e.target.value)} className={SELECT_CLASSES}>
        {COMPLAINT_STATUS_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>

    <div className="flex items-center gap-2">
      <label className="font-medium text-gray-700">Sort:</label>
      <select value={sort} onChange={(e) => onSortChange(e.target.value)} className={SELECT_CLASSES}>
        {COMPLAINT_SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>

    {children}
  </div>
);

export default ComplaintFilters;
