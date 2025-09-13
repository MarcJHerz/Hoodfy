const { Pool } = require('pg');
const mongoose = require('mongoose');
require('dotenv').config();

class MonitoringSetup {
  constructor() {
    this.pgPool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: { rejectUnauthorized: false }
    });
  }

  async setupPostgresMonitoring() {
    const client = await this.pgPool.connect();
    try {
      console.log('📊 Configurando monitoreo PostgreSQL...');

      // Crear tabla de métricas de rendimiento
      await client.query(`
        CREATE TABLE IF NOT EXISTS performance_metrics (
          id SERIAL PRIMARY KEY,
          metric_name VARCHAR(100) NOT NULL,
          metric_value NUMERIC NOT NULL,
          metric_unit VARCHAR(20),
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB DEFAULT '{}'
        );

        CREATE INDEX IF NOT EXISTS idx_performance_metrics_name_time 
        ON performance_metrics(metric_name, timestamp DESC);
      `);

      // Crear tabla de métricas de chat
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_metrics (
          id SERIAL PRIMARY KEY,
          chat_id INTEGER,
          metric_type VARCHAR(50) NOT NULL,
          metric_value NUMERIC NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          metadata JSONB DEFAULT '{}'
        );

        CREATE INDEX IF NOT EXISTS idx_chat_metrics_type_time 
        ON chat_metrics(metric_type, timestamp DESC);
      `);

      // Crear función para limpiar métricas antiguas
      await client.query(`
        CREATE OR REPLACE FUNCTION cleanup_old_metrics()
        RETURNS void AS $$
        BEGIN
          DELETE FROM performance_metrics 
          WHERE timestamp < NOW() - INTERVAL '30 days';
          
          DELETE FROM chat_metrics 
          WHERE timestamp < NOW() - INTERVAL '30 days';
        END;
        $$ LANGUAGE plpgsql;
      `);

      console.log('  ✅ Tablas de monitoreo PostgreSQL creadas');
      
    } catch (error) {
      console.error('❌ Error configurando monitoreo PostgreSQL:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async setupMongoMonitoring() {
    try {
      console.log('📊 Configurando monitoreo MongoDB...');

      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });

      // Crear colección de métricas de rendimiento
      const performanceMetricsSchema = new mongoose.Schema({
        metricName: { type: String, required: true, index: true },
        metricValue: { type: Number, required: true },
        metricUnit: String,
        timestamp: { type: Date, default: Date.now, index: true },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
      }, { collection: 'performance_metrics' });

      // Crear colección de métricas de chat
      const chatMetricsSchema = new mongoose.Schema({
        chatId: { type: String, index: true },
        metricType: { type: String, required: true, index: true },
        metricValue: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now, index: true },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
      }, { collection: 'chat_metrics' });

      // Crear colección de métricas de usuario
      const userMetricsSchema = new mongoose.Schema({
        userId: { type: String, required: true, index: true },
        metricType: { type: String, required: true, index: true },
        metricValue: { type: Number, required: true },
        timestamp: { type: Date, default: Date.now, index: true },
        metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
      }, { collection: 'user_metrics' });

      // Crear índices compuestos para consultas eficientes
      performanceMetricsSchema.index({ metricName: 1, timestamp: -1 });
      chatMetricsSchema.index({ metricType: 1, timestamp: -1 });
      userMetricsSchema.index({ userId: 1, metricType: 1, timestamp: -1 });

      // Crear índices TTL para limpieza automática
      performanceMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 días
      chatMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 días
      userMetricsSchema.index({ timestamp: 1 }, { expireAfterSeconds: 2592000 }); // 30 días

      console.log('  ✅ Colecciones de monitoreo MongoDB creadas');
      
    } catch (error) {
      console.error('❌ Error configurando monitoreo MongoDB:', error);
      throw error;
    } finally {
      await mongoose.connection.close();
    }
  }

  async createMonitoringQueries() {
    const client = await this.pgPool.connect();
    try {
      console.log('📊 Creando consultas de monitoreo...');

      // Consultas de rendimiento de chat
      const monitoringQueries = [
        {
          name: 'chat_performance_summary',
          query: `
            SELECT 
              COUNT(*) as total_chats,
              COUNT(CASE WHEN last_message_at > NOW() - INTERVAL '1 hour' THEN 1 END) as active_chats_1h,
              COUNT(CASE WHEN last_message_at > NOW() - INTERVAL '24 hours' THEN 1 END) as active_chats_24h,
              AVG(EXTRACT(EPOCH FROM (last_message_at - created_at))/3600) as avg_chat_age_hours
            FROM chats 
            WHERE is_active = true
          `
        },
        {
          name: 'message_performance_summary',
          query: `
            SELECT 
              COUNT(*) as total_messages,
              COUNT(CASE WHEN created_at > NOW() - INTERVAL '1 hour' THEN 1 END) as messages_1h,
              COUNT(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 END) as messages_24h,
              AVG(LENGTH(content)) as avg_message_length
            FROM messages 
            WHERE is_deleted = false
          `
        },
        {
          name: 'user_activity_summary',
          query: `
            SELECT 
              COUNT(DISTINCT user_id) as total_participants,
              COUNT(CASE WHEN last_read_at > NOW() - INTERVAL '1 hour' THEN 1 END) as active_participants_1h,
              COUNT(CASE WHEN last_read_at > NOW() - INTERVAL '24 hours' THEN 1 END) as active_participants_24h
            FROM chat_participants
          `
        },
        {
          name: 'top_active_chats',
          query: `
            SELECT 
              c.id,
              c.name,
              c.type,
              COUNT(m.id) as message_count_24h,
              COUNT(DISTINCT cp.user_id) as participant_count
            FROM chats c
            LEFT JOIN messages m ON c.id = m.chat_id 
              AND m.created_at > NOW() - INTERVAL '24 hours'
              AND m.is_deleted = false
            LEFT JOIN chat_participants cp ON c.id = cp.chat_id
            WHERE c.is_active = true
            GROUP BY c.id, c.name, c.type
            ORDER BY message_count_24h DESC
            LIMIT 10
          `
        }
      ];

      for (const query of monitoringQueries) {
        try {
          await client.query(`
            CREATE OR REPLACE VIEW ${query.name} AS ${query.query}
          `);
          console.log(`  ✅ Vista ${query.name} creada`);
        } catch (error) {
          console.log(`  ⚠️ Vista ${query.name}: ${error.message}`);
        }
      }
      
    } catch (error) {
      console.error('❌ Error creando consultas de monitoreo:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async setupCloudWatchMetrics() {
    console.log('☁️ Configurando métricas para CloudWatch...');
    
    const cloudWatchConfig = {
      metrics: [
        {
          name: 'ActiveChats',
          description: 'Número de chats activos en la última hora',
          unit: 'Count',
          query: 'SELECT COUNT(*) FROM chats WHERE last_message_at > NOW() - INTERVAL \'1 hour\' AND is_active = true'
        },
        {
          name: 'MessagesPerHour',
          description: 'Mensajes enviados en la última hora',
          unit: 'Count',
          query: 'SELECT COUNT(*) FROM messages WHERE created_at > NOW() - INTERVAL \'1 hour\' AND is_deleted = false'
        },
        {
          name: 'ActiveUsers',
          description: 'Usuarios activos en la última hora',
          unit: 'Count',
          query: 'SELECT COUNT(DISTINCT user_id) FROM chat_participants WHERE last_read_at > NOW() - INTERVAL \'1 hour\''
        },
        {
          name: 'AverageMessageLength',
          description: 'Longitud promedio de mensajes',
          unit: 'Count',
          query: 'SELECT AVG(LENGTH(content)) FROM messages WHERE created_at > NOW() - INTERVAL \'1 hour\' AND is_deleted = false'
        }
      ]
    };

    console.log('  ✅ Configuración de CloudWatch preparada');
    console.log('  📝 Métricas a configurar:');
    cloudWatchConfig.metrics.forEach(metric => {
      console.log(`    - ${metric.name}: ${metric.description}`);
    });
  }

  async close() {
    await this.pgPool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const monitoring = new MonitoringSetup();
  
  monitoring.setupPostgresMonitoring()
    .then(() => monitoring.setupMongoMonitoring())
    .then(() => monitoring.createMonitoringQueries())
    .then(() => monitoring.setupCloudWatchMetrics())
    .then(() => monitoring.close())
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = MonitoringSetup;
