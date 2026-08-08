import React, { useState } from 'react';
import { X, User, Building2, Mail, Calendar, ZoomIn, ZoomOut } from 'lucide-react';

const ProfileModal = ({ isOpen, onClose, profile, type }) => {
  const [isZoomed, setIsZoomed] = useState(false);

  if (!isOpen || !profile) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">
            {type === 'student' ? 'Student Profile' : 'Department Profile'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Profile Picture */}
        <div className="bg-gradient-to-b from-blue-50 to-white p-8 flex flex-col items-center border-b border-gray-200 relative">
          <div 
            className={`w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white cursor-pointer transition-all duration-300 ${isZoomed ? 'w-48 h-48' : ''}`}
            onClick={() => setIsZoomed(!isZoomed)}
          >
            {profile.profilePicturePath || profile.departmentProfile ? (
              <img
                src={`http://localhost:8080${profile.profilePicturePath || profile.departmentProfile}`}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100">
                {type === 'student' ? (
                  <User className="w-12 h-12 text-gray-400" />
                ) : (
                  <Building2 className="w-12 h-12 text-gray-400" />
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="mt-3 text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
          >
            {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
            {isZoomed ? 'Zoom Out' : 'Zoom In'}
          </button>
        </div>

        {/* Profile Information */}
        <div className="p-6 space-y-4">
          {type === 'student' ? (
            <>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <User className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Name</p>
                  <p className="font-medium text-gray-800">{profile.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{profile.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Calendar className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Registration Number</p>
                  <p className="font-medium text-gray-800">{profile.regNo}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Department</p>
                  <p className="font-medium text-gray-800">{profile.departmentName}</p>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Building2 className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Department Name</p>
                  <p className="font-medium text-gray-800">{profile.departmentName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <Mail className="w-5 h-5 text-gray-600" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="font-medium text-gray-800">{profile.email}</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileModal;
