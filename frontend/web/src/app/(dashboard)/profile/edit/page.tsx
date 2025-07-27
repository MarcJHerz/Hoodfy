"use client";

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { PhotoIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';
import { users } from '@/services/api';
import { useImageUrl } from '@/utils/useImageUrl';
import { useAuthStore } from '@/stores/authStore';

export default function EditMyProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    username: '',
    bio: '',
  });
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hook para manejar la imagen de perfil actual
  const currentProfilePictureKey = user?.profilePicture || '';
  const { url: currentProfileImageUrl } = useImageUrl(currentProfilePictureKey);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await users.getProfile();
        const userData = response.data;
        setFormData({
          name: userData.name,
          username: userData.username,
          bio: userData.bio || '',
        });
        // No establecer previewUrl aquí, se manejará con useImageUrl
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Error loading profile');
      }
    };
    fetchProfile();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image');
      return;
    }

    if (file.size > 50 * 1024 * 1024) {
      toast.error('Image should not exceed 50MB');
      return;
    }

    setProfilePicture(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setProfilePicture(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error('Name is required');
      return;
    }

    if (!formData.username.trim()) {
      toast.error('Username is required');
      return;
    }

    try {
      setLoading(true);

      // Primero actualizar la foto de perfil si hay una nueva
      if (profilePicture) {
        const photoFormData = new FormData();
        photoFormData.append('profilePicture', profilePicture);
        await users.uploadProfilePicture(photoFormData);
      }

      // Luego actualizar el resto de la información
      await users.updateProfile({
        name: formData.name,
        username: formData.username,
        bio: formData.bio
      });
      
      toast.success('Profile updated successfully!');
      router.push('/dashboard/profile');
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 py-12 flex flex-col items-center justify-center">
      <div className="w-full max-w-lg glass-strong rounded-2xl shadow-strong p-8 border border-gray-200 dark:border-gray-700 backdrop-blur-md">
        <h1 className="text-2xl font-extrabold text-center text-gray-900 dark:text-gray-100 mb-8 tracking-tight">Edit my profile</h1>
        <form onSubmit={handleSubmit} className="space-y-8">
          <div className="flex flex-col items-center">
            <div className="relative w-32 h-32 mb-4 group">
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover rounded-full border-4 border-white dark:border-gray-800 shadow-glow group-hover:shadow-glow-accent transition-all duration-300"
                />
              ) : currentProfileImageUrl ? (
                <Image
                  src={currentProfileImageUrl}
                  alt="Current profile"
                  fill
                  className="object-cover rounded-full border-4 border-white dark:border-gray-800 shadow-glow group-hover:shadow-glow-accent transition-all duration-300"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                  <PhotoIcon className="h-16 w-16 text-white/70" />
                </div>
              )}
              {(previewUrl || currentProfileImageUrl) && (
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md"
                  title="Remove photo"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
            <label
              htmlFor="profilePicture"
              className="cursor-pointer text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium transition-colors"
            >
              Change profile photo
              <input
                id="profilePicture"
                name="profilePicture"
                type="file"
                ref={fileInputRef}
                accept="image/*"
                onChange={handleImageChange}
                className="sr-only"
              />
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">PNG, JPG, GIF, HEIC until 50MB</p>
          </div>

          <div>
            <label htmlFor="name" className="form-label">Name</label>
            <input
              type="text"
              name="name"
              id="name"
              value={formData.name}
              onChange={handleInputChange}
              className="input-field mt-1"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label htmlFor="username" className="form-label">Username</label>
            <input
              type="text"
              name="username"
              id="username"
              value={formData.username}
              onChange={handleInputChange}
              className="input-field mt-1"
              autoComplete="off"
              required
            />
          </div>

          <div>
            <label htmlFor="bio" className="form-label">Biography</label>
            <textarea
              name="bio"
              id="bio"
              rows={4}
              value={formData.bio}
              onChange={handleInputChange}
              className="input-field mt-1 resize-none"
            />
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="btn btn-secondary btn-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-md shadow-glow disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 