import { sql } from 'drizzle-orm';
import { db } from './db';

async function executeWithRetry(db: any, query: any, description: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await db.execute(query);
      console.log(`✅ ${description} - успешно`);
      return;
    } catch (error) {
      console.warn(`⚠️ ${description} - попытка ${attempt}/${maxRetries} не удалась:`, error);
      if (attempt === maxRetries) {
        throw error;
      }
      // Wait before retry (reduced wait time)
      await new Promise(resolve => setTimeout(resolve, 500 * attempt));
    }
  }
}

export async function initializeDatabaseTables() {
  console.log('🔧 Initializing database tables...');
  
  try {
    // Use imported db directly
    
    // First, test the connection with timeout
    console.log('Testing database connection...');
    const healthCheckPromise = db.execute(sql`SELECT 1 as health`);
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Database connection timeout')), 60000)
    );
    
    await Promise.race([healthCheckPromise, timeoutPromise]);
    console.log('✅ Database connection successful!');
    
    // Создаем таблицы если их нет (с поддержкой IF NOT EXISTS)
    // Сначала создаем telegram_users, так как на неё ссылаются другие таблицы
    await executeWithRetry(db, sql`
      CREATE TABLE IF NOT EXISTS telegram_users (
        id BIGINT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT,
        username TEXT,
        photo_url TEXT,
        auth_date BIGINT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `, "Создание таблицы telegram_users");

    await executeWithRetry(db, sql`
      CREATE TABLE IF NOT EXISTS bot_projects (
        id SERIAL PRIMARY KEY,
        owner_id BIGINT REFERENCES telegram_users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        data JSONB NOT NULL,
        bot_token TEXT,
        user_database_enabled INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `, "Создание таблицы bot_projects");

    await executeWithRetry(db, sql`
      CREATE TABLE IF NOT EXISTS bot_tokens (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES bot_projects(id) ON DELETE CASCADE NOT NULL,
        name TEXT NOT NULL,
        token TEXT NOT NULL,
        is_default INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        description TEXT,
        bot_first_name TEXT,
        bot_username TEXT,
        bot_description TEXT,
        bot_short_description TEXT,
        bot_photo_url TEXT,
        bot_can_join_groups INTEGER,
        bot_can_read_all_group_messages INTEGER,
        bot_supports_inline_queries INTEGER,
        bot_has_main_web_app INTEGER,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `, "Создание таблицы bot_tokens");

    await executeWithRetry(db, sql`
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
    `, "Создание таблицы bot_instances");

    await executeWithRetry(db, sql`
      CREATE TABLE IF NOT EXISTS bot_templates (
        id SERIAL PRIMARY KEY,
        owner_id BIGINT REFERENCES telegram_users(id) ON DELETE CASCADE,
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
    `, "Создание таблицы bot_templates");

    await executeWithRetry(db, sql`
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
    `, "Создание таблицы media_files");

    await executeWithRetry(db, sql`
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
    `, "Создание таблицы user_bot_data");

    await executeWithRetry(db, sql`
      CREATE TABLE IF NOT EXISTS bot_groups (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES bot_projects(id) ON DELETE CASCADE NOT NULL,
        group_id TEXT,
        name TEXT NOT NULL,
        url TEXT NOT NULL,
        is_admin INTEGER DEFAULT 0,
        member_count INTEGER,
        is_active INTEGER DEFAULT 1,
        description TEXT,
        settings JSONB DEFAULT '{}',
        avatar_url TEXT,
        chat_type TEXT DEFAULT 'group',
        invite_link TEXT,
        admin_rights JSONB DEFAULT '{"can_manage_chat": false, "can_change_info": false, "can_delete_messages": false, "can_invite_users": false, "can_restrict_members": false, "can_pin_messages": false, "can_promote_members": false, "can_manage_video_chats": false}',
        messages_count INTEGER DEFAULT 0,
        active_users INTEGER DEFAULT 0,
        last_activity TIMESTAMP,
        is_public INTEGER DEFAULT 0,
        language TEXT DEFAULT 'ru',
        timezone TEXT,
        tags TEXT[] DEFAULT '{}',
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `, "Создание таблицы bot_groups");

    await executeWithRetry(db, sql`
      CREATE TABLE IF NOT EXISTS group_members (
        id SERIAL PRIMARY KEY,
        group_id INTEGER REFERENCES bot_groups(id) ON DELETE CASCADE NOT NULL,
        user_id BIGINT NOT NULL,
        username TEXT,
        first_name TEXT,
        last_name TEXT,
        status TEXT DEFAULT 'member',
        is_bot INTEGER DEFAULT 0,
        admin_rights JSONB DEFAULT '{}',
        custom_title TEXT,
        restrictions JSONB DEFAULT '{}',
        restricted_until TIMESTAMP,
        joined_at TIMESTAMP DEFAULT NOW(),
        last_seen TIMESTAMP,
        message_count INTEGER DEFAULT 0,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `, "Создание таблицы group_members");

    await executeWithRetry(db, sql`
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
    `, "Создание таблицы bot_users");

    await executeWithRetry(db, sql`
      CREATE TABLE IF NOT EXISTS user_telegram_settings (
        id SERIAL PRIMARY KEY,
        user_id TEXT NOT NULL UNIQUE,
        api_id TEXT,
        api_hash TEXT,
        phone_number TEXT,
        session_string TEXT,
        is_active INTEGER DEFAULT 1,
        last_login TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `, "Создание таблицы user_telegram_settings");

    await executeWithRetry(db, sql`
      CREATE TABLE IF NOT EXISTS bot_messages (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES bot_projects(id) ON DELETE CASCADE NOT NULL,
        user_id TEXT NOT NULL,
        message_type TEXT NOT NULL,
        message_text TEXT,
        message_data JSONB,
        node_id TEXT,
        primary_media_id INTEGER REFERENCES media_files(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `, "Создание таблицы bot_messages");

    await executeWithRetry(db, sql`
      CREATE TABLE IF NOT EXISTS bot_message_media (
        id SERIAL PRIMARY KEY,
        message_id INTEGER REFERENCES bot_messages(id) ON DELETE CASCADE NOT NULL,
        media_file_id INTEGER REFERENCES media_files(id) ON DELETE CASCADE NOT NULL,
        media_kind TEXT NOT NULL,
        order_index INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `, "Создание таблицы bot_message_media");

    // Миграция: добавление primary_media_id в bot_messages если его нет
    try {
      const columnCheck = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'bot_messages' 
        AND column_name = 'primary_media_id';
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('🔄 Добавляем колонку primary_media_id в таблицу bot_messages...');
        await executeWithRetry(db, sql`
          ALTER TABLE bot_messages 
          ADD COLUMN primary_media_id INTEGER REFERENCES media_files(id) ON DELETE SET NULL;
        `, "Миграция: добавление primary_media_id");
        console.log('✅ Колонка primary_media_id успешно добавлена');
      }
    } catch (error) {
      console.log('⚠️ Ошибка при проверке/добавлении колонки primary_media_id:', error);
    }

    // Миграция: добавление owner_id в bot_projects если его нет
    try {
      const columnCheck = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'bot_projects' 
        AND column_name = 'owner_id';
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('🔄 Добавляем колонку owner_id в таблицу bot_projects...');
        await executeWithRetry(db, sql`
          ALTER TABLE bot_projects 
          ADD COLUMN owner_id BIGINT REFERENCES telegram_users(id) ON DELETE CASCADE;
        `, "Миграция: добавление owner_id в bot_projects");
        console.log('✅ Колонка owner_id успешно добавлена в bot_projects');
      }
    } catch (error) {
      console.log('⚠️ Ошибка при проверке/добавлении колонки owner_id в bot_projects:', error);
    }

    // Миграция: добавление owner_id в bot_templates если его нет
    try {
      const columnCheck = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'bot_templates' 
        AND column_name = 'owner_id';
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('🔄 Добавляем колонку owner_id в таблицу bot_templates...');
        await executeWithRetry(db, sql`
          ALTER TABLE bot_templates 
          ADD COLUMN owner_id BIGINT REFERENCES telegram_users(id) ON DELETE CASCADE;
        `, "Миграция: добавление owner_id в bot_templates");
        console.log('✅ Колонка owner_id успешно добавлена в bot_templates');
      }
    } catch (error) {
      console.log('⚠️ Ошибка при проверке/добавлении колонки owner_id в bot_templates:', error);
    }

    // Миграция: добавление owner_id в bot_tokens если его нет
    try {
      const columnCheck = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'bot_tokens' 
        AND column_name = 'owner_id';
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('🔄 Добавляем колонку owner_id в таблицу bot_tokens...');
        await executeWithRetry(db, sql`
          ALTER TABLE bot_tokens 
          ADD COLUMN owner_id BIGINT REFERENCES telegram_users(id) ON DELETE CASCADE;
        `, "Миграция: добавление owner_id в bot_tokens");
        console.log('✅ Колонка owner_id успешно добавлена в bot_tokens');
      }
    } catch (error) {
      console.log('⚠️ Ошибка при проверке/добавлении колонки owner_id в bot_tokens:', error);
    }

    // Миграция: добавление track_execution_time в bot_tokens если его нет
    try {
      const columnCheck = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'bot_tokens' 
        AND column_name = 'track_execution_time';
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('🔄 Добавляем колонку track_execution_time в таблицу bot_tokens...');
        await executeWithRetry(db, sql`
          ALTER TABLE bot_tokens 
          ADD COLUMN track_execution_time INTEGER DEFAULT 0;
        `, "Миграция: добавление track_execution_time в bot_tokens");
        console.log('✅ Колонка track_execution_time успешно добавлена в bot_tokens');
      }
    } catch (error) {
      console.log('⚠️ Ошибка при проверке/добавлении колонки track_execution_time в bot_tokens:', error);
    }

    // Миграция: добавление total_execution_seconds в bot_tokens если его нет
    try {
      const columnCheck = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'bot_tokens' 
        AND column_name = 'total_execution_seconds';
      `);
      
      if (columnCheck.rows.length === 0) {
        console.log('🔄 Добавляем колонку total_execution_seconds в таблицу bot_tokens...');
        await executeWithRetry(db, sql`
          ALTER TABLE bot_tokens 
          ADD COLUMN total_execution_seconds INTEGER DEFAULT 0;
        `, "Миграция: добавление total_execution_seconds в bot_tokens");
        console.log('✅ Колонка total_execution_seconds успешно добавлена в bot_tokens');
      }
    } catch (error) {
      console.log('⚠️ Ошибка при проверке/добавлении колонки total_execution_seconds в bot_tokens:', error);
    }

    console.log('✅ Database tables initialized successfully!');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    return false;
  }
}