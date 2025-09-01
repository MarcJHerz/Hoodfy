#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Verificando variables de entorno...\n');

// Variables requeridas para el chat
const requiredEnvVars = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_FIREBASE_API_KEY',
  'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
  'NEXT_PUBLIC_FIREBASE_PROJECT_ID'
];

// Variables opcionales pero recomendadas
const optionalEnvVars = [
  'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
  'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
  'NEXT_PUBLIC_FIREBASE_APP_ID'
];

let hasErrors = false;

// Verificar variables requeridas
console.log('📋 Variables requeridas:');
requiredEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== 'undefined' && value !== '') {
    console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`  ❌ ${varName}: NO DEFINIDA`);
    hasErrors = true;
  }
});

console.log('\n📋 Variables opcionales:');
optionalEnvVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== 'undefined' && value !== '') {
    console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`  ⚠️  ${varName}: No definida (opcional)`);
  }
});

// Verificar archivo .env.local
const envLocalPath = path.join(__dirname, '..', '.env.local');
if (fs.existsSync(envLocalPath)) {
  console.log('\n📁 Archivo .env.local encontrado');
} else {
  console.log('\n⚠️  Archivo .env.local NO encontrado');
  console.log('   Crea este archivo con las variables de entorno necesarias');
}

// Verificar archivo .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  console.log('📁 Archivo .env encontrado');
} else {
  console.log('⚠️  Archivo .env NO encontrado');
}

if (hasErrors) {
  console.log('\n❌ ERROR: Faltan variables de entorno requeridas');
  console.log('   Crea un archivo .env.local con las siguientes variables:');
  console.log('\n   # Chat API Configuration');
  console.log('   NEXT_PUBLIC_API_URL=https://api.qahood.com');
  console.log('\n   # Firebase Configuration');
  console.log('   NEXT_PUBLIC_FIREBASE_API_KEY=tu_api_key');
  console.log('   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com');
  console.log('   NEXT_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto_id');
  process.exit(1);
} else {
  console.log('\n✅ Todas las variables de entorno requeridas están configuradas');
  console.log('   El sistema de chat debería funcionar correctamente');
} 