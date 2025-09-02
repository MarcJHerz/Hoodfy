const { Pool } = require('pg');

class Chat {
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
          last_message_id VARCHAR(255),
          settings JSONB DEFAULT '{}',
          metadata JSONB DEFAULT '{}'
        );

        CREATE INDEX IF NOT EXISTS idx_chats_type ON chats(type);
        CREATE INDEX IF NOT EXISTS idx_chats_community_id ON chats(community_id);
        CREATE INDEX IF NOT EXISTS idx_chats_created_by ON chats(created_by);
        CREATE INDEX IF NOT EXISTS idx_chats_last_message_at ON chats(last_message_at);
      `);

      // Crear tabla de participantes
      await client.query(`
        CREATE TABLE IF NOT EXISTS chat_participants (
          id SERIAL PRIMARY KEY,
          chat_id INTEGER REFERENCES chats(id) ON DELETE CASCADE,
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

        CREATE INDEX IF NOT EXISTS idx_chat_participants_chat_id ON chat_participants(chat_id);
        CREATE INDEX IF NOT EXISTS idx_chat_participants_user_id ON chat_participants(user_id);
        CREATE INDEX IF NOT EXISTS idx_chat_participants_role ON chat_participants(role);
      `);

      console.log('✅ Tablas de chat creadas correctamente');
    } catch (error) {
      console.error('❌ Error creando tablas de chat:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async createChat(chatData) {
    const client = await this.pool.connect();
    try {
      const { name, description, type, community_id, created_by, max_participants, settings } = chatData;
      
      const result = await client.query(`
        INSERT INTO chats (name, description, type, community_id, created_by, max_participants, settings)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [name, description, type, community_id, created_by, max_participants || 1000, settings || {}]);

      const chat = result.rows[0];

      // Agregar creador como admin del chat
      await client.query(`
        INSERT INTO chat_participants (chat_id, user_id, role)
        VALUES ($1, $2, $3)
      `, [chat.id, created_by, 'admin']);

      return chat;
    } catch (error) {
      console.error('❌ Error creando chat:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getChatById(chatId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT * FROM chats WHERE id = $1 AND is_active = true
      `, [chatId]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error obteniendo chat por ID:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getChatCount() {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT COUNT(*) FROM chats WHERE is_active = true
      `);
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('❌ Error obteniendo conteo de chats:', error);
      return 0;
    } finally {
      client.release();
    }
  }

  // Buscar chat privado existente entre dos usuarios
  async findPrivateChatBetweenUsers(userId1, userId2) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT c.* FROM chats c
        INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id
        INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id
        WHERE c.type = 'private' 
        AND c.is_active = true
        AND cp1.user_id = $1 AND cp2.user_id = $2
        AND cp1.is_banned = false AND cp2.is_banned = false
        LIMIT 1
      `, [userId1, userId2]);

      return result.rows[0] || null;
    } catch (error) {
      console.error('❌ Error buscando chat privado entre usuarios:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getUserChats(userId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT c.*, 
               cp.role,
               cp.last_read_at,
               cp.unread_count,
               cp.is_muted,
               (SELECT COUNT(*) FROM chat_participants WHERE chat_id = c.id) as participant_count
        FROM chats c
        INNER JOIN chat_participants cp ON c.id = cp.chat_id
        WHERE cp.user_id = $1 AND c.is_active = true
        ORDER BY c.last_message_at DESC NULLS LAST
      `, [userId]);

      return result.rows;
    } catch (error) {
      console.error('❌ Error obteniendo chats del usuario:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async addParticipant(chatId, userId, role = 'member') {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        INSERT INTO chat_participants (chat_id, user_id, role)
        VALUES ($1, $2, $3)
        ON CONFLICT (chat_id, user_id) 
        DO UPDATE SET role = $3, joined_at = CURRENT_TIMESTAMP
        RETURNING *
      `, [chatId, userId, role]);

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

  async updateChat(chatId, updates) {
    const client = await this.pool.connect();
    try {
      const fields = Object.keys(updates);
      const values = Object.values(updates);
      const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(', ');

      const result = await client.query(`
        UPDATE chats 
        SET ${setClause}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [chatId, ...values]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error actualizando chat:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async deleteChat(chatId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        UPDATE chats 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [chatId]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error eliminando chat:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async getChatParticipants(chatId) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        SELECT cp.*, u.name, u.profile_picture
        FROM chat_participants cp
        LEFT JOIN users u ON cp.user_id = u.id
        WHERE cp.chat_id = $1
        ORDER BY cp.role DESC, cp.joined_at ASC
      `, [chatId]);

      return result.rows;
    } catch (error) {
      console.error('❌ Error obteniendo participantes:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  async updateLastMessage(chatId, messageId, timestamp) {
    const client = await this.pool.connect();
    try {
      const result = await client.query(`
        UPDATE chats 
        SET last_message_id = $2, last_message_at = $3, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `, [chatId, messageId, timestamp]);

      return result.rows[0];
    } catch (error) {
      console.error('❌ Error actualizando último mensaje:', error);
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Chat;
