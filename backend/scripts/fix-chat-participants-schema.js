const { Pool } = require('pg');
require('dotenv').config();

class ChatParticipantsSchemaFixer {
  constructor() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }

  async fixSchema() {
    const client = await this.pool.connect();
    try {
      console.log('🔧 Iniciando corrección del esquema de chat_participants...');

      // Verificar si las columnas ya existen
      const checkColumns = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'chat_participants' 
        AND column_name IN ('created_at', 'updated_at')
      `);

      const existingColumns = checkColumns.rows.map(row => row.column_name);
      console.log('📋 Columnas existentes:', existingColumns);

      // Agregar created_at si no existe
      if (!existingColumns.includes('created_at')) {
        await client.query(`
          ALTER TABLE chat_participants 
          ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('✅ Columna created_at agregada');
      } else {
        console.log('ℹ️  Columna created_at ya existe');
      }

      // Agregar updated_at si no existe
      if (!existingColumns.includes('updated_at')) {
        await client.query(`
          ALTER TABLE chat_participants 
          ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        `);
        console.log('✅ Columna updated_at agregada');
      } else {
        console.log('ℹ️  Columna updated_at ya existe');
      }

      // Actualizar registros existentes con timestamps
      await client.query(`
        UPDATE chat_participants 
        SET created_at = joined_at, 
            updated_at = CURRENT_TIMESTAMP 
        WHERE created_at IS NULL OR updated_at IS NULL
      `);
      console.log('✅ Timestamps actualizados para registros existentes');

      console.log('🎉 Esquema de chat_participants corregido exitosamente');

    } catch (error) {
      console.error('❌ Error corrigiendo esquema:', error);
      throw error;
    } finally {
      client.release();
      await this.pool.end();
    }
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  const fixer = new ChatParticipantsSchemaFixer();
  fixer.fixSchema()
    .then(() => {
      console.log('✅ Script completado exitosamente');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Error ejecutando script:', error);
      process.exit(1);
    });
}

module.exports = ChatParticipantsSchemaFixer;
