const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const migrationsDir = path.join(__dirname, 'migrations');

async function applyMigrations() {
  const client = new Client({ connectionString: DATABASE_URL.trim() });
  
  try {
    await client.connect();
    console.log('✅ Connected to database');
    
    // Создаём таблицу миграций если нет
    await client.query(`
      CREATE TABLE IF NOT EXISTS __drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash TEXT NOT NULL,
        created_at BIGINT NOT NULL
      )
    `);
    
    // Получаем список применённых миграций
    const result = await client.query('SELECT hash FROM __drizzle_migrations ORDER BY id');
    const appliedMigrations = new Set(result.rows.map(r => r.hash));
    
    // Получаем список SQL файлов
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();
    
    console.log('Found migrations:', files);
    
    for (const file of files) {
      const content = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
      const hash = require('crypto').createHash('sha256').update(content).digest('hex');
      
      if (appliedMigrations.has(hash)) {
        console.log('⏭️  Already applied:', file);
        continue;
      }
      
      console.log('🔄 Applying:', file);
      
      // Выполняем миграцию в транзакции
      await client.query('BEGIN');
      try {
        await client.query(content);
        await client.query(
          'INSERT INTO __drizzle_migrations (hash, created_at) VALUES ($1, $2)',
          [hash, Date.now()]
        );
        await client.query('COMMIT');
        console.log('✅ Applied:', file);
      } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ Error applying', file, ':', e.message);
        throw e;
      }
    }
    
    console.log('\n🎉 All migrations applied successfully!');
  } catch (e) {
    console.error('Migration failed:', e.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

applyMigrations();
