#!/usr/bin/env node

/**
 * Script para diagnosticar y reparar problemas con precios de Stripe
 * 
 * Uso:
 * node scripts/fixStripePrices.js diagnose    - Diagnostica problemas
 * node scripts/fixStripePrices.js sync         - Sincroniza precios
 * node scripts/fixStripePrices.js fix          - Repara precios inválidos
 * node scripts/fixStripePrices.js create       - Crea precios faltantes
 */

require('dotenv').config();
const mongoose = require('mongoose');
const PriceValidationService = require('../services/priceValidationService');
const Community = require('../models/Community');

// Conectar a MongoDB
async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    process.exit(1);
  }
}

// Diagnóstico de problemas
async function diagnose() {
  console.log('🔍 DIAGNÓSTICO DE PRECIOS DE STRIPE');
  console.log('=====================================');
  
  try {
    // Obtener todas las comunidades
    const communities = await Community.find({});
    console.log(`📊 Total de comunidades: ${communities.length}`);
    
    let withPrices = 0;
    let withoutPrices = 0;
    let invalidPrices = 0;
    let validPrices = 0;
    
    for (const community of communities) {
      if (community.stripePriceId && community.stripePriceId.trim() !== '') {
        withPrices++;
        
        // Validar el precio
        const validation = await PriceValidationService.validatePriceId(community.stripePriceId);
        if (validation.isValid) {
          validPrices++;
          console.log(`✅ ${community.name}: ${community.stripePriceId} ($${community.price})`);
        } else {
          invalidPrices++;
          console.log(`❌ ${community.name}: ${community.stripePriceId} - ${validation.error}`);
        }
      } else {
        withoutPrices++;
        console.log(`⚠️  ${community.name}: Sin precio configurado`);
      }
    }
    
    console.log('\n📋 RESUMEN:');
    console.log(`   Con precios: ${withPrices}`);
    console.log(`   Sin precios: ${withoutPrices}`);
    console.log(`   Precios válidos: ${validPrices}`);
    console.log(`   Precios inválidos: ${invalidPrices}`);
    
    if (invalidPrices > 0) {
      console.log('\n🚨 PROBLEMAS ENCONTRADOS:');
      console.log('   - Hay precios inválidos que necesitan reparación');
      console.log('   - Ejecuta: node scripts/fixStripePrices.js fix');
    }
    
  } catch (error) {
    console.error('❌ Error en diagnóstico:', error);
  }
}

// Sincronizar precios
async function sync() {
  console.log('🔄 SINCRONIZANDO PRECIOS DE STRIPE');
  console.log('===================================');
  
  try {
    const result = await PriceValidationService.syncAllPrices();
    console.log('\n✅ Sincronización completada:');
    console.log(`   Total de precios en Stripe: ${result.totalPrices}`);
    console.log(`   Comunidades con precios válidos: ${result.validCommunities}`);
    console.log(`   Comunidades con precios inválidos: ${result.invalidCommunities}`);
    
  } catch (error) {
    console.error('❌ Error en sincronización:', error);
  }
}

// Reparar precios inválidos
async function fix() {
  console.log('🔧 REPARANDO PRECIOS INVÁLIDOS');
  console.log('================================');
  
  try {
    // Obtener comunidades con precios inválidos
    const communities = await Community.find({
      stripePriceId: { $exists: true, $ne: '' }
    });
    
    let fixed = 0;
    let failed = 0;
    
    for (const community of communities) {
      const validation = await PriceValidationService.validatePriceId(community.stripePriceId);
      
      if (!validation.isValid) {
        console.log(`🔄 Reparando ${community.name} ($${community.price})...`);
        
        try {
          // Buscar precio válido
          const validPrice = await PriceValidationService.findValidPriceForAmount(community.price);
          
          if (validPrice) {
            // Actualizar comunidad
            community.stripePriceId = validPrice.priceId;
            await community.save();
            
            console.log(`   ✅ Reparado: ${validPrice.priceId} (${validPrice.source})`);
            fixed++;
          } else {
            console.log(`   ❌ No se pudo encontrar precio válido para $${community.price}`);
            failed++;
          }
        } catch (error) {
          console.log(`   ❌ Error reparando: ${error.message}`);
          failed++;
        }
      }
    }
    
    console.log('\n📋 RESUMEN DE REPARACIÓN:');
    console.log(`   Reparados: ${fixed}`);
    console.log(`   Fallidos: ${failed}`);
    
  } catch (error) {
    console.error('❌ Error en reparación:', error);
  }
}

// Crear precios faltantes
async function create() {
  console.log('🆕 CREANDO PRECIOS FALTANTES');
  console.log('==============================');
  
  try {
    // Obtener comunidades sin precios
    const communities = await Community.find({
      $or: [
        { stripePriceId: { $exists: false } },
        { stripePriceId: '' },
        { stripePriceId: null }
      ],
      price: { $gt: 0 }
    });
    
    console.log(`📊 Comunidades sin precios: ${communities.length}`);
    
    let created = 0;
    let failed = 0;
    
    for (const community of communities) {
      if (community.price > 0) {
        console.log(`🆕 Creando precio para ${community.name} ($${community.price})...`);
        
        try {
          const newPrice = await PriceValidationService.createPriceIfNotExists(community.price);
          
          // Actualizar comunidad
          community.stripePriceId = newPrice.priceId;
          community.stripeProductId = newPrice.productId;
          await community.save();
          
          console.log(`   ✅ Creado: ${newPrice.priceId}`);
          created++;
        } catch (error) {
          console.log(`   ❌ Error creando: ${error.message}`);
          failed++;
        }
      }
    }
    
    console.log('\n📋 RESUMEN DE CREACIÓN:');
    console.log(`   Creados: ${created}`);
    console.log(`   Fallidos: ${failed}`);
    
  } catch (error) {
    console.error('❌ Error creando precios:', error);
  }
}

// Función principal
async function main() {
  const command = process.argv[2];
  
  if (!command) {
    console.log('❌ Comando requerido');
    console.log('Uso: node scripts/fixStripePrices.js [diagnose|sync|fix|create]');
    process.exit(1);
  }
  
  await connectDB();
  
  switch (command) {
    case 'diagnose':
      await diagnose();
      break;
    case 'sync':
      await sync();
      break;
    case 'fix':
      await fix();
      break;
    case 'create':
      await create();
      break;
    default:
      console.log('❌ Comando inválido:', command);
      console.log('Comandos válidos: diagnose, sync, fix, create');
      process.exit(1);
  }
  
  await mongoose.disconnect();
  console.log('✅ Desconectado de MongoDB');
  process.exit(0);
}

// Ejecutar si es el archivo principal
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { diagnose, sync, fix, create };
