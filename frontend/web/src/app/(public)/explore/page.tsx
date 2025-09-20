'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  UserGroupIcon, 
  EyeIcon, 
  CalendarIcon, 
  SparklesIcon,
  LockClosedIcon,
  MagnifyingGlassIcon,
  FunnelIcon
} from '@heroicons/react/24/outline';

// Custom styles for line-clamp
const styles = `
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
`;


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
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.hoodfy.com';
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <style dangerouslySetInnerHTML={{ __html: styles }} />
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-gradient-to-r from-white/5 to-transparent"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="text-center max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 text-sm font-medium mb-6">
              <SparklesIcon className="w-4 h-4" />
              <span>Discover Amazing Communities</span>
            </div>
            
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-extrabold mb-4 sm:mb-6 leading-tight">
              Find Your
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-300 to-red-300 animate-pulse">
                Perfect Community
              </span>
            </h1>
            
            <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 leading-relaxed max-w-3xl mx-auto">
              Connect with like-minded people, share your passions, and be part of something extraordinary. 
              Your digital tribe is waiting for you.
            </p>
            
            {/* Search Bar */}
            <div className="max-w-2xl mx-auto mb-8">
              <div className="relative">
                <MagnifyingGlassIcon className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-6 sm:h-6 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search communities by name or description..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 sm:py-4 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all duration-200 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">{communities.length}+</div>
                <div className="text-sm sm:text-base text-white/80">Communities</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">1000+</div>
                <div className="text-sm sm:text-base text-white/80">Members</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">24/7</div>
                <div className="text-sm sm:text-base text-white/80">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl sm:text-3xl font-bold">Free</div>
                <div className="text-sm sm:text-base text-white/80">To Join</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 sm:gap-6 mb-6 sm:mb-8">
          {/* Category Filter */}
          <div className="w-full lg:w-auto">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Filter by Category</h3>
            <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-hide">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      selectedCategory === category.id
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg transform scale-105'
                        : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-md border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sort Options */}
          <div className="w-full lg:w-auto">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Sort by</h3>
            <div className="flex items-center gap-2">
              <FunnelIcon className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'popular' | 'recent' | 'name')}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
              >
                <option value="popular">Most Popular</option>
                <option value="recent">Recently Created</option>
                <option value="name">Alphabetical</option>
              </select>
            </div>
          </div>
        </div>

        {/* Communities Grid */}
        {filteredAndSortedCommunities.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredAndSortedCommunities.map((community) => (
              <Link
                key={community._id}
                href={`/communities/${community._id}`}
                className="group block bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105 overflow-hidden cursor-pointer border border-gray-100 dark:border-gray-700"
              >
                {/* Community Cover Image */}
                <div className="relative h-40 sm:h-48 overflow-hidden">
                  {community.coverImage ? (
                    <Image
                      src={community.coverImage.startsWith('http') ? community.coverImage : `https://hoodfy-community-media.s3.us-east-1.amazonaws.com/${community.coverImage}`}
                      alt={community.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-indigo-400 via-purple-500 to-pink-500 flex items-center justify-center">
                      <UserGroupIcon className="w-12 h-12 sm:w-16 sm:h-16 text-white/80" />
                    </div>
                  )}
                  
                  {/* Overlay Gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  
                  {/* Price Badge */}
                  {community.isFree ? (
                    <div className="absolute top-3 right-3 bg-green-500 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      FREE
                    </div>
                  ) : (
                    <div className="absolute top-3 right-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-2 sm:px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                      ${community.price}
                    </div>
                  )}

                  {/* Privacy Badge */}
                  {community.isPrivate && (
                    <div className="absolute top-3 left-3 bg-gray-800/90 backdrop-blur-sm text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 shadow-lg">
                      <LockClosedIcon className="w-3 h-3" />
                      Private
                    </div>
                  )}

                  {/* Category Badge */}
                  {community.category && (
                    <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 px-2 py-1 rounded-full text-xs font-medium shadow-lg">
                      {community.category}
                    </div>
                  )}
                </div>

                {/* Community Info */}
                <div className="p-4 sm:p-6">
                  <div className="mb-3">
                    <h3 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-200 line-clamp-2">
                      {community.name}
                    </h3>
                  </div>

                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4 line-clamp-2 leading-relaxed">
                    {community.description || 'Join this amazing community and connect with like-minded people.'}
                  </p>

                  {/* Community Stats */}
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center gap-1">
                      <UserGroupIcon className="w-4 h-4" />
                      <span className="font-medium">{community.members?.length || 0}</span>
                      <span className="hidden sm:inline">members</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <CalendarIcon className="w-4 h-4" />
                      <span className="hidden sm:inline">{new Date(community.createdAt || '').toLocaleDateString()}</span>
                      <span className="sm:hidden">{new Date(community.createdAt || '').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    </div>
                  </div>

                  {/* Creator Info */}
                  {community.creator && (
                    <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-700/50 dark:to-gray-600/50 rounded-xl">
                      <div className="w-8 h-8 rounded-full overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                        {community.creator.profilePicture ? (
                          <Image
                            src={community.creator.profilePicture.startsWith('http') ? community.creator.profilePicture : `https://hoodfy-community-media.s3.us-east-1.amazonaws.com/${community.creator.profilePicture}`}
                            alt={community.creator.name}
                            width={32}
                            height={32}
                            className="object-cover"
                          />
                        ) : (
                          <span className="text-white text-sm font-bold">
                            {community.creator.name.charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {community.creator.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Community Creator
                        </p>
                      </div>
                      <div className="text-indigo-600 dark:text-indigo-400">
                        <SparklesIcon className="w-4 h-4" />
                      </div>
                    </div>
                  )}

                  {/* Join Button */}
                  <div className="mt-4">
                    <div className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-center py-2 px-4 rounded-xl font-medium text-sm group-hover:from-indigo-700 group-hover:to-purple-700 transition-all duration-200">
                      Join Community
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 sm:py-16 lg:py-20">
            <div className="max-w-md mx-auto">
              <div className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-br from-indigo-100 to-purple-100 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <SparklesIcon className="w-10 h-10 sm:w-12 sm:h-12 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                No communities found
              </h3>
              <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm sm:text-base">
                {searchTerm || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'Be the first to create an amazing community and connect with others!'
                }
              </p>
              {!searchTerm && selectedCategory === 'all' ? (
                <div className="space-y-4">
                  <Link
                    href="/register"
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium px-6 py-3 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <SparklesIcon className="w-5 h-5" />
                    Create Your Community
                  </Link>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    It's free and takes less than 2 minutes
                  </p>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="inline-flex items-center gap-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium px-6 py-3 rounded-xl transition-all duration-200"
                >
                  Clear Filters
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
