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
      const response = await api.post('/stripe/create-checkout-session', params);
      return response.data;
    } catch (error: any) {
      console.error('Error creating checkout session:', error);
      throw error;
    }
  }

  /**
   * Crear producto y precio personalizado en Stripe
   */
  async createCustomPrice(params: CreateCustomPriceParams): Promise<CustomPriceResponse> {
    try {
      const response = await api.post('/stripe/create-price', params);
      return response.data;
    } catch (error: any) {
      console.error('Error creating custom price:', error);
      throw error;
    }
  }

  /**
   * Redirigir a Stripe Checkout
   */
  redirectToCheckout(checkoutUrl: string): void {
    if (typeof window !== 'undefined') {
      window.location.href = checkoutUrl;
    }
  }

  /**
   * Crear sesión del Portal de Cliente de Stripe
   */
  async createPortalSession(): Promise<CheckoutSessionResponse> {
    try {
      const response = await api.post('/stripe/create-portal-session');
      return response.data;
    } catch (error: any) {
      console.error('Error creating portal session:', error);
      throw error;
    }
  }

  /**
   * Redirigir al Portal de Cliente de Stripe
   */
  redirectToPortal(portalUrl: string): void {
    if (typeof window !== 'undefined') {
      window.location.href = portalUrl;
    }
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