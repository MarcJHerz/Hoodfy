'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  UserGroupIcon, 
  EyeIcon, 
  CalendarIcon, 
  StarIcon, 
  SparklesIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  MapPinIcon,
  FireIcon
} from '@heroicons/react/24/outline';
import { useImageUrl } from '@/utils/useImageUrl';

interface Community {
  _id: string;
  name: string;
  description?: string;
  coverImage?: string;
  price?: number;
  isFree?: boolean;
  members?: any[];
  creator?: {
    _id: string;
    name: string;
    profilePicture?: string;
  };
  posts?: any[];
  createdAt?: string;
  category?: string;
  isPrivate?: boolean;
  location?: string;
}

export default function ExplorePage() {
  const [communities, setCommunities] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'name'>('popular');

  // Available categories
  const categories = [
    { id: 'all', name: 'All', icon: SparklesIcon },
    { id: 'technology', name: 'Technology', icon: SparklesIcon },
    { id: 'business', name: 'Business', icon: SparklesIcon },
    { id: 'health', name: 'Health', icon: SparklesIcon },
    { id: 'education', name: 'Education', icon: SparklesIcon },
    { id: 'entertainment', name: 'Entertainment', icon: SparklesIcon },
    { id: 'sports', name: 'Sports', icon: SparklesIcon },
    { id: 'lifestyle', name: 'Lifestyle', icon: SparklesIcon }
  ];

  // Load public communities
  useEffect(() => {
    const loadPublicCommunities = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NODE_ENV === 'production' 
          ? 'https://api.hoodfy.com' 
          : 'http://localhost:5000';
        const response = await fetch(`${apiUrl}/api/communities/public`);
        
        if (!response.ok) {
          throw new Error('Error loading communities');
        }
        
        const data = await response.json();
        setCommunities(data.communities || data || []);
      } catch (error: any) {
        console.error('Error loading communities:', error);
        setError(error.message || 'Error loading communities');
      } finally {
        setLoading(false);
      }
    };

    loadPublicCommunities();
  }, []);

  // Filter and sort communities
  const filteredAndSortedCommunities = communities
    .filter(community => {
      const matchesSearch = community.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           community.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || community.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'popular':
          return (b.members?.length || 0) - (a.members?.length || 0);
        case 'recent':
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-2 border-primary-600 dark:border-primary-400 border-t-transparent mx-auto mb-6"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <SparklesIcon className="w-8 h-8 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Exploring communities
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              Discovering the best communities for you...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <SparklesIcon className="w-10 h-10 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              Loading Error
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {error}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-primary-600 via-accent-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
              Discover Extraordinary
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-orange-300">
                Communities
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 leading-relaxed">
              Connect with people who share your interests. Find your digital tribe and 
              be part of something bigger than yourself.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search communities by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
          {/* Category Filter */}
          <div className="flex items-center space-x-2 overflow-x-auto pb-2">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-full font-medium transition-all duration-200 whitespace-nowrap ${
                    selectedCategory === category.id
                      ? 'bg-primary-600 text-white shadow-lg'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{category.name}</span>
                </button>
              );
            })}
          </div>

          {/* Sort Options */}
          <div className="flex items-center space-x-2">
            <FunnelIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'popular' | 'recent' | 'name')}
              className="px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            >
              <option value="popular">Most Popular</option>
              <option value="recent">Most Recent</option>
              <option value="name">By Name</option>
            </select>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600 dark:text-gray-400">
            Showing <span className="font-semibold text-primary-600 dark:text-primary-400">
              {filteredAndSortedCommunities.length}
            </span> of <span className="font-semibold">
              {communities.length}
            </span> communities
          </p>
        </div>

        {/* Communities Grid */}
        {filteredAndSortedCommunities.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedCommunities.map((community) => {
              const coverImageKey = community.coverImage || '';
              const { url: communityCoverImageUrl } = useImageUrl(coverImageKey);
              
              return (
                <Link
                  key={community._id}
                  href={`/communities/${community._id}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-2xl transition-all duration-300 hover-lift transform hover:-translate-y-1"
                >
                  {/* Cover Image */}
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={communityCoverImageUrl || '/images/defaults/default-community.png'}
                      alt={community.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      unoptimized
                      onError={(e) => {
                        e.currentTarget.src = '/images/defaults/default-community.png';
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    
                    {/* Status Badges */}
                    <div className="absolute top-3 left-3 flex flex-wrap gap-2">
                      {community.isPrivate && (
                        <span className="bg-purple-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                          <LockClosedIcon className="w-3 h-3 mr-1" />
                          Private
                        </span>
                      )}
                      {(community.members?.length || 0) > 10 && (
                        <span className="bg-gradient-to-r from-red-500 to-pink-500 text-white px-2 py-1 rounded-full text-xs font-semibold flex items-center animate-pulse">
                          <FireIcon className="w-3 h-3 mr-1" />
                          Trending
                        </span>
                      )}
                    </div>

                    {/* Price Badge */}
                    <div className="absolute top-3 right-3">
                      {community.isFree ? (
                        <span className="bg-green-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                          FREE
                        </span>
                      ) : (
                        <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                          ${community.price}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6">
                    {/* Title */}
                    <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors line-clamp-2">
                      {community.name}
                    </h3>
                    
                    {/* Description */}
                    {community.description && (
                      <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3 leading-relaxed">
                        {community.description}
                      </p>
                    )}

                    {/* Stats */}
                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                      <div className="flex items-center space-x-1">
                        <UserGroupIcon className="w-4 h-4" />
                        <span>{community.members?.length || 0} members</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <EyeIcon className="w-4 h-4" />
                        <span>{Math.floor(Math.random() * 1000) + 100}</span>
                      </div>
                    </div>

                    {/* Creator Info */}
                    {community.creator && (
                      <div className="flex items-center space-x-3 pt-4 border-t border-gray-200 dark:border-gray-600">
                        <div className="relative">
                          <Image
                            src={community.creator.profilePicture || '/images/defaults/default-avatar.png'}
                            alt={community.creator.name}
                            width={32}
                            height={32}
                            className="rounded-full object-cover ring-2 ring-primary-200 dark:ring-primary-700"
                            unoptimized
                          />
                          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full flex items-center justify-center">
                            <StarIcon className="w-1.5 h-1.5 text-white" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {community.creator.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Community founder
                          </p>
                        </div>
                      </div>
                    )}

                    {/* CTA Button */}
                    <div className="mt-4">
                      <div className="w-full bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white text-center py-3 rounded-xl font-semibold transition-all duration-200 group-hover:shadow-lg">
                        Explore Community
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
              <MagnifyingGlassIcon className="w-12 h-12 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
              No communities found
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'all' 
                ? 'Try adjusting your search filters or selected category.'
                : 'It seems there are no communities available at the moment.'
              }
            </p>
            {(searchTerm || selectedCategory !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('all');
                }}
                className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-lg transition-colors duration-200"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-gray-900 to-gray-800 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Can't find what you're looking for?
          </h2>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Join Hoodfy and create your own community. Connect with people who share 
            your passions and build something extraordinary together.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="px-8 py-4 bg-gradient-to-r from-primary-600 to-accent-600 hover:from-primary-700 hover:to-accent-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 hover-lift group"
            >
              <span className="flex items-center">
                Create my account
                <SparklesIcon className="w-5 h-5 ml-2 group-hover:animate-spin" />
              </span>
            </Link>
            <Link
              href="/login"
              className="px-8 py-4 bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 text-white font-semibold rounded-xl transition-all duration-200"
            >
              I already have an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
