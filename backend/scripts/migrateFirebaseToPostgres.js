require('dotenv').config();
const admin = require('../config/firebase-admin');
const { Pool } = require('pg');
const logger = require('../utils/logger');

class FirebaseToPostgresMigrator {
  constructor() {
    this.firestore = admin.firestore();
    this.pgPool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
      ssl: { rejectUnauthorized: false }
    });
    
    this.migrationStats = {
      messages: { total: 0, migrated: 0, errors: 0 },
      chats: { total: 0, migrated: 0, errors: 0 },
      users: { total: 0, migrated: 0, errors: 0 }
    };
  }

  async initializeDatabase() {
    try {
      logger.logger.info('Initializing PostgreSQL database...');
      
      // Crear tablas si no existen
      await this.createTables();
      
      // Crear índices
      await this.createIndexes();
      
      logger.logger.info('Database initialized successfully');
    } catch (error) {
      logger.logError(error, { operation: 'database_initialization' });
      throw error;
    }
  }

  async createTables() {
    const queries = [
      // Tabla de chats de comunidad
      `CREATE TABLE IF NOT EXISTS community_chats (
        id SERIAL PRIMARY KEY,
        community_id VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Tabla de chats privados
      `CREATE TABLE IF NOT EXISTS private_chats (
        id SERIAL PRIMARY KEY,
        user1_id VARCHAR(255) NOT NULL,
        user2_id VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user1_id, user2_id)
      )`,
      
      // Tabla de mensajes
      `CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        chat_id INTEGER NOT NULL,
        sender_id VARCHAR(255) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_profile_picture TEXT,
        content TEXT NOT NULL,
        type VARCHAR(50) DEFAULT 'text',
        media_url TEXT,
        reply_to JSONB,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        status VARCHAR(50) DEFAULT 'sent',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      // Tabla de lecturas de mensajes
      `CREATE TABLE IF NOT EXISTS message_reads (
        id SERIAL PRIMARY KEY,
        message_id INTEGER NOT NULL,
        user_id VARCHAR(255) NOT NULL,
        chat_id INTEGER NOT NULL,
        read_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, user_id)
      )`,
      
      // Tabla de usuarios online
      `CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        session_id VARCHAR(255) NOT NULL,
        last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, session_id)
      )`
    ];

    for (const query of queries) {
      await this.pgPool.query(query);
    }
  }

  async createIndexes() {
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id)',
      'CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp DESC)',
      'CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id)',
      'CREATE INDEX IF NOT EXISTS idx_message_reads_user_id ON message_reads(user_id)',
      'CREATE INDEX IF NOT EXISTS idx_message_reads_chat_id ON message_reads(chat_id)',
      'CREATE INDEX IF NOT EXISTS idx_community_chats_community_id ON community_chats(community_id)',
      'CREATE INDEX IF NOT EXISTS idx_private_chats_users ON private_chats(user1_id, user2_id)'
    ];

    for (const index of indexes) {
      await this.pgPool.query(index);
    }
  }


  async migrateChats() {
    try {
      logger.logger.info('Starting chat migration...');
      
      // Migrar chats de comunidad desde Firestore
      const communityChatsSnapshot = await this.firestore.collection('community_chats').get();
      this.migrationStats.chats.total = communityChatsSnapshot.size;
      
      for (const doc of communityChatsSnapshot.docs) {
        try {
          const chatData = doc.data();
          
          await this.pgPool.query(
            'INSERT INTO community_chats (community_id, name, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [
              chatData.communityId || doc.id,
              chatData.name || 'Community Chat',
              chatData.createdAt?.toDate() || new Date()
            ]
          );
          
          this.migrationStats.chats.migrated++;
          logger.logger.info(`Migrated community chat: ${doc.id}`);
        } catch (error) {
          this.migrationStats.chats.errors++;
          logger.logError(error, { operation: 'migrate_community_chat', chatId: doc.id });
        }
      }
      
      // Migrar chats privados
      const privateChatsSnapshot = await this.firestore.collection('private_chats').get();
      this.migrationStats.chats.total += privateChatsSnapshot.size;
      
      for (const doc of privateChatsSnapshot.docs) {
        try {
          const chatData = doc.data();
          
          await this.pgPool.query(
            'INSERT INTO private_chats (user1_id, user2_id, created_at) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
            [
              chatData.user1Id,
              chatData.user2Id,
              chatData.createdAt?.toDate() || new Date()
            ]
          );
          
          this.migrationStats.chats.migrated++;
          logger.logger.info(`Migrated private chat: ${doc.id}`);
        } catch (error) {
          this.migrationStats.chats.errors++;
          logger.logError(error, { operation: 'migrate_private_chat', chatId: doc.id });
        }
      }
      
      logger.logger.info(`Chat migration completed: ${this.migrationStats.chats.migrated}/${this.migrationStats.chats.total} migrated`);
    } catch (error) {
      logger.logError(error, { operation: 'migrate_chats' });
      throw error;
    }
  }

  async migrateMessages() {
    try {
      logger.logger.info('Starting message migration...');
      
      const messagesSnapshot = await this.firestore.collection('messages').get();
      this.migrationStats.messages.total = messagesSnapshot.size;
      
      // Procesar en lotes para evitar memory issues
      const batchSize = 100;
      const batches = [];
      
      for (let i = 0; i < messagesSnapshot.docs.length; i += batchSize) {
        batches.push(messagesSnapshot.docs.slice(i, i + batchSize));
      }
      
      for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
        const batch = batches[batchIndex];
        logger.logger.info(`Processing batch ${batchIndex + 1}/${batches.length}`);
        
        for (const doc of batch) {
          try {
            const messageData = doc.data();
            
            // Obtener chat_id correspondiente
            let chatId = null;
            
            if (messageData.chatType === 'community') {
              const communityChat = await this.pgPool.query(
                'SELECT id FROM community_chats WHERE community_id = $1',
                [messageData.communityId]
              );
              chatId = communityChat.rows[0]?.id;
            } else if (messageData.chatType === 'private') {
              const privateChat = await this.pgPool.query(
                'SELECT id FROM private_chats WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)',
                [messageData.user1Id, messageData.user2Id]
              );
              chatId = privateChat.rows[0]?.id;
            }
            
            if (!chatId) {
              logger.logger.warn(`Chat not found for message ${doc.id}, skipping`);
              this.migrationStats.messages.errors++;
              continue;
            }
            
            await this.pgPool.query(
              `INSERT INTO messages (chat_id, sender_id, sender_name, sender_profile_picture, 
               content, type, media_url, reply_to, timestamp, status) 
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                chatId,
                messageData.senderId,
                messageData.senderName || 'Unknown User',
                messageData.senderProfilePicture,
                messageData.content,
                messageData.type || 'text',
                messageData.mediaUrl,
                messageData.replyTo ? JSON.stringify(messageData.replyTo) : null,
                messageData.timestamp?.toDate() || new Date(),
                messageData.status || 'sent'
              ]
            );
            
            this.migrationStats.messages.migrated++;
          } catch (error) {
            this.migrationStats.messages.errors++;
            logger.logError(error, { operation: 'migrate_message', messageId: doc.id });
          }
        }
      }
      
      logger.logger.info(`Message migration completed: ${this.migrationStats.messages.migrated}/${this.migrationStats.messages.total} migrated`);
    } catch (error) {
      logger.logError(error, { operation: 'migrate_messages' });
      throw error;
    }
  }

  async migrateUsers() {
    try {
      logger.logger.info('Starting user migration...');
      
      const usersSnapshot = await this.firestore.collection('users').get();
      this.migrationStats.users.total = usersSnapshot.size;
      
      for (const doc of usersSnapshot.docs) {
        try {
          const userData = doc.data();
          
          // Verificar si el usuario ya existe en MongoDB
          const existingUser = await this.pgPool.query(
            'SELECT id FROM users WHERE id = $1',
            [doc.id]
          );
          
          if (existingUser.rows.length === 0) {
            await this.pgPool.query(
              `INSERT INTO users (id, name, email, profile_picture, fcm_token, created_at) 
               VALUES ($1, $2, $3, $4, $5, $6)`,
              [
                doc.id,
                userData.name || userData.displayName || 'Unknown User',
                userData.email,
                userData.profilePicture || userData.photoURL,
                userData.fcmToken,
                userData.createdAt?.toDate() || new Date()
              ]
            );
          }
          
          this.migrationStats.users.migrated++;
          logger.logger.info(`Migrated user: ${doc.id}`);
        } catch (error) {
          this.migrationStats.users.errors++;
          logger.logError(error, { operation: 'migrate_user', userId: doc.id });
        }
      }
      
      logger.logger.info(`User migration completed: ${this.migrationStats.users.migrated}/${this.migrationStats.users.total} migrated`);
    } catch (error) {
      logger.logError(error, { operation: 'migrate_users' });
      throw error;
    }
  }

  async validateMigration() {
    try {
      logger.logger.info('Validating migration...');
      
      // Verificar conteos
      const messageCount = await this.pgPool.query('SELECT COUNT(*) FROM messages');
      const chatCount = await this.pgPool.query('SELECT COUNT(*) FROM community_chats');
      const privateChatCount = await this.pgPool.query('SELECT COUNT(*) FROM private_chats');
      
      logger.logger.info('Migration validation results:', {
        messages: messageCount.rows[0].count,
        communityChats: chatCount.rows[0].count,
        privateChats: privateChatCount.rows[0].count,
        migrationStats: this.migrationStats
      });
      
      // Verificar integridad de datos
      const orphanedMessages = await this.pgPool.query(
        'SELECT COUNT(*) FROM messages m LEFT JOIN community_chats c ON m.chat_id = c.id LEFT JOIN private_chats pc ON m.chat_id = pc.id WHERE c.id IS NULL AND pc.id IS NULL'
      );
      
      if (parseInt(orphanedMessages.rows[0].count) > 0) {
        logger.logger.warn(`Found ${orphanedMessages.rows[0].count} orphaned messages`);
      }
      
      return {
        success: true,
        stats: this.migrationStats,
        validation: {
          messageCount: messageCount.rows[0].count,
          communityChatCount: chatCount.rows[0].count,
          privateChatCount: privateChatCount.rows[0].count,
          orphanedMessages: orphanedMessages.rows[0].count
        }
      };
    } catch (error) {
      logger.logError(error, { operation: 'validate_migration' });
      throw error;
    }
  }

  async runMigration() {
    try {
      logger.logger.info('Starting Firebase to PostgreSQL migration...');
      
      await this.initializeDatabase();
      await this.migrateUsers();
      await this.migrateChats();
      await this.migrateMessages();
      
      const validation = await this.validateMigration();
      
      logger.logger.info('Migration completed successfully!', validation);
      return validation;
    } catch (error) {
      logger.logError(error, { operation: 'run_migration' });
      throw error;
    } finally {
      await this.pgPool.end();
    }
  }
}

// Ejecutar migración si se llama directamente
if (require.main === module) {
  const migrator = new FirebaseToPostgresMigrator();
  migrator.runMigration()
    .then(result => {
      console.log('Migration completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Migration failed:', error);
      process.exit(1);
    });
}

module.exports = FirebaseToPostgresMigrator;
