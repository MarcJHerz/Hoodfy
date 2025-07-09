import React, { useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { toast } from 'react-hot-toast';
import { 
  CreditCardIcon, 
  ShieldCheckIcon, 
  SparklesIcon,
  XMarkIcon,
  CheckIcon
} from '@heroicons/react/24/outline';
import stripeService from '@/services/stripeService';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  communityName: string;
  price: number;
  benefits: string[];
  rules: string[];
  communityId: string;
  onSubscriptionSuccess?: () => void;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  communityName,
  price,
  benefits,
  rules,
  communityId,
  onSubscriptionSuccess,
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleStripeCheckout = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Obtener price ID predefinido o crear uno personalizado
      let priceId = stripeService.getPriceId(price);
      
      if (!priceId) {
        // Crear precio personalizado para precios no estándar
        console.log('💰 Creando precio personalizado para $', price);
        const customPrice = await stripeService.createCustomPrice({
          communityName,
          price
        });
        priceId = customPrice.stripePriceId;
      }

      // Crear sesión de checkout
      const session = await stripeService.createCheckoutSession({
        communityId,
        priceId
      });

      // Cerrar modal y redirigir a Stripe
      onClose();
      
      // Pequeño delay para que se cierre el modal antes de la redirección
      setTimeout(() => {
        stripeService.redirectToCheckout(session.url);
      }, 500);

    } catch (error: any) {
      console.error('❌ Error al procesar pago:', error);
      toast.error(error.message || 'Error al procesar el pago');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };

  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 z-50 overflow-y-auto" onClose={onClose}>
        <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" aria-hidden="true" />
          </Transition.Child>

          <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
          
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            enterTo="opacity-100 translate-y-0 sm:scale-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100 translate-y-0 sm:scale-100"
            leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
          >
            <div className="inline-block align-bottom bg-white dark:bg-gray-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-gray-200 dark:border-gray-800">
              
              {/* Header */}
              <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white">
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
                
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <SparklesIcon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Suscribirse</h3>
                    <p className="text-blue-100">{communityName}</p>
                  </div>
                </div>

                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">{formatPrice(price)}</div>
                  <p className="text-blue-100">por mes</p>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6">
                
                {/* Benefits */}
                {benefits.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <CheckIcon className="h-5 w-5 text-green-500" />
                      Beneficios incluidos
                    </h4>
                    <ul className="space-y-2">
                      {benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <CheckIcon className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700 dark:text-gray-300 text-sm">{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Rules */}
                {rules.length > 0 && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <ShieldCheckIcon className="h-5 w-5 text-blue-500" />
                      Reglas de la comunidad
                    </h4>
                    <ul className="space-y-2">
                      {rules.map((rule, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></div>
                          <span className="text-gray-600 dark:text-gray-400 text-sm">{rule}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Security Notice */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                  <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-400">
                    <ShieldCheckIcon className="h-5 w-5 text-green-500 flex-shrink-0" />
                    <span>Pago seguro procesado por Stripe. Puedes cancelar en cualquier momento.</span>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 dark:bg-gray-800 px-6 py-4 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  onClick={onClose}
                  disabled={isProcessing}
                >
                  Cancelar
                </button>
                
                <button
                  type="button"
                  className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-purple-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={handleStripeCheckout}
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>Procesando...</span>
                    </>
                  ) : (
                    <>
                      <CreditCardIcon className="h-5 w-5" />
                      <span>Suscribirse {formatPrice(price)}/mes</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </Transition.Child>
        </div>
      </Dialog>
    </Transition.Root>
  );
};

export default SubscriptionModal; 