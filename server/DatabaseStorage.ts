import { type BotProject, botProjects, type InsertBotProject, type BotInstance, botInstances, type InsertBotInstance, type BotTemplate, botTemplates, type InsertBotTemplate, type BotToken, botTokens, type InsertBotToken, type TelegramUserDB, telegramUsers, type InsertTelegramUser, type MediaFile, mediaFiles, type InsertMediaFile, type UserBotData, userBotData, type InsertUserBotData, type BotUser, botUsers, type BotGroup, botGroups, type InsertBotGroup, type GroupMember, groupMembers, type InsertGroupMember, type InsertBotMessage, type BotMessage, botMessages, type InsertBotMessageMedia, type BotMessageMedia, botMessageMedia } from "@shared/schema";
import { eq, desc, or, ilike, and, isNull, sql, asc } from "drizzle-orm";
import { db } from "./db";
import { IStorage } from "./storage";

/**
 * Реализация хранилища данных с использованием базы данных
 * Предоставляет методы для работы с проектами, шаблонами, токенами и другими данными в базе данных
 */

export class DatabaseStorage implements IStorage {
  protected db = db;

  // Bot Projects
  /**
   * Получить проект бота по ID из базы данных
   * @param id - ID проекта
   * @returns Проект бота или undefined, если не найден
   */
  async getBotProject(id: number): Promise<BotProject | undefined> {
    const [project] = await this.db.select().from(botProjects).where(eq(botProjects.id, id));
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
   * Создать новый проект бота в базе данных
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
    return project;
  }

  /**
   * Обновить проект бота в базе данных
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
    return project || undefined;
  }

  /**
   * Удалить проект бота из базы данных
   * @param id - ID проекта
   * @returns true, если проект был удален, иначе false
   */
  async deleteBotProject(id: number): Promise<boolean> {
    const result = await this.db.delete(botProjects).where(eq(botProjects.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot Instances
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
   * Получить экземпляр бота по ID токена из базы данных
   * @param tokenId - ID токена
   * @returns Экземпляр бота или undefined, если не найден
   */
  async getBotInstanceByToken(tokenId: number): Promise<BotInstance | undefined> {
    const [instance] = await this.db.select().from(botInstances).where(eq(botInstances.tokenId, tokenId));
    return instance || undefined;
  }

  /**
   * Получить все экземпляры ботов по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив экземпляров ботов
   */
  async getBotInstancesByProject(projectId: number): Promise<BotInstance[]> {
    return await this.db.select().from(botInstances).where(eq(botInstances.projectId, projectId));
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

  // Bot Templates
  /**
   * Получить шаблон бота по ID из базы данных
   * @param id - ID шаблона
   * @returns Шаблон бота или undefined, если не найден
   */
  async getBotTemplate(id: number): Promise<BotTemplate | undefined> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
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
   * Создать новый шаблон бота в базе данных
   * @param insertTemplate - Данные для создания шаблона
   * @returns Созданный шаблон бота
   */
  async createBotTemplate(insertTemplate: InsertBotTemplate): Promise<BotTemplate> {
    const [template] = await this.db
      .insert(botTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  /**
   * Обновить шаблон бота в базе данных
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
    return template || undefined;
  }

  /**
   * Удалить шаблон бота из базы данных
   * @param id - ID шаблона
   * @returns true, если шаблон был удален, иначе false
   */
  async deleteBotTemplate(id: number): Promise<boolean> {
    const result = await this.db.delete(botTemplates).where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик использования шаблона в базе данных
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateUseCount(id: number): Promise<boolean> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;

    const result = await this.db
      .update(botTemplates)
      .set({
        useCount: (template.useCount || 0) + 1,
        lastUsedAt: new Date()
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик просмотров шаблона в базе данных
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateViewCount(id: number): Promise<boolean> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;

    const result = await this.db
      .update(botTemplates)
      .set({
        viewCount: (template.viewCount || 0) + 1
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик загрузок шаблона в базе данных
   * @param id - ID шаблона
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementTemplateDownloadCount(id: number): Promise<boolean> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;

    const result = await this.db
      .update(botTemplates)
      .set({
        downloadCount: (template.downloadCount || 0) + 1
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Переключить лайк шаблона в базе данных
   * @param id - ID шаблона
   * @param liked - true для лайка, false для анлайка
   * @returns true, если статус лайка был изменен, иначе false
   */
  async toggleTemplateLike(id: number, liked: boolean): Promise<boolean> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;

    const current = template.likeCount || 0;
    const newCount = liked ? current + 1 : Math.max(0, current - 1);

    const result = await this.db
      .update(botTemplates)
      .set({
        likeCount: newCount
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Переключить закладку шаблона в базе данных
   * @param id - ID шаблона
   * @param bookmarked - true для добавления в закладки, false для удаления
   * @returns true, если статус закладки был изменен, иначе false
   */
  async toggleTemplateBookmark(id: number, bookmarked: boolean): Promise<boolean> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;

    const current = template.bookmarkCount || 0;
    const newCount = bookmarked ? current + 1 : Math.max(0, current - 1);

    const result = await this.db
      .update(botTemplates)
      .set({
        bookmarkCount: newCount
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Оценить шаблон в базе данных
   * @param id - ID шаблона
   * @param rating - Оценка (обычно от 1 до 5)
   * @returns true, если оценка была сохранена, иначе false
   */
  async rateTemplate(id: number, rating: number): Promise<boolean> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    if (!template) return false;

    const currentRating = template.rating || 0;
    const currentRatingCount = template.ratingCount || 0;
    const newRatingCount = currentRatingCount + 1;
    const newRating = Math.round(((currentRating * currentRatingCount) + rating) / newRatingCount);

    const result = await this.db
      .update(botTemplates)
      .set({
        rating: newRating,
        ratingCount: newRatingCount,
        updatedAt: new Date()
      })
      .where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
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
    await this.db.update(botTokens)
      .set({ isDefault: 0 })
      .where(eq(botTokens.projectId, projectId));

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

  // User-specific methods (DbStorage)
  /**
   * Получить проекты ботов пользователя из базы данных
   * @param ownerId - ID владельца
   * @returns Массив проектов ботов пользователя
   */
  async getUserBotProjects(ownerId: number): Promise<BotProject[]> {
    return await this.db.select().from(botProjects)
      .where(eq(botProjects.ownerId, ownerId))
      .orderBy(desc(botProjects.createdAt));
  }

  /**
   * Получить гостевые проекты ботов (без владельца) из базы данных
   * @returns Массив гостевых проектов ботов
   */
  async getGuestBotProjects(): Promise<BotProject[]> {
    return await this.db.select().from(botProjects)
      .where(isNull(botProjects.ownerId))
      .orderBy(desc(botProjects.createdAt));
  }

  /**
   * Получить токены ботов пользователя из базы данных
   * @param ownerId - ID владельца
   * @param projectId - Опциональный ID проекта для фильтрации
   * @returns Массив токенов ботов пользователя
   */
  async getUserBotTokens(ownerId: number, projectId?: number): Promise<BotToken[]> {
    let query = this.db.select().from(botTokens)
      .innerJoin(botProjects, eq(botTokens.projectId, botProjects.id))
      .where(eq(botProjects.ownerId, ownerId)) as any;

    if (projectId) {
      query = query.where(eq(botTokens.projectId, projectId));
    }

    const results = await query.orderBy(desc(botTokens.createdAt));
    return results.map((r: any) => r.bot_tokens);
  }

  /**
   * Получить шаблоны ботов пользователя из базы данных
   * @param ownerId - ID владельца
   * @returns Массив шаблонов ботов пользователя
   */
  async getUserBotTemplates(ownerId: number): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates)
      .where(eq(botTemplates.ownerId, ownerId))
      .orderBy(desc(botTemplates.createdAt));
  }

  // Telegram Users
  /**
   * Получить пользователя Telegram по ID из базы данных
   * @param id - ID пользователя
   * @returns Пользователь Telegram или undefined, если не найден
   */
  async getTelegramUser(id: number): Promise<TelegramUserDB | undefined> {
    const [user] = await this.db.select().from(telegramUsers).where(eq(telegramUsers.id, id));
    return user || undefined;
  }

  /**
   * Получить пользователя Telegram или создать нового в базе данных
   * @param userData - Данные пользователя для создания
   * @returns Пользователь Telegram
   */
  async getTelegramUserOrCreate(userData: InsertTelegramUser): Promise<TelegramUserDB> {
    // Попробуем найти существующего пользователя
    const existingUser = await this.getTelegramUser(userData.id);

    if (existingUser) {
      // Обновляем информацию о пользователе
      const [updated] = await this.db.update(telegramUsers)
        .set({
          firstName: userData.firstName,
          lastName: userData.lastName ?? null,
          username: userData.username ?? null,
          photoUrl: userData.photoUrl ?? null,
          authDate: userData.authDate ?? null,
          updatedAt: new Date(),
        })
        .where(eq(telegramUsers.id, userData.id))
        .returning();
      return updated;
    }

    // Создаём нового пользователя
    const [newUser] = await this.db.insert(telegramUsers)
      .values({
        id: userData.id,
        firstName: userData.firstName,
        lastName: userData.lastName ?? null,
        username: userData.username ?? null,
        photoUrl: userData.photoUrl ?? null,
        authDate: userData.authDate ?? null,
      })
      .returning();
    return newUser;
  }

  /**
   * Удалить пользователя Telegram из базы данных
   * @param id - ID пользователя
   * @returns true, если пользователь был удален, иначе false
   */
  async deleteTelegramUser(id: number): Promise<boolean> {
    const result = await this.db.delete(telegramUsers).where(eq(telegramUsers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Media Files
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
      .set({
        usageCount: (file.usageCount || 0) + 1,
        updatedAt: new Date()
      })
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
      .orderBy(desc(mediaFiles.usageCount), desc(mediaFiles.createdAt));
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
    return await this.db.select().from(userBotData).orderBy(desc(userBotData.lastInteraction));
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
        lastInteraction: new Date(),
        updatedAt: new Date()
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
      .set({
        currentState: state,
        updatedAt: new Date()
      })
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
            ilike(userBotData.userName, searchTerm),
            ilike(userBotData.firstName, searchTerm),
            ilike(userBotData.lastName, searchTerm),
            ilike(userBotData.notes, searchTerm)
          )
        )
      )
      .orderBy(desc(userBotData.lastInteraction));
  }

  /**
   * Поиск пользователей ботов по запросу в базе данных
   * @param query - Поисковый запрос
   * @returns Массив найденных пользователей ботов
   */
  async searchBotUsers(query: string): Promise<BotUser[]> {
    // Убираем @ символ если есть
    const cleanQuery = query.startsWith('@') ? query.slice(1) : query;
    const searchTerm = `%${cleanQuery.toLowerCase()}%`;
    const numericQuery = parseInt(cleanQuery);

    return await this.db.select().from(botUsers)
      .where(
        or(
          ilike(botUsers.username, searchTerm),
          ilike(botUsers.firstName, searchTerm),
          ilike(botUsers.lastName, searchTerm),
          isNaN(numericQuery) ? sql`false` : eq(botUsers.userId, numericQuery)
        )
      )
      .orderBy(desc(botUsers.lastInteraction));
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
    const users = await this.db.select().from(userBotData).where(eq(userBotData.projectId, projectId));

    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive === 1).length;
    const blockedUsers = users.filter(u => u.isBlocked === 1).length;
    const premiumUsers = users.filter(u => u.isPremium === 1).length;
    const totalInteractions = users.reduce((sum, u) => sum + (u.interactionCount || 0), 0);
    const avgInteractionsPerUser = totalUsers > 0 ? totalInteractions / totalUsers : 0;

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

  // Group members
  /**
   * Получить участников группы из базы данных
   * @param groupId - ID группы
   * @returns Массив участников группы
   */
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return await this.db.select().from(groupMembers)
      .where(eq(groupMembers.groupId, groupId))
      .orderBy(desc(groupMembers.joinedAt));
  }

  /**
   * Создать нового участника группы в базе данных
   * @param insertMember - Данные для создания участника
   * @returns Созданный участник группы
   */
  async createGroupMember(insertMember: InsertGroupMember): Promise<GroupMember> {
    const [member] = await this.db
      .insert(groupMembers)
      .values(insertMember)
      .returning();
    return member;
  }

  /**
   * Обновить участника группы в базе данных
   * @param id - ID участника
   * @param updateData - Данные для обновления
   * @returns Обновленный участник группы или undefined, если не найден
   */
  async updateGroupMember(id: number, updateData: Partial<InsertGroupMember>): Promise<GroupMember | undefined> {
    const [member] = await this.db
      .update(groupMembers)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(groupMembers.id, id))
      .returning();
    return member || undefined;
  }

  /**
   * Удалить участника группы из базы данных
   * @param id - ID участника
   * @returns true, если участник был удален, иначе false
   */
  async deleteGroupMember(id: number): Promise<boolean> {
    const result = await this.db.delete(groupMembers).where(eq(groupMembers.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot messages
  /**
   * Создать новое сообщение бота в базе данных
   * @param insertMessage - Данные для создания сообщения
   * @returns Созданное сообщение бота
   */
  async createBotMessage(insertMessage: InsertBotMessage): Promise<BotMessage> {
    const [message] = await this.db
      .insert(botMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  /**
   * Получить сообщения бота по проекту и пользователю из базы данных
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @param limit - Ограничение количества сообщений (по умолчанию 100)
   * @returns Массив сообщений бота
   */
  async getBotMessages(projectId: number, userId: string, limit: number = 100): Promise<BotMessage[]> {
    return await this.db
      .select()
      .from(botMessages)
      .where(and(
        eq(botMessages.projectId, projectId),
        eq(botMessages.userId, userId)
      ))
      .orderBy(asc(botMessages.createdAt))
      .limit(limit);
  }

  /**
   * Удалить сообщения бота по проекту и пользователю из базы данных
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @returns true, если сообщения были удалены, иначе false
   */
  async deleteBotMessages(projectId: number, userId: string): Promise<boolean> {
    const result = await this.db
      .delete(botMessages)
      .where(and(
        eq(botMessages.projectId, projectId),
        eq(botMessages.userId, userId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Удалить все сообщения бота по проекту из базы данных
   * @param projectId - ID проекта
   * @returns true, если сообщения были удалены, иначе false
   */
  async deleteAllBotMessages(projectId: number): Promise<boolean> {
    const result = await this.db
      .delete(botMessages)
      .where(eq(botMessages.projectId, projectId));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot message media
  /**
   * Создать запись о медиафайле в сообщении бота в базе данных
   * @param data - Данные для создания записи
   * @returns Созданная запись о медиафайле
   */
  async createBotMessageMedia(data: InsertBotMessageMedia): Promise<BotMessageMedia> {
    const [media] = await this.db
      .insert(botMessageMedia)
      .values(data)
      .returning();
    return media;
  }

  /**
   * Получить медиафайлы сообщения из базы данных
   * @param messageId - ID сообщения
   * @returns Массив медиафайлов сообщения
   */
  async getMessageMedia(messageId: number): Promise<Array<MediaFile & { mediaKind: string; orderIndex: number; }>> {
    const result = await this.db
      .select({
        id: mediaFiles.id,
        projectId: mediaFiles.projectId,
        fileName: mediaFiles.fileName,
        fileType: mediaFiles.fileType,
        filePath: mediaFiles.filePath,
        fileSize: mediaFiles.fileSize,
        mimeType: mediaFiles.mimeType,
        url: mediaFiles.url,
        description: mediaFiles.description,
        tags: mediaFiles.tags,
        isPublic: mediaFiles.isPublic,
        usageCount: mediaFiles.usageCount,
        createdAt: mediaFiles.createdAt,
        updatedAt: mediaFiles.updatedAt,
        mediaKind: botMessageMedia.mediaKind,
        orderIndex: sql<number> `COALESCE(${botMessageMedia.orderIndex}, 0)`.as('orderIndex'),
      })
      .from(botMessageMedia)
      .innerJoin(mediaFiles, eq(botMessageMedia.mediaFileId, mediaFiles.id))
      .where(eq(botMessageMedia.messageId, messageId))
      .orderBy(asc(botMessageMedia.orderIndex));

    return result;
  }

  /**
   * Получить сообщения бота с медиа по проекту и пользователю из базы данных
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @param limit - Ограничение количества сообщений (по умолчанию 100)
   * @returns Массив сообщений бота с медиафайлами
   */
  async getBotMessagesWithMedia(
    projectId: number,
    userId: string,
    limit: number = 100
  ): Promise<(BotMessage & { media?: Array<MediaFile & { mediaKind: string; orderIndex: number; }> | undefined; })[]> {
    const messages = await this.db
      .select()
      .from(botMessages)
      .where(and(
        eq(botMessages.projectId, projectId),
        eq(botMessages.userId, userId)
      ))
      .orderBy(asc(botMessages.createdAt))
      .limit(limit);

    const messagesWithMedia = await Promise.all(
      messages.map(async (message) => {
        const media = await this.getMessageMedia(message.id);
        return {
          ...message,
          media: media.length > 0 ? media : undefined,
        };
      })
    );

    return messagesWithMedia;
  }

  /**
   * Импортировать проекты из файлов в директории bots/
   * @returns Массив импортированных проектов
   */
  async importProjectsFromFiles(): Promise<BotProject[]> {
    // TODO: Реализовать импорт проектов из файлов в директории bots/
    // Этот метод должен читать файлы проектов из директории bots/ и сохранять их в базе данных
    // Пока что возвращаем пустой массив
    return [];
  }
}
