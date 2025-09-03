#!/usr/bin/env node

/**
 * Script agresivo para limpiar chats privados duplicados
 * Este script identifica y elimina chats privados duplicados de forma más agresiva
 */

const { Pool } = require('pg');
require('dotenv').config();

class AggressiveChatCleanup {
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
    console.log('🧹 Iniciando limpieza agresiva de chats duplicados...');
    
    try {
      // 1. Mostrar todos los chats privados
      await this.showAllPrivateChats();
      
      // 2. Encontrar y consolidar duplicados
      await this.findAndConsolidateDuplicates();
      
      // 3. Limpiar chats huérfanos
      await this.cleanupOrphanedChats();
      
      console.log('\n✅ Limpieza agresiva completada');
      
    } catch (error) {
      console.error('❌ Error durante la limpieza:', error);
    } finally {
      await this.pool.end();
    }
  }

  async showAllPrivateChats() {
    const client = await this.pool.connect();
    try {
      console.log('\n📋 TODOS LOS CHATS PRIVADOS:');
      const result = await client.query(`
        SELECT 
          c.id,
          c.name,
          c.created_at,
          c.last_message_at,
          COUNT(cp.user_id) as participant_count,
          ARRAY_AGG(cp.user_id ORDER BY cp.user_id) as participants
        FROM chats c
        LEFT JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE c.type = 'private' AND c.is_active = true
        GROUP BY c.id, c.name, c.created_at, c.last_message_at
        ORDER BY c.id
      `);

      result.rows.forEach(chat => {
        console.log(`   Chat ${chat.id}: ${chat.participants.join(', ')} (${chat.participant_count} participantes)`);
      });
      
    } catch (error) {
      console.error('❌ Error mostrando chats:', error);
    } finally {
      client.release();
    }
  }

  async findAndConsolidateDuplicates() {
    const client = await this.pool.connect();
    try {
      console.log('\n🔍 Buscando chats duplicados...');
      
      // Buscar chats con exactamente 2 participantes que sean duplicados
      const result = await client.query(`
        WITH chat_pairs AS (
          SELECT 
            c.id as chat_id,
            ARRAY_AGG(cp.user_id ORDER BY cp.user_id) as participants,
            COUNT(cp.user_id) as participant_count
          FROM chats c
          INNER JOIN chat_participants cp ON c.id = cp.chat_id
          WHERE c.type = 'private' AND c.is_active = true
          GROUP BY c.id
          HAVING COUNT(cp.user_id) = 2
        ),
        duplicate_groups AS (
          SELECT 
            participants,
            COUNT(*) as chat_count,
            ARRAY_AGG(chat_id ORDER BY chat_id) as chat_ids
          FROM chat_pairs
          GROUP BY participants
          HAVING COUNT(*) > 1
        )
        SELECT * FROM duplicate_groups
        ORDER BY chat_count DESC
      `);

      if (result.rows.length === 0) {
        console.log('✅ No se encontraron chats duplicados con 2 participantes');
        return;
      }

      console.log(`🔍 Encontrados ${result.rows.length} grupos de chats duplicados:`);
      
      for (const group of result.rows) {
        console.log(`\n👥 Participantes: ${group.participants.join(' y ')}`);
        console.log(`   Chats: ${group.chat_ids.join(', ')}`);
        
        // Consolidar este grupo
        await this.consolidateChatGroup(group);
      }
      
    } catch (error) {
      console.error('❌ Error buscando duplicados:', error);
    } finally {
      client.release();
    }
  }

  async consolidateChatGroup(group) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      
      const { participants, chat_ids } = group;
      
      // Mantener el chat más antiguo (menor ID)
      const keepChatId = Math.min(...chat_ids);
      const deleteChatIds = chat_ids.filter(id => id !== keepChatId);
      
      console.log(`   🔄 Consolidando en chat ${keepChatId}, eliminando: ${deleteChatIds.join(', ')}`);
      
      // Mover mensajes de chats duplicados al chat principal
      for (const deleteChatId of deleteChatIds) {
        const messageResult = await client.query(`
          UPDATE messages 
          SET chat_id = $1 
          WHERE chat_id = $2
          RETURNING id
        `, [keepChatId, deleteChatId]);
        
        if (messageResult.rows.length > 0) {
          console.log(`   📝 ${messageResult.rows.length} mensajes movidos de chat ${deleteChatId} a ${keepChatId}`);
        }
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
      console.log(`   ✅ Consolidación completada para participantes ${participants.join(' y ')}`);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`   ❌ Error consolidando grupo:`, error);
      throw error;
    } finally {
      client.release();
    }
  }

  async cleanupOrphanedChats() {
    const client = await this.pool.connect();
    try {
      console.log('\n🧹 Limpiando chats huérfanos...');
      
      // Encontrar chats sin participantes
      const orphanedResult = await client.query(`
        SELECT c.id, c.name
        FROM chats c
        LEFT JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE c.type = 'private' 
        AND c.is_active = true
        AND cp.chat_id IS NULL
      `);

      if (orphanedResult.rows.length > 0) {
        console.log(`🔍 Encontrados ${orphanedResult.rows.length} chats huérfanos:`);
        
        for (const chat of orphanedResult.rows) {
          console.log(`   🗑️ Eliminando chat huérfano: ${chat.id} (${chat.name})`);
          
          // Eliminar mensajes del chat huérfano
          await client.query(`
            DELETE FROM messages WHERE chat_id = $1
          `, [chat.id]);
          
          // Eliminar el chat huérfano
          await client.query(`
            DELETE FROM chats WHERE id = $1
          `, [chat.id]);
        }
        
        console.log(`✅ ${orphanedResult.rows.length} chats huérfanos eliminados`);
      } else {
        console.log('✅ No se encontraron chats huérfanos');
      }
      
    } catch (error) {
      console.error('❌ Error limpiando chats huérfanos:', error);
    } finally {
      client.release();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const cleanup = new AggressiveChatCleanup();
  cleanup.init().catch(console.error);
}

module.exports = AggressiveChatCleanup;
