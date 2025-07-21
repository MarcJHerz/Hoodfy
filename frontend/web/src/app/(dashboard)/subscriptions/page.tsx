'use client';

import { useEffect, useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { subscriptions as subscriptionsApi } from '@/services/api';
import { stripeService } from '@/services/stripeService';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

interface Subscription {
  _id: string;
  user: string;
  community: {
    _id: string;
    name: string;
    coverImage?: string;
    description?: string;
  };
  status: 'active' | 'canceled' | 'expired' | 'payment_failed';
  startDate: string;
  endDate?: string;
  amount: number;
  paymentMethod: string;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  lastPaymentAttempt?: string;
  failedPaymentCount?: number;
}

export default function SubscriptionsPage() {
  const { user } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  // Cargar suscripciones al montar el componente
  useEffect(() => {
    if (user) {
      fetchSubscriptions();
    }
  }, [user]);

  // Obtener suscripciones del usuario
  const fetchSubscriptions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await subscriptionsApi.getMySubscriptions();
      // El backend devuelve directamente el array
      setSubscriptions(response.data);
    } catch (error: any) {
      console.error('Error fetching subscriptions:', error);
      setError(error.response?.data?.error || 'Error cargando suscripciones');
    } finally {
      setIsLoading(false);
    }
  };

  // Abrir Stripe Portal
  const openStripePortal = async () => {
    try {
      setIsOpeningPortal(true);
      const response = await stripeService.createPortalSession();
      
      // Redirigir al portal de Stripe
      window.open(response.url, '_blank');
    } catch (error: any) {
      console.error('Error opening Stripe portal:', error);
      setError('Error abriendo el portal de gestión de pagos');
    } finally {
      setIsOpeningPortal(false);
    }
  };

  // Obtener color del status
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'payment_failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'canceled':
      case 'expired':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Obtener texto del status
  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Activa';
      case 'payment_failed':
        return 'Pago Fallido';
      case 'canceled':
        return 'Cancelada';
      case 'expired':
        return 'Expirada';
      default:
        return status;
    }
  };

  // Calcular días hasta próximo cobro (aproximado - 30 días)
  const getDaysUntilNextBilling = (startDate: string) => {
    const start = new Date(startDate);
    const now = new Date();
    const daysSinceStart = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const daysInCycle = 30; // Asumiendo ciclo mensual
    const nextBilling = daysInCycle - (daysSinceStart % daysInCycle);
    return nextBilling;
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Acceso requerido
          </h2>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Debes iniciar sesión para ver tus suscripciones.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Mis Suscripciones
            </h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Gestiona todas tus suscripciones activas y pagos
            </p>
          </div>
          
          {/* Botón de Stripe Portal */}
          <div className="mt-4 sm:mt-0">
            <button
              onClick={openStripePortal}
              disabled={isOpeningPortal}
              className="
                inline-flex items-center px-4 py-2
                bg-blue-600 text-white rounded-lg
                hover:bg-blue-700 disabled:opacity-50
                transition-colors duration-200
              "
            >
              {isOpeningPortal ? (
                <>
                  <div className="animate-spin -ml-1 mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                  Abriendo...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Gestionar Pagos
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Estado de carga */}
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700 dark:text-red-400">{error}</p>
          </div>
          <button
            onClick={fetchSubscriptions}
            className="mt-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm hover:underline"
          >
            Reintentar
          </button>
        </div>
      )}

      {/* Lista de suscripciones */}
      {!isLoading && !error && (
        <>
          {subscriptions.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💳</div>
              <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100 mb-2">
                No tienes suscripciones activas
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Explora comunidades y suscríbete para acceder a contenido exclusivo
              </p>
              <a
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
              >
                Explorar Comunidades
              </a>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {subscriptions.map((subscription) => (
                <div
                  key={subscription._id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
                >
                  {/* Header de la tarjeta */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      {subscription.community.coverImage ? (
                        <img
                          src={subscription.community.coverImage}
                          alt={subscription.community.name}
                          className="w-12 h-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                          <span className="text-2xl">🏘️</span>
                        </div>
                      )}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                          {subscription.community.name}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                          {getStatusText(subscription.status)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Información de la suscripción */}
                  <div className="space-y-3">
                    {/* Precio */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Precio mensual:</span>
                      <span className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        ${subscription.amount}/mes
                      </span>
                    </div>

                    {/* Fecha de inicio */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Inicio:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100">
                        {new Date(subscription.startDate).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </span>
                    </div>

                    {/* Próximo cobro o estado */}
                    {subscription.status === 'active' && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Próximo cobro:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          En {getDaysUntilNextBilling(subscription.startDate)} días
                        </span>
                      </div>
                    )}

                    {subscription.endDate && (
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Fecha de fin:</span>
                        <span className="text-sm text-gray-900 dark:text-gray-100">
                          {new Date(subscription.endDate).toLocaleDateString('es-ES', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </span>
                      </div>
                    )}

                    {/* Método de pago */}
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">Método de pago:</span>
                      <span className="text-sm text-gray-900 dark:text-gray-100 capitalize">
                        {subscription.paymentMethod}
                      </span>
                    </div>

                    {/* Alertas especiales */}
                    {subscription.status === 'payment_failed' && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                        <div className="flex items-center">
                          <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <p className="text-sm text-red-700 dark:text-red-400">
                            Problema con el pago. Actualiza tu método de pago.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="mt-6 flex space-x-3">
                    <a
                      href={`/communities/${subscription.community._id}`}
                      className="flex-1 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    >
                      Ver Comunidad
                    </a>
                    
                    {subscription.status === 'active' && (
                      <button
                        onClick={openStripePortal}
                        className="flex-1 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
                      >
                        Gestionar
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 