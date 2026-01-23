import { VercelRequest, VercelResponse } from '@vercel/node';
import { Pool } from 'pg';

let pool: Pool;

function initDB() {
  if (!pool) {
    let connectionString = process.env.DATABASE_URL;

    // Если DATABASE_URL нет, собираем из отдельных переменных
    if (!connectionString && process.env.PGHOST) {
      const host = process.env.PGHOST;
      const port = process.env.PGPORT || '5432';
      const database = process.env.PGDATABASE;
      const user = process.env.PGUSER;
      const password = process.env.PGPASSWORD;

      connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}?sslmode=require`;
    }

    if (!connectionString) {
      throw new Error('DATABASE_URL or PostgreSQL connection variables must be set');
    }

    pool = new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

async function createTables() {
  const database = initDB();

  try {
    // Создаем таблицы в правильном порядке (с учетом зависимостей)

    // 1. Telegram users (базовая таблица)
    await database.query(`
      CREATE TABLE IF NOT EXISTS telegram_users (
        id BIGINT PRIMARY KEY,
        first_name TEXT NOT NULL,
        last_name TEXT,
        username TEXT,
        photo_url TEXT,
        auth_date BIGINT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 2. Bot projects
    await database.query(`
      CREATE TABLE IF NOT EXISTS bot_projects (
        id SERIAL PRIMARY KEY,
        owner_id BIGINT REFERENCES telegram_users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        data JSONB NOT NULL DEFAULT '{}',
        bot_token TEXT,
        user_database_enabled INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 3. Bot templates - пересоздаем таблицу с правильными типами
    try {
      await database.query(`DROP TABLE IF EXISTS bot_templates CASCADE`);
    } catch (e) {
      // Таблица не существует
    }

    await database.query(`
      CREATE TABLE bot_templates (
        id SERIAL PRIMARY KEY,
        owner_id BIGINT REFERENCES telegram_users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        description TEXT,
        data JSONB NOT NULL DEFAULT '{}',
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
      )
    `);

    // Миграция: изменяем BOOLEAN колонки на INTEGER если они существуют
    try {
      await database.query(`
        ALTER TABLE bot_templates 
        ALTER COLUMN is_public TYPE INTEGER USING CASE WHEN is_public THEN 1 ELSE 0 END
      `);
    } catch (e) {
      // Колонка уже INTEGER или не существует
    }

    try {
      await database.query(`
        ALTER TABLE bot_templates 
        ALTER COLUMN featured TYPE INTEGER USING CASE WHEN featured THEN 1 ELSE 0 END
      `);
    } catch (e) {
      // Колонка уже INTEGER или не существует
    }

    // 4. Bot tokens
    await database.query(`
      CREATE TABLE IF NOT EXISTS bot_tokens (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES bot_projects(id) ON DELETE CASCADE NOT NULL,
        owner_id BIGINT REFERENCES telegram_users(id) ON DELETE CASCADE,
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
        track_execution_time INTEGER DEFAULT 0,
        total_execution_seconds INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // 5. Bot instances
    await database.query(`
      CREATE TABLE IF NOT EXISTS bot_instances (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES bot_projects(id) ON DELETE CASCADE NOT NULL,
        token_id INTEGER REFERENCES bot_tokens(id) ON DELETE CASCADE NOT NULL,
        status TEXT NOT NULL,
        token TEXT NOT NULL,
        process_id TEXT,
        started_at TIMESTAMP DEFAULT NOW(),
        stopped_at TIMESTAMP,
        error_message TEXT
      )
    `);

    // 6. Media files
    await database.query(`
      CREATE TABLE IF NOT EXISTS media_files (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES bot_projects(id) ON DELETE CASCADE NOT NULL,
        owner_id BIGINT REFERENCES telegram_users(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        original_name TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER NOT NULL,
        mime_type TEXT NOT NULL,
        file_type TEXT NOT NULL,
        description TEXT,
        tags TEXT[],
        is_public INTEGER DEFAULT 0,
        download_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);

    // Добавляем базовый шаблон если таблица пустая
    const templatesCount = await database.query('SELECT COUNT(*) FROM bot_templates');
    if (parseInt(templatesCount.rows[0].count) === 0) {
      await database.query(`
        INSERT INTO bot_templates (name, description, category, is_public, featured, data)
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        'Простой бот',
        'Базовый шаблон для начинающих',
        'basic',
        1,
        1,
        JSON.stringify({
          nodes: [
            {
              id: 'start',
              type: 'start',
              position: { x: 100, y: 100 },
              data: { label: 'Начало' }
            }
          ],
          connections: []
        })
      ]);
    }

    console.log('All tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { method, url, query, body } = req;

  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Health check - не требует БД
    if (url === '/api/health') {
      return res.status(200).json({
        status: 'ok',
        message: 'Server is running',
        database_url: process.env.DATABASE_URL ? 'set' : 'not set',
        pg_vars: process.env.PGHOST ? 'set' : 'not set'
      });
    }

    // Проверяем наличие переменных БД
    if (!process.env.DATABASE_URL && !process.env.PGHOST) {
      return res.status(500).json({
        error: 'Database not configured',
        message: 'DATABASE_URL or PostgreSQL connection variables are not set'
      });
    }

    const database = initDB();

    // Создаем таблицы при первом запуске
    await createTables();

    // ==================== PROJECTS ENDPOINTS ====================

    // Get all bot projects (lightweight - without data field)
    if (url?.startsWith('/api/projects/list') && method === 'GET') {
      const idsParam = query.ids as string;
      if (idsParam) {
        const ids = idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
        if (ids.length > 0) {
          const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
          const result = await database.query(`
            SELECT id, name, description, created_at, updated_at 
            FROM bot_projects 
            WHERE id IN (${placeholders})
            ORDER BY updated_at DESC
          `, ids);
          return res.status(200).json(result.rows);
        }
      }
      // Если нет параметра ids, возвращаем все проекты (lightweight версия)
      const result = await database.query(`
        SELECT id, name, description, created_at, updated_at 
        FROM bot_projects 
        ORDER BY updated_at DESC
      `);
      return res.status(200).json(result.rows);
    }

    // Get all bot projects (full data)
    if (url === '/api/projects' && method === 'GET') {
      const result = await database.query(`
        SELECT * FROM bot_projects 
        ORDER BY updated_at DESC
      `);
      return res.status(200).json(result.rows);
    }

    // Get single bot project
    if (url?.match(/\/api\/projects\/(\d+)$/) && method === 'GET') {
      const projectId = parseInt(url.split('/')[3]);
      const result = await database.query(
        'SELECT * FROM bot_projects WHERE id = $1',
        [projectId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    // Create new bot project
    if (url === '/api/projects' && method === 'POST') {
      const result = await database.query(`
        INSERT INTO bot_projects (name, description, data, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `, [
        body.name || 'New Project',
        body.description || '',
        JSON.stringify(body.data || {})
      ]);

      return res.status(201).json(result.rows[0]);
    }

    // Update bot project
    if (url?.match(/\/api\/projects\/(\d+)$/) && method === 'PUT') {
      const projectId = parseInt(url.split('/')[3]);
      const result = await database.query(`
        UPDATE bot_projects 
        SET name = $1, description = $2, data = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [
        body.name,
        body.description,
        JSON.stringify(body.data),
        projectId
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    // Delete bot project
    if (url?.match(/\/api\/projects\/(\d+)$/) && method === 'DELETE') {
      const projectId = parseInt(url.split('/')[3]);
      await database.query('DELETE FROM bot_projects WHERE id = $1', [projectId]);
      return res.status(200).json({ success: true });
    }

    // ==================== TEMPLATES ENDPOINTS ====================

    // Get all templates
    if (url === '/api/templates' && method === 'GET') {
      const result = await database.query(`
        SELECT * FROM bot_templates 
        WHERE is_public = 1 
        ORDER BY created_at DESC
      `);
      return res.status(200).json(result.rows);
    }

    // Get featured templates
    if (url === '/api/templates/featured' && method === 'GET') {
      const result = await database.query(`
        SELECT * FROM bot_templates 
        WHERE is_public = 1 AND featured = 1 
        ORDER BY created_at DESC
      `);
      return res.status(200).json(result.rows);
    }

    // Get templates by category
    if (url?.startsWith('/api/templates/category/') && method === 'GET') {
      const category = url.split('/')[4];

      if (category === 'custom') {
        const idsParam = query.ids as string;
        if (idsParam) {
          const ids = idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
          if (ids.length > 0) {
            const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');
            const result = await database.query(`
              SELECT * FROM bot_templates 
              WHERE id IN (${placeholders})
              ORDER BY created_at DESC
            `, ids);
            return res.status(200).json(result.rows);
          }
        }
        return res.status(200).json([]);
      }

      const result = await database.query(`
        SELECT * FROM bot_templates 
        WHERE is_public = 1 AND category = $1
        ORDER BY created_at DESC
      `, [category]);
      return res.status(200).json(result.rows);
    }

    // Get single template
    if (url?.match(/\/api\/templates\/(\d+)$/) && method === 'GET') {
      const templateId = parseInt(url.split('/')[3]);
      const result = await database.query(
        'SELECT * FROM bot_templates WHERE id = $1',
        [templateId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    // Create new template
    if (url === '/api/templates' && method === 'POST') {
      const result = await database.query(`
        INSERT INTO bot_templates (name, description, category, is_public, featured, data, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING *
      `, [
        body.name || 'New Template',
        body.description || '',
        body.category || 'custom',
        body.is_public !== undefined ? body.is_public : 0,
        body.featured !== undefined ? body.featured : 0,
        JSON.stringify(body.data || {})
      ]);

      return res.status(201).json(result.rows[0]);
    }

    // Update template
    if (url?.match(/\/api\/templates\/(\d+)$/) && method === 'PUT') {
      const templateId = parseInt(url.split('/')[3]);
      const result = await database.query(`
        UPDATE bot_templates 
        SET name = $1, description = $2, category = $3, is_public = $4, featured = $5, data = $6, updated_at = NOW()
        WHERE id = $7
        RETURNING *
      `, [
        body.name,
        body.description,
        body.category,
        body.is_public,
        body.featured,
        JSON.stringify(body.data),
        templateId
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    // Delete template
    if (url?.match(/\/api\/templates\/(\d+)$/) && method === 'DELETE') {
      const templateId = parseInt(url.split('/')[3]);
      await database.query('DELETE FROM bot_templates WHERE id = $1', [templateId]);
      return res.status(200).json({ success: true });
    }

    // Use template (create project from template)
    if (url?.match(/\/api\/templates\/(\d+)\/use/) && method === 'POST') {
      const templateId = parseInt(url.split('/')[3]);
      const templateResult = await database.query(
        'SELECT * FROM bot_templates WHERE id = $1',
        [templateId]
      );

      if (templateResult.rows.length === 0) {
        return res.status(404).json({ error: 'Template not found' });
      }

      const template = templateResult.rows[0];

      // Increment use count
      await database.query(
        'UPDATE bot_templates SET use_count = use_count + 1, last_used_at = NOW() WHERE id = $1',
        [templateId]
      );

      // Create project from template
      const result = await database.query(`
        INSERT INTO bot_projects (name, description, data, created_at, updated_at)
        VALUES ($1, $2, $3, NOW(), NOW())
        RETURNING *
      `, [
        `${template.name} - Copy`,
        template.description,
        template.data
      ]);

      return res.status(201).json(result.rows[0]);
    }

    // Template interactions (simplified for Vercel)
    if (url?.match(/\/api\/templates\/(\d+)\/rate/) && method === 'POST') {
      const templateId = parseInt(url.split('/')[3]);
      const { rating } = body;

      // Update rating (simplified - just increment)
      await database.query(`
        UPDATE bot_templates 
        SET rating_count = rating_count + 1, 
            rating = CASE 
              WHEN rating_count = 0 THEN $2
              ELSE (rating * rating_count + $2) / (rating_count + 1)
            END
        WHERE id = $1
      `, [templateId, rating]);

      return res.status(200).json({ success: true, message: 'Rating saved' });
    }

    if (url?.match(/\/api\/templates\/(\d+)\/like/) && method === 'POST') {
      const templateId = parseInt(url.split('/')[3]);
      await database.query(
        'UPDATE bot_templates SET like_count = like_count + 1 WHERE id = $1',
        [templateId]
      );
      return res.status(200).json({ success: true, message: 'Like added' });
    }

    if (url?.match(/\/api\/templates\/(\d+)\/bookmark/) && method === 'POST') {
      const templateId = parseInt(url.split('/')[3]);
      await database.query(
        'UPDATE bot_templates SET bookmark_count = bookmark_count + 1 WHERE id = $1',
        [templateId]
      );
      return res.status(200).json({ success: true, message: 'Bookmark added' });
    }

    if (url?.match(/\/api\/templates\/(\d+)\/download/) && method === 'POST') {
      const templateId = parseInt(url.split('/')[3]);
      await database.query(
        'UPDATE bot_templates SET download_count = download_count + 1 WHERE id = $1',
        [templateId]
      );
      return res.status(200).json({ success: true, message: 'Download counted' });
    }

    if (url?.match(/\/api\/templates\/(\d+)\/view/) && method === 'POST') {
      const templateId = parseInt(url.split('/')[3]);
      await database.query(
        'UPDATE bot_templates SET view_count = view_count + 1 WHERE id = $1',
        [templateId]
      );
      return res.status(200).json({ success: true, message: 'View counted' });
    }

    // ==================== BOT TOKENS ENDPOINTS ====================

    // Get all tokens for a project
    if (url?.match(/\/api\/projects\/(\d+)\/tokens$/) && method === 'GET') {
      const projectId = parseInt(url.split('/')[3]);
      const result = await database.query(`
        SELECT * FROM bot_tokens 
        WHERE project_id = $1 
        ORDER BY created_at DESC
      `, [projectId]);
      return res.status(200).json(result.rows);
    }

    // Create a new token
    if (url?.match(/\/api\/projects\/(\d+)\/tokens$/) && method === 'POST') {
      const projectId = parseInt(url.split('/')[3]);
      const result = await database.query(`
        INSERT INTO bot_tokens (project_id, name, token, description, created_at, updated_at)
        VALUES ($1, $2, $3, $4, NOW(), NOW())
        RETURNING *
      `, [
        projectId,
        body.name || 'Bot Token',
        body.token,
        body.description || ''
      ]);

      return res.status(201).json(result.rows[0]);
    }

    // Update a token
    if (url?.match(/\/api\/tokens\/(\d+)$/) && method === 'PUT') {
      const tokenId = parseInt(url.split('/')[3]);
      const result = await database.query(`
        UPDATE bot_tokens 
        SET name = $1, token = $2, description = $3, updated_at = NOW()
        WHERE id = $4
        RETURNING *
      `, [
        body.name,
        body.token,
        body.description,
        tokenId
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Token not found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    // Delete a token
    if (url?.match(/\/api\/tokens\/(\d+)$/) && method === 'DELETE') {
      const tokenId = parseInt(url.split('/')[3]);
      await database.query('DELETE FROM bot_tokens WHERE id = $1', [tokenId]);
      return res.status(200).json({ success: true });
    }

    // Set default token
    if (url?.match(/\/api\/projects\/(\d+)\/tokens\/(\d+)\/set-default$/) && method === 'POST') {
      const projectId = parseInt(url.split('/')[3]);
      const tokenId = parseInt(url.split('/')[5]);

      // Remove default from all tokens in project
      await database.query(
        'UPDATE bot_tokens SET is_default = 0 WHERE project_id = $1',
        [projectId]
      );

      // Set new default
      await database.query(
        'UPDATE bot_tokens SET is_default = 1 WHERE id = $1',
        [tokenId]
      );

      return res.status(200).json({ success: true });
    }

    // Get default token for a project
    if (url?.match(/\/api\/projects\/(\d+)\/tokens\/default$/) && method === 'GET') {
      const projectId = parseInt(url.split('/')[3]);
      const result = await database.query(`
        SELECT * FROM bot_tokens 
        WHERE project_id = $1 AND is_default = 1 
        LIMIT 1
      `, [projectId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'No default token found' });
      }

      return res.status(200).json(result.rows[0]);
    }

    // ==================== BOT MANAGEMENT ENDPOINTS ====================

    // Get bot instance status
    if (url?.match(/\/api\/projects\/(\d+)\/bot$/) && method === 'GET') {
      const projectId = parseInt(url.split('/')[3]);
      
      // Проверяем, есть ли внешний Bot Runner
      const BOT_RUNNER_URL = process.env.BOT_RUNNER_URL;
      
      if (BOT_RUNNER_URL) {
        try {
          const response = await fetch(`${BOT_RUNNER_URL}/bot/${projectId}/status`);
          const status = await response.json();
          return res.status(200).json(status);
        } catch (error) {
          return res.status(200).json({ 
            status: 'error', 
            message: 'Bot runner service unavailable',
            projectId
          });
        }
      }
      
      return res.status(200).json({
        status: 'stopped',
        message: 'Bot management not available in serverless environment. Configure BOT_RUNNER_URL to enable.',
        projectId,
        hint: 'Set BOT_RUNNER_URL environment variable to enable bot execution'
      });
    }

    // Start bot
    if (url?.match(/\/api\/projects\/(\d+)\/bot\/start$/) && method === 'POST') {
      const projectId = parseInt(url.split('/')[3]);
      const BOT_RUNNER_URL = process.env.BOT_RUNNER_URL;
      
      if (BOT_RUNNER_URL) {
        try {
          // Получаем проект
          const project = await database.query('SELECT * FROM bot_projects WHERE id = $1', [projectId]);
          if (project.rows.length === 0) {
            return res.status(404).json({ error: 'Project not found' });
          }
          
          // Получаем токен по умолчанию
          const tokenResult = await database.query(
            'SELECT * FROM bot_tokens WHERE project_id = $1 AND is_default = 1 LIMIT 1',
            [projectId]
          );
          
          if (tokenResult.rows.length === 0) {
            return res.status(400).json({ error: 'No default token found. Please add a bot token first.' });
          }
          
          const token = tokenResult.rows[0];
          
          // Отправляем на внешний сервер
          const response = await fetch(`${BOT_RUNNER_URL}/bot/${projectId}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              projectId,
              projectName: project.rows[0].name,
              projectData: project.rows[0].data,
              token: token.token,
              tokenId: token.id
            })
          });
          
          const result = await response.json();
          
          // Обновляем статус в БД
          if (result.success) {
            await database.query(`
              INSERT INTO bot_instances (project_id, token_id, status, token, process_id)
              VALUES ($1, $2, $3, $4, $5)
              ON CONFLICT (project_id, token_id) DO UPDATE SET
                status = $3, started_at = NOW(), error_message = NULL
            `, [projectId, token.id, 'running', token.token, result.processId || 'external']);
          }
          
          return res.status(200).json(result);
        } catch (error) {
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to communicate with bot runner service',
            details: error.message
          });
        }
      }
      
      return res.status(200).json({
        success: false,
        error: 'Bot execution not available. Configure BOT_RUNNER_URL environment variable to enable bot execution.',
        hint: 'Set BOT_RUNNER_URL to your bot runner service URL (e.g., https://your-bot-runner.herokuapp.com)',
        projectId
      });
    }

    // Stop bot
    if (url?.match(/\/api\/projects\/(\d+)\/bot\/stop$/) && method === 'POST') {
      const projectId = parseInt(url.split('/')[3]);
      const BOT_RUNNER_URL = process.env.BOT_RUNNER_URL;
      
      if (BOT_RUNNER_URL) {
        try {
          const response = await fetch(`${BOT_RUNNER_URL}/bot/${projectId}/stop`, {
            method: 'POST'
          });
          
          const result = await response.json();
          
          // Обновляем статус в БД
          await database.query(`
            UPDATE bot_instances 
            SET status = 'stopped', stopped_at = NOW()
            WHERE project_id = $1
          `, [projectId]);
          
          return res.status(200).json(result);
        } catch (error) {
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to communicate with bot runner service'
          });
        }
      }
      
      return res.status(200).json({
        success: true,
        message: 'No bots running in serverless environment',
        projectId
      });
    }

    // Restart bot
    if (url?.match(/\/api\/projects\/(\d+)\/bot\/restart$/) && method === 'POST') {
      const projectId = parseInt(url.split('/')[3]);
      const BOT_RUNNER_URL = process.env.BOT_RUNNER_URL;
      
      if (BOT_RUNNER_URL) {
        try {
          const response = await fetch(`${BOT_RUNNER_URL}/bot/${projectId}/restart`, {
            method: 'POST'
          });
          
          return res.status(200).json(await response.json());
        } catch (error) {
          return res.status(500).json({ 
            success: false, 
            error: 'Failed to communicate with bot runner service'
          });
        }
      }
      
      return res.status(200).json({
        success: false,
        error: 'Bot execution not available in serverless environment',
        projectId
      });
    }

    // ==================== EXPORT ENDPOINTS ====================

    // Export project as Python code
    if (url?.match(/\/api\/projects\/(\d+)\/export$/) && method === 'POST') {
      const projectId = parseInt(url.split('/')[3]);
      const project = await database.query(
        'SELECT * FROM bot_projects WHERE id = $1',
        [projectId]
      );

      if (project.rows.length === 0) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Generate Python code (simplified for Vercel)
      const pythonCode = `# Generated bot code for ${project.rows[0].name}
import telebot
import json
import sqlite3
from datetime import datetime

# Replace with your bot token
bot = telebot.TeleBot('YOUR_BOT_TOKEN_HERE')

# Database setup (if user database is enabled)
def init_db():
    conn = sqlite3.connect('bot_users.db')
    cursor = conn.cursor()
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id INTEGER PRIMARY KEY,
            first_name TEXT,
            last_name TEXT,
            username TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    conn.commit()
    conn.close()

# Initialize database
init_db()

@bot.message_handler(commands=['start'])
def start_message(message):
    user_id = message.from_user.id
    first_name = message.from_user.first_name or ''
    last_name = message.from_user.last_name or ''
    username = message.from_user.username or ''
    
    # Save user to database
    conn = sqlite3.connect('bot_users.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT OR REPLACE INTO users (user_id, first_name, last_name, username)
        VALUES (?, ?, ?, ?)
    ''', (user_id, first_name, last_name, username))
    conn.commit()
    conn.close()
    
    bot.send_message(message.chat.id, f"Привет, {first_name}! Добро пожаловать в бота ${project.rows[0].name}!")

@bot.message_handler(func=lambda message: True)
def handle_all_messages(message):
    bot.send_message(message.chat.id, "Я пока не знаю, как ответить на это сообщение.")

if __name__ == '__main__':
    print(f"Starting bot: ${project.rows[0].name}")
    bot.polling(none_stop=True)
`;

      return res.status(200).json({
        code: pythonCode,
        filename: `${project.rows[0].name.replace(/[^a-zA-Z0-9]/g, '_')}_bot.py`
      });
    }

    // ==================== DATABASE ENDPOINTS ====================

    // Database statistics
    if (url === '/api/database/stats/detailed' && method === 'GET') {
      const projectsResult = await database.query('SELECT COUNT(*) FROM bot_projects');
      const templatesResult = await database.query('SELECT COUNT(*) FROM bot_templates');
      const tokensResult = await database.query('SELECT COUNT(*) FROM bot_tokens');
      const instancesResult = await database.query('SELECT COUNT(*) FROM bot_instances');

      const stats = {
        projects: parseInt(projectsResult.rows[0].count),
        templates: parseInt(templatesResult.rows[0].count),
        tokens: parseInt(tokensResult.rows[0].count),
        instances: parseInt(instancesResult.rows[0].count)
      };
      return res.status(200).json(stats);
    }

    // Database backups (not available in Vercel)
    if (url === '/api/database/backups' && method === 'GET') {
      return res.status(200).json([]);
    }

    // ==================== USER ENDPOINTS ====================

    // Get user projects
    if (url === '/api/user/projects' && method === 'GET') {
      const result = await database.query(`
        SELECT * FROM bot_projects 
        ORDER BY updated_at DESC
      `);
      return res.status(200).json(result.rows);
    }

    // Get user templates
    if (url === '/api/user/templates' && method === 'GET') {
      const result = await database.query(`
        SELECT * FROM bot_templates 
        ORDER BY created_at DESC
      `);
      return res.status(200).json(result.rows);
    }

    // Delete user template
    if (url?.match(/\/api\/user\/templates\/(\d+)$/) && method === 'DELETE') {
      const templateId = parseInt(url.split('/')[4]);
      await database.query('DELETE FROM bot_templates WHERE id = $1', [templateId]);
      return res.status(200).json({ success: true });
    }

    // ==================== MEDIA ENDPOINTS (simplified) ====================

    // Get project media files
    if (url?.match(/\/api\/media\/project\/(\d+)$/) && method === 'GET') {
      const projectId = parseInt(url.split('/')[4]);
      const result = await database.query(`
        SELECT * FROM media_files 
        WHERE project_id = $1 
        ORDER BY created_at DESC
      `, [projectId]);
      return res.status(200).json(result.rows);
    }

    // Media upload (not available in Vercel)
    if (url?.match(/\/api\/media\/upload\/(\d+)$/) && method === 'POST') {
      return res.status(501).json({
        error: 'File upload not available in serverless environment',
        message: 'Please use local development server for file uploads'
      });
    }

    // ==================== MISC ENDPOINTS ====================

    // Get all bot instances
    if (url === '/api/bots' && method === 'GET') {
      const result = await database.query(`
        SELECT bi.*, bp.name as project_name 
        FROM bot_instances bi
        LEFT JOIN bot_projects bp ON bi.project_id = bp.id
        ORDER BY bi.created_at DESC
      `);
      return res.status(200).json(result.rows);
    }

    // Force refresh templates
    if (url === '/api/templates/refresh' && method === 'POST') {
      return res.status(200).json({ success: true, message: 'Templates refreshed' });
    }

    // Default 404
    return res.status(404).json({ error: 'Route not found', url, method });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}