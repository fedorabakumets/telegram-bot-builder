import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { sql } from 'drizzle-orm';
import * as schema from '../shared/schema';

async function initDatabase() {
  // Получаем URL базы данных из переменных окружения Replit
  const databaseUrl = process.env.DATABASE_URL || process.env.REPLIT_DB_URL;
  
  if (!databaseUrl) {
    console.error('DATABASE_URL is not set. Checking available environment variables...');
    console.log('Available env vars:', Object.keys(process.env).filter(key => key.includes('DB')));
    process.exit(1);
  }

  console.log('Connecting to database...');
  
  const pool = new Pool({ 
    connectionString: databaseUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  const db = drizzle(pool, { schema });

  try {
    // Проверяем подключение
    console.log('Testing connection...');
    await db.execute(sql`SELECT 1`);
    console.log('✅ Database connection successful!');

    // Создаем таблицы если их нет
    console.log('Creating tables...');
    
    // Создаем таблицы по порядку (с учетом зависимостей)
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bot_projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        data JSONB NOT NULL,
        bot_token TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bot_tokens (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES bot_projects(id) ON DELETE CASCADE NOT NULL,
        name TEXT NOT NULL,
        token TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        description TEXT,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bot_instances (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES bot_projects(id) NOT NULL,
        token_id INTEGER REFERENCES bot_tokens(id) ON DELETE CASCADE NOT NULL,
        status TEXT NOT NULL,
        token TEXT NOT NULL,
        process_id TEXT,
        started_at TIMESTAMP DEFAULT NOW(),
        stopped_at TIMESTAMP,
        error_message TEXT
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bot_templates (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        description TEXT,
        data JSONB NOT NULL,
        category TEXT DEFAULT 'custom',
        tags TEXT[],
        is_public INTEGER DEFAULT 0,
        difficulty TEXT DEFAULT 'easy',
        author_id TEXT,
        author_name TEXT,
        use_count INTEGER NOT NULL DEFAULT 0,
        rating INTEGER NOT NULL DEFAULT 0,
        rating_count INTEGER NOT NULL DEFAULT 0,
        featured INTEGER NOT NULL DEFAULT 0,
        version TEXT DEFAULT '1.0.0',
        preview_image TEXT,
        last_used_at TIMESTAMP,
        download_count INTEGER NOT NULL DEFAULT 0,
        like_count INTEGER NOT NULL DEFAULT 0,
        bookmark_count INTEGER NOT NULL DEFAULT 0,
        view_count INTEGER NOT NULL DEFAULT 0,
        language TEXT DEFAULT 'ru',
        requires_token INTEGER NOT NULL DEFAULT 0,
        complexity INTEGER NOT NULL DEFAULT 1,
        estimated_time INTEGER NOT NULL DEFAULT 5,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS media_files (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES bot_projects(id) ON DELETE CASCADE NOT NULL,
        file_name TEXT NOT NULL,
        file_type TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        url TEXT NOT NULL,
        description TEXT,
        tags TEXT[] DEFAULT '{}',
        is_public INTEGER DEFAULT 0,
        usage_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_bot_data (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES bot_projects(id) ON DELETE CASCADE NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT,
        first_name TEXT,
        last_name TEXT,
        language_code TEXT,
        is_bot INTEGER DEFAULT 0,
        is_premium INTEGER DEFAULT 0,
        last_interaction TIMESTAMP DEFAULT NOW(),
        interaction_count INTEGER DEFAULT 0,
        user_data JSONB DEFAULT '{}',
        current_state TEXT,
        preferences JSONB DEFAULT '{}',
        commands_used JSONB DEFAULT '{}',
        sessions_count INTEGER DEFAULT 1,
        total_messages_sent INTEGER DEFAULT 0,
        total_messages_received INTEGER DEFAULT 0,
        device_info TEXT,
        location_data JSONB,
        contact_data JSONB,
        is_blocked INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        tags TEXT[] DEFAULT '{}',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS bot_users (
        user_id BIGINT PRIMARY KEY,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        registered_at TIMESTAMP DEFAULT NOW(),
        last_interaction TIMESTAMP DEFAULT NOW(),
        interaction_count INTEGER DEFAULT 0,
        user_data JSONB DEFAULT '{}',
        is_active INTEGER DEFAULT 1
      );
    `);

    console.log('✅ All tables created successfully!');
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase().catch(console.error);