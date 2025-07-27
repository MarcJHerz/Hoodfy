'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  CheckCircleIcon, 
  ArrowRightIcon,
  SparklesIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';
import { useCommunitiesStore } from '@/stores/communitiesStore';
import { useAuthStore } from '@/stores/authStore';

export default function SuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { loadSubscribedCommunities } = useCommunitiesStore();
  const { user } = useAuthStore();
  
  const [isLoading, setIsLoading] = useState(true);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    const sessionIdParam = searchParams.get('session_id');
    setSessionId(sessionIdParam);

    // Recargar las suscripciones para mostrar la nueva suscripción
    if (user) {
      loadSubscribedCommunities().finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [searchParams, user, loadSubscribedCommunities]);

  const handleViewCommunities = () => {
    router.push('/communities');
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-gray-600 dark:text-gray-400">Processing your subscription...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        {/* Success Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          
          {/* Header with animation */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircleIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Subscription successful!
            </h1>
            <p className="text-green-100">
              You are now a member of the community
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            
            {/* Success Message */}
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Welcome to your new community
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Your payment has been processed successfully and you now have full access to all the benefits of the community.
              </p>
            </div>

            {/* What's Next */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <SparklesIcon className="h-5 w-5" />
                What can you do now?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Participate in exclusive discussions
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Access the community's group chat
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Connect with other members
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Create and share content
                </li>
              </ul>
            </div>

            {/* Session Info (for debugging) */}
            {sessionId && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  ID de sesión: {sessionId.substring(0, 20)}...
                </p>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 space-y-3">
            <button
              onClick={handleViewCommunities}
              className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              <ChatBubbleLeftRightIcon className="h-5 w-5" />
              <span>Ver mis comunidades</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            
            <button
              onClick={handleGoHome}
              className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Ir al dashboard
            </button>
          </div>
        </div>

        {/* Support Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Problems with your subscription?{' '}
            <Link href="/support" className="text-blue-600 dark:text-blue-400 hover:underline">
              Contact support
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 