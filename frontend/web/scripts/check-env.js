#!/usr/bin/env node

/**
 * Script para verificar variables de entorno antes del deployment
 */

const requiredPublicVars = [
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID',
  'NEXT_PUBLIC_API_URL'
];

const requiredServerVars = [
  'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL',
  'FIREBASE_PRIVATE_KEY',
  'FIREBASE_STORAGE_BUCKET'
];

console.log('🔍 Verificando configuración de variables de entorno...\n');

let hasErrors = false;

// Verificar variables públicas
console.log('📱 Variables públicas (NEXT_PUBLIC_*):');
requiredPublicVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value === 'demo-api-key' || value.includes('demo-')) {
    console.log(`❌ ${varName}: ¡FALTANTE O DEMO!`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: Configurada`);
  }
});

console.log('\n🔒 Variables del servidor:');
requiredServerVars.forEach(varName => {
  const value = process.env[varName];
  if (!value || value === 'demo-project') {
    console.log(`❌ ${varName}: ¡FALTANTE!`);
    hasErrors = true;
  } else {
    console.log(`✅ ${varName}: Configurada`);
  }
});

console.log('\n📋 Resumen:');
if (hasErrors) {
  console.log('❌ ¡Faltan variables de entorno importantes!');
  console.log('\n📚 Para configurar en AWS Amplify:');
  console.log('1. Ve a AWS Amplify Console');
  console.log('2. Selecciona tu app');
  console.log('3. App Settings → Environment variables');
  console.log('4. Agrega las variables faltantes');
  console.log('5. Ver frontend/web/amplify-env-vars.md para detalles');
  process.exit(1);
} else {
  console.log('✅ Todas las variables de entorno están configuradas correctamente!');
} 