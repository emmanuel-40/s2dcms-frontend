import React from 'react';
import { Camera } from 'lucide-react';

// Circular profile picture with camera upload button and remove action,
// shared by the student and department profile pages.
const ProfilePictureField = ({
  imagePreview,
  placeholderIcon: PlaceholderIcon,
  altText,
  hintText,
  onImageChange,
  onRemove,
  inputId = 'image-upload',
}) => (
  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 flex flex-col items-center border-b border-gray-200">
    <div className="relative mb-4">
      <div className="w-36 h-36 rounded-full overflow-hidden border-4 border-white shadow-lg bg-white">
        {imagePreview ? (
          <img src={imagePreview} alt={altText} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-100">
            <PlaceholderIcon className="w-20 h-20 text-gray-400" />
          </div>
        )}
      </div>
      <label
        htmlFor={inputId}
        className="absolute bottom-0 right-0 bg-blue-600 text-white p-3 rounded-full cursor-pointer hover:bg-blue-700 transition-colors shadow-md"
      >
        <Camera className="w-5 h-5" />
      </label>
      <input
        type="file"
        id={inputId}
        accept="image/*"
        onChange={onImageChange}
        className="hidden"
      />
    </div>
    <div className="flex items-center gap-4 mt-4">
      <p className="text-sm text-gray-600 font-medium">{hintText}</p>
      {imagePreview && (
        <button
          type="button"
          onClick={onRemove}
          className="text-sm text-red-600 hover:text-red-800 font-medium"
        >
          Remove Picture
        </button>
      )}
    </div>
  </div>
);

export default ProfilePictureField;
