#!/usr/bin/env node

/**
 * 🚀 HOODFY CHAT SYSTEM - SCRIPT DE INICIALIZACIÓN
 * 
 * Este script inicializa y prueba todo el sistema de chat:
 * - Crea las tablas en PostgreSQL
 * - Prueba los modelos
 * - Crea chats de ejemplo
 * - Verifica la funcionalidad completa
 */

require('dotenv').config();
const logger = require('../utils/logger');

// Importar modelos
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ChatParticipant = require('../models/ChatParticipant');

class ChatSystemInitializer {
  constructor() {
    this.chatModel = new Chat();
    this.messageModel = new Message();
    this.participantModel = new ChatParticipant();
  }

  async init() {
    console.log('🚀 INICIANDO SISTEMA DE CHAT HOODFY...\n');

    try {
      // 1. Inicializar base de datos
      console.log('📊 1. Inicializando base de datos...');
      await this.initializeDatabase();
      console.log('✅ Base de datos inicializada\n');

      // 2. Crear chats de ejemplo
      console.log('💬 2. Creando chats de ejemplo...');
      const chats = await this.createSampleChats();
      console.log('✅ Chats de ejemplo creados\n');

      // 3. Agregar participantes
      console.log('👥 3. Agregando participantes...');
      await this.addSampleParticipants(chats);
      console.log('✅ Participantes agregados\n');

      // 4. Enviar mensajes de ejemplo
      console.log('📝 4. Enviando mensajes de ejemplo...');
      await this.sendSampleMessages(chats);
      console.log('✅ Mensajes de ejemplo enviados\n');

      // 5. Probar funcionalidades
      console.log('🧪 5. Probando funcionalidades...');
      await this.testFunctionality(chats);
      console.log('✅ Funcionalidades probadas\n');

      // 6. Mostrar estadísticas
      console.log('📈 6. Estadísticas del sistema...');
      await this.showStats();

      console.log('\n🎉 ¡SISTEMA DE CHAT INICIALIZADO EXITOSAMENTE!');
      console.log('🚀 Hoodfy está listo para manejar chats en tiempo real');

    } catch (error) {
      console.error('\n❌ Error inicializando sistema de chat:', error);
      process.exit(1);
    }
  }

  async initializeDatabase() {
    console.log('📊 1. Inicializando base de datos...');
    
    try {
      // Primero crear la tabla de chats (sin dependencias)
      await this.chatModel.init();
      console.log('✅ Tablas de chat creadas correctamente');
      
      // Luego crear la tabla de mensajes (que depende de chats)
      await this.messageModel.init();
      console.log('✅ Tablas de mensajes creadas correctamente');
      
      // Finalmente crear la tabla de participantes (que depende de chats)
      await this.participantModel.init();
      console.log('✅ Tablas de participantes creadas correctamente');
      
      console.log('✅ Base de datos inicializada correctamente');
    } catch (error) {
      console.error('❌ Error inicializando base de datos:', error);
      throw error;
    }
  }

  async createSampleChats() {
    const chats = [];

    // Chat de comunidad
    const communityChat = await this.chatModel.createChat({
      name: '🚀 Hoodfy Developers',
      description: 'Chat para desarrolladores de Hoodfy',
      type: 'community',
      community_id: 'dev-community-001',
      created_by: 'admin-user-001',
      max_participants: 1000,
      settings: {
        allow_media: true,
        allow_reactions: true,
        allow_replies: true,
        theme: 'dark'
      }
    });
    chats.push(communityChat);
    console.log(`   ✅ Chat de comunidad creado: ${communityChat.name} (ID: ${communityChat.id})`);

    // Chat privado
    const privateChat = await this.chatModel.createChat({
      name: '💬 Chat Privado',
      description: 'Chat privado entre usuarios',
      type: 'private',
      community_id: null,
      created_by: 'user-001',
      max_participants: 2,
      settings: {
        allow_media: true,
        allow_reactions: true,
        allow_replies: true
      }
    });
    chats.push(privateChat);
    console.log(`   ✅ Chat privado creado: ${privateChat.name} (ID: ${privateChat.id})`);

    return chats;
  }

  async addSampleParticipants(chats) {
    const users = [
      { id: 'user-001', role: 'admin' },
      { id: 'user-002', role: 'moderator' },
      { id: 'user-003', role: 'member' },
      { id: 'user-004', role: 'member' }
    ];

    // Agregar participantes al chat de comunidad
    for (const user of users) {
      await this.participantModel.addParticipant(chats[0].id, user.id, user.role);
      console.log(`   ✅ Usuario ${user.id} agregado como ${user.role} al chat de comunidad`);
    }

    // Agregar participantes al chat privado
    await this.participantModel.addParticipant(chats[1].id, 'user-001', 'member');
    await this.participantModel.addParticipant(chats[1].id, 'user-002', 'member');
    console.log(`   ✅ Participantes agregados al chat privado`);
  }

  async sendSampleMessages(chats) {
    const sampleMessages = [
      {
        content: '¡Hola a todos! 👋 Bienvenidos al chat de Hoodfy Developers',
        content_type: 'text',
        sender_id: 'user-001'
      },
      {
        content: '¡Hola! Me encanta este proyecto 🚀',
        content_type: 'text',
        sender_id: 'user-002'
      },
      {
        content: '¿Alguien está trabajando en el frontend? 💻',
        content_type: 'text',
        sender_id: 'user-003'
      },
      {
        content: 'Sí, estoy con React y Next.js ⚛️',
        content_type: 'text',
        sender_id: 'user-004'
      },
      {
        content: '¡Excelente! ¿Necesitas ayuda con algo? 🤝',
        content_type: 'text',
        sender_id: 'user-001'
      }
    ];

    // Enviar mensajes al chat de comunidad
    for (const msg of sampleMessages) {
      const message = await this.messageModel.createMessage({
        chat_id: chats[0].id,
        sender_id: msg.sender_id,
        content: msg.content,
        content_type: msg.content_type
      });
      console.log(`   ✅ Mensaje enviado: "${msg.content.substring(0, 30)}..."`);
    }

    // Enviar mensajes al chat privado
    const privateMessages = [
      {
        content: '¡Hola! ¿Cómo estás? 😊',
        content_type: 'text',
        sender_id: 'user-001'
      },
      {
        content: '¡Muy bien! ¿Y tú? 😄',
        content_type: 'text',
        sender_id: 'user-002'
      }
    ];

    for (const msg of privateMessages) {
      await this.messageModel.createMessage({
        chat_id: chats[1].id,
        sender_id: msg.sender_id,
        content: msg.content,
        content_type: msg.content_type
      });
      console.log(`   ✅ Mensaje privado enviado: "${msg.content}"`);
    }
  }

  async testFunctionality(chats) {
    console.log('   🧪 Probando funcionalidades...');

    // Probar obtener chat por ID
    const chat = await this.chatModel.getChatById(chats[0].id);
    console.log(`      ✅ Chat obtenido: ${chat.name}`);

    // Probar obtener participantes
    const participants = await this.participantModel.getChatParticipants(chats[0].id);
    console.log(`      ✅ Participantes obtenidos: ${participants.length}`);

    // Probar obtener mensajes
    const messages = await this.messageModel.getChatMessages(chats[0].id, 10);
    console.log(`      ✅ Mensajes obtenidos: ${messages.length}`);

    // Probar búsqueda
    const searchResults = await this.messageModel.searchMessages(chats[0].id, 'Hola');
    console.log(`      ✅ Búsqueda funcionando: ${searchResults.length} resultados`);

    // Probar contador de no leídos
    const unreadCount = await this.participantModel.getUnreadCount(chats[0].id, 'user-002');
    console.log(`      ✅ Contador de no leídos: ${unreadCount}`);

    // Probar roles
    const hasRole = await this.participantModel.hasRole(chats[0].id, 'user-001', 'admin');
    console.log(`      ✅ Verificación de roles: ${hasRole}`);
  }

  async showStats() {
    try {
      // Obtener estadísticas generales
      const totalChats = await this.chatModel.pool.query('SELECT COUNT(*) FROM chats');
      const totalMessages = await this.messageModel.pool.query('SELECT COUNT(*) FROM messages');
      const totalParticipants = await this.participantModel.pool.query('SELECT COUNT(*) FROM chat_participants');

      console.log('\n📊 ESTADÍSTICAS DEL SISTEMA:');
      console.log(`   💬 Total de chats: ${totalChats.rows[0].count}`);
      console.log(`   📝 Total de mensajes: ${totalMessages.rows[0].count}`);
      console.log(`   👥 Total de participantes: ${totalParticipants.rows[0].count}`);

      // Mostrar chats activos
      const activeChats = await this.chatModel.pool.query(
        'SELECT name, type, created_at FROM chats WHERE is_active = true ORDER BY created_at DESC'
      );

      console.log('\n💬 CHATS ACTIVOS:');
      activeChats.rows.forEach(chat => {
        console.log(`   • ${chat.name} (${chat.type}) - Creado: ${chat.created_at}`);
      });

      // Mostrar últimos mensajes
      const recentMessages = await this.messageModel.pool.query(
        'SELECT m.content, c.name as chat_name, m.created_at FROM messages m JOIN chats c ON m.chat_id = c.id ORDER BY m.created_at DESC LIMIT 5'
      );

      console.log('\n📝 ÚLTIMOS MENSAJES:');
      recentMessages.rows.forEach(msg => {
        console.log(`   • [${msg.chat_name}] "${msg.content.substring(0, 50)}..." - ${msg.created_at}`);
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
    }
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  const initializer = new ChatSystemInitializer();
  initializer.init()
    .then(() => {
      console.log('\n✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Script falló:', error);
      process.exit(1);
    });
}

module.exports = ChatSystemInitializer;
