const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  database: process.env.POSTGRES_DB,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function diagnoseChatConsistency() {
  const client = await pool.connect();
  
  try {
    console.log('🔍 Diagnóstico de consistencia de chats de comunidad...\n');
    
    // 1. Verificar todos los chats de comunidad activos
    const allChats = await client.query(`
      SELECT id, name, community_id, created_at, is_active, created_by
      FROM chats 
      WHERE type = 'community' AND is_active = true
      ORDER BY community_id, created_at
    `);
    
    console.log(`📊 Total de chats de comunidad activos: ${allChats.rows.length}`);
    
    // 2. Buscar duplicados por community_id
    const duplicates = await client.query(`
      SELECT community_id, COUNT(*) as count, 
             ARRAY_AGG(id ORDER BY created_at) as chat_ids,
             ARRAY_AGG(created_at ORDER BY created_at) as created_dates
      FROM chats 
      WHERE type = 'community' AND is_active = true
      GROUP BY community_id
      HAVING COUNT(*) > 1
      ORDER BY community_id
    `);
    
    if (duplicates.rows.length > 0) {
      console.log('\n⚠️  DUPLICADOS ENCONTRADOS:');
      duplicates.rows.forEach(dup => {
        console.log(`\nCommunity ${dup.community_id}:`);
        console.log(`  - ${dup.count} chats activos`);
        console.log(`  - IDs: ${dup.chat_ids.join(', ')}`);
        console.log(`  - Fechas: ${dup.created_dates.join(', ')}`);
      });
    } else {
      console.log('\n✅ No se encontraron duplicados');
    }
    
    // 3. Verificar el índice único
    const indexes = await client.query(`
      SELECT indexname, indexdef 
      FROM pg_indexes 
      WHERE tablename = 'chats' 
      AND indexdef LIKE '%community_id%'
    `);
    
    console.log('\n📋 Índices existentes en community_id:');
    indexes.rows.forEach(idx => {
      console.log(`  - ${idx.indexname}: ${idx.indexdef}`);
    });
    
    // 4. Verificar si existe índice único
    const uniqueIndex = indexes.rows.find(idx => 
      idx.indexdef.includes('UNIQUE') && 
      idx.indexdef.includes('community_id') && 
      idx.indexdef.includes('type')
    );
    
    if (!uniqueIndex) {
      console.log('\n❌ NO EXISTE ÍNDICE ÚNICO para (community_id, type, is_active)');
      console.log('   Esto puede causar inconsistencias en la búsqueda de chats');
    } else {
      console.log('\n✅ Índice único encontrado:', uniqueIndex.indexname);
    }
    
    return {
      totalChats: allChats.rows.length,
      duplicates: duplicates.rows,
      hasUniqueIndex: !!uniqueIndex
    };
    
  } finally {
    client.release();
  }
}

async function fixChatConsistency() {
  const client = await pool.connect();
  
  try {
    console.log('\n🔧 Aplicando correcciones...\n');
    
    // 1. Crear índice único para prevenir duplicados futuros
    console.log('1. Creando índice único...');
    await client.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_chats_community_unique 
      ON chats (community_id, type) 
      WHERE type = 'community' AND is_active = true
    `);
    console.log('   ✅ Índice único creado');
    
    // 2. Encontrar y limpiar duplicados
    const duplicates = await client.query(`
      SELECT community_id, 
             ARRAY_AGG(id ORDER BY created_at) as chat_ids,
             ARRAY_AGG(created_at ORDER BY created_at) as created_dates
      FROM chats 
      WHERE type = 'community' AND is_active = true
      GROUP BY community_id
      HAVING COUNT(*) > 1
    `);
    
    if (duplicates.rows.length > 0) {
      console.log('\n2. Limpiando duplicados...');
      
      for (const dup of duplicates.rows) {
        const chatIds = dup.chat_ids;
        const keepChatId = chatIds[0]; // Mantener el más antiguo
        const deleteChatIds = chatIds.slice(1);
        
        console.log(`   Community ${dup.community_id}:`);
        console.log(`   - Manteniendo chat ID: ${keepChatId}`);
        console.log(`   - Eliminando chats: ${deleteChatIds.join(', ')}`);
        
        // Mover participantes de chats duplicados al chat principal
        for (const deleteChatId of deleteChatIds) {
          // Mover participantes
          await client.query(`
            UPDATE chat_participants 
            SET chat_id = $1
            WHERE chat_id = $2
            ON CONFLICT (chat_id, user_id) DO NOTHING
          `, [keepChatId, deleteChatId]);
          
          // Mover mensajes
          await client.query(`
            UPDATE messages 
            SET chat_id = $1
            WHERE chat_id = $2
          `, [keepChatId, deleteChatId]);
          
          // Desactivar chat duplicado
          await client.query(`
            UPDATE chats 
            SET is_active = false, updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
          `, [deleteChatId]);
          
          console.log(`   - Chat ${deleteChatId} desactivado y datos migrados`);
        }
      }
    } else {
      console.log('\n2. No hay duplicados que limpiar');
    }
    
    // 3. Verificar resultado final
    console.log('\n3. Verificando resultado...');
    const finalCheck = await client.query(`
      SELECT community_id, COUNT(*) as count
      FROM chats 
      WHERE type = 'community' AND is_active = true
      GROUP BY community_id
      HAVING COUNT(*) > 1
    `);
    
    if (finalCheck.rows.length === 0) {
      console.log('   ✅ No quedan duplicados');
    } else {
      console.log('   ❌ Aún hay duplicados:', finalCheck.rows);
    }
    
    console.log('\n🎉 Corrección completada');
    
  } finally {
    client.release();
  }
}

async function main() {
  try {
    console.log('🚀 Iniciando diagnóstico y corrección de chats...\n');
    
    // Diagnóstico
    const diagnosis = await diagnoseChatConsistency();
    
    if (diagnosis.duplicates.length > 0 || !diagnosis.hasUniqueIndex) {
      console.log('\n❌ Se encontraron problemas que requieren corrección');
      
      // Preguntar si proceder
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise((resolve) => {
        rl.question('\n¿Deseas aplicar las correcciones? (y/N): ', resolve);
      });
      
      rl.close();
      
      if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
        await fixChatConsistency();
      } else {
        console.log('\n⏭️  Correcciones canceladas');
      }
    } else {
      console.log('\n✅ No se encontraron problemas');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  main();
}

module.exports = { diagnoseChatConsistency, fixChatConsistency };
