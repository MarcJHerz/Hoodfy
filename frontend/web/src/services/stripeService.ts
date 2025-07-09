import api from './api';

export interface CreateCheckoutSessionParams {
  communityId: string;
  priceId: string;
}

export interface CreateCustomPriceParams {
  communityName: string;
  price: number;
}

export interface CheckoutSessionResponse {
  url: string;
}

export interface CustomPriceResponse {
  stripeProductId: string;
  stripePriceId: string;
}

class StripeService {
  /**
   * Crear una sesión de checkout de Stripe
   */
  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<CheckoutSessionResponse> {
    try {
      console.log('🛒 Creando sesión de checkout con Stripe...', params);
      
      const response = await api.post('/api/stripe/create-checkout-session', {
        communityId: params.communityId,
        priceId: params.priceId
      });

      console.log('✅ Sesión de checkout creada:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creando sesión de checkout:', error);
      throw new Error(error.response?.data?.error || 'Error al crear sesión de checkout');
    }
  }

  /**
   * Crear producto y precio personalizado en Stripe
   */
  async createCustomPrice(params: CreateCustomPriceParams): Promise<CustomPriceResponse> {
    try {
      console.log('💰 Creando precio personalizado en Stripe...', params);
      
      const response = await api.post('/api/stripe/create-product-price', {
        communityName: params.communityName,
        price: params.price
      });

      console.log('✅ Precio personalizado creado:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ Error creando precio personalizado:', error);
      throw new Error(error.response?.data?.error || 'Error al crear precio personalizado');
    }
  }

  /**
   * Redirigir a Stripe Checkout
   */
  redirectToCheckout(checkoutUrl: string): void {
    console.log('🔄 Redirigiendo a Stripe Checkout:', checkoutUrl);
    window.location.href = checkoutUrl;
  }

  /**
   * Obtener precios predefinidos
   */
  getPredefinedPrices(): Record<number, string> {
    return {
      1: 'price_1RgtxfQUJIiEzpqAMBbszFOi',
      3: 'price_1RgtzrQUJIiEzpqAK2EhWQgm',
      5: 'price_1Rgu00QUJIiEzpqAWsBcqkCR',
      7: 'price_1Rgu07QUJIiEzpqAK8bP6v6i',
      10: 'price_1Rgu0LQUJIiEzpqAo64ycGND',
      15: 'price_1Rgu0TQUJIiEzpqAYNMDauNP',
      20: 'price_1Rgu0aQUJIiEzpqAlvTbF9vi',
      25: 'price_1Rgu0nQUJIiEzpqAUsEuvUXD',
      50: 'price_1Rgu0tQUJIiEzpqANcva8DeM',
      100: 'price_1Rgu19QUJIiEzpqAGzzClTwi',
    };
  }

  /**
   * Obtener price ID para un precio específico
   */
  getPriceId(amount: number): string | null {
    const prices = this.getPredefinedPrices();
    return prices[amount] || null;
  }
}

export const stripeService = new StripeService();
export default stripeService; 