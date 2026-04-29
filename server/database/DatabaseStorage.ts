/**
 * @fileoverview Базовая реализация storage поверх Drizzle для серверной части конструктора
 */

import { type BotGroup, botGroups, type BotInstance, botInstances, type BotMessage, type BotMessageMedia, botMessageMedia, botMessages, type BotProject, botProjects, type BotTemplate, botTemplates, type BotToken, botTokens, type BotUser, botUsers, type GroupMember, groupMembers, type MediaFile, mediaFiles, type TelegramUserDB, telegramUsers, type UserBotData, userBotData, botLogs, type BotLog, botLaunchHistory, type BotLaunchHistory, projectCollaborators, type ProjectCollaborator } from "@shared/schema";
import { and, asc, desc, eq, ilike, inArray, isNull, notInArray, or, sql } from "drizzle-orm";
import { IStorage } from "../storages/storage";
import type { StorageBotGroupInput, StorageBotGroupUpdate, StorageBotInstanceInput, StorageBotInstanceUpdate, StorageBotLaunchHistoryInput, StorageBotLaunchHistoryUpdate, StorageBotLogInput, StorageBotMessageInput, StorageBotMessageMediaInput, StorageBotProjectInput, StorageBotProjectUpdate, StorageBotTemplateInput, StorageBotTemplateUpdate, StorageBotTokenInput, StorageBotTokenUpdate, StorageGroupMemberInput, StorageGroupMemberUpdate, StorageMediaFileInput, StorageMediaFileUpdate, StorageTelegramUserInput, StorageUserBotDataInput, StorageUserBotDataUpdate } from "../storages/storageTypes";
import { db } from "./db";

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
    return await this.db.select().from(botProjects).orderBy(asc(botProjects.sortOrder), desc(botProjects.updatedAt));
  }

  /**
   * Создать новый проект бота в базе данных
   * @param insertProject - Данные для создания проекта
   * @returns Созданный проект бота
   */
  async createBotProject(insertProject: StorageBotProjectInput): Promise<BotProject> {
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
  async updateBotProject(id: number, updateData: StorageBotProjectUpdate): Promise<BotProject | undefined> {
    const { restartOnUpdate: _restartOnUpdate, ...projectUpdate } = updateData;
    const [project] = await this.db
      .update(botProjects)
      .set({ ...projectUpdate, updatedAt: new Date() })
      .where(eq(botProjects.id, id))
      .returning();
    return project || undefined;
  }
  async reorderBotProjects(projectIds: number[]): Promise<void> {
    await Promise.all(
      projectIds.map((id, index) =>
        this.db.update(botProjects).set({ sortOrder: index }).where(eq(botProjects.id, id))
      )
    );
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
  async createBotInstance(insertInstance: StorageBotInstanceInput): Promise<BotInstance> {
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
  async updateBotInstance(id: number, updateData: StorageBotInstanceUpdate): Promise<BotInstance | undefined> {
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
   * Получить сценарий бота по ID из базы данных
   * @param id - ID сценария
   * @returns Сценарий бота или undefined, если не найден
   */
  async getBotTemplate(id: number): Promise<BotTemplate | undefined> {
    const [template] = await this.db.select().from(botTemplates).where(eq(botTemplates.id, id));
    return template || undefined;
  }

  /**
   * Получить все сценарии ботов из базы данных
   * @returns Массив сценариев ботов
   */
  async getAllBotTemplates(): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).orderBy(desc(botTemplates.createdAt));
  }

  /**
   * Создать новый сценарий бота в базе данных
   * @param insertTemplate - Данные для создания сценария
   * @returns Созданный сценарий бота
   */
  async createBotTemplate(insertTemplate: StorageBotTemplateInput): Promise<BotTemplate> {
    const [template] = await this.db
      .insert(botTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  /**
   * Обновить сценарий бота в базе данных
   * @param id - ID сценария
   * @param updateData - Данные для обновления
   * @returns Обновленный сценарий бота или undefined, если не найден
   */
  async updateBotTemplate(id: number, updateData: StorageBotTemplateUpdate): Promise<BotTemplate | undefined> {
    const [template] = await this.db
      .update(botTemplates)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(botTemplates.id, id))
      .returning();
    return template || undefined;
  }

  /**
   * Удалить сценарий бота из базы данных
   * @param id - ID сценария
   * @returns true, если сценарий был удален, иначе false
   */
  async deleteBotTemplate(id: number): Promise<boolean> {
    const result = await this.db.delete(botTemplates).where(eq(botTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Увеличить счетчик использования сценария в базе данных
   * @param id - ID сценария
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
   * Увеличить счетчик просмотров сценария в базе данных
   * @param id - ID сценария
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
   * Увеличить счетчик загрузок сценария в базе данных
   * @param id - ID сценария
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
   * Переключить лайк сценария в базе данных
   * @param id - ID сценария
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
   * Переключить закладку сценария в базе данных
   * @param id - ID сценария
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
   * Оценить сценарий в базе данных
   * @param id - ID сценария
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
   * Получить рекомендуемые сценарии из базы данных
   * @returns Массив рекомендованных сценариев
   */
  async getFeaturedTemplates(): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).where(eq(botTemplates.featured, 1)).orderBy(desc(botTemplates.rating));
  }

  /**
   * Получить сценарии по категории из базы данных
   * @param category - Категория сценариев
   * @returns Массив сценариев указанной категории
   */
  async getTemplatesByCategory(category: string): Promise<BotTemplate[]> {
    return await this.db.select().from(botTemplates).where(eq(botTemplates.category, category)).orderBy(desc(botTemplates.createdAt));
  }

  /**
   * Поиск сценариев по запросу в базе данных
   * @param query - Поисковый запрос
   * @returns Массив найденных сценариев
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
    if (token) return token;
    // Fallback: берём любой токен проекта если нет дефолтного
    const [anyToken] = await this.db.select().from(botTokens)
      .where(eq(botTokens.projectId, projectId))
      .orderBy(desc(botTokens.createdAt));
    return anyToken || undefined;
  }

  /**
   * Создать новый токен бота в базе данных
   * @param insertToken - Данные для создания токена
   * @returns Созданный токен бота
   */
  async createBotToken(insertToken: StorageBotTokenInput): Promise<BotToken> {
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
  async updateBotToken(id: number, updateData: StorageBotTokenUpdate): Promise<BotToken | undefined> {
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
   * Получить проекты ботов пользователя: где он владелец или коллаборатор
   * @param ownerId - ID пользователя
   * @returns Массив проектов ботов пользователя (владелец + коллаборатор)
   */
  async getUserBotProjects(ownerId: number): Promise<BotProject[]> {
    const collaboratorProjects = this.db
      .select({ projectId: projectCollaborators.projectId })
      .from(projectCollaborators)
      .where(eq(projectCollaborators.userId, ownerId));

    // Сначала проверяем коллабораторов отдельно для диагностики
    // const collabRows = await this.db
    //   .select({ projectId: projectCollaborators.projectId })
    //   .from(projectCollaborators)
    //   .where(eq(projectCollaborators.userId, ownerId));
    // console.log(`[getUserBotProjects] ownerId=${ownerId} typeof=${typeof ownerId} collabRows=${JSON.stringify(collabRows)}`);

    const result = await this.db.select().from(botProjects)
      .where(or(
        eq(botProjects.ownerId, ownerId),
        inArray(botProjects.id, collaboratorProjects)
      ))
      .orderBy(desc(botProjects.createdAt));
    // console.log(`[getUserBotProjects] result.length=${result.length} ids=${result.map(p => p.id)}`);
    return result;
  }

  /**
   * Получить гостевые проекты ботов (без владельца) из базы данных
   * @returns Массив гостевых проектов ботов (только с sessionId = NULL)
   */
  async getGuestBotProjects(): Promise<BotProject[]> {
    return await this.db.select().from(botProjects)
      .where(and(isNull(botProjects.ownerId), isNull(botProjects.sessionId)))
      .orderBy(desc(botProjects.createdAt));
  }

  /**
   * Получить все гостевые проекты (owner_id IS NULL) независимо от sessionId.
   * Используется для публичного доступа — например из Telegram-бота.
   * @returns Массив всех гостевых проектов
   */
  async getAllGuestBotProjects(): Promise<BotProject[]> {
    return await this.db.select().from(botProjects)
      .where(isNull(botProjects.ownerId))
      .orderBy(desc(botProjects.createdAt));
  }

  /**
   * Получить гостевые проекты по ID сессии
   * Возвращает проекты конкретной сессии + старые общие (sessionId = NULL)
   * @param sessionId - ID сессии гостевого пользователя
   * @returns Массив гостевых проектов доступных для данной сессии
   */
  async getGuestBotProjectsBySession(sessionId: string): Promise<BotProject[]> {
    return await this.db.select().from(botProjects)
      .where(and(
        isNull(botProjects.ownerId),
        or(eq(botProjects.sessionId, sessionId), isNull(botProjects.sessionId))
      ))
      .orderBy(desc(botProjects.createdAt));
  }

  /**
   * Переносит гостевые проекты сессии к авторизованному пользователю
   * @param sessionId - ID сессии гостя
   * @param ownerId - ID нового владельца
   */
  async migrateGuestProjects(sessionId: string, ownerId: number): Promise<void> {
    await this.db.update(botProjects)
      .set({ ownerId, sessionId: null })
      .where(and(eq(botProjects.sessionId, sessionId), isNull(botProjects.ownerId)));
  }

  /**
   * Переносит ВСЕ гостевые проекты (owner_id IS NULL) к пользователю.
   * Используется в dev-режиме для восстановления проектов после перезапуска сервера.
   * @param ownerId - ID нового владельца
   */
  async migrateAllGuestProjects(ownerId: number): Promise<void> {
    await this.db.update(botProjects)
      .set({ ownerId, sessionId: null })
      .where(isNull(botProjects.ownerId));
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
   * Получить сценарии ботов пользователя из базы данных
   * @param ownerId - ID владельца
   * @returns Массив сценариев ботов пользователя
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
  async getTelegramUserOrCreate(userData: StorageTelegramUserInput): Promise<TelegramUserDB> {
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
  async createMediaFile(insertFile: StorageMediaFileInput): Promise<MediaFile> {
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
  async updateMediaFile(id: number, updateData: StorageMediaFileUpdate): Promise<MediaFile | undefined> {
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
  async getUserBotDataByProjectAndUser(
    projectId: number,
    userId: string,
    tokenId?: number | null
  ): Promise<UserBotData | undefined> {
    const conditions = [
      eq(userBotData.projectId, projectId),
      eq(userBotData.userId, userId),
    ];

    if (tokenId !== null && tokenId !== undefined) {
      conditions.push(eq(userBotData.tokenId, tokenId));
    }

    const [userData] = await this.db.select().from(userBotData)
      .where(and(...conditions));
    return userData || undefined;
  }

  /**
   * Получить все данные пользователей бота по ID проекта из базы данных
   * @param projectId - ID проекта
   * @returns Массив данных пользователей бота
   */
  async getUserBotDataByProject(projectId: number, tokenId?: number | null): Promise<UserBotData[]> {
    const conditions = [eq(userBotData.projectId, projectId)];

    if (tokenId !== null && tokenId !== undefined) {
      conditions.push(eq(userBotData.tokenId, tokenId));
    }

    return await this.db.select().from(userBotData)
      .where(and(...conditions))
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
  async createUserBotData(insertUserData: StorageUserBotDataInput): Promise<UserBotData> {
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
  async updateUserBotData(id: number, updateData: StorageUserBotDataUpdate): Promise<UserBotData | undefined> {
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
  async deleteUserBotDataByProject(projectId: number, tokenId?: number | null): Promise<boolean> {
    const conditions = [eq(userBotData.projectId, projectId)];

    if (tokenId !== null && tokenId !== undefined) {
      conditions.push(eq(userBotData.tokenId, tokenId));
    }

    const result = await this.db.delete(userBotData).where(and(...conditions));
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
   * Увеличить счетчик взаимодействий пользователя бота (bot_users)
   * @param userId - ID пользователя в Telegram
   * @param projectId - ID проекта
   * @param tokenId - ID токена бота
   * @returns true, если счетчик был увеличен, иначе false
   */
  async incrementBotUserInteraction(
    userId: number,
    projectId: number,
    tokenId: number
  ): Promise<boolean> {
    const conditions = [
      eq(botUsers.userId, userId),
      eq(botUsers.projectId, projectId),
      eq(botUsers.tokenId, tokenId),
    ];

    const [user] = await this.db.select().from(botUsers).where(and(...conditions));
    if (!user) return false;

    const result = await this.db
      .update(botUsers)
      .set({
        interactionCount: (user.interactionCount || 0) + 1,
        lastInteraction: new Date(),
      })
      .where(and(...conditions));
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
  async searchUserBotData(projectId: number, query: string, tokenId?: number | null): Promise<UserBotData[]> {
    const searchTerm = `%${query.toLowerCase()}%`;
    const conditions = [
      eq(userBotData.projectId, projectId),
      or(
        ilike(userBotData.userName, searchTerm),
        ilike(userBotData.firstName, searchTerm),
        ilike(userBotData.lastName, searchTerm),
        ilike(userBotData.notes, searchTerm)
      ),
    ];

    if (tokenId !== null && tokenId !== undefined) {
      conditions.push(eq(userBotData.tokenId, tokenId));
    }

    return await this.db.select().from(userBotData)
      .where(and(...conditions))
      .orderBy(desc(userBotData.lastInteraction));
  }

  /**
   * Поиск пользователей ботов по запросу в базе данных
   * @param query - Поисковый запрос
   * @returns Массив найденных пользователей ботов
   */
  async searchBotUsers(query: string, projectId?: number): Promise<BotUser[]> {
    // Убираем @ символ если есть
    const cleanQuery = query.startsWith('@') ? query.slice(1) : query;
    const searchTerm = `%${cleanQuery.toLowerCase()}%`;
    const numericQuery = parseInt(cleanQuery);

    const conditions = [
      or(
        ilike(botUsers.username, searchTerm),
        ilike(botUsers.firstName, searchTerm),
        ilike(botUsers.lastName, searchTerm),
        isNaN(numericQuery) ? sql`false` : eq(botUsers.userId, numericQuery)
      )
    ];

    if (projectId !== undefined) {
      conditions.push(eq(botUsers.projectId, projectId));
    }

    return await this.db.select().from(botUsers)
      .where(and(...conditions))
      .orderBy(desc(botUsers.lastInteraction));
  }

  /**
   * Получить статистику по данным пользователей бота из базы данных
   * @param projectId - ID проекта
   * @returns Объект со статистикой пользователей
   */
  async getUserBotDataStats(projectId: number, tokenId?: number | null): Promise<{
    totalUsers: number;
    activeUsers: number;
    blockedUsers: number;
    premiumUsers: number;
    totalInteractions: number;
    avgInteractionsPerUser: number;
  }> {
    const conditions = [eq(userBotData.projectId, projectId)];

    if (tokenId !== null && tokenId !== undefined) {
      conditions.push(eq(userBotData.tokenId, tokenId));
    }

    const users = await this.db.select().from(userBotData).where(and(...conditions));

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
  async createBotGroup(insertGroup: StorageBotGroupInput): Promise<BotGroup> {
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
  async updateBotGroup(id: number, updateData: StorageBotGroupUpdate): Promise<BotGroup | undefined> {
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
  async createGroupMember(insertMember: StorageGroupMemberInput): Promise<GroupMember> {
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
  async updateGroupMember(id: number, updateData: StorageGroupMemberUpdate): Promise<GroupMember | undefined> {
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
  async createBotMessage(insertMessage: StorageBotMessageInput): Promise<BotMessage> {
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
  async getBotMessages(
    projectId: number,
    userId: string,
    limit: number = 100,
    tokenId?: number | null
  ): Promise<BotMessage[]> {
    const conditions = [
      eq(botMessages.projectId, projectId),
      eq(botMessages.userId, userId),
    ];

    if (tokenId !== null && tokenId !== undefined) {
      conditions.push(eq(botMessages.tokenId, tokenId));
    }

    return await this.db
      .select()
      .from(botMessages)
      .where(and(...conditions))
      .orderBy(asc(botMessages.createdAt))
      .limit(limit);
  }

  /**
   * Удалить сообщения бота по проекту и пользователю из базы данных
   * @param projectId - ID проекта
   * @param userId - ID пользователя
   * @returns true, если сообщения были удалены, иначе false
   */
  async deleteBotMessages(projectId: number, userId: string, tokenId?: number | null): Promise<boolean> {
    const conditions = [
      eq(botMessages.projectId, projectId),
      eq(botMessages.userId, userId),
    ];

    if (tokenId !== null && tokenId !== undefined) {
      conditions.push(eq(botMessages.tokenId, tokenId));
    }

    const result = await this.db
      .delete(botMessages)
      .where(and(...conditions));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Удалить все сообщения бота по проекту из базы данных
   * @param projectId - ID проекта
   * @returns true, если сообщения были удалены, иначе false
   */
  async deleteAllBotMessages(projectId: number, tokenId?: number | null): Promise<boolean> {
    const conditions = [eq(botMessages.projectId, projectId)];

    if (tokenId !== null && tokenId !== undefined) {
      conditions.push(eq(botMessages.tokenId, tokenId));
    }

    const result = await this.db
      .delete(botMessages)
      .where(and(...conditions));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Bot message media
  /**
   * Создать запись о медиафайле в сообщении бота в базе данных
   * @param data - Данные для создания записи
   * @returns Созданная запись о медиафайле
   */
  async createBotMessageMedia(data: StorageBotMessageMediaInput): Promise<BotMessageMedia> {
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
   * @param order - Порядок сортировки: 'asc' или 'desc' (по умолчанию 'asc')
   * @param messageType - Тип сообщения: 'user' или 'bot' (опционально)
   * @returns Массив сообщений бота с медиафайлами
   */
  async getBotMessagesWithMedia(
    projectId: number,
    userId: string,
    limit: number = 100,
    order: 'asc' | 'desc' = 'asc',
    messageType?: 'user' | 'bot',
    tokenId?: number | null
  ): Promise<(BotMessage & { media?: Array<MediaFile & { mediaKind: string; orderIndex: number; }> | undefined; })[]> {
    const whereConditions = [
      eq(botMessages.projectId, projectId),
      eq(botMessages.userId, userId),
    ];

    if (tokenId !== null && tokenId !== undefined) {
      whereConditions.push(eq(botMessages.tokenId, tokenId));
    }
    
    if (messageType) {
      whereConditions.push(eq(botMessages.messageType, messageType));
    }
    
    const messages = await this.db
      .select()
      .from(botMessages)
      .where(and(...whereConditions))
      .orderBy(order === 'desc' ? desc(botMessages.createdAt) : asc(botMessages.createdAt))
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
    return [];
  }

  /**
   * Сохранить батч записей логов бота в базу данных
   * @param logs - Массив записей для вставки
   * @returns Promise<void>
   */
  async saveBotLogs(logs: StorageBotLogInput[]): Promise<void> {
    if (logs.length === 0) return;
    await this.db.insert(botLogs).values(logs);
  }

  /**
   * Получить последние N строк логов бота из базы данных
   * @param projectId - Идентификатор проекта
   * @param tokenId - Идентификатор токена
   * @param limit - Максимальное количество строк (по умолчанию 500)
   * @returns Массив записей логов, отсортированных по времени ASC
   */
  async getBotLogs(projectId: number, tokenId: number, limit = 500): Promise<BotLog[]> {
    const rows = await this.db
      .select()
      .from(botLogs)
      .where(and(eq(botLogs.projectId, projectId), eq(botLogs.tokenId, tokenId)))
      .orderBy(desc(botLogs.timestamp))
      .limit(limit);
    return rows.reverse();
  }

  /** Максимальное количество записей истории запусков на один токен */
  private static readonly LAUNCH_HISTORY_LIMIT = 20;

  /**
   * Создать запись о запуске бота.
   * После вставки удаляет старые записи, если их больше лимита для данного токена.
   * @param data - Данные для создания записи
   * @returns Созданная запись истории запуска
   */
  async createLaunchHistory(data: StorageBotLaunchHistoryInput): Promise<BotLaunchHistory> {
    const [record] = await this.db.insert(botLaunchHistory).values(data).returning();

    // Удаляем старые записи, оставляя только 20 самых новых по startedAt
    await this.db.delete(botLaunchHistory).where(
      and(
        eq(botLaunchHistory.tokenId, data.tokenId),
        notInArray(
          botLaunchHistory.id,
          this.db
            .select({ id: botLaunchHistory.id })
            .from(botLaunchHistory)
            .where(eq(botLaunchHistory.tokenId, data.tokenId))
            .orderBy(desc(botLaunchHistory.startedAt))
            .limit(DatabaseStorage.LAUNCH_HISTORY_LIMIT)
        )
      )
    );

    return record;
  }

  /**
   * Обновить запись истории запуска (при остановке или ошибке)
   * @param id - ID записи
   * @param data - Данные для обновления
   * @returns Promise<void>
   */
  async updateLaunchHistory(id: number, data: StorageBotLaunchHistoryUpdate): Promise<void> {
    await this.db.update(botLaunchHistory).set(data).where(eq(botLaunchHistory.id, id));
  }

  /**
   * Получить последние N запусков для токена
   * @param tokenId - ID токена
   * @param limit - Максимальное количество записей (по умолчанию 10)
   * @returns Массив записей истории запусков
   */
  async getLaunchHistory(tokenId: number, limit = 10): Promise<BotLaunchHistory[]> {
    return await this.db
      .select()
      .from(botLaunchHistory)
      .where(eq(botLaunchHistory.tokenId, tokenId))
      .orderBy(desc(botLaunchHistory.startedAt))
      .limit(limit);
  }

  /**
   * Получить логи конкретного запуска бота
   * @param launchId - ID записи в bot_launch_history
   * @returns Массив записей логов
   */
  async getBotLogsByLaunch(launchId: number): Promise<BotLog[]> {
    return await this.db
      .select()
      .from(botLogs)
      .where(eq(botLogs.launchId, launchId))
      .orderBy(asc(botLogs.timestamp));
  }

  /**
   * Получить активную (со статусом 'running') запись истории запуска для токена
   * @param tokenId - ID токена
   * @returns Последняя запись со статусом 'running' или undefined, если не найдена
   */
  async getActiveLaunchHistory(tokenId: number): Promise<BotLaunchHistory | undefined> {
    const [record] = await this.db
      .select()
      .from(botLaunchHistory)
      .where(and(eq(botLaunchHistory.tokenId, tokenId), eq(botLaunchHistory.status, 'running')))
      .orderBy(desc(botLaunchHistory.startedAt))
      .limit(1);
    return record || undefined;
  }

  /**
   * Получить статистику пользователей по токену
   * @param tokenId - ID токена
   * @returns Объект со статистикой: total_users, active_24h, active_7d, new_today
   */
  async getTokenUserStats(tokenId: number): Promise<{
    total_users: number;
    active_24h: number;
    active_7d: number;
    new_today: number;
  }> {
    // Получаем projectId по tokenId
    const token = await this.getBotToken(tokenId);
    if (!token) {
      return {
        total_users: 0,
        active_24h: 0,
        active_7d: 0,
        new_today: 0,
      };
    }

    const conditions = [
      eq(botUsers.projectId, token.projectId),
      eq(botUsers.tokenId, tokenId),
    ];

    const users = await this.db.select().from(botUsers).where(and(...conditions));

    const now = new Date();
    const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const total_users = users.length;
    const active_24h = users.filter(u => 
      u.lastInteraction && new Date(u.lastInteraction) > dayAgo
    ).length;
    const active_7d = users.filter(u => 
      u.lastInteraction && new Date(u.lastInteraction) > weekAgo
    ).length;
    const new_today = users.filter(u => 
      u.lastInteraction && new Date(u.lastInteraction) >= todayStart
    ).length;

    return {
      total_users,
      active_24h,
      active_7d,
      new_today,
    };
  }

  // Коллабораторы проекта

  /**
   * Проверяет, имеет ли пользователь доступ к проекту (владелец или коллаборатор)
   * @param projectId - ID проекта
   * @param userId - ID пользователя Telegram
   * @returns true, если пользователь является владельцем или коллаборатором
   */
  async hasProjectAccess(projectId: number, userId: number): Promise<boolean> {
    const project = await this.getBotProject(projectId);
    if (!project) return false;
    // Явное приведение к числу — bigint из PostgreSQL может вернуться строкой
    if (Number(project.ownerId) === Number(userId)) return true;

    const [collab] = await this.db
      .select()
      .from(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId)
        )
      );
    return !!collab;
  }

  /**
   * Добавляет коллаборатора к проекту (игнорирует дубликаты)
   * @param projectId - ID проекта
   * @param userId - ID пользователя Telegram
   * @param invitedBy - ID пригласившего пользователя (опционально)
   */
  async addCollaborator(projectId: number, userId: number, invitedBy?: number): Promise<void> {
    await this.db
      .insert(projectCollaborators)
      .values({ projectId, userId, invitedBy: invitedBy ?? null })
      .onConflictDoNothing();
  }

  /**
   * Удаляет коллаборатора из проекта
   * @param projectId - ID проекта
   * @param userId - ID пользователя Telegram
   * @returns true, если запись была удалена
   */
  async removeCollaborator(projectId: number, userId: number): Promise<boolean> {
    const result = await this.db
      .delete(projectCollaborators)
      .where(
        and(
          eq(projectCollaborators.projectId, projectId),
          eq(projectCollaborators.userId, userId)
        )
      );
    return result.rowCount ? result.rowCount > 0 : false;
  }

  /**
   * Возвращает список коллабораторов проекта
   * @param projectId - ID проекта
   * @returns Массив записей коллабораторов, отсортированных по дате добавления
   */
  async getCollaborators(projectId: number): Promise<ProjectCollaborator[]> {
    return await this.db
      .select()
      .from(projectCollaborators)
      .where(eq(projectCollaborators.projectId, projectId))
      .orderBy(projectCollaborators.createdAt);
  }
}
