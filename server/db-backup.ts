/**
 * @fileoverview Модуль для создания и восстановления резервных копий базы данных
 *
 * Этот файл предоставляет классы и функции для создания полных резервных копий
 * базы данных, восстановления из резервных копий и управления файлами резервных копий.
 */

import { db } from './db';
import { sql } from 'drizzle-orm';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { botProjects, botInstances, botTemplates, botTokens, mediaFiles, userBotData } from '@shared/schema';

/**
 * Интерфейс для данных резервной копии
 */
interface BackupData {
  metadata: {
    version: string;
    timestamp: string;
    description?: string;
    tables: string[];
  };
  data: {
    botProjects: any[];
    botInstances: any[];
    botTemplates: any[];
    botTokens: any[];
    mediaFiles: any[];
    userBotData: any[];
  };
}

/**
 * Класс для управления резервными копиями базы данных
 * Предоставляет методы для создания, восстановления и управления резервными копиями
 */
export class DatabaseBackup {
  private static instance: DatabaseBackup;

  /**
   * Директория для хранения резервных копий
   */
  private backupDir = './backups';

  /**
   * Приватный конструктор для реализации паттерна Singleton
   */
  private constructor() {}

  /**
   * Получить экземпляр класса DatabaseBackup (реализация паттерна Singleton)
   * @returns Экземпляр класса DatabaseBackup
   */
  static getInstance(): DatabaseBackup {
    if (!DatabaseBackup.instance) {
      DatabaseBackup.instance = new DatabaseBackup();
    }
    return DatabaseBackup.instance;
  }

  /**
   * Создает полный дамп базы данных
   * @param description Описание резервной копии (опционально)
   * @returns Путь к файлу резервной копии
   */
  async createFullBackup(description?: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup_${timestamp}.json`;
      const filepath = join(this.backupDir, filename);

      // Создать директорию для резервных копий если не существует
      const fs = await import('fs');
      if (!fs.existsSync(this.backupDir)) {
        fs.mkdirSync(this.backupDir, { recursive: true });
      }

      // Получить все данные из таблиц
      const [
        projectsData,
        instancesData,
        templatesData,
        tokensData,
        mediaData,
        userBotDataResult
      ] = await Promise.all([
        db.select().from(botProjects),
        db.select().from(botInstances),
        db.select().from(botTemplates),
        db.select().from(botTokens),
        db.select().from(mediaFiles),
        db.select().from(userBotData)
      ]);

      const backupData: BackupData = {
        metadata: {
          version: '1.0.0',
          timestamp: new Date().toISOString(),
          description: description || 'Полный дамп базы данных',
          tables: ['botProjects', 'botInstances', 'botTemplates', 'botTokens', 'mediaFiles', 'userBotData']
        },
        data: {
          botProjects: projectsData,
          botInstances: instancesData,
          botTemplates: templatesData,
          botTokens: tokensData,
          mediaFiles: mediaData,
          userBotData: userBotDataResult
        }
      };

      // Сохранить в файл
      writeFileSync(filepath, JSON.stringify(backupData, null, 2), 'utf-8');

      console.log(`Резервная копия создана успешно: ${filepath}`);
      return filepath;
    } catch (error: any) {
      console.error('Подробная ошибка:', error?.message, error?.stack);
      throw new Error(`Операция резервного копирования не удалась: ${error?.message || 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Восстанавливает базу данных из файла резервной копии
   * @param filepath Путь к файлу резервной копии
   * @param options Дополнительные опции восстановления
   * @returns Promise<void>
   */
  async restoreFromBackup(filepath: string, options?: {
    clearExisting?: boolean;
    skipTables?: string[];
    onlyTables?: string[];
  }): Promise<void> {
    try {
      if (!existsSync(filepath)) {
        throw new Error(`Файл резервной копии не найден: ${filepath}`);
      }

      const backupData: BackupData = JSON.parse(readFileSync(filepath, 'utf-8'));

      // Валидация структуры файла
      if (!backupData.metadata || !backupData.data) {
        throw new Error('Неверная структура файла резервной копии');
      }

      console.log(`Восстановление резервной копии из ${backupData.metadata.timestamp}`);
      console.log(`Описание: ${backupData.metadata.description}`);

      // Очистить существующие данные если указано
      if (options?.clearExisting) {
        await this.clearAllTables(options.skipTables);
      }

      // Определить какие таблицы восстанавливать
      const tablesToRestore = options?.onlyTables || backupData.metadata.tables;

      // Восстановить данные в правильном порядке (чтобы избежать проблем с внешними ключами)
      const restoreOrder = [
        'botProjects',
        'botTemplates',
        'botTokens',
        'mediaFiles',
        'botInstances',
        'userBotData'
      ];

      for (const tableName of restoreOrder) {
        if (!tablesToRestore.includes(tableName)) continue;
        if (options?.skipTables?.includes(tableName)) continue;

        const tableData = backupData.data[tableName as keyof typeof backupData.data];
        if (!tableData || !Array.isArray(tableData) || tableData.length === 0) {
          console.log(`Пропуск ${tableName} - нет данных`);
          continue;
        }

        await this.restoreTable(tableName, tableData);
        console.log(`Восстановлено ${tableData.length} записей в ${tableName}`);
      }

      console.log('Восстановление базы данных завершено успешно');
    } catch (error: any) {
      console.error('Подробная ошибка:', error?.message, error?.stack);
      throw new Error(`Операция восстановления не удалась: ${error?.message || 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Восстанавливает конкретную таблицу из резервной копии
   * @param tableName Имя таблицы для восстановления
   * @param data Данные для вставки в таблицу
   * @returns Promise<void>
   */
  private async restoreTable(tableName: string, data: any[]): Promise<void> {
    try {
      switch (tableName) {
        case 'botProjects':
          if (data.length > 0) {
            await db.insert(botProjects).values(data).onConflictDoNothing();
          }
          break;
        case 'botInstances':
          if (data.length > 0) {
            await db.insert(botInstances).values(data).onConflictDoNothing();
          }
          break;
        case 'botTemplates':
          if (data.length > 0) {
            await db.insert(botTemplates).values(data).onConflictDoNothing();
          }
          break;
        case 'botTokens':
          if (data.length > 0) {
            await db.insert(botTokens).values(data).onConflictDoNothing();
          }
          break;
        case 'mediaFiles':
          if (data.length > 0) {
            await db.insert(mediaFiles).values(data).onConflictDoNothing();
          }
          break;
        case 'userBotData':
          if (data.length > 0) {
            await db.insert(userBotData).values(data).onConflictDoNothing();
          }
          break;
        default:
          console.warn(`Неизвестная таблица: ${tableName}`);
      }
    } catch (error: any) {
      console.error('Подробная ошибка:', error?.message, error?.stack);
      throw new Error(`Не удалось восстановить таблицу ${tableName}: ${error?.message || 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Очищает все таблицы базы данных
   * @param skipTables Массив имен таблиц, которые нужно пропустить при очистке
   * @returns Promise<void>
   */
  private async clearAllTables(skipTables?: string[]): Promise<void> {
    const tablesToClear = [
      'userBotData',
      'botInstances',
      'mediaFiles',
      'botTokens',
      'botTemplates',
      'botProjects'
    ];

    for (const tableName of tablesToClear) {
      if (skipTables?.includes(tableName)) continue;

      try {
        switch (tableName) {
          case 'botProjects':
            await db.delete(botProjects);
            break;
          case 'botInstances':
            await db.delete(botInstances);
            break;
          case 'botTemplates':
            await db.delete(botTemplates);
            break;
          case 'botTokens':
            await db.delete(botTokens);
            break;
          case 'mediaFiles':
            await db.delete(mediaFiles);
            break;
          case 'userBotData':
            await db.delete(userBotData);
            break;
        }
        console.log(`Очищена таблица: ${tableName}`);
      } catch (error: any) {
        console.error('Подробная ошибка:', error?.message, error?.stack);
      }
    }
  }

  /**
   * Получает список доступных резервных копий
   * @returns Массив объектов с информацией о резервных копиях
   */
  async listBackups(): Promise<Array<{
    filename: string;
    filepath: string;
    size: number;
    created: Date;
    metadata?: BackupData['metadata'];
  }>> {
    try {
      const fs = await import('fs');
      if (!fs.existsSync(this.backupDir)) {
        return [];
      }

      const files = fs.readdirSync(this.backupDir)
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const filepath = join(this.backupDir, file);
          const stats = fs.statSync(filepath);

          let metadata: BackupData['metadata'] | undefined;
          try {
            const backupData: BackupData = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
            metadata = backupData.metadata;
          } catch (error: any) {
            console.warn(`Не удалось прочитать метаданные из ${file}: ${error?.message}`);
          }

          return {
            filename: file,
            filepath,
            size: stats.size,
            created: stats.birthtime,
            metadata
          };
        })
        .sort((a, b) => b.created.getTime() - a.created.getTime());

      return files;
    } catch (error: any) {
      console.error('Подробная ошибка:', error?.message, error?.stack);
      return [];
    }
  }

  /**
   * Удаляет файл резервной копии
   * @param filename Имя файла резервной копии для удаления
   * @returns Promise<void>
   */
  async deleteBackup(filename: string): Promise<void> {
    try {
      const filepath = join(this.backupDir, filename);
      if (!existsSync(filepath)) {
        throw new Error(`Файл резервной копии не найден: ${filename}`);
      }

      const fs = await import('fs');
      fs.unlinkSync(filepath);
      console.log(`Удалена резервная копия: ${filename}`);
    } catch (error: any) {
      console.error('Подробная ошибка:', error?.message, error?.stack);
      throw new Error(`Не удалось удалить резервную копию: ${error?.message || 'Неизвестная ошибка'}`);
    }
  }

  /**
   * Получает статистику базы данных
   * @returns Объект со статистикой таблиц базы данных
   */
  async getDatabaseStats(): Promise<{
    tables: Array<{
      name: string;
      count: number;
      size: string;
    }>;
    totalRecords: number;
    estimatedSize: string;
  }> {
    try {
      const [
        projectsCount,
        instancesCount,
        templatesCount,
        tokensCount,
        mediaCount,
        userDataCount
      ] = await Promise.all([
        db.execute(sql`SELECT COUNT(*) as count FROM bot_projects`),
        db.execute(sql`SELECT COUNT(*) as count FROM bot_instances`),
        db.execute(sql`SELECT COUNT(*) as count FROM bot_templates`),
        db.execute(sql`SELECT COUNT(*) as count FROM bot_tokens`),
        db.execute(sql`SELECT COUNT(*) as count FROM media_files`),
        db.execute(sql`SELECT COUNT(*) as count FROM user_bot_data`)
      ]);

      const tables = [
        {
          name: 'botProjects',
          count: Number(projectsCount.rows[0]?.count || 0),
          size: 'N/A'
        },
        {
          name: 'botInstances',
          count: Number(instancesCount.rows[0]?.count || 0),
          size: 'N/A'
        },
        {
          name: 'botTemplates',
          count: Number(templatesCount.rows[0]?.count || 0),
          size: 'N/A'
        },
        {
          name: 'botTokens',
          count: Number(tokensCount.rows[0]?.count || 0),
          size: 'N/A'
        },
        {
          name: 'mediaFiles',
          count: Number(mediaCount.rows[0]?.count || 0),
          size: 'N/A'
        },
        {
          name: 'userBotData',
          count: Number(userDataCount.rows[0]?.count || 0),
          size: 'N/A'
        }
      ];

      const totalRecords = tables.reduce((sum, table) => sum + table.count, 0);

      return {
        tables,
        totalRecords,
        estimatedSize: 'N/A'
      };
    } catch (error: any) {
      console.error('Подробная ошибка:', error?.message, error?.stack);
      throw new Error(`Не удалось получить статистику базы данных: ${error?.message || 'Неизвестная ошибка'}`);
    }
  }
}

/**
 * Экземпляр класса DatabaseBackup (реализация паттерна Singleton)
 */
export const dbBackup = DatabaseBackup.getInstance();