'use client';

import React, { useState, useEffect } from 'react';
import { 
  BanknotesIcon, 
  ChartBarIcon, 
  ArrowTrendingUpIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';
import { useAuthStore } from '@/stores/authStore';

interface EarningsOverviewProps {
  communityId: string;
  isCreator: boolean;
}

interface EarningsData {
  communities: Array<{
    communityId: string;
    communityName: string;
    totalEarnings: number;
    totalPayouts: number;
    pendingBalance: number;
    stripeConnectStatus: string;
  }>;
  totals: {
    totalEarnings: number;
    totalPending: number;
  };
}

export default function EarningsOverview({ communityId, isCreator }: EarningsOverviewProps) {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { token } = useAuthStore();

  // Solo mostrar si es el creador
  if (!isCreator) {
    return null;
  }

  const loadEarningsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_HOODFY || 'https://api.hoodfy.com'}/api/stripe-connect/earnings/overview`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setEarningsData(data);
      }
    } catch (error) {
      console.error('Error loading earnings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      loadEarningsData();
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!earningsData) {
    return null;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Earnings Overview</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Detailed breakdown of earnings by community</p>
        </div>
        <div className="flex items-center space-x-2">
          <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
        </div>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ChartBarIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Total Earnings</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ${earningsData.totals.totalEarnings.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BanknotesIcon className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">Pending Balance</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            ${earningsData.totals.totalPending.toFixed(2)}
          </p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ArrowTrendingUpIcon className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-medium text-gray-600">Communities</span>
          </div>
          <p className="text-2xl font-bold text-blue-600">
            {earningsData.communities.length}
          </p>
        </div>
      </div>

      {/* Comunidades */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 mb-4">Earnings by Community</h4>
        
        {earningsData.communities.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-xl">
            <BanknotesIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No earnings data available yet</p>
            <p className="text-sm text-gray-500">Start building your communities to see earnings</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {earningsData.communities.map((community) => (
              <div key={community.communityId} className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between mb-3">
                  <h5 className="font-semibold text-gray-900 dark:text-white">{community.communityName}</h5>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    community.stripeConnectStatus === 'active' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                      : community.stripeConnectStatus === 'pending'
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                      : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                  }`}>
                    {community.stripeConnectStatus === 'active' ? 'Active' : 
                     community.stripeConnectStatus === 'pending' ? 'Pending' : 'Restricted'}
                  </span>
                </div>
                
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Earnings</p>
                    <p className="font-bold text-gray-900 dark:text-white">${community.totalEarnings.toFixed(2)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Payouts</p>
                    <p className="font-bold text-gray-900 dark:text-white">{community.totalPayouts}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-gray-500 dark:text-gray-400 text-xs">Pending</p>
                    <p className="font-bold text-gray-900 dark:text-white">${community.pendingBalance.toFixed(2)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Información adicional */}
      <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
              <ArrowTrendingUpIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100">How earnings work</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Earnings are calculated per community and updated in real-time. You'll receive 90.9% of each subscription directly to your Stripe account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
