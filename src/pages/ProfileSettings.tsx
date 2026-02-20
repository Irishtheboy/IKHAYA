import React, { useState, useEffect } from 'react';
import { Layout } from '../components/layout/Layout';
import { useAuth } from '../contexts/AuthContext';
import { authService } from '../services/authService';
import { cloudinaryService } from '../services/cloudinaryService';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Card, Button, Alert } from '../components/common';

const ProfileSettings: React.FC = () => {
  const { currentUser, userProfile, refreshUserProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        phone: userProfile.phone || '',
      });
      if (userProfile.profileImage) {
        setPreviewUrl(userProfile.profileImage);
      }
    }
  }, [userProfile]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('Image size must be less than 5MB');
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      setProfileImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser || !userProfile) {
      setError('You must be logged in to update your profile');
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const updates: any = {
        name: formData.name,
        phone: formData.phone,
        updatedAt: serverTimestamp(),
      };

      // Upload profile image if selected
      if (profileImage) {
        console.log('Uploading profile image...');
        const folder = `ikhaya/profiles/${currentUser.uid}`;
        const [imageUrl] = await cloudinaryService.uploadImages([profileImage], folder, 1);
        console.log('Image uploaded successfully:', imageUrl);
        updates.profileImage = imageUrl;
      }

      console.log('Updating Firestore with:', updates);

      // Update user profile in Firestore
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, updates);

      console.log('Firestore update successful');

      // Refresh user profile in context
      await refreshUserProfile();

      setSuccess('Profile updated successfully!');
      setProfileImage(null);
    } catch (err: any) {
      console.error('Profile update error:', err);
      setError(err.message || 'Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!currentUser) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card>
            <p className="text-center text-gray-600">
              Please log in to view your profile settings.
            </p>
          </Card>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-light text-slate-900 mb-8 tracking-tight">Profile Settings</h1>

        {error && (
          <Alert variant="error" className="mb-6">
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="mb-6">
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <Card className="mb-6">
            <h2 className="text-xl font-light text-slate-900 mb-6 tracking-tight">
              Profile Information
            </h2>

            {/* Profile Image */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Profile Image</label>
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Profile preview"
                      className="h-32 w-32 rounded-lg object-cover border-2 border-gray-200"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-lg bg-gray-200 flex items-center justify-center border-2 border-gray-200">
                      <svg
                        className="h-16 w-16 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/jpeg,image/jpg,image/png"
                    onChange={handleImageChange}
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-cyan-50 file:text-cyan-700 hover:file:bg-cyan-100"
                    disabled={isLoading}
                  />
                  <p className="mt-2 text-xs text-gray-500">
                    JPG, PNG up to 5MB. This image will be shown to potential tenants.
                  </p>
                </div>
              </div>
            </div>

            {/* Name */}
            <div className="mb-6">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                disabled={isLoading}
                required
              />
            </div>

            {/* Email (read-only) */}
            <div className="mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                value={userProfile?.email || ''}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                disabled
                readOnly
              />
              <p className="mt-1 text-xs text-gray-500">Email cannot be changed</p>
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="+27 XX XXX XXXX"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                disabled={isLoading}
              />
              <p className="mt-1 text-xs text-gray-500">
                This number will be shown to potential tenants
              </p>
            </div>

            {/* Role (read-only) */}
            <div className="mb-6">
              <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
                Account Type
              </label>
              <input
                type="text"
                id="role"
                value={
                  userProfile?.role
                    ? userProfile.role.charAt(0).toUpperCase() + userProfile.role.slice(1)
                    : ''
                }
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 capitalize"
                disabled
                readOnly
              />
            </div>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.history.back()}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isLoading} className="bg-cyan-500 hover:bg-cyan-600">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default ProfileSettings;
