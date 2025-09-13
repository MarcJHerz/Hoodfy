#!/usr/bin/env node

/**
 * Script para limpiar rate limiting y reiniciar el servidor
 * Útil cuando los usuarios están bloqueados por rate limiting
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Limpiando rate limiting y reiniciando servidor...');

// Función para ejecutar comandos
const runCommand = (command) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error ejecutando: ${command}`);
        console.error(stderr);
        reject(error);
      } else {
        console.log(`✅ ${command}`);
        resolve(stdout);
      }
    });
  });
};

// Función principal
const main = async () => {
  try {
    console.log('🔄 Deteniendo PM2...');
    await runCommand('pm2 stop all');
    
    console.log('🧹 Limpiando logs...');
    await runCommand('pm2 flush');
    
    console.log('🔄 Reiniciando PM2...');
    await runCommand('pm2 restart all');
    
    console.log('📊 Estado de PM2:');
    await runCommand('pm2 status');
    
    console.log('✅ Rate limiting limpiado y servidor reiniciado');
    console.log('💡 Los usuarios ahora pueden hacer login normalmente');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
};

// Ejecutar si es llamado directamente
if (require.main === module) {
  main();
}

module.exports = { main };
