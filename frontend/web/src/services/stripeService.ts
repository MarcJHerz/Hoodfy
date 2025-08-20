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
      const response = await api.post('/api/stripe/create-checkout-session', params);
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
      const response = await api.post('/api/stripe/create-product-price', params);
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
   * @param subscriptionId - ID opcional de la suscripción específica a gestionar
   */
  async createPortalSession(subscriptionId?: string): Promise<CheckoutSessionResponse> {
    try {
      const body = subscriptionId ? { subscriptionId } : {};
      const response = await api.post('/api/stripe/create-portal-session', body);
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
      1: 'price_1RxN2TE9G1zq8oDPMvKNUz0G',
      3: 'price_1RxN8jE9G1zq8oDPD0fUeLxr',
      5: 'price_1RxNBOE9G1zq8oDPuaVBJoIT',
      7: 'price_1RxNGEE9G1zq8oDPHtvRI7YU',
      10: 'price_1RxNIME9G1zq8oDPoiegdaTA',
      15: 'price_1RxNKnE9G1zq8oDPqfgrXn71',
      20: 'price_1RxNLsE9G1zq8oDPW0hUmih7',
      25: 'price_1RxNMuE9G1zq8oDP6RXNQ5BL',
      50: 'price_1RxNO8E9G1zq8oDPab27hSbF',
      100: 'price_1RxNPUE9G1zq8oDPe3qa53V1',
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