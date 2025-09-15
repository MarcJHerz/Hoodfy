const mongoose = require('mongoose');
const { Pool } = require('pg');
require('dotenv').config();

async function debugChat49() {
  try {
    // Conectar a MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Conectar a PostgreSQL
    const pool = new Pool({
      host: process.env.POSTGRES_HOST,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DB,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      ssl: { rejectUnauthorized: false }
    });

    console.log('✅ Conectado a PostgreSQL');

    console.log('\n🔍 DEBUGGING CHAT 49\n');

    // 1. Verificar si el chat existe en PostgreSQL
    console.log('1️⃣ Verificando si el chat 49 existe en PostgreSQL...');
    const chatResult = await pool.query('SELECT * FROM chats WHERE id = $1', [49]);
    
    if (chatResult.rows.length === 0) {
      console.log('❌ Chat 49 NO existe en PostgreSQL');
      
      // Verificar qué chats existen
      const allChatsResult = await pool.query('SELECT id, name, type, created_at FROM chats ORDER BY id DESC LIMIT 10');
      console.log('📊 Últimos 10 chats en PostgreSQL:');
      allChatsResult.rows.forEach(chat => {
        console.log(`  - Chat ${chat.id}: ${chat.name} (${chat.type}) - ${chat.created_at}`);
      });
    } else {
      console.log('✅ Chat 49 existe en PostgreSQL:', chatResult.rows[0]);
    }

    // 2. Verificar participantes del chat 49
    console.log('\n2️⃣ Verificando participantes del chat 49...');
    const participantsResult = await pool.query(
      'SELECT * FROM chat_participants WHERE chat_id = $1', 
      [49]
    );
    
    if (participantsResult.rows.length === 0) {
      console.log('❌ No hay participantes en el chat 49');
    } else {
      console.log('✅ Participantes del chat 49:');
      participantsResult.rows.forEach(participant => {
        console.log(`  - Usuario: ${participant.user_id}, Rol: ${participant.role}, Unido: ${participant.joined_at}`);
      });
    }

    // 3. Verificar mensajes del chat 49
    console.log('\n3️⃣ Verificando mensajes del chat 49...');
    const messagesResult = await pool.query(
      'SELECT COUNT(*) as count FROM messages WHERE chat_id = $1', 
      [49]
    );
    
    console.log(`📊 Mensajes en chat 49: ${messagesResult.rows[0].count}`);

    // 4. Buscar el usuario que está intentando acceder
    console.log('\n4️⃣ Buscando usuarios en MongoDB...');
    const User = require('../models/User');
    const users = await User.find({}, 'name email firebaseUid').limit(5);
    
    console.log('📊 Usuarios en MongoDB:');
    users.forEach(user => {
      console.log(`  - ${user.name} (${user.email}) - Firebase: ${user.firebaseUid}`);
    });

    // 5. Verificar si hay chats con IDs similares
    console.log('\n5️⃣ Buscando chats con IDs similares...');
    const similarChatsResult = await pool.query(
      'SELECT id, name, type, created_at FROM chats WHERE id BETWEEN 40 AND 60 ORDER BY id'
    );
    
    console.log('📊 Chats con IDs entre 40-60:');
    similarChatsResult.rows.forEach(chat => {
      console.log(`  - Chat ${chat.id}: ${chat.name} (${chat.type}) - ${chat.created_at}`);
    });

    // 6. Verificar la estructura de la tabla chats
    console.log('\n6️⃣ Verificando estructura de la tabla chats...');
    const tableInfoResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'chats' 
      ORDER BY ordinal_position
    `);
    
    console.log('📊 Estructura de la tabla chats:');
    tableInfoResult.rows.forEach(column => {
      console.log(`  - ${column.column_name}: ${column.data_type} (nullable: ${column.is_nullable})`);
    });

    console.log('\n✅ DEBUG COMPLETADO');

  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
  }
}

debugChat49();
