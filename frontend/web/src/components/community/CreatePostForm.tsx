'use client';

import React, { useState, useRef } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { posts } from '../../services/api';
import { toast } from 'react-hot-toast';
import { PhotoIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import { CreatePostModal } from '../CreatePostModal';

interface CreatePostFormProps {
  communityId: string;
  onPostCreated: () => void;
}

export const CreatePostForm: React.FC<CreatePostFormProps> = ({ communityId, onPostCreated }) => {
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setSelectedFiles(files);
      setIsCreatePostModalOpen(true);
    }
  };

  const handleCreatePost = () => {
    setSelectedFiles([]);
    onPostCreated();
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <button
            onClick={() => setIsCreatePostModalOpen(true)}
            className="w-full text-left p-4 border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:focus:ring-primary-400 transition-all"
          >
            ¿Qué quieres compartir en esta comunidad?
          </button>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all duration-200 hover-lift"
            title="Subir imagen"
          >
            <PhotoIcon className="h-6 w-6" />
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="p-3 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all duration-200 hover-lift"
            title="Subir video"
          >
            <VideoCameraIcon className="h-6 w-6" />
          </button>
        </div>
      </div>
      
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept=".jpg,.jpeg,.png,.gif,.webp,.mp4,.mov,.webm,.avi,.m4v,.3gp,.heic,.heif"
        multiple
        className="hidden"
      />

      {/* Modal de creación de post */}
      <CreatePostModal
        isOpen={isCreatePostModalOpen}
        onClose={() => setIsCreatePostModalOpen(false)}
        onPostCreated={handleCreatePost}
        communityId={communityId}
        postType="community"
        initialFiles={selectedFiles}
      />
    </div>
  );
}; 