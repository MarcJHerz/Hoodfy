#!/usr/bin/env node

/**
 * Script para crear chats de prueba en PostgreSQL
 * Uso: node scripts/create-test-chats.js
 */

require('dotenv').config();
const { Pool } = require('pg');
const mongoose = require('mongoose');

// Conectar a PostgreSQL
const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Conectar a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Schema de Usuario
const userSchema = new mongoose.Schema({
  name: String,
  username: String,
  email: String,
  profilePicture: String,
  firebaseUid: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createTestChats() {
  console.log('💬 Creando chats de prueba en PostgreSQL...');
  
  try {
    // 1. Obtener usuarios de prueba de MongoDB
    const testUsers = await User.find({
      email: { $regex: /testuser.*@hoodfy\.com/ }
    }).sort({ createdAt: -1 }).limit(3);

    if (testUsers.length < 2) {
      console.log('❌ No se encontraron suficientes usuarios de prueba');
      console.log('💡 Ejecuta primero: node scripts/create-test-users.js');
      return;
    }

    console.log(`✅ Encontrados ${testUsers.length} usuarios de prueba`);

    // 2. Crear chat privado entre los primeros dos usuarios
    const user1 = testUsers[0];
    const user2 = testUsers[1];

    console.log(`\n💬 Creando chat privado entre ${user1.name} y ${user2.name}...`);

    const client = await pgPool.connect();
    
    try {
      // Crear chat privado
      const chatResult = await client.query(`
        INSERT INTO chats (name, description, type, created_by, is_active, max_participants, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id
      `, [
        `Chat privado: ${user1.name} & ${user2.name}`,
        `Chat privado entre ${user1.name} y ${user2.name}`,
        'private',
        user1._id.toString(),
        true,
        2
      ]);

      const chatId = chatResult.rows[0].id;
      console.log(`✅ Chat privado creado con ID: ${chatId}`);

      // Agregar participantes
      await client.query(`
        INSERT INTO chat_participants (chat_id, user_id, role, joined_at, is_active)
        VALUES ($1, $2, $3, NOW(), $4)
      `, [chatId, user1._id.toString(), 'member', true]);

      await client.query(`
        INSERT INTO chat_participants (chat_id, user_id, role, joined_at, is_active)
        VALUES ($1, $2, $3, NOW(), $4)
      `, [chatId, user2._id.toString(), 'member', true]);

      console.log(`✅ Participantes agregados al chat ${chatId}`);

      // 3. Crear algunos mensajes de prueba
      console.log(`\n📝 Creando mensajes de prueba...`);

      const testMessages = [
        {
          sender_id: user1._id.toString(),
          content: `¡Hola ${user2.name}! Este es un mensaje de prueba.`,
          content_type: 'text'
        },
        {
          sender_id: user2._id.toString(),
          content: `¡Hola ${user1.name}! Perfecto, el chat está funcionando.`,
          content_type: 'text'
        },
        {
          sender_id: user1._id.toString(),
          content: `Excelente! Ahora podemos probar el sistema de chat completo.`,
          content_type: 'text'
        }
      ];

      for (const messageData of testMessages) {
        await client.query(`
          INSERT INTO messages (chat_id, sender_id, content, content_type, created_at, updated_at)
          VALUES ($1, $2, $3, $4, NOW(), NOW())
          RETURNING id
        `, [chatId, messageData.sender_id, messageData.content, messageData.content_type]);

        console.log(`✅ Mensaje creado: "${messageData.content.substring(0, 50)}..."`);
      }

      // 4. Actualizar último mensaje del chat
      await client.query(`
        UPDATE chats 
        SET last_message_at = NOW(), last_message_id = (
          SELECT id FROM messages 
          WHERE chat_id = $1 
          ORDER BY created_at DESC 
          LIMIT 1
        )
        WHERE id = $1
      `, [chatId]);

      console.log(`✅ Chat actualizado con último mensaje`);

      // 5. Mostrar resumen
      console.log('\n📋 RESUMEN DEL CHAT CREADO:');
      console.log('============================');
      console.log(`Chat ID: ${chatId}`);
      console.log(`Tipo: Privado`);
      console.log(`Participantes: ${user1.name}, ${user2.name}`);
      console.log(`Mensajes: ${testMessages.length}`);
      console.log(`Creado: ${new Date().toISOString()}`);

      // 6. Verificar que todo esté correcto
      const chatCheck = await client.query(`
        SELECT c.*, 
               COUNT(cp.user_id) as participant_count,
               COUNT(m.id) as message_count
        FROM chats c
        LEFT JOIN chat_participants cp ON c.id = cp.chat_id AND cp.is_active = true
        LEFT JOIN messages m ON c.id = m.chat_id
        WHERE c.id = $1
        GROUP BY c.id
      `, [chatId]);

      if (chatCheck.rows.length > 0) {
        const chat = chatCheck.rows[0];
        console.log('\n✅ VERIFICACIÓN:');
        console.log(`   Participantes activos: ${chat.participant_count}`);
        console.log(`   Mensajes totales: ${chat.message_count}`);
        console.log(`   Chat activo: ${chat.is_active}`);
      }

    } finally {
      client.release();
    }

    console.log('\n🎉 Chat de prueba creado exitosamente!');
    console.log('💡 Puedes usar este chat para probar la funcionalidad');

  } catch (error) {
    console.error('❌ Error creando chat de prueba:', error);
  } finally {
    await pgPool.end();
    await mongoose.disconnect();
    console.log('🔚 Conexiones cerradas');
  }
}

// Ejecutar si es llamado directamente
if (require.main === module) {
  createTestChats().catch(console.error);
}

module.exports = createTestChats;
