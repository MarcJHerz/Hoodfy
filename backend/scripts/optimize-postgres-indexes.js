const { Pool } = require('pg');
require('dotenv').config();

class PostgresOptimizer {
  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: { rejectUnauthorized: false }
    });
  }

  async optimizeIndexes() {
    const client = await this.pool.connect();
    try {
      console.log('🚀 Iniciando optimización de índices PostgreSQL...\n');

      // 1. Índices compuestos para consultas frecuentes
      await this.createCompositeIndexes(client);
      
      // 2. Índices de texto completo para búsquedas
      await this.createFullTextIndexes(client);
      
      // 3. Índices parciales para consultas específicas
      await this.createPartialIndexes(client);
      
      // 4. Índices de cobertura para consultas frecuentes
      await this.createCoveringIndexes(client);
      
      // 5. Análisis de estadísticas
      await this.analyzeTables(client);
      
      console.log('\n✅ Optimización de índices completada');
      
    } catch (error) {
      console.error('❌ Error optimizando índices:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async createCompositeIndexes(client) {
    console.log('📊 Creando índices compuestos...');
    
    const compositeIndexes = [
      // Para obtener mensajes de un chat ordenados por fecha
      {
        name: 'idx_messages_chat_created_desc',
        table: 'messages',
        columns: '(chat_id, created_at DESC)',
        condition: 'WHERE is_deleted = false'
      },
      // Para obtener chats de un usuario ordenados por último mensaje
      {
        name: 'idx_chats_participant_last_message',
        table: 'chats',
        columns: '(id, last_message_at DESC)',
        condition: 'WHERE is_active = true'
      },
      // Para búsquedas de mensajes por chat y tipo
      {
        name: 'idx_messages_chat_type_created',
        table: 'messages',
        columns: '(chat_id, content_type, created_at DESC)',
        condition: 'WHERE is_deleted = false'
      },
      // Para obtener participantes de un chat con rol
      {
        name: 'idx_participants_chat_role',
        table: 'chat_participants',
        columns: '(chat_id, role, joined_at)',
        condition: 'WHERE is_banned = false'
      },
      // Para reacciones por mensaje y usuario
      {
        name: 'idx_reactions_message_user',
        table: 'message_reactions',
        columns: '(message_id, user_id, reaction_type)',
        condition: ''
      }
    ];

    for (const index of compositeIndexes) {
      try {
        await client.query(`
          CREATE INDEX IF NOT EXISTS ${index.name} 
          ON ${index.table} ${index.columns}
          ${index.condition}
        `);
        console.log(`  ✅ ${index.name}`);
      } catch (error) {
        console.log(`  ⚠️ ${index.name}: ${error.message}`);
      }
    }
  }

  async createFullTextIndexes(client) {
    console.log('\n🔍 Creando índices de texto completo...');
    
    const fullTextIndexes = [
      // Índice de texto completo para búsqueda de mensajes
      {
        name: 'idx_messages_content_fts',
        table: 'messages',
        column: 'content',
        condition: 'WHERE is_deleted = false'
      },
      // Índice de texto completo para búsqueda de chats
      {
        name: 'idx_chats_name_description_fts',
        table: 'chats',
        column: 'name, description',
        condition: 'WHERE is_active = true'
      }
    ];

    for (const index of fullTextIndexes) {
      try {
        await client.query(`
          CREATE INDEX IF NOT EXISTS ${index.name} 
          ON ${index.table} USING gin(to_tsvector('spanish', ${index.column}))
          ${index.condition}
        `);
        console.log(`  ✅ ${index.name}`);
      } catch (error) {
        console.log(`  ⚠️ ${index.name}: ${error.message}`);
      }
    }
  }

  async createPartialIndexes(client) {
    console.log('\n🎯 Creando índices parciales...');
    
    const partialIndexes = [
      // Solo mensajes no eliminados
      {
        name: 'idx_messages_active',
        table: 'messages',
        columns: '(chat_id, created_at DESC)',
        condition: 'WHERE is_deleted = false'
      },
      // Solo chats activos
      {
        name: 'idx_chats_active',
        table: 'chats',
        columns: '(type, last_message_at DESC)',
        condition: 'WHERE is_active = true'
      },
      // Solo participantes no baneados
      {
        name: 'idx_participants_active',
        table: 'chat_participants',
        columns: '(chat_id, user_id)',
        condition: 'WHERE is_banned = false'
      },
      // Solo mensajes de texto para búsquedas
      {
        name: 'idx_messages_text_search',
        table: 'messages',
        columns: '(chat_id, content)',
        condition: 'WHERE is_deleted = false AND content_type = \'text\''
      }
    ];

    for (const index of partialIndexes) {
      try {
        await client.query(`
          CREATE INDEX IF NOT EXISTS ${index.name} 
          ON ${index.table} ${index.columns}
          ${index.condition}
        `);
        console.log(`  ✅ ${index.name}`);
      } catch (error) {
        console.log(`  ⚠️ ${index.name}: ${error.message}`);
      }
    }
  }

  async createCoveringIndexes(client) {
    console.log('\n🛡️ Creando índices de cobertura...');
    
    const coveringIndexes = [
      // Índice de cobertura para lista de chats del usuario
      {
        name: 'idx_chats_user_covering',
        table: 'chats',
        columns: '(id, name, type, last_message_at, last_message_id)',
        condition: 'WHERE is_active = true'
      },
      // Índice de cobertura para mensajes básicos
      {
        name: 'idx_messages_basic_covering',
        table: 'messages',
        columns: '(id, chat_id, sender_id, content, content_type, created_at)',
        condition: 'WHERE is_deleted = false'
      }
    ];

    for (const index of coveringIndexes) {
      try {
        await client.query(`
          CREATE INDEX IF NOT EXISTS ${index.name} 
          ON ${index.table} ${index.columns}
          ${index.condition}
        `);
        console.log(`  ✅ ${index.name}`);
      } catch (error) {
        console.log(`  ⚠️ ${index.name}: ${error.message}`);
      }
    }
  }

  async analyzeTables(client) {
    console.log('\n📈 Analizando estadísticas de tablas...');
    
    const tables = ['chats', 'messages', 'chat_participants', 'message_reactions', 'message_reads'];
    
    for (const table of tables) {
      try {
        await client.query(`ANALYZE ${table}`);
        console.log(`  ✅ ${table} analizada`);
      } catch (error) {
        console.log(`  ⚠️ ${table}: ${error.message}`);
      }
    }
  }

  async getIndexStats() {
    const client = await this.pool.connect();
    try {
      console.log('\n📊 Estadísticas de índices:');
      
      const result = await client.query(`
        SELECT 
          schemaname,
          tablename,
          indexname,
          indexdef
        FROM pg_indexes 
        WHERE schemaname = 'public' 
        AND tablename IN ('chats', 'messages', 'chat_participants', 'message_reactions', 'message_reads')
        ORDER BY tablename, indexname;
      `);
      
      result.rows.forEach(row => {
        console.log(`  📋 ${row.tablename}.${row.indexname}`);
      });
      
    } catch (error) {
      console.error('❌ Error obteniendo estadísticas:', error);
    } finally {
      client.release();
    }
  }

  async close() {
    await this.pool.end();
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const optimizer = new PostgresOptimizer();
  
  optimizer.optimizeIndexes()
    .then(() => optimizer.getIndexStats())
    .then(() => optimizer.close())
    .catch(error => {
      console.error('❌ Error:', error);
      process.exit(1);
    });
}

module.exports = PostgresOptimizer;
