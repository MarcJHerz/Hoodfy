const { Pool } = require('pg');

class Message {
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
    const client = await this.pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          chat_id INTEGER NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
          sender_id VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          content_type VARCHAR(50) DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'video', 'file', 'audio', 'system')),
          reply_to_id INTEGER REFERENCES messages(id),
          is_edited BOOLEAN DEFAULT false,
          edited_at TIMESTAMP,
          is_deleted BOOLEAN DEFAULT false,
          deleted_at TIMESTAMP,
          deleted_by VARCHAR(255),
          metadata JSONB DEFAULT '{}',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
        CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
        CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
        CREATE INDEX IF NOT EXISTS idx_messages_reply_to_id ON messages(reply_to_id);
        CREATE INDEX IF NOT EXISTS idx_messages_content_type ON messages(content_type);
      `);

      // Crear tabla de reacciones a mensajes
      await client.query(`
        CREATE TABLE IF NOT EXISTS message_reactions (
          id SERIAL PRIMARY KEY,
          message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
          user_id VARCHAR(255) NOT NULL,
          reaction_type VARCHAR(50) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(message_id, user_id, reaction_type)
        );

        CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
        CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);
        CREATE INDEX IF NOT EXISTS idx_message_reactions_reaction_type ON message_reactions(reaction_type);
      `);

      // Crear tabla de mensajes leídos
      await client.query(`
        CREATE TABLE IF NOT EXISTS message_reads (
          id SERIAL PRIMARY KEY,
          message_id INTEGER NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
          user_id VARCHAR(255) NOT NULL,
          read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(message_id, user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_message_reads_message_id ON message_reads(message_id);
        CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id);
        CREATE INDEX IF NOT EXISTS idx_message_reads_read_at ON message_reads(read_at);
      `);

      console.log('✅ Tablas de mensajes creadas correctamente');
    } catch (error) {
      console.error('❌ Error creando tablas de mensajes:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async createMessage(messageData) {
    const client = await this.pool.connect();
    try {
      const { chat_id, sender_id, content, content_type, reply_to_id, metadata } = messageData;
      
      const result = await client.query(`
        INSERT INTO messages (chat_id, sender_id, content, content_type, reply_to_id, metadata)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING *
      `, [chat_id, sender_id, content, content_type || 'text', reply_to_id, metadata || {}]);

      const message = result.rows[0];

      // Actualizar último mensaje del chat
      await client.query(`
        UPDATE chats 
        SET last_message_id = $2, last_message_at = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `, [chat_id, message.id, message.created_at]);

      // Incrementar contador de mensajes no leídos para todos los participantes excepto el remitente
      await client.query(`
        UPDATE chat_participants 
        SET unread_count = unread_count + 1
        WHERE chat_id = $1 AND user_id != $2
      `, [chat_id, sender_id]);

      return message;
    } catch (error) {
      console.error('❌ Error creando mensaje:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getMessageById(messageId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT m.*, 
               u.name as sender_name,
               u.profile_picture as sender_profile_picture,
               (SELECT COUNT(*) FROM message_reactions WHERE message_id = m.id) as reaction_count
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.id = $1 AND m.is_deleted = false
      `, [messageId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error obteniendo mensaje:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getChatMessages(chatId, limit = 50, offset = 0, beforeMessageId = null) {
    const client = await this.pool.connect();
    try {
      let query = `
        SELECT m.*, 
               u.name as sender_name,
               u.profile_picture as sender_profile_picture,
               (SELECT COUNT(*) FROM message_reactions WHERE message_id = m.id) as reaction_count,
               (SELECT COUNT(*) FROM message_reads WHERE message_id = m.id) as read_count
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = $1 AND m.is_deleted = false
      `;

      const params = [chatId];
      let paramIndex = 2;

      if (beforeMessageId) {
        query += ` AND m.id < $${paramIndex}`;
        params.push(beforeMessageId);
        paramIndex++;
      }

      query += ` ORDER BY m.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await client.query(query, params);
      return result.rows.reverse(); // Ordenar por fecha ascendente (más antiguo primero)
    } catch (error) {
      console.error('❌ Error obteniendo mensajes del chat:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateMessage(messageId, updates, userId) {
    const client = await this.pool.connect();
    try {
      const { content, metadata } = updates;
      
      const result = await client.query(`
        UPDATE messages 
        SET content = $2, 
            metadata = $3,
            is_edited = true,
            edited_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND sender_id = $4 AND is_deleted = false
        RETURNING *
      `, [messageId, content, metadata || {}, userId]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error actualizando mensaje:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteMessage(messageId, userId, isAdmin = false) {
    const client = await this.pool.connect();
    try {
      let query = `
        UPDATE messages 
        SET is_deleted = true, 
            deleted_at = CURRENT_TIMESTAMP,
            deleted_by = $2,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
      `;

      const params = [messageId, userId];

      if (!isAdmin) {
        query += ` AND sender_id = $3`;
        params.push(userId);
      }

      query += ` RETURNING *`;

      const result = await client.query(query, params);
      return result.rows[0];
    } catch (error) {
      console.error('❌ Error eliminando mensaje:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async addReaction(messageId, userId, reactionType) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO message_reactions (message_id, user_id, reaction_type)
        VALUES ($1, $2, $3)
        ON CONFLICT (message_id, user_id, reaction_type) 
        DO NOTHING
        RETURNING *
      `, [messageId, userId, reactionType]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error agregando reacción:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async removeReaction(messageId, userId, reactionType) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        DELETE FROM message_reactions 
        WHERE message_id = $1 AND user_id = $2 AND reaction_type = $3
        RETURNING *
      `, [messageId, userId, reactionType]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error removiendo reacción:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async markMessageAsRead(messageId, userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO message_reads (message_id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (message_id, user_id) 
        DO UPDATE SET read_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [messageId, userId]);

      // Actualizar contador de mensajes no leídos
      await client.query(`
        UPDATE chat_participants cp
        SET unread_count = GREATEST(0, unread_count - 1),
            last_read_at = CURRENT_TIMESTAMP
        FROM messages m
        WHERE cp.chat_id = m.chat_id 
          AND m.id = $1 
          AND cp.user_id = $2
      `, [messageId, userId]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error marcando mensaje como leído:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getMessageReactions(messageId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT mr.*, u.name as user_name
        FROM message_reactions mr
        LEFT JOIN users u ON mr.user_id = u.id
        WHERE mr.message_id = $1
        ORDER BY mr.created_at ASC
      `, [messageId]);

      return result.rows;
    } catch (error) {
      console.error('❌ Error obteniendo reacciones del mensaje:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async searchMessages(chatId, query, limit = 20) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT m.*, 
               u.name as sender_name,
               u.profile_picture as sender_profile_picture
        FROM messages m
        LEFT JOIN users u ON m.sender_id = u.id
        WHERE m.chat_id = $1 
          AND m.is_deleted = false
          AND m.content ILIKE $2
        ORDER BY m.created_at DESC
        LIMIT $3
      `, [chatId, `%${query}%`, limit]);

      return result.rows;
    } catch (error) {
      console.error('❌ Error buscando mensajes:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Message;
