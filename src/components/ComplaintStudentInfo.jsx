import React from 'react';
import { fileUrl } from '../utils/files';
import { studentProfileFromComplaint } from '../utils/complaints';

// Student avatar plus name/reg number shown on department complaint cards
const ComplaintStudentInfo = ({ complaint, onOpenProfile }) => (
  <div className="flex items-center gap-2">
    {complaint.profilePicturePath && (
      <img
        src={fileUrl(complaint.profilePicturePath)}
        alt="Student Profile"
        className="w-10 h-10 rounded-full object-cover border-2 border-gray-300 shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => onOpenProfile(studentProfileFromComplaint(complaint), 'student')}
      />
    )}
    <div className="flex flex-col">
      <span className="font-medium text-gray-800 text-sm">{complaint.studentName}</span>
      <span className="text-gray-500 text-xs">{complaint.studentRegNumber}</span>
    </div>
  </div>
);

export default ComplaintStudentInfo;
