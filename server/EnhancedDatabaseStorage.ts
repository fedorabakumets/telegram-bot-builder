import { type BotProject, type BotTemplate, type InsertBotProject, type InsertBotTemplate, type BotToken, type BotGroup, botGroups, type InsertBotGroup, type BotMessage, type MediaFile, botMessages, mediaFiles, botMessageMedia, type TelegramUserDB, telegramUsers, type InsertTelegramUser } from "@shared/schema";
import { eq, desc, and, asc } from "drizzle-orm";
import { cachedOps } from "./db-cache";
import { dbManager } from "./db-utils";
import { DatabaseStorage } from "./DatabaseStorage";

/**
 * Расширенная реализация хранилища с кэшированием и мониторингом
 * Добавляет возможности кэширования, повторных попыток и транзакций
 */

export class EnhancedDatabaseStorage extends DatabaseStorage {
  // Override methods to add caching and monitoring
  /**
   * Получить проект бота по ID с использованием кэширования
   * @param id - ID проекта
   * @returns Проект бота или undefined, если не найден
   */
  async getBotProject(id: number): Promise<BotProject | undefined> {
    return await cachedOps.getProjectCached(id, () => super.getBotProject(id));
  }

  async getBotTemplate(id: number): Promise<BotTemplate | undefined> {
    return await cachedOps.getTemplateCached(id, () => super.getBotTemplate(id));
  }

  async getTemplatesByCategory(category: string): Promise<BotTemplate[]> {
    return await cachedOps.getTemplateListCached(category, () => super.getTemplatesByCategory(category));
  }

  async createBotProject(insertProject: InsertBotProject): Promise<BotProject> {
    return await dbManager.executeWithRetry(async () => {
      const project = await super.createBotProject(insertProject);
      cachedOps.invalidateProject(project.id);
      return project;
    });
  }

  async updateBotProject(id: number, updateData: Partial<InsertBotProject>): Promise<BotProject | undefined> {
    return await dbManager.executeWithRetry(async () => {
      const project = await super.updateBotProject(id, updateData);
      cachedOps.invalidateProject(id);
      return project;
    });
  }

  async createBotTemplate(insertTemplate: InsertBotTemplate): Promise<BotTemplate> {
    return await dbManager.executeWithRetry(async () => {
      const template = await super.createBotTemplate(insertTemplate);
      cachedOps.invalidateAllTemplates();
      return template;
    });
  }

  async getUserBotProjects(ownerId: number): Promise<BotProject[]> {
    return await super.getUserBotProjects(ownerId);
  }

  async getUserBotTokens(ownerId: number, projectId?: number): Promise<BotToken[]> {
    return await super.getUserBotTokens(ownerId, projectId);
  }

  async getUserBotTemplates(ownerId: number): Promise<BotTemplate[]> {
    return await super.getUserBotTemplates(ownerId);
  }

  async updateBotTemplate(id: number, updateData: Partial<InsertBotTemplate>): Promise<BotTemplate | undefined> {
    return await dbManager.executeWithRetry(async () => {
      const template = await super.updateBotTemplate(id, updateData);
      cachedOps.invalidateTemplate(id);
      return template;
    });
  }

  // Transaction support for complex operations
  async createProjectWithTemplate(projectData: InsertBotProject, templateData: InsertBotTemplate): Promise<{ project: BotProject; template: BotTemplate; }> {
    return await dbManager.transaction(async (tx) => {
      const project = await super.createBotProject(projectData);
      const template = await super.createBotTemplate({ ...templateData, authorId: project.id.toString() });

      cachedOps.invalidateProject(project.id);
      cachedOps.invalidateAllTemplates();

      return { project, template };
    });
  }

  // Bulk operations with better performance
  async bulkCreateTemplates(templates: InsertBotTemplate[]): Promise<BotTemplate[]> {
    return await dbManager.executeWithRetry(async () => {
      const results = await Promise.all(
        templates.map(template => super.createBotTemplate(template))
      );
      cachedOps.invalidateAllTemplates();
      return results;
    });
  }

  // Enhanced statistics with caching
  async getDetailedStats(): Promise<{
    projects: number;
    templates: number;
    activeInstances: number;
    totalUsers: number;
    systemHealth: any;
    cacheStats: any;
  }> {
    const [projects, templates, instances, users] = await Promise.all([
      this.getAllBotProjects(),
      this.getAllBotTemplates(),
      this.getAllBotInstances(),
      this.getAllUserBotData()
    ]);

    return {
      projects: projects.length,
      templates: templates.length,
      activeInstances: instances.filter(i => i.status === 'running').length,
      totalUsers: users.length,
      systemHealth: dbManager.getConnectionStats(),
      cacheStats: cachedOps.getStats()
    };
  }

  // Database maintenance operations
  async performMaintenance(): Promise<void> {
    console.log('Starting database maintenance...');

    // Optimize connections
    await dbManager.optimizeConnections();

    // Clean up old data (older than 30 days)
    await dbManager.cleanupOldData(30);

    // Clear expired cache entries
    cachedOps.cleanup();

    console.log('Database maintenance completed');
  }

  // Backup operations
  async createBackup(): Promise<string> {
    return await dbManager.createBackup();
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    return await dbManager.performHealthCheck();
  }

  // Bot groups methods - use parent implementation directly
  async getBotGroup(id: number): Promise<BotGroup | undefined> {
    const [group] = await this.db.select().from(botGroups).where(eq(botGroups.id, id));
    return group || undefined;
  }

  async getBotGroupsByProject(projectId: number): Promise<BotGroup[]> {
    return await this.db.select().from(botGroups)
      .where(eq(botGroups.projectId, projectId))
      .orderBy(desc(botGroups.createdAt));
  }

  async getBotGroupByProjectAndGroupId(projectId: number, groupId: string): Promise<BotGroup | undefined> {
    const [group] = await this.db.select().from(botGroups)
      .where(and(eq(botGroups.projectId, projectId), eq(botGroups.groupId, groupId)));
    return group || undefined;
  }

  async createBotGroup(group: InsertBotGroup): Promise<BotGroup> {
    const [newGroup] = await this.db
      .insert(botGroups)
      .values(group)
      .returning();
    return newGroup;
  }

  async updateBotGroup(id: number, group: Partial<InsertBotGroup>): Promise<BotGroup | undefined> {
    const [updatedGroup] = await this.db
      .update(botGroups)
      .set({ ...group, updatedAt: new Date() })
      .where(eq(botGroups.id, id))
      .returning();
    return updatedGroup || undefined;
  }

  async deleteBotGroup(id: number): Promise<boolean> {
    const result = await this.db.delete(botGroups).where(eq(botGroups.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getBotMessagesWithMedia(
    projectId: number,
    userId: string,
    limit: number = 100
  ): Promise<(BotMessage & { media?: Array<MediaFile & { mediaKind: string; orderIndex: number; }>; })[]> {
    const results = await this.db
      .select({
        message: botMessages,
        mediaFile: mediaFiles,
        mediaKind: botMessageMedia.mediaKind,
        orderIndex: botMessageMedia.orderIndex,
      })
      .from(botMessages)
      .leftJoin(botMessageMedia, eq(botMessages.id, botMessageMedia.messageId))
      .leftJoin(mediaFiles, eq(botMessageMedia.mediaFileId, mediaFiles.id))
      .where(and(
        eq(botMessages.projectId, projectId),
        eq(botMessages.userId, userId)
      ))
      .orderBy(asc(botMessages.createdAt), asc(botMessageMedia.orderIndex))
      .limit(limit * 10);

    const messagesMap = new Map<number, BotMessage & { media?: Array<MediaFile & { mediaKind: string; orderIndex: number; }>; }>();

    for (const row of results) {
      const messageId = row.message.id;

      if (!messagesMap.has(messageId)) {
        messagesMap.set(messageId, {
          ...row.message,
          media: []
        });
      }

      if (row.mediaFile && row.mediaKind !== null && row.orderIndex !== null) {
        const message = messagesMap.get(messageId)!;
        message.media!.push({
          ...row.mediaFile,
          mediaKind: row.mediaKind,
          orderIndex: row.orderIndex
        });
      }
    }

    const messagesArray = Array.from(messagesMap.values())
      .slice(0, limit)
      .map(msg => ({
        ...msg,
        media: msg.media && msg.media.length > 0 ? msg.media : undefined
      }));

    return messagesArray;
  }

  // Telegram users
  async getTelegramUser(id: number): Promise<TelegramUserDB | undefined> {
    const [user] = await this.db.select().from(telegramUsers).where(eq(telegramUsers.id, id));
    return user || undefined;
  }

  async getTelegramUserOrCreate(userData: InsertTelegramUser): Promise<TelegramUserDB> {
    // Проверяем есть ли пользователь
    const existing = await this.getTelegramUser(userData.id);
    if (existing) {
      // Обновляем если нужно
      const [updated] = await this.db
        .update(telegramUsers)
        .set({
          ...userData,
          updatedAt: new Date()
        })
        .where(eq(telegramUsers.id, userData.id))
        .returning();
      return updated;
    }

    // Создаем нового пользователя
    const [newUser] = await this.db
      .insert(telegramUsers)
      .values(userData)
      .returning();
    return newUser;
  }

  async deleteTelegramUser(id: number): Promise<boolean> {
    const result = await this.db
      .delete(telegramUsers)
      .where(eq(telegramUsers.id, id));
    return true;
  }
}
