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
import { useAuthStore } from '@/stores/authStore';

interface CreatorPaymentsDashboardProps {
  isCreator: boolean;
}

interface EarningsData {
  totalEarnings: number;
  totalPayouts: number;
  pendingBalance: number;
  stripeConnectStatus: string;
}

export default function CreatorPaymentsDashboard({ 
  isCreator
}: CreatorPaymentsDashboardProps) {
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [onboardingUrl, setOnboardingUrl] = useState('');
  const [loginUrl, setLoginUrl] = useState('');
  const [stripeConnectStatus, setStripeConnectStatus] = useState<string>('pending');
  const [stripeConnectAccountId, setStripeConnectAccountId] = useState<string>('');
  const { user, token } = useAuthStore();

  // Función inteligente para abrir URLs de Stripe (compatible con iOS)
  const openStripeUrl = (url: string, action: string) => {
    try {
      // Intentar window.open primero (funciona en PC/Android)
      const newWindow = window.open(url, '_blank');
      
      // Verificar si la ventana se abrió correctamente
      if (newWindow && !newWindow.closed && typeof newWindow.closed !== 'undefined') {
        // window.open funcionó correctamente
        return;
      }
      
      // Si window.open falló (iOS), usar redirección directa
      window.location.href = url;
    } catch (error) {
      // En caso de error, usar redirección directa como fallback
      window.location.href = url;
    }
  };

  // Cargar estado de Stripe Connect del usuario
  useEffect(() => {
    const loadStripeStatus = async () => {
      if (!token || !user) return;
      
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_HOODFY || 'https://api.hoodfy.com'}/api/user/stripe-connect/status`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          setStripeConnectStatus(data.status);
          setStripeConnectAccountId(data.accountId);
        }
      } catch (error) {
        console.error('Error loading Stripe status:', error);
      }
    };

    loadStripeStatus();
  }, [token, user]);

  // Solo mostrar si es el creador
  if (!isCreator) {
    return null;
  }

  // Función para obtener el token JWT del store
  const getAuthToken = () => {
    return token;
  };

  const getStatusInfo = () => {
    switch (stripeConnectStatus) {
      case 'active':
        return {
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          icon: CheckCircleIcon,
          text: 'Active Account - You can receive payments',
          description: 'Your Stripe Connect account is active and you can receive payments directly.'
        };
      case 'pending':
        return {
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          icon: ClockIcon,
          text: 'Pending Activation',
          description: 'Complete the onboarding to activate your payment account.'
        };
      case 'restricted':
        return {
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          icon: ExclamationTriangleIcon,
          text: 'Onboarding Incomplete',
          description: 'Your Stripe Connect setup was interrupted. Click "Continue Onboarding" to complete the process.'
        };
      default:
        return {
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          icon: CogIcon,
          text: 'Not Configured',
          description: 'Configure your Stripe Connect account to receive payments.'
        };
    }
  };

  const handleSetupStripeConnect = async () => {
    setIsLoading(true);
    try {
      const authToken = getAuthToken();
      
      if (!authToken) {
        console.error('No se pudo obtener el token de autenticación');
        return;
      }
      
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_HOODFY || 'https://api.hoodfy.com'}/api/user/stripe-connect/account`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          accountType: 'express',
          country: 'US'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingUrl(data.onboardingUrl);
        // Abrir onboarding con función compatible con iOS
        openStripeUrl(data.onboardingUrl, 'onboarding');
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
      const authToken = getAuthToken();
      if (!authToken) {
        console.error('No se pudo obtener el token de autenticación');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_HOODFY || 'https://api.hoodfy.com'}/api/user/stripe-connect/login`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLoginUrl(data.loginUrl);
        // Abrir dashboard con función compatible con iOS
        openStripeUrl(data.loginUrl, 'dashboard');
      }
    } catch (error) {
      console.error('Error accessing Stripe dashboard:', error);
    }
  };

  const handleContinueOnboarding = async () => {
    if (!stripeConnectAccountId) return;
    
    try {
      const authToken = getAuthToken();
      if (!authToken) {
        console.error('No se pudo obtener el token de autenticación');
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL_HOODFY || 'https://api.hoodfy.com'}/api/user/stripe-connect/onboarding`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setOnboardingUrl(data.onboardingUrl);
        // Continuar onboarding con función compatible con iOS
        openStripeUrl(data.onboardingUrl, 'continue-onboarding');
      }
    } catch (error) {
      console.error('Error continuing onboarding:', error);
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">Payments Dashboard</h3>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Manage your earnings and payment configuration</p>
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
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-1">{statusInfo.description}</p>
          </div>
        </div>
      </div>

      {/* Acciones principales */}
      <div className="space-y-4 mb-6">
        {(() => {
          if (!stripeConnectAccountId) {
            return (
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
                    <span>Setup Payment Account</span>
                  </>
                )}
              </button>
            );
          }

          switch (stripeConnectStatus) {
            case 'pending':
              return (
                <button
                  onClick={handleContinueOnboarding}
                  className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <CogIcon className="w-5 h-5" />
                  <span>Complete Onboarding</span>
                </button>
              );
            
            case 'active':
              return (
                <button
                  onClick={handleAccessStripeDashboard}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-green-700 hover:to-emerald-700 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <ArrowTopRightOnSquareIcon className="w-5 h-5" />
                  <span>Access Stripe Dashboard</span>
                </button>
              );
            
            case 'restricted':
              return (
                <button
                  onClick={handleContinueOnboarding}
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold py-3 px-4 rounded-xl hover:from-red-600 hover:to-pink-600 transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <CogIcon className="w-5 h-5" />
                  <span>Continue Onboarding</span>
                </button>
              );
            
            default:
              return (
                <button
                  onClick={handleSetupStripeConnect}
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-gray-600 to-gray-700 text-white font-semibold py-3 px-4 rounded-xl hover:from-gray-700 hover:to-gray-800 transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <CreditCardIcon className="w-5 h-5" />
                      <span>Setup Payment Account</span>
                    </>
                  )}
                </button>
              );
          }
        })()}
      </div>

      {/* Información de ganancias */}
      {earningsData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ChartBarIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium text-gray-600">Total Earnings</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${earningsData.totalEarnings.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <BanknotesIcon className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium text-gray-600">Completed Payouts</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              ${earningsData.totalPayouts.toFixed(2)}
            </p>
          </div>
          
          <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center space-x-2 mb-2">
              <ClockIcon className="w-5 h-5 text-yellow-600" />
              <span className="text-sm font-medium text-gray-600">Pending Balance</span>
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
            <h4 className="text-sm font-medium text-blue-900">How does it work?</h4>
            <p className="text-sm text-blue-700 mt-1">
              With Stripe Connect, you will receive 90.9% of each subscription directly in your Stripe account. 
              The platform keeps the remaining 9.1% for operational costs.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
