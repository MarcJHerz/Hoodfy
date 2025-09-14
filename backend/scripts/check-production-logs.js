const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

async function checkProductionLogs() {
  console.log('🔍 Verificando logs de producción...\n');
  
  try {
    // Verificar si PM2 está corriendo
    console.log('1. Verificando estado de PM2...');
    const { stdout: pm2Status } = await execAsync('pm2 status');
    console.log(pm2Status);
    
    // Verificar logs recientes
    console.log('\n2. Verificando logs recientes...');
    const { stdout: recentLogs } = await execAsync('pm2 logs --lines 50');
    console.log(recentLogs);
    
    // Buscar errores específicos
    console.log('\n3. Buscando errores específicos...');
    
    // Buscar errores de Socket.io
    try {
      const { stdout: socketErrors } = await execAsync('pm2 logs --lines 100 | grep -i "socket\\|jwt\\|algorithm"');
      if (socketErrors.trim()) {
        console.log('🔴 Errores de Socket.io encontrados:');
        console.log(socketErrors);
      } else {
        console.log('✅ No se encontraron errores de Socket.io');
      }
    } catch (error) {
      console.log('⚠️  No se pudieron buscar errores de Socket.io');
    }
    
    // Buscar errores de Redis
    try {
      const { stdout: redisErrors } = await execAsync('pm2 logs --lines 100 | grep -i "redis\\|valkey\\|cluster"');
      if (redisErrors.trim()) {
        console.log('🔴 Errores de Redis/Valkey encontrados:');
        console.log(redisErrors);
      } else {
        console.log('✅ No se encontraron errores de Redis/Valkey');
      }
    } catch (error) {
      console.log('⚠️  No se pudieron buscar errores de Redis/Valkey');
    }
    
    // Buscar errores de chat
    try {
      const { stdout: chatErrors } = await execAsync('pm2 logs --lines 100 | grep -i "chat\\|community"');
      if (chatErrors.trim()) {
        console.log('🔴 Errores de chat encontrados:');
        console.log(chatErrors);
      } else {
        console.log('✅ No se encontraron errores de chat');
      }
    } catch (error) {
      console.log('⚠️  No se pudieron buscar errores de chat');
    }
    
  } catch (error) {
    console.error('❌ Error verificando logs:', error.message);
  }
}

async function restartServices() {
  console.log('\n🔄 Reiniciando servicios...\n');
  
  try {
    // Reiniciar PM2
    console.log('1. Reiniciando PM2...');
    await execAsync('pm2 restart all');
    console.log('✅ PM2 reiniciado');
    
    // Verificar estado después del reinicio
    console.log('\n2. Verificando estado después del reinicio...');
    const { stdout: status } = await execAsync('pm2 status');
    console.log(status);
    
  } catch (error) {
    console.error('❌ Error reiniciando servicios:', error.message);
  }
}

async function main() {
  try {
    await checkProductionLogs();
    
    // Preguntar si reiniciar servicios
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const answer = await new Promise((resolve) => {
      rl.question('\n¿Deseas reiniciar los servicios? (y/N): ', resolve);
    });
    
    rl.close();
    
    if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
      await restartServices();
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

if (require.main === module) {
  main();
}

module.exports = { checkProductionLogs, restartServices };
