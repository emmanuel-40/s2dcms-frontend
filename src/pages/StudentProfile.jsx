// Student Profile Page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { studentService } from '../services/studentService';
import { User, Camera, ArrowLeft, Save } from 'lucide-react';
import { validateImage } from '../utils/fileValidation';
import { prepareProfileImage } from '../utils/imageResize';
import { assetUrl } from '../config';
import LoadingSpinner from '../components/LoadingSpinner';

const StudentProfile = () => {
  const [profile, setProfile] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [removeProfile, setRemoveProfile] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const profileData = await studentService.getProfile();
      setProfile(profileData);
      setFormData({ name: profileData.name });
      // Only set image preview if there's a valid path
      if (profileData.profilePicturePath && profileData.profilePicturePath !== '') {
        const url = assetUrl(profileData.profilePicturePath);
        setImagePreview(url);
      } else {
        setImagePreview(null);
      }
      // loadProfile() is the source of truth for "what is actually stored", so it also clears any
      // unsaved intent. Without this, navigating back to this page could re-apply a stale
      // removeProfile flag and blank an avatar that still exists on the server.
      setImageFile(null);
      setRemoveProfile(false);
    } catch (err) {
      setError(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    // Reset the input so re-picking the same file fires change again (it would not after a removal).
    e.target.value = '';

    if (!file) return;

    const validation = validateImage(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError('');

    try {
      const { file: prepared } = await prepareProfileImage(file);

      setImageFile(prepared);
      setImagePreview(URL.createObjectURL(prepared));

      // Choosing a picture is an explicit replacement, so it supersedes a pending removal.
      setRemoveProfile(false);
    } catch (err) {
      setError(err.message || 'Could not process that image');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      // Removal and replacement are mutually exclusive intents about one field; handleImageChange
      // clears the flag when a new picture is chosen, so exactly one of these can be set.
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      } else if (removeProfile) {
        formDataToSend.append('removeProfile', 'true');
      }

      // updateProfile already returns the saved StudentResponse, so the form is updated from that
      // instead of issuing a second GET. That removes a round trip AND stops loadProfile() from
      // flipping `loading`, which previously replaced the whole page with a full-screen spinner for
      // the duration of the refetch.
      const updated = await studentService.updateProfile(formDataToSend);

      setProfile(updated);
      setFormData({ name: updated.name });
      setImagePreview(
        updated.profilePicturePath ? assetUrl(updated.profilePicturePath) : null
      );
      setImageFile(null);
      setRemoveProfile(false);
      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex justify-center items-center py-32">
        <LoadingSpinner text="Loading profile..." size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white p-4 shadow-md flex justify-between items-center">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/student/dashboard')}
            className="text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">View/Edit Profile</h1>
        </div>
        <button 
          onClick={handleLogout}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
        >
          Logout
        </button>
      </header>

      <div className="p-4 max-w-2xl mx-auto">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 p-3 mb-4 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 text-green-600 p-3 mb-4 rounded">
            {success}
          </div>
        )}

        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit}>
            {/* Profile Picture Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 flex flex-col items-center border-b border-gray-200">
              <div className="relative mb-4">
                <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <User className="w-20 h-20 text-gray-400" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="image-upload"
                  className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-md"
                >
                  <Camera className="w-5 h-5" />
                </label>
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <div className="flex flex-col items-center gap-2 mt-4">
                <p className="text-sm text-gray-600 font-medium">Click camera icon to change profile picture</p>
                <div className="flex items-center gap-4 h-6">
                  {/* Shows whenever a picture is on screen - saved or newly picked.  */}
                  {imagePreview && !removeProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setRemoveProfile(true);
                        setImageFile(null);
                        setImagePreview(null);
                        setSuccess('');
                        setError('');
                      }}
                      className="text-sm text-red-600 hover:text-red-800 font-medium"
                    >
                      Remove Picture
                    </button>
                  )}

                  {/* Undo for a pending, unsaved removal. */}
                  {removeProfile && (
                    <>
                      <span className="text-sm text-amber-700 font-medium">
                        Will be removed on save
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setRemoveProfile(false);
                          setImagePreview(
                            profile?.profilePicturePath ? assetUrl(profile.profilePicturePath) : null
                          );
                        }}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        Undo
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Information */}
            <div className="p-8 space-y-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Personal Information</h3>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Registration Number</label>
                  <input
                    type="text"
                    value={profile?.regNo || ''}
                    disabled
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Email Verified</label>
                  <div className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${profile?.emailVerified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {profile?.emailVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
                <input
                  type="email"
                  value={profile?.email || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  value={profile?.departmentName || ''}
                  disabled
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>

              <div className="pt-4 border-t border-gray-200">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md"
                >
                  <Save className="w-5 h-5" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;
