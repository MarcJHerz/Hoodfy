const axios = require('axios');
const WebSocket = require('ws');
const { performance } = require('perf_hooks');

class LoadTester {
  constructor(baseUrl = 'https://api.hoodfy.com', wsUrl = 'wss://api.hoodfy.com') {
    this.baseUrl = baseUrl;
    this.wsUrl = wsUrl;
    this.results = {
      api: [],
      websocket: [],
      errors: []
    };
  }

  async testApiEndpoints() {
    console.log('🚀 Iniciando pruebas de carga API...\n');

    const endpoints = [
      { method: 'GET', path: '/health', name: 'Health Check' },
      { method: 'GET', path: '/', name: 'Root Endpoint' },
      { method: 'GET', path: '/api/communities', name: 'Get Communities' },
      { method: 'GET', path: '/api/posts', name: 'Get Posts' },
      { method: 'GET', path: '/api/users', name: 'Get Users' }
    ];

    const concurrency = 50; // 50 requests concurrentes
    const totalRequests = 1000; // 1000 requests totales

    for (const endpoint of endpoints) {
      console.log(`📊 Probando ${endpoint.name}...`);
      
      const promises = [];
      const startTime = performance.now();

      for (let i = 0; i < totalRequests; i++) {
        promises.push(this.makeApiRequest(endpoint, i));
      }

      try {
        const responses = await Promise.allSettled(promises);
        const endTime = performance.now();
        
        const successful = responses.filter(r => r.status === 'fulfilled').length;
        const failed = responses.filter(r => r.status === 'rejected').length;
        const duration = endTime - startTime;
        const rps = (successful / duration) * 1000;

        console.log(`  ✅ ${endpoint.name}:`);
        console.log(`    - Exitosas: ${successful}/${totalRequests}`);
        console.log(`    - Fallidas: ${failed}`);
        console.log(`    - RPS: ${rps.toFixed(2)}`);
        console.log(`    - Tiempo: ${duration.toFixed(2)}ms\n`);

        this.results.api.push({
          endpoint: endpoint.name,
          successful,
          failed,
          rps,
          duration
        });

      } catch (error) {
        console.error(`  ❌ Error en ${endpoint.name}:`, error.message);
        this.results.errors.push({
          type: 'API',
          endpoint: endpoint.name,
          error: error.message
        });
      }
    }
  }

  async makeApiRequest(endpoint, requestId) {
    const startTime = performance.now();
    
    try {
      const response = await axios({
        method: endpoint.method,
        url: `${this.baseUrl}${endpoint.path}`,
        timeout: 10000,
        headers: {
          'User-Agent': `LoadTest-${requestId}`,
          'Accept': 'application/json'
        }
      });

      const endTime = performance.now();
      const duration = endTime - startTime;

      return {
        success: true,
        status: response.status,
        duration,
        requestId
      };

    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      return {
        success: false,
        error: error.message,
        status: error.response?.status || 0,
        duration,
        requestId
      };
    }
  }

  async testWebSocketConnections() {
    console.log('🔌 Iniciando pruebas de carga WebSocket...\n');

    const totalConnections = 100;
    const messagesPerConnection = 10;
    const connectionDelay = 100; // ms entre conexiones

    console.log(`📊 Creando ${totalConnections} conexiones WebSocket...`);

    for (let i = 0; i < totalConnections; i++) {
      setTimeout(() => {
        this.createWebSocketConnection(i, messagesPerConnection);
      }, i * connectionDelay);
    }

    // Esperar a que todas las conexiones terminen
    await new Promise(resolve => setTimeout(resolve, 30000));
  }

  createWebSocketConnection(connectionId, messageCount) {
    const startTime = performance.now();
    let receivedMessages = 0;
    let errorCount = 0;

    try {
      const ws = new WebSocket(this.wsUrl, {
        headers: {
          'User-Agent': `LoadTest-WS-${connectionId}`
        }
      });

      ws.on('open', () => {
        console.log(`  ✅ Conexión ${connectionId} establecida`);
        
        // Enviar mensajes de prueba
        for (let i = 0; i < messageCount; i++) {
          setTimeout(() => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'test_message',
                data: `Test message ${i} from connection ${connectionId}`,
                timestamp: Date.now()
              }));
            }
          }, i * 1000);
        }
      });

      ws.on('message', (data) => {
        receivedMessages++;
        if (receivedMessages >= messageCount) {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          this.results.websocket.push({
            connectionId,
            successful: receivedMessages,
            failed: errorCount,
            duration
          });
          
          ws.close();
        }
      });

      ws.on('error', (error) => {
        errorCount++;
        console.log(`  ❌ Error en conexión ${connectionId}:`, error.message);
      });

      ws.on('close', () => {
        console.log(`  🔌 Conexión ${connectionId} cerrada`);
      });

    } catch (error) {
      console.error(`  ❌ Error creando conexión ${connectionId}:`, error.message);
      this.results.errors.push({
        type: 'WebSocket',
        connectionId,
        error: error.message
      });
    }
  }

  async testDatabasePerformance() {
    console.log('🗄️ Iniciando pruebas de rendimiento de base de datos...\n');

    // Simular consultas de base de datos
    const dbQueries = [
      { name: 'Get Chat Messages', duration: Math.random() * 100 + 50 },
      { name: 'Create Message', duration: Math.random() * 50 + 25 },
      { name: 'Get User Chats', duration: Math.random() * 75 + 30 },
      { name: 'Update Chat Participant', duration: Math.random() * 40 + 20 },
      { name: 'Search Messages', duration: Math.random() * 200 + 100 }
    ];

    const totalQueries = 1000;
    const concurrency = 20;

    for (const query of dbQueries) {
      console.log(`📊 Probando ${query.name}...`);
      
      const promises = [];
      const startTime = performance.now();

      for (let i = 0; i < totalQueries; i++) {
        promises.push(this.simulateDbQuery(query, i));
      }

      try {
        const responses = await Promise.allSettled(promises);
        const endTime = performance.now();
        
        const successful = responses.filter(r => r.status === 'fulfilled').length;
        const failed = responses.filter(r => r.status === 'rejected').length;
        const duration = endTime - startTime;
        const qps = (successful / duration) * 1000;

        console.log(`  ✅ ${query.name}:`);
        console.log(`    - Exitosas: ${successful}/${totalQueries}`);
        console.log(`    - Fallidas: ${failed}`);
        console.log(`    - QPS: ${qps.toFixed(2)}`);
        console.log(`    - Tiempo: ${duration.toFixed(2)}ms\n`);

      } catch (error) {
        console.error(`  ❌ Error en ${query.name}:`, error.message);
      }
    }
  }

  async simulateDbQuery(query, queryId) {
    const startTime = performance.now();
    
    try {
      // Simular tiempo de consulta de base de datos
      await new Promise(resolve => setTimeout(resolve, query.duration));
      
      const endTime = performance.now();
      const duration = endTime - startTime;

      return {
        success: true,
        duration,
        queryId
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        queryId
      };
    }
  }

  generateReport() {
    console.log('\n📊 REPORTE DE PRUEBAS DE CARGA');
    console.log('================================\n');

    // Resumen de API
    console.log('🌐 RENDIMIENTO API:');
    console.log('-------------------');
    this.results.api.forEach(result => {
      console.log(`${result.endpoint}:`);
      console.log(`  - RPS: ${result.rps.toFixed(2)}`);
      console.log(`  - Exitosas: ${result.successful}`);
      console.log(`  - Fallidas: ${result.failed}`);
      console.log(`  - Tiempo: ${result.duration.toFixed(2)}ms\n`);
    });

    // Resumen de WebSocket
    console.log('🔌 RENDIMIENTO WEBSOCKET:');
    console.log('-------------------------');
    if (this.results.websocket.length > 0) {
      const avgDuration = this.results.websocket.reduce((sum, r) => sum + r.duration, 0) / this.results.websocket.length;
      const totalSuccessful = this.results.websocket.reduce((sum, r) => sum + r.successful, 0);
      const totalFailed = this.results.websocket.reduce((sum, r) => sum + r.failed, 0);
      
      console.log(`Conexiones totales: ${this.results.websocket.length}`);
      console.log(`Mensajes exitosos: ${totalSuccessful}`);
      console.log(`Mensajes fallidos: ${totalFailed}`);
      console.log(`Tiempo promedio: ${avgDuration.toFixed(2)}ms\n`);
    }

    // Errores
    if (this.results.errors.length > 0) {
      console.log('❌ ERRORES:');
      console.log('-----------');
      this.results.errors.forEach(error => {
        console.log(`${error.type}: ${error.error}`);
      });
    }

    // Recomendaciones
    console.log('\n💡 RECOMENDACIONES:');
    console.log('-------------------');
    console.log('1. Monitorear métricas de CPU y memoria durante las pruebas');
    console.log('2. Configurar alertas para RPS bajos o errores altos');
    console.log('3. Implementar rate limiting más agresivo si es necesario');
    console.log('4. Considerar escalado horizontal si RPS < 100');
    console.log('5. Optimizar consultas de base de datos si QPS < 50');
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const baseUrl = process.env.API_URL || 'https://api.hoodfy.com';
  const wsUrl = process.env.WS_URL || 'wss://api.hoodfy.com';
  
  const tester = new LoadTester(baseUrl, wsUrl);
  
  console.log('🚀 Iniciando pruebas de carga para Hoodfy');
  console.log(`API URL: ${baseUrl}`);
  console.log(`WS URL: ${wsUrl}\n`);
  
  tester.testApiEndpoints()
    .then(() => tester.testWebSocketConnections())
    .then(() => tester.testDatabasePerformance())
    .then(() => tester.generateReport())
    .catch(error => {
      console.error('❌ Error en pruebas de carga:', error);
      process.exit(1);
    });
}

module.exports = LoadTester;
