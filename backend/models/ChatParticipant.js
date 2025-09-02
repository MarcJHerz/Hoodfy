const { Pool } = require('pg');

class ChatParticipant {
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
    // Las tablas ya se crean en Chat.js y Message.js
    console.log('✅ Tablas de participantes ya creadas en Chat.js');
  }

  async addParticipant(chatId, userId, role = 'member', settings = {}) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO chat_participants (chat_id, user_id, role, settings)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (chat_id, user_id) 
        DO UPDATE SET 
          role = $3,
          settings = $4,
          joined_at = CURRENT_TIMESTAMP,
          is_muted = false,
          is_banned = false
        RETURNING *
      `, [chatId, userId, role, settings]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error agregando participante:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async removeParticipant(chatId, userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        DELETE FROM chat_participants 
        WHERE chat_id = $1 AND user_id = $2
        RETURNING *
      `, [chatId, userId]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error removiendo participante:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateParticipantRole(chatId, userId, newRole) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        UPDATE chat_participants 
        SET role = $3, updated_at = CURRENT_TIMESTAMP
        WHERE chat_id = $1 AND user_id = $2
        RETURNING *
      `, [chatId, userId, newRole]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error actualizando rol del participante:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getParticipant(chatId, userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT cp.*
        FROM chat_participants cp
        WHERE cp.chat_id = $1 AND cp.user_id = $2
      `, [chatId, userId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error obteniendo participante:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getChatParticipants(chatId) {
    const client = await this.pool.connect();
    try {
      // Solo obtener participantes sin JOIN a users (que no existe)
      const result = await client.query(`
        SELECT cp.*
        FROM chat_participants cp
        WHERE cp.chat_id = $1 AND cp.is_banned = false
        ORDER BY cp.joined_at ASC
      `, [chatId]);

      return result.rows;
    } catch (error) {
      console.error('❌ Error obteniendo participantes del chat:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getParticipantCount() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT COUNT(*) FROM chat_participants WHERE is_banned = false
      `);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error obteniendo conteo de participantes:', error);
      return 0;
    } finally {
      client.release();
    }
  }

  async getUserChats(userId, includeMuted = true) {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT cp.*, 
               c.name as chat_name,
               c.description as chat_description,
               c.type as chat_type,
               c.community_id,
               c.last_message_at,
               c.last_message_id,
               c.settings as chat_settings
        FROM chat_participants cp
        INNER JOIN chats c ON cp.chat_id = c.id
        WHERE cp.user_id = $1 AND c.is_active = true
      `;

      const params = [userId];

      if (!includeMuted) {
        query += ` AND cp.is_muted = false`;
      }

      query += ` ORDER BY c.last_message_at DESC NULLS LAST`;

      const result = await client.query(query, params);
      return result.rows;
    } catch (error) {
      console.error('❌ Error obteniendo chats del usuario:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async muteParticipant(chatId, userId, muted = true) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        UPDATE chat_participants 
        SET is_muted = $3, updated_at = CURRENT_TIMESTAMP
        WHERE chat_id = $1 AND user_id = $2
        RETURNING *
      `, [chatId, userId, muted]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error mutando participante:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async banParticipant(chatId, userId, banned = true) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        UPDATE chat_participants 
        SET is_banned = $3, updated_at = CURRENT_TIMESTAMP
        WHERE chat_id = $1 AND user_id = $2
        RETURNING *
      `, [chatId, userId, banned]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error baneando participante:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateParticipantSettings(chatId, userId, settings) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        UPDATE chat_participants 
        SET settings = $3, updated_at = CURRENT_TIMESTAMP
        WHERE chat_id = $1 AND user_id = $2
        RETURNING *
      `, [chatId, userId, settings]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error actualizando configuración del participante:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async markMessagesAsRead(chatId, userId, messageId = null) {
    const client = await this.pool.connect();
    try {
      if (messageId) {
        // Marcar hasta un mensaje específico
        const result = await client.query(`
          UPDATE chat_participants 
          SET last_read_at = (
            SELECT created_at FROM messages WHERE id = $3
          ),
          unread_count = (
            SELECT COUNT(*) FROM messages 
            WHERE chat_id = $1 
              AND created_at > (
                SELECT created_at FROM messages WHERE id = $3
              )
          ),
          updated_at = CURRENT_TIMESTAMP
          WHERE chat_id = $1 AND user_id = $2
          RETURNING *
        `, [chatId, userId, messageId]);

        return result.rows[0];
      } else {
        // Marcar todos los mensajes como leídos
        const result = await client.query(`
          UPDATE chat_participants 
          SET last_read_at = CURRENT_TIMESTAMP,
              unread_count = 0,
              updated_at = CURRENT_TIMESTAMP
          WHERE chat_id = $1 AND user_id = $2
          RETURNING *
        `, [chatId, userId]);

        return result.rows[0];
      }
    } catch (error) {
      console.error('❌ Error marcando mensajes como leídos:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUnreadCount(chatId, userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT unread_count
        FROM chat_participants 
        WHERE chat_id = $1 AND user_id = $2
      `, [chatId, userId]);

      return result.rows[0]?.unread_count || 0;
    } catch (error) {
      console.error('❌ Error obteniendo contador de mensajes no leídos:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getTotalUnreadCount(userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT SUM(unread_count) as total_unread
        FROM chat_participants 
        WHERE user_id = $1 AND is_muted = false
      `, [userId]);

      return parseInt(result.rows[0]?.total_unread || 0);
    } catch (error) {
      console.error('❌ Error obteniendo total de mensajes no leídos:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async isParticipant(chatId, userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT EXISTS(
          SELECT 1 FROM chat_participants 
          WHERE chat_id = $1 AND user_id = $2 AND is_banned = false
        ) as is_participant
      `, [chatId, userId]);

      return result.rows[0]?.is_participant || false;
    } catch (error) {
      console.error('❌ Error verificando si es participante:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async hasRole(chatId, userId, role) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT role
        FROM chat_participants 
        WHERE chat_id = $1 AND user_id = $2
      `, [chatId, userId]);

      const participantRole = result.rows[0]?.role;
      
      if (role === 'admin') {
        return participantRole === 'admin';
      } else if (role === 'moderator') {
        return participantRole === 'admin' || participantRole === 'moderator';
      } else {
        return participantRole === 'admin' || participantRole === 'moderator' || participantRole === 'member';
      }
    } catch (error) {
      console.error('❌ Error verificando rol:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = ChatParticipant;
