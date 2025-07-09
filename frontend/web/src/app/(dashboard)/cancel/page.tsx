'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  XCircleIcon, 
  ArrowRightIcon,
  ArrowLeftIcon,
  QuestionMarkCircleIcon
} from '@heroicons/react/24/outline';

export default function CancelPage() {
  const router = useRouter();

  const handleTryAgain = () => {
    router.push('/dashboard/communities');
  };

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        
        {/* Cancel Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-red-500 px-6 py-8 text-center">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <XCircleIcon className="h-10 w-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Pago Cancelado
            </h1>
            <p className="text-orange-100">
              No se completó la suscripción
            </p>
          </div>

          {/* Content */}
          <div className="px-6 py-6 space-y-6">
            
            {/* Cancel Message */}
            <div className="text-center">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No te preocupes
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Tu pago fue cancelado y no se procesó ningún cargo. Puedes intentar de nuevo cuando estés listo.
              </p>
            </div>

            {/* Help Section */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center gap-2">
                <QuestionMarkCircleIcon className="h-5 w-5" />
                ¿Necesitas ayuda?
              </h3>
              <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Verifica que tu tarjeta tenga fondos suficientes
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Confirma que los datos sean correctos
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full"></div>
                  Contacta a tu banco si persisten los problemas
                </li>
              </ul>
            </div>

            {/* Alternative Options */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <h3 className="font-medium text-gray-900 dark:text-white mb-2">
                Mientras tanto...
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Puedes explorar comunidades gratuitas o crear tu propia comunidad.
              </p>
              <Link 
                href="/dashboard/communities" 
                className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                Ver comunidades disponibles →
              </Link>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 space-y-3">
            <button
              onClick={handleTryAgain}
              className="w-full inline-flex justify-center items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105"
            >
              <span>Intentar de nuevo</span>
              <ArrowRightIcon className="h-4 w-4" />
            </button>
            
            <div className="flex gap-3">
              <button
                onClick={handleGoBack}
                className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <ArrowLeftIcon className="h-4 w-4" />
                <span>Volver</span>
              </button>
              
              <button
                onClick={handleGoHome}
                className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                <span>Dashboard</span>
              </button>
            </div>
          </div>
        </div>

        {/* Support Notice */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            ¿Sigues teniendo problemas?{' '}
            <Link href="/support" className="text-blue-600 dark:text-blue-400 hover:underline">
              Contacta soporte
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 