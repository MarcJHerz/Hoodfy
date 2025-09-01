#!/usr/bin/env node

/**
 * 🚀 SCRIPT DE CONFIGURACIÓN DE POSTGRESQL PARA CHAT
 * 
 * Este script:
 * 1. Verifica la conexión a PostgreSQL
 * 2. Crea las tablas en el orden correcto
 * 3. Maneja errores y rollbacks
 * 4. Proporciona feedback detallado
 */

const { Pool } = require('pg');
require('dotenv').config();

class PostgresChatSetup {
  constructor() {
    this.pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: { rejectUnauthorized: false }
    });
    
    this.client = null;
    this.tablesCreated = [];
  }

  async connect() {
    try {
      this.client = await this.pool.connect();
      console.log('✅ Conexión a PostgreSQL establecida');
      return true;
    } catch (error) {
      console.error('❌ Error conectando a PostgreSQL:', error.message);
      return false;
    }
  }

  async disconnect() {
    if (this.client) {
      this.client.release();
    }
    await this.pool.end();
  }

  async createChatTables() {
    console.log('\n📊 Creando tablas de chat...');
    
    try {
      // 1. TABLA CHATS (sin dependencias)
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS chats (
          id SERIAL PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          description TEXT,
          type VARCHAR(50) NOT NULL CHECK (type IN ('community', 'private')),
          community_id VARCHAR(255),
          created_by VARCHAR(255) NOT NULL,
          is_active BOOLEAN DEFAULT true,
          max_participants INTEGER DEFAULT 1000,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_message_at TIMESTAMP,
          last_message_id INTEGER,
          settings JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}'
        );
      `);
      
      // Índices para chats
      await this.client.query(`
        CREATE INDEX IF NOT EXISTS idx_chats_type ON chats(type);
        CREATE INDEX IF NOT EXISTS idx_chats_community_id ON chats(community_id);
        CREATE INDEX IF NOT EXISTS idx_chats_created_by ON chats(created_by);
        CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at);
      `);
      
      this.tablesCreated.push('chats');
      console.log('   ✅ Tabla CHATS creada');

      // 2. TABLA MESSAGES (depende de chats)
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
          sender_id VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          content_type VARCHAR(50) DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'file', 'audio', 'system')),
          reply_to_id INTEGER,
          is_edited BOOLEAN DEFAULT false,
          edited_at TIMESTAMP,
          is_deleted BOOLEAN DEFAULT false,
          deleted_at TIMESTAMP,
          deleted_by VARCHAR(255),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `);
      
      // Agregar la referencia después de crear la tabla
      await this.client.query(`
        ALTER TABLE messages 
        ADD CONSTRAINT fk_messages_reply_to 
        FOREIGN KEY (reply_to_id) REFERENCES messages(id) ON DELETE SET NULL;
      `);
      
      // Índices para messages
      await this.client.query(`
        CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
        CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
        CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);
        CREATE INDEX IF NOT EXISTS idx_messages_content_type ON messages(content_type);
      `);
      
      this.tablesCreated.push('messages');
      console.log('   ✅ Tabla MESSAGES creada');

      // 3. TABLA MESSAGE_REACTIONS (depende de messages)
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS message_reactions (
          id SERIAL PRIMARY KEY,
          message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
          user_id VARCHAR(255) NOT NULL,
          reaction_type VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(message_id, user_id, reaction_type)
        );
      `);
      
      await this.client.query(`
        CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
        CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_message_reactions_reaction_type ON message_reactions(reaction_type);
      `);
      
      this.tablesCreated.push('message_reactions');
      console.log('   ✅ Tabla MESSAGE_REACTIONS creada');

      // 4. TABLA MESSAGE_READS (depende de messages)
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS message_reads (
          id SERIAL PRIMARY KEY,
          message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
          user_id VARCHAR(255) NOT NULL,
          read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(message_id, user_id)
        );
      `);
      
      await this.client.query(`
        CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);
        CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);
        CREATE INDEX IF NOT EXISTS idx_message_reads_read_at ON message_reads(read_at);
      `);
      
      this.tablesCreated.push('message_reads');
      console.log('   ✅ Tabla MESSAGE_READS creada');

      // 5. TABLA CHAT_PARTICIPANTS (depende de chats)
      await this.client.query(`
        CREATE TABLE IF NOT EXISTS chat_participants (
          id SERIAL PRIMARY KEY,
          chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
          user_id VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'member' CHECK (role IN ('admin', 'moderator', 'member')),
          joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_read_at TIMESTAMP,
          unread_count INTEGER DEFAULT 0,
          is_muted BOOLEAN DEFAULT false,
          is_banned BOOLEAN DEFAULT false,
          settings JSONB DEFAULT '{}',
          UNIQUE(chat_id, user_id)
        );
      `);
      
      await this.client.query(`
        CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id);
        CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_participants_role ON chat_participants(role);
      `);
      
      this.tablesCreated.push('chat_participants');
      console.log('   ✅ Tabla CHAT_PARTICIPANTS creada');

      console.log('\n🎉 Todas las tablas de chat creadas exitosamente!');
      return true;

    } catch (error) {
      console.error('\n❌ Error creando tablas:', error.message);
      
      // Intentar rollback
      if (this.tablesCreated.length > 0) {
        console.log('\n🔄 Intentando rollback...');
        await this.rollbackTables();
      }
      
      throw error;
    }
  }

  async rollbackTables() {
    const rollbackOrder = [
      'message_reads',
      'message_reactions', 
      'messages',
      'chat_participants',
      'chats'
    ];

    for (const table of rollbackOrder) {
      try {
        await this.client.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`   🔄 Tabla ${table} eliminada`);
      } catch (error) {
        console.error(`   ❌ Error eliminando tabla ${table}:`, error.message);
      }
    }
  }

  async verifyTables() {
    console.log('\n🔍 Verificando tablas creadas...');
    
    try {
      const result = await this.client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('chats', 'messages', 'message_reactions', 'message_reads', 'chat_participants')
        ORDER BY table_name;
      `);
      
      const tables = result.rows.map(row => row.table_name);
      console.log('   📋 Tablas encontradas:', tables);
      
      if (tables.length === 5) {
        console.log('✅ Todas las tablas están presentes');
        return true;
      } else {
        console.log('❌ Faltan algunas tablas');
        return false;
      }
    } catch (error) {
      console.error('❌ Error verificando tablas:', error.message);
      return false;
    }
  }

  async run() {
    console.log('🚀 INICIANDO CONFIGURACIÓN DE POSTGRESQL PARA CHAT...\n');
    
    try {
      // Verificar variables de entorno
      const requiredEnvVars = ['POSTGRES_HOST', 'POSTGRES_PORT', 'POSTGRES_DB', 'POSTGRES_USER', 'POSTGRES_PASSWORD'];
      const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
      
      if (missingVars.length > 0) {
        console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
        console.error('   Asegúrate de configurar estas variables en tu archivo .env');
        return false;
      }

      console.log('📋 Variables de entorno verificadas');
      console.log(`   Host: ${process.env.POSTGRES_HOST}`);
      console.log(`   Puerto: ${process.env.POSTGRES_PORT}`);
      console.log(`   Base de datos: ${process.env.POSTGRES_DB}`);
      console.log(`   Usuario: ${process.env.POSTGRES_USER}`);

      // Conectar a PostgreSQL
      if (!(await this.connect())) {
        return false;
      }

      // Crear tablas
      await this.createChatTables();

      // Verificar tablas
      if (!(await this.verifyTables())) {
        return false;
      }

      console.log('\n🎉 CONFIGURACIÓN COMPLETADA EXITOSAMENTE!');
      console.log('   El sistema de chat está listo para usar.');
      
      return true;

    } catch (error) {
      console.error('\n💥 ERROR CRÍTICO:', error.message);
      return false;
    } finally {
      await this.disconnect();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const setup = new PostgresChatSetup();
  setup.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = PostgresChatSetup;
