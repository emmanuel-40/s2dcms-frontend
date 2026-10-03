// Department Profile Page
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Building2, Camera, ArrowLeft, Save, Mail } from 'lucide-react';
import { validateImage } from '../utils/fileValidation';
import { prepareProfileImage } from '../utils/imageResize';
import { assetUrl } from '../config';
import PageSkeleton from '../components/PageSkeleton';
import { useProfile, useUpdateProfile } from '../hooks/queries';

const DepartmentProfile = () => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [removeProfile, setRemoveProfile] = useState(false);
  const { logout } = useAuth();
  const navigate = useNavigate();

  const { data: profile, isPending } = useProfile('department');
  const updateMutation = useUpdateProfile('department');

  /*
   * The form is populated from the query rather than from a loadProfile() handler. Saving writes the
   * record the backend already returns straight into the  */
  useEffect(() => {
    if (!profile) return;

    setImagePreview(profile.departmentProfile ? assetUrl(profile.departmentProfile) : null);
    setImageFile(null);
    setRemoveProfile(false);
  }, [profile]);

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
      // Previously the remove flag stayed set and this branch was unreachable - the image was
      // silently discarded on save and the user saw the removal win instead.
      setRemoveProfile(false);
    } catch (err) {
      setError(err.message || 'Could not process that image');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      const formDataToSend = new FormData();
      // Removal and replacement are mutually exclusive intents about one field; handleImageChange
      // clears the flag when a new picture is chosen, so exactly one of these can be set.
      if (imageFile) {
        formDataToSend.append('image', imageFile);
      } else if (removeProfile) {
        formDataToSend.append('removeProfile', 'true');
      }

      // mutateAsync resolves after onSuccess has put the saved record in the cache, so the effect
      // above has already reset the form by the time the success message shows. No follow-up GET.
      await updateMutation.mutateAsync(formDataToSend);

      setSuccess('Profile updated successfully!');
    } catch (err) {
      setError(err.message || 'Failed to update profile');
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (isPending) {
    return <PageSkeleton cards={0} rows={5} />;
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
                      alt="Department Profile Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100">
                      <Building2 className="w-20 h-20 text-gray-400" />
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
                <p className="text-sm text-gray-600 font-medium">Click camera icon to change department profile picture</p>
                <div className="flex items-center gap-4 h-6">
                  {/* Shows whenever a picture is on screen - saved or newly picked.*/}
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
                            profile?.departmentProfile ? assetUrl(profile.departmentProfile) : null
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
                  disabled={updateMutation.isPending || (!imageFile && !removeProfile)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-md"
                >
                  <Save className="w-5 h-5" />
                  {updateMutation.isPending ? 'Saving...' : 'Update Profile Picture'}
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
