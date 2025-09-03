#!/usr/bin/env node

/**
 * Script para limpiar chats privados duplicados
 * Este script identifica y consolida chats privados duplicados entre los mismos usuarios
 */

const { Pool } = require('pg');
require('dotenv').config();

class ChatCleanup {
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

  async init() {
    console.log('🧹 Iniciando limpieza de chats duplicados...');
    
    try {
      // Encontrar chats privados duplicados
      const duplicates = await this.findDuplicatePrivateChats();
      
      if (duplicates.length === 0) {
        console.log('✅ No se encontraron chats privados duplicados');
        return;
      }

      console.log(`🔍 Encontrados ${duplicates.length} pares de usuarios con chats duplicados:`);
      
      for (const duplicate of duplicates) {
        console.log(`\n👥 Usuarios: ${duplicate.user1} y ${duplicate.user2}`);
        console.log(`   Chats: ${duplicate.chat_ids.join(', ')}`);
        
        // Consolidar chats duplicados
        await this.consolidateChats(duplicate);
      }
      
      console.log('\n✅ Limpieza completada exitosamente');
      
    } catch (error) {
      console.error('❌ Error durante la limpieza:', error);
    } finally {
      await this.pool.end();
    }
  }

  async findDuplicatePrivateChats() {
    const client = await this.pool.connect();
    try {
      // Buscar pares de usuarios que tienen múltiples chats privados
      const result = await client.query(`
        WITH user_pairs AS (
          SELECT 
            LEAST(cp1.user_id, cp2.user_id) as user1,
            GREATEST(cp1.user_id, cp2.user_id) as user2,
            c.id as chat_id
          FROM chats c
          INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id
          INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id
          WHERE c.type = 'private' 
          AND c.is_active = true
          AND cp1.user_id < cp2.user_id
          AND cp1.is_banned = false 
          AND cp2.is_banned = false
        ),
        duplicate_pairs AS (
          SELECT 
            user1, 
            user2, 
            COUNT(*) as chat_count,
            ARRAY_AGG(chat_id ORDER BY chat_id) as chat_ids
          FROM user_pairs
          GROUP BY user1, user2
          HAVING COUNT(*) > 1
        )
        SELECT * FROM duplicate_pairs
        ORDER BY chat_count DESC, user1, user2
      `);

      return result.rows;
    } catch (error) {
      console.error('❌ Error buscando chats duplicados:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async consolidateChats(duplicate) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const { user1, user2, chat_ids } = duplicate;
      
      // Mantener el chat más antiguo (menor ID)
      const keepChatId = Math.min(...chat_ids);
      const deleteChatIds = chat_ids.filter(id => id !== keepChatId);
      
      console.log(`   🔄 Consolidando en chat ${keepChatId}, eliminando: ${deleteChatIds.join(', ')}`);
      
      // Mover mensajes de chats duplicados al chat principal
      for (const deleteChatId of deleteChatIds) {
        await client.query(`
          UPDATE messages 
          SET chat_id = $1 
          WHERE chat_id = $2
        `, [keepChatId, deleteChatId]);
        
        console.log(`   📝 Mensajes movidos de chat ${deleteChatId} a ${keepChatId}`);
      }
      
      // Eliminar participantes de chats duplicados
      for (const deleteChatId of deleteChatIds) {
        await client.query(`
          DELETE FROM chat_participants 
          WHERE chat_id = $1
        `, [deleteChatId]);
      }
      
      // Eliminar chats duplicados
      for (const deleteChatId of deleteChatIds) {
        await client.query(`
          DELETE FROM chats 
          WHERE id = $1
        `, [deleteChatId]);
      }
      
      // Actualizar timestamp del último mensaje en el chat principal
      await client.query(`
        UPDATE chats 
        SET last_message_at = (
          SELECT MAX(created_at) 
          FROM messages 
          WHERE chat_id = $1
        ),
        updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [keepChatId]);
      
      await client.query('COMMIT');
      console.log(`   ✅ Consolidación completada para usuarios ${user1} y ${user2}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`   ❌ Error consolidando chats para usuarios ${duplicate.user1} y ${duplicate.user2}:`, error);
      throw error;
    } finally {
      client.release();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const cleanup = new ChatCleanup();
  cleanup.init().catch(console.error);
}

module.exports = ChatCleanup;
