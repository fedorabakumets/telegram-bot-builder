import { db } from './db';
import { pool } from './db';
import { sql } from 'drizzle-orm';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { botProjects, botInstances, botTemplates, botTokens, mediaFiles, userBotData } from '@shared/schema';

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

export class DatabaseBackup {
  private static instance: DatabaseBackup;
  private backupDir = './backups';

  private constructor() {}

  static getInstance(): DatabaseBackup {
    if (!DatabaseBackup.instance) {
      DatabaseBackup.instance = new DatabaseBackup();
    }
    return DatabaseBackup.instance;
  }

  // Создать полный дамп базы данных
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

      console.log(`Backup created successfully: ${filepath}`);
      return filepath;
    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  // Восстановить базу данных из файла
  async restoreFromBackup(filepath: string, options?: {
    clearExisting?: boolean;
    skipTables?: string[];
    onlyTables?: string[];
  }): Promise<void> {
    try {
      if (!existsSync(filepath)) {
        throw new Error(`Backup file not found: ${filepath}`);
      }

      const backupData: BackupData = JSON.parse(readFileSync(filepath, 'utf-8'));
      
      // Валидация структуры файла
      if (!backupData.metadata || !backupData.data) {
        throw new Error('Invalid backup file structure');
      }

      console.log(`Restoring backup from ${backupData.metadata.timestamp}`);
      console.log(`Description: ${backupData.metadata.description}`);

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
          console.log(`Skipping ${tableName} - no data`);
          continue;
        }

        await this.restoreTable(tableName, tableData);
        console.log(`Restored ${tableData.length} records to ${tableName}`);
      }

      console.log('Database restore completed successfully');
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }

  // Восстановить конкретную таблицу
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
          console.warn(`Unknown table: ${tableName}`);
      }
    } catch (error) {
      console.error(`Failed to restore table ${tableName}:`, error);
      throw error;
    }
  }

  // Очистить все таблицы
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
        console.log(`Cleared table: ${tableName}`);
      } catch (error) {
        console.error(`Failed to clear table ${tableName}:`, error);
      }
    }
  }

  // Получить список доступных резервных копий
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
          } catch (error) {
            console.warn(`Failed to read metadata from ${file}:`, error);
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
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  // Удалить резервную копию
  async deleteBackup(filename: string): Promise<void> {
    try {
      const filepath = join(this.backupDir, filename);
      if (!existsSync(filepath)) {
        throw new Error(`Backup file not found: ${filename}`);
      }

      const fs = await import('fs');
      fs.unlinkSync(filepath);
      console.log(`Deleted backup: ${filename}`);
    } catch (error) {
      console.error('Failed to delete backup:', error);
      throw error;
    }
  }

  // Получить статистику базы данных
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
    } catch (error) {
      console.error('Failed to get database stats:', error);
      throw error;
    }
  }
}

// Экспорт singleton instance
export const dbBackup = DatabaseBackup.getInstance();