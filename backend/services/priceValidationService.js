const stripe = require('../config/stripe');
const Community = require('../models/Community');

class PriceValidationService {
  /**
   * Valida si un priceId existe en Stripe
   */
  static async validatePriceId(priceId) {
    try {
      if (!stripe) {
        throw new Error('Stripe no está configurado');
      }

      const price = await stripe.prices.retrieve(priceId);
      return {
        isValid: true,
        price: price,
        active: price.active,
        unitAmount: price.unit_amount,
        currency: price.currency
      };
    } catch (error) {
      if (error.code === 'resource_missing') {
        return {
          isValid: false,
          error: 'Price ID no encontrado en Stripe',
          code: error.code
        };
      }
      
      return {
        isValid: false,
        error: error.message,
        code: error.code || 'unknown_error'
      };
    }
  }

  /**
   * Sincroniza todos los precios de Stripe con la base de datos
   */
  static async syncAllPrices() {
    try {
      if (!stripe) {
        throw new Error('Stripe no está configurado');
      }

      console.log('🔄 Iniciando sincronización de precios...');
      
      // Obtener todos los precios activos de Stripe
      const prices = await stripe.prices.list({
        active: true,
        limit: 100
      });

      console.log(`📊 Encontrados ${prices.data.length} precios activos en Stripe`);

      // Obtener todas las comunidades con precios
      const communities = await Community.find({
        stripePriceId: { $exists: true, $ne: '' }
      });

      console.log(`🏘️ Encontradas ${communities.length} comunidades con precios`);

      let updatedCount = 0;
      let invalidCount = 0;

      for (const community of communities) {
        const validation = await this.validatePriceId(community.stripePriceId);
        
        if (!validation.isValid) {
          console.log(`❌ Precio inválido para comunidad "${community.name}": ${community.stripePriceId}`);
          invalidCount++;
          
          // Marcar como inválido en la base de datos
          community.stripePriceId = '';
          community.stripeProductId = '';
          await community.save();
        } else {
          console.log(`✅ Precio válido para comunidad "${community.name}": ${community.stripePriceId}`);
          updatedCount++;
        }
      }

      console.log(`✅ Sincronización completada: ${updatedCount} válidos, ${invalidCount} inválidos`);
      
      return {
        totalPrices: prices.data.length,
        validCommunities: updatedCount,
        invalidCommunities: invalidCount
      };
    } catch (error) {
      console.error('❌ Error en sincronización de precios:', error);
      throw error;
    }
  }

  /**
   * Encuentra un precio válido para un monto específico
   */
  static async findValidPriceForAmount(amount) {
    try {
      if (!stripe) {
        throw new Error('Stripe no está configurado');
      }

      // Buscar en precios preestablecidos primero
      const stripePrices = require('../config/stripePrices');
      const predefinedPriceId = stripePrices[amount];
      
      if (predefinedPriceId) {
        const validation = await this.validatePriceId(predefinedPriceId);
        if (validation.isValid) {
          return {
            priceId: predefinedPriceId,
            amount: amount,
            source: 'predefined'
          };
        }
      }

      // Si no hay precio preestablecido válido, buscar en Stripe
      const prices = await stripe.prices.list({
        active: true,
        limit: 100
      });

      const matchingPrice = prices.data.find(price => 
        price.unit_amount === amount * 100 && // Stripe usa centavos
        price.currency === 'usd'
      );

      if (matchingPrice) {
        return {
          priceId: matchingPrice.id,
          amount: amount,
          source: 'stripe_search'
        };
      }

      return null;
    } catch (error) {
      console.error('❌ Error buscando precio válido:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo precio en Stripe si no existe
   */
  static async createPriceIfNotExists(amount, productId = null) {
    try {
      if (!stripe) {
        throw new Error('Stripe no está configurado');
      }

      // Buscar si ya existe un precio para este monto
      const existingPrice = await this.findValidPriceForAmount(amount);
      if (existingPrice) {
        return existingPrice;
      }

      // Si no existe, crear uno nuevo
      let product = productId;
      if (!product) {
        // Crear producto si no se proporciona
        product = await stripe.products.create({
          name: `Suscripción de $${amount}`,
          description: `Acceso a comunidad premium por $${amount}/mes`
        });
      }

      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: amount * 100, // Convertir a centavos
        currency: 'usd',
        recurring: {
          interval: 'month'
        }
      });

      console.log(`✅ Nuevo precio creado: ${price.id} para $${amount}`);

      return {
        priceId: price.id,
        productId: product.id,
        amount: amount,
        source: 'newly_created'
      };
    } catch (error) {
      console.error('❌ Error creando precio:', error);
      throw error;
    }
  }
}

module.exports = PriceValidationService;
