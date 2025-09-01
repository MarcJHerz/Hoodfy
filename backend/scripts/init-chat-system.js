#!/usr/bin/env node

/**
 * 🚀 SISTEMA DE INICIALIZACIÓN DE CHAT HOODFY
 * 
 * Este script:
 * 1. Configura PostgreSQL para el chat
 * 2. Crea datos de ejemplo
 * 3. Se integra con el sistema existente
 */

const PostgresChatSetup = require('./setup-postgres-chat');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const ChatParticipant = require('../models/ChatParticipant');

class ChatSystemInitializer {
  constructor() {
    this.postgresSetup = new PostgresChatSetup();
    this.chatModel = new Chat();
    this.messageModel = new Message();
    this.participantModel = new ChatParticipant();
  }

  async init() {
    console.log('🚀 INICIANDO SISTEMA DE CHAT HOODFY...\n');

    try {
      // 1. Configurar PostgreSQL
      await this.setupPostgres();
      
      // 2. Crear datos de ejemplo
      await this.createSampleData();
      
      // 3. Verificar integración
      await this.verifyIntegration();
      
      console.log('\n🎉 SISTEMA DE CHAT INICIALIZADO EXITOSAMENTE!');
      console.log('   Puedes reiniciar el backend para activar el chat.');
      
    } catch (error) {
      console.error('\n💥 ERROR INICIALIZANDO SISTEMA DE CHAT:', error.message);
      process.exit(1);
    }
  }

  async setupPostgres() {
    console.log('📊 1. Verificando PostgreSQL...');
    
    try {
      // Solo verificar que las tablas existan, no crearlas
      const success = await this.verifyPostgresTables();
      if (!success) {
        throw new Error('Las tablas de PostgreSQL no están configuradas correctamente');
      }
      
      console.log('✅ PostgreSQL verificado correctamente');
    } catch (error) {
      console.error('❌ Error verificando PostgreSQL:', error.message);
      throw error;
    }
  }

  async verifyPostgresTables() {
    try {
      // Verificar que las tablas existan
      const chatCount = await this.chatModel.getChatCount();
      console.log(`   📊 Tablas verificadas - Chats existentes: ${chatCount}`);
      return true;
    } catch (error) {
      console.error('❌ Error verificando tablas:', error.message);
      return false;
    }
  }

  async createSampleData() {
    console.log('\n📝 2. Creando datos de ejemplo...');
    
    try {
      // Crear chats de ejemplo
      const chats = await this.createSampleChats();
      
      // Agregar participantes
      await this.addSampleParticipants(chats);
      
      // Enviar mensajes de ejemplo
      await this.sendSampleMessages(chats);
      
      console.log('✅ Datos de ejemplo creados correctamente');
    } catch (error) {
      console.error('❌ Error creando datos de ejemplo:', error.message);
      throw error;
    }
  }

  async verifyIntegration() {
    console.log('\n🔍 3. Verificando integración...');
    
    try {
      // Verificar que los modelos pueden conectarse
      const chatCount = await this.chatModel.getChatCount();
      const messageCount = await this.messageModel.getMessageCount();
      const participantCount = await this.participantModel.getParticipantCount();
      
      console.log('   📊 Estadísticas del chat:');
      console.log(`      - Chats: ${chatCount}`);
      console.log(`      - Mensajes: ${messageCount}`);
      console.log(`      - Participantes: ${participantCount}`);
      
      console.log('✅ Integración verificada correctamente');
    } catch (error) {
      console.error('❌ Error verificando integración:', error.message);
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
        content: '¡Sí! Estoy trabajando en React Native 📱',
        content_type: 'text',
        sender_id: 'user-004'
      }
    ];

    // Enviar mensajes al chat de comunidad
    for (const messageData of sampleMessages) {
      const message = await this.messageModel.createMessage({
        chat_id: chats[0].id,
        ...messageData
      });
      console.log(`   ✅ Mensaje enviado: "${messageData.content.substring(0, 30)}..."`);
    }

    // Enviar mensaje al chat privado
    const privateMessage = await this.messageModel.createMessage({
      chat_id: chats[1].id,
      content: '¡Hola! Este es nuestro chat privado 🤫',
      content_type: 'text',
      sender_id: 'user-001'
    });
    console.log(`   ✅ Mensaje privado enviado: "${privateMessage.content}"`);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const initializer = new ChatSystemInitializer();
  initializer.init().then(() => {
    console.log('\n✨ Proceso completado. El sistema de chat está listo!');
    process.exit(0);
  }).catch(error => {
    console.error('\n💥 Error fatal:', error.message);
    process.exit(1);
  });
}

module.exports = ChatSystemInitializer;
