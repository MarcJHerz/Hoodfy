#!/usr/bin/env node

/**
 * Script para limpiar rate limiting de uploads
 * Útil cuando los usuarios están bloqueados por límites de upload
 */

const { exec } = require('child_process');

console.log('🧹 Limpiando rate limiting de uploads...');

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
    console.log('🔄 Reiniciando PM2 para limpiar rate limiting...');
    await runCommand('pm2 restart all');
    
    console.log('📊 Estado de PM2:');
    await runCommand('pm2 status');
    
    console.log('✅ Rate limiting de uploads limpiado');
    console.log('💡 Los usuarios ahora pueden subir imágenes normalmente');
    
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
