import React, { useState } from 'react';
import { stripeService } from '../services/stripeService';

interface SubscriptionManagerProps {
  userId: string;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ userId }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleManageSubscriptions = async () => {
    try {
      setIsLoading(true);
      console.log('🔄 Creando sesión del portal...');
      
      const response = await stripeService.createPortalSession();
      console.log('✅ Portal URL recibida:', response.url);
      
      // Redirigir al portal de Stripe
      stripeService.redirectToPortal(response.url);
    } catch (error) {
      console.error('❌ Error accediendo al portal:', error);
      alert('Error al acceder al portal de gestión de suscripciones');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Gestión de Suscripciones
      </h3>
      
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        Gestiona tus suscripciones, actualiza métodos de pago, cancela suscripciones y más.
      </p>
      
      <button
        onClick={handleManageSubscriptions}
        disabled={isLoading}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center justify-center"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Cargando...
          </>
        ) : (
          'Gestionar Suscripciones'
        )}
      </button>
      
      <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
        <p>• Actualizar método de pago</p>
        <p>• Cancelar suscripciones</p>
        <p>• Ver historial de pagos</p>
        <p>• Descargar facturas</p>
      </div>
    </div>
  );
};

export default SubscriptionManager; 