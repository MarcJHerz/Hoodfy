'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCardIcon, 
  BanknotesIcon, 
  ChartBarIcon, 
  CogIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

interface CreatorPaymentsDashboardProps {
  communityId: string;
  isCreator: boolean;
  stripeConnectStatus?: string;
  stripeConnectAccountId?: string;
}

interface EarningsData {
  totalEarnings: number;
  totalPayouts: number;
  pendingBalance: number;
  stripeConnectStatus: string;
}

export default function CreatorPaymentsDashboard({ 
  communityId, 
  isCreator, 
  stripeConnectStatus = 'pending',
  stripeConnectAccountId = ''
}: CreatorPaymentsDashboardProps) {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState('');
  const [loginUrl, setLoginUrl] = useState('');

  // Solo mostrar si es el creador
  if (!isCreator) {
    return null;
  }

  const getStatusInfo = () => {
    switch (stripeConnectStatus) {
      case 'active':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: CheckCircleIcon,
          text: 'Cuenta activa - Puedes recibir pagos',
          description: 'Tu cuenta de Stripe Connect está activa y puedes recibir pagos directamente.'
        };
      case 'pending':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          icon: ClockIcon,
          text: 'Pendiente de activación',
          description: 'Completa el onboarding para activar tu cuenta de pagos.'
        };
      case 'restricted':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: ExclamationTriangleIcon,
          text: 'Cuenta restringida',
          description: 'Tu cuenta tiene restricciones. Contacta soporte para resolver.'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: CogIcon,
          text: 'No configurada',
          description: 'Configura tu cuenta de Stripe Connect para recibir pagos.'
        };
    }
  };

  const handleSetupStripeConnect = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/stripe-connect/accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          communityId,
          accountType: 'express',
          country: 'US'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingUrl(data.onboardingUrl);
        // Redirigir al onboarding
        window.open(data.onboardingUrl, '_blank');
      } else {
        console.error('Error setting up Stripe Connect');
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAccessStripeDashboard = async () => {
    if (!stripeConnectAccountId) return;
    
    try {
      const response = await fetch(`/api/stripe-connect/accounts/${communityId}/login`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setLoginUrl(data.loginUrl);
        // Redirigir al dashboard de Stripe
        window.open(data.loginUrl, '_blank');
      }
    } catch (error) {
      console.error('Error accessing Stripe dashboard:', error);
    }
  };

  const handleContinueOnboarding = async () => {
    if (!stripeConnectAccountId) return;
    
    try {
      const response = await fetch(`/api/stripe-connect/accounts/${communityId}/onboarding`, {
        method: 'POST',
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingUrl(data.onboardingUrl);
        // Redirigir al onboarding
        window.open(data.onboardingUrl, '_blank');
      }
    } catch (error) {
      console.error('Error continuing onboarding:', error);
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Dashboard de Pagos</h3>
          <p className="text-gray-600 mt-1">Gestiona tus ganancias y configuración de pagos</p>
        </div>
        <div className="flex items-center space-x-2">
          <BanknotesIcon className="w-6 h-6 text-green-600" />
        </div>
      </div>

      {/* Estado de la cuenta */}
      <div className={`${statusInfo.bgColor} rounded-xl p-4 mb-6`}>
        <div className="flex items-center space-x-3">
          <StatusIcon className={`w-6 h-6 ${statusInfo.color}`} />
          <div>
            <h4 className={`font-semibold ${statusInfo.color}`}>{statusInfo.text}</h4>
            <p className="text-gray-600 text-sm mt-1">{statusInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Acciones principales */}
      <div className="space-y-4 mb-6">
        {!stripeConnectAccountId ? (
          <button
            onClick={handleSetupStripeConnect}
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-purple-700 hover:to-blue-700 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <CreditCardIcon className="w-5 h-5" />
                <span>Configurar Cuenta de Pagos</span>
              </>
            )}
          </button>
        ) : stripeConnectStatus === 'pending' ? (
          <button
            onClick={handleContinueOnboarding}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <CogIcon className="w-5 h-5" />
            <span>Completar Onboarding</span>
          </button>
        ) : stripeConnectStatus === 'active' ? (
          <button
            onClick={handleAccessStripeDashboard}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <ArrowTopRightOnSquareIcon className="w-5 h-5" />
            <span>Acceder al Dashboard de Stripe</span>
          </button>
        ) : null}
      </div>

      {/* Información de ganancias */}
      {earningsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ChartBarIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Ganancias Totales</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${earningsData.totalEarnings.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BanknotesIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Payouts Completados</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${earningsData.totalPayouts.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600">Balance Pendiente</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${earningsData.pendingBalance.toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Información adicional */}
      <div className="bg-blue-50 rounded-xl p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <CogIcon className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-blue-900">¿Cómo funciona?</h4>
            <p className="text-sm text-blue-700 mt-1">
              Con Stripe Connect, recibirás el 90.9% de cada suscripción directamente en tu cuenta de Stripe. 
              La plataforma se queda con el 9.1% restante para cubrir costos operativos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
