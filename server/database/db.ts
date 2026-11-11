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
import { installPoolAcquireDiagnostics } from './pool-diagnostics';
import { createPoolRecovery, probePool } from './pool-recovery';
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
  nodeEnv: process.env.NODE_ENV,
  sslEnabled: process.env.NODE_ENV === 'production' && process.env.PGSSLMODE !== 'disable'
});

/**
 * Выбирает имя процесса для поиска соединений в pg_stat_activity.
 * Явное PGAPPNAME имеет приоритет; неизвестные точки входа получают общее имя.
 * @returns Имя API, исполнителя или вспомогательного процесса
 */
function resolvePoolApplicationName(): string {
  const explicitName = process.env.PGAPPNAME?.trim();
  if (explicitName) return explicitName;
  const entry = (process.argv[1] || '').replace(/\\/g, '/');
  if (/(?:^|\/)server\/runner\/index\.[cm]?[jt]s$/.test(entry)
    || /(?:^|\/)dist-runner\/runner\.cjs$/.test(entry)) return 'botcraft-runtime';
  if (/(?:^|\/)server\/index\.[cm]?[jt]s$/.test(entry)) return 'botcraft-api';
  return 'botcraft-process';
}

/**
 * Конфигурация пула соединений с базой данных
 * Настроена для оптимальной работы в среде Railway с учетом ограничений на количество соединений
 */
const poolConfig = {
  connectionString: process.env.DATABASE_URL,
  /** Имя службы позволяет отличить API и исполнителя в статистике PostgreSQL. */
  application_name: resolvePoolApplicationName(),
  // Принудительно UTC для всех сессий пула. Без этого сессия наследует пояс
  // сервера PostgreSQL (например Europe/Moscow), и now() в колонках
  // `timestamp without time zone` пишется как локальное настенное время,
  // а приложение читает его как UTC → сдвиг на величину пояса. UTC выравнивает
  // запись и чтение, чтобы временные метки во всём приложении были корректными.
  options: '-c timezone=UTC',
  max: 10, // Уменьшено с 20 до предотвращения превышения лимитов на соединения
  min: 1,  // Уменьшено с 2 до экономии ресурсов
  idleTimeoutMillis: 30000, // Закрытие неиспользуемых соединений после 30 секунд
  connectionTimeoutMillis: 20000, // Увеличен таймаут до 20 секунд
  ssl: process.env.NODE_ENV === 'production' && process.env.PGSSLMODE !== 'disable' && !process.env.DATABASE_URL?.includes('localhost') ? {
    rejectUnauthorized: false,
    require: true
  } : false
};

/**
 * Создание экземпляра пула соединений с PostgreSQL
 */
export const pool = new Pool(poolConfig);
installPoolAcquireDiagnostics(pool);
/** Единичная проверка восстановления объединяет одновременные ошибки пула. */
const recovery = createPoolRecovery(pool, active => { globalThis.__dbPoolActive = active; });

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
    recovery.schedule();
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
    await probePool(pool);
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
const initialProbe = setTimeout(testConnection, 2000);
initialProbe.unref();

/**
 * Закрывает пул соединений с БД.
 * Вызывается из graceful-shutdown ПОСЛЕ записи маркеров в БД.
 * Повторный вызов ничего не делает: pg-pool бросает исключение на второй `end()`.
 */
export function closeDbPool(): void {
  globalThis.__dbPoolActive = false;
  if (poolClosed) return;
  poolClosed = true;
  clearTimeout(initialProbe);
  recovery.stop();
  pool.end().catch((error) => console.error('Ошибка закрытия пула БД:', error));
}

/** Пул уже закрыт через closeDbPool (`__dbPoolActive` для этого не годится: он сбрасывается и при обрыве соединения) */
let poolClosed = false;
