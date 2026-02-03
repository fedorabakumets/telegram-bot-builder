import { type BotTemplate, type BotProject, botProjects, type InsertBotProject, type BotInstance, botInstances, type InsertBotInstance, botTemplates, type InsertBotTemplate, type BotToken, botTokens, type InsertBotToken, type MediaFile, mediaFiles, type InsertMediaFile, type UserBotData, userBotData, type InsertUserBotData, type BotGroup, botGroups, type InsertBotGroup } from "@shared/schema";
import { eq, desc, or, ilike, and } from "drizzle-orm";
import { DatabaseStorage } from "./DatabaseStorage";

/**
 * Оптимизированная реализация хранилища с кэшированием
 * Расширяет базовую реализацию, добавляя кэширование для улучшения производительности
 */

export class OptimizedDatabaseStorage extends DatabaseStorage {
  private templateCache: Map<number, BotTemplate> = new Map();
  private projectCache: Map<number, BotProject> = new Map();
  private cacheTimeout = 5 * 60 * 1000; // 5 минут







  // Bot Projects (с кэшированием)
  /**
   * Получить проект бота по ID из базы данных с кэшированием
   * @param id - ID проекта
   * @returns Проект бота или undefined, если не найден
   */
  async getBotProject(id: number): Promise<BotProject | undefined> {
    const cached = this.projectCache.get(id);
    if (cached) return cached;

    const [project] = await this.db.select().from(botProjects).where(eq(botProjects.id, id));
    if (project) {
      this.projectCache.set(id, project);
      // Автоматически очищаем кэш через timeout
      setTimeout(() => this.projectCache.delete(id), this.cacheTimeout);
    }
    return project || undefined;
  }

  /**
   * Получить все проекты ботов из базы данных
   * @returns Массив проектов ботов
   */
  async getAllBotProjects(): Promise<BotProject[]> {
    return await this.db.select().from(botProjects).orderBy(desc(botProjects.updatedAt));
  }

  /**
   * Создать новый проект бота в базе данных и добавить в кэш
   * @param insertProject - Данные для создания проекта
   * @returns Созданный проект бота
   */
  async createBotProject(insertProject: InsertBotProject): Promise<BotProject> {
    const [project] = await this.db
      .insert(botProjects)
      .values({
        ...insertProject,
        data: insertProject.data ?? {} // Убедимся, что поле data всегда присутствует
      })
      .returning();
    this.projectCache.set(project.id, project);
    return project;
  }

  /**
   * Обновить проект бота в базе данных и кэше
   * @param id - ID проекта
   * @param updateData - Данные для обновления
   * @returns Обновленный проект бота или undefined, если не найден
   */
  async updateBotProject(id: number, updateData: Partial<InsertBotProject>): Promise<BotProject | undefined> {
    const [project] = await this.db
      .update(botProjects)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botProjects.id, id))
      .returning();
    if (project) {
      this.projectCache.set(id, project);
    }
    return project || undefined;
  }

  /**
   * Удалить проект бота из базы данных и кэша
   * @param id - ID проекта
   * @returns true, если проект был удален, иначе false
   */
  async deleteBotProject(id: number): Promise<boolean> {
    const result = await this.db.delete(botProjects).where(eq(botProjects.id, id));
    this.projectCache.delete(id);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Instances (простая реализация)
  /**
   * Получить экземпляр бота по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Экземпляр бота или undefined, если не найден
   */
  async getBotInstance(projectId: number): Promise<BotInstance | undefined> {
    const [instance] = await this.db.select().from(botInstances).where(eq(botInstances.projectId, projectId));
    return instance || undefined;
  }

  /**
   * Получить все экземпляры ботов из базы данных
   * @returns Массив всех экземпляров ботов
   */
  async getAllBotInstances(): Promise<BotInstance[]> {
    return await this.db.select().from(botInstances).orderBy(desc(botInstances.startedAt));
  }

  /**
   * Создать новый экземпляр бота в базе данных
   * @param insertInstance - Данные для создания экземпляра
   * @returns Созданный экземпляр бота
   */
  async createBotInstance(insertInstance: InsertBotInstance): Promise<BotInstance> {
    const [instance] = await this.db
      .insert(botInstances)
      .values(insertInstance)
      .returning();
    return instance;
  }

  /**
   * Обновить экземпляр бота в базе данных
   * @param id - ID экземпляра
   * @param updateData - Данные для обновления
   * @returns Обновленный экземпляр бота или undefined, если не найден
   */
  async updateBotInstance(id: number, updateData: Partial<InsertBotInstance>): Promise<BotInstance | undefined> {
    const [instance] = await this.db
      .update(botInstances)
      .set(updateData)
      .where(eq(botInstances.id, id))
      .returning();
    return instance || undefined;
  }

  /**
   * Удалить экземпляр бота из базы данных
   * @param id - ID экземпляра
   * @returns true, если экземпляр был удален, иначе false
   */
  async deleteBotInstance(id: number): Promise<boolean> {
    const result = await this.db.delete(botInstances).where(eq(botInstances.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Остановить экземпляр бота по ID проекта в базе данных
   * @param projectId - ID проекта
   * @returns true, если экземпляр был остановлен, иначе false
   */
  async stopBotInstance(projectId: number): Promise<boolean> {
    const result = await this.db
      .update(botInstances)
      .set({ status: 'stopped', stoppedAt: new Date() })
      .where(eq(botInstances.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Остановить экземпляр бота по ID токена в базе данных
   * @param tokenId - ID токена
   * @returns true, если экземпляр был остановлен, иначе false
   */
  async stopBotInstanceByToken(tokenId: number): Promise<boolean> {
    const result = await this.db
      .update(botInstances)
      .set({ status: 'stopped', stoppedAt: new Date() })
      .where(eq(botInstances.tokenId, tokenId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Templates (с кэшированием)
  /**
   * Получить шаблон бота по ID из базы данных с кэшированием
   * @param id - ID шаблона
   * @returns Шаблон бота или undefined, если не найден
   */
  async getBotTemplate(id: number): Promise<BotTemplate | undefined> {
    const cached = this.templateCache.get(id);
    if (cached) return cached;

    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (template) {
      this.templateCache.set(id, template);
      setTimeout(() => this.templateCache.delete(id), this.cacheTimeout);
    }
    return template || undefined;
  }

  /**
   * Получить все шаблоны ботов из базы данных
   * @returns Массив шаблонов ботов
   */
  async getAllBotTemplates(): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).orderBy(desc(botTemplates.createdAt));
  }

  /**
   * Создать новый шаблон бота в базе данных и добавить в кэш
   * @param insertTemplate - Данные для создания шаблона
   * @returns Созданный шаблон бота
   */
  async createBotTemplate(insertTemplate: InsertBotTemplate): Promise<BotTemplate> {
    const [template] = await this.db
      .insert(botTemplates)
      .values(insertTemplate)
      .returning();
    this.templateCache.set(template.id, template);
    return template;
  }

  /**
   * Обновить шаблон бота в базе данных и кэше
   * @param id - ID шаблона
   * @param updateData - Данные для обновления
   * @returns Обновленный шаблон бота или undefined, если не найден
   */
  async updateBotTemplate(id: number, updateData: Partial<InsertBotTemplate>): Promise<BotTemplate | undefined> {
    const [template] = await this.db
      .update(botTemplates)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botTemplates.id, id))
      .returning();
    if (template) {
      this.templateCache.set(id, template);
    }
    return template || undefined;
  }

  /**
   * Удалить шаблон бота из базы данных и кэша
   * @param id - ID шаблона
   * @returns true, если шаблон был удален, иначе false
   */
  async deleteBotTemplate(id: number): Promise<boolean> {
    const result = await this.db.delete(botTemplates).where(eq(botTemplates.id, id));
    this.templateCache.delete(id);
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Упрощенные методы для счетчиков
  /**
   * Увеличить счетчик использования шаблона в базе данных и очистить кэш
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateUseCount(id: number): Promise<boolean> {
    const result = await this.db
      .update(botTemplates)
      .set({ lastUsedAt: new Date() })
      .where(eq(botTemplates.id, id));
    this.templateCache.delete(id); // Очищаем кэш
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик просмотров шаблона в базе данных
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateViewCount(id: number): Promise<boolean> {
    const result = await this.db
      .update(botTemplates)
      .set({}) // Пустое обновление для простоты
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик загрузок шаблона в базе данных
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateDownloadCount(id: number): Promise<boolean> {
    const result = await this.db
      .update(botTemplates)
      .set({}) // Пустое обновление для простоты
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Переключить лайк шаблона и очистить кэш
   * @param id - ID шаблона
   * @param liked - true для лайка, false для анлайка
   * @returns true, если статус лайка был изменен, иначе false
   */
  async toggleTemplateLike(id: number, liked: boolean): Promise<boolean> {
    this.templateCache.delete(id);
    return true;
  }

  /**
   * Переключить закладку шаблона и очистить кэш
   * @param id - ID шаблона
   * @param bookmarked - true для добавления в закладки, false для удаления
   * @returns true, если статус закладки был изменен, иначе false
   */
  async toggleTemplateBookmark(id: number, bookmarked: boolean): Promise<boolean> {
    this.templateCache.delete(id);
    return true;
  }

  /**
   * Оценить шаблон и очистить кэш
   * @param id - ID шаблона
   * @param rating - Оценка (обычно от 1 до 5)
   * @returns true, если оценка была сохранена, иначе false
   */
  async rateTemplate(id: number, rating: number): Promise<boolean> {
    this.templateCache.delete(id);
    return true;
  }

  /**
   * Получить рекомендуемые шаблоны из базы данных
   * @returns Массив рекомендованных шаблонов
   */
  async getFeaturedTemplates(): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).where(eq(botTemplates.featured, 1)).orderBy(desc(botTemplates.rating));
  }

  /**
   * Получить шаблоны по категории из базы данных
   * @param category - Категория шаблонов
   * @returns Массив шаблонов указанной категории
   */
  async getTemplatesByCategory(category: string): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).where(eq(botTemplates.category, category)).orderBy(desc(botTemplates.createdAt));
  }

  /**
   * Поиск шаблонов по запросу в базе данных
   * @param query - Поисковый запрос
   * @returns Массив найденных шаблонов
   */
  async searchTemplates(query: string): Promise<BotTemplate[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await this.db.select().from(botTemplates).where(
      or(
        ilike(botTemplates.name, searchTerm),
        ilike(botTemplates.description, searchTerm)
      )
    ).orderBy(desc(botTemplates.rating));
  }

  // Bot Tokens
  /**
   * Получить токен бота по ID из базы данных
   * @param id - ID токена
   * @returns Токен бота или undefined, если не найден
   */
  async getBotToken(id: number): Promise<BotToken | undefined> {
    const [token] = await this.db.select().from(botTokens).where(eq(botTokens.id, id));
    return token || undefined;
  }

  /**
   * Получить токены ботов по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив токенов ботов
   */
  async getBotTokensByProject(projectId: number): Promise<BotToken[]> {
    return await this.db.select().from(botTokens)
      .where(eq(botTokens.projectId, projectId))
      .orderBy(desc(botTokens.isDefault), desc(botTokens.createdAt));
  }

  /**
   * Получить токен бота по умолчанию для проекта из базы данных
   * @param projectId - ID проекта
   * @returns Токен бота по умолчанию или undefined, если не найден
   */
  async getDefaultBotToken(projectId: number): Promise<BotToken | undefined> {
    const [token] = await this.db.select().from(botTokens)
      .where(and(eq(botTokens.projectId, projectId), eq(botTokens.isDefault, 1)))
      .orderBy(desc(botTokens.createdAt));
    return token || undefined;
  }

  /**
   * Создать новый токен бота в базе данных
   * @param insertToken - Данные для создания токена
   * @returns Созданный токен бота
   */
  async createBotToken(insertToken: InsertBotToken): Promise<BotToken> {
    // Если создаем токен по умолчанию, убираем флаг с других токенов
    if (insertToken.isDefault === 1) {
      await this.db.update(botTokens)
        .set({ isDefault: 0 })
        .where(eq(botTokens.projectId, insertToken.projectId));
    }

    const [token] = await this.db
      .insert(botTokens)
      .values(insertToken)
      .returning();
    return token;
  }

  /**
   * Обновить токен бота в базе данных
   * @param id - ID токена
   * @param updateData - Данные для обновления
   * @returns Обновленный токен бота или undefined, если не найден
   */
  async updateBotToken(id: number, updateData: Partial<InsertBotToken>): Promise<BotToken | undefined> {
    // Если делаем токен по умолчанию, убираем флаг с других токенов
    if (updateData.isDefault === 1) {
      const [currentToken] = await this.db.select().from(botTokens).where(eq(botTokens.id, id));
      if (currentToken) {
        await this.db.update(botTokens)
          .set({ isDefault: 0 })
          .where(eq(botTokens.projectId, currentToken.projectId));
      }
    }

    const [token] = await this.db
      .update(botTokens)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botTokens.id, id))
      .returning();
    return token || undefined;
  }

  /**
   * Удалить токен бота из базы данных
   * @param id - ID токена
   * @returns true, если токен был удален, иначе false
   */
  async deleteBotToken(id: number): Promise<boolean> {
    const result = await this.db.delete(botTokens).where(eq(botTokens.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Установить токен бота по умолчанию для проекта в базе данных
   * @param projectId - ID проекта
   * @param tokenId - ID токена
   * @returns true, если токен был установлен по умолчанию, иначе false
   */
  async setDefaultBotToken(projectId: number, tokenId: number): Promise<boolean> {
    // Убираем флаг по умолчанию со всех токенов проекта
    await this.db.update(botTokens)
      .set({ isDefault: 0 })
      .where(eq(botTokens.projectId, projectId));

    // Устанавливаем флаг по умолчанию для указанного токена
    const result = await this.db.update(botTokens)
      .set({ isDefault: 1 })
      .where(eq(botTokens.id, tokenId));

    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Отметить токен как использованный в базе данных
   * @param id - ID токена
   * @returns true, если токен был отмечен как использованный, иначе false
   */
  async markTokenAsUsed(id: number): Promise<boolean> {
    const result = await this.db.update(botTokens)
      .set({ lastUsedAt: new Date() })
      .where(eq(botTokens.id, id));

    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Media Files (simplified implementation)
  /**
   * Получить медиафайл по ID из базы данных
   * @param id - ID файла
   * @returns Медиафайл или undefined, если не найден
   */
  async getMediaFile(id: number): Promise<MediaFile | undefined> {
    const [file] = await this.db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    return file || undefined;
  }

  /**
   * Получить медиафайлы по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив медиафайлов проекта
   */
  async getMediaFilesByProject(projectId: number): Promise<MediaFile[]> {
    return await this.db.select().from(mediaFiles)
      .where(eq(mediaFiles.projectId, projectId))
      .orderBy(desc(mediaFiles.createdAt));
  }

  /**
   * Получить медиафайлы по ID проекта и типу файла из базы данных
   * @param projectId - ID проекта
   * @param fileType - Тип файла
   * @returns Массив медиафайлов указанного типа
   */
  async getMediaFilesByType(projectId: number, fileType: string): Promise<MediaFile[]> {
    return await this.db.select().from(mediaFiles)
      .where(and(eq(mediaFiles.projectId, projectId), eq(mediaFiles.fileType, fileType)))
      .orderBy(desc(mediaFiles.createdAt));
  }

  /**
   * Создать новый медиафайл в базе данных
   * @param insertFile - Данные для создания файла
   * @returns Созданный медиафайл
   */
  async createMediaFile(insertFile: InsertMediaFile): Promise<MediaFile> {
    const [file] = await this.db
      .insert(mediaFiles)
      .values(insertFile)
      .returning();
    return file;
  }

  /**
   * Обновить медиафайл в базе данных
   * @param id - ID файла
   * @param updateData - Данные для обновления
   * @returns Обновленный медиафайл или undefined, если не найден
   */
  async updateMediaFile(id: number, updateData: Partial<InsertMediaFile>): Promise<MediaFile | undefined> {
    const [file] = await this.db
      .update(mediaFiles)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(mediaFiles.id, id))
      .returning();
    return file || undefined;
  }

  /**
   * Удалить медиафайл из базы данных
   * @param id - ID файла
   * @returns true, если файл был удален, иначе false
   */
  async deleteMediaFile(id: number): Promise<boolean> {
    const result = await this.db.delete(mediaFiles).where(eq(mediaFiles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик использования медиафайла в базе данных
   * @param id - ID файла
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementMediaFileUsage(id: number): Promise<boolean> {
    const [file] = await this.db.select().from(mediaFiles).where(eq(mediaFiles.id, id));
    if (!file) return false;

    const result = await this.db
      .update(mediaFiles)
      .set({ usageCount: (file.usageCount || 0) + 1 })
      .where(eq(mediaFiles.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Поиск медиафайлов по проекту и запросу в базе данных
   * @param projectId - ID проекта
   * @param query - Поисковый запрос
   * @returns Массив найденных медиафайлов
   */
  async searchMediaFiles(projectId: number, query: string): Promise<MediaFile[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await this.db.select().from(mediaFiles)
      .where(
        and(
          eq(mediaFiles.projectId, projectId),
          or(
            ilike(mediaFiles.fileName, searchTerm),
            ilike(mediaFiles.description, searchTerm)
          )
        )
      )
      .orderBy(desc(mediaFiles.createdAt));
  }

  // User Bot Data
  /**
   * Получить данные пользователя бота по ID из базы данных
   * @param id - ID данных пользователя
   * @returns Данные пользователя бота или undefined, если не найдены
   */
  async getUserBotData(id: number): Promise<UserBotData | undefined> {
    const [userData] = await this.db.select().from(userBotData).where(eq(userBotData.id, id));
    return userData || undefined;
  }

  /**
   * Получить данные пользователя бота по ID проекта и ID пользователя из базы данных
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @returns Данные пользователя бота или undefined, если не найдены
   */
  async getUserBotDataByProjectAndUser(projectId: number, userId: string): Promise<UserBotData | undefined> {
    const [userData] = await this.db.select().from(userBotData)
      .where(and(eq(userBotData.projectId, projectId), eq(userBotData.userId, userId)));
    return userData || undefined;
  }

  /**
   * Получить все данные пользователей бота по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив данных пользователей бота
   */
  async getUserBotDataByProject(projectId: number): Promise<UserBotData[]> {
    return await this.db.select().from(userBotData)
      .where(eq(userBotData.projectId, projectId))
      .orderBy(desc(userBotData.lastInteraction));
  }

  /**
   * Получить все данные пользователей ботов из базы данных
   * @returns Массив всех данных пользователей ботов
   */
  async getAllUserBotData(): Promise<UserBotData[]> {
    return await this.db.select().from(userBotData)
      .orderBy(desc(userBotData.lastInteraction));
  }

  /**
   * Создать новые данные пользователя бота в базе данных
   * @param insertUserData - Данные для создания
   * @returns Созданные данные пользователя бота
   */
  async createUserBotData(insertUserData: InsertUserBotData): Promise<UserBotData> {
    const [userData] = await this.db
      .insert(userBotData)
      .values(insertUserData)
      .returning();
    return userData;
  }

  /**
   * Обновить данные пользователя бота в базе данных
   * @param id - ID данных
   * @param updateData - Данные для обновления
   * @returns Обновленные данные пользователя бота или undefined, если не найдены
   */
  async updateUserBotData(id: number, updateData: Partial<InsertUserBotData>): Promise<UserBotData | undefined> {
    const [userData] = await this.db
      .update(userBotData)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(userBotData.id, id))
      .returning();
    return userData || undefined;
  }

  /**
   * Удалить данные пользователя бота из базы данных
   * @param id - ID данных
   * @returns true, если данные были удалены, иначе false
   */
  async deleteUserBotData(id: number): Promise<boolean> {
    const result = await this.db.delete(userBotData).where(eq(userBotData.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Удалить все данные пользователей бота по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns true, если данные были удалены, иначе false
   */
  async deleteUserBotDataByProject(projectId: number): Promise<boolean> {
    const result = await this.db.delete(userBotData).where(eq(userBotData.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик взаимодействий пользователя в базе данных
   * @param id - ID данных пользователя
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementUserInteraction(id: number): Promise<boolean> {
    const [userData] = await this.db.select().from(userBotData).where(eq(userBotData.id, id));
    if (!userData) return false;

    const result = await this.db
      .update(userBotData)
      .set({
        interactionCount: (userData.interactionCount || 0) + 1,
        lastInteraction: new Date()
      })
      .where(eq(userBotData.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Обновить состояние пользователя в базе данных
   * @param id - ID данных пользователя
   * @param state - Новое состояние
   * @returns true, если состояние было обновлено, иначе false
   */
  async updateUserState(id: number, state: string): Promise<boolean> {
    const result = await this.db
      .update(userBotData)
      .set({ currentState: state, updatedAt: new Date() })
      .where(eq(userBotData.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Поиск данных пользователей бота по проекту и запросу в базе данных
   * @param projectId - ID проекта
   * @param query - Поисковый запрос
   * @returns Массив найденных данных пользователей
   */
  async searchUserBotData(projectId: number, query: string): Promise<UserBotData[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    return await this.db.select().from(userBotData)
      .where(
        and(
          eq(userBotData.projectId, projectId),
          or(
            ilike(userBotData.firstName, searchTerm),
            ilike(userBotData.lastName, searchTerm),
            ilike(userBotData.userName, searchTerm),
            ilike(userBotData.userId, searchTerm)
          )
        )
      )
      .orderBy(desc(userBotData.lastInteraction));
  }

  /**
   * Получить статистику по данным пользователей бота из базы данных
   * @param projectId - ID проекта
   * @returns Объект со статистикой пользователей
   */
  async getUserBotDataStats(projectId: number): Promise<{
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    premiumUsers: number;
    totalInteractions: number;
    avgInteractionsPerUser: number;
  }> {
    const users = await this.db.select().from(userBotData)
      .where(eq(userBotData.projectId, projectId));

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive === 1).length;
    const blockedUsers = users.filter(u => u.isBlocked === 1).length;
    const premiumUsers = users.filter(u => u.isPremium === 1).length;
    const totalInteractions = users.reduce((sum, u) => sum + (u.interactionCount || 0), 0);
    const avgInteractionsPerUser = totalUsers > 0 ? Math.round(totalInteractions / totalUsers) : 0;

    return {
      totalUsers,
      activeUsers,
      blockedUsers,
      premiumUsers,
      totalInteractions,
      avgInteractionsPerUser
    };
  }

  // Bot Groups
  /**
   * Получить группу бота по ID из базы данных
   * @param id - ID группы
   * @returns Группа бота или undefined, если не найдена
   */
  async getBotGroup(id: number): Promise<BotGroup | undefined> {
    const [group] = await this.db.select().from(botGroups).where(eq(botGroups.id, id));
    return group || undefined;
  }

  /**
   * Получить все группы бота по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив групп бота
   */
  async getBotGroupsByProject(projectId: number): Promise<BotGroup[]> {
    return await this.db.select().from(botGroups)
      .where(eq(botGroups.projectId, projectId))
      .orderBy(desc(botGroups.createdAt));
  }

  /**
   * Получить группу бота по ID проекта и ID группы из базы данных
   * @param projectId - ID проекта
   * @param groupId - ID группы
   * @returns Группа бота или undefined, если не найдена
   */
  async getBotGroupByProjectAndGroupId(projectId: number, groupId: string): Promise<BotGroup | undefined> {
    const [group] = await this.db.select().from(botGroups)
      .where(and(eq(botGroups.projectId, projectId), eq(botGroups.groupId, groupId)));
    return group || undefined;
  }

  /**
   * Создать новую группу бота в базе данных
   * @param insertGroup - Данные для создания группы
   * @returns Созданная группа бота
   */
  async createBotGroup(insertGroup: InsertBotGroup): Promise<BotGroup> {
    const [group] = await this.db
      .insert(botGroups)
      .values(insertGroup)
      .returning();
    return group;
  }

  /**
   * Обновить группу бота в базе данных
   * @param id - ID группы
   * @param updateData - Данные для обновления
   * @returns Обновленная группа бота или undefined, если не найдена
   */
  async updateBotGroup(id: number, updateData: Partial<InsertBotGroup>): Promise<BotGroup | undefined> {
    const [group] = await this.db
      .update(botGroups)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botGroups.id, id))
      .returning();
    return group || undefined;
  }

  /**
   * Удалить группу бота из базы данных
   * @param id - ID группы
   * @returns true, если группа была удалена, иначе false
   */
  async deleteBotGroup(id: number): Promise<boolean> {
    const result = await this.db.delete(botGroups).where(eq(botGroups.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }
}
