'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Tab, Menu } from '@headlessui/react';
import { useAuthStore } from '@/stores/authStore';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { FaUsers, FaHeart, FaRegHeart, FaComment } from 'react-icons/fa';
import { 
  UserCircleIcon, 
  ChatBubbleLeftIcon,
  Cog6ToothIcon,
  UserPlusIcon,
  ShareIcon,
  EllipsisHorizontalIcon,
  UsersIcon,
  HeartIcon,
  BookmarkIcon,
  Squares2X2Icon,
  ViewColumnsIcon,
  TagIcon,
  LockClosedIcon,
  CheckBadgeIcon,
  UserGroupIcon
} from '@heroicons/react/24/outline';
import { 
  HeartIcon as HeartSolidIcon,
  BookmarkIcon as BookmarkSolidIcon 
} from '@heroicons/react/24/solid';
import { toast } from 'react-hot-toast';
import type { Community } from '@/types';
import { Post } from '@/types/post';
import { User, UserProfile } from '@/types/user';
import { users, posts, communities } from '@/services/api';
import api from '@/services/api';
import CommentsModal from '@/components/CommentsModal';
import PostCard from '@/components/PostCard';
import { useImageUrl } from '@/utils/useImageUrl';
import PrivateChatModal from '@/components/chat/PrivateChatModal';
import SharedCommunitiesModal from '@/components/SharedCommunitiesModal';

// Componente para manejar imágenes de comunidades individualmente
const CommunityImage = ({ coverImage, name }: { coverImage?: string; name: string }) => {
  const { url: communityImageUrl } = useImageUrl(coverImage || '');
  
  return (
    <div className="relative h-32 overflow-hidden">
      {coverImage ? (
        <Image
          src={communityImageUrl}
          alt={`${name} cover`}
          fill
          className="object-cover"
          unoptimized
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
          <UserGroupIcon className="w-12 h-12 text-white" />
        </div>
      )}
    </div>
  );
};

export default function PublicProfilePage() {
  const { id } = useParams();
  const router = useRouter();
  const { user: authUser } = useAuthStore();
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Asegurar que siempre pasemos un valor consistente al hook
  const userId = Array.isArray(id) ? id[0] : id;
  const { url: userImageUrl } = useImageUrl(user?.profilePicture);
  
  // Estados principales
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [createdCommunities, setCreatedCommunities] = useState<Community[]>([]);
  const [joinedCommunities, setJoinedCommunities] = useState<Community[]>([]);
  const [allies, setAllies] = useState<User[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isAlly, setIsAlly] = useState(false);
  const [allyCheckLoading, setAllyCheckLoading] = useState(true);
  const [isCommentsModalOpen, setIsCommentsModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isSharedCommunitiesModalOpen, setIsSharedCommunitiesModalOpen] = useState(false);

  // Combinamos comunidades creadas y unidas
  const allCommunities = [
    ...(Array.isArray(createdCommunities) ? createdCommunities : []), 
    ...(Array.isArray(joinedCommunities) ? joinedCommunities : [])
  ];

  const tabList = [
    { key: 'posts', label: 'Posts', icon: Squares2X2Icon },
    { key: 'communities', label: 'Communities', icon: UsersIcon },
    { key: 'allies', label: 'Allies', icon: UserPlusIcon },
    { key: 'about', label: 'About', icon: TagIcon },
  ];

  const handleLike = async (postId: string) => {
    if (!authUser) {
      toast.error('Please log in to like posts');
      return;
    }

    try {
      const post = userPosts.find(p => p._id === postId);
      if (!post || !authUser?._id) return;

      if (post.likes.includes(authUser._id)) {
        await posts.unlikePost(postId);
        post.likes = post.likes.filter(id => id !== authUser._id);
      } else {
        await posts.likePost(postId);
        post.likes.push(authUser._id);
      }

      setUserPosts([...userPosts]);
    } catch (error) {
      console.error('Error al dar like:', error);
      toast.error('Error al dar like al post');
    }
  };

  const handleCommentClick = (post: Post) => {
    if (!authUser) {
      toast.error('Please log in to comment');
      return;
    }
    setSelectedPost(post);
    setIsCommentsModalOpen(true);
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${user?.name} - Hoodfy Profile`,
        text: `Check out ${user?.name}'s profile on Hoodfy`,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Profile link copied to clipboard!');
    }
  };

  const handleAddAlly = async () => {
    if (!authUser) {
      toast.error('Please log in to add allies');
      return;
    }

    try {
      await api.post(`/api/users/add-ally/${userId}`);
      setIsAlly(true);
      toast.success('Ally added successfully!');
    } catch (error) {
      console.error('Error adding ally:', error);
      toast.error('Error adding ally');
    }
  };

  const handleRemoveAlly = async () => {
    if (!authUser) {
      toast.error('Please log in to manage allies');
      return;
    }

    try {
      await api.delete(`/api/users/remove-ally/${userId}`);
      setIsAlly(false);
      toast.success('Ally removed successfully!');
    } catch (error) {
      console.error('Error removing ally:', error);
      toast.error('Error removing ally');
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        if (!id) {
          setError('No profile specified');
          setLoading(false);
          return;
        }

        const userId = Array.isArray(id) ? id[0] : id;

        // Usar endpoint público para usuarios no registrados
        const userResponse = await api.get(`/api/users/public-profile/${userId}`);
        
        if (!userResponse.data) {
          throw new Error('Could not get user information');
        }
        setUser(userResponse.data);

        // Verificar si es el propio perfil (solo si está autenticado)
        const isOwn = authUser && userId === authUser._id;
        setIsOwnProfile(!!isOwn);

        // Si no es el propio perfil y está autenticado, verificar si son aliados
        if (!isOwn && authUser) {
          try {
            const allyResponse = await users.checkAlly(userId);
            setIsAlly(allyResponse.data.isAlly);
          } catch (error) {
            console.error('Error checking ally status:', error);
            setIsAlly(false);
          }
        } else {
          // Si no está autenticado, no son aliados
          setIsAlly(false);
        }
        setAllyCheckLoading(false);

        // Obtener posts públicos del usuario
        try {
          const postsResponse = await api.get(`/api/posts/public/user/${userId}`);
          setUserPosts(Array.isArray(postsResponse.data) ? postsResponse.data : []);
        } catch (error) {
          console.error('Error fetching user posts:', error);
          setUserPosts([]);
        }

        // Obtener comunidades creadas por el usuario
        try {
          const createdResponse = await api.get(`/api/communities/public/created-by/${userId}`);
          setCreatedCommunities(Array.isArray(createdResponse.data) ? createdResponse.data : []);
        } catch (error) {
          console.error('Error fetching created communities:', error);
          setCreatedCommunities([]);
        }

        // Obtener comunidades a las que se unió el usuario
        try {
          const joinedResponse = await api.get(`/api/communities/public/joined-by/${userId}`);
          setJoinedCommunities(Array.isArray(joinedResponse.data) ? joinedResponse.data : []);
        } catch (error) {
          console.error('Error fetching joined communities:', error);
          setJoinedCommunities([]);
        }

        // Obtener aliados (solo si es el propio perfil y está autenticado)
        let alliesData = [];
        if (authUser && userId === authUser._id) {
          try {
            const response = await users.getAllies();
            alliesData = Array.isArray(response.data?.allies) ? response.data.allies : [];
          } catch (error) {
            console.error('Error fetching allies:', error);
            alliesData = [];
          }
        }
        setAllies(Array.isArray(alliesData) ? alliesData : []);

      } catch (error: any) {
        console.error('Error fetching profile data:', error);
        setError(error.message || 'Error loading profile');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, authUser]);

  useEffect(() => {
    if (authUser && user) {
      setIsOwnProfile(authUser._id === user._id);
    }
  }, [authUser, user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Profile not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
          <button 
            onClick={() => router.push('/')}
            className="btn-primary btn-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 text-5xl mb-4">👤</div>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
            User not found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            This user doesn't exist or has been removed
          </p>
          <button 
            onClick={() => router.push('/')}
            className="btn-primary btn-md"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Profile Header - Optimized for mobile and consistent */}
      <div className="relative bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-soft rounded-b-3xl overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
          <div className="flex flex-col lg:flex-row gap-4 sm:gap-6 lg:gap-8 items-center lg:items-end">
            {/* Avatar - Reduced for mobile */}
              <div className="relative group">
              <div className="w-24 h-24 sm:w-32 sm:h-32 lg:w-44 lg:h-44 rounded-full overflow-hidden ring-4 ring-blue-400/30 dark:ring-blue-600/40 shadow-strong group-hover:shadow-glow transition-all duration-300 bg-white/30 dark:bg-gray-900/30 backdrop-blur-md">
                {user?.profilePicture ? (
                  <Image
                    src={userImageUrl}
                    alt={`${user.name}'s profile`}
                    width={176}
                    height={176}
                      className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                    unoptimized
                  />
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center rounded-full">
                    <span className="text-2xl sm:text-4xl lg:text-5xl font-bold text-white">
                        {user?.name?.charAt(0)?.toUpperCase()}
                      </span>
                    </div>
                  )}
          </div>
              {/* Estado online */}
              <div className="absolute bottom-1 right-1 sm:bottom-2 sm:right-2 w-4 h-4 sm:w-6 sm:h-6 lg:w-8 lg:h-8 bg-green-500 border-2 sm:border-4 border-white dark:border-gray-800 rounded-full animate-pulse shadow-glow" title="Online"></div>
              </div>
            
            {/* Info y acciones - Optimizado para móvil */}
            <div className="flex-1 text-center lg:text-left w-full">
              <div className="flex flex-col gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div>
                  <div className="flex items-center gap-2 justify-center lg:justify-start">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                    {user?.name}
                  </h1>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-base sm:text-lg">@{user?.username}</p>
                </div>
                
                {/* Botones de acción - Optimizados para móvil */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-3">
                  {authUser ? (
                    <>
                      {isOwnProfile ? (
                        <Link
                          href="/profile/edit"
                          className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 btn-secondary btn-sm sm:btn-lg shadow-soft hover:shadow-md text-sm sm:text-base"
                        >
                          <Cog6ToothIcon className="w-4 h-4" />
                          Edit
                        </Link>
                      ) : (
                        <>
                          {!isAlly && (
                            <button
                              onClick={handleAddAlly}
                              className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 btn-primary btn-sm sm:btn-lg shadow-glow hover:shadow-glow-accent text-sm sm:text-base"
                            >
                              <UserPlusIcon className="w-4 h-4" />
                              Add as Ally
                            </button>
                          )}
                          {isAlly && (
                            <div className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-sm sm:text-base">
                              <UserPlusIcon className="w-4 h-4" />
                              Ally
                            </div>
                          )}
                        </>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push('/register')}
                        className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 btn-primary btn-sm sm:btn-lg shadow-glow hover:shadow-glow-accent text-sm sm:text-base"
                      >
                        <UserPlusIcon className="w-4 h-4" />
                        Register
                      </button>
                      <button
                        onClick={() => router.push('/login')}
                        className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm sm:text-base"
                      >
                        Log In
                      </button>
                    </>
                  )}
                  
                  <button 
                    onClick={handleShare}
                    className="flex items-center gap-2 px-4 py-2 sm:px-6 sm:py-2.5 btn-secondary btn-sm sm:btn-lg shadow-soft hover:shadow-md text-sm sm:text-base"
                  >
                    <ShareIcon className="w-4 h-4" />
                    Share
                  </button>
                </div>
              </div>
              
              {/* Bio - Compacta en móvil */}
              {user?.bio && (
                <p className="text-gray-700 dark:text-gray-300 mb-4 sm:mb-6 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto lg:mx-0 line-clamp-3 sm:line-clamp-none">
                  {user.bio}
                </p>
              )}
              
              {/* Estadísticas compactas para móvil */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 lg:gap-6 text-center lg:text-left">
                <div className="bg-white/80 dark:bg-gray-800/80 glass-strong rounded-lg sm:rounded-xl px-3 py-2 sm:px-6 sm:py-4 shadow-soft hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mb-1">
                    <Squares2X2Icon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
                    <span className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{userPosts.length}</span>
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Posts</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 glass-strong rounded-lg sm:rounded-xl px-3 py-2 sm:px-6 sm:py-4 shadow-soft hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mb-1">
                    <UsersIcon className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
                    <span className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{(allCommunities || []).length}</span>
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Communities</div>
                </div>
                <div className="bg-white/80 dark:bg-gray-800/80 glass-strong rounded-lg sm:rounded-xl px-3 py-2 sm:px-6 sm:py-4 shadow-soft hover:shadow-md transition-all">
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 mb-1">
                    <UserPlusIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
                    <span className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-gray-100">{allies.length}</span>
                  </div>
                  <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Allies</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Tab.Group>
          <Tab.List className="flex space-x-1 rounded-xl bg-blue-900/20 p-1 mb-6">
            {(tabList || []).map((tab) => (
              <Tab
                key={tab.key}
                className={({ selected }) =>
                  `w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all duration-200 ${
                    selected
                      ? 'bg-white text-blue-700 shadow-lg'
                      : 'text-blue-100 hover:bg-white/[0.12] hover:text-white'
                  }`
                }
              >
                <div className="flex items-center justify-center gap-2">
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </div>
              </Tab>
            ))}
          </Tab.List>

          <Tab.Panels>
            {/* Posts Tab */}
            <Tab.Panel>
              {(userPosts || []).length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📝</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No posts yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {user.name} hasn't shared any posts yet
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {(userPosts || []).map((post) => (
                    <PostCard
                      key={post._id}
                      post={post}
                      onCommentClick={handleCommentClick}
                      onPostUpdate={(updatedPost) => {
                        const index = userPosts.findIndex(p => p._id === updatedPost._id);
                        if (index !== -1) {
                          const newPosts = [...userPosts];
                          newPosts[index] = updatedPost;
                          setUserPosts(newPosts);
                        }
                      }}
                      showCommunity={true}
                    />
                  ))}
                </div>
              )}
            </Tab.Panel>

            {/* Communities Tab */}
            <Tab.Panel>
              {(allCommunities || []).length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏘️</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No communities yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {user.name} hasn't joined any communities yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(allCommunities || []).map((community) => (
                    <div key={community._id} className="bg-white dark:bg-gray-800 rounded-xl shadow-soft hover:shadow-md transition-all duration-200 overflow-hidden">
                      <CommunityImage coverImage={community.coverImage} name={community.name} />
                      <div className="p-4">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2 line-clamp-1">
                          {community.name}
                        </h3>
                        {community.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {community.description}
                          </p>
                        )}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                            <UsersIcon className="w-4 h-4 mr-1" />
                            {community.members?.length || 0} members
                          </div>
                          <Link
                            href={`/communities/${community._id}`}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-sm font-medium"
                          >
                            View Community
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Tab.Panel>

            {/* Allies Tab */}
            <Tab.Panel>
              {(allies || []).length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">👥</div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No allies yet
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {user.name} hasn't added any allies yet
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {(allies || []).map((ally) => (
                    <div key={ally._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-soft hover:shadow-md transition-all duration-200">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                          <span className="text-white font-semibold text-sm">
                            {ally.name?.charAt(0)?.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {ally.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            @{ally.username}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Tab.Panel>

            {/* About Tab */}
            <Tab.Panel>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-soft p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  About {user.name}
                </h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Username</h4>
                    <p className="text-gray-900 dark:text-gray-100">@{user.username}</p>
                  </div>
                  {user.bio && (
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Bio</h4>
                      <p className="text-gray-900 dark:text-gray-100">{user.bio}</p>
                    </div>
                  )}
                  <div>
                    <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Member since</h4>
                    <p className="text-gray-900 dark:text-gray-100">
                      {user.createdAt ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true, locale: es }) : 'Unknown'}
                    </p>
                  </div>
                </div>
              </div>
            </Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </div>

      {/* Modals */}
      {authUser && (
        <>
          <CommentsModal
            isOpen={isCommentsModalOpen}
            onClose={() => setIsCommentsModalOpen(false)}
            post={selectedPost}
            currentUser={authUser}
            onPostUpdate={(updatedPost) => {
              const index = userPosts.findIndex(p => p._id === updatedPost._id);
              if (index !== -1) {
                const newPosts = [...userPosts];
                newPosts[index] = updatedPost;
                setUserPosts(newPosts);
              }
            }}
          />

          <SharedCommunitiesModal
            isOpen={isSharedCommunitiesModalOpen}
            onClose={() => setIsSharedCommunitiesModalOpen(false)}
            targetUser={{
              _id: user._id,
              name: user.name,
              username: user.username,
              profilePicture: user.profilePicture
            }}
          />
        </>
      )}
    </div>
  );
}

