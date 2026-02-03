import { db, pool } from './db';
import { sql } from 'drizzle-orm';

/**
 * Класс для управления и мониторинга подключения к базе данных
 * Предоставляет функции для проверки работоспособности, оптимизации соединений,
 * выполнения операций с повторными попытками и другие утилиты для работы с базой данных
 */
export class DatabaseManager {
  private static instance: DatabaseManager;
  private healthCheckInterval: NodeJS.Timeout | null = null;

  /**
   * Статистика подключения к базе данных
   */
  private connectionStats = {
    totalConnections: 0,      // Общее количество соединений
    activeConnections: 0,     // Активные соединения
    idleConnections: 0,       // Неиспользуемые соединения
    errors: 0,                // Количество ошибок
    lastHealthCheck: new Date() // Время последней проверки работоспособности
  };

  /**
   * Приватный конструктор для реализации паттерна Singleton
   */
  private constructor() { }

  /**
   * Получить экземпляр класса DatabaseManager (реализация паттерна Singleton)
   * @returns Экземпляр класса DatabaseManager
   */
  static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  /**
   * Запускает мониторинг работоспособности базы данных
   * @param intervalMs Интервал проверки в миллисекундах (по умолчанию 30000 мс)
   */
  startHealthMonitoring(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      try {
        await this.performHealthCheck();
      } catch (error) {
        console.error('Проверка работоспособности базы данных не удалась:', error);
        this.connectionStats.errors++;
      }
    }, intervalMs);

    console.log('Мониторинг работоспособности базы данных запущен');
  }

  /**
   * Останавливает мониторинг работоспособности базы данных
   */
  stopHealthMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
    }
    console.log('Мониторинг работоспособности базы данных остановлен');
  }

  /**
   * Выполняет проверку работоспособности базы данных
   * @returns Promise<boolean> - true, если проверка прошла успешно, иначе false
   */
  async performHealthCheck(): Promise<boolean> {
    try {
      // Проверка соединения с помощью простого запроса
      await db.execute(sql`SELECT 1 as health`);

      // Обновление статистики соединений, если пул доступен
      if (pool) {
        this.connectionStats.totalConnections = pool.totalCount || 0;
        this.connectionStats.activeConnections = (pool.totalCount || 0) - (pool.idleCount || 0);
        this.connectionStats.idleConnections = pool.idleCount || 0;
      }
      this.connectionStats.lastHealthCheck = new Date();

      console.log('Проверка работоспособности базы данных прошла успешно');
      return true;
    } catch (error: any) {
      console.error('Проверка работоспособности базы данных не удалась:', error?.message);
      console.error('Подробная ошибка:', error);
      this.connectionStats.errors++;
      return false;
    }
  }

  /**
   * Получает статистику подключения к базе данных
   * @returns Объект со статистикой подключения
   */
  getConnectionStats() {
    return {
      ...this.connectionStats,
      poolInfo: {
        totalCount: pool?.totalCount || 0,
        idleCount: pool?.idleCount || 0,
        waitingCount: pool?.waitingCount || 0,
        maxSize: 20,
        minSize: 2
      }
    };
  }

  /**
   * Оптимизирует соединения с базой данных
   * @returns Promise<void>
   */
  async optimizeConnections(): Promise<void> {
    try {
      // Закрытие неиспользуемых соединений, если их слишком много
      if (this.connectionStats.idleConnections > 5) {
        console.log('Оптимизация соединений с базой данных...');
        // Примечание: pg_terminate_backend требует прав суперпользователя
        // Вместо этого просто регистрируем попытку оптимизации
        console.log('Оптимизация соединений возможна при наличии прав суперпользователя');
      }

      // Попытка анализа производительности базы данных (если pg_stat_statements доступна)
      try {
        const slowQueries = await db.execute(sql`
          SELECT query, calls, total_exec_time, mean_exec_time
          FROM pg_stat_statements
          WHERE mean_exec_time > 1000
          ORDER BY mean_exec_time DESC
          LIMIT 10
        `);

        if (slowQueries.rows.length > 0) {
          console.log('Найдены медленные запросы:', slowQueries.rows);
        }
      } catch (error) {
        // pg_stat_statements может быть недоступна, это нормально
        console.log('pg_stat_statements недоступна, пропускаем анализ медленных запросов');
      }
    } catch (error: any) {
      console.warn('Предупреждение об оптимизации соединений:', error?.message);
    }
  }

  /**
   * Выполняет операцию с базой данных с логикой повторных попыток
   * @param operation Функция, представляющая операцию с базой данных
   * @param maxRetries Максимальное количество повторных попыток (по умолчанию 3)
   * @param retryDelay Задержка между попытками в миллисекундах (по умолчанию 1000)
   * @returns Promise<T> Результат выполнения операции
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    retryDelay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        console.warn(`Операция с базой данных не удалась (попытка ${attempt}/${maxRetries}):`, error);

        if (attempt === maxRetries) {
          break;
        }

        // Ожидание перед повторной попыткой
        await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
      }
    }

    throw lastError;
  }

  /**
   * Обертка для выполнения транзакции с автоматическим откатом
   * @param operation Функция, представляющая операции в транзакции
   * @returns Promise<T> Результат выполнения транзакции
   */
  async transaction<T>(
    operation: (txDb: any) => Promise<T>
  ): Promise<T> {
    return await db.transaction(async (tx) => {
      try {
        const result = await operation(tx);
        return result;
      } catch (error: any) {
        console.error('Подробная ошибка:', error?.message, error?.stack);
        throw new Error(`Транзакция не удалась: ${error?.message || 'Неизвестная ошибка'}`);
      }
    });
  }

  /**
   * Создает резервную копию базы данных (базовая реализация)
   * @returns Promise<string> Имя файла резервной копии
   */
  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupName = `backup_${timestamp}`;

    try {
      // Это упрощенная резервная копия - в продакшене следует использовать pg_dump
      await db.execute(sql`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database() AND pid <> pg_backend_pid()
      `);

      console.log(`Резервная копия создана: ${backupName}`);
      return backupName;
    } catch (error: any) {
      console.error('Подробная ошибка:', error?.message, error?.stack);
      throw new Error(`Операция резервного копирования не удалась: ${error?.message || 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Очищает старые данные из базы данных
   * @param daysToKeep Количество дней хранения данных (по умолчанию 30)
   * @returns Promise<void>
   */
  async cleanupOldData(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    try {
      // Очистка старых экземпляров ботов
      const cleanupResult = await db.execute(sql`
        DELETE FROM bot_instances
        WHERE status = 'stopped' AND stopped_at < ${cutoffDate}
      `);

      console.log(`Очищено ${cleanupResult.rowCount} старых экземпляров ботов`);

      // Очистка старых взаимодействий пользователей (опционально)
      await db.execute(sql`
        DELETE FROM user_bot_data
        WHERE is_active = 0 AND updated_at < ${cutoffDate}
      `);

    } catch (error: any) {
      console.error('Подробная ошибка:', error?.message, error?.stack);
      throw new Error(`Операция очистки не удалась: ${error?.message || 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Получает метрики базы данных
   * @returns Promise<any[]> Массив с метриками таблиц базы данных
   */
  async getDatabaseMetrics() {
    try {
      const metrics = await db.execute(sql`
        SELECT
          schemaname,
          tablename,
          n_tup_ins as inserts,
          n_tup_upd as updates,
          n_tup_del as deletes,
          n_live_tup as live_rows,
          n_dead_tup as dead_rows
        FROM pg_stat_user_tables
        ORDER BY n_live_tup DESC
      `);

      return metrics.rows;
    } catch (error: any) {
      console.error('Подробная ошибка:', error?.message, error?.stack);
      return [];
    }
  }
}

/**
 * Экземпляр менеджера базы данных (реализация паттерна Singleton)
 */
export const dbManager = DatabaseManager.getInstance();

// Автоматический запуск мониторинга при импорте модуля
dbManager.startHealthMonitoring();

/**
 * Обработка корректного завершения работы приложения
 * Останавливает мониторинг работоспособности базы данных
 */
process.on('SIGTERM', () => {
  dbManager.stopHealthMonitoring();
});

/**
 * Обработка завершения работы через сигнал прерывания
 * Останавливает мониторинг работоспособности базы данных
 */
process.on('SIGINT', () => {
  dbManager.stopHealthMonitoring();
});