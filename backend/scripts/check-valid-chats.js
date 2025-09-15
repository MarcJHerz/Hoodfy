const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function checkValidChats() {
  try {
    console.log('🔍 Verificando chats válidos...\n');
    
    // Obtener todos los chats
    const chatsResult = await pool.query('SELECT id, type, created_at FROM chats ORDER BY id');
    console.log(`📊 Total de chats en la base de datos: ${chatsResult.rows.length}`);
    
    if (chatsResult.rows.length > 0) {
      console.log('\n📋 Lista de chats:');
      chatsResult.rows.forEach(chat => {
        console.log(`  - Chat ${chat.id}: ${chat.type} (creado: ${chat.created_at})`);
      });
    }
    
    // Obtener participantes de chats
    const participantsResult = await pool.query(`
      SELECT 
        cp.chat_id,
        c.type as chat_type,
        COUNT(cp.user_id) as participant_count
      FROM chat_participants cp
      LEFT JOIN chats c ON cp.chat_id = c.id
      WHERE c.id IS NOT NULL
      GROUP BY cp.chat_id, c.type
      ORDER BY cp.chat_id
    `);
    
    console.log(`\n👥 Chats con participantes válidos: ${participantsResult.rows.length}`);
    if (participantsResult.rows.length > 0) {
      console.log('\n📋 Chats con participantes:');
      participantsResult.rows.forEach(chat => {
        console.log(`  - Chat ${chat.chat_id}: ${chat.chat_type} (${chat.participant_count} participantes)`);
      });
    }
    
    // Verificar chats huérfanos
    const orphanedResult = await pool.query(`
      SELECT cp.chat_id, COUNT(cp.user_id) as participant_count
      FROM chat_participants cp
      LEFT JOIN chats c ON cp.chat_id = c.id
      WHERE c.id IS NULL
      GROUP BY cp.chat_id
      ORDER BY cp.chat_id
    `);
    
    if (orphanedResult.rows.length > 0) {
      console.log(`\n⚠️  Chats huérfanos (participantes sin chat): ${orphanedResult.rows.length}`);
      orphanedResult.rows.forEach(chat => {
        console.log(`  - Chat ${chat.chat_id}: ${chat.participant_count} participantes huérfanos`);
      });
    }
    
    // Verificar mensajes huérfanos
    const orphanedMessagesResult = await pool.query(`
      SELECT m.chat_id, COUNT(m.id) as message_count
      FROM messages m
      LEFT JOIN chats c ON m.chat_id = c.id
      WHERE c.id IS NULL
      GROUP BY m.chat_id
      ORDER BY m.chat_id
    `);
    
    if (orphanedMessagesResult.rows.length > 0) {
      console.log(`\n⚠️  Mensajes huérfanos: ${orphanedMessagesResult.rows.length}`);
      orphanedMessagesResult.rows.forEach(chat => {
        console.log(`  - Chat ${chat.chat_id}: ${chat.message_count} mensajes huérfanos`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

checkValidChats();
