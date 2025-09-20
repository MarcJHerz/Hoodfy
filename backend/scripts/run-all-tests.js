const { exec } = require('child_process');
const path = require('path');

console.log('🚀 Ejecutando todos los tests de MongoDB...\n');

const scripts = [
  { name: 'Verificación de conexión', file: 'check-mongodb.js' },
  { name: 'Filtrado de comunidades eliminadas', file: 'test-deleted-filter.js' },
  { name: 'Análisis simple de salud', file: 'simple-health-check.js' }
];

async function runScript(script) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🔍 Ejecutando: ${script.name}`);
    console.log(`${'='.repeat(60)}\n`);
    
    const scriptPath = path.join(__dirname, script.file);
    const child = exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Error en ${script.name}:`, error.message);
        reject(error);
      } else {
        console.log(`✅ ${script.name} completado`);
        resolve();
      }
    });
    
    child.stdout.on('data', (data) => {
      process.stdout.write(data);
    });
    
    child.stderr.on('data', (data) => {
      process.stderr.write(data);
    });
  });
}

async function runAllTests() {
  try {
    for (const script of scripts) {
      await runScript(script);
    }
    
    console.log('\n🎉 Todos los tests completados exitosamente');
    
  } catch (error) {
    console.error('\n❌ Error en los tests:', error.message);
    process.exit(1);
  }
}

// Ejecutar todos los tests
runAllTests();
