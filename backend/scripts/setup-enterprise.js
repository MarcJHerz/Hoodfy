#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🚀 HOODFY ENTERPRISE TRANSFORMATION - SETUP RÁPIDO\n');

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

// 1. Verificar archivo .env
logSection('1. VERIFICACIÓN DE VARIABLES DE ENTORNO');

const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  logError('Archivo .env no encontrado!');
  logInfo('Copia env.example a .env y configura las variables');
  process.exit(1);
}

logSuccess('Archivo .env encontrado');

// 2. Verificar variables críticas
logSection('2. VERIFICACIÓN DE VARIABLES CRÍTICAS');

const criticalVars = {
  'Servidor': ['PORT', 'NODE_ENV'],
  'MongoDB': ['MONGODB_URI'],
  'PostgreSQL': ['POSTGRES_HOST', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD'],
  'Redis': ['REDIS_HOST', 'REDIS_PORT'],
  'AWS': ['AWS_REGION', 'AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'],
  'Stripe': ['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET'],
  'OpenSearch': ['OPENSEARCH_URL', 'OPENSEARCH_USE_IAM']
};

let allCriticalVarsPresent = true;

Object.entries(criticalVars).forEach(([service, vars]) => {
  const missing = vars.filter(varName => !process.env[varName]);
  if (missing.length > 0) {
    logError(`${service}: Variables faltantes - ${missing.join(', ')}`);
    allCriticalVarsPresent = false;
  } else {
    logSuccess(`${service}: Todas las variables configuradas`);
  }
});

// Verificación específica de OpenSearch
if (process.env.OPENSEARCH_USE_IAM === 'true') {
  logInfo('OpenSearch configurado para usar IAM');
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    logError('OpenSearch IAM: Credenciales AWS faltantes');
    allCriticalVarsPresent = false;
  } else {
    logSuccess('OpenSearch IAM: Credenciales AWS configuradas');
  }
} else if (process.env.OPENSEARCH_USE_IAM === 'false') {
  logInfo('OpenSearch configurado para usar autenticación básica');
  if (!process.env.OPENSEARCH_USERNAME || !process.env.OPENSEARCH_PASSWORD) {
    logError('OpenSearch básico: Usuario o contraseña faltantes');
    allCriticalVarsPresent = false;
  } else {
    logSuccess('OpenSearch básico: Usuario y contraseña configurados');
  }
} else {
  logWarning('OPENSEARCH_USE_IAM no está configurado, usando IAM por defecto');
}

if (!allCriticalVarsPresent) {
  logWarning('Algunas variables críticas están faltando');
  logInfo('Revisa el archivo env.example para ver todas las variables requeridas');
}

// 3. Verificar dependencias
logSection('3. VERIFICACIÓN DE DEPENDENCIAS');

const packagePath = path.join(__dirname, '..', 'package.json');
if (!fs.existsSync(packagePath)) {
  logError('package.json no encontrado');
  process.exit(1);
}

const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
const requiredDeps = [
  'socket.io', 'ioredis', 'pg', 'winston', 'winston-elasticsearch'
];

const missingDeps = requiredDeps.filter(dep => !packageJson.dependencies[dep]);

if (missingDeps.length > 0) {
  logWarning(`Dependencias faltantes: ${missingDeps.join(', ')}`);
  logInfo('Ejecuta: npm install socket.io ioredis pg winston winston-elasticsearch');
} else {
  logSuccess('Todas las dependencias de enterprise están instaladas');
}

// 4. Verificar estructura de directorios
logSection('4. VERIFICACIÓN DE ESTRUCTURA');

const requiredDirs = [
  'services', 'utils', 'config', 'scripts'
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '..', dir);
  if (fs.existsSync(dirPath)) {
    logSuccess(`Directorio ${dir}/ existe`);
  } else {
    logWarning(`Directorio ${dir}/ no encontrado`);
  }
});

// 5. Verificar archivos críticos
logSection('5. VERIFICACIÓN DE ARCHIVOS CRÍTICOS');

const requiredFiles = [
  'services/chatService.js',
  'services/cacheService.js',
  'utils/logger.js',
  'ecosystem.config.js'
];

requiredFiles.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  if (fs.existsSync(filePath)) {
    logSuccess(`${file} existe`);
  } else {
    logWarning(`${file} no encontrado`);
  }
});

// 6. Recomendaciones
logSection('6. RECOMENDACIONES Y PRÓXIMOS PASOS');

if (!allCriticalVarsPresent) {
  logWarning('Configura todas las variables de entorno antes de continuar');
  logInfo('1. Copia env.example a .env');
  logInfo('2. Configura las variables con tus valores reales');
  logInfo('3. Ejecuta: node scripts/test-connections.js');
} else {
  logSuccess('¡Todo está configurado correctamente!');
  logInfo('Próximos pasos:');
  logInfo('1. Ejecuta: node scripts/test-connections.js');
  logInfo('2. Si las conexiones funcionan, ejecuta: node scripts/migrateFirebaseToPostgres.js');
  logInfo('3. Inicia el servidor: npm run dev');
}

// 7. Comandos útiles
logSection('7. COMANDOS ÚTILES');

console.log(`${colors.magenta}Comandos disponibles:${colors.reset}`);
console.log('  npm run test:connections    - Probar todas las conexiones');
console.log('  npm run migrate:chat        - Migrar chat de Firebase a PostgreSQL');
console.log('  npm run dev                 - Iniciar servidor de desarrollo');
console.log('  npm run start:cluster       - Iniciar con PM2 clustering');
console.log('  npm run monitor             - Monitorear con PM2');

console.log(`\n${colors.magenta}Archivos de configuración:${colors.reset}`);
console.log('  .env                        - Variables de entorno');
console.log('  ecosystem.config.js         - Configuración PM2');
console.log('  docker-compose.yml          - Entorno de desarrollo');

console.log(`\n${colors.magenta}Documentación:${colors.reset}`);
console.log('  HOODFY_ENTERPRISE_TRANSFORMATION_PLAN.md');
console.log('  IMPLEMENTATION_GUIDE.md');
console.log('  IMPLEMENTATION_SUMMARY.md');

console.log(`\n${colors.green}${colors.bright}¡Hoodfy Enterprise está listo para la transformación! 🚀${colors.reset}\n`);
