#!/usr/bin/env node

require('dotenv').config();
const { Client } = require('@opensearch-project/opensearch');

console.log('🔍 HOODFY - DIAGNÓSTICO DE OPENSEARCH\n');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log(`\n${colors.cyan}${colors.bright}${title}${colors.reset}`);
  console.log('─'.repeat(title.length));
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// 1. Verificar variables de entorno
logSection('1. VERIFICACIÓN DE VARIABLES DE ENTORNO');

const requiredVars = ['OPENSEARCH_URL', 'OPENSEARCH_USE_IAM'];
const optionalVars = ['OPENSEARCH_USERNAME', 'OPENSEARCH_PASSWORD', 'OPENSEARCH_REGION', 'AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];

console.log('Variables requeridas:');
requiredVars.forEach(varName => {
  if (process.env[varName]) {
    logSuccess(`${varName}: ${process.env[varName]}`);
  } else {
    logError(`${varName}: NO CONFIGURADA`);
  }
});

console.log('\nVariables opcionales:');
optionalVars.forEach(varName => {
  if (process.env[varName]) {
    logInfo(`${varName}: ${varName.includes('PASSWORD') || varName.includes('SECRET') ? '***CONFIGURADA***' : process.env[varName]}`);
  } else {
    logWarning(`${varName}: no configurada`);
  }
});

// 2. Verificar configuración de autenticación
logSection('2. CONFIGURACIÓN DE AUTENTICACIÓN');

const useIAM = process.env.OPENSEARCH_USE_IAM === 'true';
logInfo(`Método de autenticación: ${useIAM ? 'IAM' : 'Básica'}`);

if (useIAM) {
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    logSuccess('Credenciales AWS configuradas para IAM');
  } else {
    logError('Credenciales AWS faltantes para IAM');
  }
  
  if (process.env.OPENSEARCH_REGION || process.env.AWS_REGION) {
    logSuccess('Región AWS configurada');
  } else {
    logError('Región AWS no configurada');
  }
} else {
  if (process.env.OPENSEARCH_USERNAME && process.env.OPENSEARCH_PASSWORD) {
    logSuccess('Usuario y contraseña configurados');
  } else {
    logError('Usuario o contraseña faltantes');
  }
}

// 3. Probar conexión con diferentes configuraciones
logSection('3. PRUEBAS DE CONEXIÓN');

async function testConnection(config, description) {
  try {
    logInfo(`Probando: ${description}`);
    
    const client = new Client(config);
    
    // Probar conexión básica
    const info = await client.info();
    logSuccess(`✅ ${description} - Conectado correctamente`);
    logInfo(`   Versión: ${info.body.version.number}`);
    
    // Probar health del cluster
    const clusterInfo = await client.cluster.health();
    logInfo(`   Estado del clúster: ${clusterInfo.body.status}`);
    logInfo(`   Nodos activos: ${clusterInfo.body.number_of_nodes}`);
    
    return true;
  } catch (error) {
    logError(`❌ ${description} - Error: ${error.message}`);
    return false;
  }
}

// Configuración 1: IAM
if (useIAM && process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
  const iamConfig = {
    node: process.env.OPENSEARCH_URL,
    auth: {
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
      region: process.env.OPENSEARCH_REGION || process.env.AWS_REGION || 'us-east-1'
    },
    ssl: { 
      rejectUnauthorized: false,
      ca: undefined,
      checkServerIdentity: () => undefined
    },
    requestTimeout: 15000,
    maxRetries: 2,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  await testConnection(iamConfig, 'Autenticación IAM');
}

// Configuración 2: Básica
if (!useIAM && process.env.OPENSEARCH_USERNAME && process.env.OPENSEARCH_PASSWORD) {
  const basicConfig = {
    node: process.env.OPENSEARCH_URL,
    auth: {
      username: process.env.OPENSEARCH_USERNAME,
      password: process.env.OPENSEARCH_PASSWORD
    },
    ssl: { 
      rejectUnauthorized: false,
      ca: undefined,
      checkServerIdentity: () => undefined
    },
    requestTimeout: 15000,
    maxRetries: 2,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  await testConnection(basicConfig, 'Autenticación básica');
}

// Configuración 3: Sin autenticación (para testing)
const noAuthConfig = {
  node: process.env.OPENSEARCH_URL,
  ssl: { 
    rejectUnauthorized: false,
    ca: undefined,
    checkServerIdentity: () => undefined
  },
  requestTimeout: 15000,
  maxRetries: 2,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
};

await testConnection(noAuthConfig, 'Sin autenticación (testing)');

// 4. Recomendaciones
logSection('4. RECOMENDACIONES');

if (useIAM) {
  logInfo('Para autenticación IAM:');
  logInfo('1. Verificar que el rol IAM tenga permisos para OpenSearch');
  logInfo('2. Verificar que las credenciales AWS sean válidas');
  logInfo('3. Verificar que la región sea correcta');
  logInfo('4. Verificar VPC Endpoint y Security Groups');
} else {
  logInfo('Para autenticación básica:');
  logInfo('1. Verificar que el usuario y contraseña sean correctos');
  logInfo('2. Verificar que el usuario tenga permisos en OpenSearch');
  logInfo('3. Verificar que la autenticación básica esté habilitada');
}

logInfo('\nComandos útiles:');
logInfo('1. Verificar conectividad: curl -k https://your-opensearch-domain.com');
logInfo('2. Verificar logs de OpenSearch en AWS Console');
logInfo('3. Verificar Security Groups y VPC Endpoints');

console.log(`\n${colors.green}${colors.bright}Diagnóstico completado! 🚀${colors.reset}\n`);
