// Department Profile Page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { departmentService } from '../services/departmentService';
import { Building2, ArrowLeft, Save, Mail } from 'lucide-react';
import Alert from '../components/Alert';
import LoadingState from '../components/LoadingState';
import ProfilePictureField from '../components/ProfilePictureField';
import { useLogout } from '../hooks/useLogout';
import { fileUrl, readFileAsDataUrl } from '../utils/files';

const DepartmentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [removeProfile, setRemoveProfile] = useState(false);
  const handleLogout = useLogout();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await departmentService.getProfile();
      setProfile(profileData);
      setImagePreview(fileUrl(profileData.departmentProfile));
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(await readFileAsDataUrl(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      if (removeProfile) {
        formDataToSend.append('removeProfile', 'true');
      } else if (imageFile) {
        formDataToSend.append('image', imageFile);
      }

      await departmentService.updateProfile(formDataToSend);
      setSuccess('Profile updated successfully!');
      setImageFile(null); // Clear the uploaded file
      setRemoveProfile(false); // Reset remove profile flag
      await loadProfile();
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading profile..." />;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/department/dashboard')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">Department Profile</h1>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        {error && <Alert>{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            <ProfilePictureField
              imagePreview={imagePreview}
              placeholderIcon={Building2}
              altText="Department Profile Preview"
              hintText="Click camera icon to change department profile picture"
              onImageChange={handleImageChange}
              onRemove={() => {
                setRemoveProfile(true);
                setImagePreview(null);
                setImageFile(null);
              }}
            />

            {/* Profile Information */}
            <div className="p-8 space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Department Information</h3>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Department Name</label>
                <input
                  type="text"
                  value={profile?.departmentName || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <div className="relative">
                  <input
                    type="email"
                    value={profile?.email || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed pl-10"
                  />
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving || !imageFile}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Update Profile Picture'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DepartmentProfile;
