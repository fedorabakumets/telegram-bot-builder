/**
 * @fileoverview Конфигурация подключения к базе данных PostgreSQL
 *
 * Этот файл настраивает подключение к базе данных PostgreSQL с использованием пула соединений
 * и интеграции с Drizzle ORM. Он также включает обработку ошибок, тестирование подключения
 * и корректное завершение соединений при остановке приложения.
 */

// Расширяем глобальный объект для определения __dbPoolActive
declare global {
  var __dbPoolActive: boolean;
}

import dotenv from 'dotenv';
dotenv.config({ debug: false });

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";

/**
 * Проверка наличия переменной DATABASE_URL
 * Если переменная не установлена, выбрасывается ошибка
 */
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

console.log('🔍 Конфигурация базы данных:', {
  url: process.env.DATABASE_URL?.substring(0, 30) + '...',
  nodeEnv: process.env.NODE_ENV,
  sslEnabled: process.env.NODE_ENV === 'production' && process.env.PGSSLMODE !== 'disable'
});

/**
 * Конфигурация пула соединений с базой данных
 * Настроена для оптимальной работы в среде Railway с учетом ограничений на количество соединений
 */
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  max: 10, // Уменьшено с 20 до предотвращения превышения лимитов на соединения
  min: 1,  // Уменьшено с 2 до экономии ресурсов
  idleTimeoutMillis: 30000, // Закрытие неиспользуемых соединений после 30 секунд
  connectionTimeoutMillis: 20000, // Увеличен таймаут до 20 секунд
  acquireTimeoutMillis: 60000, // Таймаут получения соединения после 60 секунд
  ssl: process.env.NODE_ENV === 'production' && process.env.PGSSLMODE !== 'disable' && !process.env.DATABASE_URL?.includes('localhost') ? {
    rejectUnauthorized: false,
    require: true
  } : false
};

/**
 * Создание экземпляра пула соединений с PostgreSQL
 */
export const pool = new Pool(poolConfig);

/**
 * Обработка ошибок пула соединений
 * Логирует неожиданные ошибки на неиспользуемых клиентах
 */
pool.on('error', (err: Error) => {
  console.error('❌ Неожиданная ошибка на неиспользуемом клиенте:', err.message);
  console.error('Детали ошибки:', {
    code: (err as any).code,
    errno: (err as any).errno,
    syscall: (err as any).syscall
  });
  
  // Помечаем пул как неактивный при ошибке соединения
  if (err.message.includes('Connection terminated') || 
      err.message.includes('ECONNRESET') || 
      err.message.includes('ETIMEDOUT')) {
    console.log('⚠️ Соединение с БД прервано. Помечаем пул как неактивный.');
    globalThis.__dbPoolActive = false;
    
    // Пытаемся восстановить соединение через 5 секунд
    setTimeout(async () => {
      console.log('🔄 Попытка восстановления соединения с БД...');
      try {
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        globalThis.__dbPoolActive = true;
        console.log('✅ Соединение с БД восстановлено');
      } catch (error: any) {
        console.error('❌ Не удалось восстановить соединение:', error.message);
        globalThis.__dbPoolActive = false;
      }
    }, 5000);
  }
});

/**
 * Событие подключения к базе данных
 * Вызывается при успешном подключении клиента к базе данных
 */
pool.on('connect', (_client) => {
  // console.log('✅ Connected to database');
});

/**
 * Событие получения соединения из пула
 * Вызывается при получении соединения из пула
 */
pool.on('acquire', () => {
  // console.log('🔗 Database connection acquired');
});

/**
 * Событие удаления соединения из пула
 * Вызывается при удалении соединения из пула
 */
pool.on('remove', () => {
  // console.log('🔌 Database connection removed');
});

/**
 * Устанавливаем начальное состояние пула
 * Глобальная переменная для отслеживания состояния пула соединений
 */
globalThis.__dbPoolActive = true;

/**
 * Создание экземпляра Drizzle ORM с подключением к пулу
 * Интеграция с общей схемой данных
 */
export const db = drizzle(pool, { schema });

/**
 * Тестирование подключения к базе данных при запуске
 * Выполняет простой SQL-запрос для проверки работоспособности соединения
 */
async function testConnection() {
  try {
    // console.log('🧪 Тестирование подключения к базе данных...');
    const client = await pool.connect();
    // console.log('✅ Тест подключения к базе данных прошел успешно:', {
    //   time: result.rows[0].current_time,
    //   version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    // });
    client.release();
  } catch (error: any) {
    // console.error('❌ Тест подключения к базе данных не удался:', error.message);
    // console.error('Детали подключения:', {
    //   code: (error as any).code,
    //   errno: (error as any).errno,
    //   syscall: (error as any).syscall,
    //   hostname: (error as any).hostname,
    //   port: (error as any).port
    // });

    // Не выбрасываем ошибку здесь, позволяем приложению продолжить работу
    // Проверки работоспособности будут выявлять постоянные проблемы
  }
}

// Тестирование подключения после небольшой задержки для завершения запуска
setTimeout(testConnection, 2000);

/**
 * Закрывает пул соединений с БД.
 * Вызывается из graceful-shutdown ПОСЛЕ записи маркеров в БД.
 */
export function closeDbPool(): void {
  globalThis.__dbPoolActive = false;
  pool.end();
}
