const { Pool } = require('pg');
require('dotenv').config();

async function debugChatList() {
  const pool = new Pool({
    host: process.env.POSTGRES_HOST,
    port: process.env.POSTGRES_PORT,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('✅ Conectado a PostgreSQL');

    // Usuario de prueba (Firebase UID)
    const testUserId = 'hkBZLcE72pfYnZiZ9EcBLSJoRQR2';
    
    console.log(`\n🔍 DEBUGGING CHAT LIST PARA USUARIO: ${testUserId}\n`);

    // 1. Verificar participantes del usuario
    console.log('1️⃣ Participantes del usuario:');
    const participantsQuery = `
      SELECT cp.*, c.id as chat_exists, c.name as chat_name, c.is_active
      FROM chat_participants cp
      LEFT JOIN chats c ON cp.chat_id = c.id
      WHERE cp.user_id = $1
      ORDER BY cp.chat_id
    `;
    
    const participantsResult = await pool.query(participantsQuery, [testUserId]);
    console.log(`📊 Total participantes: ${participantsResult.rows.length}`);
    
    participantsResult.rows.forEach((participant, index) => {
      console.log(`  ${index + 1}. Chat ID: ${participant.chat_id}`);
      console.log(`     - Chat existe: ${participant.chat_exists ? 'SÍ' : 'NO'}`);
      console.log(`     - Chat activo: ${participant.is_active ? 'SÍ' : 'NO'}`);
      console.log(`     - Chat nombre: ${participant.chat_name || 'N/A'}`);
      console.log(`     - Rol: ${participant.role}`);
      console.log(`     - Unido: ${participant.joined_at}`);
      console.log('');
    });

    // 2. Verificar la consulta que usa getUserChats
    console.log('2️⃣ Consulta de getUserChats:');
    const getUserChatsQuery = `
      SELECT cp.*, 
             c.name as chat_name,
             c.description as chat_description,
             c.type as chat_type,
             c.community_id,
             c.last_message_at,
             c.last_message_id,
             c.settings as chat_settings
      FROM chat_participants cp
      LEFT JOIN chats c ON cp.chat_id = c.id
      WHERE cp.user_id = $1 AND c.is_active = true AND c.id IS NOT NULL
      ORDER BY c.last_message_at DESC NULLS LAST
    `;
    
    const getUserChatsResult = await pool.query(getUserChatsQuery, [testUserId]);
    console.log(`📊 Chats válidos encontrados: ${getUserChatsResult.rows.length}`);
    
    getUserChatsResult.rows.forEach((chat, index) => {
      console.log(`  ${index + 1}. Chat ID: ${chat.chat_id}`);
      console.log(`     - Nombre: ${chat.chat_name}`);
      console.log(`     - Tipo: ${chat.chat_type}`);
      console.log(`     - Último mensaje: ${chat.last_message_at || 'N/A'}`);
      console.log('');
    });

    // 3. Verificar todos los chats existentes
    console.log('3️⃣ Todos los chats en la base de datos:');
    const allChatsQuery = `
      SELECT id, name, type, is_active, created_at
      FROM chats
      ORDER BY id
    `;
    
    const allChatsResult = await pool.query(allChatsQuery);
    console.log(`📊 Total chats en DB: ${allChatsResult.rows.length}`);
    
    allChatsResult.rows.forEach((chat, index) => {
      console.log(`  ${index + 1}. ID: ${chat.id}, Nombre: ${chat.name}, Tipo: ${chat.type}, Activo: ${chat.is_active}`);
    });

    // 4. Verificar si hay chats privados entre estos usuarios
    console.log('\n4️⃣ Buscando chats privados existentes:');
    const privateChatsQuery = `
      SELECT c.id, c.name, c.type, c.created_at,
             cp1.user_id as user1_id, cp1.role as user1_role,
             cp2.user_id as user2_id, cp2.role as user2_role
      FROM chats c
      INNER JOIN chat_participants cp1 ON c.id = cp1.chat_id
      INNER JOIN chat_participants cp2 ON c.id = cp2.chat_id
      WHERE c.type = 'private' 
        AND cp1.user_id != cp2.user_id
        AND (cp1.user_id = $1 OR cp2.user_id = $1)
      ORDER BY c.created_at DESC
    `;
    
    const privateChatsResult = await pool.query(privateChatsQuery, [testUserId]);
    console.log(`📊 Chats privados encontrados: ${privateChatsResult.rows.length}`);
    
    privateChatsResult.rows.forEach((chat, index) => {
      console.log(`  ${index + 1}. Chat ID: ${chat.id}`);
      console.log(`     - Usuario 1: ${chat.user1_id} (${chat.user1_role})`);
      console.log(`     - Usuario 2: ${chat.user2_id} (${chat.user2_role})`);
      console.log(`     - Creado: ${chat.created_at}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error en debug:', error);
  } finally {
    await pool.end();
    console.log('🔌 Desconectado de PostgreSQL');
  }
}

debugChatList();
