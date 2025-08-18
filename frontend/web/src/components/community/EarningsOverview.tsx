'use client';

import React, { useState, useEffect } from 'react';
import { 
  BanknotesIcon, 
  ChartBarIcon, 
  ArrowTrendingUpIcon,
  ArrowTopRightOnSquareIcon
} from '@heroicons/react/24/outline';

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

  // Solo mostrar si es el creador
  if (!isCreator) {
    return null;
  }

  const loadEarningsData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/stripe-connect/earnings/overview');
      
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
    loadEarningsData();
  }, []);

  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!earningsData) {
    return null;
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Resumen de Ganancias</h3>
          <p className="text-gray-600 mt-1">Vista general de todas tus comunidades</p>
        </div>
        <div className="flex items-center space-x-2">
          <ArrowTrendingUpIcon className="w-6 h-6 text-green-600" />
        </div>
      </div>

      {/* Totales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <ChartBarIcon className="w-5 h-5 text-green-600" />
            <span className="text-sm font-medium text-gray-600">Ganancias Totales</span>
          </div>
          <p className="text-2xl font-bold text-green-600">
            ${earningsData.totals.totalEarnings.toFixed(2)}
          </p>
        </div>
        
        <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-2">
            <BanknotesIcon className="w-5 h-5 text-yellow-600" />
            <span className="text-sm font-medium text-gray-600">Balance Pendiente</span>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            ${earningsData.totals.totalPending.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Comunidades */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 mb-3">Por Comunidad</h4>
        
        {earningsData.communities.map((community) => (
          <div key={community.communityId} className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-gray-900">{community.communityName}</h5>
              <span className={`text-xs px-2 py-1 rounded-full ${
                community.stripeConnectStatus === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : community.stripeConnectStatus === 'pending'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {community.stripeConnectStatus === 'active' ? 'Activa' : 
                 community.stripeConnectStatus === 'pending' ? 'Pendiente' : 'Restringida'}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Ganancias</p>
                <p className="font-semibold text-gray-900">${community.totalEarnings.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Payouts</p>
                <p className="font-semibold text-gray-900">${community.totalPayouts.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-gray-500">Pendiente</p>
                <p className="font-semibold text-gray-900">${community.pendingBalance.toFixed(2)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-6 bg-blue-50 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-blue-900">¿Necesitas ayuda?</h4>
            <p className="text-sm text-blue-700 mt-1">
              Consulta nuestra documentación sobre pagos y ganancias
            </p>
          </div>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
            Ver Documentación
          </button>
        </div>
      </div>
    </div>
  );
}
