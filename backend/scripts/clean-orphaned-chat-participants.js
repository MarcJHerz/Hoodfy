const { Pool } = require('pg');
require('dotenv').config();

async function cleanOrphanedChatParticipants() {
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

    console.log('\n🔍 LIMPIANDO PARTICIPANTES HUÉRFANOS\n');

    // 1. Encontrar participantes que referencian chats inexistentes
    console.log('1️⃣ Buscando participantes huérfanos...');
    const orphanedQuery = `
      SELECT cp.*, c.id as chat_exists
      FROM chat_participants cp
      LEFT JOIN chats c ON cp.chat_id = c.id
      WHERE c.id IS NULL
    `;
    
    const orphanedResult = await pool.query(orphanedQuery);
    console.log(`📊 Participantes huérfanos encontrados: ${orphanedResult.rows.length}`);
    
    if (orphanedResult.rows.length > 0) {
      console.log('📋 Participantes huérfanos:');
      orphanedResult.rows.forEach((participant, index) => {
        console.log(`  ${index + 1}. Chat ID: ${participant.chat_id}, Usuario: ${participant.user_id}, Rol: ${participant.role}`);
      });

      // 2. Eliminar participantes huérfanos
      console.log('\n2️⃣ Eliminando participantes huérfanos...');
      const deleteQuery = `
        DELETE FROM chat_participants 
        WHERE chat_id IN (
          SELECT cp.chat_id 
          FROM chat_participants cp
          LEFT JOIN chats c ON cp.chat_id = c.id
          WHERE c.id IS NULL
        )
      `;
      
      const deleteResult = await pool.query(deleteQuery);
      console.log(`✅ Participantes huérfanos eliminados: ${deleteResult.rowCount}`);
    } else {
      console.log('✅ No se encontraron participantes huérfanos');
    }

    // 3. Verificar mensajes huérfanos
    console.log('\n3️⃣ Verificando mensajes huérfanos...');
    const orphanedMessagesQuery = `
      SELECT COUNT(*) as count
      FROM messages m
      LEFT JOIN chats c ON m.chat_id = c.id
      WHERE c.id IS NULL
    `;
    
    const orphanedMessagesResult = await pool.query(orphanedMessagesQuery);
    const orphanedMessagesCount = orphanedMessagesResult.rows[0].count;
    
    if (orphanedMessagesCount > 0) {
      console.log(`⚠️ Mensajes huérfanos encontrados: ${orphanedMessagesCount}`);
      
      // Eliminar mensajes huérfanos
      console.log('🗑️ Eliminando mensajes huérfanos...');
      const deleteMessagesQuery = `
        DELETE FROM messages 
        WHERE chat_id IN (
          SELECT m.chat_id 
          FROM messages m
          LEFT JOIN chats c ON m.chat_id = c.id
          WHERE c.id IS NULL
        )
      `;
      
      const deleteMessagesResult = await pool.query(deleteMessagesQuery);
      console.log(`✅ Mensajes huérfanos eliminados: ${deleteMessagesResult.rowCount}`);
    } else {
      console.log('✅ No se encontraron mensajes huérfanos');
    }

    // 4. Verificar estado final
    console.log('\n4️⃣ Verificando estado final...');
    const finalCheckQuery = `
      SELECT 
        (SELECT COUNT(*) FROM chat_participants) as total_participants,
        (SELECT COUNT(*) FROM chats) as total_chats,
        (SELECT COUNT(*) FROM messages) as total_messages
    `;
    
    const finalResult = await pool.query(finalCheckQuery);
    const stats = finalResult.rows[0];
    
    console.log('📊 Estado final:');
    console.log(`  - Participantes: ${stats.total_participants}`);
    console.log(`  - Chats: ${stats.total_chats}`);
    console.log(`  - Mensajes: ${stats.total_messages}`);

    console.log('\n✅ LIMPIEZA COMPLETADA');

  } catch (error) {
    console.error('❌ Error en la limpieza:', error);
  } finally {
    await pool.end();
    console.log('🔌 Desconectado de PostgreSQL');
  }
}

cleanOrphanedChatParticipants();
