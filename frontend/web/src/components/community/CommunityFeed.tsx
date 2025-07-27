'use client';

import { useState, useEffect } from 'react';
import { posts } from '@/services/api';
import { Post } from '@/types/post';
import PostCard from './PostCard';
import { FunnelIcon, ChevronDownIcon, UserIcon, UserGroupIcon, MapPinIcon } from '@heroicons/react/24/outline';

type FilterType = 'creator' | 'community';

interface CommunityFeedProps {
  communityId: string;
  isCreator?: boolean;
}

export default function CommunityFeed({ communityId, isCreator = false }: CommunityFeedProps) {
  const [postsList, setPostsList] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterType>('creator'); // Por defecto "Del creador"
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filterOptions = [
    { 
      value: 'creator', 
      label: 'By creator', 
      icon: UserIcon,
      description: 'Posts by the community founder'
    },
    { 
      value: 'community', 
      label: 'By community', 
      icon: UserGroupIcon,
      description: 'Posts by all members'
    }
  ];

  const currentFilter = filterOptions.find(option => option.value === filter);

  useEffect(() => {
    loadPosts();
  }, [communityId, filter]);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const response = await posts.getCommunityPostsFiltered(communityId, filter);
      setPostsList(Array.isArray(response.data.posts) ? response.data.posts : []);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Error al cargar los posts');
      setPostsList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (newFilter: FilterType) => {
    setFilter(newFilter);
    setIsDropdownOpen(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 dark:border-primary-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtro Dropdown Mejorado */}
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
            Community posts
          </h2>
          {filter === 'creator' && (
            <div className="flex items-center space-x-1 text-amber-600 dark:text-amber-400">
              <MapPinIcon className="w-4 h-4" />
              <span className="text-sm font-medium">Featured first</span>
            </div>
          )}
        </div>
        
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-3 px-4 py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
          >
            <FunnelIcon className="h-5 w-5 text-primary-600 dark:text-primary-400" />
            {currentFilter && (
              <currentFilter.icon className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
            <div className="hidden sm:block text-left">
              <div className="text-gray-700 dark:text-gray-300 font-medium">
                {currentFilter?.label}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                {currentFilter?.description}
              </div>
            </div>
            <ChevronDownIcon className={`h-4 w-4 text-gray-500 dark:text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu Mejorado */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
              {filterOptions.map((option) => {
                const IconComponent = option.icon;
                return (
          <button
                    key={option.value}
                    onClick={() => handleFilterChange(option.value as FilterType)}
                    className={`w-full flex items-center space-x-4 px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      filter === option.value 
                        ? 'bg-primary-50 dark:bg-primary-900/20 border-r-4 border-primary-500' 
                        : ''
                    }`}
                  >
                    <div className={`p-2 rounded-lg ${
                      filter === option.value 
                        ? 'bg-primary-100 dark:bg-primary-800/30' 
                        : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      <IconComponent className={`w-5 h-5 ${
                        filter === option.value 
                          ? 'text-primary-600 dark:text-primary-400' 
                          : 'text-gray-600 dark:text-gray-400'
                      }`} />
                    </div>
                    <div className="flex-1">
                      <div className={`font-medium ${
                        filter === option.value 
                          ? 'text-primary-700 dark:text-primary-400' 
                          : 'text-gray-700 dark:text-gray-300'
                      }`}>
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {option.description}
                      </div>
                    </div>
                    {filter === option.value && (
                      <div className="text-primary-600 dark:text-primary-400">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
          </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lista de posts */}
      <div className="space-y-6">
        {postsList.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              {filter === 'creator' ? (
                <UserIcon className="w-8 h-8 text-gray-400" />
              ) : (
                <UserGroupIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
              No posts {filter === 'creator' ? 'by the creator' : 'by the community'} yet
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {filter === 'creator' 
                ? 'The founder has not shared any featured content yet'
                : 'The members have not started sharing content yet'
              }
            </p>
          </div>
        ) : (
          postsList.map((post) => (
            <PostCard 
              key={post._id} 
              post={post} 
              onPostUpdated={loadPosts}
              isCreator={isCreator}
              showPinOption={true}
            />
          ))
        )}
      </div>
    </div>
  );
} 