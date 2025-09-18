'use client';

import { Fragment, useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { 
  XMarkIcon, 
  UsersIcon, 
  UserPlusIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
  PlusIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import { users, communities } from '@/services/api';
import { Community } from '@/types';
import { useImageUrl } from '@/utils/useImageUrl';
import Image from 'next/image';
import Link from 'next/link';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '@/stores/authStore';

interface SharedCommunitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUser: {
    _id: string;
    name: string;
    username: string;
    profilePicture?: string;
  };
  onAllyAdded?: () => void;
  sharedCommunities?: Community[];
}

interface CommunityCard {
  community: Community;
  userRole: 'creator' | 'member';
  currentUserStatus: 'not_member' | 'member' | 'creator';
}

export default function SharedCommunitiesModal({ 
  isOpen, 
  onClose, 
  targetUser,
  onAllyAdded,
  sharedCommunities
}: SharedCommunitiesModalProps) {
  const { user: currentUser } = useAuthStore();
  const [targetUserCommunities, setTargetUserCommunities] = useState<CommunityCard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fetch target user's communities
  useEffect(() => {
    if (isOpen && currentUser) {
      if (sharedCommunities && sharedCommunities.length > 0) {
        // Usar las comunidades compartidas proporcionadas
        const communityCards: CommunityCard[] = sharedCommunities.map(community => ({
          community,
          userRole: 'member', // Asumimos que es miembro por simplicidad
          currentUserStatus: 'member' // Ya que son comunidades compartidas
        }));
        setTargetUserCommunities(communityCards);
        setIsLoading(false);
      } else {
        fetchTargetUserCommunities();
      }
    }
  }, [isOpen, currentUser, targetUser._id, sharedCommunities]);

  const fetchTargetUserCommunities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Obtener comunidades del usuario objetivo
      const [targetUserCreated, targetUserJoined] = await Promise.all([
        users.getCreatedCommunities(targetUser._id),
        users.getJoinedCommunities(targetUser._id)
      ]);

      // Obtener comunidades del usuario actual para verificar estado
      const [currentUserCreated, currentUserJoined] = await Promise.all([
        users.getCreatedCommunities(currentUser!._id),
        users.getJoinedCommunities(currentUser!._id)
      ]);

      // Crear mapa de comunidades del usuario actual
      const currentUserCommunitiesMap = new Map();
      
      currentUserCreated.data.forEach((community: Community) => {
        currentUserCommunitiesMap.set(community._id, 'creator');
      });
      
      currentUserJoined.data.forEach((community: Community) => {
        if (!currentUserCommunitiesMap.has(community._id)) {
          currentUserCommunitiesMap.set(community._id, 'member');
        }
      });

      // Procesar comunidades del usuario objetivo
      const allTargetCommunities: CommunityCard[] = [];
      
      // Agregar comunidades creadas por el usuario objetivo
      targetUserCreated.data.forEach((community: Community) => {
        const currentUserStatus = currentUserCommunitiesMap.has(community._id) 
          ? currentUserCommunitiesMap.get(community._id)
          : 'not_member';
          
        allTargetCommunities.push({
          community,
          userRole: 'creator',
          currentUserStatus
        });
      });
      
      // Agregar comunidades donde el usuario objetivo es miembro
      targetUserJoined.data.forEach((community: Community) => {
        // Evitar duplicados
        const exists = allTargetCommunities.some(item => item.community._id === community._id);
        if (!exists) {
          const currentUserStatus = currentUserCommunitiesMap.has(community._id) 
            ? currentUserCommunitiesMap.get(community._id)
            : 'not_member';
            
          allTargetCommunities.push({
            community,
            userRole: 'member',
            currentUserStatus
          });
        }
      });

      setTargetUserCommunities(allTargetCommunities);
    } catch (error: any) {
      console.error('Error fetching target user communities:', error);
      setError('Error loading communities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const availableToJoin = targetUserCommunities.filter(item => item.currentUserStatus === 'not_member');

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-xl transition-all border border-gray-200 dark:border-gray-700">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                      <UserPlusIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="text-left">
                      <Dialog.Title
                        as="h3"
                        className="text-xl font-bold text-gray-900 dark:text-gray-100"
                      >
                        Become allies with {targetUser.name}
                      </Dialog.Title>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Join one of their communities
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Explanation */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <SparklesIcon className="w-4 h-4 text-white" />
                      </div>
                      <div className="text-left">
                        <h4 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                          How to become allies
                        </h4>
                        <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">
                          To become allies with {targetUser.name}, you need to join at least one of the communities they belong to. 
                          Once you're both in the same community, you'll automatically become allies!
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="relative">
                        <div className="w-10 h-10 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin"></div>
                        <div className="absolute inset-0 w-10 h-10 border-4 border-transparent border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
                      </div>
                      <span className="ml-3 text-gray-600 dark:text-gray-400">Loading {targetUser.name}'s communities...</span>
                    </div>
                  )}

                  {/* Error State */}
                  {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl p-4 mb-6">
                      <div className="flex items-center gap-3">
                        <ExclamationTriangleIcon className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
                        <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
                      </div>
                    </div>
                  )}

                  {/* Target User Communities */}
                  {!isLoading && !error && (
                    <>
                      {targetUserCommunities.length > 0 ? (
                        <div>
                          <div className="flex items-center gap-2 mb-4">
                            <UsersIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                              {targetUser.name}'s Communities ({targetUserCommunities.length})
                            </h4>
                          </div>

                          {availableToJoin.length > 0 && (
                            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-4 mb-4">
                              <div className="flex items-center gap-3 mb-2">
                                <CheckIcon className="w-5 h-5 text-green-600 dark:text-green-400" />
                                <p className="font-medium text-green-900 dark:text-green-100">
                                  {availableToJoin.length} communities available to join
                                </p>
                              </div>
                              <p className="text-sm text-green-800 dark:text-green-200">
                                Join any of these communities to automatically become allies with {targetUser.name}!
                              </p>
                            </div>
                          )}
                          
                          <div className="grid gap-3 max-h-64 overflow-y-auto">
                            {targetUserCommunities.map(({ community, userRole, currentUserStatus }) => (
                              <CommunityCard 
                                key={community._id} 
                                community={community}
                                userRole={userRole}
                                currentUserStatus={currentUserStatus}
                                targetUserName={targetUser.name}
                              />
                            ))}
                          </div>

                          {availableToJoin.length === 0 && (
                            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-xl p-4 mt-4">
                              <div className="flex items-center gap-3">
                                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                <div>
                                  <p className="font-medium text-yellow-900 dark:text-yellow-100">
                                    You're already in all their communities!
                                  </p>
                                  <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                                    If you're not allies yet, please refresh the page or check your ally status.
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                            <UsersIcon className="w-8 h-8 text-gray-400" />
                          </div>
                          <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            No Communities Found
                          </h4>
                          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                            {targetUser.name} hasn't joined or created any communities yet.
                            You can still explore other communities!
                          </p>
                          <Link
                            href="/communities"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors duration-200"
                            onClick={onClose}
                          >
                            <UsersIcon className="w-5 h-5" />
                            Explore All Communities
                          </Link>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

// Community Card Component
function CommunityCard({ 
  community, 
  userRole, 
  currentUserStatus,
  targetUserName 
}: {
  community: Community;
  userRole: 'creator' | 'member';
  currentUserStatus: 'not_member' | 'member' | 'creator';
  targetUserName: string;
}) {
  const { url: coverImageUrl } = useImageUrl(community.coverImage);

  const getRoleColor = (role: 'creator' | 'member') => {
    return role === 'creator' 
      ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300'
      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300';
  };

  const getRoleIcon = (role: 'creator' | 'member') => {
    return role === 'creator' ? '👑' : '👥';
  };

  const getStatusButton = () => {
    switch (currentUserStatus) {
      case 'creator':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300 rounded-full text-xs font-medium">
            👑 You created this
          </span>
        );
      case 'member':
        return (
          <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300 rounded-full text-xs font-medium">
            ✅ You're a member
          </span>
        );
      case 'not_member':
        return (
          <Link 
            href={`/dashboard/communities/${community._id}`}
            className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-medium transition-colors duration-200"
          >
            <PlusIcon className="w-3 h-3" />
            Join Community
          </Link>
        );
    }
  };

  return (
    <div className="group bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 transition-all duration-200">
      <div className="flex items-center gap-4">
        {/* Community Image */}
        <Link href={`/dashboard/communities/${community._id}`} className="flex-shrink-0">
          <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700 cursor-pointer hover:scale-105 transition-transform duration-200">
            <Image
              src={coverImageUrl}
              alt={community.name}
              width={48}
              height={48}
              className="w-full h-full object-cover"
              unoptimized
            />
          </div>
        </Link>

        {/* Community Info */}
        <div className="flex-1 min-w-0">
          <Link href={`/dashboard/communities/${community._id}`}>
            <h5 className="font-semibold text-gray-900 dark:text-gray-100 truncate hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer">
              {community.name}
            </h5>
          </Link>
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-1 mb-2">
            {community.description || 'No description available'}
          </p>
          
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(userRole)}`}>
              {getRoleIcon(userRole)} {targetUserName} is {userRole}
            </span>
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <UsersIcon className="w-3 h-3" />
              <span>{community.members?.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Status/Action */}
        <div className="flex-shrink-0">
          {getStatusButton()}
        </div>
      </div>
    </div>
  );
} 