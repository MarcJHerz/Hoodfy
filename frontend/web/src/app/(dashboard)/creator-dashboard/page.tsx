'use client';

import React, { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { useRouter } from 'next/navigation';
import { 
  PlusIcon, 
  CreditCardIcon, 
  UserGroupIcon, 
  ChartBarIcon,
  CogIcon,
  EyeIcon,
  PencilIcon
} from '@heroicons/react/24/outline';
import { useIsCreator } from '@/hooks/useIsCreator';
import CreatorPaymentsDashboard from '@/components/community/CreatorPaymentsDashboard';

interface Community {
  _id: string;
  name: string;
  description: string;
  profilePicture?: string;
  memberCount: number;
  postCount: number;
  stripeConnectStatus?: string;
  stripeConnectAccountId?: string;
  createdAt: string;
}

export default function CreatorDashboardPage() {
  const { user, token } = useAuthStore();
  const router = useRouter();
  const { isCreator, userCommunities, isLoading } = useIsCreator();
  const [communities, setCommunities] = useState<Community[]>([]);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (!isLoading && !isCreator) {
      router.push('/dashboard');
      return;
    }

    if (userCommunities.length > 0) {
      setCommunities(userCommunities);
    }
  }, [user, isCreator, isLoading, userCommunities, router]);

  const handleCreateCommunity = () => {
    router.push('/communities/create');
  };

  const handleViewCommunity = (communityId: string) => {
    router.push(`/communities/${communityId}`);
  };

  const handleEditCommunity = (communityId: string) => {
    router.push(`/communities/${communityId}/edit`);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading Creator Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isCreator) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
            <UserGroupIcon className="w-10 h-10 text-gray-400" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Creator Access Required
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            You need to create a community first to access the Creator Dashboard.
          </p>
          <button
            onClick={handleCreateCommunity}
            className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2 mx-auto"
          >
            <PlusIcon className="w-5 h-5" />
            Create Your First Community
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Creator Dashboard
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage your communities and track your earnings
              </p>
            </div>
            <button
              onClick={handleCreateCommunity}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors duration-200 flex items-center gap-2"
            >
              <PlusIcon className="w-5 h-5" />
              Create Community
            </button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                <UserGroupIcon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Communities</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{communities.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
                <ChartBarIcon className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Members</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {communities.reduce((sum, community) => sum + (community.memberCount || 0), 0)}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                <CreditCardIcon className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Payments</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {communities.filter(c => c.stripeConnectStatus === 'active').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                <CogIcon className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Setup</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {communities.filter(c => !c.stripeConnectAccountId).length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Communities Grid */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Your Communities
          </h2>
          
          {communities.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-6">
                <UserGroupIcon className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No communities yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first community to start building and earning
              </p>
              <button
                onClick={handleCreateCommunity}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors duration-200"
              >
                Create Community
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {communities.map((community) => (
                <div
                  key={community._id}
                  className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
                >
                  {/* Community Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {community.name}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                          {community.description}
                        </p>
                      </div>
                    </div>

                    {/* Community Stats */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {community.memberCount || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Members</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                          {community.postCount || 0}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Posts</p>
                      </div>
                    </div>

                    {/* Payment Status */}
                    <div className="mb-4">
                      <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        community.stripeConnectStatus === 'active' 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                          : community.stripeConnectAccountId 
                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400'
                      }`}>
                        <div className={`w-2 h-2 rounded-full mr-2 ${
                          community.stripeConnectStatus === 'active' 
                            ? 'bg-green-400'
                            : community.stripeConnectAccountId 
                            ? 'bg-yellow-400'
                            : 'bg-gray-400'
                        }`}></div>
                        {community.stripeConnectStatus === 'active' 
                          ? 'Payments Active'
                          : community.stripeConnectAccountId 
                          ? 'Setup Pending'
                          : 'Setup Required'
                        }
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewCommunity(community._id)}
                        className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <EyeIcon className="w-4 h-4" />
                        View
                      </button>
                      <button
                        onClick={() => handleEditCommunity(community._id)}
                        className="flex-1 bg-primary-100 dark:bg-primary-900/20 hover:bg-primary-200 dark:hover:bg-primary-800/30 text-primary-700 dark:text-primary-400 font-medium py-2 px-3 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2"
                      >
                        <PencilIcon className="w-4 h-4" />
                        Edit
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payments Dashboard */}
        {communities.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Payments Overview
            </h2>
            <CreatorPaymentsDashboard
              communityId={communities[0]._id}
              isCreator={true}
              stripeConnectStatus={communities[0].stripeConnectStatus}
              stripeConnectAccountId={communities[0].stripeConnectAccountId}
            />
          </div>
        )}
      </div>
    </div>
  );
}
