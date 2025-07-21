'use client';

import { ArrowTrendingUpIcon } from '@heroicons/react/24/outline';

export default function TrendingPage() {
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
        <div className="text-center">
          <ArrowTrendingUpIcon className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Trending
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Discover the most popular posts and communities
          </p>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-yellow-800 dark:text-yellow-200 text-sm">
              🚧 This feature is under development. Soon you will be able to see the trending content.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
} 